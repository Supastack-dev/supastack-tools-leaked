// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_THEME_ID, THEME_CATALOG, THEME_TOKEN_NAMES, themeById } from "../../theme/catalog";
import { DENSITY_CATALOG, FONT_PAIRING_CATALOG, RADIUS_CATALOG } from "../../theme/presets";
import {
  AXIS_IDS,
  axisOptions,
  DEFAULT_AXIS_STATE,
  nextPackIndex,
  packAttrSnippet,
  packIndexOf,
  packSwatch,
  previewAttrs,
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

describe("packIndexOf", () => {
  it("finds the catalog index or the default", () => {
    expect(packIndexOf("obsidian")).toBe(0);
    expect(packIndexOf("harbor")).toBe(THEME_CATALOG.length - 1);
    expect(packIndexOf("bogus")).toBe(0);
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
    const copyButton = view.querySelector<HTMLButtonElement>(`.${"copyChip"}`) ??
      Array.from(view.querySelectorAll<HTMLButtonElement>("button")).find((button) =>
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
});
