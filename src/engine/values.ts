/**
 * Loose VALUE predicates used by type inference (docs/spec.md 3.3). These are
 * value patterns, not tag patterns: tags are parsed by grammar/*.g4 only.
 * `isPathLike` is shared with validation on purpose (spec 3.4).
 *
 * Python `re.match(...$)` also matches before one final newline; `pyMatch`
 * keeps that behaviour for parity with the legacy predicates.
 */
import type { FilenameConvention } from "../tags/ast.js";
import { isList, type YamlValue } from "./model.js";

const DATE_SHAPES: readonly RegExp[] = [
  /^\d{4}-\d{2}-\d{2}$/,
  /^\d{4}-\d{2}$/,
  /^\d{4}$/,
  /^\d{2}\/\d{2}\/\d{4}$/,
];
const ONGOING_MARKER = /^pr[ée]sent$/iu;
const URL_LIKE = /^[A-Za-z][A-Za-z0-9+.-]*:\/\/\S+$/;
/** Alias-shaped value `@<name>/<rest>`, captures name and rest (spec 2.8 step 1, legacy `_ALIAS_RE`). */
export const ALIAS_LIKE = /^@([A-Za-z0-9_-]+)\/(.+)$/;
/** Number text `-?digits(.digits)?`: no exponent, no plus sign, ASCII digits (spec 3.4 `float`). */
export const FLOAT_PATTERN = /^-?\d+(\.\d+)?$/;
const PATH_SHAPE = /^(?:[A-Za-z]:)?[\\/]?(?:[^\s\\/]+[\\/])+[^\s\\/]*$/;
const PATH_ANCHOR = /^(?:\.{1,2}[\\/]|[\\/]|~[\\/]|[A-Za-z]:[\\/])/;
const PATH_EXTENSION = /\.[A-Za-z0-9]{1,5}$/;
const DRIVE_PREFIX = /^[A-Za-z]:/;
const PATH_FORBIDDEN = '<>"|?*';

/** Case styles of docs/spec.md 2.3 (legacy `_FILENAME_CASE_VALIDATORS`). */
const CASE_STYLE_PATTERNS: Readonly<Record<FilenameConvention, RegExp>> = {
  snake_case: /^[a-z0-9]+(?:_[a-z0-9]+)*$/,
  "kebab-case": /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  camelCase: /^[a-z][a-zA-Z0-9]*$/,
  PascalCase: /^[A-Z][a-zA-Z0-9]*$/,
};

/** `re.match` with Python `$` semantics (also matches before one final `\n`). */
function pyMatch(pattern: RegExp, value: string): boolean {
  return pattern.test(value) || (value.endsWith("\n") && pattern.test(value.slice(0, -1)));
}

function isBlank(value: string): boolean {
  return value.trim() === "";
}

/**
 * True when `value` is written in case style `style` (spec 2.3). Shared by
 * `[format:<case>]`, `[format:elements:<case>]` and `[filename:case:<case>]`.
 * The value is NOT trimmed and a final newline is allowed, as legacy
 * `re.match(...$)` (a YAML block scalar ends with one); an empty string
 * never matches.
 */
export function matchesCaseStyle(style: FilenameConvention, value: string): boolean {
  return pyMatch(CASE_STYLE_PATTERNS[style], value);
}

export const isSnakeCase = (value: string): boolean => matchesCaseStyle("snake_case", value);
export const isKebabCase = (value: string): boolean => matchesCaseStyle("kebab-case", value);
export const isCamelCase = (value: string): boolean => matchesCaseStyle("camelCase", value);
export const isPascalCase = (value: string): boolean => matchesCaseStyle("PascalCase", value);

/** The ongoing marker `present` / `présent`, case-insensitive (untrimmed, as legacy). */
export function isOngoingMarker(value: string): boolean {
  return pyMatch(ONGOING_MARKER, value);
}

/** One of the four date shapes or the ongoing marker; the calendar is not checked. */
export function isDateLike(value: YamlValue): boolean {
  if (typeof value !== "string") return false;
  return isOngoingMarker(value) || DATE_SHAPES.some((shape) => pyMatch(shape, value));
}

export function isUrlLike(value: YamlValue): boolean {
  return typeof value === "string" && !isBlank(value) && pyMatch(URL_LIKE, value);
}

/** `@<name>/<rest>` after trimming. */
export function isAliasLike(value: YamlValue): boolean {
  return typeof value === "string" && pyMatch(ALIAS_LIKE, value.trim());
}

function hasForbiddenPathChar(value: string): boolean {
  for (const char of value) {
    if (PATH_FORBIDDEN.includes(char) || char.charCodeAt(0) <= 0x1f) return true;
  }
  return false;
}

/** Shared path predicate (spec 3.4 "Path predicate"). */
export function isPathLike(value: YamlValue): boolean {
  if (typeof value !== "string" || isBlank(value)) return false;
  if (isUrlLike(value)) return false;
  if (!pyMatch(PATH_SHAPE, value)) return false;
  const remainder = value.replace(DRIVE_PREFIX, "");
  if (remainder.includes(":") || hasForbiddenPathChar(value)) return false;
  return PATH_ANCHOR.test(value) || pyMatch(PATH_EXTENSION, value);
}

/**
 * Python `str.isspace()` characters (also what `str.strip()` removes), as the
 * inside of a regex character class. Not `String.trim`: ECMAScript trims U+FEFF
 * and keeps U+001C-001F and U+0085, Python does the opposite. Single source of
 * the Python whitespace set (`isPythonSpace`, `stripPythonSpace`).
 */
const PY_SPACE =
  "\\t-\\r\\x1c-\\x20\\x85\\xa0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000";
const PY_SPACE_ANY = new RegExp(`[${PY_SPACE}]`, "u");
const PY_SPACE_ONE = new RegExp(`^[${PY_SPACE}]$`, "u");
const PY_SPACE_EDGES = new RegExp(`^[${PY_SPACE}]+|[${PY_SPACE}]+$`, "gu");

/** Python `str.isspace()` for one code point (legacy `str.strip()` semantics). */
export function isPythonSpace(codePoint: number): boolean {
  return PY_SPACE_ONE.test(String.fromCodePoint(codePoint));
}

/** `text` without leading and trailing Python whitespace (legacy `str.strip()`). */
export function stripPythonSpace(text: string): string {
  return text.replace(PY_SPACE_EDGES, "");
}
const URL_SCHEME_SHAPE = /^[A-Za-z][A-Za-z0-9+.-]*$/;
const URL_BAD_AUTHORITY = /[<>"{}|\\^]/;

/**
 * Strict URL predicate (spec 3.4 "Url predicate", legacy `is_valid_url_value`):
 * trimmed, no whitespace, a scheme of letters, digits, `+`, `.`, `-` starting
 * with a letter, a non-empty authority (the text after `://` up to the first
 * `/`, `?` or `#`) without `<>"{}|\^`. When `allowedSchemes` is given the
 * lowercased scheme must be a member of it, else any scheme passes. A `[`
 * without `]` (or the reverse) in the authority is invalid, as the Python
 * `urlsplit` error; the IPv6 literal itself is not validated.
 */
export function isValidUrlValue(
  value: YamlValue,
  allowedSchemes: ReadonlySet<string> | null = null,
): boolean {
  if (typeof value !== "string") return false;
  const candidate = value.replace(PY_SPACE_EDGES, "");
  if (candidate === "" || PY_SPACE_ANY.test(candidate)) return false;
  const colon = candidate.indexOf(":");
  if (colon < 0) return false;
  const scheme = candidate.slice(0, colon);
  if (!URL_SCHEME_SHAPE.test(scheme)) return false;
  const rest = candidate.slice(colon + 1);
  if (!rest.startsWith("//")) return false;
  const authority = rest.slice(2).split(/[/?#]/, 1)[0] ?? "";
  if (authority === "" || URL_BAD_AUTHORITY.test(authority)) return false;
  if (authority.includes("[") !== authority.includes("]")) return false;
  return allowedSchemes === null || allowedSchemes.has(scheme.toLowerCase());
}

const PATH_ALIAS_VALUE = new RegExp(`^@[A-Za-z0-9_-]+/[^${PY_SPACE}]+$`, "u");

/**
 * Strict path alias predicate (spec 3.4 `path-alias`, legacy
 * `is_valid_path_alias_value`): the trimmed value is `@<name>/<rest>` with a
 * name of ASCII letters, digits, `_` or `-` and a non-empty rest without
 * whitespace. Trim and `\S` use the Python whitespace set (`PY_SPACE`), not the
 * JavaScript one: JS `\s` would accept U+001C to U+001F and U+0085 inside the
 * rest, and reject U+FEFF, which Python `\S` treats the other way round.
 */
export function isValidPathAliasValue(value: YamlValue): boolean {
  return typeof value === "string" && PATH_ALIAS_VALUE.test(value.replace(PY_SPACE_EDGES, ""));
}

/** The four date shapes with captures (spec 3.3), in `[year, month, day]` order via `pick`. */
export const DATE_PARTS: readonly { readonly shape: RegExp; readonly pick: readonly number[] }[] = [
  { shape: /^(\d{4})-(\d{2})-(\d{2})$/, pick: [1, 2, 3] },
  { shape: /^(\d{4})-(\d{2})$/, pick: [1, 2, 0] },
  { shape: /^(\d{4})$/, pick: [1, 0, 0] },
  { shape: /^(\d{2})\/(\d{2})\/(\d{4})$/, pick: [3, 2, 1] },
];

/** True when `year` is a Gregorian leap year. */
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Calendar-strict date predicate (spec 3.4 `date`, legacy `is_valid_date_value`):
 * the trimmed value is the ongoing marker, or one of the four fixed shapes
 * (no lenient zero padding) naming a real date. A missing month or day counts
 * as valid; year 0000 does not exist (Python `datetime`, MINYEAR 1).
 */
export function isValidDateValue(value: YamlValue): boolean {
  if (typeof value !== "string") return false;
  const candidate = value.replace(PY_SPACE_EDGES, "");
  if (ONGOING_MARKER.test(candidate)) return true;
  for (const { shape, pick } of DATE_PARTS) {
    const match = shape.exec(candidate);
    if (match === null) continue;
    const [yearIndex = 0, monthIndex = 0, dayIndex = 0] = pick;
    const year = Number(match[yearIndex]);
    const month = monthIndex === 0 ? 1 : Number(match[monthIndex]);
    const day = dayIndex === 0 ? 1 : Number(match[dayIndex]);
    if (year < 1 || month < 1 || month > 12 || day < 1) return false;
    const monthLengths = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return day <= (monthLengths[month - 1] ?? 0);
  }
  return false;
}

/** Characters Python `str.isprintable()` rejects (ASCII space is printable). */
const NON_PRINTABLE = /^[\p{Cc}\p{Cf}\p{Cs}\p{Co}\p{Cn}\p{Zl}\p{Zp}\p{Zs}]$/u;

/**
 * Python `repr` of a string (Q02): single quotes unless it holds `'` and no
 * `"`; backslash, the quote, `\n`, `\r` and `\t` are escaped; any other
 * non-printable code point becomes `\xNN`, `\uNNNN` or `\UNNNNNNNN`.
 */
export function pyReprString(text: string): string {
  const quote = text.includes("'") && !text.includes('"') ? '"' : "'";
  let out = quote;
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    if (char === "\\" || char === quote) out += `\\${char}`;
    else if (char === "\n") out += "\\n";
    else if (char === "\r") out += "\\r";
    else if (char === "\t") out += "\\t";
    else if (char !== " " && NON_PRINTABLE.test(char)) {
      const hex = code.toString(16);
      if (code < 0x100) out += `\\x${hex.padStart(2, "0")}`;
      else if (code < 0x10000) out += `\\u${hex.padStart(4, "0")}`;
      else out += `\\U${hex.padStart(8, "0")}`;
    } else out += char;
  }
  return out + quote;
}

/** Python `repr` of a loaded YAML value: a string, list or mapping (Q02). */
export function pyRepr(value: YamlValue): string {
  if (typeof value === "string") return pyReprString(value);
  if (isList(value)) return `[${value.map(pyRepr).join(", ")}]`;
  const entries = [...value.entries()].map(
    ([key, item]) => `${pyReprString(key)}: ${pyRepr(item)}`,
  );
  return `{${entries.join(", ")}}`;
}

/**
 * Value as text for a message (`{value}`): a string as is, a list or mapping
 * with its Python `str` (spec 3.4, Q02).
 */
export function valueText(value: YamlValue): string {
  return typeof value === "string" ? value : pyRepr(value);
}
