"use client";

import {
  Check,
  Copy,
  Download,
  FileCode,
  Globe,
  Inbox,
  KeyRound,
  Lock,
  SlidersHorizontal,
  TriangleAlert,
  UserRound,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

import { downloadText } from "../../lib/download";
import { useCopyState } from "../../lib/use-copy-state";
import { copy } from "./copy";
import { highlightSql } from "./highlight";
import {
  buildRlsSql,
  getPreset,
  RLS_DEFAULTS,
  RLS_OPERATIONS,
  RLS_PRESETS,
  type RlsField,
  type RlsOperation,
  type RlsPresetId,
} from "./logic";
import styles from "./tool.module.css";

const PRESET_ICONS: Record<RlsPresetId, LucideIcon> = {
  owner: UserRound,
  team: Users,
  "team-write": UsersRound,
  "public-read": Globe,
  "authenticated-read": KeyRound,
  "public-insert": Inbox,
  "locked-down": Lock,
};

function Field({
  error,
  id,
  label,
  onChange,
  value,
}: Readonly<{
  error?: string | undefined;
  id: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}>) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <input
        aria-describedby={error ? `${id}-hint` : undefined}
        aria-invalid={error ? true : undefined}
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
        className={styles.input}
        id={id}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        value={value}
      />
      {error ? (
        <p className={styles.fieldHint} id={`${id}-hint`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function RlsGeneratorTool() {
  const [presetId, setPresetId] = useState<RlsPresetId>("owner");
  const [table, setTable] = useState("posts");
  const [schema, setSchema] = useState<string>(RLS_DEFAULTS.schema);
  const [ownerColumn, setOwnerColumn] = useState<string>(RLS_DEFAULTS.ownerColumn);
  const [membershipTable, setMembershipTable] = useState<string>(RLS_DEFAULTS.membershipTable);
  const [workspaceColumn, setWorkspaceColumn] = useState<string>(RLS_DEFAULTS.workspaceColumn);
  const [memberColumn, setMemberColumn] = useState<string>(RLS_DEFAULTS.memberColumn);
  const [operations, setOperations] = useState<readonly RlsOperation[]>(RLS_OPERATIONS);
  const [force, setForce] = useState(true);
  const [dropExisting, setDropExisting] = useState(false);
  const copyState = useCopyState(1600);

  const preset = getPreset(presetId);
  const locked = presetId === "locked-down";
  const needsOwner = preset.requiredFields.includes("ownerColumn");
  const result = buildRlsSql({
    table,
    preset: presetId,
    schema,
    ownerColumn,
    operations,
    membershipTable,
    workspaceColumn,
    memberColumn,
    force,
    dropExisting,
  });
  const fieldError = (field: RlsField): string | undefined =>
    result.ok ? undefined : result.errors.find((error) => error.field === field)?.message;

  function applyPreset(next: RlsPresetId) {
    if (next === presetId) return;
    setPresetId(next);
    setOperations(getPreset(next).defaultOperations);
  }

  function toggleOp(op: RlsOperation) {
    if (!preset.allowedOperations.includes(op)) return;
    const enabled = !operations.includes(op);
    setOperations((prev) => (enabled ? [...prev, op] : prev.filter((item) => item !== op)));
  }

  function downloadSql() {
    if (!result.ok) return;
    const name = table.trim() || "table";
    downloadText(`rls_${name}_${presetId}.sql`, result.sql, "application/sql");
  }

  const blockedOps = RLS_OPERATIONS.filter((op) => !preset.allowedOperations.includes(op));

  return (
    <div className={styles.tool}>
      <section aria-labelledby="rls-controls" className={styles.panel}>
        <div className={styles.panelHead}>
          <SlidersHorizontal aria-hidden />
          <h2 id="rls-controls">{copy.tool.controlsTitle}</h2>
        </div>
        <div className={styles.fields}>
          <fieldset className={styles.ops}>
            <legend>{copy.tool.presetLabel}</legend>
            <div className={styles.presetList}>
              {RLS_PRESETS.map((entry) => {
                const Icon = PRESET_ICONS[entry.id];
                return (
                  <label className={styles.presetCard} key={entry.id}>
                    <input
                      checked={presetId === entry.id}
                      name="rls-preset"
                      onChange={() => applyPreset(entry.id)}
                      type="radio"
                    />
                    <Icon aria-hidden />
                    <span className={styles.presetText}>
                      <strong>{entry.label}</strong>
                      <span>{entry.summary}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className={styles.fieldRow}>
            <Field
              error={fieldError("table")}
              id="rls-table"
              label={copy.tool.tableLabel}
              onChange={setTable}
              value={table}
            />
            <Field
              error={fieldError("schema")}
              id="rls-schema"
              label={copy.tool.schemaLabel}
              onChange={setSchema}
              value={schema}
            />
          </div>

          {needsOwner && (
            <Field
              error={fieldError("ownerColumn")}
              id="rls-owner"
              label={copy.tool.ownerColumnLabel}
              onChange={setOwnerColumn}
              value={ownerColumn}
            />
          )}

          {(presetId === "team" || presetId === "team-write") && (
            <div className={styles.teamFields}>
              <p className={styles.teamFieldsTitle}>{copy.tool.teamTitle}</p>
              <Field
                error={fieldError("membershipTable")}
                id="rls-membership"
                label={copy.tool.membershipTableLabel}
                onChange={setMembershipTable}
                value={membershipTable}
              />
              <div className={styles.fieldRow}>
                <Field
                  error={fieldError("workspaceColumn")}
                  id="rls-workspace"
                  label={copy.tool.workspaceColumnLabel}
                  onChange={setWorkspaceColumn}
                  value={workspaceColumn}
                />
                <Field
                  error={fieldError("memberColumn")}
                  id="rls-member"
                  label={copy.tool.memberColumnLabel}
                  onChange={setMemberColumn}
                  value={memberColumn}
                />
              </div>
            </div>
          )}

          {!locked && (
            <fieldset className={styles.ops}>
              <legend>{copy.tool.operationsLabel}</legend>
              <div className={styles.opRow}>
                {RLS_OPERATIONS.map((op) => {
                  const allowed = preset.allowedOperations.includes(op);
                  return (
                    <label
                      className={styles.op}
                      data-blocked={!allowed || undefined}
                      key={op}
                      title={allowed ? undefined : copy.tool.opBlockedHint}
                    >
                      <input
                        checked={allowed && operations.includes(op)}
                        disabled={!allowed}
                        onChange={() => toggleOp(op)}
                        type="checkbox"
                      />
                      {op}
                    </label>
                  );
                })}
              </div>
              {blockedOps.length > 0 && (
                <p className={styles.lockNote}>
                  <Lock aria-hidden />
                  {copy.tool.opsBlockedNote}
                </p>
              )}
            </fieldset>
          )}

          <fieldset className={styles.ops}>
            <legend>{copy.tool.advancedLabel}</legend>
            <div className={styles.advList}>
              <label className={styles.adv}>
                <input
                  checked={force}
                  onChange={(event) => setForce(event.target.checked)}
                  type="checkbox"
                />
                <span>
                  <strong>{copy.tool.forceLabel}</strong>
                  {copy.tool.forceHint}
                </span>
              </label>
              <label className={styles.adv}>
                <input
                  checked={dropExisting}
                  onChange={(event) => setDropExisting(event.target.checked)}
                  type="checkbox"
                />
                <span>
                  <strong>{copy.tool.dropLabel}</strong>
                  {copy.tool.dropHint}
                </span>
              </label>
            </div>
          </fieldset>
        </div>
      </section>

      <section aria-labelledby="rls-output" className={`${styles.panel} ${styles.outputPanel}`}>
        <div className={styles.panelHead}>
          <FileCode aria-hidden />
          <h2 id="rls-output">{copy.tool.outputTitle}</h2>
          <span className={styles.spacer} />
          {result.ok && (
            <span className={styles.count}>
              {copy.tool.statementCount(result.statements.length)}
            </span>
          )}
          <button
            className={styles.copyBtn}
            disabled={!result.ok}
            onClick={downloadSql}
            title={copy.tool.downloadLabel}
            type="button"
          >
            <Download aria-hidden />
            <span className={styles.copyBtnLabel}>{copy.tool.downloadLabel}</span>
          </button>
          <button
            className={styles.copyBtn}
            data-state={copyState.state}
            disabled={!result.ok}
            onClick={() => {
              if (result.ok) void copyState.copy(result.sql);
            }}
            type="button"
          >
            {copyState.state === "copied" ? <Check aria-hidden /> : <Copy aria-hidden />}
            {copyState.state === "copied" ? copy.tool.copiedLabel : copy.tool.copyLabel}
          </button>
          <span aria-live="polite" className={styles.srOnly}>
            {copyState.state === "copied"
              ? copy.tool.copiedLabel
              : copyState.state === "failed"
                ? copy.tool.failedLabel
                : ""}
          </span>
        </div>
        {result.ok ? (
          <div className={styles.codeScroll}>
            <div className={styles.code} role="code">
              {highlightSql(result.sql).map((tokens, index) => (
                <div className={styles.codeLine} key={index}>
                  <span>
                    {tokens.length === 0
                      ? " "
                      : tokens.map((token, t) => (
                          <span data-hl={token.kind} key={t}>
                            {token.text}
                          </span>
                        ))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.notice} role="status">
            <TriangleAlert aria-hidden />
            <div>
              <strong>{copy.tool.invalidTitle}</strong>
              {copy.tool.invalidBody}
            </div>
          </div>
        )}
        {copyState.state === "failed" ? (
          <p className={styles.copyFail} role="alert">
            {copy.tool.failedLabel}
          </p>
        ) : null}
      </section>
    </div>
  );
}
