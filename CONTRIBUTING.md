---
last_updated: 2026-11-11
---

# Contributing

Thank you for helping `md-template-lint`. This page explains how to report a problem, propose a change and get a pull request merged. The project rules for AI agents are in [AGENTS.md](AGENTS.md); they apply to people too.

<!-- prettier-ignore-start -->
<!-- omit in toc -->
## Summary
<!-- prettier-ignore-end -->

- [Overview](#overview)
- [Ways to contribute](#ways-to-contribute)
- [Issue first](#issue-first)
- [Fork and pull request workflow](#fork-and-pull-request-workflow)
  - [Hierarchy](#hierarchy)
- [Setup](#setup)
  - [Development](#development)
- [Quality gates](#quality-gates)
  - [Tests](#tests)
  - [Code guidelines](#code-guidelines)
- [Project-specific changes](#project-specific-changes)
  - [Decisions (ADR process)](#decisions-adr-process)
  - [Documentation](#documentation)
- [Generated code](#generated-code)
- [Commit style](#commit-style)
- [Pull request checklist](#pull-request-checklist)
- [AI-assisted contributions](#ai-assisted-contributions)
- [Review and response time](#review-and-response-time)
- [Security reports](#security-reports)
- [License and conduct](#license-and-conduct)

## Overview

Start here: open an issue first, fork the repository, make the change on a branch of your fork, and open a pull request against `main`. Run the quality gates before you open it, and disclose any AI assistance.

## Ways to contribute

- **Bug:** open a [bug report](https://github.com/m21-cerutti/md-template-lint/issues/new/choose) with a minimal way to reproduce it.
- **Question:** ask in [GitHub Discussions](https://github.com/m21-cerutti/md-template-lint/discussions), not in the issue tracker.
- **Feature:** open a feature request and wait for it to be accepted.
- **New rule or error code:** open a `rule_request` issue (form in `.github/ISSUE_TEMPLATE/rule_request.yml`), see [Decisions (ADR process)](#decisions-adr-process).
- **Documentation:** fix or improve a page, and open a pull request.

## Issue first

New features, new rules and behavior changes need an accepted issue before a pull request. A pull request without one may be closed. Small fixes (a typo, a broken link) may skip this step.

## Fork and pull request workflow

1. Fork the repository on GitHub and clone your fork.
2. Create a branch from `main`: `feat/<topic>` or `fix/<topic>`.
3. Keep your fork in sync with the upstream repository.
4. Open the pull request against `main` from your fork. Nobody pushes to the upstream repository directly, and there are no direct branches in it.
5. Maintainers merge the pull request. Adding a git remote to the upstream repository, pushing to it and publishing to npm are maintainer steps.

### Hierarchy

```bash
grammar/                    # ANTLR lexer and parser grammars: the only place for tag syntax
src/                        # sources of the tool
  generated/                # parser generated from grammar/ (never edited by hand)
  engine/                   # pipeline, rule registry, template loading, values
  rules/                    # one file per rule category, stable MTLxxx codes
  tags/                     # tag AST, parser wrapper and visitors
  config/                   # md-template-lint.yml loader
  runner/                   # file discovery, pairs, verify mode
  reporters/                # text and JSON output
  io/                       # file, http and https probes ([io:exists])
  cli/                      # argument parsing and the mdtl command
tests/                      # vitest suites (see tests/INDEX.md)
  target/                   # one test file per rule (template + target)
  syntax/                   # one test file per template syntax code
  consistency/              # check:rules: grammar, rules, fixtures and spec agree
  unit/                     # config, runner, reporters, io, CLI, smoke
  fixtures/                 # one folder or file per case
docs/                       # spec, architecture, guides, ADRs (index: docs/INDEX.md)
  adr/                      # architecture decision records
  guides/                   # adding a rule or a tag, testing, grammar
templates/                  # this repository's own template variants (CHANGELOG, README, research-note, spec-technical), also linted against
  generic/                  # reusable templates, copy and adapt (see templates/INDEX.md)
scripts/                    # TypeScript scripts run with tsx (parser, syntax doc, pack smoke)
.github/                    # CI and release workflows, issue forms
.husky/                     # git hooks: pre-commit and commit-msg
.lintstagedrc.json          # what the pre-commit hook runs on staged files
md-template-lint.yml        # this repository lints its own docs against templates/ and templates/generic/
opencode.jsonc              # AI agent permissions, see AI_GUIDELINE.md
AGENTS.md                   # project rules for AI agents
AI_GUIDELINE.md             # policy for AI-assisted contributions
CHANGELOG.md                # user-visible changes
THIRD_PARTY_NOTICES.md      # licences of bundled third-party code
dist/                       # build output (git-ignored)
tmp/                        # scratch space (git-ignored)
```

Start with [docs/architecture.md](docs/architecture.md) and the contract [docs/spec.md](docs/spec.md). When code and spec disagree, fix one of them in the same change. The index of all the docs is [docs/INDEX.md](docs/INDEX.md).

## Setup

Requirements: Node >= 22.18 and pnpm (the exact version is in the `packageManager` field of `package.json`, see [ADR 0003](docs/adr/0003-pnpm.md)). No Java is needed: the parser is generated with `antlr-ng`.

```bash
pnpm install --frozen-lockfile
pnpm run build
node dist/cli.js --help
```

### Development

`pnpm install` installs the git hooks (the `prepare` script runs `husky`). Never skip a hook with `--no-verify`: fix the finding instead.

At commit time, `.husky/pre-commit` rebuilds `dist/` when it is missing or older than `src/` or `grammar/`, then runs `lint-staged` (configured in the static JSON file `.lintstagedrc.json`: a glob maps to a list of commands, no function logic), then `ls-lint`, and then the full suite (`pnpm test`). A failing check blocks the commit. `.husky/commit-msg` runs commitlint on the message. `lint-staged` runs the commands of one glob in order, formatters first, on the staged files. It appends the files as separate absolute paths and starts no shell, so a file name cannot be read as an option.

| Staged files                       | Commands                                                                                                   |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `.ts`, `.mts`, `.cts`              | `prettier --write` (fixes and re-stages the files), `eslint --fix --no-warn-ignored`, then `secretlint`    |
| `.md`                              | `prettier --write`, `secretlint`, `markdownlint-cli2`, then `node dist/cli.js --quiet` (`mdtl` self-check) |
| `.json`, `.jsonc`, `.yml`, `.yaml` | `prettier --write`, then `secretlint`                                                                      |
| any other file                     | `secretlint` (reads `.secretlintignore`)                                                                   |

`.husky/pre-commit` then runs `pnpm exec ls-lint` (file name cases). It checks the whole project and takes no file arguments, so it is a hook line and not a `lint-staged` command.

JSON has no comments, so the exclusions are documented here. `src/generated/`, `tests/fixtures/`, `docs/syntax-reference.md` and `docs/proposals/` must not reach the tools, and `lint-staged` hands every staged file to its commands, so each tool ignores them itself: prettier through `.prettierignore`, eslint through `ignores` in `eslint.config.ts`, markdownlint-cli2 through `ignores` in `.markdownlint-cli2.jsonc`, and `mdtl` because no pair of `md-template-lint.yml` includes them (a file that matches no pair is skipped). `secretlint` keeps checking them, apart from what `.secretlintignore` lists. A new excluded path goes into each of these files.

Run each tool by hand, on the whole project or on one file:

| Tool                     | Whole project                                                                | One file or area                                                                   |
| ------------------------ | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| prettier                 | `pnpm run format:check` (`pnpm run format` writes)                           | `pnpm exec prettier --write <file>`                                                |
| eslint                   | `pnpm run lint:ts`                                                           | `pnpm exec eslint <file>`                                                          |
| secretlint               | `pnpm run lint:secrets`                                                      | `pnpm exec secretlint <file>`                                                      |
| ls-lint                  | `pnpm run lint:names`                                                        | not per file, it always checks the project                                         |
| markdownlint-cli2        | `pnpm run lint:md`                                                           | `pnpm exec markdownlint-cli2 <file>`                                               |
| mdtl (docs vs templates) | `pnpm run build`, then `node dist/cli.js --quiet`                            | `node dist/cli.js --quiet <file>`                                                  |
| vitest                   | `pnpm test`                                                                  | `pnpm exec vitest run <test file>`, `pnpm exec vitest related --run <source file>` |
| tsc                      | `pnpm run typecheck`                                                         | not per file                                                                       |
| consistency checks       | `pnpm run check:rules`, `pnpm run check:parser`, `pnpm run check:syntax-doc` | not per file                                                                       |
| commitlint               | `pnpm exec commitlint --from HEAD~1`                                         | checks the last commit message                                                     |

`pnpm run lint` runs eslint, markdownlint, ls-lint and secretlint in one go.

Maintaining `scripts/syntax-doc/notes.ts`: this file is hand-written prose that `pnpm run gen:syntax-doc` renders into `docs/syntax-reference.md` next to the generated tables. `pnpm run check:rules` enforces it: a rule code with no `FIX_NOTES` entry, a tag family with no `TAG_NOTES` entry, or an orphan entry for a code or family that no longer exists, fails the check. Add or remove the entry in the same change as the rule or tag, then run `pnpm run gen:syntax-doc` and commit the result. The steps are in [Adding a rule](docs/guides/adding-a-rule.md) (`FIX_NOTES`) and [Adding a tag](docs/guides/adding-a-tag.md) (`TAG_NOTES`).

## Quality gates

Run all of them before you open a pull request. Each must exit 0.

| Command                     | What it checks                                                                         |
| --------------------------- | -------------------------------------------------------------------------------------- |
| `pnpm run check:parser`     | `src/generated/` matches the grammars (no stale or hand-edited parser).                |
| `pnpm run check:rules`      | Consistency of grammar, visitors, AST kinds, rule files, code ranges and the spec.     |
| `pnpm run check:syntax-doc` | `docs/syntax-reference.md` matches its generator (`pnpm run gen:syntax-doc` rewrites). |
| `pnpm run typecheck`        | `tsc` strict, for the sources, tests and scripts.                                      |
| `pnpm run lint`             | ESLint, markdownlint, ls-lint and secretlint.                                          |
| `pnpm run format:check`     | Prettier (`pnpm run format` rewrites).                                                 |
| `pnpm test`                 | The vitest suite.                                                                      |
| `pnpm run build`            | Compiles to `dist/`.                                                                   |

Optional, needs the network, run by CI and the release workflow (not a pre-commit gate):

| Command               | What it checks                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------- |
| `pnpm run smoke:pack` | Packs, checks the tarball content, installs it in a clean temp dir, runs the installed CLI. |

`pnpm run coverage` runs the suite with coverage; it fails under 85% in the engine, rules and tags code. Thresholds are never lowered.

If a gate fails, find the root cause and fix it at the source. Do not silence a checker and do not commit with `--no-verify`. A type or lint error that appears twice is a signal to stop and rethink, not to retry.

The repository also lints its own docs against `templates/` and `templates/generic/` with `md-template-lint.yml`; keep that run at exit 0. How to run it: [README](README.md#this-repository-lints-its-own-docs).

`pnpm run smoke:pack` is optional because `pnpm add` fetches `yaml` and `antlr4ng`; add `-- --offline` when the pnpm store is warm, or `-- --tarball <file>` to test a tarball that already exists. CI runs the gates on three operating systems and Node 22.18, 24 and 26; a tag `X.Y.Z` (no `v` prefix) publishes after the owner approves the `release` environment. See [ADR 0005](docs/adr/0005-packaging-and-release.md).

### Tests

Review of the tests happens in the pull request. The map of the test families and fixtures is [tests/INDEX.md](tests/INDEX.md); the how-to is [docs/guides/testing.md](docs/guides/testing.md). Test and fixture layout:

| Path                                              | Content                                                             |
| ------------------------------------------------- | ------------------------------------------------------------------- |
| `tests/target/<category>/<MTLxxx>-<name>.test.ts` | One test file per target rule (template + target).                  |
| `tests/fixtures/pairs/<MTLxxx>/<case>/`           | `template.md` and `target.md` of one case of that rule.             |
| `tests/syntax/<category>/<MTLxxx>-<name>.test.ts` | One test file per template syntax code, run through `--verify`.     |
| `tests/fixtures/templates/<MTLxxx>/<case>.md`     | The one template of one case of that code (no target).              |
| `tests/consistency/`                              | `pnpm run check:rules`, with the fixture coverage and orphan check. |
| `tests/unit/`                                     | Config, runner, reporters, io, CLI and smoke tests.                 |
| `tests/fixtures/smoke/clean-project/`             | Synthetic project linted by `pnpm run smoke:pack`.                  |

The rule for cases (fixture folders and files):

- Names are descriptive kebab-case, prefixed `pass-` or `fail-`, for example `pass-all-required-present` and `fail-required-key-absent`. Never numbered.
- At least one `pass-` case and at least one `fail-` case per rule or group, any number of each: several `pass-` cases are welcome to test limit cases.
- One fixture per case, no case text inline in the test.
- The test asserts that the fixture folder holds exactly its cases; `check:rules` fails on an orphan fixture.
- Tests never touch the network: inject a fake `io`.

Details per area are in [docs/architecture.md](docs/architecture.md), sections "Tests: rule cases" and "Tests of config, runner, reporters and io".

### Code guidelines

- TypeScript everywhere: sources, tests, scripts (`scripts/*.ts`, run with `tsx`, [ADR 0007](docs/adr/0007-tsx-script-runner.md)) and tool configs (`eslint.config.ts`, `.commitlintrc.ts`; [ADR 0004](docs/adr/0004-typescript-scripts.md)). Scripts may use any TypeScript syntax.
- Do not use `any`.
- Do not add `.js`, `.mjs` or `.cjs` files except in `src/generated/`, `dist/`, `coverage/`, `node_modules/` and `tmp/`. No check enforces this, so review catches it.
- Write tag regexes only in `grammar/MdTemplateLexer.g4` and `grammar/MdTemplateParser.g4`, never anywhere else.
- Do not hand-edit `src/generated/`; regenerate it from the grammars.
- Do not ship personal paths or personal data in code, tests or docs.
- Keep changes surgical: no unrequested feature, no refactor of unrelated files.

## Project-specific changes

Adding a rule: see [docs/guides/adding-a-rule.md](docs/guides/adding-a-rule.md): the spec row, `pnpm run new:rule -- <category> <name>`, the fixtures and a failing test first, then the implementation in `src/rules/<category>.ts`, and the gates. A new template tag (the five places to touch) is in [docs/guides/adding-a-tag.md](docs/guides/adding-a-tag.md). A rule or tag change includes the code, the tests, the `notes.ts` entry, the docs and a changelog entry.

### Decisions (ADR process)

A new rule starts with an issue: use the `rule_request` issue form. Once the issue is accepted, a decision that shapes the design (a dependency, a grammar structure, a convention, a new rule family) gets an Architecture Decision Record in `docs/adr/`, proposed in the pull request:

1. Copy [templates/generic/adr.template.md](templates/generic/adr.template.md) to `docs/adr/NNNN-short-title.md` (next free number, kebab-case file name). The `id` equals the file name stem.
2. Fill the frontmatter (`status` starts at `proposed`) and the sections Context, Decision, Consequences and Alternatives considered (keep at least one rejected option). Delete the authoring checklist and every tag marker before saving.
3. Flip `status` to `accepted` once the decision is live, or to `rejected` if turned down (`deprecated` when retired). When a record replaces an older one, set `supersedes` and mark the old record `superseded`.

Existing records start at [0001-genesis](docs/adr/0001-genesis.md). A change to the behaviour contract also updates [docs/spec.md](docs/spec.md) in the same commit.

### Documentation

Update the docs in the same change as the code: the README (usage, rule tables, config reference), [docs/spec.md](docs/spec.md) (contract), [docs/architecture.md](docs/architecture.md), and [ADR 0014](docs/adr/0014-legacy-behaviour-catalogue.md) when behaviour changes for users of the legacy tools. Keep `docs/ai-capabilities.md` in sync when you add or change an AI agent, skill, command or tool.

- Document templates: `templates/generic/` holds the reusable ones (copy and adapt); `templates/` holds this repository's own four variants (CHANGELOG, README, research-note and spec-technical). See [templates/INDEX.md](templates/INDEX.md).
- The list under a `Summary` heading marked `<!-- omit in toc -->` is a table of contents of levels 2 to 3. Do not edit it by hand: it is maintained with the VS Code extension [Markdown All in One](https://marketplace.visualstudio.com/items?itemName=yzhang.markdown-all-in-one) (recommended in `.vscode/extensions.json`), command "Markdown All in One: Update Table of Contents", with the levels (`markdown.extension.toc.levels`: `2..3`) and update on save set in the tracked `.vscode/settings.json`.

## Generated code

`src/generated/` is generated from `grammar/MdTemplateLexer.g4` and `grammar/MdTemplateParser.g4`. After a grammar change run `pnpm run gen:parser`, commit the output, and verify with `pnpm run check:parser`. Never hand-edit `src/generated/`. `docs/syntax-reference.md` is generated too: `pnpm run gen:syntax-doc` rewrites it and `pnpm run check:syntax-doc` verifies it.

## Commit style

Use [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): subject`, with a body only when the reason is not obvious. Subject in the imperative, at most about 50 characters. One concern per commit.

```text
feat(rules): add count-exact
```

Add an `Assisted-by: <tool>` trailer when an AI tool helped.

## Pull request checklist

- The pull request links an accepted issue.
- Tests cover the change.
- Documentation is updated.
- `CHANGELOG.md` has an entry under `[Unreleased]` for user-visible changes.
- All quality gates pass.
- AI assistance is disclosed, see the section below.

## AI-assisted contributions

Issues and pull requests created automatically by a bot, a script or an AI agent are rejected. AI tools are allowed to help a person: you must understand every line you submit, be able to explain it without the tool, and disclose the tool and the extent of its use. Read [AI_GUIDELINE.md](AI_GUIDELINE.md) for the full rules.

Optional tool setup (plugins, settings, terse-output tool) is in [Recommended opencode setup](AI_GUIDELINE.md#recommended-opencode-setup). It is not required to contribute.

## Review and response time

Maintainers answer when they can; there is no fixed delay. A pull request that nobody asked for, or with no activity, may be closed. You can reopen it when you are ready to continue.

## Security reports

Report a vulnerability to the repository owner privately, never in a public issue. Also keep the code safe:

- Never commit secrets: no `.env` files, keys, tokens or credentials. Check `.gitignore` before every commit.
- Never put personal paths, names, emails or other personal data in code, fixtures or docs. Use relative paths and neutral placeholders.
- The config file is trusted input, documents are not: `[io:exists]` probes only `http`/`https`, refuses internal addresses by default and follows no redirect. Keep those guards when you touch `src/io/` (see the "Production RuleIo" section of [docs/architecture.md](docs/architecture.md)).

## License and conduct

By contributing you agree that your contribution is licensed under the MIT license of the project (see [LICENSE](LICENSE)). Be respectful in issues, pull requests and discussions.
