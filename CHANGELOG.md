---
last_updated: 2026-11-05
---

# Changelog

All notable changes to this project are listed here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-11-05

First release of the TypeScript port. It replaces the legacy Python linter and the
PowerShell wrappers (see [docs/migration.md](docs/migration.md)).

### Added

- CLI `md-template-lint` with the options `--config`, `--format`, `--quiet`, `--verify`,
  `--help` and `--version`, and the exit codes `0` clean, `1` lint failure or broken template,
  `2` usage, config or run error.
- Per-project config `md-template-lint.yml`: pairs of template and targets with `include` and
  `exclude` globs, `roots`, `templateRoot`, `aliases`, `approvedPaths` and `onEmpty`.
- Stable rule codes `MTLxxx`, grouped by category (syntax, filename, presence, format, bounds,
  type, heading, content, io, run diagnostics).
- `--verify`: parses the templates, prints their schema and the template warnings, and reads no
  target. It needs no config when template paths are given. A template with a template error
  (`MTL017`, `MTL018`, `MTL019`, `MTL030`) fails: `--verify` exits 1 when a template is broken
  or has such an error.
- Lint-staged mode: a list of files as arguments lints those files only; a file that matches no
  pair is skipped silently.
- Reporters `text` (default), `plain` and `json`, with the offending source line under each
  diagnostic.
- Disable directives in a file: `disable-line`, `disable-next-line`, `disable-file` and
  `begin disable` / `end disable` blocks.
- Packaging, CI and release: a `pnpm run smoke:pack` check of the tarball and a clean install,
  a CI workflow on three operating systems and a release workflow for a `v*` tag.
- Template tags on every heading level (H1 to H6).
- Heading patterns with placeholders and formats, for example
  `## Release [pattern:"[{semver}] - {date}"]`.
- Repeat tags `[repeat-rules:same-level]` and order tags `[order:...]`, including
  `[order:first:number|date|semver:...]`.
- Sub-heading tags `[content:subheadings:disallow]` and `[content:subheadings:no-extra]`.
- Tag `[unique-headings-names]`.
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
- `MTL010` warning `Comment line {line}: unknown tag {tag}` for an unknown `[tag]` in a
  standalone comment line of the template frontmatter (for example `# [todo]`). `--verify` only,
  never changes the exit code. There is no escape: write the note without square brackets. See
  "Bracketed words in frontmatter comments" in [docs/migration.md](docs/migration.md).
- `MTL601` message hint `found later at line N, out of order` when a sibling with the missing
  text comes later in the target.

### Changed

- BREAKING: every heading level, H1 to H6, is now checked, and template heading levels are
  matched exactly: a template `## Context` is no longer satisfied by a target `# Context` or
  `### Context`. An untagged H3 to H6 template heading is now required in every target. A
  heading of level 3 to 6 with a template parent matches only inside the matched section of
  that parent (section scope). See "H3 and deeper headings are checked" in
  [docs/migration.md](docs/migration.md).
- BREAKING: headings are matched by position, not by search. The template headings of one
  level and scope take the target headings in order. An extra heading before or between
  template headings shifts the match, extras after the last one give the warning `MTL616`, and
  a swapped pair is `MTL601` with a hint. See "Headings are matched by position" in
  [docs/migration.md](docs/migration.md).
- BREAKING: template errors (`MTL017`, `MTL018`, `MTL019`, `MTL030`) are printed on the
  template file in lint runs, not in `--verify` only, and the run exits 1. The targets are
  still linted. See "Headings are matched by position" in
  [docs/migration.md](docs/migration.md).
- `MTL610` reports a required heading of level 3 to 6 that is missing in the section of its
  parent. Its second message form is gone with `[presence:exist]`.
- `MTL616` no longer fires for a run of only required exact-text template headings with empty
  text (the template-body line `# [unique-headings-names]`); only `MTL601` reports it.
- BREAKING: `{int}` is renamed `{digits}`. `{int}` is now an unknown placeholder (`MTL014`).
  See "Other changes for heading tags" in [docs/migration.md](docs/migration.md).
- BREAKING: order tags `[order:ascending]` and `[order:descending]` compare the heading text,
  not a number inside it. Use `[order:first:number|date|semver:...]` to order by a value. See
  "Other changes for heading tags" in [docs/migration.md](docs/migration.md).
- BREAKING: the `{text}` case formats `snakecase`, `camelcase`, `screamcase` and `kebabcase`
  refuse digits-only text and need at least one letter. Use `{digits}` for such text. See
  "Other changes for heading tags" in [docs/migration.md](docs/migration.md).
- BREAKING: the global alias file `approved_path.yml` is replaced by the config keys `aliases`
  and `approvedPaths`. See "Aliases and approved paths" in
  [docs/migration.md](docs/migration.md).

### Removed

- BREAKING: the `[presence:exist]` tag. Use a heading pattern such as `[pattern:"{text}"]`.
  See "The `exist` presence tag is removed" in [docs/migration.md](docs/migration.md).
- Rule `MTL602` (heading-level-missing). The code is reserved and never reused.
- The parity harness, the corpus and the legacy wrappers.

[Unreleased]: https://github.com/m21-cerutti/md-template-lint/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/m21-cerutti/md-template-lint/releases/tag/v0.2.0
