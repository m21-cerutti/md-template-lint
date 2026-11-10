# md-template-lint

TypeScript/pnpm port of the Markdown template linter. It checks Markdown
instance files (frontmatter and headings) against template files. Template tag
syntax is defined by an ANTLR grammar; rules are grouped by category; each
project configures its template/target pairs in `md-template-lint.yml`.

Status: work in progress. Usage, rule syntax and configuration reference will
be added once the first release is ready.

License: MIT, Copyright (c) 2026 Marc CERUTTI.

## Development (stub)

Node >= 22.18 (runs the TypeScript scripts natively, [ADR 0004](docs/adr/0004-typescript-scripts.md)). `pnpm install --frozen-lockfile`, then `pnpm run typecheck`, `pnpm test`, `pnpm run lint`,
`pnpm run format:check`, `pnpm run build`. `pnpm run gen:parser`
(`scripts/gen-parser.ts`) empties `src/generated/`, then regenerates the lexer,
parser, listener and visitor from `grammar/MdTemplateLexer.g4` and
`grammar/MdTemplateParser.g4` with antlr-ng (no Java). Run it after every
grammar change and commit the output; never edit it by hand.
`pnpm run check:parser` (`scripts/check-parser.ts`) generates the parser into a
temporary directory and fails when `src/generated/` has a differing, missing or
extra file (stale or hand-edited parser). It never modifies `src/generated/` and
works before and after the files are committed.
All scripts and tool configs are TypeScript (`scripts/*.ts`, `eslint.config.ts`);
`pnpm run check:rules` fails on any `.js`/`.mjs`/`.cjs` file outside
`src/generated/`, `dist/`, `node_modules/`, `coverage/` and `tmp/`.
Parity data: `legacy/`, `tests/corpus/`, `tests/golden/`, see
[docs/research/wrapper-parity.md](docs/research/wrapper-parity.md).

## AI-Assisted Development

### Configuration

This project uses [OpenCode](https://opencode.ai/) for AI-assisted
development.

- **AGENTS.md:** project rules for AI agents. Injected into every session.
- **opencode.jsonc:** permissions, MCPs and references. The default model
  comes from the global config.
- **docs/ai-capabilities.md:** inventory of the project agents, skills,
  commands, tools and scripts.

### Usage

- Start a session: `opencode`
- Run a single task: `opencode run "your task here"`
- Invoke a command: `/command-name`

### Guidelines

- Verify agent output: run the tests and read the diff before committing.
- Keep AGENTS.md, README and `docs/ai-capabilities.md` in sync with the code.
- Use `@orchestrator-plan` for complex multi-step work, then `@orchestrator`
  to execute the approved plan.

### Resources

- OpenCode documentation: https://opencode.ai/v2/docs
- Issues: https://github.com/anomalyco/opencode
- Research basis: [Evaluating AGENTS.md, ETH Zurich, 2026](https://arxiv.org/abs/2602.11988)
