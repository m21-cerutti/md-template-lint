---
id: 0009-all-heading-levels
title: Check every heading level with exact-level matching and an opt-out sub-heading tag
status: accepted
date: 2026-10-30
deciders: [owner]
---

# ADR 0009: All heading levels are checked

Every template heading from H1 to H6 is checked, every level matches exactly, extra headings
stay allowed unless a template heading carries `[content:subheadings:disallow]`, and the
change ships as a breaking release (0.2.0) without a compatibility flag.

## Context

- Until now only H1 and H2 were sections (`src/engine/load.ts` keeps levels 1 and 2,
  `src/tags/parser.ts` returns early for `level > 2`). H3 to H6 lines were body text: no tag
  peeling, no presence, no order, no content check.
- A template heading matched a target heading by text alone; only `[presence:exist]` compared
  levels. So a target `# Context` satisfied a template `## Context`
  (`tests/fixtures/pairs/MTL601/fail-same-text-at-other-level-still-matches`).
- Plan row A72 needs a changelog template: H3 groups (`Added`, `Fixed`, ...) inside each
  release, and no stray headings inside a release. That cannot be written with H1/H2 only.
- Owner rounds 3 and 4 (2026-10-30, working proposal "heading patterns" rev 4, kept outside
  version control) decided: headings "always on, in all levels"; extra headings allowed by
  default with the opt-out `[content:subheadings:disallow]`; decision 1: breaking release (0.2.0), no
  flag; decision 2(b): every level exact; decision 3(a): the tag covers the whole subtree.
  These decision numbers are the ones `docs/spec.md` cites (not the kept quirks Q01 to Q08).

## Decision

- **All levels.** H1 to H6 are read and checked (spec 2.6, change C10). Tags on H3 to H6
  template lines are peeled and give `MTL011` to `MTL013`. An untagged H3 to H6 template
  heading is required, like H1 and H2.
- **Exact-level matching.** A template heading matches only a target heading with the same
  level and the same text (`exist`: the same level, any text), at every level, for every
  rule. The legacy H1/H2 cross match is removed. `MTL602` stays the `exist` check (superseded: ADR 0011 revision 2026-11-03 drops `[presence:exist]` and retires `MTL602`); no "wrong
  level" code is added: a heading at the wrong level is a missing heading plus an extra one.
- **Scope.** H1 and H2 (and a deeper heading without a template parent) match in the whole
  file, as before. An H3 to H6 heading with a template parent matches inside the target
  section of the parent's match. Such a heading under a missing, absent optional or
  template-only parent is not checked.
- **New codes.** `MTL610` heading-missing-in-section and `MTL611` heading-order-in-section,
  anchored on the target parent line; `MTL612` heading-unlisted, anchored on the unlisted
  heading, suppressible; `MTL015` heading-tag-conflict, a template warning in `--verify`,
  not suppressible (first reason: the disallow tag on a template-only heading).
- **Disallow tag.** `[content:subheadings:disallow]` on any template heading forbids target
  headings that the template does not list anywhere in the matched section (whole subtree).
  Only the topmost unlisted heading of a stray subtree is reported. There is no `allow` tag.
- **Release policy.** Breaking change, shipped in release 0.2.0, migration note in [ADR 0014](0014-legacy-behaviour-catalogue.md)
  (phase A72g), no compatibility flag or config switch.
- **Note (2026-11-04).** Superseded in part: `[presence:exist]` was removed in phase Pc.
  It is now a malformed tag (`MTL012`) and `MTL602` is retired and
  reserved. The exact-level rule above is unchanged.

## Consequences

- Positive: changelogs and other nested documents can be checked level by level; one
  matching rule for every level; existing templates without H3 to H6 headings keep their
  findings, except where a target relied on the H1/H2 cross match.
- Negative: a user template with untagged H3 to H6 headings now requires them; brackets on
  those lines now warn in `--verify`; a target heading at the wrong level is now missing.
- Fixtures `MTL601/fail-same-text-at-other-level-still-matches` and
  `MTL603/fail-template-only-heading-at-other-level` change their expected result (spec 2.6).
- Follow-up phases A72c to A72g (spec section 9): grammar, tests, engine and rules, fixtures,
  `--verify`, migration doc, README and the changelog template.
- `tests/consistency/pending-rules.json` holds the four new codes until their rules land; the
  spec-code pin of `tests/consistency/rules.test.ts` moves from 61 to 65.

## Alternatives considered

| Option                                                      | Pros                                      | Cons                                                         | Verdict                  |
| ----------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------ | ------------------------ |
| All levels, exact levels, opt-out disallow tag              | One rule per level, nested documents work | Breaking for templates with H3 to H6 and cross-level targets | **Chosen**               |
| Keep the H1/H2 cross match beside exact H3 to H6            | Full parity for H1/H2                     | Two matching rules to explain                                | Rejected (decision 2)    |
| Opt-in `[content:subheadings]` with open or closed argument | No breaking change                        | Deeper headings stay unchecked by default                    | Rejected (round 3)       |
| Unlisted headings as a default warning                      | Visible drift                             | Noise on every document with extra detail                    | Rejected (round 4)       |
| Disallow tag on direct children only                        | Smaller effect                            | Every listed child must repeat the tag                       | Rejected (decision 3)    |
| Compatibility flag `headings.maxLevel: 2`                   | Smooth upgrade                            | Two behaviours to keep and test                              | Rejected (decision 1)    |
| Extra `allow` tag to re-open a subtree under `disallow`     | Fine-grained control                      | Two tags to learn, order of tags matters                     | Rejected (decision 3(a)) |

## Research

- Design and option analysis: the working proposal "heading patterns" rev 4 (not tracked in
  the repository); its decisions are recorded in this ADR and in `docs/spec.md`.
- Contract: `docs/spec.md` 2.6, 2.7, 4.3, 4.4 (DIR5, DIR6), 9, AS15 and C10.
