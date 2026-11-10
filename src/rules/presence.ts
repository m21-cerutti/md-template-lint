/**
 * Category `presence` (docs/spec.md 4.3, codes MTL200-MTL299): field
 * presence and unknown keys. Presence tags are spec 2.2; the evaluation order
 * is spec 4.1 steps 3 and 4.
 */
import { defineRule, report, reportOnLine, type AnyRule, type FieldContext, type TargetContext } from "../engine/rule.js";
import { presenceMode, type Diagnostic } from "../engine/model.js";

/**
 * The pipeline runs step `presence` only when the target value is missing or
 * empty (spec 4.1 step 3), so a required field reaching this check is an error.
 */
const requiredMissing = defineRule({
  code: "MTL201",
  name: "required-missing",
  severity: "error",
  category: "presence",
  phase: "field",
  step: "presence",
  check: (context: FieldContext): Diagnostic[] => (presenceMode(context.templateField) === "required" ? [report(requiredMissing, `Field '${context.key}': required but empty or missing`)] : []),
});

const unknownKey = defineRule({
  code: "MTL202",
  name: "unknown-key",
  severity: "warning",
  category: "presence",
  phase: "target",
  step: "unknown-keys",
  // Anchored on the target key line (spec 4.4 DIR5).
  check: (context: TargetContext): Diagnostic[] =>
    [...context.target.fields.values()].filter((field) => !context.template.fields.has(field.key)).map((field) => reportOnLine(unknownKey, `Unknown key '${field.key}' not present in template`, field.line)),
});

export const rules: readonly AnyRule[] = [
  requiredMissing,
  unknownKey,
  // new:rule inserts above this line
];
