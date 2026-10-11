import { THEME_CATALOG, THEME_TOKEN_NAMES } from "./catalog";

/**
 * The theme packs as subtree-scoped CSS: `[data-theme="<pack>"]:not(html)`
 * repaints whatever wrapper carries the attribute — which is how the theme
 * playground preview swaps palettes without touching the page chrome.
 *
 * `html[data-theme]` is deliberately excluded: the site reserves it for its
 * own dark/light pick (see src/app/globals.css + src/lib/theme.ts), and no
 * pack id collides with "dark"/"light".
 */
export function packStylesheet(): string {
  return THEME_CATALOG.map((theme) => {
    const decls = [
      ...THEME_TOKEN_NAMES.map((name) => `${name}:${theme.tokens[name]}`),
      `color-scheme:${theme.colorScheme}`,
    ].join(";");
    return `[data-theme="${theme.id}"]:not(html){${decls}}`;
  }).join("\n");
}
