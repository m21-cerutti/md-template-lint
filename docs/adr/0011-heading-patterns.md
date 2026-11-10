---
id: 0011-heading-patterns
title: Match varying headings with a pattern tag, repeat its rules and order the repeats
status: accepted
date: 2026-11-03
deciders: [owner]
---

# ADR 0011: Heading patterns, repeat rules and order

A template heading can match target headings by a quoted pattern
(`[pattern:"[{semver}] - {date}"]`), apply its rules to a consecutive run of same-level
headings with `[repeat-rules:same-level]`, and require an order with `[order:ascending]` or
`[order:descending]`. Revised by phase A72k: matching is positional (ADR 0012). Revised
by phase A72l: template errors act in lint runs, a new template error for an optional
repeat heading with a minimum, and `MTL017` also compares exact-text headings. Revised by
phase A72m (section "Revision 2026-11-03" under "Notes"): placeholder formats and `{char}`,
text and first-number or first-date order (`MTL617`), the pattern in content labels,
`MTL019`. Revised by phase A72n (same section): `{digits}` replaces `{int}`, format
arguments, Unicode case formats, the first-semver order, and the template error `MTL030`
for an order tag without repeat tag.

## Context

- A template heading matched a target heading by its exact text (`docs/spec.md` 2.6). A
  changelog release heading (`## [1.2.0] - 2026-03-01`) changes with every release, so
  `templates/CHANGELOG.template.md` can only mark one placeholder release optional and states
  a "known engine gap". Plan row A72 (changelog template) needs the shape of the release
  heading, one rule set for every release, and newest first.
- The field formats of ADR 0010 already define a SEMVER and an ISO DATE (spec 2.9). Every
  heading level is read and checked (ADR 0009), extra headings are allowed unless a
  sub-heading tag forbids them, and untagged H3 to H6 headings are required.
- A tag body never contained `]` and a family name never contained a dash (spec 2); a
  pattern with literal brackets and the `repeat-rules` family need both.
- Owner decisions of plan phase A72j (working proposal "heading patterns", kept outside
  version control; recorded in spec AS17):
  1. the pattern lives in a tag with a quoted argument, not in the heading text;
     placeholders `{semver}`, `{date}`, `{int}`, `{text}`; `{{` and `}}` are literal braces;
     other text is literal; no `v` prefix is implied;
  2. a pattern heading requires a target heading at its level, else `MTL605`;
  3. separate repeat tags `[repeat-rules:same-level]`, `[repeat-rules:same-level:min:N]`,
     `[repeat-rules:same-level:max:N]`, scope the same section parent;
  4. order is opt-in, `[order:ascending]` / `[order:descending]`, by placeholder values;
     `{text}` is not orderable (template warning);
  5. every level checked, extra headings allowed unless disallow, untagged H3 required;
  6. no trimming in format checks; first tag of a kind wins;
  7. codes `MTL014` (template warning, not suppressible) and `MTL605` to `MTL609`
     (suppressible); `MTL613` stays reserved for unique heading names.
- Owner decisions of plan phase A72k (2026-11-03, ADR 0012 holds the matching part): every
  heading, exact text or pattern, is matched by position; the placeholder `{number}` and a
  fixed format table are added; `{text}` refuses purely numeric values; `\"` escapes a quote;
  one `MTL609` per repeat set; a new code for repeats outside their run; the template error
  `MTL017` for two adjacent identical patterns; `[content:subheadings:no-extra]`.
- Owner decisions of plan phase A72l (2026-11-03, spec AS17, numbered as there; ADR 0012
  holds decisions 1, 4 and 6): (2) `MTL017` also acts in a normal lint run, printed as an
  error on the template file, exit 1, targets still linted; (3) `[presence:optional]` with
  an explicit `[repeat-rules:same-level:min:N]` is a contradictory combination, a new
  template error with the same behaviour; (5) `MTL017` also compares exact-text headings and
  literal patterns.
- Codes checked against spec 4.2, 4.3 and DIR6: `MTL014`, `MTL605` to `MTL609`, for A72k
  `MTL017`, `MTL614`, `MTL615`, and for A72l `MTL018` and `MTL616` were free; `MTL015`,
  `MTL016`, `MTL306` to `MTL309`, `MTL610` to `MTL612` and the reserved `MTL613` are
  untouched.

## Decision

- **Tags (spec 2.10).** `[pattern:"..."]` (the argument may contain `]` and the escapes `\"`
  and `\\`), `[repeat-rules:same-level]` with optional `:min:N` or `:max:N` (`N` 1 or more),
  and `[order:ascending]` / `[order:descending]` on a heading. `[order:ascending]` keeps its
  frontmatter meaning (`MTL407`). Bad shapes are `MTL012`; heading-only forms in frontmatter
  are `MTL013`. The first tag of each kind wins.
- **Placeholders.** `{semver}` (formats `full`, `core`, `major-minor`), `{date}` (formats
  `full`, `year-month`, `year`), `{int}`, `{number}` (a decimal such as `1.5`) and `{text}`
  (any text that is not purely numeric), written `{name}` or `{name:format:<fmt>}` from a
  fixed table (revised: see "Revision 2026-11-03"; `{int}` is renamed `{digits}` by A72n
  and formats may take an argument). A pattern matches the whole stored heading text, exact and untrimmed; ties
  resolve shortest-first, left to right. The heading text of a pattern heading is a label,
  never compared.
- **Matching (ADR 0012).** A pattern heading is one position of the positional run of its
  level and scope: it takes the next target heading when it matches; a required pattern with
  a placeholder takes a non-matching one as a mismatch. A heading that matches the current
  position is always taken by it; an exact-text heading later in the template does not take
  it away. A pattern heading with an invalid pattern is not checked and is not a position.
- **Repeat.** A repeat heading takes every consecutive matching target heading: the
  instances of one repeat set (per scope). Every instance gets the heading's content tags,
  its sub-heading tags and its section-scope children. The minimum defaults to presence (1
  required, 0 optional); an explicit `min` decides alone, also at zero.
- **Codes and meaning split.** All `MTL605` to `MTL609`, `MTL614` and `MTL615` are errors in
  `heading`, step `headings`, suppressible:
  - `MTL605` heading-pattern-missing: a required pattern heading has no target heading left
    at its position; no anchor, only `disable-file` silences it (as `MTL601`). It replaces
    `MTL601`, `MTL602`, `MTL610` for pattern headings.
  - `MTL606` heading-pattern-mismatch: the target heading a required placeholder position
    took although it does not match; the message names the failing piece. Only when the
    position has a target heading.
  - `MTL607` heading-repeat-min / `MTL608` heading-repeat-max: instance count below an
    explicit `min` (anchor: first instance, none at zero, where it replaces `MTL605`) or
    above `max` (anchor: instance `max + 1`).
  - `MTL609` heading-pattern-order: one finding per repeat set out of order, anchored on the
    later instance of the first pair out of order, with the number of pairs; equal keys
    pass; keys compare `{semver}` by SemVer precedence, `{date}` chronologically, `{int}` and
    `{number}` numerically, `{text}` skipped (superseded: see "Revision 2026-11-03", order
    tags read the whole text or the first number or date).
  - `MTL614` heading-repeat-miss: one finding per repeat set listing the headings of its
    shape that come after the run ended (spec 2.10 step 4).
  - `MTL615` heading-subheadings-only-declared: `[content:subheadings:no-extra]` (ADR 0012).
  - `MTL014` heading-pattern-invalid: template warning, category `syntax`, `--verify` only
    (section `Invalid patterns:`), not suppressible; unknown placeholder, malformed
    placeholder, unknown format, unmatched brace, adjacent placeholders, invalid escape,
    empty pattern. The heading is then not checked.
  - `MTL017` heading-pattern-duplicate: template ERROR, category `syntax`, not
    suppressible: two adjacent headings of one level and scope with the same pattern, an
    exact-text heading counting as the literal pattern of its text (A72l). `--verify`:
    section `Duplicate patterns:`, the template FAILS, exit 1. Lint run (A72l): printed on
    the template file before its targets, exit 1, the targets still linted.
  - `MTL018` heading-optional-min-conflict (A72l): template ERROR, category `syntax`, not
    suppressible, same behaviour as `MTL017` in both modes (`--verify` section `Optional
    headings with a minimum:`): a repeat heading with `[presence:optional]` and an explicit
    `min` tag. The tags still apply as written in a lint run (the `min` decides).
  - `MTL015` gains five reasons (pattern tags on template-only or exist headings, repeat or
    order without pattern, order without repeat, no orderable placeholder). Superseded: see
    "Revision 2026-11-03" (`exist` dropped, no orderable-placeholder reason; order without
    repeat is the template error `MTL030` since A72n; two reasons remain).
- **Release.** The tags are additive, but the positional matching under them is breaking
  (ADR 0012), so Epic P ships in a major release.

## Consequences

- Positive: a changelog template can state the release heading shape, check every release
  with one rule set and require newest first; the "known engine gap" of the changelog
  template closes.
- Positive: one cause gives one code: absence `MTL605`, a wrong shape at a position
  `MTL606`, counts `MTL607` / `MTL608`, order `MTL609` (once per set), a repeat out of its
  run `MTL614`.
- Negative: stage 1 of the lexer widens (a `]` and `\"` inside quotes, a dashed family name),
  and the matcher needs a cut search inside one heading text with a fixed tie-break.
- Positive (A72l): a typo in the last heading of a run is no longer hidden: it is listed by
  the extra warning `MTL616` (ADR 0012).
- Negative: `MTL017` is the first template-phase error, so `--verify` gains a fail state
  (`FAIL` header, `Errors:` line, JSON `status: "fail"`); since A72l a lint run gains one
  too (a `(template)` entry, `Failed templates:`, JSON `template.status` `fail`), and a
  template with two adjacent identical exact-text headings, valid before, now fails.
- Follow-up phases Pm, P1 to P7, P7a to P7j, Pf, Pl, P8 and Pc (spec section 9): the positional matcher,
  grammar and tags, one phase per rule with fixtures by another agent, then README,
  architecture, migration, the CHANGELOG template and dogfood.
- `tests/consistency/pending-rules.json` held eleven new codes until their rules landed (thirteen after the 2026-11-03 revision added `MTL019` and `MTL617`, fourteen after A72n added `MTL030`);
  the spec-code pin of `tests/consistency/rules.test.ts` moved from 70 to 76 (A72j), to 79
  (A72k), to 81 (A72l), to 83 (A72m) and to 84 (A72n).

## Alternatives considered

| Option                                                       | Pros                                       | Cons                                                         | Verdict    |
| ------------------------------------------------------------ | ------------------------------------------ | ------------------------------------------------------------ | ---------- |
| Pattern in a quoted tag, separate repeat and order tags      | Heading text stays prose; each tag stands alone | Stage 1 accepts `]` and `\"` in quotes and a dashed family | **Chosen** |
| Placeholders written in the heading text (`## [{semver}] - {date}`) | Reads like the target                | Brackets and braces in text clash with tag peeling; every heading text becomes a pattern candidate | Rejected (decision 1) |
| `[format:semver]` slots marking parts of the heading text    | Reuses the format family                   | Needs a text marker syntax; unclear what the slot covers     | Rejected   |
| A general `[pattern:regex:...]` tag                          | Covers any shape                           | Regex in templates, no calendar or SemVer check, hard to read | Rejected  |
| Free-form format options (`{date:format:%Y/%m}`)             | Any date shape                             | A second mini-language; shapes the linter cannot order       | Rejected (fixed table, A72k) |
| A pattern heading is optional by default                     | No error for a file without releases       | Contradicts "a heading in the template is expected" (ADR 0009) | Rejected (decision 2) |
| One combined `[repeat:min:N:max:M]` tag                      | One tag                                    | Orphan bounds, harder grammar, no plain "repeat" form        | Rejected (decision 3) |
| A heading named by text never matches a pattern (CLAIM, A72j) | `## Unreleased` never taken for a release by `{text}` | Order-independent ownership rules; contradicts positional matching | Rejected (A72k, ADR 0012) |
| Order always on for repeat headings                          | No extra tag                               | Not every repeated heading has an order; breaks free lists   | Rejected (decision 4) |
| One `MTL609` per adjacent pair out of order (A72j)           | Mirrors `MTL407`                           | Several findings for one set; the owner asked for one        | Rejected (A72k) |
| A pattern cannot contain `"` (A72j)                          | No escape syntax                           | Headings with quotes cannot be described                     | Rejected (A72k) |
| Use `MTL613` for one of the new codes                        | Contiguous with `MTL610` to `MTL612`       | Reserved for unique heading names (owner decision)           | Rejected   |
| `MTL017` in `--verify` only (A72k)                           | Lint output unchanged                      | A project that never runs `--verify` never learns its template is wrong | Rejected (A72l decision 2) |
| `MTL017` makes the template broken in lint runs              | One existing failure state                 | Skips every target although the template can be read         | Rejected (A72l decision 2) |
| `[presence:optional]` next to a `min`: the `min` decides without a word (A72k) | No new code       | Hides a template whose two minimums contradict each other    | Rejected (A72l decision 3) |
| The same case as a `MTL015` tag conflict warning             | No new code                                | A warning, yet the conflict changes what targets report      | Rejected (A72l decision 3) |
| `MTL017` for pattern headings only (A72k)                    | Smaller rule                               | `## Notes` and `## [pattern:"Notes"]` match the same, so the same mistake goes unseen | Rejected (A72l decision 5) |
| Order key from placeholder values (A72j, A72k)               | SemVer precedence for versions             | Hard to predict from the text; needs orderable placeholders | Replaced (A72m decision 5) |
| A heading without order key as a second `MTL609` form        | No new code                                | Two causes under one code and one suppression; breaks "one `MTL609` per set" | Rejected (A72m, `MTL617`) |
| A `{regexp}` placeholder                                     | Any part shape                             | Unbounded vocabulary, ReDoS risk, unreadable templates        | Rejected (A72m decision 6) |
| An order tag without repeat tag as a `MTL015` warning (A72j to A72m) | No new code                  | `--verify` only; the template allows one heading while saying "ordered repeats" | Rejected (A72n decision 3, `MTL030`) |
| Keep the name `{int}`                                        | No rename                                  | Suggests a sign it never accepted; formats such as `hex` and `uid` do not fit the name | Rejected (A72n decision 4, `{digits}`) |
| No version order (dates only, A72m)                          | Smaller order vocabulary                   | Changelogs without dates cannot order releases                | Rejected (A72n decision 2) |

## Research

- Design and option analysis: the working proposal "heading patterns" (not tracked in the
  repository; out of date since A72k); its decisions are recorded here, in ADR 0012 and in
  `docs/spec.md`.
- SemVer 2.0.0 specification and precedence: <https://semver.org/spec/v2.0.0.html>.
- Keep a Changelog release heading form: <https://keepachangelog.com/en/1.1.0/>.
- Contract: `docs/spec.md` 2, 2.6, 2.7, 2.10, 4.1, 4.2, 4.3, 4.4 (DIR5, DIR6, DIR7), 7.3,
  7.5, 8.1, 8.2, 8.3, 8.4, 8.5, 9, AS17, C10 and C12.

## Notes

### Revision 2026-11-03 (A72m, A72n)

Owner decisions of phase A72m (recorded in spec AS17, which numbers them 1 to 8). The ADR
stays accepted; where this section and the text above differ, this section wins.

- **Placeholders (decision 4).** Fixed vocabulary `{text}`, `{number}`, `{int}`, `{semver}`,
  `{date}` and the new `{char}` (exactly one Unicode letter), each `{name}` or
  `{name:format:<fmt>}`: `{text}` `human` (default: not purely numeric), `snakecase`,
  `camelcase`, `screamcase`, `kebabcase`; `{number}` `decimal` (default, now signed) and
  `scientific`; `{int}`, `{char}` without formats (A72n: `{int}` renamed `{digits}`, with
  formats, below); `{semver}` and `{date}` unchanged. Every
  pattern matches the whole heading text; an unknown placeholder or format is `MTL014`.
  Spec 2.10 PLACEHOLDERS defines each format with accepted and rejected values.
- **Order (decision 5).** `[order:ascending]` / `[order:descending]` compare the whole
  heading text as a string (code-unit order). New `[order:first:number:ascending|descending]`
  and `[order:first:date:ascending|descending]` order by the first number (decimal or
  scientific, so 10 is above 9) or the first ISO date found in the text. The
  placeholder-value order key above is replaced, so `MTL015` loses the reason `the pattern
  has no orderable placeholder`. An instance without that number or date is the new error
  `MTL617` heading-order-key-missing (heading, suppressible, one per repeat set; its message
  recommends a pattern with `{number}` or `{date}`), not a second form of `MTL609`. A
  version order form came with A72n (decision 2 below), so a changelog orders by
  `[order:first:semver:descending]` or `[order:first:date:descending]`.
- **Content label (decision 3).** For a pattern heading the content messages name the
  matched target text and the pattern: `Section 'Epic B - Release' (pattern "Epic {char} -
  {text}"): [content:table] no markdown table row found`.
- **Template error `MTL019` (decision 2).** heading-child-order-conflict (syntax, not
  suppressible, same lint and `--verify` behaviour as `MTL017` and `MTL018`) for a deeper
  direct child before a shallower one under one parent; details in ADR 0012's revision.
- **Exist dropped (decision 1).** `[presence:exist]` is removed; `[pattern:"{text}"]` is the
  "any heading here" form, so a pattern now also covers what that tag did. The `MTL015`
  reason for pattern tags on such a heading goes, and `MTL605` replaces only `MTL601` and
  `MTL610` for pattern headings (`MTL602` is retired).
- **Codes.** `MTL019` (the last free code of the template tag sub-range) and `MTL617` (next
  free heading code after `MTL616`) were free in spec 4.2, 4.3 and DIR6; `MTL613` stays
  reserved, and `MTL602` is reserved too. The spec-code pin moves from 81 to 83 (82 after
  phase Pc removes the retired `MTL602` row).
- **Status note (2026-11-04).** Superseded in part: phase Pc is done.
  `[presence:exist]` and the `MTL602` rule and row are removed, `MTL602` stays reserved in
  spec 4.2, `HeadingMatch.textMatch` is removed, and the spec-code pin is 83.
- **Future ideas, not specified (decision 6).** A regular-expression pattern tag such as
  `[pattern:regexp:"^[a+]+$"]`, with limits that keep matching safe from catastrophic
  backtracking (ReDoS), may be studied later; there will be no `{regexp}` placeholder, the
  placeholder vocabulary stays fixed.

Owner decisions of phase A72n (2026-11-03, spec AS17, numbered 1 to 5 there; ADR 0012 holds
decision 1). Same rule: where they differ from the text above, they win.

- **First-semver order (decision 2).** New forms `[order:first:semver:ascending]` and
  `[order:first:semver:descending]`: the key is the first SemVer 2.0.0 value of the heading
  text (`v2.0.0` gives 2.0.0), compared by SemVer precedence (build metadata ignored). An
  instance without one is `MTL617`, as for `number` and `date`. Before A72n no form ordered
  by version value; now a changelog may order its releases by version or by date. Eight
  order forms in all.
- **Order without repeat (decision 3).** An order tag on a pattern heading without any
  `[repeat-rules:...]` tag is the new template ERROR `MTL030` heading-order-without-repeat
  (syntax, not suppressible, same lint and `--verify` behaviour as `MTL017` to `MTL019`,
  `--verify` section `Order tags without repeat:`). `MTL015` loses that reason; an order tag
  without pattern keeps its `MTL015` reason.
- **Placeholders (decision 4).** `{digits}` replaces `{int}` (breaking, pre-release; `{int}`
  is now an unknown placeholder): digits, no leading zero, with the formats `signed`, `hex`,
  `uid` (ASCII letters and digits, at least one of each) and `padding:N` (exactly N
  digits). A format argument is one more part, `{name:format:<fmt>:<arg>}`; `MTL014` gains
  the reasons `needs an argument`, `bad argument` and `takes no argument`. `{number}`
  (decimal and scientific) allows leading zeros and gains `precision:N` (exactly N
  decimals). The `{text}` case formats accept Unicode letters and never a digits-only text
  (`2026` is not `snakecase`); `lowercase` and `uppercase` are added; `human` stays the
  default.
- **Codes.** `MTL030` was free in spec 4.2, 4.3 and DIR6. The template tag sub-range
  `MTL010`-`019` is full and `MTL020`-`029` belongs to the directive warnings, so `MTL030`
  opens a second template tag sub-range; a heading code (`MTL6xx`) would fall in the
  suppressible range. `MTL613` stays reserved, `MTL602` retired. The spec-code pin moves
  from 83 to 84 (83 after phase Pc).

Later epic (decision 5 of A72n, design only, no code): a table-of-contents tag and a
heading-numbering tag (`## 1. Title`, `### 1.1 Title`) form a new epic after Epic P; the
owner reviews a design first (spec section 9 "Later epics").
