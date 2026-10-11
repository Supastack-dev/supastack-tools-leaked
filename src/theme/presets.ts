export const DEFAULT_DENSITY_ID = "comfortable";
export const DEFAULT_RADIUS_ID = "soft";
export const DEFAULT_FONT_PAIRING_ID = "editorial";

export type UiPresetDefinition = {
  id: string;
  name: string;
  description: string;
};

export const DENSITY_CATALOG: readonly UiPresetDefinition[] = [
  {
    id: "comfortable",
    name: "Comfortable",
    description: "Roomy spacing and control heights for reading and forms.",
  },
  {
    id: "compact",
    name: "Compact",
    description: "Tighter gutters and shorter controls for dense product UI.",
  },
] as const;

export const RADIUS_CATALOG: readonly UiPresetDefinition[] = [
  {
    id: "soft",
    name: "Soft",
    description: "supastack default radii on cards, surfaces, and controls.",
  },
  {
    id: "sharp",
    name: "Sharp",
    description: "Near-square corners for a utilitarian product chrome.",
  },
  {
    id: "round",
    name: "Round",
    description: "Larger surface radii and pill-shaped controls.",
  },
] as const;

export const FONT_PAIRING_CATALOG: readonly UiPresetDefinition[] = [
  {
    id: "editorial",
    name: "Editorial",
    description: "Sans body with serif display — the default pairing.",
  },
  {
    id: "geometric",
    name: "Geometric",
    description: "Sans for body and headings when serif display is unwanted.",
  },
  {
    id: "monospace",
    name: "Monospace",
    description: "Mono stack for a technical, instrument-panel feel.",
  },
] as const;

export type DensityId = (typeof DENSITY_CATALOG)[number]["id"];
export type RadiusId = (typeof RADIUS_CATALOG)[number]["id"];
export type FontPairingId = (typeof FONT_PAIRING_CATALOG)[number]["id"];
