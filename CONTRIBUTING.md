# Contributing

Thanks for helping with `md-template-lint`, the TypeScript port of the Markdown
template linter. This guide covers the setup, the quality gates, the commit style, the
test layout and how to extend the tool. The project rules for AI agents are in
[AGENTS.md](AGENTS.md); they apply to people too.

## Setup

Requirements: Node >= 22.18 and pnpm (the exact version is in the `packageManager`
field of `package.json`, see [ADR 0003](docs/adr/0003-pnpm.md)). No Java is needed: the
parser is generated with `antlr-ng`.

```bash
pnpm install --frozen-lockfile
pnpm run build
node dist/cli.js --help
```

Layout: `grammar/` (ANTLR lexer and parser), `src/rules/<category>.ts` (one file per
rule category), `src/` (engine, config, runner, reporters, CLI), `tests/`, `docs/`
(spec, architecture, guides, ADRs), `templates/` (doc templates).
Start with [docs/architecture.md](docs/architecture.md) and the contract
[docs/spec.md](docs/spec.md). When code and spec disagree, fix one of them in the same
change. The index of all the docs is [docs/README.md](docs/README.md).

## Quality gates

Run all of them before a commit. Each must exit 0.

| Command                 | What it checks                                                                     |
| ----------------------- | ---------------------------------------------------------------------------------- |
| `pnpm run check:parser` | `src/generated/` matches the grammars (no stale or hand-edited parser).            |
| `pnpm run check:rules`  | Consistency of grammar, visitors, AST kinds, rule files, code ranges and the spec. |
| `pnpm run check:syntax-doc` | `docs/syntax-reference.md` matches its generator (`pnpm run gen:syntax-doc` rewrites). |
| `pnpm run typecheck`    | `tsc` strict, for the sources, tests and scripts.                                  |
| `pnpm run lint`         | ESLint.                                                                            |
| `pnpm run format:check` | Prettier (`pnpm run format` rewrites).                                             |
| `pnpm test`             | The vitest suite.                                                                  |
| `pnpm run build`        | Compiles to `dist/`.                                                               |

Optional, needs the network, run by CI and the release workflow (not a pre-commit gate):

| Command                | What it checks                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------- |
| `pnpm run smoke:pack`  | Packs, checks the tarball content, installs it in a clean temp dir, runs the installed CLI. |

`pnpm run coverage` runs the suite with coverage; it fails under 85% in the engine, rules
and tags code. Thresholds are never lowered.

If a gate fails, find the root cause and fix it at the source. Do not silence a checker
and do not commit with `--no-verify`. A type or lint error that appears twice is a signal
to stop and rethink, not to retry.

The repository also lints its own docs against `templates/` with `md-template-lint.yml`; keep
that run at exit 0. `.lintstagedrc.json` exists but is not wired to a hook. How to run it:
[README](README.md#this-repository-lints-its-own-docs).

`pnpm run smoke:pack` is optional because `pnpm add` fetches `yaml` and `antlr4ng`; add
`-- --offline` when the pnpm store is warm, or `-- --tarball <file>` to test a tarball that
already exists. CI runs the gates on three operating systems and Node 22.18, 24 and 26; a tag
`v*` publishes after the owner approves the `release` environment. See
[ADR 0005](docs/adr/0005-packaging-and-release.md).

## Commit style

[Conventional Commits](https://www.conventionalcommits.org/): `type(scope): subject`,
for example `feat(rules): add count-exact` or `docs: add migration guide`. Subject in the
imperative, at most about 50 characters; add a body only when the reason is not obvious.
One concern per commit. Stage only your own files (other sessions may edit the same
repository) and read `git status` before committing.

## Push policy

Pushing, adding a git remote and publishing to npm are steps for the repository owner.
Never run `git push` and never add a remote from a script, an automated session or an AI
agent. Prepare the commits; the owner pushes.

## Tests

The map of the test families and fixtures is [tests/README.md](tests/README.md); the how-to
is [docs/guides/testing.md](docs/guides/testing.md). Test and fixture layout:

| Path                                                             | Content                                                            |
| ---------------------------------------------------------------- | ------------------------------------------------------------------ |
| `tests/target/<category>/<MTLxxx>-<name>.test.ts`                | One test file per target rule (template + target).                 |
| `tests/fixtures/pairs/<MTLxxx>/<case>/`                          | `template.md` and `target.md` of one case of that rule.            |
| `tests/syntax/<category>/<MTLxxx>-<name>.test.ts`                | One test file per template syntax code, run through `--verify`.    |
| `tests/fixtures/templates/<MTLxxx>/<case>.md`                    | The one template of one case of that code (no target).             |
| `tests/consistency/`                                             | `pnpm run check:rules`, with the fixture coverage and orphan check. |
| `tests/unit/`                                                    | Config, runner, reporters, io, CLI and smoke tests.                |
| `tests/fixtures/smoke/clean-project/`                            | Synthetic project linted by `pnpm run smoke:pack`.                 |

The rule for cases (fixture folders and files):

- Names are descriptive kebab-case, prefixed `pass-` or `fail-`, for example
  `pass-all-required-present` and `fail-required-key-absent`. Never numbered.
- At least one `pass-` case and at least one `fail-` case per rule or group, any number of
  each: several `pass-` cases are welcome to test limit cases.
- One fixture per case, no case text inline in the test.
- The test asserts that the fixture folder holds exactly its cases; `check:rules` fails on
  an orphan fixture.
- Tests never touch the network: inject a fake `io`.
- The person or agent who writes the tests should not be the one who wrote the code under
  test.

Details per area are in [docs/architecture.md](docs/architecture.md), sections "Tests: rule
cases" and "Tests of config, runner, reporters and io".

## Scripts and configs are TypeScript

Scripts (`scripts/*.ts`) and tool configs (`eslint.config.ts`) are TypeScript. Scripts run
through `tsx` (`tsx scripts/x.ts`, a devDependency, [ADR 0007](docs/adr/0007-tsx-script-runner.md);
[ADR 0004](docs/adr/0004-typescript-scripts.md) chose TypeScript scripts). Use the `pnpm run`
scripts; to run one by hand use `pnpm exec tsx scripts/x.ts`. Scripts may use any TypeScript
syntax (enums, namespaces and parameter properties are allowed; `tsx` compiles them). Do not add `.js`,
`.mjs` or `.cjs` files except in `src/generated/`, `dist/`, `coverage/`, `node_modules/`
and `tmp/`. This is a guideline: no check enforces it (`pnpm run check:rules` does not), so
review catches it. Do not use `any` in TypeScript sources.

## Grammar and generated code

Template tags are specified only in `grammar/MdTemplateLexer.g4` and
`grammar/MdTemplateParser.g4`; never write a tag regex anywhere else. After a grammar
change run `pnpm run gen:parser`, commit the output, and verify with
`pnpm run check:parser`. Never hand-edit `src/generated/`.

## Adding a rule

See [docs/adding-a-rule.md](docs/adding-a-rule.md): `pnpm run new:rule -- <category> <name>`,
the spec row, the implementation in `src/rules/<category>.ts`, the tests and fixtures, the
five places to touch for a new tag, and the gates.

## Decisions (ADR process)

A decision that shapes the design (a dependency, a grammar structure, a convention) gets
an Architecture Decision Record in `docs/adr/`:

1. Copy [templates/adr.template.md](templates/adr.template.md) to
   `docs/adr/NNNN-short-title.md` (next free number, kebab-case file name). The `id`
   equals the file name stem.
2. Fill the frontmatter (`status` starts at `proposed`) and the sections Context,
   Decision, Consequences and Alternatives considered (keep at least one rejected
   option). Delete the authoring checklist and every tag marker before saving.
3. Flip `status` to `accepted` once the decision is live, or to `rejected` if turned down (`deprecated` when retired). When a record replaces an older
   one, set `supersedes` and mark the old record `superseded`.

Existing records start at [0001-genesis](docs/adr/0001-genesis.md). A change to the behaviour
contract also updates [docs/spec.md](docs/spec.md) in the same commit.

## Security and privacy

- Never commit secrets: no `.env` files, keys, tokens or credentials. Check `.gitignore`
  before every commit.
- Never put personal paths, names, emails or other personal data in code, fixtures or docs.
  Use relative paths and neutral placeholders.
- The config file is trusted input, documents are not: `[io:exists]` probes only
  `http`/`https`, refuses internal addresses by default and follows no redirect. Keep
  those guards when you touch `src/io/` (see the "Production RuleIo" section of
  [docs/architecture.md](docs/architecture.md)).
- Report a vulnerability to the repository owner privately, not in a public issue.

## Documentation

Update the docs in the same change as the code: the README (usage, rule tables, config
reference), [docs/spec.md](docs/spec.md) (contract), [docs/architecture.md](docs/architecture.md),
and [docs/migration.md](docs/migration.md) when behaviour changes for users of the legacy
tools. Keep `docs/ai-capabilities.md` in sync when you add or change an AI agent, skill,
command or tool.

User-visible changes are recorded in [CHANGELOG.md](CHANGELOG.md) under `[Unreleased]`.

By contributing you agree that your contribution is licensed under the MIT license of
the project (see [LICENSE](LICENSE)).
