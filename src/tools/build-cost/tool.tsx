"use client";

import { Check } from "lucide-react";
import { useMemo, useState } from "react";

import { buildCostCopy } from "./copy";
import {
  BUILD_MODULES,
  DEFAULT_MODULE_IDS,
  DEFAULT_PLATFORM_IDS,
  DEFAULT_RATE,
  estimateBuildCost,
  HOURS_PER_WEEK,
  PLATFORMS,
  type ModuleId,
  type PlatformId,
} from "./logic";
import styles from "./tool.module.css";

export function BuildCostTool() {
  const copy = buildCostCopy;
  const [rate, setRate] = useState(DEFAULT_RATE);
  const [modules, setModules] = useState<readonly ModuleId[]>(DEFAULT_MODULE_IDS);
  const [platforms, setPlatforms] = useState<readonly PlatformId[]>(DEFAULT_PLATFORM_IDS);

  const result = useMemo(
    () => estimateBuildCost(modules, platforms, rate),
    [modules, platforms, rate],
  );

  const money = (v: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(v);

  const num = (v: number) => Math.round(v).toLocaleString("en-US");

  const toggle = <T extends string>(
    list: readonly T[],
    id: T,
    setter: (v: readonly T[]) => void,
    keep?: readonly T[],
  ) => {
    if (list.includes(id)) {
      const next = list.filter((x) => x !== id);
      setter(keep?.some((k) => !next.includes(k)) ? list : next);
    } else {
      setter([...list, id]);
    }
  };

  return (
    <div className={styles.grid}>
      <section className={styles.card} aria-labelledby="build-cost-inputs-heading">
        <h2 className={styles.cardTitle} id="build-cost-inputs-heading">
          {copy.controls.heading}
        </h2>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="bc-rate-input">
            {copy.controls.rate}
          </label>
          <div className={styles.inputWrap}>
            <span className={styles.currencyPrefix} aria-hidden="true">
              $
            </span>
            <input
              id="bc-rate-input"
              className={styles.input}
              type="number"
              min={0}
              max={1000}
              value={rate}
              onChange={(e) => {
                setRate(e.currentTarget.valueAsNumber || 0);
              }}
            />
            <span className={styles.currencySuffix} aria-hidden="true">
              / h
            </span>
          </div>
          <small className={styles.hint}>{copy.controls.rateHelp}</small>
        </div>
        <fieldset className={styles.group}>
          <legend className={styles.groupLabel}>{copy.controls.platforms}</legend>
          <div className={styles.platformsList} role="group" aria-label={copy.controls.platforms}>
            {PLATFORMS.map((p) => {
              const checked = platforms.includes(p.id);
              const disabled = p.id === "web";
              return (
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  disabled={disabled}
                  className={styles.choiceButton}
                  data-checked={checked ? "true" : "false"}
                  key={p.id}
                  onClick={() => toggle(platforms, p.id, setPlatforms, ["web"])}
                >
                  <span className={styles.indicator} aria-hidden="true">
                    {checked && <Check size={12} strokeWidth={2.75} />}
                  </span>
                  <span className={styles.choiceLabel}>{copy.platformNames[p.id]}</span>
                </button>
              );
            })}
          </div>
          <small className={styles.hint}>{copy.controls.platformHelp}</small>
        </fieldset>
        <fieldset className={styles.group}>
          <legend className={styles.groupLabel}>{copy.controls.modules}</legend>
          <div className={styles.modulesGrid} role="group" aria-label={copy.controls.modules}>
            {BUILD_MODULES.map((m) => {
              const checked = modules.includes(m.id);
              return (
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  className={styles.choiceButton}
                  data-checked={checked ? "true" : "false"}
                  key={m.id}
                  onClick={() => toggle(modules, m.id, setModules)}
                >
                  <span className={styles.indicator} aria-hidden="true">
                    {checked && <Check size={12} strokeWidth={2.75} />}
                  </span>
                  <span className={styles.choiceLabel}>{copy.moduleNames[m.id]}</span>
                </button>
              );
            })}
          </div>
          <small className={styles.hint}>{copy.controls.modulesHelp}</small>
        </fieldset>
      </section>

      <section
        className={styles.result}
        aria-labelledby="build-cost-results-heading"
        aria-live="polite"
      >
        <h2 className={styles.cardTitle} id="build-cost-results-heading">
          {copy.results.heading}
        </h2>
        <dl className={styles.stats}>
          <div className={styles.stat}>
            <dt>{copy.results.diy}</dt>
            <dd>
              {num(result.diyHours)} {copy.results.hoursUnit} · {result.diyWeeks.toFixed(1)}{" "}
              {copy.results.weeksUnit} · {money(result.diyCost)}
            </dd>
          </div>
          <div className={styles.stat}>
            <dt>{copy.results.kit}</dt>
            <dd>
              {num(result.kitHours)} {copy.results.hoursUnit} · {result.kitWeeks.toFixed(1)}{" "}
              {copy.results.weeksUnit} · {money(result.kitCost)}
            </dd>
          </div>
          <div className={`${styles.stat} ${styles.statAccent}`}>
            <dt>{copy.results.saved}</dt>
            <dd>
              {copy.results.savedLine
                .replace("{hours}", num(result.savedHours))
                .replace("{cost}", money(result.savedCost))}
            </dd>
          </div>
        </dl>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className={styles.tableCaption}>{copy.table.heading}</caption>
            <thead>
              <tr>
                <th scope="col">{copy.table.module}</th>
                <th scope="col">{copy.table.diy}</th>
                <th scope="col">{copy.table.kit}</th>
                <th scope="col">{copy.table.saved}</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row) => (
                <tr key={row.module.id}>
                  <th scope="row">{copy.moduleNames[row.module.id]}</th>
                  <td>
                    {num(row.diyHours)} {copy.results.hoursUnit}
                  </td>
                  <td>
                    {num(row.kitHours)} {copy.results.hoursUnit}
                  </td>
                  <td>
                    {num(row.savedHours)} {copy.results.hoursUnit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.hint}>
          {num(HOURS_PER_WEEK)} {copy.results.hoursUnit} = 1 {copy.results.weeksUnit}
        </p>
      </section>
    </div>
  );
}
