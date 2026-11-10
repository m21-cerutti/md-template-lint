---
title: Migrating from the legacy wrappers
last_updated: 2026-11-04
---

# Migrating from the legacy wrappers

This guide is for a project that still calls the old Markdown lint wrappers (a Python
linter, a PowerShell core and per-project wrapper scripts built on a `$pairs` table, plus
a global alias file). Parity with those tools is reached and they are gone from this
repository ([ADR 0006](adr/0006-parity-reached.md)). One `md-template-lint.yml` per
project and one CLI replace all of them. The contract is in [spec.md](spec.md), the
record of the old behaviour in [research/wrapper-parity.md](research/wrapper-parity.md).

## Steps

1. Install the CLI (README, "Install"). Node >= 22.18. No Python, no PowerShell core, no
   fixed global skill folder.
2. Create `md-template-lint.yml` at the root of the project. Convert each old `$pairs`
   entry with the table below.
3. Run `md-template-lint --verify` to check that every template parses, then
   `md-template-lint` to lint the pairs.
4. Move the alias entries that the project needs into `aliases` (and `approvedPaths` if
   absolute values must be probed). See "Aliases and approved paths".
5. Delete the old wrapper script from the project and call the CLI instead (hook, CI,
   lint-staged: see below).

## Converting a pair

Each old `$pairs` entry maps to one pair of the config (spec 6.5):

| Old concept                        | `md-template-lint.yml`                                             |
| ---------------------------------- | ------------------------------------------------------------------ |
| `template`                         | `template` (plus `templateRoot` when the templates live elsewhere) |
| `targetDir` and `pattern`          | `include: <targetDir>/<pattern>` (the default pattern was `*.md`)  |
| `Recurse = $true`                  | `**` between folder and pattern: `<targetDir>/**/<pattern>`        |
| `Exclude` (regex on the file name) | `exclude`, as a glob: `^README\.md$` becomes `**/README.md`        |
| `description`                      | `description`                                                      |
| repo root of the wrapper           | the folder of the config file (or an entry of `roots`)             |
| list of project roots              | `roots` plus `pairs[].roots` (a name, a list, or `"*"`)            |
| global alias file entry            | `aliases`                                                          |
| absolute path allowed for probes   | `approvedPaths`                                                    |

Paths use `/` (a `\` is read as `/`). Globs are case-sensitive on every OS, and `*`
never crosses a `/`.

## Aliases and approved paths

The old global alias file (`approved_path.yml`) held `<name>: <absolute path>` for the
whole machine. It is replaced by the config keys `aliases` and `approvedPaths` (spec 6.3,
decision D12). The legacy file is no longer read. In the config:

- `aliases` is per project. The name is written without `@`. The value is a directory,
  relative to the config directory, absolute, or starting with `~`. It feeds the
  `@name/<relpath>` values of `[io:exists]`.
- `approvedPaths` lists the directories where absolute values found in documents may be
  probed. An absolute path outside these folders is never probed.

```yaml
aliases:
  assets: ./assets
approvedPaths:
  - ~/notes
```

## Layouts

One generic example per layout. Names and folders are examples; use your own.

### Single root

One project, one pair per template. This replaces the simple wrapper.

```yaml
pairs:
  - name: adr
    template: templates/adr.template.md
    include: docs/adr/*.md
    exclude: "**/README.md"
    description: architecture decision records
  - name: guide
    template: templates/guide.template.md
    include: wiki/guides/**/*_guide.md # old Recurse = $true
    description: guides
```

A pair that matches no file reports `MTL913` (a warning with the default `onEmpty`),
where the wrapper printed `Target directory not found` or `No files matching pattern ...`.

### Multi-root

Several projects share the same templates. Each project root becomes an entry of
`roots`. This replaces the multi-project wrapper (a list of project roots). The config
sits in the folder that holds `templates/`.

```yaml
roots:
  app-a: ../app-a
  app-b: ../app-b
pairs:
  - name: agents
    template: templates/agent.template.md
    roots: "*"
    include: .opencode/agents/*.md
    description: Agent definitions
  - name: skills
    template: templates/skill.template.md
    roots: "*"
    include: .opencode/skills/**/*SKILL.md
    description: Skill definitions
```

Differences from the wrapper: the output order is fixed (roots in declaration order); a
missing root is `MTL909` for that root only, the other roots are still linted and the
exit code is 2 (the wrapper aborted before linting anything); a root without the target
folder reports `MTL913` (a warning) for that pair. `"*"` means every root declared under
`roots`, not the implicit root `project`: list `project` by name in `pairs[].roots` to
include it. A root that only holds templates is also listed by name instead of `"*"`
(spec 6.5).

### External root with alias

The templates stay in the project; the files to lint live in another repository. This
replaces the external-repo wrapper. The external repository is a root, the pair runs
there, and an alias feeds `@data/<relpath>` values of `[io:exists]`. Shared templates in
a third folder are used through `templateRoot`.

```yaml
roots:
  shared: ../shared-templates # holds the shared templates only
  data: ~/data/prompts # external repository
aliases:
  data: ~/data/prompts
pairs:
  - name: agents
    template: agent.template.md
    templateRoot: shared
    include: .opencode/agents/*.md
    description: Agent definitions
  - name: prompts
    template: templates/prompt.template.md
    roots: data
    include: _prompts/*.md
    description: Prompt sidecars
```

## Old command line to the new CLI

History and mapping note. The old tools no longer exist; this shows what replaces each
call.

| Old call                                       | New                                                                     |
| ---------------------------------------------- | ----------------------------------------------------------------------- |
| any per-project wrapper script                 | `md-template-lint` (multi-root config for the multi-project layout)     |
| Python linter `<template> <file> [<file>...]`  | `md-template-lint <file> [<file>...]` (template from the matching pair) |
| Python linter `<template>` (parse only)       | `md-template-lint --verify <template>` (no config needed)               |
| `--pattern <regex>` (regex on the file name)   | dropped: an `include` glob of a pair, recursion explicit with `**`      |
| `--dir <path>`                                 | dropped: the folder is part of the `include` glob (or a `roots` entry)  |
| `--ignore <regex>` (repeatable)                | dropped: `exclude` glob(s) of the pair                                  |
| `--base-dir <path>` (for `[io:exists]`)        | dropped: relative paths resolve against the root of the pair            |
| `--help`, `-h`                                 | `--help`, `-h`                                                          |
| no arguments (usage error, exit 1)             | `md-template-lint` lints the whole config; this is not an error         |
| (none)                                         | `--config <path>`, `--format text\|plain\|json`, `--quiet`, `--version` |

Exit codes: the old tools returned 1 for a lint failure, a missing input and a usage
error alike. The CLI returns `0` clean, `1` lint failure or broken template, `2` usage,
config or run error (a missing template, root or file).

Calling the linter once per file (the wrapper did) is not needed: the template of each
pair is parsed once per run, and `md-template-lint a.md b.md` accepts a file list.

## lint-staged

The CLI accepts the files that lint-staged appends; a staged file that matches no pair
is skipped silently. `.lintstagedrc.json` at the project root:

```json
{
  "*.md": "md-template-lint --quiet"
}
```

Or in `package.json`:

```json
{
  "lint-staged": {
    "*.md": "md-template-lint --quiet"
  }
}
```

## Intentional behaviour changes

Every difference from the old tools is decided in [spec.md](spec.md): defects D01 to
D18 in section 5, assumptions in section 10, kept quirks and other changes in section 11.
The comparison with the old linter accepted only documented divergences
([ADR 0006](adr/0006-parity-reached.md)). What a migrating user will notice:

| Id            | Change                                                                                                                                                                                          |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D01           | Agent and skill pairs now find their templates (`agent.template.md`, `skill.template.md`) and are really linted. A missing template is always an error (`MTL910`, exit 2), never a silent skip. |
| D02, C03      | A missing root is `MTL909`; an empty file set is `MTL913` with a severity from `onEmpty` (default `warn`). `No files linted.` replaces `All files passed!` when nothing was linted.             |
| D03           | Output order is fixed: roots in declaration order, pairs in config order, files sorted.                                                                                                         |
| D04           | One path resolver for config values: `~` expands, `C:/x` is absolute, `\` is read as `/`.                                                                                                       |
| D05           | One process per run; each template is parsed once.                                                                                                                                              |
| D06           | `Warnings:` counts warning diagnostics (and shows the number of files with warnings); the summary has extra lines for run warnings and run errors.                                              |
| D07           | `--pattern`, `--dir`, `--ignore` and the regex `exclude` are replaced by globs in the config.                                                                                                   |
| D08, D15, D18 | Every printed path is relative to its root and uses `/`, so same-named files in different folders can be told apart.                                                                            |
| D09           | Exit codes: 0 clean, 1 lint failure or broken template, 2 usage, config or missing-input error.                                                                                                 |
| D11           | `[io:exists]` relative paths resolve against the pair root, not the working directory; `--base-dir` is gone.                                                                                    |
| D12           | The global alias file is replaced by `aliases` and `approvedPaths` in the project config (see "Aliases and approved paths"). `MTL801` and `MTL803` name the config.                             |
| D14           | A missing project root no longer aborts the run; the other roots are linted.                                                                                                                    |
| D16, C02      | A broken template is printed once as `TEMPLATE ERROR: <template> - <message>`; the `(skipping remaining ...)` line is gone.                                                                     |
| C01           | A file argument that does not exist is `MTL912`; the other files are still linted (exit 2 at the end).                                                                                          |
| C04           | A template path that is a directory is `MTL911` (exit 2), not a broken template.                                                                                                                |
| C05           | A valid tag in the wrong region (a heading tag in frontmatter, or the reverse) is the warning `MTL013`, shown by `--verify`.                                                                    |
| C07           | New output formats (`--format text\|plain\|json`); `[io:exists]` URL probes are hardened (no redirects, private ranges refused unless `allowPrivateNetworks`).                                  |
| AS4           | One indented line per diagnostic instead of the nested `FAIL ... has errors:` / `WARN ... has N warning(s):` blocks, followed by the offending source line (and a caret row when the column is known, C09). The messages are unchanged.                                                |
| AS5           | Globs are case-sensitive on every OS (PowerShell wildcards were case-insensitive on Windows).                                                                                                   |
| AS6           | A template file never lints itself when it matches the `include` of its own pair.                                                                                                               |
| C10           | Every heading level (H1 to H6) is checked, levels are matched exactly. BREAKING, see "H3 and deeper headings are checked".                                                                      |
| C10           | Headings are matched by position: an extra heading before or between template headings shifts the match, extras after the last one give the warning `MTL616`, a swapped pair is `MTL601` with a hint, template errors fail lint runs. BREAKING, see "Headings are matched by position". |
| C10           | `[presence:exist]` is removed (a malformed tag, `MTL012`; the heading is then reported missing) and `MTL602` is retired. BREAKING, see "The `exist` presence tag is removed". |
| C11           | A template field of type `date` or `list-of-date` without a `[format:date]` or `[format:elements:date]` tag gives the warning `MTL016` in `--verify` only (exit code unchanged). Not breaking. |
| C12           | Order tags compare the heading text, an order tag without repeat tag is the template error `MTL030`, `{int}` is renamed `{digits}`, `{text}` case formats refuse digits only. BREAKING for templates that use them, see "Other changes for heading tags". |

Kept on purpose from the old linter (spec 11.1, quirks Q01 to Q08): for example the
Python-style list text in some messages (`['a', 'b']`), and that unknown and malformed
template tags show in `--verify` only.

## H3 and deeper headings are checked

This is a breaking change (change C10, spec 2.6, [ADR 0009](adr/0009-all-heading-levels.md)),
released in a major version. Read it before you upgrade a project that has templates with
`###` or deeper headings.

### What changed

- Every heading level, H1 to H6, is read and checked. Before, only H1 and H2 were: an H3 to
  H6 line of a template was plain text, kept its brackets and gave no tag warning.
- A template heading without a presence tag is required at every level (`[presence:required]`
  is the default). An untagged `### Added` in a template is now required in every target.
- Levels are matched exactly. A template `## Context` is satisfied only by a `## Context` in
  the target. A target `# Context` or `### Context` with the same text no longer matches, so
  the template heading is reported missing (`MTL601`, or `MTL610` inside a section). Before,
  a target `# Context` satisfied a template `## Context`.
- Section scope. A template heading of level 3 to 6 that has a template parent (the nearest
  heading above it with a lower level) matches only inside the matched section of that
  parent. A `### Added` under `## Unreleased` is looked for under `## Unreleased` only. H1
  and H2 keep matching in the whole file. If the parent is missing, optional and absent, or
  `[presence:template-only]`, its children are not checked, so one cause is reported once.
- Heading tags are read on every level. A bracket on an H3 to H6 template line is peeled
  like on H1 and H2 and can give the template warnings `MTL011` to `MTL013`, shown by
  `--verify`.

### New codes and tag

| Code     | Kind     | Meaning                                                                                              |
| -------- | -------- | ---------------------------------------------------------------------------------------------------- |
| `MTL610` | error    | A required heading of level 3 to 6 is missing in the section of its parent.                          |
| `MTL611` | error    | The headings of one parent are not in template order inside its section.                             |
| `MTL612` | error    | A heading the template does not list sits under a heading tagged `[content:subheadings:disallow]`.   |
| `MTL015` | warning  | A heading tag has no effect (today: the disallow tag on a `[presence:template-only]` heading).       |

`[content:subheadings:disallow]` is the error opt-out for extra headings in a whole subtree
(`[content:subheadings:no-extra]`, `MTL615`, is the second one: it covers the direct children
of the matched heading only, spec 2.6). Without either, a target heading that the template
does not list is allowed, at every level, as before, but only after the last template heading
of its level and scope, and the warning `MTL616` lists it (see "Headings are matched by
position"). With the disallow tag on a template heading, no heading below the matched target
heading may be one the template does not list (the whole subtree, at every deeper level).
Only the topmost stray heading is reported, and that error replaces the `MTL616` warning for
it. `MTL015` is a template warning: it shows in `--verify` in the section `Conflicting tags:`
and never changes an exit code.

### How to fix a template

Run `md-template-lint --verify` and then `md-template-lint`, then handle each new finding:

1. A deeper heading that your targets do not always have: add `[presence:optional]`.
   Example: `### Added [presence:optional]`.
2. A heading that is only guidance for the author: add `[presence:template-only]` (a target
   that contains it is then an error, and its children are never checked).
3. A heading that applies only in some cases: add `[presence:conditional:<text>]`
   (documentation only, never enforced).
4. A heading no target needs: remove it from the template.
5. A target that used the wrong level (for example `# Context` for `## Context`): fix the
   target, or change the level in the template. There is no wrong-level code: the template
   heading is simply missing.
6. A parent that must not hold anything else (for example a changelog release): add
   `[content:subheadings:disallow]` to it, and list its allowed children in the template.

Do not delete a required top-level heading to silence a finding.

## Headings are matched by position

This is a breaking change (change C10 note, spec 2.6 and 2.10,
[ADR 0012](adr/0012-positional-heading-matching.md)), released in the same major version as
the changes above. Before, a template heading was satisfied by the first target heading with
the same level and text, wherever it stood. Now the template headings of one level and scope
take the target headings in order, as one run, so a template reads as the outline it
describes. Read it before you upgrade a project that has strict templates.

### What changed

- Extras only after the last declared heading. A target heading that the template does not
  list is allowed only after the last template heading of its level and scope (the tail of the
  run). An extra heading before or between template headings shifts the run: the next template
  heading is then missing (`MTL601`, or `MTL610` inside a section). Before, such a target
  passed.
- Extras are reported. Every run that has extras gives one warning, `MTL616`
  (`<n> extra heading(s) at level H<n> after the template headings: [...]`), anchored on the
  first listed heading. A warning never changes the exit code, so `--quiet`, lint-staged and
  CI see no new failure. It can be silenced by directive (`disable-line MTL616` on a listed
  line, or `disable-file MTL616`). A heading that an error already names (`MTL612`, `MTL614`,
  `MTL615`) is left out of the list: the error replaces the warning. A level that has no
  template heading has no run and so no extras: the H3 headings of a document whose template
  has only H1 and H2 headings stay free detail.
- A swapped pair is a missing heading. Two template headings of one level that the target
  holds in the other order now give `MTL601` for the second one, not an order error
  (`MTL604` or `MTL611`). The message gains a hint when a sibling with that text comes later:
  `Missing required heading: 'Alpha' (found later at line 7, out of order)`. A heading with the
  same text at another level never gives the hint.
- A duplicate is an extra. A second heading with the text of a template heading is an extra
  (warning `MTL616`), no longer a heading that "the first one wins" for.
- Template errors now fail lint runs. The template errors `MTL017` (two adjacent template
  headings that match the same text, exact-text headings included), `MTL018` (an optional
  repeat heading with a `min` tag), `MTL019` (a deeper child before a shallower one under one
  parent) and `MTL030` (see "Other changes for heading tags") are printed on the template file
  in a lint run, and the run exits 1. The targets are still linted, with the template as
  written. Before, they showed in `--verify` only. They cannot be suppressed.

### How to fix

Run `md-template-lint` and handle each finding:

1. A target whose headings are in another order than the template: reorder the document to
   follow the template, or change the template.
2. A heading the document does not always have: mark it `[presence:optional]` in the template.
   The position then takes the next sibling only when it matches.
3. An extra heading that you want to keep before or between declared headings: declare it in
   the template (optional if needed).
4. An extra heading after the last declared one that you accept: keep it and ignore the
   warning, or silence it with `disable-file MTL616`. To forbid it, add
   `[content:subheadings:disallow]` or `[content:subheadings:no-extra]` to the parent
   heading.
5. A template error (`MTL017`, `MTL018`, `MTL019`, `MTL030`): fix the template; the message
   names the template line.

## The `exist` presence tag is removed

This is a breaking change (change C10 note, spec 2.6 "Dropped tag"). `[presence:exist]`
(a heading of that level with any text) no longer exists. It is replaced by the one
mechanism every other heading uses, a pattern (spec 2.10): `[pattern:"{text}"]` means "any
heading here", and a pattern can say more.

What happens to a template that still uses it:

- `exist` is no presence keyword, so `[presence:exist]` is a malformed tag: the warning
  `MTL012` in `--verify`. Peeling stops at it and the bracket stays in the heading text. The
  heading is then an ordinary required heading whose text ends with the bracket. No target
  has that text, so a lint run reports it missing (`MTL601`, or `MTL610` inside a section),
  for example `Missing required heading: 'Context [presence:exist]'`. The message names the
  tag to migrate. In a frontmatter comment the tag gives `MTL012` too.
- `MTL602` (heading-level-missing, the old check of this tag) is retired. The code is
  reserved and never reused. There is no code for a heading at the wrong level: the template
  heading is simply missing.
- The second message form of `MTL610` is gone with it.

Migration table. The text written before the tag is an author hint only and is never
compared:

| Before                                        | After                                                                                                                                                                     |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `# ADR [presence:exist]`                      | `# ADR - Title [pattern:"ADR - {text}"]`, or `# Title [pattern:"{text}"]` for any H1                                                                                      |
| `## Epic A - Title [presence:exist]`          | `## Epic A - Title [pattern:"Epic {char} - {text}"] [repeat-rules:same-level] [order:ascending]` (one heading per epic, epics in letter order)                            |
| `## Changes [presence:exist] [content:table]` | `## Changes [content:table]` when the heading text is fixed (plain required heading)                                                                                      |
| `### Version [presence:exist]`                | `### 0.0.0 [pattern:"{semver}"]`                                                                                                                                          |

One difference: `{text}` refuses a purely numeric text, so a heading such as `## 2026`
needs `{digits}`, `{number}` or `{date:format:year}`. A numeric heading with a leading zero
(`## 007`) needs `{digits:format:padding:3}` (exactly three digits) or `{number}`; the
default `{digits}` refuses it. No `{text}` format accepts a digits-only text.

Run `md-template-lint --verify` to find the templates that still use the tag (`MTL012`).

## Other changes for heading tags

Notes for templates that already use heading patterns, repeat rules or order tags
(change C12 and its revisions, spec 2.7 and 2.10). Patterns, repeat rules and order tags
themselves are additive; these differences are not.

- Order tags compare the heading text. `[order:ascending]` and `[order:descending]` compare
  the whole heading text as strings (UTF-16 code-unit order, case-sensitive), so `Step 10` is
  below `Step 9`. To order by a number, a date or a version, use `[order:first:number:...]`,
  `[order:first:date:...]` or `[order:first:semver:...]`: they read the first number, date
  or version of the text. An instance without that key is the error `MTL617`; use a pattern
  with `{number}`, `{date}` or `{semver}` so that every heading has one. A changelog that
  lists releases newest first uses `[order:first:date:descending]` or
  `[order:first:semver:descending]`.
- An order tag without repeat tag now fails. An `[order:...]` tag on a pattern heading that
  has no `[repeat-rules:...]` tag is the template error `MTL030` (it was the warning
  `MTL015`), so such a template, which passed lint runs before, now fails them (exit 1).
  Fix: add `[repeat-rules:same-level]`, or remove the order tag. An order tag on a heading
  without pattern stays the warning `MTL015`.
- `{int}` is renamed `{digits}`. `{int}` is now an unknown placeholder (`MTL014`, a warning
  of `--verify`), and the heading is not checked at all until the template is migrated. Fix:
  replace `{int}` by `{digits}`. `{digits}` gains the formats `signed`, `hex`, `uid` and
  `padding:N`.
- `{text}` case formats no longer accept digits only. `snakecase`, `camelcase`, `screamcase`
  and `kebabcase` accept Unicode letters and need at least one letter, so `2026` is no
  longer `snakecase`. A template that relied on it uses `{digits}`. `lowercase` and
  `uppercase` are new formats.
- Template findings (C10 to C12 rows above). `MTL017` to `MTL019` and `MTL030` fail lint runs (above).
  `MTL014` (invalid pattern, the heading is not checked), `MTL015` (a tag without effect)
  and `MTL016` stay warnings of `--verify`. `MTL016` is the warning for a template field of
  type `date` or `list-of-date` that has no `[format:date]` or `[format:elements:date]` tag
  (change C11, not breaking: the default date shapes still apply, and the warning shows in
  `--verify` only). Fix: add the tag to the inline comment of the field (`[format:date]`
  accepts a calendar-valid `YYYY-MM-DD` date; spec 2.9).

## After the migration

- Run `md-template-lint --verify` and `md-template-lint`; fix what the pairs report.
- Remove the old project wrapper script and any call to the old global skill scripts.
- Keep the config in version control. It holds no secret; keep absolute machine paths
  out of it (use relative paths, `~`, or `aliases`).
