import type { PlatformId } from "./logic";

export const buildCostCopy = {
  metaTitle: "SaaS build cost calculator — DIY vs starter kit",
  metaDescription:
    "Estimate the hours and money a from-scratch build costs vs starting from pre-wired modules: auth, billing, database, teams, jobs, email, storage, i18n, admin, and mobile/desktop.",
  eyebrow: "Free tool",
  h1: "SaaS build cost calculator",
  lead:
    "Pick the modules your product needs and the platforms you ship. See the hours and money a from-scratch build actually costs, and what the same scope costs on top of pre-wired modules.",
  nojsNote: "The calculator needs JavaScript, the module hour estimates below stay readable.",
  controls: {
    heading: "Your build",
    rate: "Hourly rate (USD)",
    rateHelp: "Your time, or your contractor's.",
    platforms: "Platforms",
    platformHelp: "Each extra platform adds integration work.",
    modules: "Modules",
    modulesHelp: "Only count what you'd actually build.",
  },
  moduleNames: {
    auth: "Auth & sessions",
    billing: "Payments & billing",
    database: "Database & ORM",
    workspaces: "Workspaces & teams",
    jobs: "Background jobs",
    email: "Transactional email",
    storage: "File storage",
    i18n: "i18n (13 locales)",
    admin: "Admin panel",
    observability: "Observability",
    marketing: "Marketing site",
    config: "Env & config",
  } as Readonly<Record<string, string>>,
  platformNames: {
    web: "Next.js (Web)",
    tanstack: "TanStack Start",
    mobile: "Mobile app (Expo)",
    desktop: "Desktop app (Tauri)",
  } as Readonly<Record<PlatformId, string>>,
  results: {
    heading: "Estimated build",
    diy: "From scratch",
    kit: "With supastack",
    saved: "You save",
    hoursUnit: "h",
    weeksUnit: "wks",
    savedLine: "{hours} hours ≈ {cost} saved",
  },
  table: {
    heading: "Hours by module",
    module: "Module",
    diy: "DIY",
    kit: "Kit",
    saved: "Saved",
  },
  sections: [
    {
      id: "estimates",
      title: "Where the estimates come from",
      paragraphs: [
        "DIY hours reflect designing, building, and testing each module correctly from scratch: auth with sessions and OAuth, billing with an idempotent webhook ledger and customer portal, multi-tenant workspaces with RLS, localized transactional mail, background queues, and file uploads.",
        "Kit hours represent configure-and-verify time, because pre-wired starter kits already have these modules integrated and tested together. The baseline assumes a competent full-stack developer working with modern tooling.",
      ],
    },
    {
      id: "platforms",
      title: "Cross-platform overhead",
      paragraphs: [
        "Shipping across web, mobile, and desktop multiplies frontend and integration surface area. Native mobile apps (React Native / Expo) require deep linking, secure device storage, offline caches, and push notifications.",
        "Desktop apps (Tauri) require native OS wrappers, updater pipelines, secure storage, and menu bars. Pre-wired kits share auth and API contracts across all platforms out of the box.",
      ],
    },
  ],
  cta: {
    title: "Open source and built for speed",
    body: "This calculator is open source under MIT. Check out the source code, open an issue, or contribute improvements on GitHub.",
    button: "View on GitHub",
  },
};
