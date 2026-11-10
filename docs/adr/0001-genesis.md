---
id: 0001-genesis
title: Port the Markdown template linter to a TypeScript npm package
status: accepted
date: 2026-10-29
deciders: [owner]
---

# ADR

`md-template-lint` is a TypeScript/Node package that replaces the legacy Python Markdown template linter and its PowerShell wrappers, with an ANTLR grammar for the template tags.

## Context

The legacy linter lived in a fixed global skill folder on one machine. It is a Python script plus per-project `lint_markdown*.ps1` wrappers and an `approved_path.yml` file. Tag parsing uses regular expressions spread over the script. Each project copies its own wrapper with its template/target pairs. The tool cannot be installed once and used from lint-staged or CI on any machine. Several legacy defects exist and must be fixed and documented, while output stays at parity with the legacy linter and the wrappers.

## Decision

The linter is a TypeScript package named `md-template-lint` (MIT, Node >=22, ESM).

- The template tag syntax is one ANTLR4 grammar split into `grammar/MdTemplateLexer.g4` and `grammar/MdTemplateParser.g4` (ADR 0002), compiled to TypeScript with antlr-ng (no Java).
- Rules live in `src/rules/<category>.ts`, one file per category, with stable `MTLxxx` codes.
- Each project declares its pairs, aliases and approved roots in `md-template-lint.yml`. This replaces the wrappers and `approved_path.yml`.
- The CLI works with lint-staged and exits 0, 1 or 2.
- `pnpm run parity` compares the output with outputs captured from the legacy tools. It is the gate before the global install.
- The repository is meant to live as `m21-cerutti/markdown-template-linter` once the owner creates it. The plan lives in `tmp/PLAN.md` (git-ignored). The package is never pushed or published by agents.

## Consequences

- One installable tool replaces a copied wrapper in every project.
- Tag syntax has a single source of truth, the grammar, and a new rule without a new tag touches one category file. A rule that adds a tag touches five places (see ADR 0002).
- The legacy defects get documented decisions instead of silent behaviour.
- The legacy snapshot and frozen sample data must be kept to prove parity.
- Update 2026-10-30: parity was reached and the `pnpm run parity` tooling was removed, see [ADR 0006](0006-parity-reached.md). Phase A39 then removed the legacy snapshot and the frozen sample data (see ADR 0006).
- The ANTLR toolchain adds build dependencies and a generated parser to commit.
- GitHub repository, npm Trusted Publisher and first publish are manual steps.

## Alternatives considered

| Option | Pros | Cons | Verdict |
| --- | --- | --- | --- |
| TypeScript + ANTLR (antlr-ng) | split lexer and parser grammars (ADR 0002), typed AST, pnpm install (ADR 0003), no Java | build step, generated parser to maintain | Chosen |
| Keep Python script + wrappers | no work, already works | per-project copies, regex sprawl, no npm story | Rejected |
| TypeScript with hand-written regexes | no parser toolchain | repeats the legacy regex sprawl | Rejected |
