---
id: 0015-optional-frontmatter
title: Opt-in optional target frontmatter with the template tag [frontmatter:optional]
status: accepted
date: 2026-11-11
deciders: [owner]
---

# ADR 0015: Optional frontmatter

One opt-in tag, `[frontmatter:optional]`, written as a standalone comment line
`# [frontmatter:optional]` in the template frontmatter, lets a target omit its frontmatter
block. Such a target gets no `MTL001` and no frontmatter field rules; filename, heading,
content rules and directives still run. A target with frontmatter is checked as today. A new
template-side warning `MTL031` frontmatter-tag-conflict reports misplaced copies of the tag.
Additive change in 0.2.0: no existing template or target changes behaviour.

## Context

- Today every target must start with a frontmatter block: `loadDocument(text)` fails with
  `frontmatter-missing` (`MTL001`) when `frontmatter === null`, for templates and targets
  alike (`src/engine/load.ts`, `src/engine/pipeline.ts`).
- GitHub renders the frontmatter of a `README.md` as a table above the text, so a README
  usually has none. `TODO.md` has none either. Both cannot be linted today (see the
  unlisted files in `md-template-lint.yml`).
- The opening delimiter is the lexer token `FM_OPEN : '---' [ \t]* '\n'`
  (`grammar/MdTemplateLexer.g4:115`): only spaces or tabs may follow the dashes. A comment on
  the delimiter line is body text today, and the file has no frontmatter.
- A template-wide switch already exists on a standalone frontmatter comment line, bound to no
  key: `# [filename:case:<convention>]` (spec 2.5) and `# [unique-headings-names]` (ADR 0013,
  spec 2.11). `# [frontmatter:optional]` already parses as such a line (`fmFilenameLine`), so
  the grammar needs one keyword and one tag alternative, no new line rule.
- The template is the schema (no separate schema file): a per-file switch belongs in the
  template, not in the config.
- Owner decisions (2026-11-11):
  1. tag `[frontmatter:optional]` on a standalone comment line anywhere in the template
     frontmatter block;
  2. the behaviour matrix below; an unclosed `---` keeps `MTL001`;
  3. code `MTL031`, severity warning, for a duplicate, a key-line or a mixed-line tag;
  4. an optional parameter on `loadDocument`, and a new guard in `runTargetRules` that
     reads the existing `target.document.frontmatter === null`;
  5. `--verify` text and JSON output as below.

## Decision

- **Tag and placement.** A comment line holding only `# [frontmatter:optional]`, anywhere in
  the template frontmatter block, declares the frontmatter optional for the target. Lexer
  keyword `FRONTMATTER` in mode `TAG_STRICT`, parser alternative
  `fmFrontmatterTag : FRONTMATTER COLON OPTIONAL`. The comment on the opening delimiter
  (`--- # [frontmatter:optional]`) is not accepted: it would change what opens frontmatter.
- **Behaviour matrix (summary).**
  - Template has the tag, target has no frontmatter: no `MTL001`, no field rules (no
    `MTL201`, `MTL202`, `MTL102` and so on). Filename (`MTL101`), heading and content rules
    and body directives run.
  - Template has the tag, target has frontmatter: checked exactly as today.
  - Target `---` never closed: `MTL001`. Invalid YAML or not a mapping: `MTL002` or `MTL003`.
  - Template without the tag: nothing changes; a target without frontmatter gets `MTL001`.
  - Template without a frontmatter block: still broken (`MTL001`); the tag cannot be written.
  - Tag in a heading: `MTL013`. Malformed (`[frontmatter:optional:x]`,
    `[frontmatter:required]`): `MTL012`. Tag in a target: inert.
- **`MTL031` frontmatter-tag-conflict.** Category `syntax`, phase `template`, severity
  warning. One finding per offending tag, on the tag's `[`: a duplicate standalone line (the
  tag stays effective), the tag after a key, or the tag in mixed comment text (both inert).
  In the `MTL001`-`099` range, so not suppressible. Retired `MTL602` is untouched.
- **Engine.** The shared loader gets an optional parameter:
  `loadDocument(text, options?: { frontmatterOptional?: boolean })`. Only `lintTarget` passes
  it (from the template flag); `checkTemplate` and `loadFile` keep `loadDocument(text)`. With
  the option and no frontmatter block (not unclosed), the loader returns a body-only model.
  Today the template field loop in `runTargetRules` (`src/engine/pipeline.ts`) runs over
  every template field unconditionally. A new guard skips it when
  `target.document.frontmatter === null`: it reads the existing
  `MarkdownDocument.frontmatter: Frontmatter | null` (`src/tags/ast.ts`), adds no model
  field, and is reachable only under the loader option.
- **Tradeoff of the loader option.** `loadDocument` is public (`src/index.ts`). An optional
  parameter keeps every caller compatible and adds the smallest surface. The sibling
  `loadTarget` would leave the signature untouched but adds a second public or internal entry
  point that duplicates the loader; it is not chosen.
- **`--verify`.** Text line `Frontmatter: [frontmatter:optional]` after
  `Unique heading names:`; JSON verify key `frontmatterOptional` after `uniqueHeadingNames`
  (additive, `schemaVersion` stays 1). Warning section `Conflicting frontmatter tags:` for
  `MTL031`.

## Consequences

- Positive: `README.md`, `TODO.md` and other frontmatter-less files become lintable for their
  name, headings and content, with the template as the single schema source.
- Positive: additive and opt-in; a template without the tag gives the same findings on every
  target, and targets with frontmatter are unchanged.
- Negative: `loadDocument` grows an optional parameter on the public surface.
- Negative: the new guard reads `target.document.frontmatter === null`, not an explicit
  model flag; a later reader must know it is reachable only under the loader option.
- Negative: the JSON key touches every `schema-*` expected file of the CLI tests.
- Negative: an empty or body-only target reports every required heading as `MTL601`
  (intended, documented in the spec example).
- Follow-up: grammar, tags, engine, rule `MTL031`, spec section, syntax reference, CHANGELOG
  entry and tests.

## Alternatives considered

| Option                                                         | Pros                                     | Cons                                                                               | Verdict                 |
| -------------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------- |
| Standalone comment line `# [frontmatter:optional]`             | Additive; same mechanism as two switches | One more tag family in the grammar                                                 | **Chosen** (decision 1) |
| (a) Template without frontmatter means the target is unchecked | No new tag                               | The template itself is `MTL001` broken; changes a current rule                     | Rejected                |
| (b) Always require frontmatter (status quo)                    | No change                                | `README.md` and `TODO.md` stay unlintable                                          | Rejected                |
| (c) Comment on the delimiter `--- # [frontmatter:optional]`    | Visible on the first line                | `FM_OPEN` must change; a target `--- # x` would open frontmatter too; not additive | Rejected (decision 1)   |
| (d) Config-level switch per pair                               | No grammar change                        | Splits the schema between template and config; the template is the schema          | Rejected                |
| Sibling `loadTarget` instead of a loader option                | `loadDocument` signature unchanged       | Second entry point duplicating the loader                                          | Rejected (decision 4)   |
| Explicit model flag (`hasFrontmatter`) for the skip            | Explicit intent                          | One more model field; `document.frontmatter` already holds it                      | Rejected (decision 4)   |
| Key-line and mixed-line tag inert and silent (as 2.5, 2.11)    | Follows precedent                        | A misplaced tag silently has no effect                                             | Rejected (decision 3)   |

## Research

- Owner decisions of 2026-11-11, recorded above.
- Code: `grammar/MdTemplateLexer.g4:115` (`FM_OPEN`), `grammar/MdTemplateParser.g4`
  (`fmFilenameLine`), `src/engine/load.ts` (`loadDocument`, `frontmatter-missing`),
  `src/engine/pipeline.ts` (`checkTemplate`, `lintTarget`, `runTargetRules`),
  `src/tags/ast.ts` (`MarkdownDocument.frontmatter`), `src/index.ts` (public exports).
- Contract: `docs/spec.md` 1.1, 2.5, 2.7, 2.11, 4.2, 4.3, 8.3 and 8.5; ADR 0013 (the
  standalone-line precedent).
- Code collision check: `MTL031` appears only as free range prose in spec 4.2.

## Notes

- The spec section, rule and tests land in later phases of the same release.
