/**
 * Heading pattern matcher (docs/spec.md 2.10 "MATCH", "FAILING PIECE",
 * "PLACEHOLDERS"; ADR 0011, ADR 0012). It works on the parsed PIECES of a
 * `[pattern:"..."]` tag (src/tags/visitors/pattern.ts); the tag syntax itself
 * lives in grammar/*.g4 only. The regular expressions below are VALUE
 * patterns of the placeholder formats, not tag patterns.
 *
 * Every format of the 2.10 table is implemented: the default format of each
 * placeholder (no format, or its default name written: `human`, `decimal`,
 * `full`) and the other formats (phase Pf), whose predicates live in
 * ./values.ts. The visitor has already refused an unknown format or a missing
 * argument (`MTL014`), so a valid piece always finds its check here.
 */
import type { BodyTag, PatternPiece } from "../tags/ast.js";
import {
  isCamelcaseText,
  isHexDigits,
  isIsoDate,
  isKebabcaseText,
  isLowercaseText,
  isPaddedDigits,
  isPrecisionNumber,
  isScientificNumber,
  isScreamcaseText,
  isSemver,
  isSemverCore,
  isSemverMajorMinor,
  isSignedDigits,
  isSnakecaseText,
  isUidDigits,
  isUppercaseText,
  isYear,
  isYearMonth,
} from "./values.js";

type Placeholder = Extract<PatternPiece, { readonly kind: "placeholder" }>;
/** A format check: the exact value and the format argument (null when none). */
type FormatCheck = (value: string, argument: number | null) => boolean;

/** NUMERIC TEXT (spec 2.10): `-?D+(\.D+)?([eE][+-]?D+)?`, `D` an ASCII digit (C06). */
const NUMERIC_TEXT = /^-?[0-9]+(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?$/;
/** `{number}` / `decimal` (spec 2.10, A72n): `-?D+(\.D+)?`, leading zeros allowed. */
const DECIMAL = /^-?[0-9]+(?:\.[0-9]+)?$/;
/** `{digits}` default (spec 2.10, A72n): `0|[1-9]D*`, no sign, no leading zero. */
const DIGITS = /^(?:0|[1-9][0-9]*)$/;
/** `{char}` (spec 2.10): one code point of the general category Letter. */
const LETTER = /^\p{L}$/u;

/** True when `value` is PURELY NUMERIC: its whole text is a NUMERIC TEXT (spec 2.10). */
export function isNumericText(value: string): boolean {
  return NUMERIC_TEXT.test(value);
}

/**
 * The default format name of each placeholder (spec 2.10 table); `{digits}`
 * and `{char}` have none, so their default is keyed by the empty name.
 */
const DEFAULT_FORMAT: Readonly<Record<Placeholder["name"], string>> = {
  text: "human",
  number: "decimal",
  digits: "",
  semver: "full",
  date: "full",
  char: "",
};

/** `padding:N` and `precision:N` need their argument; the visitor guarantees it (MTL014). */
const withArgument =
  (check: (value: string, argument: number) => boolean): FormatCheck =>
  (value, argument) =>
    argument !== null && check(value, argument);

/** Per placeholder, each format name (lowercase) to its value check (spec 2.10 "Each format"). */
const FORMAT_CHECKS: Readonly<Record<Placeholder["name"], ReadonlyMap<string, FormatCheck>>> = {
  text: new Map<string, FormatCheck>([
    ["human", (value) => value !== "" && !isNumericText(value)],
    ["snakecase", isSnakecaseText],
    ["camelcase", isCamelcaseText],
    ["screamcase", isScreamcaseText],
    ["kebabcase", isKebabcaseText],
    ["lowercase", isLowercaseText],
    ["uppercase", isUppercaseText],
  ]),
  number: new Map<string, FormatCheck>([
    ["decimal", (value) => DECIMAL.test(value)],
    ["scientific", isScientificNumber],
    ["precision", withArgument(isPrecisionNumber)],
  ]),
  digits: new Map<string, FormatCheck>([
    ["", (value) => DIGITS.test(value)],
    ["signed", isSignedDigits],
    ["hex", isHexDigits],
    ["uid", isUidDigits],
    ["padding", withArgument(isPaddedDigits)],
  ]),
  semver: new Map<string, FormatCheck>([
    ["full", isSemver],
    ["core", isSemverCore],
    ["major-minor", isSemverMajorMinor],
  ]),
  date: new Map<string, FormatCheck>([
    ["full", isIsoDate],
    ["year-month", isYearMonth],
    ["year", isYear],
  ]),
  char: new Map<string, FormatCheck>([["", (value) => LETTER.test(value)]]),
};

/**
 * The effective format name of a placeholder (spec 2.10, A72m): the format written, or the
 * default name of the placeholder when none is written (empty for `{digits}` and `{char}`,
 * which have no default name). So `{semver}` and `{semver:format:full}` give the same name.
 */
export function formatName(piece: Placeholder): string {
  return piece.format ?? DEFAULT_FORMAT[piece.name];
}

/**
 * True when `value` (the exact text a placeholder covers, never trimmed) is a
 * value of the placeholder and its format (spec 2.10 "Each format"). No format
 * and the default format name written are the same check. A format the table
 * does not know (refused by `MTL014` before matching) accepts nothing.
 */
export function isPlaceholderValue(piece: Placeholder, value: string): boolean {
  const check = FORMAT_CHECKS[piece.name].get(formatName(piece));
  return check !== undefined && check(value, piece.argument);
}

/** A successful match: the value of each placeholder, left to right (spec 2.10 MATCH). */
export interface PatternMatch {
  readonly values: readonly string[];
}

/**
 * Cuts of `chars[from..]` into parts for `pieces[at..]`, shortest part first
 * for each placeholder from left to right (spec 2.10 MATCH tie-break). With
 * `whole` the last piece must end at the end of the text; without it any
 * prefix will do (a HEAD, spec 2.10 FAILING PIECE). Returns the placeholder
 * values of the first cut found, or null. Code points, not UTF-16 units, so a
 * cut never splits a surrogate pair. `failed` remembers the (piece, start)
 * pairs known to have no cut, so a long heading stays linear per placeholder.
 */
function cut(
  pieces: readonly PatternPiece[],
  chars: readonly string[],
  whole: boolean,
  at = 0,
  from = 0,
  failed = new Set<number>(),
): string[] | null {
  const piece = pieces[at];
  if (piece === undefined) return !whole || from === chars.length ? [] : null;
  const key = at * (chars.length + 1) + from;
  if (failed.has(key) || piece.kind === "invalid") return null;
  let found: string[] | null = null;
  if (piece.kind === "literal") {
    const literal = [...piece.text];
    const equal = literal.every((char, index) => chars[from + index] === char);
    found = equal ? cut(pieces, chars, whole, at + 1, from + literal.length, failed) : null;
  } else {
    for (let end = from + 1; end <= chars.length && found === null; end += 1) {
      const value = chars.slice(from, end).join("");
      if (!isPlaceholderValue(piece, value)) continue;
      const rest = cut(pieces, chars, whole, at + 1, end, failed);
      if (rest !== null) found = [value, ...rest];
    }
  }
  if (found === null) failed.add(key);
  return found;
}

/**
 * The match of a pattern on the WHOLE stored heading text (spec 2.10 MATCH):
 * nothing trimmed, literal parts case-sensitive. Null when it does not match
 * (or when a piece is invalid: an invalid pattern matches nothing).
 */
export function matchPattern(pieces: readonly PatternPiece[], text: string): PatternMatch | null {
  if (pieces.length === 0) return null;
  const values = cut(pieces, [...text], true);
  return values === null ? null : { values };
}

/**
 * The FAILING PIECE (spec 2.10) of a text the pattern does not match: the
 * piece k for the smallest k such that pieces 1 to k match no head of the text
 * (the whole text when k is the last piece). Null when the pattern matches.
 */
export function failingPiece(pieces: readonly PatternPiece[], text: string): PatternPiece | null {
  const chars = [...text];
  for (let count = 1; count <= pieces.length; count += 1) {
    const head = pieces.slice(0, count);
    if (cut(head, chars, count === pieces.length) === null) return pieces[count - 1] ?? null;
  }
  return null;
}

/*
 * ORDER KEYS of the heading order tags (spec 2.10 "Order", A72m, A72n). Each scan reads the
 * whole stored heading text; the regular expressions below are VALUE patterns, not tag
 * patterns. `D` is an ASCII digit (C06).
 */

/** A heading `[order:...]` tag (spec 2.10 "Order"). */
export type OrderTag = Extract<BodyTag, { readonly kind: "order" }>;
/** What an order tag compares: the whole text, or its first number, date or semver. */
export type OrderBy = OrderTag["by"];
/** An order key: a string (whole text, ISO date, semver) or a number (first number). */
export type OrderKey = string | number;

/** The order tag token in its canonical lowercase form, without brackets (spec 2.10, 8.3). */
export function orderToken(tag: OrderTag): string {
  const by = tag.by === "text" ? "" : `first:${tag.by.slice("first-".length)}:`;
  return `order:${by}${tag.direction}`;
}

/** `{tag}` of spec 4.3 for MTL609: the order tag in its canonical lowercase form. */
export const orderTagText = (tag: OrderTag): string => `[${orderToken(tag)}]`;

const ASCII_DIGIT = /^[0-9]$/;
const isAsciiDigit = (char: string | undefined): boolean =>
  char !== undefined && ASCII_DIGIT.test(char);
/**
 * The digits-onward part of a NUMERIC TEXT (spec 2.10) at the start of a text: each part is
 * greedy and optional parts are taken when present, so the match is the LONGEST prefix.
 */
const UNSIGNED_NUMERIC = /^[0-9]+(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/;
/** A letter (general category L, spec 2.10 LETTER) or an ASCII digit. */
const LETTER_OR_DIGIT = /^[\p{L}0-9]$/u;
/** The characters a SEMVER is made of (spec 2.9 grammar). */
const SEMVER_CHAR = /^[0-9A-Za-z.+-]$/;
const NUMERIC_IDENTIFIER = /^[0-9]+$/;

/**
 * FIRST NUMBER (spec 2.10 "Order"): the first ASCII digit starts it; it extends to the longest
 * NUMERIC TEXT from that digit; a `-` right before the digit belongs to it when it is the first
 * character or the character before it is not a letter or digit. Its value as an IEEE double;
 * null when the text has no ASCII digit.
 */
export function firstNumber(text: string): number | null {
  // Code points, so the character before a `-` is never half of a surrogate pair.
  const chars = [...text];
  const start = chars.findIndex((char) => isAsciiDigit(char));
  if (start < 0) return null;
  const digits = UNSIGNED_NUMERIC.exec(chars.slice(start).join(""))?.[0] ?? "";
  const beforeSign = chars[start - 2];
  const signed =
    chars[start - 1] === "-" && (beforeSign === undefined || !LETTER_OR_DIGIT.test(beforeSign));
  return Number(`${signed ? "-" : ""}${digits}`);
}

/**
 * FIRST DATE (spec 2.10 "Order"): the leftmost 10-character substring that is an ISO DATE
 * (a real calendar date) with no ASCII digit right before or right after it; a shape that fails
 * the calendar test is skipped. `YYYY-MM-DD` strings sort chronologically. Null when none.
 */
export function firstDate(text: string): string | null {
  for (let start = 0; start + 10 <= text.length; start += 1) {
    const candidate = text.slice(start, start + 10);
    if (isAsciiDigit(text[start - 1]) || isAsciiDigit(text[start + 10])) continue;
    if (isIsoDate(candidate)) return candidate;
  }
  return null;
}

/**
 * FIRST SEMVER (spec 2.10 "Order", A72n): a candidate starts at an ASCII digit with no ASCII
 * digit and no `.` right before it; it is the LONGEST prefix from there that is a SEMVER
 * (spec 2.9); it is kept when no ASCII digit follows it, else (or when no prefix is a SEMVER)
 * the scan goes on at the next start. Null when none.
 */
export function firstSemver(text: string): string | null {
  for (let start = 0; start < text.length; start += 1) {
    if (!isAsciiDigit(text[start])) continue;
    const before = text[start - 1];
    if (isAsciiDigit(before) || before === ".") continue;
    let limit = start;
    while (limit < text.length && SEMVER_CHAR.test(text[limit] ?? "")) limit += 1;
    for (let end = limit; end > start; end -= 1) {
      const candidate = text.slice(start, end);
      if (!isSemver(candidate)) continue;
      if (!isAsciiDigit(text[end])) return candidate;
      break;
    }
  }
  return null;
}

/** Compares two numeric identifiers without leading zeros (any length) by value. */
const compareDigits = (a: string, b: string): number =>
  a.length !== b.length ? a.length - b.length : a < b ? -1 : a > b ? 1 : 0;

/** Compares two pre-release identifiers (SemVer 2.0.0 section 11.4.1 to 11.4.3). */
function compareIdentifier(a: string, b: string): number {
  const numericA = NUMERIC_IDENTIFIER.test(a);
  const numericB = NUMERIC_IDENTIFIER.test(b);
  if (numericA && numericB) return compareDigits(a, b);
  if (numericA !== numericB) return numericA ? -1 : 1;
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * SemVer 2.0.0 precedence (semver.org section 11) of two SEMVERs: major, minor and patch
 * numerically, a pre-release below its release, pre-release identifiers one by one (a shorter
 * set below a longer one with an equal prefix), build metadata ignored. Negative, 0 or positive.
 */
export function compareSemver(a: string, b: string): number {
  const split = (version: string): { core: string[]; pre: string[] | null } => {
    const withoutBuild = version.split("+")[0] ?? "";
    const dash = withoutBuild.indexOf("-");
    const core = dash < 0 ? withoutBuild : withoutBuild.slice(0, dash);
    return {
      core: core.split("."),
      pre: dash < 0 ? null : withoutBuild.slice(dash + 1).split("."),
    };
  };
  const left = split(a);
  const right = split(b);
  for (let index = 0; index < 3; index += 1) {
    const result = compareDigits(left.core[index] ?? "", right.core[index] ?? "");
    if (result !== 0) return result;
  }
  if (left.pre === null || right.pre === null) {
    return left.pre === right.pre ? 0 : left.pre === null ? 1 : -1;
  }
  const length = Math.min(left.pre.length, right.pre.length);
  for (let index = 0; index < length; index += 1) {
    const result = compareIdentifier(left.pre[index] ?? "", right.pre[index] ?? "");
    if (result !== 0) return result;
  }
  return left.pre.length - right.pre.length;
}

/**
 * The ORDER KEY of a heading text (spec 2.10 "Order"): the whole text (`[order:ascending]`,
 * `[order:descending]`), else its FIRST NUMBER, FIRST DATE or FIRST SEMVER; null when a
 * `first:` form finds no key (the instance takes no part in the pairs).
 */
export function orderKey(by: OrderBy, text: string): OrderKey | null {
  if (by === "first-number") return firstNumber(text);
  if (by === "first-date") return firstDate(text);
  if (by === "first-semver") return firstSemver(text);
  return text;
}

/**
 * Compares two order keys of one form: numbers by value, semvers by precedence, the whole text
 * and ISO dates as strings in plain UTF-16 code-unit order (spec 2.10, 8.4). Negative when `a`
 * is below `b`, 0 when equal, positive when above.
 */
export function compareOrderKeys(by: OrderBy, a: OrderKey, b: OrderKey): number {
  if (typeof a === "number" && typeof b === "number") return a < b ? -1 : a > b ? 1 : 0;
  const left = String(a);
  const right = String(b);
  if (by === "first-semver") return compareSemver(left, right);
  return left < right ? -1 : left > right ? 1 : 0;
}
