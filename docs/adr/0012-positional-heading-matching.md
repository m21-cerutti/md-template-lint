---
id: 0012-positional-heading-matching
title: Match template headings to target headings by position, as one adjacent run
status: accepted
date: 2026-11-03
deciders: [owner]
---

# ADR 0012: Positional heading matching

Every template heading, exact text or pattern, is matched in template order against the
target headings of its level and scope as one adjacent run: greedy first-fit, no gaps, no
backtracking, extra headings only after the last match. Revised by phase A72m (section
"Revision 2026-11-03" under "Notes"): the `exist` position is dropped, `MTL602` retired, and
the new template error `MTL019` reports the child order that `MTL611` would otherwise find
on every target. Revised by phase A72n (same section): `MTL019` also for a parent whose
pattern is invalid.

## Context

- Since phase A72e0 (spec 2.6, change C10, which ADR 0009 introduced for every heading
  level) a template heading matches "the first target heading in its scope with the
  same level and text" (`docs/spec.md` 2.6 before phase A72k). The match ignores position:
  an extra heading anywhere is skipped, a swapped pair is an order finding (`MTL604`,
  `MTL611`), and the first duplicate wins wherever it is.
- ADR 0011 (phase A72j) added pattern headings on top of that rule, which needed a CLAIM
  rule: a heading named by text never matched a pattern, and the first pattern heading in
  template order owned a heading several patterns accept. The rules depended on each other
  across the whole sequence and were hard to explain heading by heading.
- Owner decisions of phase A72k (2026-11-03, recorded in spec AS17):
  1. positional matching everywhere, breaking: all template headings of one level and scope
     are matched in template order against the ordered target headings of that level and
     scope; `# TOTO` matches what `# [pattern:"TOTO"]` matches;
  2. strict adjacency: template headings take consecutive target headings, no gaps; extra
     headings only after the last match; greedy first-fit, no backtracking; an optional
     heading that does not match takes nothing; a repeat heading takes every consecutive
     match;
  3. a target heading in a required position that fails the pattern is `MTL606`; no target
     heading left is `MTL605`; `MTL607` with an explicit `min` also at zero (replacing
     `MTL605`); one `MTL609` per repeat set; a new code for repeats outside their run;
  4. owner examples A to H (spec 2.10 worked example 4); a heading that matches the current
     position is always taken by it;
  5. to 9. placeholders and formats, the escape `\"`, `[content:subheadings:no-extra]`, the
     template error `MTL017`, `MTL606` only with a target heading at the position, `MTL613`
     reserved (spec 2.6, 2.7, 2.10; ADR 0011).
- Owner decisions of phase A72l (2026-11-03, spec AS17, numbered as there; ADR 0011 holds
  decisions 2, 3 and 5): (1) keep both `[content:subheadings:disallow]` (`MTL612`) and
  `[content:subheadings:no-extra]` (`MTL615`); (4) every extra heading is reported: one
  suppressible warning per run listing the tail headings, anchored on the first, replaced
  for a heading by the error `MTL612` or `MTL615` raises for it, `MTL614` staying an error
  for the tail headings that match a repeat pattern; (6) the `MTL601` message hints when
  the missing heading comes later in the run.
- Two owner examples fix the edge case: `## [pattern:"{text}"]`, `## [pattern:"{number}"]`
  against `## 1`, `## tata` must report BOTH headings (example A), while
  `## Unreleased [presence:required]`, `## Release [pattern:"{semver} - {date}"]
[repeat-rules:same-level]` against `## 1.2 - 2026-10-01`, `## 1.1.0 - 2026-09-01` must
  report the missing `Unreleased` AND the bad `1.2` (example E).

## Decision

- **Sequences and runs (spec 2.6, 2.10).** The positions of one level and scope (file scope,
  or one template parent) are the template headings in template order, without
  `[presence:template-only]` headings and headings that are not checked. Per scope (the
  whole file, or each match of the template parent) a cursor walks the target headings of
  that level in file order; each position takes target headings only at the cursor.
- **What a position takes.** (The `exist` sentence is superseded: see "Revision 2026-11-03".)
  An `exist` heading takes the next target heading. A literal
  position (exact text, or a pattern without placeholder) takes the next target heading only
  when it matches, else it is missing (`MTL601`, `MTL610`, `MTL605`). A placeholder position
  takes the next target heading when it matches; when it does not match and the position is
  required, it takes it as a mismatch (`MTL606`, naming the failing piece). A repeat position
  takes every consecutive match. Optional positions take only a match. This split makes
  examples A (both mismatches reported) and E (the literal `Unreleased` missing, then `1.2`
  reported by the release pattern) hold together.
- **Template-only headings.** Not positions: their target headings are set aside before the
  run (`MTL603` on the first), so they do not shift it.
- **Tail.** Target headings after the cursor are extras: allowed, except under
  `[content:subheadings:disallow]` (`MTL612`, unchanged, listing by level and text) and the
  new `[content:subheadings:no-extra]` (`MTL615`, every direct child not taken by a position);
  a tail heading that matches a repeat pattern is `MTL614` heading-repeat-miss. Every other
  tail heading of a run is listed by ONE warning `MTL616` heading-extra per run (A72l
  decision 4), anchored on the first listed heading, suppressible, exit code unchanged; a
  heading an error names (`MTL612`, including the block under a reported topmost heading,
  `MTL614`, `MTL615`) is left out of the list. Both sub-heading tags are kept (A72l
  decision 1).
- **Missing heading hint (A72l decision 6).** When a required exact-text position takes
  nothing and a sibling with its text comes later in the run, `MTL601` reads
  `Missing required heading: '{text}' (found later at line {line}, out of order)`; the
  match, tail and anchor (none) do not change.
- **Other rules on top.** Content rules (`MTL701` to `MTL705`) read the target heading the
  position took (`exist` included: superseded, see "Revision 2026-11-03"); `MTL604` and `MTL611` keep their cross-level order check
  (within one level the run is ordered by construction); the scope, "checked" and section
  rules of ADR 0009 are unchanged.
- **Release.** Breaking: the breaking release (0.2.0) with a migration note (`docs/migration.md`,
  "Headings are matched by position"); codes and messages of `MTL601` to `MTL612` are
  unchanged, except the `MTL601` hint (A72l), and extras gain the `MTL616` warning.

## Consequences

- Positive: one matching rule for every heading kind; a template reads as the outline it
  describes, and every finding can be explained by walking the run once.
- Positive: the CLAIM and ownership rules of ADR 0011 disappear; patterns and exact text
  compose by position only.
- Negative (breaking): a target that passed may now fail: an extra heading before or between
  template headings of one level shifts the run (`MTL601` / `MTL610`); a swapped same-level
  pair gives `MTL601` instead of `MTL604` / `MTL611`; a duplicate is an extra; an `exist`
  heading's content is read at its position (superseded: `exist` is dropped, see "Revision
  2026-11-03").
- Negative: greedy first-fit can report a cascade: one stray heading early in a level can
  make several later required headings missing. Accepted for explainability (no search).
- Positive (A72l): no extra is silent any more; a typo in the last heading of a repeat run
  is listed by `MTL616`, and a swapped pair's `MTL601` says where the heading is.
- Negative (A72l): documents with extras after the last template heading gain warnings
  (never a failure); a project that does not want them uses `disable-file MTL616`.
- Follow-up: phase Pm (spec section 9) refactors `matchHeadings` in `src/engine/model.ts`
  alone, with the fixtures and tests listed there rewritten by another agent; P8 writes the
  migration note.

## Alternatives considered

| Option                                                                                   | Pros                                                 | Cons                                                                            | Verdict                    |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------------- |
| Positional adjacent run, greedy first-fit, extras only at the end                        | One rule for every heading; explainable step by step | Breaking; cascades after a stray heading                                        | **Chosen**                 |
| Keep the non-positional first match (spec 2.6 / C10) plus CLAIM (ADR 0011)               | Not breaking; extras allowed anywhere                | Ownership rules across the sequence; exact text and patterns behave differently | Rejected (decision 1)      |
| Positional with backtracking (search the split that minimises findings)                  | Fewer cascades                                       | Results depend on a search; costly and hard to explain; owner asked for none    | Rejected (decision 2)      |
| Positional that skips extras (a position takes the next matching heading anywhere ahead) | Extras allowed between headings                      | A pattern like `{text}` swallows everything ahead; order findings come back     | Rejected (decision 2)      |
| A literal position takes a non-matching heading as a mismatch too                        | Same rule for every position                         | Example E would lose the `1.2` finding: `Unreleased` would eat it               | Rejected                   |
| A placeholder position never takes a non-matching heading                                | Same rule as literal positions                       | Example A would report only one finding                                         | Rejected                   |
| Template-only headings as positions that take nothing                                    | No set-aside step                                    | A stray guidance heading shifts the run and gives two findings                  | Rejected                   |
| Extras silent unless a sub-heading tag (A72k)                                            | No new output                                        | A typo in the last heading of a run goes unseen                                 | Rejected (A72l decision 4) |
| One warning per extra heading                                                            | One line directive per heading                       | A long tail floods the output                                                   | Rejected (A72l decision 4) |
| Merge disallow and no-extra into one tag with an option                                  | One tag                                              | Two readings of one tag; existing disallow templates change                     | Rejected (A72l decision 1) |
| Keep `[presence:exist]` next to `[pattern:"{text}"]`                                     | No migration                                         | Two mechanisms for "any heading here"; its own code and content rules           | Rejected (A72m decision 1) |
| Ignore the dropped tag silently (peel it, heading still matches any text)                | Old templates keep passing                           | The removed behaviour survives unseen; nothing prompts the migration            | Rejected (A72m)            |
| Report the child order only on targets (`MTL611` alone)                                  | No new code                                          | The same template mistake shows once per target, never in `--verify`            | Rejected (A72m decision 2) |
| No `MTL019` for a parent with an invalid pattern (A72m)                                  | One finding per broken heading                       | The outline mistake surfaces only after the pattern is fixed, one run later     | Rejected (A72n decision 1) |

## Research

- Owner decisions and examples of phases A72k and A72l (2026-11-03): spec AS17 and 2.10
  worked examples 4 (owner examples A to I), 5 and 6.
- Background, out of date since A72k: the untracked working proposal "heading patterns".
- Contract: `docs/spec.md` 2.6, 2.7, 2.10, 4.1, 4.3, 4.4 (DIR5, DIR6, DIR7), 7.3, 8.1, 8.3, 9,
  AS15, AS17, C10 and C12.

## Notes

### Revision 2026-11-03 (A72m, A72n)

Owner decisions of phase A72m (recorded in spec AS17, numbered 1 to 8 there). The ADR stays
accepted; where this section and the text above differ, this section wins.

- **`exist` dropped (decision 1, breaking, pre-release).** `[presence:exist]` and its
  EXIST position are removed. The tag is now a malformed tag (`MTL012`, `--verify`); as for
  any malformed heading tag the bracket stays in the heading text, so the heading is an
  ordinary required heading that no target matches (`MTL601` / `MTL610`), which shows every
  template still using it. `MTL602` heading-level-missing is RETIRED: reserved like
  `MTL613`, never reused; the `exist` form of `MTL610` is gone. Replacement: the pattern
  `[pattern:"{text}"]` ("any heading at this level"), or a tighter one
  (`# ADR - Title [pattern:"ADR - {text}"]`, `### 0.0.0 [pattern:"{semver}"]`), or a plain
  heading when the text is fixed (`## Changes [content:table]`); the text before the tag is
  an author hint only. So every position is now a literal or a pattern position; the
  statements above that name `exist` positions (the "What a position takes" bullet, the
  `exist` content reading in "Other rules on top", the "Consequences" bullet on `exist`
  content) no longer apply.
- **Template error `MTL019` (decision 2).** heading-child-order-conflict: under one parent,
  a deeper direct child declared before a shallower one (the only shape in which `MTL611`
  can occur, since a run is ordered within one level). Syntax category, template ERROR,
  not suppressible; printed on the template file in a normal lint run (exit 1, targets
  still linted, `Failed templates:`) and a `--verify` FAIL (section `Child headings out of
level order:`). One finding per parent. `MTL611` stays a target finding.
- **Content label (decision 3).** A pattern heading's content messages print the target
  text of the checked instance plus the pattern; an exact-text heading keeps its text.
- **Phases (decision 7).** The cleanup that removes the `exist` handling, the `MTL602` rule
  and the dead `HeadingMatch.textMatch` field (phase Pc of spec section 9) runs LAST, after
  P8 migrates the ten shipped templates and the fixtures to patterns, so the tree never
  holds a template without a working replacement.
- **Status note (2026-11-04).** Superseded in part: exist removed in Pc.
  The cleanup ran last, as decided; `[presence:exist]` is `MTL012`, the `MTL602` rule and
  `HeadingMatch.textMatch` are gone, and the positional model above is unchanged.
- The other A72m decisions (placeholder formats, `{char}`, the order tags and `MTL617`, the
  regexp idea) are in ADR 0011's revision.

Owner decisions of phase A72n (2026-11-03, spec AS17, numbered 1 to 5 there). Same rule:
where they differ from the text above, they win.

- **`MTL019` for an invalid parent (decision 1).** A parent whose own pattern is invalid
  (`MTL014`) still gets `MTL019` when its child list climbs back up a level, so such a
  template reports both codes. Its children are not checked in a lint run (the parent is
  not a position), but the child order is a property of the template outline, which the
  template phase reads without the pattern. A child with an invalid pattern stays out of
  the child list (it is not a position).
- The other A72n decisions (the first-semver order, the template error `MTL030` for an
  order tag without repeat tag, `{digits}` and the placeholder formats, the later
  table-of-contents and heading-numbering epic) are in ADR 0011's revision.
