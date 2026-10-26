/**
 * English copy for the i18n key coverage checker. Tool internals stay
 * English-first; the hub card on the index page lives in `../index.ts`.
 */

const exampleBase = {
  nav: { home: "Home", pricing: "Pricing", docs: "Docs" },
  auth: {
    signIn: "Sign in",
    greeting: "Hello, {name}!",
    cta: "Start free trial",
  },
  plan: { seats: 3, trialDays: 14 },
  footer: { legal: "Terms" },
  checkout: { pay: "Pay {amount}", headline: "Almost there" },
};

const exampleTarget = {
  nav: { home: "Startseite", pricing: "Preise" },
  auth: { signIn: "Anmelden", greeting: "Hallo!", cta: "" },
  plan: { seats: "3", trialDays: 14 },
  footer: { legal: "AGB" },
  checkout: { pay: "{amount} zahlen" },
  promo: { banner: "Rabatt sichern" },
};

/** Fills the panes via "Load example pair" — shows one of each finding. */
export const examplePair = {
  base: JSON.stringify(exampleBase, null, 2),
  target: JSON.stringify(exampleTarget, null, 2),
} as const;

export const copy = {
  metaTitle: "i18n coverage checker — find missing translation keys",
  metaDescription:
    "Paste two locale JSON files and instantly see missing keys, extra keys, type mismatches, empty strings, and dropped {placeholder} variables — free, in your browser.",
  heroTitle: "Free i18n translation coverage checker",
  heroIntro:
    "Paste your base locale and the locale you are shipping. The diff runs entirely in your browser — every missing key, stray extra, type change, and dropped {placeholder} variable is listed before it reaches your users.",
  labels: {
    tagline: "JSON in · coverage report out",
    base: "Base locale (e.g. en.json)",
    target: "Target locale (e.g. de.json)",
    baseHint: "Paste the source of truth — usually English.",
    targetHint: "Paste the locale you are about to ship.",
    loadExample: "Load example pair",
    clear: "Clear",
    swap: "Swap locales",
    openFile: "Open file…",
    copyMissing: "Copy missing keys",
    copyStub: "Copy stub JSON",
    downloadStub: "Download stub",
    downloadReport: "Download report",
    copied: "Copied",
    copyFailed: "Copy failed — select the keys and copy them manually",
    filterPlaceholder: "Filter issues by key…",
    filterClear: "Clear filter",
    filterEmpty: "No issues match the filter.",
    panePlaceholder: '{"nav": {"home": "Home"}}',
    rootKey: "(root)",
    coverage: (covered: number, total: number, percent: number) =>
      `${covered} of ${total} keys covered · ${percent}%`,
    collisionWarn: (paths: readonly string[]) =>
      `Two entries flatten to the same key ${paths.map((path) => `\`${path}\``).join(", ")} — the later value wins.`,
    keys: (count: number) => `${count} ${count === 1 ? "key" : "keys"}`,
  },
  report: {
    emptyTitle: "Paste two locale files to compare",
    emptyBody:
      "Coverage, type mismatches, and placeholder drift appear here as you type. Nothing is uploaded — the diff runs in your browser.",
    waiting: "Waiting for valid JSON in both panes",
    waitingBody: "The coverage report appears as soon as both panes hold locale JSON.",
    fixErrors: "Fix the highlighted JSON above to see the coverage report.",
    allClear: "Full coverage",
    allClearBody: "The target locale mirrors every base key — no gaps, no drift.",
    issueCount: (count: number) => `${count} ${count === 1 ? "issue" : "issues"} found`,
    categories: {
      missing: {
        label: "Missing keys",
        unit: ["missing key", "missing keys"],
      },
      extra: {
        label: "Extra keys",
        unit: ["extra key", "extra keys"],
      },
      typeMismatch: {
        label: "Type mismatches",
        unit: ["type mismatch", "type mismatches"],
      },
      emptyTarget: {
        label: "Empty translations",
        unit: ["empty value", "empty values"],
      },
      identicalTarget: {
        label: "Identical to base",
        unit: ["identical string", "identical strings"],
      },
      placeholderMismatch: {
        label: "Dropped placeholders",
        unit: ["dropped placeholder", "dropped placeholders"],
      },
      arrayMismatch: {
        label: "Array length drift",
        unit: ["array mismatch", "array mismatches"],
      },
    },
  },
  sections: [
    {
      heading: "Why locale files drift",
      body: "Keys go stale for boring reasons: a feature ships with new English strings while the German file waits on a translator, a refactor renames `nav.signin` to `nav.signIn` in one file only, or a locale gains a key nobody else carries. Nothing throws at build time — the first symptom is a user staring at a raw `checkout.pay` key or a fallback language mid-flow. Diffing the flattened key paths turns that silent drift into a checklist you can clear before release.",
    },
    {
      heading: "Placeholders are part of the contract",
      body: "A translated string is not done when the words are right — `{name}`, `{{count}}`, and ICU arguments like `{count, plural, ...}` must survive verbatim. Drop or rename one and the interpolation library either prints the literal braces or throws at render. This checker extracts every token from the base string and verifies it still exists in the translation, so `Hallo!` gets flagged when the base said `Hello, {name}`.",
    },
    {
      heading: "Run it in CI, not just the browser",
      body: "Browser diffs are for humans fixing strings. The same check belongs in your test suite: flatten both files, assert the target covers every base key, and fail the build on drift — a completeness test that compares every locale against the base keeps any language from silently trailing a release.",
    },
  ] as const,
  nojsNote:
    "The live diff needs JavaScript. The guidance below still applies — and the same check belongs in your own test suite.",
  cta: {
    heading: "Star it or send a pull request",
    body: "The checker is MIT-licensed open source — fork it, report a bug, or contribute the diff features your localization workflow needs.",
    label: "View on GitHub",
  },
} as const;
