/**
 * Category `heading` (docs/spec.md 4.3, codes MTL600-MTL699): heading
 * presence and order. Heading suffix tags are spec 2.6; the evaluation order
 * is spec 4.1 step 5. Every message carries the prefix `Heading: `.
 *
 * Every rule reads the positional run of `matchHeadings` (spec 2.6 "Match of
 * T", 2.10 "Positional match", ADR 0012): the template headings of one level
 * and scope take the siblings of that level and scope in order, at the exact
 * level (change C10). MTL601 and MTL604 look at file-scope template
 * headings only; MTL603 at the first sibling each checked template-only
 * heading sets aside (both scopes); MTL605 at checked required pattern
 * headings (spec 2.10, both scopes), which MTL601 and MTL610 skip;
 * MTL606 at the sibling a required placeholder position took as a mismatch;
 * MTL607 at repeat sets below an explicit `min` (replacing MTL605 at zero);
 * MTL608 at repeat sets above an explicit `max`;
 * MTL609 at repeat sets with a pair out of the order of their order tag;
 * MTL614 at repeat sets with matching siblings after the end of their run (the tail);
 * MTL617 at repeat sets with an instance without the key of their `first:` order tag;
 * MTL610 at checked section-scope template
 * headings only; MTL611 at the direct children of each checked, matched
 * parent; MTL612 at the target headings under a
 * `[content:subheadings:disallow]` heading; MTL615 at the direct children of a
 * `[content:subheadings:no-extra]` heading's match; MTL616 (the only warning) at the tail
 * headings of each run that no error names; MTL613 at the later duplicate names of the
 * `[unique-headings-names]` scopes (spec 2.11). A repeat heading has one
 * `matchHeadings` entry per instance (spec 2.10 "Repeat rules"), so the
 * section-scope rules run once per instance; the order lists read entry 0.
 */
import { defineRule, report, setAnchorLine, type AnyRule } from "../engine/rule.js";
import {
  headingMatches,
  headingPattern,
  headingPresence,
  isRepeatHeading,
  matchHeadings,
  type Diagnostic,
  type DocumentModel,
  type HeadingMatch,
  type HeadingRun,
  type Section,
} from "../engine/model.js";
import {
  compareOrderKeys,
  failingPiece,
  orderKey,
  orderTagText,
  type OrderTag,
} from "../engine/pattern.js";
import { pyRepr } from "../engine/values.js";
import type { PatternPiece, SourcePosition } from "../tags/ast.js";

/**
 * Template anchor of a heading finding (MTL601 to MTL603, MTL610 to MTL612):
 * the line of the template heading it is about (MTL611: the parent, MTL612:
 * the tagged heading). The pipeline stable-sorts the `headings` step
 * by it (legacy interleaving in template heading order) and then clears it,
 * so it never reaches a reporter as a location in the target.
 */
const anchor = (section: Section): SourcePosition => ({ line: section.line, column: 1 });

/** `{pattern}` of spec 4.3: the effective pattern tag's text as written between the quotes. */
function writtenPattern(section: Section): string {
  const tag = section.tags.find((entry) => entry.kind === "pattern");
  return tag?.kind === "pattern" ? tag.text : "";
}

/** `{in}` of spec 4.3: empty in file scope, `Section '{parent}': ` in section scope. */
const scopePrefix = (item: HeadingMatch): string =>
  item.scope === "section" && item.parentMatch !== null
    ? `Section '${item.parentMatch.text}': `
    : "";

/**
 * `{min}` or `{max}` of spec 4.3: the `N` of the effective explicit bound of a REPEAT HEADING
 * (its first `[repeat-rules:same-level:min:N]` or `[repeat-rules:same-level:max:N]` tag, one
 * kind each, 2.10 "Repeat rules"); null without one, and for a heading that is no repeat
 * heading (invalid pattern MTL014, repeat tags ignored by MTL015).
 */
function explicitBound(section: Section, bound: "min" | "max"): number | null {
  if (!isRepeatHeading(section)) return null;
  const tag = section.tags.find((entry) => entry.kind === "repeat" && entry.bound === bound);
  return tag?.kind === "repeat" ? tag.n : null;
}

const explicitMin = (section: Section): number | null => explicitBound(section, "min");

/** `{piece}` of spec 4.3: a placeholder as written, or a literal in single quotes (2.10). */
const pieceText = (piece: PatternPiece): string =>
  piece.kind === "placeholder" ? piece.raw : piece.kind === "literal" ? `'${piece.text}'` : "";

/**
 * Checked required file-scope template headings without a match. A file-scope heading is
 * unchecked only when its pattern is invalid (MTL014, spec 2.6 "Checked"). A pattern heading
 * is never MTL601: MTL605 replaces it (spec 2.10 "Presence").
 */
function missingInFile(matches: readonly HeadingMatch[]): HeadingMatch[] {
  return matches.filter(
    (item) =>
      item.scope === "file" &&
      item.checked &&
      item.match === null &&
      headingPresence(item.section) === "required" &&
      headingPattern(item.section) === null,
  );
}

/** `MTL601` message (spec 4.3): second form when a same-text sibling comes later (2.10 3b). */
function missingMessage(item: HeadingMatch): string {
  const position = item.run?.positions.find((entry) => entry.index === item.index);
  const later = position?.foundLater ?? null;
  const hint = later === null ? "" : ` (found later at line ${later.line}, out of order)`;
  return `Heading: Missing required heading: '${item.section.text}'${hint}`;
}

/**
 * A required file-scope template heading needs the sibling at its position
 * (same level) to have the same text (spec 2.10 step 3b). Text comparison is
 * exact and case sensitive. Tags are already removed from both texts. A
 * missing section-scope heading is not this code. When a sibling with the
 * same text comes later in the run, the message names its line (owner
 * decision 6 of A72l); the finding keeps no anchor.
 */
const headingMissing = defineRule({
  code: "MTL601",
  name: "heading-missing",
  severity: "error",
  category: "heading",
  phase: "target",
  step: "headings",
  check: (context): Diagnostic[] =>
    missingInFile(matchHeadings(context.template, context.target)).map((item) =>
      report(headingMissing, missingMessage(item), anchor(item.section)),
    ),
});

/**
 * A checked `template-only` template heading must not appear in its scope
 * (the whole file, or the target section matched by its template parent):
 * every sibling with its text is set aside from the run, and the first of
 * them is an error (spec 2.10 step 1). Absent is the silent, correct outcome
 * (spec 2.6, 4.3). Findings follow the template heading order.
 */
const headingTemplateOnly = defineRule({
  code: "MTL603",
  name: "heading-template-only",
  severity: "error",
  category: "heading",
  phase: "target",
  step: "headings",
  // Target anchor (spec 4.4 DIR5): the first sibling the heading sets aside.
  check: (context): Diagnostic[] =>
    matchHeadings(context.template, context.target).flatMap((item) => {
      const { section, setAside } = item;
      if (!item.checked || setAside === null || headingPresence(section) !== "template-only") {
        return [];
      }
      const diagnostic = report(
        headingTemplateOnly,
        `Heading: Heading '${section.text}' is marked [presence:template-only] ` +
          "and must not appear in the linted file",
        anchor(section),
      );
      return [setAnchorLine(diagnostic, setAside.line)];
    }),
});

/**
 * File-scope template headings found in the target must keep their relative
 * order (spec 2.6, Q05). Every checked file-scope template heading counts,
 * whatever its presence mode. Its target index is its positional match. A heading
 * with no match (missing, template-only) is skipped (presence rules cover
 * it). Within one level the run is ordered by construction, so only an order
 * across levels can fail. The indices must be
 * non-decreasing, else one finding lists the file-scope template texts and
 * the target texts up to the deepest level of that list (at least 2).
 * It has no template anchor: it comes after the presence findings.
 */
const headingOrder = defineRule({
  code: "MTL604",
  name: "heading-order",
  severity: "error",
  category: "heading",
  phase: "target",
  step: "headings",
  check: (context): Diagnostic[] => {
    const targets = context.target.sections;
    // A heading with an invalid pattern (MTL014) is not checked and not listed (spec 2.6). A
    // repeat heading is listed once: its first instance is its match (spec 2.10).
    const fileScope = matchHeadings(context.template, context.target).filter(
      (item) => item.scope === "file" && item.checked && item.instance === 0,
    );
    const indices = fileScope.flatMap((item) =>
      item.match === null ? [] : [targets.indexOf(item.match)],
    );
    if (indices.slice(1).every((index, before) => (indices[before] ?? 0) <= index)) return [];
    const deepest = Math.max(2, ...fileScope.map((item) => item.section.level));
    const templateOrder = pyRepr(fileScope.map((item) => item.section.text));
    const targetOrder = pyRepr(
      targets.filter((section) => section.level <= deepest).map((section) => section.text),
    );
    return [
      report(
        headingOrder,
        `Heading: Heading order mismatch: template order ${templateOrder} vs target order ${targetOrder}`,
      ),
    ];
  },
});

/**
 * A checked, required PATTERN HEADING T (spec 2.10 "Presence", steps 3b, 3c, 3d3) whose
 * position took nothing: a literal pattern (no placeholder) whose next sibling differs or
 * is absent, or a placeholder pattern with no sibling left (a placeholder position with a
 * sibling left that does not match is MTL606); for a repeat heading, zero instances when
 * step 3d1 took no mismatch. Both scopes; `{in}` is
 * `Section '{parent}': ` in section scope, `{parent}` the target parent match. No anchor
 * (spec 4.4 DIR5), even in section scope, so only `disable-file MTL605` silences it. The
 * heading member is T's label (the pipeline names it from the template line).
 */
const headingPatternMissing = defineRule({
  code: "MTL605",
  name: "heading-pattern-missing",
  severity: "error",
  category: "heading",
  phase: "target",
  step: "headings",
  check: (context): Diagnostic[] =>
    matchHeadings(context.template, context.target).flatMap((item) => {
      const { section, match } = item;
      const pieces = headingPattern(section);
      if (!item.checked || match !== null || pieces === null) return [];
      if (headingPresence(section) !== "required") return [];
      // An explicit `min` decides alone, also at zero instances: MTL607 replaces MTL605 (2.10).
      if (explicitMin(section) !== null) return [];
      const position = item.run?.positions.find((entry) => entry.index === item.index);
      const placeholder = pieces.some((piece) => piece.kind === "placeholder");
      if (placeholder && (position?.next ?? null) !== null) return [];
      return [
        report(
          headingPatternMissing,
          `Heading: ${scopePrefix(item)}missing required heading matching ` +
            `[pattern:"${writtenPattern(section)}"] (H${section.level})`,
          anchor(section),
        ),
      ];
    }),
});

/**
 * A checked, required PLACEHOLDER position (spec 2.10 steps 3c and 3d1) whose next sibling
 * does not match its pattern took that sibling as a MISMATCH: one finding on it, `{piece}` the
 * FAILING PIECE (2.10), `{in}` as MTL605. Only when a sibling was left (with none, MTL605
 * speaks). The mismatch is not a match (no content, sub-heading or section-scope check, not
 * in the order lists, never also MTL612). Anchor (spec 4.4 DIR5): the mismatched sibling's
 * line; the `heading` member is its text (spec 8.1).
 */
const headingPatternMismatch = defineRule({
  code: "MTL606",
  name: "heading-pattern-mismatch",
  severity: "error",
  category: "heading",
  phase: "target",
  step: "headings",
  check: (context): Diagnostic[] =>
    matchHeadings(context.template, context.target).flatMap((item) => {
      const { section, mismatch } = item;
      const pieces = headingPattern(section);
      // One position per scope: its entry 0 carries the mismatch (instances share it).
      if (!item.checked || item.instance !== 0 || mismatch === null || pieces === null) return [];
      const piece = failingPiece(pieces, mismatch.text);
      if (piece === null) return [];
      const diagnostic = report(
        headingPatternMismatch,
        `Heading: ${scopePrefix(item)}heading '${mismatch.text}' does not match ` +
          `[pattern:"${writtenPattern(section)}"] at ${pieceText(piece)}`,
        anchor(section),
      );
      return [setAnchorLine({ ...diagnostic, heading: mismatch.text }, mismatch.line)];
    }),
});

/**
 * A checked REPEAT HEADING with an explicit `min` (spec 2.10 step 3d3, "Repeat rules"
 * "Defaults" and "Bounds"): fewer instances `n` than the `N` of its effective (first) `min`
 * tag, also at `n` 0, is one finding per repeat set (one per scope: per parent match or
 * instance in section scope). The default minimum (1 when required, 0 otherwise) is the
 * presence rule (MTL605), never this code. Anchor (spec 4.4 DIR5): the first instance; none
 * at zero instances (the pipeline then sorts it by template line, entries in parent order).
 * `{in}` as MTL605; the `heading` member is T's label (the pipeline names it, spec 8.1).
 */
const headingRepeatMin = defineRule({
  code: "MTL607",
  name: "heading-repeat-min",
  severity: "error",
  category: "heading",
  phase: "target",
  step: "headings",
  check: (context): Diagnostic[] =>
    matchHeadings(context.template, context.target).flatMap((item) => {
      const { section } = item;
      const min = explicitMin(section);
      // One repeat set per scope: its entry 0 (the instances share the position).
      if (!item.checked || item.instance !== 0 || min === null) return [];
      const position = item.run?.positions.find((entry) => entry.index === item.index);
      const instances = position?.instances ?? [];
      if (instances.length >= min) return [];
      const diagnostic = report(
        headingRepeatMin,
        `Heading: ${scopePrefix(item)}${instances.length} heading(s) match ` +
          `[pattern:"${writtenPattern(section)}"], minimum is ${min}`,
        anchor(section),
      );
      const first = instances[0];
      return [first === undefined ? diagnostic : setAnchorLine(diagnostic, first.line)];
    }),
});

/**
 * A checked REPEAT HEADING with an explicit `max` (spec 2.10 step 3d3, "Repeat rules"
 * "Bounds"): more instances `n` than the `N` of its effective (first) `max` tag is one finding
 * per repeat set (one per scope: per parent match or instance in section scope). The bound
 * never stops the run: every matching sibling is an instance. There is no default maximum. A
 * `min` tag plays no part (MTL607). Anchor (spec 4.4 DIR5): the instance number `max + 1`.
 * `{in}` as MTL605; the `heading` member is T's label (the pipeline names it, spec 8.1).
 */
const headingRepeatMax = defineRule({
  code: "MTL608",
  name: "heading-repeat-max",
  severity: "error",
  category: "heading",
  phase: "target",
  step: "headings",
  check: (context): Diagnostic[] =>
    matchHeadings(context.template, context.target).flatMap((item) => {
      const { section } = item;
      const max = explicitBound(section, "max");
      // One repeat set per scope: its entry 0 (the instances share the position).
      if (!item.checked || item.instance !== 0 || max === null) return [];
      const position = item.run?.positions.find((entry) => entry.index === item.index);
      const instances = position?.instances ?? [];
      const over = instances[max];
      if (over === undefined) return [];
      const diagnostic = report(
        headingRepeatMax,
        `Heading: ${scopePrefix(item)}${instances.length} heading(s) match ` +
          `[pattern:"${writtenPattern(section)}"], maximum is ${max}`,
        anchor(section),
      );
      return [setAnchorLine(diagnostic, over.line)];
    }),
});

/**
 * The effective (first, spec 2.10 "First tag of a kind") `[order:...]` tag of a REPEAT HEADING;
 * null without one and for a heading that is no repeat heading (no or invalid pattern, no
 * repeat tag, template-only: `MTL015`, `MTL014` or `MTL030` speak instead).
 */
function effectiveOrder(section: Section): OrderTag | null {
  if (!isRepeatHeading(section)) return null;
  const tag = section.tags.find((entry) => entry.kind === "order");
  return tag?.kind === "order" ? tag : null;
}

/**
 * A checked REPEAT HEADING with an effective order tag (spec 2.10 step 3d4, "Order"): the
 * adjacent pairs of its repeat set are the consecutive instances, in file order, among those
 * with an ORDER KEY (an instance without key, `first:` forms only, takes no part; MTL617
 * reports it). With `ascending` a pair is out of order when the later key is lower, with
 * `descending` when it is higher; equal keys pass. ONE finding per repeat set (one per scope:
 * per parent match or instance in section scope) with at least one pair out of order. Anchor
 * (spec 4.4 DIR5): the later instance of the FIRST pair out of order; `{text}` its text, `{prev}`
 * the earlier instance's text, `{count}` the pairs out of order, `{tag}` the order tag in its
 * canonical lowercase form, `{in}` as MTL605; the `heading` member is `{text}` (spec 8.1).
 */
const headingPatternOrder = defineRule({
  code: "MTL609",
  name: "heading-pattern-order",
  severity: "error",
  category: "heading",
  phase: "target",
  step: "headings",
  check: (context): Diagnostic[] =>
    matchHeadings(context.template, context.target).flatMap((item) => {
      const { section } = item;
      const order = effectiveOrder(section);
      // One repeat set per scope: its entry 0 (the instances share the position).
      if (!item.checked || item.instance !== 0 || order === null) return [];
      const position = item.run?.positions.find((entry) => entry.index === item.index);
      const keyed = (position?.instances ?? []).flatMap((instance) => {
        const key = orderKey(order.by, instance.text);
        return key === null ? [] : [{ instance, key }];
      });
      const sign = order.direction === "ascending" ? -1 : 1;
      const outOfOrder = keyed.slice(1).flatMap((later, at) => {
        const earlier = keyed[at];
        if (earlier === undefined) return [];
        const result = compareOrderKeys(order.by, later.key, earlier.key);
        return Math.sign(result) === sign
          ? [{ earlier: earlier.instance, later: later.instance }]
          : [];
      });
      const first = outOfOrder[0];
      if (first === undefined) return [];
      const diagnostic = report(
        headingPatternOrder,
        `Heading: ${scopePrefix(item)}heading '${first.later.text}' is not in ${order.direction} ` +
          `order after '${first.earlier.text}', ${outOfOrder.length} pair(s) out of order ` +
          orderTagText(order),
        anchor(section),
      );
      return [setAnchorLine({ ...diagnostic, heading: first.later.text }, first.later.line)];
    }),
});

/**
 * A checked REPEAT HEADING whose effective order tag is a `first:` form (spec 2.10 step 3d4,
 * "Order", A72m): ONE finding per repeat set (one per scope: per parent match or instance in
 * section scope), at any `n` of 1 or more, with at least one instance without ORDER KEY. The
 * whole-text forms give every instance a key, so never this code. Anchor (spec 4.4 DIR5): the
 * first instance without key; `{count}` the number of such instances, `{pylist}` their texts in
 * file order, `{kind}` the keyword of the form, `{placeholder}` the literal `{number}`, `{date}`
 * or `{semver}`, `{tag}` the order tag in its canonical lowercase form, `{in}` as MTL605; the
 * `heading` member is the anchor's text (spec 8.1).
 */
const headingOrderKeyMissing = defineRule({
  code: "MTL617",
  name: "heading-order-key-missing",
  severity: "error",
  category: "heading",
  phase: "target",
  step: "headings",
  check: (context): Diagnostic[] =>
    matchHeadings(context.template, context.target).flatMap((item) => {
      const { section } = item;
      const order = effectiveOrder(section);
      // One repeat set per scope: its entry 0 (the instances share the position).
      if (!item.checked || item.instance !== 0 || order === null) return [];
      const position = item.run?.positions.find((entry) => entry.index === item.index);
      const keyless = (position?.instances ?? []).filter(
        (instance) => orderKey(order.by, instance.text) === null,
      );
      const first = keyless[0];
      if (first === undefined) return [];
      const kind = order.by.slice("first-".length);
      const diagnostic = report(
        headingOrderKeyMissing,
        `Heading: ${scopePrefix(item)}${keyless.length} heading(s) have no ${kind} to order by ` +
          `${orderTagText(order)}, use a [pattern:...] with {${kind}}: ` +
          pyRepr(keyless.map((instance) => instance.text)),
        anchor(section),
      );
      return [setAnchorLine({ ...diagnostic, heading: first.text }, first.line)];
    }),
});

/**
 * A checked REPEAT HEADING with tail siblings (spec 2.10 step 4, "Repeat rules", owner decision
 * 3 of A72k): the siblings after the end of the run whose text matches its pattern and that no
 * earlier repeat heading of the sequence lists (`repeatMisses` of its position) are ONE finding
 * per repeat set (one per scope: per parent match or instance in section scope). Anchor (spec
 * 4.4 DIR5): the first listed heading; `{count}` and `{pylist}` the listed headings in file
 * order, `{in}` as MTL605; the `heading` member is the anchor's text (spec 8.1).
 */
const headingRepeatMiss = defineRule({
  code: "MTL614",
  name: "heading-repeat-miss",
  severity: "error",
  category: "heading",
  phase: "target",
  step: "headings",
  check: (context): Diagnostic[] =>
    matchHeadings(context.template, context.target).flatMap((item) => {
      const { section } = item;
      // One repeat set per scope: its entry 0 (the instances share the position).
      if (!item.checked || item.instance !== 0) return [];
      const position = item.run?.positions.find((entry) => entry.index === item.index);
      const misses = position?.repeatMisses ?? [];
      const first = misses[0];
      if (first === undefined) return [];
      const diagnostic = report(
        headingRepeatMiss,
        `Heading: ${scopePrefix(item)}${misses.length} heading(s) match ` +
          `[pattern:"${writtenPattern(section)}"] after the end of its run ` +
          `[repeat-rules:same-level]: ${pyRepr(misses.map((heading) => heading.text))}`,
        anchor(section),
      );
      return [setAnchorLine({ ...diagnostic, heading: first.text }, first.line)];
    }),
});

/**
 * A checked section-scope template heading (spec 2.6: H3 to H6 with a
 * template parent that is checked, matched and not template-only) needs a
 * positional match in the run inside the target section of its parent's
 * match: required, the sibling at its position with the same text (spec 2.10
 * step 3b). Optional and conditional headings may be absent; a template-only
 * one is MTL603. An unchecked heading (missing or optional parent) is never
 * reported, so one cause gives one finding (the parent's MTL601 or MTL610).
 */
const headingMissingInSection = defineRule({
  code: "MTL610",
  name: "heading-missing-in-section",
  severity: "error",
  category: "heading",
  phase: "target",
  step: "headings",
  // Target anchor (spec 4.4 DIR5): the line of the target parent heading (the parent's match).
  check: (context): Diagnostic[] =>
    matchHeadings(context.template, context.target).flatMap((item) => {
      const { section, match, parentMatch } = item;
      if (item.scope !== "section" || !item.checked || match !== null || parentMatch === null) {
        return [];
      }
      // A pattern heading is MTL605, never MTL610 (spec 2.10 "Presence").
      if (headingPresence(section) !== "required" || headingPattern(section) !== null) return [];
      const message =
        `Heading: Section '${parentMatch.text}': ` +
        `missing required heading '${section.text}' (H${section.level})`;
      const diagnostic = report(headingMissingInSection, message, anchor(section));
      return [setAnchorLine(diagnostic, parentMatch.line)];
    }),
});

/**
 * The direct children of each checked, matched, not template-only template
 * heading P (the section-scope template headings whose template parent is P)
 * keep their relative order inside the target section of P's match (spec 2.6).
 * Every checked child counts, whatever its presence mode; a child without match is
 * skipped (presence covers it). One finding per P at most: it lists the
 * children's texts and the texts of the target headings inside P's match up
 * to the deepest child level. File scope order stays MTL604.
 */
const headingOrderInSection = defineRule({
  code: "MTL611",
  name: "heading-order-in-section",
  severity: "error",
  category: "heading",
  phase: "target",
  step: "headings",
  // Target anchor (spec 4.4 DIR5): the line of the target parent heading (P's match).
  check: (context): Diagnostic[] => {
    const targets = context.target.sections;
    const matches = matchHeadings(context.template, context.target);
    return matches.flatMap((parent) => {
      const { section, match } = parent;
      if (!parent.checked || match === null || headingPresence(section) === "template-only") {
        return [];
      }
      // A child with an invalid pattern (MTL014) is not checked and not listed (spec 2.6). The
      // children of THIS match or instance of P, each once: a repeat child by its first instance.
      const children = matches.filter(
        (item) =>
          item.scope === "section" &&
          item.checked &&
          item.section.parent === parent.index &&
          item.parentMatch === match &&
          item.instance === 0,
      );
      const indices = children.flatMap((item) =>
        item.match === null ? [] : [targets.indexOf(item.match)],
      );
      if (indices.slice(1).every((index, before) => (indices[before] ?? 0) <= index)) return [];
      const deepest = Math.max(...children.map((item) => item.section.level));
      const templateOrder = pyRepr(children.map((item) => item.section.text));
      const targetOrder = pyRepr(
        targets
          .filter(
            (heading) =>
              heading.line > match.line &&
              heading.line <= match.endLine &&
              heading.level <= deepest,
          )
          .map((heading) => heading.text),
      );
      const diagnostic = report(
        headingOrderInSection,
        `Heading: Section '${match.text}': heading order mismatch: ` +
          `template order ${templateOrder} vs target order ${targetOrder}`,
        anchor(section),
      );
      // Spec 8.1: `heading` is the target parent text (the pipeline keeps it).
      return [setAnchorLine({ ...diagnostic, heading: match.text }, match.line)];
    });
  },
});

/** True when the template heading carries `[content:subheadings:disallow]` (spec 2.6). */
const disallowsSubheadings = (section: Section): boolean =>
  section.tags.some((tag) => tag.kind === "content" && tag.check === "subheadings-disallow");

/** True when template heading `index` is a descendant of template heading `root`. */
function inSubtree(sections: readonly Section[], index: number, root: number): boolean {
  let parent = sections[index]?.parent ?? null;
  while (parent !== null) {
    if (parent === root) return true;
    parent = sections[parent]?.parent ?? null;
  }
  return false;
}

/** True when target heading `heading` lies inside the target section of `section` (spec 2.6). */
const inside = (heading: Section, section: Section): boolean =>
  heading.line > section.line && heading.line <= section.endLine;

/** A checked template heading that is not `[presence:template-only]` (spec 2.6 "Effective"). */
const usable = (item: HeadingMatch): boolean =>
  item.checked && headingPresence(item.section) !== "template-only";

/**
 * One MTL612 or MTL615 finding: the reported target heading, the tagged heading D and its
 * match M.
 */
interface Unlisted {
  readonly heading: Section;
  readonly tag: Section;
  readonly match: Section;
}

/**
 * The MTL612 findings of a target (spec 2.6), before suppression and sorting: shared with
 * MTL615, which never reports a heading MTL612 reports (one heading, one finding).
 */
function unlistedHeadings(template: DocumentModel, target: DocumentModel): Unlisted[] {
  const templates = template.sections;
  const targets = target.sections;
  const matches = matchHeadings(template, target);
  // A sibling taken as a mismatch (MTL606) is never listed and never MTL612 (spec 2.10
  // "Interplay"); it still counts as unlisted for the topmost rule.
  const mismatches = new Set(
    matches.flatMap((item) => (item.mismatch === null ? [] : [item.mismatch])),
  );
  /** Unlisted target heading -> innermost effective D (and its match M). */
  const unlisted = new Map<Section, { readonly tag: Section; readonly match: Section }>();
  for (const tagged of matches) {
    const match = tagged.match;
    if (!usable(tagged) || match === null || !disallowsSubheadings(tagged.section)) continue;
    const listing = matches.filter(
      (item) => usable(item) && inSubtree(templates, item.index, tagged.index),
    );
    for (const heading of targets) {
      if (!inside(heading, match)) continue;
      const listed =
        !mismatches.has(heading) &&
        listing.some(
          (item) =>
            item.section.level === heading.level &&
            headingMatches(item.section, heading.text) &&
            (item.scope === "file" ||
              (item.parentMatch !== null && inside(heading, item.parentMatch))),
        );
      const known = unlisted.get(heading);
      if (!listed && (known === undefined || known.match.line < match.line)) {
        unlisted.set(heading, { tag: tagged.section, match });
      }
    }
  }
  const templateOnly = new Set(
    matches.flatMap((item) => (item.checked && item.setAside !== null ? [item.setAside] : [])),
  );
  const hasUnlistedAncestor = (heading: Section): boolean => {
    let parent = heading.parent;
    while (parent !== null) {
      const ancestor = targets[parent];
      if (ancestor === undefined) return false;
      if (unlisted.has(ancestor)) return true;
      parent = ancestor.parent;
    }
    return false;
  };
  return targets.flatMap((heading) => {
    const owner = unlisted.get(heading);
    if (
      owner === undefined ||
      templateOnly.has(heading) ||
      mismatches.has(heading) ||
      hasUnlistedAncestor(heading)
    ) {
      return [];
    }
    return [{ heading, ...owner }];
  });
}

/**
 * `[content:subheadings:disallow]` on a checked, matched, not template-only
 * template heading D forbids, in the whole target section of D's match M,
 * every target heading the template does not list (spec 2.6). Listed: some
 * checked, not template-only template heading of D's subtree has its level,
 * its text (for a pattern heading, a text its pattern matches, spec 2.6
 * "Listed") and has it in scope; duplicates are listed.
 * Only the topmost unlisted heading of a subtree is reported, once, under the
 * innermost D for which it is unlisted. Listing reads levels and texts, not
 * positions. The first sibling a checked template-only heading sets aside is
 * MTL603's: never reported here, still unlisted for the topmost rule.
 */
const headingUnlisted = defineRule({
  code: "MTL612",
  name: "heading-unlisted",
  severity: "error",
  category: "heading",
  phase: "target",
  step: "headings",
  // Target anchor (spec 4.4 DIR5): the line of the unlisted target heading.
  check: (context): Diagnostic[] => {
    const found = unlistedHeadings(context.template, context.target);
    // Spec 4.3: sorted by the tagged template heading, then by target line (stable).
    found.sort((a, b) => a.tag.line - b.tag.line);
    return found.map(({ heading, tag, match }) => {
      const diagnostic = report(
        headingUnlisted,
        `Heading: Section '${match.text}': heading '${heading.text}' at level H${heading.level} ` +
          "is not in the template [content:subheadings:disallow]",
        anchor(tag),
      );
      // Spec 8.1: `heading` is the unlisted target heading text (the pipeline keeps it).
      return setAnchorLine({ ...diagnostic, heading: heading.text }, heading.line);
    });
  },
});

/** True when the template heading carries `[content:subheadings:no-extra]` (spec 2.6). */
const forbidsExtraSubheadings = (section: Section): boolean =>
  section.tags.some((tag) => tag.kind === "content" && tag.check === "subheadings-no-extra");

/** The distinct runs of a target (spec 2.10 "Positional match"), in first-seen order. */
const runsOf = (matches: readonly HeadingMatch[]): HeadingRun[] => [
  ...new Set(matches.flatMap((item) => (item.run === null ? [] : [item.run]))),
];

/**
 * The MTL615 findings of a target (spec 2.6 "Second sub-heading tag"), before suppression and
 * sorting: shared with MTL616, which never lists a heading MTL615 reports (one heading, one
 * finding).
 */
function undeclaredHeadings(template: DocumentModel, target: DocumentModel): Unlisted[] {
  const targets = target.sections;
  const matches = matchHeadings(template, target);
  const runs = runsOf(matches);
  const positions = runs.flatMap((run) => run.positions);
  // One heading, one finding: MTL603 (and every set-aside sibling), MTL612, MTL614.
  const named = new Set<Section>([
    ...runs.flatMap((run) => run.setAside),
    ...positions.flatMap((position) => position.repeatMisses),
    ...unlistedHeadings(template, target).map((item) => item.heading),
  ]);
  const reported = new Set<Section>();
  const found: Unlisted[] = [];
  for (const tagged of matches) {
    const match = tagged.match;
    if (!usable(tagged) || match === null || !forbidsExtraSubheadings(tagged.section)) continue;
    // Declared: taken by a position of D's template children, as a match or a mismatch.
    const declared = new Set(
      positions.flatMap((position) =>
        template.sections[position.index]?.parent === tagged.index
          ? [...position.instances, ...(position.mismatch === null ? [] : [position.mismatch])]
          : [],
      ),
    );
    for (const heading of targets) {
      const direct = heading.parent !== null && targets[heading.parent] === match;
      if (!direct || declared.has(heading) || named.has(heading) || reported.has(heading)) {
        continue;
      }
      reported.add(heading);
      found.push({ heading, tag: tagged.section, match });
    }
  }
  return found;
}

/**
 * `[content:subheadings:no-extra]` on a checked, matched, not template-only template heading D
 * (each instance of a repeat heading, spec 2.6 "Second sub-heading tag", A72k): every DIRECT
 * target child X of D's match M (target parent M, any level) must be DECLARED, taken by a
 * position of D's template children (template parent D), as a match or a mismatch (MTL606).
 * Each undeclared X is one finding, in file order, except a heading that gets MTL603, MTL612
 * or MTL614 (one heading, one finding). A set-aside sibling (2.10 step 1) is never reported
 * here: the first is MTL603's, a second is subject only to MTL612 (2.10 "Interplay"). A deeper
 * heading is never reported by D. Two tagged headings sharing one X: the first in template
 * order owns it.
 */
const headingSubheadingsOnlyDeclared = defineRule({
  code: "MTL615",
  name: "heading-subheadings-only-declared",
  severity: "error",
  category: "heading",
  phase: "target",
  step: "headings",
  // Target anchor (spec 4.4 DIR5): the line of the undeclared direct child.
  check: (context): Diagnostic[] => {
    const found = undeclaredHeadings(context.template, context.target);
    // Spec 4.3: sorted by the tagged template heading, then by target line (stable).
    found.sort((a, b) => a.tag.line - b.tag.line);
    return found.map(({ heading, tag, match }) => {
      const diagnostic = report(
        headingSubheadingsOnlyDeclared,
        `Heading: Section '${match.text}': heading '${heading.text}' at level H${heading.level} ` +
          "is not declared at this position [content:subheadings:no-extra]",
        anchor(tag),
      );
      // Spec 8.1: `heading` is the undeclared target heading text (the pipeline keeps it).
      return setAnchorLine({ ...diagnostic, heading: heading.text }, heading.line);
    });
  },
});

/**
 * True for a REQUIRED exact-text template heading with empty text: the one MTL601 or MTL610
 * already reports. An optional, conditional or pattern heading is never one.
 */
const isReportedEmpty = (section: Section | undefined): boolean =>
  section !== undefined &&
  headingPresence(section) === "required" &&
  headingPattern(section) === null &&
  section.text === "";

/**
 * The tail of each run (spec 2.6 "Extra", 2.10 step 4, owner decision 4 of A72l): the extra
 * headings that no error names are ONE warning per run (one sequence in one scope: once per
 * level in file scope, once per level and per parent match or instance in section scope), in
 * file order. Left out, decided before suppression (4.1 step 8): the tail siblings MTL614 lists
 * (`repeatMisses`), MTL615 reports or MTL612 reports, every heading inside a stray block whose
 * topmost unlisted heading gets MTL612, and a heading an overlapping run of the same level sets
 * aside (MTL603) or takes (a match or a mismatch). A level and scope without position has no
 * run and no tail: its headings are free detail. A run whose template headings are all
 * REQUIRED exact-text headings with empty text (the template-body `# [unique-headings-names]`
 * line, which MTL601 already reports) gives no MTL616; an optional, conditional or pattern
 * heading keeps its MTL616. Sorted by the
 * template line of the LAST position of the sequence (4.3), then by target line. Anchor (spec 4.4
 * DIR5): the first listed heading; `{in}` as MTL605, `{n}` the level of the run; the `heading`
 * member is the anchor's text (spec 8.1).
 */
const headingExtra = defineRule({
  code: "MTL616",
  name: "heading-extra",
  severity: "warning",
  category: "heading",
  phase: "target",
  step: "headings",
  check: (context): Diagnostic[] => {
    const runs = runsOf(matchHeadings(context.template, context.target));
    const targets = context.target.sections;
    const unlisted = new Set(
      unlistedHeadings(context.template, context.target).map((item) => item.heading),
    );
    const positions = runs.flatMap((run) => run.positions);
    // One heading, one finding: the errors MTL612, MTL614 and MTL615 replace the warning. Runs of
    // one level can overlap (a file-scope run and a section-scope run, or two section scopes):
    // a heading another run sets aside (MTL603) or takes (a match, or a mismatch, MTL606) is no
    // extra there either.
    const named = new Set<Section>([
      ...unlisted,
      ...positions.flatMap((position) => position.repeatMisses),
      ...undeclaredHeadings(context.template, context.target).map((item) => item.heading),
      ...runs.flatMap((run) => run.setAside),
      ...positions.flatMap((position) => [
        ...position.instances,
        ...(position.mismatch === null ? [] : [position.mismatch]),
      ]),
    ]);
    // Inside a stray block: some target ancestor of the heading gets MTL612.
    const inStrayBlock = (heading: Section): boolean => {
      let parent = heading.parent;
      while (parent !== null) {
        const ancestor = targets[parent];
        if (ancestor === undefined) return false;
        if (unlisted.has(ancestor)) return true;
        parent = ancestor.parent;
      }
      return false;
    };
    const found = runs.flatMap((run) => {
      const allEmpty = run.positions.every((position) =>
        isReportedEmpty(context.template.sections[position.index]),
      );
      if (allEmpty) return [];
      const lastIndex = run.positions.at(-1)?.index;
      const last = lastIndex === undefined ? undefined : context.template.sections[lastIndex];
      const extras = run.tail.filter((heading) => !named.has(heading) && !inStrayBlock(heading));
      const first = extras[0];
      return last === undefined || first === undefined ? [] : [{ run, last, extras, first }];
    });
    found.sort((a, b) => a.last.line - b.last.line || a.first.line - b.first.line);
    return found.map(({ run, last, extras, first }) => {
      const scope =
        run.scope === "section" && run.parentMatch !== null
          ? `Section '${run.parentMatch.text}': `
          : "";
      const diagnostic = report(
        headingExtra,
        `Heading: ${scope}${extras.length} extra heading(s) at level H${run.level} after the ` +
          `template headings: ${pyRepr(extras.map((heading) => heading.text))}`,
        anchor(last),
      );
      return setAnchorLine({ ...diagnostic, heading: first.text }, first.line);
    });
  },
});

/** True when the template heading carries `[unique-headings-names]` (spec 2.11). */
const wantsUniqueNames = (section: Section): boolean =>
  section.tags.some((tag) => tag.kind === "unique-names");

/** FOLDING of spec 2.11: `toLowerCase()` of the whole text, then code-unit equality. */
const fold = (text: string): string => text.toLowerCase();

/**
 * The scopes of spec 2.11, each its target headings in file order: the whole file under the
 * template-wide switch, and the REGION of each match or instance M of an effective tagged
 * heading (checked, matched, not template-only, as `[content:subheadings:disallow]`): M and
 * every target heading inside its target section.
 */
function uniqueNameScopes(template: DocumentModel, target: DocumentModel): Section[][] {
  const targets = target.sections;
  const regions = matchHeadings(template, target).flatMap((item) => {
    const match = item.match;
    if (!usable(item) || match === null || !wantsUniqueNames(item.section)) return [];
    return [targets.filter((heading) => heading === match || inside(heading, match))];
  });
  return template.uniqueHeadingNames ? [[...targets], ...regions] : regions;
}

/**
 * `[unique-headings-names]` (spec 2.11, ADR 0013): in each scope the first target heading of a
 * folded text passes and every later one is a duplicate. Scopes are nested or disjoint, so a
 * heading gets at most ONE finding; `{line}` is the earliest same-text heading over all the
 * scopes that contain it (the outermost decides). Additive: it reads only the target headings
 * and the regions, and no other rule reads it. No template anchor, so the pipeline emits it
 * after every other step 5 finding (registered after MTL604), in target line order. Anchor
 * (spec 4.4 DIR5): the later heading's line; the `heading` member is its text (spec 8.1).
 */
const headingUniqueNames = defineRule({
  code: "MTL613",
  name: "heading-unique-names",
  severity: "error",
  category: "heading",
  phase: "target",
  step: "headings",
  check: (context): Diagnostic[] => {
    /** Later duplicate -> line of the earliest same-text heading of its scopes. */
    const firstLine = new Map<Section, number>();
    for (const scope of uniqueNameScopes(context.template, context.target)) {
      const seen = new Map<string, Section>();
      for (const heading of scope) {
        const first = seen.get(fold(heading.text));
        if (first === undefined) {
          seen.set(fold(heading.text), heading);
          continue;
        }
        const known = firstLine.get(heading);
        if (known === undefined || first.line < known) firstLine.set(heading, first.line);
      }
    }
    return context.target.sections.flatMap((heading) => {
      const line = firstLine.get(heading);
      if (line === undefined) return [];
      const diagnostic = report(
        headingUniqueNames,
        `Heading: duplicate heading name '${heading.text}' (first at line ${line})`,
      );
      return [setAnchorLine({ ...diagnostic, heading: heading.text }, heading.line)];
    });
  },
});

// Registry order is code order: findings on one template line keep it (spec 4.3, stable sort).
// MTL613 has no template anchor and comes after MTL604, so it is emitted last in step 5 (2.11).
export const rules: readonly AnyRule[] = [
  headingMissing,
  headingTemplateOnly,
  headingOrder,
  headingPatternMissing,
  headingPatternMismatch,
  headingRepeatMin,
  headingRepeatMax,
  headingPatternOrder,
  headingMissingInSection,
  headingOrderInSection,
  headingUnlisted,
  headingRepeatMiss,
  headingSubheadingsOnlyDeclared,
  headingExtra,
  headingOrderKeyMissing,
  headingUniqueNames,
  // new:rule inserts above this line
];
