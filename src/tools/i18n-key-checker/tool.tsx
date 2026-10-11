"use client";

import {
  Braces,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Copy,
  Eraser,
  FileDiff,
  Languages,
  ListPlus,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { copy, examplePair } from "./copy";
import {
  diffLocales,
  flattenLocale,
  parseLocaleJson,
  type FlattenedEntry,
  type FlattenedLocale,
  type LocaleDiff,
} from "./logic";
import styles from "./tool.module.css";

const DEBOUNCE_MS = 300;
const COPY_RESET_MS = 1600;

type Side =
  | Readonly<{ status: "empty" }>
  | Readonly<{ status: "error"; message: string }>
  | Readonly<{ status: "ok"; map: FlattenedLocale; count: number; collisions: string[] }>;

function parseSide(raw: string): Side {
  if (raw.trim() === "") return { status: "empty" };
  const parsed = parseLocaleJson(raw);
  if (!parsed.ok) return { status: "error", message: parsed.message };
  const collisions: string[] = [];
  const map = flattenLocale(parsed.value, "", collisions);
  return { status: "ok", map, count: map.size, collisions };
}

function displayKey(key: string): string {
  return key === "" ? "(root)" : key;
}

function truncate(text: string, max = 48): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function preview(entry: FlattenedEntry, max = 48): string {
  if (entry.type === "string") return JSON.stringify(truncate(entry.value as string, max));
  if (entry.type === "array") return `array · ${(entry.value as unknown[]).length} items`;
  if (entry.type === "object") return "{}";
  return String(entry.value);
}

function issueTotal(diff: LocaleDiff): number {
  return (
    diff.missing.length +
    diff.extra.length +
    diff.typeMismatch.length +
    diff.emptyTarget.length +
    diff.placeholderMismatch.length +
    diff.arrayMismatch.length
  );
}

export function I18nKeyCheckerTool() {
  const [baseInput, setBaseInput] = useState("");
  const [targetInput, setTargetInput] = useState("");
  const [settled, setSettled] = useState({ base: "", target: "" });
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSettled({ base: baseInput, target: targetInput });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [baseInput, targetInput]);

  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    [],
  );

  const base = useMemo(() => parseSide(settled.base), [settled.base]);
  const target = useMemo(() => parseSide(settled.target), [settled.target]);
  const diff = useMemo(
    () =>
      base.status === "ok" && target.status === "ok" ? diffLocales(base.map, target.map) : null,
    [base, target],
  );

  const loadExample = () => {
    setBaseInput(examplePair.base);
    setTargetInput(examplePair.target);
  };

  const clear = () => {
    setBaseInput("");
    setTargetInput("");
    setSettled({ base: "", target: "" });
  };

  const copyMissing = () => {
    if (!diff || diff.missing.length === 0) return;
    const done = () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopyState("idle"), COPY_RESET_MS);
    };
    if (!navigator.clipboard?.writeText) {
      // No Clipboard API (insecure context/old browser) — same honest failure.
      setCopyState("failed");
      done();
      return;
    }
    void navigator.clipboard
      .writeText(diff.missing.join("\n"))
      .then(() => {
        setCopyState("copied");
      })
      .catch(() => {
        setCopyState("failed");
      })
      .finally(done);
  };

  const pane = (
    id: "base" | "target",
    label: string,
    hint: string,
    value: string,
    side: Side,
    onChange: (next: string) => void,
  ) => {
    const errorId = `i18n-${id}-error`;
    return (
      <div className={styles.pane}>
        <div className={styles.paneHead}>
          <label htmlFor={`i18n-${id}`}>{label}</label>
          {side.status === "ok" && (
            <span className={styles.keyCount}>{copy.labels.keys(side.count)}</span>
          )}
        </div>
        <textarea
          id={`i18n-${id}`}
          className={styles.textarea}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={'{"nav": {"home": "Home"}}'}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          aria-invalid={side.status === "error"}
          aria-describedby={side.status === "error" ? errorId : undefined}
        />
        {side.status === "error" ? (
          <p className={styles.error} role="alert" id={errorId}>
            <TriangleAlert size={13} aria-hidden /> {side.message}
          </p>
        ) : side.status === "ok" && side.collisions.length > 0 ? (
          <p className={styles.hint} data-tone="warn" role="alert">
            <TriangleAlert size={13} aria-hidden /> {copy.labels.collisionWarn(side.collisions)}
          </p>
        ) : (
          <p className={styles.hint}>{hint}</p>
        )}
      </div>
    );
  };

  const row = (key: string, hint: ReactNode, title?: string) => (
    <li className={styles.row} key={key}>
      <code>{displayKey(key)}</code>
      <span className={styles.rowHint} title={title}>
        {hint}
      </span>
    </li>
  );

  const group = (
    name: keyof LocaleDiff,
    severity: "critical" | "warning" | "info",
    icon: ReactNode,
    rows: ReactNode,
    count: number,
  ) => {
    if (count === 0) return null;
    const meta = copy.report.categories[name];
    return (
      <details className={styles.group} data-group={name} open>
        <summary data-severity={severity}>
          {icon}
          <span className={styles.groupTitle}>{meta.label}</span>
          <span className={styles.groupCount}>{count}</span>
          <ChevronDown className={styles.chevron} size={15} aria-hidden />
        </summary>
        <ul className={styles.rows}>{rows}</ul>
      </details>
    );
  };

  // Persistent polite live region so empty→report transitions announce even
  // before the summary strip mounts.
  const statusText =
    base.status === "empty" && target.status === "empty"
      ? copy.report.emptyTitle
      : !diff
        ? copy.report.waiting
        : issueTotal(diff) === 0
          ? copy.report.allClear
          : copy.report.issueCount(issueTotal(diff));

  const report = () => {
    if (base.status === "empty" && target.status === "empty") {
      return (
        <div className={styles.empty} data-empty>
          <FileDiff size={22} aria-hidden />
          <p className={styles.emptyTitle}>{copy.report.emptyTitle}</p>
          <p>{copy.report.emptyBody}</p>
        </div>
      );
    }
    if (!diff || base.status !== "ok" || target.status !== "ok") {
      const hasError = base.status === "error" || target.status === "error";
      return (
        <div className={styles.empty} data-empty>
          <FileDiff size={22} aria-hidden />
          <p className={styles.emptyTitle}>{copy.report.waiting}</p>
          <p>{hasError ? copy.report.fixErrors : copy.report.waitingBody}</p>
        </div>
      );
    }
    const total = issueTotal(diff);
    if (total === 0) {
      return (
        <div className={styles.allClear}>
          <CheckCircle2 size={22} aria-hidden />
          <div>
            <p className={styles.emptyTitle}>{copy.report.allClear}</p>
            <p className={styles.allClearBody}>{copy.report.allClearBody}</p>
          </div>
        </div>
      );
    }
    const categories = copy.report.categories;
    return (
      <>
        <div className={styles.summary}>
          <p className={styles.statusLine}>{copy.report.issueCount(total)}</p>
          <ul className={styles.chips}>
            {(
              [
                ["missing", "critical", <TriangleAlert key="i" size={13} aria-hidden />],
                ["typeMismatch", "warning", <FileDiff key="i" size={13} aria-hidden />],
                ["placeholderMismatch", "warning", <Braces key="i" size={13} aria-hidden />],
                ["arrayMismatch", "warning", <CircleAlert key="i" size={13} aria-hidden />],
                ["emptyTarget", "info", <CircleAlert key="i" size={13} aria-hidden />],
                ["extra", "info", <ListPlus key="i" size={13} aria-hidden />],
              ] as const
            ).map(([name, severity, icon]) => {
              const count = diff[name].length;
              const unit = categories[name].unit[count === 1 ? 0 : 1];
              return (
                <li key={name} data-chip={name} data-severity={severity} data-count={count}>
                  {icon} {count} {unit}
                </li>
              );
            })}
          </ul>
          {diff.missing.length > 0 && (
            <button
              type="button"
              className={styles.copyButton}
              data-action="copy-missing"
              data-state={copyState}
              onClick={copyMissing}
            >
              {copyState === "copied" ? (
                <CheckCircle2 size={14} aria-hidden />
              ) : (
                <Copy size={14} aria-hidden />
              )}
              {copyState === "copied" ? copy.labels.copied : copy.labels.copyMissing}
            </button>
          )}
        </div>
        {copyState === "failed" ? (
          <p className={styles.error} role="alert">
            <TriangleAlert size={13} aria-hidden /> {copy.labels.copyFailed}
          </p>
        ) : null}
        <div className={styles.groups}>
          {group(
            "missing",
            "critical",
            <TriangleAlert size={15} aria-hidden />,
            diff.missing.map((key) => {
              const entry = base.map.get(key);
              return row(
                key,
                entry ? `${entry.type} · ${preview(entry)}` : null,
                entry ? preview(entry, Number.POSITIVE_INFINITY) : undefined,
              );
            }),
            diff.missing.length,
          )}
          {group(
            "typeMismatch",
            "warning",
            <FileDiff size={15} aria-hidden />,
            diff.typeMismatch.map((item) => row(item.key, `${item.baseType} → ${item.targetType}`)),
            diff.typeMismatch.length,
          )}
          {group(
            "placeholderMismatch",
            "warning",
            <Braces size={15} aria-hidden />,
            diff.placeholderMismatch.map((item) =>
              row(item.key, `missing ${item.missingVars.map((v) => `{${v}}`).join(", ")}`),
            ),
            diff.placeholderMismatch.length,
          )}
          {group(
            "emptyTarget",
            "info",
            <CircleAlert size={15} aria-hidden />,
            diff.emptyTarget.map((key) => {
              const entry = base.map.get(key);
              return row(
                key,
                entry ? `base: ${preview(entry)}` : null,
                entry ? preview(entry, Number.POSITIVE_INFINITY) : undefined,
              );
            }),
            diff.emptyTarget.length,
          )}
          {group(
            "arrayMismatch",
            "warning",
            <CircleAlert size={15} aria-hidden />,
            diff.arrayMismatch.map((item) =>
              row(item.key, `${item.baseLength} items → ${item.targetLength} items`),
            ),
            diff.arrayMismatch.length,
          )}
          {group(
            "extra",
            "info",
            <ListPlus size={15} aria-hidden />,
            diff.extra.map((key) => {
              const entry = target.map.get(key);
              return row(
                key,
                entry ? `${entry.type} · ${preview(entry)}` : null,
                entry ? preview(entry, Number.POSITIVE_INFINITY) : undefined,
              );
            }),
            diff.extra.length,
          )}
        </div>
      </>
    );
  };

  return (
    <div className={styles.tool}>
      <div className={styles.toolHead}>
        <Languages size={15} aria-hidden />
        <span>{copy.labels.tagline}</span>
      </div>
      <div className={styles.panes}>
        {pane("base", copy.labels.base, copy.labels.baseHint, baseInput, base, setBaseInput)}
        {pane(
          "target",
          copy.labels.target,
          copy.labels.targetHint,
          targetInput,
          target,
          setTargetInput,
        )}
      </div>
      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.toolButton}
          data-action="example"
          onClick={loadExample}
        >
          <Sparkles size={14} aria-hidden /> {copy.labels.loadExample}
        </button>
        <button type="button" className={styles.toolButton} data-action="clear" onClick={clear}>
          <Eraser size={14} aria-hidden /> {copy.labels.clear}
        </button>
      </div>
      <div className={styles.report}>
        <p role="status" className={styles.srOnly}>
          {statusText}
        </p>
        {report()}
      </div>
    </div>
  );
}
