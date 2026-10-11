import {
  DEFAULT_THEME_ID,
  THEME_CATALOG,
  themeById,
  type ThemeDefinition,
  type ThemeId,
} from "../../theme/catalog";
import {
  DEFAULT_DENSITY_ID,
  DEFAULT_FONT_PAIRING_ID,
  DEFAULT_RADIUS_ID,
  DENSITY_CATALOG,
  FONT_PAIRING_CATALOG,
  RADIUS_CATALOG,
  type DensityId,
  type FontPairingId,
  type RadiusId,
  type UiPresetDefinition,
} from "../../theme/presets";

/** Representative token picks for a picker tile's mini-dashboard glyph. */
export type PackSwatch = {
  page: string;
  section: string;
  ink: string;
  accent: string;
  border: string;
};

export function packSwatch(theme: ThemeDefinition): PackSwatch {
  return {
    page: theme.tokens["--page"],
    section: theme.tokens["--section"],
    ink: theme.tokens["--text"],
    accent: theme.tokens["--accent"],
    border: theme.tokens["--border-strong"],
  };
}

/** UI preset axes mirrored onto the preview wrapper as data attributes. */
export type AxisId = "density" | "radius" | "font";

export type AxisState = {
  density: DensityId;
  radius: RadiusId;
  font: FontPairingId;
};

export const DEFAULT_AXIS_STATE: AxisState = {
  density: DEFAULT_DENSITY_ID,
  radius: DEFAULT_RADIUS_ID,
  font: DEFAULT_FONT_PAIRING_ID,
};

export const AXIS_IDS: readonly AxisId[] = ["density", "radius", "font"];

const AXIS_CATALOGS = {
  density: DENSITY_CATALOG,
  radius: RADIUS_CATALOG,
  font: FONT_PAIRING_CATALOG,
} as const;

/** Options for one axis, with `id` narrowed to that axis's legal values. */
export function axisOptions<A extends AxisId>(
  axis: A,
): readonly (UiPresetDefinition & { id: AxisState[A] })[] {
  return AXIS_CATALOGS[axis];
}

/** data-* attribute bag for the preview wrapper — the repaint contract. */
export function previewAttrs(themeId: ThemeId, axes: AxisState) {
  return {
    "data-theme": themeId,
    "data-density": axes.density,
    "data-radius": axes.radius,
    "data-font": axes.font,
  } as const;
}

/**
 * Radiogroup keyboard contract: arrows move the selection with wrap-around,
 * Home/End jump to the ends, every other key is ignored.
 */
export function nextPackIndex(
  current: number,
  key: string,
  count: number = THEME_CATALOG.length,
): number | null {
  if (count <= 0) return null;
  const index = Math.min(Math.max(current, 0), count - 1);
  switch (key) {
    case "ArrowRight":
    case "ArrowDown":
      return (index + 1) % count;
    case "ArrowLeft":
    case "ArrowUp":
      return (index - 1 + count) % count;
    case "Home":
      return 0;
    case "End":
      return count - 1;
    default:
      return null;
  }
}

/**
 * Clipboard payload — the attribute(s) a buyer would paste onto a wrapper.
 * Non-default axis picks come along so the pasted snippet reproduces the
 * preview exactly.
 */
export function packAttrSnippet(id: string, axes: AxisState): string {
  const parts = [`data-theme="${themeById(id).id}"`];
  if (axes.density !== DEFAULT_AXIS_STATE.density) parts.push(`data-density="${axes.density}"`);
  if (axes.radius !== DEFAULT_AXIS_STATE.radius) parts.push(`data-radius="${axes.radius}"`);
  if (axes.font !== DEFAULT_AXIS_STATE.font) parts.push(`data-font="${axes.font}"`);
  return parts.join(" ");
}

export function packIndexOf(id: string): number {
  const index = THEME_CATALOG.findIndex((theme) => theme.id === id);
  return index >= 0 ? index : THEME_CATALOG.findIndex((theme) => theme.id === DEFAULT_THEME_ID);
}
