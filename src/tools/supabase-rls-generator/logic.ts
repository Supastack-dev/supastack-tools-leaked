/**
 * Pure builder for Supabase/Postgres row-level-security SQL.
 *
 * Copy-paste correctness is the product: every identifier is validated
 * (`^[a-z_][a-z0-9_]*$`, max 63 chars) BEFORE rendering and emitted
 * double-quoted, so the output is always safe to paste into the SQL editor.
 * Invalid input returns field errors — the tool renders them inline rather
 * than emitting subtly wrong SQL (documented decision: block, don't escape).
 */

export type RlsOperation = "select" | "insert" | "update" | "delete";

export const RLS_OPERATIONS: readonly RlsOperation[] = ["select", "insert", "update", "delete"];

export type RlsPresetId = "owner" | "team" | "public-read" | "authenticated-read" | "locked-down";

export type RlsField =
  "table" | "schema" | "ownerColumn" | "membershipTable" | "workspaceColumn" | "memberColumn";

export type RlsFieldError = Readonly<{ field: RlsField; message: string }>;

export type RlsPreset = Readonly<{
  id: RlsPresetId;
  /** Policy-name suffix — `"posts_select_<token>"`. */
  token: string;
  label: string;
  summary: string;
  defaultOperations: readonly RlsOperation[];
  /** Fields that must be non-empty valid identifiers for this preset. */
  requiredFields: readonly RlsField[];
}>;

const BASE_FIELDS: readonly RlsField[] = ["table", "schema"];
const OWNER_FIELDS: readonly RlsField[] = [...BASE_FIELDS, "ownerColumn"];

export const RLS_PRESETS: readonly RlsPreset[] = [
  {
    id: "owner",
    token: "owner",
    label: "Owner only",
    summary: "Signed-in users can create, read, update and delete only their own rows.",
    defaultOperations: RLS_OPERATIONS,
    requiredFields: OWNER_FIELDS,
  },
  {
    id: "team",
    token: "team",
    label: "Team / workspace members",
    summary: "Members of the row's workspace can read — only the owner can write.",
    defaultOperations: RLS_OPERATIONS,
    requiredFields: [...OWNER_FIELDS, "membershipTable", "workspaceColumn", "memberColumn"],
  },
  {
    id: "public-read",
    token: "public",
    label: "Public read, owner write",
    summary: "Anyone can read — writes stay restricted to the row owner.",
    defaultOperations: RLS_OPERATIONS,
    requiredFields: OWNER_FIELDS,
  },
  {
    id: "authenticated-read",
    token: "authenticated",
    label: "Authenticated read, owner write",
    summary: "Every signed-in user can read — only the owner can write.",
    defaultOperations: RLS_OPERATIONS,
    requiredFields: OWNER_FIELDS,
  },
  {
    id: "locked-down",
    token: "locked",
    label: "Locked down (service role only)",
    summary: "RLS enabled with zero policies — only the service role reaches the table.",
    defaultOperations: [],
    requiredFields: BASE_FIELDS,
  },
];

/** Displayed defaults — the UI prefills them; logic defaults only schema/owner. */
export const RLS_DEFAULTS = {
  schema: "public",
  ownerColumn: "user_id",
  membershipTable: "workspace_membership",
  workspaceColumn: "workspace_id",
  memberColumn: "user_id",
} as const;

export type RlsInput = Readonly<{
  table: string;
  preset: RlsPresetId;
  schema?: string;
  ownerColumn?: string;
  /** Selected ops — defaults to the preset's set. Canonical order on output. */
  operations?: readonly RlsOperation[];
  membershipTable?: string;
  workspaceColumn?: string;
  memberColumn?: string;
}>;

export type RlsResult =
  | Readonly<{ ok: true; sql: string; statements: readonly string[] }>
  | Readonly<{ ok: false; errors: readonly RlsFieldError[] }>;

export const IDENTIFIER_PATTERN = /^[a-z_][a-z0-9_]*$/;
export const IDENTIFIER_MAX_LENGTH = 63;

/** Longest op name — derived so a new `RlsOperation` can't silently drift. */
const LONGEST_OP_LENGTH = Math.max(...RLS_OPERATIONS.map((op) => op.length));

export function isValidIdentifier(value: string): boolean {
  return value.length <= IDENTIFIER_MAX_LENGTH && IDENTIFIER_PATTERN.test(value);
}

export function getPreset(id: RlsPresetId): RlsPreset {
  const preset = RLS_PRESETS.find((candidate) => candidate.id === id);
  if (!preset) throw new Error(`Unknown RLS preset: ${id}`);
  return preset;
}

const FIELD_LABELS: Record<RlsField, string> = {
  table: "Table name",
  schema: "Schema",
  ownerColumn: "Owner column",
  membershipTable: "Membership table",
  workspaceColumn: "Workspace column",
  memberColumn: "Member column",
};

const IDENTIFIER_MESSAGE =
  "Use a lowercase Postgres identifier: a–z, 0–9 and _, starting with a letter or _ (max 63 chars).";

/** Quote a pre-validated identifier — the pattern excludes `"` already. */
function qi(identifier: string): string {
  return `"${identifier}"`;
}

function joinOr(items: readonly string[]): string {
  if (items.length <= 2) return items.join(" or ");
  return `${items.slice(0, -1).join(", ")} or ${items.at(-1) ?? ""}`;
}

function selectComment(presetId: RlsPresetId): string {
  switch (presetId) {
    case "owner":
      return "Select: signed-in users can only read rows they own.";
    case "team":
      return "Select: members can read rows in workspaces they belong to.";
    case "public-read":
      return "Select: public — anon and signed-in roles can read every row.";
    case "authenticated-read":
      return "Select: every signed-in user can read every row.";
    case "locked-down":
      // Unreachable — locked-down returns before any policy is built.
      throw new Error("locked-down emits no select policy");
    default: {
      const _exhaustive: never = presetId;
      return _exhaustive;
    }
  }
}

export function buildRlsSql(input: RlsInput): RlsResult {
  const preset = getPreset(input.preset);
  const values: Record<RlsField, string> = {
    table: input.table.trim(),
    schema: (input.schema ?? RLS_DEFAULTS.schema).trim(),
    ownerColumn: (input.ownerColumn ?? RLS_DEFAULTS.ownerColumn).trim(),
    membershipTable: (input.membershipTable ?? "").trim(),
    workspaceColumn: (input.workspaceColumn ?? "").trim(),
    memberColumn: (input.memberColumn ?? "").trim(),
  };

  const errors: RlsFieldError[] = preset.requiredFields.flatMap((field) => {
    const value = values[field];
    if (!value) {
      return [{ field, message: `${FIELD_LABELS[field]} is required for this preset.` }];
    }
    if (!isValidIdentifier(value)) return [{ field, message: IDENTIFIER_MESSAGE }];
    return [];
  });

  // Policy names are `"${table}_${op}_${token}"` — Postgres truncates
  // identifiers past 63 bytes, so an over-long table name would collapse
  // same-prefix policy names and fail mid-script on "already exists".
  // locked-down emits no policies, so the tighter budget skips it.
  if (preset.defaultOperations.length > 0 && isValidIdentifier(values.table)) {
    const policyNameSuffix = 2 + LONGEST_OP_LENGTH + preset.token.length;
    const maxTableLength = IDENTIFIER_MAX_LENGTH - policyNameSuffix;
    if (values.table.length > maxTableLength) {
      errors.push({
        field: "table",
        message:
          "Table name is too long for generated policy names (Postgres caps identifiers " +
          `at 63 bytes) — this preset needs ${maxTableLength} characters or fewer.`,
      });
    }
  }
  if (errors.length > 0) return { ok: false, errors };

  const relation = `${qi(values.schema)}.${qi(values.table)}`;
  const ownerCheck = `auth.uid() = ${qi(values.table)}.${qi(values.ownerColumn)}`;
  const membership = `${qi(values.schema)}.${qi(values.membershipTable)}`;

  const selectExpr =
    preset.id === "team"
      ? [
          "exists (",
          "  select 1",
          `  from ${membership} as "m"`,
          `  where "m".${qi(values.workspaceColumn)} = ${qi(values.table)}.${qi(values.workspaceColumn)}`,
          `    and "m".${qi(values.memberColumn)} = auth.uid()`,
          ")",
        ].join("\n")
      : preset.id === "owner"
        ? ownerCheck
        : "true";
  const selectRole = preset.id === "public-read" ? "anon, authenticated" : "authenticated";

  const header = [
    `-- Row-level security for ${relation} — preset: ${preset.label.toLowerCase()}.`,
    "-- Generated by the free RLS policy generator: https://github.com/Supastack-dev/supastack-tools",
    "-- Postgres ORs policies together: drop any existing policies on this table before re-applying.",
  ];
  if (preset.id === "team") {
    header.push(
      `-- Assumes ${qi(values.table)}.${qi(values.workspaceColumn)} groups rows by workspace and`,
      `-- ${membership} links ${qi(values.memberColumn)} to it. Keep the membership check`,
      `-- non-recursive: ${membership} policies must not subquery ${relation}.`,
    );
  } else if (preset.id === "locked-down") {
    header.push(
      "-- Locked down on purpose: no policies exist, so anon and authenticated are denied.",
      "-- The service_role key bypasses RLS entirely — keep it on the server only.",
    );
  } else {
    header.push(`-- Assumes ${relation}.${qi(values.ownerColumn)} references auth.users(id).`);
  }

  const alter = `alter table ${relation} enable row level security;`;

  if (preset.id === "locked-down") {
    return {
      ok: true,
      sql: [header.join("\n"), alter].join("\n\n"),
      statements: [alter],
    };
  }

  const selected = input.operations ?? preset.defaultOperations;
  const ops = RLS_OPERATIONS.filter((op) => selected.includes(op));

  const statements = [
    alter,
    ...ops.map((op) => {
      const lines = [
        `-- ${op === "select" ? selectComment(preset.id) : opComment(op, values.table, values.ownerColumn)}`,
        `create policy ${qi(`${values.table}_${op}_${preset.token}`)}`,
        `on ${relation}`,
        `for ${op} to ${op === "select" ? selectRole : "authenticated"}`,
      ];
      if (op === "select") lines.push(`using (${selectExpr})`);
      if (op === "insert") lines.push(`with check (${ownerCheck})`);
      if (op === "update") lines.push(`using (${ownerCheck})`, `with check (${ownerCheck})`);
      if (op === "delete") lines.push(`using (${ownerCheck})`);
      return `${lines.join("\n")};`;
    }),
  ];

  const omitted = RLS_OPERATIONS.filter((op) => !ops.includes(op));
  const footer =
    omitted.length === RLS_OPERATIONS.length
      ? "-- Every operation is deselected — RLS stays enabled with no policies, so all non-service access is denied."
      : omitted.length > 0
        ? `-- Deselected: no ${joinOr(omitted)} policy — non-service roles can't ${joinOr(omitted)} rows.`
        : undefined;

  return {
    ok: true,
    sql: [header.join("\n"), ...statements, ...(footer ? [footer] : [])].join("\n\n"),
    statements,
  };
}

function opComment(
  op: Exclude<RlsOperation, "select">,
  table: string,
  ownerColumn: string,
): string {
  switch (op) {
    case "insert":
      return `Insert: new rows must set ${qi(table)}.${qi(ownerColumn)} to the caller.`;
    case "update":
      return "Update: only the owner can change a row — ownership can't be moved.";
    case "delete":
      return "Delete: only the owner can remove a row.";
    default: {
      const _exhaustive: never = op;
      return _exhaustive;
    }
  }
}
