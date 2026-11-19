---
last_updated: 2026-11-19
---

# Changelog

All notable changes to this project are listed here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- prettier-ignore-start -->
<!-- omit in toc -->
## Summary
<!-- prettier-ignore-end -->

- [Unreleased](#unreleased)
  - [Added](#added)
  - [Changed](#changed)
- [0.2.1 - 2026-11-16](#021---2026-11-16)
  - [Changed](#changed-1)
- [0.2.0 - 2026-11-05](#020---2026-11-05)
  - [Added](#added-1)
  - [Changed](#changed-2)
  - [Removed](#removed)
- [0.1.0 - 2026-10-29](#010---2026-10-29)
  - [Added](#added-2)

## Unreleased

### Added

- Opt-in benchmark script `pnpm run bench` (`scripts/bench.ts`, options `--runs N` and `--json`).
  It times a lint run on five generated workloads (500 files, 2000 files, one file with 5000
  headings, a large template, 200 templates). It is not part of `pnpm test`, CI or the hooks.
  How to run it and compare two runs: the "Performance" section of
  [CONTRIBUTING.md](CONTRIBUTING.md#performance).

### Changed

- Faster lint runs. The diagnostics, their order and the exit codes are unchanged. The gains come
  from five changes:
  - Target files are read ahead of the lint (a window of 16 files). The files are still linted
    one by one, in the same order.
  - The heading match of a template and a target is computed once and shared by the rules that
    need it.
  - The `MTL611` check (heading order in a section) is linear in the number of headings.
  - The sections of a document are built in a single pass.
  - Documents are parsed with ANTLR's faster SLL prediction first. The full parse runs only when
    the first one reports an error, so the error texts are the same.
- Median wall time of one run per workload, before and after (milliseconds; 5 runs of the bench
  after one cold run, Node v24.15.0, 16 CPUs):
  - 500 files, 1 template: 341.4 to 158.1.
  - 2000 files, 1 template: 1348.6 to 512.7.
  - 1 file, 5000 headings: 393.8 to 114.7.
  - Large template (300 fields, 600 headings), 5 files: 617.8 to 128.8.
  - 200 templates, 3 files each: 876.8 to 412.4.

## [0.2.1] - 2026-11-16

Maintenance release. There is no change in the rules, the CLI or the syntax. The changes below
touch the tests, the docs and the lint setup of the repository only.

### Changed

#### Tests

- The unit tests are moved from a flat `tests/unit/` into folders that mirror `src/`:
  `tests/unit/engine`, `tests/unit/tags`, `tests/unit/cli`, `tests/unit/scripts` and
  `tests/unit/research`. The test code is unchanged apart from its import paths.

#### Documentation

- The guides (`docs/guides/adding-a-rule.md`, `adding-a-tag.md`, `grammar-and-listeners.md`,
  `testing.md`), `docs/research/yaml-spike.md`, `docs/spec.md` and `tests/INDEX.md` point to the
  new unit test paths.
- `docs/syntax-reference.md` is regenerated. The content is the same: only the Markdown layout
  changes (table alignment, a `prettier-ignore` wrapper around each generated block, no blank
  line after the frontmatter in the examples).

#### Tooling

- The ignore lists of the repository checks are trimmed to what is still needed:
  `.markdownlint-cli2.jsonc` (the removed plan file, `docs/proposals`, `TODO.md` and `IDEA.md`),
  `.prettierignore` (`docs/proposals`) and `.secretlintignore` (`.cortexkit/`, `src/generated/`,
  `tests/fixtures/` and `docs/proposals/`).
- New script `pnpm run lint:md:template` (`node dist/cli.js`): it runs the template linter on
  this repository, using the built CLI.
- In `md-template-lint.yml`, the `index` pair now lints every `INDEX.md` (`**/INDEX.md`, with
  `node_modules/` excluded) instead of the three listed index files.

## [0.2.0] - 2026-11-05

First release of the TypeScript port. It replaces the legacy Python linter and the
PowerShell wrappers (see [ADR 0014](docs/adr/0014-legacy-behaviour-catalogue.md)).

### Added

#### CLI

- CLI `mdtl` (package bin `mdtl`, with the alias `md-template-lint`) with the options `--config`,
  `--format`, `--quiet`, `--verify`, `--help` and `--version`, and the exit codes `0` clean,
  `1` lint failure or broken template, `2` usage, config or run error.
- `--verify`: parses the templates, prints their schema and the template warnings, and reads no
  target. It needs no config when template paths are given. A template with a template error
  (`MTL017`, `MTL018`, `MTL019`, `MTL030`) fails: `--verify` exits 1 when a template is broken
  or has such an error.
- Lint-staged mode: a list of files as arguments lints those files only; a file that matches no
  pair is skipped silently.

#### Configuration

- Per-project config `md-template-lint.yml`: pairs of template and targets with `include` and
  `exclude` globs, `roots`, `templateRoot`, `aliases`, `approvedPaths` and `onEmpty`.

#### Rules

- Stable rule codes `MTLxxx`, grouped by category (syntax, filename, presence, format, bounds,
  type, heading, content, io, run diagnostics).
- Template rules: `MTL014` (invalid heading pattern), `MTL017` (adjacent headings with the
  same pattern), `MTL018` (optional repeat heading with a `min` tag), `MTL019` (deeper child
  before a shallower one) and `MTL030` (order tag without repeat tag).
- Heading rules: `MTL605` to `MTL609` (pattern missing, pattern mismatch, repeat minimum,
  repeat maximum, repeat order), `MTL611` (heading-order-in-section: the headings of one
  parent are out of template order), `MTL612` (heading-unlisted: a heading the template does
  not list under `[content:subheadings:disallow]`) and `MTL613` to `MTL617` (unique names,
  repeat miss, undeclared sub-heading, extra headings, order key missing).
- Template warnings, shown by `--verify` only and never changing an exit code: `MTL015`
  (heading-tag-conflict: a heading tag has no effect) and `MTL016` (date-format-missing: a
  `date` or `list-of-date` field without `[format:date]` or `[format:elements:date]`).
- Template warning `MTL031` (frontmatter-tag-conflict): a copy of `[frontmatter:optional]`
  that has no effect (a later duplicate line, the tag after a key, or the tag in mixed comment
  text). `--verify` lists it in the section `Conflicting frontmatter tags:`; it never changes
  the exit code.
- `MTL010` warning `Comment line {line}: unknown tag {tag}` for an unknown `[tag]` in a
  standalone comment line of the template frontmatter (for example `# [todo]`). `--verify` only,
  never changes the exit code. There is no escape: write the note without square brackets. See
  "Bracketed words in frontmatter comments" in [ADR 0014](docs/adr/0014-legacy-behaviour-catalogue.md).
- `MTL601` message hint `found later at line N, out of order` when a sibling with the missing
  text comes later in the target.

#### Syntax

- Template tags on every heading level (H1 to H6).
- Heading patterns with placeholders and formats, for example
  `## Release [pattern:"[{semver}] - {date}"]`.
- Repeat tags `[repeat-rules:same-level]` and order tags `[order:...]`, including
  `[order:first:number|date|semver:...]`.
- Sub-heading tags `[content:subheadings:disallow]` and `[content:subheadings:no-extra]`.
- Tag `[unique-headings-names]`.
- Tag `[frontmatter:optional]`, written as the comment line `# [frontmatter:optional]` in the
  template frontmatter: a target may then omit its frontmatter block. Such a target gets no
  `MTL001` and no field rule; filename, heading and content rules and body disable directives
  still run. A target with frontmatter is checked as before, and an unclosed `---` is still
  `MTL001`. `--verify` prints `Frontmatter: [frontmatter:optional]` and the JSON key
  `frontmatterOptional`. The loader `loadDocument(text, options?)` takes the option
  `frontmatterOptional`. See [ADR 0015](docs/adr/0015-optional-frontmatter.md).

#### Reporting

- Reporters `text` (default), `plain` and `json`, with the offending source line under each
  diagnostic.
- Disable directives in a file: `disable-line`, `disable-next-line`, `disable-file` and
  `begin disable` / `end disable` blocks.

#### Packaging and release

- Packaging, CI and release: a `pnpm run smoke:pack` check of the tarball and a clean install,
  a CI workflow on three operating systems and a release workflow for an `X.Y.Z` tag (no `v` prefix).
- `CONTRIBUTING.md` (fork policy and development guide) and `AI_GUIDELINE.md` are shipped in
  the package.

#### Tooling

- Git hooks for contributors: husky runs lint-staged (prettier, markdownlint, secretlint,
  file-name checks and the template linter itself) and the full tests before a commit, and
  commitlint on the commit message.

#### Documentation

- Doc templates for `CONTRIBUTING.md`, `AI_GUIDELINE.md` and `THIRD_PARTY_NOTICES.md`.
- Docs: the CLI reference (`docs/cli.md`) and the config reference (`docs/configuration.md`)
  are split from the syntax reference, which is now generated; plus `docs/grammar.md` and
  `docs/glossary.md`.

#### Tests

- Test tags per error code: every rule test carries its `MTLxxx` code as a vitest tag, so
  `pnpm exec vitest run --tags-filter MTL101` runs the tests of one rule. A test checks that
  every tag used is declared.

### Changed

#### CLI

- BREAKING: template errors (`MTL017`, `MTL018`, `MTL019`, `MTL030`) are printed on the
  template file in lint runs, not in `--verify` only, and the run exits 1. The targets are
  still linted. See "Headings are matched by position" in
  [ADR 0014](docs/adr/0014-legacy-behaviour-catalogue.md).

#### Configuration

- BREAKING: the global alias file `approved_path.yml` is replaced by the config keys `aliases`
  and `approvedPaths`. See "Aliases and approved paths" in
  [ADR 0014](docs/adr/0014-legacy-behaviour-catalogue.md).

#### Rules

- `MTL610` reports a required heading of level 3 to 6 that is missing in the section of its
  parent. Its second message form is gone with `[presence:exist]`.
- `MTL616` no longer fires for a run of only required exact-text template headings with empty
  text (the template-body line `# [unique-headings-names]`); only `MTL601` reports it.

#### Syntax

- BREAKING: every heading level, H1 to H6, is now checked, and template heading levels are
  matched exactly: a template `## Context` is no longer satisfied by a target `# Context` or
  `### Context`. An untagged H3 to H6 template heading is now required in every target. A
  heading of level 3 to 6 with a template parent matches only inside the matched section of
  that parent (section scope). See "H3 and deeper headings are checked" in
  [ADR 0014](docs/adr/0014-legacy-behaviour-catalogue.md).
- BREAKING: headings are matched by position, not by search. The template headings of one
  level and scope take the target headings in order. An extra heading before or between
  template headings shifts the match, extras after the last one give the warning `MTL616`, and
  a swapped pair is `MTL601` with a hint. See "Headings are matched by position" in
  [ADR 0014](docs/adr/0014-legacy-behaviour-catalogue.md).
- BREAKING: `{int}` is renamed `{digits}`. `{int}` is now an unknown placeholder (`MTL014`).
  See "Other changes for heading tags" in [ADR 0014](docs/adr/0014-legacy-behaviour-catalogue.md).
- BREAKING: order tags `[order:ascending]` and `[order:descending]` compare the heading text,
  not a number inside it. Use `[order:first:number|date|semver:...]` to order by a value. See
  "Other changes for heading tags" in [ADR 0014](docs/adr/0014-legacy-behaviour-catalogue.md).
- BREAKING: the `{text}` case formats `snakecase`, `camelcase`, `screamcase` and `kebabcase`
  refuse digits-only text and need at least one letter. Use `{digits}` for such text. See
  "Other changes for heading tags" in [ADR 0014](docs/adr/0014-legacy-behaviour-catalogue.md).

### Removed

#### Rules

- Rule `MTL602` (heading-level-missing). The code is reserved and never reused.

#### Syntax

- BREAKING: the `[presence:exist]` tag. Use a heading pattern such as `[pattern:"{text}"]`.
  See "The `exist` presence tag is removed" in [ADR 0014](docs/adr/0014-legacy-behaviour-catalogue.md).
- BREAKING: the `type=<name>` hint in frontmatter comments. A field type is now given by
  a field value equal to the type name or by a bracket such as `[date]`; the text `type=<name>`
  in a comment is plain text. See [spec.md](docs/spec.md), section 2.4.

#### Tooling

- The parity harness, the corpus and the legacy wrappers.
- The `pending-rules.json` allow-list of rules without a test. Every rule now has tests.

## [0.1.0] - 2026-10-29

Virtual release. It stands for the legacy tools that 0.2.0 replaces. They were never tagged or
published.

### Added

- A Python linter that checks one Markdown file against one template: frontmatter fields with
  types and formats, headings, presence and bounds of sections, and file-system checks.
- PowerShell wrappers per project, each with a table of template and target pairs, that called
  the linter once per file.
- A global alias file `approved_path.yml` for the paths a template may read.

[0.2.1]: https://github.com/m21-cerutti/md-template-lint/compare/0.2.0...0.2.1
[0.2.0]: https://github.com/m21-cerutti/md-template-lint/compare/0.1.0...0.2.0
[0.1.0]: https://github.com/m21-cerutti/md-template-lint/releases/tag/0.1.0
