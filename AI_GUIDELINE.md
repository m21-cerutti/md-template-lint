---
last_updated: 2026-11-11
---

# AI guideline

How `md-template-lint` treats contributions made with AI tools: code assistants, chat models, agents and bots.

<!-- prettier-ignore-start -->
<!-- omit in toc -->
## Summary
<!-- prettier-ignore-end -->

- [Scope](#scope)
- [Principle](#principle)
- [Disclosure](#disclosure)
- [What must be human](#what-must-be-human)
- [Quality bar](#quality-bar)
- [Licensing and copyright](#licensing-and-copyright)
- [Automated issues and pull requests](#automated-issues-and-pull-requests)
- [Enforcement](#enforcement)
- [Maintainer use](#maintainer-use)
- [Rationale and references](#rationale-and-references)

## Scope

These rules apply to every outside contribution: issues, pull requests, discussions, security reports and comments. Maintainers follow the section `Maintainer use`.

## Principle

AI tools are allowed. The human who submits the work is accountable for it. You must understand every line you submit and be able to explain it without the tool.

## Disclosure

- Say in the pull request or issue that an AI tool helped: the tool name and the extent, for example "drafted with a code assistant, reviewed and edited by me".
- In commits, add an `Assisted-by: <tool>` trailer.
- Disclose translation tools too, so the text is not taken for unreviewed output.

## What must be human

- The text of an issue.
- The description of a pull request.
- Security reports.
- Design discussion.

Do not paste raw model output into any of them. Review and edit it first.

## Quality bar

AI-assisted code meets the same bar as any other code: the quality gates in [CONTRIBUTING.md](CONTRIBUTING.md) pass, tests cover the change and the documentation is updated. If a reviewer can tell that a tool wrote the change, there is more work to do.

## Licensing and copyright

You are responsible for the license of what you submit. Do not submit code you cannot license under the MIT license of the project, with or without AI.

## Automated issues and pull requests

Issues and pull requests filed by bots, scripts or agents are not accepted without prior maintainer approval. Automatic or bulk submissions are closed without review.

## Enforcement

Unreproducible or fabricated reports and unreviewed submissions are closed. Repeated low-quality submissions lead to a block.

## Maintainer use

Maintainers use [OpenCode](https://opencode.ai/) for AI-assisted development. They are exempt from the disclosure rule but remain accountable for what they merge. The tooling is configured in the repository:

- **AGENTS.md:** project rules for AI agents, injected into every session. They apply to people too.
- **opencode.jsonc:** the tracked project configuration: permissions, MCPs and references.
- **.opencode/opencode.jsonc:** a local, git-ignored file for personal permission overrides. It is not shared and not part of the project.
- **docs/ai-capabilities.md:** inventory of the project agents, skills, commands, tools and scripts.

Keep AGENTS.md, the README and `docs/ai-capabilities.md` in sync with the code, and verify agent output: run the tests and read the diff before committing.

## Rationale and references

The issue is the burden on reviewers, not the tool. The project allows AI tools with disclosure and human accountability. Policies of other projects, for comparison:

- [curl](https://raw.githubusercontent.com/curl/curl/master/docs/CONTRIBUTE.md): allows AI with disclosure; reports must be written and verified by a person; fabricated reports lead to a ban.
- [QEMU](https://www.qemu.org/docs/master/devel/code-provenance.html): declines contributions believed to include or derive from AI generated content.
- [Gentoo](https://wiki.gentoo.org/wiki/Project:Council/AI_policy): forbids content created with the assistance of natural language AI tools.
- [NetBSD](https://www.netbsd.org/developers/commit-guidelines.html): presumes LLM generated code tainted and needs prior approval.
- OpenCode documentation: <https://opencode.ai/v2/docs>
- Research basis: [Evaluating AGENTS.md, ETH Zurich, 2026](https://arxiv.org/abs/2602.11988)
