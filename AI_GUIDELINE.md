# AI-Assisted Development

## Configuration

This project uses [OpenCode](https://opencode.ai/) for AI-assisted
development.

- **AGENTS.md:** project rules for AI agents. Injected into every session.
- **opencode.jsonc:** permissions, MCPs and references. The default model
  comes from the global config.
- **docs/ai-capabilities.md:** inventory of the project agents, skills,
  commands, tools and scripts.

## Usage

- Start a session: `opencode`
- Run a single task: `opencode run "your task here"`
- Invoke a command: `/command-name`

## Guidelines

- Verify agent output: run the tests and read the diff before committing.
- Keep AGENTS.md, README and `docs/ai-capabilities.md` in sync with the code.
- Use `@orchestrator-plan` for complex multi-step work, then `@orchestrator`
  to execute the approved plan.

## Resources

- OpenCode documentation: https://opencode.ai/v2/docs
- Issues: https://github.com/anomalyco/opencode
- Research basis: [Evaluating AGENTS.md, ETH Zurich, 2026](https://arxiv.org/abs/2602.11988)
