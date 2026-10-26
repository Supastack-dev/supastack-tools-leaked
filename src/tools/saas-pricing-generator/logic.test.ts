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
  decodeDraftState,
  duplicateTier,
  encodeDraftState,
  formatPrice,
  monthlyPriceIssue,
  annualPriceIssue,
  moveTier,
  parseFeatures,
  parsePrice,
  serializeConfig,
  serializeMarkdownTable,
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
      { text: "10 projects", included: true },
      { text: "Priority support", included: true },
    ]);
  });

  it("marks lines starting with - as excluded", () => {
    expect(parseFeatures("Unlimited projects\n- Custom domain\n-SSO")).toEqual([
      { text: "Unlimited projects", included: true },
      { text: "Custom domain", included: false },
      { text: "SSO", included: false },
    ]);
  });

  it("drops lines that are only a dash", () => {
    expect(parseFeatures("Real feature\n-")).toEqual([
      { text: "Real feature", included: true },
    ]);
  });

  it("caps the feature count and per-feature length", () => {
    const many = Array.from({ length: MAX_FEATURES + 4 }, (_, i) => `feat ${i}`).join("\n");
    expect(parseFeatures(many)).toHaveLength(MAX_FEATURES);
    const long = "x".repeat(200);
    expect(parseFeatures(long)[0]!.text).toHaveLength(80);
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
      priceSuffix: "/seat/mo",
      heading: "Plans",
      subheading: "Pick one.",
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
          cta: "Start trial",
          featured: true,
        }),
      ],
    };
    const config = buildPricingConfig(state);
    expect(config.currency).toBe("EUR");
    expect(config.priceSuffix).toBe("/seat/mo");
    expect(config.heading).toBe("Plans");
    expect(config.tiers).toHaveLength(2);
    expect(config.tiers[0]).toMatchObject({
      id: "starter",
      name: "Starter",
      monthlyPrice: 12,
      annualPrice: 120, // auto: monthly × 10
      featured: false,
    });
    expect(config.tiers[0]!.features).toEqual([
      { text: "5 projects", included: true },
      { text: "Community support", included: true },
    ]);
    expect(config.tiers[1]!.annualPrice).toBe(240);
    expect(config.tiers[1]!.featured).toBe(true);
    expect(config.tiers[1]!.cta).toBe("Start trial");
  });

  it("falls back to 0 for an unparseable monthly price", () => {
    const config = buildPricingConfig({
      currency: "USD",
      showAnnual: true,
      priceSuffix: "/mo",
      heading: "",
      subheading: "",
      tiers: [createTier({ monthlyPrice: "free!" })],
    });
    expect(config.tiers[0]!.monthlyPrice).toBe(0);
  });

  it("keeps only the first featured flag when several are set", () => {
    const config = buildPricingConfig({
      currency: "USD",
      showAnnual: true,
      priceSuffix: "/mo",
      heading: "",
      subheading: "",
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
      priceSuffix: string;
      heading: string;
      tiers: {
        name: string;
        tagline: string;
        monthlyPrice: number;
        annualPrice: number;
        annualMonthlyEquivalent: number;
        annualSavingsPercent: number | null;
        featured: boolean;
        cta: string;
        features: { text: string; included: boolean }[];
      }[];
    };
    expect(json).toContain("\n  "); // pretty-printed
    expect(parsed.version).toBe(2);
    expect(parsed.currency).toBe("USD");
    expect(parsed.priceSuffix).toBe("/mo");
    expect(parsed.heading).toBe("Pricing");
    expect(parsed.tiers.length).toBeGreaterThanOrEqual(2);
    const featured = parsed.tiers.find((t) => t.featured)!;
    expect(featured.annualMonthlyEquivalent).toBeCloseTo(featured.annualPrice / 12, 2);
    expect(featured.annualSavingsPercent).toBe(
      annualDiscountPercent({
        monthlyPrice: featured.monthlyPrice,
        annualPrice: featured.annualPrice,
      }),
    );
    // Excluded lines keep their flag; CTAs fall back to the default label.
    const starter = parsed.tiers[0]!;
    expect(starter.features.some((f) => !f.included)).toBe(true);
    expect(starter.cta).toBe("Get started");
    expect(parsed.tiers.find((t) => t.name === "Scale")!.cta).toBe("Talk to sales");
  });

  it("omits derived savings when monthly is free", () => {
    const config = buildPricingConfig({
      currency: "USD",
      showAnnual: true,
      priceSuffix: "/mo",
      heading: "",
      subheading: "",
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

describe("moveTier", () => {
  const tiers = () => [
    createTier({ id: "a" }),
    createTier({ id: "b" }),
    createTier({ id: "c" }),
  ];

  it("swaps a tier one slot in either direction", () => {
    expect(moveTier(tiers(), "b", -1).map((t) => t.id)).toEqual(["b", "a", "c"]);
    expect(moveTier(tiers(), "b", 1).map((t) => t.id)).toEqual(["a", "c", "b"]);
  });

  it("is a no-op at the list edges and for unknown ids", () => {
    expect(moveTier(tiers(), "a", -1).map((t) => t.id)).toEqual(["a", "b", "c"]);
    expect(moveTier(tiers(), "c", 1).map((t) => t.id)).toEqual(["a", "b", "c"]);
    expect(moveTier(tiers(), "zzz", 1).map((t) => t.id)).toEqual(["a", "b", "c"]);
  });
});

describe("duplicateTier", () => {
  it("clones the draft with a fresh id and a copy suffix", () => {
    const source = createTier({ id: "pro", name: "Pro", monthlyPrice: "49", featured: true });
    const clone = duplicateTier(source);
    expect(clone.id).not.toBe("pro");
    expect(clone.name).toBe("Pro copy");
    expect(clone.monthlyPrice).toBe("49");
    expect(clone.featured).toBe(false); // never two featured tiers
  });

  it("keeps the copied name inside the length cap", () => {
    const clone = duplicateTier(createTier({ name: "x".repeat(TIER_NAME_MAX) }));
    expect(clone.name.length).toBeLessThanOrEqual(TIER_NAME_MAX);
  });
});

describe("draft state encode/decode", () => {
  it("round-trips a full draft through the share hash", () => {
    const state = createDefaultPricingState();
    const decoded = decodeDraftState(encodeDraftState(state));
    expect(decoded).not.toBeNull();
    expect(decoded!.currency).toBe(state.currency);
    expect(decoded!.priceSuffix).toBe(state.priceSuffix);
    expect(decoded!.heading).toBe(state.heading);
    // Ids are re-minted on decode — a shared draft must never collide with
    // the recipient's local tier sequence.
    const decodedIds = decoded!.tiers.map((t) => t.id);
    expect(new Set(decodedIds).size).toBe(state.tiers.length);
    expect(decodedIds).not.toContain(state.tiers[0]!.id);
    expect(decoded!.tiers[1]!.featured).toBe(true);
    expect(decoded!.tiers[0]!.featuresText).toBe(state.tiers[0]!.featuresText);
  });

  it("accepts a #-prefixed hash", () => {
    const encoded = `#${encodeDraftState(createDefaultPricingState())}`;
    expect(decodeDraftState(encoded)).not.toBeNull();
  });

  it.each(["", "#", "c=", "#c=!!!", "aGk", "#other=abc", "not a share"])(
    "rejects malformed payload %j",
    (raw) => {
      expect(decodeDraftState(raw)).toBeNull();
    },
  );

  it("sanitizes hostile field values back to defaults", () => {
    const state = createDefaultPricingState();
    const tampered = {
      ...state,
      currency: "FAKE",
      priceSuffix: "/century",
      showAnnual: "yes",
      tiers: state.tiers,
    };
    const decoded = decodeDraftState(encodeDraftState(tampered as never));
    expect(decoded!.currency).toBe("USD");
    expect(decoded!.priceSuffix).toBe("/mo");
    expect(decoded!.showAnnual).toBe(true);
  });

  it("survives unicode in copy fields", () => {
    const state = { ...createDefaultPricingState(), subheading: "Preise für €-Teams" };
    expect(decodeDraftState(encodeDraftState(state))!.subheading).toBe(
      "Preise für €-Teams",
    );
  });
});

describe("serializeMarkdownTable", () => {
  it("renders tiers as columns with the feature union below prices", () => {
    const config = buildPricingConfig(createDefaultPricingState());
    const table = serializeMarkdownTable(config);
    const lines = table.split("\n");
    expect(lines[0]).toBe("|  | Starter | Growth ⭐ | Scale |");
    expect(lines[1]).toMatch(/^\| ---/);
    expect(lines[2]).toContain("| **Monthly** | $12/mo | $29/mo | $79/mo |");
    // The union row is marked per tier — Scale carries SSO, Growth does not.
    expect(table).toContain("| SSO & audit log | — | — | ✓ |");
    // Starter excludes "Custom domain" (dash prefix), Scale lacks it entirely.
    expect(table).toContain("| Custom domain | — | ✓ | — |");
  });

  it("drops the annual row when annual billing is off and keeps Free cells", () => {
    const config = buildPricingConfig({
      currency: "USD",
      showAnnual: false,
      priceSuffix: "/user/mo",
      heading: "",
      subheading: "",
      tiers: [createTier({ name: "Solo", monthlyPrice: "9", featuresText: "A\nB" })],
    });
    const table = serializeMarkdownTable(config);
    expect(table).not.toContain("**Annual**");
    expect(table).toContain("$9/user/mo");
  });
});
