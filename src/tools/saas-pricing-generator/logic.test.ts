import { describe, expect, it } from "vitest";

import {
  MAX_FEATURES,
  MAX_TIERS,
  TIER_NAME_MAX,
  annualDiscountPercent,
  annualMonthlyEquivalent,
  buildPricingConfig,
  canAddTier,
  canRemoveTier,
  createDefaultPricingState,
  createTier,
  formatPrice,
  monthlyPriceIssue,
  annualPriceIssue,
  parseFeatures,
  parsePrice,
  serializeConfig,
  setFeaturedTier,
  suggestedAnnualPrice,
  tierNameIssue,
  type PricingDraftState,
} from "./logic";

describe("createTier", () => {
  it("returns an empty draft with a unique id", () => {
    const a = createTier();
    const b = createTier();
    expect(a.id).not.toBe(b.id);
    expect(a).toMatchObject({
      name: "",
      monthlyPrice: "",
      annualPrice: "",
      featuresText: "",
      featured: false,
    });
  });

  it("honours overrides", () => {
    const tier = createTier({ id: "pro", name: "Pro", monthlyPrice: "29", featured: true });
    expect(tier.id).toBe("pro");
    expect(tier.featured).toBe(true);
  });
});

describe("parsePrice", () => {
  it.each([
    ["12", 12],
    ["12.99", 12.99],
    ["$29", 29],
    ["€1,299.50", 1299.5],
    [" 45 ", 45],
    ["0", 0],
  ])("parses %s to %i", (raw, expected) => {
    expect(parsePrice(raw)).toBe(expected);
  });

  it.each([[""], ["abc"], ["1.2.3"], ["-5"], ["1000001"], ["NaN"], [".."]])(
    "rejects %s",
    (raw) => {
      expect(parsePrice(raw)).toBeNull();
    },
  );
});

describe("price math", () => {
  it("suggests annual as ten months of monthly", () => {
    expect(suggestedAnnualPrice(29)).toBe(290);
    expect(suggestedAnnualPrice(9.99)).toBe(99.9);
  });

  it("computes the annual discount percentage against 12 monthly payments", () => {
    expect(annualDiscountPercent({ monthlyPrice: 29, annualPrice: 290 })).toBe(17);
    expect(annualDiscountPercent({ monthlyPrice: 10, annualPrice: 100 })).toBe(17);
    expect(annualDiscountPercent({ monthlyPrice: 10, annualPrice: 150 })).toBe(-25);
  });

  it("returns null when the monthly price is not positive", () => {
    expect(annualDiscountPercent({ monthlyPrice: 0, annualPrice: 0 })).toBeNull();
  });

  it("rounds the monthly equivalent of an annual price", () => {
    expect(annualMonthlyEquivalent({ annualPrice: 290 })).toBe(24.17);
  });

  it("formats prices per currency rules", () => {
    expect(formatPrice(29, "USD")).toBe("$29");
    expect(formatPrice(24.17, "USD")).toBe("$24.17");
    expect(formatPrice(29, "EUR")).toContain("29");
    expect(formatPrice(290, "JPY")).not.toContain(".");
  });
});

describe("parseFeatures", () => {
  it("splits lines, trims and drops empties", () => {
    expect(parseFeatures(" 10 projects \n\nPriority support\n  ")).toEqual([
      "10 projects",
      "Priority support",
    ]);
  });

  it("caps the feature count and per-feature length", () => {
    const many = Array.from({ length: MAX_FEATURES + 4 }, (_, i) => `feat ${i}`).join("\n");
    expect(parseFeatures(many)).toHaveLength(MAX_FEATURES);
    const long = "x".repeat(200);
    expect(parseFeatures(long)[0]).toHaveLength(80);
  });
});

describe("validation helpers", () => {
  it("flags empty and over-long names", () => {
    expect(tierNameIssue("")).toBe("required");
    expect(tierNameIssue("   ")).toBe("required");
    expect(tierNameIssue("x".repeat(TIER_NAME_MAX + 1))).toBe("too-long");
    expect(tierNameIssue("Growth")).toBeNull();
  });

  it("validates monthly and annual price drafts", () => {
    expect(monthlyPriceIssue("")).toBe("required");
    expect(monthlyPriceIssue("abc")).toBe("invalid");
    expect(monthlyPriceIssue("12")).toBeNull();
    expect(annualPriceIssue("")).toBeNull(); // empty = auto
    expect(annualPriceIssue("-3")).toBe("invalid");
    expect(annualPriceIssue("290")).toBeNull();
  });
});

describe("setFeaturedTier", () => {
  it("features exactly one tier", () => {
    const tiers = [
      createTier({ id: "a", featured: true }),
      createTier({ id: "b" }),
      createTier({ id: "c" }),
    ];
    const next = setFeaturedTier(tiers, "c", true);
    expect(next.map((t) => t.featured)).toEqual([false, false, true]);
  });

  it("allows un-featuring all tiers", () => {
    const tiers = [createTier({ id: "a", featured: true }), createTier({ id: "b" })];
    expect(setFeaturedTier(tiers, "a", false).every((t) => !t.featured)).toBe(true);
  });
});

describe("tier bounds", () => {
  it("caps the tier list", () => {
    const tiers = Array.from({ length: MAX_TIERS }, () => createTier());
    expect(canAddTier(tiers)).toBe(false);
    expect(canAddTier(tiers.slice(0, 2))).toBe(true);
    expect(canRemoveTier([createTier()])).toBe(false);
    expect(canRemoveTier(tiers)).toBe(true);
  });
});

describe("buildPricingConfig", () => {
  it("normalizes drafts into a priced config", () => {
    const state: PricingDraftState = {
      currency: "EUR",
      showAnnual: true,
      tiers: [
        createTier({
          id: "starter",
          name: "  Starter ",
          monthlyPrice: "12",
          featuresText: "5 projects\n\nCommunity support",
        }),
        createTier({
          id: "growth",
          name: "Growth",
          monthlyPrice: "29",
          annualPrice: "240",
          featured: true,
        }),
      ],
    };
    const config = buildPricingConfig(state);
    expect(config.currency).toBe("EUR");
    expect(config.tiers).toHaveLength(2);
    expect(config.tiers[0]).toMatchObject({
      id: "starter",
      name: "Starter",
      monthlyPrice: 12,
      annualPrice: 120, // auto: monthly × 10
      featured: false,
      features: ["5 projects", "Community support"],
    });
    expect(config.tiers[1]!.annualPrice).toBe(240);
    expect(config.tiers[1]!.featured).toBe(true);
  });

  it("falls back to 0 for an unparseable monthly price", () => {
    const config = buildPricingConfig({
      currency: "USD",
      showAnnual: true,
      tiers: [createTier({ monthlyPrice: "free!" })],
    });
    expect(config.tiers[0]!.monthlyPrice).toBe(0);
  });

  it("keeps only the first featured flag when several are set", () => {
    const config = buildPricingConfig({
      currency: "USD",
      showAnnual: true,
      tiers: [
        createTier({ id: "a", featured: true }),
        createTier({ id: "b", featured: true }),
      ],
    });
    expect(config.tiers.map((t) => t.featured)).toEqual([true, false]);
  });
});

describe("serializeConfig", () => {
  it("emits pretty JSON with derived annual fields", () => {
    const config = buildPricingConfig(createDefaultPricingState());
    const json = serializeConfig(config);
    const parsed = JSON.parse(json) as {
      version: number;
      currency: string;
      showAnnual: boolean;
      tiers: {
        name: string;
        monthlyPrice: number;
        annualPrice: number;
        annualMonthlyEquivalent: number;
        annualSavingsPercent: number | null;
        featured: boolean;
        features: string[];
      }[];
    };
    expect(json).toContain("\n  "); // pretty-printed
    expect(parsed.version).toBe(1);
    expect(parsed.currency).toBe("USD");
    expect(parsed.tiers.length).toBeGreaterThanOrEqual(2);
    const featured = parsed.tiers.find((t) => t.featured)!;
    expect(featured.annualMonthlyEquivalent).toBeCloseTo(featured.annualPrice / 12, 2);
    expect(featured.annualSavingsPercent).toBe(
      annualDiscountPercent({
        monthlyPrice: featured.monthlyPrice,
        annualPrice: featured.annualPrice,
      }),
    );
  });

  it("omits derived savings when monthly is free", () => {
    const config = buildPricingConfig({
      currency: "USD",
      showAnnual: true,
      tiers: [createTier({ name: "Free", monthlyPrice: "0", annualPrice: "0" })],
    });
    const parsed = JSON.parse(serializeConfig(config)) as {
      tiers: { annualSavingsPercent: number | null }[];
    };
    expect(parsed.tiers[0]!.annualSavingsPercent).toBeNull();
  });
});

describe("createDefaultPricingState", () => {
  it("seeds a realistic three-tier table with one featured tier", () => {
    const state = createDefaultPricingState();
    expect(state.tiers).toHaveLength(3);
    expect(state.tiers.filter((t) => t.featured)).toHaveLength(1);
    expect(new Set(state.tiers.map((t) => t.id)).size).toBe(3);
    expect(state.tiers.every((t) => parsePrice(t.monthlyPrice) !== null)).toBe(true);
  });
});
