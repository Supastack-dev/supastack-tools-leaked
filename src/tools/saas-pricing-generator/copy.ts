/**
 * All user-facing strings for the SaaS pricing generator. Kept in one const
 * so the tool module stays portable and the page metadata reads from the
 * same source as the rendered copy.
 */
export const pricingToolCopy = {
  metaTitle: "SaaS pricing page generator — build a table that converts",
  metaDescription:
    "Design a SaaS pricing table live: tiers, monthly and annual pricing, a featured plan, feature lists — then copy the config JSON. Free, in your browser.",

  eyebrow: "Free tool",
  h1: "Free SaaS pricing page generator",
  lead: "Design the pricing table your product deserves — tier names, monthly and annual prices, a featured plan, and feature lists — and watch it render exactly as customers will see it. Copy the config JSON when it converts.",
  nojsNote: "The live editor needs JavaScript. The advice below works either way.",

  controls: {
    heading: "Configure",
    tiersLabel: "Tiers",
    tierNoun: "Tier",
    addTier: "Add tier",
    maxTiers: "Up to four tiers — enough for any honest pricing page.",
    removeTier: "Remove tier",
    name: "Name",
    namePlaceholder: "Growth",
    monthlyPrice: "Monthly price",
    annualPrice: "Annual price",
    annualAuto: "Auto",
    annualHelp: "Per year. Leave empty for monthly × 10 — the standard two-months-free deal.",
    features: "Features",
    featuresPlaceholder: "One feature per line",
    featureThisTier: "Feature this tier",
    currency: "Currency",
    billing: "Preview billing",
    monthly: "Monthly",
    annual: "Annual",
    offerAnnual: "Offer annual billing",
    issues: {
      required: "Required",
      invalid: "Enter a number like 29 or 29.99",
      tooLong: "Keep it under 40 characters",
    },
  },

  preview: {
    label: "Live preview",
    heading: "Pricing",
    subheading: "Simple pricing that scales with you.",
    mostPopular: "Most popular",
    perMonth: "/mo",
    billedAnnually: "billed annually",
    billedMonthly: "billed monthly",
    saveBadge: "Save {percent}%",
    cta: "Get started",
    untitled: "Untitled",
    emptyFeatures: "Your feature list appears here",
    free: "Free",
  },

  copy: {
    button: "Copy config JSON",
    copied: "Copied",
    failed: "Copy failed — select the JSON below",
    details: "Config JSON",
    hint: "Paste the config into your app's pricing table — it carries every tier, price, and computed saving.",
  },

  sections: [
    {
      id: "anchoring",
      title: "Anchor the price you want to sell",
      paragraphs: [
        "Visitors judge a price by the numbers next to it, not by what your costs are. Put the plan you want to sell beside a more expensive one and the middle option stops looking expensive — a $79 tier exists partly to make $29 feel safe. That is why three tiers is the industry default: enough contrast to anchor, not so many that comparing them becomes work. Past four tiers, the extra comparison cost usually costs you more conversions than the extra plan earns.",
      ],
    },
    {
      id: "featured-tier",
      title: "Feature the tier you want chosen",
      paragraphs: [
        "A highlighted plan does two jobs at once: it anchors the eye and it lends the decision social proof. Buyers who cannot tell your tiers apart pick the one everyone else apparently picked. Feature the plan you actually want most customers on — typically the middle one — and resist highlighting the cheapest: you will only teach visitors to spend less.",
      ],
    },
    {
      id: "annual-billing",
      title: "Price annual billing at ten months",
      paragraphs: [
        'Charging ten months for a year of service — "two months free" — is the convention because it lands at roughly 17% off: real enough to motivate a commitment, cheap enough not to hurt. Go deeper only when cash up front matters more than margin, which is true early and rarely later. And display the monthly-equivalent figure with a "billed annually" note: "$24/mo billed annually" converts far better than "$290 per year", because the brain shops for a monthly number.',
      ],
    },
  ] as const,

  cta: {
    title: "Star it or send a pull request",
    body: "This generator is MIT-licensed open source — fork it, file an issue, or contribute the pricing features you want to see next.",
    button: "View on GitHub",
  },
} as const;
