---
title: md-template-lint specification
last_updated: 2026-11-04
---

# md-template-lint Specifications

This file is the contract of `md-template-lint`. When the code and this file disagree, fix one
of them in the same change. Terms such as heading, level, scope, run and match are defined in
[grammar.md](grammar.md) and [glossary.md](glossary.md); this file links to them instead of
redefining them.

Conventions in this file:

- Template tags appear only inside inline code or fenced code, so this file is never parsed as
  a template.
- Behaviour is fixed byte for byte (messages, order, defaults) unless a section says
  "changed". Every change has an id: defects D01 to D18 (section 5), assumptions AS1 to AS17
  (section 10), kept quirks Q01 to Q08 and other changes C01 to C14 (section 11). The
  catalogue of these ids is [ADR 0014](adr/0014-legacy-behaviour-catalogue.md).
- `AS<n>` is an assumption, `Q<nn>` a kept quirk, `C<nn>` a change beyond the defect list,
  `DIR<n>` a decision of the disable directives section (4.4).
- Rule codes are `MTLnnn`. A code is never renumbered and never reused.

<!-- prettier-ignore-start -->
<!-- omit in toc -->
## Summary
<!-- prettier-ignore-end -->

- [1. Model](#1-model)
  - [1.1 What a template is](#11-what-a-template-is)
  - [1.2 YAML loading](#12-yaml-loading)
  - [1.3 Severity](#13-severity)
- [2. Template tags](#2-template-tags)
  - [2.1 Where comments bind (inline comment)](#21-where-comments-bind-inline-comment)
  - [2.2 Presence tags (inline comment)](#22-presence-tags-inline-comment)
  - [2.3 Value tags (inline comment)](#23-value-tags-inline-comment)
  - [2.4 Type hints (inline comment)](#24-type-hints-inline-comment)
  - [2.5 Filename comment (template-wide)](#25-filename-comment-template-wide)
  - [2.6 Heading suffix tags (body sections)](#26-heading-suffix-tags-body-sections)
  - [2.7 Inert, unknown and malformed tags](#27-inert-unknown-and-malformed-tags)
  - [2.8 The `[io:exists]` tag](#28-the-ioexists-tag)
  - [2.9 Field formats (`[format:semver]`, `[format:date]`)](#29-field-formats-formatsemver-formatdate)
  - [2.10 Heading patterns, repeat rules and order](#210-heading-patterns-repeat-rules-and-order)
  - [2.11 Unique heading names (`[unique-headings-names]`)](#211-unique-heading-names-unique-headings-names)
  - [2.12 Optional frontmatter (`[frontmatter:optional]`)](#212-optional-frontmatter-frontmatteroptional)
- [3. Types](#3-types)
  - [3.1 The 17 types](#31-the-17-types)
  - [3.2 Inference order](#32-inference-order)
  - [3.3 Loose inference predicates](#33-loose-inference-predicates)
  - [3.4 The types and their rules](#34-the-types-and-their-rules)
- [4. Lint pipeline and rule codes](#4-lint-pipeline-and-rule-codes)
  - [4.1 Order of checks for one target](#41-order-of-checks-for-one-target)
  - [4.2 Code ranges](#42-code-ranges)
  - [4.3 Code table](#43-code-table)
    - [syntax (`src/rules/syntax.ts`)](#syntax-srcrulessyntaxts)
    - [filename (`src/rules/filename.ts`)](#filename-srcrulesfilenamets)
    - [presence (`src/rules/presence.ts`)](#presence-srcrulespresencets)
    - [format (`src/rules/format.ts`)](#format-srcrulesformatts)
    - [bounds (`src/rules/bounds.ts`)](#bounds-srcrulesboundsts)
    - [type (`src/rules/type.ts`)](#type-srcrulestypets)
    - [heading (`src/rules/heading.ts`)](#heading-srcrulesheadingts)
    - [content (`src/rules/content.ts`)](#content-srcrulescontentts)
    - [io (`src/rules/io.ts`)](#io-srcrulesiots)
    - [run errors (engine, no rule file)](#run-errors-engine-no-rule-file)
    - [Directive warnings (`MTL020` to `MTL025`, rows in the `syntax` table above)](#directive-warnings-mtl020-to-mtl025-rows-in-the-syntax-table-above)
  - [4.4 Disable directives in target files](#44-disable-directives-in-target-files)
    - [Forms and syntax (DIR1, DIR2)](#forms-and-syntax-dir1-dir2)
    - [Carriers and where directives are read (DIR3, DIR4)](#carriers-and-where-directives-are-read-dir3-dir4)
    - [Anchors and the coverage rule (DIR5, DIR6, DIR7)](#anchors-and-the-coverage-rule-dir5-dir6-dir7)
    - [Range bookkeeping (DIR8)](#range-bookkeeping-dir8)
    - [Counts, exit codes and reporters (DIR9)](#counts-exit-codes-and-reporters-dir9)
    - [Interactions (DIR10)](#interactions-dir10)
    - [Worked examples](#worked-examples)
- [5. Defect decisions (D01 to D18)](#5-defect-decisions-d01-to-d18)
- [6. Configuration: `md-template-lint.yml`](#6-configuration-md-template-lintyml)
  - [6.1 Discovery](#61-discovery)
  - [6.2 Path values](#62-path-values)
  - [6.3 Schema](#63-schema)
  - [6.4 Globs](#64-globs)
  - [6.5 Multi-root, external root and migration](#65-multi-root-external-root-and-migration)
  - [6.6 Validation errors](#66-validation-errors)
- [7. CLI](#7-cli)
  - [7.1 Synopsis](#71-synopsis)
  - [7.2 Modes](#72-modes)
  - [7.3 `--verify`](#73---verify)
  - [7.4 Empty target sets](#74-empty-target-sets)
  - [7.5 Exit codes](#75-exit-codes)
- [8. Output](#8-output)
  - [8.1 Diagnostic](#81-diagnostic)
  - [8.2 Text format](#82-text-format)
    - [Source excerpt (change C09, AS14)](#source-excerpt-change-c09-as14)
  - [8.3 Verify text output](#83-verify-text-output)
  - [8.4 Ordering](#84-ordering)
  - [8.5 JSON format](#85-json-format)
- [9. Rule categories](#9-rule-categories)
- [10. Assumptions](#10-assumptions)
- [11. Behaviour notes and changes beyond D01 to D18](#11-behaviour-notes-and-changes-beyond-d01-to-d18)
  - [11.1 Kept quirks](#111-kept-quirks)
  - [11.2 Changes beyond D01 to D18](#112-changes-beyond-d01-to-d18)

## 1. Model

### 1.1 What a template is

A template is a Markdown file, and it IS the schema. There is no separate schema file.

- It starts with a YAML frontmatter block. The first line is `---` and the closing line is
  `---`; only spaces or tabs may follow the dashes. A `---` inside a value does not close the
  block.
- Each top-level frontmatter key is a field. The value and the inline comment of the key
  define the field type and its rules.
- The body headings of every level (H1 to H6) define the section rules (change C10). Their
  suffix tags set presence, order, content and sub-heading rules.
- Files are UTF-8. A BOM at the start of the file is ignored.
- Line endings are normalized before parsing: CRLF and a lone CR become LF. The frontmatter
  delimiters, comment binding, heading extraction and section bodies all see LF only (the
  frontmatter pattern matches `\n` only). Messages never contain a CR.

A target is a Markdown file linted against one template. It must have the same frontmatter
shape. A target may omit its frontmatter block only when the template carries the standalone
frontmatter comment line `# [frontmatter:optional]` (2.12, ADR 0015). Tags in a target are inert (2.7), with one exception: recognized trailing heading tags
are stripped from the target heading text before comparison. A target may carry disable
directives, comments that silence rule codes locally (4.4). A template never does.

The template is parsed once per run (defect D05) and is never linted against itself. A
template file that matches the `include` of its own pair is skipped as a target.

### 1.2 YAML loading

The YAML library is `yaml`. Frontmatter is loaded with the `failsafe` schema: every scalar is a
string, and maps and sequences keep their shape. Nothing is coerced: `yes`, `2026-08-10`, `1.0`
and `~` stay strings, never a bool, date, number or null.

- An empty value (`key:`) loads as the empty string.
- With a duplicate key, the last one wins. This is not an error.
- A file without frontmatter is `MTL001`, invalid YAML is `MTL002`, and a frontmatter that is
  not a mapping is `MTL003`. These are parse errors. A file that cannot be read or is not valid
  UTF-8 is `MTL004`. One exception: a TARGET without a frontmatter block is not `MTL001` when
  its template carries `# [frontmatter:optional]` (2.12). A `---` block that is never closed
  stays `MTL001`, and a template without a frontmatter block stays `MTL001` in every case.
- An empty frontmatter block loads as an empty mapping and is valid.

An "empty value" (used by presence) is the empty or blank string, or an empty list. A mapping is
never empty, even when all its sub-values are empty.

### 1.3 Severity

- `error`: the file fails, exit code 1.
- `warning`: printed, but never changes the exit code. There is no strict mode in v1.

## 2. Template tags

A tag is a bracket token `[family:argument...]`. Tag names and keywords are matched
case-insensitively, with one exception: `[filename:case:<convention>]` is fully case-sensitive,
because `camelCase` and `PascalCase` differ by capitalization alone. The tags are specified in
two ANTLR grammar files: `grammar/MdTemplateLexer.g4` (the lexer, with region modes) and
`grammar/MdTemplateParser.g4` (the parser). No tag regex lives anywhere else.

Three syntaxes carry tags:

| Syntax           | Where                                               | Bound to     | Grammar entry                                  |
| ---------------- | --------------------------------------------------- | ------------ | ---------------------------------------------- |
| Inline comment   | trailing `#` comment on a top-level frontmatter key | that key     | `fmKeyLine` / `fmInlineComment` (family `fm*`) |
| Filename comment | a standalone `#` comment line in the frontmatter    | the template | `fmFilenameLine` (family `fm*`)                |
| Heading suffix   | bracket tags after the text of a heading (H1 to H6) | that heading | `bodyHeading` (family `body*`)                 |

The standalone comment line of the second row carries three template-wide switches, each
alone on its line: `# [filename:case:<convention>]` (2.5), `# [unique-headings-names]` (2.11)
and `# [frontmatter:optional]` (2.12, ADR 0015). The last one parses as `fmFilenameLine` too:
the family keyword `frontmatter` and one tag alternative are the only grammar additions
(2.12 "Grammar at spec level").

The parser has two rule families: `fm*` for the frontmatter and `body*` for the body. Lexer
modes decide the region: the `FM*` modes cover the leading `---` block, and the `BODY` and fence
modes cover the rest (ADR 0002). A known tag in the wrong region is a located warning (`MTL013`,
2.7). The production entry is `document`, which reaches the rules above. The entry rules
`fmTagEntry`, `bodyTagEntry`, `fmInlineCommentEntry`, `fmFilenameLineEntry` and
`bodyHeadingTextEntry` are helpers for tests only. A consistency check must target the
production rules.

Informal grammar (the `grammar/*.g4` files are normative):

```text
tag            = "[" family ":" body "]"            ; body never contains "]"
typeHint       = "[" typeToken "]"                  ; tagBareBracket: one word, no colon (2.4)
hintWord       = "YYYY-MM-DD" | "iso" | "url" | "lien" | "path" | "@" name "/"   ; fmHintWord (2.4)
inlineComment  = (text | tag | typeHint | hintWord)*
filenameLine   = "#" WS "[filename:case:" convention "]" WS EOL
optionalLine   = "#" WS "[frontmatter:optional]" WS EOL ; the switch of 2.12
headingSuffix  = headingText (WS tag)*              ; recognized tags peeled right to left
convention     = "snake_case" | "kebab-case" | "camelCase" | "PascalCase"
patternTag     = "[pattern:" '"' patternText '"' "]" ; heading only, 2.10
patternText    = (escape | any character except '"', "\" and a line end)* ; may contain "]"
escape         = "\" (any character except a line end) ; only \" and \\ are valid (MTL014)
```

The heading patterns of 2.10 (change C12) bring two exceptions to `tag`:

- The quoted argument of `[pattern:"..."]` may contain `]` and an escaped quote `\"`. The tag
  ends at the first unescaped `"` followed by `]`.
- A family name may contain a dash (`repeat-rules`).

### 2.1 Where comments bind (inline comment)

- A `#` starts a comment only when it is outside single and double quotes AND sits at the start
  of the text or after a space or tab. So `"#ff0000"`, `url#frag` and a `#` glued to a value
  stay in the value.
- The comment binds to the TOP-LEVEL key on the same physical line. It never binds across
  lines.
- A comment on an indented sub-key binds to nothing. A sub-key never shadows a top-level key.
- A comment on a list item is read per item index, but no rule uses it today.
- A whole-line comment binds to no key, except the filename comment (2.5).
- Several tags may share one comment, in any order, mixed with free text. For a tag that can
  appear only once, the first occurrence wins.
- Comments are located by the grammar key-line lexer (`fmKeyLine`) and joined to the keys of
  the `yaml` document by line number ([yaml-spike](research/yaml-spike.md), ADR 0002). This
  tracks backslash-escaped quotes and quoted keys that contain a colon. The `yaml` library
  alone cannot do this job, because it merges consecutive comment lines.
- Field-tag diagnostics (`MTL010`, `MTL012`, `MTL013`) are emitted only for lines that match a
  top-level key of the parsed YAML document. A line that looks like a key but is not a YAML key
  (inside a block scalar or a multi-line value) never gives a field-tag diagnostic.
- Unknown tags on a STANDALONE comment line of the template frontmatter (a whole-line `# ...`
  comment that binds to no key) are reported too. Each unknown `[tag]` on that line, alone or
  mixed with free text (`# [unique-heading-names]`, `# [todo]`, `# note [x]`), gives the
  `MTL010` warning `Comment line {line}: unknown tag {tag}`.
  - `{line}` is the 1-based line number in the template file. `{tag}` is the bracket text as
    written, rendered like the key-line form.
  - There is one finding per unknown tag, in source order.
  - Known tags on a standalone line keep their meaning and give no unknown warning. The
    filename tag alone on a line (2.5), `[unique-headings-names]` alone on a line (2.11) and
    `[frontmatter:optional]` alone on a line (2.12) are switches; other known tags there stay
    inert.
  - A malformed form alone on the line (`[unique-headings-names:x]`) keeps its `MTL012`
    behaviour. A malformed or misplaced known-family tag mixed with text
    (`# note [count:min:abc]`) gives no finding.
  - There is no escape syntax. To keep a note with brackets out of the warning, write it
    without square brackets.
  - This applies to template FRONTMATTER comment lines only: not to the template body text and
    not to target files.
  - Like every `MTL010`, it is a warning shown by `--verify` alone, and it never changes the
    exit code.

### 2.2 Presence tags (inline comment)

| Tag                             | Meaning                                                                                 | Code     |
| ------------------------------- | --------------------------------------------------------------------------------------- | -------- |
| `[presence:required]`           | Value must be non-empty. Same as no presence tag. A missing or empty value is `MTL201`. | `MTL201` |
| `[presence:optional]`           | Absent or empty value is fine. No other check runs on an empty value.                   | none     |
| `[presence:conditional:<text>]` | Documentation only. Behaves like optional. `<text>` is any text up to `]`, trimmed.     | none     |

Precedence when several are present: conditional, then optional, then required. A field with
no presence tag is REQUIRED.

```yaml
---
id: "string" # [presence:required] [value:filename]
owner: "string" # [presence:optional]
reviewer: "string" # [presence:conditional:only when the change is risky]
---
```

### 2.3 Value tags (inline comment)

| Tag                              | Applies to                                              | Semantics                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Code(s)              |
| -------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- |
| `[format:constant:<value>]`      | any present field                                       | A scalar value must equal `<value>` (up to `]`, trimmed) as a string. A list or mapping value never matches, so it is always an error (accepted deviation, see Q02).                                                                                                                                                                                                                                                                                                                 | `MTL301`             |
| `[format:snake_case]`            | scalar string value                                     | Must match snake case. Skipped when the value is not a string.                                                                                                                                                                                                                                                                                                                                                                                                                       | `MTL302`             |
| `[format:kebab-case]`            | scalar string value                                     | Must match kebab case. Skipped when the value is not a string.                                                                                                                                                                                                                                                                                                                                                                                                                       | `MTL302`             |
| `[format:elements:snake_case]`   | list value                                              | Every item must match snake case. Skipped when the value is not a list.                                                                                                                                                                                                                                                                                                                                                                                                              | `MTL303`             |
| `[format:elements:kebab-case]`   | list value                                              | Every item must match kebab case. Skipped when the value is not a list.                                                                                                                                                                                                                                                                                                                                                                                                              | `MTL303`             |
| `[format:semver]`                | scalar string value                                     | Must be a semantic version (SemVer 2.0.0, no `v` prefix). Skipped when the value is not a string. See 2.9.                                                                                                                                                                                                                                                                                                                                                                           | `MTL306`             |
| `[format:date]`                  | scalar string value                                     | Must be a calendar-valid `YYYY-MM-DD` date. Silent when the field type `date` already reports the value (`MTL504`). Skipped when the value is not a string. See 2.9.                                                                                                                                                                                                                                                                                                                 | `MTL307`             |
| `[format:elements:semver]`       | list value                                              | Every item must be a semantic version. Skipped when the value is not a list. See 2.9.                                                                                                                                                                                                                                                                                                                                                                                                | `MTL308`             |
| `[format:elements:date]`         | list value                                              | Every item must be a calendar-valid `YYYY-MM-DD` date. Items that the type `list-of-date` already reports (`MTL513`) are not listed. Skipped when the value is not a list. See 2.9.                                                                                                                                                                                                                                                                                                  | `MTL309`             |
| `[format:scheme:<s1>,<s2>,...]`  | `url`, per item of `list-of-url`                        | Allow-list of URL schemes, comma separated, lowercased, case-insensitive. Only a syntactically valid URL is checked (an invalid URL is reported by the type rule). Empty list after trimming means no restriction.                                                                                                                                                                                                                                                                   | `MTL304`, `MTL305`   |
| `[value:filename]`               | any present field                                       | A scalar value must equal the target file name stem (name without the last extension) as a string. A list or mapping value never matches, so it is always an error (accepted deviation, see Q02).                                                                                                                                                                                                                                                                                    | `MTL102`             |
| `[count:min:N]`, `[count:max:N]` | list value                                              | Bounds the LENGTH of a list. `N` is a non-negative integer. No-op on a non-list value.                                                                                                                                                                                                                                                                                                                                                                                               | `MTL401`, `MTL402`   |
| `[range:min:N]`, `[range:max:N]` | any present field, NO type guard                        | Bounds a numeric VALUE. `N` is `-?digits` with an optional `.digits`; an integer bound when no `.`, else a float. A scalar whose trimmed text matches `-?digits(.digits)?` (no exponent) is compared as a number (`MTL403`, `MTL404`). On a list, each item that matches is compared on its own (`MTL405`, `MTL406`), for ANY list, not only `list-of-int`. Items or scalars that are not numbers, and mappings, are skipped silently (the type rule reports them, no second error). | `MTL403` to `MTL406` |
| `[order:ascending]`              | `list-of-date`                                          | Adjacent valid dates must be in non-decreasing order. An ongoing marker sorts after every date. Invalid items are skipped. No-op on any other type.                                                                                                                                                                                                                                                                                                                                  | `MTL407`             |
| `[io:exists]`                    | `path`, `list-of-path`, `url`, `list-of-url` (per item) | Opt-in existence or reachability check. EVERY finding is a warning. See 2.8.                                                                                                                                                                                                                                                                                                                                                                                                         | `MTL801` to `MTL805` |

`[count:...]` bounds the length of a list. `[range:...]` bounds a number. They are never
interchangeable. `[range:...]` ignores the field type: a string field holding `"3"` is
range-checked too. A type hint such as `[int]` only adds the type rule on top.

Case styles used by `[format:...]` and `[filename:case:...]`:

```text
snake_case   ^[a-z0-9]+(_[a-z0-9]+)*$
kebab-case   ^[a-z0-9]+(-[a-z0-9]+)*$
camelCase    ^[a-z][a-zA-Z0-9]*$
PascalCase   ^[A-Z][a-zA-Z0-9]*$
```

(These are value patterns, not tag patterns. They live in `src/engine/values.ts`.)

```yaml
---
slug: "string" # [format:kebab-case] [value:filename]
tags: ["a"] # [count:min:1] [count:max:5] [format:elements:kebab-case]
rating: "3" # [int] [range:min:1] [range:max:5]
homepage: "https://example.org" # [format:scheme:https] [io:exists]
milestones: ["2026-01", "2026-06"] # [order:ascending]
---
```

### 2.4 Type hints (inline comment)

Type hints are not rules. They only choose the field type (section 3). The forms are:

- A single-token bracket `[<name>]`, for example `[date]` or `[list-of-int]`. The
  `[path-alias]` bracket is a hint too.
- The literal text `YYYY-MM-DD` or the word `ISO` (hint: date).
- The words `url` or `lien` (hint: url) and the word `path` (hint: path), matched as whole
  words.
- An alias marker `@<name>/` in the comment (hint: path-alias).
- A field VALUE equal to a type name (`"date"`), or an option list `a | b` (enum).

Colon tags (`[presence:...]`) never act as type hints. The text `type=<name>` in a comment is
plain text: it is not a hint form, it is ignored and it gives no diagnostic. The preferred way
to declare a type is a field value equal to the type name; in a comment, use the bracket
`[<name>]`.

### 2.5 Filename comment (template-wide)

```yaml
---
# [filename:case:snake_case]
id: "string" # [presence:required] [value:filename]
---
```

- Syntax: a standalone comment line in the frontmatter block that holds only this tag,
  `# [filename:case:<convention>]`. The convention is one of `snake_case`, `kebab-case`,
  `camelCase` or `PascalCase`, and it is case-sensitive.
- It binds to no key. The first such line wins.
- It constrains the stem of the target file name. A stem that does not match is the error
  `MTL101`.
- It is read from the TEMPLATE only. In a target it is inert. The template file name is never
  checked.
- The same tag trailing a `key:` line is inert, and it is not reported as unknown.

### 2.6 Heading suffix tags (body sections)

Syntax: bracket tags that trail the text of a heading line of any level (H1 to H6), separated
by spaces, in any order. Every heading level is read and checked (change C10, ADR 0009).
Headings inside fenced code blocks are ignored. Before C10, only H1 and H2 were read; H3 to H6
lines were plain body text, kept their brackets and gave no tag warning.

```text
## Overview [presence:required] [content:non-empty]

### Background [presence:optional]

### Decision

## Notes [presence:optional]

## Authoring checklist [presence:template-only]
```

How headings are extracted (line pattern, fences, tag peeling, stored text, exact levels,
section body) is defined in
[grammar.md "Heading extraction rules"](grammar.md#heading-extraction-rules).

Levels, parents and scope, and the terms used by the rules below (Parent, Target section,
Scope, Siblings, Sequence, Match of T, Extra, Checked), are defined with their rationale in
[grammar.md "Levels, parents and scope"](grammar.md#levels-parents-and-scope).

Presence tags on a heading:

| Tag                             | Meaning                                                                                                                                                                                                            | Code                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| `[presence:required]`           | The sibling at its position (2.10 "Positional match") must have this exact text. Same as no tag, at every level (an untagged H3 to H6 template heading is REQUIRED).                                               | `MTL601` (file scope), `MTL610` (section scope) |
| `[presence:optional]`           | The target may omit it: the position takes the next sibling only when it matches.                                                                                                                                  | none                                            |
| `[presence:conditional:<text>]` | Documentation only, never enforced. Matches like optional.                                                                                                                                                         | none                                            |
| `[presence:template-only]`      | Template-only guidance, not a position. A sibling with this text (same level and scope) is an error and is set aside from the run (2.10 step 1). Absent is the silent, correct outcome. No frontmatter equivalent. | `MTL603`                                        |

Precedence: conditional, template-only, optional, then required (the default).

Why required is the default at every level: one rule for every level is easier to learn than
a default that depends on the level, and a heading written in the template is expected in the
document unless the template says otherwise (`[presence:optional]`).

Dropped tag (breaking, C10 note): `[presence:exist]` (a sibling at the heading's level, any
text) no longer exists.

- `exist` is not a presence keyword, so `[presence:exist]` is a known family with a bad
  argument: a MALFORMED tag, the `--verify` warning `MTL012` (2.7).
- Like every malformed heading tag, peeling stops at it and the bracket stays in the heading
  text. The heading becomes an ordinary REQUIRED exact-text heading whose text ends with the
  bracket. No target heading has that text, so a lint run reports it missing (`MTL601` or
  `MTL610`, for example `Missing required heading: 'Context [presence:exist]'`). The message
  names the tag to migrate.
- In a frontmatter comment the tag gives `MTL012` too, because no region accepts it (it used
  to be the misplaced `MTL013`).
- `MTL602` (heading-level-missing, the old check) is RETIRED: reserved and never reused (4.2).
- Migration: "any heading at this level" is now the pattern `[pattern:"{text}"]` (2.10). The
  text written before the tag is only an author hint (the LABEL of 2.10) and is never
  compared.

Examples:

| Before                                        | After                                                                                                                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `# ADR [presence:exist]`                      | `# ADR - Title [pattern:"ADR - {text}"]`, or `# Title [pattern:"{text}"]` for any H1                                                                                     |
| `## Epic A - Title [presence:exist]`          | `## Epic A - Title [pattern:"Epic {char} - {text}"] [repeat-rules:same-level] [order:ascending]` (one heading per epic, epics in letter order; worked example 7 of 2.10) |
| `## Changes [presence:exist] [content:table]` | `## Changes [content:table]` when the heading text is fixed (plain required heading)                                                                                     |
| `### Version [presence:exist]`                | `### 0.0.0 [pattern:"{semver}"]`                                                                                                                                         |

One difference: `{text}` refuses a PURELY NUMERIC text (2.10).

- A heading such as `## 2026` needs `{digits}`, `{number}` or `{date:format:year}`.
- A numeric heading with a leading zero (`## 007`) needs `{digits:format:padding:3}` (exactly
  three digits) or `{number}` (which allows leading zeros). The default `{digits}` refuses it
  (no leading zero), and no `{text}` format accepts a digits-only text.

Why the tag was dropped: `exist` was a second matching mechanism (level only, no text) next to
exact text and patterns. `[pattern:"{text}"]` says the same thing with the one mechanism every
heading uses, and a pattern can say more (`ADR - {text}`). Failing loudly (a heading that can
never match) instead of silently ignoring the tag makes every template that used it visible
on the first run after the upgrade.

Exact-level matching affects the codes as follows:

- `MTL601` fires for a required file-scope exact-text heading that has no match at its
  position (2.10 step 3b). A target heading with the same text at another level is not a
  sibling, so it never satisfies it. The message gains a hint when a sibling with the same
  text comes later in the run: `Missing required heading: 'Alpha' (found later at line 7, out
of order)`. Otherwise the message is unchanged (definition in 2.10 step 3b, example I of
  2.10 worked example 4). A same-text heading at another level never gives the hint.
- `MTL602` never was a "wrong level" check (it was the check of the dropped `exist` tag). It
  is RETIRED (above; reserved, 4.2). There is no separate "wrong level" code. A target heading
  with the right text at the wrong level is simply not a match: the template heading is
  missing (`MTL601`, or `MTL610` in a section), and the target heading is an extra heading
  when it is in the tail of a run (the warning `MTL616`, or `MTL612` under
  `[content:subheadings:disallow]`).
- `MTL603` fires only for a sibling (same level, same scope) with the template-only text.
- `MTL604`, `MTL611` and the content rules use the positional match, which is exact-level.
- Fixtures whose expected result changed with C10 (section 9):
  - `tests/fixtures/pairs/MTL601/fail-same-text-at-other-level-still-matches`: target
    `# Context` against template `## Context`, `## Steps`. Before C10 only `'Steps'` was
    missing; with C10 both `'Context'` and `'Steps'` give `MTL601`. The case is renamed
    `fail-same-text-at-other-level-does-not-match`.
  - `tests/fixtures/pairs/MTL603/fail-template-only-heading-at-other-level`: target
    `# Authoring checklist` against template `## Authoring checklist [presence:template-only]`.
    There is no `MTL603` any more; the case becomes `pass-template-only-heading-at-other-level`.
  - The `tests/fixtures/pairs/MTL602/` cases were deleted with the retired rule (section 9).

Why exact levels everywhere (ADR 0009): one matching rule for every level, with no exception
to explain. A heading at the wrong level changes the document outline, and the outline is what
a template fixes. Cost: a breaking change for documents that relied on the H1/H2 cross match
(breaking release 0.2.0, migration note, section 9).

Order: the template headings found in the target must appear in the same relative order.
There are two checks, one per scope:

- `MTL604` (file scope).
  - The list holds every file-scope template heading, in template order, whatever its
    presence mode. A heading with an invalid pattern (`MTL014`) is left out of this list and
    of the `MTL611` child lists.
  - The target index of each heading is its positional match (the first instance for a
    repeat heading). A heading without a match is skipped. The list of indices must be
    non-decreasing.
  - The message lists the texts of the file-scope template headings, and the texts of the
    target headings whose level is at most the deepest level of that list. That level is at
    least 2, so a template with H1 and H2 only prints the same lists as before C10.
- `MTL611` (section scope, new).
  - For each checked template heading P that is matched and not template-only, the list holds
    the direct children of P (the section-scope template headings whose template parent is P),
    in template order, whatever their presence mode. Their matches must be in non-decreasing
    target order.
  - The message lists the texts of those children, and the texts of the target headings
    inside the section of the match of P whose level is at most the deepest level of the
    children. There is at most one finding per P.
  - Why per parent: a reordered sibling group is reported once on its parent, not once per
    heading. A heading moved under another parent is a scope question (`MTL601`/`MTL610`),
    not an order one. `MTL604` keeps the file scope for H1/H2 unchanged.
  - Within one level the positional run is ordered by construction. So `MTL611` can occur
    only when the child list of P holds a DEEPER child before a SHALLOWER one (`## P`,
    `#### D`, `### S`: both are direct children of P). That template shape is also the
    template error `MTL019` (2.7, worked example 3 below). `MTL611` stays a target finding:
    the template is used as written.

In both checks, extra target headings are left out of the order lists (they get `MTL616` or an
error of their own, grammar.md "Extra"). Missing headings are covered by presence, not by
order. Within one sequence the positional run takes siblings in template order by
construction, so two headings of one level and scope can no longer be out of order. A swapped
pair shows as a missing heading (`MTL601` with its "found later" hint, `MTL610`, `MTL605`) or as
a mismatch (`MTL606`). `MTL604` and `MTL611` only report an order across levels, for example an
H2 matched before the H1 that precedes it in the template. Why: the run already states the
order of one level; the order codes keep the cross-level outline check of C10.

Content tags are all errors, checked on the target only. They are skipped when the template
heading has no match or is not checked, so a missing heading is reported once.

- The section checked is the positional match of the template heading (2.10 "Positional
  match"): the sibling its position took, for every presence mode, and each instance of a
  repeat heading.
- A sibling taken as a mismatch (`MTL606`) is not a match, so its content is not checked.
- Why: the position is what names a section, so the content rules read the section at that
  position, and a heading that failed its pattern is reported once.

The LABEL of the message:

- Exact-text heading: `Section '{text}'` for a file-scope heading and
  `Section '{parent} > {text}'` for a section-scope heading. `{text}` is the template text,
  equal to the target text, because an exact-text heading matches only its own text.
- Pattern heading (2.10): `Section '{text}' (pattern "{pattern}")` in file scope and
  `Section '{parent} > {text}' (pattern "{pattern}")` in section scope. `{text}` is the text
  of the checked TARGET heading (the match or instance). `{pattern}` is the pattern as written
  between the quotes of its tag, escapes included. Example: `Section 'Epic B - Release'
(pattern "Epic {char} - {text}"): [content:table] no markdown table row found` (worked
  example 7 of 2.10).

`{parent}` is the text of the matched target parent section (the match or instance of the
template parent). Why: the template text of a pattern heading is only an author hint (2.10
LABEL). The target text says WHICH instance failed, and the pattern says which template
heading asked for the content. An exact-text heading needs no pattern: its text is both.

| Tag                     | Rule                                                                                                                      | Code     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------- |
| `[content:non-empty]`   | Section body must not be blank.                                                                                           | `MTL701` |
| `[content:table]`       | Some line, trimmed, starts and ends with `\|` and has 2+ chars (a separator row counts).                                  | `MTL702` |
| `[content:list]`        | Some line starts (after whitespace) with a `-`, `*` or `+` bullet or `N.` / `N)` and then whitespace. Nested items count. | `MTL703` |
| `[content:min-lines:N]` | At least `N` non-blank lines in the body.                                                                                 | `MTL704` |
| `[content:max-lines:N]` | At most `N` non-blank lines in the body.                                                                                  | `MTL705` |

If a heading carries several `min-lines` (or `max-lines`) tags, the first (leftmost) one is
used. A malformed `N` (for example `[content:min-lines:abc]`) is only an `MTL012` warning and
never gives `MTL704` or `MTL705`.

The old `<!-- [rule] required -->` HTML comment has no effect. It is inert prose.

Sub-heading tag (change C10, ADR 0009):

| Tag                              | Rule                                                                                                                          | Code     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------- |
| `[content:subheadings:disallow]` | No target heading inside the matched section may be a heading the template does not list (whole subtree, every deeper level). | `MTL612` |

- Default without the tag: a target heading that no template heading lists is ALLOWED, at
  every level, as before (extra headings never were an error), as long as it sits after the
  last position of its sequence. An extra heading before or between template headings shifts
  the run (grammar.md "Extra", C10). An extra in the tail of a run is reported by the warning
  `MTL616` (grammar.md "Extra").
- The error opt-outs are this tag and `[content:subheadings:no-extra]` (`MTL615`, below).
  Where either gives an error for a heading, that error replaces the warning for it.
- There is no `allow` tag: a listed descendant cannot re-allow its own subtree, and one tag
  keeps the model small (the rejected alternative is in ADR 0009).
- Where: a template heading D of any level. Grammar: one more alternative of the existing
  `bodyContentTag` (`content` family, keywords `subheadings` and `disallow`). A bare
  `[content:subheadings]` or another argument is malformed (`MTL012`). In a frontmatter
  comment it is misplaced (`MTL013`). Written twice on one heading, it counts once.
- Effective when D is checked (above), has a match M and is not `[presence:template-only]`.
  An absent optional or conditional D has no effect. A template-only D has no effect and gets
  the template warning `MTL015` (2.7). The region of D is the target section of M: every
  target heading inside it, at every deeper level (the whole subtree, not only direct
  children).
- Listed: a target heading X in the region of D is listed when some checked template heading E
  in the subtree of D, not `[presence:template-only]`, has the level of X, has the text of X
  and has X in its scope.
  - Listing compares level and text only. A second target heading with the text of a listed
    heading is listed too; duplicates are not the concern of this tag.
  - A heading with a listed text at another level is NOT listed.
  - For a pattern heading E (2.10), "has the text of X" means "the text of X matches the
    pattern of E".
- Unlisted: X is unlisted when it is in the region of at least one effective D and is not
  listed for that D.
- Reported: `MTL612` is reported for an unlisted X only when no target ancestor of X (its
  target parent, that heading's parent, and so on) is itself unlisted.
  - So the topmost unlisted heading of a subtree is reported, and its descendants are not.
  - A listed heading does not reset the rule: an unlisted heading below a listed one is
    reported.
  - There is at most one `MTL612` per target heading. `{parent}` is the text of M for the
    innermost D for which X is unlisted: the message names the nearest tag the author wrote
    above X.
  - When two tagged template headings share one match across scopes, the first in template
    order owns the tie.
- A target heading that gets `MTL606` (a sibling that a pattern position took as a mismatch,
  2.10) never also gets `MTL612`. Like the `MTL603` case below, it still counts as unlisted for
  the topmost rule.
- A target heading that gets `MTL603` (the first sibling with the text of a checked
  `[presence:template-only]` template heading, 2.10 step 1) never also gets `MTL612`. This also
  holds outside the subtree of the tagged heading D. It still counts as unlisted for the
  topmost rule, so its descendants are not reported either.
- Listing is not matching. It reads levels and texts (or patterns), not positions, so a listed
  heading can still be extra in the positional run (a second `### Added`). That case is the
  concern of `[content:subheadings:no-extra]` below.
- Anchor: the line of the unlisted target heading (DIR5). So `disable-line MTL612` or
  `disable-next-line MTL612` silences one heading, and `disable-file MTL612` the whole file.
- Order and presence ignore the tag. `MTL604` and `MTL611` look only at template headings and
  their matches; an unlisted heading never changes an order result.

Why the whole subtree: the need is "nothing else under this heading" (a changelog release must
not hold a stray H3 or H4). With direct children only, every listed child would have to repeat
the tag. Reporting only the topmost unlisted heading gives one finding per stray block instead
of one per line. Allowing extras by default keeps every existing template valid without edits
and leaves documents free to add detail; the `MTL616` warning still shows each extra of a run.

Second sub-heading tag (ADR 0012):

| Tag                              | Rule                                                                                                                                      | Code     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `[content:subheadings:no-extra]` | Every direct target child of the matched section must be taken by a position of the template children (no extra and no undeclared child). | `MTL615` |

- Default without the tag: off. Extra headings stay allowed, with the `MTL616` warning
  (grammar.md "Extra"). A direct child that gets `MTL615` gets no `MTL616`.
- Where: a template heading D of any level. Grammar: one more alternative of
  `bodyContentTag`, `SUBHEADINGS COLON NO_EXTRA`, with the `TAG_STRICT` keyword `NO_EXTRA`
  (`no-extra`, case-insensitive). `[content:subheadings:no-extras]` or another argument is
  malformed (`MTL012`). In a frontmatter comment it is misplaced (`MTL013`). Written twice on
  one heading, it counts once. It may sit next to `[content:subheadings:disallow]` on one
  heading; both then apply.
- Effective like the disallow tag: D is checked, has a match M (each instance of a repeat
  heading) and is not `[presence:template-only]`. Otherwise it has no effect, and gets
  `MTL015` with the reason `the heading is [presence:template-only]` (2.7).
- Region: the DIRECT target children of M, that is the target headings inside the target
  section of M whose target parent is M (grammar.md "Parent"), at any level.
- Declared: a direct child X is declared when a position of a sequence of the template
  children of D (the template headings whose template parent is D, any level) took X, as a
  match or as a mismatch (`MTL606`).
- Reported: `MTL615` for each direct child X that is not declared, in file order. An X that
  gets `MTL603`, `MTL612` or `MTL614` is skipped: one heading gets one finding, and those
  codes say more. So the extras of the runs of D (the tails) are reported, and so is every
  direct child at a level where D has no template child. A deeper heading is never reported
  by D: it is the concern of the child that contains it (tag that child too).
- `{parent}` is the text of M. The anchor is the line of X (DIR5), and the finding is
  suppressible (DIR6).
- Order and presence ignore the tag, as for the disallow tag.

How the two tags differ (both are kept):

|                                                     | `[content:subheadings:disallow]` (`MTL612`)                                                   | `[content:subheadings:no-extra]` (`MTL615`)   |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Region                                              | whole subtree of M, every deeper level                                                        | direct target children of M only              |
| A heading passes when                               | some template heading of D's subtree lists its level and text (or pattern), anywhere in scope | a position of D's children took it in the run |
| Duplicate of a declared text (a second `### Added`) | listed, no `MTL612` (an extra in the tail: warning `MTL616`)                                  | extra in the tail, `MTL615` (no `MTL616`)     |
| Reported                                            | the topmost unlisted heading of each stray block                                              | each direct child not taken                   |

Why both: the disallow tag answers "only these kinds of heading below". The no-extra tag
answers "exactly the declared outline, nothing after it", which the positional run can state
and the listing rule cannot. Keeping both leaves every existing disallow template unchanged,
and each tag stays one plain sentence. A merged tag with a `subtree` / `direct` option would
need two readings of one tag for the same gain.

Worked example 1, exact-level mismatch (file `notes/guide.md`). Template:

<!-- prettier-ignore -->
```yaml
---
title: "string"
---

# Guide

## Context

### Decision
```

Target (line numbers on the left are not part of the file):

```text
1  ---
2  title: Setup guide
3  ---
4
5  # Guide
6
7  # Context
8
9  ### Decision
```

- Level-1 run: the sequence `# Guide` over the level-1 siblings, lines 5 and 7. `# Guide`
  takes line 5; line 7 `# Context` is in the tail, an extra heading: allowed, listed by one
  `MTL616` warning anchored on line 7.
- `## Context` (file scope, required): the level-2 run has no sibling (`# Context` is level
  1), so nothing is left for its position. `MTL601`, no anchor, and no "found later" hint
  (line 7 is level 1, not a sibling). Old behaviour (before C10): `# Context` matched and
  there was no finding.
- `### Decision` (section scope, parent `## Context`): the parent has no match, so it is not
  checked (no `MTL610`).
- `MTL604`: `Guide` has index 0, `Context` has no match and is skipped: no finding.
- Expected text output:

```text
  ✗ notes/guide.md
      error MTL601 Heading: Missing required heading: 'Context'
      warn  MTL616 Heading: 1 extra heading(s) at level H1 after the template headings: ['Context']
        7 | # Context
```

- Variant: lines 7 and 9 become `## Context` and `#### Decision`. `## Context` takes line 7;
  the level-1 run has no tail. `### Decision` is checked in the section of line 7: its
  level-3 run has no sibling (`#### Decision` is level 4): `MTL610`, anchored on the parent
  line 7. `#### Decision` is not in any run (the template has no level-4 heading under
  `## Context`): free detail, no `MTL616`, allowed without the disallow tag. Expected:

```text
  ✗ notes/guide.md
      error MTL610 Heading: Section 'Context': missing required heading 'Decision' (H3)
        7 | ## Context
```

Worked example 2, `[content:subheadings:disallow]` (file `CHANGELOG.md`). Template:

<!-- prettier-ignore -->
```yaml
---
version: "string"
---

# Changelog

## Unreleased [content:subheadings:disallow]

### Added [presence:optional] [content:list]

### Fixed [presence:optional] [content:list]

## Notes [presence:optional]
```

Target:

```text
1  ---
2  version: 1.2.0
3  ---
4
5  # Changelog
6
7  ## Unreleased
8
9  ### Added
10
11 - New flag.
12
13 #### Details
14
15 Text.
16
17 ### Misc
18
19 #### Sub
20
21 - Item.
22
23 ## Fixed
24
25 - Old bug.
```

- Positional runs. Level 2: the sequence `## Unreleased`, `## Notes` over the siblings
  lines 7 and 23: `## Unreleased` takes line 7; `## Notes` (optional) does not match line 23
  `## Fixed` and takes nothing; line 23 is in the tail (extra, allowed): `MTL616` lists it.
  Level 3 in the section of line 7: the sequence `### Added`, `### Fixed` over lines 9 and
  17: `### Added` takes line 9; `### Fixed` (optional) does not match `### Misc` and takes
  nothing; line 17 is in the tail, extra. Level 4 has no template heading, so lines 13 and
  19 are in no run (no tail, no `MTL616`).
- Region of `## Unreleased`: lines 7 to 22 (the next level-2 heading is line 23).
- Line 9 `### Added`: listed (template `### Added`, level 3, same text, in scope). It is
  also the match of `### Added`, so its `[content:list]` body (lines 10 to 16) is checked
  and holds `- New flag.`: no finding.
- Line 13 `#### Details`: no level-4 template heading under `## Unreleased`, so unlisted. Its
  ancestor `### Added` is listed, so it is the topmost unlisted heading: `MTL612`.
- Line 17 `### Misc`: unlisted, topmost: `MTL612`. The error replaces the `MTL616` warning
  for line 17, so the level-3 run of line 7 gives no `MTL616` (its list is empty). Line 19
  `#### Sub`: unlisted, but its ancestor `### Misc` is unlisted: not reported.
- Line 23 `## Fixed`: outside the region (level 2 ends it). Same text as `### Fixed` but
  another level: not a match of `### Fixed` (optional, absent: no finding) and allowed as an
  extra level-2 heading: the level-2 run gives `MTL616` `Heading: 1 extra heading(s) at
level H2 after the template headings: ['Fixed']`, anchored on line 23.
- Expected text output (errors, then the warning, in emission order, 4.3 "heading"):

```text
  ✗ CHANGELOG.md
      error MTL612 Heading: Section 'Unreleased': heading 'Details' at level H4 is not in the template [content:subheadings:disallow]
        13 | #### Details
      error MTL612 Heading: Section 'Unreleased': heading 'Misc' at level H3 is not in the template [content:subheadings:disallow]
        17 | ### Misc
      warn  MTL616 Heading: 1 extra heading(s) at level H2 after the template headings: ['Fixed']
        23 | ## Fixed
```

- Variant, exact level under the tag: line 9 becomes `#### Added`. It is level 4, so it is not
  listed (`### Added` is level 3): `MTL612` for `'Added' at level H4` on line 9. Line 13
  `#### Details` is still reported: its parent is the nearest heading before it with a lower
  level, which is `## Unreleased` (line 7), not line 9 (same level). Three errors: lines 9,
  13 and 17. Line 19 stays unreported (its parent, line 17, is unlisted). The `MTL616`
  warning for line 23 stays.
- Variant, suppression: `<!-- md-template-lint disable-line MTL612 -->` at the end of line 17
  removes the second error (`Suppressed:   1`). Line 17 still gets no `MTL616`: which code
  reports a heading is decided before suppression, which only filters the output (4.1 step
  8, DIR10).
- Variant, no tag: without `[content:subheadings:disallow]` there is no error and the file
  passes (`✓ CHANGELOG.md`) with two warnings: `MTL616` `Heading: Section 'Unreleased': 1
extra heading(s) at level H3 after the template headings: ['Misc']` on line 17, then the
  `MTL616` for line 23 (the level-3 sequence ends at `### Fixed`, which comes before
  `## Notes` in the template, 4.3 emission order).
- Variant, no-extra instead of disallow: template line `## Unreleased
[content:subheadings:no-extra]`. The direct target children of line 7 are lines 9 and 17
  (the target parent of line 13 is line 9, of line 19 is line 17). Line 9 was taken by
  `### Added`; line 17 was taken by no position: one error, which replaces the `MTL616` for
  line 17; lines 13 and 19 are not reported:

```text
  ✗ CHANGELOG.md
      error MTL615 Heading: Section 'Unreleased': heading 'Misc' at level H3 is not declared at this position [content:subheadings:no-extra]
        17 | ### Misc
      warn  MTL616 Heading: 1 extra heading(s) at level H2 after the template headings: ['Fixed']
        23 | ## Fixed
```

- Variant, a duplicate group: under the no-extra tag, line 17 reads `### Added`. The
  level-3 run: `### Added` takes line 9, `### Fixed` does not match line 17, so line 17 is
  extra: `MTL615` for `'Added' at level H3` on line 17, no `MTL616` for it (line 19 is not a
  direct child of line 7). Under the disallow tag the same target gives no error for line 17
  (its level and text are listed), so the warning `MTL616` `Heading: Section 'Unreleased': 1
extra heading(s) at level H3 after the template headings: ['Added']` lists it; line 19
  `#### Sub` is now the topmost unlisted heading of its block (its parent, line 17, is
  listed): `MTL612` on lines 13 and 19. The `MTL616` for line 23 stays in both.
- Variant, template-only: `## Authoring checklist [presence:template-only] [content:subheadings:disallow]`
  gives the `--verify` warning `MTL015` `Heading 'Authoring checklist': tag
[content:subheadings:disallow] has no effect (the heading is [presence:template-only])`
  (a template warning: a lint run does not print it, 2.7).

Worked example 3, a child order conflict (`MTL019` and `MTL611`). Config
`md-template-lint.yml` with one pair, template `templates/guide.template.md`, include
`notes/*.md`, no description. Template:

```text
1  ---
2  title: "string"
3  ---
4
5  # Guide
6
7  ## Setup
8
9  #### Details
10
11 ### Steps
```

Target `notes/guide.md`:

```text
1  ---
2  title: x
3  ---
4
5  # Guide
6
7  ## Setup
8
9  ### Steps
10
11 #### Details
```

- Template parents: line 9 `#### Details` has parent `## Setup` (line 7, the nearest lower
  level before it); line 11 `### Steps` has parent `## Setup` too (line 9 is level 4, not
  lower). Both are section-scope direct children of `## Setup`, the deeper one first:
  `MTL019` on line 11, column 1, `{prev}` `Details`, `{prevLine}` 9, `{parent}` `Setup`.
- Lint phase, template as written. `# Guide` takes line 5, `## Setup` takes line 7. In the
  section of line 7 (lines 7 to 11): the level-3 run takes line 9 for `### Steps`, the
  level-4 run takes line 11 for `#### Details` (line 11 lies inside the section of line 7).
  `MTL611` for `## Setup`: the children in template order are `Details`, `Steps`, their
  matches lines 11 and 9, decreasing. Template list `['Details', 'Steps']`; target list: the
  headings inside the section of line 7 at level 4 or less, `['Steps', 'Details']`. No tail,
  no other finding.
- Expected output of `md-template-lint --format plain` (exit 1):

```text
md-template-lint 1.0.0
Config: md-template-lint.yml
========================

Template: templates/guide.template.md
Target:   notes/*.md (1 file(s))

  FAIL templates/guide.template.md (template)
      error MTL019 Heading 'Steps' (H3): comes after the deeper child 'Details' (H4, line 9) under 'Setup'
        11 | ### Steps
           | ^
  FAIL notes/guide.md
      error MTL611 Heading: Section 'Setup': heading order mismatch: template order ['Details', 'Steps'] vs target order ['Steps', 'Details']
        7 | ## Setup

========================
Summary
========================
Total files:  1
Passed:       0
Failed:       1
Warnings:     0 (in 0 file(s))
Templates:    1 checked, 0 broken

Failed templates:
  - templates/guide.template.md

Failed files:
  - notes/guide.md

========================
```

- `--verify` of the same template: `FAIL templates/guide.template.md`, the table, then the
  section (8.3):

```text
Child headings out of level order:
  - Heading 'Steps' (H3): comes after the deeper child 'Details' (H4, line 9) under 'Setup' (line 11, column 1)
      11 | ### Steps
         | ^
```

with `Errors:       1` in the summary, exit 1.

- Variant, fixed template: lines 9 and 11 swapped (`### Steps`, then `#### Details`, now a
  child of `### Steps`): no `MTL019`; `#### Details` is checked in the section of target
  line 9 and takes line 11, no `MTL611`: `PASS notes/guide.md`, `All files passed!`, exit 0.

### 2.7 Inert, unknown and malformed tags

- The old marker `[rule]` is inert and never reported.
- An UNKNOWN tag is a bracket that looks like a tag (only letters, digits, `_`, `:`, `-`) but
  is not a known tag, not `[rule]` and not a known type token (the 17 type names of section 3).
  It gives the warning `MTL010` on a field and `MTL011` on a heading, and is otherwise ignored.
  Brackets in prose (`['a', 'b']`) are not tag attempts.
- On a heading, only the single leftover trailing bracket is considered for `MTL011`.
- A MALFORMED tag is a tag of a known family with a bad argument (`[count:min:abc]`,
  `[filename:case:Snake]`, an unterminated `[presence:`). It gives the warning `MTL012` with
  line and column. It used to be reported as unknown (`MTL010`/`MTL011`); the code is new, the
  severity is the same. The dropped `[presence:exist]` is such a tag (2.6 "Dropped tag").
- A MISPLACED tag is a known, well-formed tag in the wrong region: a heading-only tag written
  in a frontmatter comment, or the reverse. It gives the warning `MTL013` with line and column
  and has no effect on linting. It is neither unknown nor malformed. New code (change C05);
  such tags used to be ignored.
- Heading tags are read on every level (change C10). A bracket on an H3 to H6 template line is
  peeled and gives `MTL011` to `MTL013` exactly like on H1 and H2. Before C10, H3 to H6 lines
  were not read: their brackets stayed text and gave no warning.
- A TAG CONFLICT is a known, well-formed heading tag that cannot have any effect on its
  heading. It gives the warning `MTL015` with the line and column of the tag, has no effect on
  linting and is never suppressible (DIR6). New code (change C10). The message is
  `Heading '{text}': tag {tag} has no effect ({reason})`, with `{tag}` as written. The reasons
  defined today (one per case; later epics add theirs, section 9):
  - `[content:subheadings:disallow]` or `[content:subheadings:no-extra]` on a
    `[presence:template-only]` heading: reason `the heading is [presence:template-only]`. Why:
    a template-only heading never has a match in a valid target, so the tag can never apply,
    and a silent no-op would hide an authoring mistake.
  - `[unique-headings-names]` (2.11) on a `[presence:template-only]` heading: same reason and
    rationale (the tag has no region). One warning per tag as written.
  - Heading patterns (2.10, change C12) add two reasons, with the same rationale: the tag can
    never apply, so the author is told. The tag is ignored, the heading keeps its other tags,
    and the position is the first tag of the ignored kind. A heading whose pattern is invalid
    (`MTL014`) gets no `MTL015` for its pattern, repeat or order tags (one cause, one warning).
    The reasons:
    - `[pattern:...]`, `[repeat-rules:...]` or `[order:...]` on a `[presence:template-only]`
      heading: reason `the heading is [presence:template-only]`. The heading stays
      template-only by text.
    - `[repeat-rules:...]` or `[order:...]` on a heading without a `[pattern:...]` tag: reason
      `the heading has no [pattern:...]`. An order tag there gets this warning only, never
      `MTL030`: the missing pattern is the first cause.

    Three former reasons no longer exist. The reason for these tags on an `exist` heading is
    gone because the tag is dropped (2.6). `the pattern has no orderable placeholder` is gone
    because an order tag now reads the heading text, not placeholder values, so every repeat
    heading can be ordered (2.10). An order tag on a pattern heading without a repeat tag
    (reason `the heading has no [repeat-rules:...]`) is now the template ERROR `MTL030`
    (below).
- An INVALID PATTERN is an unknown placeholder, an unknown format option, a bad escape or
  another invalid pattern in a `[pattern:"..."]` tag. It gives the warning `MTL014` with the
  line and column of the offending part and is never suppressible (DIR6). New code (change
  C12). Reasons and rationale are in 2.10. A heading whose pattern is invalid gets no
  `MTL015`, no `MTL017`, no `MTL018` and no `MTL030`, and it is left out of every `MTL019`
  child list. As a PARENT it still gets `MTL019` (below).
- A DUPLICATE PATTERN is two ADJACENT positions of one template sequence that are pattern or
  exact-text headings with the same pattern. The sequence is the one of grammar.md
  "Sequence" (same level, same scope), taken from the template without the target-dependent
  "checked" filter, as in 2.10. An exact-text heading is the literal pattern of its text, so
  `## Notes` twice in a row, or `## Notes` next to `## [pattern:"Notes"]`, count. It gives the
  ERROR `MTL017` (heading-pattern-duplicate) on the later heading, with its template line and
  the column of the `[` of its pattern tag (the first character of its text for an exact-text
  heading). It is never suppressible (DIR6) and is a TEMPLATE ERROR (below). New code.
  Definition and rationale are in 2.10.
- A CONTRADICTORY MINIMUM is a repeat heading (2.10) whose presence is `[presence:optional]`
  and that carries an explicit `[repeat-rules:same-level:min:N]` (`N` is 1 or more by the
  grammar). It gives the ERROR `MTL018` (heading-optional-min-conflict) with the template line
  of the heading and the column of the `[` of that `min` tag. It is never suppressible (DIR6)
  and is a TEMPLATE ERROR (below). New code. Definition and rationale are in 2.10 "Repeat
  rules".
- A CHILD ORDER CONFLICT is a template heading P whose CHILD LIST holds a heading after a
  DEEPER one (a higher level number). The child list is the section-scope template headings
  whose template parent is P, in template order: the list of `MTL611` (2.6 "Order"). It gives
  the ERROR `MTL019` (heading-child-order-conflict). New code. In detail:
  - P is any template heading that is not `[presence:template-only]` (the descendants of a
    template-only heading are never checked, 2.6). The template phase has no target, so
    "checked" plays no other part.
  - A P whose own pattern is invalid (`MTL014`) gets `MTL019` too, so such a template reports
    both codes. Why: the child order is a property of the outline under P, not of the pattern
    of P, and fixing the pattern alone must not reveal a second template mistake one run
    later.
  - The child list leaves out `[presence:template-only]` children (they never match) and
    children whose pattern is invalid (`MTL014`; they are not positions).
  - A child C is OFFENDING when some earlier child of the list has a higher level than C.
    There is ONE `MTL019` per P, on the FIRST offending child C in template order. `{prev}` is
    the first earlier child (in template order) with a higher level than C.
  - Position: the template line of C, column 1, because the level (written by the `#` marks)
    is the problem. `{text}` and `{prev}` are template texts or labels (2.10), `{n}` and `{m}`
    the levels of C and of `{prev}`, `{prevLine}` the template line of `{prev}`, `{parent}`
    the text or label of P.
  - Severity ERROR, category `syntax`, phase `template`, a TEMPLATE ERROR (below). In a lint
    run it is printed on the template file with exit 1, and the targets are still linted. In
    `--verify` the template FAILS, exit 1, section `Child headings out of level order:` (8.3).
    Never suppressible (DIR6).

  Only this shape lets `MTL611` fire (2.6 "Order"): within one level the run is ordered, and a
  shallower heading after a deeper one under P is a direct child of P only when the template
  skips a level. The template is used as written in a lint run, so a target in the natural
  outline order (the shallower heading, then the deeper one inside it) gets `MTL611`. Why: a
  child list that climbs back up a level says "this deeper heading comes first, outside the
  shallower one", which a document almost never means (the deeper heading was meant inside the
  shallower one, or a level is mistyped). The author learns it once from the template instead
  of from `MTL611` on every target. There is one finding per P, as for `MTL611`, because the
  cause is the outline under P. Column 1, because no tag is at fault. See worked example 3 of
  2.6.

- An ORDER WITHOUT REPEAT is an `[order:...]` tag (any form, 2.10 "Order") on a PATTERN
  HEADING (2.10: an effective, valid pattern, not `[presence:template-only]`) that has no
  `[repeat-rules:...]` tag of any of the three kinds. It gives the ERROR `MTL030`
  (heading-order-without-repeat). New code; it replaces the `MTL015` reason
  `the heading has no [repeat-rules:...]`. In detail:
  - The order tag is the effective one (the first of its kind, 2.10). There is one finding per
    heading. A heading without a pattern, a template-only heading and a heading with an
    invalid pattern get their `MTL015` or `MTL014` instead, never `MTL030` (one cause, one
    finding).
  - Position: the template line of the heading, and the column of the `[` of the order tag.
    `{text}` is the label (2.10), `{tag}` the order tag as written.
  - Severity ERROR, category `syntax`, phase `template`, a TEMPLATE ERROR (below). In a lint
    run it is printed on the template file with exit 1, and the targets are still linted. In
    `--verify` the template FAILS, exit 1, section `Order tags without repeat:` (8.3). Never
    suppressible (DIR6).
  - In a lint run the template is used as written. The heading is a single (not repeat)
    position that takes one sibling, so the order tag compares nothing and has no effect.

  Why: an order compares the instances of one repeat set. An order tag without a repeat tag
  says "these headings are ordered" while the template allows one heading only. The author
  almost always forgot the repeat tag (worked example 7 J of 2.10), and the targets then show
  the would-be instances as extras. It is an error, not the former `MTL015` warning, because
  the template cannot state what its author meant (the reason `MTL017`, `MTL018` and `MTL019`
  are errors), and a warning stays invisible outside `--verify`.

- TEMPLATE ERRORS are `MTL017`, `MTL018`, `MTL019` and `MTL030`: template-phase diagnostics of
  severity error that do not make the template broken (it parses, and its schema is known).
  They act in BOTH modes:
  - In a lint run each one is printed as an error on the TEMPLATE file, in the block of every
    pair that uses it, before its targets (8.2), and makes the run exit 1 (7.5). The targets
    are still linted with the template as written (the greedy steps of 2.10, the tags as they
    are).
  - In `--verify` the template FAILS with exit 1 (7.3). Its table and sections are still
    printed.
  - Why: a template error means the template cannot state what its author meant, so every run
    must stop CI, not only a `--verify` step that a project may not run. Linting the targets
    anyway keeps their own findings visible (the template can be read, unlike a broken one,
    which skips its targets). There is one finding per template, not one per target, because
    the cause is in the template. They are not suppressible, because the template carries no
    directives (DIR4).
- A MISSING DATE FORMAT is a template field of type `date` without a `[format:date]` tag, or of
  type `list-of-date` without a `[format:elements:date]` tag. It gives the warning `MTL016` on
  the template key line, column 1. It has no effect on linting (the default date shapes of 3.3
  apply) and is never suppressible (DIR6). New code (change C11). Details and rationale are in
  2.9.
- A FRONTMATTER TAG CONFLICT is a well-formed `[frontmatter:optional]` (2.12) that has no
  effect: a later standalone comment line (the first one stays effective), the tag after a
  `key:` or the tag beside other comment text. It gives the warning `MTL031` with the line and
  column of the tag's `[`, has no effect on linting and is never suppressible (DIR6). New code
  (change C14, ADR 0015). One finding per such tag, in source order. The messages (rule
  `frontmatter-tag-conflict`, `src/rules/syntax.ts`) are:
  - a duplicate standalone line: `Comment line {line}: tag [frontmatter:optional] has no effect (already set on line {first})`, `{first}` the line of the first standalone line;
  - the tag after a key: `Field '{key}': tag [frontmatter:optional] has no effect (it must be alone on its comment line)`;
  - the tag in mixed comment text (`# note [frontmatter:optional]`): `Comment line {line}: tag [frontmatter:optional] has no effect (it must be alone on its comment line)`.

  The tag is printed as the code writes it in the message (`[frontmatter:optional]`, lower
  case) whatever the case in the template. Why a warning and not silence (as for the filename
  and unique-names tags on a key line): the author opted in to a file-level switch, and a
  switch that silently does nothing hides the mistake. A tag in a heading is `MTL013`, a
  malformed one `MTL012`, a typo `MTL010`; none of them is `MTL031`.

- Template WARNINGS (unknown, malformed, misplaced and conflicting tags, invalid patterns,
  missing date formats, conflicting frontmatter tags: `MTL010` to `MTL016` and `MTL031`) are
  shown by `--verify` alone. A lint run does
  not print them, and they change neither its findings nor its exit code. Template ERRORS
  (`MTL017`, `MTL018`, `MTL019`, `MTL030`) are shown by both modes (above).
- The parser layer reports only a region, a reason (unknown, malformed, wrong-region), a
  location and the subject. The rule file `src/rules/syntax.ts` owns the code, the severity
  and the message text (ADR 0002).
- Tags in a target file are inert. Only trailing heading tags are stripped (2.6). Disable
  directives (4.4) are comments, not tags.

### 2.8 The `[io:exists]` tag

This is the only tag that touches the file system or the network. It is opt-in, written in the
template only, and checked on targets only. EVERY finding is a warning and never changes the
exit code. It is a no-op on other types.

Each item is checked on its own; a list contributes one check per non-blank string item:

1. A value shaped `@<name>/<rest>` (name `[A-Za-z0-9_-]+`): `<name>` is looked up in the config
   `aliases`. When approved, the path is joined and tested for existence (`MTL802` when
   missing). When not approved: `MTL801`, not checked. Aliases are never guessed.
2. An absolute value (drive letter, or a leading `/` or `\`) is never probed directly. If it
   lies inside one of the config `approvedPaths`, it is tested like a relative path (`MTL804`).
   Otherwise it is `MTL803` (skipped).
3. Anything else is relative. It is resolved against the ROOT of the pair that matched the
   target (changed, D11) and tested (`MTL804`).
   - Accepted residual: relative values and alias rests are NOT contained. A `..` segment may
     leave the pair root or the alias root, so `approvedPaths` only restricts absolute values.
     The result is only a warning that tells whether a file exists.
   - The printed text keeps `..` unfolded. The existence probe and the `approvedPaths`
     containment test use the same lexically folded path. So on POSIX, a symlinked segment
     before `..` can resolve differently from a physical resolution (accepted).
   - A root prefix inside an alias rest (`@a//etc/x`) is stripped and joined under the alias
     root.
4. A URL is probed with HTTP HEAD and a 5 second timeout, retried once with GET if HEAD fails.
   A 2xx or 3xx status is reachable and silent. Anything else (other status, timeout, DNS
   failure, refused connection, any exception) is `MTL805` with a reason of at most 60
   characters. The body is never read. The probe never throws.
   Network policy (changed, SSRF hardening, C07):
   - Only `http:` and `https:` are probed. Any other scheme is refused before any I/O
     (`unsupported scheme`). User info in the URL is stripped and no cookie or auth header is sent.
   - Redirects are never followed; a 3xx status counts as reachable.
   - Loopback, 0.0.0.0/8, link-local (169.254.0.0/16, fe80::/10), cloud metadata, multicast and
     reserved ranges, IPv4-mapped IPv6 and numeric host spellings are refused (`blocked address`).
     RFC 1918, 100.64.0.0/10 and fc00::/7 are refused unless config `allowPrivateNetworks` is
     `true` (AS8). The RESOLVED address is checked at connect time (DNS rebinding).
   - Each URL is probed once per run; a run is capped at 100 distinct URLs (`url budget exceeded`).
   - Reasons come from a fixed vocabulary: `HTTP <status>`, `timeout`, `DNS failure`,
     `connection refused`, `blocked address`, `unsupported scheme`, `invalid URL`,
     `url budget exceeded`, `request failed`. Remote text is never echoed.

   Trust boundary: the config file is trusted. Its `template`, `templateRoot`, `roots`, `aliases`
   and `approvedPaths` accept `~`, absolute paths and `..`. Document values only feed existence
   checks (a warning), never reads. Symlinked target files are followed and read; directory
   symlinks are not traversed. On Windows a UNC path in any config path value triggers SMB/NTLM
   authentication to that host.

Existence tests swallow every OS error and treat it as "does not exist". No network access
happens unless a template uses `[io:exists]` on a url type.

### 2.9 Field formats (`[format:semver]`, `[format:date]`)

Four inline-comment tags of the `format` family constrain the shape of a frontmatter value
(change C11, ADR 0010, AS16). They bind to a top-level key like every inline-comment tag
(2.1). On a heading they are misplaced tags (`MTL013`, 2.7).

Tag grammar (informal; `grammar/*.g4` is normative):

```text
fieldFormat    = "[format:" shape "]"
elementsFormat = "[format:elements:" shape "]"
shape          = "semver" | "date"           ; case-insensitive, like every format keyword
```

A bad argument (`[format:dates]`, `[format:elements:semvers]`) is a malformed tag (`MTL012`,
2.7), as for any known family. Why: one family holds every value shape. The `elements:` form
already exists for case styles (`MTL303`), so a list rule reads the same for every shape.

Terms (defined here, used in 2.9, 3.4 and the `shape` rows of 4.3):

- SEMVER: a semantic version of SemVer 2.0.0. Value pattern (not a tag pattern; it lives in
  `src/engine/values.ts` like the case styles of 2.3):

  ```text
  semver = num "." num "." num ("-" pre ("." pre)*)? ("+" build ("." build)*)?
  num    = "0" | [1-9] [0-9]*                    ; no leading zero
  pre    = num | [0-9]* [A-Za-z-] [0-9A-Za-z-]*  ; a numeric part has no leading zero
  build  = [0-9A-Za-z-]+
  ```

  No `v` prefix: `v1.2.0` is not a SEMVER. ASCII digits and letters only (C06). Why: the
  published SemVer 2.0.0 grammar is the one unambiguous definition, and its FAQ states that
  `v1.2.3` is not a semantic version; a `v` is a tag name convention.

- ISO DATE: a value of shape `YYYY-MM-DD` (`^\d{4}-\d{2}-\d{2}$`) that names a real calendar
  date, year 1 or later, by the calendar test of the type `date` (3.4: `2025-02-29`,
  `2026-13-40` and year `0000` fail). The ongoing marker and the other three shapes of 3.3 are
  not ISO dates. Why: one sortable, unambiguous shape, the one changelogs and frontmatter
  dates use.
- DEFAULT DATE PARSING: what the type `date` accepts today (the 3.3 shapes and the ongoing
  marker, with the 3.4 calendar test). The format of a field decides how its value is PARSED.
  With `[format:date]` (`[format:elements:date]` for list items) only an ISO DATE is accepted.
  Without it the default date parsing applies, and `--verify` says so (`MTL016`).

Both predicates test the exact text of the value, without trimming (AS16).

- A value with leading or trailing whitespace is not a SEMVER and not an ISO DATE, so
  `1.2.0` with a space around it gives `MTL306`. Only a quoted YAML string can carry such
  whitespace; the YAML loader already strips an unquoted scalar.
- A padded date on a `date` field still passes the default date parsing (the type `date`
  trims, C06), so `[format:date]` reports it as `MTL307`: a real date in the wrong shape.
- Why: a format tag states the exact shape the author wants. Silently accepting padding would
  hide the very drift the tag exists to catch.
- A message prints the value as loaded.

Checks (field step `shape`, the last step of 4.1 step 3). They run only on a present,
non-empty value:

- `[format:semver]`: a scalar string value that is not a SEMVER is `MTL306`. A list or a
  mapping is skipped (the type rule reports the shape).
- `[format:date]`: a scalar string value that is not an ISO DATE. When the field type is
  `date`, `MTL307` fires only if the value passes the default date parsing (`2026-10`, `2026`,
  `31/12/2026`, `present`); a value that fails it is `MTL504` (type rule) and gets no `MTL307`.
  For every other field type (`string`, `enum`, ...) the value gets `MTL307`, because no type
  rule checks dates there. A list or a mapping is skipped.
- `[format:elements:semver]`: on a list value, one `MTL308` listing every item that is not a
  SEMVER (`{pylist}` form, Q02). Items are tested as their text (as `MTL303`), so a nested list
  or mapping is listed. Skipped when the value is not a list.
- `[format:elements:date]`: on a list value, one `MTL309` listing every item that is not an
  ISO DATE, except, when the field type is `list-of-date`, the items that fail the default
  date parsing (`MTL513` lists those). Skipped when the value is not a list.
- Type mismatch edge cases: a `list-of-date` field with `[format:date]` and a scalar value
  gives `MTL513` (type) and `MTL307` (the "every other field type" rule above). A `date`
  field with `[format:elements:date]` and a list value gives `MTL504` (type) and `MTL309`
  (every item that is not an ISO DATE, since the type rule lists no items). The shape step
  never looks at the field type, except to defer to the default date parsing above.
- The scalar shape tags are one kind: of `[format:semver]` and `[format:date]` on one field,
  the first wins (2.1). The two elements shape tags are one kind too. Shape tags and case
  tags (`[format:snake_case]`, `[format:elements:kebab-case]`) are separate kinds: both run.
- No other interaction: the type rules and `[order:ascending]` (`MTL407`) keep the default
  date parsing, their codes and messages are unchanged.

Why one problem gives one error: a value that is no date at all keeps its type error
(`MTL504`, `MTL513`, same code and message, so targets that failed before fail the same way).
The format code adds only what the type cannot say: a real date in the wrong shape.
Why this step order: `shape` comes after the existing steps. Appending keeps the position and
the emission order of every existing code, and the type finding (the root problem) prints
before the format detail.

`MTL016` (template side, phase `template`) fires for every template field whose inferred type
(3.2) is `date` and whose inline comment has no effective `[format:date]` tag (the first tag of
its kind counts), and for every field whose type is `list-of-date` and whose comment has no
effective `[format:elements:date]` tag.

- One warning per field. `{tag}` is the missing tag.
- Position: the template key line (the last occurrence for a duplicate key, Q06), column 1.
- Shown by `--verify` only (section `Date fields without format:`, 8.3). It never changes the
  exit code (7.3) and is never suppressible (DIR6).
- A scalar tag on a `list-of-date` field (or the reverse) does not count: the target side
  skips it (above), so the template side warns.
- Why: the warning is about the template, so it is reported once per template, not once per
  target. It is a warning, not an error, because the default parsing is the long-standing
  behaviour and existing templates keep working. It cannot be suppressed, because a template
  carries no directives (DIR4).

Worked example 1, list fields with an elements format (target lint). Template
`release.template.md`:

<!-- prettier-ignore -->
```yaml
---
version: "1.0.0" # [format:semver]
released: 2026-01-01 # [presence:required] [format:date]
supported: ["1.0.0"] # [format:elements:semver]
milestones: ["2026-01-01"] # [format:elements:date]
---

# Release
```

Inferred types (3.2, no hint in the comments): `version` `string`, `released` `date`,
`supported` `list` (its item is not date-like, url-like or path-like), `milestones`
`list-of-date`. Target `notes/release.md` (line numbers on the left are not part of the file):

```text
1  ---
2  version: v1.2
3  released: 2026-1-5
4  supported: [1.2.0, 1.1.x, 2.0.0-rc.1]
5  milestones: [2026-01-15, 2026-02, 2026-13-01, present]
6  ---
7
8  # Release
```

- Line 2: `v1.2` has a `v` prefix and two parts: not a SEMVER, `MTL306`. Type `string`
  passes.
- Line 3: `2026-1-5` fails the default date parsing (no zero padding, 3.4): `MTL504` from the
  type step; `MTL307` stays silent (one problem, one error).
- Line 4: `1.2.0` and `2.0.0-rc.1` are SEMVERs, `1.1.x` is not: one `MTL308`. Type `list`
  passes.
- Line 5: `2026-01-15` is an ISO DATE. `2026-13-01` fails the default parsing: `MTL513` lists
  it and `MTL309` does not. `2026-02` and `present` pass the default parsing but are not ISO
  dates: `MTL309` lists them. Type step first, then `shape`.
- Expected text output (errors in emission order, field by field in template order):

```text
  ✗ notes/release.md
      error MTL306 Field 'version': value 'v1.2' is not a semantic version [format:semver]
        2 | version: v1.2
      error MTL504 Field 'released' (type=date): value is not a valid calendar date in an accepted format (YYYY-MM-DD / YYYY-MM / YYYY / DD/MM/YYYY / present / présent)
        3 | released: 2026-1-5
      error MTL308 Field 'supported': list contains entries not matching [format:elements:semver]: ['1.1.x']
        4 | supported: [1.2.0, 1.1.x, 2.0.0-rc.1]
      error MTL513 Field 'milestones' (type=list-of-date): list contains invalid date entries (expected a real calendar date in YYYY-MM-DD / YYYY-MM / YYYY / DD/MM/YYYY / present / présent): ['2026-13-01']
        5 | milestones: [2026-01-15, 2026-02, 2026-13-01, present]
      error MTL309 Field 'milestones': list contains entries not matching [format:elements:date]: ['2026-02', 'present']
        5 | milestones: [2026-01-15, 2026-02, 2026-13-01, present]
```

- Variant, valid versions: line 2 `version: 1.2.0` and line 4
  `supported: [1.2.0, 1.1.0, 2.0.0-rc.1]`: `MTL306` and `MTL308` disappear.
  `version: 1.2.0+build.7` passes; `version: 01.2.0` (leading zero) is `MTL306`.
- Variant, a real date in another shape: line 3 `released: 2026-01`. The default parsing
  accepts it, so no `MTL504`; it is not an ISO date:
  `error MTL307 Field 'released': value '2026-01' is not a YYYY-MM-DD date [format:date]`,
  excerpt row `3 | released: 2026-01`. `released: present` gives the same `MTL307` with
  `'present'`. `released: 2026-02-30` gives `MTL504` only.
- Variant, a non-date type: template `due: "string" # [format:date]` (type `string`).
  Target `due: soon` and target `due: 2026-02-30` both give `MTL307` (no type rule checks a
  date on a `string` field).
- Variant, suppression: line 3 `released: 2026-01 # md-template-lint disable-line MTL307`
  removes the finding (`Suppressed:   1`); `MTL307` anchors on the key line (DIR5).
- Variant, wrong tag form: the template has `milestones: ["2026-01-01"] # [format:date]`.
  The target value is a list, so `[format:date]` is skipped: no `MTL309`; `MTL513` still lists
  `2026-13-01`. `--verify` gives `MTL016` for `milestones` (`no [format:elements:date]`).

Worked example 2, a date field without format (`--verify`). Template `release.template.md`:

```text
1  ---
2  version: "1.0.0" # [format:semver]
3  released: 2026-01-01 # [presence:required]
4  history: ["2025-12-01"] # [presence:optional] [format:date]
5  ---
6
7  # Release notes
```

- Line 2: type `string`, not a date field: no `MTL016`.
- Line 3: type `date` (the value is date-like, 3.2), no `[format:date]`: `MTL016`.
- Line 4: type `list-of-date`; `[format:date]` is the scalar tag and `[format:elements:date]`
  is missing: `MTL016` naming the elements tag.
- Expected output of `md-template-lint --verify --format plain release.template.md` (exit
  0, warnings never fail; `<version>` is the package version):

```text
md-template-lint <version>
Config: (none)
Template syntax reference: https://github.com/m21-cerutti/md-template-lint/blob/main/docs/syntax-reference.md
========================

  PASS release.template.md
Field     Type          Rules
-----------------------------
version   string        presence:required, format:semver
released  date          presence:required
history   list-of-date  presence:optional, format:date

Headings:
  # Release notes (presence:required)

Date fields without format:
  - Field 'released' (type=date): no [format:date], default date formats apply (line 3, column 1)
      3 | released: 2026-01-01 # [presence:required]
        | ^
  - Field 'history' (type=list-of-date): no [format:elements:date], default date formats apply (line 4, column 1)
      4 | history: ["2025-12-01"] # [presence:optional] [format:date]
        | ^

========================
Summary
========================
Templates:    1 checked, 0 broken
Warnings:     2

All templates passed!
========================
```

- Variant, formats added: line 3 gains `[format:date]` and line 4 reads
  `history: ["2025-12-01"] # [presence:optional] [format:elements:date]`: no warning and no
  `Date fields without format:` section; the `Rules` column shows `format:date` and
  `format:elements:date`, and the summary shows `Warnings:     0`.
- Variant, normal lint run with line 3 unchanged: no `MTL016` is printed (template warnings
  show in `--verify` only, 2.7), and a target `released: 2026-10` passes (default date
  parsing).
- Variant, a target directive naming the code (`<!-- md-template-lint disable-file MTL016
-->`): `MTL022` (not suppressible, DIR6). DIR2 counts a code as known once its rule is
  registered, whatever the 4.3 table says; a code whose rule is not registered yet gives
  `MTL021` instead.

### 2.10 Heading patterns, repeat rules and order

Three heading suffix tags let one template heading stand for target headings whose text varies
(a release heading `## [1.2.0] - 2026-03-01`), repeat it, and order the repeats (change C12,
ADR 0011, AS17). Every template heading, with or without these tags, is matched by the
positional run of this section (ADR 0012; grammar.md "Match of T"). The decisions behind this
section are recorded in ADR 0011, ADR 0012 and AS17.

- The tags are body tags (2.6). In a frontmatter comment they are misplaced (`MTL013`, 2.7).
- Every heading level is checked (C10), and untagged H3 to H6 children stay required.
- Extra headings (the tail of a run, 2.6) stay allowed, and the extras of each run are listed
  by the warning `MTL616`, unless `[content:subheadings:disallow]` or
  `[content:subheadings:no-extra]` gives an error for them (2.6).

Tag grammar (informal; `grammar/*.g4` is normative):

```text
patternTag = "[pattern:" '"' patternText '"' "]"        ; patternText and escape: section 2
repeatTag  = "[repeat-rules:same-level" (":" bound ":" N)? "]"
bound      = "min" | "max"
N          = [1-9] [0-9]*                               ; 1 or more, ASCII digits
orderTag   = "[order:" ("first:" orderBy ":")? direction "]"
orderBy    = "number" | "date" | "semver"
direction  = "ascending" | "descending"
```

- Keywords are case-insensitive, as every tag keyword (section 2), placeholder names and
  format names included (`{SemVer}` is `{semver}`, `{semver:FORMAT:Major-Minor}` is
  `{semver:format:major-minor}`). The literal text of a pattern is case-sensitive.
- Malformed forms (`MTL012`, 2.7; the bracket stays in the heading text):
  - `[pattern:Release]` (no quotes);
  - an unclosed quote: `[pattern:"x]`, or `[pattern:"x\"]` where the only quote is escaped;
  - text between the closing `"` and `]`;
  - `[repeat-rules:same-level:min:0]`, `[repeat-rules:same-level:max]`,
    `[repeat-rules:other-level]`;
  - `[order:sideways]`, and the order forms `[order:first]`, `[order:first:number]`,
    `[order:first:version:ascending]`, `[order:last:number:ascending]`,
    `[order:first:number:up]`, `[order:first:date:descending:x]`.

  Why `N` is 1 or more: a minimum of 0 is what `[presence:optional]` already says (below), and
  a maximum of 0 contradicts a heading that must be present.

- `[order:ascending]` keeps its frontmatter meaning on a key line (`MTL407`, 2.3). On a
  heading it is the order tag of this section. `[order:descending]`, every `[order:first:...]`
  form, `[pattern:...]` and `[repeat-rules:...]` in a frontmatter comment are misplaced
  (`MTL013`).
- The first tag of a kind wins (as in 2.1). The kinds are `pattern`, `order` (all eight order
  forms are one kind), and three repeat kinds: `[repeat-rules:same-level]`, the `min` form and
  the `max` form.
- Escapes: inside the quotes, `\"` is a literal `"` and `\\` a literal `\`. The argument ends
  at the first `"` that is not escaped. A backslash followed by any other character is an
  invalid escape (`MTL014`, below); the lexer still pairs it with that character, so `\x`
  never ends the argument. Why: a backslash escape is the convention of every quoted string in
  Markdown tooling. Defining `\\` keeps a heading with a literal backslash writable. Refusing
  other pairs leaves room for later escapes. So a pattern can contain `"`.

Terms (defined here, used in 2.6, 2.7, 4.3, DIR5 and section 9):

- PATTERN: the text between the quotes after the escapes above, read left to right.
  - `{{` is a literal `{` and `}}` a literal `}`.
  - `{name}`, `{name:format:fmt}` or `{name:format:fmt:arg}` is a placeholder: a `{`, then any
    characters except `{` and `}`, then `}`. Its inner shape is checked below.
  - Every other character is literal text. So `{{semver}}` is the literal text `{semver}`.
  - No `v` prefix is implied: a project that writes `v1.2.0` uses `v{semver}`.
  - The PIECES of a pattern are its placeholders and its literal runs (the longest runs of
    literal characters between placeholders), left to right.
- PLACEHOLDERS. The vocabulary is fixed: `{text}`, `{number}`, `{digits}`, `{semver}`,
  `{date}`, `{char}`. There is no regular-expression placeholder. `{digits}` replaces the
  former `{int}` (breaking, pre-release): `{int}` is now an unknown placeholder (`MTL014`). The
  value of a placeholder is the exact text it covers. `{name:format:<fmt>}` restricts the
  value to one FORMAT of a fixed table, and `{name:format:<fmt>:<arg>}` gives the format its
  ARGUMENT. No option, or the option that names the default format, means the default.
  Placeholder shape (informal; names are matched case-insensitively, like every keyword):

  ```text
  placeholder = "{" name (":" "format" ":" fmt (":" arg)?)? "}"
  name, fmt   = one or more characters except "{", "}" and ":"
  arg         = one or more characters except "{", "}" and ":"
  ```

  Two formats take an argument and need it: `padding:N` of `{digits}` and `precision:N` of
  `{number}`. Every other format takes none. The argument of those two is ASCII digits, 1 or
  more, with no leading zero. Any other argument text is a wrong argument, `MTL014` (INVALID
  PATTERN below). The formats:

  | Placeholder | Default format                                       | Other formats (`{name:format:<fmt>}`, `{name:format:<fmt>:<arg>}`)            |
  | ----------- | ---------------------------------------------------- | ----------------------------------------------------------------------------- |
  | `{text}`    | `human`                                              | `snakecase`, `camelcase`, `screamcase`, `kebabcase`, `lowercase`, `uppercase` |
  | `{number}`  | `decimal`                                            | `scientific`, `precision:N`                                                   |
  | `{digits}`  | unnamed (cannot be written): digits, no leading zero | `signed`, `hex`, `uid`, `padding:N`                                           |
  | `{semver}`  | `full`                                               | `core`, `major-minor`                                                         |
  | `{date}`    | `full`                                               | `year-month`, `year`                                                          |
  | `{char}`    | none (no format may be written)                      | none                                                                          |

  LETTER classes (used by `{char}` and the `{text}` case formats): a LETTER is a
  Unicode code point of the general category Letter: `Lu` (UPPERCASE), `Ll` (LOWERCASE),
  `Lt` (titlecase), `Lm` and `Lo` (CASELESS letters, for example CJK). `D` is an ASCII digit
  (C06).

  NUMERIC TEXT (a value pattern, used by `{text}` and by the FIRST NUMBER of "Order" below):
  `-?D+(\.D+)?([eE][+-]?D+)?`, `D` an ASCII digit (C06): an optional `-`, digits (leading
  zeros allowed), an optional `.` followed by digits, an optional exponent. A value is PURELY
  NUMERIC when its whole text is a NUMERIC TEXT: `1`, `007`, `1.5`, `-2`, `1e5`, `1.5E-3`
  are; `1.2.0`, `v1`, `1.`, `.5`, `+1`, `1e`, `2026-10`, ` 1` are not.

  Each format, what it accepts and what it rejects (the whole value, never trimmed):

  - `{text}` / `human` (default): one or more characters, any (spaces included), except a
    PURELY NUMERIC value. Accepts `Release notes`, `1.2.0`, `v1`, `Épique`, `my_heading`;
    rejects the empty text, `2026`, `1.5`, `-3`, `1e5`.
  - The four `{text}` CASE formats (Unicode letters, and never digits only). A WORD
    is one or more characters of the format's word set. Each value holds at least one
    LETTER, so a digits-only value (`2026`, `2026_10`) is no case-format value.
  - `{text:format:snakecase}`: words joined by single `_`; word set: `Ll`, `Lm`, `Lo` and
    `D`. Accepts `my_heading`, `step_2`, `2_step`, `épique_été`, `данные_2`; rejects
    `2026`, `2026_10`, `My_heading`, `my-heading`, `my__heading`, `_x`, `my heading`.
  - `{text:format:camelcase}`: a first character in `Ll`, `Lm` or `Lo`, then characters in
    `Ll`, `Lu`, `Lm`, `Lo` or `D`. Accepts `myHeading`, `heading`, `step2`, `étéChaud`;
    rejects `MyHeading`, `my_heading`, `2step`, `2026`, `my heading`.
  - `{text:format:screamcase}`: words joined by single `_`; word set: `Lu`, `Lm`, `Lo` and
    `D`. Accepts `MY_HEADING`, `STEP_2`, `ÉTÉ_2`; rejects `2026`, `My_Heading`,
    `MY-HEADING`, `MY__HEADING`, `my_heading`.
  - `{text:format:kebabcase}`: words joined by single `-`; word set as `snakecase`. Accepts
    `my-heading`, `step-2`, `été-chaud`; rejects `2026`, `my_heading`, `My-heading`,
    `my--heading`, `-x`.
  - `{text:format:lowercase}`: one or more characters, at least one LETTER, and no
    `Lu` or `Lt` letter; any other character is allowed (spaces, digits, punctuation).
    Accepts `release notes`, `étape 2`, `v1.2 notes`; rejects `Release notes`, `2026`,
    `-`, the empty text.
  - `{text:format:uppercase}`: one or more characters, at least one LETTER, and no
    `Ll` or `Lt` letter; any other character is allowed. Accepts `RELEASE NOTES`,
    `ÉTAPE 2`, `V1.2 NOTES`; rejects `Release`, `2026`, the empty text.
  - `{number}` / `decimal` (default): `-?D+(\.D+)?`, leading zeros allowed. Accepts
    `0`, `10`, `007`, `01.5`, `1.5`, `0.25`, `-1.5`; rejects `+1`, `1.`, `.5`, `1e5`, `1,5`,
    `1 000`.
  - `{number:format:scientific}`: a `decimal` value as mantissa (leading zeros allowed),
    then an optional exponent `[eE][+-]?D+`. Accepts `1e5`, `01e5`, `1.5E-3`,
    `-2e+10`, `1.5`, `7`; rejects `1e`, `e5`, `1.5e-`, `1e5.0`, `+1e5`.
  - `{number:format:precision:N}`: `-?D+\.D{N}`, EXACTLY `N` decimals, leading zeros
    allowed, no exponent. `precision:2` accepts `1.50`, `01.00`, `-0.25`; rejects `1.5`,
    `1.500`, `1`, `1.50e0`.
  - `{digits}` (default; the former `{int}`): `0|[1-9]D*`, digits only, no sign, no
    leading zero except the single digit `0`. Accepts `0`, `7`, `42`, `2026`; rejects `-1`,
    `+1`, `07`, `1.0`, `1e3`.
  - `{digits:format:signed}`: `[+-]?(0|[1-9]D*)`, the default with an optional `+` or
    `-`. Accepts `42`, `+42`, `-7`, `0`; rejects `+07`, `--1`, `+`, `1.0`.
  - `{digits:format:hex}`: `[0-9A-Fa-f]+`, one or more hexadecimal digits of either
    case, leading zeros allowed, no `0x` prefix, no sign. Accepts `ff`, `0A3F`, `007`, `7`;
    rejects `0x1f`, `g1`, `-1`, the empty text.
  - `{digits:format:uid}`: `[A-Za-z0-9]+` holding at least one ASCII letter AND at
    least one ASCII digit (a user identifier). Accepts `U42`, `a1b2`, `42U`, `user7`; rejects
    `42`, `abc`, `U-42`, `U 42`, `É1`.
  - `{digits:format:padding:N}`: EXACTLY `N` ASCII digits, leading zeros allowed, no
    sign. `padding:3` accepts `007`, `042`, `123`; rejects `7`, `0007`, `-07`, `1234`.
  - `{semver}` / `full` (default): a SEMVER (2.9). `core`: `num.num.num` without pre-release
    or build (`1.2.0`); `major-minor`: `num.num` (`1.2`); `num` as in 2.9 (no leading zero).
  - `{date}` / `full` (default): an ISO DATE (2.9), `YYYY-MM-DD` and a real calendar date.
    `year-month`: `YYYY-MM`, month `01` to `12`, year `0001` or later (`2026-10`); `year`:
    `YYYY`, `0001` or later (`2026`).
  - `{char}`: exactly one Unicode code point of the general category Letter (`Lu`, `Ll`, `Lt`,
    `Lm`, `Lo`). Accepts `A`, `b`, `É`, `ß`, `ж`; rejects `1`, `_`, `AB`, the empty text, and a
    letter followed by a combining mark (two code points).

  Why these placeholders:

  - `{semver}` and `{date}` reuse the field-format predicates of 2.9, so a version or a date
    means the same in frontmatter and in headings.
  - `{digits}` covers numbered headings (`Step {digits}`), and its name says what it accepts
    (`{int}` suggested a sign it never took). `signed`, `hex` (hash-like ids), `uid` (ids such
    as `U42`) and `padding:N` (fixed-width numbers such as `007`) extend it.
  - `{number}` covers decimal values (`Version 1.5`, `-1.5`, `007`), with `scientific` for
    measured values (`1.5E-3`) and `precision:N` for a fixed number of decimals (`1.50`).
  - `{text}` covers a free part (`{semver} - {text}`). By refusing a purely numeric value, it
    keeps a number from passing as prose (example A below). Its case formats name the usual
    identifier styles, plus `lowercase` and `uppercase` for prose in one case, so an
    identifier-like heading part is checked by its shape.
  - `{char}` covers one-letter ids (`Epic {char} - {text}`).
  - The case formats accept every Unicode letter (headings are prose in any language,
    `épique_été`) and need at least one letter, so a number never passes as a case-format
    value (`2026` needs `{digits}`, `{number}` or `{date:format:year}`). The field case styles
    of 2.3 stay ASCII and unchanged.
  - `{digits}` refuses leading zeros, so `07` and `7` are not two spellings of one number.
    `{number}` allows them, because a measured or padded value is written as it is, and
    `padding:N` states an exact width.
  - An argument is written as one more `:` part (`{digits:format:padding:3}`), so the
    placeholder keeps one shape, and the argument is a plain number checked by `MTL014`.
  - The format table is fixed, one row per placeholder, so a template cannot invent a shape
    the linter does not know. `major-minor`, `year-month` and `year` are the short forms that
    changelogs and roadmaps use; `core` is a release without a pre-release tag.
  - `1.2.0` is not purely numeric (two dots), so it is a `{text}` value.

- INVALID PATTERN (`MTL014`): the first problem from the left, one warning per tag. Inside one
  placeholder the checks run in the order below (name, shape, format, argument):
  - an unknown placeholder name (`{version}`, `{}`, and `{int}`): reason
    `unknown placeholder {version}` (the placeholder as written), column of its `{`;
  - a placeholder with a colon that is not one of the forms `name:format:fmt` and
    `name:format:fmt:arg` with every part non-empty (`{semver:major-minor}`,
    `{semver:format:}`, `{digits:format:padding:}`, `{digits:format:padding:3:4}`): reason
    `malformed placeholder {semver:major-minor}`, column of its `{`;
  - a format that the table does not allow for that placeholder (`{semver:format:patch}`,
    `{digits:format:full}`, `{digits:format:decimal}`, `{text:format:upper}`,
    `{text:format:full}`, `{number:format:hex}`, `{char:format:upper}`): reason `unknown
format patch for {semver}`, column of its `{` (a default format name is allowed only
    for its own placeholder: `full` for `{semver}` and `{date}`, `human` for `{text}`,
    `decimal` for `{number}`; the default of `{digits}` has no name);
  - a format ARGUMENT problem, column of its `{`: a format that needs an argument
    written without one (`{digits:format:padding}`, `{number:format:precision}`): reason
    `format padding of {digits} needs an argument`; an argument that is not `[1-9][0-9]*`
    (`{digits:format:padding:0}`, `padding:03`, `padding:x`): reason `bad argument 0 for
format padding of {digits}` (the argument as written); an argument on a format that
    takes none (`{date:format:year:month}`, `{digits:format:hex:2}`): reason `format year of
{date} takes no argument`;
  - an unmatched brace: a `{` with no `}` before the next `{` or the end, or a `}` that is
    neither `}}` nor the end of a placeholder: reason `unmatched '{'` or `unmatched '}'`,
    column of that brace;
  - two placeholders with no literal text between them (`{digits}{text}`): reason `adjacent
placeholders {digits}{text}`, column of the second `{`;
  - a backslash followed by a character other than `"` and `\` (`\n`, `\{`): reason
    `invalid escape \n`, column of the backslash;
  - an empty pattern (`[pattern:""]`): reason `empty pattern`, column of the tag's `[`.

  The tag is still recognized and peeled, so the heading text stays clean. But the heading is
  not checked and is not a position (2.6). It gets no `MTL015` (2.7), no `MTL017`, no `MTL018`
  (below) and no `MTL030` (2.7). It is left out of every `MTL019` child list, but as a parent
  it still gets `MTL019` (2.7). It is a template warning (`--verify` alone, 2.7) and never
  suppressible (DIR6). Why: `MTL012` is for a tag whose shape is wrong (the bracket stays
  text), while `MTL014` names the exact problem inside a well-formed tag. A pattern that
  cannot be read matches nothing, and reporting a missing heading on every target would
  repeat one template mistake per file (the same reason `MTL016` is template-side).
  Adjacent placeholders are refused because their split is a guess (`{digits}{digits}` on
  `123`).

- MATCH: a pattern matches a target heading when its WHOLE stored heading text (2.6, as
  extracted) can be cut into consecutive parts, one per piece. A literal part equals its
  literal text; a placeholder part is a value of its placeholder (and format).
  - Nothing is trimmed (as in 2.9): a space in the pattern must be in the heading, and a value
    with a stray space is no value.
  - When several cuts exist, each placeholder, from left to right, takes the shortest part for
    which the rest still matches.
  - Every pattern matches the WHOLE heading text.
  - Why: anchoring to the whole text makes a pattern state the whole heading, and a fixed
    tie-break makes the cut, and so every placeholder value, deterministic.
- FAILING PIECE (named by `MTL606`), for a heading text the pattern does not match. Pieces 1 to
  k MATCH A HEAD of the text when some prefix of the text (the whole text when k is the number
  of pieces) can be cut into k parts, part i matching piece i. The failing piece is the piece
  k for the smallest k whose pieces 1 to k match no head.
  - It is printed as the placeholder as written, format and argument included (`{semver}`,
    `{semver:format:major-minor}`, `{digits:format:padding:3}`), or as its literal text in
    single quotes (`'['`, `' - '`).
  - Examples: `1.2 - 2026-10-01` against `{semver} - {date}` fails at `{semver}` (no prefix is
    a SEMVER). `[Unreleased]` against `[{semver}] - {date}` fails at `{semver}` (`[` matches,
    no SEMVER follows). `12a` against `{digits}` fails at `{digits}` (the last piece must
    cover the whole rest). `Item 7` against `Item {digits:format:padding:3}` fails at
    `{digits:format:padding:3}`.
  - Why: the user needs the part to fix, and "the first piece that cannot be satisfied" is
    deterministic and cheap (one left-to-right pass with the cuts above).
- PATTERN HEADING: a template heading with an effective `[pattern:"..."]` tag (valid, and not
  ignored by `MTL015`). Its own text, after peeling, is a LABEL. The label names the heading in
  `--verify`, in the template lists of `MTL604` and `MTL611`, and in the `heading` member of
  `MTL605`, `MTL607` and `MTL608` (8.1; an empty label gives `""` there). It is never compared
  and may be empty. Why: the pattern lives in a tag, so the heading text stays readable prose
  (`## Release`). A heading whose pattern tag is ignored by `MTL015` is an exact-text heading.
- Kinds of position (grammar.md "Sequence"). The EXIST position of the dropped `exist` tag is
  gone (2.6).
  - A LITERAL position is an exact-text heading, or a pattern heading whose pattern has no
    placeholder. An exact-text heading matches a sibling whose text equals its text, exact and
    case-sensitive: it is the literal pattern of its text.
  - A PLACEHOLDER position is a pattern heading whose pattern has at least one placeholder.
  - A REPEAT position, also called a REPEAT HEADING, is a pattern heading (literal or
    placeholder) with at least one effective `[repeat-rules:...]` tag (any of the three
    kinds).

Positional match (ADR 0012). The run is computed once per sequence and scope:

- in file scope, once per level, over the siblings of that level in the whole file;
- in section scope, once per level and per match or instance M of the template parent, over
  the siblings of that level inside the target section of M.

Steps:

1. Set aside. Take the siblings in file order. For each checked `[presence:template-only]`
   template heading U of this level and scope (file scope, or the same template parent), every
   sibling whose text equals the text of U is SET ASIDE: it takes no part in steps 2 to 4. The
   first of them, in file order, gets `MTL603` (one per U, as before). Why: a template-only
   heading must not appear at all, so where it appears is not a position question. Setting it
   aside reports it once and does not shift the run.
2. Positions. The positions of the sequence, in template order. A cursor starts at the first
   sibling that is not set aside. "The next sibling" is the sibling at the cursor. "Taking" it
   moves the cursor to the following sibling that is not set aside. "No sibling is left" means
   the cursor is past the last sibling.
3. For each position, in order, by kind:
   a. Retired: this step was the EXIST position of the dropped `exist` tag (`MTL602`,
   retired). The letters b to d keep their names so references stay valid.
   b. LITERAL, no repeat tag: if the next sibling matches, take it: the match. Else take
   nothing. Required: missing, `MTL601` (exact text, file scope), the first form of `MTL610`
   (exact text, section scope) or `MTL605` (pattern heading). Optional or conditional: no
   finding. HINT of `MTL601`: when some sibling from the cursor onward (not set aside, in file
   order) has exactly the text of the heading, the message names the line of the first such
   sibling: `Missing required heading: '{text}' (found later at line {line}, out of order)`.
   That sibling is later taken by another position or stays in the tail (then `MTL616` or
   another tail code still reports it, grammar.md "Extra"); the hint changes no match. A
   same-text sibling before the cursor (taken by an earlier position, example B) gives no
   hint. `MTL610` and `MTL605` keep their messages.
   c. PLACEHOLDER, no repeat tag: if the next sibling matches, take it: the match. Else, when
   no sibling is left: required `MTL605`, optional or conditional silent. Else (a sibling
   is left and does not match): required: take it as a MISMATCH, `MTL606` on it, and the
   heading has no match; optional or conditional: take nothing.
   d. REPEAT:
   1. Lead: if the next sibling does not match, the position is a placeholder position,
      it is required and a sibling is left: take that sibling as a mismatch (`MTL606`).
   2. Run: then take every next sibling that matches, until one does not match or no
      sibling is left. They are the INSTANCES, in file order; `n` is their number (0 or
      more). The instances of one run are the REPEAT SET of T in this scope (one per
      scope, so one per parent match or instance in section scope).
   3. Count: with an explicit `min` tag and `n` below it, `MTL607` (also when `n` is 0;
      then it replaces `MTL605`). Else, when `n` is 0, the position is required and step
      1 took nothing: `MTL605`. With an explicit `max` tag and `n` above it, `MTL608`. The
      `max` bound never stops the run: every matching sibling is an instance.
   4. Order: with an effective `[order:...]` tag, at most one `MTL609` (two or more
      instances with an order key) and, for the `first:` forms, at most one `MTL617`
      (an instance without key; "Order" below).
4. Tail. The siblings from the cursor onward are the tail: extra headings (2.6). For each
   repeat position T of the sequence, in template order, the tail siblings whose text
   matches T's pattern and that no earlier repeat position of the sequence already lists
   are listed in ONE `MTL614` (heading-repeat-miss) for T and this scope; no finding when the
   list is empty. Every other tail sibling, except one that gets `MTL615`
   (`[content:subheadings:no-extra]`) or `MTL612` (`[content:subheadings:disallow]`), or
   that lies inside a stray block whose topmost unlisted heading gets `MTL612` (2.6), is
   listed in ONE warning `MTL616` (heading-extra) for this run (this sequence and this
   scope: once per level in file scope, once per level and per parent match or instance in
   section scope), in file order, anchored on the first listed sibling; no finding when the
   list is empty. A run whose template headings are all REQUIRED
   exact-text headings with EMPTY text (the template-body line `# [unique-headings-names]`, 2.11)
   gives no `MTL616`; its `MTL601` stays the only finding. An optional, conditional or
   template-only heading (`## [presence:optional]`) or a pattern heading keeps its `MTL616` even
   when its text is empty after the tags are peeled (it has no `MTL601`). A tail sibling that gets `MTL613`
   (`[unique-headings-names]`) stays in this list (2.11 "Interplay", the `MTL616` overlap).
   `MTL616` does not list a heading that another run of the same level, which overlaps this one
   (a file-scope run and a section-scope run), takes as a match, takes as a mismatch (`MTL606`)
   or sets aside (step 1, `MTL603`): such a heading belongs to that run and is not an extra of
   this one. Pinned by `pass-heading-taken-by-an-overlapping-run-is-not-extra`,
   `pass-heading-set-aside-by-an-overlapping-run-is-not-extra` and
   `pass-heading-taken-as-mismatch-by-an-overlapping-run-is-not-extra` in
   `tests/target/heading/MTL616-heading-extra.test.ts`.

Consequences:

- A sibling that matches the current position is always taken by it (an instance, or the
  match). A later position never takes it away: an exact-text heading does not keep its text
  from an earlier pattern position (example B below).
- The run has no gaps and the cursor never goes back: no position is retried and no
  alternative split is searched (greedy first-fit). Extra headings exist only after the last
  taken sibling.
- Only a REQUIRED PLACEHOLDER position takes a sibling it does not match. Why: a placeholder
  position stands for a heading whose text varies, so a heading at that place is read as a
  malformed instance and is named with its failing piece (`MTL606`, example A). A literal
  position names one exact heading, so a different heading at its place is another heading,
  and the literal one is missing (example E). An optional position never takes what it does
  not match.
- `MTL606` fires only when the position has a sibling. With no sibling left, presence speaks
  (`MTL605`, or `MTL607` with an explicit `min`).
- A mismatch is not a match: it gets no content check and no sub-heading check, no
  section-scope descendants are checked under it, and it is left out of the order lists (one
  cause, one finding).

Presence of a pattern heading (a required pattern heading needs a heading at its position):

| Presence tag of T                                   | No sibling left, or (literal pattern) the next sibling differs                                                                                    | Next sibling does not match (placeholder pattern) |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| none or `[presence:required]`                       | `MTL605`, no anchor, in file and section scope (`MTL607` instead with an explicit `min` on a repeat heading)                                      | `MTL606` on that sibling, which is taken          |
| `[presence:optional]`, `[presence:conditional:...]` | no finding (`MTL607` with an explicit `min` on a repeat heading; with `[presence:optional]` that combination is also the template error `MTL018`) | no finding, nothing taken                         |
| `[presence:template-only]`                          | not a pattern heading: the pattern, repeat and order tags are ignored (`MTL015`, 2.7)                                                             | same                                              |

A pattern heading never gives `MTL601` or `MTL610`: `MTL605` replaces them. Like `MTL601`,
`MTL605` has no anchor, so only `disable-file MTL605` silences it, also in section scope.
Why: one code says "no heading of this shape at its place", and a missing heading has no line
of its own.

Repeat rules:

- Defaults: presence defaults to required (2.6). The minimum of a repeat heading defaults to 1
  when it is required, and to 0 when it is optional or conditional. This default is the
  presence rule itself, so it never gives `MTL607`. An explicit `min` tag overrides it and
  then decides alone, also at zero instances (`MTL607` replaces `MTL605`). There is no default
  maximum.
- `MTL018` heading-optional-min-conflict (template phase) fires for a repeat heading whose
  presence (2.6 precedence) is `[presence:optional]` and that has an effective explicit `min`
  tag (the first of its kind). A repeat heading has an effective pattern and an effective
  repeat tag, so a heading whose pattern is invalid (`MTL014`) or whose repeat tag `MTL015`
  ignores is not one.
  - One finding per heading, at the template line of the heading and the column of the `[`
    of that `min` tag. `{tag}` is the `min` tag as written, `{min}` its `N`.
  - Severity ERROR, category `syntax`, a TEMPLATE ERROR like `MTL017` (2.7). In a lint run it
    is printed on the template file with exit 1, and the targets are still linted. In
    `--verify` the template FAILS, exit 1, section `Optional headings with a minimum:` (8.3).
    Never suppressible (DIR6).
  - In a lint run the tags apply as written: the `min` decides alone (`MTL607`, also at zero
    instances), as the presence table above says.
  - `[presence:conditional:...]` with a `min` is NOT `MTL018`.
  - Why: `[presence:optional]` says "the heading may be absent" (a minimum of 0), and a `min`
    of 1 or more says "at least N". The template states two minimums, and the intent of the
    author is unknown. If the `min` won silently, the mistake would stay hidden. It is an
    error, not an `MTL015` warning, because the conflict changes what the run reports (zero
    instances fail), the same reason `MTL017` is an error. The fix is one tag: drop
    `[presence:optional]` (at least N) or drop the `min` (none or more). A conditional heading
    is documentation only (2.6) and reads "when the condition holds, at least N", which is
    not a contradiction (AS17).
- Every instance is a match for the rules on T: its content tags (2.6), its
  `[content:subheadings:disallow]` and `[content:subheadings:no-extra]`, and its
  section-scope descendants, which are checked once per instance, in the target section of
  that instance (`{parent}` is the instance text, `MTL610` and `MTL611` anchor on the
  instance line). The first instance is the match of T for `MTL604` and `MTL611`.
- Bounds: `n` below an explicit `min` is `MTL607`, anchored on the first instance (no
  anchor when `n` is 0); `n` above `max` is `MTL608`, anchored on the instance number
  `max + 1`. A `min` above the `max` gives no template warning: every target then gets
  `MTL607`, `MTL608` or both, which shows the mistake. Why: one tag per bound keeps each tag
  standalone (no orphan bound), and counting every matching sibling and reporting once keeps
  one finding per cause.
- `MTL614` (heading-repeat-miss): one finding per repeat set that has matching siblings in the
  tail (step 4). It lists them in file order (`{pylist}`) and is anchored on the first listed
  sibling. A tail sibling is listed under the first repeat heading of the sequence, in
  template order, whose pattern it matches, so it is listed once.
  - Why: `[repeat-rules:same-level]` states that the repeats form one consecutive run. A
    heading of that shape after the run ended (a stray heading broke the run) is a repeat out
    of its place, not an allowed extra.
  - It is distinct from `MTL606`: `MTL606` is a heading at a position that has the wrong
    shape, `MTL614` a heading with the right shape at the wrong place.
  - A tail sibling that matches no pattern stays an allowed extra, listed by the warning
    `MTL616` (step 4). So a typo in the LAST heading of a run (no later instance to raise
    `MTL614`) is still shown. `MTL614` stays an error for the tail siblings it lists, and
    they are left out of the `MTL616` list.

Order (opt-in; the order key reads the heading text, not placeholder values):

- Forms, on a repeat heading. An order tag on a heading without a pattern is `MTL015`; on a
  pattern heading without a repeat tag it is the template error `MTL030` (2.7). The forms:
  `[order:ascending]`, `[order:descending]`, `[order:first:number:ascending]`,
  `[order:first:number:descending]`, `[order:first:date:ascending]`,
  `[order:first:date:descending]`, `[order:first:semver:ascending]`,
  `[order:first:semver:descending]`. `{tag}` below is the effective order tag in this
  canonical lowercase spelling.
- ORDER KEY of an instance:
  - `[order:ascending]` / `[order:descending]`: its WHOLE stored heading text (2.6),
    compared as strings in plain UTF-16 code-unit order, case-sensitive and locale
    independent (the order of 8.4). So `Epic A - Setup` is below `Epic B - Release`,
    `Step 10` below `Step 9`, `B` below `a`. Every instance has this key.
  - `[order:first:number:...]`: the value of its FIRST NUMBER, compared numerically (`9` is
    below `10`, `-1.5` below `1e0`). The FIRST NUMBER is found by a scan from the left: the
    first ASCII digit of the text starts it; it extends to the longest NUMERIC TEXT
    (placeholders above) from that digit, and a `-` right before that digit belongs to it
    when the character before the `-` is not a letter or digit, or when the `-` is the first
    character. So `Step 10 - Deploy` gives 10, `v1.5.2` gives 1.5, `Temp -3` gives -3,
    `Epic-2` gives 2, `1e5 runs` gives 100000, `2026-10-01` gives 2026, and `Intro` has no
    first number. The value is the decimal number the text denotes, compared as an IEEE
    double (C06 "Numbers").
  - `[order:first:date:...]`: its FIRST DATE, compared chronologically: the leftmost
    substring of 10 characters that is an ISO DATE (2.9: `YYYY-MM-DD`, a real calendar
    date), with no ASCII digit right before or right after it. A shape that fails the
    calendar test is skipped and the scan goes on. So `[1.2.0] - 2026-03-01` gives
    2026-03-01, `Sprint 2026-02-30 / 2026-03-02` gives 2026-03-02, `2026-10` has none.
  - `[order:first:semver:...]`: its FIRST SEMVER, compared by SemVer 2.0.0
    precedence (semver.org, section 11: major, minor and patch numerically, a pre-release
    below its release, pre-release identifiers compared one by one, build metadata
    ignored, so `1.0.0+a` and `1.0.0+b` are equal keys). The FIRST SEMVER is found by a scan
    from the left: a candidate starts at an ASCII digit that has no ASCII digit and no `.`
    right before it; the candidate is the LONGEST prefix from there that is a SEMVER (2.9);
    it is kept when no ASCII digit follows it, else (or when no prefix is a SEMVER) the scan
    goes on at the next start. So `[1.10.0] - 2026-04-01` gives 1.10.0, `v2.0.0-rc.1` gives
    2.0.0-rc.1, `1.2.0 - 2026-03-01` gives 1.2.0, and `Release 1.2`, `Version 10` and
    `Intro` have none.
  - Versions: the string order puts `1.10.0` below `1.9.0` and the first number of
    `1.10.0` is the text `1.10` (value 1.1), so neither orders versions; a changelog orders
    its releases by version (`[order:first:semver:descending]`) or by date
    (`[order:first:date:descending]`), whichever its headings carry (worked example 1).
- An instance without key (`first:` forms only) takes no part in the pairs below and is
  reported by `MTL617`.
- The adjacent pairs of one repeat set: consecutive instances, in file order, among the
  instances that have a key. With `ascending` a pair is out of order when the later key is
  lower than the earlier one, with `descending` when it is higher. Equal keys pass. There is
  ONE `MTL609` per repeat set with at least one pair out of order. It is anchored on the later
  instance of the FIRST pair out of order. `{text}` is the text of that instance, `{prev}` the
  text of the earlier instance, `{count}` the number of pairs out of order in the set.
- `MTL617` heading-order-key-missing: ONE finding per repeat set (at any `n` of 1 or more)
  whose `first:` order tag finds no key in at least one instance. It is anchored on the first
  such instance. `{count}` is the number of such instances, `{pylist}` their texts in file
  order, `{kind}` `number`, `date` or `semver` (the keyword of the form), and `{placeholder}`
  `{number}`, `{date}` or `{semver}` (the message recommends a pattern that requires the key).
  Severity error, category `heading`, step `headings`, suppressible (DIR6).
- Why these forms: the order must be predictable from the text (`Epic A` before `Epic B`),
  and the numeric, date and version orders fix what string order gets wrong (`Step 9` before
  `Step 10`, dates inside other text, `1.9.0` before `1.10.0`). Scanning the text keeps the
  order tag independent of the placeholders of the pattern, so one rule works for any
  pattern.
- Why `MTL617` is its own code: a heading without the key cannot be placed. That is a
  different cause, with a different fix (tighten the pattern), than a pair out of order. So it
  has its own code and its own suppression, and `MTL609` keeps its "one per set, pairs only"
  meaning. One finding per set, like `MTL609`, keeps a pattern that admits keyless headings to
  one line.
- Why one finding per set: a single misplaced release does not flood the output, while the
  first pair and the count say where to start and how much is wrong.

Duplicate pattern (`MTL017`, template phase):

- Template sequence: for each level and scope of the template alone (the file-scope headings
  of one level; the headings of one level with one template parent), the template headings
  in template order, without the `[presence:template-only]` headings and the headings with
  an invalid pattern (`MTL014`). It is the sequence of 2.6 without the target-dependent
  "checked" filter.
- Compared members: pattern headings and exact-text headings. The pattern of an exact-text
  heading is the literal pattern of its stored text (one literal piece, grammar.md "Match of
  T"). A heading whose pattern tag `MTL015` ignores is an exact-text heading. Every member of
  a template sequence is compared (the dropped `exist` tag, never compared, is gone).
- Two ADJACENT compared members of a template sequence with the SAME PATTERN give one
  `MTL017` on the later one. Same pattern means the same list of pieces:
  - a literal piece is equal by its text after escapes and brace escapes (case-sensitive);
  - a placeholder is equal by name and format, case-insensitively, where no format equals the
    default format name of the placeholder (`full`, `human`, `decimal`; `{digits}` has no
    default name), and by argument (compared as written; a valid argument has no leading
    zero, so equal text is equal value).

  So `{semver}` and `{SemVer:format:full}` are the same, `{text}` and `{text:format:human}`
  too, and `{digits:format:padding:3}` and `{Digits:format:PADDING:3}`.
  `{digits:format:padding:3}` and `{digits:format:padding:4}` are not, nor `{semver}` and
  `v{semver}`. `## Notes` and `## [pattern:"Notes"]` are the same; `## Notes` and `## notes`
  are not. Three in a row give two findings (second and third). Presence and repeat tags play
  no part.

- Position: the template line of the later heading; the column of the `[` of its pattern
  tag for a pattern heading, of the first character of its text for an exact-text heading.
  `{prev}` is the label (pattern heading) or text (exact-text heading) of the earlier
  heading, `{prevLine}` its template line. Message: the first form of 4.3 when the later
  heading is a pattern heading (`{pattern}` as written in its tag), the second form
  (`matches the same headings as the previous heading`) when it is an exact-text heading.
- Severity ERROR, category `syntax`, phase `template`: a TEMPLATE ERROR (2.7). In a lint run
  it is printed on the template file and makes the run exit 1, while the targets are still
  linted (7.5, 8.2, worked example 5). In `--verify` it is listed in the section
  `Duplicate patterns:` (8.3) and makes the template FAIL, exit 1 (7.3), without making it
  broken. Never suppressible (DIR6: the template carries no directives).
- Why: in a greedy run the second of two identical patterns only takes what the first leaves.
  After a repeat it can never match. After a single heading the template says "two headings
  of one shape", which `[repeat-rules:same-level:min:2]` says without ambiguity. It is an
  error (not a warning) because the template cannot express what its author meant. It is
  template-side because it is a property of the template, reported once and not once per
  target. Exact-text headings are compared too, because positional matching treats
  `## Notes` as the literal pattern `"Notes"`. Two required `## Notes` in a row ask for two
  such headings, which is a repeat that
  `## Notes [pattern:"Notes"] [repeat-rules:same-level:min:2]` states plainly. The same holds
  for an exact-text heading next to the literal pattern of its text.

Interplay with the other heading rules:

- `MTL601`, `MTL603`, `MTL604`, `MTL610`, `MTL611`: the index of T in an order list is its match
  (the first instance); mismatches, set-aside siblings and the tail never change an order
  result.
- `MTL603`: step 1; the sibling that gets `MTL603` (the first match of the template-only
  text) is never also `MTL606`, `MTL614` or `MTL615`. A second set-aside sibling with the
  same text gets no `MTL603`; it stays set aside (no position, not in the tail) and is
  subject only to `MTL612`, like any other heading (AS17 (j)).
- `MTL612`: instances and tail siblings whose text matches a pattern of D's subtree are
  listed (2.6); a mismatch (`MTL606`) is not listed, so it is not also `MTL612`, but it still
  counts as unlisted for the topmost rule.
  `[content:subheadings:disallow]` on a repeat heading applies inside every instance.
- `MTL615`: a mismatch counts as declared (it was taken); a tail sibling listed by `MTL614`
  is not also `MTL615`.
- `MTL616` (heading-extra, warning): one per run with a non-empty
  list. Each tail sibling of a run gets exactly one of: `MTL614` (it matches a repeat
  pattern of the sequence; error), `MTL615` (a direct child of a no-extra match; error),
  `MTL612` (unlisted under a disallow tag, topmost; error), nothing of its own because its
  topmost unlisted ancestor has `MTL612`, or a place in the `MTL616` list. So the warning
  lists only the tail headings no error names, and a run whose whole tail is named by errors
  gives no `MTL616`. A run of only required exact-text template headings with EMPTY text never gives `MTL616` (step 4). Set-aside siblings (`MTL603`) and mismatches (`MTL606`) are not in the
  tail. Which code reports a tail sibling is decided before suppression: a suppressed
  `MTL612`, `MTL614` or `MTL615` does not add that heading to the `MTL616` list (4.1 step 8).
  A heading named by a `MTL601` hint that stays in the tail is still listed by `MTL616`:
  `MTL601` has no anchor, the warning gives the line (example I).
- `MTL601` hint: computed in step 3b from the siblings of the run; it never changes a
  match, a tail or an order list.
- Emission order (4.3): findings about T sort by T's template line, then code, then target
  line. `MTL616` is about the LAST position of its sequence (the template heading after
  which the tail lies); warnings print after errors (4.1).

Worked example 1, a changelog (file `CHANGELOG.md`). Template (line numbers on the left are
not part of the file):

```text
1  ---
2  version: "string"
3  ---
4
5  # Changelog
6
7  ## Unreleased [presence:optional]
8
9  ## Release [pattern:"[{semver}] - {date}"] [repeat-rules:same-level] [order:descending]
10
11 ### Added [presence:optional] [content:list]
```

Target:

```text
1  ---
2  version: 1.2.0
3  ---
4
5  # Changelog
6
7  ## Unreleased
8
9  ## [1.2.0] - 2026-03-01
10
11 ### Added
12
13 - New flag.
14
15 ## [1.0.0] - 2026-01-10
16
17 ### Added
18
19 First release.
20
21 ## [1.1.0] - 2026-02-01
22
23 ## 0.9.0 - 2025-12-01
24
25 ## [0.8.0] - 2025-11-01
```

- Level 1: `# Changelog` takes line 5.
- Level 2 (file scope): sequence `## Unreleased`, `## Release`; siblings lines 7, 9, 15, 21,
  23, 25. `## Unreleased` (literal, optional) matches line 7 and takes it. `## Release`
  (repeat, placeholder, required): line 9 matches, so step 3d1 takes nothing; the run takes
  lines 9, 15 and 21 (they match `[{semver}] - {date}`) and stops at line 23, which has no
  `[`. `n` is 3, no bound tag: no count finding. The tail is lines 23 and 25.
- Order keys (`[order:descending]`: the whole texts): line 9
  `[1.2.0] - 2026-03-01`, line 15 `[1.0.0] - 2026-01-10`, line 21 `[1.1.0] - 2026-02-01`.
  Pair 9-15 descends (`2` above `0` at the fourth character); pair 15-21 rises (`1` above
  `0` there): one pair out of order, one `MTL609` on line 21, `{prev}` the text of line 15,
  `{count}` 1.
- Tail: line 25 matches the pattern of `## Release`: `MTL614` listing it, anchored on line 25. Line 23 matches no pattern: an allowed extra, listed by the warning `MTL616` of the
  level-2 run, anchored on line 23 (the typo that broke the run shows twice: as the extra
  itself and through the `MTL614` after it).
- `### Added` is checked once per instance. Instance line 9 (section lines 9 to 14): its
  level-3 run takes line 11, whose body holds `- New flag.`: no finding. Instance line 15
  (section lines 15 to 20): `### Added` takes line 17, whose body (lines 18 to 20) has no
  list item: `MTL703`, label `Section '[1.0.0] - 2026-01-10 > Added'`, anchored on line 17.
  Instance line 21 (section lines 21 to 22): no level-3 sibling, optional: no finding.
- `MTL604`: `Changelog` (line 5), `Unreleased` (line 7), `Release` (first instance, line 9)
  are in order: no finding.
- Expected text output (errors in emission order: step 5 sorted by template line then code,
  then step 6; then the warning):

```text
  ✗ CHANGELOG.md
      error MTL609 Heading: heading '[1.1.0] - 2026-02-01' is not in descending order after '[1.0.0] - 2026-01-10', 1 pair(s) out of order [order:descending]
        21 | ## [1.1.0] - 2026-02-01
      error MTL614 Heading: 1 heading(s) match [pattern:"[{semver}] - {date}"] after the end of its run [repeat-rules:same-level]: ['[0.8.0] - 2025-11-01']
        25 | ## [0.8.0] - 2025-11-01
      error MTL703 Section '[1.0.0] - 2026-01-10 > Added': [content:list] no markdown list item found
        17 | ### Added
      warn  MTL616 Heading: 1 extra heading(s) at level H2 after the template headings: ['0.9.0 - 2025-12-01']
        23 | ## 0.9.0 - 2025-12-01
```

- Variant, typo fixed: line 23 reads `## [0.9.0] - 2025-12-01`. The run takes lines 9, 15,
  21, 23 and 25 (`n` 5), the tail is empty: no `MTL614`, no `MTL616`. Pairs 21-23 and 23-25 descend, so
  `MTL609` stays the same (`1 pair(s)`), and `MTL703` stays.
- Variant, maximum: template line 9 gains `[repeat-rules:same-level:max:2]`. Three
  instances: `MTL608` `Heading: 3 heading(s) match [pattern:"[{semver}] - {date}"], maximum
is 2`, anchored on the third instance (line 21), printed before the `MTL609` line (same
  template heading, codes in order).
- Variant, minimum: replace `max:2` by `[repeat-rules:same-level:min:4]`: `MTL607` `Heading: 3
heading(s) match [pattern:"[{semver}] - {date}"], minimum is 4`, anchored on line 9,
  printed first.
- Variant, no release: target lines 8 to 25 removed. `## Unreleased` takes line 7; no
  sibling is left for `## Release`: `MTL605` `Heading: missing required heading matching
[pattern:"[{semver}] - {date}"] (H2)`, no excerpt (no anchor);
  `<!-- md-template-lint disable-file MTL605 -->` silences it. With `[presence:optional]` on
  template line 9 there is no finding. With `[repeat-rules:same-level:min:4]` added (with or
  without `[presence:optional]`): `MTL607` `Heading: 0 heading(s) match
[pattern:"[{semver}] - {date}"], minimum is 4`, no anchor, and no `MTL605`. With
  `[presence:optional]` the template also has the template error `MTL018` (printed on the
  template file, exit 1; worked example 5).
- Variant, bracketed `Unreleased`: target line 7 reads `## [Unreleased]`. `## Unreleased`
  (literal, optional) does not match and takes nothing. `## Release` is required and line 7
  does not match: step 3d1 takes it as a mismatch, `MTL606` `Heading: heading
'[Unreleased]' does not match [pattern:"[{semver}] - {date}"] at {semver}` on line 7,
  printed first; the run then takes lines 9, 15 and 21 as before.
- Variant, required group: template line 11 without `[presence:optional]`. Instance line 21
  has no level-3 sibling: `MTL610` `Heading: Section '[1.1.0] - 2026-02-01': missing required
heading 'Added' (H3)`, anchored on line 21, printed after `MTL614` (template line 11 comes
  after line 9).
- Variant, suppression: `<!-- md-template-lint disable-line MTL614 -->` at the end of target
  line 25 (heading extraction drops it, 2.6) removes that finding (`Suppressed:   1`).
- Variant, no order tag: without `[order:descending]` there is no `MTL609`.
- Variant, order by date: `[order:first:date:descending]` instead. First dates:
  line 9 2026-03-01, line 15 2026-01-10, line 21 2026-02-01; pair 15-21 rises: the same
  `MTL609` on line 21, ending in `[order:first:date:descending]`. Every instance has a
  date, so no `MTL617`.
- Variant, order by version: `[order:first:semver:descending]` instead. First
  SEMVERs: line 9 1.2.0, line 15 1.0.0, line 21 1.1.0; pair 9-15 descends, pair 15-21 rises:
  the same `MTL609` on line 21 (`1 pair(s)`), ending in `[order:first:semver:descending]`.
  Every instance has a version, so no `MTL617`. A changelog may use this form or the date
  form: with a release `[1.10.0] - 2026-04-01` above `[1.9.0] - 2026-03-15`,
  `[order:descending]` reports a pair out of order (`[1.1` is below `[1.9` as strings) while
  both the version order (1.10.0 above 1.9.0) and the date order pass.
- Variant, content on the release heading (the content label): template line 9 gains
  `[content:non-empty]`. Instance line 21 (section lines 21 to 22, line 22 blank) has an
  empty body: `MTL701` `Section '[1.1.0] - 2026-02-01' (pattern "[{semver}] - {date}"):
[content:non-empty] section body is empty`, anchored on line 21; instances 9 and 15 have
  text in their bodies.

Worked example 2, template warnings (`--verify`). Template `changelog.template.md`:

```text
1  ---
2  version: "string"
3  ---
4
5  # Changelog
6
7  ## Unreleased [presence:optional] [order:ascending]
8
9  ## Release [pattern:"[{version}] - {date}"] [repeat-rules:same-level]
10
11 ### Added [presence:optional] [content:list]
```

- Line 7: `[order:ascending]` on a heading without pattern: `MTL015`, column 35 (the `[` of
  the tag).
- Line 9: `{version}` is not a placeholder: `MTL014`, column 23 (its `{`). No `MTL015` for
  `[repeat-rules:same-level]` (one cause, one warning). In a lint run `## Release` and its
  `### Added` are not checked, and `## Release` is not a position.
- The two sections of the `--verify` output (8.3; the rest follows worked example 2 of 2.9):

```text
Invalid patterns:
  - Heading 'Release': invalid pattern [pattern:"[{version}] - {date}"] (unknown placeholder {version}) (line 9, column 23)
      9 | ## Release [pattern:"[{version}] - {date}"] [repeat-rules:same-level]
        |                       ^

Conflicting tags:
  - Heading 'Unreleased': tag [order:ascending] has no effect (the heading has no [pattern:...]) (line 7, column 35)
      7 | ## Unreleased [presence:optional] [order:ascending]
        |                                   ^
```

- Variant, fixed: line 9 reads `[{semver}] - {date}` and line 7 drops `[order:ascending]`: no
  warning, and the `Headings:` list shows `  ## Release (presence:required,
pattern:"[{semver}] - {date}", repeat-rules:same-level)`.
- Variant, a format: line 9 reads `[pattern:"[{semver:format:patch}] - {date}"]`:
  `MTL014` with the reason `unknown format patch for {semver}`, column 23.
- Variant, an escape: `## Quote [pattern:"Say \"{text}\""]` matches `## Say "hi"`;
  `## Quote [pattern:"a\tb"]` is `MTL014` `invalid escape \t`, column 21 (the backslash).

Worked example 3, a duplicate pattern (`--verify`). Template `versions.template.md`:

```text
1  ---
2  title: "string"
3  ---
4
5  ## [pattern:"{semver}"] [repeat-rules:same-level]
6
7  ## Hotfix [pattern:"{semver}"] [presence:optional]
```

- Level-2 template sequence: line 5, line 7; both pattern headings, same pattern `{semver}`:
  `MTL017` on line 7, column 11 (the `[` of `[pattern:`), `{prev}` the empty label of line 5.
- Expected output of `md-template-lint --verify --format plain versions.template.md` (exit
  1; `<version>` is the package version):

```text
md-template-lint <version>
Config: (none)
Template syntax reference: https://github.com/m21-cerutti/md-template-lint/blob/main/docs/syntax-reference.md
========================

  FAIL versions.template.md
Field  Type    Rules
--------------------
title  string  presence:required

Headings:
  ##  (presence:required, pattern:"{semver}", repeat-rules:same-level)
  ## Hotfix (presence:optional, pattern:"{semver}")

Duplicate patterns:
  - Heading 'Hotfix': same pattern [pattern:"{semver}"] as the previous heading '' (line 5) (line 7, column 11)
      7 | ## Hotfix [pattern:"{semver}"] [presence:optional]
        |           ^

========================
Summary
========================
Templates:    1 checked, 0 broken
Errors:       1
Warnings:     0

========================
```

- In a lint run the template is used as written: for target headings `## 1.2.0` and
  `## 1.1.0` the repeat heading takes both and `## Hotfix` (optional) takes nothing: no
  target finding, but the same `MTL017` is printed on the template file and the run exits 1
  (worked example 5; example G below shows the clean form).

Worked example 4, positional cases (examples A to I). Every template has the
frontmatter `title: "string"` (lines 1 to 3), a blank line 4 and its headings on lines 5, 7
and 9; every target has `title: x` (lines 1 to 3), a blank line 4 and its headings on lines
5, 7 and 9 (file `notes/a.md`). All headings are H2, so file scope, one level-2 run.

- A. Template `## [pattern:"{text}"]`, `## [pattern:"{number}"]`; target `## 1` (line 5),
  `## tata` (line 7). Position 1 (`{text}`, required): `1` is purely numeric, not a `{text}`
  value, so it is taken as a mismatch. Position 2 (`{number}`, required): `tata` is not a
  number, taken as a mismatch. Both are reported:

```text
  ✗ notes/a.md
      error MTL606 Heading: heading '1' does not match [pattern:"{text}"] at {text}
        5 | ## 1
      error MTL606 Heading: heading 'tata' does not match [pattern:"{number}"] at {number}
        7 | ## tata
```

- B. Template `## [pattern:"{text}"] [presence:optional]`, `## toto`; target `## toto` (line
  5). Position 1 matches line 5 and takes it (a matching sibling is always taken). Position
  2 (literal, required): no sibling left:

```text
  ✗ notes/a.md
      error MTL601 Heading: Missing required heading: 'toto'
```

- C. Template `## [pattern:"{text}"]`, `## toto [presence:optional]`; target `## toto`.
  Position 1 takes line 5; position 2 is optional, no sibling left: no finding,
  `✓ notes/a.md`.
- D. Template `## [pattern:"toto"]`, `## [pattern:"{text}"]`; target `## toto`. Position 1
  (literal pattern) takes line 5; position 2 (required) has no sibling left (patterns differ,
  so no `MTL017`):

```text
  ✗ notes/a.md
      error MTL605 Heading: missing required heading matching [pattern:"{text}"] (H2)
```

- E. Template `## Unreleased [presence:required]`,
  `## Release [pattern:"{semver} - {date}"] [repeat-rules:same-level]`.
  - Target `## 1.2.0 - 2026-10-01` (line 5), `## 1.1.0 - 2026-09-01` (line 7). Position 1
    (literal) does not match line 5 and takes nothing: missing. Position 2 runs over lines 5
    and 7 (`n` 2):

```text
  ✗ notes/a.md
      error MTL601 Heading: Missing required heading: 'Unreleased'
```

- Target `## 1.2 - 2026-10-01` (line 5), `## 1.1.0 - 2026-09-01` (line 7). `Unreleased` is
  missing as above. Position 2 is required and line 5 fails at `{semver}` (`1.2` has two
  parts): taken as a mismatch (step 3d1); the run then takes line 7 (`n` 1):

```text
  ✗ notes/a.md
      error MTL601 Heading: Missing required heading: 'Unreleased'
      error MTL606 Heading: heading '1.2 - 2026-10-01' does not match [pattern:"{semver} - {date}"] at {semver}
        5 | ## 1.2 - 2026-10-01
```

- F. Template `## [pattern:"{semver:format:major-minor} - {date}"]`; target
  `## 1.2 - 2026-10-01`: `1.2` is a `major-minor` value, `2026-10-01` an ISO DATE: no finding.
  With target `## 1.2.0 - 2026-10-01` it is a mismatch: the prefix `1.2` is a `major-minor`
  value, but `.0` does not start with `' - '`, so the failing piece is the literal:
  `MTL606` `Heading: heading '1.2.0 - 2026-10-01' does not match
[pattern:"{semver:format:major-minor} - {date}"] at ' - '`, line 5.
- G. Template `## [pattern:"{semver}"] [repeat-rules:same-level]`,
  `## Hotfix [pattern:"hotfix {semver}"] [presence:optional]`.
  - Target `## 1.2.0` (line 5), `## 1.1.0` (line 7): the repeat heading takes both; `Hotfix`
    (optional) has no sibling left: no finding. With `[pattern:"{semver}"]` on both
    headings the target result is the same, but the template has `MTL017` (worked examples
    3 and 5: `--verify` FAIL; a lint run prints it on the template file and exits 1).
  - Target `## 1.2.0` (line 5), `## hotfix 1.1.1` (line 7), `## 1.1.0` (line 9): the run
    takes line 5 and stops at line 7; `Hotfix` takes line 7; line 9 is in the tail and
    matches `{semver}`:

```text
  ✗ notes/a.md
      error MTL614 Heading: 1 heading(s) match [pattern:"{semver}"] after the end of its run [repeat-rules:same-level]: ['1.1.0']
        9 | ## 1.1.0
```

- Target `## 1.2.0`, `## 1.1.1-hotfix`: `1.1.1-hotfix` is a SEMVER (pre-release
  `hotfix`), so the repeat heading takes it as an instance; `Hotfix` takes nothing.
- H. Template `## [pattern:"{text}"] [repeat-rules:same-level]`, `## Notes [presence:optional]`;
  target `## Intro` (line 5), `## Notes` (line 7). `Notes` is a `{text}` value, so the run
  takes both lines; position 2 (optional) has no sibling left: no finding. An exact-text
  heading later in the template does not take a heading away from an earlier pattern.
- I (the `MTL601` hint). Template `## Alpha`, `## Beta`; target `## Beta` (line 5),
  `## Alpha` (line 7). Position 1 (`Alpha`, literal, required): line 5 does not match, so
  it takes nothing and is missing; line 7, from the cursor onward, has the text `Alpha`:
  the `MTL601` message gets the hint. Position 2 (`Beta`) takes line 5. Line 7 is in the
  tail: `MTL616`, anchored on line 7. `MTL604`: `Alpha` has no match and is skipped, no
  finding. `MTL601` has no anchor and no excerpt; the warning quotes line 7:

```text
  ✗ notes/a.md
      error MTL601 Heading: Missing required heading: 'Alpha' (found later at line 7, out of order)
      warn  MTL616 Heading: 1 extra heading(s) at level H2 after the template headings: ['Alpha']
        7 | ## Alpha
```

Worked example 5, template errors in a lint run (`MTL017` with an exact-text pair, and
`MTL018`). Config `md-template-lint.yml` with one pair, template
`templates/versions.template.md`, include `notes/*.md`, no description. Template:

```text
1  ---
2  title: "string"
3  ---
4
5  ## Notes
6
7  ## Notes [presence:optional]
8
9  ## Release [pattern:"{semver}"] [repeat-rules:same-level:min:2] [presence:optional]
```

Target `notes/a.md`:

```text
1  ---
2  title: x
3  ---
4
5  ## Notes
6
7  ## 1.2.0
8
9  ## 1.1.0
```

- Template phase. Level-2 template sequence: lines 5, 7, 9. Lines 5 and 7 are adjacent
  exact-text headings with the same text `Notes`: `MTL017` on line 7, column 4 (the `N` of
  its text), second message form, `{prev}` `Notes`, `{prevLine}` 5. Lines 7 and 9: `Notes`
  and `{semver}` differ. Line 9 is a repeat heading, presence `[presence:optional]`, with
  the explicit `[repeat-rules:same-level:min:2]` starting at column 33: `MTL018`.
- Lint phase, template as written. Level-2 run over lines 5, 7, 9: position 1 (`Notes`,
  required) takes line 5; position 2 (`Notes`, optional) does not match line 7 and takes
  nothing; position 3 (repeat, `{semver}`) takes lines 7 and 9 (`n` 2, not below `min` 2:
  no `MTL607`). The tail is empty. The target passes.
- Expected output of `md-template-lint --format plain` (exit 1, from the template errors
  alone; the `pretty` form has `✗` and `✓` in place of `FAIL` and `PASS`):

```text
md-template-lint 1.0.0
Config: md-template-lint.yml
========================

Template: templates/versions.template.md
Target:   notes/*.md (1 file(s))

  FAIL templates/versions.template.md (template)
      error MTL017 Heading 'Notes': matches the same headings as the previous heading 'Notes' (line 5)
        7 | ## Notes [presence:optional]
          |    ^
      error MTL018 Heading 'Release': tag [repeat-rules:same-level:min:2] contradicts [presence:optional] (a minimum of 2 requires the heading)
        9 | ## Release [pattern:"{semver}"] [repeat-rules:same-level:min:2] [presence:optional]
          |                                 ^
  PASS notes/a.md

========================
Summary
========================
Total files:  1
Passed:       1
Failed:       0
Warnings:     0 (in 0 file(s))
Templates:    1 checked, 0 broken

Failed templates:
  - templates/versions.template.md

========================
```

- No `All files passed!` line (a template failed, 8.2). The template is not broken: its
  target is linted and counted. `--quiet` prints the `FAIL ... (template)` line with its
  two errors and excerpts, and nothing for `notes/a.md`.
- Variant, target line 9 removed: the repeat takes line 7 only (`n` 1): the target also
  fails with `MTL607` `Heading: 1 heading(s) match [pattern:"{semver}"], minimum is 2`,
  anchored on line 7, printed under `FAIL notes/a.md` after the template block; `Failed:
1`, and `Failed files:` follows `Failed templates:`.
- Variant, fixed template: line 7 removed (or its text changed) and `[presence:optional]`
  dropped from line 9: no template error, `All files passed!`, exit 0.
- `--verify` of the same template: `FAIL templates/versions.template.md`, then the table,
  the section `Duplicate patterns:` with the `MTL017` item and the section `Optional headings
with a minimum:` with the `MTL018` item (8.3), `Errors:       2`, exit 1.

Worked example 6, the extra warning and its interplay (`MTL616` with `MTL612`, `MTL614` and
`MTL615`; file `CHANGELOG.md`). Template:

```text
1  ---
2  version: "string"
3  ---
4
5  # Changelog
6
7  ## Unreleased [presence:optional] [content:subheadings:disallow]
8
9  ### Added [presence:optional]
10
11 ## Release [pattern:"[{semver}] - {date}"] [repeat-rules:same-level] [content:subheadings:no-extra]
12
13 ### Added [presence:optional]
```

Target:

```text
1  ---
2  version: 1.2.0
3  ---
4
5  # Changelog
6
7  ## Unreleased
8
9  ### Added
10
11 ### Added
12
13 ### Misc
14
15 ## [1.2.0] - 2026-03-01
16
17 ### Added
18
19 ### Notes
20
21 ## 1.1.0 - 2026-02-01
22
23 ## [1.0.0] - 2026-01-10
24
25 ## Links
```

- Level 1: `# Changelog` takes line 5, no tail.
- Level 2 (file scope): siblings lines 7, 15, 21, 23, 25. `## Unreleased` (literal,
  optional) takes line 7. `## Release` (repeat, required) takes line 15 and stops at line 21
  (no `[`): `n` 1. Tail: lines 21, 23, 25. Line 23 matches the release pattern: `MTL614`,
  anchored on line 23. Lines 21 and 25 get no error (they are outside every sub-heading tag
  region): one `MTL616` lists both, anchored on line 21.
- Level 3 in the section of line 7 (lines 7 to 14): siblings lines 9, 11, 13. `### Added`
  takes line 9; tail lines 11 and 13. Under `[content:subheadings:disallow]` line 11
  (`### Added`, level and text listed) gets no `MTL612`; line 13 `### Misc` is unlisted and
  topmost: `MTL612`, which replaces its warning. One `MTL616` lists line 11 only, anchored
  on line 11.
- Level 3 in the section of the instance line 15 (lines 15 to 20): siblings lines 17, 19.
  `### Added` takes line 17; tail line 19. Under `[content:subheadings:no-extra]` line 19 is
  a direct child of line 15 taken by no position: `MTL615`, which replaces its warning. The
  `MTL616` list is empty: no warning for this run.
- `MTL604`: `Changelog` (line 5), `Unreleased` (line 7), `Release` (line 15) are in order.
- Emission order: errors by template line, then code: `MTL612` (tagged heading, template line
  7), `MTL614` and `MTL615` (template line 11); then the warnings by the template line of the
  last position of their sequence: `### Added` (template line 9) before `## Release`
  (template line 11).

```text
  ✗ CHANGELOG.md
      error MTL612 Heading: Section 'Unreleased': heading 'Misc' at level H3 is not in the template [content:subheadings:disallow]
        13 | ### Misc
      error MTL614 Heading: 1 heading(s) match [pattern:"[{semver}] - {date}"] after the end of its run [repeat-rules:same-level]: ['[1.0.0] - 2026-01-10']
        23 | ## [1.0.0] - 2026-01-10
      error MTL615 Heading: Section '[1.2.0] - 2026-03-01': heading 'Notes' at level H3 is not declared at this position [content:subheadings:no-extra]
        19 | ### Notes
      warn  MTL616 Heading: Section 'Unreleased': 1 extra heading(s) at level H3 after the template headings: ['Added']
        11 | ### Added
      warn  MTL616 Heading: 2 extra heading(s) at level H2 after the template headings: ['1.1.0 - 2026-02-01', 'Links']
        21 | ## 1.1.0 - 2026-02-01
```

- Variant, suppression: `<!-- md-template-lint disable-line MTL616 -->` at the end of line
  21 removes the whole level-2 warning (one diagnostic, both headings; `Suppressed:   1`);
  the same directive on line 25 removes nothing (line 25 is not the anchor).
- Variant, no no-extra tag: without `[content:subheadings:no-extra]` on template line 11,
  line 19 gets no `MTL615`; the run of the instance line 15 then gives `MTL616` `Heading:
Section '[1.2.0] - 2026-03-01': 1 extra heading(s) at level H3 after the template
headings: ['Notes']`, anchored on line 19, printed last (its last position, `### Added`
  on template line 13, comes after template line 11).
- Variant, no repeat match in the tail: line 23 reads `## Links 2`. No `MTL614`; the level-2
  warning lists `['1.1.0 - 2026-02-01', 'Links 2', 'Links']`, `3 extra heading(s)`.

Worked example 7, examples J and K (`{char}`, string order, the content label,
`[order:first:number:...]` and `MTL617`, with the `MTL030` variant of J and the `semver`
variant of K). Frontmatter, blank line 4 and file `notes/a.md` as in worked example 4.

- J. Template line 5: `## Epic A - Title [pattern:"Epic {char} - {text}"]
[repeat-rules:same-level] [order:ascending] [content:table]` (`Epic A - Title` is the
  LABEL, an author hint). Target:

```text
1  ---
2  title: x
3  ---
4
5  ## Epic A - Setup
6
7  | Task | Status |
8
9  ## Epic B - Release
10
11 Ship it.
```

The run takes lines 5 and 9 (`A` and `B` are `{char}` values, `Setup` and `Release`
`{text}` values). Order: `Epic A - Setup` is below `Epic B - Release` (`A` below `B`):
ascending, no `MTL609`. Content per instance: line 5 (section lines 5 to 8) has the table
row on line 7; line 9 (section lines 9 to 11) has none:

```text
  ✗ notes/a.md
      error MTL702 Section 'Epic B - Release' (pattern "Epic {char} - {text}"): [content:table] no markdown table row found
        9 | ## Epic B - Release
```

- Variant, line 9 reads `## Epic 2 - Release`: `2` is not a `{char}` value, so the run
  takes line 5 only and line 9 is in the tail; it matches no repeat pattern, so it is not
  `MTL614` but an extra: the file passes with the warning `MTL616` `Heading: 1 extra
heading(s) at level H2 after the template headings: ['Epic 2 - Release']` on line 9, and
  no content check reads line 9.
- Variant, without `[repeat-rules:same-level]` (template line 5 `## Epic A - Title
[pattern:"Epic {char} - {text}"] [order:ascending] [content:table]`): the order
  tag on a pattern heading without repeat tag is the template error `MTL030` (2.7), at
  column 52 (the `[` of `[order:ascending]`: `## ` is 3 characters, the label 14, a space,
  the pattern tag 32 on columns 19 to 50, a space). In a lint run with a config pair
  (template `templates/epics.template.md`, include `notes/*.md`) it is printed on the
  template file and the run exits 1; the target is still linted: the heading (now a
  single placeholder position) takes line 5, whose section has a table row, and line 9 is
  in the tail: it matches the pattern, but no repeat position exists, so it is no
  `MTL614`, only an extra (`MTL616`). The order tag compares nothing. Pair block of the
  `plain` output (the summary lists the template under `Failed templates:`):

```text
  FAIL templates/epics.template.md (template)
      error MTL030 Heading 'Epic A - Title': tag [order:ascending] needs [repeat-rules:same-level] (an order compares the repeats of one heading)
        5 | ## Epic A - Title [pattern:"Epic {char} - {text}"] [order:ascending] [content:table]
          |                                                    ^
  PASS notes/a.md
      warn  MTL616 Heading: 1 extra heading(s) at level H2 after the template headings: ['Epic B - Release']
        9 | ## Epic B - Release
```

`--verify` of that template: `FAIL`, section `Order tags without repeat:` (8.3), exit 1.
An epic list needs the repeat tag.

- K. Template line 5: `## Step [pattern:"Step {text}"] [repeat-rules:same-level]
[order:first:number:ascending]`. Target headings: line 5 `## Step 1 - Install`, line 7
  `## Step 10 - Deploy`, line 9 `## Step 9 - Test`, line 11 `## Step four - Review`. All four
  match (`{text}` takes `1 - Install`, and so on; none is purely numeric). First numbers 1,
  10, 9 and none. Pairs among the keyed instances: 1-10 rises, 10-9 falls: one `MTL609` on
  line 9. Line 11 has no number: one `MTL617`. Both are about template line 5, so they sort
  by code:

```text
  ✗ notes/a.md
      error MTL609 Heading: heading 'Step 9 - Test' is not in ascending order after 'Step 10 - Deploy', 1 pair(s) out of order [order:first:number:ascending]
        9 | ## Step 9 - Test
      error MTL617 Heading: 1 heading(s) have no number to order by [order:first:number:ascending], use a [pattern:...] with {number}: ['Step four - Review']
        11 | ## Step four - Review
```

- Variant, `[order:ascending]` instead: the whole texts are compared; `Step 1 - Install`,
  `Step 10 - Deploy`, `Step 9 - Test`, `Step four - Review` are in ascending string order
  (a space is below `0`, `1` below `9`, `9` below `f`): no finding at all. This is the
  reason for the `first:number` form.
- Variant, the pattern advice followed: `[pattern:"Step {digits} - {text}"]` (or
  `{number}`, which the message names; both reject `four`). Line 11 no
  longer matches, so the run ends at line 9 and line 11 is an extra (`MTL616` warning);
  no instance lacks a number, so no `MTL617`; the `MTL609` on line 9 stays.
- Variant, `[order:first:semver:ascending]` instead: no heading holds a SEMVER
  (`1`, `10` and `9` have one part), so no instance has a key: no pair, no `MTL609`, and
  one `MTL617` `Heading: 4 heading(s) have no semver to order by
[order:first:semver:ascending], use a [pattern:...] with {semver}: ['Step 1 - Install',
'Step 10 - Deploy', 'Step 9 - Test', 'Step four - Review']`, anchored on line 5.

### 2.11 Unique heading names (`[unique-headings-names]`)

One opt-in tag, written in two places, asks that no two target headings of one scope share a
name (ADR 0013). Every other heading rule is unchanged by it. The bracket is a known tag: it is
peeled from a heading text, and it is read as the template-wide switch on a standalone
frontmatter line. The rule is `MTL613` (heading-unique-names); it also adds an `MTL015` reason
and a `--verify` output. Its fixtures are listed in section 9.

There are two switches and one tag, spelled `[unique-headings-names]`. The plural `headings`
is part of the name; keywords are case-insensitive (section 2).

- TEMPLATE-WIDE switch: a standalone comment line in the template FRONTMATTER that holds only
  this tag, `# [unique-headings-names]`, in the placement family of the filename comment
  (2.5). It binds to no key. Written on several lines, it counts once. Its SCOPE is the whole
  target: every target heading of the file.
- PER-HEADING switch: a heading suffix tag (2.6) on a template heading D of any level,
  `## Section [unique-headings-names]`. Written twice on one heading, it counts once. Its
  SCOPE is the REGION of each match M of D (each instance for a repeat heading, 2.10): the
  heading M itself and every target heading inside the target section of M (grammar.md "Target
  section": up to the next target heading of M's level or lower), at every deeper level.
- Effective as `[content:subheadings:disallow]` (2.6): D is checked, has a match M and is not
  `[presence:template-only]`. An absent optional or conditional D, a D that is not checked
  (a missing or unchecked parent, an invalid pattern, `MTL014`) and a sibling taken as a
  mismatch (`MTL606`, no match) give no region. A template-only D: no effect and the
  template warning `MTL015` with the reason `the heading is [presence:template-only]` (2.7).
- Both switches together: the template-wide scope contains every region, so the per-heading
  tags add nothing (no warning; the findings are those of the template-wide switch alone).

Placement cases (one answer per case):

| Written as                                                        | Where                             | Result                                                                                                                                                                                                                                                                                                                                                                              |
| ----------------------------------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `# [unique-headings-names]` alone on a line                       | template frontmatter              | template-wide switch                                                                                                                                                                                                                                                                                                                                                                |
| `[unique-headings-names]` after a heading text                    | template body, any level          | per-heading switch on that heading                                                                                                                                                                                                                                                                                                                                                  |
| `title: "x" # [unique-headings-names]`                            | template frontmatter key line     | inert, not reported (as the filename tag on a key line, 2.5)                                                                                                                                                                                                                                                                                                                        |
| `# note [unique-headings-names]` (other text or tags on the line) | template frontmatter comment line | inert, not reported (a known tag, so no unknown warning; only a line holding the tag alone is the switch, as 2.5)                                                                                                                                                                                                                                                                   |
| `# [unique-headings-names]`                                       | template BODY                     | an H1 heading with EMPTY text carrying the per-heading tag, not the switch; a required exact-text heading that no normal target has, so every lint run reports `Missing required heading: ''` (`MTL601`) and the author sees the mistake; `MTL616` is silent for a run of only required exact-text template headings with empty text, so `MTL601` is the only finding (2.10 step 4) |
| `[unique-headings-names:x]`, `[unique-headings-names:]`           | anywhere                          | malformed (`MTL012`, a known family with an argument; on a heading the bracket stays in the text)                                                                                                                                                                                                                                                                                   |
| `[unique-heading-names]` (typo)                                   | a key line or a heading           | unknown tag (`MTL010` / `MTL011`); on a standalone frontmatter comment line, `MTL010` `Comment line {line}: unknown tag {tag}` (2.1)                                                                                                                                                                                                                                                |
| any form                                                          | a target file                     | inert (tags in a target are inert, 2.7; on a target heading the recognized tag is peeled from the text, 2.6)                                                                                                                                                                                                                                                                        |

DUPLICATE: two target headings X and Y of one scope are duplicates when their stored heading
texts are equal after FOLDING. The stored text is the text of 2.6: recognized trailing tags
peeled, and a trailing HTML comment such as a disable directive dropped.

- FOLDING is the JavaScript `String.prototype.toLowerCase()` of the whole text (the Unicode
  default lowercase mapping, locale independent), then plain code-unit equality.
- Nothing else is normalized: no trimming beyond heading extraction, no whitespace
  collapsing, no Unicode normalization (NFC and NFD spellings of one letter differ), no full
  case folding.
- Levels play no part: `# Notes`, `## notes` and `#### NOTES` are duplicates.
- Examples: `Notes`, `NOTES` and `notes` are equal; `Étape 2` and `ÉTAPE 2` are equal;
  `Straße` and `STRASSE` differ; `Notes` and `Notes:` differ.
- Headings inside fenced code are not headings (2.6) and never take part.

Finding (`MTL613` heading-unique-names):

- In one scope (the whole file, or one region), take the target headings in file order. The
  FIRST heading of each folded text is allowed. Every LATER heading with that folded text
  gets one `MTL613`, anchored on its own line (DIR5), naming the line of the first one:
  `Heading: duplicate heading name '{text}' (first at line {line})`, `{text}` the stored text
  of the later heading as written (not folded), `{line}` the target line of the first
  heading. Three headings `Notes` give two findings, both naming the first line.
- Overlapping scopes. Target sections are nested or disjoint, so the regions are too, and
  the template-wide scope contains them all. A heading X gets at most ONE `MTL613`: it is
  reported when some scope that contains X holds an earlier heading with X's folded text;
  `{line}` is the earliest such heading over all those scopes (the outermost one decides).
  Two disjoint regions (two sibling sections, two instances of a repeat heading) never see
  each other.
- Severity error, category `heading`, rule file `src/rules/heading.ts`, phase `target`, step
  `headings` (4.1 step 5). Suppressible (`MTL101`-`899`, DIR6): `disable-line MTL613` on the
  later heading, `disable-next-line MTL613` on the line before it, a `disable` /
  `begin disable` range over it, or `disable-file MTL613`.
- Emission order: inside step 5, after every other heading finding (after `MTL604`), in
  target line order. Rationale: the finding is about target text, not about one template
  heading, and appending keeps the order of every existing code unchanged.
- JSON and the `heading` member (8.1): the text of the later heading; as for the other
  heading codes, the anchor is internal and is not emitted as `line` (8.1, DIR5); its
  source line (8.1, the text excerpt) is the later heading line, and like every anchor-only
  finding it has no JSON `sourceLine` (8.5).
- The template itself is never linted against itself (1.1): two template headings with one
  text under the template-wide switch are not reported by the template; a complete target
  then fails `MTL613` (use the per-heading switch on the right subtree, below).

Interplay (one decision per case). Principle: the rule is ADDITIVE. Adding the tag adds
`MTL613` findings and changes nothing else: no match, no run, no tail, no extra list, no order
list and no other finding is affected. `MTL613` reads only the extracted target headings,
their lines and the regions. Why: a name is a property of the text, while the other heading
codes are properties of the outline. Keeping them apart keeps each rule one sentence and makes
the tag safe to add to an existing template.

- `[repeat-rules:same-level]` (2.10). A heading repeated BY DESIGN (`### Added` under each
  release) is a duplicate name by the definition above. Decision: the template-wide switch
  reports it (every `### Added` after the first, each naming the first one); it makes no
  exception for repeats, because a name is a name and an exception would need a second
  definition of "duplicate". The scope that avoids the false positives is the PER-HEADING
  switch on the repeat heading itself (`## Release [pattern:"..."] [repeat-rules:same-level]
[unique-headings-names]`): each instance is its own region, so `### Added` once per
  release passes and a second `### Added` inside ONE release is reported (worked example
  3). Known limit, accepted: with that placement two instances with the same text (two
  `## [1.2.0] - 2026-03-01`) are in different regions and are not reported; a tag on the
  parent (`# Changelog`, or the template-wide switch) reports them, and then the groups
  too.
- `[content:subheadings:disallow]` (`MTL612`) and `[content:subheadings:no-extra]`
  (`MTL615`). Independent: a heading may get `MTL612` or `MTL615` and also `MTL613` (one says
  "not in the template" or "not at this position", the other "this name is taken"; one fix,
  removing the duplicate, clears both). The listing rule of `MTL612` still lists a second
  heading with a listed text (2.6 "Listed": "duplicates are not this tag's concern"); this
  tag is the one whose concern they are.
- H1 title. No exception: an H1 is a target heading like any other, so under the
  template-wide switch `# Guide` and a later `## Guide` are duplicates (the `## Guide` is
  reported). On an H1 template heading (file scope) the per-heading region is the section of
  its match, up to the next H1.
- Pattern headings (2.10). The rule compares the stored TARGET texts, never a pattern or a
  LABEL: two instances `## Step 1` and `## step 1` of `[pattern:"{text}"]
[repeat-rules:same-level]` are duplicates in one scope; two template pattern headings with one pattern are `MTL017`'s concern, not this
  rule's.
- Template-only headings (`[presence:template-only]`). Template headings never take part
  (only target headings are compared), so a template-only heading, which is not in a valid
  target, is unaffected. A target heading with a template-only text (`MTL603`, set aside, 2.10
  step 1) is still a target heading: it is compared like any other, and may get `MTL613` too.
- Extra headings (`MTL616`, grammar.md "Extra"). Decision: independent, both reported. A
  duplicate in the tail of a run stays in the `MTL616` warning list AND gets the error
  `MTL613`; `MTL613` is not one of the errors that take a heading out of that list
  (`MTL612`, `MTL614`, `MTL615`, 2.10 step 4, unchanged). Rationale: those three are outline
  findings about the tail position itself; `MTL613` is not, and keeping the list unchanged
  is the additive principle above (worked example 3 shows both lines).
- Mismatches (`MTL606`), `MTL614` tail headings, missing headings. A mismatch and a tail
  heading are target headings and are compared; a missing template heading has no target
  heading and plays no part.
- Disable directives (4.4). A directive on a heading line is an HTML comment that heading
  extraction drops, so it never changes the compared text. Suppression filters the output
  only (4.1 step 8): a suppressed later duplicate still counts as an occurrence, and the
  first heading of a text stays the first whether or not other findings are suppressed. A
  directive on the FIRST heading removes nothing (the first heading has no `MTL613`).

`--verify` output (8.3, 8.5):

- The per-heading rule token is `unique-headings-names`, the tag body as written without
  brackets, like every heading token of 8.3 (`content:subheadings:disallow`,
  `repeat-rules:same-level`); it prints LAST in the heading's rules list, after
  `content:subheadings:no-extra`. The token `heading:unique-names` was considered and
  rejected: no 8.3 token differs from its tag body.
- The template-wide switch prints the line `Unique heading names: [unique-headings-names]`
  right after the `Filename:` line (or in its place when the template has none), followed by
  the blank line before the table, as the `Filename:` line is.
- JSON verify: each template gains `uniqueHeadingNames` (boolean, always present, `false`
  without the switch) right after `filenameCase`; additive, `schemaVersion` stays 1.

Grammar at spec level (these names are normative; `grammar/*.g4` stays normative for the
shape):

- Lexer `grammar/MdTemplateLexer.g4`, mode `TAG_STRICT` only: the keyword token
  `UNIQUE_HEADINGS_NAMES : 'unique-headings-names' ;` (case-insensitive by the grammar option,
  like `REPEAT_RULES` and `NO_EXTRA`).
- The tag has NO colon and no argument. It is the third exception to `tag` of section 2, after
  the quoted pattern argument and the dashed family: `uniqueNamesTag = "[unique-headings-names]"`.
  Stage 1 still reads it as a bare bracket (`tagBareBracket`); stage 2 accepts that exact name
  (any case) as a known tag, with no tag regex outside `grammar/*.g4`.
- Parser `grammar/MdTemplateParser.g4`:
  - `tagFamily` gains `UNIQUE_HEADINGS_NAMES`.
  - `bodyTagBody` gains the alternative `bodyUniqueNamesTag : UNIQUE_HEADINGS_NAMES ;`.
  - The template-wide line is the parser rule `fmUniqueNamesLine`, an `fmLine` alternative
    like `fmFilenameLine`: `FM_LINE_HASH WS? tagBareBracket WS? NL`, placed before
    `fmCommentLine`. Every standalone `# [word]` line parses there, and only the name
    `unique-headings-names` makes it the switch.
  - `fmUniqueNamesTag` is the `fmTagBody` alternative that keeps the tag inert after a key.
- AST kind `unique-names`, in both regions. After a key it is an inert tag, like the filename
  tag.
- The template-wide switch is `uniqueHeadingNames: boolean` on `Frontmatter` and on the loaded
  document model.
- There is no `TAG_TEXT` keyword: stage 1 keeps the bracket as a bare bracket, and the stage-2
  parse of it decides.
- A standalone `# [unique-headings-names:x]` is malformed (`MTL012`), like the filename line.

Worked example 1, the template-wide switch (file `notes/guide.md`). Template
`templates/guide.template.md`:

```text
1  ---
2  # [unique-headings-names]
3  title: "string"
4  ---
5
6  # Guide
7
8  ## Setup
9
10 ## Usage
```

Target:

```text
1  ---
2  title: Setup guide
3  ---
4
5  # Guide
6
7  ## Setup
8
9  ### Steps
10
11 ## Usage
12
13 ### Steps
14
15 ### setup
```

- Positional runs: `# Guide` takes line 5; `## Setup` takes line 7, `## Usage` line 11. The
  template has no H3, so lines 9, 13 and 15 are in no run: free detail, no `MTL616`.
- Scope: the whole file, headings in file order: `Guide` (5), `Setup` (7), `Steps` (9),
  `Usage` (11), `Steps` (13), `setup` (15). Line 13 folds to `steps`, first seen on line 9:
  `MTL613`. Line 15 folds to `setup`, first seen on line 7 (another level): `MTL613`.
- Expected text output (exit 1):

```text
  ✗ notes/guide.md
      error MTL613 Heading: duplicate heading name 'Steps' (first at line 9)
        13 | ### Steps
      error MTL613 Heading: duplicate heading name 'setup' (first at line 7)
        15 | ### setup
```

- Variant, H1 title: line 15 reads `### Guide`: `MTL613` `Heading: duplicate heading name
'Guide' (first at line 5)` on line 15 (the H1 is not exempt).
- Variant, suppression: line 13 reads `### Steps <!-- md-template-lint disable-line MTL613 -->`.
  The text stays `Steps`; the finding of line 13 is removed (`Suppressed:   1`), the one of
  line 15 stays.
  A fourth heading `### Steps` on line 17 would still name line 9, not line 13.
- Variant, no switch: line 2 removed: no finding, `✓ notes/guide.md`.

Worked example 2, the per-heading switch: a duplicate outside the region is allowed. Template:

```text
1  ---
2  title: "string"
3  ---
4
5  # Guide
6
7  ## Setup
8
9  ## Usage [unique-headings-names]
```

Target `notes/guide.md`:

```text
1  ---
2  title: x
3  ---
4
5  # Guide
6
7  ## Setup
8
9  ### Notes
10
11 ## Usage
12
13 ### Notes
14
15 #### Details
16
17 ### NOTES
```

- `## Usage` takes line 11; its region is lines 11 to 17 (no later heading of level 2 or
  lower): `Usage` (11), `Notes` (13), `Details` (15), `NOTES` (17).
- Line 13 has the text of line 9, but line 9 is outside the region: allowed. Line 17 folds to
  `notes`, first seen in the region on line 13: `MTL613`, naming line 13 (not line 9).
- Expected text output:

```text
  ✗ notes/guide.md
      error MTL613 Heading: duplicate heading name 'NOTES' (first at line 13)
        17 | ### NOTES
```

- Variant, the template-wide switch instead (line 2 `# [unique-headings-names]`, tag removed
  from `## Usage`): lines 13 and 17 are both reported, each `(first at line 9)`.
- Variant, the tagged heading is missing: target lines 11 to 17 removed. `## Usage` has no
  match, so no region and no `MTL613`; only `MTL601` `Missing required heading: 'Usage'`.
- Variant, template-only: `## Usage [presence:template-only] [unique-headings-names]` gives the
  `--verify` warning `MTL015` `Heading 'Usage': tag [unique-headings-names] has no effect (the
heading is [presence:template-only])`, and no `MTL613` in a lint run.

Worked example 3, a repeat heading (file `CHANGELOG.md`; `MTL613` next to `MTL616`).
Template:

```text
1  ---
2  version: "string"
3  ---
4
5  # Changelog
6
7  ## Release [pattern:"[{semver}] - {date}"] [repeat-rules:same-level] [unique-headings-names]
8
9  ### Added [presence:optional]
10
11 ### Fixed [presence:optional]
```

Target:

```text
1  ---
2  version: 1.2.0
3  ---
4
5  # Changelog
6
7  ## [1.2.0] - 2026-03-01
8
9  ### Added
10
11 ### Fixed
12
13 ## [1.1.0] - 2026-02-01
14
15 ### Added
16
17 ### Added
```

- Level 2: the repeat takes lines 7 and 13 (`n` 2). Regions: instance line 7 (lines 7 to 12)
  and instance line 13 (lines 13 to 17), disjoint.
- Instance 7: `### Added` takes line 9, `### Fixed` line 11; no duplicate in lines 7 to 12.
- Instance 13: `### Added` takes line 15; `### Fixed` (optional) does not match line 17 and
  takes nothing; line 17 is in the tail: the warning `MTL616`. In the region, line 17 folds
  to `added`, first seen on line 15: `MTL613`. Line 15 against line 9: other region, allowed.
- Expected text output (errors, then warnings, 4.1):

```text
  ✗ CHANGELOG.md
      error MTL613 Heading: duplicate heading name 'Added' (first at line 15)
        17 | ### Added
      warn  MTL616 Heading: Section '[1.1.0] - 2026-02-01': 1 extra heading(s) at level H3 after the template headings: ['Added']
        17 | ### Added
```

- Variant, the template-wide switch instead (line 2 `# [unique-headings-names]` before
  `version:`, tag removed from line 7): every repeated group is a duplicate: line 15
  `(first at line 9)` and line 17 `(first at line 9)`, plus the same `MTL616`. This is the
  false positive the per-heading placement avoids.
- Variant, no-extra: line 7 also carries `[content:subheadings:no-extra]`. Line 17 gets
  `MTL615` (which replaces its `MTL616`, 2.6) AND `MTL613`; two errors, `MTL615` first
  (`MTL613` comes last in step 5).
- Variant, a duplicate release: line 13 reads `## [1.2.0] - 2026-03-01`. Both instances are
  still taken, each its own region: no `MTL613` for line 13 (known limit above); with the
  template-wide switch line 13 is reported `(first at line 7)`.

Fixtures (pair fixtures `tests/fixtures/pairs/MTL613/<case>/template.md` and `target.md`,
template fixtures under `tests/fixtures/templates/MTL015/`, test
`tests/target/heading/MTL613-heading-unique-names.test.ts`; written by another author than the
rule, AGENTS.md "Independent tests"):

- `fail-template-wide-duplicate-at-another-level` (worked example 1);
- `fail-template-wide-case-insensitive-duplicate` (`Notes` and `NOTES`, `Étape` and `ÉTAPE`);
- `fail-template-wide-h1-title-repeated-as-h2` (H1 variant of worked example 1);
- `fail-three-duplicates-give-two-findings-naming-the-first`;
- `fail-per-heading-duplicate-inside-the-region` (worked example 2);
- `fail-per-heading-region-includes-the-tagged-heading` (a child with the text of M);
- `fail-repeat-instance-duplicate-group` (worked example 3, with its `MTL616`);
- `fail-template-wide-reports-repeated-groups` (template-wide variant of worked example 3);
- `fail-duplicate-also-gets-mtl615-under-no-extra` (no-extra variant of worked example 3);
- `fail-duplicate-also-gets-mtl612-under-disallow`;
- `fail-pattern-instances-with-the-same-text`;
- `fail-nested-tagged-regions-give-one-finding-naming-the-outermost-first`;
- `pass-per-heading-duplicate-outside-the-region-is-allowed`;
- `pass-repeat-instances-each-their-own-region` (worked example 3 without line 17);
- `pass-no-switch-duplicates-allowed`;
- `pass-differs-after-folding` (`Straße` and `STRASSE`, `Notes` and `Notes:`);
- `pass-heading-in-fenced-code-is-not-compared`;
- `pass-absent-optional-tagged-heading-has-no-effect`;
- `pass-template-only-tagged-heading-has-no-effect`;
- `pass-tag-on-a-key-line-is-inert`;
- `pass-disable-line-on-the-later-duplicate` (and one each for `disable-next-line`,
  `begin disable` / `end disable` and `disable-file`);
- template fixture
  `tests/fixtures/templates/MTL015/fail-template-only-with-unique-headings-names.md`.

Why this design:

- One tag in two places answers both needs: a document whose headings must all differ
  (template-wide, one line in the frontmatter, the place of the other template-wide tag), and
  a section whose subtree must not repeat itself while the outline repeats it by design
  (per-heading, the instances of a repeat heading).
- Case-insensitive, because `Notes` and `NOTES` read as one name to a reader and to most
  anchor generators.
- One finding per later heading, on its own line, because each later heading is a separate
  fix and a separate suppression. Naming the first line tells which heading to keep.
- Error, not warning, because the author opted in.
- The code `MTL613` was reserved for this rule (4.2). Its row is in 4.3, and it is listed in
  DIR6.

### 2.12 Optional frontmatter (`[frontmatter:optional]`)

One opt-in template tag, written as a standalone comment line in the template frontmatter,
lets a target omit its frontmatter block (ADR 0015, change C14). Why: a file such as a
`README.md` or a `TODO.md` usually has no frontmatter, and could not be linted for its name,
headings and content. Every other rule is unchanged by it. The rule `MTL031` reports a copy of
the tag that has no effect. Its fixtures are listed below.

The switch is `# [frontmatter:optional]`: a comment line of the template frontmatter block that
holds only this tag, in the placement family of the filename comment (2.5) and of
`# [unique-headings-names]` (2.11). It binds to no key. It may sit anywhere in the block, before
or after the keys and the other comments. Written on several lines, the first line is the
switch and every later line is `MTL031`. Keywords are case-insensitive (section 2), so
`# [FRONTMATTER:OPTIONAL]` is the same switch.

The comment on the opening delimiter (`--- # [frontmatter:optional]`) is NOT accepted. Only
spaces or tabs may follow the dashes of an opening delimiter (1.1), so such a line is body
text, the template has no frontmatter block and is `MTL001`. Accepting it would change what
opens frontmatter, in templates and in targets, and would not be additive (ADR 0015).

Placement cases (one answer per case):

| Written as                                                                   | Where                             | Result                                                                                                                                                                          |
| ---------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `# [frontmatter:optional]` alone on a line                                   | template frontmatter              | the switch (the first such line)                                                                                                                                                |
| a second or later `# [frontmatter:optional]` alone on a line                 | template frontmatter              | the first line stays effective; the later line gives `MTL031` `Comment line {line}: tag [frontmatter:optional] has no effect (already set on line {first})`, one per later line |
| `title: "x" # [frontmatter:optional]`                                        | template frontmatter key line     | inert; `MTL031` `Field 'title': tag [frontmatter:optional] has no effect (it must be alone on its comment line)`                                                                |
| `# note [frontmatter:optional]` (other text or tags on the line)             | template frontmatter comment line | inert; `MTL031` `Comment line {line}: tag [frontmatter:optional] has no effect (it must be alone on its comment line)`                                                          |
| `## Notes [frontmatter:optional]`                                            | template BODY, a heading          | inert; `MTL013` `Heading 'Notes [frontmatter:optional]': tag [frontmatter:optional] is not valid in a heading` (the tag is frontmatter-only, 2.7)                               |
| `# [frontmatter:optional:x]`, `# [frontmatter:required]` alone on a line     | template frontmatter              | malformed; `MTL012` `Filename comment: malformed tag {tag}` (the message of the standalone line, as `# [filename:case:bogus]`); no switch                                       |
| `# [frontmater:optional]` (typo)                                             | template frontmatter              | unknown tag; `MTL010` `Comment line {line}: unknown tag {tag}` (2.1); no switch                                                                                                 |
| any form                                                                     | a target file                     | inert (tags in a target are inert, 2.7); a target never carries the switch, and no `MTL031` is reported for it                                                                  |
| the tag, in a template without a frontmatter block (for example in its body) | template                          | the tag cannot be written: the template is broken, `MTL001` (the loader of a template never takes the option below)                                                             |

Behaviour matrix (the target, for a template that carries the switch unless said otherwise):

| Target                                              | Result                                                                                                                                                                                                                                                            |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| no frontmatter block                                | No `MTL001`. No field rule runs (4.1 step 3): no `MTL201` even for a required field, and no `MTL102`. No unknown key is found (`MTL202`, nothing to find). Filename case (`MTL101`), heading and content rules and body disable directives run as for any target. |
| frontmatter block                                   | Checked exactly as without the switch (the template fields, 4.1 step 3, and the unknown keys, step 4).                                                                                                                                                            |
| frontmatter block, YAML invalid or not a mapping    | `MTL002` or `MTL003`, as without the switch.                                                                                                                                                                                                                      |
| `---` opened and never closed                       | `MTL001`, as without the switch: a half-written block is an authoring error, not an absent block.                                                                                                                                                                 |
| empty file, or a body without the template headings | Every required template heading is `MTL601`, one per heading (a body-only target is a target like any other).                                                                                                                                                     |
| no frontmatter block, template WITHOUT the switch   | `MTL001` `Parse error: File must have YAML frontmatter (---...---)`, as today.                                                                                                                                                                                    |

Engine contract (the code is the detail; this is the part that is stable):

- The loader of a parsed text takes an optional parameter:
  `loadDocument(text, options?: { frontmatterOptional?: boolean })`
  (`src/engine/load.ts`, exported by `src/index.ts`). Without the option, or with `false`, it
  behaves as before: no frontmatter block is `frontmatter-missing` (`MTL001`). With the option
  and no frontmatter block that is not unclosed, it returns a body-only model: no fields, no
  filename tag, the sections and the findings and directives of the body.
- Only the target path passes the option, from the flag of the parsed template
  (`lintTarget`, `src/engine/pipeline.ts`). The template path (`checkTemplate`) and the file
  loader never pass it, so a template without a frontmatter block stays broken (`MTL001`).
- In the target steps of 4.1, step 3 (the template fields) is skipped when the target has no
  frontmatter block; it is reachable only through the option above. Steps 2, 4 (silent: the
  target has no keys), 5, 6, 7 and 8 run as for any target.
- The switch is `frontmatterOptional: boolean` on the template `Frontmatter` and on the loaded
  document model (true when a well-formed standalone line exists; false in a body-only target
  model). It is printed by `--verify` (8.3, 8.5).

`--verify` output (8.3, 8.5):

- The template-wide switch prints the line `Frontmatter: [frontmatter:optional]` right after
  `Unique heading names:` (or after `Filename:`, or first when neither is printed), followed by
  the one blank line before the table, as the other two lines are.
- The warning section `Conflicting frontmatter tags:` lists the `MTL031` findings with line and
  column and the template excerpt, after `Date fields without format:` and before the error
  sections (`src/cli/verify-report.ts`).
- JSON verify: each template gains `frontmatterOptional` (boolean, always present, `false`
  without the switch) right after `uniqueHeadingNames`; additive, `schemaVersion` stays 1.

Grammar at spec level (these names are normative; `grammar/*.g4` stays normative for the
shape):

- Lexer `grammar/MdTemplateLexer.g4`, mode `TAG_STRICT` only: the keyword token
  `FRONTMATTER : 'frontmatter' ;` (case-insensitive by the grammar option, like
  `REPEAT_RULES`). The word `optional` is the existing token `OPTIONAL`.
- The tag has the shape of section 2: `frontmatterTag = "[frontmatter:optional]"`.
- Parser `grammar/MdTemplateParser.g4`:
  - `tagFamily` gains `FRONTMATTER`.
  - `fmTagBody` gains the alternative `fmFrontmatterTag : FRONTMATTER COLON OPTIONAL ;`.
  - There is NO new `fmLine` alternative: a standalone `# [frontmatter:optional]` already
    parses as `fmFilenameLine` (`FM_LINE_HASH WS? tagCandidate WS? NL`), and the family of the
    candidate decides what the line is (the filename switch, or this switch).
  - `bodyTagBody` has no alternative for it: in a heading the tag is the wrong region
    (`MTL013`).
- AST kind `frontmatter-optional`, frontmatter only (`FRONTMATTER_KIND_SET`); after a key it is
  an inert tag, like the filename tag. The visitor is `src/tags/visitors/frontmatter.ts`.
- The switch is `frontmatterOptional: boolean` on `Frontmatter` and on the loaded document
  model; `Frontmatter.optionalTags` holds every well-formed copy of the tag (placement
  `alone`, `key` or `mixed`, with its position) for `MTL031`.
- A standalone `# [frontmatter:optional:x]` is malformed (`MTL012`), like the filename line.

Worked example 1, a target without frontmatter (file `notes/guide.md`, a pair of the config
with `include: notes/*.md`). Template:

```text
1  ---
2  # [frontmatter:optional]
3  title: "string" # [presence:required]
4  ---
5
6  # Guide
7
8  ## Context
9
10 ## Usage
```

Target:

```text
1  # Guide
2
3  ## Usage
4
5  Run the tool.
```

- No frontmatter block: no `MTL001`, and the required `title` is not checked (no `MTL201`).
- Headings: `# Guide` and `## Usage` match; `## Context` has no match.
- Expected text output (exit 1):

```text
  FAIL notes/guide.md
      error MTL601 Heading: Missing required heading: 'Context'
```

- Variant, the target adds `Context`: `## Context` between lines 1 and 3 gives no finding at
  all: `PASS notes/guide.md`.
- Variant, the target has a block without `title` (`---`, `author: x`, `---` before line 1):
  checked as without the switch, `MTL201` `Field 'title': required but empty or missing`.
- Variant, no switch: template line 2 removed: the target gets `MTL001` with the text `Parse error: File must have YAML frontmatter (---...---)` and no other diagnostic.
- Variant, empty target: `MTL601` for `Guide`, `Context` and `Usage` (a body-only target is
  a target like any other; this is intended).
- Variant, template line 2 written as `title: "string" # [frontmatter:optional]` instead:
  the tag is inert after a key, so the switch is not set and the target is `MTL001`; `--verify` prints the `MTL031` warning `Field 'title': tag [frontmatter:optional] has no effect (it must be alone on its comment line)`.

Fixtures (template fixtures under `tests/fixtures/templates/<code>/`, test
`tests/syntax/syntax/MTL031-frontmatter-tag-conflict.test.ts`; pair fixtures
`tests/fixtures/optional-frontmatter/<case>/template.md` and `target.md`, test
`tests/unit/optional-frontmatter.test.ts`; CLI fixtures
`tests/fixtures/cli/schema-pass-frontmatter-optional` and
`schema-fail-frontmatter-tag-conflict`):

- `MTL031`: `pass-single-standalone-line`, `pass-standalone-line-after-other-comments`,
  `pass-tag-uppercase`, `fail-duplicate-standalone-line`, `fail-tag-after-key`,
  `fail-tag-on-mixed-comment-line`, `fail-three-lines-two-findings`;
- other codes: `MTL012/fail-frontmatter-optional-with-argument`,
  `MTL013/fail-frontmatter-optional-in-heading`, `MTL010/fail-frontmatter-optional-typo`,
  `MTL001/fail-template-without-frontmatter-with-optional-tag-in-body`;
- pairs: `pass-target-without-frontmatter`, `pass-target-with-frontmatter`,
  `pass-body-directive-without-frontmatter`, `fail-target-with-frontmatter-missing-required-field`,
  `fail-target-with-invalid-frontmatter-value`, `fail-target-without-frontmatter-heading-missing`,
  `fail-target-without-frontmatter-content-rule`,
  `fail-target-without-frontmatter-filename-case`, `fail-unclosed-frontmatter`,
  `fail-invalid-yaml-frontmatter`, `fail-untagged-template-target-without-frontmatter`,
  `fail-empty-target`.

Why this design:

- A standalone comment line is the one placement that is additive: it parses as a line that
  already exists (`fmFilenameLine`), so a template without the tag, and every target, keep
  their findings.
- Skipping the template fields, not only the missing values, is required: an empty field map
  would still give `MTL201` for each required field.
- The filename check (`MTL101`) still runs, because it reads the file name, not the
  frontmatter. `MTL102` (`[value:filename]`) is a field rule and does not run.
- An unclosed `---` keeps `MTL001`: the author started a block.
- The warning `MTL031` exists because a misplaced switch would otherwise silently do nothing.

## 3. Types

### 3.1 The 17 types

`string`, `enum`, `list`, `date`, `path`, `url`, `int`, `float`, `bool`, `nested-map`,
`path-alias`, `list-of-string`, `list-of-int`, `list-of-date`, `list-of-path`, `list-of-url`,
`list-of-path-alias`.

Inference is LOOSE (shape based). Validation is STRICT. The two must stay separate for `date`
and `url`: a value that merely looks like a date is TYPED `date`, so the strict check can
reject it. A tighter inference would re-type a bad value to `string`, which has no format
check, and the value would pass. `path` is the one shared predicate, on purpose, so that prose
such as `n/a` is not typed as a path.

### 3.2 Inference order

`inferType(value, comment)` returns the first hit. The comment is the inline comment text
bound to the key (after `#`, trimmed).

Step A, declared hint (first hit wins):

1. The value is a string equal (trimmed, case-insensitive) to a type name: that type.
2. The value is a string containing the separator `|` (space, pipe, space): `enum`.
3. The comment contains an alias marker `@<name>/` or the bracket `[path-alias]`
   (case-insensitive), OR the value is alias-shaped (`@<name>/<rest>`): `path-alias`.
   If there is no comment, the hint search stops here with no hint.
4. The comment contains `YYYY-MM-DD` or the word `ISO`: `date`.
5. The first single-token bracket `[<word>]` (letters, digits, `_`, `-`) in the comment,
   lowercased, other than `rule`: that token.
6. The comment contains the word `url` or `lien`: `url`. Else the word `path`: `path`.

`type=<name>` in the comment is not a hint (see 2.4): it takes no part in this order.

Step B, promotion: if a hint was found, the value is a list and the hint is one of `date`,
`url`, `path`, `path-alias`, the type is `list-of-<hint>`. Otherwise the type is the hint.
There is no `list-of-enum`. `list-of-string` and `list-of-int` exist only through an explicit
hint (the value `"list-of-int"`, or the bracket `[list-of-int]`).

Step C, no hint, from the value alone:

1. Mapping: `nested-map`.
2. Non-empty list where every item is date-like: `list-of-date`; else every item
   url-like: `list-of-url`; else every item path-like: `list-of-path`; else `list`.
   An empty list is `list`.
3. String: alias-shaped, `path-alias`; date-like, `date`; url-like, `url`; path-like, `path`.
4. Anything else: `string`.

Kept quirk (Q01): a step A hint that is not one of the 17 types (`[foo]`) becomes the type
name. Such a type is never validated, and the bracket is also reported as an unknown tag
(`MTL010`).

### 3.3 Loose inference predicates

```text
date-like   matches one of the four shapes below, or the ongoing marker (calendar not checked)
url-like    non-blank string matching ^[A-Za-z][A-Za-z0-9+.\-]*://\S+$
path-like   see "path predicate" below (shared with validation)
alias-like  trimmed string matching ^@([A-Za-z0-9_-]+)/(.+)$
```

Date shapes (the only accepted formats, project wide):

```text
YYYY-MM-DD   ^\d{4}-\d{2}-\d{2}$
YYYY-MM      ^\d{4}-\d{2}$
YYYY         ^\d{4}$
DD/MM/YYYY   ^\d{2}/\d{2}/\d{4}$
```

Ongoing marker: `present` or `présent`, case-insensitive, with or without the accent.

### 3.4 The types and their rules

Each type has one rule and one stable code. The message is
`Field '<key>' (type=<type>): <detail>`. A list or mapping given to a scalar type is a shape
mismatch (`expected a scalar, got a list`), not a format failure on its text. `<shape>` is one
of `a list`, `a mapping`, `a scalar`.

| Type                 | Valid when (strict)                                                                                                                                                                  | Code     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| `string`             | Not a list and not a mapping.                                                                                                                                                        | `MTL501` |
| `list`               | A YAML list (items unchecked).                                                                                                                                                       | `MTL502` |
| `nested-map`         | A mapping. Sub-keys are never checked.                                                                                                                                               | `MTL503` |
| `date`               | Trimmed value is the ongoing marker, or one of the four shapes AND a real calendar date (`2025-02-29`, `2026-13-40`, `31/02/2020` fail; year `0000` fails; no lenient zero padding). | `MTL504` |
| `url`                | See "url predicate".                                                                                                                                                                 | `MTL505` |
| `path`               | See "path predicate".                                                                                                                                                                | `MTL506` |
| `path-alias`         | Trimmed value matches `^@[A-Za-z0-9_-]+/\S+$`.                                                                                                                                       | `MTL507` |
| `int`                | Trimmed value matches `^-?\d+$`. A decimal gets `got a decimal, expected an integer: '<value>'`.                                                                                     | `MTL508` |
| `float`              | Trimmed value matches `^-?\d+(\.\d+)?$` (no exponent).                                                                                                                               | `MTL509` |
| `bool`               | Trimmed value is `true` or `false`, case-insensitive.                                                                                                                                | `MTL510` |
| `list-of-string`     | A list whose items are not lists or mappings.                                                                                                                                        | `MTL511` |
| `list-of-int`        | A list, every item a valid `int`.                                                                                                                                                    | `MTL512` |
| `list-of-date`       | A list, every item a valid `date`.                                                                                                                                                   | `MTL513` |
| `list-of-path`       | A list, every item a valid `path`.                                                                                                                                                   | `MTL514` |
| `list-of-url`        | A list, every item a valid `url`.                                                                                                                                                    | `MTL515` |
| `list-of-path-alias` | A list, every item a valid `path-alias`.                                                                                                                                             | `MTL516` |
| `enum`               | Membership in the option list (see below). Not a type check.                                                                                                                         | `MTL517` |

A list type given a non-list value fails with `expected a YAML list of <things>, got <shape>`.
Block and flow YAML lists are both valid. A comma separated scalar is NOT a list.

The `date` and `list-of-date` checks above are the default date parsing of 2.9. A
`[format:date]` or `[format:elements:date]` tag narrows the accepted shape to `YYYY-MM-DD`
through its own codes (`MTL307`, `MTL309`); `MTL504` and `MTL513` keep this predicate and
their messages (change C11).

Enum: the options come from the TEMPLATE field value, split on `|`, each trimmed, empty ones
dropped. A target holds one option. With no options (a hint without a pipe list) there is no
check. A value not in the list is the error `MTL517` when the field is required, and a WARNING
when it is optional or conditional. An enum field skips the type check afterwards.

Url predicate (strict): the value is trimmed and has no whitespace, a scheme matching
`^[a-z][a-z0-9+.\-]*$` (case-insensitive), a non-empty authority (the text after `://` up to
the first `/`, `?` or `#`), and no `<>"{}|\^` inside the authority. That is all.

- The `[format:scheme:...]` allow-list is NOT part of this predicate. The scheme check belongs
  to `MTL304` and `MTL305` only, and those run only on a value that passes this predicate.
- The split is per value, and per item for lists. A valid URL with a disallowed scheme gives
  `MTL304` (`MTL305` for a list item) and never `MTL505` (`MTL515`). An invalid URL gives
  `MTL505` (`MTL515`) and never `MTL304` (`MTL305`).
- So a `list-of-url` with one valid but disallowed item and one invalid item gets both
  `MTL305` (naming the first item) and `MTL515` (naming the second).

Path predicate (shared by inference and validation): a value is a path when all of these hold:

- it is a non-blank string and not url-like;
- it has at least one `/` or `\` separator and no whitespace (shape
  `^(?:[A-Za-z]:)?[\\/]?(?:[^\s\\/]+[\\/])+[^\s\\/]*$`);
- it has no character from `<>"|?*` and no control character;
- it has no `:` other than one leading drive colon;
- it is ANCHORED: it starts with one of `./`, `../`, `.\`, `..\`, `/`, `\`, `~/`, `~\`, or a
  drive letter followed by `/` or `\`; OR it ends with an extension (`.` and one to five
  letters or digits).

`n/a`, `QA/Test` and `and/or` are not paths.

List text in messages (Q02): messages print a list in bracket form with quoted items
(`['a', 'b']`). A list or mapping used as `{value}` is printed in the same form (a mapping as
`{'k': 'v'}`). The placeholder for such a list is `{pylist}` in section 4.

## 4. Lint pipeline and rule codes

### 4.1 Order of checks for one target

1. Parse the target. A parse failure (`MTL001` to `MTL004`) is the only diagnostic; the file
   is not checked further. Message prefix: `Parse error: `. A target without a frontmatter
   block is not a parse failure when its template carries `# [frontmatter:optional]` (2.12);
   a `---` block that is never closed still is.
2. Filename case (`MTL101`).
3. For each template field, in template order. A target that has no frontmatter block (only
   possible under `[frontmatter:optional]`, 2.12) skips this whole step. Otherwise, if the
   target value of the field is missing or empty:
   required gives `MTL201`; optional and conditional are silent; then go to the next field.
   Otherwise run, in this order: constant (`MTL301`), count (`MTL401`, `MTL402`), range
   (`MTL403` to `MTL406`), order (`MTL407`), scheme (`MTL304`, `MTL305`), `[io:exists]`
   (`MTL80x`), value-filename (`MTL102`), case (`MTL302`), elements case (`MTL303`), then
   enum (`MTL517`) or the type rule (`MTL501` to `MTL516`), then shape (`MTL306` to
   `MTL309`, 2.9; step `shape`, appended last by change C11).
4. Unknown keys, in target key order (`MTL202`, warning).
5. Heading presence, order and sub-headings (`MTL601`, `MTL603`, `MTL604`, `MTL610` to
   `MTL612`, `MTL615`; `MTL602` is retired), heading patterns, repeat rules and order
   (`MTL605` to `MTL609`, `MTL614`, `MTL617`, 2.10, change C12), the extra warning
   (`MTL616`), all on the positional match of 2.10 (ADR 0012), then the unique heading
   names (`MTL613`, 2.11; last in the step, in target line order), message prefix
   `Heading: `.
6. Section content (`MTL701` to `MTL705`).
7. Directive diagnostics of the target (`MTL020` to `MTL025`, warnings, 4.4), in directive
   source order, `MTL024` last (DIR8).
8. Suppression (engine core, 4.4): every diagnostic of steps 2 to 6 that a directive covers
   (DIR7: a line directive or range on its anchor line, or a `disable-file` for its code)
   is removed and counted as suppressed. Step 7 diagnostics are never removed.

Steps 7 and 8 are new (change C08) and are appended at the end, so the numbers of steps 1
to 6 stay valid. A target without directives gives the same diagnostics and the same text
output as without directive support; JSON only gains the always present `summary.suppressed` key (8.5).
Errors are printed first, then warnings, each list in emission order.

Template-side diagnostics (`MTL001` to `MTL004` fatal, `MTL010` to `MTL016` and `MTL031` warnings,
`MTL017` to `MTL019` and `MTL030` errors) come from the template parse, once per template, before any
target. `MTL017`, `MTL018`, `MTL019` and `MTL030` are the non-fatal TEMPLATE ERRORS (2.7): a lint run prints
them on the template file and exits 1, and still runs steps 1 to 8 on every target with
the template as written; `--verify` fails the template, exit 1 (7.3, 7.5, 8.2). The
template warnings `MTL010` to `MTL016` and `MTL031` stay `--verify` output.

### 4.2 Code ranges

| Range          | Category (file in `src/rules/`) | Scope                                                                            |
| -------------- | ------------------------------- | -------------------------------------------------------------------------------- |
| `MTL001`-`099` | `syntax`                        | parsing, template tag and target directive diagnostics                           |
| `MTL100`-`199` | `filename`                      | rules on the target file name                                                    |
| `MTL200`-`299` | `presence`                      | field presence, unknown keys                                                     |
| `MTL300`-`399` | `format`                        | value shape rules from tags                                                      |
| `MTL400`-`499` | `bounds`                        | count, range, order                                                              |
| `MTL500`-`599` | `type`                          | type validation, enum                                                            |
| `MTL600`-`699` | `heading`                       | heading presence and order                                                       |
| `MTL700`-`799` | `content`                       | section body rules                                                               |
| `MTL800`-`899` | `io`                            | `[io:exists]` warnings                                                           |
| `MTL900`-`999` | none (engine)                   | run diagnostics: config, CLI, missing inputs (errors; `MTL913` may be a warning) |

Sub-ranges inside `syntax` (prose on purpose: the table above is read by `pnpm run
check:rules`, one row per category): `MTL001`-`009` parse errors, `MTL010`-`019` template
tag diagnostics (`MTL014` used by C12; `MTL015` used by C10; `MTL016` used by C11;
`MTL017` the template error heading-pattern-duplicate; `MTL018` the template error
heading-optional-min-conflict; `MTL019` the template error heading-child-order-conflict;
the sub-range is full), `MTL020`-`029` target directive warnings (4.4; `MTL026`-`029` free,
kept for directives), `MTL030`-`039` template tag diagnostics, continued (`MTL030`
heading-order-without-repeat, a template error, AS17; `MTL031` frontmatter-tag-conflict, a
template warning, C14, ADR 0015; `MTL032`-`039` free), `MTL040`-`099` free. Inside `format`: `MTL301`-`305` the original codes, `MTL306`-`309` field formats
(C11). Inside `heading`: `MTL601`-`604` the original codes (`MTL602` heading-level-missing
is RETIRED with the dropped `exist` tag: reserved, never reused; it has no 4.3 row and no
rule, and stays reserved here), `MTL605`-`609` heading patterns, repeat rules and order
(C12, 2.10), `MTL610`-`612` all levels (C10); `MTL613` heading-unique-names, the rule the
code was reserved for (the next free code of the heading range after `MTL612`; 2.11,
ADR 0013), with its row in the `heading` table of 4.3 and an implemented rule (not pending
in `tests/consistency/pending-rules.json`); `MTL614` heading-repeat-miss and `MTL615`
heading-subheadings-only-declared (ADR 0012); `MTL616` heading-extra (the only heading
warning); `MTL617` heading-order-key-missing; `MTL618`-`699` free.

### 4.3 Code table

Placeholders: `{key}` field name, `{value}` value as text, `{stem}` file name stem, `{text}`
heading text, `{pylist}` a list in the bracket form of 3.4 (`['a', 'b']`), `{shape}` see
3.4, `{type}` the field type (3.2), `{tag}` the tag as written, `{pattern}` the PATTERN of a
`[pattern:"..."]` tag as written between the quotes (2.10). Messages are the text printed
after the code in the output; codes that keep the text of the earlier linter are marked
`baseline` in the Origin column (ADR 0014), and a message changed from that text is marked
"changed".

#### syntax (`src/rules/syntax.ts`)

| Code     | Name                            | Severity | Message                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Origin                                                  |
| -------- | ------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `MTL001` | frontmatter-missing             | error    | `File must have YAML frontmatter (---...---)`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | baseline                                                |
| `MTL002` | yaml-invalid                    | error    | `YAML parse error: {detail}` (`{detail}` is the `yaml` package message, not the parser text of the earlier linter; accepted deviation)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | baseline                                                |
| `MTL003` | frontmatter-not-mapping         | error    | `YAML frontmatter must be a mapping of 'key: value' pairs`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | baseline                                                |
| `MTL004` | file-unreadable                 | error    | `{detail}` (read or UTF-8 decode failure)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | baseline                                                |
| `MTL010` | unknown-field-tag               | warning  | `Field '{key}': unknown tag {tag}` or `Comment line {line}: unknown tag {tag}` (on a standalone frontmatter comment line, 2.1)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | baseline                                                |
| `MTL011` | unknown-heading-tag             | warning  | `Heading '{text}': unknown tag {tag}`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | baseline                                                |
| `MTL012` | malformed-tag                   | warning  | `Field '{key}': malformed tag {tag}`, `Heading '{text}': malformed tag {tag}` or `Filename comment: malformed tag {tag}`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | new (located tag errors)                                |
| `MTL013` | misplaced-tag                   | warning  | `Field '{key}': tag {tag} is not valid in frontmatter` or `Heading '{text}': tag {tag} is not valid in a heading`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | new (change C05)                                        |
| `MTL014` | heading-pattern-invalid         | warning  | `Heading '{text}': invalid pattern [pattern:"{pattern}"] ({reason})` (`{text}` the template heading label; reasons and column in 2.10: unknown placeholder, malformed placeholder, unknown format, format argument (needs an argument, bad argument, takes no argument), unmatched brace, adjacent placeholders, invalid escape, empty pattern)                                                                                                                                                                                                                                                                                  | new (change C12; reasons extended by ADR 0012 and AS17) |
| `MTL015` | heading-tag-conflict            | warning  | `Heading '{text}': tag {tag} has no effect ({reason})` (template line and column of the tag; reasons in 2.7)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | new (change C10)                                        |
| `MTL016` | date-format-missing             | warning  | `Field '{key}' (type={type}): no {tag}, default date formats apply` (`{tag}` is `[format:date]` or `[format:elements:date]`; template key line, column 1; 2.9)                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | new (change C11)                                        |
| `MTL017` | heading-pattern-duplicate       | error    | `Heading '{text}': same pattern [pattern:"{pattern}"] as the previous heading '{prev}' (line {prevLine})` when the later heading is a pattern heading, or `Heading '{text}': matches the same headings as the previous heading '{prev}' (line {prevLine})` when it is an exact-text heading (`{text}` and `{prev}` template heading labels or texts, `{prevLine}` the template line of the earlier heading; phase `template`, template line and column of the later pattern tag's `[`, or of the first character of the later heading's text; template error: lint exit 1 with targets still linted, `--verify` FAIL; 2.7, 2.10) | new (ADR 0012; exact-text headings and lint runs: AS17) |
| `MTL018` | heading-optional-min-conflict   | error    | `Heading '{text}': tag {tag} contradicts [presence:optional] (a minimum of {min} requires the heading)` (`{text}` the template heading label, `{tag}` the explicit `min` tag as written, `{min}` its `N`; phase `template`, template line of the heading and column of that tag's `[`; template error like `MTL017`; 2.10 "Repeat rules")                                                                                                                                                                                                                                                                                        | new (AS17)                                              |
| `MTL019` | heading-child-order-conflict    | error    | `Heading '{text}' (H{n}): comes after the deeper child '{prev}' (H{m}, line {prevLine}) under '{parent}'` (`{text}` the first offending child of P, `{prev}` the first earlier child of P with a higher level, `{parent}` P, as template texts or labels; `{n}`, `{m}` their levels, `{prevLine}` the template line of `{prev}`; phase `template`, template line of the offending child, column 1; one per parent; template error like `MTL017`; 2.7)                                                                                                                                                                            | new (AS17, first revision)                              |
| `MTL020` | directive-malformed             | warning  | `Directive on line {line}: unknown directive '{word}' (expected disable, disable-line, disable-next-line, disable-file, begin disable or end disable)` or `Directive on line {line}: '{directive}' needs at least one rule code`                                                                                                                                                                                                                                                                                                                                                                                                 | new (C08)                                               |
| `MTL021` | directive-unknown-code          | warning  | `Directive on line {line}: unknown rule code '{token}'`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | new (C08)                                               |
| `MTL022` | directive-code-not-suppressible | warning  | `Directive on line {line}: rule code {code} cannot be disabled`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | new (C08)                                               |
| `MTL023` | directive-end-without-begin     | warning  | `Directive on line {line}: 'end disable {code}' has no open 'disable' or 'begin disable' for {code}`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | new (C08)                                               |
| `MTL024` | directive-begin-unclosed        | warning  | `Directive on line {line}: 'begin disable {code}' is never closed, it runs to the end of the file`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | new (C08)                                               |
| `MTL025` | directive-already-disabled      | warning  | `Directive on line {line}: '{directive} {code}' while {code} is already disabled since line {open}`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | new (C08)                                               |
| `MTL030` | heading-order-without-repeat    | error    | `Heading '{text}': tag {tag} needs [repeat-rules:same-level] (an order compares the repeats of one heading)` (`{text}` the template heading label, `{tag}` the effective order tag as written; phase `template`, template line of the heading and column of that tag's `[`; an order tag on a pattern heading without any repeat tag; template error like `MTL017`; 2.7)                                                                                                                                                                                                                                                         | new (AS17, second revision)                             |
| `MTL031` | frontmatter-tag-conflict        | warning  | `Comment line {line}: tag [frontmatter:optional] has no effect (already set on line {first})`, `Field '{key}': tag [frontmatter:optional] has no effect (it must be alone on its comment line)` or `Comment line {line}: tag [frontmatter:optional] has no effect (it must be alone on its comment line)` (`{first}` the line of the first standalone `# [frontmatter:optional]` line; phase `template`, template line and column of the tag's `[`; one per offending tag; template warning, `--verify` output; 2.7, 2.12)                                                                                                       | new (C14, ADR 0015)                                     |

`MTL020` to `MTL025` are the target directive warnings; their placeholders and rules are
under "Directive warnings" below (4.3) and in 4.4. `MTL030` and `MTL031` are
template tag diagnostics like `MTL010` to `MTL019`, numbered after the directive sub-range
(4.2).

`MTL001` to `MTL004` on a target print `Parse error: <message>`. On a template the same
diagnostic makes the template "broken" and is printed in ONE form everywhere (text, verify and
JSON `error`): `TEMPLATE ERROR: <template> - <message>`, where `<message>` is the message of
the code, for example `YAML parse error: ...` (8.2). The text output prints the full line.
The `Broken templates:` list prints `- <template> - <message>`, and the JSON `error` holds
the bare `<message>` with the template in its own field. Verify mode prints a broken
template with the same `TEMPLATE ERROR` line instead of its table (7.3, 8.3). The prefix
`Error: template parse failed:` of the earlier linter is not printed (D16).

Template file checks. A configured template path goes through three checks, in this order,
and each outcome has one code:

1. The path does not exist: `MTL910`, run error, exit 2.
2. The path exists but is not a regular file (a directory, a device; a symbolic link to a
   regular file counts as a file): `MTL911`, run error, exit 2. It says nothing about
   readability.
3. The path is a regular file but reading or UTF-8 decoding fails, or its content does not
   parse: `MTL004` or `MTL001` to `MTL003`. The template is "broken", exit 1, as before.

`MTL910` and `MTL911` skip only the pairs that use that template. Other pairs still run (D14).
The `MTL911` outcome is a change from the earlier linter, recorded as C04.

#### filename (`src/rules/filename.ts`)

| Code     | Name           | Severity | Message                                                                                      | Origin   |
| -------- | -------------- | -------- | -------------------------------------------------------------------------------------------- | -------- |
| `MTL101` | filename-case  | error    | `Filename '{stem}' does not match required case [filename:case:{convention}]`                | baseline |
| `MTL102` | value-filename | error    | `Field '{key}': expected value to equal filename '{stem}' ([value:filename]), got '{value}'` | baseline |

#### presence (`src/rules/presence.ts`)

| Code     | Name             | Severity | Message                                        | Origin   |
| -------- | ---------------- | -------- | ---------------------------------------------- | -------- |
| `MTL201` | required-missing | error    | `Field '{key}': required but empty or missing` | baseline |
| `MTL202` | unknown-key      | warning  | `Unknown key '{key}' not present in template`  | baseline |

#### format (`src/rules/format.ts`)

| Code     | Name                     | Severity | Message                                                                                         | Origin           |
| -------- | ------------------------ | -------- | ----------------------------------------------------------------------------------------------- | ---------------- |
| `MTL301` | constant-mismatch        | error    | `Field '{key}': expected constant value '{constant}', got '{value}'`                            | baseline         |
| `MTL302` | case-mismatch            | error    | `Field '{key}': value '{value}' does not match required format [{case}]`                        | baseline         |
| `MTL303` | elements-case-mismatch   | error    | `Field '{key}': list contains entries not matching [format:elements:{case}]: {pylist}`          | baseline         |
| `MTL304` | scheme-disallowed        | error    | `Field '{key}': URL scheme of '{value}' is not allowed [format:scheme:{schemes}]`               | baseline         |
| `MTL305` | scheme-disallowed-item   | error    | `Field '{key}': list contains URLs with a disallowed scheme {pylist} [format:scheme:{schemes}]` | baseline         |
| `MTL306` | semver-mismatch          | error    | `Field '{key}': value '{value}' is not a semantic version [format:semver]`                      | new (change C11) |
| `MTL307` | date-format-mismatch     | error    | `Field '{key}': value '{value}' is not a YYYY-MM-DD date [format:date]`                         | new (change C11) |
| `MTL308` | elements-semver-mismatch | error    | `Field '{key}': list contains entries not matching [format:elements:semver]: {pylist}`          | new (change C11) |
| `MTL309` | elements-date-mismatch   | error    | `Field '{key}': list contains entries not matching [format:elements:date]: {pylist}`            | new (change C11) |

`{schemes}` is the allow-list, lowercased, sorted, comma joined. `MTL306` to `MTL309` (2.9)
run in field step `shape`, anchor on the target key line (DIR5) and are suppressible (DIR6).
`MTL307` is silent for a value that fails the type `date` (`MTL504` reports it), and
`MTL309` does not list the items that fail the type `list-of-date` (`MTL513` lists them).
`{pylist}` holds the bad items in list order, as their text (Q02).

#### bounds (`src/rules/bounds.ts`)

| Code     | Name            | Severity | Message                                                                                              | Origin   |
| -------- | --------------- | -------- | ---------------------------------------------------------------------------------------------------- | -------- |
| `MTL401` | count-min       | error    | `Field '{key}': list has {n} item(s), minimum is {min}`                                              | baseline |
| `MTL402` | count-max       | error    | `Field '{key}': list has {n} item(s), maximum is {max}`                                              | baseline |
| `MTL403` | range-min       | error    | `Field '{key}': value {value} is below range:min {min}`                                              | baseline |
| `MTL404` | range-max       | error    | `Field '{key}': value {value} is above range:max {max}`                                              | baseline |
| `MTL405` | range-min-item  | error    | `Field '{key}': item(s) {pylist} are below range:min {min}`                                          | baseline |
| `MTL406` | range-max-item  | error    | `Field '{key}': item(s) {pylist} are above range:max {max}`                                          | baseline |
| `MTL407` | order-ascending | error    | `Field '{key}': dates are not in ascending order ('{prev}' comes before '{item}') [order:ascending]` | baseline |

The bound `{min}` / `{max}` of `MTL403` to `MTL406` is printed as the PARSED number, not as
written: a tag bound without `.` is an integer printed in plain decimal (`007` prints `7`,
`-0` prints `0`); a bound with `.` is a float printed in its shortest round-trip form with at
least one decimal (`2.50` prints `2.5`, `2.0` prints `2.0`). Very small and very large floats
(decimal exponent below -4, or 16 and above) print in exponent form with a signed exponent of
at least two digits (`0.00001` prints `1e-05`, `15000000000000000.0` prints `1.5e+16`), the
same output as before; JavaScript number formatting must not be used, it differs. `{value}`
in `MTL403` and `MTL404` is the raw text of the target value. `MTL401` and `MTL402` print the integer bound of `[count:...]` the same way.
One `MTL407` per decreasing adjacent pair.

#### type (`src/rules/type.ts`)

All messages are `Field '{key}' (type={type}): {detail}`; every detail text is `baseline`
(the text of the earlier linter, ADR 0014).

| Code     | Name                    | Severity         | Detail text                                                                                                                                 |
| -------- | ----------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `MTL501` | type-string             | error            | `expected a plain string, got {shape}`                                                                                                      |
| `MTL502` | type-list               | error            | `expected a YAML list, got {shape}`                                                                                                         |
| `MTL503` | type-nested-map         | error            | `expected a mapping (nested-map), got {shape}`                                                                                              |
| `MTL504` | type-date               | error            | `value is not a valid calendar date in an accepted format (YYYY-MM-DD / YYYY-MM / YYYY / DD/MM/YYYY / present / présent)`                   |
| `MTL505` | type-url                | error            | `value is not syntactically a valid URL (expected scheme://host/...)`                                                                       |
| `MTL506` | type-path               | error            | `value does not look like a valid path`                                                                                                     |
| `MTL507` | type-path-alias         | error            | `value is not a valid path alias (expected @<name>/<rest>)`                                                                                 |
| `MTL508` | type-int                | error            | `value is not a valid integer` or `got a decimal, expected an integer: '{value}'`                                                           |
| `MTL509` | type-float              | error            | `value is not a valid float`                                                                                                                |
| `MTL510` | type-bool               | error            | `value is not 'true' or 'false'`                                                                                                            |
| `MTL511` | type-list-of-string     | error            | `expected a YAML list of strings, got {shape}` or `list contains non-scalar entries: {pylist}` (items like `item 0 is a list`)              |
| `MTL512` | type-list-of-int        | error            | `expected a YAML list of integers, got {shape}` or `list contains non-integer entries: {pylist}`                                            |
| `MTL513` | type-list-of-date       | error            | `expected a YAML list of dates, got {shape}` or `list contains invalid date entries (expected a real calendar date in <formats>): {pylist}` |
| `MTL514` | type-list-of-path       | error            | `expected a YAML list of paths, got {shape}` or `list contains non-path entries: {pylist}`                                                  |
| `MTL515` | type-list-of-url        | error            | `expected a YAML list of URLs, got {shape}` or `list contains non-URL entries: {pylist}`                                                    |
| `MTL516` | type-list-of-path-alias | error            | `expected a YAML list of path aliases, got {shape}` or `list contains non-alias entries (expected @<name>/<rest>): {pylist}`                |
| `MTL517` | enum-option             | error or warning | `value '{value}' is not one of the allowed options {pylist}` (error when the field is required, warning when optional or conditional)       |

For scalar types a list or mapping gives `expected a scalar, got {shape}` under the same code.
`<formats>` is `YYYY-MM-DD / YYYY-MM / YYYY / DD/MM/YYYY / present / présent`.

#### heading (`src/rules/heading.ts`)

All messages carry the prefix `Heading: `.

| Code     | Name                              | Severity | Message                                                                                                                                                                                                                                                                                                                                                                                                                                        | Origin                     |
| -------- | --------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `MTL601` | heading-missing                   | error    | `Missing required heading: '{text}'`, or `Missing required heading: '{text}' (found later at line {line}, out of order)` when a sibling with that text comes later in the run (changed: the hint of 2.10 step 3b, AS17)                                                                                                                                                                                                                        | baseline                   |
| `MTL603` | heading-template-only             | error    | `Heading '{text}' is marked [presence:template-only] and must not appear in the linted file`                                                                                                                                                                                                                                                                                                                                                   | baseline                   |
| `MTL604` | heading-order                     | error    | `Heading order mismatch: template order {pylist} vs target order {pylist}`                                                                                                                                                                                                                                                                                                                                                                     | baseline                   |
| `MTL605` | heading-pattern-missing           | error    | `{in}missing required heading matching [pattern:"{pattern}"] (H{n})`                                                                                                                                                                                                                                                                                                                                                                           | new (change C12)           |
| `MTL606` | heading-pattern-mismatch          | error    | `{in}heading '{text}' does not match [pattern:"{pattern}"] at {piece}` (changed by ADR 0012)                                                                                                                                                                                                                                                                                                                                                   | new (change C12)           |
| `MTL607` | heading-repeat-min                | error    | `{in}{count} heading(s) match [pattern:"{pattern}"], minimum is {min}` (`{count}` may be 0, ADR 0012)                                                                                                                                                                                                                                                                                                                                          | new (change C12)           |
| `MTL608` | heading-repeat-max                | error    | `{in}{count} heading(s) match [pattern:"{pattern}"], maximum is {max}`                                                                                                                                                                                                                                                                                                                                                                         | new (change C12)           |
| `MTL609` | heading-pattern-order             | error    | `{in}heading '{text}' is not in {direction} order after '{prev}', {count} pair(s) out of order {tag}` (changed by ADR 0012: one per repeat set; changed by the first revision of AS17: `{tag}` is the order tag, 2.10 "Order")                                                                                                                                                                                                                 | new (change C12)           |
| `MTL610` | heading-missing-in-section        | error    | `Section '{parent}': missing required heading '{text}' (H{n})` (the second form, for the dropped `exist` tag, is gone)                                                                                                                                                                                                                                                                                                                         | new (change C10)           |
| `MTL611` | heading-order-in-section          | error    | `Section '{parent}': heading order mismatch: template order {pylist} vs target order {pylist}`                                                                                                                                                                                                                                                                                                                                                 | new (change C10)           |
| `MTL612` | heading-unlisted                  | error    | `Section '{parent}': heading '{text}' at level H{n} is not in the template [content:subheadings:disallow]`                                                                                                                                                                                                                                                                                                                                     | new (change C10)           |
| `MTL613` | heading-unique-names              | error    | `duplicate heading name '{text}' (first at line {line})` (category `heading`, prefix `Heading: `; phase `target`, step `headings`; `{text}` the stored text of the later duplicate target heading as written, `{line}` the target line of the first heading with the same folded text in the scope; one finding per later duplicate, anchored on its line, suppressible; emitted after every other step 5 finding, in target line order; 2.11) | new (ADR 0013)             |
| `MTL614` | heading-repeat-miss               | error    | `{in}{count} heading(s) match [pattern:"{pattern}"] after the end of its run [repeat-rules:same-level]: {pylist}`                                                                                                                                                                                                                                                                                                                              | new (ADR 0012)             |
| `MTL615` | heading-subheadings-only-declared | error    | `Section '{parent}': heading '{text}' at level H{n} is not declared at this position [content:subheadings:no-extra]`                                                                                                                                                                                                                                                                                                                           | new (ADR 0012)             |
| `MTL616` | heading-extra                     | warning  | `{in}{count} extra heading(s) at level H{n} after the template headings: {pylist}`                                                                                                                                                                                                                                                                                                                                                             | new (AS17)                 |
| `MTL617` | heading-order-key-missing         | error    | `{in}{count} heading(s) have no {kind} to order by {tag}, use a [pattern:...] with {placeholder}: {pylist}` (2.10 "Order")                                                                                                                                                                                                                                                                                                                     | new (AS17, first revision) |

Since change C10 (2.6) and the positional match (2.10, ADR 0012): the baseline messages of
`MTL601`, `MTL603` and `MTL604` are unchanged (except the "found later" hint that `MTL601`
gains, AS17), but their matches are positional and exact-level. `MTL601` (exact-text
heading) fires when the heading's position has no match (2.10 step 3b; `MTL602`, the check
of the dropped `exist` tag, is retired); `MTL601` and `MTL604` apply to file-scope template
headings only (H1, H2, and a deeper heading without template parent).
The `MTL601` hint (decision 6 of the open questions in AS17): `{line}` is the target line of
the first sibling, from the cursor of step 3b onward, whose text equals `{text}`; without
such a sibling the baseline message is printed. The line is message text only: `MTL601`
keeps no anchor and no excerpt (DIR5, DIR7).
`MTL603` applies in both scopes: the first sibling (same level, same scope: the whole file,
or the target section matched by the template parent) with the text of a checked
`[presence:template-only]` template heading is reported with the message above unchanged
(the text and line name the heading, no `Section '{parent}'` form), and every such sibling
is set aside from the run (2.10 step 1). `MTL610` to `MTL612` and `MTL615` are the other
section-scope findings:

- `MTL610`: a checked section-scope required exact-text template heading is missing.
  `{parent}` is the text of the target heading matched
  by the template parent, `{text}` and `{n}` the text and level of the missing template
  heading. Anchor: the line of that target parent heading.
- `MTL611`: the order check of 2.6 for the direct children of one template heading; the two
  lists as defined in 2.6. Anchor: the line of the target parent heading.
- `MTL612`: the topmost unlisted target heading under `[content:subheadings:disallow]` (2.6).
  `{text}` and `{n}` are the text and level of that target heading, `{parent}` the text of
  the target heading matched by the tagged template heading. Anchor: the unlisted heading's
  line. Suppressible (DIR6).
- `MTL615` (ADR 0012, 2.6): a direct target child of the match M of a heading D tagged
  `[content:subheadings:no-extra]` that no position of D's children took. `{text}` and `{n}`
  are the text and level of that child, `{parent}` the text of M. Anchor: the child's line.
  Suppressible (DIR6).
- `MTL605` to `MTL609`, `MTL614` and `MTL617` (change C12, ADR 0012, 2.10) are about one
  pattern heading T. `{in}` is empty
  when T has file scope and `Section '{parent}': ` when T has section scope, `{parent}` being
  the text of the target heading matched by T's template parent (the parent instance under a
  repeat parent). `{n}` is T's level. `{text}` is the text of the reported target heading.
  `{piece}` is the failing piece of 2.10 (a placeholder as written, or a literal in single
  quotes). `{count}` is the number of instances of one repeat set (`MTL607`, `MTL608`; 0 is
  possible for `MTL607`), the number of pairs out of order (`MTL609`) or the number of
  listed headings (`MTL614`, `MTL617`); `{min}` and `{max}` the bound of the explicit `min`
  or `max` tag, `{direction}` `ascending` or `descending`, `{tag}` the effective order tag
  in its canonical lowercase form (2.10 "Order"), `{prev}` the text of the earlier instance
  of the first pair out of order, `{pylist}` the texts of the listed headings in file order
  (the tail headings for `MTL614`, the instances without order key for `MTL617`), `{kind}`
  `number`, `date` or `semver` and `{placeholder}` the literal text `{number}`, `{date}` or
  `{semver}` (`MTL617`). `MTL605`: a required pattern heading whose position has no sibling
  left (or, for a literal pattern, a different sibling), no anchor. `MTL606`: the sibling a
  required placeholder position took as a mismatch, anchored on it. `MTL607`: fewer
  instances than an explicit `min`, anchored on the first instance (no anchor at zero
  instances; then it replaces `MTL605`). `MTL608`: more instances than `max`, anchored on
  the instance number `max + 1`. `MTL609`: one per repeat set out of order, anchored on the
  later instance of the first pair out of order. `MTL614`: one per repeat set with matching
  tail headings, anchored on the first listed heading. `MTL617`: one per repeat set under a
  `first:` order tag with at least one instance without order key, anchored on the first
  such instance. All suppressible (DIR6).
- `MTL616` (grammar.md "Extra", 2.10 step 4), the only WARNING of the category: one per run
  (one sequence in one scope) whose tail holds headings that no error names (`MTL612`,
  `MTL614`, `MTL615`, 2.10 "Interplay"). `{in}` as above (empty in file scope,
  `Section '{parent}': ` in section scope, `{parent}` the text of the target heading matched
  by the template parent of the sequence, or the instance text under a repeat parent), `{n}`
  the level of the run, `{count}` the number of listed headings, `{pylist}` their texts in
  file order. Anchor: the first listed heading. Suppressible (DIR6); a warning never changes
  the exit code (7.5).
- `MTL613` (2.11): one per later duplicate name in a scope of
  `[unique-headings-names]` (the whole file, or the region of each match or instance of an
  effective tagged heading), at most one per heading. `{text}` the text of that heading as
  written, `{line}` the target line of the earliest heading with the same folded text over
  the scopes that contain it. Anchor: the duplicate's line. Suppressible (DIR6). It has no
  template heading to sort by.
- Emission order inside step 5: findings sort by the template line of the template heading
  they are about (`MTL601`, `MTL603`, `MTL610`: that heading; `MTL611`: the parent;
  `MTL612` and `MTL615`: the tagged heading; `MTL605` to `MTL609`, `MTL614`, `MTL617`: the
  pattern heading; `MTL616`: the last position of its sequence), then by code, then by
  target line (for `MTL605` and an anchorless `MTL607`, the line of the target parent
  heading in section scope; two such file-scope findings sort by template line only);
  `MTL604` comes after them, and `MTL613` last of all, in target line order. A template
  without H3 to H6 headings and without the new tags gives the baseline order.

#### content (`src/rules/content.ts`)

The `{label}` is `Section '{text}'` for a file-scope heading and `Section '{parent} > {text}'`
for a section-scope heading (change C10, 2.6); for a pattern heading `{text}` is the checked
target heading's text and the label gains ` (pattern "{pattern}")`, `{pattern}` as written in
its tag (changed by decision 3 of the first revision in AS17, 2.6 "Content tags").

| Code     | Name              | Severity | Message                                                           | Origin   |
| -------- | ----------------- | -------- | ----------------------------------------------------------------- | -------- |
| `MTL701` | content-non-empty | error    | `{label}: [content:non-empty] section body is empty`              | baseline |
| `MTL702` | content-table     | error    | `{label}: [content:table] no markdown table row found`            | baseline |
| `MTL703` | content-list      | error    | `{label}: [content:list] no markdown list item found`             | baseline |
| `MTL704` | content-min-lines | error    | `{label}: [content:min-lines:{n}] only {count} non-blank line(s)` | baseline |
| `MTL705` | content-max-lines | error    | `{label}: [content:max-lines:{n}] {count} non-blank line(s)`      | baseline |

#### io (`src/rules/io.ts`)

All warnings. Paths in messages are printed with `/`. The pair root is joined with a
relative value as before, so a real run prints an absolute path, as the earlier linter did. The path separator normalisation is D15.

| Code     | Name               | Severity | Message                                                                                                                           | Origin   |
| -------- | ------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `MTL801` | alias-unapproved   | warning  | `Field '{key}': alias '@{name}/...' has no entry in config aliases, not checked` (changed: said `approved_path.yml`)              | baseline |
| `MTL802` | alias-path-missing | warning  | `Field '{key}': aliased path '@{name}/{rest}' resolved to {resolved} — does not exist`                                            | baseline |
| `MTL803` | absolute-skipped   | warning  | `Field '{key}': absolute path '{value}' skipped by [io:exists] (not checked); add it under approvedPaths in the config` (changed) | baseline |
| `MTL804` | path-missing       | warning  | `Field '{key}': path '{value}' does not exist (resolved: {resolved})`                                                             | baseline |
| `MTL805` | url-unreachable    | warning  | `Field '{key}': URL '{value}' not reachable ({reason})`                                                                           | baseline |

#### run errors (engine, no rule file)

Not rules. They describe a problem with the run itself. All are errors (exit code 2) except
`MTL913`, whose severity comes from `onEmpty` (see 7.4). Details of each are in sections 6
and 7.

| Code     | Name                 | Message (shape)                                                                                                | Origin                                 |
| -------- | -------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `MTL901` | config-not-found     | `config file not found: {path}` or `no md-template-lint.yml found from {dir} upward`                           | new (replaces the wrapper scripts)     |
| `MTL902` | config-yaml-invalid  | `cannot parse {path}: {detail}`                                                                                | baseline                               |
| `MTL903` | config-unknown-key   | `{keyPath}: unknown key '{key}'`                                                                               | new                                    |
| `MTL904` | config-invalid-value | `{keyPath}: expected {expected}, got {actual}`; missing required keys use `{keyPath}: required key is missing` | baseline (alias entry checks)          |
| `MTL905` | config-invalid-name  | `{keyPath}: invalid name '{name}'`, reserved or duplicate names                                                | new                                    |
| `MTL906` | config-unknown-root  | `{keyPath}: root '{name}' is not declared`                                                                     | new                                    |
| `MTL907` | config-invalid-glob  | `{keyPath}: invalid glob '{glob}': {detail}`                                                                   | baseline (invalid regex)               |
| `MTL908` | config-bad-version   | `unsupported config version {n}`                                                                               | new                                    |
| `MTL909` | root-not-found       | `root '{name}' directory not found: {path}`                                                                    | baseline                               |
| `MTL910` | template-not-found   | `template not found: {path} (pair '{name}')`                                                                   | baseline                               |
| `MTL911` | template-not-a-file  | `template path is not a regular file (for example a directory): {path} (pair '{name}')`                        | new (see "Template file checks" below) |
| `MTL912` | target-not-found     | `target not found: {path}`                                                                                     | baseline                               |
| `MTL913` | empty-target-set     | `no files matched pair '{name}' in root '{root}'` (changed, C03; severity warning or error from `onEmpty`)     | baseline                               |
| `MTL920` | unknown-option       | `unknown option: {flag}`                                                                                       | baseline                               |
| `MTL921` | option-missing-arg   | `{flag} requires an argument`                                                                                  | baseline                               |
| `MTL922` | option-bad-value     | `invalid value '{value}' for {flag} (expected {expected})`                                                     | new                                    |
| `MTL923` | usage-conflict       | e.g. `--verify needs a config or at least one template path`                                                   | baseline                               |

#### Directive warnings (`MTL020` to `MTL025`, rows in the `syntax` table above)

Target directive warnings (4.4, change C08), category `syntax`, `src/rules/syntax.ts`, phase
`target`, step `directives`. All are warnings, never change the exit code and
are never suppressible. Each carries the `line` and `column` of the directive start (`<!--`
or `#`), and the message names the line too: the message must stay readable on its own, in
the JSON `message` and in logs that drop the excerpt rows of 8.2 (which quote that line with a
caret under the start). `{line}` is the 1-based file line of the directive. `{directive}` is the canonical
lowercase verb (`disable`, `disable-line`, `disable-next-line`, `disable-file`, `begin
disable`, `end disable`). `{code}` is a rule code in upper case. `{token}` and `{word}` are the text as
written (control characters escaped as in 8.2). One diagnostic per offending code token; a
token written twice in one directive (compared in upper case) counts once, like a code.

`{word}` of `MTL020` is the first word after the keyword (leading commas and spaces are skipped,
so `,MTL201` gives `MTL201`), or empty (`''`) when the keyword is alone; for a two-word verb that is broken (`begin disabel`, `end` alone) it is the first word
(`begin` or `end`) when the second word is not `disable`, else the verb is valid. `{open}` of `MTL025` is the line of the directive that opened the active range.
`disable-file` never opens a range, so it never takes part in `MTL023`, `MTL024` or
`MTL025` (DIR8); it can give `MTL020` (no code), `MTL021` and `MTL022` like every verb.

The six rows live in the `syntax` table because `pnpm run check:rules` reads only the rows
under a heading whose first word is a category (`tests/consistency/rules.test.ts` pins the
row count). This heading holds the prose only.

### 4.4 Disable directives in target files

A target file may silence rule codes locally with comments. This is the only way a target
changes which diagnostics are reported (change C08). The grammar and parser read the
directives, the engine applies the suppression and reports `MTL020` to `MTL025`, and the
README documents them (section 9). Each decision below is numbered (DIR1 to DIR10, cited from other sections) with its rationale; the global
assumptions are AS9 to AS13 (section 10).

#### Forms and syntax (DIR1, DIR2)

DIR1. Six directive words give four behaviours (inline, open disable, block, whole document):

| Directive                   | Covers (file lines, inclusive)                                                                        |
| --------------------------- | ----------------------------------------------------------------------------------------------------- |
| `disable <codes>`           | from its own line to the line of a matching `end disable`, else to the end of the file                |
| `disable-line <codes>`      | its own line only (inline)                                                                            |
| `disable-next-line <codes>` | the next file line only (line + 1, even when that line is blank)                                      |
| `disable-file <codes>`      | the whole target document, wherever it stands: every line, and every diagnostic without anchor (DIR7) |
| `begin disable <codes>`     | from its own line to the line of the matching `end disable` (block)                                   |
| `end disable <codes>`       | closes the open range (`disable` or `begin disable`) of each listed code, on its own line             |

`disable` and `begin disable` open the same kind of range. The only difference: an unclosed
`begin disable` is a mistake (`MTL024`, the range still runs to the end of the file), while an
unclosed `disable` is the normal, intended use. Rationale: both an open
`disable` and a `begin`/`end` block are needed; ESLint users also know `disable-line` and
`disable-next-line`, and the next-line form keeps a busy line clean (a YAML key with a long
value, a heading) by putting the comment on its own line above it.

`disable-file` is the only directive that covers a diagnostic without anchor (a missing
key, a missing heading, the heading order, the file name; DIR5, DIR7). It opens no range, so
`end disable` does not close it and it never conflicts with a range (DIR8). Rationale: a
finding about the whole file has no line a line directive could point at; a dedicated verb
states the whole-file intent explicitly, in one place, instead of inferring it from where a
range happens to end. There is no alias: a draft name, `disable-document`, was never
released and is an unknown verb (`MTL020`) like any other.

DIR2. Syntax. A directive is the content of one comment (carriers in DIR3):

```text
directive  = keyword WS+ verb (SEP item)* (SEP reason)? SEP?
keyword    = "md-template-lint"
verb       = "disable" | "disable-line" | "disable-next-line" | "disable-file"
           | "begin" WS+ "disable" | "end" WS+ "disable"
SEP        = ("," | WS)+                          ; commas and/or spaces and tabs
item       = word                                 ; validated afterwards as a code
word       = (any character except "," and WS)+, but not exactly "--"
reason     = "--" (WS any text)?                  ; free text, ignored
```

Each `item` is checked after parsing, never by the grammar: it is a code when it matches
`MTL` and three digits (case-insensitive) and names a code of the 4.3 tables. A suppressible
code (DIR6) is kept; a known code that is not suppressible gives `MTL022`; any other item
(`MTL2O1`, `201`, `MTL050`) gives `MTL021`. Example: `disable-line MTL601 -- x` parses as
verb, SEP, item `MTL601`, SEP, reason `-- x`.

- The comment content, after leading spaces and tabs, must START with the keyword followed by
  a space, a tab or the end of the content. Otherwise the comment is plain prose, silently
  (`<!-- see md-template-lint docs -->` is not a directive).
- Keyword, verbs and codes are case-insensitive (`MD-Template-Lint Disable mtl202` is valid);
  codes are normalized to upper case. Rationale: tag keywords are case-insensitive too (section 2 intro).
- Codes are separated by commas, spaces or tabs, in any mix: `MTL201, MTL202`,
  `MTL201,MTL202` and `MTL201 MTL202` are equal. Empty items (`MTL201,,MTL202`, a trailing
  comma) are ignored. A code listed twice in one directive counts once.
- The code list ends at the end of the content or at a word that is exactly `--` (preceded
  by a separator, followed by whitespace, a comma or the end); the rest, without that one
  leading comma, is a free-text reason (`<!-- md-template-lint disable-line MTL202 -- kept for import -->`).
  Rationale: a reason documents why, and `--` inside an HTML comment is valid HTML5.
- There is no wildcard and no "disable everything": a directive without a code is `MTL020`.
  Rationale: explicit codes keep each suppression reviewable.
- Error cases (warnings, 4.3 `syntax` table and "Directive warnings"): an unknown verb or a keyword alone is
  `MTL020`; a verb with no item is `MTL020`; an item that is not a code of the 4.3 tables
  (`MTL2O1`, `201`, `MTL050`) is `MTL021`; a known code that is not suppressible (DIR6) is
  `MTL022`. A bad item is dropped; the valid codes of the same directive still apply. A
  malformed verb (`MTL020`) makes the whole directive inert.
- When every item of a directive is dropped (all `MTL021` or `MTL022`), there is no extra
  `MTL020`: those warnings already explain the problem. The directive is inert (it opens,
  closes and covers nothing). Rationale: one warning per mistake, no duplicate.
- A code that never fires in this file is fine: no warning (no "unused directive" check).
  Rationale: a directive may guard a value that is only sometimes wrong; an unused check
  would add noise and a new code for little gain.

#### Carriers and where directives are read (DIR3, DIR4)

DIR3. Carriers. Only in a TARGET file, in two forms:

- Body (after the frontmatter): an HTML comment `<!--` ... `-->` that opens and closes on the
  same line. Its content is the text between `<!--` and the first following `-->`. The
  comment may stand anywhere on the line, also after text or on a heading line
  (`## Notes <!-- md-template-lint disable-line MTL701 -->`; heading extraction already drops
  a trailing HTML comment, 2.6, so the heading still matches). Several directive comments on
  one line are read left to right. A multi-line HTML comment is never a directive.
- Frontmatter: a YAML comment. Its content is the text after the `#`. Two places only: the
  trailing comment of a top-level key line (the same lines that bind field comments, 2.1:
  lines that match a top-level key of the parsed YAML document), and a whole-line comment
  whose `#` is in column 1 and that the `yaml` document treats as a comment (not a line inside
  a multi-line quoted or flow value). An HTML comment in the frontmatter is YAML text, not a
  directive. Comments on indented sub-keys and list items are not read (their findings anchor
  on the top-level key line anyway, DIR5).

Rationale: an HTML comment is invisible in rendered Markdown and is the convention of
markdownlint and Prettier; YAML has its own comment syntax, and most field findings anchor on
key lines, which can only hold a YAML comment. Single-line comments keep the parse
line-based and simple. The comment lexing lives in the grammar (`grammar/*.g4`), like
every other token of the linter (AGENTS.md, no tag regex outside the grammar).

DIR4. Not read:

- in a template (body or frontmatter): a template is the schema and is never suppressed;
  such a comment is inert prose there, with no warning, and is not shown by `--verify`;
- inside a fenced code block (the fences of 2.6, the lexer fence modes);
- inside an inline code span: a `<!--` that lies between a pair of equal backtick runs on the
  same line;
- after a target parse failure (`MTL001` to `MTL004`): the file is not linted (4.1 step 1).

Known limitation, accepted: indented code blocks (four spaces) are not detected, as for
headings (2.6). Directive comments stay part of the section body text, so a directive line
counts as a non-blank line for `MTL701`, `MTL704` and `MTL705`. Put a directive about a
section on its heading line to keep the body unchanged. Rationale: the body text is the
established contract (2.6, HTML comments are prose); stripping comments would change content
results for files without directives.

Line numbers: 1-based physical lines of the whole file after line-ending normalization (1.1),
line 1 is the opening `---`. The same numbering as field and heading lines.

#### Anchors and the coverage rule (DIR5, DIR6, DIR7)

DIR5. Anchor line. The engine gives each target diagnostic an anchor: one target line, or
none. The anchor is internal (a side table, like the item and section sort keys of the
pipeline); its number is not printed on its own and does not change `line` in JSON, so for a
target without directives the diagnostic set stays identical (JSON differs only by the
always present `summary.suppressed` key, 8.5). The text formats quote the anchored line
below the diagnostic (source line, 8.1; excerpt, 8.2), which is the one intended change of
the text output (change C09).

| Codes                                                                                             | Anchor                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MTL101`                                                                                          | none (the file name)                                                                                                                                                                                           |
| `MTL201`                                                                                          | the target key line when the key is present with an empty value; none when the key is missing                                                                                                                  |
| `MTL202`                                                                                          | the target key line                                                                                                                                                                                            |
| field steps: `MTL102`, `MTL301`-`MTL309`, `MTL401`-`MTL407`, `MTL501`-`MTL517`, `MTL801`-`MTL805` | the target key line of that field (`MTL306`-`MTL309`: change C11)                                                                                                                                              |
| `MTL601`, `MTL604`, `MTL605`                                                                      | none (missing heading, order of the whole file; `MTL605`: change C12, also in section scope; the "found later" line of the `MTL601` hint is message text, not an anchor; the retired `MTL602` had none either) |
| `MTL606`, `MTL609`                                                                                | the line of the reported target heading (the sibling taken as a mismatch; for `MTL609` the later instance of the first pair out of order; 2.10, change C12, ADR 0012)                                          |
| `MTL607`                                                                                          | the line of the first instance of the repeat set; none when the set has no instance (2.10, change C12, ADR 0012)                                                                                               |
| `MTL608`                                                                                          | the line of the instance number `max + 1` of the repeat set (2.10, change C12)                                                                                                                                 |
| `MTL614`                                                                                          | the line of the first tail heading the finding lists (2.10, ADR 0012)                                                                                                                                          |
| `MTL617`                                                                                          | the line of the first instance without order key the finding lists (2.10 "Order")                                                                                                                              |
| `MTL616`                                                                                          | the line of the first tail heading the warning lists (grammar.md "Extra", 2.10 step 4)                                                                                                                         |
| `MTL603`                                                                                          | the line of the first set-aside sibling with that text (the one that fired, 2.10 step 1)                                                                                                                       |
| `MTL610`, `MTL611`                                                                                | the line of the target parent heading (the match of the template parent, 2.6; change C10)                                                                                                                      |
| `MTL612`                                                                                          | the line of the unlisted target heading that is reported (2.6; change C10)                                                                                                                                     |
| `MTL613`                                                                                          | the line of the later duplicate target heading that is reported (2.11)                                                                                                                                         |
| `MTL615`                                                                                          | the line of the undeclared direct child that is reported (2.6; ADR 0012)                                                                                                                                       |
| `MTL701`-`MTL705`                                                                                 | the line of the target heading whose section was checked (the positional match or instance, 2.6, 2.10)                                                                                                         |

A key line is the line of the key itself (for a duplicate key, the last occurrence, Q06),
never the lines of a multi-line value. Rationale: the key line is what the user sees as the
field, and it is already known to the engine (`Field.line`).

DIR6. Suppressible codes: the file diagnostics of a parsed target, `MTL101` to `MTL899`
(categories filename, presence, format, bounds, type, heading, content, io). NOT
suppressible, and named in a directive they give `MTL022`:

- `MTL001` to `MTL004`, on a target or a template: a file that does not parse is not linted
  and its directives are not read; a broken template is never suppressed;
- `MTL010` to `MTL019`, `MTL030` and `MTL031`: template tag diagnostics (warnings, and the template
  errors `MTL017`, `MTL018`, `MTL019` and `MTL030`); they are never
  emitted for a target (tags in a target are inert, 2.7; in a lint run the template errors
  are printed on the template file, not on a target, 8.2), and the template cannot carry
  directives (DIR4). `MTL015` (change C10), `MTL016` (change C11), `MTL014` (change C12),
  `MTL017`, `MTL018`, `MTL019` and `MTL030` (ADR 0011, ADR 0012) are in this list for the
  same reason;
- `MTL020` to `MTL025`: directive warnings; a directive cannot silence its own diagnostics;
- `MTL900` to `MTL999`: run diagnostics; they belong to the run, not to a file line.

Rationale: only findings about the content of one target are local to that file; the others
describe the template, the run or the directives themselves. The new heading codes
`MTL610` to `MTL612` (change C10) are in `MTL101` to `MTL899`, so they are suppressible;
all three have an anchor (DIR5), so a line directive covers them per heading. In particular
`MTL612` is suppressible and `MTL015` is not. Likewise the field format codes `MTL306` to
`MTL309` (change C11) are suppressible and anchor on the target key line, while `MTL016`
is not suppressible. The heading pattern codes `MTL605` to `MTL609` (change C12),
`MTL614`, `MTL615`, the warning `MTL616` and `MTL617` (ADR 0011, ADR 0012) are
suppressible: `MTL606`, `MTL608`, `MTL609`, `MTL614`, `MTL615`, `MTL616`, `MTL617` per
heading line (for `MTL614`, `MTL616` and `MTL617` the line of the first listed heading,
which removes the whole finding), `MTL607` per
heading line when it has an anchor, `MTL605` and an anchorless `MTL607` (no instance) only
by `disable-file`. `MTL613` (2.11) is suppressible per later duplicate heading line
(`disable-line`, `disable-next-line`, a range over it, or `disable-file MTL613`); `MTL014`,
`MTL017`, `MTL018`, `MTL019`, `MTL030` and `MTL031` (C14) are not suppressible. `MTL601` with its
"found later" hint stays anchorless (DIR7). The retired `MTL602` (its rule is removed) is
no registered code and has no 4.3 row, so a directive naming it
gives `MTL021` (DIR2).

DIR7. Coverage rule. A suppressible diagnostic with code C is removed when:

- the target holds a valid `disable-file` for C, anywhere in the file (any carrier of
  DIR3, before or after the finding). This covers every diagnostic with code C, with or
  without anchor;
- or it has an anchor line A, and some line directive or range for C covers A (DIR1 table: a
  `disable-line` on A, a `disable-next-line` on A - 1, or a `disable` / `begin disable` range
  that starts at or before A and is not closed before A; the `end disable` line itself is
  covered).

A diagnostic without anchor (`MTL101`, `MTL201` for a missing key, `MTL601` with or without
its "found later" hint, `MTL604`, `MTL605`, `MTL607` with no instance; DIR5) is
covered ONLY by `disable-file`. A finding that lists several headings (`MTL614`, `MTL616`,
`MTL617`)
is one diagnostic with one anchor: a line directive on its anchor removes it whole, a directive on
another listed line removes nothing. `disable`, `begin disable`,
`disable-line` and `disable-next-line` never cover it, whether their range is closed or runs
to the end of the file. The match is by code only: a `disable-file MTL601` silences every
missing heading of the file, not one named heading.

Rationale: a finding without anchor (missing field, missing heading, heading order, file
name) concerns the whole file and has no line; any line-based rule (first lines, nearest
directive, a range that happens to stay open) would be arbitrary and easy to trigger by
accident. One explicit whole-file verb keeps the intent reviewable. Consequence, documented
in the README: a missing key or a missing heading is silenced with
`disable-file <code>` (for example `<!-- md-template-lint disable-file MTL601 -->`
in the body or `# md-template-lint disable-file MTL201` in the frontmatter), never with
an open `disable`. Likewise, a body `disable MTL202` does not cover the frontmatter keys
(they come before its range); use `disable-file MTL202` or a frontmatter directive.

#### Range bookkeeping (DIR8)

DIR8. Directives are processed in source order (line, then column). Per code:

- `disable C` or `begin disable C` while C is not open: opens a range at this line.
- `disable C` or `begin disable C` while C is open: `MTL025`, no effect (the first range
  keeps its start). Rationale: no nested counting; one open range per code is easy to reason
  about.
- `end disable C` while C is open: closes the range at this line (inclusive).
- `end disable C` while C is not open: `MTL023`, no effect.
- End of file with C still open from `begin disable`: `MTL024`, emitted once per open code,
  ordered by the source position (line, then column) of the `begin disable`, and for several
  codes opened by one directive by the order of the codes in that directive, first to last;
  the range runs to the end of the file. Still
  open from `disable`: silent.
- `disable-line` and `disable-next-line` never open or close a range and never conflict with
  one (no `MTL025`).
- `disable-file C` never opens or closes a range: no `MTL023`, `MTL024` or `MTL025` for
  it, also when C is open or already named by another `disable-file` (repeating it is
  harmless, no warning). `disable C` after it opens a range as usual, and `end disable C`
  does not end its effect (with no open range for C, that `end disable` is `MTL023`).

Step 7 of 4.1 emits the directive diagnostics in directive order, `MTL024` last. A file that
is linted against two pairs is processed once per pair, so its directive warnings appear in
both blocks, like any other warning.

#### Counts, exit codes and reporters (DIR9)

DIR9. A suppressed diagnostic is removed before anything counts it:

- it is not printed (text, `--quiet`, JSON), not counted in `Warnings:` /
  `summary.warnings` or `filesWithWarnings`, and does not make a file fail: a file whose only
  errors are suppressed is `✓` and JSON status `pass`, and the exit code follows the rest
  (7.5);
- it is counted per pair-file lint in the text summary line `Suppressed:` (shown only when
  greater than 0, 8.2) and in JSON `summary.suppressed` (always present, 0 when none, 8.5);
- the directive warnings `MTL020` to `MTL025` are normal file warnings: printed, counted in
  `Warnings:`, hidden by `--quiet`, never in `Suppressed:`.

Rationale: the count keeps suppression visible in CI without listing what was hidden; listing
suppressed findings would need a new output section for little gain. JSON stays
`schemaVersion` 1 because the new key is additive.

#### Interactions (DIR10)

DIR10.

- Presence, value and content tags: no interaction. The rules still run in full; suppression
  only filters their output (4.1 step 8). Suppressing `MTL201` does not run the value checks
  of an empty field, and does not change the `MTL517` severity. A `disable-file MTL601`
  hides a missing heading but does not make it present: the order check (`MTL604`) still
  see it as absent.
- File-list mode (7.2): no difference. Directives belong to the target file, whatever pair or
  mode selected it.
- `--quiet` (7.1): suppressed diagnostics are never printed in any mode; `--quiet` prints no
  summary, so no `Suppressed:` line either.
- `--verify` (7.3): no target is read, so no directive is read; templates never carry
  directives (DIR4). Directives change nothing in verify output and exit codes (JSON only
  gains `summary.suppressed`, 0, 8.5); the excerpt rows of C09 are a separate change.

Rationale: suppression is a pure output filter on one target, so it composes with every tag,
mode and flag without special cases.

#### Worked examples

Template for the examples (fields `title`, `status` required; `reviewer: alice # [format:constant:alice]
[format:snake_case]` and `import_id: 7 # [format:constant:7]` only where an example uses them; headings
`# Notes`, `## Overview [content:non-empty]`, `## Details [content:non-empty]`, `## Context`).
The suppressed codes are real: each example fires them without its directives.

Example 1, `disable-line` and `disable-next-line` in the frontmatter and on a heading:

<!-- prettier-ignore -->
```yaml
---
title: Notes
status: draft
owner: alice # md-template-lint disable-line MTL202
# md-template-lint disable-next-line MTL301, MTL302
reviewer: Bob
draft: yes
---

# Notes

## Overview <!-- md-template-lint disable-line MTL701 -->

## Details

## Context
```

- Line 4 `owner`: `MTL202` anchored on line 4, covered by its `disable-line`. Suppressed.
- Line 6 `reviewer`: `MTL301` (not the constant `alice`) and `MTL302` (not snake_case) anchored on
  line 6, both covered by the `disable-next-line` of line 5 (multi-code list). Two suppressed.
- Line 7 `draft`: `MTL202` anchored on line 7, no directive. Reported (negative case).
- Line 12 `## Overview`: `MTL701` anchored on line 12, covered. Suppressed.
- Line 14 `## Details`: `MTL701` anchored on line 14, no directive. Reported (negative case).
- Negative variant: `# md-template-lint disable-line MTL202` alone on line 5 covers line 5
  only, so `reviewer` would still report `MTL301` and `MTL302`.
- Summary: `Suppressed:   4`.

Example 2, a `begin disable` / `end disable` block over several keys, with a multi-code list
(frontmatter only; the body is the one of example 1):

<!-- prettier-ignore -->
```yaml
---
title: Notes
status: draft
# md-template-lint begin disable MTL202, MTL301
import_id: 42
import_owner: alice
# md-template-lint end disable MTL202 MTL301
extra: x
---
```

- Range for `MTL202` and `MTL301`: lines 4 to 7. `import_id` (line 5, value `42` is not the
  constant `7`): `MTL301` suppressed. `import_owner` (line 6): `MTL202` suppressed.
- `extra` (line 8): after the block, `MTL202` reported (negative case).
- Without line 7, both ranges run to the end of the file: `extra` is suppressed too, and two
  `MTL024` warnings are printed, `Directive on line 4: 'begin disable MTL202' is never
closed, it runs to the end of the file` and the same for `MTL301`.

Example 3, `disable-file` and diagnostics without anchor (file `notes/draft.md`):

<!-- prettier-ignore -->
```yaml
---
title: Draft
---

<!-- md-template-lint disable-file MTL201, MTL601 -- filled in later -->

# Notes

## Overview

Text.
```

- `status` is missing: `MTL201` without anchor, covered by the `disable-file MTL201` of
  line 5. Suppressed.
- `## Details` and `## Context` are missing: two `MTL601` without anchor, covered by
  `disable-file MTL601`. Suppressed.
- Expected text output: the file passes, its block is `✓ notes/draft.md` with no diagnostic
  line, and the summary shows `Suppressed:   3`.
- The same result with the directive in the frontmatter, for example
  `# md-template-lint disable-file MTL201, MTL601` as line 2, or at the end of the file:
  the position does not matter.
- Negative variant: replace `disable-file` by `disable`. The range runs to the end of the
  file, but a range never covers a diagnostic without anchor, so all three are reported, no
  `Suppressed:` line:

```text
  ✗ notes/draft.md
      error MTL201 Field 'status': required but empty or missing
      error MTL601 Heading: Missing required heading: 'Details'
      error MTL601 Heading: Missing required heading: 'Context'
```

- Negative variant: `disable-file MTL201` only. The two `MTL601` are reported, the file
  fails, `Suppressed:   1`.

Example 4, `disable-file` on anchored diagnostics (file `notes/imported.md`):

<!-- prettier-ignore -->
```yaml
---
title: Notes
status: draft
import_id: 42
import_owner: alice
---

# Notes

## Overview

Text.

## Details

Text.

## Context

<!-- md-template-lint disable-file MTL202 -- imported keys -->
<!-- md-template-lint end disable MTL202 -->
```

- `import_id` (line 4) and `import_owner` (line 5): `MTL202` anchored on lines 4 and 5. The
  `disable-file MTL202` on line 20 comes after them but covers the whole document.
  Suppressed.
- Line 21: `end disable` does not end a `disable-file`, and no range for `MTL202` is open,
  so it gives `MTL023`; the two keys stay suppressed.
- Expected text output:

```text
  ✓ notes/imported.md
      warn  MTL023 Directive on line 21: 'end disable MTL202' has no open 'disable' or 'begin disable' for MTL202
        21 | <!-- md-template-lint end disable MTL202 -->
           | ^
```

and the summary shows `Warnings:     1 (in 1 file(s))` and `Suppressed:   2`.

- Negative variant: replace `disable-file` by `disable` on line 20. Its range starts on
  line 20 (and ends on line 21), after both key lines, so the two `MTL202` are reported.

Example 5, ignored places and directive warnings:

<!-- prettier-ignore -->
````yaml
---
title: Notes
status: draft
---

```text
<!-- md-template-lint disable MTL601 -->
```

Inline code is prose: `<!-- md-template-lint disable MTL601 -->`.

<!-- md-template-lint disabel MTL601 -->
<!-- md-template-lint disable MTL2O1, MTL910 -->
<!-- md-template-lint end disable MTL202 -->
<!-- md-template-lint begin disable -->
````

- Lines 7 and 10: inside a fence and inside a code span. Not directives, no warning.
- Line 12: `MTL020` `Directive on line 12: unknown directive 'disabel' (expected disable,
disable-line, disable-next-line, disable-file, begin disable or end disable)`.
- Line 13: `MTL021` `Directive on line 13: unknown rule code 'MTL2O1'` (letter O) and
  `MTL022` `Directive on line 13: rule code MTL910 cannot be disabled`. Both items are
  dropped, so the directive is inert (no range opens) and there is no extra `MTL020`.
- Line 14: `MTL023` `Directive on line 14: 'end disable MTL202' has no open 'disable' or
'begin disable' for MTL202`.
- Line 15: `MTL020` `Directive on line 15: 'begin disable' needs at least one rule code`.
- The missing headings still give `MTL601`: no `disable-file MTL601` is read, and the
  `disable MTL601` lines would not cover them even if read (DIR7).
- Variant: `<!-- md-template-lint disable-file -->` added as line 16 gives `MTL020`
  `Directive on line 16: 'disable-file' needs at least one rule code`.

## 5. Defect decisions (D01 to D18)

Decisions are fix, keep or drop. The defects are those of the earlier linter and its wrapper
scripts, catalogued in [ADR 0014](adr/0014-legacy-behaviour-catalogue.md). Defect ids are
never renumbered.

| ID  | Defect (short)                                                                                                        | Decision | Reason and how                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --- | --------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D01 | Wrappers ask for template names that do not exist; agent and skill pairs never linted, run exits 0                    | fix      | The wrappers are gone. The config names real files, and a missing template is always an error (`MTL910`, exit 2), never a silent skip. Migration: use the installed names (`agent.template.md`, `skill.template.md`).                                                                                                                                                                                                                                                                                 |
| D02 | Missing template, missing dir or empty file set is a warning; zero files still prints "All files passed!" with exit 0 | fix      | Missing template: `MTL910`, exit 2. Missing root: `MTL909`, exit 2. Empty file set: `MTL913`, severity from `onEmpty` (default `warn`, config global or per pair, values `warn`, `error`, `ignore`; effects in 7.4). A run with zero files linted, no broken template and no run error prints `No files linted.` and never `All files passed!`; with a broken template or a run error the failure summary shows instead (8.2). In file-list mode (lint-staged) unmatched files are normal and silent. |
| D03 | Multi-project run order is random                                                                                     | fix      | Fixed order (8.4): roots in declaration order, pairs in config order, files sorted. Output is deterministic.                                                                                                                                                                                                                                                                                                                                                                                          |
| D04 | Absolute path test misses `C:/x`; `~/` never expanded                                                                 | fix      | One path resolver for config values: `~` and `~/` expand to the home directory; absolute means a drive letter with either slash, a leading `/` or `\`, or `~`; `\` is read as `/` in config paths and globs; relative paths resolve against the config directory (6.2).                                                                                                                                                                                                                               |
| D05 | One process per file, template re-parsed every time                                                                   | fix      | One process. Each distinct template is parsed once per run and cached by resolved path. Each target is read and parsed once per pair.                                                                                                                                                                                                                                                                                                                                                                 |
| D06 | `Warnings:` counts files with warnings                                                                                | fix      | Summary `Warnings:` counts warning diagnostics. Files with warnings are shown next to it: `Warnings:     7 (in 4 file(s))`. JSON has both counts.                                                                                                                                                                                                                                                                                                                                                     |
| D07 | `--pattern` regex and recursive vs wrapper wildcard and optional recursion                                            | fix      | One dialect: globs in config (`include`, `exclude`), recursion explicit with `**`. The flags `--pattern`, `--dir`, `--ignore` are dropped. Regex `exclude` becomes a glob (6.5).                                                                                                                                                                                                                                                                                                                      |
| D08 | Output shows file name only; same names collide                                                                       | fix      | Every printed and JSON path is relative to its root with `/` separators. Multi-root output also prints the root in the block header.                                                                                                                                                                                                                                                                                                                                                                  |
| D09 | Usage error, missing input and lint failure all exit 1                                                                | fix      | Exit 0 clean, 1 lint failure or broken template, 2 usage, config or missing-input error (7.5). `--help` and `--version` are exit 0 wherever they appear. No arguments is NOT an error: it lints the whole config.                                                                                                                                                                                                                                                                                     |
| D10 | Double error for one cause (bad regex or dir, then "no files matched")                                                | fix      | One cause, one diagnostic. An invalid glob is `MTL907` and that pair is not evaluated for an empty set. A missing root is `MTL909` and its pairs report nothing more.                                                                                                                                                                                                                                                                                                                                 |
| D11 | `[io:exists]` relative paths depend on the working directory                                                          | fix      | Resolved against the pair ROOT, never the working directory. `--base-dir` is dropped.                                                                                                                                                                                                                                                                                                                                                                                                                 |
| D12 | `approved_path.yml` is global, holds absolute machine paths                                                           | fix      | Replaced by `aliases` and `approvedPaths` in the per-project config. Values may be relative to the config directory, or `~`. The old `approved_path.yml` file is not read. Invalid entries are config errors (`MTL904`) instead of silent warnings.                                                                                                                                                                                                                                                   |
| D13 | Wrappers need a fixed global skill folder, a separate interpreter, Windows paths                                      | fix      | Installed from npm (Node >=22.18). No fixed location, no wrapper, no separate interpreter. Config paths are relative, `~` based or absolute; separators are normalized.                                                                                                                                                                                                                                                                                                                               |
| D14 | Multi-project wrapper aborts on the first missing root, no partial run                                                | fix      | A missing root is `MTL909` for that root only. Other roots are still linted. Exit code is 2 at the end. Nothing is lost silently.                                                                                                                                                                                                                                                                                                                                                                     |
| D15 | Mixed `/` and `\` in printed lines                                                                                    | fix      | Every printed path (text and JSON, including inside `MTL80x` messages) uses `/` on every OS.                                                                                                                                                                                                                                                                                                                                                                                                          |
| D16 | Broken template detected by matching the linter output text                                                           | fix      | No text matching. The engine returns a structured template status (`ok` or `broken`, with the `MTL001` to `MTL004` diagnostic; an unreadable or non-UTF-8 template is broken too, as before). Text output is rendered from it. JSON carries it.                                                                                                                                                                                                                                                       |
| D17 | Prompt sidecar data fails the prompt template (data drift)                                                            | drop     | Not a tool defect. md-template-lint reports such failures as normal lint errors. Any fixture note belongs in the comparison report of ADR 0014, not in the tool.                                                                                                                                                                                                                                                                                                                                      |
| D18 | `Error:` lines of the earlier linter print OS-specific paths                                                          | fix      | Same as D15: forward slashes everywhere. Comparisons with the earlier output are made after normalizing separators.                                                                                                                                                                                                                                                                                                                                                                                   |

## 6. Configuration: `md-template-lint.yml`

One config file per project replaces the wrapper scripts and `approved_path.yml`. It is
YAML, parsed with the `yaml` library and validated strictly: unknown keys are errors.

### 6.1 Discovery

- `--config <path>`: use that file. Missing: `MTL901`.
- Otherwise search for `md-template-lint.yml` in the current directory, then each parent up to
  the file system root. First match wins. None found: `MTL901` (except `--verify` with explicit
  template paths, which needs no config).
- The config directory (the folder holding the file) is the implicit root `project`.

### 6.2 Path values

Every path in the config (roots, aliases, approved paths, templates) follows one resolver:

1. `~` or `~/...` expands to the home directory.
2. A drive letter followed by `/` or `\`, a leading `/` or `\` is absolute.
3. Otherwise relative to the config directory.
4. `\` is read as `/`. Printed paths always use `/`.
5. The result is not required to exist at validation time (existence is checked at run time:
   `MTL909`, `MTL910`, `MTL911`).

### 6.3 Schema

```yaml
version: 1 # optional, only 1 is valid
onEmpty: warn # optional, warn | error | ignore (default warn)

roots: # optional, extra roots (multi-root, external roots)
  shared: ../shared-templates
  notes: ~/notes # external root, outside the project

aliases: # optional, alias name -> directory, for @name/ values with [io:exists]
  assets: ./assets

approvedPaths: # optional, directories where absolute values may be probed
  - ~/notes

allowPrivateNetworks: false # optional, default false; lets [io:exists] URL probes reach private ranges

pairs: # required, at least one
  - name: adr # optional label, unique
    template: docs/templates/adr.template.md # required
    templateRoot: project # optional, default project
    roots: project # optional, name, list of names, or "*"; default project
    include: docs/adr/*.md # required, glob or list of globs
    exclude: "**/README.md" # optional, glob or list of globs
    description: architecture decision records # optional
    onEmpty: warn # optional, overrides the global value
```

| Key                    | Type                      | Required | Default           | Rules                                                                                                                                                                                                      |
| ---------------------- | ------------------------- | -------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `version`              | integer                   | no       | `1`               | Must be `1`, else `MTL908`.                                                                                                                                                                                |
| `onEmpty`              | `warn`, `error`, `ignore` | no       | `warn`            | Policy when a pair matches no file (7.4).                                                                                                                                                                  |
| `roots`                | map name to path          | no       | empty             | Names match `^[A-Za-z0-9_-]+$`. `project` is reserved (`MTL905`). Order is kept (it fixes output order).                                                                                                   |
| `aliases`              | map name to path          | no       | empty             | Names as above. The name is written WITHOUT `@` (changed: a leading `@` used to be stripped, now it is rejected with `MTL905`). Value is a non-empty string, else `MTL904`.                                |
| `approvedPaths`        | list of path              | no       | empty             | Non-empty strings. An absolute value in a document is probed only inside one of these folders.                                                                                                             |
| `allowPrivateNetworks` | boolean                   | no       | `false`           | When `true`, URL probes of `[io:exists]` may reach RFC 1918, 100.64.0.0/10 and fc00::/7 addresses. Loopback, link-local, cloud metadata and IPv4-mapped IPv6 stay blocked (AS8). Other types are `MTL904`. |
| `pairs`                | list of pair              | yes      | none              | Non-empty list, else `MTL904`.                                                                                                                                                                             |
| `pairs[].name`         | string                    | no       | generated (below) | Explicit names match `^[A-Za-z0-9_.-]+$` and are unique, else `MTL905`.                                                                                                                                    |
| `pairs[].template`     | path                      | yes      | none              | Resolved by 6.2, but a relative path is relative to `templateRoot`.                                                                                                                                        |
| `pairs[].templateRoot` | root name                 | no       | `project`         | Must be `project` or a declared root (`MTL906`).                                                                                                                                                           |
| `pairs[].roots`        | root name, list, or `"*"` | no       | `project`         | Each name is `project` or declared (`MTL906`). `"*"` means every root declared under `roots` (not `project`); `"*"` with no declared root is `MTL904`. A pair runs once per listed root.                   |
| `pairs[].include`      | glob or list of globs     | yes      | none              | Non-empty. Each glob per 6.4, else `MTL907`.                                                                                                                                                               |
| `pairs[].exclude`      | glob or list of globs     | no       | empty             | Same glob rules. A file is a target when it matches an include and no exclude.                                                                                                                             |
| `pairs[].description`  | string                    | no       | none              | Shown in the `Target:` line.                                                                                                                                                                               |
| `pairs[].onEmpty`      | `warn`, `error`, `ignore` | no       | global            | Overrides the global value for this pair.                                                                                                                                                                  |

Default pair name: after all explicit names are read, each unnamed pair, in config order,
gets the file name of its `template` without the last extension (`adr.template.md` gives
`adr.template`), with every character outside `[A-Za-z0-9_.-]` replaced by `-`; an empty
result becomes `pair`. If that name is already taken (an explicit name or an earlier
generated one), `-2`, `-3`, and so on is appended until it is free. A generated name never
raises `MTL905`; only two explicit names that are equal do. The name appears in messages
(`pair '<name>'`) and in JSON.

### 6.4 Globs

- Matched against the file path relative to the root, with `/` separators, case-sensitive,
  on every OS.
- `*` any characters except `/`. `?` one character except `/`. `**` as a whole path segment
  matches zero or more segments (so `a/**/*.md` matches `a/x.md`). `[abc]` a class.
  `{a,b}` alternation. A leading `.` is matched like any character (dot files and folders are
  included).
- Invalid globs: empty string, absolute (`/` first or a drive letter), containing `..`,
  starting with `!` (use `exclude`), unbalanced `[`, `{` or `}`, a character class with a reversed
  range (`[z-a]`, detail `invalid character class`). Error `MTL907`.
- Symlinked directories are not traversed. Only files are targets.

### 6.5 Multi-root, external root and migration

A root is a folder where pairs run. The implicit root `project` is the config directory. A
root outside the config directory is an EXTERNAL root (sibling repository, data folder).
`pairs[].roots` makes one pair run on several roots (multi-root).

External root, templates kept in the project (replaces the external-repo wrapper):

```yaml
roots:
  data: ~/data/prompts
pairs:
  - template: templates/prompt.template.md
    roots: data
    include: _prompts/*.md
```

Multi-root with shared templates (replaces the multi-project wrapper):

```yaml
roots:
  shared: ../shared-templates # holds the templates only
  app-a: ../app-a
  app-b: ../app-b
pairs:
  - name: agents
    template: agent.template.md
    templateRoot: shared
    roots: [app-a, app-b]
    include: .opencode/agents/*.md
  - name: skills
    template: skill.template.md
    templateRoot: shared
    roots: [app-a, app-b]
    include: .opencode/skills/**/*SKILL.md
```

`roots: "*"` would also run on `shared`, so a root used only for templates is listed by name
in `pairs[].roots` instead. The order inside `pairs[].roots` does not change the output
order (8.4).

Conversion of a pair of the earlier PowerShell wrapper scripts (their keys to config keys):

| Wrapper key                        | Config                                                      |
| ---------------------------------- | ----------------------------------------------------------- |
| `template`                         | `template` (+ `templateRoot` when it was global)            |
| `targetDir` and `pattern`          | `include: <targetDir>/<pattern>` (default pattern `*.md`)   |
| `Recurse = true`                   | `**` between folder and pattern: `<targetDir>/**/<pattern>` |
| `Exclude` (regex on the file name) | `exclude`, as a glob: `^README\.md$` becomes `**/README.md` |
| `description`                      | `description`                                               |
| repo root of the wrapper           | the config directory (or a `roots` entry)                   |
| `approved_path.yml` entries        | `aliases`                                                   |

### 6.6 Validation errors

Errors are collected (not first-fail) and printed together, sorted by key path in config
order. Any config error stops the run before linting (exit 2). Root and template file
errors are run-time errors (exit 2 at the end) and do not stop other roots or pairs: `MTL909`
(root directory missing), `MTL910` (template path missing) and `MTL911` (template path exists
but is not a regular file). A template that is a regular file but cannot be read or parsed is
not a run error: it is a broken template (`MTL001` to `MTL004`, exit 1).

| Case                                                                                                             | Code     | Example message                                                    |
| ---------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------ |
| YAML syntax error, empty file, root not a map, duplicate key, non-UTF-8 input, multi-document file, read failure | `MTL902` | `cannot parse md-template-lint.yml: <detail>`                      |
| Unknown key at any level                                                                                         | `MTL903` | `pairs[0].inlcude: unknown key 'inlcude'`                          |
| Wrong type, missing required key, bad enum value                                                                 | `MTL904` | `pairs[1].include: expected string or list of strings, got number` |
| Bad name, reserved `project`, duplicate pair name                                                                | `MTL905` | `roots.project: invalid name 'project' (reserved)`                 |
| Pair references an undeclared root                                                                               | `MTL906` | `pairs[0].roots: root 'app-c' is not declared`                     |
| Bad glob                                                                                                         | `MTL907` | `pairs[0].include[1]: invalid glob '../x': contains '..'`          |
| Bad `version`                                                                                                    | `MTL908` | `unsupported config version 2`                                     |

## 7. CLI

### 7.1 Synopsis

```text
md-template-lint [options] [files...]
md-template-lint --verify [options] [templates...]
```

| Flag              | Meaning                                                                                                                                                                          |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--config <path>` | Config file. Also `--config=<path>`. Default: discovery (6.1).                                                                                                                   |
| `--format <name>` | `text` (default, same as `pretty`), `plain` or `json` (8.2). Other value: `MTL922`.                                                                                              |
| `--quiet`         | Text only: print only failing files, broken templates, templates with template errors and run errors. No headers, no OK lines, no warnings, no summary. JSON is always complete. |
| `--verify`        | Template-syntax check only. No target is read (7.3).                                                                                                                             |
| `--version`       | Print the package version and exit 0.                                                                                                                                            |
| `--help`, `-h`    | Print usage and exit 0.                                                                                                                                                          |

`--help` and `--version` win over everything else on the command line. `--` ends options.
An unknown flag is `MTL920`, a missing argument `MTL921`, exit 2, followed by the usage hint.
A flag that takes a value (`--config`, `--format`) is missing its argument only when it is last or
when the next argument starts with `--`; `--config -x` takes `-x` as the path.
The flags `--pattern`, `--dir`, `--ignore`, `--base-dir` of the earlier linter do not exist
(D07, D11).

### 7.2 Modes

1. Full run (`md-template-lint`): load the config, run every pair on every root it names.
2. File-list mode (`md-template-lint a.md b.md`, the lint-staged mode): each argument is a file
   path relative to the working directory, or absolute (either slash). For each root and pair,
   the file is a target when its path relative to the root matches an include and no exclude.
   A file matching no pair is ignored silently (lint-staged passes every staged `.md`). A file
   matching several pairs is linted once per pair. A file that matches a pair but does not exist
   is `MTL912` (a missing file matching no pair is ignored like any other; the other files are
   still linted, change C01). Output order follows 8.4, not the argument
   order. Disable directives (4.4) apply the same in both modes: they belong to the target
   file, not to the mode or the pair.

lint-staged config:

```json
{
  "lint-staged": {
    "*.md": "md-template-lint --quiet"
  }
}
```

### 7.3 `--verify`

- `md-template-lint --verify`: every distinct template of the config (in pair order).
  Needs a config.
- `md-template-lint --verify path/to/a.md path/to/b.md`: those files are the templates.
  No config needed.
- Each template is parsed and its schema printed (field, inferred type, rules, headings,
  unknown and malformed tags). No target file is read, no `[io:exists]` check runs, no
  network access.
- Exit 0 when every template parses and has no template error (warnings `MTL010` to
  `MTL016` and `MTL031` do not fail). A template that does not parse or cannot be read (`MTL001` to
  `MTL004`, including a file that is not UTF-8) is broken: exit 1, as before. A template
  that parses but has a template ERROR (`MTL017` heading-pattern-duplicate;
  `MTL018` heading-optional-min-conflict; `MTL019` heading-child-order-conflict;
  `MTL030` heading-order-without-repeat) FAILS: exit 1; it is not broken (its table
  and sections are printed, it counts in `Errors:`, not in `broken`, 8.3). A lint run gives
  exit 1 for the same template too (7.5, 2.7). Rationale: the template cannot state what
  its author meant, so CI must stop; keeping it out of `broken` keeps "broken" meaning
  "cannot be read". A template path that does not exist is `MTL910` and
  one that is not a regular file is `MTL911`: exit 2 (checks in 4.3, "Template file checks").
  No config and no template path: `MTL923`.
- Disable directives (4.4) play no role: no target is read, and a directive-like comment in a
  template is inert prose (not listed, no warning, no effect on the exit code).

### 7.4 Empty target sets

A pair-root combination that matches no file (full run only) raises `MTL913` according to
`onEmpty`. The message is always `no files matched pair '{name}' in root '{root}'` (change
C03). It is a run-level diagnostic, never a file diagnostic.

| `onEmpty` | Severity | Text output                           | Counts                                                                                                                                                                | JSON                                 | Exit |
| --------- | -------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ---- |
| `warn`    | warning  | stdout line `ℹ MTL913 <message>`      | `Run warnings:` and `summary.runWarnings` +1. NOT in `Warnings:` / `summary.warnings` (those count file diagnostics only), NOT in `Run errors:` / `summary.runErrors` | `runWarnings` array, not `runErrors` | 0    |
| `error`   | error    | stderr line `error MTL913: <message>` | `Run errors:` and `summary.runErrors` +1                                                                                                                              | `runErrors` array                    | 2    |
| `ignore`  | none     | nothing                               | nothing                                                                                                                                                               | nothing                              | 0    |

Closing line, one rule (also in 8.2): when the whole run lints zero files AND there is no
broken template AND no error-severity run diagnostic, the summary prints `No files linted.`
instead of `All files passed!`. Run warnings (`MTL913` with `warn`) do not change this. With
zero files and a broken template or a run error, the failure summary shows (`Broken
templates:`, `Run errors:`) and `No files linted.` is not printed.

### 7.5 Exit codes

| Code | Meaning                                                                                                                                                                                             |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | No file with errors, no broken template, no run error. Warnings may exist. Also `--help`, `--version`.                                                                                              |
| 1    | At least one target has an error, or a template is broken, or a template has a template error (`MTL017`, `MTL018`, `MTL019`, `MTL030`; in a lint run and in `--verify`), and there is no run error. |
| 2    | A run error occurred (usage, config, missing root, template or file). Takes precedence over 1.                                                                                                      |

The engine keeps going after a run error when the remaining work is independent (D14), and
reports exit 2 at the end. A usage or config validation error stops before any lint.

A template error in a lint run (decision 2 of the open questions in AS17): the `MTL017`, `MTL018`,
`MTL019` and `MTL030` errors of a template are printed on the template file in each pair block that uses it (8.2), every
target of the pair is still linted, and the run exits 1 even when every target passes
(exit 2 still wins on a run error). No directive can hide it (DIR6).

Suppressed diagnostics (4.4) are removed before the exit code is computed: a target whose
only errors are suppressed counts as passed (exit 0 when nothing else fails). The directive
warnings `MTL020` to `MTL025` and the extra warning `MTL616` never change the exit code. Run diagnostics (`MTL9xx`) are never
suppressible, so exit 2 is never hidden.

## 8. Output

### 8.1 Diagnostic

Every finding is `{ code, severity, message }`, plus optional `heading`, `line`, `column`
(1-based, only where known, for example tag errors) and, in JSON only, `sourceLine` (the
source line, below and 8.5). `heading` is set for heading and content
findings (MTL601, MTL603, MTL605-617, MTL701-705; MTL604 has no anchor and
gets no heading; the retired MTL602 had one while it was emitted).
For `MTL610` it is the text of the missing template heading, for `MTL611` the text of the
target parent heading, for `MTL612` the text of the unlisted target heading (change C10).
For `MTL605`, `MTL607` and `MTL608` it is the label of the pattern heading, for `MTL606` and
`MTL609` the text of the reported target heading (change C12, 2.10), for `MTL614` the text of
the first listed tail heading and for `MTL615` the text of the undeclared child (ADR 0012),
for `MTL616` the text of the first listed tail heading, for `MTL617` the text of the first
listed instance without order key, for `MTL613` the text of the later duplicate heading
(2.11); for `MTL601` it stays the text of the missing template heading, with or without the
hint. The template diagnostics `MTL010` to `MTL019`, `MTL030` and `MTL031` carry no `heading` member.
A `field` member is NOT emitted (change C07). `message` is the message text of 4.3 without
the code. Comparisons with the output of the earlier linter (ADR 0014) use
`(path, severity, code, message)` after normalizing separators (D18). The directive warnings `MTL020` to `MTL025` carry `line` and `column` of
the directive in the target (4.4). The anchor line used for suppression (4.4, DIR5) is
internal: its number is never emitted as `line` (it can be quoted in the text output, see
the source line below). A suppressed diagnostic is never emitted at all.

Source line (change C09, AS14). A diagnostic may have a source line: the line of its own
source file that causes it, shown by the reporters as an excerpt (8.2, 8.3, 8.5). It is
resolved once per diagnostic, by the runner, in this order:

1. the `line` of its `position`, when it has one;
2. else its anchor line (4.4, DIR5), when it has one;
3. else none.

The source file is the file the diagnostic belongs to: the TARGET file for a target
diagnostic (the field, filename, heading, content and directive codes), the TEMPLATE file for
a template-phase diagnostic (`MTL010` to `MTL019`, `MTL030` and `MTL031`, shown by `--verify`, 8.3;
the template errors `MTL017`, `MTL018`, `MTL019` and `MTL030` also in a lint run, 8.2). `MTL001` to
`MTL004` (no position, no anchor) and the run diagnostics `MTL9xx` have no source line. A line
number outside the file (below 1 or above its line count) gives no source line. Line numbers
and text follow the line-ending normalization of 1.1: CRLF and a lone CR are line ends, a
leading BOM is dropped, so a `\r` never appears in a source line and `line` and `column` agree
with the text shown. The runner reuses the text it already read to lint the file; no file is
read again. What the runner keeps while matching, and what stays on a diagnostic, is bounded
(8.2, EX8).

Rationale for step 2: most findings concern one key or heading and have no column, so a
position-only excerpt would show almost nothing (in a lint run only `MTL020` to `MTL025`
and the template errors `MTL017` to `MTL019` and `MTL030` have a position). The anchor is already known, cheap (a table lookup) and unambiguous (DIR5 gives
one target line per code, or none), and it is the line a user must edit: the key line of a
field, the heading line of a section. A diagnostic about the whole file (`MTL101`, a missing
key, `MTL601`, `MTL604`, `MTL605`, `MTL607` with no instance) has no anchor and
no excerpt: showing line 1 or the first heading would point at a line that did not cause it.

### 8.2 Text format

Modelled on the layout of the earlier wrapper scripts. Glyphs are UTF-8: `✓` pass, `✗` fail, `⚠` problem, `ℹ` note.
Color only on a terminal, disabled by `NO_COLOR`. Run errors go to stderr as
`error MTLnnn: <message>`, with a ` (file:line:col)` suffix for config errors; everything
else to stdout.

Two renderings exist (change C07): `pretty` is the layout below with glyphs and optional
color; `plain` is the same layout with ASCII words `PASS`, `FAIL`, `INFO` instead of glyphs
and never colored. The CLI format `text` maps to `pretty`. Control characters,
bidi controls and invisible format characters in echoed document values are replaced by
visible escapes in every format (the set is listed in EX3). `Templates:` counts distinct
template paths. A failed file of a non-project root is listed as `path (root 'name')`.
A pair with no files raises `MTL913` before its template is parsed, so a broken template
of an empty pair is not reported.

```text
md-template-lint 1.0.0
Config: md-template-lint.yml
========================

Template: docs/templates/adr.template.md
Target:   docs/adr/*.md (3 file(s)) - architecture decision records

  ✓ docs/adr/0001-first.md
  ✗ docs/adr/0002-second.md
      error MTL201 Field 'status': required but empty or missing
        3 | status:
      error MTL601 Heading: Missing required heading: 'Context'
      warn  MTL202 Unknown key 'authors' not present in template
        4 | authors: bob
  ✓ docs/adr/0003-third.md
      warn  MTL202 Unknown key 'reviewer' not present in template
        4 | reviewer: alice

Template: templates/x.md
Target:   notes/*.md (2 file(s))

  TEMPLATE ERROR: templates/x.md - YAML parse error: ...

ℹ MTL913 no files matched pair 'bugs' in root 'project'

========================
Summary
========================
Total files:  3
Passed:       2
Failed:       1
Warnings:     2 (in 2 file(s))
Templates:    2 checked, 1 broken
Run warnings: 1

Broken templates:
  - templates/x.md - YAML parse error: ...

Failed files:
  - docs/adr/0002-second.md

========================
```

This sample is exit code 1. The two files of the broken-template pair are not linted and not
counted in `Total files`. The empty pair `bugs` is not counted in `Templates` (as before,
a template counts only when its pair has files).

Rules:

- Header: package name and version, then `Config:` with the config path (relative to the
  working directory when inside it, absolute otherwise, `/` separators).
- One block per root-pair combination that has files (or a note). When the root is not
  `project`, a line `Root:     <name>` follows `Template:`. The `Target:` line lists the
  include globs joined by `, `, the file count and the description.
- Per file: `✓ <path>` or `✗ <path>`, then one indented line per diagnostic, each followed by its excerpt rows when it has any (EX1): `error` lines
  first, then `warn` lines, each list in emission order (4.1). A passing file shows its
  warnings.
- Broken template: one `TEMPLATE ERROR: <template> - <message>` line under its
  `Template:` and `Target:` lines. The files of that pair are not linted and not counted.
  The extra line `(skipping remaining N target file(s) for this template)` of the earlier
  wrapper is not printed (change C02). The template is counted once in `checked` and once in `broken`, and is listed
  under `Broken templates:`.
- Template with a template error (`MTL017`, `MTL018`, `MTL019`, `MTL030`, 2.7; decision 2 of the open questions in AS17): under
  its `Template:` and `Target:` lines, before the files of the pair, one entry
  `✗ <template> (template)` (`FAIL <template> (template)` in `plain`), then one `error` line
  per template error, in template line order then code, each with the excerpt of its
  TEMPLATE line and a caret row (EX1 to EX6; the column is known). The template is not
  broken: the files of the pair are then linted and printed as usual. The entry is printed
  in every block of a pair that uses the template; the template is counted once in
  `Templates:` `checked` (not in `broken`, not in `Total files`, `Passed` or `Failed`) and
  listed once, by path, under `Failed templates:`. Template warnings (`MTL010` to `MTL016`, `MTL031`)
  are never printed in a lint run. Worked example 5 of 2.10.
- `Run errors:` and `Run warnings:` are shown only when greater than 0 (never as `0`).
  `Broken templates:`, `Failed templates:` and `Failed files:` lists appear only when
  non-empty, in that order. The line `All files passed!` appears only when there is no
  failed file, no broken template, no failed template, no run error and at least one file
  was linted (run warnings do not prevent it).
  `No files linted.` replaces it only when zero files were linted, there is no broken
  template and no error-severity run diagnostic (same single rule as 7.4); otherwise the
  failure summary shows and `No files linted.` is not printed.
- A `MTL913` line is printed where the pair would have been (`ℹ MTL913 <message>` on stdout
  for `warn`). Its counting rules are in 7.4.
- `Total files` counts pair-file lints (a file in two pairs counts twice, as in the earlier wrapper scripts).
- `Suppressed:` (4.4, DIR9) follows `Warnings:` and counts the diagnostics removed by
  disable directives, per pair-file lint, for example `Suppressed:   3`. It is shown only when
  greater than 0 (never as `0`), so the sample above has none. Suppressed diagnostics are
  never printed and never count in `Warnings:`, `Failed` or `Failed files:`.
- `--quiet` prints only the `✗` lines with their `error` lines (and the excerpts of those
  lines, see below), the template entries with their template errors, `TEMPLATE ERROR`
  lines and run errors. Nothing when clean.

#### Source excerpt (change C09, AS14)

Rows added under a diagnostic line, in `pretty` and `plain` alike:

- EX1. Which. A diagnostic with a source line (8.1) is followed by its excerpt. One without
  prints no extra row, so a file whose diagnostics all lack a source line (a missing key, a
  missing heading, a file name, a parse failure) prints exactly as before. Excerpts follow the
  order of their diagnostics (errors first, then warnings, 8.4).
- EX2. Layout. The gutter row is 8 spaces, the 1-based line number (no padding, no
  alignment with other excerpts), `|`, then the text. When the diagnostic has a `column`, a
  caret row follows: 8 spaces, as many spaces as the line number has digits, `|`, spaces up
  to the offending character, `^`. An empty text prints the gutter row as `<n> |` with
  nothing after the bar.
- EX3. Text. Each character of the line is shown as follows, one output character per source
  character unless escaped: a whitespace control (tab, VT, FF, NEL, U+2028, U+2029) becomes
  one space; every other control, DEL, bidi control, U+FEFF and invisible format character
  is the escape of `cleanText` (`\x1b`, `\u202e`, and `\u{e0001}` above U+FFFF); anything
  else is unchanged. The invisible format characters are U+00AD, U+180E, U+200B to U+200D,
  U+2060 to U+2064, U+FFF9 to U+FFFB and U+E0000 to U+E007F; with U+061C, U+200E, U+200F,
  U+202A to U+202E, U+2066 to U+2069 and U+FEFF they are the whole escaped set above C0, C1
  and DEL (the same set escapes echoed values in every message, heading and path, 8). Unlike
  `cleanText`, runs of whitespace are NOT collapsed, so the caret stays under its character. Leading and trailing whitespace is
  kept. A tab is one space (not a tab stop), so the excerpt never depends on the terminal.
  CRLF never shows: the line comes from the normalized text (8.1), so a file with CRLF line
  ends gives the same excerpt as one with LF.
- EX4. Caret. `column` is 1-based and counts characters (Unicode code points), as the
  parser reports it. The caret is under the character at that column; the offset is the width
  of the shown text before it (an escape counts its full width). A column past the end of the
  line puts the caret just after the last character; a column below 1 is read as 1. (A column
  past the end is not produced by any rule today; if it were, the caret index is clamped to
  the line length and the window of EX5 follows that index, so on a line of exactly 100
  characters it may still slide.)
- EX5. Width. At most 100 characters of the line are shown. A longer line is cut: the shown
  window is the first 100 characters followed by `...`. When the diagnostic has a column in
  the part that would be cut (column above 100), the window instead starts 40 characters
  before the offending character (it then shows up to 59 characters after it, fewer when the
  line ends sooner), is preceded by `...`, and is followed by `...` when characters remain
  after it. The caret offset includes the 3 characters of a leading `...`. The ellipsis is the
  ASCII `...` in every format. The width counts source characters, before escaping.
- EX6. Color. In `pretty` with color, the excerpt rows (gutter and caret) are gray (SGR 90) and
  the rest of the output is unchanged; `plain` and no-color output carry no escape code.
- EX7. `--quiet` hides an excerpt exactly when it hides its diagnostic (warnings are hidden,
  so are their excerpts). The summary, counts and exit code never depend on excerpts.
- EX8. Cost and memory. Building the excerpts of a file costs one normalize-and-split pass
  over the file text (the lines of 8.1), one pass over each source line that has a diagnostic,
  however many diagnostics it has, plus a constant (at most 100
  characters, EX5) per diagnostic: 2000 diagnostics on one line of 1 MB cost a few passes,
  not 2000. What stays on a diagnostic is at most two strings of 100 characters (the shown
  window, and for the JSON `sourceLine` the first 100 characters) and a few numbers; each
  string is a copy that owns its characters, so a diagnostic never keeps the line, nor the
  file text, alive. The prepared lines live only while the diagnostics of one file are
  matched. In a lint run the template text is not retained after it is parsed: the only
  template lines quoted in lint mode are those of the template errors (`MTL017`, `MTL018`,
  `MTL019`, `MTL030`), whose excerpts are built from the parsed text before it is dropped, at the same
  bounded cost per diagnostic; `--verify` holds a template text only until its tag
  diagnostics have their excerpts. A source line is therefore never held per diagnostic, and a
  report of N diagnostics holds O(N x 100) characters of source, not O(N x line length).
- EX9. Echo. An excerpt echoes the content of the linted file, including frontmatter values
  such as tokens, e-mail addresses or paths, into the terminal and into CI logs and JSON
  artifacts, as the messages already do for the values they name. Escaping (EX3) keeps it
  from acting on the terminal, not from being read. A project that must not print its
  content should not write it into lines that lint messages can quote.

Example (a caret row exists only for a diagnostic with a column: in a lint run
`MTL020` to `MTL025` and the template errors `MTL017` to `MTL019` and `MTL030`):

```text
  ✗ docs/adr/0004-fourth.md
      error MTL201 Field 'status': required but empty or missing
        3 | status:
      warn  MTL021 Directive on line 9: unknown rule code 'MTL999'
        9 | <!-- md-template-lint disable-line MTL999 -->
          | ^
```

Rationale: the message says what is wrong, the excerpt says where, so a reader no longer
opens the file to find the line. The rows are indented under the diagnostic (EX2) and start
with a line number, so they cannot be mistaken for a diagnostic line (`error`/`warn`), a
file line (`✓`/`✗`) or a summary line. One format for text and the rule that the text comes
from the normalized document (8.1) keep the caret and `line:column` consistent. Sanitising
(EX3) is mandatory for the same reason as in 8: a document line may hold an escape sequence.
Windowing (EX5) keeps the caret visible without printing a minified line in full.

### 8.3 Verify text output

The `--verify` table, for each template:

```text
Filename: [filename:case:snake_case]

Field   Type    Rules
-----------------------------------------------------------
id      string  presence:required, value:filename
status  enum    presence:required, enum:draft|accepted

Headings:
  # ADR (presence:required)
  ## Context (presence:required, content:non-empty)

Unknown tags found (typo or unimplemented feature):
  - Field 'owner': unknown tag [optionl]
      7 | owner: string # [optionl]
        |                 ^
```

- Header: package name and version, then `Config:` with the config path (relative to the
  working directory when inside it, absolute otherwise, `/` separators), then the one-line
  reminder `Template syntax reference: <URL>` (a link to the syntax reference doc), then a
  rule line (`========================`).
- The `Filename:` line only when the template declares it. The line
  `Unique heading names: [unique-headings-names]` (2.11) only under the template-wide switch, right after
  `Filename:` (or in its place). The line `Frontmatter: [frontmatter:optional]` (2.12) only
  when the template carries that switch, right after `Unique heading names:` (or after
  `Filename:`, or first). Then the one blank line before the table. Columns are padded
  to the widest name and type, the rule line is a run of `-` of the header length.
- Rule order per field: presence, constant, case, elements case, shape, elements shape,
  value-filename, count min, count max, range min, range max, order, scheme (sorted), io, enum
  options. `-` when none. Shape tokens (change C11, 2.9): `format:semver`, `format:date`,
  `format:elements:semver`, `format:elements:date` (the first tag of each kind).
- Headings print as `  <#s> <text> (<rules>)`, presence first, then content rules. The
  heading pattern tags (change C12, 2.10) print right after presence, the first tag of each
  kind, in this order: `pattern:"<pattern>"`, `repeat-rules:same-level`,
  `repeat-rules:same-level:min:N`, `repeat-rules:same-level:max:N`, then the order tag in
  its canonical lowercase form (`order:ascending`, `order:descending`,
  `order:first:number:ascending` and the other `first:` forms of 2.10, `semver` ones
  included). A tag ignored by `MTL015` or a pattern that is invalid (`MTL014`) still
  prints as written: the table shows the template, the sections below say what is wrong.
  The presence token of the dropped `exist` tag no longer exists: such a heading
  prints with `presence:required` and its text keeps the malformed bracket (2.6).
- The unknown tags section lists fields first, then headings. Malformed tags (`MTL012`) are
  listed in a section `Malformed tags:` with line and column. Misplaced tags (`MTL013`) are
  listed in a section `Misplaced tags:` with line and column. Invalid patterns (`MTL014`,
  2.10, change C12) are listed in a section `Invalid patterns:` with line and column, after
  `Misplaced tags:` (sections follow code order). Tags without effect (`MTL015`,
  2.7) are listed in a section `Conflicting tags:` with line and column. Missing date formats
  (`MTL016`, 2.9, change C11) are listed in a section `Date fields without format:`
  with line and column (worked example 2 of 2.9). Frontmatter tags without effect
  (`MTL031`, 2.12, change C14) are listed in a section `Conflicting frontmatter tags:` with
  line and column, after `Date fields without format:` (and so before the error sections).
  Duplicate patterns (`MTL017`, 2.10)
  follow, in a section `Duplicate patterns:`, one item per finding,
  `  - <message> (line L, column C)` with its excerpt, like the other sections (worked
  example 3 of 2.10). Contradictory minimums (`MTL018`, 2.10) follow, in a section
  `Optional headings with a minimum:`, in the same item form. Child order conflicts
  (`MTL019`, 2.7) follow, in a section `Child headings out of level order:`, in the same
  item form (worked example 3 of 2.6). Order tags without repeat (`MTL030`, 2.7) are listed
  last, in a section `Order tags without repeat:`, in the same item form (worked example 7
  J of 2.10).
- A template with at least one template error (`MTL017`, `MTL018`, `MTL019`, `MTL030`) prints its header line with the
  fail word (`✗ <path>` in `pretty`, `FAIL <path>` in `plain`) instead of `✓` / `PASS`, then
  its table as usual. The summary gains the line `Errors:       <n>` (the number of template
  errors of the run) right after `Templates:`, shown only when greater than 0, and the
  closing line `All templates passed!` is not printed when it is greater than 0 (as for a
  broken template, no other closing line replaces it). `--quiet` still prints such a
  template: its fail header line and its `Duplicate patterns:`,
  `Optional headings with a minimum:`, `Child headings out of level order:` and
  `Order tags without repeat:` sections only (an error is never hidden by `--quiet`).
- Every heading level is listed (H1 to H6, change C10), in template order, with the same
  `<#s>` prefix; `content:subheadings:disallow` prints in the rules list after the other
  content rules, then `content:subheadings:no-extra`, then `unique-headings-names` last
  (2.11; once, however often the tag is written).
- A broken template prints `TEMPLATE ERROR: <template> - <message>` instead of its table.
- Source excerpt (change C09, AS14). Every item of the tag sections above is followed by
  the excerpt of its TEMPLATE line (the tag diagnostics `MTL010` to `MTL019`, `MTL030` and `MTL031` all carry line
  and column), with the rules EX2 to EX6 of 8.2 except that the rows are indented 6 spaces
  instead of 8 (the item text starts at column 5, the excerpt sits 2 columns to the right of
  it, as in 8.2). The caret is under the character the `column` names (for a malformed tag,
  the bad part). An item whose line does not exist has no excerpt. Example:

  ```text
  Malformed tags:
    - Field 'tags': malformed tag [count:min:abc] (line 2, column 26)
        2 | tags: ["a"] # [count:min:abc]
          |                          ^
  ```

- `--quiet` hides the table and shows only broken templates, templates with a template error
  (as above) and run errors; the other sections, and so their excerpts, are hidden with the
  table.

### 8.4 Ordering

Everything is deterministic:

1. Roots: `project` first (when a pair uses it), then the `roots` map in declaration order.
2. Within a root: pairs in config order.
3. Within a pair-root: files sorted by root-relative path, plain code-unit order, `/`
   separators, case-sensitive, locale independent.
4. Within a file: errors, then warnings, each in emission order (4.1). Within a pair-root
   block of a lint run, the template entry of a template with template errors (8.2) comes
   before the files; its errors sort by template line, then code.
5. `--verify`: templates in config pair order, deduplicated by resolved path.

### 8.5 JSON format

`--format json` prints one JSON document to stdout and nothing else (run errors are inside
it, nothing goes to stderr). Keys are stable, arrays follow 8.4.

```json
{
  "schemaVersion": 1,
  "tool": "md-template-lint",
  "version": "1.0.0",
  "mode": "lint",
  "config": "md-template-lint.yml",
  "results": [
    {
      "root": "project",
      "pair": "adr",
      "template": { "path": "docs/templates/adr.template.md", "status": "ok" },
      "files": [
        {
          "path": "docs/adr/0002-second.md",
          "status": "fail",
          "errors": [
            { "code": "MTL201", "severity": "error", "message": "Field 'status': required but empty or missing" },
            { "code": "MTL601", "severity": "error", "message": "Heading: Missing required heading: 'Context'", "heading": "Context" }
          ],
          "warnings": [{ "code": "MTL202", "severity": "warning", "message": "Unknown key 'authors' not present in template" }]
        }
      ]
    },
    {
      "root": "project",
      "pair": "x",
      "template": {
        "path": "templates/x.md",
        "status": "broken",
        "error": { "code": "MTL002", "severity": "error", "message": "YAML parse error: ..." }
      },
      "files": []
    }
  ],
  "runErrors": [],
  "runWarnings": [{ "code": "MTL913", "severity": "warning", "message": "no files matched pair 'bugs' in root 'project'", "pair": "bugs", "root": "project" }],
  "unmatched": [],
  "summary": {
    "files": 3,
    "passed": 2,
    "failed": 1,
    "warnings": 2,
    "filesWithWarnings": 2,
    "suppressed": 0,
    "templatesChecked": 2,
    "templatesBroken": 1,
    "runErrors": 0,
    "runWarnings": 1,
    "exitCode": 1
  }
}
```

The `files` array of the first pair is shortened to the failing file (its two diagnostics
lists are complete), so the counts above also include the two passing files of the text
sample.

- `mode` is `lint` or `verify`. In verify mode `results` is replaced by `templates`: for each
  template `{ path, status, filenameCase, uniqueHeadingNames, frontmatterOptional, fields: [{ name, type, rules }], headings: [{ level, text, rules }], diagnostics }`.
  `uniqueHeadingNames` (2.11) is a boolean, always present, `false` without the
  template-wide `# [unique-headings-names]` switch, right after `filenameCase`; additive,
  pinned by the template key-order test of `tests/unit/reporters/json.test.ts`.
  `frontmatterOptional` (2.12, change C14) is a boolean, always present, `false` without the
  `# [frontmatter:optional]` switch, right after `uniqueHeadingNames`; additive, same pin;
  `schemaVersion` stays 1.
  A verify template `status` is `ok`, `broken`, or `fail` (`fail`: it parses and has a
  template error, `MTL017`, `MTL018`, `MTL019` or `MTL030`, in its `diagnostics` with
  `severity` `error`). The verify
  `summary` gains `errors` (the number of template errors, always present, 0 when none),
  right after `broken`: `templates`, `broken`, `errors`, `warnings`, `suppressed`,
  `runErrors`, `exitCode`. Both are additive, so `schemaVersion` stays 1.
- `template.status` is `ok`, `broken` or `fail`; a broken template carries `error` (a
  diagnostic) and an empty `files` array. A lint template with template errors (`MTL017`,
  `MTL018`, `MTL019`, `MTL030`) has `status` `fail` and carries `diagnostics`, the array of those errors
  (each with `line`, `column` and `sourceLine` of its template line, 8.1), and its `files`
  array as usual (the targets are linted). `summary.exitCode` is 1 for it (7.5). No summary
  key is added (the failed templates are the results with `status` `fail`), so
  `schemaVersion` stays 1.
- `unmatched` lists the file-list arguments that matched no pair (paths as normalized
  strings). It is empty in a full run.
- `runErrors` holds the error-severity `MTL9xx` diagnostics with their `pair` or `root` when
  known. `runWarnings` holds the warning-severity ones (today only `MTL913` with
  `onEmpty: warn`). `summary.runErrors` and `summary.runWarnings` are the lengths of these two
  arrays. Neither is added to `summary.warnings`, which counts file diagnostics only (D06).
  Both arrays are always present, empty when there is nothing.
- `summary.exitCode` equals the process exit code.
- `summary.suppressed` counts the diagnostics removed by disable directives (4.4, DIR9), per
  pair-file lint. Always present, 0 when none. Suppressed diagnostics are not in any
  `errors` or `warnings` array, and a file whose only errors are suppressed has status
  `pass`. In verify mode it is 0. The key is additive, so `schemaVersion` stays 1. Its
  position is fixed: between `filesWithWarnings` and `templatesChecked` (sample above). In
  the verify document it follows `warnings` (`templates`, `broken`, `errors`, `warnings`,
  `suppressed`, `runErrors`, `exitCode`). Pinned by the summary key-order list of
  `tests/unit/reporters/json.test.ts` and the `summary` object of every
  `tests/fixtures/runner/*/expected.json`.
- `--quiet` does not shrink JSON.
- `sourceLine` (change C09, AS14) is an optional string member of a diagnostic, placed right
  after `column`. It is the text of line `line` of the diagnostic's source file (the target
  file for the diagnostics of `files[]`, the template file for the `diagnostics` of a verify
  template or of a lint template with template errors, 8.1), shown as in EX3 of 8.2 (escapes, whitespace controls as single spaces, runs
  not collapsed) and cut after 100 characters with `...` when longer (EX5, but never a
  window and no caret: `column` already says where). It is present exactly when the
  diagnostic has `line` and that line exists in the file. It is absent otherwise: an
  anchor-only diagnostic (4.4, DIR5) has no `line`, so it has no `sourceLine` even though the
  text formats quote its anchor line; `runErrors`, `runWarnings` and a broken template's
  `error` never have it. The key is additive, so `schemaVersion` stays 1. It is never
  affected by `--quiet`. Example (a directive warning):

  ```json
  { "code": "MTL021", "severity": "warning", "message": "Directive on line 9: unknown rule code 'MTL999'", "line": 9, "column": 1, "sourceLine": "<!-- md-template-lint disable-line MTL999 -->" }
  ```

## 9. Rule categories

One file per category in `src/rules/`. Each file exports its rules: `{ code, name, severity,
category, check, phase, step }`, registered by the engine. Rule phases are `parse`,
`template`, `field` (with a step from `FIELD_STEPS`, the order of 4.1 step 3) and `target` (with a
step from `TARGET_STEPS`). A check returns `Diagnostic[]` or a promise of it and receives an
injectable `RuleEnv` (aliases, approved paths, pair root, `io.exists`, `io.probeUrl`). A new rule
that adds a tag touches five
places: the lexer keyword (`grammar/MdTemplateLexer.g4`, mode `TAG_STRICT`), the parser tag rule
and its alternative (`grammar/MdTemplateParser.g4`, plus `tagFamily` for a new family), the AST
union and its kind in `FRONTMATTER_KIND_SET` or `BODY_KIND_SET` (`src/tags/ast.ts`, same file,
enforced by `satisfies`), its visitor (`src/tags/visitors/<family>.ts`, plus
`visitors/index.ts` for a new family) and exactly one category file. A rule without a new tag
touches only the category file. The consistency check (`pnpm run check:rules`) builds every tag
sentence from the parser ATN and runs it through the production `document` rule. It covers
`tagWord`, `tagFamily`, the visitor registry, `KNOWN_TYPE_NAMES`, AST kind sets, the start-mode
mirror of the lexer (read from the lexer ATN), the category ranges (`src/engine/ranges.json`
against 4.2) and the code table against the registered rules (a `notImplemented` stub counts as
pending, ADR 0002). A negated-set lexer token needs a `TOKEN_SAMPLES` entry in
`tests/consistency/consistency.ts`. Each registered code needs a pass and a fail fixture, and
the tests of a rule are written by someone other than its author.

| File                    | Codes                                                                      | Tags and checks                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/rules/syntax.ts`   | `MTL001`-`MTL004`, `MTL010`-`MTL019`, `MTL020`-`MTL025`, `MTL030`-`MTL031` | Frontmatter and YAML parse errors, unknown, malformed, misplaced and conflicting tags, invalid heading patterns, date fields without format, duplicate heading patterns, optional repeat headings with a minimum, child headings out of level order, order tags without repeat, `[frontmatter:optional]` copies without effect (2.12); target disable directive warnings (4.4).                                                                      |
| `src/rules/filename.ts` | `MTL101`, `MTL102`                                                         | `[filename:case:<convention>]`, `[value:filename]`.                                                                                                                                                                                                                                                                                                                                                                                                  |
| `src/rules/presence.ts` | `MTL201`, `MTL202`                                                         | `[presence:required]`, `[presence:optional]`, `[presence:conditional:<text>]` on fields; unknown keys.                                                                                                                                                                                                                                                                                                                                               |
| `src/rules/format.ts`   | `MTL301`-`MTL309`                                                          | `[format:constant:...]`, `[format:snake_case]`, `[format:kebab-case]`, `[format:elements:...]`, `[format:scheme:...]`, `[format:semver]`, `[format:date]`, `[format:elements:semver]`, `[format:elements:date]`.                                                                                                                                                                                                                                     |
| `src/rules/bounds.ts`   | `MTL401`-`MTL407`                                                          | `[count:min:N]`, `[count:max:N]`, `[range:min:N]`, `[range:max:N]`, `[order:ascending]`.                                                                                                                                                                                                                                                                                                                                                             |
| `src/rules/type.ts`     | `MTL501`-`MTL517`                                                          | The 17 types and enum membership; type inference lives in the engine core.                                                                                                                                                                                                                                                                                                                                                                           |
| `src/rules/heading.ts`  | `MTL601`-`MTL617` (`MTL602` retired: no rule, reserved)                    | Heading suffix presence tags (required, optional, conditional, template-only) and order, at every level and per parent section, on the positional match; `[content:subheadings:disallow]`, `[content:subheadings:no-extra]`; `[pattern:"..."]`, `[repeat-rules:same-level...]` and the eight `[order:...]` forms on headings (2.10); the extra-heading warning of every run's tail; `[unique-headings-names]`, template-wide and per heading (2.11). |
| `src/rules/content.ts`  | `MTL701`-`MTL705`                                                          | `[content:non-empty]`, `[content:table]`, `[content:list]`, `[content:min-lines:N]`, `[content:max-lines:N]`.                                                                                                                                                                                                                                                                                                                                        |
| `src/rules/io.ts`       | `MTL801`-`MTL805`                                                          | `[io:exists]`.                                                                                                                                                                                                                                                                                                                                                                                                                                       |

Outside `src/rules/`: the engine core (frontmatter and heading extraction, comment
binding, type inference), config loader, runner, reporters and CLI own `MTL9xx`.

The paragraphs below map each feature to the files that implement it and to its tests.

Disable directives (4.4, change C08). The grammar lexes the directive comments (body HTML
comments outside fences and code spans, frontmatter YAML comments) and exposes them on the
target `DocumentModel` with line, column and the raw word and code tokens; the lexer and
parser accept the six verbs of DIR2, `disable-file` included. The six rules `MTL020` to
`MTL025` live in `src/rules/syntax.ts` as phase `target`, step `directives` (the last entry
of `TARGET_STEPS`, 4.1 step 7); the validation and range bookkeeping they share is
`src/engine/directives.ts`. The engine core (`src/engine/pipeline.ts`) records the anchor
line of each diagnostic (DIR5), applies the coverage rule (DIR7, 4.1 step 8) and returns the
suppressed count to the runner and the reporters (DIR9). For `disable-file` the engine
matches by code only (any anchor or none); line directives and ranges match by code and
anchor line, and never a diagnostic without anchor. The JSON reporter has
`summary.suppressed` between `filesWithWarnings` and `templatesChecked` (8.5). The README
documents the directives.

All heading levels (change C10, ADR 0009). It adds the codes `MTL015`, `MTL610`, `MTL611`
and `MTL612`.

- Grammar and tags: every level peels tags and reports `MTL011` to `MTL013`
  (`src/tags/parser.ts` has no level filter). The `TAG_STRICT` keywords `SUBHEADINGS`
  (`subheadings`) and `DISALLOW` (`disallow`) and one `bodyContentTag` alternative
  `SUBHEADINGS COLON DISALLOW` add no `bodyTagBody` alternative. The AST `content` tag of
  `src/tags/ast.ts` has a `check` value for the tag.
- Engine and rules: `buildSections` keeps every level, `Section.level` is 1 to 6 and holds
  the parent; scope, match and "checked" as in 2.6; `MTL601`, `MTL603`, `MTL604` and
  `MTL701` to `MTL705` use the exact-level match; `MTL610` to `MTL612` are in
  `src/rules/heading.ts` (phase `target`, step `headings`) and `MTL015` in
  `src/rules/syntax.ts` (phase `template`); emission order and anchors as in 4.3 and DIR5.
- Tests: `tests/unit/document.test.ts` and `tests/unit/regions.test.ts` (H3 to H6 lose
  their tags; `MTL012` for `[content:subheadings]`, `MTL013` for the tag in frontmatter).
  Pass and fail cases for `MTL610` (H3 missing, parent missing gives no `MTL610`),
  `MTL611`, `MTL612` (unlisted H3 and H4 under the tag, topmost only, listed descendant does
  not reset, allowed without the tag, `disable-line MTL612`), `MTL603` in section scope (a
  checked `[presence:template-only]` H3 under a matched H2: fail when the target has it
  under that H2, pass when it is absent or sits under another H2), template cases for
  `MTL015`, the fixtures of 2.6 (`MTL601/fail-same-text-at-other-level-still-matches`,
  `MTL603/fail-template-only-heading-at-other-level`) and the worked examples of 2.6.
- `--verify` reads every level (8.3, section `Conflicting tags:` for `MTL015`).
  [ADR 0014](adr/0014-legacy-behaviour-catalogue.md) section "H3 and deeper headings are
  checked" (fix: add `[presence:optional]` or remove the heading from the template; levels
  are matched exactly), README and `docs/architecture.md` (free code ranges, heading model)
  describe it. It ships in the breaking release 0.2.0; the CHANGELOG release note points to
  the migration section.

Field formats (change C11, ADR 0010, AS16). It adds the codes `MTL016`, `MTL306`, `MTL307`,
`MTL308` and `MTL309`.

- Grammar and tags: lexer mode `TAG_STRICT` has the keywords `SEMVER` (`semver`) and `DATE`
  (`date`); parser rule `fmFormatTag` has the alternatives `fmShape` and
  `ELEMENTS COLON fmShape`, with the rule `fmShape : SEMVER | DATE`. No new family and no new
  `fmTagBody` alternative. AST (`src/tags/ast.ts`): two frontmatter kinds for the scalar and
  the `elements:` form with `shape: "semver" | "date"`, in `FRONTMATTER_KIND_SET`, built by
  the visitor `src/tags/visitors/format.ts`. Tests: `[format:semver]`, `[format:DATE]`
  (case-insensitive), `[format:elements:date]` parse; `[format:dates]` is `MTL012`;
  `[format:semver]` on a heading is `MTL013`.
- `MTL306` semver-mismatch: the SEMVER predicate in `src/engine/values.ts` (value pattern,
  2.9); `FIELD_STEPS` of `src/engine/rule.ts` has `shape` after `type` (11 present-value
  steps, spelled out in `tests/unit/pipeline.test.ts`); the rule in `src/rules/format.ts`;
  `--verify` rule token `format:semver` in `src/runner/schema.ts` (rule order of 8.3).
  Fixtures `tests/fixtures/pairs/MTL306/`, test
  `tests/target/format/MTL306-semver-mismatch.test.ts`.
- `MTL307` date-format-mismatch: the ISO DATE predicate in `src/engine/values.ts` (it reuses
  `DATE_PARTS` and the calendar test of `isValidDateValue`); the rule in
  `src/rules/format.ts`, silent when the field type is `date` and `isValidDateValue` fails;
  token `format:date`. Fixtures `tests/fixtures/pairs/MTL307/` (pass: ISO date; fail:
  `2026-10`, `present`, a `string` field with `soon`; pass for this code: `2026-1-5` on a
  `date` field gives only `MTL504`), test
  `tests/target/format/MTL307-date-format-mismatch.test.ts`.
- `MTL308` elements-semver-mismatch: rule in `src/rules/format.ts`, items as text (as
  `MTL303`); token `format:elements:semver`. Fixtures `tests/fixtures/pairs/MTL308/`, test
  `tests/target/format/MTL308-elements-semver-mismatch.test.ts`.
- `MTL309` elements-date-mismatch: rule in `src/rules/format.ts`, skips the items that
  fail `isValidDateValue` when the field type is `list-of-date`; token
  `format:elements:date`. Fixtures `tests/fixtures/pairs/MTL309/` (worked example 1 of 2.9),
  test `tests/target/format/MTL309-elements-date-mismatch.test.ts`.
- `MTL016` date-format-missing: rule in `src/rules/syntax.ts`, phase `template`, position
  key line and column 1; `--verify` section `Date fields without format:` after
  `Conflicting tags:` in `src/cli/verify-report.ts`. Fixtures
  `tests/fixtures/templates/MTL016/` (fail: `date` and `list-of-date` without format, the
  scalar tag on a list; pass: both tags present, a `string` field), test
  `tests/syntax/syntax/MTL016-date-format-missing.test.ts`; CLI fixture for worked example 2.
  Every `--verify` expectation with a `date` field has the section.
- README rule syntax and `docs/architecture.md` (free code ranges) describe the tags; the
  date fields of `templates/**/*.template.md` (including `templates/generic/ai/AGENTS.template.md`) carry
  `[format:date]`. Minor release: no existing target changes its findings without a new tag.

Heading patterns, repeat rules and order (change C12, ADR 0011, AS17) and positional heading
matching (ADR 0012). It adds the codes `MTL014`, `MTL017`, `MTL018`, `MTL019`, `MTL030`,
`MTL605` to `MTL609` and `MTL614` to `MTL617`, and retires `MTL602`. The positional matcher
changes every heading rule, so it is the base of the other parts. Fixtures where two
patterns compete for one heading ("the earlier pattern owns the heading") do not exist:
under the positional run there is no owner, only the position; examples A to H of 2.10
worked example 4 cover it instead. The `exist` presence tag was removed only after every
shipped template and fixture had been migrated to `[pattern:"{text}"]` and checked against
the pattern engine, in the same breaking release (0.2.0), so no release has docs and code
disagreeing.

- Positional matcher: `matchHeadings` and `HeadingMatch` in `src/engine/model.ts` implement
  the positional run of 2.10 steps 1 to 4: sequences per level and scope (grammar.md
  "Sequence"), the cursor, set-aside template-only siblings (step 1, `MTL603` on the
  first), literal positions (step 3b), placeholder positions, the tail. `HeadingMatch`
  exposes, per position, the match (or none) and per scope the tail, plus the mismatch,
  repeat and instance data. Callers: `src/rules/heading.ts` and `src/rules/content.ts`
  (`MTL701` to `MTL705` read the positional match, 2.6). A swapped same-level pair gives
  `MTL601` and no `MTL604`; a duplicate target heading is a tail extra. The worked examples
  of 2.6 are regression fixtures (`tests/fixtures/pairs/MTL604/`, `MTL611/`, `MTL601/`,
  `MTL603/`, `MTL610/`, `MTL702/` and the `tests/target/heading/` and
  `tests/target/content/` tests that pin them); examples B, C and E (exact-text parts) of
  2.10 worked example 4 are fixtures too.
- Grammar and tags. Lexer `TAG_STRICT` keywords `PATTERN` (`pattern`), `REPEAT_RULES`
  (`repeat-rules`), `SAME_LEVEL` (`same-level`), `DESCENDING` (`descending`), `NO_EXTRA`
  (`no-extra`), and keywords for `first` and for the word `number` (whose token name differs
  from `NUMBER`, the digits token); `DATE` and `SEMVER` are the keywords of the field formats.
  A pattern mode is entered after `pattern:"` (as `CONSTANT_ARG` enters `TAG_FREE`) with
  tokens for `{{`, `}}`, a placeholder candidate `{...}` (name, the `:format:fmt` option and
  its optional `:arg`; the parts are split and checked when the AST pieces are built, 2.10
  placeholder shape), a lone `{` or `}`, an escape pair `\` plus one character, literal text
  (a negated set with a `TOKEN_SAMPLES` entry in `tests/consistency/consistency.ts`) and the
  closing unescaped `"`. Stage 1 (`TAG_TEXT`, parser `tagCandidate`) accepts a `]` and an
  escaped `\"` inside the quotes and the dashed family `repeat-rules`. Parser:
  `tagFamily` has `PATTERN` and `REPEAT_RULES`; `bodyTagBody` has `bodyPatternTag`,
  `bodyRepeatTag` (`REPEAT_RULES COLON SAME_LEVEL (COLON fmBound COLON NUMBER)?`, a `0` is
  malformed) and `bodyOrderTag`
  (`ORDER COLON (FIRST COLON (<number keyword> | DATE | SEMVER) COLON)? (ASCENDING | DESCENDING)`);
  `bodyContentTag` has `SUBHEADINGS COLON NO_EXTRA`; `fmOrderTag` is unchanged. There is no
  `exist` keyword (`EXISTS` of `[io:exists]` stays). The placeholder names (`{char}`
  included) and format names (2.10 table) are checked against the fixed table when the AST
  pieces are built, not by lexer keywords. AST `src/tags/ast.ts`: body kinds `pattern` (the
  raw text and the pieces: literal, placeholder name, format and argument, or an invalid
  piece with its reason and column), `repeat` (`bound: "none" | "min" | "max"`, `n`) and
  `order` (`direction`, and `by`: whole text, first number, first date or first semver), in
  `BODY_KIND_SET`, and the `content` kind has a `check` value for `no-extra`. Visitors
  `src/tags/visitors/pattern.ts` and `src/tags/visitors/repeat.ts` (registered in
  `visitors/index.ts`), body order in `src/tags/visitors/order.ts`, `no-extra` in the
  content visitor. Tests (`tests/unit/visitors.test.ts`, `tests/unit/tags.test.ts`,
  `tests/unit/document.test.ts`): the tags parse at every level, case-insensitive, with a
  `]` and a `\"` inside the quotes; the eight order forms parse; `[pattern:x]`, an unclosed
  quote, `min:0`, `[order:sideways]`, the malformed order forms of 2.10 and
  `[content:subheadings:no-extras]` are `MTL012`; the four tags and every `first:` order
  form in frontmatter are `MTL013`; `[order:ascending]` on a heading is not `MTL013`;
  `[presence:exist]` on a heading is `MTL012` and stays in the heading text (the heading is
  then missing, `MTL601`), and in frontmatter it is `MTL012`.
- `MTL014` heading-pattern-invalid: rule in `src/rules/syntax.ts`, phase `template`,
  position and the reasons of 2.10 (format argument reasons included); `--verify` section
  `Invalid patterns:` between `Misplaced tags:` and `Conflicting tags:` in
  `src/cli/verify-report.ts`; the heading rule tokens of 8.3 in `src/runner/schema.ts`; a
  heading with an invalid pattern is "not checked, not a position" in `matchHeadings`.
  Fixtures `tests/fixtures/templates/MTL014/` (fail: unknown placeholder, `{}`, malformed
  placeholder, unknown format (`{text:format:full}`, `{char:format:upper}`,
  `{digits:format:decimal}`), `{int}` as an unknown placeholder, the three argument reasons
  (`{digits:format:padding}`, `{digits:format:padding:0}`, `{date:format:year:2}`),
  unmatched `{` and `}`, adjacent placeholders (`{char}{text}`), invalid escape, empty
  pattern, first problem only; pass: `{{semver}}` literal, `{SemVer}`, every placeholder
  (`{char}` included) and every format of the table, `padding:3` and `precision:2`, `\"`
  and `\\`), test `tests/syntax/syntax/MTL014-heading-pattern-invalid.test.ts`; CLI fixture
  for worked example 2 of 2.10.
- `MTL605` heading-pattern-missing: the pattern matcher `src/engine/pattern.ts` (match of
  2.10 on the parsed pieces, shortest-first cuts, values, the failing piece; the value
  patterns of the placeholder formats in `src/engine/values.ts`, `{semver}` and `{date}`
  `full` through `isSemver` and `isIsoDate`); placeholder and literal pattern positions
  (steps 3b, 3c) in `matchHeadings`; the rule in `src/rules/heading.ts` (phase `target`,
  step `headings`, no anchor, emission order of 4.3); `MTL601` and `MTL610` skip pattern
  headings; content rules read the pattern match; `MTL015` reason
  `the heading is [presence:template-only]` for the pattern tag (`src/rules/syntax.ts`).
  Fixtures `tests/fixtures/pairs/MTL605/` (file and section scope, optional absent passes,
  example D, a literal pattern whose next sibling differs, `disable-file MTL605`), test
  `tests/target/heading/MTL605-heading-pattern-missing.test.ts`; `MTL015` cases in
  `tests/fixtures/templates/MTL015/`.
- `MTL606` heading-pattern-mismatch: the mismatch of steps 3c and 3d1 (a required
  placeholder position takes a non-matching sibling), the message with `{piece}`; repeat
  runs and instances (step 3d2): `HeadingMatch` has one entry per instance so
  section-scope descendants, content tags and `[content:subheadings:disallow]` run per
  instance (`src/engine/model.ts`, `src/rules/heading.ts`, `src/rules/content.ts`); a
  mismatch is not a match and not also `MTL612`; `MTL015` reason
  `the heading has no [pattern:...]` for a repeat tag. Fixtures
  `tests/fixtures/pairs/MTL606/` (examples A, E second target, F with a full SemVer, the
  bracketed `Unreleased` variant of worked example 1, an optional placeholder position takes
  nothing, no sibling left gives no `MTL606`, `disable-line MTL606`), test
  `tests/target/heading/MTL606-heading-pattern-mismatch.test.ts`; regression fixtures for
  `MTL610`, `MTL703` and `MTL612` per instance and for examples B, C, G and H (a matching
  sibling is always taken).
- Placeholder formats (no code of their own): the non-default formats of the 2.10 table in
  `src/engine/values.ts` and `src/engine/pattern.ts`: `{text}` `snakecase`, `camelcase`,
  `screamcase`, `kebabcase` on the LETTER classes of 2.10 (Unicode general categories, at
  least one letter; NOT the ASCII 2.3 case predicates, which stay for fields), `lowercase`
  and `uppercase`; `{number}` `scientific` and `precision:N`; `{digits}` `signed`, `hex`,
  `uid` and `padding:N` (the argument read from the AST piece); `{semver}` `core` and
  `major-minor`, `{date}` `year-month` and `year`; default names written explicitly
  (`{text:format:human}`) equal no format. Fixtures in `tests/fixtures/pairs/MTL606/` and
  `tests/fixtures/positional/` (each format: one accepted and one rejected value of the
  2.10 list, example F, `## 007` under `{digits:format:padding:3}` and under `{number}`,
  `## 2026` refused by `{text:format:snakecase}`), unit tests of the predicates in
  `tests/unit/values.test.ts`.
- Content label (no code of its own): `src/rules/content.ts` prints
  `Section '{text}' (pattern "{pattern}")` (and the section-scope form) for a pattern
  heading, 2.6 "Content tags"; exact-text labels unchanged. Fixtures: worked example 7 J of
  2.10 and the content variant of worked example 1, in `tests/fixtures/pairs/MTL701/` and
  `MTL702/`.
- `MTL607` heading-repeat-min: count per repeat set, explicit `min` only, also at zero
  (then no anchor and no `MTL605`), anchor on the first instance otherwise. Fixtures
  `tests/fixtures/pairs/MTL607/` (below `min`, zero with `min` required and optional,
  default minimum gives no `MTL607`), test
  `tests/target/heading/MTL607-heading-repeat-min.test.ts`.
- `MTL608` heading-repeat-max: anchor on the instance `max + 1`; the bound does not stop
  the run. Fixtures `tests/fixtures/pairs/MTL608/`, test
  `tests/target/heading/MTL608-heading-repeat-max.test.ts`.
- `MTL609` heading-pattern-order: the order keys of 2.10 "Order" in
  `src/engine/pattern.ts`: the whole text in code-unit order, the FIRST NUMBER scan, the
  FIRST DATE scan and the FIRST SEMVER scan with SemVer precedence of the `first:` forms
  (instances without key skipped in the pairs; `MTL617` reports them); one finding per
  repeat set on the first pair out of order with the count, message ending in `{tag}`;
  `MTL015` reason `the heading has no [pattern:...]` for an order tag (an order tag on a
  pattern heading without repeat tag is `MTL030`); `--verify` order tokens of 8.3. Fixtures
  `tests/fixtures/pairs/MTL609/` (worked example 1 of 2.10 and its date and version
  variants, two pairs out of order give one finding with `2 pair(s)`, equal keys pass,
  example K and its string-order variant, `Epic A` / `Epic B` of example J, a negative and a
  scientific first number, a skipped invalid date, `1.10.0` against `1.9.0` under
  `[order:descending]`, `[order:first:date:descending]` and
  `[order:first:semver:descending]`, a pre-release below its release, build metadata
  ignored, `v2.0.0` read as 2.0.0), test
  `tests/target/heading/MTL609-heading-pattern-order.test.ts`.
- `MTL617` heading-order-key-missing: the rule in `src/rules/heading.ts` (phase `target`,
  step `headings`), one per repeat set, anchor on the first instance without key, `{kind}`,
  `{placeholder}` and `{tag}` of 4.3, emission order with `MTL609` by code. Fixtures
  `tests/fixtures/pairs/MTL617/` (example K and its `semver` variant, a set of one instance
  without number, a date form without date, a `semver` form on `Release 1.2` (two parts, no
  key), every instance keyed passes, the whole-text forms never give it,
  `disable-line MTL617` on the anchor), test
  `tests/target/heading/MTL617-heading-order-key-missing.test.ts`.
- `MTL614` heading-repeat-miss: the tail (step 4) in `matchHeadings`, the listing rule
  (first repeat heading whose pattern matches), the rule in `src/rules/heading.ts`, anchor on
  the first listed heading. Fixtures `tests/fixtures/pairs/MTL614/` (worked example 1 of
  2.10, example G second target, a tail heading matching two repeat patterns is listed once,
  a non-matching tail heading gets no `MTL614` (`MTL616` lists it), zero instances with a
  matching tail heading, `disable-line MTL614`), test
  `tests/target/heading/MTL614-heading-repeat-miss.test.ts`.
- `MTL615` heading-subheadings-only-declared: the region (direct target children of each
  match or instance of D) and the declared test (taken by a position of D's children, match
  or mismatch) in `src/rules/heading.ts` on the data of `matchHeadings`; a heading that gets
  `MTL603`, `MTL612` or `MTL614` is skipped; `MTL015` reason
  `the heading is [presence:template-only]` for the tag; `--verify` rule token
  `content:subheadings:no-extra` in `src/runner/schema.ts`. Fixtures
  `tests/fixtures/pairs/MTL615/` (the no-extra variants of worked example 2 of 2.6, a direct
  child at an undeclared level, a deeper heading is not reported, both tags on one heading,
  per instance of a repeat heading, `disable-line MTL615`), test
  `tests/target/heading/MTL615-heading-subheadings-only-declared.test.ts`; `MTL015` case in
  `tests/fixtures/templates/MTL015/`.
- `MTL017` heading-pattern-duplicate: rule in `src/rules/syntax.ts`, phase `template`,
  severity `error` (the registry, `src/runner/verify.ts` and `src/runner/types.ts` count
  template errors apart from warnings), the template sequence and the same-pattern test of
  2.10 (on the parsed pieces; exact-text headings compared as the literal pattern of their
  text, both message forms and both columns; default format names equal no format).
  `--verify` (`src/cli/verify-report.ts`): section `Duplicate patterns:` (its place in the
  section order is fixed in 8.3), the fail header line, the `Errors:` summary line, no
  `All templates passed!` with errors, `--quiet` behaviour, exit 1 (`src/cli/` exit code
  path); JSON verify `status: "fail"` and `summary.errors` after `broken` (8.5; the summary
  key-order list of `tests/unit/reporters/json.test.ts` and the verify `expected.json`
  fixtures pin it). Fixtures `tests/fixtures/templates/MTL017/` (fail: worked example 3 of
  2.10, three in a row give two findings, case-insensitive placeholder and `full` format
  equal, `{text}` next to `{text:format:human}`, `## Notes` twice in a row, `## Notes` next
  to `## [pattern:"Notes"]` in both orders; pass: patterns differ, a different exact-text
  heading between them, `## Notes` next to `## notes`, two patterns at different levels or
  under different parents, an invalid pattern next to a valid one), test
  `tests/syntax/syntax/MTL017-heading-pattern-duplicate.test.ts`; CLI fixture for worked
  example 3 (exit 1, text and JSON).
- Template errors in a lint run (no code of their own): the runner (`src/runner/`) keeps the
  template-phase errors of each parsed template; the text reporter prints the template
  entry of 8.2 (`✗ <template> (template)` / `FAIL`, the error lines with template-line
  excerpts and carets, `Failed templates:`, no `All files passed!`, `--quiet` keeps it); the
  JSON reporter gives `template.status` `fail` with `diagnostics` (8.5); the exit code path
  gives 1 (7.5); the targets are still linted. The template excerpts are built at parse
  time (EX8). Fixtures: CLI fixture for the `MTL017` part of worked example 5 of 2.10 (text
  `pretty` and `plain`, JSON, exit 1, the target passes), a template used by two pairs
  (entry in both blocks, listed once), the variant with a failing target (`Failed files:`
  after `Failed templates:`), a template with only template warnings (nothing printed, exit
  by targets only). Tests in `tests/unit/reporters/*.test.ts` and a runner test.
  `docs/architecture.md` lists the exit codes.
- `MTL018` heading-optional-min-conflict: rule in `src/rules/syntax.ts`, phase `template`,
  severity `error`, the trigger of 2.10 "Repeat rules" (effective pattern, effective repeat
  tag, presence optional by precedence, effective explicit `min`), position at the `[` of
  the `min` tag; `--verify` section `Optional headings with a minimum:` after
  `Duplicate patterns:` in `src/cli/verify-report.ts`; it uses the template-error paths of
  `MTL017` (verify and lint). Fixtures `tests/fixtures/templates/MTL018/` (fail: optional
  with `min:1`, with `min:3`, presence tag before or after the `min` tag; pass: required
  with `min`, optional with `max` only, optional with `[repeat-rules:same-level]` only,
  conditional with `min`, `min` on a heading without pattern (`MTL015` instead), invalid
  pattern (`MTL014` instead)), test
  `tests/syntax/syntax/MTL018-heading-optional-min-conflict.test.ts`; CLI fixture for worked
  example 5 of 2.10 (both errors).
- `MTL019` heading-child-order-conflict: rule in `src/rules/syntax.ts`, phase `template`,
  severity `error`, the child list and the trigger of 2.7 (one per parent, first offending
  child, column 1; a parent with an invalid pattern is checked too); `--verify` section
  `Child headings out of level order:` after `Optional headings with a minimum:` in
  `src/cli/verify-report.ts`, the `--quiet` list of 8.3; it uses the template-error paths of
  `MTL017` (lint: printed on the template file, exit 1, targets still linted,
  `Failed templates:`). `MTL611` is unchanged (target finding). Fixtures
  `tests/fixtures/templates/MTL019/` (fail: worked example 3 of 2.6, an H5 before an H4
  under an H3, two offending children under one parent give one finding, two parents give
  two, a parent whose own pattern is invalid with a deeper child first gives both `MTL014`
  and `MTL019`; pass: shallower before deeper (a grandchild), same-level children, a deeper
  template-only child first, a deeper child with an invalid pattern first, children of a
  template-only parent, an H3 before an H2 under an H1 (the H2 is file scope, not in the
  child list)), test `tests/syntax/syntax/MTL019-heading-child-order-conflict.test.ts`; CLI
  fixture for worked example 3 of 2.6 (lint `plain`, `--verify`, JSON); the `MTL611`
  fixtures whose template has this shape also show the template error in CLI and runner
  expectations.
- `MTL030` heading-order-without-repeat: rule in `src/rules/syntax.ts`, phase `template`,
  severity `error`, the trigger of 2.7 (effective order tag on a pattern heading with no
  repeat tag of any kind; none for a heading without pattern, a template-only heading or an
  invalid pattern), position at the `[` of the order tag; there is no `MTL015` reason
  `the heading has no [repeat-rules:...]`; `--verify` section `Order tags without repeat:`
  last in `src/cli/verify-report.ts`, the `--quiet` list of 8.3; it uses the template-error
  paths of `MTL017` (verify and lint). In a lint run the order tag of such a heading has no
  effect (single position). Fixtures `tests/fixtures/templates/MTL030/` (fail: the `MTL030`
  variant of worked example 7 J of 2.10, each order form, the order tag before the pattern
  tag; pass: with `[repeat-rules:same-level]`, with only the `min` or only the `max` form,
  an order tag without pattern (`MTL015` instead), on a template-only heading (`MTL015`
  instead), with an invalid pattern (`MTL014` instead); a pattern heading with an order tag
  and no repeat tag gives no `MTL015`), test
  `tests/syntax/syntax/MTL030-heading-order-without-repeat.test.ts`; CLI fixture for the J
  variant (lint `plain`, `--verify`, JSON).
- `MTL616` heading-extra: the tail list of 2.10 step 4 per run in `matchHeadings`
  (`src/engine/model.ts`), the rule in `src/rules/heading.ts` (phase `target`, step
  `headings`, severity `warning`), the exclusions (`MTL612` with its topmost-block cover,
  `MTL614`, `MTL615`, decided before suppression), anchor on the first listed heading,
  emission order by the last position of the sequence. Fixtures
  `tests/fixtures/pairs/MTL616/` (worked example 6 of 2.10 and its variants, worked examples
  1 and 2 of 2.6, the level without template heading gives nothing, section scope per
  parent instance, `disable-line MTL616` on the anchor and on a later listed line,
  `disable-file MTL616`), test `tests/target/heading/MTL616-heading-extra.test.ts`. Every
  pair and runner fixture whose target has extras after the last template heading of a run
  shows the warning (exit codes and errors unchanged).
- `MTL601` hint (no code of its own): the "found later" search of 2.10 step 3b in
  `matchHeadings` and the second message form in `src/rules/heading.ts`. Fixtures in
  `tests/fixtures/pairs/MTL601/` (example I, a same-text heading at another level gives no
  hint, a same-text heading before the cursor, example B, gives no hint, a later sibling
  taken by a later pattern position still gives the hint), and the fixtures of swapped
  same-level pairs, whose `MTL601` message has the hint.
- Removed `exist` handling (breaking, no code): no lexer keyword `EXIST` and no
  `bodyPresenceTag` alternative for it; no `exist` mode in the AST presence tag
  (`src/tags/ast.ts`), the presence visitor (`src/tags/visitors/presence.ts`),
  `HeadingPresence` and the precedence list (`src/engine/model.ts`, `src/runner/schema.ts`),
  `matchHeadings`, `src/rules/heading.ts` (no `MTL602` rule, no second `MTL610` form, no
  `exist` listing branch of `MTL612`) and `src/rules/content.ts`. `MTL602` has no 4.3 row
  and stays reserved in 4.2; it has no fixtures and no test.
- Docs and templates: README rule syntax (patterns, placeholders and formats, `{char}`,
  `{digits}`, format arguments, escapes, repeat, the eight order forms, no-extra, positional
  matching, the dropped `exist` tag); `docs/architecture.md` (free code ranges, the
  positional heading model, every template-diagnostic list: code table row, verify and lint
  exit lists with `MTL017`, `MTL018`, `MTL019` and `MTL030` at exit 1, the verify section
  list with `Invalid patterns:`, `Duplicate patterns:`, `Optional headings with a minimum:`,
  `Child headings out of level order:` and `Order tags without repeat:`, the anchor table,
  test layout row); [ADR 0014](adr/0014-legacy-behaviour-catalogue.md) sections "Headings
  are matched by position" (breaking, C10 note: extras only after the last declared heading
  and reported by the `MTL616` warning, a swapped pair is a missing heading with the "found
  later" hint, template errors fail lint runs; fix: reorder the document or mark headings
  optional) and "The `exist` presence tag is removed" (the 2.6 "Dropped tag" table, the
  `{text}` purely-numeric difference, `MTL602` retired), the order tags comparing the
  heading text (use `first:number`, `first:date` or `first:semver`), an order tag without
  repeat tag failing (`MTL030`), `{int}` renamed `{digits}` and the `{text}` case formats no
  longer accepting digits only, and the C10 rows, `MTL016` included;
  `docs/guides/adding-a-tag.md` and the other guides that describe matching. The shipped
  templates that used the dropped tag have each H1 or H2 migrated to a pattern (2.6 table):
  `templates/generic/adr.template.md`, `templates/generic/architecture.template.md`,
  `templates/generic/bug.template.md`, `templates/generic/README.template.md`,
  `templates/generic/spec-product.template.md`, `templates/generic/spec-technical.template.md`,
  `templates/generic/ai/SKILL.template.md`, `templates/generic/ai/command.template.md`,
  `templates/generic/ai/agent.template.md`, `templates/generic/TODO.template.md` (its epic heading is a
  repeat pattern with `{char}` and `[order:ascending]`, worked example 7 J of 2.10);
  `templates/generic/CHANGELOG.template.md` has a pattern release heading in the style of worked
  example 1
  (`## Release [pattern:"[{semver}] - {date}"] [presence:optional] [repeat-rules:same-level] [order:first:date:descending] [content:subheadings:disallow]`,
  by date, not by string; `[order:first:semver:descending]` is equally valid, 2.10 "Order")
  with the six optional H3 groups. Fixtures that used the dropped tag keep what they test (a
  fixed text becomes a plain heading, any text becomes `[pattern:"{text}"]`). Release:
  breaking, 0.2.0 (positional matching and the dropped tag are breaking, C10 notes); a
  template without the new tags otherwise gives the same errors as with the positional
  matcher alone, plus the `MTL616` warnings and the `MTL601` hint.

Later epics (decision 5 of the second revision of AS17; design only, NOT specified, no code
allocated): a later epic holds two document tags: a table-of-contents tag (a table of the
levels and titles of the headings below the tag) and a heading-numbering tag (`## Title`
written as `## 1. Title`, `### 1.1 Title`). A design document is reviewed first; until then
neither tag is in the grammar, and no rule or code exists for it.

Unique heading names (2.11, ADR 0013, decisions of 2026-11-04). It adds the code `MTL613`
heading-unique-names (the 4.3 table then holds 84 codes, pinned by
`tests/consistency/rules.test.ts`).

- Grammar and tags. Lexer `grammar/MdTemplateLexer.g4`, mode `TAG_STRICT`: the keyword
  `UNIQUE_HEADINGS_NAMES` (`unique-headings-names`). Stage 1 makes the colon-less bracket
  `[unique-headings-names]` (any case) a known tag instead of a bare bracket (2.11 "Grammar
  at spec level"). Parser `grammar/MdTemplateParser.g4`: `tagFamily` has
  `UNIQUE_HEADINGS_NAMES`, `bodyTagBody` has `bodyUniqueNamesTag`, the frontmatter has the
  template-wide line (an `fmLine` alternative). AST `src/tags/ast.ts`: a body kind in
  `BODY_KIND_SET`, and the template-wide switch on the parsed template (a boolean on the
  document model); visitor in `src/tags/visitors/` (its own family file, registered in
  `visitors/index.ts`). The placement table of 2.11: key line inert, mixed comment line
  inert, an argument `MTL012`, a typo `MTL011` / `MTL010`. Tests
  (`tests/unit/visitors.test.ts`, `tests/unit/tags.test.ts`, `tests/unit/document.test.ts`):
  the tag parses at every level, case-insensitive, is peeled from the heading text; the
  frontmatter line sets the switch; every row of the placement table.
- `MTL613` heading-unique-names: the rule in `src/rules/heading.ts` (phase `target`, step
  `headings`, severity `error`) on the extracted target headings and the regions of 2.11
  (each match or instance of an effective tagged heading, the whole file for the
  template-wide switch); FOLDING with `toLowerCase()`; one finding per later duplicate, at
  most one per heading, `{line}` the earliest same-text heading of the scopes that contain
  it; emission after every other step 5 finding. `MTL015` reason
  `the heading is [presence:template-only]` for the tag (`src/rules/syntax.ts`).
  `--verify`: the rule token `unique-headings-names` (last in the heading rules list) and
  the `Unique heading names: [unique-headings-names]` line in `src/runner/schema.ts` and
  `src/cli/verify-report.ts`; JSON verify key `uniqueHeadingNames` after `filenameCase` (the
  verify `expected.json` fixtures and the key-order list of
  `tests/unit/reporters/json.test.ts` pin it). The spec text that names `MTL613`: 4.1
  step 5, the 4.3 `heading` bullets (emission order), DIR5 anchor table, DIR6 list, 8.1
  `heading` member list, 8.3 and 8.5 (as in 2.11), the 2.7 `MTL015` reason list, the file
  table above; `docs/architecture.md` (the `heading` row and the set-aside note), README
  rule syntax. Minor release: no target changes its findings without the tag.
- Tests: the fixture list of 2.11, the worked examples 1 to 3 of 2.11 and their variants as
  pair fixtures in `tests/fixtures/pairs/MTL613/`, test
  `tests/target/heading/MTL613-heading-unique-names.test.ts`, the `MTL015` template fixture
  `fail-template-only-with-unique-headings-names.md`; CLI fixtures for worked example 1
  (`plain`, JSON) and for `--verify` of both switches (`schema-pass-unique-headings-names-switches`).

Optional frontmatter (2.12, ADR 0015, change C14, decisions of 2026-11-11). It adds the code
`MTL031` frontmatter-tag-conflict (the 4.3 table then holds 85 codes, pinned by
`tests/consistency/rules.test.ts`).

- Grammar and tags. Lexer `grammar/MdTemplateLexer.g4`, mode `TAG_STRICT`: the keyword
  `FRONTMATTER` (`frontmatter`; `OPTIONAL` exists). Parser `grammar/MdTemplateParser.g4`:
  `tagFamily` has `FRONTMATTER`, `fmTagBody` has `fmFrontmatterTag`; no new `fmLine` rule, the
  standalone line is an `fmFilenameLine` (2.12 "Grammar at spec level"). AST `src/tags/ast.ts`:
  the kind `frontmatter-optional` in `FRONTMATTER_KIND_SET`, `Frontmatter.frontmatterOptional`
  and `Frontmatter.optionalTags`, and the boolean on the document model
  (`src/engine/model.ts`); visitor `src/tags/visitors/frontmatter.ts`, registered in
  `visitors/index.ts`; parsing in `src/tags/parser.ts`. The generated parser is rebuilt
  with `pnpm run gen:parser`.
- Engine. `loadDocument(text, options?: { frontmatterOptional?: boolean })`
  (`src/engine/load.ts`): a body-only model for a text with no frontmatter block (not an
  unclosed one) under the option. `lintTarget` passes the template flag; `checkTemplate` and
  the file loader do not (`src/engine/pipeline.ts`). `runTargetRules` skips the template field
  loop (4.1 step 3) when the target has no frontmatter block.
- `MTL031` frontmatter-tag-conflict: the rule in `src/rules/syntax.ts` (phase `template`,
  severity `warning`), one finding per duplicate standalone line, tag after a key or tag in
  mixed comment text, at the tag's `[`; never suppressible (DIR6). `--verify`: the
  `Frontmatter: [frontmatter:optional]` line and the `Conflicting frontmatter tags:` section
  in `src/runner/schema.ts` and `src/cli/verify-report.ts`; JSON verify key
  `frontmatterOptional` after `uniqueHeadingNames` (the `schema-*` `expected.json` fixtures
  and the key-order list of `tests/unit/reporters/json.test.ts` pin it). The spec text that
  names `MTL031`: 1.1, 1.2, 2, 2.1, 2.7, 4.1, 4.2, 4.3 (row and DIR6), 7.3, 8.3, 8.5, the file
  table above (section 9), AS12, AS14. Additive release: no existing template or target
  changes its findings.
- Tests: the fixture list of 2.12, `tests/fixtures/templates/MTL031/` and
  `tests/syntax/syntax/MTL031-frontmatter-tag-conflict.test.ts`, the pair fixtures of
  `tests/fixtures/optional-frontmatter/` with `tests/unit/optional-frontmatter.test.ts`, the CLI
  fixtures `schema-pass-frontmatter-optional` and `schema-fail-frontmatter-tag-conflict`.

Coverage check (read by `pnpm run check:rules`): every code of 4.3 appears in exactly one
category row, except the `MTL9xx` run diagnostics, which belong to the engine and have no
rule file. Tags map to the categories by the codes they emit: presence tags emit codes in
both `presence.ts` (fields) and `heading.ts` (heading suffixes), so a tag may appear in
several rows. Type hints (2.4) are read by the engine core and emit no code of their own;
their effect shows through `type.ts` codes.

## 10. Assumptions

These choices go beyond the behaviour of the earlier linter catalogued in
[ADR 0014](adr/0014-legacy-behaviour-catalogue.md). Review an assumption before changing the
part of the spec it covers. Ids are `AS1` to `AS17`. Numbered decisions below are numbered as
in the ADR that records them; do not confuse them with the kept quirks Q01 to Q08.

- AS1: `approvedPaths` is an addition. The earlier linter only had alias approvals; absolute
  values were never probed. The new key lets a project opt in per folder. Default (empty)
  keeps that behaviour.
- AS2: A broken template exits 1 (as the earlier wrapper scripts did), a missing template
  exits 2.
- AS3: `onEmpty` default is `warn` (the earlier linter printed an informational note).
- AS4: Text output replaces the nested `FAIL name has errors:` / `WARN name has N warning(s):`
  blocks of the earlier linter with one indented line per diagnostic (plus excerpt rows,
  EX1). Messages are unchanged.
- AS5: Globs are case-sensitive on every OS, where the wildcards of the earlier PowerShell
  wrappers are case-insensitive on Windows.
- AS6: A template file never lints itself (it is skipped when it matches its own pair).
- AS7: `MTL012` malformed tags are warnings, in line with unknown tags.
- AS8: `allowPrivateNetworks` is an addition. URL probes of `[io:exists]` refuse private,
  loopback, link-local and metadata addresses by default (SSRF guard); only private ranges can
  be opted in, the others are always blocked.
- AS9: Disable directive syntax (4.4, DIR1, DIR2): keyword `md-template-lint`, verbs
  `disable`, `disable-line`, `disable-next-line`, `disable-file`, `begin disable`,
  `end disable` (six), codes separated by commas and/or whitespace, all case-insensitive,
  optional ` -- reason`, no wildcard. Rationale: covers the three requested behaviours
  (inline, open disable, block) with the ESLint vocabulary most users know, plus one
  explicit whole-file verb for findings without a line; explicit codes keep suppressions
  reviewable.
- AS10: Carriers (DIR3, DIR4): single-line HTML comments in the target body, YAML comments
  (key-line trailing or column-1 whole-line) in the target frontmatter; never in templates,
  fences, code spans or multi-line HTML comments. Rationale: HTML comments are invisible
  when rendered; frontmatter findings anchor on key lines, which only take YAML comments.
- AS11: Anchors and coverage (DIR5, DIR7): a diagnostic anchors on a target key or heading
  line, or nowhere; an anchored one is covered by a line directive or range on or around
  that line, and any one by a `disable-file` for its code placed anywhere in the target;
  one without anchor ONLY by `disable-file` (never by a range, closed or not).
  Rationale: a finding about the whole file has no line, so it needs an explicit whole-file
  directive; any line or range rule would be arbitrary.
- AS12: Suppressible set (DIR6): `MTL101` to `MTL899` only, the heading warning `MTL616` and
  `MTL617` included. `MTL001` to `MTL004`, `MTL010` to `MTL013`, `MTL014` (since C12),
  `MTL015` (since C10), `MTL016` (since C11), `MTL017`, `MTL018`, `MTL019`, `MTL020` to
  `MTL025`, `MTL030`, `MTL031` (since C14) and `MTL9xx` are not (`MTL022` when named). Rationale: only findings
  about one parsed target's content are local to that file.
- AS13: Reporting (DIR9): suppressed findings are dropped before counting and the exit code;
  only a count is shown (text `Suppressed:` when greater than 0, JSON `summary.suppressed`
  always). Rationale: suppression stays visible in CI without a new listing section; the
  JSON change is additive (`schemaVersion` 1).
- AS14: Source excerpt (8.1, 8.2, 8.3, 8.5). The "faulty line" is the line that causes the
  finding, in the target or in the template (confirmed by the user). Decisions:
  (a) a diagnostic without position quotes its anchor line (DIR5) when it has one, because
  the anchor is cheap and unambiguous; one without both gets no excerpt; (b) the caret
  exists only for a diagnostic with a column; (c) JSON `sourceLine` exists only next to a
  `line` (an anchor-only excerpt is text-only, so JSON never carries a quoted line without
  its number and DIR5 stays true); (d) the line is cut at 100 characters, with `...`;
  (e) `--verify` quotes the template line of `MTL010` to `MTL013` (and `MTL015` since C10,
  `MTL016` since C11, `MTL014` since C12, `MTL017`, `MTL018`, `MTL019`, `MTL030` and `MTL031`
  since C14), and a
  lint run quotes the template line of the template errors `MTL017`, `MTL018`, `MTL019` and
  `MTL030`. Rationale: see 8.1 and 8.2.
- AS15: All heading levels (2.6, change C10, ADR 0009). Decisions of 2026-10-30 (numbered as
  in ADR 0009), with the choices this spec adds:
  (a) every level H1 to H6 is read and checked, no compatibility flag, released as a breaking
  version with a migration note (decision 1);
  (b) every level matches exactly, the earlier H1/H2 cross match by text is removed; no
  "wrong level" code is added (decision 2(b)); `MTL602` stayed the `exist` check until the
  `exist` tag was dropped and `MTL602` retired (AS17);
  (c) extra headings stay allowed by default; `[content:subheadings:disallow]` opts out for the
  whole subtree, `MTL612` on the topmost unlisted heading, no `allow` tag (decision 3(a));
  (d) an untagged H3 to H6 template heading is required;
  (e) spec choices: H1 and H2 keep file scope, H3 to H6 with a template parent match inside
  the parent's target section; such a heading under a missing, optional-absent or
  template-only parent is not checked; listing compares level and text (duplicates listed);
  one `MTL612` per heading, `{parent}` of the innermost tag; `MTL015` for the tag on a
  template-only heading; `MTL610` and `MTL612` messages name the level (`H{n}`) because exact
  levels make a level-only difference possible; `MTL611` checks the order of the DIRECT
  children of each matched parent while `MTL604` keeps file scope; `--verify` has a section
  `Conflicting tags:` (`MTL015` is its only reason); the fixture
  `MTL603/fail-template-only-heading-at-other-level` is a pass case. Rationale: in 2.6 next
  to each rule.
  (f) Amended by the positional match (ADR 0012, AS17): the first-match rule of (e) ("the
  first target heading in scope with the same level and text") is replaced by the positional
  run of 2.10 for every heading; scopes, "checked", listing for `MTL612` and the codes of (b)
  to (e) are kept, their trigger is the position.
- AS16: Field formats (2.9, change C11, ADR 0010). Decisions of 2026-10-30: (a) tags
  `[format:semver]` and `[format:date]` on frontmatter keys, and `[format:elements:semver]` /
  `[format:elements:date]` for list items; (b) a new field step `shape`, after the existing
  steps; (c) the field format decides how a date is PARSED, `YYYY-MM-DD` with a real calendar
  date; (d) `MTL307` is silent when the field type already rejects the value (`MTL504`); (e) a
  template-side `--verify` warning `MTL016` when a date field has no format, not
  suppressible; (f) codes `MTL306` to `MTL309` (format, suppressible) and `MTL016` (syntax,
  warning). Choices this spec adds: SemVer 2.0.0 without a `v` prefix; `[format:date]` on a
  non-date type always checks (no type rule covers it); `MTL309` leaves out the items
  `MTL513` lists, by the same "one problem, one error" logic; values are NOT trimmed (a
  decision: exact text, so `1.2.0` gives `MTL306`); `MTL016` checks the inferred type (3.2),
  so a `[date]` hint and a date-like value both count, and a scalar tag on a `list-of-date`
  field (or the reverse) does not satisfy it; `MTL016` sits at column 1 of the key line, in a
  last `--verify` section `Date fields without format:`; first tag of each kind wins (2.1);
  `[order:ascending]` and the type rules keep the default date parsing. Rationale: in 2.9.
- AS17: Heading patterns, repeat rules and order (2.10, change C12, ADR 0011) and positional
  matching (2.6, 2.10, ADR 0012).
  Decisions of ADR 0011: (1) the pattern lives in a tag with a quoted argument, `{{` and `}}`
  literal braces, other text literal, no `v` implied; (2) a pattern heading needs a heading at
  its position, else `MTL605`; (3) separate repeat tags `[repeat-rules:same-level]`,
  `...:min:N`, `...:max:N`, scope the same section parent; (4) order opt-in,
  `[order:ascending]` / `[order:descending]`, `{text}` not orderable; (5) every level
  checked, extra headings allowed unless a sub-heading tag, untagged H3 required; (6) no
  trimming, first tag of a kind wins; (7) codes `MTL014` (syntax, warning, not suppressible,
  `--verify` only) and `MTL605` to `MTL609` (heading, suppressible), `MTL605` without anchor,
  `MTL613` kept reserved (it is now heading-unique-names, 2.11).
  Decisions of ADR 0012 (2026-11-03), numbered as there: (1) positional matching for every
  heading, exact text and pattern alike, breaking; (2) strict adjacency, extras only after
  the last match, greedy first-fit without backtracking, optional takes only a match, repeat
  takes every consecutive match; (3) `MTL606` for a sibling that fails at a required position
  (naming the failing piece: a placeholder, or a literal piece of the pattern as in example
  F), `MTL605` when no sibling is left, `MTL607` with an explicit `min` also at zero
  (replacing `MTL605`), `MTL608`, one `MTL609` per repeat set, a new code for repeat siblings
  out of the run (`MTL614`), default minimum from presence; (4) examples A to H (2.10 worked
  example 4), a matching heading is always taken by the current position; (5) placeholders
  `{int}` (now `{digits}`, second revision below), `{number}`, `{text}` (not purely
  numeric), `{semver}`, `{date}`, a fixed format table, whole-text match, `\"` escape,
  `MTL014` for unknown placeholders and formats; (6) `[content:subheadings:no-extra]` with its
  own code (`MTL615`) next to `[content:subheadings:disallow]`; (7) template error `MTL017`
  heading-pattern-duplicate, `--verify` exit 1, not suppressible; (8) `MTL606` only with a
  sibling at the position; (9) no reuse of a 4.3 code (`MTL613` stayed reserved).
  Choices this spec adds (rationale next to each rule in 2.6, 2.7 and 2.10):
  - (a) the heading text of a pattern heading is a label, never compared; a heading whose
    pattern tag is ignored by `MTL015` is an exact-text heading;
  - (b) only a REQUIRED PLACEHOLDER position takes a sibling it does not match (`MTL606`);
    a literal position (exact text, or a pattern without placeholder) takes nothing and is
    missing (`MTL601`, `MTL610`, `MTL605`); this split is what makes examples A and E both
    hold;
  - (c) exact-text headings keep their earlier codes and messages (`MTL601`, `MTL610`; the
    retired `MTL602` was one of them; `MTL601` gains the "found later" hint, decision 6 of
    the open questions below); pattern headings use `MTL605` to `MTL609`;
  - (d) `[presence:template-only]` headings are not positions; their siblings are set aside
    before the run (the only gap), `MTL603` on the first, so one stray guidance heading does
    not shift the run;
  - (e) a required repeat heading whose first sibling fails takes it as a mismatch and then
    continues its run; the `max` bound never stops a run;
  - (f) the failing piece of `MTL606` is the first piece whose prefix cannot be satisfied,
    printed as written (placeholder) or quoted (literal);
  - (g) `MTL609` anchors on the later instance of the first pair out of order and counts the
    pairs; `MTL614` lists the tail siblings matching a repeat pattern (each under the first
    matching repeat heading) and anchors on the first;
  - (h) formats: `{semver}` `full`, `core`, `major-minor`; `{date}` `full`, `year-month`,
    `year`; none for `{int}`, `{number}`, `{text}`; names case-insensitive; `full` equals no
    option; `{number}` has no sign and no exponent; "purely numeric" is ASCII digits with at
    most one inner `.` (the `{text}` and `{number}` parts are revised by (bb) below, and the
    formats again by (hh) below);
  - (i) escapes `\"` and `\\` only, any other backslash pair is `MTL014` `invalid escape`;
    `MTL014` reasons `malformed placeholder` and `unknown format`;
  - (j) `[content:subheadings:no-extra]` reads the DIRECT target children of the match,
    declared means taken by a position of the template children (match or mismatch); a
    heading that gets `MTL603`, `MTL612` or `MTL614` does not also get `MTL615`; lexer
    keyword `NO_EXTRA`; `MTL015` for it on a template-only heading;
  - (k) `MTL017`: adjacent members of a template sequence (2.10; template-only and invalid
    headings left out), same pieces with case-insensitive placeholders and `full` equal to
    no format, reported on the later heading at the `[` of its pattern tag; a template with
    it FAILS (`FAIL` header, `Errors:` summary line, JSON `status: "fail"` and
    `summary.errors`) but is not broken; `--quiet` still shows it (widened by the open
    questions below: exact-text headings, lint runs);
  - (l) the content of an `exist` heading was read from the sibling its position took
    (before: only from a heading with the template text); void since the tag was dropped;
  - (m) code allocation: `MTL017` (next free syntax code after `MTL016`), `MTL614` and
    `MTL615` (next free heading codes after the reserved `MTL613`); names
    `heading-pattern-duplicate`, `heading-repeat-miss`, `heading-subheadings-only-declared`;
  - (n) kept from the first version of ADR 0011: bounds need `N` of 1 or more; `min` above
    `max` has no template warning; adjacent placeholders and an empty pattern are invalid;
    placeholder names are case-insensitive; the pattern `MTL015` reasons (five at first,
    three after the first revision, two after the second); `--verify` section
    `Invalid patterns:` before `Conflicting tags:`; dropped from that first version: CLAIM (a
    heading named by text never matched a pattern), the "repeat set is every unclaimed
    heading at the level" rule, one `MTL609` per pair, and the limitation "a pattern cannot
    contain `"`".

  Decisions on the six open questions of ADR 0012 (2026-11-03, in the same order; recorded in
  ADR 0011 and ADR 0012):
  1. keep BOTH `[content:subheadings:disallow]` (`MTL612`) and
     `[content:subheadings:no-extra]` (`MTL615`), no merged tag (2.6 "How the two tags
     differ");
  2. `MTL017` acts in a normal lint run too: printed as an ERROR on the template file, exit
     1, the targets still linted; `--verify` FAIL as before; not suppressible (2.7
     "TEMPLATE ERRORS", 7.5, 8.2);
  3. `[presence:optional]` with an explicit `[repeat-rules:same-level:min:N]` is a
     contradictory combination: the template error `MTL018`, same behaviour as `MTL017`
     (2.10 "Repeat rules");
  4. every extra heading is reported: ONE suppressible WARNING per run, `MTL616`, listing the
     tail headings, anchored on the first; where `MTL612` or `MTL615` raises an error for a
     heading, that error replaces the warning for it; `MTL614` stays an error for the tail
     siblings that match a repeat pattern, and the warning lists only the others (grammar.md
     "Extra", 2.10 step 4 and "Interplay");
  5. `MTL017` also compares exact-text headings and literal patterns (`## Notes` twice in a
     row, or `## Notes` next to `## [pattern:"Notes"]`) (2.10 "Duplicate pattern");
  6. the `MTL601` message hints when the missing heading exists later in the run:
     `(found later at line N, out of order)` (2.10 step 3b, example I).

  Choices this spec adds for these decisions (rationale next to each rule):
  - (o) code allocation: `MTL018` (next free syntax code after `MTL017`, inside the template
    tag sub-range `MTL010`-`019`), `MTL616` (next free heading code after `MTL615`, inside
    the suppressible `MTL101`-`899`); `MTL613` stayed reserved; names
    `heading-optional-min-conflict` and `heading-extra`;
  - (p) `MTL616` is per RUN (one sequence in one scope: once per level in file scope, once
    per level and parent match or instance in section scope); a level and scope without a
    position has no run and no tail, so headings at a level the template does not describe
    there are free detail (no warning; else every H3 of a document whose template stops at
    H2 would warn);
  - (q) the `MTL616` anchor is the first LISTED heading (the first tail heading that no
    error names), so a line directive always targets a heading the warning shows;
  - (r) a tail heading inside a stray block whose topmost unlisted heading gets `MTL612`
    is covered by that error and is not listed (one cause, one finding); which code reports
    a tail heading is decided before suppression;
  - (s) a heading named by a `MTL601` hint that stays in the tail is still listed by
    `MTL616` (decision 4 says every extra; `MTL601` has no anchor, the warning gives a line
    to act on); the hint is message text only, `MTL601` stays anchorless; `MTL610` and
    `MTL605` keep their messages (decision 6 names `MTL601`); the hint looks only from the
    cursor onward ("later"), so a same-text heading an earlier position took gives none;
  - (t) `MTL017` on an exact-text later heading has its own message form
    (`matches the same headings as the previous heading`, no fake `[pattern:...]`) and sits
    at the first character of its text; `exist` headings were never compared and broke
    adjacency (void since the tag was dropped);
  - (u) `MTL018` needs an effective repeat heading and an effective `min` (no `MTL018` next
    to `MTL014` or a `MTL015` for the same tags); `[presence:conditional:...]` with a `min`
    is not `MTL018` (documentation only, "when the condition holds, at least N"); in a lint
    run the tags apply as written (the `min` decides, `MTL607`);
  - (v) template errors in a lint run: one `✗ <template> (template)` entry per pair block,
    before the files, with template-line excerpts; listed once under `Failed templates:`;
    not counted as files; no `All files passed!`; kept by `--quiet`; JSON
    `template.status` `fail` with `diagnostics`, no new summary key; the template warnings
    `MTL010` to `MTL016` (and `MTL031` since C14) stay `--verify` output.

  Decisions of the first revision (2026-11-03; recorded in the "Revision 2026-11-03"
  sections of ADR 0011 and ADR 0012):
  1. the `exist` presence tag is dropped (breaking, before the first release): it becomes a
     malformed tag (`MTL012`, `--verify`) and the heading is treated as required; `MTL602` is
     retired, reserved, never reused; "any heading at this level" is written
     `[pattern:"{text}"]`, the text before the tag being an author hint (2.6 "Dropped tag");
  2. a template error `MTL019` heading-child-order-conflict (syntax, not suppressible,
     printed in a lint run with exit 1 and targets still linted, `--verify` FAIL) for a
     deeper direct child before a shallower one under one parent, the only shape where
     `MTL611` occurs; `MTL611` stays a target finding (2.7);
  3. the content label of a pattern heading is the matched target text plus the pattern,
     an exact-text heading keeps its template text (2.6 "Content tags");
  4. placeholders: fixed vocabulary with `{name:format:<fmt>}`; `{text}` `human` (default),
     `snakecase`, `camelcase`, `screamcase`, `kebabcase`; `{number}` `decimal` (default,
     signed) and `scientific`; `{int}` (renamed `{digits}` by the second revision);
     `{semver}` and `{date}` as before; new `{char}`; whole-text match; `MTL014` for an
     unknown placeholder or format (2.10 PLACEHOLDERS);
  5. `[order:ascending|descending]` compares the whole heading text as a string;
     `[order:first:number:...]` and `[order:first:date:...]` order by the first number or
     ISO date in the text; a heading without one in an ordered repeat set is an error that
     recommends a pattern (2.10 "Order");
  6. a regexp pattern tag and its limits are an idea only, no `{regexp}` placeholder (ADR
     0011 revision);
  7. each rule and behaviour of the revision is delivered and tested on its own, the
     templates and fixtures are migrated with it;
  8. ADR 0011 and ADR 0012 stay accepted, with a revision section each.

  Choices this spec adds for the first revision (rationale next to each rule):
  - (x) the dropped tag follows the general malformed rule: `MTL012`, peeling stops, the
    bracket stays in the heading text, so the heading is a required exact-text heading that
    no target matches (`MTL601` / `MTL610` quote the bracket); in frontmatter it is `MTL012`
    (no region accepts it). Reading of decision 1 "treated as required": required with the
    text as written, not "any text" (an "any text" fallback would keep the dropped
    behaviour alive under a warning);
  - (y) `MTL602` is in no 4.3 table and has no rule; it is only reserved in 4.2 (while a rule
    was registered for it, its row stayed in 4.3 marked retired, because
    `pnpm run check:rules` needs every registered code in 4.3; rule and row were removed
    together);
  - (z) `MTL019`: the child list is the `MTL611` list (section-scope direct children), so an
    H3 before an H2 under an H1 is not reported (the H2 is file scope and `MTL611` cannot
    fire there); template-only children, children with an invalid pattern and the children
    of a template-only parent are left out; ONE finding per parent, on the first offending
    child, naming the first earlier deeper child; column 1; next free syntax code
    (`MTL019`, which fills the template tag sub-range); `--verify` section
    `Child headings out of level order:` after the earlier sections (followed by
    `Order tags without repeat:`, (ii) below; a parent with an invalid pattern is reported
    too, decision 1 of the second revision);
  - (aa) order keys: the whole-text form compares UTF-16 code units (the order of 8.4); the
    FIRST NUMBER is the longest NUMERIC TEXT from the first ASCII digit, a `-` joining it
    only at the start or after a character that is not a letter or digit; the FIRST DATE is
    the leftmost real ISO date not glued to other digits, invalid calendar shapes skipped;
    instances without key are left out of the pairs; the "heading without number or date"
    error is its own code `MTL617` heading-order-key-missing (heading, error, suppressible,
    next free heading code after `MTL616`; `MTL613` stayed reserved) and not a second form
    of `MTL609` (one cause per code, own suppression, and `MTL609` stays "one per set, pairs
    only"); one per repeat set, at any `n` of 1 or more, anchored on the first keyless
    instance, listing them; its message recommends a pattern with `{number}` or `{date}`;
    `MTL609` prints the order tag as `{tag}`;
  - (bb) formats: `{int}` keeps no sign; `{number}` `decimal` gains the `-` sign (decision 4
    example `-1.5`); PURELY NUMERIC widens to the NUMERIC TEXT shape (sign, exponent,
    leading zeros); the case formats reuse the 2.3 value patterns (ASCII), so they may be
    digits only (except `camelcase`); `screamcase` is `^[A-Z0-9]+(_[A-Z0-9]+)*$`; `{char}`
    is one code point of the Unicode category Letter; the default names `human` and
    `decimal` may be written and equal no format (also for `MTL017`); `full` stays the
    default name of `{semver}` and `{date}` only (revised by (hh) below: `{int}` renamed
    `{digits}`, `{number}` leading zeros allowed, the case formats Unicode and never digits
    only);
  - (cc) versions (superseded by decision 2 of the second revision, (gg) below, which adds
    `[order:first:semver:...]`; changelogs may order by version or by date): string order
    and the first number both mis-sort `1.10.0`; the example
    `## Epic A - Title [pattern:"Epic {char} - {text}"] [order:ascending]` gets
    `[repeat-rules:same-level]` in this spec, since an order tag without it has no effect (a
    `MTL015` reason at first, the template error `MTL030` since decision 3 of the second
    revision);
  - (dd) content label: `Section '{text}' (pattern "{pattern}")`, and
    `Section '{parent} > {text}' (pattern "{pattern}")` in section scope, the pattern as
    written in the tag;
  - (ee) `MTL015` loses the reason for pattern tags on an `exist` heading and
    `the pattern has no orderable placeholder` (three pattern reasons remained; two since
    decision 3 of the second revision turns the order-without-repeat reason into `MTL030`);
  - (ff) the `exist` tag was removed last, once patterns matched, so that every template and
    fixture that used it had a working replacement; the unused `HeadingMatch.textMatch` field
    was removed with it.

  An open question of the first revision (a version-value order form, choice (cc)) is closed
  by decision 2 of the second revision (yes, `[order:first:semver:...]`).

  Decisions of the second revision (2026-11-03; recorded in the "Revision 2026-11-03"
  sections of ADR 0011 and ADR 0012, under their "Notes"):
  1. `MTL019` also fires for a parent whose own pattern is invalid; such a template reports
     both `MTL014` and `MTL019` (2.7);
  2. an order form `[order:first:semver:ascending|descending]`: the FIRST SemVer 2.0.0 value
     of the heading text, compared by SemVer precedence; an instance without one is
     `MTL617`, as for `number` and `date`; a changelog may order by version or by date
     (2.10 "Order");
  3. an order tag without `[repeat-rules:same-level]` is a TEMPLATE ERROR, same behaviour as
     `MTL017` to `MTL019` (lint exit 1 with targets still linted, `--verify` FAIL with its
     own section, not suppressible), no longer a `MTL015` reason (2.7);
  4. placeholders: `{digits}` replaces `{int}` (breaking, before the first release) with the
     formats `signed`, `hex`, `uid` and `padding:N`; `{number}` (decimal and scientific)
     allows leading zeros and gains `precision:N`; the `{text}` case formats accept Unicode
     letters and never a digits-only text, and `lowercase` and `uppercase` are added;
     `human` stays the default (2.10 PLACEHOLDERS);
  5. a later epic, after the heading patterns, for a table-of-contents tag and a
     heading-numbering tag: design only, not specified, no code (section 9 "Later epics").

  Choices this spec adds for the second revision (rationale next to each rule):
  - (gg) the FIRST SEMVER is the longest SEMVER prefix at the leftmost start (an ASCII
    digit with no digit or `.` before it) that no ASCII digit follows; a `v` before it is
    allowed (`v2.0.0` gives 2.0.0); build metadata is ignored by precedence, so two
    instances that differ only by build are equal keys and pass; `{kind}` of `MTL617` is
    the keyword `semver` and `{placeholder}` the text `{semver}`; `semver` is the lexer
    keyword of the field formats too, so the order form adds no keyword for it;
    `[order:first:version:...]` stays malformed;
  - (hh) placeholder formats: the argument grammar is one more `:` part,
    `{name:format:<fmt>:<arg>}`, `arg` a number of 1 or more without leading zero; only
    `padding` and `precision` take one and both need it; three `MTL014` reasons
    (`needs an argument`, `bad argument`, `takes no argument`), checked after the name, the
    shape and the format; `{date:format:year:month}`, a malformed placeholder before, is now
    the reason `takes no argument`; the default of `{digits}` has no name (as `{char}`, it
    cannot be written), so `{digits:format:decimal}` is an unknown format; `signed` keeps
    the no-leading-zero rule and accepts `+` and `-`; `hex` is case-insensitive, no `0x`,
    leading zeros allowed; `uid` is ASCII letters and digits with at least one of each (a
    letter-only word is `{text}`, a digits-only one `{digits}`); `padding:N` is exactly `N`
    ASCII digits, no sign; `precision:N` is a signed decimal with exactly `N` decimals and no
    exponent; the case formats use Unicode general categories (word sets `Ll`, `Lm`, `Lo`
    and ASCII digits for the lower styles, `Lu`, `Lm`, `Lo` and ASCII digits for
    `screamcase`; caseless letters fit every style), need at least one letter, and exclude
    titlecase `Lt`; `lowercase` and `uppercase` allow any non-letter character (spaces,
    digits, punctuation) and need one letter; the field case styles of 2.3 stay ASCII;
    `MTL017` compares the argument as written;
  - (ii) code allocation: `MTL030` heading-order-without-repeat. The template tag sub-range
    `MTL010`-`019` is full and `MTL020`-`029` belongs to the directive warnings (`MTL026` to
    `029` kept free for them), so the next free code of the `syntax` category is `MTL030`,
    which opens a second template tag sub-range `MTL030`-`039` (4.2). Not a heading code
    (`MTL6xx`): every template-phase diagnostic is `syntax` (category, rule file
    `src/rules/syntax.ts`) and every `MTL101`-`899` code is suppressible (DIR6), which a
    template error must not be. `MTL613` was still reserved then and `MTL602` stays
    retired. Trigger: an effective order tag on a
    pattern heading (valid pattern, not template-only) without a repeat tag of any of the
    three kinds (the `min` and `max` forms make a repeat heading too, 2.10); a heading
    without pattern keeps the `MTL015` reason `the heading has no [pattern:...]`, a
    template-only heading its `MTL015`, an invalid pattern its `MTL014` (one cause, one
    finding, as `MTL018` (u)); position at the `[` of the order tag; `--verify` section
    `Order tags without repeat:` last; in a lint run the order tag has no effect (one
    position takes one heading);
  - (jj) `MTL019` for an invalid-pattern parent reads the same child list as for any parent
    (a child with an invalid pattern stays out of it, it is not a position);
  - (kk) the second revision adds the code `MTL030`, so the 4.3 table holds 84 codes (the
    count `tests/consistency/rules.test.ts` pins); the later epic of decision 5 gets no code.

## 11. Behaviour notes and changes beyond D01 to D18

In this section "before" means the behaviour of the earlier linter that md-template-lint
replaces. [ADR 0014](adr/0014-legacy-behaviour-catalogue.md) is the catalogue of these entries.

### 11.1 Kept quirks

Kept on purpose, so results stay the same as before (change only with a new decision):

- Q01: an unknown type hint becomes the type name and is never validated (3.2).
- Q02: list text in messages (`{pylist}`) uses the bracket form of 3.4: quotes and escapes
  follow that form. Accepted deviation, same entry: before, `[format:constant:...]` and
  `[value:filename]` compared against the text form of the value (the bracket form for a
  list or mapping). For a list or mapping md-template-lint never matches. A non-empty list
  always has a `]` in its text, which a constant cannot contain (a file stem can, so
  `[value:filename]` could match a list such as `['a']` against a stem `['a']` before;
  accepted, same class as the mapping case), and an empty list is "empty" (skipped), so
  lists behave the same. A mapping could match before only when the constant is its bracket
  text (an empty mapping `{}` equals a constant `{}`); md-template-lint reports it as a
  mismatch. This case is accepted as not worth reproducing.
- Q03: retired. It kept the `exist` presence mode of the earlier linter (undocumented in its
  docstring, which said "substring"; the code matched by heading LEVEL). The mode is dropped
  and `MTL602` retired (2.6 "Dropped tag", the `exist` note of C10).
- Q04: `[format:constant:...]` and `[presence:conditional:...]` text cannot contain `]`.
- Q05: headings inside multi-line HTML comments count. (This entry used to keep the rule
  "heading order uses the first matching target heading" too; the positional match of 2.10,
  ADR 0012, replaced it.)
- Q06: a duplicate frontmatter key silently keeps the last value.
- Q07: unknown and malformed template tags show in `--verify` only.
- Q08: a tag in a comment on a list item is read but not used.

### 11.2 Changes beyond D01 to D18

Behaviour that differs from before and is not one of the numbered defects.

- C01: a target file argument that does not exist. Before, the whole run aborted with
  `Error: target not found` and exit 1 at the first missing file, before linting any file.
  md-template-lint reports `MTL912` for that file, still lints the others, and exits 2 at
  the end (7.2, 7.5).
- C02: a broken template. The earlier wrapper script printed an extra line
  `(skipping remaining N target file(s) for this template)` after `TEMPLATE ERROR`.
  md-template-lint does not print it: the files of that pair are never attempted, and the
  `TEMPLATE ERROR` line plus the `Broken templates:` list say it (8.2).
- C03: the empty-set note. Before, the note was `No files matching pattern '<p>' in <dir>`.
  md-template-lint prints `no files matched pair '{name}' in root '{root}'` as `MTL913`,
  because a pair now has several globs and a root, not one pattern and one directory (7.4).
- C04: a template path that exists but is not a regular file (for example a directory).
  Before, it passed the exists check, then failed the parse: "broken template", exit 1.
  md-template-lint reports `MTL911`, a run error that skips only the pairs using that
  template, and exits 2 (4.3, 6.6, 7.3).
- C05: a known, well-formed tag in the wrong region (a heading-only tag in a frontmatter
  comment, or the reverse). Before, it was ignored silently. md-template-lint reports
  `MTL013`, a warning with line and column, shown by `--verify` only (2.7).
- C07: reporting additions. `pretty` and `plain` text renderings (8.2); the diagnostic
  `heading` member for heading and content findings, no `field` member (8.1); config errors
  carry file, line, column and key (`(file:line:col)` suffix in text); a duplicate YAML key in
  the config is `MTL902`, YAML anchors and aliases in the config are a type error; URL probe
  reasons also include `invalid URL`, `url budget exceeded` and `request failed`; MTL004 detail
  is path free (`file is not valid UTF-8` or `cannot read file (CODE)`).
- C06: accepted Unicode deviations from the earlier linter (JavaScript regex and string
  semantics differ from its runtime). Each is a known, small difference, kept until a real
  case shows up:
  - Digits: JS `\d` and the lexer `T_NUMBER` match ASCII digits only. The earlier linter's
    `\d` matched every Unicode decimal digit (class Nd). Affects int, float, date patterns,
    range/count/min-lines numbers.
  - Whitespace: type checks, io paths and the frontmatter loader strip with JS `trim()`,
    except the type `date`, which uses the Unicode space set (`stripUnicodeSpace` in
    `src/engine/values.ts`). The shape predicates of 2.9 do not strip. The range, order, url,
    path-alias and content rules strip with the Unicode space set. That set is the contract;
    it differs from the JS `trim()` set for U+001C to U+001F, U+0085 (in the set, not
    trimmed by JS) and U+FEFF (trimmed by JS, not in the set).
  - URLs: the syntactic URL check follows the URL split rules of the earlier linter but does
    not validate IPv6 bracket literals, does not strip leading C0 control characters and
    does not apply the NFKC netloc check.
  - Numbers: an integer bound above 2^53 compares as a JS number. In `range` the printed bound
    stays exact through BigInt; in `count` it is parsed with `parseInt` and prints inexactly.
  - Filename stem: a target path that ends with a separator has an empty stem, while the
    earlier linter gave the last directory name (`dir` for `dir/`) (`[filename:case]`,
    `[value:filename]`).
- C08: disable directives in target files (4.4, AS9 to AS13). Before, there was no
  suppression: every comment of a target was inert prose. md-template-lint reads
  `md-template-lint` comments in the target (HTML in the body, YAML in the frontmatter) with
  six verbs (`disable-file` the only one for findings without a line, DIR7), drops the
  covered diagnostics (4.1 step 8), reports directive mistakes as `MTL020` to `MTL025` (4.1
  step 7), and counts suppressions (`Suppressed:`, `summary.suppressed`, 8.2, 8.5).
  Compatibility: a target without such a comment gives the same diagnostics as before (the
  reference corpus of ADR 0014 has none); JSON gains only the always present
  `summary.suppressed` key. Rationale: users need a local, reviewable escape hatch for one
  known exception without loosening the shared template.
- C09: source excerpt (8.1 to 8.3, 8.5, AS14). Before, only the message was printed.
  md-template-lint quotes the offending source line under each diagnostic that has one,
  with a caret when a column is known, in `pretty` and `plain`, and adds the optional string
  `sourceLine` next to `line` in JSON and verify JSON. Messages, codes, counts, exit codes,
  ordering and `schemaVersion` (1) are unchanged, except that the escaped set of `cleanText`
  grows by the invisible format characters of EX3 (U+00AD, zero-width, tag characters and
  the like), which now show as escapes in every echoed value. Text output of a file with
  findings gains rows (a normalizer that drops the excerpt rows compares equal to the
  earlier layout; rows start with a line number and `|`). Rationale: the user finds the line
  without opening the file.
- C10: all heading levels (2.6, 2.7, 4.3, DIR5, DIR6, AS15, ADR 0009). BREAKING, released as
  the breaking release 0.2.0, no compatibility flag. Before, only H1 and H2 were read as
  sections, a template heading matched by text at either of those two levels (only `exist`
  compared the level) and H3 to H6 were ignored (old behaviour, removed). md-template-lint
  reads and checks every level: an untagged H3 to H6 template heading is required; every
  level matches exactly (same level and text); H3 to H6 headings with a template parent
  match inside the parent's target section (`MTL610`, `MTL611`); the opt-in
  `[content:subheadings:disallow]` forbids unlisted headings in a subtree (`MTL612`); tags on
  H3 to H6 template lines give `MTL011` to `MTL013`; a tag without effect gives `MTL015`.
  Compatibility: a template with only H1 and H2 headings and no new tag gives the same
  findings as before, except where a target relied on the H1/H2 cross match (then `MTL601`
  or no `MTL603`, 2.6) and except the positional changes and `MTL616` warnings of the note
  below. Migration: [ADR 0014](adr/0014-legacy-behaviour-catalogue.md). Rationale: headings
  are checked "always on, in all levels"; a changelog needs H3 groups inside each release.
  BREAKING-CHANGE NOTE (positional match, ADR 0012): the C10 match "the first target heading
  in scope with the same level and text" is replaced by the positional run of 2.10 for
  every heading, exact text included. Effects on targets that passed before: an extra
  heading BEFORE or BETWEEN template headings of one level and scope now shifts the run (the
  next template heading is missing, `MTL601` / `MTL610`); a swapped same-level pair gives
  `MTL601` instead of `MTL604` / `MTL611`; a duplicate of a template heading is an extra (no
  longer the first one wins wherever it is); the content of an `exist` heading was read
  from the heading at its position (until the tag was dropped, note below).
  Extras after the last template heading of a level stay allowed. Codes and messages are
  unchanged, except two additions (AS17): every extra in the tail of a run gives the
  WARNING `MTL616` (exit code unchanged, suppressible), and the `MTL601` message of a
  swapped pair gains `(found later at line N, out of order)`. Migration:
  [ADR 0014](adr/0014-legacy-behaviour-catalogue.md) section "Headings are matched by
  position", released with the breaking release 0.2.0.
  BREAKING-CHANGE NOTE (the `exist` tag, AS17; same release as the notes above):
  `[presence:exist]` is REMOVED.
  It is now a malformed tag (`MTL012` in `--verify`); the bracket stays in the heading
  text, so the heading is an ordinary required heading that no target matches and every
  lint run reports it missing (`MTL601` / `MTL610`). `MTL602` heading-level-missing is
  RETIRED: reserved, never reused, its behaviour removed; the second message form of
  `MTL610` is gone. Migration: `## Context [presence:exist]` becomes
  `## Context [pattern:"{text}"]` (any non-numeric text at that level; the text before the
  tag is an author hint), or a tighter pattern (`# ADR - Title [pattern:"ADR - {text}"]`,
  `### 0.0.0 [pattern:"{semver}"]`), or a plain heading when the text is fixed
  (`## Changes [content:table]`); a purely numeric heading needs `{digits}` (or one of its
  formats, `padding:N` for `007`), `{number}` or a `{date}` format.
  [ADR 0014](adr/0014-legacy-behaviour-catalogue.md) section "The `exist` presence tag is
  removed".
- C11: field formats (2.3, 2.7, 2.9, 3.4, 4.1, 4.3, DIR5, DIR6, 8.3, AS16, ADR 0010). Not
  breaking, minor release. Before, there was one project-wide date parsing (the four shapes
  of 3.3) and no version check. md-template-lint adds `[format:semver]`, `[format:date]` and
  their `elements:` forms (`MTL306` to `MTL309`, field step `shape`, last) and the template
  warning `MTL016` for a date field without format. Compatibility: a template without the
  new tags gives the same findings as before on every target; only `--verify` of a template
  with a `date` or `list-of-date` field gains `MTL016` warnings (exit code unchanged).
  Rationale: changelogs and dated documents need one exact shape (`YYYY-MM-DD`) and real
  versions, and the template should state which date shape it means.
- C12: heading patterns, repeat rules and order (2, 2.6, 2.7, 2.10, 4.1, 4.2, 4.3, DIR5,
  DIR6, DIR7, 7.3, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5, AS17, ADR 0011, ADR 0012). The tags
  themselves are additive; the positional match under them is breaking (C10 note), so they
  ship in the breaking release 0.2.0. Before, there was no way to match a heading whose
  text varies: a release heading had to be written with its exact text or left unchecked.
  md-template-lint adds `[pattern:"..."]`, `[repeat-rules:same-level]` (with `min` and `max`
  forms), `[order:ascending]` / `[order:descending]` and `[content:subheadings:no-extra]` on
  headings (`MTL605` to `MTL609`, `MTL614`, `MTL615`), the extra warning `MTL616`, the
  template warning `MTL014` and the template errors `MTL017` (pattern headings and
  exact-text headings) and `MTL018`; both template errors fail `--verify` and a lint run
  (printed on the template file, exit 1, targets still linted); `[order:ascending]` on a
  heading, a misplaced tag (`MTL013`) before, becomes the order tag.
  Compatibility: after the positional change (C10 note), a template without the new tags
  gives the same errors on every target, plus `MTL616` warnings for extras and the `MTL601`
  hint; a template with two adjacent identical exact-text headings now fails with
  `MTL017`. Rationale: a changelog repeats one heading shape per release, newest first, and
  the template should say so.
  First revision (AS17, revision sections of ADR 0011 and ADR 0012): placeholder formats
  (`{text}` case formats, `{number}` `scientific` and a signed `decimal`) and the new
  placeholder `{char}`; `[order:ascending]` / `[order:descending]` compare the whole
  heading text, and `[order:first:number:...]` / `[order:first:date:...]` order by the
  first number or date of the text (`MTL617` heading-order-key-missing for an instance
  without one); the content label of a pattern heading names the pattern; the template
  error `MTL019` heading-child-order-conflict; the `exist` presence tag dropped and `MTL602`
  retired (C10 note). A template with a deeper child before a shallower one under one
  parent, valid before, now fails with `MTL019`.
  Second revision (AS17, revision sections of ADR 0011 and ADR 0012; same release): `MTL019`
  also for a parent with an invalid pattern; the order forms `[order:first:semver:...]`; an
  order tag on a pattern heading without repeat tag is the template error `MTL030`
  heading-order-without-repeat (it was a `MTL015` warning), so such a template, which passed
  lint runs before, now fails them; `{int}` is renamed `{digits}` (BREAKING: `{int}` is now
  an unknown placeholder, `MTL014`, and the heading is no longer checked until the template
  is migrated) with the formats `signed`, `hex`, `uid` and `padding:N`; `{number}` accepts
  leading zeros and gains `precision:N`; the `{text}` case formats accept Unicode letters
  and reject digits-only values (a template that relied on `2026` being `snakecase` must use
  `{digits}`), and `lowercase` and `uppercase` are new.
- C13: unique heading names (2.11, 4.2, 4.3, ADR 0013). Implemented. Before, there was no
  name check: two headings with one text were allowed everywhere. md-template-lint adds the
  opt-in tag `[unique-headings-names]`, template-wide (a frontmatter comment line) or per
  heading (its subtree), and the error `MTL613` heading-unique-names on each later
  duplicate (case-insensitive, any level). The bracket is a known tag (grammar and tag
  parsing). Compatibility: a template without the tag gives the same findings on every
  target. Not breaking, minor release.
- C14: optional frontmatter (2.12, 1.1, 1.2, 4.1, 4.3, ADR 0015). Implemented. Before, every
  target needed a frontmatter block (`MTL001`) and `README.md` or `TODO.md` files could not
  be linted. md-template-lint adds the opt-in template tag `[frontmatter:optional]`, a
  standalone comment line in the template frontmatter: a target without a frontmatter block
  then gets no `MTL001` and no field rule, while the filename, heading, content rules and body
  directives still run. A target with a block is checked as before; an unclosed `---` stays
  `MTL001`. The warning `MTL031` frontmatter-tag-conflict reports a copy of the tag that has
  no effect. Compatibility: a template without the tag gives the same findings on every
  target. Not breaking, minor release.
