# Tests

The map of the test suite and of its fixtures. For the how-to (the helpers, the rule for new
cases, the gate order, the scripts) read [docs/guides/testing.md](../docs/guides/testing.md);
this file only says what exists and where. Runner: `vitest`. Tests never use the network and
never read a real configuration.

## Test families

| Family      | Path                                              | What it tests                                                                                              |
| ----------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| syntax      | `tests/syntax/syntax/<MTLxxx>-<name>.test.ts`     | One template-only code per file: `MTL001` to `MTL004`, `MTL010` to `MTL013`, `MTL015` and `MTL016`. A template run through `--verify`. |
| target      | `tests/target/<category>/<MTLxxx>-<name>.test.ts` | One code per file that needs a template and a target. The pair is checked and linted.                       |
| unit        | `tests/unit/`                                     | Engine, parser, config, runner, reporters, io, CLI, scripts and release packaging.                          |
| integration | `tests/integration/rule-set.test.ts`              | The full ordered diagnostic list of one many-tag template (spec 4.1 and 8.4).                               |
| consistency | `tests/consistency/`                              | No drift between grammar, visitors, AST kinds, rule files, code ranges, the spec and the fixture layout.    |
| helpers     | `tests/helpers/`                                  | Shared test code, not tests: `fixtures.ts`, `verify.ts`, `directives.ts`, `cli.ts`, `run.ts`, `io.ts`.      |

The phase of a rule decides its family: a template-only code (phase `parse` or `template`) is a
syntax test, every other code is a target test. `pnpm run check:rules` fails when a code has its
test or its fixtures in the wrong family.

### Target categories

`tests/target/` has one folder per rule category. The code range of each is in the spec
([docs/spec.md](../docs/spec.md), section 4.2).

| Folder                  | Codes in the folder                               |
| ----------------------- | ------------------------------------------------- |
| `tests/target/syntax/`  | `MTL020` to `MTL025` (disable directive problems) |
| `tests/target/filename/`| `MTL101`, `MTL102`                                |
| `tests/target/presence/`| `MTL201`, `MTL202`                                |
| `tests/target/format/`  | `MTL301` to `MTL309` (`MTL306` to `MTL309`: step `shape`) |
| `tests/target/bounds/`  | `MTL401` to `MTL407`                              |
| `tests/target/type/`    | `MTL501` to `MTL517`                              |
| `tests/target/heading/` | `MTL601` to `MTL604`, `MTL610` to `MTL612`        |
| `tests/target/content/` | `MTL701` to `MTL705`                              |
| `tests/target/io/`      | `MTL801` to `MTL805`                              |

`tests/target/syntax/` holds the directive codes that need a target; do not confuse it with
`tests/syntax/syntax/`, the template-only family. The run diagnostics `MTL901` and above are not
rules: their cases live in the config, runner and CLI unit tests.

### Unit tests

| Path                       | Content                                                                                        |
| -------------------------- | ---------------------------------------------------------------------------------------------- |
| `tests/unit/cli/`          | The CLI through `runCli` (`exit`, `format`, `list`, `schema`, `usage`, `verify`, `version`, `wiring`, `main`, `layout`, `list-large`, `list-root-case`), and `spawn.test.ts`, which runs the built `dist/cli.js` as a process. |
| `tests/unit/config/`       | Config loading: `bytes`, `discovery`, `glob`, `naming`, `paths`, `validate`.                    |
| `tests/unit/runner/`       | The runner: `broken`, `empty`, `excerpt`, `expand`, `inputs`, `io-wiring`, `parse`, `suppress`, `unreadable`, `walk`. |
| `tests/unit/reporters/`    | The output formats: `json`, `plain`, `pretty`, `excerpt`.                                       |
| `tests/unit/io/`           | The production `RuleIo` (`address`, `connect-guard`, `exists`, `probe`, `probe-behaviour`), with a fake network. |
| `tests/unit/smoke/`        | The `smoke:pack` and release script helpers (`helpers.test.ts`) and the GitHub Actions workflows plus the `package.json` publish settings (`workflows.test.ts`). |
| `tests/unit/*.test.ts`     | Engine and parser: `anchors`, `content-whitespace`, `directives`, `document`, `engine`, `listeners`, `listeners-defensive`, `parser-comment-line`, `pipeline`, `regions`, `registry`, `sections`, `subheadings-tag`, `suppression`, `tags`, `values`, `visitors`. Scaffold: `new-rule` (`pnpm run new:rule`). Research spikes on the `yaml` package: `yaml-explore`, `yaml-spike`. |

### Consistency tests

`pnpm run check:rules` is `vitest run tests/consistency`. Files: `rules.test.ts` (grammar,
visitors, types, ranges, rule files and the spec code table agree), `rule-fixtures.test.ts` (the
fixture layout check, run on the repository and on small in-memory trees), with their helpers
`consistency.ts` and `rule-fixtures.ts`. `pending-rules.json` is the allow-list of spec codes that
are not implemented yet.

## Fixtures

All fixtures are under `tests/fixtures/`. A test asserts that its fixture folder holds exactly its
cases, so a fixture without a case fails the run.

| Folder                          | Used by                                   | Content                                                                              |
| ------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------ |
| `tests/fixtures/templates/`     | syntax tests                              | `<MTLxxx>/<case>.md`: one template per case, no target.                              |
| `tests/fixtures/pairs/`         | target tests                              | `<MTLxxx>/<case>/template.md` and `target.md`: one pair per case.                    |
| `tests/fixtures/rule-controls/` | target tests                              | `<MTLxxx>-<name>/`: controls outside the pass/fail split (for example "no tag, no diagnostic"). Today: `MTL101-no-filename-tag`. |
| `tests/fixtures/integration/`   | `tests/integration/rule-set.test.ts`      | `<case>/template.md` and `target.md` of the many-tag template.                       |
| `tests/fixtures/config/`        | `tests/unit/config/`                      | Projects with an `md-template-lint.yml` (groups `validate-`, `discover-`, `naming-`).|
| `tests/fixtures/runner/`        | `tests/unit/runner/`, `tests/unit/reporters/` | Projects with config, templates, targets and `expected.*` output files (groups `inputs-`, `empty-`, `broken-`, `parse-`, `suppress-`, `excerpt-`, `expand-`, `io-`, `unreadable-`, `report-`). |
| `tests/fixtures/cli/`           | `tests/unit/cli/`                         | Projects run through the CLI (groups `exit-`, `list-`, `verify-`, `schema-`, `format-`, `wiring-`, `usage-`, `suppress-`, `large-`). |
| `tests/fixtures/directives/`    | `tests/unit/directives.test.ts`           | `<case>/document.md`: documents for the disable directive parser.                    |
| `tests/fixtures/suppression/`   | `tests/unit/suppression.test.ts`          | `<case>/template.md` and `target.md`: suppression by disable directives.             |
| `tests/fixtures/tags/`          | `tests/unit/parser-comment-line.test.ts`  | `<case>/document.md`: frontmatter comment lines and key comments of the parser.      |
| `tests/fixtures/release/`       | `tests/unit/smoke/helpers.test.ts`        | JSON and tarball listings of the packaging checks, in `consumer/`, `manifest/`, `repository/` and `tarball/`. |
| `tests/fixtures/smoke/`         | `tests/unit/smoke/helpers.test.ts`, `pnpm run smoke:pack` | `clean-project/`: the synthetic project that `smoke:pack` lints with the installed CLI. |

Bytes that cannot be a text fixture (invalid UTF-8, a BOM with CRLF, symbolic links) are built in
code in a temporary folder that the test removes.

### The `pass-` and `fail-` rule

A case is a fixture folder (or file) with a descriptive kebab-case name that starts with `pass-` or
`fail-`, for example `pass-all-required-present` and `fail-required-key-absent`. Never numbered.

- `pass-`: the input is accepted. The case expects no diagnostic of the code under test. Several
  `pass-` cases are welcome for limit cases (a value exactly on a bound).
- `fail-`: the input is refused. The case expects the diagnostic of the code under test, with its
  message and position. Each distinct failure gets its own `fail-` case.
- Every group has at least one `pass-` case and at least one `fail-` case.
- Unit-test groups put a group prefix first (`validate-`, `exit-`, `suppress-`, ...), then the case
  name, which starts with `pass-` or `fail-`. A few groups have no split (`discover-`, `naming-`,
  `expand-`, `io-`, `unreadable-`, `report-`).
- `rule-controls`, `smoke` and the `expected.*` files are outside the split.

The prefixes of `tests/fixtures/cli/` are checked by `KNOWN_PREFIXES` in
`tests/helpers/fixtures.ts`: a folder with an unknown prefix makes the test fail. The same file
defines `FixtureArea`, the areas that the helpers can address: `config`, `runner`, `cli`, `tags`,
`directives` and `suppression`.

### How fixtures map to rules

The folder name is the rule code. A rule `MTLxxx` has:

1. a test file `tests/target/<category>/MTLxxx-<name>.test.ts` (or `tests/syntax/<category>/` for a
   template-only code),
2. a fixture folder `tests/fixtures/pairs/MTLxxx/` (or `tests/fixtures/templates/MTLxxx/`),
3. a case table in the test file whose `name` entries equal the fixture listing, and the test file
   names its fixture folder as a quoted string.

The codes and their meaning are in the code table of the spec
([docs/spec.md](../docs/spec.md), section 4.3). `pnpm run check:rules` fails on a code with no test
or no fixture, a bad case name, a pair folder that is not exactly `template.md` and `target.md`, a
case table that differs from the fixture listing, and an orphan folder, case or test file.

## Running the tests

```bash
pnpm test                                  # the whole suite
pnpm exec vitest run <path>                # one file or one folder
pnpm exec vitest run <path> -t "<name>"    # one test, by name (substring or regex)
pnpm run check:rules                       # the consistency tests only
pnpm run coverage                          # the suite with v8 coverage
```

Examples:

```bash
pnpm exec vitest run tests/target/bounds/MTL401-count-min.test.ts
pnpm exec vitest run tests/unit
```

- `pnpm test` is `vitest run --passWithNoTests`.
- `pnpm run coverage` fails when lines, statements, functions or branches fall under 85% in the
  engine, rules and tags code (thresholds in `vitest.config.ts`). It is not part of the CI
  workflow (`.github/workflows/ci.yml`), so run it yourself when you change those folders.
- Run `pnpm run build` right before `pnpm test`. The process tests in
  `tests/unit/cli/spawn.test.ts` run the built `dist/cli.js` and skip themselves, with a message,
  when it is missing or older than a file in `src/`. A skipped spawn test is a green run that did
  not test the CLI process.
- `pnpm run smoke:pack` needs the network and is not a pre-commit gate.

The gates, in order, are in [docs/guides/testing.md](../docs/guides/testing.md#the-gates-in-order)
and in [CONTRIBUTING.md](../CONTRIBUTING.md#quality-gates).

## See also

- [docs/guides/testing.md](../docs/guides/testing.md): kinds of test, helpers, fixture rules, gates.
- [docs/guides/adding-a-rule.md](../docs/guides/adding-a-rule.md): the tests and fixtures of a new
  rule (step 6).
- [docs/spec.md](../docs/spec.md): the contract and the code table (4.3).
- [docs/architecture.md](../docs/architecture.md#tests-rule-cases): the layout tables.
- [CONTRIBUTING.md](../CONTRIBUTING.md#tests): the test rules for contributors.
