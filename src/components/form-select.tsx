"use client";

import { ChevronDown } from "lucide-react";

import styles from "./form-select.module.css";

export type FormSelectOption<T extends string> = Readonly<{
  label: string;
  value: T;
}>;

function joinClassNames(...names: (string | undefined)[]): string {
  return names.filter(Boolean).join(" ");
}

/**
 * A labelled, keyboard-complete select: a real native `<select>` does all
 * the work (arrows, type-ahead, Home/End, screen-reader announcements) and
 * keeps `name`/`value` for no-JS form posts. The custom chrome is only a
 * chevron — the popup stays native on purpose.
 *
 * `label` is the accessible name; render the visible label outside as a
 * plain span/legend (a wrapping <label> would steal focus semantics).
 *
 * `onValueChange` observes the chosen value for controlled widgets; omit it
 * in plain form posts where the submitted value is enough.
 */
export function FormSelect<T extends string>({
  defaultValue,
  disabled = false,
  label,
  name,
  nativeClassName,
  onValueChange,
  options,
  pickerClassName,
  triggerClassName,
}: Readonly<{
  defaultValue: T;
  disabled?: boolean;
  label: string;
  name: string;
  /** Extra class on the `<select>` (raw-field styling hook). */
  nativeClassName?: string | undefined;
  /** Called with the new value on change. */
  onValueChange?: ((value: T) => void) | undefined;
  options: readonly FormSelectOption<T>[];
  /** Extra class on the wrapper (layout: width, margin…). */
  pickerClassName?: string | undefined;
  /** Extra class on the `<select>` (field-matching metrics). */
  triggerClassName?: string | undefined;
}>) {
  return (
    <div className={joinClassNames(styles.picker, pickerClassName)}>
      <select
        aria-label={label}
        className={joinClassNames(styles.select, nativeClassName, triggerClassName)}
        defaultValue={defaultValue}
        disabled={disabled}
        name={name}
        onChange={(event) => onValueChange?.(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown size={15} strokeWidth={1.5} aria-hidden className={styles.chevron} />
    </div>
  );
}
