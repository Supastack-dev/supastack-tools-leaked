"use client";

import {
  BarChart3,
  Bell,
  Braces,
  Check,
  Copy,
  CreditCard,
  Dices,
  LayoutDashboard,
  Moon,
  MonitorSmartphone,
  Palette,
  Search,
  Settings,
  Sun,
  Users,
  X,
} from "lucide-react";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import { useCopyState } from "../../lib/use-copy-state";
import { DEFAULT_THEME_ID, THEME_CATALOG, themeById, type ThemeId } from "../../theme/catalog";
import { copy } from "./copy";
import {
  AXIS_IDS,
  axisOptions,
  cssVarSnippet,
  DEFAULT_AXIS_STATE,
  filterPacks,
  nextPackIndex,
  packAttrSnippet,
  packSwatch,
  previewAttrs,
  randomPackIndex,
  type AxisState,
} from "./logic";
import styles from "./tool.module.css";

const NAV_ICONS = [LayoutDashboard, BarChart3, Users, CreditCard, Settings] as const;
const COPY_RESET_MS = 1600;

/**
 * Live preview of the theme-pack system. The pack/axis picks repaint ONLY
 * the preview wrapper via the subtree `data-theme` contract — the visitor's
 * global html[data-theme] and its localStorage persistence are never
 * touched, so the page around the tool keeps their pick.
 */
export function ThemePlayground() {
  const [themeId, setThemeId] = useState<ThemeId>(DEFAULT_THEME_ID);
  const [axes, setAxes] = useState<AxisState>(DEFAULT_AXIS_STATE);
  const [query, setQuery] = useState("");
  const [accentHex, setAccentHex] = useState<string>(
    themeById(DEFAULT_THEME_ID).tokens["--accent"],
  );
  const attrCopy = useCopyState(COPY_RESET_MS);
  const varsCopy = useCopyState(COPY_RESET_MS);
  const axisGroupId = useId();
  const previewRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLInputElement>(null);
  const tileRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const theme = themeById(themeId);
  const visiblePacks = useMemo(() => filterPacks(THEME_CATALOG, query), [query]);
  const filtering = query.trim() !== "";
  // Roving-tabindex anchor: the checked tile when visible, else the first
  // tile so the group keeps a tab stop while the active pack is filtered out.
  const checkedIndex = visiblePacks.findIndex((entry) => entry.id === theme.id);
  const focusIndex = checkedIndex >= 0 ? checkedIndex : 0;
  const surpriseDisabled =
    visiblePacks.length === 0 || (visiblePacks.length === 1 && checkedIndex === 0);
  const SchemeIcon = theme.colorScheme === "dark" ? Moon : Sun;
  const snippet = packAttrSnippet(theme.id, axes);
  const varsSnippet = cssVarSnippet(theme);
  const copyFailed = attrCopy.state === "failed" || varsCopy.state === "failed";
  const liveMessage = copyFailed
    ? copy.status.failedLabel
    : attrCopy.state === "copied" || varsCopy.state === "copied"
      ? copy.status.copiedLabel
      : "";

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    // Resolved value, not the catalog entry — proves the wrapper repaints.
    const resolved = getComputedStyle(el).getPropertyValue("--accent").trim();
    setAccentHex(resolved || theme.tokens["--accent"]);
  }, [theme]);

  function selectPack(id: ThemeId, focus = false) {
    if (id !== themeId) {
      setThemeId(id);
    }
    if (focus) {
      const at = visiblePacks.findIndex((entry) => entry.id === id);
      if (at >= 0) tileRefs.current[at]?.focus();
    }
  }

  function onPackKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const next = nextPackIndex(focusIndex, event.key, visiblePacks.length);
    if (next === null) return;
    event.preventDefault();
    selectPack(visiblePacks[next]!.id, true);
  }

  function onFilterKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape" && query !== "") {
      event.preventDefault();
      setQuery("");
    }
  }

  function clearFilter() {
    setQuery("");
    filterRef.current?.focus();
  }

  function surpriseMe() {
    const next = randomPackIndex(visiblePacks.length, checkedIndex);
    if (next >= 0) selectPack(visiblePacks[next]!.id, true);
  }

  function setAxis<A extends keyof AxisState>(axis: A, value: AxisState[A]) {
    if (axes[axis] === value) return; // re-pressing the active chip is a no-op
    setAxes((current) => ({ ...current, [axis]: value }));
  }

  return (
    <section aria-label={copy.toolName} className={styles.tool}>
      <div className={styles.rail}>
        <p className={styles.railLabel}>
          <Palette size={14} aria-hidden="true" />
          {copy.packGroupLabel}
          <span className={styles.railCount}>
            {filtering
              ? copy.filter.count
                  .replace("{shown}", String(visiblePacks.length))
                  .replace("{total}", String(THEME_CATALOG.length))
              : THEME_CATALOG.length}
          </span>
        </p>
        <div className={styles.railBar}>
          <div className={styles.filterWrap} role="search">
            <Search aria-hidden="true" className={styles.filterIcon} size={14} />
            <input
              aria-label={copy.filter.label}
              autoComplete="off"
              className={styles.filterInput}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onFilterKeyDown}
              placeholder={copy.filter.placeholder}
              ref={filterRef}
              spellCheck={false}
              type="search"
              value={query}
            />
            {filtering ? (
              <button
                aria-label={copy.filter.clear}
                className={styles.filterClear}
                onClick={clearFilter}
                type="button"
              >
                <X size={13} aria-hidden="true" />
              </button>
            ) : null}
          </div>
          <button
            className={styles.surpriseBtn}
            disabled={surpriseDisabled}
            onClick={surpriseMe}
            type="button"
          >
            <Dices size={14} aria-hidden="true" />
            {copy.status.surprise}
          </button>
        </div>
        {visiblePacks.length === 0 ? (
          <div className={styles.packEmpty}>
            <p role="status">{copy.filter.empty.replace("{query}", query.trim())}</p>
            <button className={styles.emptyClear} onClick={clearFilter} type="button">
              {copy.filter.clear}
            </button>
          </div>
        ) : (
          <div
            aria-label={copy.packGroupAria}
            className={styles.packs}
            onKeyDown={onPackKeyDown}
            role="radiogroup"
          >
            {visiblePacks.map((entry, index) => {
              const swatch = packSwatch(entry);
              const active = entry.id === theme.id;
              return (
                <button
                  aria-checked={active}
                  className={styles.packTile}
                  key={entry.id}
                  onClick={() => selectPack(entry.id)}
                  ref={(node) => {
                    tileRefs.current[index] = node;
                  }}
                  role="radio"
                  tabIndex={index === focusIndex ? 0 : -1}
                  title={entry.description}
                  type="button"
                >
                  <span
                    aria-hidden="true"
                    className={styles.tileArt}
                    style={{ background: swatch.page, borderColor: swatch.border }}
                  >
                    <i
                      className={styles.tileRail}
                      style={{ background: swatch.section, borderColor: swatch.border }}
                    />
                    <i className={styles.tileLine} style={{ background: swatch.ink }} />
                    <i className={styles.tileKey} style={{ background: swatch.accent }} />
                  </span>
                  <span className={styles.tileName}>{entry.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.axes}>
        {AXIS_IDS.map((axis) => (
          <div className={styles.axis} key={axis}>
            <span className={styles.axisLabel} id={`${axisGroupId}-${axis}`}>
              {copy.axisLabels[axis]}
            </span>
            <div
              aria-labelledby={`${axisGroupId}-${axis}`}
              className={styles.chips}
              role="group"
            >
              {axisOptions(axis).map((option) => (
                <button
                  aria-pressed={axes[axis] === option.id}
                  className={styles.chip}
                  key={option.id}
                  onClick={() => setAxis(axis, option.id)}
                  title={option.description}
                  type="button"
                >
                  {option.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.stage}>
        <div className={styles.stageChrome}>
          <span aria-hidden="true" className={styles.chromeDots}>
            <i />
            <i />
            <i />
          </span>
          <span className={styles.urlPill}>{copy.preview.url}</span>
          <MonitorSmartphone aria-hidden="true" className={styles.chromeIcon} size={15} />
        </div>
        <div ref={previewRef} className={styles.preview} {...previewAttrs(theme.id, axes)}>
          <MiniDashboard />
        </div>
        <div className={styles.stageFoot}>
          <div className={styles.packMeta}>
            <p className={styles.packMetaLine}>
              <strong className={styles.packName}>{theme.name}</strong>
              <span className={styles.packDesc}>{theme.description}</span>
            </p>
            <p className={styles.packAxes}>
              {AXIS_IDS.map((axis) => {
                const option = axisOptions(axis).find((entry) => entry.id === axes[axis]);
                return (
                  <span className={styles.axisBadge} key={axis} title={option?.description}>
                    <span className={styles.axisBadgeKey}>{copy.axisLabels[axis]}</span>
                    {option?.name ?? axes[axis]}
                  </span>
                );
              })}
            </p>
          </div>
          <div className={styles.packReadout}>
            <span className={styles.schemeBadge}>
              <SchemeIcon size={12} aria-hidden="true" />
              {theme.colorScheme === "dark" ? copy.status.schemeDark : copy.status.schemeLight}
            </span>
            <span className={styles.hexChip}>
              <i
                aria-hidden="true"
                className={styles.hexDot}
                style={{ background: theme.tokens["--accent"] }}
              />
              <code>{accentHex}</code>
            </span>
            <button
              aria-label={`${copy.status.copyLabel}: ${snippet}`}
              className={styles.copyChip}
              data-state={attrCopy.state}
              onClick={() => void attrCopy.copy(snippet)}
              type="button"
            >
              {attrCopy.state === "copied" ? (
                <Check size={13} aria-hidden="true" />
              ) : (
                <Copy size={13} aria-hidden="true" />
              )}
              <code>
                {attrCopy.state === "copied"
                  ? copy.status.copiedLabel
                  : attrCopy.state === "failed"
                    ? copy.status.failedLabel
                    : snippet}
              </code>
            </button>
            <button
              className={styles.varsBtn}
              data-state={varsCopy.state}
              onClick={() => void varsCopy.copy(varsSnippet)}
              type="button"
            >
              {varsCopy.state === "copied" ? (
                <Check size={13} aria-hidden="true" />
              ) : (
                <Braces size={13} aria-hidden="true" />
              )}
              {varsCopy.state === "copied"
                ? copy.status.copiedLabel
                : varsCopy.state === "failed"
                  ? copy.status.failedLabel
                  : copy.status.copyVarsLabel}
            </button>
            <span aria-live="polite" className={styles.srOnly} role="status">
              {liveMessage}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Mock product shell — deliberately dense enough that a pack swap is dramatic.
 * Every color in here resolves from the preview wrapper's tokens.
 */
function MiniDashboard() {
  const p = copy.preview;
  return (
    <div className={styles.dash}>
      <aside className={styles.dashRail}>
        <div className={styles.dashBrand}>
          <span aria-hidden="true" className={styles.dashMark} />
          <span className={styles.dashBrandName}>{p.brand}</span>
        </div>
        <p className={styles.dashGroup}>{p.workspace}</p>
        <nav aria-label={p.navAria} className={styles.dashNav}>
          {p.nav.map((item, index) => {
            const Icon = NAV_ICONS[index % NAV_ICONS.length]!;
            return (
              <span
                className={styles.dashNavItem}
                data-active={index === 0 || undefined}
                key={item}
              >
                <Icon size={13} aria-hidden="true" />
                <span className={styles.dashNavLabel}>{item}</span>
              </span>
            );
          })}
        </nav>
        <div className={styles.dashUser}>
          <span aria-hidden="true" className={styles.dashAvatar} />
          <span className={styles.dashUserLine}>{p.user}</span>
        </div>
      </aside>
      <div className={styles.dashMain}>
        <div className={styles.dashTop}>
          <span className={styles.searchPill}>
            <Search size={12} aria-hidden="true" />
            <span className={styles.searchText}>{p.searchPlaceholder}</span>
            <kbd className={styles.kbd}>{p.searchShortcut}</kbd>
          </span>
          <span className={styles.dashTopActions}>
            <span className={styles.newReport}>{p.newReport}</span>
            <span className={styles.bell}>
              <Bell size={13} aria-hidden="true" />
              <i aria-hidden="true" className={styles.bellDot} />
            </span>
            <span aria-hidden="true" className={styles.dashAvatar} />
          </span>
        </div>
        <div className={styles.statRow}>
          {p.stats.map((stat) => (
            <div className={styles.statCard} key={stat.label}>
              <p className={styles.statLabel}>{stat.label}</p>
              <p className={styles.statValue}>{stat.value}</p>
              <span className={styles.statDelta}>{stat.delta}</span>
            </div>
          ))}
        </div>
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <p className={styles.panelTitle}>{p.chartTitle}</p>
            <p className={styles.legend}>
              <span>
                <i className={styles.legendKey} /> {p.chartLegend[0]}
              </span>
              <span>
                <i className={styles.legendKey} data-muted="true" /> {p.chartLegend[1]}
              </span>
            </p>
          </div>
          <div aria-hidden="true" className={styles.bars}>
            {p.chartBars.map((height, index) => (
              <i
                className={styles.bar}
                data-hot={index === p.chartBars.length - 1 || undefined}
                key={index}
                style={{ height: `${height}%` }}
              >
                <b className={styles.barGhost} style={{ height: `${100 - height * 0.55}%` }} />
              </i>
            ))}
          </div>
          <div aria-hidden="true" className={styles.barMonths}>
            {p.chartMonths.map((month, index) => (
              <span key={index}>{month}</span>
            ))}
          </div>
        </div>
        <div className={styles.tableCard}>
          <p className={styles.panelTitle}>{p.tableTitle}</p>
          {p.table.map((row) => (
            <div className={styles.tableRow} key={row.name}>
              <span className={styles.tableName}>{row.name}</span>
              <span className={styles.tablePlan}>{row.plan}</span>
              <span className={styles.statusPill} data-tone={row.status}>
                {row.status}
              </span>
              <span className={styles.tableMrr}>{row.mrr}</span>
            </div>
          ))}
        </div>
        {/* Mock controls are props — inert keeps them out of tab order and
            the a11y tree instead of pretending they work. */}
        <div className={styles.formRow} inert>
          <input
            aria-label={p.invitePlaceholder}
            className={styles.input}
            placeholder={p.invitePlaceholder}
            type="email"
          />
          <button className={styles.btnPrimary} type="button">
            {p.sendInvite}
          </button>
          <button className={styles.btnGhost} type="button">
            {p.cancel}
          </button>
          <label className={styles.toggleLabel}>
            <input className={styles.toggle} defaultChecked type="checkbox" />
            <span>{p.digest}</span>
          </label>
        </div>
      </div>
    </div>
  );
}
