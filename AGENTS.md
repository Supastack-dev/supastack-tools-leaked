# supastack-tools — agent guide

Free, open-source browser tools for SaaS builders: a SaaS pricing table
generator, a Supabase RLS policy generator, an i18n locale key diff, and a
token-driven theme playground. **MIT licensed, public repo.** No server, no
database, no env vars — every tool runs client-side.

## Hard rules

- **No `@supastack/*` code.** This is a public repo. Do not import supastack
  packages and do not copy code from any supastack/starterkit repo beyond
  the tool files already here. (The README credits the source — that's
  attribution, not code reuse.)
- **Windows/Git Bash: never redirect to `NUL`.** Under bash, `cmd > NUL` or
  `2>NUL` creates a REAL file named `NUL` that Windows cannot delete. Use
  `/dev/null` instead. To remove an existing `NUL` file:
  `Remove-Item -LiteralPath '\\?\D:\path\to\NUL' -Force` (PowerShell).
- **Use `corepack pnpm`** for all package management (pnpm 11). Dependencies
  are pinned to exact versions in `package.json` — no floating `*`/`latest`.
- **Never commit `.env` or `data/`** — there is nothing to commit anyway;
  the site keeps no secrets.

## Commands

- `corepack pnpm install` — install dependencies
- `corepack pnpm dev` — dev server on :3000
- `corepack pnpm build` / `start` — production build / serve
- `corepack pnpm test` — vitest run (tests live beside each tool)
- `corepack pnpm lint` — eslint
- `corepack pnpm exec next typegen` — regenerate `.next/types` for tsc

## Layout

- `src/app/` — App Router pages/layouts (`/` hub + `/<tool-slug>` routes)
- `src/tools/<slug>/` — one folder per tool:
  - `logic.ts` — pure standard-library logic (no DOM/React), unit-tested
    by `logic.test.ts`
  - `copy.ts` — every user-facing string (English)
  - `tool.tsx` — the client component
  - `tool.module.css` — tool + page styles on shared design tokens
  - `page-view.tsx` — server-safe page composition (hero, tool, explainer,
    CTA)
- `src/theme/` — the theme token catalog + UI preset catalogs the
  playground repaints from; `packs.ts` renders them as subtree-scoped
  `[data-theme]` rules injected by the root layout
- `src/components/` — shared chrome (site header/footer, theme toggle,
  `FormSelect`, source links)

## Theming model

- The site itself is dark by default with a light `html[data-theme="light"]`
  option (`data-theme="dark"` is explicit); the toggle persists to
  `localStorage["supastack-tools-theme"]` and a boot script in
  `src/app/layout.tsx` applies it pre-paint.
- Theme packs paint **subtree** wrappers only (`[data-theme="<pack>"]:not(html)`)
  so the playground preview repaints without touching the page chrome. Do
  not define `--accent-fill*` tokens — `var(--accent-fill, var(--accent))`
  fallbacks must stay live so pack accents win inside previews.
- Tool CSS modules only consume `var(--*)` tokens — new tokens belong in
  `src/app/globals.css` for both dark and light.

## Style

CSS modules + design tokens; dark default, keyboard-complete,
`prefers-reduced-motion`-safe, usable at 320px and without JavaScript where
the tool allows it. lucide-react for icons only.
