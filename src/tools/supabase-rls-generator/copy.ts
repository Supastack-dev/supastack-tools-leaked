export const copy = {
  metaTitle: "Supabase RLS policy generator — secure your tables in seconds",
  metaDescription:
    "Generate copy-paste-ready Supabase row-level security policies — pick an access preset, toggle operations, and ship correct, commented SQL for Postgres.",
  hero: {
    eyebrow: "Free developer tool",
    lede: "Pick how your table should be guarded, toggle the operations, and copy production-ready row-level security SQL — commented, quoted, and ready for the Supabase SQL editor.",
  },
  tool: {
    controlsTitle: "Configure the policies",
    presetLabel: "Access preset",
    tableLabel: "Table name",
    schemaLabel: "Schema",
    ownerColumnLabel: "Owner column",
    teamTitle: "Membership wiring",
    membershipTableLabel: "Membership table",
    workspaceColumnLabel: "Workspace column",
    memberColumnLabel: "Member user column",
    operationsLabel: "Operations to cover",
    outputTitle: "Your SQL",
    copyLabel: "Copy SQL",
    copiedLabel: "Copied",
    failedLabel: "Copy failed — select the SQL and copy it manually",
    statementCount: (count: number) => `${count} statement${count === 1 ? "" : "s"}`,
    invalidTitle: "Fix the highlighted fields to generate your SQL.",
    invalidBody:
      "Postgres identifiers are lowercase snake_case — letters, digits and underscores, starting with a letter or underscore.",
    lockedNote: "Operation toggles don't apply here — locked-down means no policies at all.",
    nojsNote:
      "The live generator needs JavaScript. The default owner-only policies above and the guidance below still apply.",
  },
  explainer: {
    title: "What row-level security actually does",
    paragraphs: [
      "Row-level security is Postgres's built-in answer to “who can touch which row”. Once you run `enable row level security`, every non-service role is denied by default and each `create policy` statement carves back exactly one allowance — a `using` expression filters the rows an operation can see, and `with check` validates the rows it writes. In Supabase, `auth.uid()` inside a policy resolves to the signed-in user's id, so “my rows only” is one comparison.",
      "That default-deny posture is why policies matter more than app-level filters: a missing `where` clause in your code leaks data, but a missing policy leaks nothing. The presets above cover the shapes teams actually ship — owner-scoped CRUD, workspace membership reads, public or authenticated reads with owner-only writes, and full lockdown for tables only the service role should touch.",
    ],
    presetsTitle: "The five access presets",
    presetsOutro:
      "Every generated block enables RLS first and names policies `table_operation_preset`, so re-running the generator produces predictable, reviewable migrations.",
  },
  cta: {
    title: "Star it or send a pull request",
    body: "The generator is MIT-licensed open source — fork the repo, file an issue, or contribute a preset the community is missing.",
    button: "View on GitHub",
  },
} as const;
