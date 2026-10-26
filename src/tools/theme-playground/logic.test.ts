// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_THEME_ID, THEME_CATALOG, THEME_TOKEN_NAMES, themeById } from "../../theme/catalog";
import { DENSITY_CATALOG, FONT_PAIRING_CATALOG, RADIUS_CATALOG } from "../../theme/presets";
import { copy } from "./copy";
import {
  AXIS_IDS,
  axisOptions,
  cssVarSnippet,
  DEFAULT_AXIS_STATE,
  filterPacks,
  nextPackIndex,
  packAttrSnippet,
  packSwatch,
  previewAttrs,
  randomPackIndex,
} from "./logic";
import { ThemePlayground } from "./tool";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;
let root: Root | null = null;

function mount(): HTMLDivElement {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root?.render(createElement(ThemePlayground));
  });
  return container;
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  container = null;
  root = null;
  delete document.documentElement.dataset.theme;
  localStorage.clear();
});

describe("packSwatch", () => {
  it("derives tile colors from catalog tokens only", () => {
    for (const theme of THEME_CATALOG) {
      const swatch = packSwatch(theme);
      expect(swatch.page).toBe(theme.tokens["--page"]);
      expect(swatch.section).toBe(theme.tokens["--section"]);
      expect(swatch.ink).toBe(theme.tokens["--text"]);
      expect(swatch.accent).toBe(theme.tokens["--accent"]);
      expect(swatch.border).toBe(theme.tokens["--border-strong"]);
      for (const value of Object.values(swatch)) {
        expect(THEME_TOKEN_NAMES.map((name) => theme.tokens[name])).toContain(value);
      }
    }
  });
});

describe("axisOptions", () => {
  it("exposes the preset catalogs for every axis", () => {
    expect(AXIS_IDS).toEqual(["density", "radius", "font"]);
    expect(axisOptions("density")).toBe(DENSITY_CATALOG);
    expect(axisOptions("radius")).toBe(RADIUS_CATALOG);
    expect(axisOptions("font")).toBe(FONT_PAIRING_CATALOG);
    for (const axis of AXIS_IDS) {
      expect(axisOptions(axis).length).toBeGreaterThanOrEqual(2);
    }
  });

  it("defaults every axis to the preset default", () => {
    for (const axis of AXIS_IDS) {
      expect(axisOptions(axis).some((option) => option.id === DEFAULT_AXIS_STATE[axis])).toBe(true);
    }
  });
});

describe("previewAttrs", () => {
  it("maps the selection onto wrapper data attributes", () => {
    expect(
      previewAttrs("pine", { density: "compact", radius: "round", font: "monospace" }),
    ).toEqual({
      "data-theme": "pine",
      "data-density": "compact",
      "data-radius": "round",
      "data-font": "monospace",
    });
  });
});

describe("nextPackIndex", () => {
  it("walks forward and wraps at the end", () => {
    expect(nextPackIndex(0, "ArrowRight")).toBe(1);
    expect(nextPackIndex(THEME_CATALOG.length - 1, "ArrowRight")).toBe(0);
    expect(nextPackIndex(THEME_CATALOG.length - 1, "ArrowDown")).toBe(0);
  });

  it("walks backward and wraps at the start", () => {
    expect(nextPackIndex(0, "ArrowLeft")).toBe(THEME_CATALOG.length - 1);
    expect(nextPackIndex(2, "ArrowUp")).toBe(1);
  });

  it("jumps to the ends on Home and End", () => {
    expect(nextPackIndex(4, "Home")).toBe(0);
    expect(nextPackIndex(0, "End")).toBe(THEME_CATALOG.length - 1);
  });

  it("ignores unrelated keys", () => {
    for (const key of ["a", "Enter", " ", "Tab", "PageDown"]) {
      expect(nextPackIndex(3, key)).toBeNull();
    }
  });

  it("returns null for an empty group and stays put on a single tile", () => {
    expect(nextPackIndex(0, "ArrowRight", 0)).toBeNull();
    expect(nextPackIndex(0, "ArrowRight", 1)).toBe(0);
    expect(nextPackIndex(0, "ArrowLeft", 1)).toBe(0);
  });
});

describe("packAttrSnippet", () => {
  it("copies the data-theme attribute for a valid pack", () => {
    expect(packAttrSnippet("wine", DEFAULT_AXIS_STATE)).toBe('data-theme="wine"');
  });

  it("falls back to the default pack for unknown ids", () => {
    expect(packAttrSnippet("nope", DEFAULT_AXIS_STATE)).toBe(
      `data-theme="${DEFAULT_THEME_ID}"`,
    );
  });

  it("appends only the axes that differ from the defaults", () => {
    expect(
      packAttrSnippet("pine", { density: "compact", radius: "round", font: "monospace" }),
    ).toBe('data-theme="pine" data-density="compact" data-radius="round" data-font="monospace"');
    expect(
      packAttrSnippet("pine", { ...DEFAULT_AXIS_STATE, density: "compact" }),
    ).toBe('data-theme="pine" data-density="compact"');
  });
});

describe("filterPacks", () => {
  it("passes the whole list through on blank queries", () => {
    expect(filterPacks(THEME_CATALOG, "")).toBe(THEME_CATALOG);
    expect(filterPacks(THEME_CATALOG, "   ")).toBe(THEME_CATALOG);
  });

  it("matches pack names case-insensitively", () => {
    expect(filterPacks(THEME_CATALOG, "PINE").map((theme) => theme.id)).toEqual(["pine"]);
    expect(filterPacks(THEME_CATALOG, "obsid").map((theme) => theme.id)).toEqual([
      "obsidian",
    ]);
  });

  it("matches pack summaries", () => {
    expect(filterPacks(THEME_CATALOG, "teal").map((theme) => theme.id)).toEqual(["harbor"]);
  });

  it("trims the query before matching", () => {
    expect(filterPacks(THEME_CATALOG, "  pine  ").map((theme) => theme.id)).toEqual(["pine"]);
  });

  it("matches partial strings inside either field", () => {
    const hits = filterPacks(THEME_CATALOG, "paper");
    expect(hits.map((theme) => theme.id)).toContain("paper");
    expect(hits.map((theme) => theme.id)).toContain("blossom");
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterPacks(THEME_CATALOG, "zzzz")).toEqual([]);
  });
});

describe("cssVarSnippet", () => {
  it("emits every token, one declaration per line, in catalog order", () => {
    const theme = themeById("pine");
    const lines = cssVarSnippet(theme).split("\n");
    expect(lines).toHaveLength(THEME_TOKEN_NAMES.length + 1);
    for (const [index, name] of THEME_TOKEN_NAMES.entries()) {
      expect(lines[index]).toBe(`${name}: ${theme.tokens[name]};`);
    }
  });

  it("closes with the pack's color-scheme", () => {
    expect(cssVarSnippet(themeById("wine"))).toContain("color-scheme: dark;");
    expect(cssVarSnippet(themeById("paper"))).toContain("color-scheme: light;");
  });
});

describe("randomPackIndex", () => {
  const rngs = [() => 0, () => 0.001, () => 0.42, () => 0.7, () => 0.9999];

  it("never returns the current index when more than one pack exists", () => {
    for (let count = 2; count <= 8; count++) {
      for (let current = 0; current < count; current++) {
        for (const rng of rngs) {
          const next = randomPackIndex(count, current, rng);
          expect(next).not.toBe(current);
          expect(next).toBeGreaterThanOrEqual(0);
          expect(next).toBeLessThan(count);
        }
      }
    }
  });

  it("maps rng edges onto the expected neighbors", () => {
    expect(randomPackIndex(3, 0, () => 0)).toBe(1);
    expect(randomPackIndex(3, 0, () => 0.999)).toBe(2);
    expect(randomPackIndex(3, 1, () => 0)).toBe(0);
    expect(randomPackIndex(3, 1, () => 0.999)).toBe(2);
    expect(randomPackIndex(3, 2, () => 0)).toBe(0);
    expect(randomPackIndex(3, 2, () => 0.999)).toBe(1);
  });

  it("picks across the whole list when the current index is out of range", () => {
    expect(randomPackIndex(3, -1, () => 0)).toBe(0);
    expect(randomPackIndex(3, -1, () => 0.999)).toBe(2);
    expect(randomPackIndex(3, 9, () => 0.4)).toBe(1);
  });

  it("clamps a misbehaving rng into range", () => {
    expect(randomPackIndex(3, 0, () => 1)).toBe(2);
    expect(randomPackIndex(3, 2, () => -0.5)).toBe(0);
  });

  it("degenerates sanely for tiny catalogs", () => {
    expect(randomPackIndex(1, 0, () => 0.5)).toBe(0);
    expect(randomPackIndex(0, 0, () => 0.5)).toBe(-1);
  });
});

describe("ThemePlayground", () => {
  function preview(view: HTMLElement): HTMLElement {
    return view.querySelector<HTMLElement>("[data-theme]")!;
  }

  function packRadios(view: HTMLElement): HTMLButtonElement[] {
    return Array.from(view.querySelectorAll<HTMLButtonElement>('[role="radio"]'));
  }

  it("renders the default pack on the wrapper and marks its tile checked", () => {
    const view = mount();
    expect(preview(view).dataset.theme).toBe(DEFAULT_THEME_ID);
    const checked = packRadios(view).find((radio) => radio.getAttribute("aria-checked") === "true");
    expect(checked?.textContent).toContain(themeById(DEFAULT_THEME_ID).name);
    expect(packRadios(view)).toHaveLength(THEME_CATALOG.length);
  });

  it("repaints only the preview wrapper — html, storage, and cookies stay untouched", () => {
    const view = mount();
    const htmlAttrs = () =>
      Array.from(document.documentElement.attributes)
        .map((attr) => `${attr.name}=${attr.value}`)
        .sort()
        .join("|");
    const before = htmlAttrs();
    const paper = packRadios(view).find((radio) => radio.textContent?.includes("Paper"))!;
    act(() => {
      paper.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(preview(view).dataset.theme).toBe("paper");
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(htmlAttrs()).toBe(before);
    expect(localStorage.length).toBe(0);
    expect(document.cookie).toBe("");
  });

  it("moves selection with arrow keys inside the radiogroup", () => {
    const view = mount();
    const group = view.querySelector<HTMLElement>('[role="radiogroup"]')!;
    act(() => {
      group.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
    });
    expect(preview(view).dataset.theme).toBe(THEME_CATALOG[1]!.id);
    const checked = packRadios(view).find((radio) => radio.getAttribute("aria-checked") === "true");
    expect(document.activeElement).toBe(checked);
    act(() => {
      group.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "End" }));
    });
    expect(preview(view).dataset.theme).toBe(THEME_CATALOG[THEME_CATALOG.length - 1]!.id);
  });

  it("toggles axis attributes on the preview wrapper", () => {
    const view = mount();
    const compact = Array.from(view.querySelectorAll<HTMLButtonElement>("button")).find(
      (button) => button.textContent === "Compact",
    )!;
    act(() => {
      compact.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(preview(view).dataset.density).toBe("compact");
    expect(compact.getAttribute("aria-pressed")).toBe("true");
  });

  it("re-pressing the active axis chip is a no-op", () => {
    const view = mount();
    const comfortable = Array.from(view.querySelectorAll<HTMLButtonElement>("button")).find(
      (button) => button.textContent === "Comfortable",
    )!;
    const before = preview(view).dataset.density;
    act(() => {
      comfortable.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(preview(view).dataset.density).toBe(before);
    expect(comfortable.getAttribute("aria-pressed")).toBe("true");
  });

  it("keeps the mock product controls inert — nothing in the preview is focusable", () => {
    const view = mount();
    const previewEl = preview(view);
    expect(previewEl.querySelector("[inert]")).toBeTruthy();
    for (const control of previewEl.querySelectorAll("input, button")) {
      expect(control.closest("[inert]")).toBeTruthy();
    }
  });

  it("copies the full attribute set including non-default axes", async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const view = mount();
    const compact = Array.from(view.querySelectorAll<HTMLButtonElement>("button")).find(
      (button) => button.textContent === "Compact",
    )!;
    act(() => {
      compact.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    const copyButton = Array.from(
      view.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) =>
      button.getAttribute("aria-label")?.startsWith("Copy pack attribute"),
    )!;
    await act(async () => {
      copyButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining('data-density="compact"'),
    );
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("data-theme="));
  });

  function filterInput(view: HTMLElement): HTMLInputElement {
    return view.querySelector<HTMLInputElement>('input[type="search"]')!;
  }

  function typeInFilter(input: HTMLInputElement, value: string) {
    // React reads the native input event, not a synthetic change event.
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )!.set!;
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  it("narrows the tile grid from the filter and restores it on clear", () => {
    const view = mount();
    const input = filterInput(view);
    act(() => {
      typeInFilter(input, "pine");
    });
    expect(packRadios(view)).toHaveLength(1);
    expect(packRadios(view)[0]!.textContent).toContain("Pine");
    const clear = Array.from(view.querySelectorAll<HTMLButtonElement>("button")).find(
      (button) => button.getAttribute("aria-label") === copy.filter.clear,
    )!;
    act(() => {
      clear.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(packRadios(view)).toHaveLength(THEME_CATALOG.length);
  });

  it("clears the filter on Escape", () => {
    const view = mount();
    const input = filterInput(view);
    act(() => {
      typeInFilter(input, "wine");
    });
    expect(packRadios(view)).toHaveLength(1);
    act(() => {
      input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    });
    expect(packRadios(view)).toHaveLength(THEME_CATALOG.length);
  });

  it("shows an empty state when the filter matches nothing", () => {
    const view = mount();
    act(() => {
      typeInFilter(filterInput(view), "zzzz");
    });
    expect(view.querySelector('[role="radiogroup"]')).toBeNull();
    expect(view.textContent).toContain("No packs match");
  });

  it("keeps arrow-key navigation working inside the filtered grid", () => {
    const view = mount();
    act(() => {
      typeInFilter(filterInput(view), "field");
    });
    // "field" matches several pack summaries — arrow nav stays inside the
    // visible subset instead of stepping through the full catalog.
    const radios = packRadios(view);
    expect(radios.length).toBeGreaterThan(1);
    const group = view.querySelector<HTMLElement>('[role="radiogroup"]')!;
    const first = radios[0]!.textContent;
    act(() => {
      group.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
    });
    const checked = packRadios(view).find(
      (radio) => radio.getAttribute("aria-checked") === "true",
    );
    expect(checked?.textContent).not.toBe(first);
    expect(preview(view).dataset.theme).not.toBe(DEFAULT_THEME_ID);
  });

  it("keeps a roving tab stop when the active pack is filtered out", () => {
    const view = mount();
    // "pine" leaves exactly one unchecked tile — the radiogroup must still
    // expose a tabIndex=0 target so keyboard users can reach the grid.
    act(() => {
      typeInFilter(filterInput(view), "pine");
    });
    const radios = packRadios(view);
    expect(radios).toHaveLength(1);
    expect(radios[0]!.getAttribute("aria-checked")).toBe("false");
    expect(radios[0]!.tabIndex).toBe(0);
  });

  it("surprise me picks a different pack than the current one", () => {
    const view = mount();
    const before = preview(view).dataset.theme;
    const surprise = Array.from(view.querySelectorAll<HTMLButtonElement>("button")).find(
      (button) => button.textContent === copy.status.surprise,
    )!;
    act(() => {
      surprise.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(preview(view).dataset.theme).not.toBe(before);
  });

  it("copies the pack's CSS variables", async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const view = mount();
    const varsButton = Array.from(view.querySelectorAll<HTMLButtonElement>("button")).find(
      (button) => button.textContent === copy.status.copyVarsLabel,
    )!;
    await act(async () => {
      varsButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
    const theme = themeById(DEFAULT_THEME_ID);
    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining(`--accent: ${theme.tokens["--accent"]};`),
    );
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("color-scheme: dark;"));
  });
});
