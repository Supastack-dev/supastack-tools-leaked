import { uiPresetBootFragment } from "./presets";

export const DEFAULT_THEME_ID = "obsidian";
export const THEME_STORAGE_KEY = "starterkit-theme";
export const THEME_COOKIE_NAME = "starterkit-theme";

export const THEME_TOKEN_NAMES = [
  "--page",
  "--section",
  "--raised",
  "--text",
  "--muted",
  "--border",
  "--border-strong",
  "--btn",
  "--btn-text",
  "--accent",
  "--content-text",
  "--accent-hover",
  "--accent-ink",
] as const;

export type ThemeTokenName = (typeof THEME_TOKEN_NAMES)[number];
export type ThemeTokens = Record<ThemeTokenName, string>;
export type ColorScheme = "dark" | "light";

export type ThemeDefinition = {
  id: string;
  name: string;
  description: string;
  colorScheme: ColorScheme;
  tokens: ThemeTokens;
};

const obsidian: ThemeDefinition = {
  id: "obsidian",
  name: "Obsidian",
  description: "Black field, warm amber actions. The supastack default.",
  colorScheme: "dark",
  tokens: {
    "--page": "#000000",
    "--section": "#080808",
    "--raised": "#101010",
    "--text": "#f5f5f5",
    "--muted": "#adadad",
    "--border": "rgba(255, 255, 255, 0.12)",
    "--border-strong": "rgba(255, 255, 255, 0.22)",
    "--btn": "#f5f5f5",
    "--btn-text": "#111111",
    "--accent": "#ffc078",
    "--content-text": "#c4c4c4",
    "--accent-hover": "#ffd4a3",
    "--accent-ink": "#171009",
  },
};

export const THEME_CATALOG: readonly ThemeDefinition[] = [
  obsidian,
  {
    id: "graphite",
    name: "Graphite",
    description: "Near-black with cool silver actions.",
    colorScheme: "dark",
    tokens: {
      "--page": "#050505",
      "--section": "#0c0c0c",
      "--raised": "#161616",
      "--text": "#f2f2f2",
      "--muted": "#a3a3a3",
      "--border": "rgba(255, 255, 255, 0.12)",
      "--border-strong": "rgba(255, 255, 255, 0.22)",
      "--btn": "#f2f2f2",
      "--btn-text": "#111111",
      "--accent": "#c8c8c8",
      "--content-text": "#c4c4c4",
      "--accent-hover": "#e4e4e4",
      "--accent-ink": "#111111",
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Navy canvas with ice-blue actions.",
    colorScheme: "dark",
    tokens: {
      "--page": "#0a1220",
      "--section": "#0f1828",
      "--raised": "#162033",
      "--text": "#e8eef6",
      "--muted": "#9aa8bc",
      "--border": "rgba(232, 238, 246, 0.12)",
      "--border-strong": "rgba(232, 238, 246, 0.22)",
      "--btn": "#e8eef6",
      "--btn-text": "#0a1220",
      "--accent": "#8eb4e8",
      "--content-text": "#c5d0de",
      "--accent-hover": "#b3ccf0",
      "--accent-ink": "#0a1220",
    },
  },
  {
    id: "pine",
    name: "Pine",
    description: "Forest night with moss actions.",
    colorScheme: "dark",
    tokens: {
      "--page": "#07120c",
      "--section": "#0c1a12",
      "--raised": "#12241a",
      "--text": "#e7f0e8",
      "--muted": "#9bb09e",
      "--border": "rgba(231, 240, 232, 0.12)",
      "--border-strong": "rgba(231, 240, 232, 0.22)",
      "--btn": "#e7f0e8",
      "--btn-text": "#07120c",
      "--accent": "#9ec5a0",
      "--content-text": "#c5d4c7",
      "--accent-hover": "#bdd8be",
      "--accent-ink": "#07120c",
    },
  },
  {
    id: "wine",
    name: "Wine",
    description: "Burgundy field with rose-gold actions.",
    colorScheme: "dark",
    tokens: {
      "--page": "#14090d",
      "--section": "#1c0f14",
      "--raised": "#26151c",
      "--text": "#f3e8ea",
      "--muted": "#c4a8b0",
      "--border": "rgba(243, 232, 234, 0.12)",
      "--border-strong": "rgba(243, 232, 234, 0.22)",
      "--btn": "#f3e8ea",
      "--btn-text": "#14090d",
      "--accent": "#e0b08a",
      "--content-text": "#d7c2c7",
      "--accent-hover": "#edc4a6",
      "--accent-ink": "#1a0c10",
    },
  },
  {
    id: "umber",
    name: "Umber",
    description: "Warm charcoal with sand actions.",
    colorScheme: "dark",
    tokens: {
      "--page": "#120e0a",
      "--section": "#1a1510",
      "--raised": "#241e18",
      "--text": "#f3ece3",
      "--muted": "#b8a898",
      "--border": "rgba(243, 236, 227, 0.12)",
      "--border-strong": "rgba(243, 236, 227, 0.22)",
      "--btn": "#f3ece3",
      "--btn-text": "#120e0a",
      "--accent": "#d7b48a",
      "--content-text": "#d4c4b4",
      "--accent-hover": "#e6c9a6",
      "--accent-ink": "#1a140e",
    },
  },
  {
    id: "paper",
    name: "Paper",
    description: "Warm paper, ink type, clay actions.",
    colorScheme: "light",
    tokens: {
      "--page": "#f4efe6",
      "--section": "#ebe4d8",
      "--raised": "#fffaf3",
      "--text": "#17120d",
      "--muted": "#3f3832",
      "--border": "rgba(23, 18, 13, 0.14)",
      "--border-strong": "rgba(23, 18, 13, 0.28)",
      "--btn": "#17120d",
      "--btn-text": "#f4efe6",
      "--accent": "#c45c26",
      "--content-text": "#3f3832",
      "--accent-hover": "#d46c36",
      "--accent-ink": "#fffaf3",
    },
  },
  {
    id: "slate",
    name: "Slate",
    description: "Blue-gray studio with steel actions.",
    colorScheme: "dark",
    tokens: {
      "--page": "#12151a",
      "--section": "#181c22",
      "--raised": "#222830",
      "--text": "#e8eaee",
      "--muted": "#a8b0bc",
      "--border": "rgba(232, 234, 238, 0.12)",
      "--border-strong": "rgba(232, 234, 238, 0.22)",
      "--btn": "#e8eaee",
      "--btn-text": "#12151a",
      "--accent": "#7aa2c4",
      "--content-text": "#c5cad3",
      "--accent-hover": "#9bb9d4",
      "--accent-ink": "#0e1216",
    },
  },
  {
    id: "glacier",
    name: "Glacier",
    description: "Cool daylight field with steel-blue actions.",
    colorScheme: "light",
    tokens: {
      "--page": "#eef2f6",
      "--section": "#e2e8ef",
      "--raised": "#f7f9fb",
      "--text": "#121820",
      "--muted": "#3d4654",
      "--border": "rgba(18, 24, 32, 0.12)",
      "--border-strong": "rgba(18, 24, 32, 0.26)",
      "--btn": "#121820",
      "--btn-text": "#eef2f6",
      "--accent": "#2f6f9f",
      "--content-text": "#3d4654",
      "--accent-hover": "#3d82b5",
      "--accent-ink": "#f7f9fb",
    },
  },
  {
    id: "ink",
    name: "Ink",
    description: "High-contrast black field with pure white actions.",
    colorScheme: "dark",
    tokens: {
      "--page": "#000000",
      "--section": "#050505",
      "--raised": "#0d0d0d",
      "--text": "#ffffff",
      "--muted": "#b3b3b3",
      "--border": "rgba(255, 255, 255, 0.14)",
      "--border-strong": "rgba(255, 255, 255, 0.28)",
      "--btn": "#ffffff",
      "--btn-text": "#000000",
      "--accent": "#ffffff",
      "--content-text": "#d0d0d0",
      "--accent-hover": "#e8e8e8",
      "--accent-ink": "#000000",
    },
  },
  {
    id: "blossom",
    name: "Blossom",
    description: "Soft blush paper with berry actions.",
    colorScheme: "light",
    tokens: {
      "--page": "#faf4f6",
      "--section": "#f1e6ea",
      "--raised": "#fff9fb",
      "--text": "#1a1014",
      "--muted": "#4a3840",
      "--border": "rgba(26, 16, 20, 0.12)",
      "--border-strong": "rgba(26, 16, 20, 0.26)",
      "--btn": "#1a1014",
      "--btn-text": "#faf4f6",
      "--accent": "#a8456a",
      "--content-text": "#4a3840",
      "--accent-hover": "#bc587c",
      "--accent-ink": "#fff9fb",
    },
  },
  {
    id: "harbor",
    name: "Harbor",
    description: "Deep teal night with sea-glass actions.",
    colorScheme: "dark",
    tokens: {
      "--page": "#061416",
      "--section": "#0b1c1f",
      "--raised": "#12282c",
      "--text": "#e6f2f0",
      "--muted": "#95b0ab",
      "--border": "rgba(230, 242, 240, 0.12)",
      "--border-strong": "rgba(230, 242, 240, 0.22)",
      "--btn": "#e6f2f0",
      "--btn-text": "#061416",
      "--accent": "#7ec9b5",
      "--content-text": "#c2d6d2",
      "--accent-hover": "#9ad8c7",
      "--accent-ink": "#061416",
    },
  },
];

export type ThemeId = (typeof THEME_CATALOG)[number]["id"];

export function isThemeId(value: string): boolean {
  return THEME_CATALOG.some((theme) => theme.id === value);
}

export function resolveThemeId(value: string | null | undefined): ThemeId {
  return THEME_CATALOG.some((theme) => theme.id === value) ? (value as ThemeId) : DEFAULT_THEME_ID;
}

export function themeById(id: string): ThemeDefinition {
  return THEME_CATALOG.find((theme) => theme.id === resolveThemeId(id)) ?? obsidian;
}

export function themeStylesheet(): string {
  return THEME_CATALOG.map((theme) => {
    // Default pack only before data-theme exists — never keep painting Obsidian under Paper.
    // Packs also paint subtree wrappers ([data-theme] on any element), so marketing shells
    // or nested app surfaces can pin a different pack than the global html pick.
    const selector =
      theme.id === DEFAULT_THEME_ID
        ? `:root:not([data-theme]), html[data-theme="${theme.id}"], [data-theme="${theme.id}"]:not(html)`
        : `html[data-theme="${theme.id}"], [data-theme="${theme.id}"]:not(html)`;
    const decls = [
      ...THEME_TOKEN_NAMES.map((name) => `${name}:${theme.tokens[name]}`),
      `color-scheme:${theme.colorScheme}`,
    ].join(";");
    return `${selector}{${decls}}`;
  }).join("");
}

export function applyTheme(id: string): ThemeId {
  const resolved = resolveThemeId(id);
  if (typeof document === "undefined") {
    return resolved;
  }
  const pack = themeById(resolved);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = pack.colorScheme;
  // Storage can be disabled (webview/privacy mode) — persistence is
  // best-effort and must not abort the apply; data-theme is already set.
  try {
    localStorage.setItem(THEME_STORAGE_KEY, resolved);
  } catch {
    // The session-only theme still applies; nothing else to do.
  }
  try {
    document.cookie = `${THEME_COOKIE_NAME}=${encodeURIComponent(resolved)}; Path=/; Max-Age=31536000; SameSite=Lax`;
  } catch {
    // Cookie persistence is the SSR/boot fallback — skip when unavailable.
  }
  return resolved;
}

/** Pure boot-script builder. The server-only module re-exports the evaluated string for layout injection. */
export function buildThemeBootScript(): string {
  return `(function(){try{var allowed=${JSON.stringify(THEME_CATALOG.map((theme) => theme.id))};var schemes=${JSON.stringify(Object.fromEntries(THEME_CATALOG.map((theme) => [theme.id, theme.colorScheme])))};var key=${JSON.stringify(THEME_STORAGE_KEY)};var prefix=${JSON.stringify(`${THEME_COOKIE_NAME}=`)};var cookie=document.cookie.split("; ").find(function(part){return part.indexOf(prefix)===0});var raw=localStorage.getItem(key)||(cookie?decodeURIComponent(cookie.slice(prefix.length)):"");var id=allowed.indexOf(raw)>=0?raw:${JSON.stringify(DEFAULT_THEME_ID)};document.documentElement.setAttribute("data-theme",id);document.documentElement.style.colorScheme=schemes[id];${uiPresetBootFragment()}}catch(e){}})();`;
}
