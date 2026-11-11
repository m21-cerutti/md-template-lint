---
title: AI Capabilities
last_updated: 2026-11-11
---

# AI Capabilities

## Scope

Map of the AI capabilities configured for this repository. It is a map, not
the rulebook: [AGENTS.md](../AGENTS.md) and the executable configuration
(`opencode.jsonc`, CI, hooks) win on any conflict.

This repository has no project-local agent, skill, command or MCP server. What it
ships for AI-assisted work is the rulebook ([AGENTS.md](../AGENTS.md),
[AI_GUIDELINE.md](../AI_GUIDELINE.md)), the permission rules of `opencode.jsonc`, and the
tooling below (package scripts, helper scripts, hooks, CI) that agents run as quality gates.
Planned work is tracked in `tmp/PLAN.md` (git-ignored, local only). Something
listed there as planned may not exist yet; check the actual folder before
relying on it.

## Agents

Project agents live in `.opencode/agents/`.

| Agent | Role                              |
| ----- | --------------------------------- |
| None. | The folder does not exist (none). |

## Skills

Project skills live in `.opencode/skills/`.

| Skill | Purpose                           |
| ----- | --------------------------------- |
| None. | The folder does not exist (none). |

## Commands

Project commands live in `.opencode/commands/`.

| Command | Purpose                           |
| ------- | --------------------------------- |
| None.   | The folder does not exist (none). |

## Tools

Project tools live in `.opencode/tools/`. There are none; the table lists the tooling of the
repository instead (the gates an agent runs, from `package.json`, `.husky/`, `lint-staged.config.ts`
and `.github/workflows/`).

| Tool                                                         | Purpose                                                                                                                                               |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `typescript` (`tsc`)                                         | Compiles `src/` to `dist/` (`pnpm run build`) and type-checks sources, tests and scripts in strict mode (`pnpm run typecheck`).                       |
| `tsx`                                                        | Runs the TypeScript scripts of `scripts/` and `lint-staged.config.ts` without a build step ([ADR 0007](adr/0007-tsx-script-runner.md)).               |
| `vitest`, `@vitest/coverage-v8`                              | Test runner (`pnpm test`), the consistency checks (`pnpm run check:rules`) and the coverage gate (`pnpm run coverage`).                               |
| `antlr-ng`, `antlr4ng`                                       | Generates the parser from `grammar/*.g4` into `src/generated/` (`pnpm run gen:parser`, no Java); `antlr4ng` is the runtime the generated parser uses. |
| `eslint`, `@eslint/js`, `typescript-eslint`, `jiti`          | TypeScript lint (`pnpm run lint:ts`); `jiti` loads `eslint.config.ts`.                                                                                |
| `prettier`                                                   | Formatter (`pnpm run format`, `pnpm run format:check`); `.prettierignore` skips generated and fixture files.                                          |
| `markdownlint-cli2`                                          | Markdown style lint of every `*.md` (`pnpm run lint:md`), config in `.markdownlint-cli2.jsonc`.                                                       |
| `@ls-lint/ls-lint`                                           | File and folder name rules (`pnpm run lint:names`), config in `.ls-lint.yml`.                                                                         |
| `secretlint`, `@secretlint/secretlint-rule-preset-recommend` | Secret scan of all files (`pnpm run lint:secrets`), config in `.secretlintrc.json` and `.secretlintignore`.                                           |
| `husky`, `lint-staged`                                       | Git hooks (`prepare` installs them) and the staged-file runner. See the hooks table below.                                                            |
| `@commitlint/cli`, `@commitlint/config-conventional`         | Conventional Commits check on the commit message (`.commitlintrc.ts`).                                                                                |
| `@types/node`                                                | Node type definitions for the sources and scripts.                                                                                                    |
| `yaml`                                                       | Runtime dependency: parses frontmatter and the per-project `md-template-lint.yml`.                                                                    |
| `mdtl` / `md-template-lint` (`node dist/cli.js`)             | The product itself, used as a dogfood gate: lints this repository's docs against `templates/` with `md-template-lint.yml`.                            |

Git hooks (`.husky/`, installed by `pnpm run prepare`; never skip with `--no-verify`):

| Hook         | Runs                                                                                                                                                                                                                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pre-commit` | `pnpm run build` when `dist/cli.js` is missing or older than `src/` or `grammar/`, then `lint-staged`, then `pnpm test`. `lint-staged.config.ts` runs `prettier --write`, `eslint --fix`, `secretlint`, `ls-lint`, `markdownlint-cli2` and `node dist/cli.js --quiet` on the staged files. |
| `commit-msg` | `commitlint --edit` (Conventional Commits).                                                                                                                                                                                                                                                |

CI workflows (`.github/workflows/`, no secrets):

| Workflow      | Runs                                                                                                                                                                                                                                          |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ci.yml`      | On push to `main` and on pull requests, on three operating systems and three Node versions: install, `check:parser`, `check:syntax-doc`, `check:rules`, `typecheck`, `lint`, `format:check`, `test`, `build`, and `smoke:pack` on Linux only. |
| `release.yml` | On a tag `X.Y.Z` (and as a dry run on manual dispatch): the same gates, pack, smoke test of that tarball, then npm publish with Trusted Publishing (OIDC) and provenance. See [ADR 0005](adr/0005-packaging-and-release.md).                  |

## Scripts

CLI entry points live in `scripts/`. The commands below are every script of `package.json`.

| Script                      | Purpose                                                                                                                          |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm run prepare`          | `husky`: installs the git hooks after `pnpm install`.                                                                            |
| `pnpm run build`            | `tsc -p tsconfig.json`: compiles `src/` to `dist/`.                                                                              |
| `pnpm run prepack`          | Runs `build` before `pnpm pack` or publish.                                                                                      |
| `pnpm run typecheck`        | `tsc -p tsconfig.test.json`: strict type check of sources, tests and scripts.                                                    |
| `pnpm test`                 | `vitest run --passWithNoTests`: the full test suite.                                                                             |
| `pnpm run coverage`         | `vitest run --coverage`: the suite with the 85% coverage gate for `src/engine`, `src/rules` and `src/tags`.                      |
| `pnpm run check:rules`      | `vitest run tests/consistency`: grammar, visitors, AST kinds, code ranges, spec rows, fixtures and syntax reference notes agree. |
| `pnpm run check:parser`     | `tsx scripts/check-parser.ts`: fails when `src/generated/` differs from what the grammars produce.                               |
| `pnpm run gen:parser`       | `tsx scripts/gen-parser.ts`: empties and regenerates `src/generated/` from `grammar/*.g4` with antlr-ng.                         |
| `pnpm run gen:syntax-doc`   | `tsx scripts/syntax-doc/generate.ts write`: rewrites the generated blocks of `docs/syntax-reference.md`.                         |
| `pnpm run check:syntax-doc` | `tsx scripts/syntax-doc/generate.ts check`: fails when `docs/syntax-reference.md` is stale.                                      |
| `pnpm run new:rule`         | `tsx scripts/new-rule.ts`: scaffolds a rule stub, its test stub and fixtures ([guide](guides/adding-a-rule.md)).                 |
| `pnpm run smoke:pack`       | `tsx scripts/smoke-pack.ts`: packs, installs the tarball in a clean directory and runs the installed CLI.                        |
| `pnpm run lint`             | Runs `lint:ts`, `lint:md`, `lint:names` and `lint:secrets` in this order.                                                        |
| `pnpm run lint:ts`          | `eslint .`.                                                                                                                      |
| `pnpm run lint:md`          | `markdownlint-cli2 "**/*.md"`.                                                                                                   |
| `pnpm run lint:names`       | `ls-lint`: file and folder naming.                                                                                               |
| `pnpm run lint:secrets`     | `secretlint "**/*"`: secret scan.                                                                                                |
| `pnpm run format`           | `prettier --write .`: rewrites the whole tree.                                                                                   |
| `pnpm run format:check`     | `prettier --check .`.                                                                                                            |

Files in `scripts/` that `package.json` does not name directly:

| File                             | Purpose                                                                                                                                                                                                                            |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/write-escaped.ts`       | `node scripts/write-escaped.ts <path> '<escaped text>'`: writes a fixture from escape sequences (control characters); limited to `tests/fixtures/` and `tmp/` ([guide](guides/adding-a-rule.md#fixtures-with-control-characters)). |
| `scripts/smoke/check-release.ts` | Used by `release.yml`: fails when the pushed tag differs from the package version or the repository.                                                                                                                               |
| `scripts/smoke/helpers.ts`       | Pure decisions of the pack smoke test and the release check (unit tested).                                                                                                                                                         |
| `scripts/syntax-doc/generate.ts` | Generator behind `gen:syntax-doc` and `check:syntax-doc`.                                                                                                                                                                          |
| `scripts/syntax-doc/notes.ts`    | Hand-written `FIX_NOTES`, `TAG_NOTES` and `TAG_FIXTURES` for the syntax reference (`check:rules` fails on a missing or orphan entry).                                                                                              |

## MCP Servers

Declared in `opencode.jsonc`.

| Server | Enabled | Purpose                         |
| ------ | ------- | ------------------------------- |
| None.  | no      | `opencode.jsonc` declares none. |

### Permissions (`opencode.jsonc`)

`opencode.jsonc` holds only permission rules (no agent, model or MCP entry). Last match wins, and
the secret guard stays last:

| Area                                    | Rule                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Outside the repo                        | `external_directory` denied.                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `edit`                                  | Ask by default, `*.md` allowed. Denied: `.env` files, `.kdbx`, `*.vault_password*`, `*credential*`, `*secret*`, `.pem`, `.key`, `id_rsa` and `id_ed25519` keys, and `ssh` folders (`*.env.example` allowed).                                                                                                                                                                                                                                                                    |
| `read`                                  | Allowed; the same secret-like paths denied (`*.env.example` allowed).                                                                                                                                                                                                                                                                                                                                                                                                           |
| `glob`                                  | Allowed; the same secret-like paths denied (`*.env.example` allowed).                                                                                                                                                                                                                                                                                                                                                                                                           |
| `webfetch`, `websearch`                 | Denied.                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `question`, `grep`, `subagent`, `skill` | Allowed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `shell` default                         | Ask.                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `shell` allowed                         | Basic file tools (`echo`, `ls`, `dir`, `cd`, `mkdir`, `cat`, `head`, `tail`, `wc`, `find`, `findstr`, `grep`, `rg`, `diff`, `pwd`, `which`) and read-only PowerShell cmdlets (`Get-Content`, `Get-ChildItem`, `Get-Item`, `Select-String`, `Test-Path`, `Write-Output`, `Get-Command`, `Compare-Object`).                                                                                                                                                                       |
| `shell` allowed: git                    | `add`, `commit`, `status`, `log`, `diff`, `show`, `branch`, `switch`, `check-ignore`, `ls-files`, `rev-parse`. `git switch` with a force or discard flag asks.                                                                                                                                                                                                                                                                                                                  |
| `shell` allowed: node, pnpm             | `node --version`, `node dist/*`, `node scripts/*`; `pnpm --version`, `pnpm install` (also `--frozen-lockfile`), `pnpm run *`, `pnpm test*`, `pnpm pack*`, `pnpm ls*`, `pnpm list *`, `pnpm why *`, and `pnpm exec` for `vitest`, `tsc`, `eslint`, `prettier`, `antlr-ng` and `tsx scripts/*`.                                                                                                                                                                                   |
| `shell` denied                          | `rm`, `find ... -exec`, `Remove-Item` with a recursive flag; `git push`, `git remote add`, `git remote set-url`, and `git` with `--no-index`, `--output`, `--ext-diff` or `--textconv`; `pnpm *publish*` (any `pnpm` command containing `publish`, which covers `pnpm publish`, `pnpm -r publish` and `pnpm --filter * publish`), `npm publish*`, `pnpm dlx*`, `pnpm exec npm*`; inline evaluation: `node -e`, `--eval`, `-p`, `--print` and the same flags of `pnpm exec tsx`. |
| `shell` secret guard (last rule)        | Denies any command that names `.env`, `secret`, `credential`, `.pem`, `.key`, `id_rsa`, `id_ed25519`, `vault_password`, `.kdbx` or `.ssh/`, and beats every allow above.                                                                                                                                                                                                                                                                                                        |

A local, git-ignored `.opencode/opencode.jsonc` adds personal rules (nested shell and global install
asks); it is not part of the repository.

## Global Capabilities

Global agents, skills, commands and MCPs are configured per user, outside this repository, and are not duplicated here. If you keep a global inventory, see that one.

## Verification

Validate the capability definitions after any change with the `opencode-lint` skill (command `/lint`).
With no project-local capability, the repository gates (`pnpm run check:rules`, `pnpm run lint`,
`node dist/cli.js`) are the check that this file and the configuration stay consistent.
