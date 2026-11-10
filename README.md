# md-template-lint

TypeScript/pnpm port of the Markdown template linter. It checks Markdown
instance files (frontmatter and headings) against template files. Template tag
syntax is defined by an ANTLR grammar; rules are grouped by category; each
project configures its template/target pairs in `md-template-lint.yml`.

A template is a Markdown file and it is the schema: the frontmatter keys, their
inline `#` comments and the H1/H2 heading suffixes carry the rules. There is no
separate schema file.

Status: the port matches the legacy Python linter and the PowerShell wrappers, apart
from documented fixes (see [ADR 0006](docs/adr/0006-parity-reached.md)). The package
is not published yet.

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
`--ignore` and `--base-dir` do not exist (see [docs/migration.md](docs/migration.md)).

### Exit codes

| Code | Meaning                                                                                                   |
| ---- | --------------------------------------------------------------------------------------------------------- |
| `0`  | No file with errors, no broken template, no run error. Warnings may exist. Also `--help` and `--version`. |
| `1`  | At least one target has an error, or a template is broken, and there is no run error.                     |
| `2`  | A run error: usage, config, missing root, template or target file. It outranks `1`.                       |

Warnings never change the exit code.

### Output formats

- `text` (default): the layout with glyphs `✓ ✗ ⚠ ℹ`, in color only on a terminal
  and when `NO_COLOR` is unset or empty.
- `plain`: the same layout with the words `PASS`, `FAIL`, `INFO`, never colored.
- `json`: one JSON document on stdout and nothing else (run errors are inside it).
  Stable keys: `schemaVersion`, `tool`, `version`, `mode`, `config`, `results`,
  `runErrors`, `runWarnings`, `unmatched`, `summary` (with `exitCode`). In verify
  mode `results` is replaced by `templates`.

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
      error MTL601 Heading: Missing required heading: 'Context'
      warn  MTL202 Unknown key 'authors' not present in template
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
  rules, headings, unknown, malformed and misplaced tags). No target is read and no
  network is used. `md-template-lint --verify` checks every distinct template of the
  config; `md-template-lint --verify path/to/a.md` checks those files and needs no
  config. A broken template exits 1; a missing template path exits 2. With neither
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
H1 and H2 headings of the body can carry bracket tags after their text. A field
without a presence tag is required.

```markdown
---
# [filename:case:kebab-case]
id: 0000-record-template # [presence:required] [value:filename] [format:kebab-case]
status: proposed | accepted # [presence:required]
date: 2026-10-29 # [presence:required] type=date
deciders: [Name] # [presence:required] [count:min:1]
supersedes: 0000-other-record # [presence:optional]
---

# ADR [presence:exist]

## Context [content:non-empty]

## Consequences [content:list]

## Authoring checklist [presence:template-only]
```

Three places carry tags:

| Place            | Where                                                      | Bound to     |
| ---------------- | ---------------------------------------------------------- | ------------ |
| Inline comment   | trailing `#` comment on a top-level frontmatter key        | that key     |
| Filename comment | a standalone `# [filename:case:<convention>]` comment line | the template |
| Heading suffix   | bracket tags after the text of an H1 or H2 heading         | that heading |

Tag names and keywords are case-insensitive, except `[filename:case:<convention>]`,
which is case-sensitive. Tags in a target file are inert (only trailing heading tags
are stripped before comparison). Frontmatter values are read as strings (no
`yes`/date/number coercion). A BOM is ignored and line endings are normalized.

Tag grammar: [grammar/MdTemplateLexer.g4](grammar/MdTemplateLexer.g4) and
[grammar/MdTemplateParser.g4](grammar/MdTemplateParser.g4). Full specification:
[docs/spec.md](docs/spec.md) section 2 (tags), 3 (types) and 4.3 (codes).

## Rule syntax by category

Rules live in `src/rules/<category>.ts`, one file per category. Codes are stable
`MTLnnn` and are never renumbered. The tables below copy
[docs/spec.md](docs/spec.md) sections 2 and 4.3, which stay the source of truth.
Severity `error` fails the file (exit 1); `warning` is printed and never changes the
exit code.

### syntax (`MTL001`-`MTL099`)

Parsing and template tag diagnostics. No tag of its own.

| Code     | Name                    | Severity | When                                                                          |
| -------- | ----------------------- | -------- | ----------------------------------------------------------------------------- |
| `MTL001` | frontmatter-missing     | error    | No YAML frontmatter (`---` ... `---`).                                        |
| `MTL002` | yaml-invalid            | error    | The frontmatter is not valid YAML.                                            |
| `MTL003` | frontmatter-not-mapping | error    | The frontmatter is not a `key: value` mapping.                                |
| `MTL004` | file-unreadable         | error    | The file cannot be read or is not valid UTF-8.                                |
| `MTL010` | unknown-field-tag       | warning  | A bracket in a field comment looks like a tag but is unknown.                 |
| `MTL011` | unknown-heading-tag     | warning  | A leftover trailing bracket on a heading looks like an unknown tag.           |
| `MTL012` | malformed-tag           | warning  | A known tag family with a bad argument, for example `[count:min:abc]`.        |
| `MTL013` | misplaced-tag           | warning  | A valid tag in the wrong region (heading tag in frontmatter, or the reverse). |

`MTL001` to `MTL004` on a target print `Parse error: <message>` and the file is not
checked further. On a template they make it "broken": `TEMPLATE ERROR: <template> -
<message>`, exit 1. `MTL010` to `MTL013` are shown by `--verify` only.

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

| Code     | Name                   | Severity | When                                                                     |
| -------- | ---------------------- | -------- | ------------------------------------------------------------------------ |
| `MTL301` | constant-mismatch      | error    | The value differs from `[format:constant:...]`.                          |
| `MTL302` | case-mismatch          | error    | The value does not match `[format:snake_case]` or `[format:kebab-case]`. |
| `MTL303` | elements-case-mismatch | error    | A list item does not match `[format:elements:...]`.                      |
| `MTL304` | scheme-disallowed      | error    | A valid URL has a scheme outside `[format:scheme:...]`.                  |
| `MTL305` | scheme-disallowed-item | error    | A list contains URLs with a disallowed scheme.                           |

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

Type hints are not rules; they only choose the field type. Forms: `type=<name>`
anywhere in the comment; a single-word bracket such as `[date]`; the text
`YYYY-MM-DD` or the word `ISO` (date); the words `url`/`lien` (url) and `path`
(path); an alias marker `@<name>/` (path-alias); a field value equal to a type
name; an option list `a | b` (enum). Without a hint the type is inferred from the
value. Colon tags such as `[presence:...]` never act as type hints.

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

Tags go after the text of an H1 or H2 heading. Headings inside fenced code are
ignored. Heading text comparison is exact and case-sensitive.

| Tag                             | Meaning                                                                    |
| ------------------------------- | -------------------------------------------------------------------------- |
| `[presence:required]`           | A heading with this exact text must exist. Same as no tag.                 |
| `[presence:exist]`              | A heading at the same level must exist, any text.                          |
| `[presence:optional]`           | The target may omit it.                                                    |
| `[presence:conditional:<text>]` | Documentation only, never enforced.                                        |
| `[presence:template-only]`      | Guidance for the template author; the heading must not appear in a target. |

| Code     | Name                  | Severity | When                                                        |
| -------- | --------------------- | -------- | ----------------------------------------------------------- |
| `MTL601` | heading-missing       | error    | A required heading is missing.                              |
| `MTL602` | heading-level-missing | error    | No heading at the level of a `[presence:exist]` heading.    |
| `MTL603` | heading-template-only | error    | A `[presence:template-only]` heading appears in the target. |
| `MTL604` | heading-order         | error    | Template headings appear in a different relative order.     |

### content (`MTL700`-`MTL799`)

Section body rules on a heading. Skipped when the target lacks the heading (it is
reported once, by `MTL601`). If the target repeats the heading, the first one is
checked.

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

## Documentation

- [docs/spec.md](docs/spec.md): the contract (tags, types, codes, config, CLI, output).
- [docs/architecture.md](docs/architecture.md): modules, run flow, rule contract.
- [docs/adding-a-rule.md](docs/adding-a-rule.md): how to add a rule or a tag.
- [docs/migration.md](docs/migration.md): replace the legacy wrappers and `approved_path.yml`.
- [docs/adr/](docs/adr/0001-genesis.md): architecture decision records.
- [CONTRIBUTING.md](CONTRIBUTING.md): setup, quality gates, commit style.
- [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md): licenses of the dependencies.

## Development

Node >= 22.18 (runs the TypeScript scripts natively, [ADR 0004](docs/adr/0004-typescript-scripts.md)).

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

Scaffold a rule (see [docs/adding-a-rule.md](docs/adding-a-rule.md)):

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

## AI-Assisted Development

### Configuration

This project uses [OpenCode](https://opencode.ai/) for AI-assisted
development.

- **AGENTS.md:** project rules for AI agents. Injected into every session.
- **opencode.jsonc:** permissions, MCPs and references. The default model
  comes from the global config.
- **docs/ai-capabilities.md:** inventory of the project agents, skills,
  commands, tools and scripts.

### Usage

- Start a session: `opencode`
- Run a single task: `opencode run "your task here"`
- Invoke a command: `/command-name`

### Guidelines

- Verify agent output: run the tests and read the diff before committing.
- Keep AGENTS.md, README and `docs/ai-capabilities.md` in sync with the code.
- Use `@orchestrator-plan` for complex multi-step work, then `@orchestrator`
  to execute the approved plan.

### Resources

- OpenCode documentation: https://opencode.ai/v2/docs
- Issues: https://github.com/anomalyco/opencode
- Research basis: [Evaluating AGENTS.md, ETH Zurich, 2026](https://arxiv.org/abs/2602.11988)
