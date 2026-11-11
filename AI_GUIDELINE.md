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
- [Recommended opencode setup](#recommended-opencode-setup)
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

## Recommended opencode setup

This section is optional. You do not need it to contribute. It describes the setup the maintainers use with [OpenCode](https://opencode.ai/). The repository does not load any of it for you: everything below goes in your own configuration, and nothing in the project depends on it.

**Plugins.**

- [opencode-models-discovery](https://www.npmjs.com/package/opencode-models-discovery) ([GitHub](https://github.com/yuhp/opencode-models-discovery)): discovers the models of OpenAI-compatible providers, such as local servers, and adds them to OpenCode. Useful only if you use such a provider.
- [Magic Context](https://www.npmjs.com/package/@cortexkit/opencode-magic-context) ([GitHub](https://github.com/cortexkit/magic-context)): manages the context window in the background and keeps project memory across sessions. It turns off the built-in compaction, needs a model for its historian and creates a `.cortexkit/` folder in the project. Follow its setup guide, the GitHub README.

Add them to your global OpenCode config, or to the git-ignored `.opencode/opencode.jsonc` of your clone. OpenCode merges the plugin arrays of all config files. OpenCode 2 names the key `plugins`, OpenCode 1 names it `plugin`.

**Settings.**

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["opencode-models-discovery@2.1.1", "@cortexkit/opencode-magic-context@latest"],
  "snapshots": false,
}
```

`snapshots` is optional. OpenCode stores full copies of tracked and eligible untracked files for `/undo` in its data directory ([snapshots guide](https://opencode.ai/docs/snapshots)). Setting it to `false` stops that capture, but `/undo` then cannot restore files; use git for that.

**Terse replies (caveman).** [Caveman](https://github.com/JuliusBrussee/caveman) is an optional plugin that makes the agent answer in short, exact sentences, which uses fewer tokens. This repository ships no caveman rule file, so it is off unless you install it on your machine. The installer adds the plugin, the `/caveman` commands and the mode switch to your user configuration. Preview first, then install once:

```bash
npx -y github:JuliusBrussee/caveman -- --only opencode --dry-run
npx -y github:JuliusBrussee/caveman -- --only opencode
```

On npm 12 or newer, add `--allow-git=root` after `npx`, for example `npx --allow-git=root -y github:JuliusBrussee/caveman -- --only opencode`. The installer runs code fetched from a GitHub repository: read [INSTALL.md](https://github.com/JuliusBrussee/caveman/blob/main/INSTALL.md) first, and prefer a release-pinned form, which it also documents.

## Rationale and references

The issue is the burden on reviewers, not the tool. The project allows AI tools with disclosure and human accountability. Policies of other projects, for comparison:

- [curl](https://raw.githubusercontent.com/curl/curl/master/docs/CONTRIBUTE.md): allows AI with disclosure; reports must be written and verified by a person; fabricated reports lead to a ban.
- [QEMU](https://www.qemu.org/docs/master/devel/code-provenance.html): declines contributions believed to include or derive from AI generated content.
- [Gentoo](https://wiki.gentoo.org/wiki/Project:Council/AI_policy): forbids content created with the assistance of natural language AI tools.
- [NetBSD](https://www.netbsd.org/developers/commit-guidelines.html): presumes LLM generated code tainted and needs prior approval.
- OpenCode documentation: <https://opencode.ai/v2/docs>
- Research basis: [Evaluating AGENTS.md, ETH Zurich, 2026](https://arxiv.org/abs/2602.11988)
