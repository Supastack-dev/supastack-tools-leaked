"use client";

import {
  BarChart3,
  Bell,
  Check,
  Copy,
  CreditCard,
  LayoutDashboard,
  Moon,
  MonitorSmartphone,
  Palette,
  Search,
  Settings,
  Sun,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";

import { DEFAULT_THEME_ID, THEME_CATALOG, themeById, type ThemeId } from "../../theme/catalog";
import { copy } from "./copy";
import {
  AXIS_IDS,
  axisOptions,
  DEFAULT_AXIS_STATE,
  nextPackIndex,
  packAttrSnippet,
  packIndexOf,
  packSwatch,
  previewAttrs,
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
  const [copied, setCopied] = useState(false);
  const [accentHex, setAccentHex] = useState<string>(
    themeById(DEFAULT_THEME_ID).tokens["--accent"],
  );
  const previewRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const copyTimer = useRef<number | undefined>(undefined);
  const theme = themeById(themeId);
  const activeIndex = packIndexOf(theme.id);
  const SchemeIcon = theme.colorScheme === "dark" ? Moon : Sun;
  const snippet = packAttrSnippet(theme.id, axes);

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    // Resolved value, not the catalog entry — proves the wrapper repaints.
    const resolved = getComputedStyle(el).getPropertyValue("--accent").trim();
    setAccentHex(resolved || theme.tokens["--accent"]);
  }, [themeId, theme]);

  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  function selectPack(id: ThemeId, focus = false) {
    if (id !== themeId) {
      setThemeId(id);
    }
    if (focus) tileRefs.current[packIndexOf(id)]?.focus();
  }

  function onPackKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const next = nextPackIndex(activeIndex, event.key);
    if (next === null) return;
    event.preventDefault();
    selectPack(THEME_CATALOG[next]!.id, true);
  }

  function setAxis<A extends keyof AxisState>(axis: A, value: AxisState[A]) {
    if (axes[axis] === value) return; // re-pressing the active chip is a no-op
    setAxes((current) => ({ ...current, [axis]: value }));
  }

  async function copyPackAttr() {
    try {
      await navigator.clipboard.writeText(snippet);
    } catch {
      return; // clipboard denied — the snippet stays selectable text
    }
    window.clearTimeout(copyTimer.current);
    setCopied(true);
    copyTimer.current = window.setTimeout(() => setCopied(false), COPY_RESET_MS);
  }

  return (
    <section aria-label={copy.toolName} className={styles.tool}>
      <div className={styles.rail}>
        <p className={styles.railLabel}>
          <Palette size={14} aria-hidden="true" />
          {copy.packGroupLabel}
          <span className={styles.railCount}>{THEME_CATALOG.length}</span>
        </p>
        <div
          aria-label={copy.packGroupAria}
          className={styles.packs}
          onKeyDown={onPackKeyDown}
          role="radiogroup"
        >
          {THEME_CATALOG.map((entry, index) => {
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
                tabIndex={active ? 0 : -1}
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
      </div>

      <div className={styles.axes}>
        {AXIS_IDS.map((axis) => (
          <div className={styles.axis} key={axis}>
            <span className={styles.axisLabel} id={`tp-axis-${axis}`}>
              {copy.axisLabels[axis]}
            </span>
            <div aria-labelledby={`tp-axis-${axis}`} className={styles.chips} role="group">
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
          <p className={styles.packMeta}>
            <strong className={styles.packName}>{theme.name}</strong>
            <span className={styles.packDesc}>{theme.description}</span>
          </p>
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
              onClick={() => void copyPackAttr()}
              type="button"
            >
              {copied ? (
                <Check size={13} aria-hidden="true" />
              ) : (
                <Copy size={13} aria-hidden="true" />
              )}
              <code>{copied ? copy.status.copiedLabel : snippet}</code>
            </button>
            <span aria-live="polite" className={styles.srOnly} role="status">
              {copied ? copy.status.copiedLabel : ""}
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
