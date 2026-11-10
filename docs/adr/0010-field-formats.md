---
id: 0010-field-formats
title: Check semantic versions and ISO dates on frontmatter fields with format tags
status: accepted
date: 2026-10-31
deciders: [owner]
---

# ADR 0010: Field formats for versions and dates

Frontmatter fields can require a semantic version or a `YYYY-MM-DD` date with
`[format:semver]`, `[format:date]` and their `elements:` forms, checked in a new last field
step `shape`, and `--verify` warns when a date field states no format.

## Context

- The type `date` accepts four shapes and an ongoing marker, project wide (`docs/spec.md`
  3.3, 3.4). A template cannot say "this field is `YYYY-MM-DD`", so `2026-10` and `present`
  pass a `last_updated` field.
- No tag checks a version string. Plan row A72 (changelog template) needs both: a release
  version and a release date.
- Owner decisions of 2026-10-30 (working proposal "heading patterns", section "field
  formats", kept outside version control): tags `[format:semver]`, `[format:date]`,
  `[format:elements:semver]`, `[format:elements:date]`; a new field step `shape` after the
  existing steps; the field format decides how a date is parsed; `MTL307` silent when the type
  already reports the value; a template-side `--verify` warning `MTL016` for a date field
  without format, not suppressible; codes `MTL306` to `MTL309` and `MTL016`.
- Codes checked against `docs/spec.md` 4.2 and 4.3: `MTL306` to `MTL309` and `MTL016` are
  free; `MTL015`, `MTL610` to `MTL612` (change C10) and the reserved `MTL613` are untouched.

## Decision

- **Tags.** The `format` family gains the shapes `semver` and `date`, as a scalar tag and as
  an `elements:` tag (spec 2.9). No new family; a bad shape is `MTL012`, a shape tag on a
  heading is `MTL013`.
- **Semver.** SemVer 2.0.0: three numbers without leading zeros, optional pre-release and
  build parts, no `v` prefix.
- **Date.** An ISO date is `YYYY-MM-DD` and a real calendar date. With the tag only that
  shape is accepted; without it the default date parsing of the type `date` applies.
- **No trimming.** The shape checks test the exact text of the value (owner decision,
  2026-10-31): `1.2.0` gives `MTL306`. A padded date on a `date` field passes the default
  date parsing, so `[format:date]` reports it as `MTL307`. Only a quoted YAML string can carry
  padding; unquoted scalars are already stripped by the loader.
- **One problem, one error.** A value that fails the type `date` (`MTL504`) gets no `MTL307`;
  items that fail `list-of-date` (`MTL513`) are not listed by `MTL309`. On a field of any
  other type `[format:date]` always checks.
- **Codes.** `MTL306` semver-mismatch, `MTL307` date-format-mismatch, `MTL308`
  elements-semver-mismatch, `MTL309` elements-date-mismatch: errors, category `format`, field
  step `shape` (last), anchored on the target key line, suppressible. `MTL016`
  date-format-missing: warning, category `syntax`, phase `template`, on the template key
  line, in a new last `--verify` section `Date fields without format:`, not suppressible.
- **Release.** Not breaking: a minor release. Existing targets keep their findings; only
  `--verify` of templates with date fields gains `MTL016` warnings.

## Consequences

- Positive: a changelog or any dated document can require exact versions and dates; the
  template states which date shape it means; existing templates keep working.
- Negative: every template with a `date` or `list-of-date` field warns in `--verify` until it
  gains a format tag (the ten date fields of `templates/` included).
- Negative: `[format:date]` on a `date` field is reported by two codes depending on the
  value (`MTL504` or `MTL307`); the spec explains the split.
- Follow-up phases F1 to F7 (spec section 9): grammar, one phase per rule with its fixtures,
  then README, architecture, templates and dogfood.
- `tests/consistency/pending-rules.json` holds the five new codes until their rules land; the
  spec-code pin of `tests/consistency/rules.test.ts` moves from 65 to 70.

## Alternatives considered

| Option                                               | Pros                                                        | Cons                                                | Verdict                              |
| ---------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------- | ------------------------------------ |
| Shape tags in the `format` family, step `shape` last | Reuses the family and `elements:` form; existing order kept | `MTL307` and `MTL504` share one field               | **Chosen**                           |
| New types `semver` and `iso-date`                    | No new codes beyond the type range                          | Changes inference and the type hints; breaks parity | Rejected                             |
| `[format:date]` replaces the `date` type check       | One code per field                                          | Changes `MTL504` messages for existing targets      | Rejected (decision: type reports it) |
| `MTL016` as a suppressible target warning            | Visible in every lint run                                   | Repeats on every target for one template issue      | Rejected (decision: template side)   |
| Accept a `v` prefix in `[format:semver]`             | Matches git tag names                                       | Not SemVer 2.0.0; ambiguous with prose              | Rejected                             |
| A general `[format:regex:...]` tag                   | Covers any shape                                            | Regex in templates, no calendar check, hard to read | Rejected                             |

## Research

- Design and option analysis: the working proposal "heading patterns" (section "field
  formats", not tracked in the repository); its decisions are recorded here and in
  `docs/spec.md`.
- SemVer 2.0.0 specification: <https://semver.org/spec/v2.0.0.html>.
- Contract: `docs/spec.md` 2.3, 2.7, 2.9, 3.4, 4.1, 4.3, 4.4 (DIR5, DIR6), 8.3, 9, AS16 and
  C11.
