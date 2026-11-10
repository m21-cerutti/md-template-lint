---
title: Documentation index
last_updated: 2026-10-30
---

# Documentation index

Everything under `docs/`, by purpose. The project README is [../README.md](../README.md) (install,
usage, rule syntax, config reference); the contributor entry point is [../CONTRIBUTING.md](../CONTRIBUTING.md).
Start with the [architecture](architecture.md) and the [glossary](glossary.md).

## Contract and design

| File                                  | What it is                                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------------------------- |
| [spec.md](spec.md)                    | The contract: tags, types, rule codes, disable directives, config, CLI, output. The spec wins over every other doc. |
| [architecture.md](architecture.md)    | Layers and dependency rules, where each code range lives, extension points, run flow, lexer modes, rule contract, diagnostics, the five Mermaid diagrams. |
| [glossary.md](glossary.md)            | The terms of the code and the docs, alphabetical, each with a link.                         |

## Guides (how to change the code)

| File                                                      | What it is                                                                        |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [guides/adding-a-rule.md](guides/adding-a-rule.md)        | Step by step: spec row, `pnpm run new:rule`, check, fixtures, test, gates.        |
| [guides/adding-a-tag.md](guides/adding-a-tag.md)          | The five places of a new template tag, with a worked example and the checks.      |
| [guides/grammar-and-listeners.md](guides/grammar-and-listeners.md) | The two grammars, the two parse stages, lexer modes, visitors, listeners, directives in the parser, the generated parser. |
| [guides/testing.md](guides/testing.md)                    | Syntax, target, unit, integration and consistency tests, fixtures, helpers, the gate order, scripts. |
| [../tests/README.md](../tests/README.md)                  | The map of the test suite: families, folders, fixtures, the `pass-` / `fail-` rule, how to run them. |
| [adding-a-rule.md](adding-a-rule.md)                      | The earlier single-file guide (scaffold flags in detail); the new home of the steps is the guide above. |
| [migration.md](migration.md)                              | Replace the legacy wrappers and `approved_path.yml` with one `md-template-lint.yml`. |

## Decisions (ADRs)

Process: [../CONTRIBUTING.md](../CONTRIBUTING.md#decisions-adr-process).

| File                                                              | Decision                                                      |
| ----------------------------------------------------------------- | ------------------------------------------------------------- |
| [adr/0001-genesis.md](adr/0001-genesis.md)                        | Port the Markdown template linter to a TypeScript npm package. |
| [adr/0002-grammar-structure.md](adr/0002-grammar-structure.md)    | Split lexer and parser grammars, lexer modes, per-family visitors. |
| [adr/0003-pnpm.md](adr/0003-pnpm.md)                              | pnpm as the exclusive package manager.                        |
| [adr/0004-typescript-scripts.md](adr/0004-typescript-scripts.md)  | TypeScript for scripts and tool configs (the runner is superseded in part by ADR 0007). |
| [adr/0005-packaging-and-release.md](adr/0005-packaging-and-release.md) | Ship `dist` only, test the tarball, publish with Trusted Publishing. |
| [adr/0006-parity-reached.md](adr/0006-parity-reached.md)          | Parity with the legacy linter is reached; the comparison tooling is removed. |
| [adr/0007-tsx-script-runner.md](adr/0007-tsx-script-runner.md)    | Run the TypeScript scripts through `tsx`.                     |
| [adr/0008-generated-parser-licence.md](adr/0008-generated-parser-licence.md) | The generated parser shipped in `dist` is released under MIT. |

## Research notes (history)

| File                                                      | What it is                                                       |
| --------------------------------------------------------- | ---------------------------------------------------------------- |
| [research/yaml-spike.md](research/yaml-spike.md)          | Spike on binding a frontmatter comment to its key with the `yaml` package. |
| [research/wrapper-parity.md](research/wrapper-parity.md)  | What the legacy linter and its wrappers did (phase A1 record).   |

## Tooling

| File                                          | What it is                                                                   |
| --------------------------------------------- | ---------------------------------------------------------------------------- |
| [ai-capabilities.md](ai-capabilities.md)      | Map of the AI agents, skills, commands and tools configured for the repository. |

## Templates

Document templates in [../templates/](../templates/); check one with `md-template-lint --verify <file>`.

| File                                                                  | For                                                         |
| --------------------------------------------------------------------- | ----------------------------------------------------------- |
| [../templates/adr.template.md](../templates/adr.template.md)          | Architecture decision record (`deciders` optional).         |
| [../templates/bug.template.md](../templates/bug.template.md)          | Bug report with upstream link, minimal example, expected vs result table. |
| [../templates/TODO.template.md](../templates/TODO.template.md)        | `TODO.md`: epics with Phase/Tasks/Prio/Deps/Status/Notes/Subagent/Tier tables. |
| [../templates/spec-product.template.md](../templates/spec-product.template.md) | Product specification: what, not how.              |
| [../templates/spec-technical.template.md](../templates/spec-technical.template.md) | Technical specification: the contract.         |
| [../templates/architecture.template.md](../templates/architecture.template.md) | Architecture overview with a mermaid diagram, legend and discrepancies. |
| [../templates/IDEA.template.md](../templates/IDEA.template.md)        | `IDEA.md`: vision and dated idea list.                      |
| [../templates/ai-capabilities.template.md](../templates/ai-capabilities.template.md) | Map of the AI agents, skills, commands and tools. |
| [../templates/CHANGELOG.template.md](../templates/CHANGELOG.template.md) | `CHANGELOG.md`: Keep a Changelog groups (Added, Changed, Deprecated, Removed, Fixed, Security). |
| [../templates/README.template.md](../templates/README.template.md)    | `README.md`: project name, installation, usage, development, license. |
| [../templates/ai/](../templates/ai/)                                  | AI configuration templates, listed below.                   |
| [../templates/ai/AGENTS.template.md](../templates/ai/AGENTS.template.md) | `AGENTS.md`: rules, stack, build and test, quality gates for coding agents. |
| [../templates/ai/agent.template.md](../templates/ai/agent.template.md) | Agent definition: description, mode, model, permissions, role, task, format. |
| [../templates/ai/SKILL.template.md](../templates/ai/SKILL.template.md) | Skill: name, description, when to use, steps, resources.    |
| [../templates/ai/command.template.md](../templates/ai/command.template.md) | Slash command: description, agent, model, prompt with `$ARGUMENTS`. |

## Which doc for which question

| You want to                                   | Read                                                                   |
| --------------------------------------------- | ---------------------------------------------------------------------- |
| Know what a code or a tag means               | [spec.md](spec.md) (4.3 code table, 2 tags)                            |
| Understand how a run works                    | [architecture.md](architecture.md) (sequence diagram, run flow)        |
| Add a rule or a tag                           | [guides/adding-a-rule.md](guides/adding-a-rule.md), [guides/adding-a-tag.md](guides/adding-a-tag.md) |
| Change the grammar or a directive             | [guides/grammar-and-listeners.md](guides/grammar-and-listeners.md)     |
| Write or run tests                            | [guides/testing.md](guides/testing.md), [../tests/README.md](../tests/README.md) |
| Look up a word                                | [glossary.md](glossary.md)                                             |
