"use client";

import {
  ArrowDown,
  ArrowUp,
  Check,
  CheckCheck,
  Copy,
  CopyPlus,
  Link2,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Star,
  Table,
  Trash2,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import { FormSelect } from "../../components/form-select";
import { useCopyState } from "../../lib/use-copy-state";
import { pricingToolCopy as copy } from "./copy";
import {
  annualDiscountPercent,
  annualMonthlyEquivalent,
  annualPriceIssue,
  buildPricingConfig,
  canAddTier,
  canRemoveTier,
  createDefaultPricingState,
  createTier,
  CURRENCY_OPTIONS,
  decodeDraftState,
  DEFAULT_CTA_LABEL,
  duplicateTier,
  encodeDraftState,
  formatPrice,
  HEADING_MAX,
  monthlyPriceIssue,
  moveTier,
  parsePrice,
  PRICE_SUFFIX_OPTIONS,
  serializeConfig,
  serializeMarkdownTable,
  setFeaturedTier,
  SUBHEADING_MAX,
  suggestedAnnualPrice,
  TIER_CTA_MAX,
  TIER_TAGLINE_MAX,
  TIER_NAME_MAX,
  tierNameIssue,
  type FieldIssue,
  type PricingCurrency,
  type PricingDraftState,
  type PricingTier,
  type PriceSuffix,
  type TierDraft,
} from "./logic";
import styles from "./tool.module.css";

type BillingMode = "monthly" | "annual";

const ISSUE_TEXT: Record<FieldIssue, string> = {
  required: copy.controls.issues.required,
  invalid: copy.controls.issues.invalid,
  "too-long": copy.controls.issues.tooLong,
};

const HASH_WRITE_MS = 400;

function IssueNote({ id, issue }: { id: string; issue: FieldIssue | null }) {
  if (!issue) return null;
  return (
    <p className={styles.issue} id={id} role="status">
      {ISSUE_TEXT[issue]}
    </p>
  );
}

function TierEditor({
  draft,
  index,
  total,
  currency,
  suffix,
  showAnnual,
  removable,
  onPatch,
  onFeature,
  onMove,
  onDuplicate,
  onRemove,
}: {
  draft: TierDraft;
  index: number;
  total: number;
  currency: PricingCurrency;
  suffix: PriceSuffix;
  showAnnual: boolean;
  removable: boolean;
  onPatch: (id: string, patch: Partial<TierDraft>) => void;
  onFeature: (id: string, featured: boolean) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const nameIssue = tierNameIssue(draft.name);
  const monthlyIssue = monthlyPriceIssue(draft.monthlyPrice);
  const annualIssue = annualPriceIssue(draft.annualPrice);
  const monthly = parsePrice(draft.monthlyPrice);
  const resolvedAnnual =
    draft.annualPrice.trim() === ""
      ? monthly !== null
        ? suggestedAnnualPrice(monthly)
        : null
      : parsePrice(draft.annualPrice);
  const annualHint =
    showAnnual && monthly !== null && monthly > 0 && resolvedAnnual !== null
      ? { equivalent: annualMonthlyEquivalent({ annualPrice: resolvedAnnual }), percent: annualDiscountPercent({ monthlyPrice: monthly, annualPrice: resolvedAnnual }) }
      : null;
  const fallbackName = draft.name.trim() || `${copy.controls.tierNoun} ${index + 1}`;

  return (
    <li className={styles.tierEditor} data-featured={draft.featured}>
      <div className={styles.tierHead}>
        <span className={styles.tierTitle}>
          {draft.featured ? <Star size={13} aria-hidden fill="currentColor" /> : null}
          {copy.controls.tierNoun} {index + 1}
        </span>
        <span className={styles.tierActions}>
          <button
            type="button"
            role="switch"
            aria-checked={draft.featured}
            aria-label={`${copy.controls.featureThisTier}: ${fallbackName}`}
            className={styles.featureToggle}
            onClick={() => onFeature(draft.id, !draft.featured)}
          >
            <Star size={12} aria-hidden fill={draft.featured ? "currentColor" : "none"} />
            {copy.controls.featureThisTier}
          </button>
          <span className={styles.tierOps}>
            <button
              type="button"
              className={styles.iconBtn}
              disabled={index === 0}
              aria-label={`${copy.controls.moveUp}: ${fallbackName}`}
              onClick={() => onMove(draft.id, -1)}
            >
              <ArrowUp size={14} aria-hidden />
            </button>
            <button
              type="button"
              className={styles.iconBtn}
              disabled={index === total - 1}
              aria-label={`${copy.controls.moveDown}: ${fallbackName}`}
              onClick={() => onMove(draft.id, 1)}
            >
              <ArrowDown size={14} aria-hidden />
            </button>
            <button
              type="button"
              className={styles.iconBtn}
              aria-label={`${copy.controls.duplicateTier}: ${fallbackName}`}
              onClick={() => onDuplicate(draft.id)}
            >
              <CopyPlus size={14} aria-hidden />
            </button>
            <button
              type="button"
              className={styles.iconBtn}
              disabled={!removable}
              aria-label={`${copy.controls.removeTier} ${fallbackName}`}
              onClick={() => onRemove(draft.id)}
            >
              <Trash2 size={14} aria-hidden />
            </button>
          </span>
        </span>
      </div>

      <div className={styles.priceRow}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>{copy.controls.name}</span>
          <input
            id={`${draft.id}-name`}
            className={styles.input}
            value={draft.name}
            placeholder={copy.controls.namePlaceholder}
            maxLength={TIER_NAME_MAX}
            aria-invalid={nameIssue !== null}
            aria-describedby={nameIssue ? `${draft.id}-name-issue` : undefined}
            onChange={(event) => onPatch(draft.id, { name: event.target.value })}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>{copy.controls.tagline}</span>
          <input
            className={styles.input}
            value={draft.tagline}
            placeholder={copy.controls.taglinePlaceholder}
            maxLength={TIER_TAGLINE_MAX}
            onChange={(event) => onPatch(draft.id, { tagline: event.target.value })}
          />
        </label>
      </div>
      <IssueNote id={`${draft.id}-name-issue`} issue={nameIssue} />

      <div className={styles.priceRow}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>{copy.controls.monthlyPrice}</span>
          <input
            className={styles.input}
            value={draft.monthlyPrice}
            inputMode="decimal"
            placeholder="29"
            aria-invalid={monthlyIssue !== null}
            aria-describedby={monthlyIssue ? `${draft.id}-monthly-issue` : undefined}
            onChange={(event) => onPatch(draft.id, { monthlyPrice: event.target.value })}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>{copy.controls.annualPrice}</span>
          <input
            className={styles.input}
            value={draft.annualPrice}
            inputMode="decimal"
            placeholder={
              monthly !== null ? `${copy.controls.annualAuto}: ${formatPrice(suggestedAnnualPrice(monthly), currency)}` : copy.controls.annualAuto
            }
            disabled={!showAnnual}
            aria-invalid={annualIssue !== null}
            aria-describedby={annualIssue ? `${draft.id}-annual-issue` : undefined}
            onChange={(event) => onPatch(draft.id, { annualPrice: event.target.value })}
          />
        </label>
      </div>
      <IssueNote id={`${draft.id}-monthly-issue`} issue={monthlyIssue} />
      <IssueNote id={`${draft.id}-annual-issue`} issue={annualIssue} />
      {annualHint ? (
        <p className={styles.hint}>
          ≈ {formatPrice(annualHint.equivalent, currency)}
          {suffix}
          {annualHint.percent !== null && annualHint.percent > 0
            ? ` · ${copy.preview.saveBadge.replace("{percent}", String(annualHint.percent))}`
            : ""}
        </p>
      ) : showAnnual ? (
        <p className={styles.hint}>{copy.controls.annualHelp}</p>
      ) : null}

      <label className={styles.field}>
        <span className={styles.fieldLabel}>{copy.controls.features}</span>
        <textarea
          className={styles.textarea}
          value={draft.featuresText}
          placeholder={copy.controls.featuresPlaceholder}
          rows={4}
          onChange={(event) => onPatch(draft.id, { featuresText: event.target.value })}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>{copy.controls.ctaLabel}</span>
        <input
          className={styles.input}
          value={draft.cta}
          placeholder={copy.controls.ctaPlaceholder}
          maxLength={TIER_CTA_MAX}
          onChange={(event) => onPatch(draft.id, { cta: event.target.value })}
        />
      </label>
    </li>
  );
}

function PreviewCard({
  tier,
  currency,
  suffix,
  isAnnual,
}: {
  tier: PricingTier;
  currency: PricingCurrency;
  suffix: PriceSuffix;
  isAnnual: boolean;
}) {
  const price = isAnnual ? annualMonthlyEquivalent(tier) : tier.monthlyPrice;
  const savings = annualDiscountPercent(tier);
  return (
    <article className={`${styles.priceCard} ${tier.featured ? styles.priceCardFeatured : ""}`}>
      {tier.featured ? <span className={styles.ribbon}>{copy.preview.mostPopular}</span> : null}
      <h3 className={styles.tierName}>{tier.name || copy.preview.untitled}</h3>
      {tier.tagline ? <p className={styles.tierTagline}>{tier.tagline}</p> : null}
      <p className={styles.priceLine}>
        <span className={styles.amount}>
          {price === 0 ? copy.preview.free : formatPrice(price, currency)}
        </span>
        {price !== 0 ? <span className={styles.period}>{suffix}</span> : null}
      </p>
      <div className={styles.billRow}>
        <span className={styles.billNote}>
          {price === 0
            ? ""
            : isAnnual
              ? `${formatPrice(tier.annualPrice, currency)} ${copy.preview.billedAnnually}`
              : copy.preview.billedMonthly}
        </span>
        {isAnnual && savings !== null && savings > 0 ? (
          <span className={styles.saveBadge}>
            {copy.preview.saveBadge.replace("{percent}", String(savings))}
          </span>
        ) : null}
      </div>
      {tier.features.length > 0 ? (
        <ul className={styles.featList}>
          {tier.features.map((feature, index) => (
            // Features are plain strings — repeats are legal, so the key
            // needs the position too.
            <li key={`${index}-${feature.text}`} data-excluded={!feature.included || undefined}>
              {feature.included ? (
                <Check size={14} aria-hidden />
              ) : (
                <X size={14} aria-hidden className={styles.excludedIcon} />
              )}
              <span>{feature.text}</span>
            </li>
          ))}
        </ul>
      ) : (
        <ul className={styles.featList}>
          <li className={styles.emptyFeat}>{copy.preview.emptyFeatures}</li>
        </ul>
      )}
      <span className={styles.mockCta}>{tier.cta || DEFAULT_CTA_LABEL}</span>
    </article>
  );
}

export function SaasPricingGenerator() {
  const [state, setState] = useState<PricingDraftState>(createDefaultPricingState);
  const [billing, setBilling] = useState<BillingMode>("annual");
  const json = useCopyState(2200);
  const markdown = useCopyState(2200);
  const share = useCopyState(2200);
  const pendingFocus = useRef<string | null>(null);
  const lastEncoded = useRef<string>("");
  // The hash writer must not run before the restore attempt — in a hidden
  // tab rAF never fires but timers do, which would overwrite a shared `c=`
  // payload with the default state before it was ever read.
  const restored = useRef(false);

  const config = useMemo(() => buildPricingConfig(state), [state]);
  const serialized = useMemo(() => serializeConfig(config), [config]);
  const markdownTable = useMemo(() => serializeMarkdownTable(config), [config]);
  const isAnnual = state.showAnnual && billing === "annual";

  // Restore a shared draft from the `#c=` hash after mount — the server
  // render always shows defaults, so the swap must happen client-side. The
  // rAF callback keeps the setState out of the effect body (external-system
  // read → state update, per the hooks lint).
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      restored.current = true;
      const decoded = decodeDraftState(window.location.hash);
      if (!decoded) return;
      lastEncoded.current = encodeDraftState(decoded);
      setState(decoded);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  // Keep the URL hash in sync (debounced) so the table is shareable and
  // survives a refresh — replaceState keeps history clean while editing.
  useEffect(() => {
    if (!restored.current) return;
    const timer = setTimeout(() => {
      const encoded = encodeDraftState(state);
      if (encoded === lastEncoded.current) return;
      lastEncoded.current = encoded;
      history.replaceState(null, "", `#${encoded}`);
    }, HASH_WRITE_MS);
    return () => clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    if (pendingFocus.current === null) return;
    const target =
      pendingFocus.current === "add"
        ? document.getElementById("pricing-add-tier")
        : document.getElementById(`${pendingFocus.current}-name`);
    pendingFocus.current = null;
    target?.focus();
  }, [state.tiers]);

  function patchTier(id: string, patch: Partial<TierDraft>) {
    setState((current) => ({
      ...current,
      tiers: current.tiers.map((tier) => (tier.id === id ? { ...tier, ...patch } : tier)),
    }));
  }

  function patchMeta(patch: Partial<Pick<PricingDraftState, "heading" | "subheading">>) {
    setState((current) => ({ ...current, ...patch }));
  }

  function addTier() {
    if (!canAddTier(state.tiers)) return;
    const tier = createTier({
      name: `${copy.controls.tierNoun} ${state.tiers.length + 1}`,
    });
    pendingFocus.current = tier.id;
    setState((current) =>
      canAddTier(current.tiers) ? { ...current, tiers: [...current.tiers, tier] } : current,
    );
  }

  function removeTier(id: string) {
    if (!canRemoveTier(state.tiers)) return;
    pendingFocus.current = "add";
    setState((current) => ({
      ...current,
      tiers: current.tiers.filter((tier) => tier.id !== id),
    }));
  }

  function moveTierById(id: string, direction: -1 | 1) {
    setState((current) => ({ ...current, tiers: moveTier(current.tiers, id, direction) }));
  }

  function duplicateTierById(id: string) {
    const source = state.tiers.find((tier) => tier.id === id);
    if (!source || !canAddTier(state.tiers)) return;
    const clone = duplicateTier(source);
    pendingFocus.current = clone.id;
    setState((current) => {
      if (!canAddTier(current.tiers)) return current;
      const index = current.tiers.findIndex((tier) => tier.id === id);
      const tiers = [...current.tiers];
      tiers.splice(index + 1, 0, clone);
      return { ...current, tiers };
    });
  }

  function featureTier(id: string, featured: boolean) {
    setState((current) => ({ ...current, tiers: setFeaturedTier(current.tiers, id, featured) }));
  }

  function changeCurrency(currency: PricingCurrency) {
    setState((current) => ({ ...current, currency }));
  }

  function changeSuffix(priceSuffix: PriceSuffix) {
    setState((current) => ({ ...current, priceSuffix }));
  }

  function changeBilling(next: BillingMode) {
    if (next === billing) return;
    setBilling(next);
  }

  function toggleAnnual(on: boolean) {
    setState((current) => ({ ...current, showAnnual: on }));
    if (!on) setBilling("monthly");
  }

  function resetAll() {
    pendingFocus.current = null;
    setBilling("annual");
    setState(createDefaultPricingState());
  }

  function navigateBilling(event: ReactKeyboardEvent<HTMLButtonElement>, mode: BillingMode) {
    const order: readonly BillingMode[] = state.showAnnual
      ? ["monthly", "annual"]
      : ["monthly"];
    const index = order.indexOf(mode);
    const next =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? order[(index + 1) % order.length]
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? order[(index + order.length - 1) % order.length]
          : event.key === "Home"
            ? order[0]
            : event.key === "End"
              ? order[order.length - 1]
              : undefined;
    if (next === undefined) return;
    event.preventDefault();
    changeBilling(next);
    const buttons =
      event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("button");
    buttons?.[order.indexOf(next)]?.focus();
  }

  function copyShareLink() {
    const url = `${window.location.origin}${window.location.pathname}#${encodeDraftState(state)}`;
    void share.copy(url);
  }

  const billingModes: readonly { value: BillingMode; label: string }[] = state.showAnnual
    ? [
        { value: "monthly", label: copy.controls.monthly },
        { value: "annual", label: copy.controls.annual },
      ]
    : [{ value: "monthly", label: copy.controls.monthly }];

  return (
    <div className={styles.tool}>
      <div className={styles.controls}>
        <div className={styles.settingsCard}>
          <h2 className={styles.settingsTitle}>
            <SlidersHorizontal size={14} aria-hidden />
            {copy.controls.heading}
          </h2>

          <div className={styles.priceRow}>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>
                {copy.controls.currency}
              </span>
              <FormSelect<PricingCurrency>
                defaultValue={state.currency}
                key={state.currency}
                label={copy.controls.currency}
                name="currency"
                nativeClassName={styles.input}
                onValueChange={changeCurrency}
                options={CURRENCY_OPTIONS}
                pickerClassName={styles.selectPicker}
                triggerClassName={styles.selectTrigger}
              />
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>{copy.controls.priceSuffix}</span>
              <FormSelect<PriceSuffix>
                defaultValue={state.priceSuffix}
                key={state.priceSuffix}
                label={copy.controls.priceSuffix}
                name="priceSuffix"
                nativeClassName={styles.input}
                onValueChange={changeSuffix}
                options={PRICE_SUFFIX_OPTIONS}
                pickerClassName={styles.selectPicker}
                triggerClassName={styles.selectTrigger}
              />
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>{copy.controls.billing}</span>
            <div className={styles.chips} role="radiogroup" aria-label={copy.controls.billing}>
              {billingModes.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  role="radio"
                  aria-checked={billing === mode.value}
                  tabIndex={billing === mode.value ? 0 : -1}
                  className={styles.chip}
                  onClick={() => changeBilling(mode.value)}
                  onKeyDown={(event) => navigateBilling(event, mode.value)}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={state.showAnnual}
            className={styles.switch}
            onClick={() => toggleAnnual(!state.showAnnual)}
          >
            <span>{copy.controls.offerAnnual}</span>
            <span className={styles.switchTrack} aria-hidden />
          </button>

          <div className={styles.pageCopy}>
            <span className={styles.fieldLabel}>{copy.controls.pageCopy}</span>
            <div className={styles.priceRow}>
              <label className={styles.field}>
                <span className={styles.srOnly}>{copy.controls.pageHeading}</span>
                <input
                  className={styles.input}
                  value={state.heading}
                  placeholder={copy.preview.heading}
                  aria-label={copy.controls.pageHeading}
                  maxLength={HEADING_MAX}
                  onChange={(event) => patchMeta({ heading: event.target.value })}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.srOnly}>{copy.controls.pageSubheading}</span>
                <input
                  className={styles.input}
                  value={state.subheading}
                  placeholder={copy.preview.subheading}
                  aria-label={copy.controls.pageSubheading}
                  maxLength={SUBHEADING_MAX}
                  onChange={(event) => patchMeta({ subheading: event.target.value })}
                />
              </label>
            </div>
          </div>
        </div>

        <ol className={styles.tiers} aria-label={copy.controls.tiersLabel}>
          {state.tiers.map((draft, index) => (
            <TierEditor
              key={draft.id}
              draft={draft}
              index={index}
              total={state.tiers.length}
              currency={state.currency}
              suffix={state.priceSuffix}
              showAnnual={state.showAnnual}
              removable={canRemoveTier(state.tiers)}
              onPatch={patchTier}
              onFeature={featureTier}
              onMove={moveTierById}
              onDuplicate={duplicateTierById}
              onRemove={removeTier}
            />
          ))}
        </ol>

        <button
          type="button"
          id="pricing-add-tier"
          className={styles.addBtn}
          disabled={!canAddTier(state.tiers)}
          onClick={addTier}
        >
          <Plus size={15} aria-hidden />
          {copy.controls.addTier}
        </button>
        {!canAddTier(state.tiers) ? (
          <p className={styles.hint}>{copy.controls.maxTiers}</p>
        ) : null}

        <div className={styles.copyBar}>
          <button
            type="button"
            className={styles.copyBtn}
            data-state={json.state}
            onClick={() => void json.copy(serialized)}
          >
            {json.state === "copied" ? (
              <CheckCheck size={15} aria-hidden />
            ) : (
              <Copy size={15} aria-hidden />
            )}
            {json.state === "copied" ? copy.copy.copied : copy.copy.button}
          </button>
          <button
            type="button"
            className={styles.ghostBtn}
            data-state={markdown.state}
            onClick={() => void markdown.copy(markdownTable)}
          >
            {markdown.state === "copied" ? (
              <CheckCheck size={15} aria-hidden />
            ) : (
              <Table size={15} aria-hidden />
            )}
            {markdown.state === "copied" ? copy.copy.copied : copy.copy.buttonMarkdown}
          </button>
          <button
            type="button"
            className={styles.ghostBtn}
            data-state={share.state}
            onClick={copyShareLink}
          >
            {share.state === "copied" ? (
              <CheckCheck size={15} aria-hidden />
            ) : (
              <Link2 size={15} aria-hidden />
            )}
            {share.state === "copied" ? copy.controls.shareCopied : copy.controls.share}
          </button>
          <button
            type="button"
            className={styles.resetBtn}
            aria-label={copy.controls.reset}
            title={copy.controls.reset}
            onClick={resetAll}
          >
            <RotateCcw size={15} aria-hidden />
          </button>
        </div>
        <p className={styles.copyStatus} role="status">
          {json.state === "failed" || markdown.state === "failed"
            ? copy.copy.failed
            : share.state === "failed"
              ? copy.controls.shareFailed
              : json.state === "copied" ||
                  markdown.state === "copied" ||
                  share.state === "copied"
                ? copy.copy.copied
                : copy.copy.hint}
        </p>

        <details className={styles.jsonDetails}>
          <summary>{copy.copy.details}</summary>
          <pre tabIndex={0} aria-label={copy.copy.details}>
            <code>{serialized}</code>
          </pre>
        </details>
      </div>

      <div className={styles.previewWrap}>
        <p className={styles.previewLabel}>
          <span className={styles.previewDot} aria-hidden />
          {copy.preview.label}
        </p>
        <section className={styles.preview} aria-label={copy.preview.label}>
          <div className={styles.previewHead}>
            <h2>{config.heading || copy.preview.heading}</h2>
            <p>{config.subheading || copy.preview.subheading}</p>
          </div>
          <div className={styles.previewGrid}>
            {config.tiers.map((tier) => (
              <PreviewCard
                key={tier.id}
                tier={tier}
                currency={config.currency}
                suffix={config.priceSuffix}
                isAnnual={isAnnual}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
