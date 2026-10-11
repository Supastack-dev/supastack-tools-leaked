import { Languages, Palette, ShieldCheck, Tags, type LucideIcon } from "lucide-react";

/**
 * Registry for the / hub — the single place a new tool registers. The hub
 * renders straight from this list, so a tool never has to be imported into
 * the hub page (keeps tool bundles out of the index route).
 */
export type ToolEntry = {
  /** URL-safe slug — also the route segment and the source folder name. */
  slug: string;
  /** Root-relative path — `/${slug}`. */
  href: string;
  title: string;
  /** One-line outcome shown on the hub card. */
  tagline: string;
  icon: LucideIcon;
};

export const TOOLS: readonly ToolEntry[] = [
  {
    slug: "saas-pricing-generator",
    href: "/saas-pricing-generator",
    title: "SaaS Pricing Page Generator",
    tagline: "Design a pricing table that converts — tiers, annual discounts, featured plan.",
    icon: Tags,
  },
  {
    slug: "supabase-rls-generator",
    href: "/supabase-rls-generator",
    title: "Supabase RLS Policy Generator",
    tagline: "Answer a few questions, get ready-to-run row level security SQL.",
    icon: ShieldCheck,
  },
  {
    slug: "i18n-key-checker",
    href: "/i18n-key-checker",
    title: "i18n Key Checker",
    tagline: "Diff two locale JSON files and find missing or extra translation keys.",
    icon: Languages,
  },
  {
    slug: "theme-playground",
    href: "/theme-playground",
    title: "Theme Playground",
    tagline: "Preview every supastack theme pack and preset on a live interface.",
    icon: Palette,
  },
];
