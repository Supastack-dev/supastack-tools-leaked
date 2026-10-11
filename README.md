# supastack-tools

**Free, open-source tools for SaaS builders.**

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/Supastack-dev/supastack-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/Supastack-dev/supastack-tools/actions/workflows/ci.yml)

Single-purpose browser utilities for the jobs every SaaS rebuilds: pricing
pages, row level security, translation coverage, and theming. Everything
runs in your browser — nothing is uploaded, nothing is gated.

## The tools

### [SaaS Pricing Page Generator](./src/tools/saas-pricing-generator)

Design a pricing table that converts — up to four tiers, monthly and annual
pricing with the ten-months-for-twelve convention, a featured plan, and
per-tier feature lists. Watch the table render exactly as customers will see
it, then copy the config JSON (prices, computed savings, and the featured
flag) into your own pricing page.

### [Supabase RLS Policy Generator](./src/tools/supabase-rls-generator)

Answer a few questions about how a table should be guarded — owner-only,
team/workspace, public or authenticated read, or full lockdown — and get
ready-to-run, commented row-level security SQL. Every identifier is
validated as a lowercase Postgres identifier and emitted double-quoted, so
the output is always safe to paste into the Supabase SQL editor.

### [i18n Key Checker](./src/tools/i18n-key-checker)

Paste two locale JSON files and instantly see missing keys, extra keys, type
mismatches, empty translations, dropped `{placeholder}` variables (ICU-aware),
and array-length drift. The diff runs entirely in the browser — copy the
missing-key list straight into your translation workflow.

### [Theme Playground](./src/tools/theme-playground)

Preview twelve token-driven color packs plus the density, radius, and font
axes on a live mini-dashboard. Every surface reads CSS custom properties, so
a single `data-theme` attribute repaints the whole product — click "copy
pack attribute" to grab the snippet.

## Quickstart

```bash
corepack pnpm install
corepack pnpm dev        # http://localhost:3000
```

That's it — no env vars, no database, no signup.

## Development

```bash
corepack pnpm install        # deps (pinned exact; pnpm 11 via corepack)
corepack pnpm dev            # dev server
corepack pnpm test           # vitest — logic tests live beside each tool
corepack pnpm lint           # eslint
corepack pnpm build          # production build
```

Stack: Next.js 16 (App Router) · React 19 · TypeScript strict · CSS modules ·
vitest. Source lives under `src/` — each tool in `src/tools/<slug>/` is a
self-contained `logic.ts` (pure, unit-tested), `copy.ts` (all user-facing
strings), and `tool.tsx` (client component), composed by `page-view.tsx` and
routed from `src/app/<slug>/page.tsx`. The theme token catalogs the
playground renders live in `src/theme/`.

CI (`.github/workflows/ci.yml`) runs install → lint → typegen → typecheck →
test → build on pushes and PRs.

## Where these tools come from

Extracted from the free tools on [supastack.dev](https://supastack.dev) —
built with the same patterns as supastack. The storefront analytics hooks
were removed; everything else is the real tool code.

## License

[MIT](LICENSE) — © supastack-tools contributors.
