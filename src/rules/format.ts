/**
 * Category `format` (docs/spec.md 4.3, codes MTL300-MTL399): value shape
 * rules from tags. The legacy codes MTL301 to MTL305 are ported; of the field
 * format codes (spec 2.9, change C11) MTL306 to MTL309 are implemented.
 */
import { defineRule, report, type AnyRule, type FieldContext } from "../engine/rule.js";
import { isList, type Diagnostic } from "../engine/model.js";
import {
  isIsoDate,
  isSemver,
  isValidDateValue,
  isValidUrlValue,
  matchesCaseStyle,
  pyRepr,
  valueText,
} from "../engine/values.js";
import type { ValueShape } from "../tags/ast.js";

/**
 * `[format:constant:<v>]` (spec 2.3): a scalar value must equal the constant
 * as a string. A list or mapping never matches (Q02). The pipeline runs step
 * `constant` only for a present, non-empty value (spec 4.1 step 3). The first
 * constant tag of the field wins, as the legacy `re.search`.
 */
const constantMismatch = defineRule({
  code: "MTL301",
  name: "constant-mismatch",
  severity: "error",
  category: "format",
  phase: "field",
  step: "constant",
  check: (context: FieldContext): Diagnostic[] => {
    const tag = (context.templateField.comment?.tags ?? []).find(
      (candidate) => candidate.kind === "format-constant",
    );
    if (tag === undefined || context.value === null) return [];
    const { value } = context;
    if (value === tag.value) return [];
    return [
      report(
        constantMismatch,
        `Field '${context.key}': expected constant value '${tag.value}', got '${valueText(value)}'`,
      ),
    ];
  },
});

/**
 * `[format:snake_case]` / `[format:kebab-case]` (spec 2.3): a scalar string
 * value must match the case style. Skipped for a list or mapping. The value is
 * not trimmed (`matchesCaseStyle`). The first case tag of the field wins, as
 * the legacy `re.search`. The pipeline runs step `case` only for a present,
 * non-empty value (spec 4.1 step 3).
 */
const caseMismatch = defineRule({
  code: "MTL302",
  name: "case-mismatch",
  severity: "error",
  category: "format",
  phase: "field",
  step: "case",
  check: (context: FieldContext): Diagnostic[] => {
    const tag = (context.templateField.comment?.tags ?? []).find(
      (candidate) => candidate.kind === "format-case",
    );
    const { value } = context;
    if (tag === undefined || typeof value !== "string") return [];
    if (matchesCaseStyle(tag.style, value)) return [];
    return [
      report(
        caseMismatch,
        `Field '${context.key}': value '${value}' does not match required format [${tag.style}]`,
      ),
    ];
  },
});

/**
 * `[format:elements:snake_case|kebab-case]` (spec 2.3): every item of a list
 * must match the case style. Skipped when the value is not a list. As legacy
 * `str(item)`, a nested list or mapping is tested (and listed) as its Python
 * text, which never matches. The message lists the bad items as a Python list
 * of strings. The pipeline runs step `elements` only for a non-empty value
 * (spec 4.1 step 3). The first elements tag of the field wins.
 */
const elementsCaseMismatch = defineRule({
  code: "MTL303",
  name: "elements-case-mismatch",
  severity: "error",
  category: "format",
  phase: "field",
  step: "elements",
  check: (context: FieldContext): Diagnostic[] => {
    const tag = (context.templateField.comment?.tags ?? []).find(
      (candidate) => candidate.kind === "format-elements",
    );
    const { value } = context;
    if (tag === undefined || value === null || !isList(value)) return [];
    const bad = value.map(valueText).filter((item) => !matchesCaseStyle(tag.style, item));
    if (bad.length === 0) return [];
    return [
      report(
        elementsCaseMismatch,
        `Field '${context.key}': list contains entries not matching [format:elements:${tag.style}]: ${pyRepr(bad)}`,
      ),
    ];
  },
});

/**
 * The scheme allow-list of a template field, or null for no restriction
 * (spec 2.3). Legacy `_check_url_schemes` applies it only when the template
 * field has the given inferred type. The first scheme tag wins (legacy
 * `re.search`); an empty list after trimming means no restriction. Schemes
 * come lowercased from the tag; a set drops duplicates.
 */
function schemeAllowList(
  context: FieldContext,
  type: "url" | "list-of-url",
): { readonly allowed: ReadonlySet<string>; readonly text: string } | null {
  if (context.templateField.type !== type) return null;
  const tag = (context.templateField.comment?.tags ?? []).find(
    (candidate) => candidate.kind === "format-scheme",
  );
  if (tag === undefined || tag.schemes.length === 0) return null;
  const sorted = [...new Set(tag.schemes)].sort();
  return { allowed: new Set(sorted), text: sorted.join(",") };
}

/**
 * `[format:scheme:<s1>,<s2>,...]` on a `url` field (spec 2.3, 3.4): a
 * syntactically valid URL whose scheme is not allowed. An invalid URL is never
 * reported here (the type rule does, MTL505). Skipped for a non-string value.
 */
const schemeDisallowed = defineRule({
  code: "MTL304",
  name: "scheme-disallowed",
  severity: "error",
  category: "format",
  phase: "field",
  step: "scheme",
  check: (context: FieldContext): Diagnostic[] => {
    const list = schemeAllowList(context, "url");
    const { value } = context;
    if (list === null || typeof value !== "string") return [];
    if (!isValidUrlValue(value) || isValidUrlValue(value, list.allowed)) return [];
    return [
      report(
        schemeDisallowed,
        `Field '${context.key}': URL scheme of '${value}' is not allowed [format:scheme:${list.text}]`,
      ),
    ];
  },
});

/**
 * `[format:scheme:<s1>,<s2>,...]` on a `list-of-url` field: one error naming
 * every valid URL item with a disallowed scheme, as a Python list of strings.
 * Invalid items and non-string items are skipped (MTL515 reports them).
 */
const schemeDisallowedItem = defineRule({
  code: "MTL305",
  name: "scheme-disallowed-item",
  severity: "error",
  category: "format",
  phase: "field",
  step: "scheme",
  check: (context: FieldContext): Diagnostic[] => {
    const list = schemeAllowList(context, "list-of-url");
    const { value } = context;
    if (list === null || value === null || !isList(value)) return [];
    const bad = value.filter(
      (item): item is string =>
        typeof item === "string" && isValidUrlValue(item) && !isValidUrlValue(item, list.allowed),
    );
    if (bad.length === 0) return [];
    return [
      report(
        schemeDisallowedItem,
        `Field '${context.key}': list contains URLs with a disallowed scheme ${pyRepr(bad)} [format:scheme:${list.text}]`,
      ),
    ];
  },
});

/**
 * The scalar shape of a template field (spec 2.9): `[format:semver]` and
 * `[format:date]` are one kind, so the first of them wins (spec 2.1). Null
 * when the field has neither.
 */
function scalarShape(context: FieldContext): ValueShape | null {
  const tag = (context.templateField.comment?.tags ?? []).find(
    (candidate) => candidate.kind === "format-shape",
  );
  return tag === undefined ? null : tag.shape;
}

/**
 * `[format:semver]` (spec 2.9): a scalar string value that is not a SEMVER
 * (`isSemver`, exact text, no trimming). A list or mapping is skipped (the
 * type rule reports the shape). Silent when `[format:date]` is the first
 * scalar shape tag. The pipeline runs step `shape` only for a present,
 * non-empty value (spec 4.1 step 3) and anchors on the key line (DIR5).
 */
const semverMismatch = defineRule({
  code: "MTL306",
  name: "semver-mismatch",
  severity: "error",
  category: "format",
  phase: "field",
  step: "shape",
  check: (context: FieldContext): Diagnostic[] => {
    const { value } = context;
    if (scalarShape(context) !== "semver" || typeof value !== "string") return [];
    if (isSemver(value)) return [];
    return [
      report(
        semverMismatch,
        `Field '${context.key}': value '${value}' is not a semantic version [format:semver]`,
      ),
    ];
  },
});

/**
 * `[format:date]` (spec 2.9): a scalar string value that is not an ISO DATE
 * (`isIsoDate`, exact text, no trimming). On a field of type `date` a value
 * that fails the default date parsing (`isValidDateValue`) is silent here:
 * the type rule reports it (`MTL504`, one problem one error). On any other
 * field type every non ISO DATE value fires. A list or mapping is skipped.
 * Silent when `[format:semver]` is the first scalar shape tag. Step `shape`,
 * present non-empty value only (spec 4.1 step 3), key line anchor (DIR5).
 */
const dateFormatMismatch = defineRule({
  code: "MTL307",
  name: "date-format-mismatch",
  severity: "error",
  category: "format",
  phase: "field",
  step: "shape",
  check: (context: FieldContext): Diagnostic[] => {
    const { value } = context;
    if (scalarShape(context) !== "date" || typeof value !== "string") return [];
    if (isIsoDate(value)) return [];
    if (context.templateField.type === "date" && !isValidDateValue(value)) return [];
    return [
      report(
        dateFormatMismatch,
        `Field '${context.key}': value '${value}' is not a YYYY-MM-DD date [format:date]`,
      ),
    ];
  },
});

/**
 * The elements shape of a template field (spec 2.9): `[format:elements:semver]`
 * and `[format:elements:date]` are one kind, so the first of them wins (spec
 * 2.1). Null when the field has neither.
 */
function elementsShape(context: FieldContext): ValueShape | null {
  const tag = (context.templateField.comment?.tags ?? []).find(
    (candidate) => candidate.kind === "format-elements-shape",
  );
  return tag === undefined ? null : tag.shape;
}

/**
 * `[format:elements:semver]` (spec 2.9): on a list value, one error listing
 * every item that is not a SEMVER, as a Python list of strings. Items are
 * tested as their text (`valueText`, as MTL303), exact, no trimming, so a
 * nested list or mapping is listed. Skipped when the value is not a list.
 * Silent when `[format:elements:date]` is the first elements shape tag. Step
 * `shape`, present non-empty value only (spec 4.1 step 3), key line anchor.
 */
const elementsSemverMismatch = defineRule({
  code: "MTL308",
  name: "elements-semver-mismatch",
  severity: "error",
  category: "format",
  phase: "field",
  step: "shape",
  check: (context: FieldContext): Diagnostic[] => {
    const { value } = context;
    if (elementsShape(context) !== "semver" || value === null || !isList(value)) return [];
    const bad = value.map(valueText).filter((item) => !isSemver(item));
    if (bad.length === 0) return [];
    return [
      report(
        elementsSemverMismatch,
        `Field '${context.key}': list contains entries not matching [format:elements:semver]: ${pyRepr(bad)}`,
      ),
    ];
  },
});

/**
 * `[format:elements:date]` (spec 2.9): on a list value, one error listing
 * every item that is not an ISO DATE, as a Python list of strings. Items are
 * tested as their text (`valueText`), exact, no trimming. On a field of type
 * `list-of-date` an item that fails the default date parsing
 * (`isValidDateValue`) is not listed: the type rule lists it (`MTL513`, one
 * problem one error). Skipped when the value is not a list. Silent when
 * `[format:elements:semver]` is the first elements shape tag. Step `shape`,
 * present non-empty value only (spec 4.1 step 3), key line anchor.
 */
const elementsDateMismatch = defineRule({
  code: "MTL309",
  name: "elements-date-mismatch",
  severity: "error",
  category: "format",
  phase: "field",
  step: "shape",
  check: (context: FieldContext): Diagnostic[] => {
    const { value } = context;
    if (elementsShape(context) !== "date" || value === null || !isList(value)) return [];
    const deferToType = context.templateField.type === "list-of-date";
    const bad = value
      .filter((item) => !deferToType || isValidDateValue(item))
      .map(valueText)
      .filter((item) => !isIsoDate(item));
    if (bad.length === 0) return [];
    return [
      report(
        elementsDateMismatch,
        `Field '${context.key}': list contains entries not matching [format:elements:date]: ${pyRepr(bad)}`,
      ),
    ];
  },
});

export const rules: readonly AnyRule[] = [
  constantMismatch,
  caseMismatch,
  elementsCaseMismatch,
  schemeDisallowed,
  schemeDisallowedItem,
  semverMismatch,
  dateFormatMismatch,
  elementsSemverMismatch,
  elementsDateMismatch,
  // new:rule inserts above this line
];
