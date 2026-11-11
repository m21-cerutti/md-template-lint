<div align="center">

# Markdown Template Linter

Lint your documents markdown like any other file.
<br>

[![GitHub Release](https://img.shields.io/github/v/release/m21-cerutti/md-template-lint)](https://github.com/m21-cerutti/md-template-lint/releases/latest/)
[![GitHub Release Date](https://img.shields.io/github/release-date/m21-cerutti/md-template-lint?style=flat)](https://github.com/m21-cerutti/md-template-lint/releases)
[![GitHub All Releases](https://img.shields.io/github/downloads/m21-cerutti/md-template-lint/total.svg)](https://github.com/m21-cerutti/md-template-lint/releases)
[![GitHub Stars](https://img.shields.io/github/stars/m21-cerutti/md-template-lint?style=flat&label=🌟+stars&color=gold)](https://github.com/m21-cerutti/md-template-lint/tree/main)

<img alt="Template Markdown Logo" src="assets/example.png" />
<br>

</div>

<!-- prettier-ignore-start -->
<!-- omit in toc -->
## Summary
<!-- prettier-ignore-end -->

- [Description](#description)
- [Quick usage](#quick-usage)
- [Install](#install)
- [Usage](#usage)
  - [Exit codes](#exit-codes)
  - [Output formats](#output-formats)
    - [Source line under a diagnostic](#source-line-under-a-diagnostic)
  - [Full run, file arguments and `--verify`](#full-run-file-arguments-and---verify)
- [Template syntax](#template-syntax)
- [Rule syntax by category](#rule-syntax-by-category)
  - [syntax (`MTL001`-`MTL099`)](#syntax-mtl001-mtl099)
  - [filename (`MTL100`-`MTL199`)](#filename-mtl100-mtl199)
  - [presence (`MTL200`-`MTL299`)](#presence-mtl200-mtl299)
  - [format (`MTL300`-`MTL399`)](#format-mtl300-mtl399)
  - [bounds (`MTL400`-`MTL499`)](#bounds-mtl400-mtl499)
  - [type (`MTL500`-`MTL599`)](#type-mtl500-mtl599)
  - [heading (`MTL600`-`MTL699`)](#heading-mtl600-mtl699)
    - [Positional matching](#positional-matching)
    - [Heading patterns](#heading-patterns)
    - [Repeat rules](#repeat-rules)
    - [Order](#order)
    - [Sub-heading tags](#sub-heading-tags)
    - [Unique heading names](#unique-heading-names)
    - [The `exist` tag is removed](#the-exist-tag-is-removed)
  - [content (`MTL700`-`MTL799`)](#content-mtl700-mtl799)
  - [io (`MTL800`-`MTL899`)](#io-mtl800-mtl899)
  - [Run diagnostics (`MTL900`-`MTL999`)](#run-diagnostics-mtl900-mtl999)
- [Disabling rules in a file](#disabling-rules-in-a-file)
  - [Where directives are read](#where-directives-are-read)
  - [Which codes can be disabled](#which-codes-can-be-disabled)
  - [Anchor lines and `disable-file`](#anchor-lines-and-disable-file)
  - [Examples](#examples)
  - [Directive warnings](#directive-warnings)
  - [Counts and exit code](#counts-and-exit-code)
- [Configuration reference](#configuration-reference)
  - [Discovery](#discovery)
  - [Path values](#path-values)
  - [Globs](#globs)
  - [`onEmpty`](#onempty)
  - [Multi-root and external roots](#multi-root-and-external-roots)
- [lint-staged setup](#lint-staged-setup)
  - [This repository lints its own docs](#this-repository-lints-its-own-docs)
- [Documentation](#documentation)
- [Development](#development)
  - [Editor setup](#editor-setup)
- [AI-Assisted Development](#ai-assisted-development)

## Description

**Markdown Template Linter** checks Markdown
instance files (frontmatter and headings) against template files. Template tag
syntax is defined by an ANTLR grammar; rules are grouped by category; each
project configures its template/target pairs in `md-template-lint.yml`.

A template is a Markdown file and it is the schema: the frontmatter keys, their
inline `#` comments and the heading suffixes (H1 to H6) carry the rules. There is no
separate schema file.

License: MIT, Copyright (c) 2026 Marc CERUTTI.

## Quick usage

The package is not published yet: see [Install](#install) first (until then, run
`node dist/cli.js` from a built clone in place of `md-template-lint`).

```bash
md-template-lint                  # lint every pair of md-template-lint.yml
md-template-lint docs/adr/0001-first.md   # lint only these files (lint-staged mode)
md-template-lint --verify         # check the template syntax, lint no target
```

Minimal `md-template-lint.yml` at the project root:

```yaml
pairs:
  - template: templates/adr.template.md
    include: docs/adr/*.md
    exclude: "**/README.md"
```

Exit code: `0` clean, `1` lint failure or broken template, `2` usage, config or
run error.

## Install

The package `md-template-lint` is **not published to npm yet**. Publishing is a
manual step for the owner; until it is done, the commands below do not resolve
from the registry. Node >= 22.18 is required.

Local, as a development dependency of a project:

```bash
pnpm add -D md-template-lint
pnpm exec md-template-lint --version
```

Global:

```bash
pnpm add -g md-template-lint
md-template-lint --version
```

Until the package is published, run it from a clone of this repository:

```bash
pnpm install --frozen-lockfile
pnpm run build
node dist/cli.js --help
```

`dist/cli.js` is the `bin` entry of the package.

## Usage

```text
md-template-lint [options] [files...]
md-template-lint --verify [options] [templates...]
```

Source of truth for flags, modes and output: [docs/spec.md](docs/spec.md) sections 7 and 8.

| Flag              | Meaning                                                                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `--config <path>` | Config file (also `--config=<path>`). Default: `md-template-lint.yml`, searched in the working directory, then upward. |
| `--format <name>` | `text` (default), `plain` or `json`. Also `--format=<name>`. Any other value is `MTL922`.                              |
| `--quiet`         | Text formats only: print only failing files, broken templates and run errors. JSON is always complete.                 |
| `--verify`        | Check the template syntax only. No target is read.                                                                     |
| `--version`       | Print the package version and exit 0.                                                                                  |
| `--help`, `-h`    | Print the usage and exit 0.                                                                                            |
| `files...`        | Lint only these files (see below). With `--verify` they are the templates.                                             |

`--help` and `--version` win over every other argument. `--` ends the options;
what follows are files. An unknown option is `MTL920`, a missing option value is
`MTL921`; both exit 2 and print a hint. The legacy flags `--pattern`, `--dir`,
`--ignore` and `--base-dir` do not exist (see [ADR 0014](docs/adr/0014-legacy-behaviour-catalogue.md)).

The `--help` output and the text-format `--verify` report include a one-line reminder: `Template syntax reference: <URL>` (a link to [docs/syntax-reference.md](docs/syntax-reference.md), a concise reference of tags, settings and rules for writing templates).

### Exit codes

| Code | Meaning                                                                                                   |
| ---- | --------------------------------------------------------------------------------------------------------- |
| `0`  | No file with errors, no broken template, no run error. Warnings may exist. Also `--help` and `--version`. |
| `1`  | At least one target has an error, or a template is broken, and there is no run error.                     |
| `2`  | A run error: usage, config, missing root, template or target file. It outranks `1`.                       |

Warnings never change the exit code. A diagnostic suppressed by a directive in the
target is not counted (see [Disabling rules in a file](#disabling-rules-in-a-file)).

### Output formats

- `text` (default): the layout with glyphs `✓ ✗ ⚠ ℹ`, in color only on a terminal
  and when `NO_COLOR` is unset or empty.
- `plain`: the same layout with the words `PASS`, `FAIL`, `INFO`, never colored.
- `json`: one JSON document on stdout and nothing else (run errors are inside it).
  Stable keys: `schemaVersion`, `tool`, `version`, `mode`, `config`, `results`,
  `runErrors`, `runWarnings`, `unmatched`, `summary` (with `suppressed` and `exitCode`). In verify
  mode `results` is replaced by `templates`. A diagnostic that has a `line` also has
  `sourceLine` when that line exists in the file (see
  [Source line under a diagnostic](#source-line-under-a-diagnostic)).

Run errors in the text formats go to stderr as `error MTLnnn: <message>`.
Every printed path is relative to its root and uses `/`. Output order is fixed:
roots in declaration order, pairs in config order, files sorted.

Example (text format, shortened):

```text
md-template-lint <version>
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

========================
Summary
========================
Total files:  3
Passed:       2
Failed:       1
Warnings:     1 (in 1 file(s))
Templates:    1 checked, 0 broken

Failed files:
  - docs/adr/0002-second.md

========================
```

The full layout and the JSON schema are in [docs/spec.md](docs/spec.md) section 8.

#### Source line under a diagnostic

`text` and `plain` print the line that causes a finding under it: the line number, a bar and the
line text (see the `status:` and `authors: bob` lines above). A finding with a column (the
directive warnings `MTL020` to `MTL025`, and the template tag diagnostics `MTL010` to
`MTL019` and `MTL030`) adds a row with `^` under the offending character. A finding about one key or
heading but with no column (for example `MTL201` on an empty key, `MTL202`, `MTL701`) quotes the
key or heading line, without a caret. A finding about the whole file (a missing key, a missing
heading, the file name, a file that does not parse) has no line and prints no extra row.

```text
  ✗ docs/adr/0002-second.md
      error MTL201 Field 'status': required but empty or missing
        3 | status:
      warn  MTL021 Directive on line 9: unknown rule code 'MTL999'
        9 | <!-- md-template-lint disable-line MTL999 -->
          | ^
```

- The line comes from the file the finding belongs to: the target file, or the template file
  for the tag warnings of `--verify`.
- The text is the line as the tool read it: CRLF line ends and a BOM do not show, and a
  whitespace control (tab, VT, FF, NEL, U+2028, U+2029) is one space. Escaped (`\x1b`,
  `\u202e`, `\u{e0001}` above U+FFFF) are: every other C0 and C1 control, DEL, the bidi
  controls (U+061C, U+200E, U+200F, U+202A to U+202E, U+2066 to U+2069), U+FEFF, and the
  invisible format characters (U+00AD, U+180E, U+200B to U+200D, U+2060 to U+2064, U+FFF9 to
  U+FFFB, U+E0000 to U+E007F). The same escapes apply to every other echoed value (messages,
  headings, paths).
- The line is echoed as it is in the file, frontmatter values included (tokens, addresses,
  paths): it goes into the terminal and into CI logs and JSON artifacts, like the values the
  messages already name. Escaping keeps it from acting on the terminal, not from being read.
- A line is cut after 100 characters with `...`. When the caret column is past 100, the
  shown part slides to start 40 characters before it.
- `--quiet` shows the excerpts of the errors it prints (warnings and their excerpts are hidden).
- In `json`, `sourceLine` sits right after `column` and is present only next to a `line`: the
  directive and template tag warnings. The anchored findings above have no `line` in JSON, so
  no `sourceLine` either. It is the same sanitized text, cut after 100 characters. `schemaVersion`
  stays 1.

### Full run, file arguments and `--verify`

- **Full run** (no file argument): load the config and run every pair on every
  root it names.
- **File arguments** (lint-staged mode): each argument is a path relative to the
  working directory, or absolute. A file is a target of a pair when its path
  relative to the root matches an `include` glob and no `exclude` glob. A file that
  matches no pair is skipped silently. A file that matches a pair but does not exist
  is `MTL912` (the other files are still linted). Output order does not follow the
  argument order.
- **`--verify`**: parse each template and print its schema (field, inferred type,
  rules, headings of every level H1 to H6 with their rules, and the sections for unknown,
  malformed, misplaced and conflicting tags (`Conflicting tags:`, `MTL015`), the invalid
  patterns (`Invalid patterns:`, `MTL014`), the date fields without a format tag (`Date fields
without format:`, `MTL016`) and the template errors (`Duplicate patterns:`, `Optional headings
with a minimum:`, `Child headings out of level order:` and `Order tags without repeat:`,
  `MTL017`, `MTL018`, `MTL019` and `MTL030`)). No target is read and no
  network is used. `md-template-lint --verify` checks every distinct template of the
  config; `md-template-lint --verify path/to/a.md` checks those files and needs no
  config. A broken template exits 1, and so does a template with a template error
  (`MTL017`, `MTL018`, `MTL019`, `MTL030`); a missing template path exits 2. With neither
  a config nor a template path the run fails with `MTL923`.

Examples:

```bash
md-template-lint --config tools/md-template-lint.yml
md-template-lint --format json > lint-report.json
md-template-lint --quiet docs/adr/0002-second.md
md-template-lint --verify templates/adr.template.md
```

On Windows (PowerShell), absolute paths on any drive work too:

```powershell
md-template-lint D:\notes\adr\0003-third.md
md-template-lint "E:/work/project/docs/adr/0004-fourth.md"
md-template-lint --config C:\tools\md-template-lint.yml D:\notes\adr\0003-third.md
```

Backslash and slash are both accepted in every path argument and in `--config`. A file
on another drive than the config is linted only when it lies under a root of a pair (for
example a `roots` entry on `D:`); otherwise it matches no pair and is not linted. Like any
other unmatched file it changes neither the exit code nor the text output; the JSON report
lists it under `unmatched`. The drive letter is compared ignoring case, and on Windows
the directories of the root itself are too (`c:/notes` and `C:/Notes` are the same root);
the part below the root stays case-sensitive, because globs are case-sensitive on every OS.

## Template syntax

A template starts with a YAML frontmatter block. Each top-level key is a field. A
trailing `#` comment on the key line holds bracket tags (`[family:argument]`). The
headings of the body, at every level (H1 to H6), can carry bracket tags after their
text. A field or a heading without a presence tag is required.

```markdown
---
# [filename:case:kebab-case]
id: 0000-record-template # [presence:required] [value:filename] [format:kebab-case]
status: proposed | accepted # [presence:required]
date: 2026-10-29 # [presence:required] [format:date] [date]
deciders: [Name] # [presence:required] [count:min:1]
supersedes: 0000-other-record # [presence:optional]
---

# ADR - Title [pattern:"ADR - {text}"]

## Context [content:non-empty]

## Consequences [content:list]

## Authoring checklist [presence:template-only]
```

Four places carry tags:

| Place                | Where                                                      | Bound to     |
| -------------------- | ---------------------------------------------------------- | ------------ |
| Inline comment       | trailing `#` comment on a top-level frontmatter key        | that key     |
| Filename comment     | a standalone `# [filename:case:<convention>]` comment line | the template |
| Unique names comment | a standalone `# [unique-headings-names]` comment line      | the template |
| Heading suffix       | bracket tags after the text of a heading (H1 to H6)        | that heading |

Tag names and keywords are case-insensitive, except `[filename:case:<convention>]`,
which is case-sensitive. Tags in a target file are inert (only trailing heading tags
are stripped before comparison). Frontmatter values are read as strings (no
`yes`/date/number coercion). A BOM is ignored and line endings are normalized.

Tag grammar: [grammar/MdTemplateLexer.g4](grammar/MdTemplateLexer.g4) and
[grammar/MdTemplateParser.g4](grammar/MdTemplateParser.g4). Full specification:
[docs/spec.md](docs/spec.md) section 2 (tags), 3 (types), 4.3 (codes) and 4.4
(disable directives).

## Rule syntax by category

Rules live in `src/rules/<category>.ts`, one file per category. Codes are stable
`MTLnnn` and are never renumbered. The tables below copy
[docs/spec.md](docs/spec.md) sections 2 and 4.3, which stay the source of truth.
Severity `error` fails the file (exit 1); `warning` is printed and never changes the
exit code. The codes `MTL101` to `MTL899` can be silenced in a target file with a
disable directive (see [Disabling rules in a file](#disabling-rules-in-a-file)).

### syntax (`MTL001`-`MTL099`)

Parsing, template tag and target directive diagnostics. No tag of its own.

| Code     | Name                            | Severity | When                                                                                                                                                                                                                                                                                                                                                                                         |
| -------- | ------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MTL001` | frontmatter-missing             | error    | No YAML frontmatter (`---` ... `---`).                                                                                                                                                                                                                                                                                                                                                       |
| `MTL002` | yaml-invalid                    | error    | The frontmatter is not valid YAML.                                                                                                                                                                                                                                                                                                                                                           |
| `MTL003` | frontmatter-not-mapping         | error    | The frontmatter is not a `key: value` mapping.                                                                                                                                                                                                                                                                                                                                               |
| `MTL004` | file-unreadable                 | error    | The file cannot be read or is not valid UTF-8.                                                                                                                                                                                                                                                                                                                                               |
| `MTL010` | unknown-field-tag               | warning  | A bracket in a field or frontmatter comment looks like a tag but is unknown.                                                                                                                                                                                                                                                                                                                 |
| `MTL011` | unknown-heading-tag             | warning  | A leftover trailing bracket on a heading looks like an unknown tag.                                                                                                                                                                                                                                                                                                                          |
| `MTL012` | malformed-tag                   | warning  | A known tag family with a bad argument, for example `[count:min:abc]`.                                                                                                                                                                                                                                                                                                                       |
| `MTL013` | misplaced-tag                   | warning  | A valid tag in the wrong region (heading tag in frontmatter, or the reverse).                                                                                                                                                                                                                                                                                                                |
| `MTL014` | heading-pattern-invalid         | warning  | A `[pattern:"..."]` tag cannot be read: `Heading '{text}': invalid pattern [pattern:"{pattern}"] ({reason})`. Reasons: unknown or malformed placeholder, unknown format, bad format argument, unmatched brace, adjacent placeholders, invalid escape, empty pattern.                                                                                                                         |
| `MTL015` | heading-tag-conflict            | warning  | A heading tag has no effect, for example `[content:subheadings:disallow]` on a `[presence:template-only]` heading.                                                                                                                                                                                                                                                                           |
| `MTL016` | date-format-missing             | warning  | A template field of type `date` has no `[format:date]`, or a `list-of-date` field has no `[format:elements:date]`; the default date formats apply.                                                                                                                                                                                                                                           |
| `MTL017` | heading-pattern-duplicate       | error    | Two adjacent template headings of one level and scope have the same pattern (an exact-text heading counts as its literal pattern): `Heading '{text}': same pattern [pattern:"{pattern}"] as the previous heading '{prev}' (line {prevLine})`, or `Heading '{text}': matches the same headings as the previous heading '{prev}' (line {prevLine})` for an exact-text heading. Template error. |
| `MTL018` | heading-optional-min-conflict   | error    | A repeat heading is `[presence:optional]` and has an explicit `[repeat-rules:same-level:min:N]`: `Heading '{text}': tag {tag} contradicts [presence:optional] (a minimum of {min} requires the heading)`. Template error.                                                                                                                                                                    |
| `MTL019` | heading-child-order-conflict    | error    | A template heading lists a child after a deeper child: `Heading '{text}' (H{n}): comes after the deeper child '{prev}' (H{m}, line {prevLine}) under '{parent}'`. Template error.                                                                                                                                                                                                            |
| `MTL020` | directive-malformed             | warning  | A disable directive in a target has an unknown verb or no rule code.                                                                                                                                                                                                                                                                                                                         |
| `MTL021` | directive-unknown-code          | warning  | A disable directive names an item that is not a rule code.                                                                                                                                                                                                                                                                                                                                   |
| `MTL022` | directive-code-not-suppressible | warning  | A disable directive names a code that cannot be disabled.                                                                                                                                                                                                                                                                                                                                    |
| `MTL023` | directive-end-without-begin     | warning  | `end disable` closes a code that is not open.                                                                                                                                                                                                                                                                                                                                                |
| `MTL024` | directive-begin-unclosed        | warning  | `begin disable` is never closed; it runs to the end of the file.                                                                                                                                                                                                                                                                                                                             |
| `MTL025` | directive-already-disabled      | warning  | A code is disabled while it is already disabled.                                                                                                                                                                                                                                                                                                                                             |
| `MTL030` | heading-order-without-repeat    | error    | An `[order:...]` tag sits on a pattern heading without any `[repeat-rules:...]` tag: `Heading '{text}': tag {tag} needs [repeat-rules:same-level] (an order compares the repeats of one heading)`. Template error.                                                                                                                                                                           |

`MTL001` to `MTL004` on a target print `Parse error: <message>` and the file is not
checked further. On a template they make it "broken": `TEMPLATE ERROR: <template> -
<message>`, exit 1. The template warnings `MTL010` to `MTL016` are shown by `--verify` only
(`MTL014` in `Invalid patterns:`, `MTL015` in `Conflicting tags:`, `MTL016` in
`Date fields without format:`, all with line and column); they never change the exit code.
The four **template errors** `MTL017`, `MTL018`, `MTL019` and `MTL030` do not make the
template broken, but they act in both modes: a lint run prints each one as an error on the
template file, before its targets (the targets are still linted), and exits 1; `--verify`
marks the template as failed (sections `Duplicate patterns:`, `Optional headings with a
minimum:`, `Child headings out of level order:` and `Order tags without repeat:`) and exits 1.
No template diagnostic can be suppressed (a template carries no directives). `MTL020` to
`MTL025` are target warnings about disable directives, never suppressible; see
[Disabling rules in a file](#disabling-rules-in-a-file).

### filename (`MTL100`-`MTL199`)

| Tag                            | Where                                | Meaning                                                                                                                                |
| ------------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `[filename:case:<convention>]` | standalone comment line, frontmatter | The target file name stem must match. Conventions: `snake_case`, `kebab-case`, `camelCase`, `PascalCase`. Read from the template only. |
| `[value:filename]`             | inline comment                       | A scalar value must equal the file name stem.                                                                                          |

| Code     | Name           | Severity | When                                                            |
| -------- | -------------- | -------- | --------------------------------------------------------------- |
| `MTL101` | filename-case  | error    | The file name stem does not match `[filename:case:...]`.        |
| `MTL102` | value-filename | error    | The value differs from the file name stem (`[value:filename]`). |

### presence (`MTL200`-`MTL299`)

| Tag                             | Where          | Meaning                                                             |
| ------------------------------- | -------------- | ------------------------------------------------------------------- |
| `[presence:required]`           | inline comment | The value must be non-empty. Same as no presence tag.               |
| `[presence:optional]`           | inline comment | Absent or empty is fine; no other check runs on an empty value.     |
| `[presence:conditional:<text>]` | inline comment | Documentation only; behaves like optional. `<text>` runs up to `]`. |

Precedence: conditional, then optional, then required.

| Code     | Name             | Severity | When                                         |
| -------- | ---------------- | -------- | -------------------------------------------- |
| `MTL201` | required-missing | error    | A required field is missing or empty.        |
| `MTL202` | unknown-key      | warning  | A target key is not present in the template. |

### format (`MTL300`-`MTL399`)

| Tag                             | Applies to                    | Meaning                                                        |
| ------------------------------- | ----------------------------- | -------------------------------------------------------------- |
| `[format:constant:<value>]`     | any present field             | A scalar value must equal `<value>`.                           |
| `[format:snake_case]`           | scalar string                 | Must match snake case.                                         |
| `[format:kebab-case]`           | scalar string                 | Must match kebab case.                                         |
| `[format:elements:snake_case]`  | list                          | Every item must match snake case.                              |
| `[format:elements:kebab-case]`  | list                          | Every item must match kebab case.                              |
| `[format:scheme:<s1>,<s2>,...]` | `url`, items of `list-of-url` | Allow-list of URL schemes (comma separated, case-insensitive). |
| `[format:semver]`               | scalar string                 | Must be a semantic version (SemVer 2.0.0, no `v` prefix).      |
| `[format:date]`                 | scalar string                 | Must be a real `YYYY-MM-DD` date.                              |
| `[format:elements:semver]`      | list                          | Every item must be a semantic version.                         |
| `[format:elements:date]`        | list                          | Every item must be a real `YYYY-MM-DD` date.                   |

| Code     | Name                     | Severity | When                                                                               |
| -------- | ------------------------ | -------- | ---------------------------------------------------------------------------------- |
| `MTL301` | constant-mismatch        | error    | The value differs from `[format:constant:...]`.                                    |
| `MTL302` | case-mismatch            | error    | The value does not match `[format:snake_case]` or `[format:kebab-case]`.           |
| `MTL303` | elements-case-mismatch   | error    | A list item does not match `[format:elements:...]`.                                |
| `MTL304` | scheme-disallowed        | error    | A valid URL has a scheme outside `[format:scheme:...]`.                            |
| `MTL305` | scheme-disallowed-item   | error    | A list contains URLs with a disallowed scheme.                                     |
| `MTL306` | semver-mismatch          | error    | The value is not a semantic version (`[format:semver]`).                           |
| `MTL307` | date-format-mismatch     | error    | The value is not a `YYYY-MM-DD` date (`[format:date]`).                            |
| `MTL308` | elements-semver-mismatch | error    | A list contains items that are not semantic versions (`[format:elements:semver]`). |
| `MTL309` | elements-date-mismatch   | error    | A list contains items that are not `YYYY-MM-DD` dates (`[format:elements:date]`).  |

The shape tags run in a last field step, `shape`, after the type checks, so a type error prints
before a shape error. The tag checks the exact text of the value: values are not trimmed, so
`1.2.0` gives `MTL306`. Of `[format:semver]` and `[format:date]` on one field the first wins;
the two `elements:` shape tags are one kind too, and the shape tags and the case tags
(`[format:snake_case]`) are separate kinds that both run. A value of the wrong kind (a list for a
scalar tag, a scalar for an `elements:` tag) is skipped. One problem, one error: on a `date`
field `MTL307` stays silent when the type check already gave `MTL504`, and `MTL309` does not list
the items that `MTL513` (`list-of-date`) already reports. Without a format tag a `date` field keeps
the default date parsing, and `--verify` warns about it (`MTL016`). A bad argument
(`[format:dates]`) is `MTL012`; a shape tag on a heading is `MTL013`.

### bounds (`MTL400`-`MTL499`)

| Tag                              | Applies to        | Meaning                                                                                                         |
| -------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------- |
| `[count:min:N]`, `[count:max:N]` | list              | Bounds the length of a list. `N` is a non-negative integer.                                                     |
| `[range:min:N]`, `[range:max:N]` | any present field | Bounds a numeric value (each matching item of a list on its own). `N` is `-?digits` with an optional `.digits`. |
| `[order:ascending]`              | `list-of-date`    | Adjacent valid dates must be in non-decreasing order.                                                           |

`[count:...]` bounds a length, `[range:...]` bounds a number; they are not
interchangeable.

| Code     | Name            | Severity | When                                         |
| -------- | --------------- | -------- | -------------------------------------------- |
| `MTL401` | count-min       | error    | A list has fewer items than `[count:min:N]`. |
| `MTL402` | count-max       | error    | A list has more items than `[count:max:N]`.  |
| `MTL403` | range-min       | error    | A numeric value is below `[range:min:N]`.    |
| `MTL404` | range-max       | error    | A numeric value is above `[range:max:N]`.    |
| `MTL405` | range-min-item  | error    | List items are below `[range:min:N]`.        |
| `MTL406` | range-max-item  | error    | List items are above `[range:max:N]`.        |
| `MTL407` | order-ascending | error    | Dates are not in ascending order.            |

### type (`MTL500`-`MTL599`)

Type hints are not rules; they only choose the field type. Forms: a single-word
bracket such as `[date]` or `[list-of-int]`; the text `YYYY-MM-DD` or the word
`ISO` (date); the words `url`/`lien` (url) and `path` (path); an alias marker
`@<name>/` (path-alias); a field value equal to a type name; an option list
`a | b` (enum). Without a hint the type is inferred from the value. Colon tags
such as `[presence:...]` never act as type hints, and the text `type=<name>` in a
comment is plain text, not a hint.

| Code     | Name                    | Type                 | Valid when                                                                                                                                                                 |
| -------- | ----------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MTL501` | type-string             | `string`             | Not a list and not a mapping.                                                                                                                                              |
| `MTL502` | type-list               | `list`               | A YAML list.                                                                                                                                                               |
| `MTL503` | type-nested-map         | `nested-map`         | A mapping.                                                                                                                                                                 |
| `MTL504` | type-date               | `date`               | A real calendar date in `YYYY-MM-DD`, `YYYY-MM`, `YYYY` or `DD/MM/YYYY`, or `present`/`présent`.                                                                           |
| `MTL505` | type-url                | `url`                | Syntactically a URL (`scheme://host/...`).                                                                                                                                 |
| `MTL506` | type-path               | `path`               | Looks like a path.                                                                                                                                                         |
| `MTL507` | type-path-alias         | `path-alias`         | `@<name>/<rest>`.                                                                                                                                                          |
| `MTL508` | type-int                | `int`                | An integer.                                                                                                                                                                |
| `MTL509` | type-float              | `float`              | A decimal number (no exponent).                                                                                                                                            |
| `MTL510` | type-bool               | `bool`               | `true` or `false`, case-insensitive.                                                                                                                                       |
| `MTL511` | type-list-of-string     | `list-of-string`     | A list of scalars.                                                                                                                                                         |
| `MTL512` | type-list-of-int        | `list-of-int`        | A list of integers.                                                                                                                                                        |
| `MTL513` | type-list-of-date       | `list-of-date`       | A list of valid dates.                                                                                                                                                     |
| `MTL514` | type-list-of-path       | `list-of-path`       | A list of paths.                                                                                                                                                           |
| `MTL515` | type-list-of-url        | `list-of-url`        | A list of URLs.                                                                                                                                                            |
| `MTL516` | type-list-of-path-alias | `list-of-path-alias` | A list of path aliases.                                                                                                                                                    |
| `MTL517` | enum-option             | `enum`               | The value is one of the options of the template value split on the separator "space, pipe, space". Error when the field is required, warning when optional or conditional. |

All messages are `Field '<key>' (type=<type>): <detail>`.

### heading (`MTL600`-`MTL699`)

Tags go after the text of a heading of any level (H1 to H6). Headings inside fenced
code are ignored. Heading text comparison is exact and case-sensitive, and the level
must be the same: a template `## Context` is not satisfied by a target `# Context`.
A heading with no tag at all is required. See [ADR 0014](docs/adr/0014-legacy-behaviour-catalogue.md) for
the upgrade from H1/H2-only checking and to positional matching.

#### Positional matching

Template headings are matched **by position**, not by a search. Source of truth:
[docs/spec.md](docs/spec.md) sections 2.6 and 2.10.

- **Scope.** H1 and H2 template headings, and a deeper heading that has no template parent,
  have _file scope_: their candidates (the siblings) are all the target headings of that
  level in the file. A template heading of level 3 to 6 with a template parent (the nearest
  template heading above it with a lower level) has _section scope_: its siblings are the
  target headings of that level inside the section of the target heading that matches the
  parent. A missing, optional-and-absent or template-only parent means its children are not
  checked.
- **Sequence.** The template headings of one level and scope, in template order (without the
  `[presence:template-only]` ones), are the _positions_ of a sequence. They take the target
  siblings of that level and scope in order, as one adjacent run: each position takes zero
  or more siblings from the current point onward, never skips a sibling and never goes back
  (greedy first-fit, no backtracking). An exact-text heading takes the next sibling when
  its text is equal; a pattern heading takes it when the pattern matches; a repeat heading
  takes every following sibling that matches.
- **Swapped headings.** A pair in the wrong order is a missing heading, not an order error:
  `MTL601` says `Missing required heading: 'Alpha' (found later at line 7, out of order)`.
  The fix is to reorder the document or to mark the heading `[presence:optional]`.
- **Extras.** Target siblings left after the last position of a sequence are _extra_
  headings. They are allowed and never fail the file by themselves, but each run with extras
  gives ONE warning `MTL616` that lists them. An extra before or between template headings
  shifts the run and shows as a missing heading. `[content:subheadings:disallow]`
  (`MTL612`) and `[content:subheadings:no-extra]` (`MTL615`) turn extras into errors. A
  level and scope with no template heading has no run: its target headings are free detail,
  not extras.
- **Template-only.** A sibling with the text of a `[presence:template-only]` heading is
  `MTL603` and is set aside from the run.

| Tag                              | Meaning                                                                                                                                                                            |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[presence:required]`            | The sibling at the position must have this exact text. Same as no tag, at every level.                                                                                             |
| `[presence:optional]`            | The target may omit it: the position takes the next sibling only when it matches.                                                                                                  |
| `[presence:conditional:<text>]`  | Documentation only, never enforced. Matches like optional.                                                                                                                         |
| `[presence:template-only]`       | Guidance for the template author; the heading must not appear in a target.                                                                                                         |
| `[pattern:"<pattern>"]`          | The heading text is a pattern with placeholders (see below). The text before the tag is only a label.                                                                              |
| `[repeat-rules:same-level]`      | A pattern heading stands for a run of one or more consecutive matching headings. Also `:min:N` and `:max:N` (`N` is 1 or more).                                                    |
| `[order:...]`                    | Eight forms; order the repeats of a repeat heading (see below). Needs a repeat tag.                                                                                                |
| `[content:subheadings:disallow]` | No heading below the matched target heading may be one the template does not list (whole subtree), see `MTL612`.                                                                   |
| `[content:subheadings:no-extra]` | Every direct child of the matched target heading must be taken by a position of the template children, see `MTL615`.                                                               |
| `[unique-headings-names]`        | No two target headings in the section of the matched heading (each instance of a repeat heading) may share a name, see `MTL613` and [Unique heading names](#unique-heading-names). |

Precedence of the presence tags: conditional, template-only, optional, then required.

#### Heading patterns

`## Release [pattern:"[{semver}] - {date}"]` matches target headings such as
`## [1.2.0] - 2026-03-01`. The text written before the tag (`Release`) is only a label: it names
the heading in `--verify` and in messages and is never compared (it may be empty). The pattern
matches the WHOLE stored heading text; nothing is trimmed. Literal text is case-sensitive; tag
keywords, placeholder names and format names are not (`{SemVer}` is `{semver}`). No `v` prefix is
implied: write `v{semver}` for `v1.2.0`.

- **Placeholders.** `{name}`, `{name:format:<fmt>}` or `{name:format:<fmt>:<arg>}`. `{{` is a
  literal `{` and `}}` a literal `}` (`{{semver}}` is the text `{semver}`). Two placeholders with
  no literal text between them (`{digits}{text}`) are refused (`MTL014`). There is no
  regular-expression placeholder.
- **Escapes.** Inside the quotes, `\"` is a literal `"` and `\\` a literal `\`. Any other
  backslash pair (`\n`, `\{`) is an invalid escape (`MTL014`).
- **Format arguments.** Two formats take an argument and need it: `padding:N` of `{digits}` and
  `precision:N` of `{number}`. `N` is ASCII digits, 1 or more, no leading zero
  (`{digits:format:padding:3}`). Every other format takes none.

| Placeholder | Default format                                   | Other formats                                                                 |
| ----------- | ------------------------------------------------ | ----------------------------------------------------------------------------- |
| `{text}`    | `human`: any text except a purely numeric one    | `snakecase`, `camelcase`, `screamcase`, `kebabcase`, `lowercase`, `uppercase` |
| `{number}`  | `decimal`: `-1.5`, `007` (leading zeros allowed) | `scientific`, `precision:N`                                                   |
| `{digits}`  | digits only, no sign, no leading zero            | `signed`, `hex`, `uid`, `padding:N`                                           |
| `{semver}`  | `full`: SemVer 2.0.0, no `v` prefix              | `core`, `major-minor`                                                         |
| `{date}`    | `full`: a real `YYYY-MM-DD` date                 | `year-month`, `year`                                                          |
| `{char}`    | exactly one Unicode letter (`A`, `É`, `ж`)       | none                                                                          |

- `{digits}` is the former `{int}` (renamed; `{int}` is now an unknown placeholder, `MTL014`). It
  accepts `0`, `7`, `2026` and refuses `07` and `-1`. `signed` adds an optional `+` or `-`; `hex`
  is hexadecimal digits of either case; `uid` is letters and digits with at least one of each
  (`U42`); `padding:3` is exactly three digits (`007`).
- `{text}` refuses a PURELY NUMERIC text (`2026`, `1.5`, `007`); a numbered heading needs
  `{digits}`, `{number}` or `{date:format:year}`. `1.2.0` is not purely numeric, so it is a
  `{text}` value. The `{text}` case formats accept every Unicode letter, need at least one
  letter and never accept digits only (`2026` is no `snakecase` value).
- `{number}`: `scientific` adds an exponent (`1.5E-3`); `precision:2` is exactly two decimals
  (`1.50`).
- `{char}` covers one-letter ids: `Epic {char} - {text}`.

An invalid pattern (unknown placeholder or format, bad argument, unmatched brace, adjacent
placeholders, invalid escape, empty pattern) is the template warning `MTL014`, shown by
`--verify`. The heading is then not checked and is not a position. A required pattern heading
with no sibling left is `MTL605`; a sibling that does not match it is `MTL606`, which names the
failing piece (`heading '[Unreleased]' does not match [pattern:"[{semver}] - {date}"] at
{semver}`). Pattern and repeat tags on a `[presence:template-only]` heading, or repeat and order
tags on a heading without pattern, have no effect (`MTL015`).

`[pattern:"{text}"]` is the "any heading here" form.

#### Repeat rules

`[repeat-rules:same-level]` makes a pattern heading take every consecutive sibling that matches
(the _instances_). `[repeat-rules:same-level:min:N]` and `[repeat-rules:same-level:max:N]` bound
the number of instances; `N` is 1 or more. The default minimum is 1 for a required heading and 0
for an optional or conditional one; there is no default maximum, and the `max` bound never stops
the run. Each instance is checked for the content tags, the sub-heading tags and its own children.

- Too few instances: `MTL607` (also at zero, then it replaces `MTL605`). Too many: `MTL608`.
- A heading with the right shape after the run ended (a stray heading broke the run) is
  `MTL614`. A tail heading that matches no pattern is an allowed extra (`MTL616`).
- `[presence:optional]` with an explicit `min` contradicts itself: `MTL018`, a template error.

Example, a changelog:

```markdown
## Unreleased [presence:optional]

## Release [pattern:"[{semver}] - {date}"] [repeat-rules:same-level] [order:first:semver:descending]

### Added [presence:optional] [content:list]
```

#### Order

An order tag compares the instances of ONE repeat heading, so it needs a pattern and a repeat tag
(without the repeat tag it is the template error `MTL030`). The eight forms:

| Form                                                                | Order key of an instance                                          |
| ------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `[order:ascending]`, `[order:descending]`                           | The whole heading text, as strings (UTF-16 order, case-sensitive) |
| `[order:first:number:ascending]`, `[order:first:number:descending]` | The first number in the text, compared numerically                |
| `[order:first:date:ascending]`, `[order:first:date:descending]`     | The first ISO date in the text, compared chronologically          |
| `[order:first:semver:ascending]`, `[order:first:semver:descending]` | The first SemVer in the text, by SemVer 2.0.0 precedence          |

Equal keys pass. ONE `MTL609` per repeat set reports the first adjacent pair out of order and
counts the pairs. For the `first:` forms, an instance with no such value in its text is `MTL617`
(one per set); use a pattern that requires it (`{number}`, `{date}`, `{semver}`). String order
puts `Step 10` below `Step 9` and `1.10.0` below `1.9.0`; use `first:number` or `first:semver`
for those. On a frontmatter key line `[order:ascending]` keeps its other meaning (dates of a
`list-of-date`, `MTL407`); `[order:descending]` and the `first:` forms there are misplaced
(`MTL013`).

Example, one heading per epic, in letter order:

```markdown
## Epic A - Title [pattern:"Epic {char} - {text}"] [repeat-rules:same-level] [order:ascending]
```

#### Sub-heading tags

| Tag                              | Region                                     | A heading passes when                                             | Code     |
| -------------------------------- | ------------------------------------------ | ----------------------------------------------------------------- | -------- |
| `[content:subheadings:disallow]` | the whole subtree of the matched heading   | some template heading below lists its level and text (or pattern) | `MTL612` |
| `[content:subheadings:no-extra]` | the direct children of the matched heading | a position of the template children took it                       | `MTL615` |

`disallow` reports the topmost unlisted heading of each stray block. `no-extra` reports each direct
child that no position took, a second `### Added` included. Both may sit on one heading. Neither
has an effect on a `[presence:template-only]` heading (`MTL015`). A bare `[content:subheadings]`
or `no-extras` is malformed (`MTL012`).

#### Unique heading names

`[unique-headings-names]` is opt-in, in two places (no argument; `[unique-headings-names:x]` is
malformed, `MTL012`):

- **Template-wide.** A standalone frontmatter comment line holding only the tag, like the
  filename comment: `# [unique-headings-names]`. Scope: every target heading of the file.
- **Per heading.** A heading suffix tag, `## Usage [unique-headings-names]`. Scope: the matched
  target heading and every heading inside its section, per instance for a repeat heading. No
  effect on a `[presence:template-only]` heading (`MTL015`) or when the heading has no match.

Two headings of one scope are duplicates when their texts are equal after lowercasing
(`toLowerCase()`), at any level: `## Notes` and `### NOTES` clash, `Straße` and `STRASSE` do not.
The first heading of a name passes; each later one is the error `MTL613`, anchored on its own
line: `duplicate heading name 'NOTES' (first at line 13)`. The tag only adds findings: a
duplicate extra keeps its `MTL616` warning, and `MTL612` or `MTL615` may fire on it too. For a
changelog whose groups repeat under every release, put the tag on the repeat heading, not in the
frontmatter:

```markdown
## Release [pattern:"[{semver}] - {date}"] [repeat-rules:same-level] [unique-headings-names]
```

`--verify` prints the per-heading token `unique-headings-names` last in the heading's rules, and
the template-wide switch as the line `Unique heading names: [unique-headings-names]` right after
`Filename:` (JSON: `uniqueHeadingNames`, after `filenameCase`).

#### The `exist` tag is removed

`[presence:exist]` (a heading at the same level, any text) no longer exists. It is now a
malformed tag (`MTL012` in `--verify`): the bracket stays in the heading text, the heading is an
ordinary required exact-text heading, and a lint run reports it missing (for example
`Missing required heading: 'Context [presence:exist]'`). `MTL602` is retired and reserved. Write a
plain heading when the text is fixed, or `[pattern:"{text}"]` for any text; the migration steps,
with a before/after table, are in [ADR 0014](docs/adr/0014-legacy-behaviour-catalogue.md).

| Before                         | After                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------ |
| `# ADR [presence:exist]`       | `# ADR - Title [pattern:"ADR - {text}"]`, or `# Title [pattern:"{text}"]` for any H1 |
| `### Version [presence:exist]` | `### 0.0.0 [pattern:"{semver}"]`                                                     |

| Code     | Name                              | Severity | When                                                                                                                                                                                                                |
| -------- | --------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MTL601` | heading-missing                   | error    | A required file-scope heading has no match at its position: `Missing required heading: '{text}'`, with the hint `(found later at line {line}, out of order)` when a sibling with that text comes later.             |
| `MTL602` | heading-level-missing             | —        | Retired: it was the check of the removed `exist` tag. Reserved, never reused.                                                                                                                                       |
| `MTL603` | heading-template-only             | error    | A `[presence:template-only]` heading appears in the target.                                                                                                                                                         |
| `MTL604` | heading-order                     | error    | Template headings appear in a different relative order.                                                                                                                                                             |
| `MTL605` | heading-pattern-missing           | error    | A required pattern heading has no sibling left at its position: `missing required heading matching [pattern:"{pattern}"] (H{n})`.                                                                                   |
| `MTL606` | heading-pattern-mismatch          | error    | A required pattern heading took a sibling that does not match: `heading '{text}' does not match [pattern:"{pattern}"] at {piece}`.                                                                                  |
| `MTL607` | heading-repeat-min                | error    | A repeat heading has fewer instances than its `min`: `{count} heading(s) match [pattern:"{pattern}"], minimum is {min}`.                                                                                            |
| `MTL608` | heading-repeat-max                | error    | A repeat heading has more instances than its `max`: `{count} heading(s) match [pattern:"{pattern}"], maximum is {max}`.                                                                                             |
| `MTL609` | heading-pattern-order             | error    | Repeat instances are out of order: `heading '{text}' is not in {direction} order after '{prev}', {count} pair(s) out of order {tag}`.                                                                               |
| `MTL610` | heading-missing-in-section        | error    | A required H3 to H6 heading is missing in the section of its parent: `Section '{parent}': missing required heading '{text}' (H{n})`.                                                                                |
| `MTL611` | heading-order-in-section          | error    | The headings of one parent appear in a different order inside its section.                                                                                                                                          |
| `MTL612` | heading-unlisted                  | error    | A heading the template does not list sits under a `[content:subheadings:disallow]` heading.                                                                                                                         |
| `MTL613` | heading-unique-names              | error    | A later heading repeats a name of its `[unique-headings-names]` scope (case-insensitive, any level): `duplicate heading name '{text}' (first at line {line})`. Emitted after the other heading findings.            |
| `MTL614` | heading-repeat-miss               | error    | Headings that match a repeat pattern come after the end of its run: `{count} heading(s) match [pattern:"{pattern}"] after the end of its run [repeat-rules:same-level]: {pylist}`.                                  |
| `MTL615` | heading-subheadings-only-declared | error    | A direct child sits under a `[content:subheadings:no-extra]` heading and no position took it: `Section '{parent}': heading '{text}' at level H{n} is not declared at this position [content:subheadings:no-extra]`. |
| `MTL616` | heading-extra                     | warning  | Extra headings after the last template heading of a run: `{count} extra heading(s) at level H{n} after the template headings: {pylist}`. One per run.                                                               |
| `MTL617` | heading-order-key-missing         | error    | Instances have no number, date or SemVer to order by: `{count} heading(s) have no {kind} to order by {tag}, use a [pattern:...] with {placeholder}: {pylist}`.                                                      |

`MTL605` to `MTL609`, `MTL614` and `MTL617` are about one pattern heading; in section scope their
message starts with `Section '{parent}': `. The retired `MTL602` is never reused.

### content (`MTL700`-`MTL799`)

Section body rules on a heading. Skipped when the template heading has no match at its
position (it is reported once, by `MTL601`, `MTL605`, `MTL606`, `MTL607` or `MTL610`). The
section checked is the heading the position took; a repeat heading checks each instance. The
message label of a pattern heading gains the pattern:
`Section 'Epic B - Release' (pattern "Epic {char} - {text}")`.

| Tag                     | Meaning                                               | Code     | Name              |
| ----------------------- | ----------------------------------------------------- | -------- | ----------------- |
| `[content:non-empty]`   | The section body must not be blank.                   | `MTL701` | content-non-empty |
| `[content:table]`       | Some line is a Markdown table row.                    | `MTL702` | content-table     |
| `[content:list]`        | Some line is a list item (`-`, `*`, `+`, `N.`, `N)`). | `MTL703` | content-list      |
| `[content:min-lines:N]` | At least `N` non-blank lines.                         | `MTL704` | content-min-lines |
| `[content:max-lines:N]` | At most `N` non-blank lines.                          | `MTL705` | content-max-lines |

All five are errors. With several `min-lines` (or `max-lines`) tags on one heading,
the leftmost one is used.

### io (`MTL800`-`MTL899`)

`[io:exists]` is an opt-in existence or reachability check on `path`,
`list-of-path`, `url` and `list-of-url` fields (per item). It is the only tag that
touches the file system or the network. Every finding is a warning.

| Code     | Name               | Severity | When                                                                        |
| -------- | ------------------ | -------- | --------------------------------------------------------------------------- |
| `MTL801` | alias-unapproved   | warning  | An `@name/...` value has no entry in the config `aliases`; not checked.     |
| `MTL802` | alias-path-missing | warning  | The aliased path does not exist.                                            |
| `MTL803` | absolute-skipped   | warning  | An absolute path outside the config `approvedPaths`; not checked.           |
| `MTL804` | path-missing       | warning  | A path does not exist. Relative paths resolve against the root of the pair. |
| `MTL805` | url-unreachable    | warning  | The URL did not answer 2xx/3xx (HEAD, then GET), with a short reason.       |

URL probes are hardened: only `http` and `https`, no redirects followed, loopback,
link-local and metadata addresses always refused, private ranges refused unless
`allowPrivateNetworks: true`, 5 second timeout, one probe per URL, at most 100
different URLs per run. See [docs/spec.md](docs/spec.md) section 2.8.

### Run diagnostics (`MTL900`-`MTL999`)

Not rules (no rule file): they describe a problem with the run itself. All are
errors (exit 2) except `MTL913`, whose severity comes from `onEmpty`.

| Code     | Name                 | Meaning                                                  |
| -------- | -------------------- | -------------------------------------------------------- |
| `MTL901` | config-not-found     | The config file was not found.                           |
| `MTL902` | config-yaml-invalid  | The config cannot be parsed.                             |
| `MTL903` | config-unknown-key   | Unknown key in the config.                               |
| `MTL904` | config-invalid-value | Wrong type, bad enum value or missing required key.      |
| `MTL905` | config-invalid-name  | Invalid, reserved or duplicate name.                     |
| `MTL906` | config-unknown-root  | A pair names a root that is not declared.                |
| `MTL907` | config-invalid-glob  | Invalid glob.                                            |
| `MTL908` | config-bad-version   | Unsupported `version`.                                   |
| `MTL909` | root-not-found       | A root directory does not exist.                         |
| `MTL910` | template-not-found   | A template path does not exist.                          |
| `MTL911` | template-not-a-file  | A template path is not a regular file.                   |
| `MTL912` | target-not-found     | A file argument that matches a pair does not exist.      |
| `MTL913` | empty-target-set     | A pair matched no file (severity from `onEmpty`).        |
| `MTL920` | unknown-option       | Unknown command line option.                             |
| `MTL921` | option-missing-arg   | An option value is missing.                              |
| `MTL922` | option-bad-value     | Invalid `--format` value.                                |
| `MTL923` | usage-conflict       | `--verify` without a config and without a template path. |

## Disabling rules in a file

A target file can silence rule codes locally with a comment. This is the only way a
target changes which diagnostics are reported. Source of truth:
[docs/spec.md](docs/spec.md) section 4.4 (DIR1 to DIR10); the examples below are its
worked examples.

A directive is the content of one comment. It starts with the keyword
`md-template-lint`, then a verb, then one or more rule codes, then an optional reason:

```text
md-template-lint <verb> <code>[, <code> ...] [-- reason]
```

| Directive                   | Covers (file lines, inclusive)                                                                 |
| --------------------------- | ---------------------------------------------------------------------------------------------- |
| `disable <codes>`           | from its own line to the line of a matching `end disable`, else to the end of the file         |
| `disable-line <codes>`      | its own line only                                                                              |
| `disable-next-line <codes>` | the next file line only (line + 1, even when that line is blank)                               |
| `disable-file <codes>`      | the whole target document, wherever it stands: every line, and every diagnostic without anchor |
| `begin disable <codes>`     | from its own line to the line of the matching `end disable` (block)                            |
| `end disable <codes>`       | closes the open range (`disable` or `begin disable`) of each listed code, on its own line      |

`disable` and `begin disable` open the same kind of range. The only difference: an
unclosed `begin disable` is a mistake (`MTL024`, the range still runs to the end of the
file), an unclosed `disable` is the normal, intended use.

Syntax rules (DIR2):

- The comment content must start with the keyword followed by a space, a tab or the end
  of the content; otherwise it is plain prose, silently (`<!-- see md-template-lint docs -->`
  is not a directive).
- Keyword, verbs and codes are case-insensitive (`MD-Template-Lint Disable mtl202` is
  valid); codes are normalized to upper case.
- Codes are separated by commas, spaces or tabs, in any mix: `MTL201, MTL202`,
  `MTL201,MTL202` and `MTL201 MTL202` are equal. Empty items are ignored; a code listed
  twice counts once.
- A word that is exactly `--` ends the code list; the rest is a free-text reason that is
  ignored: `<!-- md-template-lint disable-line MTL202 -- kept for import -->`.
- There is no wildcard and no "disable everything". A directive without a code is
  `MTL020`.
- A code that never fires in the file is fine: there is no "unused directive" warning.

### Where directives are read

Only in a target file (DIR3), in two carriers:

- **Body** (after the frontmatter): an HTML comment `<!-- ... -->` that opens and closes
  on the same line. It may stand anywhere on the line, also after text or on a heading
  line (`## Overview <!-- md-template-lint disable-line MTL701 -->`; the heading still
  matches). Several directive comments on one line are read left to right. A multi-line
  HTML comment is never a directive.
- **Frontmatter**: a YAML comment, the text after the `#`. Two places only: the trailing
  comment of a top-level key line, and a whole-line comment with the `#` in column 1
  that the YAML document treats as a comment (a line inside a multi-line quoted or flow
  value is not a carrier). Comments on indented sub-keys and list items are not read,
  and an HTML comment in the frontmatter is YAML text, not a directive.

Not read (DIR4):

- in a template, body or frontmatter: a template is the schema and is never suppressed
  (the comment is inert prose, no warning, not shown by `--verify`);
- inside a fenced code block;
- inside an inline code span (a `<!--` between two equal backtick runs on the same line);
- in a target that fails to parse (`MTL001` to `MTL004`): the file is not linted.

Known limitation: indented code blocks (four spaces) are not detected. A directive
comment stays part of the section body text, so a directive line counts as a non-blank
line for `MTL701`, `MTL704` and `MTL705`; put a directive about a section on its heading
line to keep the body unchanged.

### Which codes can be disabled

Only the file diagnostics of a parsed target: `MTL101` to `MTL899` (filename, presence,
format, bounds, type, heading, content and io rules). A known code outside that range
gives `MTL022` (DIR6). An item that is not a known code (`MTL050`, `201`, `MTL2O1`)
gives `MTL021` (DIR2). The codes that give `MTL022`:

- `MTL001` to `MTL004`: a file that does not parse is not linted;
- `MTL010` to `MTL019` and `MTL030`: template tag diagnostics (warnings, and the template
  errors `MTL017`, `MTL018`, `MTL019` and `MTL030`);
- `MTL020` to `MTL025`: directive warnings, a directive cannot silence its own warnings;
- `MTL900` to `MTL999`: run diagnostics (config, CLI, missing inputs).

### Anchor lines and `disable-file`

A line directive or a range covers a diagnostic by its anchor line, matched by code only
(DIR5, DIR7):

| Codes                                                                                | Anchor                                                                                                  |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `MTL202`                                                                             | the target key line                                                                                     |
| `MTL201`                                                                             | the key line when the key is present with an empty value; none when the key is missing                  |
| `MTL102`, `MTL301`-`MTL309`, `MTL401`-`MTL407`, `MTL501`-`MTL517`, `MTL801`-`MTL805` | the target key line of that field                                                                       |
| `MTL603`                                                                             | the line of the first target heading in scope with that level and text                                  |
| `MTL606`, `MTL609`                                                                   | the line of the reported target heading (for `MTL609` the later heading of the first pair out of order) |
| `MTL607`                                                                             | the line of the first instance; none when there is no instance                                          |
| `MTL608`                                                                             | the line of the instance number `max + 1`                                                               |
| `MTL610`, `MTL611`                                                                   | the line of the target parent heading                                                                   |
| `MTL612`, `MTL615`                                                                   | the line of the unlisted (or undeclared) target heading that is reported                                |
| `MTL613`                                                                             | the line of the later duplicate heading that is reported                                                |
| `MTL614`, `MTL616`, `MTL617`                                                         | the line of the first heading the finding lists (a directive on another listed line removes nothing)    |
| `MTL701`-`MTL705`                                                                    | the line of the target heading whose section was checked                                                |
| `MTL101`, `MTL201` (missing key), `MTL601`, `MTL604`, `MTL605`                       | none                                                                                                    |

A diagnostic without anchor (the file name, a missing key, a missing heading, the heading
order) is covered only by `disable-file`. `disable`, `begin disable`, `disable-line`
and `disable-next-line` never cover it, even when their range runs to the end of the file.
`disable-file MTL601` silences every missing heading of the file, not one named
heading. `disable-file` covers the whole document wherever it stands (before or after
the finding, in the body or in the frontmatter), opens no range, and is not closed by
`end disable`. A body `disable MTL202` does not cover the frontmatter keys (they come
before its range); use `disable-file MTL202` or a frontmatter directive.

### Examples

The examples use this template: fields `title` and `status` are required; the headings
are `# Notes`, `## Overview [content:non-empty]`, `## Details [content:non-empty]` and
`## Context`.

`disable-line` and `disable-next-line`, in the frontmatter and on a heading (spec
example 1):

```markdown
---
title: Notes
status: draft
owner: alice # md-template-lint disable-line MTL202
# md-template-lint disable-next-line MTL202, MTL301
reviewer: bob
draft: yes
---

# Notes

## Overview <!-- md-template-lint disable-line MTL701 -->

## Details

## Context
```

- Line 4 `owner`: `MTL202` is covered by its `disable-line`. Suppressed.
- Line 6 `reviewer`: `MTL202` is covered by the `disable-next-line` of line 5 (`MTL301`
  never fires here, which is fine). Suppressed.
- Line 7 `draft`: `MTL202`, no directive. Reported.
- Line 12 `## Overview`: `MTL701` is covered. Suppressed.
- Line 14 `## Details`: `MTL701`, no directive. Reported.
- Summary: `Suppressed:   3`.
- A `# md-template-lint disable-line MTL202` alone on line 5 covers line 5 only, so
  `reviewer` would be reported.

`begin disable` and `end disable`, a block over several keys with a multi-code list (spec
example 2, frontmatter only, the body is the one above):

```markdown
---
title: Notes
status: draft
# md-template-lint begin disable MTL202, MTL301
legacy_id: 42
legacy_owner: alice
# md-template-lint end disable MTL202 MTL301
extra: x
---
```

- The range for `MTL202` and `MTL301` covers lines 4 to 7. `legacy_id` (line 5) and
  `legacy_owner` (line 6): `MTL202` suppressed.
- `extra` (line 8) is after the block: `MTL202` reported.
- Without line 7, both ranges run to the end of the file: `extra` is suppressed too, and
  two `MTL024` warnings are printed, `Directive on line 4: 'begin disable MTL202' is never
closed, it runs to the end of the file` and the same for `MTL301`.

`disable`, the open form: the same file with `# md-template-lint disable MTL202` instead
of the `begin disable` line and no `end disable` line suppresses `MTL202` from that line
to the end of the file, with no warning (DIR1, DIR8).

`disable-file`, for diagnostics without anchor (spec example 3, file
`notes/draft.md`):

```markdown
---
title: Draft
---

<!-- md-template-lint disable-file MTL201, MTL601 -- filled in later -->

# Notes

## Overview

Text.
```

- `status` is missing: `MTL201` without anchor, covered by the `disable-file` of
  line 5. Suppressed.
- `## Details` and `## Context` are missing: two `MTL601` without anchor, also covered.
  Suppressed.
- Expected text output: the file passes, its block is `✓ notes/draft.md` with no
  diagnostic line, and the summary shows `Suppressed:   3`.
- The same result with the directive in the frontmatter, for example
  `# md-template-lint disable-file MTL201, MTL601` as line 2, or at the end of the
  file: the position does not matter.
- Replace `disable-file` by `disable`: the range runs to the end of the file, but a
  range never covers a diagnostic without anchor, so all three are reported and there is
  no `Suppressed:` line:

```text
  ✗ notes/draft.md
      error MTL201 Field 'status': required but empty or missing
      error MTL601 Heading: Missing required heading: 'Details'
      error MTL601 Heading: Missing required heading: 'Context'
```

- With `disable-file MTL201` only, the two `MTL601` are reported, the file fails and
  the summary shows `Suppressed:   1`.

### Directive warnings

The directive warnings are warnings of the `syntax` category. Each carries the `line` and
`column` of the directive and names the line in its message. They are normal file
warnings: printed, counted in `Warnings:`, hidden by `--quiet`, never suppressed, and they
never change the exit code (DIR9).

| Code     | Name                            | When                                                                                                                       |
| -------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `MTL020` | directive-malformed             | Unknown verb or a keyword alone, or a verb with no rule code. The whole directive is inert.                                |
| `MTL021` | directive-unknown-code          | An item is not a rule code (`MTL2O1`, `201`, `MTL050`). The item is dropped; the other codes of the directive still apply. |
| `MTL022` | directive-code-not-suppressible | A known code that cannot be disabled (see above). The item is dropped.                                                     |
| `MTL023` | directive-end-without-begin     | `end disable <code>` while no `disable` or `begin disable` is open for that code. No effect.                               |
| `MTL024` | directive-begin-unclosed        | `begin disable <code>` is never closed; the range runs to the end of the file. One warning per open code, emitted last.    |
| `MTL025` | directive-already-disabled      | `disable` or `begin disable <code>` while that code is already disabled. No effect; the first range keeps its start.       |

When every item of a directive is dropped (all `MTL021` or `MTL022`), there is no extra
`MTL020`, and the directive is inert. `disable-file` never takes part in `MTL023`,
`MTL024` or `MTL025`. Ranges are tracked per code, in source order.

Ignored places and directive warnings (spec example 5):

````markdown
---
title: Notes
status: draft
---

```markdown
<!-- md-template-lint disable MTL601 -->
```

Inline code is prose: `<!-- md-template-lint disable MTL601 -->`.

<!-- md-template-lint disabel MTL601 -->
<!-- md-template-lint disable MTL2O1, MTL910 -->
<!-- md-template-lint end disable MTL202 -->
<!-- md-template-lint begin disable -->
````

- Lines 7 and 10 are inside a fence and inside a code span: not directives, no warning.
- Line 12: `MTL020` `Directive on line 12: unknown directive 'disabel' (expected disable,
disable-line, disable-next-line, disable-file, begin disable or end disable)`.
- Line 13: `MTL021` `Directive on line 13: unknown rule code 'MTL2O1'` (letter O) and
  `MTL022` `Directive on line 13: rule code MTL910 cannot be disabled`. Both items are
  dropped, so the directive is inert and there is no extra `MTL020`.
- Line 14: `MTL023` `Directive on line 14: 'end disable MTL202' has no open 'disable' or
'begin disable' for MTL202`.
- Line 15: `MTL020` `Directive on line 15: 'begin disable' needs at least one rule code`.
- The missing headings still give `MTL601`: no `disable-file MTL601` is read, and the
  `disable MTL601` lines would not cover them even if read.

### Counts and exit code

A suppressed diagnostic is removed before anything counts it (DIR9):

- It is not printed (text, `--quiet`, JSON), not counted in `Warnings:`,
  `summary.warnings` or `filesWithWarnings`, and it does not make a file fail. A file
  whose only errors are suppressed is `✓` (JSON status `pass`); the exit code follows the
  rest.
- The text summary prints `Suppressed:   N` after `Warnings:`, only when `N` is greater
  than 0. The JSON `summary.suppressed` is always present, `0` when none, between
  `filesWithWarnings` and `templatesChecked`. Both count per pair-file lint (a file in two
  pairs is linted, and counted, twice; its directive warnings appear in both blocks).
- `--quiet` prints no summary, so no `Suppressed:` line. `--verify` reads no target, so
  no directive: as far as directives go, its output is unchanged apart from
  `summary.suppressed` being `0`. (Separately, `--verify` shows the template line under each
  tag warning in text and `sourceLine` in JSON, see
  [Source line under a diagnostic](#source-line-under-a-diagnostic).)
- Presence, value and content tags still run in full; suppression only filters their
  output. A `disable-file MTL601` hides a missing heading but does not make it
  present, so `MTL604` still sees it as absent.

## Configuration reference

One `md-template-lint.yml` per project. It is YAML, validated strictly: an unknown
key is an error (`MTL903`), and all config errors are reported together before any
linting (exit 2).

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

allowPrivateNetworks: false # optional, default false

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

| Key                    | Type                      | Required | Default   | Notes                                                                                                                                                      |
| ---------------------- | ------------------------- | -------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `version`              | integer                   | no       | `1`       | Must be `1`, else `MTL908`.                                                                                                                                |
| `onEmpty`              | `warn`, `error`, `ignore` | no       | `warn`    | Policy when a pair matches no file (full run only), see below.                                                                                             |
| `roots`                | map name to path          | no       | empty     | Names match `^[A-Za-z0-9_-]+$`; `project` is reserved. Declaration order fixes the output order.                                                           |
| `aliases`              | map name to path          | no       | empty     | The name is written without `@`. Used by `@name/...` values with `[io:exists]`.                                                                            |
| `approvedPaths`        | list of path              | no       | empty     | An absolute value in a document is probed only inside one of these folders.                                                                                |
| `allowPrivateNetworks` | boolean                   | no       | `false`   | Lets `[io:exists]` URL probes reach RFC 1918, 100.64.0.0/10 and fc00::/7. Loopback, link-local, cloud metadata and IPv4-mapped IPv6 stay blocked.          |
| `pairs`                | list of pair              | yes      | none      | Non-empty list.                                                                                                                                            |
| `pairs[].name`         | string                    | no       | generated | Explicit names match `^[A-Za-z0-9_.-]+$` and are unique. Generated: file name of the template without the last extension, made unique with `-2`, `-3`, ... |
| `pairs[].template`     | path                      | yes      | none      | A relative path is relative to `templateRoot`.                                                                                                             |
| `pairs[].templateRoot` | root name                 | no       | `project` | `project` or a declared root.                                                                                                                              |
| `pairs[].roots`        | root name, list or `"*"`  | no       | `project` | Each name is `project` or declared. `"*"` means every root declared under `roots` (not `project`). The pair runs once per listed root.                     |
| `pairs[].include`      | glob or list of globs     | yes      | none      | Non-empty. A file is a target when it matches an include and no exclude.                                                                                   |
| `pairs[].exclude`      | glob or list of globs     | no       | empty     | Same glob rules.                                                                                                                                           |
| `pairs[].description`  | string                    | no       | none      | Shown in the `Target:` line.                                                                                                                               |
| `pairs[].onEmpty`      | `warn`, `error`, `ignore` | no       | global    | Overrides the global value for this pair.                                                                                                                  |

### Discovery

`--config <path>` uses that file (missing: `MTL901`). Otherwise the tool looks for
`md-template-lint.yml` in the working directory, then in each parent up to the file
system root; the first match wins. The folder that holds the file is the implicit
root `project`. `--verify` with explicit template paths needs no config.

### Path values

`roots`, `aliases`, `approvedPaths` and `template` follow one resolver: `~` and `~/...`
expand to the home directory; a drive letter followed by `/` or `\`, or a leading `/`
or `\`, is absolute; anything else is relative to the config directory (a pair
`template` is relative to its `templateRoot`). `\` is read as `/`. A path need not
exist when the config is validated. A missing root is `MTL909`, a missing template
`MTL910`, a template that is not a regular file `MTL911`; these skip only the
affected pair or root, the others still run, and the exit code is 2.

The config file is trusted. On Windows a UNC path (`\\server\share`) in any path value
makes the operating system contact that server, so use one only for a server you trust.

### Globs

Matched against the path relative to the root, with `/` separators, case-sensitive on
every OS. `*` any characters except `/`; `?` one character except `/`; `**` as a whole
segment matches zero or more segments (`a/**/*.md` matches `a/x.md`); `[abc]` a class;
`{a,b}` alternation. Dot files and folders are matched like any other. Invalid globs
(`MTL907`): empty, absolute, containing `..`, starting with `!` (use `exclude`),
unbalanced `[`, `{` or `}`, a reversed class range. Symlinked directories are not
traversed.

### `onEmpty`

A pair/root combination that matches no file (full run only) raises `MTL913`:

| `onEmpty` | Text output                           | Exit |
| --------- | ------------------------------------- | ---- |
| `warn`    | stdout line `ℹ MTL913 <message>`      | 0    |
| `error`   | stderr line `error MTL913: <message>` | 2    |
| `ignore`  | nothing                               | 0    |

A run that lints zero files, with no broken template and no run error, prints
`No files linted.` and never `All files passed!`.

### Multi-root and external roots

A root is a folder where pairs run. `roots` declares extra ones (a sibling repository,
a data folder); `pairs[].roots` makes one pair run on several of them. Templates can
stay in one place with `templateRoot`:

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
```

External root, template kept in the project:

```yaml
roots:
  data: ~/data/prompts
pairs:
  - template: templates/prompt.template.md
    roots: data
    include: _prompts/*.md
```

`roots: "*"` also covers a root that only holds templates, so list the target roots by
name in that case.

## lint-staged setup

The CLI accepts the file list that [lint-staged](https://github.com/lint-staged/lint-staged)
appends. A staged file that matches no pair is skipped silently, so the glob can be
`*.md`. Put `.lintstagedrc.json` at the project root:

```json
{
  "*.md": "md-template-lint --quiet"
}
```

The same configuration inside `package.json`:

```json
{
  "lint-staged": {
    "*.md": "md-template-lint --quiet"
  }
}
```

`--quiet` prints only failing files, broken templates and run errors, and nothing
when clean. Exit 1 or 2 makes lint-staged abort the commit. lint-staged splits a very
long file list into several calls; each call is an independent run.

### This repository lints its own docs

The root [`md-template-lint.yml`](md-template-lint.yml) lints the ADRs, `docs/architecture.md` and
`AGENTS.md` against the matching files in `templates/`. The root
[`.lintstagedrc.json`](.lintstagedrc.json) is the lint-staged form above, calling the built CLI
(`node dist/cli.js --quiet`) because the package is not published yet. It is **not wired to a
pre-commit hook**: this repository sets up no husky or other hook, and lint-staged is not a
dependency (run it by hand with `pnpm dlx lint-staged`). It needs `pnpm run build` first, since
it calls `dist/cli.js`. To check all pairs by hand:

```bash
pnpm run build
node dist/cli.js
```

## Documentation

- [docs/README.md](docs/README.md): index of everything under `docs/` (guides, glossary, ADRs).
- [docs/spec.md](docs/spec.md): the contract (tags, types, codes, config, CLI, output).
- [docs/architecture.md](docs/architecture.md): modules, run flow, rule contract.
- [docs/guides/adding-a-rule.md](docs/guides/adding-a-rule.md), [docs/guides/adding-a-tag.md](docs/guides/adding-a-tag.md): how to add a rule or a tag.
- [docs/adr/0014-legacy-behaviour-catalogue.md](docs/adr/0014-legacy-behaviour-catalogue.md): replace the legacy wrappers and `approved_path.yml`; breaking changes of 0.2.0.
- [docs/adr/](docs/adr/0001-genesis.md): architecture decision records.
- [CONTRIBUTING.md](CONTRIBUTING.md): setup, quality gates, commit style.
- [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md): licenses of the dependencies.

## Development

Node >= 22.18. The TypeScript scripts run through `tsx`, a devDependency installed by `pnpm install` ([ADR 0007](docs/adr/0007-tsx-script-runner.md)).

Install and build:

```bash
pnpm install --frozen-lockfile
pnpm run build
```

Check and test:

```bash
pnpm run typecheck
pnpm test
pnpm run lint
pnpm run format:check
pnpm run check:rules   # consistency check of grammar, visitors, rules and spec
pnpm run coverage
pnpm run format        # rewrite the files with Prettier
```

Regenerate and check the parser. `pnpm run gen:parser` (`scripts/gen-parser.ts`) empties
`src/generated/`, then regenerates the lexer, parser, listener and visitor from
`grammar/MdTemplateLexer.g4` and `grammar/MdTemplateParser.g4` with antlr-ng (no Java). Run it
after every grammar change and commit the output; never edit it by hand.
`pnpm run check:parser` (`scripts/check-parser.ts`) generates the parser into a temporary
directory and fails when `src/generated/` has a differing, missing or extra file (stale or
hand-edited parser). It never modifies `src/generated/` and works before and after the files
are committed.

```bash
pnpm run gen:parser
pnpm run check:parser
```

Scaffold a rule (see [docs/guides/adding-a-rule.md](docs/guides/adding-a-rule.md)):

```bash
pnpm run new:rule -- <category> <name>
```

Smoke test of the package (optional, needs the network: pack, check the tarball, install it in
a clean directory, run the installed CLI; see
[ADR 0005](docs/adr/0005-packaging-and-release.md)):

```bash
pnpm run smoke:pack
```

All scripts and tool configs are TypeScript (`scripts/*.ts`, `eslint.config.ts`). That is a
guideline: no check enforces it, so keep `.js`/`.mjs`/`.cjs` files out of the repository
except in `src/generated/`, `dist/`, `node_modules/`, `coverage/` and `tmp/`.
Tests are minimal synthetic rule cases, one fixture per case, at least one `pass-` and one
`fail-` case per rule (layout in [CONTRIBUTING.md](CONTRIBUTING.md#tests)); the parity data of
the port is history only (see [ADR 0006](docs/adr/0006-parity-reached.md)).
Contributor guide: [CONTRIBUTING.md](CONTRIBUTING.md).

### Editor setup

To work on the grammars you need:

- Node `>=22.18` (the `engines` field of `package.json`).
- pnpm, at the version of the `packageManager` field of `package.json` (see [ADR 0003](docs/adr/0003-pnpm.md)).
- The dependencies: `pnpm install --frozen-lockfile`. No Java is needed: the parser is generated with antlr-ng.

Optional, for VS Code: install the extension `mike-lischke.vscode-antlr4` ("ANTLR4 language support for Visual Studio Code"). Its README lists syntax coloring for `.g4` files, code completion, symbol information and grammar validation. Source: <https://github.com/mike-lischke/vscode-antlr4> (its Marketplace link uses `itemName=mike-lischke.vscode-antlr4`).

The grammar is split in two files: `grammar/MdTemplateLexer.g4` (tokens and the lexer modes, which separate the regions of the Markdown document: frontmatter, body, fences, tags and disable directives) and `grammar/MdTemplateParser.g4` (the parser rules, with `tokenVocab` pointing at the lexer). Open both together: a parser rule uses the tokens of the lexer, and a change of a mode or a token usually needs a change in both files. Write every tag pattern in these files, never in `src/`.

The parser in `src/generated/` is generated code. Regenerate and check it as described under [Development](#development); the editor extension does not replace that step.

The grammar guide is [docs/guides/grammar-and-listeners.md](docs/guides/grammar-and-listeners.md).

## AI-Assisted Development

See [AI_GUIDELINE.md](AI_GUIDELINE.md).
