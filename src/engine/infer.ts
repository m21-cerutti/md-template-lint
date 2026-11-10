/**
 * Type inference (docs/spec.md 3.2): declared hint first (step A), promotion
 * to a list type (step B), then the value alone (step C). Hints come from the
 * grammar (TypeHint nodes of the bound inline comment); no text scanning here.
 */
import type { FrontmatterComment, TypeHint } from "../tags/ast.js";
import { KNOWN_TYPE_NAMES } from "../tags/types.js";
import { isList, type YamlValue } from "./model.js";
import { isAliasLike, isDateLike, isPathLike, isUrlLike } from "./values.js";

const ENUM_SEPARATOR = " | ";

/** Hints that a list value promotes to `list-of-<hint>` (step B). */
export const LIST_PROMOTABLE_HINTS: ReadonlySet<string> = new Set([
  "date",
  "url",
  "path",
  "path-alias",
]);

function has(hints: readonly TypeHint[], kind: TypeHint["kind"]): boolean {
  return hints.some((hint) => hint.kind === kind);
}

/** Step A: the declared hint, or null. */
export function declaredHint(value: YamlValue, comment: FrontmatterComment | null): string | null {
  const hints = comment?.hints ?? [];
  const typeEq = hints.find((hint) => hint.kind === "type-eq");
  if (typeEq !== undefined) return typeEq.name;
  if (typeof value === "string") {
    const token = value.trim().toLowerCase();
    if (KNOWN_TYPE_NAMES.has(token)) return token;
    if (value.includes(ENUM_SEPARATOR)) return "enum";
  }
  const aliasHint = hints.some(
    (hint) =>
      hint.kind === "alias-marker" || (hint.kind === "bracket" && hint.name === "path-alias"),
  );
  if (aliasHint || isAliasLike(value)) return "path-alias";
  if (comment === null || comment.text === "") return null;
  if (has(hints, "date-placeholder") || has(hints, "iso-word")) return "date";
  const bracket = hints.find((hint) => hint.kind === "bracket" && hint.name !== "rule");
  if (bracket !== undefined && bracket.kind === "bracket") return bracket.name;
  if (has(hints, "url-word")) return "url";
  if (has(hints, "path-word")) return "path";
  return null;
}

/** Step C: the type from the value alone. */
export function typeFromValue(value: YamlValue): string {
  if (typeof value === "string") {
    if (isAliasLike(value)) return "path-alias";
    if (isDateLike(value)) return "date";
    if (isUrlLike(value)) return "url";
    if (isPathLike(value)) return "path";
    return "string";
  }
  if (isList(value)) {
    if (value.length > 0 && value.every(isDateLike)) return "list-of-date";
    if (value.length > 0 && value.every(isUrlLike)) return "list-of-url";
    if (value.length > 0 && value.every(isPathLike)) return "list-of-path";
    return "list";
  }
  return "nested-map";
}

/** `inferType(value, comment)` of spec 3.2. */
export function inferType(value: YamlValue, comment: FrontmatterComment | null): string {
  const hint = declaredHint(value, comment);
  if (hint === null) return typeFromValue(value);
  return isList(value) && LIST_PROMOTABLE_HINTS.has(hint) ? `list-of-${hint}` : hint;
}
