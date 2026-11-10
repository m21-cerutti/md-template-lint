/**
 * Category `syntax` (docs/spec.md 4.3, codes MTL001-MTL099): parse failures (MTL001-MTL004),
 * template tag findings (MTL010-MTL013, MTL014 invalid heading patterns, MTL015, MTL016), the
 * template errors MTL017 (duplicate heading patterns), MTL018 (optional heading with a
 * minimum), MTL019 (child headings out of level order) and MTL030 (order tag without repeat
 * tag), and target directive warnings (MTL020-MTL025, spec 4.4). The parser layer reports only
 * region, reason, location and subject (src/tags/listeners.ts) and the pattern pieces with
 * their first problem (src/tags/visitors/pattern.ts); this file owns the code, the severity
 * and the message (ADR 0002).
 *
 * The six directive rules share one analysis of the target directives
 * (src/engine/directives.ts) and each keeps its own problems (`directiveDiagnostics`); each
 * finding keeps its analysis index, so the pipeline restores the order of spec 4.1 step 7
 * across the six rules.
 */
import { directiveDiagnostics } from "../engine/directives.js";
import { defineRule, report, type AnyRule, type TemplateContext } from "../engine/rule.js";
import {
  hasInvalidPattern,
  headingPattern,
  headingPresence,
  isFileScope,
  isRepeatHeading,
  type Diagnostic,
  type DocumentModel,
  type Section,
} from "../engine/model.js";
import { formatName } from "../engine/pattern.js";
import type { BodyTag, PatternPiece, TagFinding, TagFindingReason } from "../tags/ast.js";

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

/**
 * An invalid `[pattern:"..."]` heading tag (spec 2.10 INVALID PATTERN, 2.7,
 * change C12; argument reasons A72n). The pieces of the tag stop at the first
 * problem from the left; its reason and offset give ONE finding per tag, at
 * the tag column plus the offset: the `{` of the placeholder (the second `{`
 * for adjacent placeholders), the unmatched brace, the backslash of an
 * invalid escape, or the tag's `[` for an empty pattern. `{text}` is the
 * heading label, `{pattern}` the quoted text as written. Never suppressible
 * (DIR6); the heading is not checked and is not a position (`matchHeadings`).
 */
const headingPatternInvalid = defineRule({
  code: "MTL014",
  name: "heading-pattern-invalid",
  severity: "warning",
  category: "syntax",
  phase: "template",
  check: (context): Diagnostic[] =>
    context.template.sections.flatMap((section) =>
      section.tags.flatMap((tag) => {
        if (tag.kind !== "pattern") return [];
        const problem = tag.pieces.find((piece) => piece.kind === "invalid");
        if (problem?.kind !== "invalid") return [];
        return [
          report(
            headingPatternInvalid,
            `Heading '${section.text}': invalid pattern [pattern:"${tag.text}"] (${problem.reason})`,
            { line: tag.position.line, column: tag.position.column + problem.offset },
          ),
        ];
      }),
    ),
});

/** The MTL015 reason of a tag on a `[presence:template-only]` heading (spec 2.7). */
const TEMPLATE_ONLY_REASON = "the heading is [presence:template-only]";

/**
 * A known, well-formed heading tag that can have no effect on its heading
 * (spec 2.7, change C10). One finding per such tag, at the tag, in tag order.
 * Reasons today: the heading is `[presence:template-only]` (its effective
 * presence, spec 2.6 precedence), which never has a match in a valid target,
 * for every `[content:subheadings:disallow]` and `[content:subheadings:no-extra]`
 * tag (phase P7b) and every `[unique-headings-names]` tag (phase A80c, spec 2.11), for the
 * effective (first)
 * `[pattern:"..."]` tag and for the first `[repeat-rules:...]` tag of each of
 * the three repeat kinds and the first `[order:...]` tag (any form) (spec 2.10:
 * the tag is ignored, the heading stays template-only by text); and
 * `the heading has no [pattern:...]` for the first repeat tag of each kind
 * (phase P4) and the first order tag (phase P7) on a heading without any
 * pattern tag. A heading whose pattern is invalid (MTL014)
 * gets no MTL015 for its pattern, repeat or order tags (one cause, one warning).
 */
const headingTagConflict = defineRule({
  code: "MTL015",
  name: "heading-tag-conflict",
  severity: "warning",
  category: "syntax",
  phase: "template",
  check: (context): Diagnostic[] =>
    context.template.sections.flatMap((section) => {
      const templateOnly = headingPresence(section) === "template-only";
      const hasPattern = section.tags.some((tag) => tag.kind === "pattern");
      // The reason, or null when the tag can apply (spec 2.7; template-only is the first cause).
      const reasonFor = (tag: BodyTag, index: number, tags: readonly BodyTag[]): string | null => {
        if (
          (tag.kind === "content" &&
            (tag.check === "subheadings-disallow" || tag.check === "subheadings-no-extra")) ||
          tag.kind === "unique-names"
        ) {
          return templateOnly ? TEMPLATE_ONLY_REASON : null;
        }
        // Pattern and repeat tags: the first tag of its kind (the three repeat kinds apart,
        // spec 2.10), never after an invalid pattern (MTL014: one cause, one warning).
        if (tag.kind !== "pattern" && tag.kind !== "repeat" && tag.kind !== "order") return null;
        const kindOf = (other: BodyTag): string =>
          other.kind === "repeat" ? `repeat:${other.bound}` : other.kind;
        const first = tags.findIndex((other) => kindOf(other) === kindOf(tag));
        if (first !== index || hasInvalidPattern(section)) return null;
        if (templateOnly) return TEMPLATE_ONLY_REASON;
        // Phase P7: an order tag without pattern gets this reason only, never MTL030 (spec 2.7).
        return tag.kind !== "pattern" && !hasPattern ? "the heading has no [pattern:...]" : null;
      };
      return section.tags.flatMap((tag, index, tags) => {
        const reason = reasonFor(tag, index, tags);
        if (reason === null) return [];
        return [
          report(
            headingTagConflict,
            `Heading '${section.text}': tag ${tag.raw} has no effect (${reason})`,
            tag.position,
          ),
        ];
      });
    }),
});

/**
 * A template date field without its date format tag (spec 2.9, change C11):
 * type `date` without `[format:date]`, or type `list-of-date` without
 * `[format:elements:date]`. The type is the inferred one (spec 3.2). A scalar
 * tag on a `list-of-date` field (or the reverse) does not count. One finding
 * per field, at column 1 of its key line (the last occurrence, Q06).
 */
const dateFormatMissing = defineRule({
  code: "MTL016",
  name: "date-format-missing",
  severity: "warning",
  category: "syntax",
  phase: "template",
  check: (context): Diagnostic[] =>
    [...context.template.fields.values()].flatMap((field) => {
      const kind =
        field.type === "date"
          ? "format-shape"
          : field.type === "list-of-date"
            ? "format-elements-shape"
            : null;
      if (kind === null) return [];
      // The first tag of the kind wins (spec 2.1): `[format:semver] [format:date]` is semver.
      const first = (field.comment?.tags ?? []).find((tag) => tag.kind === kind);
      if (first !== undefined && "shape" in first && first.shape === "date") return [];
      const tag = kind === "format-shape" ? "[format:date]" : "[format:elements:date]";
      return [
        report(
          dateFormatMissing,
          `Field '${field.key}' (type=${field.type}): no ${tag}, default date formats apply`,
          { line: field.line, column: 1 },
        ),
      ];
    }),
});

/**
 * The pieces a template heading is compared by (spec 2.10 "Duplicate pattern", A72l): the
 * pieces of its effective pattern for a pattern heading, else the literal pattern of its
 * stored text (one literal piece, 2.6 "Match of T"; also a heading whose pattern tag MTL015
 * ignores).
 */
function comparedPieces(section: Section): readonly PatternPiece[] {
  return headingPattern(section) ?? [{ kind: "literal", text: section.text }];
}

/**
 * SAME PATTERN (spec 2.10, A72m, A72n): the same list of pieces; a literal piece equal by its
 * resolved text (case-sensitive); a placeholder equal by name and effective format name (both
 * stored lowercase, so case-insensitive; no format equals the default name) and by argument
 * (a valid argument has no leading zero, so equal values are equal text).
 */
function samePattern(a: readonly PatternPiece[], b: readonly PatternPiece[]): boolean {
  return (
    a.length === b.length &&
    a.every((piece, index) => {
      const other = b[index];
      if (other === undefined) return false;
      if (piece.kind === "literal") return other.kind === "literal" && other.text === piece.text;
      if (piece.kind === "placeholder") {
        return (
          other.kind === "placeholder" &&
          other.name === piece.name &&
          formatName(other) === formatName(piece) &&
          other.argument === piece.argument
        );
      }
      return false;
    })
  );
}

/** The effective (first) `[pattern:"..."]` tag of a heading, if any (spec 2.10). */
function patternTagOf(section: Section): Extract<BodyTag, { kind: "pattern" }> | undefined {
  const tag = section.tags.find((item) => item.kind === "pattern");
  return tag?.kind === "pattern" ? tag : undefined;
}

/**
 * Column of the first character of the stored text of the heading on `line` (spec 2.10
 * "Position" of an exact-text heading): after the optional indent, the `#` run and the
 * blanks that follow it. Only heading tags at the end of the line are peeled (2.7), so the
 * text starts there. The prefix is ASCII, so the code unit index is the code point column.
 */
function textColumn(template: DocumentModel, line: number): number {
  const block = template.document.body.find((item) => item.line === line);
  const raw = block?.kind === "heading" ? block.raw : "";
  let at = 0;
  while (raw[at] === " ") at += 1;
  while (raw[at] === "#") at += 1;
  while (raw[at] === " " || raw[at] === "\t") at += 1;
  return at + 1;
}

/**
 * Two ADJACENT members of a template sequence with the same pattern (spec 2.10 "Duplicate
 * pattern", owner decision 7 of A72k, widened by A72l and A72m). A template sequence is, per
 * level and scope of the template alone (file scope per level; section scope per level and
 * template parent), the template headings in template order without the
 * `[presence:template-only]` ones and those with an invalid pattern (MTL014). Every member is
 * compared: pattern headings by their pieces, exact-text headings by the literal pattern of
 * their text. One finding on the later heading of each such pair (three in a row give two),
 * at the `[` of its effective pattern tag (first message form) or at the first character of
 * its text (second form). A TEMPLATE ERROR (2.7): `--verify` FAIL, exit 1; never suppressible.
 */
const headingPatternDuplicate = defineRule({
  code: "MTL017",
  name: "heading-pattern-duplicate",
  severity: "error",
  category: "syntax",
  phase: "template",
  check: (context): Diagnostic[] => {
    const { template } = context;
    /** Sequence key -> its last member so far. */
    const last = new Map<string, Section>();
    const found: Diagnostic[] = [];
    for (const section of template.sections) {
      if (hasInvalidPattern(section) || headingPresence(section) === "template-only") continue;
      const key = `${section.level}:${isFileScope(section) ? "file" : String(section.parent)}`;
      const previous = last.get(key);
      last.set(key, section);
      if (previous === undefined) continue;
      if (!samePattern(comparedPieces(previous), comparedPieces(section))) continue;
      const tag = headingPattern(section) === null ? undefined : patternTagOf(section);
      const where = `the previous heading '${previous.text}' (line ${previous.line})`;
      found.push(
        tag === undefined
          ? report(
              headingPatternDuplicate,
              `Heading '${section.text}': matches the same headings as ${where}`,
              { line: section.line, column: textColumn(template, section.line) },
            )
          : report(
              headingPatternDuplicate,
              `Heading '${section.text}': same pattern [pattern:"${tag.text}"] as ${where}`,
              tag.position,
            ),
      );
    }
    return found;
  },
});

/**
 * A repeat heading whose presence says "may be absent" and whose explicit minimum says "at
 * least N" (spec 2.10 "Repeat rules", owner decision 3 of A72l): an effective pattern and an
 * effective repeat tag (`isRepeatHeading`: no `MTL014`, no repeat tag ignored by `MTL015`),
 * presence `[presence:optional]` by the 2.6 precedence (so not conditional), and an explicit
 * `[repeat-rules:same-level:min:N]` (the first of its kind). One finding per heading, at the
 * `[` of that `min` tag. A TEMPLATE ERROR (2.7) like MTL017; never suppressible.
 */
const headingOptionalMinConflict = defineRule({
  code: "MTL018",
  name: "heading-optional-min-conflict",
  severity: "error",
  category: "syntax",
  phase: "template",
  check: (context): Diagnostic[] =>
    context.template.sections.flatMap((section) => {
      if (!isRepeatHeading(section) || headingPresence(section) !== "optional") return [];
      const min = section.tags.find((tag) => tag.kind === "repeat" && tag.bound === "min");
      if (min?.kind !== "repeat" || min.n === null) return [];
      return [
        report(
          headingOptionalMinConflict,
          `Heading '${section.text}': tag ${min.raw} contradicts [presence:optional] ` +
            `(a minimum of ${min.n} requires the heading)`,
          min.position,
        ),
      ];
    }),
});

/**
 * A CHILD ORDER CONFLICT (spec 2.7, owner decision 2 of A72m): the child list of a template
 * heading P (the section-scope template headings whose template parent is P, in template
 * order, the list of MTL611) holds a heading after a deeper one. P is any heading that is not
 * `[presence:template-only]`; a P with an invalid pattern (MTL014) is checked too (owner
 * decision 1 of A72n). The list leaves out template-only children and children with an
 * invalid pattern. One finding per P, on its FIRST offending child C, `{prev}` the first
 * earlier child deeper than C; at the template line of C, column 1. A TEMPLATE ERROR (2.7)
 * like MTL017; never suppressible.
 */
const headingChildOrderConflict = defineRule({
  code: "MTL019",
  name: "heading-child-order-conflict",
  severity: "error",
  category: "syntax",
  phase: "template",
  check: (context): Diagnostic[] => {
    const sections = context.template.sections;
    return sections.flatMap((parent, index) => {
      if (headingPresence(parent) === "template-only") return [];
      const children = sections.filter(
        (child) =>
          !isFileScope(child) &&
          child.parent === index &&
          headingPresence(child) !== "template-only" &&
          !hasInvalidPattern(child),
      );
      for (const [at, child] of children.entries()) {
        const prev = children.slice(0, at).find((earlier) => earlier.level > child.level);
        if (prev === undefined) continue;
        return [
          report(
            headingChildOrderConflict,
            `Heading '${child.text}' (H${child.level}): comes after the deeper child ` +
              `'${prev.text}' (H${prev.level}, line ${prev.line}) under '${parent.text}'`,
            { line: child.line, column: 1 },
          ),
        ];
      }
      return [];
    });
  },
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

/**
 * An ORDER WITHOUT REPEAT (spec 2.7, owner decision 3 of A72n): the effective (first)
 * `[order:...]` tag, any form, on a PATTERN HEADING (an effective, valid pattern, not
 * `[presence:template-only]`) with no `[repeat-rules:...]` tag of any kind. A heading without
 * pattern, a template-only heading and one with an invalid pattern get MTL015 or MTL014
 * instead (one cause, one finding). One finding per heading, at the `[` of the order tag. A
 * TEMPLATE ERROR (2.7) like MTL017; never suppressible. In a lint run the heading is a single
 * position, so the tag compares nothing (MTL609 reads repeat headings only).
 */
const headingOrderWithoutRepeat = defineRule({
  code: "MTL030",
  name: "heading-order-without-repeat",
  severity: "error",
  category: "syntax",
  phase: "template",
  check: (context): Diagnostic[] =>
    context.template.sections.flatMap((section) => {
      if (headingPattern(section) === null) return [];
      if (section.tags.some((tag) => tag.kind === "repeat")) return [];
      const order = section.tags.find((tag) => tag.kind === "order");
      if (order === undefined) return [];
      return [
        report(
          headingOrderWithoutRepeat,
          `Heading '${section.text}': tag ${order.raw} needs [repeat-rules:same-level] ` +
            "(an order compares the repeats of one heading)",
          order.position,
        ),
      ];
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
  headingPatternInvalid,
  headingTagConflict,
  dateFormatMissing,
  headingPatternDuplicate,
  headingOptionalMinConflict,
  headingChildOrderConflict,
  directiveMalformed,
  directiveUnknownCode,
  directiveCodeNotSuppressible,
  directiveEndWithoutBegin,
  directiveBeginUnclosed,
  directiveAlreadyDisabled,
  headingOrderWithoutRepeat,
  // new:rule inserts above this line
];
