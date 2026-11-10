/**
 * Category `filename` (docs/spec.md 4.3, codes MTL100-MTL199): rules on the
 * target file name. All codes of the category are ported.
 */
import { defineRule, report, type AnyRule, type FieldContext, type TargetContext } from "../engine/rule.js";
import type { Diagnostic } from "../engine/model.js";
import { matchesCaseStyle, valueText } from "../engine/values.js";

/**
 * File name stem of a target path, as Python `Path(path).stem`: the last path
 * segment without its last extension. A leading dot is not an extension
 * (`.md` keeps its name) and a trailing dot is not either (`a.` keeps it).
 */
function targetFileStem(path: string): string {
  const name = path.slice(Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\")) + 1);
  const dot = name.lastIndexOf(".");
  return dot <= 0 || dot === name.length - 1 ? name : name.slice(0, dot);
}

/**
 * `# [filename:case:<convention>]` (spec 2.5): the stem of the target file name
 * must be written in the case style. The tag is read from the TEMPLATE only (a
 * target copy is inert; the first standalone comment line wins, the parser
 * already keeps that one). The template's own file name is never checked: the
 * rule runs on the target path only. The pipeline runs step `filename` first
 * among the whole-target steps (spec 4.1 step 2), before the fields.
 */
const filenameCase = defineRule({
  code: "MTL101",
  name: "filename-case",
  severity: "error",
  category: "filename",
  phase: "target",
  step: "filename",
  check: (context: TargetContext): Diagnostic[] => {
    const tag = context.template.filename;
    if (tag === null) return [];
    const stem = targetFileStem(context.targetPath);
    if (matchesCaseStyle(tag.convention, stem)) return [];
    return [report(filenameCase, `Filename '${stem}' does not match required case [filename:case:${tag.convention}]`)];
  },
});

/**
 * `[value:filename]` (spec 2.3): a scalar value must equal the target file
 * name stem as a string. A list or mapping never matches (Q02). The pipeline
 * runs step `value-filename` only for a present, non-empty value (spec 4.1
 * step 3).
 */
const valueFilename = defineRule({
  code: "MTL102",
  name: "value-filename",
  severity: "error",
  category: "filename",
  phase: "field",
  step: "value-filename",
  check: (context: FieldContext): Diagnostic[] => {
    const tag = (context.templateField.comment?.tags ?? []).find((candidate) => candidate.kind === "value-filename");
    const { value } = context;
    if (tag === undefined || value === null) return [];
    const stem = targetFileStem(context.targetPath);
    if (value === stem) return [];
    return [report(valueFilename, `Field '${context.key}': expected value to equal filename '${stem}' ([value:filename]), got '${valueText(value)}'`)];
  },
});

export const rules: readonly AnyRule[] = [
  filenameCase,
  valueFilename,
  // new:rule inserts above this line
];
