// @vitest-environment jsdom

import { act, createElement, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  diffLocales,
  extractPlaceholders,
  flattenLocale,
  parseLocaleJson,
  type FlattenedLocale,
} from "./logic";
import { I18nKeyCheckerTool } from "./tool";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

function flat(value: unknown): FlattenedLocale {
  return flattenLocale(value);
}

describe("flattenLocale", () => {
  it("flattens nested objects into dot-separated leaf paths", () => {
    const map = flat({
      nav: { home: "Home", docs: { intro: "Intro" } },
      cta: "Start",
    });
    expect([...map.keys()].sort()).toEqual(["cta", "nav.docs.intro", "nav.home"]);
    expect(map.get("nav.docs.intro")).toEqual({ type: "string", value: "Intro" });
  });

  it("types each leaf value", () => {
    const map = flat({ s: "x", n: 3.5, b: false });
    expect(map.get("s")?.type).toBe("string");
    expect(map.get("n")?.type).toBe("number");
    expect(map.get("b")?.type).toBe("boolean");
  });

  it("keeps arrays as leaves instead of recursing", () => {
    const map = flat({ tags: ["a", "b"], empty: [] });
    expect(map.get("tags")).toEqual({ type: "array", value: ["a", "b"] });
    expect(map.get("empty")?.type).toBe("array");
  });

  it("keeps empty objects as leaves but recurses into non-empty ones", () => {
    const map = flat({ empty: {}, nested: { inner: {} } });
    expect(map.get("empty")).toEqual({ type: "object", value: {} });
    expect(map.get("nested.inner")?.type).toBe("object");
    expect(map.has("nested")).toBe(false);
  });

  it("keeps null as a typed leaf", () => {
    const map = flat({ gone: null });
    expect(map.get("gone")).toEqual({ type: "null", value: null });
  });

  it("flattens a non-object root under the empty path", () => {
    const map = flat(["a"]);
    expect(map.get("")).toEqual({ type: "array", value: ["a"] });
  });

  it("reports literal-dot keys colliding with nested paths", () => {
    const collisions: string[] = [];
    const map = flattenLocale({ "a.b": 1, a: { b: 2 }, c: 3 }, "", collisions);
    // The later entry wins — and the ambiguity is reported, not swallowed.
    expect(map.get("a.b")?.value).toBe(2);
    expect(collisions).toEqual(["a.b"]);
  });
});

describe("extractPlaceholders", () => {
  it("finds single- and double-brace variables", () => {
    expect(extractPlaceholders("Hi {name}, you have {{count}} items")).toEqual(["name", "count"]);
  });

  it("dedupes repeated variables and tolerates spacing", () => {
    expect(extractPlaceholders("{a} {a} {{ b }}")).toEqual(["a", "b"]);
  });

  it("captures the variable name from ICU select/plural tokens", () => {
    expect(extractPlaceholders("{count, plural, one {# item} other {# items}}")).toEqual(["count"]);
  });

  it("never treats ICU option-body words as placeholders", () => {
    // `{You…}` after a selector opens the option body — not a variable.
    expect(
      extractPlaceholders(
        "{count, plural, one {You have # photo} other {You have # photos}}",
      ),
    ).toEqual(["count"]);
    expect(
      extractPlaceholders("{size, select, small {A {thing}} other {Some {thing}s}}"),
    ).toEqual(["size", "thing"]);
  });

  it("captures args of number/date/time tokens and skips their format spec", () => {
    expect(extractPlaceholders("{amount, number, ::currency/USD}")).toEqual(["amount"]);
  });

  it("supports dotted and dashed names", () => {
    expect(extractPlaceholders("{user.name} {plan-tier}")).toEqual(["user.name", "plan-tier"]);
  });

  it("returns an empty list for strings without tokens", () => {
    expect(extractPlaceholders("plain text")).toEqual([]);
  });
});

describe("diffLocales", () => {
  it("reports missing and extra keys sorted by path", () => {
    const diff = diffLocales(flat({ b: 1, a: 1, keep: 1 }), flat({ keep: 1, z: 2 }));
    expect(diff.missing).toEqual(["a", "b"]);
    expect(diff.extra).toEqual(["z"]);
  });

  it("reports type mismatches with both types", () => {
    const diff = diffLocales(flat({ seats: 3 }), flat({ seats: "3" }));
    expect(diff.typeMismatch).toEqual([{ key: "seats", baseType: "number", targetType: "string" }]);
    expect(diff.missing).toEqual([]);
  });

  it("flags empty target strings only when the base has content", () => {
    const diff = diffLocales(
      flat({ real: "Sign in", alsoEmpty: "" }),
      flat({ real: "", alsoEmpty: "" }),
    );
    expect(diff.emptyTarget).toEqual(["real"]);
  });

  it("reports placeholders that did not survive translation", () => {
    const diff = diffLocales(
      flat({ greet: "Hello {name}, {count} left", ok: "Hey {name}" }),
      flat({ greet: "Hallo {name}", ok: "Hey {name}" }),
    );
    expect(diff.placeholderMismatch).toEqual([{ key: "greet", missingVars: ["count"] }]);
  });

  it("skips placeholder checks when the types differ", () => {
    const diff = diffLocales(flat({ v: "{n} items" }), flat({ v: ["{n}"] }));
    expect(diff.placeholderMismatch).toEqual([]);
    expect(diff.typeMismatch).toHaveLength(1);
  });

  it("returns empty buckets for identical files", () => {
    const diff = diffLocales(flat({ a: "x", n: { b: 1 } }), flat({ a: "x", n: { b: 1 } }));
    expect(diff).toEqual({
      missing: [],
      extra: [],
      typeMismatch: [],
      emptyTarget: [],
      placeholderMismatch: [],
      arrayMismatch: [],
    });
  });

  it("flags arrays whose item counts drift", () => {
    const diff = diffLocales(
      flat({ tips: ["a", "b", "c"], ok: [1] }),
      flat({ tips: ["a"], ok: [1, 2] }),
    );
    expect(diff.arrayMismatch).toEqual([
      { key: "ok", baseLength: 1, targetLength: 2 },
      { key: "tips", baseLength: 3, targetLength: 1 },
    ]);
    // A same-length array is a translation target, not drift.
    expect(diff.typeMismatch).toEqual([]);
  });
});

describe("parseLocaleJson", () => {
  it("parses valid JSON", () => {
    const result = parseLocaleJson('{"a": 1}');
    expect(result).toEqual({ ok: true, value: { a: 1 } });
  });

  it("returns a friendly failure for invalid JSON", () => {
    const result = parseLocaleJson("{ nope");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message.length).toBeGreaterThan(0);
    }
  });

  it("rejects empty input without throwing", () => {
    expect(parseLocaleJson("   ").ok).toBe(false);
    expect(parseLocaleJson("").ok).toBe(false);
  });
});

// --- Component interaction -------------------------------------------------

let container: HTMLDivElement | null = null;
let root: Root | null = null;

function mount(element: ReactElement): HTMLDivElement {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root?.render(element));
  return container;
}

function setTextarea(el: HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
  act(() => {
    setter?.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function click(el: Element) {
  act(() => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });
}

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  container = null;
  root = null;
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("I18nKeyCheckerTool", () => {
  it("starts on a clean empty state", () => {
    const view = mount(createElement(I18nKeyCheckerTool));
    expect(view.querySelector("[data-empty]")?.textContent).toContain(
      "Paste two locale files to compare",
    );
    expect(view.querySelectorAll("textarea")).toHaveLength(2);
  });

  it("reports missing keys after the debounce settles", () => {
    vi.useFakeTimers();
    const view = mount(createElement(I18nKeyCheckerTool));
    const [base, target] = Array.from(view.querySelectorAll("textarea"));
    if (!base || !target) return;

    setTextarea(base, '{"a": "x", "b": "y"}');
    setTextarea(target, '{"a": "x"}');
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(view.querySelector('[data-chip="missing"]')?.textContent).toContain("1");
    const group = view.querySelector('[data-group="missing"]');
    expect(group?.textContent).toContain("b");
    expect(view.querySelector("[data-empty]")).toBeNull();
  });

  it("flags invalid JSON under the offending textarea without crashing", () => {
    vi.useFakeTimers();
    const view = mount(createElement(I18nKeyCheckerTool));
    const [base, target] = Array.from(view.querySelectorAll("textarea"));
    if (!base || !target) return;

    setTextarea(base, "{ broken");
    setTextarea(target, "{}");
    act(() => {
      vi.advanceTimersByTime(400);
    });

    const error = view.querySelector('[role="alert"]');
    expect(error?.textContent?.length).toBeGreaterThan(0);
    expect(base.getAttribute("aria-invalid")).toBe("true");
    expect(view.querySelector("[data-chip]")).toBeNull();
  });

  it("loads the example pair and produces a populated report", () => {
    vi.useFakeTimers();
    const view = mount(createElement(I18nKeyCheckerTool));
    const example = view.querySelector('[data-action="example"]');
    if (!example) return;

    click(example);
    act(() => {
      vi.advanceTimersByTime(400);
    });

    const [base, target] = Array.from(view.querySelectorAll("textarea"));
    expect(base?.value).toContain('"nav"');
    expect(target?.value.length).toBeGreaterThan(0);
    expect(view.querySelector('[data-group="missing"]')).not.toBeNull();
    expect(view.querySelector('[data-group="typeMismatch"]')).not.toBeNull();
  });

  it("clears both panes back to the empty state", () => {
    vi.useFakeTimers();
    const view = mount(createElement(I18nKeyCheckerTool));
    const example = view.querySelector('[data-action="example"]');
    const clear = view.querySelector('[data-action="clear"]');
    if (!example || !clear) return;

    click(example);
    act(() => {
      vi.advanceTimersByTime(400);
    });
    click(clear);

    expect(view.querySelector("[data-empty]")).not.toBeNull();
    expect(view.querySelector("textarea")?.value).toBe("");
  });

  it("copies the missing-key list", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    const view = mount(createElement(I18nKeyCheckerTool));
    const [base, target] = Array.from(view.querySelectorAll("textarea"));
    if (!base || !target) return;
    setTextarea(base, '{"a": "x", "b": "y"}');
    setTextarea(target, "{}");
    act(() => {
      vi.advanceTimersByTime(400);
    });

    const copyButton = view.querySelector('[data-action="copy-missing"]');
    if (!copyButton) return;
    // Async act flushes the clipboard promise's .then() callback.
    await act(async () => {
      copyButton.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    });

    expect(writeText).toHaveBeenCalledWith("a\nb");
  });

  it("shows waiting guidance — not an error nudge — when a pane is simply empty", () => {
    vi.useFakeTimers();
    const view = mount(createElement(I18nKeyCheckerTool));
    const [base] = Array.from(view.querySelectorAll("textarea"));
    if (!base) return;
    setTextarea(base, '{"a": "x"}');
    act(() => {
      vi.advanceTimersByTime(400);
    });

    const empty = view.querySelector("[data-empty]");
    expect(empty?.textContent).toContain("Waiting for valid JSON");
    expect(empty?.textContent).toContain("coverage report appears");
    expect(empty?.textContent).not.toContain("Fix the highlighted");
  });

  it("says to fix the highlighted JSON only when a parse error exists", () => {
    vi.useFakeTimers();
    const view = mount(createElement(I18nKeyCheckerTool));
    const [base] = Array.from(view.querySelectorAll("textarea"));
    if (!base) return;
    setTextarea(base, "{ broken");
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(view.querySelector("[data-empty]")?.textContent).toContain("Fix the highlighted");
  });

  it("warns when two keys flatten to the same path", () => {
    vi.useFakeTimers();
    const view = mount(createElement(I18nKeyCheckerTool));
    const [base, target] = Array.from(view.querySelectorAll("textarea"));
    if (!base || !target) return;
    setTextarea(base, '{"a.b": 1, "a": {"b": 2}}');
    setTextarea(target, '{"a": {"b": 3}}');
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(view.querySelector('[data-tone="warn"]')?.textContent).toContain("a.b");
  });

  it("surfaces a visible failure when the clipboard rejects", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    Object.defineProperty(window.navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    const view = mount(createElement(I18nKeyCheckerTool));
    const [base, target] = Array.from(view.querySelectorAll("textarea"));
    if (!base || !target) return;
    setTextarea(base, '{"a": "x", "b": "y"}');
    setTextarea(target, "{}");
    act(() => {
      vi.advanceTimersByTime(400);
    });

    const copyButton = view.querySelector('[data-action="copy-missing"]');
    if (!copyButton) return;
    await act(async () => {
      copyButton.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    });
    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(
      Array.from(view.querySelectorAll('[role="alert"]')).some((el) =>
        el.textContent?.includes("Copy failed"),
      ),
    ).toBe(true);
  });

  it("keeps full coverage quiet — no issue groups on identical locales", () => {
    vi.useFakeTimers();
    const view = mount(createElement(I18nKeyCheckerTool));
    const [base, target] = Array.from(view.querySelectorAll("textarea"));
    if (!base || !target) return;
    setTextarea(base, '{"a": "x"}');
    setTextarea(target, '{"a": "y"}');
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(view.querySelector("[data-chip]")).toBeNull();
    expect(view.textContent).toContain("Full coverage");
  });
});

describe("PageView", () => {
  it("server-renders the CTA as a link and includes the noscript note", async () => {
    const { renderToStaticMarkup } = await import("react-dom/server");
    const { PageView } = await import("./page-view");
    const html = renderToStaticMarkup(createElement(PageView));
    expect(html).toContain("<noscript>");
    expect(html).toContain('href="https://supastack.dev"');
    expect(html).toContain('data-cta="tool-i18n"');
  });
});
