import { THEME_CATALOG } from "../../theme/catalog";

const PACK_COUNT = THEME_CATALOG.length;

export const copy = {
  toolName: "theme playground",
  metaTitle: "Theme playground — preview every supastack color pack live",
  metaDescription: `Audition all ${PACK_COUNT} supastack color packs plus the density, radius, and font axes on a live mini-dashboard. Token-driven theming, repainted by one data-theme attribute — free, no signup.`,
  heroKicker: "Free tool",
  heroTitle: `Try all ${PACK_COUNT} supastack themes on a live dashboard`,
  heroLede:
    "Pick a pack, flip the density, radius, and font axes, and watch a real product shell repaint itself — powered by a small set of shared CSS tokens.",
  packGroupLabel: "Color packs",
  packGroupAria: "Color pack",
  axisLabels: {
    density: "Density",
    radius: "Radius",
    font: "Font",
  },
  preview: {
    url: "acme.supastack.app",
    brand: "Acme",
    workspace: "Workspace",
    nav: ["Overview", "Analytics", "Customers", "Billing", "Settings"],
    user: "ava@acme.dev",
    searchPlaceholder: "Search or jump to…",
    searchShortcut: "⌘K",
    newReport: "New report",
    stats: [
      { label: "MRR", value: "$24.8k", delta: "+12.4%" },
      { label: "Active users", value: "8,412", delta: "+3.1%" },
      { label: "Churn", value: "1.9%", delta: "-0.4%" },
    ],
    chartTitle: "Revenue",
    chartLegend: ["MRR", "Costs"],
    chartBars: [34, 44, 38, 56, 49, 66, 58, 74, 69, 88, 80, 97],
    chartMonths: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
    tableTitle: "Recent customers",
    table: [
      { name: "Iris Okafor", plan: "Scale", status: "Active", mrr: "$249" },
      { name: "Theo Lindqvist", plan: "Solo", status: "Trialing", mrr: "$29" },
      { name: "Mara Reyes", plan: "Team", status: "Active", mrr: "$99" },
      { name: "Jonas Weber", plan: "Solo", status: "Paused", mrr: "$0" },
    ],
    invitePlaceholder: "Invite teammate by email",
    sendInvite: "Send invite",
    cancel: "Cancel",
    digest: "Weekly digest",
    navAria: "Preview navigation",
  },
  status: {
    schemeDark: "Dark",
    schemeLight: "Light",
    copyLabel: "Copy pack attribute",
    copiedLabel: "Copied",
  },
  explainer: {
    heading: "Token-driven themes, not one-off skins",
    paragraphs: [
      "Every surface in the preview reads the same small set of CSS custom properties — page, section, raised surfaces, text, muted ink, borders, one accent, and the ink that sits on top of it. A color pack is just twelve values for those tokens plus a color-scheme flag, so swapping packs repaints every button, card, nav item, and chart at once. Nothing in the dashboard above hardcodes a color.",
      "Packs travel as data, not stylesheets. Pin one on any wrapper with a single data-theme attribute — the preview on this page uses exactly that mechanism, scoped to its own frame, which is why the dashboard can show Wine while the page around it keeps your own theme. The density, radius, and font chips are three UI preset axes; they ride alongside the pack, so compact + sharp + mono is one attribute each.",
      `All ${PACK_COUNT} packs live in this repo — dark Obsidian, Midnight, Pine, and friends through light Paper, Glacier, and Blossom. Name one on any wrapper and the whole subtree restyles.`,
    ],
  },
  ctaTitle: "Star it or send a pull request",
  ctaBody:
    "The playground and every pack it renders are MIT-licensed open source — fork the repo, file an issue, or contribute a pack of your own.",
  ctaButton: "View on GitHub",
} as const;
