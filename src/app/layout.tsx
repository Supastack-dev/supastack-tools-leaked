import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";
import { SITE_THEME_STORAGE_KEY } from "../lib/theme";
import { packStylesheet } from "../theme/packs";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "supastack-tools — free, open-source tools for SaaS builders",
    template: "%s · supastack-tools",
  },
  description:
    "Free browser tools for SaaS builders: a pricing page generator, a Supabase RLS policy generator, an i18n key checker, and a live theme playground. Open source, MIT licensed.",
};

export const viewport: Viewport = {
  colorScheme: "dark light",
};

/**
 * Pre-paint theme boot: reads the persisted site pick and stamps
 * html[data-theme="light"] before first paint so a light-mode visitor never
 * sees a dark flash. Mirrors src/components/theme-toggle.tsx.
 */
const themeBoot = `(function(){try{var t=localStorage.getItem(${JSON.stringify(SITE_THEME_STORAGE_KEY)});if(t==="light"){document.documentElement.setAttribute("data-theme","light");document.documentElement.style.colorScheme="light";}}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
        {/* Theme packs as subtree rules — powers the playground's [data-theme] preview. */}
        <style dangerouslySetInnerHTML={{ __html: packStylesheet() }} />
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
