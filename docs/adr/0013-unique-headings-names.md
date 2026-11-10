---
id: 0013-unique-headings-names
title: Opt-in unique heading names, template-wide or per heading, as the rule MTL613
status: accepted
date: 2026-11-04
deciders: [owner]
---

# ADR 0013: Unique heading names

One opt-in tag, `[unique-headings-names]`, asks that no two target headings of one scope
share a name (same text, any level, case-insensitive). It is written either once in the
template frontmatter (the whole document) or on a template heading (that heading's subtree,
per match or instance). Each later duplicate gets the error `MTL613` heading-unique-names,
which names the line of the first one. Specified by phase A80a; implemented by A80b (grammar
and tags) and A80c (rule); A80d adds the full fixture list (spec section 9).

## Context

- Since phase A72k (ADR 0012) a template states the outline of a document by position, and a
  duplicate heading is just an extra (`MTL616`) or, under `[content:subheadings:disallow]`,
  a listed heading (spec 2.6 "Listed": "duplicates are not this tag's concern"). Nothing
  says "this document must not repeat a heading name".
- Duplicate names break Markdown anchors (two `#notes`), tables of contents and links.
- `MTL613` has been reserved for "unique heading names" since A72j (ADR 0011, spec 4.2), so
  the rule gets a stable code next to the other heading codes.
- Owner decisions of phase A80a (2026-11-04), numbered as in spec 2.11:
  1. both switches: a template-wide tag written as a frontmatter comment
     `# [unique-headings-names]` (the placement of the filename comment, spec 2.5) and a
     per-heading tag `## Section [unique-headings-names]` for that heading's subtree;
  2. a duplicate is the same heading text, any level, case-insensitive, within the scope;
  3. code `MTL613`, severity error, phase `target`, step `headings`, one finding on each
     later duplicate anchored on its own line, naming the line of the first one,
     suppressible;
  4. the interplay with repeats, the sub-heading tags, H1 titles, patterns, template-only
     headings, `MTL616` and disable directives is decided and written down (spec 2.11).

## Decision

- **Tag and placements (spec 2.11).** One tag without colon or argument (a third exception
  to the `[family:argument]` shape, after the quoted pattern and the dashed family). In the
  template frontmatter, a comment line holding only the tag is the template-wide switch; on a
  template heading it is the per-heading switch. On a key line or a mixed comment line it is
  inert; with an argument it is malformed (`MTL012`); in the body, `# [unique-headings-names]`
  is an H1 with empty text (reported missing on every target, so the mistake shows). Lexer
  keyword `UNIQUE_HEADINGS_NAMES` in mode `TAG_STRICT`.
- **Scopes.** Template-wide: every target heading of the file. Per heading: the region of
  each match or instance M of the tagged heading (M and every target heading in its target
  section), effective under the conditions of `[content:subheadings:disallow]` (checked,
  matched, not template-only; template-only gives `MTL015`).
- **Duplicate.** Equal stored target texts after `toLowerCase()`, nothing else normalized.
- **Finding.** The first heading of each folded text in a scope passes; every later one gets
  `Heading: duplicate heading name '{text}' (first at line {line})`. Regions are nested or
  disjoint, so a heading gets at most one finding; the earliest same-text heading of the
  scopes that contain it is named. Emitted after every other heading finding.
- **Additive.** The tag adds `MTL613` findings only. Matches, runs, tails, the `MTL616`
  list, order lists and every other code are unchanged: a duplicate extra keeps its
  `MTL616` warning and also gets `MTL613`; `MTL612` and `MTL615` are independent of it.
- **Repeats.** The template-wide switch reports repeated groups (`### Added` under every
  release). The per-heading switch on the repeat heading is the scope without false
  positives: each instance is its own region. Accepted limit: two instances with the same
  text are then not reported (a tag on the parent or the template-wide switch reports them).
- **`--verify`.** Heading token `unique-headings-names` (the tag body, as every 8.3 token);
  template-wide line `Unique heading names: [unique-headings-names]`; JSON verify key
  `uniqueHeadingNames`.
- **Bookkeeping.** A80a is docs only: the 4.3 row sits under "Specified rules not yet
  registered" so `check:rules` stays green with the pin at 83 and `pending-rules.json` empty;
  A80b moves the row into the `heading` table, adds `MTL613` to `pending-rules.json` and
  raises the pin to 84 (done in A80b); A80c removed it from the pending list (done).

## Consequences

- Positive: a template can forbid duplicate names for a whole document in one line, or for
  one subtree while the outline repeats groups by design.
- Positive: additive and opt-in; a template without the tag gives the same findings on every
  target (minor release).
- Negative: under the template-wide switch a template whose own outline repeats a text
  (groups under each release) makes every complete target fail; the author must use the
  per-heading switch. No template-side warning is given (kept simple; can be added later).
- Negative: a duplicate under a no-extra tag gets two errors (`MTL615` and `MTL613`), and a
  duplicate extra one error and one warning; one fix clears both.
- Negative: case-insensitive by `toLowerCase()` only: `Straße` and `STRASSE`, or NFC and NFD
  spellings, are different names.
- Follow-up: phases A80b, A80c and A80d (spec section 9); the spec sections that gained
  `MTL613` with the rule are listed in the A80c handoff.

## Alternatives considered

| Option                                                       | Pros                                       | Cons                                                         | Verdict    |
| ------------------------------------------------------------ | ------------------------------------------ | ------------------------------------------------------------ | ---------- |
| One tag, template-wide frontmatter line and per heading      | Both needs, one name to learn              | A colon-less tag shape in the grammar                        | **Chosen** (decision 1) |
| Template-wide switch only                                    | Smallest grammar change                    | Every changelog with groups per release fails                | Rejected (decision 1) |
| Per-heading tag only (tag the H1 for the whole file)         | One placement                              | Headings before or outside the H1 section are not covered    | Rejected (decision 1) |
| Case-sensitive comparison                                    | Matches the exact-text matching of 2.6     | `Notes` and `NOTES` read as one name and give one anchor     | Rejected (decision 2) |
| Same level only                                              | Fewer findings                             | `## Notes` and `### Notes` still clash as names and anchors  | Rejected (decision 2) |
| Full Unicode case folding and NFC normalization              | `Straße` equals `STRASSE`                  | More rules to explain; JavaScript has no built-in full fold  | Rejected   |
| One finding per duplicate set, listing the lines             | Short output                               | One suppression for several fixes; no anchor per heading     | Rejected (decision 3) |
| Exempt repeat headings from the template-wide switch          | No false positives on changelogs           | A second definition of duplicate; hides real repeats         | Rejected (decision 4) |
| `MTL613` takes a heading out of the `MTL616` list            | One heading, one finding                   | The tag would change another code's output; not additive     | Rejected (decision 4) |
| Rule token `heading:unique-names`                            | Names the category                         | No 8.3 token differs from its tag body                       | Rejected   |
| Write the 4.3 row in the `heading` table in A80a             | Final place at once                        | `check:rules` fails until `pending-rules.json` changes (tests owned elsewhere) | Rejected (bookkeeping) |
| A new code instead of `MTL613`                               | None                                       | `MTL613` was reserved for exactly this rule                  | Rejected   |

## Research

- Owner decisions of phase A80a (2026-11-04), recorded in spec 2.11.
- Contract: `docs/spec.md` 2.5, 2.6, 2.7, 2.10, 2.11, 4.2, 4.3, 4.4 (DIR5, DIR6), 8.3, 8.5,
  9 and C13; ADR 0011 (the reservation of `MTL613`), ADR 0012 (positional matching).
- Code collision check (at A80a time): `MTL613` appeared only as a reservation in `docs/` (spec
  4.2, ADR 0010 to 0012, `docs/architecture.md`); no rule, test or fixture used it.

## Notes

- Since phase A80b the bracket is a known tag (grammar and tag parsing); since phase A80c the
  rule MTL613 is implemented.
