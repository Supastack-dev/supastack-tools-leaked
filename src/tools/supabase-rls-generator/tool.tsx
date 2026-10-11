"use client";

import { Check, Copy, FileCode, Lock, SlidersHorizontal, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { FormSelect } from "../../components/form-select";
import { copy } from "./copy";
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

type CopyState = "idle" | "copied" | "failed";

/** Menu labels come straight from the preset registry — they can't drift. */
const PRESET_OPTIONS: ReadonlyArray<{ value: RlsPresetId; label: string }> =
  RLS_PRESETS.map((preset) => ({ value: preset.id, label: preset.label }));

async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the textarea path (permissions policy, older engines).
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

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
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const copyTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  const preset = getPreset(presetId);
  const locked = presetId === "locked-down";
  const result = buildRlsSql({
    table,
    preset: presetId,
    schema,
    ownerColumn,
    operations,
    membershipTable,
    workspaceColumn,
    memberColumn,
  });
  const fieldError = (field: RlsField): string | undefined =>
    result.ok ? undefined : result.errors.find((error) => error.field === field)?.message;

  function applyPreset(next: RlsPresetId) {
    if (next === presetId) return;
    setPresetId(next);
    setOperations(getPreset(next).defaultOperations);
  }

  function toggleOp(op: RlsOperation) {
    const enabled = !operations.includes(op);
    setOperations((prev) => (enabled ? [...prev, op] : prev.filter((item) => item !== op)));
  }

  async function onCopy() {
    if (!result.ok) return;
    const ok = await writeClipboard(result.sql);
    setCopyState(ok ? "copied" : "failed");
    if (!ok) return;
    window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopyState("idle"), 1600);
  }

  return (
    <div className={styles.tool}>
      <section aria-labelledby="rls-controls" className={styles.panel}>
        <div className={styles.panelHead}>
          <SlidersHorizontal aria-hidden />
          <h2 id="rls-controls">{copy.tool.controlsTitle}</h2>
        </div>
        <div className={styles.fields}>
          <div className={styles.field}>
            <span className={styles.label}>{copy.tool.presetLabel}</span>
            <FormSelect<RlsPresetId>
              defaultValue={presetId}
              label={copy.tool.presetLabel}
              name="preset"
              nativeClassName={styles.selectNative}
              onValueChange={applyPreset}
              options={PRESET_OPTIONS}
              pickerClassName={styles.selectPicker}
              triggerClassName={styles.selectTrigger}
            />
            <p className={styles.fieldHint} data-tone="muted">
              {preset.summary}
            </p>
          </div>

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

          {!locked && (
            <Field
              error={fieldError("ownerColumn")}
              id="rls-owner"
              label={copy.tool.ownerColumnLabel}
              onChange={setOwnerColumn}
              value={ownerColumn}
            />
          )}

          {presetId === "team" && (
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

          <fieldset className={styles.ops}>
            <legend>{copy.tool.operationsLabel}</legend>
            <div className={styles.opRow}>
              {RLS_OPERATIONS.map((op) => (
                <label className={styles.op} key={op}>
                  <input
                    checked={operations.includes(op)}
                    disabled={locked}
                    onChange={() => toggleOp(op)}
                    type="checkbox"
                  />
                  {op}
                </label>
              ))}
            </div>
            {locked && (
              <p className={styles.lockNote}>
                <Lock aria-hidden />
                {copy.tool.lockedNote}
              </p>
            )}
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
            data-state={copyState}
            disabled={!result.ok}
            onClick={() => {
              void onCopy();
            }}
            type="button"
          >
            {copyState === "copied" ? <Check aria-hidden /> : <Copy aria-hidden />}
            {copyState === "copied" ? copy.tool.copiedLabel : copy.tool.copyLabel}
          </button>
          <span aria-live="polite" className={styles.srOnly}>
            {copyState === "copied"
              ? copy.tool.copiedLabel
              : copyState === "failed"
                ? copy.tool.failedLabel
                : ""}
          </span>
        </div>
        {result.ok ? (
          <div className={styles.codeScroll}>
            <div className={styles.code} role="code">
              {result.sql.split("\n").map((line, index) => (
                <div
                  className={styles.codeLine}
                  data-comment={line.startsWith("--") || undefined}
                  // Lines shift with input — index is the stable frame here.
                  key={index}
                >
                  <span>{line === "" ? " " : line}</span>
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
        {copyState === "failed" ? (
          <p className={styles.copyFail} role="alert">
            {copy.tool.failedLabel}
          </p>
        ) : null}
      </section>
    </div>
  );
}
