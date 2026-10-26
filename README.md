# supastack-tools

**Free, open-source tools for SaaS builders.**

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/Supastack-dev/supastack-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/Supastack-dev/supastack-tools/actions/workflows/ci.yml)

Single-purpose browser utilities for the jobs every SaaS rebuilds: pricing
pages, row level security, translation coverage, and theming. Everything
runs in your browser — nothing is uploaded, nothing is gated.

> **These are extracts.** The full supastack SaaS starter kit lives at
> **[supastack.dev](https://supastack.dev)** — see
> [Where these tools come from](#where-these-tools-come-from).

## The tools

### [SaaS Pricing Page Generator](./src/tools/saas-pricing-generator)

Design a pricing table that converts, watching it render exactly as
customers will see it.

- Up to four tiers with monthly and annual pricing — annual defaults to
  the ten-months-for-twelve convention, with a save-% badge computed per
  tier.
- A featured plan, per-tier tagline and CTA text, and feature lists that
  include visibly excluded (`-`-prefixed) features.
- Reorder and duplicate tiers; 10 currencies formatted with correct minor
  units.
- Export the config JSON or a GitHub-ready markdown comparison table, and
  share the exact editor state via a URL hash.

### [Supabase RLS Policy Generator](./src/tools/supabase-rls-generator)

Pick an access preset, toggle the operations, and get ready-to-run row
level security SQL.

- Seven presets: owner-only, team member read, team member read & write,
  public read, authenticated read, public insert (lead capture), and
  locked down.
- Per-operation select/insert/update/delete toggles, plus optional
  `FORCE ROW LEVEL SECURITY` and `DROP POLICY IF EXISTS` so scripts are
  safe to re-run.
- Commented, syntax-highlighted SQL — copy it or download it as `.sql`.
- Every identifier is validated as a lowercase Postgres identifier and
  emitted double-quoted, so the output is always safe to paste into the
  Supabase SQL editor.

### [i18n Key Checker](./src/tools/i18n-key-checker)

Paste or open two locale JSON files and see exactly where the translation
drifted before users do.

- Reports missing keys, extra keys, type mismatches, empty translations,
  strings identical to the base (untranslated), dropped
  `{placeholder}`/`{{var}}`/ICU variables, and array-length drift.
- Coverage percentage and a key filter; copy the missing-key list, copy
  or download a nested translator-stub JSON, or download a markdown
  report.
- ICU-aware placeholder parsing, with warnings when two entries flatten
  to the same key.

### [Theme Playground](./src/tools/theme-playground)

Audition every supastack theme on a live mini-dashboard — every surface
reads shared CSS tokens, so one attribute repaints the whole product.

- 12 token-driven color packs plus density, radius, and font axes.
- Subtree-scoped `data-theme` preview — the pack repaints the demo app,
  not the page around it.
- Filter packs, then copy the pack's attribute snippet or its CSS
  variables.

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

These tools are extracts, not demos built for show — they run as the free
tools on supastack.dev and are built with the same patterns as the
supastack SaaS starter kit. **The full kit lives at
[supastack.dev](https://supastack.dev)**: auth, billing, database, AI,
jobs, and everything else a SaaS needs.

The storefront analytics hooks were removed for this repo; everything else
is the real tool code.

## License

[MIT](LICENSE) — © supastack-tools contributors.
