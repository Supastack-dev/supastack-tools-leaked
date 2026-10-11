// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SITE_THEME_STORAGE_KEY } from "../lib/theme";
import { ThemeToggle } from "./theme-toggle";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;
let root: Root | null = null;

function mount(): HTMLDivElement {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root?.render(createElement(ThemeToggle));
  });
  return container;
}

function click(view: HTMLElement) {
  const button = view.querySelector("button");
  if (!button) throw new Error("toggle button missing");
  act(() => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  container = null;
  root = null;
  delete document.documentElement.dataset.theme;
  document.documentElement.style.colorScheme = "";
  localStorage.clear();
});

describe("ThemeToggle", () => {
  it("flips data-theme and keeps the boot script's inline color-scheme in sync", () => {
    // Simulate the boot-script state for a light-mode visitor: the inline
    // colorScheme would outrank the stylesheet's dark rule if left stale.
    document.documentElement.dataset.theme = "light";
    document.documentElement.style.colorScheme = "light";
    const view = mount();

    click(view);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(localStorage.getItem(SITE_THEME_STORAGE_KEY)).toBe("dark");

    click(view);
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(localStorage.getItem(SITE_THEME_STORAGE_KEY)).toBe("light");
  });

  it("still toggles when localStorage is unavailable", () => {
    const view = mount();
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new DOMException("denied");
      });
    click(view);
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(document.documentElement.style.colorScheme).toBe("light");
    setItem.mockRestore();
  });
});
