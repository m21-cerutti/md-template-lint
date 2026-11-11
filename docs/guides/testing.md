---
title: "Guide: testing"
last_updated: 2026-11-11
---

# Guide: testing

What kinds of test the project has, where they live, how fixtures are named and checked, which
helpers exist, and the order of the gates. Test runner: `vitest` (`pnpm test` is
`vitest run --passWithNoTests`). Tests never use the network and never read a real configuration.

Related: [Adding a rule](adding-a-rule.md) (the tests of a new rule, written first: step 4),
[fixtures and case names](#fixtures-and-case-names) (the layout),
[CONTRIBUTING.md](../../CONTRIBUTING.md#tests), [glossary](../glossary.md).

<!-- prettier-ignore-start -->
<!-- omit in toc -->
## Summary
<!-- prettier-ignore-end -->

- [The five kinds of test](#the-five-kinds-of-test)
- [Fixtures and case names](#fixtures-and-case-names)
- [Helpers](#helpers)
- [Running tests](#running-tests)
- [The gates, in order](#the-gates-in-order)
- [Scripts](#scripts)
- [Who writes the tests](#who-writes-the-tests)
- [See also](#see-also)

## The five kinds of test

| Kind             | Path                                              | Tests                                                                                                                                                                        | Fixtures                                                               | How it runs the code                                                                   |
| ---------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Syntax test      | `tests/syntax/<category>/<MTLxxx>-<name>.test.ts` | One template-only code (phase `parse` or `template`: `MTL001`-`MTL004`, `MTL010`-`MTL019`, `MTL030`; a template error `MTL017`, `MTL018`, `MTL019` or `MTL030` gives exit 1) | `tests/fixtures/templates/<MTLxxx>/<case>.md`: one template, no target | `md-template-lint --verify --format json <case>.md` through `runCli` (`verifyFixture`) |
| Target test      | `tests/target/<category>/<MTLxxx>-<name>.test.ts` | One code that needs a template AND a target (phase `field` or `target`: `MTL020`-`MTL025`, `MTL101`-`MTL805`)                                                                | `tests/fixtures/pairs/<MTLxxx>/<case>/template.md` and `target.md`     | `checkTemplate` then `checkTarget` (or `lintTarget`) of `src/engine/pipeline.ts`       |
| Unit test        | `tests/unit/**`                                   | Config, runner, reporters, io, CLI, parser, visitors, directives, suppression, packaging                                                                                     | `tests/fixtures/<area>/<group>-<case>/`                                | The function under test, or `runCli` with an injected environment                      |
| Integration test | `tests/integration/rule-set.test.ts`              | The full ordered diagnostic list of one many-tag template (cross-tag order, spec 4.1, 8.4)                                                                                   | `tests/fixtures/integration/`                                          | `checkTemplate` and `checkTarget` with the real registry and an in-memory env          |
| Consistency test | `tests/consistency/`                              | No drift between grammar, visitors, AST kinds, rule files, ranges, spec codes, and the fixture layout                                                                        | The repository itself                                                  | `pnpm run check:rules`                                                                 |

A syntax test and a target test differ only in what the rule needs: a template-only code has no
target to lint, so its test is a template run through `--verify`; every other code is linted as a
pair. The phase of the rule decides the family
(`tests/consistency/rule-fixtures.ts`, `familyOf`), and `check:rules` fails when a code has its test or
fixtures in the wrong family.

The run diagnostics `MTL901` to `MTL923` are not rules (no registry entry, no rule file, no
`tests/syntax` or `tests/target` file). Their cases live with the config, runner and CLI tests under
`tests/unit/config/`, `tests/unit/runner/` and `tests/unit/cli/`.

## Fixtures and case names

- A case is a fixture folder (or file) with a descriptive kebab-case name prefixed `pass-` or `fail-`:
  `pass-all-required-present`, `fail-required-key-absent`. Never numbered (`fail-1` is rejected).
- Every group has at least one `pass-` and at least one `fail-` case. There is no upper bound: several
  `pass-` cases are welcome for limit cases (a value exactly on a bound). Silent branches go in `pass-`
  fixtures; each distinct failure gets its own `fail-` fixture.
- One fixture per case. The test file holds a table that maps the case name to the expected result; no
  case text is written inline in the test (the parser unit tests of `tests/unit/tags.test.ts` are the
  exception: they parse short strings).
- The test asserts that its fixture directory holds exactly its cases, so a fixture without a case (an
  orphan) fails. `check:rules` enforces it for the rule tests.
- Groups of unit-test fixtures share a prefix, then the case name: `inputs-`, `empty-`, `broken-`,
  `parse-`, `suppress-`, `excerpt-` (runner), `validate-` (config), `exit-`, `list-`, `verify-`,
  `schema-`, `format-`, `wiring-`, `usage-`, `large-` (cli). Inside a group the case names start with `pass-`
  or `fail-`, except groups with no pass/fail split (`discover-`, `naming-`, `expand-`, `io-`,
  `unreadable-`, `report-`).
- Fixture areas under `tests/fixtures/`: `pairs` and `templates` (rule cases), `rule-controls`
  (controls outside the split, named by the test of their code), `cli`, `config`, `runner`,
  `directives`, `suppression`, `tags` (unit tests), `integration`, `release` (JSON and tarball listings
  of the packaging tests) and `smoke` (the synthetic project of `pnpm run smoke:pack`).
- Bytes that cannot be a text fixture (invalid UTF-8, a BOM with CRLF, symbolic links) are built in
  code in a temporary folder that the test removes.
- Expected-output files (`expected.*`) are written from the spec 8.2 and 8.5 samples, not generated
  from the code under test.

What the layout check refuses (`pnpm run check:rules`, `tests/consistency/rule-fixtures.ts`): a code with
no test file or no fixture folder; a case name that does not start with `pass-` or `fail-`, is not
kebab-case or is numbered; a pair folder that is not exactly `template.md` and `target.md`; a case
table (the `name: "..."` entries outside comments) that differs from the fixture listing; a test file
that does not name its fixture folder as a quoted string; an orphan fixture folder, case or test file.

## Helpers

| Helper                                                                                                                | File                          | Use                                                                                                                                                                                                                               |
| --------------------------------------------------------------------------------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `expectSplit(area, prefix, cases)`                                                                                    | `tests/helpers/fixtures.ts`   | At least 1 `pass-` and 1 `fail-` case, and the fixture directories of `area` that start with `prefix` equal the cases. With `prefix` `""` the directories are the case names themselves (as in `tests/unit/suppression.test.ts`). |
| `expectNameSplit(cases)`                                                                                              | `tests/helpers/fixtures.ts`   | The same split rule on the names alone, for a group whose cases need no folder each.                                                                                                                                              |
| `fixturePath(area, name)`, `readFixture(area, name, file)`, `fixtureDirs(area, prefix)`                               | `tests/helpers/fixtures.ts`   | Absolute fixture paths, a fixture file as text, the sorted directory names of a group.                                                                                                                                            |
| `KNOWN_PREFIXES`, `strayNames`                                                                                        | `tests/helpers/fixtures.ts`   | `fixtureDirs` throws on a directory of `tests/fixtures/cli/` with an unknown group prefix, so a misspelled prefix cannot hide a fixture.                                                                                          |
| `REPO_ROOT`, `TSX_CLI`                                                                                                | `tests/helpers/fixtures.ts`   | The repository root; the tsx CLI file to spawn a script (see [Scripts](#scripts)).                                                                                                                                                |
| `verifyFixture(code, name)`, `expectTemplateCases(code, cases)`                                                       | `tests/helpers/verify.ts`     | A syntax test: run `--verify` on a template fixture; check the split, that each `fail-` case yields the code, and the folder listing.                                                                                             |
| `findingsOf(dir, name, code)`, `expectCases(dir, cases)`, `expectDirectiveRule(code, name)`, `at(line, column, text)` | `tests/helpers/directives.ts` | The target tests of `MTL020` to `MTL025`.                                                                                                                                                                                         |
| `runCliIn`, `parseJson`, `lintedOf`, `fixtureFile`                                                                    | `tests/helpers/cli.ts`        | Run `runCli` in a fixture project; read its JSON output.                                                                                                                                                                          |
| `runFixture`, `lintedFiles`                                                                                           | `tests/helpers/run.ts`        | Run the runner on a fixture project with fake io.                                                                                                                                                                                 |
| `fakeFetch`, `fakeResolve`, `status`, `hang`                                                                          | `tests/helpers/io.ts`         | Fake network for the `src/io/` tests: no socket, no DNS.                                                                                                                                                                          |
| `createEnv`, `createMemoryIo`                                                                                         | `src/engine/rule.ts`          | An in-memory `RuleEnv` and `RuleIo` for a rule or pipeline test.                                                                                                                                                                  |

`expectCases` of `tests/helpers/directives.ts` is the directive tests' own helper (it checks `Found`
messages and positions); the general split check is `expectSplit` or `expectNameSplit`. The rule tests
of the other categories keep the split check in the test file itself (compare
`tests/target/bounds/MTL401-count-min.test.ts`).

## Running tests

```bash
pnpm exec vitest run tests/target/bounds/MTL401-count-min.test.ts
pnpm exec vitest run tests/unit
pnpm exec vitest run --tags-filter MTL101
pnpm exec vitest run --tags-filter heading
pnpm test
pnpm run check:rules
pnpm run coverage
```

The families (syntax, target, unit, integration, consistency, smoke, fixtures) and the commands to
run each are in [tests/README.md](../../tests/README.md#test-families). Running one error code or
one family by tag (`--tags-filter`), and the tags a new rule test must declare, are in
[tests/README.md](../../tests/README.md#run-one-error-code-or-family).

`pnpm run check:rules` is `vitest run tests/consistency`. `pnpm run coverage` runs the whole suite with
v8 coverage and fails when lines, statements, functions or branches fall under 85% in `src/engine/**`,
`src/rules/**`, `src/tags/**` or `src/tags/*.ts`; `src/generated/**` and `src/cli.ts` are excluded
(`vitest.config.ts`). Thresholds are never lowered.

## The gates, in order

Run them one at a time, each must exit 0, before a commit:

```bash
pnpm run check:parser
pnpm run check:rules
pnpm run check:syntax-doc
pnpm run typecheck
pnpm run lint
pnpm run format:check
pnpm run build
pnpm test
```

`pnpm run build` must run RIGHT BEFORE `pnpm test` when you run the gates by hand (CI runs `pnpm test`
first, then `pnpm run build`, on a fresh checkout where `dist/` does not exist yet). The process tests (`tests/unit/cli/spawn.test.ts`)
run the built `dist/cli.js`, and they skip themselves with a message when `dist/cli.js` is missing or
older than the newest `src/**.ts` file (a stale build would test yesterday's code). A skipped spawn test
is a green run that did not test the CLI process: build again after every change in `src/`, then run
`pnpm test`.

| Gate                        | Checks                                                                                                                  |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `pnpm run check:parser`     | `src/generated/` equals what the grammars generate.                                                                     |
| `pnpm run check:rules`      | The consistency tests of `tests/consistency/`.                                                                          |
| `pnpm run check:syntax-doc` | `docs/syntax-reference.md` equals what `scripts/syntax-doc/generate.ts` generates (`pnpm run gen:syntax-doc` rewrites). |
| `pnpm run typecheck`        | `tsc` strict on the sources, tests, scripts and root configs (`tsconfig.test.json`).                                    |
| `pnpm run lint`             | All linters in order: `lint:ts`, `lint:md`, `lint:names`, `lint:secrets`; stops at the first failure.                   |
| `pnpm run lint:ts`          | ESLint.                                                                                                                 |
| `pnpm run lint:md`          | markdownlint-cli2 on the Markdown files.                                                                                |
| `pnpm run lint:names`       | ls-lint, file and directory names.                                                                                      |
| `pnpm run lint:secrets`     | secretlint on every file.                                                                                               |
| `pnpm run format:check`     | Prettier (`pnpm run format` rewrites).                                                                                  |
| `pnpm run build`            | `tsc -p tsconfig.json` to `dist/`.                                                                                      |
| `pnpm test`                 | The whole vitest suite.                                                                                                 |

`pnpm run smoke:pack` (pack, check the tarball, install it in a clean directory, run the installed CLI)
needs the network and is not a pre-commit gate ([ADR 0005](../adr/0005-packaging-and-release.md)).

## Scripts

The repository scripts are TypeScript in `scripts/` and run through `tsx`, a devDependency
([ADR 0007](../adr/0007-tsx-script-runner.md)): `tsx scripts/<name>.ts`. Use the package scripts
(`gen:parser`, `check:parser`, `gen:syntax-doc`, `check:syntax-doc`, `new:rule`, `smoke:pack`); to run one by hand use
`pnpm exec tsx scripts/<name>.ts`. Scripts may use any TypeScript syntax (enums, namespaces and
parameter properties included), since `tsx` compiles them.

A test that spawns a script runs `process.execPath` with the tsx CLI file `TSX_CLI` of
`tests/helpers/fixtures.ts` (no shell, no `.cmd` shim, same on Windows and POSIX), as
`tests/unit/new-rule.test.ts` does for `scripts/new-rule.ts` with `--root` in a temporary tree.
Scratch scripts (a token dump, an experiment) go in `tmp/`, which is git-ignored.

## Who writes the tests

The agent or person who writes the tests should not be the one who wrote the code under test: a test
written from the code only proves the code does what it does. Write the case table from the spec
([spec.md 4.3](../spec.md#43-code-table)), not from the implementation.

## See also

- [Adding a rule](adding-a-rule.md), [Adding a tag](adding-a-tag.md),
  [Grammar and listeners](grammar-and-listeners.md).
- [architecture.md: runner and config](../architecture.md#runner-and-config)
  and [consistency check](../architecture.md#consistency-check).
- [CONTRIBUTING.md](../../CONTRIBUTING.md#quality-gates), [glossary](../glossary.md).
