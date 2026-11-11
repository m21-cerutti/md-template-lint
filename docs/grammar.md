---
title: Heading grammar
last_updated: 2026-11-11
---

# Heading grammar

How the linter reads the headings of a Markdown file and how a template heading finds the
target headings it checks. This page explains the words the heading rules use (parent, scope,
sequence, match, extra, checked). The tags themselves, the rule codes and their messages are in
the [spec](spec.md), section [2.6](spec.md#26-heading-suffix-tags-body-sections) and section
[2.10](spec.md#210-heading-patterns-repeat-rules-and-order). Back to the [docs index](README.md).

## Heading extraction rules

The linter reads every heading level, H1 to H6, in templates and in target files alike (change
C10, [ADR 0009](adr/0009-all-heading-levels.md)).

- **What a heading line is.** One to six `#`, then whitespace, then the text. A trailing HTML
  comment on the line is dropped. The number of `#` is the level.
- **Fenced code.** A line of three or more backticks or tildes, with at most three leading
  spaces, opens a fence. The fence closes on a line that holds only the same character, repeated
  at least as many times. Headings inside a fence are ignored.
- **Known limitation, kept on purpose.** A `#` line inside a multi-line HTML comment still counts
  as a heading.
- **Tag peeling.** Tags are removed from the right end of the text, one at a time, as long as the
  text still ends in a recognized heading tag. Peeling stops at the first bracket that is not a
  recognized heading tag, and that bracket stays in the heading text. So a typo in a tag does not
  turn into a missing-heading error. Peeling, and the tag warnings `MTL011` to `MTL015` (spec
  [2.7](spec.md#27-inert-unknown-and-malformed-tags) and
  [2.10](spec.md#210-heading-patterns-repeat-rules-and-order)), apply at every level.
- **Stored text.** The stored heading text has every recognized tag removed, so the template
  heading `## Notes [presence:optional]` matches a plain `## Notes` in the target. Text
  comparison is exact and case-sensitive: `decision` is not `Decision`.
- **Exact levels.** A template heading matches only a target heading of the same level. This
  holds at every level and for every rule: presence, order, content and sub-headings. Before
  change C10, levels were compared only by the former level-only `exist` presence mode (since
  removed, see spec [2.6](spec.md#26-heading-suffix-tags-body-sections) "Dropped tag"), so a
  target `# Context` satisfied a template `## Context`. It no longer does.
- **Section body.** The body of a section is the raw text between its heading and the next
  extracted heading of the same or a higher level, or the end of the file. Deeper headings and
  their text stay in the body, so the line counts of `MTL701` to `MTL705` are the same as before
  change C10. Fenced code is part of the body.

## Levels, parents and scope

These rules come with change C10. They decide which target headings a template heading may
match, and when a template heading is checked at all.

### Terms used by the rules

**Parent.** The template parent of a template heading is the nearest template heading before it
with a lower level. A heading with no such heading before it has no template parent. The target
parent of a target heading is defined the same way, in the target. The subtree of a template
heading is every template heading after it up to the next template heading of the same or a
lower level: its children, their children, and so on.

**Target section.** The target section of a target heading at level n is its own line and every
following line up to the next target heading of level n or lower, or the end of the file. A
target heading lies "inside" that section when its line is in this range and it is not the
heading itself.

**Scope.** The scope of a template heading T is the set of target headings T may match:

- **File scope** when T is level 1 or 2, or when T has no template parent: every target heading
  of the file. H1 and H2 keep the file-wide matching they always had.
- **Section scope** otherwise, that is an H3 to H6 heading with a template parent P: the target
  headings inside the target section of the match of P.

**Siblings.** The siblings of one scope and level are the target headings of that level in that
scope, in file order. In section scope there is one set of siblings per match, or per instance,
of the template parent.

**Sequence.** The sequence of a template heading T is the list, in template order, of the
template headings of T's level that share T's scope:

- when T has file scope: every file-scope template heading of that level;
- otherwise: every template heading of that level whose template parent is T's template parent.

`[presence:template-only]` headings and headings that are not checked (see "Checked" below,
including a heading with an invalid pattern, `MTL014`) are left out of the sequence. Each member
of a sequence is a **position**.

**Match of T.** Matching is positional ([ADR 0012](adr/0012-positional-heading-matching.md)); it
replaced an earlier rule where a template heading took the first target heading with its text.

- The positions of one sequence take the siblings of one scope in order, as one adjacent run.
- Each position takes zero or more siblings from the current point onward. It never skips a
  sibling and never goes back: greedy first-fit, with no backtracking.
- An exact-text heading is the literal pattern of its text: `## TOTO` takes exactly what
  `## [pattern:"TOTO"]` takes.
- A pattern heading (spec [2.10](spec.md#210-heading-patterns-repeat-rules-and-order)) takes the
  next sibling when that sibling matches. `[pattern:"{text}"]` is the "any heading here" form.
- A repeat heading (spec 2.10) takes the following siblings for as long as they match.
- A sibling that matches the current position is always taken by it. An exact-text heading
  further down the template never takes it away.

The steps, with every case and code, are in spec 2.10 "Positional match". The match of T is the
sibling its position took. For a repeat heading each instance is a match, and the first instance
is "the match" where a rule needs only one. A sibling taken as a mismatch (`MTL606`, spec 2.10)
is not a match. A template heading without a match is "missing"; its presence tag decides whether
that is an error. Every rule that reads "the match" reads each instance.

**Extra.** The siblings left after the last position of a sequence (the tail, spec 2.10 step 4)
are extra headings.

- An extra never fails the target by itself, but it is always reported: every run with extras
  gives one warning `MTL616` (heading-extra) that lists them, anchored on the first one listed.
- A tail sibling that an error already names is left out of that list, because the error
  replaces the warning for that heading. These errors are:
  - `MTL614`: the sibling matches a repeat pattern (spec 2.10 step 4);
  - `MTL612`: `[content:subheadings:disallow]` (spec
    [2.6](spec.md#26-heading-suffix-tags-body-sections)), including a heading inside a stray
    block whose topmost unlisted heading gets `MTL612`;
  - `MTL615`: `[content:subheadings:no-extra]` (spec 2.6).
- The error `MTL613` (`[unique-headings-names]`, spec
  [2.11](spec.md#211-unique-heading-names-unique-headings-names)) is not one of them. A duplicate
  extra stays in the list and also gets `MTL613` (spec 2.11 "Interplay", `MTL616` overlap).
- A sibling before the last taken one is never extra: the run has no gaps. The only siblings
  outside the run are the ones a `[presence:template-only]` heading sets aside (`MTL603`, spec
  2.10 step 1).
- A level and scope with no position has no run, so it has no tail. This happens when there is no
  template heading of that level there, or only template-only or unchecked ones. Its target
  headings are free detail, not extras, and give no `MTL616`. Example: the H3 headings of a
  document whose template has only H1 and H2 headings.

**Checked.** Every file-scope template heading is checked. A section-scope template heading is
checked only when its template parent is checked, is not `[presence:template-only]` and has a
match. A heading that is not checked gives no finding of any code (presence, order, content,
sub-headings), and neither do its section-scope descendants. For section-scope headings this
means (H1 and H2 stay checked whatever their parent):

- The children of a missing required parent are not reported again. The parent's `MTL601`,
  `MTL605`, `MTL606`, `MTL607` or `MTL610` covers them.
- The children of an absent `[presence:optional]` or `[presence:conditional:...]` parent are not
  required.
- The section-scope descendants of a `[presence:template-only]` heading are template guidance and
  are never checked.

A heading whose pattern is invalid (`MTL014`, spec 2.10) is not checked, at any level, and
neither are its section-scope descendants. It is not a position, so the siblings it would have
taken go to the next position.

### Why the rules are shaped this way

- **File scope for H1 and H2.** A template with no H3 to H6 headings and without the new tag
  gives the same errors as before, except where exact-level and positional matching change them
  (spec 2.6 and change C10). Extras now add `MTL616` warnings, which never change the exit code.
- **Section scope for deeper headings.** A deeper heading only makes sense inside its parent: a
  changelog has an `Added` group under every release, so it matches inside the parent's section.
- **Children of a missing or optional parent are not checked.** One cause is reported once.
- **The positional run** ([ADR 0012](adr/0012-positional-heading-matching.md)). Exact-text and
  pattern headings share one matching rule, so a template reads as the outline it describes. The
  template order is the document order by construction. Greedy first-fit keeps every result
  explainable heading by heading, with no search.
- **The extra warning.** A silent extra hid real mistakes, such as a typo in the last release
  heading of a changelog, or an outline heading out of its place. A warning makes every extra
  visible while extras stay allowed: the exit code is unchanged, every existing template stays
  valid, and `--quiet` and lint-staged see no change. One warning per run keeps a long tail to one
  line. A heading that an error already names gets only that error: one heading, one finding, and
  the error says more.
