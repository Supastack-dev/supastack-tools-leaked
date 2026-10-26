/**
 * Pure pricing-table math for the SaaS pricing generator. Standard library
 * only — no DOM, no React — so the module stays portable and unit-testable.
 *
 * Two shapes flow through the tool:
 * - `TierDraft` — raw editor state; prices stay strings so half-typed input
 *   ("9.") never snaps back mid-edit, and `annualPrice: ""` means "auto".
 * - `PricingTier`/`PricingConfig` — the normalized, numeric output that
 *   `serializeConfig` exports as JSON.
 *
 * Draft state also round-trips through `encodeDraftState`/`decodeDraftState`
 * so a configured table can be shared as a `#c=<base64url>` URL hash.
 */

export const MAX_TIERS = 4;
export const MAX_FEATURES = 12;
export const TIER_NAME_MAX = 40;
export const TIER_TAGLINE_MAX = 60;
export const TIER_CTA_MAX = 30;
export const HEADING_MAX = 80;
export const SUBHEADING_MAX = 120;
export const FEATURE_TEXT_MAX = 80;
export const PRICE_MAX = 1_000_000;
/** Two months free — the industry-standard annual default. */
export const ANNUAL_BILLING_MONTHS = 10;

export const PRICING_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CAD",
  "AUD",
  "CHF",
  "SEK",
  "INR",
  "BRL",
] as const;
export type PricingCurrency = (typeof PRICING_CURRENCIES)[number];

export const CURRENCY_OPTIONS: readonly { value: PricingCurrency; label: string }[] = [
  { value: "USD", label: "$ — US dollar" },
  { value: "EUR", label: "€ — Euro" },
  { value: "GBP", label: "£ — British pound" },
  { value: "JPY", label: "¥ — Japanese yen" },
  { value: "CAD", label: "$ — Canadian dollar" },
  { value: "AUD", label: "$ — Australian dollar" },
  { value: "CHF", label: "CHF — Swiss franc" },
  { value: "SEK", label: "kr — Swedish krona" },
  { value: "INR", label: "₹ — Indian rupee" },
  { value: "BRL", label: "R$ — Brazilian real" },
];

/** What the per-month price is measured in on the rendered card. */
export const PRICE_SUFFIXES = ["/mo", "/seat/mo", "/user/mo", "/project/mo"] as const;
export type PriceSuffix = (typeof PRICE_SUFFIXES)[number];

export const PRICE_SUFFIX_OPTIONS: readonly { value: PriceSuffix; label: string }[] = [
  { value: "/mo", label: "per month" },
  { value: "/seat/mo", label: "per seat / month" },
  { value: "/user/mo", label: "per user / month" },
  { value: "/project/mo", label: "per project / month" },
];

export const DEFAULT_CTA_LABEL = "Get started";

/** One rendered feature row — `included: false` comes from a "- " prefix. */
export type ParsedFeature = {
  text: string;
  included: boolean;
};

export type PricingTier = {
  id: string;
  name: string;
  tagline: string;
  /** Price per month on monthly billing. */
  monthlyPrice: number;
  /** Total charged once per year on annual billing. */
  annualPrice: number;
  features: ParsedFeature[];
  cta: string;
  featured: boolean;
};

export type PricingConfig = {
  currency: PricingCurrency;
  /** Whether the generated table offers annual billing at all. */
  showAnnual: boolean;
  priceSuffix: PriceSuffix;
  heading: string;
  subheading: string;
  tiers: PricingTier[];
};

export type TierDraft = {
  id: string;
  name: string;
  tagline: string;
  /** Raw monthly-price input. */
  monthlyPrice: string;
  /** Raw annual-price input; empty means "auto = monthly × 10". */
  annualPrice: string;
  /** One feature per line; "- " marks an item as not included. */
  featuresText: string;
  /** Optional custom CTA label; empty renders the default. */
  cta: string;
  featured: boolean;
};

export type PricingDraftState = {
  currency: PricingCurrency;
  showAnnual: boolean;
  priceSuffix: PriceSuffix;
  heading: string;
  subheading: string;
  tiers: TierDraft[];
};

let tierSequence = 0;

export function createTier(overrides: Readonly<Partial<TierDraft>> = {}): TierDraft {
  return {
    id: overrides.id ?? `tier-${++tierSequence}`,
    name: overrides.name ?? "",
    tagline: overrides.tagline ?? "",
    monthlyPrice: overrides.monthlyPrice ?? "",
    annualPrice: overrides.annualPrice ?? "",
    featuresText: overrides.featuresText ?? "",
    cta: overrides.cta ?? "",
    featured: overrides.featured ?? false,
  };
}

/** A believable starting table so the preview is useful on first paint. */
export function createDefaultPricingState(): PricingDraftState {
  return {
    currency: "USD",
    showAnnual: true,
    priceSuffix: "/mo",
    heading: "Pricing",
    subheading: "Simple pricing that scales with you.",
    tiers: [
      createTier({
        id: "starter",
        name: "Starter",
        tagline: "For trying things out",
        monthlyPrice: "12",
        featuresText: "1 project\nCommunity support\nCore analytics\n- Custom domain\n- SSO",
      }),
      createTier({
        id: "growth",
        name: "Growth",
        tagline: "For teams shipping fast",
        monthlyPrice: "29",
        featured: true,
        featuresText: "Unlimited projects\nPriority support\nAdvanced analytics\nCustom domain",
      }),
      createTier({
        id: "scale",
        name: "Scale",
        tagline: "For companies with needs",
        monthlyPrice: "79",
        cta: "Talk to sales",
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
  const cleaned = raw.replace(/[\s$€£¥₹_]/g, "").replace(/,/g, "");
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

/** Decimal places a currency carries (JPY: 0, USD: 2); falls back to 2. */
function currencyFractionDigits(currency: PricingCurrency): number {
  try {
    return (
      new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions()
        .maximumFractionDigits ?? 2
    );
  } catch {
    return 2;
  }
}

export function formatPrice(amount: number, currency: PricingCurrency): string {
  const digits = currencyFractionDigits(currency);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(amount);
}

/**
 * One feature per line. A leading "- " marks the line as NOT included —
 * the classic pricing-table pattern where a tier visibly lacks a feature
 * instead of silently omitting it.
 */
export function parseFeatures(text: string): ParsedFeature[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, MAX_FEATURES)
    .map((line) =>
      line.startsWith("-")
        ? { text: line.slice(1).trim().slice(0, FEATURE_TEXT_MAX), included: false }
        : { text: line.slice(0, FEATURE_TEXT_MAX), included: true },
    )
    .filter((feature) => feature.text.length > 0);
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

/** Swap a tier one slot earlier/later; no-op at the edges. */
export function moveTier(
  tiers: readonly TierDraft[],
  id: string,
  direction: -1 | 1,
): TierDraft[] {
  const index = tiers.findIndex((tier) => tier.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= tiers.length) return [...tiers];
  const next = [...tiers];
  const [tier] = next.splice(index, 1);
  next.splice(target, 0, tier!);
  return next;
}

/** Clone a draft with a fresh id and an "(copy)" name suffix. */
export function duplicateTier(tier: TierDraft): TierDraft {
  const base = tier.name.trim() || "Tier";
  const name = `${base} copy`.slice(0, TIER_NAME_MAX);
  return createTier({ ...tier, name, id: undefined, featured: false });
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
      tagline: draft.tagline.trim().slice(0, TIER_TAGLINE_MAX),
      monthlyPrice,
      annualPrice: roundPrice(resolvedAnnual),
      features: parseFeatures(draft.featuresText),
      cta: draft.cta.trim().slice(0, TIER_CTA_MAX),
      featured,
    } satisfies PricingTier;
  });
  return {
    currency: state.currency,
    showAnnual: state.showAnnual,
    priceSuffix: state.priceSuffix,
    heading: state.heading.trim().slice(0, HEADING_MAX),
    subheading: state.subheading.trim().slice(0, SUBHEADING_MAX),
    tiers,
  };
}

/**
 * The export payload: the contract fields plus per-tier derived values
 * (monthly-equivalent and savings percent) so consumers can render
 * "Save 17%" without redoing the math. `version: 2` — features carry their
 * included flag and the config carries page copy and the price suffix.
 */
export function serializeConfig(config: PricingConfig): string {
  const tiers = config.tiers.map((tier) => ({
    id: tier.id,
    name: tier.name,
    tagline: tier.tagline,
    monthlyPrice: tier.monthlyPrice,
    annualPrice: tier.annualPrice,
    annualMonthlyEquivalent: annualMonthlyEquivalent(tier),
    annualSavingsPercent: annualDiscountPercent(tier),
    featured: tier.featured,
    cta: tier.cta || DEFAULT_CTA_LABEL,
    features: tier.features,
  }));
  return JSON.stringify(
    {
      version: 2,
      currency: config.currency,
      showAnnual: config.showAnnual,
      priceSuffix: config.priceSuffix,
      heading: config.heading,
      subheading: config.subheading,
      tiers,
    },
    null,
    2,
  );
}

/** Escape a cell for GitHub-flavoured markdown (pipes break tables). */
function mdCell(text: string): string {
  return text.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

/**
 * The comparison-table export: tiers as columns, prices up top, then the
 * union of every feature with ✓/— per tier. Paste straight into a README,
 * docs page, or issue.
 */
export function serializeMarkdownTable(config: PricingConfig): string {
  const { tiers } = config;
  const featuredIndex = tiers.findIndex((tier) => tier.featured);
  const header = `|  | ${tiers
    .map((tier, i) => mdCell(tier.name || "Untitled") + (i === featuredIndex ? " ⭐" : ""))
    .join(" | ")} |`;
  const divider = `| ${["---", ...tiers.map(() => "---")].join(" | ")} |`;

  const money = (amount: number, suffix: string) =>
    amount === 0 ? "Free" : `${formatPrice(amount, config.currency)}${suffix}`;

  const monthly = `| **Monthly** | ${tiers
    .map((tier) => money(tier.monthlyPrice, config.priceSuffix))
    .join(" | ")} |`;

  const rows = [header, divider, monthly];
  if (config.showAnnual) {
    rows.push(
      `| **Annual** | ${tiers
        .map((tier) => {
          if (tier.monthlyPrice === 0) return "Free";
          const eq = annualMonthlyEquivalent(tier);
          const pct = annualDiscountPercent(tier);
          const save = pct !== null && pct > 0 ? ` · save ${pct}%` : "";
          return `${money(eq, config.priceSuffix)} — ${formatPrice(tier.annualPrice, config.currency)}/yr${save}`;
        })
        .join(" | ")} |`,
    );
  }

  // Feature union in first-seen order; a tier shows ✓ only when it carries
  // the feature AND the line isn't marked excluded.
  const allFeatures: string[] = [];
  for (const tier of tiers) {
    for (const feature of tier.features) {
      if (!allFeatures.includes(feature.text)) allFeatures.push(feature.text);
    }
  }
  for (const text of allFeatures) {
    const cells = tiers.map((tier) => {
      const match = tier.features.find((feature) => feature.text === text);
      return match?.included ? "✓" : "—";
    });
    rows.push(`| ${mdCell(text)} | ${cells.join(" | ")} |`);
  }

  return rows.join("\n");
}

/* ---------- shareable draft state (`#c=` URL hash) ---------- */

const SHARE_PREFIX = "c=";

function base64UrlEncode(text: string): string {
  // encodeURIComponent dance keeps non-ASCII (e.g. € in copy) round-tripping.
  return btoa(unescape(encodeURIComponent(text)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(encoded: string): string {
  const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return decodeURIComponent(escape(atob(padded)));
}

/** Draft → URL-hash payload (`c=<base64url>`). */
export function encodeDraftState(state: PricingDraftState): string {
  return SHARE_PREFIX + base64UrlEncode(JSON.stringify(state));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeTier(value: unknown): TierDraft | null {
  if (!isRecord(value)) return null;
  const stringField = (key: string, max: number): string =>
    typeof value[key] === "string" ? (value[key] as string).slice(0, max) : "";
  // Payload ids are never trusted — every decoded tier gets a fresh id so a
  // shared draft can't collide with the local sequence counter.
  return createTier({
    name: stringField("name", TIER_NAME_MAX + 8),
    tagline: stringField("tagline", TIER_TAGLINE_MAX + 8),
    monthlyPrice: stringField("monthlyPrice", 24),
    annualPrice: stringField("annualPrice", 24),
    featuresText: stringField("featuresText", MAX_FEATURES * (FEATURE_TEXT_MAX + 2)),
    cta: stringField("cta", TIER_CTA_MAX + 8),
    featured: value.featured === true,
  });
}

/**
 * URL-hash payload → draft state. Accepts `c=…`, `#c=…`, or a bare payload;
 * every field is sanitized so a hand-edited hash degrades to defaults
 * instead of corrupting the editor. Returns null when the payload is not
 * ours or carries no usable tiers.
 */
export function decodeDraftState(raw: string): PricingDraftState | null {
  let payload = raw.startsWith("#") ? raw.slice(1) : raw;
  if (payload.startsWith(SHARE_PREFIX)) payload = payload.slice(SHARE_PREFIX.length);
  if (!payload || payload.includes(" ")) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(base64UrlDecode(payload));
  } catch {
    return null;
  }
  if (!isRecord(parsed) || !Array.isArray(parsed.tiers)) return null;
  const tiers = parsed.tiers
    .slice(0, MAX_TIERS)
    .map((tier) => sanitizeTier(tier))
    .filter((tier): tier is TierDraft => tier !== null);
  if (tiers.length === 0) return null;
  return {
    currency: (PRICING_CURRENCIES as readonly string[]).includes(parsed.currency as string)
      ? (parsed.currency as PricingCurrency)
      : "USD",
    showAnnual: parsed.showAnnual !== false,
    priceSuffix: (PRICE_SUFFIXES as readonly string[]).includes(parsed.priceSuffix as string)
      ? (parsed.priceSuffix as PriceSuffix)
      : "/mo",
    heading: typeof parsed.heading === "string" ? parsed.heading.slice(0, HEADING_MAX) : "",
    subheading:
      typeof parsed.subheading === "string" ? parsed.subheading.slice(0, SUBHEADING_MAX) : "",
    tiers,
  };
}
