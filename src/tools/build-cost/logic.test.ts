import { describe, expect, it } from "vitest";

import {
  BUILD_MODULES,
  estimateBuildCost,
  HOURS_PER_WEEK,
  PLATFORMS,
  type ModuleId,
} from "./logic";

const ALL_MODULES: ModuleId[] = BUILD_MODULES.map((m) => m.id);

describe("estimateBuildCost", () => {
  it("sums selected modules and adds platform extras", () => {
    const result = estimateBuildCost(["auth", "billing"], ["web"], 100);
    // 40 + 60 diy, 3 + 4 kit, web adds 0
    expect(result.diyHours).toBe(100);
    expect(result.kitHours).toBe(7);
    expect(result.savedHours).toBe(93);
    expect(result.diyCost).toBe(10_000);
    expect(result.kitCost).toBe(700);
    expect(result.savedCost).toBe(9_300);
  });

  it("counts tanstack, mobile and desktop platform hours per platform", () => {
    const result = estimateBuildCost(
      ["auth"],
      ["web", "tanstack", "mobile", "desktop"],
      50,
    );
    expect(result.diyHours).toBe(40 + 40 + 50 + 30);
    expect(result.kitHours).toBe(3 + 8 + 12 + 6);
  });

  it("treats web as the free base platform", () => {
    const web = PLATFORMS.find((p) => p.id === "web");
    expect(web?.diyHours).toBe(0);
    expect(web?.kitHours).toBe(0);
  });

  it("reports rows only for selected modules, in registry order", () => {
    const result = estimateBuildCost(["billing", "auth"], ["web"], 75);
    expect(result.rows.map((r) => r.module.id)).toEqual(["auth", "billing"]);
  });

  it("clamps a negative or absurd hourly rate", () => {
    const negative = estimateBuildCost(["auth"], ["web"], -5);
    expect(negative.diyCost).toBe(0);
    const absurd = estimateBuildCost(["auth"], ["web"], 999_999);
    expect(absurd.diyCost).toBe(40 * 1000);
  });

  it("returns zeros when nothing is selected", () => {
    const result = estimateBuildCost([], [], 100);
    expect(result.diyHours).toBe(0);
    expect(result.kitHours).toBe(0);
    expect(result.savedPct).toBe(0);
    expect(result.savedCost).toBe(0);
  });

  it("computes weeks from a 40-hour week", () => {
    const result = estimateBuildCost(ALL_MODULES, ["web"], 100);
    expect(result.diyWeeks).toBeCloseTo(result.diyHours / HOURS_PER_WEEK, 5);
    expect(result.kitWeeks).toBeCloseTo(result.kitHours / HOURS_PER_WEEK, 5);
  });

  it("every module saves at least half its DIY hours", () => {
    for (const module of BUILD_MODULES) {
      expect(module.kitHours).toBeLessThanOrEqual(module.diyHours / 2);
    }
  });
});
