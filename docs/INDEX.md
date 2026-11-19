---
title: Documentation index
last_updated: 2026-11-19
---

# Documentation index

Everything under `docs/`, by purpose. The project README is [../README.md](../README.md) (install,
usage, rule syntax, config reference); the contributor entry point is [../CONTRIBUTING.md](../CONTRIBUTING.md).
Start with the [architecture](architecture.md) and the [glossary](glossary.md).

## Contract and design

| File                               | What it is                                                                                                                                                |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [spec.md](spec.md)                 | The contract: tags, types, rule codes, disable directives, config, CLI, output. The spec wins over every other doc.                                       |
| [architecture.md](architecture.md) | Layers and dependency rules, where each code range lives, extension points, run flow, lexer modes, rule contract, diagnostics, the five Mermaid diagrams. |
| [glossary.md](glossary.md)         | The terms of the code and the docs, grouped by theme, each with a link.                                                                                   |
| [grammar.md](grammar.md)           | How headings are read (extraction, tag peeling, exact levels, section body) and the heading terms: parent, scope, sequence, match, extra, checked.        |

## Guides (how to change the code)

| File                                                               | What it is                                                                                                                                                                                                                     |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [guides/adding-a-rule.md](guides/adding-a-rule.md)                 | Step by step: spec row, `pnpm run new:rule`, fixtures and a failing test first, then the check, gates; category table, scaffold flags, `write-escaped`.                                                                        |
| [guides/adding-a-tag.md](guides/adding-a-tag.md)                   | The five places of a new template tag, tests first, with a worked example and the checks.                                                                                                                                      |
| [guides/grammar-and-listeners.md](guides/grammar-and-listeners.md) | The two grammars, the two parse stages, lexer modes, visitors, listeners, directives in the parser, the generated parser.                                                                                                      |
| [guides/testing.md](guides/testing.md)                             | Syntax, target, unit, integration and consistency tests, fixtures, helpers, the gate order, scripts.                                                                                                                           |
| [../tests/INDEX.md](../tests/INDEX.md)                             | The map of the test suite: families, folders, fixtures, the `pass-` / `fail-` rule, how to run them.                                                                                                                           |
| [syntax-reference.md](syntax-reference.md)                         | Reference for writing templates: tag forms, heading patterns, type hints, disable directives with a complete example, error codes, enums. The tag, type hint, error and enum tables are generated (`pnpm run gen:syntax-doc`). |
| [cli.md](cli.md)                                                   | The command line: flags, exit codes, output formats, `--verify`, file arguments, path and backslash handling.                                                                                                                  |
| [configuration.md](configuration.md)                               | The `md-template-lint.yml` file: every key with type and default, pairs, paths, globs, `onEmpty`, the `io` options (`approvedPaths`, `aliases`, `allowPrivateNetworks`).                                                       |

## Decisions (ADRs)

Process: [../CONTRIBUTING.md](../CONTRIBUTING.md#decisions-adr-process).

| File                                                                                                     | Decision                                                                                                                                                                                                                                                                         |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [adr/0001-genesis.md](adr/0001-genesis.md)                                                               | Port the Markdown template linter to a TypeScript npm package.                                                                                                                                                                                                                   |
| [adr/0002-grammar-structure.md](adr/0002-grammar-structure.md)                                           | Split lexer and parser grammars, lexer modes, per-family visitors.                                                                                                                                                                                                               |
| [adr/0003-pnpm.md](adr/0003-pnpm.md)                                                                     | pnpm as the exclusive package manager.                                                                                                                                                                                                                                           |
| [adr/0004-typescript-scripts.md](adr/0004-typescript-scripts.md)                                         | TypeScript for scripts and tool configs (the runner is superseded in part by ADR 0007).                                                                                                                                                                                          |
| [adr/0005-packaging-and-release.md](adr/0005-packaging-and-release.md)                                   | Ship `dist` only, test the tarball, publish with Trusted Publishing.                                                                                                                                                                                                             |
| [adr/0006-parity-reached.md](adr/0006-parity-reached.md)                                                 | Parity with the legacy linter is reached; the comparison tooling is removed.                                                                                                                                                                                                     |
| [adr/0007-tsx-script-runner.md](adr/0007-tsx-script-runner.md)                                           | Run the TypeScript scripts through `tsx`.                                                                                                                                                                                                                                        |
| [adr/0008-generated-parser-licence.md](adr/0008-generated-parser-licence.md)                             | The generated parser shipped in `dist` is released under MIT.                                                                                                                                                                                                                    |
| [adr/0009-all-heading-levels.md](adr/0009-all-heading-levels.md)                                         | Every heading level is checked, levels match exactly, `[content:subheadings:disallow]` opt-out.                                                                                                                                                                                  |
| [adr/0010-field-formats.md](adr/0010-field-formats.md)                                                   | `[format:semver]` and `[format:date]` on frontmatter fields; `--verify` warns on a date field without format.                                                                                                                                                                    |
| [adr/0011-heading-patterns.md](adr/0011-heading-patterns.md)                                             | `[pattern:"..."]`, `[repeat-rules:same-level]` and `[order:...]` on headings (`MTL014`, `MTL605` to `MTL609`, `MTL614`, `MTL617`, `MTL017`, `MTL018`); placeholder formats and `{char}`; `{digits}`, first-semver order, order without repeat `MTL030`.                          |
| [adr/0012-positional-heading-matching.md](adr/0012-positional-heading-matching.md)                       | Headings match by position, as one adjacent run; `[content:subheadings:no-extra]` (`MTL615`); extra-heading warning (`MTL616`); `[presence:exist]` removed (now `MTL012`), `MTL602` retired and reserved, child order error `MTL019`, also for a parent with an invalid pattern. |
| [adr/0013-unique-headings-names.md](adr/0013-unique-headings-names.md)                                   | Opt-in `[unique-headings-names]`, template-wide or per heading: each later duplicate heading name is `MTL613` (implemented).                                                                                                                                                     |
| [adr/0014-legacy-behaviour-catalogue.md](adr/0014-legacy-behaviour-catalogue.md)                         | Legacy defects D01 to D18 and changes C01 to C14; replace the legacy wrappers and `approved_path.yml` with one `md-template-lint.yml`; the breaking changes of 0.2.0 and how to fix a template.                                                                                  |
| [adr/0015-optional-frontmatter.md](adr/0015-optional-frontmatter.md)                                     | Opt-in template frontmatter line: a target without frontmatter skips MTL001 and the field rules; misplaced tags are MTL031 (accepted).                                                                                                                                           |
| [adr/0016-ordered-read-ahead-and-sll-first-parse.md](adr/0016-ordered-read-ahead-and-sll-first-parse.md) | Read target files ahead but lint them in order; parse with SLL first, full LL on error (accepted).                                                                                                                                                                               |

## Research notes (history)

| File                                                     | What it is                                                                 |
| -------------------------------------------------------- | -------------------------------------------------------------------------- |
| [research/yaml-spike.md](research/yaml-spike.md)         | Spike on binding a frontmatter comment to its key with the `yaml` package. |
| [research/wrapper-parity.md](research/wrapper-parity.md) | What the legacy linter and its wrappers did (history record).              |

## Tooling

| File                                     | What it is                                                                               |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| [ai-capabilities.md](ai-capabilities.md) | Map of the AI agents, skills, commands, tools and scripts configured for the repository. |

## Templates

Document templates live in two folders, see [../templates/INDEX.md](../templates/INDEX.md). Check one with `md-template-lint --verify <file>`.

### Generic templates

Reusable skeletons in [../templates/generic/](../templates/generic/): copy one and adapt it. CONTRIBUTING, AI_GUIDELINE, THIRD_PARTY_NOTICES and architecture carry an optional `Summary` table of contents. The frontmatter of README, TODO and INDEX is optional.

| File                                                                                                         | For                                                                                             |
| ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| [../templates/generic/adr.template.md](../templates/generic/adr.template.md)                                 | Architecture decision record (`deciders` optional).                                             |
| [../templates/generic/bug.template.md](../templates/generic/bug.template.md)                                 | Bug report with upstream link, minimal example, expected vs result table.                       |
| [../templates/generic/TODO.template.md](../templates/generic/TODO.template.md)                               | `TODO.md`: epics with Phase/Tasks/Prio/Deps/Status/Notes/Subagent/Tier tables.                  |
| [../templates/generic/spec-product.template.md](../templates/generic/spec-product.template.md)               | Product specification: what, not how.                                                           |
| [../templates/generic/spec-technical.template.md](../templates/generic/spec-technical.template.md)           | Technical specification: the contract.                                                          |
| [../templates/generic/architecture.template.md](../templates/generic/architecture.template.md)               | Architecture overview with a mermaid diagram, legend and discrepancies.                         |
| [../templates/generic/IDEA.template.md](../templates/generic/IDEA.template.md)                               | `IDEA.md`: vision and dated idea list.                                                          |
| [../templates/generic/ai-capabilities.template.md](../templates/generic/ai-capabilities.template.md)         | Map of the AI agents, skills, commands and tools.                                               |
| [../templates/generic/CHANGELOG.template.md](../templates/generic/CHANGELOG.template.md)                     | `CHANGELOG.md`: Keep a Changelog groups (Added, Changed, Deprecated, Removed, Fixed, Security). |
| [../templates/generic/README.template.md](../templates/generic/README.template.md)                           | `README.md`: project name, installation, usage, development, license.                           |
| [../templates/generic/CONTRIBUTING.template.md](../templates/generic/CONTRIBUTING.template.md)               | `CONTRIBUTING.md`: how to report, fork, test, commit and open a pull request.                   |
| [../templates/generic/AI_GUIDELINE.template.md](../templates/generic/AI_GUIDELINE.template.md)               | `AI_GUIDELINE.md`: policy for AI-assisted contributions.                                        |
| [../templates/generic/THIRD_PARTY_NOTICES.template.md](../templates/generic/THIRD_PARTY_NOTICES.template.md) | `THIRD_PARTY_NOTICES.md`: licences of bundled third-party code, one block per package.          |
| [../templates/generic/research.template.md](../templates/generic/research.template.md)                       | Research note: question, sourced facts, cross-references, gaps, direct answer.                  |
| [../templates/generic/research-tech.template.md](../templates/generic/research-tech.template.md)             | Technical solution comparison: fit-first metrics table, one recommendation, alternatives.       |
| [../templates/generic/INDEX.template.md](../templates/generic/INDEX.template.md)                             | `INDEX.md` (or `README.md`) of a folder: its files grouped by purpose.                          |
| [../templates/generic/ai/](../templates/generic/ai/)                                                         | AI configuration templates, listed below.                                                       |
| [../templates/generic/ai/AGENTS.template.md](../templates/generic/ai/AGENTS.template.md)                     | `AGENTS.md`: rules, stack, build and test, quality gates for coding agents.                     |
| [../templates/generic/ai/agent.template.md](../templates/generic/ai/agent.template.md)                       | Agent definition: description, mode, model, permissions, role, task, format.                    |
| [../templates/generic/ai/SKILL.template.md](../templates/generic/ai/SKILL.template.md)                       | Skill: name, description, when to use, steps, resources.                                        |
| [../templates/generic/ai/command.template.md](../templates/generic/ai/command.template.md)                   | Slash command: description, agent, model, prompt with `$ARGUMENTS`.                             |

### Project variants

This repository's own variants in [../templates/](../templates/), used by `md-template-lint.yml`. Each one is fitted to a file of this repository and differs from its generic template as shown.

| File                                                                               | Difference from the generic template                                                                              |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| [../templates/CHANGELOG.template.md](../templates/CHANGELOG.template.md)           | Optional `Summary` table of contents and optional area headings (`Area`) inside the release groups.               |
| [../templates/README.template.md](../templates/README.template.md)                 | The sections of this README (Description, Configuration, Template syntax, Security, Documentation and so on).     |
| [../templates/research-note.template.md](../templates/research-note.template.md)   | Free-form history note: only the frontmatter (`title`, `last_updated`) and the H1 are fixed, no required section. |
| [../templates/spec-technical.template.md](../templates/spec-technical.template.md) | The numbered sections of `docs/spec.md` (Model, Template tags, Types, Lint pipeline, CLI, Output and so on).      |

## Which doc for which question

| You want to                       | Read                                                                                                 |
| --------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Know what a code or a tag means   | [spec.md](spec.md) (4.3 code table, 2 tags)                                                          |
| Understand how a run works        | [architecture.md](architecture.md) (sequence diagram, run flow)                                      |
| Add a rule or a tag               | [guides/adding-a-rule.md](guides/adding-a-rule.md), [guides/adding-a-tag.md](guides/adding-a-tag.md) |
| Change the grammar or a directive | [guides/grammar-and-listeners.md](guides/grammar-and-listeners.md)                                   |
| Write or run tests                | [guides/testing.md](guides/testing.md), [../tests/INDEX.md](../tests/INDEX.md)                       |
| Write a new template              | [syntax-reference.md](syntax-reference.md) (codes, tags, enums, disable directives)                  |
| Run the tool or read its output   | [cli.md](cli.md) (flags, exit codes, `--verify`)                                                     |
| Write the config file             | [configuration.md](configuration.md) (keys, pairs, paths, globs, `io` options)                       |
| Look up a word                    | [glossary.md](glossary.md)                                                                           |
