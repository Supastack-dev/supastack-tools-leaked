/**
 * English copy for the i18n key coverage checker. Tool internals stay
 * English-first (documented plan decision); page chrome localizes through
 * ResourceShell. The /tools hub card lives in `../tools-index.ts`.
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
  sourceLabel: "Source on GitHub",
  labels: {
    tagline: "JSON in · coverage report out",
    base: "Base locale (e.g. en.json)",
    target: "Target locale (e.g. de.json)",
    baseHint: "Paste the source of truth — usually English.",
    targetHint: "Paste the locale you are about to ship.",
    loadExample: "Load example pair",
    clear: "Clear",
    copyMissing: "Copy missing keys",
    copied: "Copied",
    copyFailed: "Copy failed — select the keys and copy them manually",
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
        hint: "in base, absent from target",
        unit: ["missing key", "missing keys"],
      },
      extra: {
        label: "Extra keys",
        hint: "in target, absent from base",
        unit: ["extra key", "extra keys"],
      },
      typeMismatch: {
        label: "Type mismatches",
        hint: "same key, different value type",
        unit: ["type mismatch", "type mismatches"],
      },
      emptyTarget: {
        label: "Empty translations",
        hint: "target string is blank",
        unit: ["empty value", "empty values"],
      },
      placeholderMismatch: {
        label: "Dropped placeholders",
        hint: "{var} tokens lost in translation",
        unit: ["dropped placeholder", "dropped placeholders"],
      },
      arrayMismatch: {
        label: "Array length drift",
        hint: "same key, different item count",
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
      body: "Browser diffs are for humans fixing strings. The same check belongs in your test suite: flatten both files, assert the target covers every base key, and fail the build on drift. supastack ships twelve locales wired exactly that way — a completeness test compares every language against English and blocks the release until the diff is empty, so no locale silently trails a release.",
    },
  ] as const,
  nojsNote:
    "The live diff needs JavaScript. The guidance below still applies — and the same check runs in the supastack test suite.",
  cta: {
    heading: "Ship every locale complete, every release",
    body: "supastack ships 12 locales with a completeness test that fails the build on drift — plus auth, billing, and deployment already wired.",
    label: "Get supastack",
  },
} as const;
