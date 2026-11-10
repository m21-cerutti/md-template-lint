---
title: Migrating from the legacy wrappers
last_updated: 2026-10-30
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
| AS4           | One indented line per diagnostic instead of the nested `FAIL ... has errors:` / `WARN ... has N warning(s):` blocks. The messages are unchanged.                                                |
| AS5           | Globs are case-sensitive on every OS (PowerShell wildcards were case-insensitive on Windows).                                                                                                   |
| AS6           | A template file never lints itself when it matches the `include` of its own pair.                                                                                                               |

Kept on purpose from the old linter (spec 11.1, quirks Q01 to Q08): for example the
Python-style list text in some messages (`['a', 'b']`), and that unknown and malformed
template tags show in `--verify` only.

## After the migration

- Run `md-template-lint --verify` and `md-template-lint`; fix what the pairs report.
- Remove the old project wrapper script and any call to the old global skill scripts.
- Keep the config in version control. It holds no secret; keep absolute machine paths
  out of it (use relative paths, `~`, or `aliases`).
