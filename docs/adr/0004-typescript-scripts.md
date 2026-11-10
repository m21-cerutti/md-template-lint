---
id: 0004-typescript-scripts
title: TypeScript for scripts and tool configs, run by Node type stripping
status: accepted
date: 2026-10-30
deciders: [owner]
---

# ADR 0004: TypeScript for scripts and tool configs

Every script and tool config is TypeScript. Scripts run with `node scripts/x.ts`
(Node type stripping). `engines.node` is `>=22.18`.

> Superseded in part by [ADR 0007](0007-tsx-script-runner.md) (2026-10-30): scripts now run
> through `tsx` (`tsx scripts/x.ts`), not Node type stripping. TypeScript scripts, `jiti` for
> `eslint.config.ts` and `engines.node` `>=22.18` stand. The text below is the record of the
> original decision and still says `node scripts/x.ts`.
>
> The "erasable syntax only" script rule and the `erasableSyntaxOnly` option of
> `tsconfig.scripts.json` were lifted in phase A69 (2026-10-30): scripts run through `tsx`,
> which compiles enums, namespaces and parameter properties, so the rule no longer applies.
> Mentions of it below are historical record only.

## Context

The repository had three `.mjs` scripts (`scripts/gen-parser.mjs`,
`scripts/check-parser.mjs`, `scripts/new-rule.mjs`) and `eslint.config.js`, next to a
strict TypeScript code base. The scripts were not type-checked and used untyped
`JSON.parse` results and dynamic option keys.

Node type stripping runs `.ts` files directly. It is unflagged since Node 22.18 (and 23.6).
It removes type annotations only. It does not transform syntax, so enums, namespaces and
parameter properties fail at runtime. It does not rewrite import specifiers, so relative
imports need the `.ts` extension.

## Decision

- `scripts/gen-parser.ts`, `scripts/check-parser.ts`, `scripts/new-rule.ts` replace the
  `.mjs` files. Same behavior, strict types, no `any`. `package.json` scripts call
  `node scripts/<name>.ts`.
- **Runner: Node type stripping**, no `tsx`, no `ts-node`, no build step. No new
  dependency for scripts.
- **Engines: raised from `>=22` to `>=22.18`**, the first Node 22 release where type
  stripping needs no flag. Node 22.13 to 22.17 would need `--experimental-strip-types`.
- **Script rules:** erasable syntax only (no enums, namespaces, parameter properties),
  explicit `.ts` import extensions, `import type` for types (already required by
  `verbatimModuleSyntax`).
- **tsconfig:** `tsconfig.test.json` (used by `pnpm run typecheck`) includes `src`,
  `tests`, `scripts` and `eslint.config.ts`, with `allowImportingTsExtensions`.
  `tsconfig.scripts.json` re-checks `scripts` and `eslint.config.ts` with
  `erasableSyntaxOnly`. `pnpm run typecheck` runs both. `erasableSyntaxOnly` is not set
  in the base `tsconfig.json`: `src/` uses parameter properties (`src/tags/listeners.ts`,
  `src/tags/parser.ts`, `src/tags/visitors/hints.ts`) and is compiled by `tsc`, not
  stripped. `tsconfig.json` (the build) stays `src` only: including scripts would emit
  them into `dist/` and break `rootDir`.
- **ESLint config:** `eslint.config.ts`, loaded through the `jiti` devDependency
  (MIT licence, build-time only, not shipped). ESLint 10 on Node needs `jiti` (or the
  experimental `unstable_native_nodejs_ts_config` flag) to read a TypeScript config.
- **Guideline, not enforced:** no `.js`, `.mjs` or `.cjs` file outside `src/generated/`,
  `dist/`, `coverage/`, `node_modules/` and `tmp/` (git-ignored scratch). `pnpm run check:rules`
  does not check it (a stray-file check was removed); the rule lives in `AGENTS.md` and
  `CONTRIBUTING.md`, and review catches a violation.
- `.prettierrc.json` and the `tsconfig*.json` files stay JSON: they are data, not code.

## Consequences

- Scripts are type-checked by `pnpm run typecheck` and linted by `pnpm run lint`.
- Contributors need Node 22.18 or newer (the dev tools, not the shipped `dist/`, need it).
- A script that uses an enum or a parameter property fails twice: `tsc -p tsconfig.scripts.json` and Node itself.
- `node scripts/*.ts` is covered by the existing `node scripts/*` shell allow rule in `opencode.jsonc`.
- Editors without a TypeScript-aware ESLint loader need `jiti` installed (it is a devDependency).

## Alternatives considered

| Option                                          | Pros                                             | Cons                                                        | Verdict    |
| ----------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------- | ---------- |
| **Node type stripping**                         | No dependency, no build, same file typed and run | Erasable syntax only, `.ts` import extensions, Node >=22.18 | **Chosen** |
| `tsx`                                           | Full TypeScript, no syntax limits                | New dependency, second loader to maintain                   | Rejected   |
| `ts-node`                                       | Mature                                           | Slow, ESM friction, extra dependency                        | Rejected   |
| Compile scripts to `dist/` first                | Plain Node at run time                           | Extra build step before every script, stale output          | Rejected   |
| Keep `.mjs` with JSDoc types and `// @ts-check` | No engines change                                | Not TypeScript, weaker types, breaks the stated goal        | Rejected   |
| ESLint `unstable_native_nodejs_ts_config` flag  | No `jiti`                                        | Unstable flag, must be passed by every editor and CI call   | Rejected   |
