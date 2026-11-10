---
title: AGENTS.md
last_updated: 2026-10-30
---

# AGENTS.md

## Mandatory Instructions

- Never `git push` and never add a git remote. Pushing is a human step.
- Never commit secrets; verify against `.gitignore` before every commit.
- Run the quality gates below before every commit (once package.json exists).
- Tracking plan lives in `tmp/PLAN.md` (git-ignored). No root `PLAN.md`, no `TODO.md`, no `IDEA.md`.
- Mark a plan item done only after its verification passes.

## Behavioral Principles

- **Think Before Coding.** Don't assume. If a requirement has multiple
  interpretations, list them. If a simpler approach exists, say so.
- **Keep It Simple.** No unrequested features. No abstraction for one-off
  code. If 50 lines solve it, don't write 200.
- **Make Surgical Changes.** Only modify what is necessary. Don't touch code
  you don't understand. Don't improve unrelated files along the way.
- **Goal-Driven Execution.** Turn instructions into verifiable goals: "fix
  the bug" becomes "write a failing test, then make it pass".

## Do NOT

- Do NOT write tag regexes outside `grammar/*.g4` (`MdTemplateLexer.g4` lexer with region modes, `MdTemplateParser.g4` parser).
- Do NOT use `any` in TypeScript source.
- Do NOT add `.js`/`.mjs`/`.cjs` files except in `src/generated/`, `dist/`, `coverage/`, `node_modules/`, `tmp/`, `.git/`. Scripts are `.ts` only, erasable syntax (no enums, namespaces, parameter properties).
- Do NOT hand-edit `src/generated/`; run `pnpm run gen:parser` (empties and regenerates it) and verify with `pnpm run check:parser`.
- Do NOT ship personal paths or personal data in code, corpus or docs.
- Do NOT commit with `--no-verify`.
- Do NOT commit secrets, .env files, keys or tokens.

## Project Purpose

`md-template-lint` is a TypeScript/pnpm port of the Markdown template linter.
It checks Markdown instance files against Markdown templates, with a
per-project config and a lint-staged compatible CLI.

## Tech Stack and Key Tools

- **Language:** TypeScript, Node >=22.18 (ESM). Scripts and tool configs are `.ts` too (`node scripts/x.ts`, ADR 0004)
- **Package manager:** `pnpm` (package `md-template-lint`)
- **Parser:** ANTLR4 via `antlr-ng` and `antlr4ng`, split grammar `grammar/MdTemplateLexer.g4` + `grammar/MdTemplateParser.g4`, no Java
- **Build/Test:** `vitest`; type check `tsc` strict; lint and format scripts added in A1
- **Config:** per-project `md-template-lint.yml`
- **Owner and license:** GitHub `m21-cerutti`, MIT, Copyright (c) 2026 Marc CERUTTI

## Project Structure

- `grammar/` ANTLR lexer and parser grammars (`*.g4`) for every template tag.
- `src/rules/<category>.ts` one file per rule category, stable `MTLxxx` codes.
- `src/` engine core, config loader, runner, reporters, CLI.
- `legacy/` frozen snapshot of the Python linter and wrappers (parity reference).
- `tests/corpus/`, `tests/golden/` frozen corpus and golden outputs for the parity gate.
- `docs/` spec, architecture, ADRs, parity report; `templates/` doc templates.

## How to Build and Test

```bash
pnpm install --frozen-lockfile  # install dependencies
pnpm run gen:parser             # regenerate parser from the grammar
pnpm run check:parser           # fail if src/generated differs from the grammars
pnpm run typecheck              # tsc strict
pnpm test                       # vitest suite
pnpm run parity                 # parity gate vs legacy and wrappers
```

## Acceptance Criteria and Quality Gates

- Typecheck and test suite pass
- `pnpm run parity` exits 0 before any global install
- Changes documented (README, `docs/`, ADR for decisions)
- Commit message follows Conventional Commits
- No secrets committed (.env, keys, tokens)
- Escalate multi-file refactors and security-sensitive logic to Sonnet/Opus

## Error Handling and Recovery

- **Test failure:** find the root cause, fix, re-run before moving on.
- **Type or lint error:** fix at the source; do not silence the checker.
- **Missing information:** ask the user before guessing.
- **Same error twice:** escalate to a higher-tier model instead of retrying.

## Agent Workflow

1. **Plan:** break multi-step work into items tracked in `tmp/PLAN.md`.
2. **Execute:** one phase at a time; commit only after verification passes.
3. **Verify:** run the build and test commands above.
4. **Document:** update README or `docs/` for non-obvious changes.

## References

- AI capability inventory (agents, skills, commands, tools): [docs/ai-capabilities.md](docs/ai-capabilities.md)
- Project configuration: `opencode.jsonc`
- OpenCode documentation: https://opencode.ai/v2/docs
