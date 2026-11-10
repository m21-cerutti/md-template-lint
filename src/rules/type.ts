/**
 * Category `type` (docs/spec.md 4.3, codes MTL500-MTL599): type validation
 * and enum membership. Type inference lives in src/engine/infer.ts. All codes
 * of the category are ported.
 */
import { defineRule, report, type AnyRule, type FieldContext } from "../engine/rule.js";
import {
  isList,
  isMapping,
  presenceMode,
  type Diagnostic,
  type YamlValue,
} from "../engine/model.js";
import {
  FLOAT_PATTERN,
  isPathLike,
  isValidDateValue,
  isValidPathAliasValue,
  isValidUrlValue,
  pyRepr,
  valueText,
} from "../engine/values.js";

const INT_PATTERN = /^-?\d+$/;

/** `<shape>` of spec 3.4: `a list`, `a mapping` or `a scalar`. */
function shapeName(value: YamlValue): string {
  if (isList(value)) return "a list";
  if (isMapping(value)) return "a mapping";
  return "a scalar";
}

/** The `Field '<key>' (type=<type>): <detail>` message of spec 3.4. */
function typeMessage(context: FieldContext, detail: string): string {
  return `Field '${context.key}' (type=${context.templateField.type}): ${detail}`;
}

/**
 * `string` (spec 3.4): any value that is not a list and not a mapping. The
 * pipeline runs step `type` only for a present, non-empty value (spec 4.1
 * step 3). A rule runs only when the template field has its type (an enum
 * field has type `enum` and never reaches a type rule).
 */
const typeString = defineRule({
  code: "MTL501",
  name: "type-string",
  severity: "error",
  category: "type",
  phase: "field",
  step: "type",
  check: (context: FieldContext): Diagnostic[] => {
    const { value } = context;
    if (context.templateField.type !== "string" || value === null) return [];
    if (!isList(value) && !isMapping(value)) return [];
    return [
      report(typeString, typeMessage(context, `expected a plain string, got ${shapeName(value)}`)),
    ];
  },
});

/** `list` (spec 3.4): a YAML list, items unchecked. */
const typeList = defineRule({
  code: "MTL502",
  name: "type-list",
  severity: "error",
  category: "type",
  phase: "field",
  step: "type",
  check: (context: FieldContext): Diagnostic[] => {
    const { value } = context;
    if (context.templateField.type !== "list" || value === null || isList(value)) return [];
    return [
      report(typeList, typeMessage(context, `expected a YAML list, got ${shapeName(value)}`)),
    ];
  },
});

/** `nested-map` (spec 3.4): a mapping. Sub-keys are never checked. */
const typeNestedMap = defineRule({
  code: "MTL503",
  name: "type-nested-map",
  severity: "error",
  category: "type",
  phase: "field",
  step: "type",
  check: (context: FieldContext): Diagnostic[] => {
    const { value } = context;
    if (context.templateField.type !== "nested-map" || value === null || isMapping(value)) {
      return [];
    }
    return [
      report(
        typeNestedMap,
        typeMessage(context, `expected a mapping (nested-map), got ${shapeName(value)}`),
      ),
    ];
  },
});

/**
 * `int` (spec 3.4): trimmed value matches `^-?\d+$`. A list or mapping is a
 * shape mismatch. A decimal gets its own detail, with the raw value.
 */
const typeInt = defineRule({
  code: "MTL508",
  name: "type-int",
  severity: "error",
  category: "type",
  phase: "field",
  step: "type",
  check: (context: FieldContext): Diagnostic[] => {
    const { value } = context;
    if (context.templateField.type !== "int" || value === null) return [];
    if (typeof value !== "string") {
      return [report(typeInt, typeMessage(context, `expected a scalar, got ${shapeName(value)}`))];
    }
    if (INT_PATTERN.test(value.trim())) return [];
    const detail = FLOAT_PATTERN.test(value.trim())
      ? `got a decimal, expected an integer: '${value}'`
      : "value is not a valid integer";
    return [report(typeInt, typeMessage(context, detail))];
  },
});

/** `float` (spec 3.4): trimmed value matches `^-?\d+(\.\d+)?$`, no exponent. */
const typeFloat = defineRule({
  code: "MTL509",
  name: "type-float",
  severity: "error",
  category: "type",
  phase: "field",
  step: "type",
  check: (context: FieldContext): Diagnostic[] => {
    const { value } = context;
    if (context.templateField.type !== "float" || value === null) return [];
    if (typeof value !== "string") {
      return [
        report(typeFloat, typeMessage(context, `expected a scalar, got ${shapeName(value)}`)),
      ];
    }
    if (FLOAT_PATTERN.test(value.trim())) return [];
    return [report(typeFloat, typeMessage(context, "value is not a valid float"))];
  },
});

/** `bool` (spec 3.4): trimmed value is `true` or `false`, case-insensitive. */
const typeBool = defineRule({
  code: "MTL510",
  name: "type-bool",
  severity: "error",
  category: "type",
  phase: "field",
  step: "type",
  check: (context: FieldContext): Diagnostic[] => {
    const { value } = context;
    if (context.templateField.type !== "bool" || value === null) return [];
    if (typeof value !== "string") {
      return [report(typeBool, typeMessage(context, `expected a scalar, got ${shapeName(value)}`))];
    }
    const text = value.trim().toLowerCase();
    if (text === "true" || text === "false") return [];
    return [report(typeBool, typeMessage(context, "value is not 'true' or 'false'"))];
  },
});

/**
 * `date` (spec 3.4): the ongoing marker, or one of the four fixed shapes naming
 * a real calendar date (`isValidDateValue`). A list or mapping is a shape
 * mismatch.
 */
const typeDate = defineRule({
  code: "MTL504",
  name: "type-date",
  severity: "error",
  category: "type",
  phase: "field",
  step: "type",
  check: (context: FieldContext): Diagnostic[] => {
    const { value } = context;
    if (context.templateField.type !== "date" || value === null) return [];
    if (typeof value !== "string") {
      return [report(typeDate, typeMessage(context, `expected a scalar, got ${shapeName(value)}`))];
    }
    if (isValidDateValue(value)) return [];
    return [
      report(
        typeDate,
        typeMessage(
          context,
          "value is not a valid calendar date in an accepted format " +
            "(YYYY-MM-DD / YYYY-MM / YYYY / DD/MM/YYYY / present / présent)",
        ),
      ),
    ];
  },
});

/**
 * `url` (spec 3.4 "Url predicate"): `isValidUrlValue` without an allow-list.
 * The `[format:scheme:...]` allow-list is MTL304 and MTL305 only, so a valid
 * URL with a disallowed scheme is never reported here. A list or mapping is a
 * shape mismatch.
 */
const typeUrl = defineRule({
  code: "MTL505",
  name: "type-url",
  severity: "error",
  category: "type",
  phase: "field",
  step: "type",
  check: (context: FieldContext): Diagnostic[] => {
    const { value } = context;
    if (context.templateField.type !== "url" || value === null) return [];
    if (typeof value !== "string") {
      return [report(typeUrl, typeMessage(context, `expected a scalar, got ${shapeName(value)}`))];
    }
    if (isValidUrlValue(value)) return [];
    return [
      report(
        typeUrl,
        typeMessage(context, "value is not syntactically a valid URL (expected scheme://host/...)"),
      ),
    ];
  },
});

/**
 * `path` (spec 3.4 "Path predicate"): the shared `isPathLike` predicate. The
 * value is NOT trimmed (legacy `is_path_like(value)`), so a padded value fails
 * the no-whitespace shape. A list or mapping is a shape mismatch.
 */
const typePath = defineRule({
  code: "MTL506",
  name: "type-path",
  severity: "error",
  category: "type",
  phase: "field",
  step: "type",
  check: (context: FieldContext): Diagnostic[] => {
    const { value } = context;
    if (context.templateField.type !== "path" || value === null) return [];
    if (typeof value !== "string") {
      return [report(typePath, typeMessage(context, `expected a scalar, got ${shapeName(value)}`))];
    }
    if (isPathLike(value)) return [];
    return [report(typePath, typeMessage(context, "value does not look like a valid path"))];
  },
});

/**
 * `path-alias` (spec 3.4): trimmed value `@<name>/<rest>` (`isValidPathAliasValue`).
 * A list or mapping is a shape mismatch.
 */
const typePathAlias = defineRule({
  code: "MTL507",
  name: "type-path-alias",
  severity: "error",
  category: "type",
  phase: "field",
  step: "type",
  check: (context: FieldContext): Diagnostic[] => {
    const { value } = context;
    if (context.templateField.type !== "path-alias" || value === null) return [];
    if (typeof value !== "string") {
      return [
        report(typePathAlias, typeMessage(context, `expected a scalar, got ${shapeName(value)}`)),
      ];
    }
    if (isValidPathAliasValue(value)) return [];
    return [
      report(
        typePathAlias,
        typeMessage(context, "value is not a valid path alias (expected @<name>/<rest>)"),
      ),
    ];
  },
});

/** `<formats>` of spec 4.3 (`DATE_FORMATS_TEXT_WITH_ONGOING` in the legacy linter). */
const DATE_FORMATS = "YYYY-MM-DD / YYYY-MM / YYYY / DD/MM/YYYY / present / présent";

/** An `int` item (spec 3.4): a string whose trimmed text matches `INT_PATTERN`. */
function isIntItem(item: YamlValue): boolean {
  return typeof item === "string" && INT_PATTERN.test(item.trim());
}

/**
 * Detail of a list-of type mismatch, or null for a valid value (legacy
 * `validate_value`, list branch). A non-list is `expected a YAML list of
 * <things>, got <shape>`. Else each item failing `isValid` is listed as its
 * text (`valueText`: a list or mapping item prints as its Python `str`) in a
 * Python list of strings, in item order. The list is never empty here: the
 * pipeline skips an empty list before step `type`.
 */
function listOfDetail(
  value: YamlValue,
  things: string,
  entries: string,
  isValid: (item: YamlValue) => boolean,
): string | null {
  if (!isList(value)) return `expected a YAML list of ${things}, got ${shapeName(value)}`;
  const bad = value.filter((item) => !isValid(item)).map(valueText);
  return bad.length === 0 ? null : `list contains ${entries}: ${pyRepr(bad)}`;
}

/**
 * `list-of-string` (spec 3.4): a list whose items are not lists or mappings.
 * Offending items are named by position and shape (`item 0 is a list`), not
 * by their text.
 */
const typeListOfString = defineRule({
  code: "MTL511",
  name: "type-list-of-string",
  severity: "error",
  category: "type",
  phase: "field",
  step: "type",
  check: (context: FieldContext): Diagnostic[] => {
    const { value } = context;
    if (context.templateField.type !== "list-of-string" || value === null) return [];
    if (!isList(value)) {
      return [
        report(
          typeListOfString,
          typeMessage(context, `expected a YAML list of strings, got ${shapeName(value)}`),
        ),
      ];
    }
    const nested = value.flatMap((item, index) =>
      isList(item) || isMapping(item) ? [`item ${index} is ${shapeName(item)}`] : [],
    );
    if (nested.length === 0) return [];
    return [
      report(
        typeListOfString,
        typeMessage(context, `list contains non-scalar entries: ${pyRepr(nested)}`),
      ),
    ];
  },
});

/** `list-of-int` (spec 3.4): a list, every item a valid `int`. */
const typeListOfInt = defineRule({
  code: "MTL512",
  name: "type-list-of-int",
  severity: "error",
  category: "type",
  phase: "field",
  step: "type",
  check: (context: FieldContext): Diagnostic[] => {
    const { value } = context;
    if (context.templateField.type !== "list-of-int" || value === null) return [];
    const detail = listOfDetail(value, "integers", "non-integer entries", isIntItem);
    return detail === null ? [] : [report(typeListOfInt, typeMessage(context, detail))];
  },
});

/** `list-of-date` (spec 3.4): a list, every item a valid `date` (`isValidDateValue`). */
const typeListOfDate = defineRule({
  code: "MTL513",
  name: "type-list-of-date",
  severity: "error",
  category: "type",
  phase: "field",
  step: "type",
  check: (context: FieldContext): Diagnostic[] => {
    const { value } = context;
    if (context.templateField.type !== "list-of-date" || value === null) return [];
    const detail = listOfDetail(
      value,
      "dates",
      `invalid date entries (expected a real calendar date in ${DATE_FORMATS})`,
      isValidDateValue,
    );
    return detail === null ? [] : [report(typeListOfDate, typeMessage(context, detail))];
  },
});

/** `list-of-path` (spec 3.4): a list, every item a valid `path` (`isPathLike`, items not trimmed). */
const typeListOfPath = defineRule({
  code: "MTL514",
  name: "type-list-of-path",
  severity: "error",
  category: "type",
  phase: "field",
  step: "type",
  check: (context: FieldContext): Diagnostic[] => {
    const { value } = context;
    if (context.templateField.type !== "list-of-path" || value === null) return [];
    const detail = listOfDetail(value, "paths", "non-path entries", isPathLike);
    return detail === null ? [] : [report(typeListOfPath, typeMessage(context, detail))];
  },
});

/**
 * `list-of-url` (spec 3.4): a list, every item a valid `url`. As for MTL505
 * the `[format:scheme:...]` allow-list is not part of the predicate: a valid
 * URL with a disallowed scheme is MTL305 only.
 */
const typeListOfUrl = defineRule({
  code: "MTL515",
  name: "type-list-of-url",
  severity: "error",
  category: "type",
  phase: "field",
  step: "type",
  check: (context: FieldContext): Diagnostic[] => {
    const { value } = context;
    if (context.templateField.type !== "list-of-url" || value === null) return [];
    const detail = listOfDetail(value, "URLs", "non-URL entries", (item) => isValidUrlValue(item));
    return detail === null ? [] : [report(typeListOfUrl, typeMessage(context, detail))];
  },
});

/** `list-of-path-alias` (spec 3.4): a list, every item a valid `path-alias`. */
const typeListOfPathAlias = defineRule({
  code: "MTL516",
  name: "type-list-of-path-alias",
  severity: "error",
  category: "type",
  phase: "field",
  step: "type",
  check: (context: FieldContext): Diagnostic[] => {
    const { value } = context;
    if (context.templateField.type !== "list-of-path-alias" || value === null) return [];
    const detail = listOfDetail(
      value,
      "path aliases",
      "non-alias entries (expected @<name>/<rest>)",
      isValidPathAliasValue,
    );
    return detail === null ? [] : [report(typeListOfPathAlias, typeMessage(context, detail))];
  },
});

const ENUM_SEPARATOR = " | ";

/**
 * Option list of an enum template field (spec 3.4 "Enum", legacy
 * `extract_enum_options_from_value`): the template VALUE split on the literal
 * ` | `, each option trimmed, empty ones dropped. A value without the
 * separator (a bare `type=enum` hint, a list) has no options. Exported for the
 * `--verify` schema (src/runner/schema.ts), which shows the same list.
 */
export function enumOptions(value: YamlValue): string[] {
  if (typeof value !== "string" || !value.includes(ENUM_SEPARATOR)) return [];
  return value
    .split(ENUM_SEPARATOR)
    .map((option) => option.trim())
    .filter((option) => option !== "");
}

/**
 * `enum` (spec 3.4 "Enum"): membership of the target value in the option list
 * of the template value. The comparison is exact (legacy `value not in
 * options`): case sensitive, no trim, and a list or mapping is never a member
 * (printed as its Python `str`). No options means no check. The severity is
 * error for a required field and warning for an optional or conditional one.
 */
const typeEnum = defineRule({
  code: "MTL517",
  name: "enum-option",
  severity: "error",
  category: "type",
  phase: "field",
  step: "type",
  check: (context: FieldContext): Diagnostic[] => {
    const { value } = context;
    if (context.templateField.type !== "enum" || value === null) return [];
    const options = enumOptions(context.templateField.value);
    if (options.length === 0) return [];
    if (typeof value === "string" && options.includes(value)) return [];
    const severity = presenceMode(context.templateField) === "required" ? "error" : "warning";
    return [
      report(
        typeEnum,
        typeMessage(
          context,
          `value '${valueText(value)}' is not one of the allowed options ${pyRepr(options)}`,
        ),
        null,
        severity,
      ),
    ];
  },
});

export const rules: readonly AnyRule[] = [
  typeString,
  typeList,
  typeNestedMap,
  typeDate,
  typeUrl,
  typePath,
  typePathAlias,
  typeListOfString,
  typeListOfInt,
  typeListOfDate,
  typeListOfPath,
  typeListOfUrl,
  typeListOfPathAlias,
  typeEnum,
  typeInt,
  typeFloat,
  typeBool,
  // new:rule inserts above this line
];
