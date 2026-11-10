/**
 * Category `bounds` (docs/spec.md 4.3, codes MTL400-MTL499): count, range
 * and order. All codes of the category are ported.
 */
import { defineRule, report, type AnyRule, type FieldContext } from "../engine/rule.js";
import { isList, type Diagnostic } from "../engine/model.js";
import { DATE_PARTS, FLOAT_PATTERN, isOngoingMarker, isValidDateValue, pyRepr, stripPythonSpace } from "../engine/values.js";
import type { FrontmatterValueTag } from "../tags/ast.js";

/**
 * Value of the FIRST `[count:<bound>:N]` tag of the template field (legacy
 * `re.search` takes the leftmost one; tags are in source order), or null. A
 * malformed N is not a tag: the parser reports it as MTL012 only.
 */
function countBound(context: FieldContext, bound: "min" | "max"): number | null {
  for (const tag of context.templateField.comment?.tags ?? []) {
    if (tag.kind === "count" && tag.bound === bound) return tag.value;
  }
  return null;
}

/**
 * `[count:min:N]` (spec 2.3): a list value must hold at least N items. No-op on
 * a scalar or a mapping. N = 0 never fails. The pipeline runs step `count` only
 * for a present, non-empty value (spec 4.1 step 3), so an empty list is
 * skipped. The bound is printed as the parsed integer (spec 4.3).
 */
const countMin = defineRule({
  code: "MTL401",
  name: "count-min",
  severity: "error",
  category: "bounds",
  phase: "field",
  step: "count",
  check: (context: FieldContext): Diagnostic[] => {
    const min = countBound(context, "min");
    const { value } = context;
    if (min === null || value === null || !isList(value)) return [];
    if (value.length >= min) return [];
    return [report(countMin, `Field '${context.key}': list has ${value.length} item(s), minimum is ${min}`)];
  },
});

/**
 * `[count:max:N]` (spec 2.3): a list value must hold at most N items. No-op on
 * a scalar or a mapping. With N = 0 every non-empty list fails. Same gate and
 * bound printing as `countMin`.
 */
const countMax = defineRule({
  code: "MTL402",
  name: "count-max",
  severity: "error",
  category: "bounds",
  phase: "field",
  step: "count",
  check: (context: FieldContext): Diagnostic[] => {
    const max = countBound(context, "max");
    const { value } = context;
    if (max === null || value === null || !isList(value)) return [];
    if (value.length <= max) return [];
    return [report(countMax, `Field '${context.key}': list has ${value.length} item(s), maximum is ${max}`)];
  },
});

/** A `[range:<bound>:N]` tag of a template field. */
type RangeTag = Extract<FrontmatterValueTag, { readonly kind: "range" }>;

/**
 * The FIRST `[range:<bound>:N]` tag of the template field (legacy `re.search`
 * takes the leftmost one; tags are in source order), or null. A malformed N is
 * not a tag: the parser reports it as MTL012 only.
 */
function rangeTag(context: FieldContext, bound: "min" | "max"): RangeTag | null {
  for (const tag of context.templateField.comment?.tags ?? []) {
    if (tag.kind === "range" && tag.bound === bound) return tag;
  }
  return null;
}

/**
 * Python `repr(float)` (spec 4.3): shortest round-trip digits, fixed notation
 * while the decimal point position `decpt` (value = 0.DIGITS x 10^decpt) is in
 * -4 < decpt <= 16, else exponent form `d[.ddd]e[+-]XX` (at least 2 exponent
 * digits). A whole float keeps one decimal (`2.0`), `-0.0` keeps its sign.
 * Not JavaScript number formatting (`1e-7`, `1.5e+16` differ).
 */
function pyFloatRepr(number: number): string {
  if (!Number.isFinite(number)) return number > 0 ? "inf" : "-inf";
  const sign = number < 0 || Object.is(number, -0) ? "-" : "";
  const magnitude = Math.abs(number);
  if (magnitude === 0) return `${sign}0.0`;
  const [mantissa = "", exponentText = "0"] = magnitude.toExponential().split("e");
  const digits = mantissa.replace(".", "");
  const decpt = Number.parseInt(exponentText, 10) + 1;
  if (decpt > -4 && decpt <= 16) {
    if (decpt <= 0) return `${sign}0.${"0".repeat(-decpt)}${digits}`;
    if (decpt >= digits.length) return `${sign}${digits}${"0".repeat(decpt - digits.length)}.0`;
    return `${sign}${digits.slice(0, decpt)}.${digits.slice(decpt)}`;
  }
  const exponent = decpt - 1;
  const exponentDigits = String(Math.abs(exponent)).padStart(2, "0");
  const fraction = digits.length > 1 ? `.${digits.slice(1)}` : "";
  return `${sign}${digits[0]}${fraction}e${exponent < 0 ? "-" : "+"}${exponentDigits}`;
}

/**
 * The bound as Python prints the parsed number (spec 4.3, legacy
 * `parse_numeric_bound`): an integer bound (no `.`) in plain decimal, exact for
 * any size (`007` -> 7, `-0` -> 0), a float bound as `repr(float)`.
 */
function printBound(tag: RangeTag): string {
  return tag.isFloat ? pyFloatRepr(tag.value) : BigInt(tag.text).toString();
}

/**
 * The number a text stands for, or null (legacy `_is_float_str` then
 * `float()`): the text stripped of Python whitespace must match
 * `-?digits(.digits)?`. No exponent, no leading plus, no `inf` or `nan`. ASCII
 * digits only (Python `\d` also takes other Unicode decimal digits; accepted
 * deviation, like the other number rules of the port).
 */
function numericValue(text: string): number | null {
  const stripped = stripPythonSpace(text);
  return FLOAT_PATTERN.test(stripped) ? Number(stripped) : null;
}

/** The list items that are numeric text and fail `isOutside` (legacy list branch), as written. */
function outsideItems(list: readonly unknown[], isOutside: (number: number) => boolean): string[] {
  const found: string[] = [];
  for (const item of list) {
    if (typeof item !== "string") continue;
    const number = numericValue(item);
    if (number !== null && isOutside(number)) found.push(item);
  }
  return found;
}

/**
 * `[range:min:N]` on a scalar (spec 2.3, legacy `_check_numeric_range`): numeric
 * text below N. NO type guard: a string-typed field is checked too. A mapping, a
 * list (see `rangeMinItem`) and non-numeric text are skipped silently. The
 * message shows the raw target text and the parsed bound (spec 4.3). The
 * pipeline runs step `range` only for a present, non-empty value (spec 4.1
 * step 3).
 */
const rangeMin = defineRule({
  code: "MTL403",
  name: "range-min",
  severity: "error",
  category: "bounds",
  phase: "field",
  step: "range",
  check: (context: FieldContext): Diagnostic[] => {
    const tag = rangeTag(context, "min");
    const { value } = context;
    if (tag === null || typeof value !== "string") return [];
    const number = numericValue(value);
    if (number === null || !(number < tag.value)) return [];
    return [report(rangeMin, `Field '${context.key}': value ${value} is below range:min ${printBound(tag)}`)];
  },
});

/** `[range:max:N]` on a scalar: numeric text above N. Same rules as `rangeMin`. */
const rangeMax = defineRule({
  code: "MTL404",
  name: "range-max",
  severity: "error",
  category: "bounds",
  phase: "field",
  step: "range",
  check: (context: FieldContext): Diagnostic[] => {
    const tag = rangeTag(context, "max");
    const { value } = context;
    if (tag === null || typeof value !== "string") return [];
    const number = numericValue(value);
    if (number === null || !(number > tag.value)) return [];
    return [report(rangeMax, `Field '${context.key}': value ${value} is above range:max ${printBound(tag)}`)];
  },
});

/**
 * `[range:min:N]` on a list (spec 2.3): ONE error naming every numeric item
 * below N, as a Python list of the items as written. Items that are not numeric
 * text (including nested lists and mappings) are skipped. ANY list is checked,
 * not only `list-of-int`.
 */
const rangeMinItem = defineRule({
  code: "MTL405",
  name: "range-min-item",
  severity: "error",
  category: "bounds",
  phase: "field",
  step: "range",
  check: (context: FieldContext): Diagnostic[] => {
    const tag = rangeTag(context, "min");
    const { value } = context;
    if (tag === null || value === null || !isList(value)) return [];
    const below = outsideItems(value, (number) => number < tag.value);
    if (below.length === 0) return [];
    return [report(rangeMinItem, `Field '${context.key}': item(s) ${pyRepr(below)} are below range:min ${printBound(tag)}`)];
  },
});

/** `[range:max:N]` on a list: one error naming every numeric item above N. */
const rangeMaxItem = defineRule({
  code: "MTL406",
  name: "range-max-item",
  severity: "error",
  category: "bounds",
  phase: "field",
  step: "range",
  check: (context: FieldContext): Diagnostic[] => {
    const tag = rangeTag(context, "max");
    const { value } = context;
    if (tag === null || value === null || !isList(value)) return [];
    const above = outsideItems(value, (number) => number > tag.value);
    if (above.length === 0) return [];
    return [report(rangeMaxItem, `Field '${context.key}': item(s) ${pyRepr(above)} are above range:max ${printBound(tag)}`)];
  },
});

/** Sort key of the ongoing marker: after every real date (legacy `_DATE_SORT_INFINITY`). */
const ONGOING_SORT_KEY = 99991231;

/**
 * Comparable `YYYYMMDD` number of a date item, or null (legacy `date_sort_key`):
 * not a string or not a calendar-valid date (`isValidDateValue`) gives null. A
 * bare `YYYY` sorts as `YYYY-01-01`, `YYYY-MM` as `YYYY-MM-01`, `DD/MM/YYYY` by
 * its calendar date, and the ongoing marker (`present`, `présent`, any case)
 * as 9999-12-31, so it ties with a real 9999-12-31. The text is stripped of
 * Python whitespace first, as legacy.
 */
function dateSortKey(item: unknown): number | null {
  if (typeof item !== "string") return null;
  const candidate = stripPythonSpace(item);
  if (isOngoingMarker(candidate)) return ONGOING_SORT_KEY;
  if (!isValidDateValue(candidate)) return null;
  for (const { shape, pick } of DATE_PARTS) {
    const match = shape.exec(candidate);
    if (match === null) continue;
    const [yearIndex = 0, monthIndex = 0, dayIndex = 0] = pick;
    const month = monthIndex === 0 ? 1 : Number(match[monthIndex]);
    const day = dayIndex === 0 ? 1 : Number(match[dayIndex]);
    return Number(match[yearIndex]) * 10000 + month * 100 + day;
  }
  return null;
}

/**
 * `[order:ascending]` (spec 2.3, legacy `_check_order_ascending`): on a field of
 * type `list-of-date` (declared or inferred from the TEMPLATE), adjacent dates
 * must be in non-decreasing order. One error per decreasing adjacent pair, in
 * list order. Items that are not valid dates are skipped, so the pair is formed
 * between neighbouring VALID items, and the "previous" date moves on after a
 * violation too (`3, 1, 2` gives one error). The message shows both items as
 * written (not stripped). No-op on any other type and on a non-list value. The
 * tag has no argument, so a repeated tag changes nothing. The pipeline runs step
 * `order` only for a present, non-empty value (spec 4.1 step 3).
 */
const orderAscending = defineRule({
  code: "MTL407",
  name: "order-ascending",
  severity: "error",
  category: "bounds",
  phase: "field",
  step: "order",
  check: (context: FieldContext): Diagnostic[] => {
    const tagged = (context.templateField.comment?.tags ?? []).some((tag) => tag.kind === "order-ascending");
    const { value } = context;
    if (!tagged || context.templateField.type !== "list-of-date") return [];
    if (value === null || !isList(value)) return [];
    const found: Diagnostic[] = [];
    let previousItem: string | null = null;
    let previousKey: number | null = null;
    for (const item of value) {
      const currentKey = dateSortKey(item);
      if (currentKey === null || typeof item !== "string") continue;
      if (previousKey !== null && previousItem !== null && currentKey < previousKey) {
        found.push(report(orderAscending, `Field '${context.key}': dates are not in ascending order ('${previousItem}' comes before '${item}') [order:ascending]`));
      }
      previousItem = item;
      previousKey = currentKey;
    }
    return found;
  },
});

export const rules: readonly AnyRule[] = [
  countMin,
  countMax,
  rangeMin,
  rangeMax,
  rangeMinItem,
  rangeMaxItem,
  orderAscending,
  // new:rule inserts above this line
];
