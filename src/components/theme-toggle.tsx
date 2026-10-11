"use client";

import { Moon, Sun } from "lucide-react";

import { SITE_THEME_STORAGE_KEY, type SiteTheme } from "../lib/theme";
import styles from "./theme-toggle.module.css";

/**
 * Dark/light toggle. Dark is the default; the choice persists in
 * localStorage and is applied pre-paint by the inline script in
 * `src/app/layout.tsx`. Writes `html[data-theme]` — the attribute the
 * globals.css light theme keys off (pack ids never go on <html>).
 */
export function ThemeToggle() {
  function toggle() {
    const next: SiteTheme =
      document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(SITE_THEME_STORAGE_KEY, next);
    } catch {
      // private mode / storage disabled — theme just won't persist
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle color theme"
      className={styles.toggle}
    >
      <Sun aria-hidden className={styles.iconLight} size={16} />
      <Moon aria-hidden className={styles.iconDark} size={16} />
    </button>
  );
}
