/**
 * Tiny SQL highlighter for the generated policy output — not a parser, just
 * a per-line tokenizer tuned to the SQL this tool emits. Pure and stdlib
 * only, so it unit-tests like logic.ts.
 */

export type SqlTokenKind =
  | "comment"
  | "keyword"
  | "func"
  | "role"
  | "ident"
  | "literal"
  | "plain";

export type SqlToken = Readonly<{ text: string; kind: SqlTokenKind }>;

const KEYWORDS = new Set([
  "alter",
  "table",
  "enable",
  "force",
  "row",
  "level",
  "security",
  "create",
  "policy",
  "on",
  "for",
  "to",
  "using",
  "with",
  "check",
  "select",
  "from",
  "where",
  "and",
  "or",
  "not",
  "as",
  "insert",
  "update",
  "delete",
  "drop",
  "if",
  "references",
  "grant",
  "revoke",
  "all",
]);

const ROLES = new Set(["anon", "authenticated", "service_role", "public"]);
const LITERALS = new Set(["true", "false", "null"]);

const WORD_RE = /^[a-zA-Z_][a-zA-Z0-9_.$]*/;

function classifyWord(word: string): SqlTokenKind {
  const lower = word.toLowerCase();
  if (lower === "auth.uid" || lower === "auth.jwt") return "func";
  if (lower === "exists") return "func";
  if (ROLES.has(lower)) return "role";
  if (LITERALS.has(lower)) return "literal";
  if (KEYWORDS.has(lower)) return "keyword";
  return "plain";
}

/**
 * One line of SQL → styled tokens. `--` starts a comment (a `"` can't open
 * inside one); `"…"` is a quoted identifier; bare words classify by
 * dictionary; digits are literals; everything else passes through plain.
 */
export function highlightLine(line: string): SqlToken[] {
  const tokens: SqlToken[] = [];
  let i = 0;
  const push = (kind: SqlTokenKind, text: string) => {
    if (text.length === 0) return;
    const last = tokens[tokens.length - 1];
    if (last && last.kind === kind) {
      tokens[tokens.length - 1] = { kind, text: last.text + text };
    } else {
      tokens.push({ kind, text });
    }
  };

  while (i < line.length) {
    const commentAt = line.indexOf("--", i);
    const quoteAt = line.indexOf('"', i);
    // Comment first — but only when it isn't inside a quoted identifier.
    if (commentAt !== -1 && (quoteAt === -1 || commentAt < quoteAt)) {
      push("plain", line.slice(i, commentAt));
      push("comment", line.slice(commentAt));
      return tokens;
    }
    const ch = line[i]!;
    if (ch === '"') {
      const close = line.indexOf('"', i + 1);
      const end = close === -1 ? line.length : close + 1;
      push("ident", line.slice(i, end));
      i = end;
      continue;
    }
    const word = WORD_RE.exec(line.slice(i));
    if (word) {
      push(classifyWord(word[0]), word[0]);
      i += word[0].length;
      continue;
    }
    if (/\d/.test(ch)) {
      const num = /^\d+(\.\d+)?/.exec(line.slice(i));
      push("literal", num ? num[0] : ch);
      i += num ? num[0].length : 1;
      continue;
    }
    // Whitespace and punctuation pass through untouched.
    push("plain", ch);
    i += 1;
  }
  return tokens;
}

/** Whole script → one token list per line, ready to render. */
export function highlightSql(sql: string): SqlToken[][] {
  return sql.split("\n").map(highlightLine);
}
