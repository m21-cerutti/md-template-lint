/**
 * Category `heading` (docs/spec.md 4.3, codes MTL600-MTL699): heading
 * presence and order. Heading suffix tags are spec 2.6; the evaluation order
 * is spec 4.1 step 5. Every message carries the prefix `Heading: `.
 */
import { defineRule, report, type AnyRule, type TargetContext } from "../engine/rule.js";
import type { Diagnostic, Section } from "../engine/model.js";
import { pyRepr } from "../engine/values.js";
import type { SourcePosition } from "../tags/ast.js";

type HeadingPresence = "required" | "exist" | "optional" | "conditional" | "template-only";

/**
 * Presence mode of a template heading (spec 2.6). Precedence when several
 * tags are present: conditional, template-only, exist, optional, then
 * required (the default, also with no presence tag).
 */
function headingPresence(section: Section): HeadingPresence {
  const modes = section.tags.flatMap((tag) => (tag.kind === "presence" ? [tag.mode] : []));
  for (const mode of ["conditional", "template-only", "exist", "optional"] as const) {
    if (modes.includes(mode)) return mode;
  }
  return "required";
}

/**
 * Template anchor of a presence finding (MTL601 to MTL603): the line of the
 * template heading it is about. The pipeline stable-sorts the `headings` step
 * by it (legacy interleaving in template heading order) and then clears it,
 * so it never reaches a reporter as a location in the target.
 */
const anchor = (section: Section): SourcePosition => ({ line: section.line, column: 1 });

/**
 * A required template heading needs a target heading (level 1 or 2) with the
 * same text. Text comparison is exact and case sensitive; the level is not
 * compared (spec 2.6). Tags are already removed from both texts.
 */
const headingMissing = defineRule({
  code: "MTL601",
  name: "heading-missing",
  severity: "error",
  category: "heading",
  phase: "target",
  step: "headings",
  check: (context: TargetContext): Diagnostic[] => {
    const targetTexts = new Set(context.target.sections.map((section) => section.text));
    return context.template.sections
      .filter((section) => headingPresence(section) === "required")
      .filter((section) => !targetTexts.has(section.text))
      .map((section) =>
        report(
          headingMissing,
          `Heading: Missing required heading: '${section.text}'`,
          anchor(section),
        ),
      );
  },
});

/**
 * An `exist` template heading needs some target heading (level 1 or 2) at the
 * SAME LEVEL, whatever its text (spec 2.6, Q03). Findings follow the template
 * heading order.
 */
const headingLevelMissing = defineRule({
  code: "MTL602",
  name: "heading-level-missing",
  severity: "error",
  category: "heading",
  phase: "target",
  step: "headings",
  check: (context: TargetContext): Diagnostic[] => {
    const targetLevels = new Set(context.target.sections.map((section) => section.level));
    return context.template.sections
      .filter((section) => headingPresence(section) === "exist")
      .filter((section) => !targetLevels.has(section.level))
      .map((section) =>
        report(
          headingLevelMissing,
          `Heading: Missing heading at level H${section.level} [presence:exist]`,
          anchor(section),
        ),
      );
  },
});

/**
 * A `template-only` template heading must not appear in the target: a target
 * heading (level 1 or 2) with the same text is an error. Absent is the silent,
 * correct outcome. Text comparison is exact and case sensitive; the level is
 * not compared (spec 2.6, py L1489). Findings follow the template heading order.
 */
const headingTemplateOnly = defineRule({
  code: "MTL603",
  name: "heading-template-only",
  severity: "error",
  category: "heading",
  phase: "target",
  step: "headings",
  check: (context: TargetContext): Diagnostic[] => {
    const targetTexts = new Set(context.target.sections.map((section) => section.text));
    return context.template.sections
      .filter((section) => headingPresence(section) === "template-only")
      .filter((section) => targetTexts.has(section.text))
      .map((section) =>
        report(
          headingTemplateOnly,
          `Heading: Heading '${section.text}' is marked [presence:template-only] ` +
            "and must not appear in the linted file",
          anchor(section),
        ),
      );
  },
});

/**
 * Template headings found in the target must keep their relative order
 * (spec 2.6, Q05). Every template heading counts, whatever its presence mode.
 * Its target index is the FIRST target heading with the same text; for an
 * `exist` heading, the first target heading of the same level. A heading with
 * no match is skipped (presence rules cover it). The indices must be
 * non-decreasing, else one finding lists all template and target texts.
 * It has no template anchor: it comes after the presence findings.
 */
const headingOrder = defineRule({
  code: "MTL604",
  name: "heading-order",
  severity: "error",
  category: "heading",
  phase: "target",
  step: "headings",
  check: (context: TargetContext): Diagnostic[] => {
    const targets = context.target.sections;
    const indices = context.template.sections.flatMap((section) => {
      const index =
        headingPresence(section) === "exist"
          ? targets.findIndex((target) => target.level === section.level)
          : targets.findIndex((target) => target.text === section.text);
      return index < 0 ? [] : [index];
    });
    if (indices.slice(1).every((index, before) => (indices[before] ?? 0) <= index)) return [];
    const templateOrder = pyRepr(context.template.sections.map((section) => section.text));
    const targetOrder = pyRepr(targets.map((section) => section.text));
    return [
      report(
        headingOrder,
        `Heading: Heading order mismatch: template order ${templateOrder} vs target order ${targetOrder}`,
      ),
    ];
  },
});

export const rules: readonly AnyRule[] = [
  headingMissing,
  headingLevelMissing,
  headingTemplateOnly,
  headingOrder,
  // new:rule inserts above this line
];
