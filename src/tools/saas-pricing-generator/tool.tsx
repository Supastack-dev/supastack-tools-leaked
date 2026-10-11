"use client";

import { Check, CheckCheck, Copy, Plus, SlidersHorizontal, Star, Trash2 } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import { FormSelect } from "../../components/form-select";
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
  formatPrice,
  monthlyPriceIssue,
  suggestedAnnualPrice,
  parsePrice,
  serializeConfig,
  setFeaturedTier,
  TIER_NAME_MAX,
  tierNameIssue,
  type FieldIssue,
  type PricingCurrency,
  type PricingDraftState,
  type PricingTier,
  type TierDraft,
} from "./logic";
import styles from "./tool.module.css";

type BillingMode = "monthly" | "annual";
type CopyState = "idle" | "copied" | "failed";

const ISSUE_TEXT: Record<FieldIssue, string> = {
  required: copy.controls.issues.required,
  invalid: copy.controls.issues.invalid,
  "too-long": copy.controls.issues.tooLong,
};

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
  currency,
  showAnnual,
  removable,
  onPatch,
  onFeature,
  onRemove,
}: {
  draft: TierDraft;
  index: number;
  currency: PricingCurrency;
  showAnnual: boolean;
  removable: boolean;
  onPatch: (id: string, patch: Partial<TierDraft>) => void;
  onFeature: (id: string, featured: boolean) => void;
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
          <button
            type="button"
            className={styles.removeBtn}
            disabled={!removable}
            aria-label={`${copy.controls.removeTier} ${fallbackName}`}
            onClick={() => onRemove(draft.id)}
          >
            <Trash2 size={14} aria-hidden />
          </button>
        </span>
      </div>

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
          {copy.preview.perMonth}
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
    </li>
  );
}

function PreviewCard({
  tier,
  currency,
  isAnnual,
}: {
  tier: PricingTier;
  currency: PricingCurrency;
  isAnnual: boolean;
}) {
  const price = isAnnual ? annualMonthlyEquivalent(tier) : tier.monthlyPrice;
  const savings = annualDiscountPercent(tier);
  return (
    <article className={`${styles.priceCard} ${tier.featured ? styles.priceCardFeatured : ""}`}>
      {tier.featured ? <span className={styles.ribbon}>{copy.preview.mostPopular}</span> : null}
      <h3 className={styles.tierName}>{tier.name || copy.preview.untitled}</h3>
      <p className={styles.priceLine}>
        <span className={styles.amount}>
          {price === 0 ? copy.preview.free : formatPrice(price, currency)}
        </span>
        {price !== 0 ? <span className={styles.period}>{copy.preview.perMonth}</span> : null}
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
            <li key={`${index}-${feature}`}>
              <Check size={14} aria-hidden />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      ) : (
        <ul className={styles.featList}>
          <li className={styles.emptyFeat}>{copy.preview.emptyFeatures}</li>
        </ul>
      )}
      <span className={styles.mockCta}>{copy.preview.cta}</span>
    </article>
  );
}

export function SaasPricingGenerator() {
  const [state, setState] = useState<PricingDraftState>(createDefaultPricingState);
  const [billing, setBilling] = useState<BillingMode>("annual");
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingFocus = useRef<string | null>(null);

  const config = useMemo(() => buildPricingConfig(state), [state]);
  const serialized = useMemo(() => serializeConfig(config), [config]);
  const isAnnual = state.showAnnual && billing === "annual";

  useEffect(
    () => () => {
      if (copyTimer.current !== null) clearTimeout(copyTimer.current);
    },
    [],
  );

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

  function featureTier(id: string, featured: boolean) {
    setState((current) => ({ ...current, tiers: setFeaturedTier(current.tiers, id, featured) }));
  }

  function changeCurrency(currency: PricingCurrency) {
    setState((current) => ({ ...current, currency }));
  }

  function changeBilling(next: BillingMode) {
    if (next === billing) return;
    setBilling(next);
  }

  function toggleAnnual(on: boolean) {
    setState((current) => ({ ...current, showAnnual: on }));
    if (!on) setBilling("monthly");
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

  function copyJson() {
    void (async () => {
      try {
        await navigator.clipboard.writeText(serialized);
        setCopyState("copied");
        if (copyTimer.current !== null) clearTimeout(copyTimer.current);
        copyTimer.current = setTimeout(() => setCopyState("idle"), 2200);
      } catch {
        setCopyState("failed");
      }
    })();
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

          <div className={styles.field}>
            <span className={styles.fieldLabel} id="pricing-currency-label">
              {copy.controls.currency}
            </span>
            <FormSelect<PricingCurrency>
              defaultValue={state.currency}
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
        </div>

        <ol className={styles.tiers} aria-label={copy.controls.tiersLabel}>
          {state.tiers.map((draft, index) => (
            <TierEditor
              key={draft.id}
              draft={draft}
              index={index}
              currency={state.currency}
              showAnnual={state.showAnnual}
              removable={canRemoveTier(state.tiers)}
              onPatch={patchTier}
              onFeature={featureTier}
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
          <button type="button" className={styles.copyBtn} onClick={copyJson}>
            {copyState === "copied" ? (
              <CheckCheck size={15} aria-hidden />
            ) : (
              <Copy size={15} aria-hidden />
            )}
            {copyState === "copied" ? copy.copy.copied : copy.copy.button}
          </button>
          <span className={styles.copyStatus} role="status">
            {copyState === "copied"
              ? copy.copy.copied
              : copyState === "failed"
                ? copy.copy.failed
                : copy.copy.hint}
          </span>
        </div>

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
            <h2>{copy.preview.heading}</h2>
            <p>{copy.preview.subheading}</p>
          </div>
          <div className={styles.previewGrid}>
            {config.tiers.map((tier) => (
              <PreviewCard
                key={tier.id}
                tier={tier}
                currency={config.currency}
                isAnnual={isAnnual}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
