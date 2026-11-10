/**
 * Category `syntax` (docs/spec.md 4.3, codes MTL001-MTL099): parse failures
 * (MTL001-MTL004) and template tag findings (MTL010-MTL013). The parser layer
 * reports only region, reason, location and subject (src/tags/listeners.ts);
 * this file owns the code, the severity and the message (ADR 0002).
 */
import { defineRule, report, type AnyRule, type TemplateContext } from "../engine/rule.js";
import type { Diagnostic } from "../engine/model.js";
import type { TagFinding, TagFindingReason } from "../tags/ast.js";

/** `Field '<key>'`, `Heading '<text>'`, or the filename comment (no subject). */
function label(finding: TagFinding): string {
  const subject = finding.subject;
  if (subject === null) return "Filename comment";
  return "field" in subject ? `Field '${subject.field}'` : `Heading '${subject.heading}'`;
}

/** Findings of `reason` (and `region` when given) in source order. */
function findingsOf(
  context: TemplateContext,
  reason: TagFindingReason,
  region?: TagFinding["region"],
): TagFinding[] {
  return context.template.findings.filter(
    (finding) => finding.reason === reason && (region === undefined || finding.region === region),
  );
}

const frontmatterMissing = defineRule({
  code: "MTL001",
  name: "frontmatter-missing",
  severity: "error",
  category: "syntax",
  phase: "parse",
  check: (context): Diagnostic[] =>
    context.failure.reason === "frontmatter-missing"
      ? [report(frontmatterMissing, "File must have YAML frontmatter (---...---)")]
      : [],
});

const yamlInvalid = defineRule({
  code: "MTL002",
  name: "yaml-invalid",
  severity: "error",
  category: "syntax",
  phase: "parse",
  check: (context): Diagnostic[] =>
    context.failure.reason === "yaml-invalid"
      ? [report(yamlInvalid, `YAML parse error: ${context.failure.detail}`)]
      : [],
});

const frontmatterNotMapping = defineRule({
  code: "MTL003",
  name: "frontmatter-not-mapping",
  severity: "error",
  category: "syntax",
  phase: "parse",
  check: (context): Diagnostic[] =>
    context.failure.reason === "frontmatter-not-mapping"
      ? [report(frontmatterNotMapping, "YAML frontmatter must be a mapping of 'key: value' pairs")]
      : [],
});

const fileUnreadable = defineRule({
  code: "MTL004",
  name: "file-unreadable",
  severity: "error",
  category: "syntax",
  phase: "parse",
  check: (context): Diagnostic[] =>
    context.failure.reason === "file-unreadable"
      ? [report(fileUnreadable, context.failure.detail)]
      : [],
});

const unknownFieldTag = defineRule({
  code: "MTL010",
  name: "unknown-field-tag",
  severity: "warning",
  category: "syntax",
  phase: "template",
  check: (context): Diagnostic[] =>
    findingsOf(context, "unknown", "frontmatter").map((finding) =>
      report(unknownFieldTag, `${label(finding)}: unknown tag ${finding.tag}`, finding.position),
    ),
});

const unknownHeadingTag = defineRule({
  code: "MTL011",
  name: "unknown-heading-tag",
  severity: "warning",
  category: "syntax",
  phase: "template",
  check: (context): Diagnostic[] =>
    findingsOf(context, "unknown", "body").map((finding) =>
      report(unknownHeadingTag, `${label(finding)}: unknown tag ${finding.tag}`, finding.position),
    ),
});

const malformedTag = defineRule({
  code: "MTL012",
  name: "malformed-tag",
  severity: "warning",
  category: "syntax",
  phase: "template",
  check: (context): Diagnostic[] =>
    findingsOf(context, "malformed").map((finding) =>
      report(malformedTag, `${label(finding)}: malformed tag ${finding.tag}`, finding.position),
    ),
});

const misplacedTag = defineRule({
  code: "MTL013",
  name: "misplaced-tag",
  severity: "warning",
  category: "syntax",
  phase: "template",
  check: (context): Diagnostic[] =>
    findingsOf(context, "wrong-region").map((finding) => {
      const where = finding.region === "frontmatter" ? "in frontmatter" : "in a heading";
      const message = `${label(finding)}: tag ${finding.tag} is not valid ${where}`;
      return report(misplacedTag, message, finding.position);
    }),
});

export const rules: readonly AnyRule[] = [
  frontmatterMissing,
  yamlInvalid,
  frontmatterNotMapping,
  fileUnreadable,
  unknownFieldTag,
  unknownHeadingTag,
  malformedTag,
  misplacedTag,
  // new:rule inserts above this line
];
