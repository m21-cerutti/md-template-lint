/**
 * Category `syntax` (docs/spec.md 4.3, codes MTL001-MTL099): parse failures
 * (MTL001-MTL004), template tag findings (MTL010-MTL013) and target directive
 * warnings (MTL020-MTL025, spec 4.4). The parser layer reports only region,
 * reason, location and subject (src/tags/listeners.ts); this file owns the
 * code, the severity and the message (ADR 0002).
 *
 * The six directive rules share one analysis of the target directives
 * (src/engine/directives.ts) and each keeps its own problems
 * (`directiveDiagnostics`); each finding keeps its analysis index, so the
 * pipeline restores the order of spec 4.1 step 7 across the six rules.
 */
import { directiveDiagnostics } from "../engine/directives.js";
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

const VERBS_EXPECTED =
  "expected disable, disable-line, disable-next-line, disable-file, begin disable or end disable";

const directiveMalformed = defineRule({
  code: "MTL020",
  name: "directive-malformed",
  severity: "warning",
  category: "syntax",
  phase: "target",
  step: "directives",
  check: (context): Diagnostic[] => [
    ...directiveDiagnostics(
      context,
      directiveMalformed,
      "unknown-verb",
      (problem) => `unknown directive '${problem.word}' (${VERBS_EXPECTED})`,
    ),
    ...directiveDiagnostics(
      context,
      directiveMalformed,
      "no-code",
      (problem) => `'${problem.verb}' needs at least one rule code`,
    ),
  ],
});

const directiveUnknownCode = defineRule({
  code: "MTL021",
  name: "directive-unknown-code",
  severity: "warning",
  category: "syntax",
  phase: "target",
  step: "directives",
  check: (context): Diagnostic[] =>
    directiveDiagnostics(
      context,
      directiveUnknownCode,
      "unknown-code",
      (problem) => `unknown rule code '${problem.token}'`,
    ),
});

const directiveCodeNotSuppressible = defineRule({
  code: "MTL022",
  name: "directive-code-not-suppressible",
  severity: "warning",
  category: "syntax",
  phase: "target",
  step: "directives",
  check: (context): Diagnostic[] =>
    directiveDiagnostics(
      context,
      directiveCodeNotSuppressible,
      "not-suppressible",
      (problem) => `rule code ${problem.code} cannot be disabled`,
    ),
});

const directiveEndWithoutBegin = defineRule({
  code: "MTL023",
  name: "directive-end-without-begin",
  severity: "warning",
  category: "syntax",
  phase: "target",
  step: "directives",
  check: (context): Diagnostic[] =>
    directiveDiagnostics(
      context,
      directiveEndWithoutBegin,
      "end-without-begin",
      (problem) =>
        `'end disable ${problem.code}' has no open 'disable' or 'begin disable' for ${problem.code}`,
    ),
});

const directiveBeginUnclosed = defineRule({
  code: "MTL024",
  name: "directive-begin-unclosed",
  severity: "warning",
  category: "syntax",
  phase: "target",
  step: "directives",
  check: (context): Diagnostic[] =>
    directiveDiagnostics(
      context,
      directiveBeginUnclosed,
      "begin-unclosed",
      (problem) =>
        `'begin disable ${problem.code}' is never closed, it runs to the end of the file`,
    ),
});

const directiveAlreadyDisabled = defineRule({
  code: "MTL025",
  name: "directive-already-disabled",
  severity: "warning",
  category: "syntax",
  phase: "target",
  step: "directives",
  check: (context): Diagnostic[] =>
    directiveDiagnostics(
      context,
      directiveAlreadyDisabled,
      "already-disabled",
      (problem) =>
        `'${problem.verb} ${problem.code}' while ${problem.code} is already ` +
        `disabled since line ${problem.open}`,
    ),
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
  directiveMalformed,
  directiveUnknownCode,
  directiveCodeNotSuppressible,
  directiveEndWithoutBegin,
  directiveBeginUnclosed,
  directiveAlreadyDisabled,
  // new:rule inserts above this line
];
