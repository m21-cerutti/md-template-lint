/**
 * Loose VALUE predicates used by type inference (docs/spec.md 3.3). These are
 * value patterns, not tag patterns: tags are parsed by grammar/*.g4 only.
 * `isPathLike` is shared with validation on purpose (spec 3.4).
 *
 * Python `re.match(...$)` also matches before one final newline; `pyMatch`
 * keeps that behaviour for parity with the legacy predicates.
 */
import type { YamlValue } from "./model.js";

const DATE_SHAPES: readonly RegExp[] = [
  /^\d{4}-\d{2}-\d{2}$/,
  /^\d{4}-\d{2}$/,
  /^\d{4}$/,
  /^\d{2}\/\d{2}\/\d{4}$/,
];
const ONGOING_MARKER = /^pr[ée]sent$/iu;
const URL_LIKE = /^[A-Za-z][A-Za-z0-9+.-]*:\/\/\S+$/;
const ALIAS_LIKE = /^@([A-Za-z0-9_-]+)\/(.+)$/;
const PATH_SHAPE = /^(?:[A-Za-z]:)?[\\/]?(?:[^\s\\/]+[\\/])+[^\s\\/]*$/;
const PATH_ANCHOR = /^(?:\.{1,2}[\\/]|[\\/]|~[\\/]|[A-Za-z]:[\\/])/;
const PATH_EXTENSION = /\.[A-Za-z0-9]{1,5}$/;
const DRIVE_PREFIX = /^[A-Za-z]:/;
const PATH_FORBIDDEN = '<>"|?*';

/** `re.match` with Python `$` semantics (also matches before one final `\n`). */
function pyMatch(pattern: RegExp, value: string): boolean {
  return pattern.test(value) || (value.endsWith("\n") && pattern.test(value.slice(0, -1)));
}

function isBlank(value: string): boolean {
  return value.trim() === "";
}

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
