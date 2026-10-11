/**
 * Pure pricing-table math for the SaaS pricing generator. Standard library
 * only — no DOM, no React — so the module stays portable and unit-testable.
 *
 * Two shapes flow through the tool:
 * - `TierDraft` — raw editor state; prices stay strings so half-typed input
 *   ("9.") never snaps back mid-edit, and `annualPrice: ""` means "auto".
 * - `PricingTier`/`PricingConfig` — the normalized, numeric output that
 *   `serializeConfig` exports as JSON.
 */

export const MAX_TIERS = 4;
export const MAX_FEATURES = 12;
export const TIER_NAME_MAX = 40;
export const FEATURE_TEXT_MAX = 80;
export const PRICE_MAX = 1_000_000;
/** Two months free — the industry-standard annual default. */
export const ANNUAL_BILLING_MONTHS = 10;

export const PRICING_CURRENCIES = ["USD", "EUR", "GBP", "JPY"] as const;
export type PricingCurrency = (typeof PRICING_CURRENCIES)[number];

export const CURRENCY_OPTIONS: readonly { value: PricingCurrency; label: string }[] = [
  { value: "USD", label: "$ — US dollar" },
  { value: "EUR", label: "€ — Euro" },
  { value: "GBP", label: "£ — British pound" },
  { value: "JPY", label: "¥ — Japanese yen" },
];

export type PricingTier = {
  id: string;
  name: string;
  /** Price per month on monthly billing. */
  monthlyPrice: number;
  /** Total charged once per year on annual billing. */
  annualPrice: number;
  features: string[];
  featured: boolean;
};

export type PricingConfig = {
  currency: PricingCurrency;
  /** Whether the generated table offers annual billing at all. */
  showAnnual: boolean;
  tiers: PricingTier[];
};

export type TierDraft = {
  id: string;
  name: string;
  /** Raw monthly-price input. */
  monthlyPrice: string;
  /** Raw annual-price input; empty means "auto = monthly × 10". */
  annualPrice: string;
  /** One feature per line. */
  featuresText: string;
  featured: boolean;
};

export type PricingDraftState = {
  currency: PricingCurrency;
  showAnnual: boolean;
  tiers: TierDraft[];
};

let tierSequence = 0;

export function createTier(overrides: Readonly<Partial<TierDraft>> = {}): TierDraft {
  return {
    id: overrides.id ?? `tier-${++tierSequence}`,
    name: overrides.name ?? "",
    monthlyPrice: overrides.monthlyPrice ?? "",
    annualPrice: overrides.annualPrice ?? "",
    featuresText: overrides.featuresText ?? "",
    featured: overrides.featured ?? false,
  };
}

/** A believable starting table so the preview is useful on first paint. */
export function createDefaultPricingState(): PricingDraftState {
  return {
    currency: "USD",
    showAnnual: true,
    tiers: [
      createTier({
        id: "starter",
        name: "Starter",
        monthlyPrice: "12",
        featuresText: "1 project\nCommunity support\nCore analytics",
      }),
      createTier({
        id: "growth",
        name: "Growth",
        monthlyPrice: "29",
        featured: true,
        featuresText: "Unlimited projects\nPriority support\nAdvanced analytics\nCustom domain",
      }),
      createTier({
        id: "scale",
        name: "Scale",
        monthlyPrice: "79",
        featuresText:
          "Everything in Growth\nSSO & audit log\n99.9% uptime SLA\nDedicated support",
      }),
    ],
  };
}

/**
 * Lenient price parser: strips currency symbols, spaces, and thousands
 * separators, then bounds the result. Returns null for anything that does
 * not reduce to a finite non-negative number within range.
 */
export function parsePrice(raw: string): number | null {
  const cleaned = raw.replace(/[\s$€£¥_]/g, "").replace(/,/g, "");
  if (!/^\d+(\.\d*)?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value > PRICE_MAX) return null;
  return value;
}

export function roundPrice(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Standard "ten months for twelve" annual suggestion. */
export function suggestedAnnualPrice(monthlyPrice: number): number {
  return roundPrice(monthlyPrice * ANNUAL_BILLING_MONTHS);
}

/** Whole-percent saving of annual billing vs 12 monthly payments. */
export function annualDiscountPercent(
  tier: Readonly<Pick<PricingTier, "monthlyPrice" | "annualPrice">>,
): number | null {
  if (tier.monthlyPrice <= 0 || tier.annualPrice < 0) return null;
  return Math.round((1 - tier.annualPrice / (tier.monthlyPrice * 12)) * 100);
}

/** Effective per-month price when paying annually — what the card displays. */
export function annualMonthlyEquivalent(
  tier: Readonly<Pick<PricingTier, "annualPrice">>,
): number {
  return roundPrice(tier.annualPrice / 12);
}

export function formatPrice(amount: number, currency: PricingCurrency): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    ...(currency === "JPY"
      ? { maximumFractionDigits: 0 }
      : { minimumFractionDigits: 0, maximumFractionDigits: 2 }),
  }).format(amount);
}

export function parseFeatures(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim().slice(0, FEATURE_TEXT_MAX))
    .filter((line) => line.length > 0)
    .slice(0, MAX_FEATURES);
}

export type FieldIssue = "required" | "invalid" | "too-long";

export function tierNameIssue(name: string): FieldIssue | null {
  const trimmed = name.trim();
  if (trimmed.length === 0) return "required";
  if (trimmed.length > TIER_NAME_MAX) return "too-long";
  return null;
}

export function monthlyPriceIssue(raw: string): FieldIssue | null {
  if (raw.trim().length === 0) return "required";
  return parsePrice(raw) === null ? "invalid" : null;
}

/** Annual price is optional — empty resolves to the monthly×10 suggestion. */
export function annualPriceIssue(raw: string): FieldIssue | null {
  if (raw.trim().length === 0) return null;
  return parsePrice(raw) === null ? "invalid" : null;
}

export function canAddTier(tiers: readonly TierDraft[]): boolean {
  return tiers.length < MAX_TIERS;
}

export function canRemoveTier(tiers: readonly TierDraft[]): boolean {
  return tiers.length > 1;
}

/** Radio-style featured flag: turning one on clears the rest. */
export function setFeaturedTier(
  tiers: readonly TierDraft[],
  id: string,
  featured: boolean,
): TierDraft[] {
  return tiers.map((tier) => ({ ...tier, featured: tier.id === id ? featured : false }));
}

/**
 * Drafts → normalized config. Unparseable monthly prices become 0 (a free
 * tier) rather than dropping the card — the field-level issues surfaced by
 * the `*Issue` helpers tell the editor what still needs attention.
 * An EMPTY annual field resolves to the monthly×10 suggestion; an INVALID
 * one resolves to monthly×12 (no discount) so the export never sells a
 * phantom deal the editor is simultaneously flagging.
 */
export function buildPricingConfig(state: PricingDraftState): PricingConfig {
  let featuredSeen = false;
  const tiers = state.tiers.slice(0, MAX_TIERS).map((draft) => {
    const monthlyPrice = roundPrice(parsePrice(draft.monthlyPrice) ?? 0);
    const annualRaw = draft.annualPrice.trim();
    const resolvedAnnual =
      annualRaw.length === 0
        ? suggestedAnnualPrice(monthlyPrice)
        : (parsePrice(annualRaw) ?? roundPrice(monthlyPrice * 12));
    const featured = draft.featured && !featuredSeen;
    if (featured) featuredSeen = true;
    return {
      id: draft.id,
      name: draft.name.trim(),
      monthlyPrice,
      annualPrice: roundPrice(resolvedAnnual),
      features: parseFeatures(draft.featuresText),
      featured,
    } satisfies PricingTier;
  });
  return { currency: state.currency, showAnnual: state.showAnnual, tiers };
}

/**
 * The export payload: the contract fields ({currency, tiers, showAnnual})
 * plus per-tier derived values (monthly-equivalent and savings percent) so
 * consumers can render "Save 17%" without redoing the math.
 */
export function serializeConfig(config: PricingConfig): string {
  const tiers = config.tiers.map((tier) => ({
    id: tier.id,
    name: tier.name,
    monthlyPrice: tier.monthlyPrice,
    annualPrice: tier.annualPrice,
    annualMonthlyEquivalent: annualMonthlyEquivalent(tier),
    annualSavingsPercent: annualDiscountPercent(tier),
    featured: tier.featured,
    features: tier.features,
  }));
  return JSON.stringify(
    {
      version: 1,
      currency: config.currency,
      showAnnual: config.showAnnual,
      tiers,
    },
    null,
    2,
  );
}
