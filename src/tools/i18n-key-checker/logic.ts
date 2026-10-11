/**
 * Pure locale-coverage diff for the i18n key checker tool. Stdlib only — the
 * tool module is meant to be portable, so nothing here touches the DOM,
 * React, or app imports.
 */

export type LocaleValueType = "string" | "number" | "boolean" | "array" | "object" | "null";

export type FlattenedEntry = Readonly<{ type: LocaleValueType; value: unknown }>;

/** dot.path → leaf. Objects recurse; scalars, arrays, null and {} are leaves. */
export type FlattenedLocale = Map<string, FlattenedEntry>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function leafType(value: unknown): LocaleValueType {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  const t = typeof value;
  return t === "string" || t === "number" || t === "boolean" ? t : "object";
}

/**
 * Flattens to dot-separated leaf paths. `{"a.b": 1}` and `{"a": {"b": 2}}`
 * land on the same path — the later entry wins and the path is pushed to
 * `collisions` so callers can surface the ambiguity instead of hiding it.
 */
export function flattenLocale(
  value: unknown,
  prefix = "",
  collisions?: string[],
): FlattenedLocale {
  const out: FlattenedLocale = new Map();
  const walk = (node: unknown, path: string): void => {
    if (isPlainObject(node)) {
      const keys = Object.keys(node);
      if (keys.length > 0) {
        for (const key of keys) {
          walk(node[key], path === "" ? key : `${path}.${key}`);
        }
        return;
      }
    }
    if (out.has(path)) collisions?.push(path);
    out.set(path, { type: leafType(node), value: node });
  };
  walk(value, prefix);
  return out;
}

const IDENT = "[A-Za-z_$][\\w$]*(?:[.-][\\w$]+)*";
/** `{var}` / `{{var}}` / `{arg, kind` head — captures name and optional kind. */
const TOKEN_HEAD_RE = new RegExp(`^\\{(\\{)?\\s*(${IDENT})\\s*(?:(,)\\s*(${IDENT}))?`);
/** ICU message-format kinds whose bodies are option maps, not placeholders. */
const ICU_MESSAGE_KINDS = new Set(["plural", "select", "selectordinal"]);

/** Index just past the balanced `{...}` span that opened before `from`. */
function skipBalanced(chunk: string, from: number): number {
  let depth = 1;
  let i = from;
  while (i < chunk.length && depth > 0) {
    if (chunk[i] === "{") depth += 1;
    else if (chunk[i] === "}") depth -= 1;
    i += 1;
  }
  return i;
}

/**
 * Distinct `{var}`/`{{var}}`/ICU-argument names referenced by a string.
 * ICU args (`{count, plural, one {…} other {…}}`) count their argument name
 * and recurse into option bodies — selector words and `#` never register.
 */
export function extractPlaceholders(text: string): string[] {
  const found = new Set<string>();

  const scan = (chunk: string): void => {
    let i = 0;
    while (i < chunk.length) {
      const open = chunk.indexOf("{", i);
      if (open === -1) return;
      const head = TOKEN_HEAD_RE.exec(chunk.slice(open));
      if (!head) {
        i = open + 1;
        continue;
      }
      const [, doubleBrace, name, hasComma, kindWord] = head;
      if (!name) {
        i = open + 1;
        continue;
      }
      const after = open + head[0].length;
      if (!hasComma) {
        const close = doubleBrace ? "}}" : "}";
        if (chunk.startsWith(close, after)) {
          found.add(name);
          i = after + close.length;
        } else {
          i = open + 1; // stray `{` — not a token
        }
        continue;
      }
      if (kindWord && ICU_MESSAGE_KINDS.has(kindWord)) {
        found.add(name);
        // Option bodies live one level deeper — recurse on each so nested
        // `{var}` tokens still count while selector words are skipped.
        let depth = 1;
        let j = after;
        let inner = -1;
        while (j < chunk.length && depth > 0) {
          const ch = chunk[j];
          if (ch === "{") {
            depth += 1;
            if (depth === 2 && inner === -1) inner = j + 1;
          } else if (ch === "}") {
            if (depth === 2 && inner !== -1) {
              scan(chunk.slice(inner, j));
              inner = -1;
            }
            depth -= 1;
          }
          j += 1;
        }
        i = j;
        continue;
      }
      // `{name, number|date|time|…, spec}` — the name is the placeholder;
      // the format spec body is skipped so its braces can't leak names.
      found.add(name);
      i = skipBalanced(chunk, after);
    }
  };

  scan(text);
  return [...found];
}

export type LocaleTypeMismatch = Readonly<{
  key: string;
  baseType: LocaleValueType;
  targetType: LocaleValueType;
}>;

export type LocalePlaceholderMismatch = Readonly<{ key: string; missingVars: string[] }>;

export type LocaleArrayMismatch = Readonly<{
  key: string;
  baseLength: number;
  targetLength: number;
}>;

export type LocaleDiff = Readonly<{
  /** In base, absent from target. */
  missing: string[];
  /** In target, absent from base. */
  extra: string[];
  /** Same key, different leaf type — placeholders can't be compared here. */
  typeMismatch: LocaleTypeMismatch[];
  /** Target string is blank while the base string has content. */
  emptyTarget: string[];
  /** Base `{var}` tokens that did not survive into the target string. */
  placeholderMismatch: LocalePlaceholderMismatch[];
  /** Both arrays but different lengths — content drift is expected, size is not. */
  arrayMismatch: LocaleArrayMismatch[];
}>;

const byKey = (a: string, b: string): number => a.localeCompare(b);

export function diffLocales(base: FlattenedLocale, target: FlattenedLocale): LocaleDiff {
  const missing: string[] = [];
  const extra: string[] = [];
  const typeMismatch: LocaleTypeMismatch[] = [];
  const emptyTarget: string[] = [];
  const placeholderMismatch: LocalePlaceholderMismatch[] = [];
  const arrayMismatch: LocaleArrayMismatch[] = [];

  for (const [key, entry] of base) {
    const targetEntry = target.get(key);
    if (!targetEntry) {
      missing.push(key);
      continue;
    }
    if (targetEntry.type !== entry.type) {
      typeMismatch.push({ key, baseType: entry.type, targetType: targetEntry.type });
      continue;
    }
    if (entry.type === "array") {
      const baseLength = (entry.value as unknown[]).length;
      const targetLength = (targetEntry.value as unknown[]).length;
      if (baseLength !== targetLength) {
        arrayMismatch.push({ key, baseLength, targetLength });
      }
      continue;
    }
    if (entry.type === "string") {
      const baseText = entry.value as string;
      const targetText = targetEntry.value as string;
      if (targetText.trim() === "" && baseText.trim() !== "") {
        emptyTarget.push(key);
      }
      const targetVars = extractPlaceholders(targetText);
      const missingVars = extractPlaceholders(baseText).filter(
        (name) => !targetVars.includes(name),
      );
      if (missingVars.length > 0) {
        placeholderMismatch.push({ key, missingVars: missingVars.sort(byKey) });
      }
    }
  }
  for (const key of target.keys()) {
    if (!base.has(key)) extra.push(key);
  }

  missing.sort(byKey);
  extra.sort(byKey);
  emptyTarget.sort(byKey);
  typeMismatch.sort((a, b) => byKey(a.key, b.key));
  placeholderMismatch.sort((a, b) => byKey(a.key, b.key));
  arrayMismatch.sort((a, b) => byKey(a.key, b.key));
  return { missing, extra, typeMismatch, emptyTarget, placeholderMismatch, arrayMismatch };
}

export type ParseLocaleResult =
  Readonly<{ ok: true; value: unknown }> | Readonly<{ ok: false; message: string }>;

export function parseLocaleJson(raw: string): ParseLocaleResult {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return { ok: false, message: "Nothing to parse yet — paste a locale JSON file." };
  }
  try {
    return { ok: true, value: JSON.parse(trimmed) as unknown };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Invalid JSON." };
  }
}
