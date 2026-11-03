/**
 * SaaS build-cost model: pick the infrastructure modules you need and the
 * platforms you ship, and the engine estimates build hours both ways -
 * from scratch vs starting from supastack's pre-wired modules. Hours are
 * deliberately conservative and stay editable in the UI via the rate and
 * per-module toggles; the point is an order-of-magnitude comparison, not a
 * quote.
 */

export type ModuleId =
  | "auth"
  | "billing"
  | "database"
  | "workspaces"
  | "jobs"
  | "email"
  | "storage"
  | "i18n"
  | "admin"
  | "observability"
  | "marketing"
  | "config";

export type PlatformId = "web" | "tanstack" | "mobile" | "desktop";

export type BuildModule = Readonly<{
  id: ModuleId;
  /** Hours to design + implement + test this from scratch (DIY baseline). */
  diyHours: number;
  /** Hours to configure/wire it on top of the kit. */
  kitHours: number;
}>;

/**
 * Honest DIY estimates for a competent solo dev, sourced from how long
 * these modules actually take to ship correctly (auth with sessions, MoR
 * webhook ledgers, RLS multi-tenancy, localized mail, etc). Kit hours are
 * configure/verify time since the module ships wired.
 */
export const BUILD_MODULES: readonly BuildModule[] = [
  { id: "auth", diyHours: 40, kitHours: 3 },
  { id: "billing", diyHours: 60, kitHours: 4 },
  { id: "database", diyHours: 30, kitHours: 2 },
  { id: "workspaces", diyHours: 45, kitHours: 4 },
  { id: "jobs", diyHours: 35, kitHours: 2 },
  { id: "email", diyHours: 20, kitHours: 2 },
  { id: "storage", diyHours: 25, kitHours: 2 },
  { id: "i18n", diyHours: 35, kitHours: 1 },
  { id: "admin", diyHours: 30, kitHours: 1 },
  { id: "observability", diyHours: 20, kitHours: 1 },
  { id: "marketing", diyHours: 30, kitHours: 2 },
  { id: "config", diyHours: 15, kitHours: 1 },
];

/** Extra platform work on top of the web app, per platform, not per module. */
export const PLATFORMS: readonly Readonly<{
  id: PlatformId;
  diyHours: number;
  kitHours: number;
}>[] = [
  { id: "web", diyHours: 0, kitHours: 0 },
  { id: "tanstack", diyHours: 40, kitHours: 8 },
  { id: "mobile", diyHours: 50, kitHours: 12 },
  { id: "desktop", diyHours: 30, kitHours: 6 },
];

export const HOURS_PER_WEEK = 40;

export type ModuleRow = Readonly<{
  module: BuildModule;
  diyHours: number;
  kitHours: number;
  savedHours: number;
}>;

export type BuildEstimate = Readonly<{
  rows: readonly ModuleRow[];
  diyHours: number;
  kitHours: number;
  savedHours: number;
  /** savedHours / diyHours, 0 when nothing selected. */
  savedPct: number;
  diyCost: number;
  kitCost: number;
  savedCost: number;
  diyWeeks: number;
  kitWeeks: number;
}>;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

/**
 * Estimate for a module + platform selection at an hourly rate.
 * `platforms` always includes "web" implicitly, it's the base target.
 */
export function estimateBuildCost(
  moduleIds: readonly ModuleId[],
  platformIds: readonly PlatformId[],
  hourlyRate: number,
): BuildEstimate {
  const wanted = new Set(moduleIds);
  const rows: ModuleRow[] = BUILD_MODULES.filter((m) => wanted.has(m.id)).map((module) => ({
    module,
    diyHours: module.diyHours,
    kitHours: module.kitHours,
    savedHours: module.diyHours - module.kitHours,
  }));
  const platformExtra = PLATFORMS.filter((p) => platformIds.includes(p.id)).map((p) => ({
    id: p.id,
    diyHours: p.diyHours,
    kitHours: p.kitHours,
  }));
  const diyHours =
    rows.reduce((sum, row) => sum + row.diyHours, 0) +
    platformExtra.reduce((sum, p) => sum + p.diyHours, 0);
  const kitHours =
    rows.reduce((sum, row) => sum + row.kitHours, 0) +
    platformExtra.reduce((sum, p) => sum + p.kitHours, 0);
  const rate = clamp(hourlyRate, 0, 1000);
  const savedHours = Math.max(0, diyHours - kitHours);

  return {
    rows,
    diyHours,
    kitHours,
    savedHours,
    savedPct: diyHours > 0 ? (savedHours / diyHours) * 100 : 0,
    diyCost: diyHours * rate,
    kitCost: kitHours * rate,
    savedCost: savedHours * rate,
    diyWeeks: diyHours / HOURS_PER_WEEK,
    kitWeeks: kitHours / HOURS_PER_WEEK,
  };
}

export const DEFAULT_MODULE_IDS: readonly ModuleId[] = [
  "auth",
  "billing",
  "database",
  "workspaces",
  "jobs",
  "email",
  "storage",
  "i18n",
  "admin",
  "observability",
  "marketing",
  "config",
];

export const DEFAULT_PLATFORM_IDS: readonly PlatformId[] = ["web", "mobile", "desktop"];
export const DEFAULT_RATE = 75;
