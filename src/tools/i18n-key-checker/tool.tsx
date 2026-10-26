"use client";

import {
  ArrowLeftRight,
  Braces,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Copy,
  Download,
  Eraser,
  FileDiff,
  FileJson,
  Languages,
  ListPlus,
  Search,
  Sparkles,
  SquareEqual,
  TriangleAlert,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { downloadText } from "../../lib/download";
import { useCopyState } from "../../lib/use-copy-state";
import { copy, examplePair } from "./copy";
import {
  coverageRatio,
  diffLocales,
  diffMarkdown,
  filterDiff,
  flattenLocale,
  issueTotal,
  missingStub,
  parseLocaleJson,
  type FlattenedEntry,
  type FlattenedLocale,
  type LocaleDiff,
} from "./logic";
import styles from "./tool.module.css";

const DEBOUNCE_MS = 300;

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
  return key === "" ? copy.labels.rootKey : key;
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

export function I18nKeyCheckerTool() {
  const [baseInput, setBaseInput] = useState("");
  const [targetInput, setTargetInput] = useState("");
  const [baseName, setBaseName] = useState("en.json");
  const [targetName, setTargetName] = useState("de.json");
  const [settled, setSettled] = useState({ base: "", target: "" });
  const [query, setQuery] = useState("");
  const missingCopy = useCopyState(1600);
  const stubCopy = useCopyState(1600);
  const baseFileRef = useRef<HTMLInputElement>(null);
  const targetFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSettled({ base: baseInput, target: targetInput });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [baseInput, targetInput]);

  const base = useMemo(() => parseSide(settled.base), [settled.base]);
  const target = useMemo(() => parseSide(settled.target), [settled.target]);
  const diff = useMemo(
    () =>
      base.status === "ok" && target.status === "ok" ? diffLocales(base.map, target.map) : null,
    [base, target],
  );
  const shown = useMemo(() => (diff ? filterDiff(diff, query) : null), [diff, query]);

  const loadExample = () => {
    setBaseInput(examplePair.base);
    setTargetInput(examplePair.target);
    setBaseName("en.json");
    setTargetName("de.json");
  };

  const clear = () => {
    setBaseInput("");
    setTargetInput("");
    setQuery("");
    setSettled({ base: "", target: "" });
  };

  const swap = () => {
    const nextBase = targetInput;
    setTargetInput(baseInput);
    setBaseInput(nextBase);
    const nextName = targetName;
    setTargetName(baseName);
    setBaseName(nextName);
    setSettled({ base: nextBase, target: baseInput });
  };

  const openFile = (side: "base" | "target") => {
    const input = side === "base" ? baseFileRef.current : targetFileRef.current;
    input?.click();
  };

  const readFile = (side: "base" | "target", file: File) => {
    void file.text().then((text) => {
      if (side === "base") {
        setBaseInput(text);
        setBaseName(file.name);
      } else {
        setTargetInput(text);
        setTargetName(file.name);
      }
    });
  };

  const stubJson = () =>
    base.status === "ok" && shown
      ? JSON.stringify(missingStub(base.map, shown.missing), null, 2)
      : "";

  const reportMarkdown = () =>
    shown ? diffMarkdown(shown, { base: baseName, target: targetName }) : "";

  const pane = (
    id: "base" | "target",
    label: string,
    hint: string,
    value: string,
    side: Side,
    onChange: (next: string) => void,
    fileRef: React.RefObject<HTMLInputElement | null>,
    fileName: string,
  ) => {
    const errorId = `i18n-${id}-error`;
    return (
      <div className={styles.pane}>
        <div className={styles.paneHead}>
          <label htmlFor={`i18n-${id}`}>{label}</label>
          <span className={styles.paneMeta}>
            {side.status === "ok" && (
              <span className={styles.keyCount}>{copy.labels.keys(side.count)}</span>
            )}
            <button
              className={styles.miniBtn}
              onClick={() => openFile(id)}
              title={copy.labels.openFile}
              type="button"
            >
              <FileJson size={13} aria-hidden />
              <span className={styles.miniBtnLabel}>
                {fileName === "" ? copy.labels.openFile : fileName}
              </span>
            </button>
            <input
              accept=".json,application/json"
              aria-hidden="true"
              className={styles.srOnly}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) readFile(id, file);
                event.target.value = "";
              }}
              ref={fileRef}
              tabIndex={-1}
              type="file"
            />
          </span>
        </div>
        <textarea
          id={`i18n-${id}`}
          className={styles.textarea}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={copy.labels.panePlaceholder}
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
    defaultOpen = true,
  ) => {
    if (count === 0) return null;
    const meta = copy.report.categories[name];
    return (
      <details className={styles.group} data-group={name} open={defaultOpen}>
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
    if (!diff || !shown || base.status !== "ok" || target.status !== "ok") {
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
    const shownTotal = issueTotal(shown);
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
    const covered = base.count - diff.missing.length - diff.typeMismatch.length;
    const percent = Math.round(coverageRatio(base.count, diff) * 100);
    return (
      <>
        <div className={styles.summary}>
          <p className={styles.statusLine}>{copy.report.issueCount(total)}</p>
          <p className={styles.coverage} data-tone={percent === 100 ? "full" : undefined}>
            {copy.labels.coverage(Math.max(0, covered), base.count, percent)}
          </p>
          <ul className={styles.chips}>
            {(
              [
                ["missing", "critical", <TriangleAlert key="i" size={13} aria-hidden />],
                ["typeMismatch", "warning", <FileDiff key="i" size={13} aria-hidden />],
                ["placeholderMismatch", "warning", <Braces key="i" size={13} aria-hidden />],
                ["arrayMismatch", "warning", <CircleAlert key="i" size={13} aria-hidden />],
                ["emptyTarget", "info", <CircleAlert key="i" size={13} aria-hidden />],
                ["identicalTarget", "info", <SquareEqual key="i" size={13} aria-hidden />],
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
          <div className={styles.summaryActions}>
            <label className={styles.filter}>
              <Search size={13} aria-hidden />
              <input
                aria-label={copy.labels.filterPlaceholder}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={copy.labels.filterPlaceholder}
                type="search"
                value={query}
              />
              {query !== "" && (
                <button
                  aria-label={copy.labels.filterClear}
                  onClick={() => setQuery("")}
                  type="button"
                >
                  <X size={12} aria-hidden />
                </button>
              )}
            </label>
            {diff.missing.length > 0 && (
              <>
                <button
                  type="button"
                  className={styles.copyButton}
                  data-action="copy-missing"
                  data-state={missingCopy.state}
                  disabled={shown.missing.length === 0}
                  onClick={() => {
                    void missingCopy.copy(shown.missing.join("\n"));
                  }}
                >
                  {missingCopy.state === "copied" ? (
                    <Check size={14} aria-hidden />
                  ) : (
                    <Copy size={14} aria-hidden />
                  )}
                  {missingCopy.state === "copied"
                    ? copy.labels.copied
                    : copy.labels.copyMissing}
                </button>
                <button
                  type="button"
                  className={styles.copyButton}
                  data-action="copy-stub"
                  data-state={stubCopy.state}
                  disabled={shown.missing.length === 0}
                  onClick={() => {
                    void stubCopy.copy(stubJson());
                  }}
                >
                  {stubCopy.state === "copied" ? (
                    <Check size={14} aria-hidden />
                  ) : (
                    <Braces size={14} aria-hidden />
                  )}
                  {stubCopy.state === "copied" ? copy.labels.copied : copy.labels.copyStub}
                </button>
                <button
                  type="button"
                  className={styles.copyButton}
                  data-action="download-stub"
                  disabled={shown.missing.length === 0}
                  onClick={() => {
                    downloadText(
                      `${targetName.replace(/\.json$/i, "")}-missing.json`,
                      stubJson(),
                      "application/json",
                    );
                  }}
                >
                  <Download size={14} aria-hidden />
                  {copy.labels.downloadStub}
                </button>
              </>
            )}
            <button
              type="button"
              className={styles.copyButton}
              data-action="download-report"
              onClick={() => {
                downloadText("i18n-coverage-report.md", reportMarkdown(), "text/markdown");
              }}
            >
              <FileDiff size={14} aria-hidden />
              {copy.labels.downloadReport}
            </button>
          </div>
        </div>
        {missingCopy.state === "failed" || stubCopy.state === "failed" ? (
          <p className={styles.error} role="alert">
            <TriangleAlert size={13} aria-hidden /> {copy.labels.copyFailed}
          </p>
        ) : null}
        {shownTotal === 0 ? (
          <p className={styles.filterEmpty}>{copy.labels.filterEmpty}</p>
        ) : (
          <div className={styles.groups}>
            {group(
              "missing",
              "critical",
              <TriangleAlert size={15} aria-hidden />,
              shown.missing.map((key) => {
                const entry = base.map.get(key);
                return row(
                  key,
                  entry ? `${entry.type} · ${preview(entry)}` : null,
                  entry ? preview(entry, Number.POSITIVE_INFINITY) : undefined,
                );
              }),
              shown.missing.length,
            )}
            {group(
              "typeMismatch",
              "warning",
              <FileDiff size={15} aria-hidden />,
              shown.typeMismatch.map((item) =>
                row(item.key, `${item.baseType} → ${item.targetType}`),
              ),
              shown.typeMismatch.length,
            )}
            {group(
              "placeholderMismatch",
              "warning",
              <Braces size={15} aria-hidden />,
              shown.placeholderMismatch.map((item) =>
                row(item.key, `missing ${item.missingVars.map((v) => `{${v}}`).join(", ")}`),
              ),
              shown.placeholderMismatch.length,
            )}
            {group(
              "arrayMismatch",
              "warning",
              <CircleAlert size={15} aria-hidden />,
              shown.arrayMismatch.map((item) =>
                row(item.key, `${item.baseLength} items → ${item.targetLength} items`),
              ),
              shown.arrayMismatch.length,
            )}
            {group(
              "emptyTarget",
              "info",
              <CircleAlert size={15} aria-hidden />,
              shown.emptyTarget.map((key) => {
                const entry = base.map.get(key);
                return row(
                  key,
                  entry ? `base: ${preview(entry)}` : null,
                  entry ? preview(entry, Number.POSITIVE_INFINITY) : undefined,
                );
              }),
              shown.emptyTarget.length,
            )}
            {group(
              "identicalTarget",
              "info",
              <SquareEqual size={15} aria-hidden />,
              shown.identicalTarget.map((key) => {
                const entry = base.map.get(key);
                return row(
                  key,
                  entry ? preview(entry) : null,
                  entry ? preview(entry, Number.POSITIVE_INFINITY) : undefined,
                );
              }),
              shown.identicalTarget.length,
              false,
            )}
            {group(
              "extra",
              "info",
              <ListPlus size={15} aria-hidden />,
              shown.extra.map((key) => {
                const entry = target.map.get(key);
                return row(
                  key,
                  entry ? `${entry.type} · ${preview(entry)}` : null,
                  entry ? preview(entry, Number.POSITIVE_INFINITY) : undefined,
                );
              }),
              shown.extra.length,
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <div className={styles.tool}>
      <div className={styles.toolHead}>
        <Languages size={15} aria-hidden />
        <span>{copy.labels.tagline}</span>
        <button
          aria-label={copy.labels.swap}
          className={styles.swapBtn}
          onClick={swap}
          title={copy.labels.swap}
          type="button"
        >
          <ArrowLeftRight size={13} aria-hidden />
        </button>
      </div>
      <div className={styles.panes}>
        {pane(
          "base",
          copy.labels.base,
          copy.labels.baseHint,
          baseInput,
          base,
          setBaseInput,
          baseFileRef,
          baseName,
        )}
        {pane(
          "target",
          copy.labels.target,
          copy.labels.targetHint,
          targetInput,
          target,
          setTargetInput,
          targetFileRef,
          targetName,
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
