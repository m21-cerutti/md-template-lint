---
# [unique-headings-names]
last_updated: 2026-11-11 # [presence:required] [format:date] [date]
---

# Contributing

Thank you for helping [project name]. This page explains how to report a
problem, propose a change and get a pull request merged.

## Summary [presence:optional] [content:non-empty]

- Table of contents: one link per section.

## Overview [content:non-empty]

Start here: open an issue first, fork the repository, make the change on a
branch of your fork, and open a pull request against `[default branch]`.

## Ways to contribute [content:list]

- **Bug:** open an issue with a minimal way to reproduce it.
- **Question:** ask in [Discussions or the support channel], not in the issue
  tracker.
- **Feature:** open an issue and wait for it to be accepted.
- **Documentation:** fix or improve a page, and open a pull request.

## Issue first [content:non-empty]

New features and behavior changes need an accepted issue before a pull
request. A pull request without one may be closed. Small fixes (a typo, a
broken link) may skip this step.

## Fork and pull request workflow [content:list]

1. Fork the repository on [hosting platform] and clone your fork.
2. Create a branch from `[default branch]`: `feat/[topic]` or `fix/[topic]`.
3. Keep your fork in sync with the upstream repository.
4. Open the pull request against `[default branch]` from your fork. There are
   no direct branches in the upstream repository.
5. Maintainers merge the pull request.

## Setup [content:non-empty]

Requirements: [runtime and minimum version], [package manager].

```bash
[install dependencies]
```

## Quality gates [content:non-empty]

Run every gate before you open a pull request. All of them must pass.

```bash
[format check command]
[lint command]
[type check command]
[test command]
[build command]
```

## Project-specific changes [presence:optional] [content:non-empty]

[Link the guide for changes that follow a fixed procedure, for example adding
a rule, a plugin or a translation, and list what such a change must include:
code, tests, documentation, changelog entry.]

## Generated code [presence:optional] [content:non-empty]

[Name the generated folders, the source files they come from and the command
that regenerates them. Never edit generated files by hand.]

## Commit style [content:non-empty]

Use Conventional Commits: `type(scope): short summary`, with a body only when
the reason is not obvious.

```text
fix(parser): reject an empty heading
```

[Optional: sign off each commit with `git commit -s` to accept the Developer
Certificate of Origin. Add an `Assisted-by: [tool]` trailer when an AI tool
helped.]

## Pull request checklist [content:list]

- The pull request links an accepted issue.
- Tests cover the change.
- Documentation is updated.
- The changelog has an entry for user-visible changes.
- All quality gates pass.
- AI assistance is disclosed, see the section below.

## AI-assisted contributions [content:non-empty]

AI tools are allowed. You must understand every line you submit and disclose
the tool and the extent of its use. Read [AI_GUIDELINE.md](AI_GUIDELINE.md)
for the full rules.

## Review and response time [content:non-empty]

[Maintainers answer within [number] days. A pull request with no activity
for [number] days, or one nobody asked for, may be closed. You can reopen it
when you are ready to continue.]

## Security reports [content:non-empty]

Report vulnerabilities privately, as described in [SECURITY.md](SECURITY.md).
Never open a public issue for a vulnerability.

## License and conduct [content:non-empty]

By contributing you agree that your contribution is licensed under
[license name], the license of the project (see [LICENSE](LICENSE)). Follow
the [code of conduct](CODE_OF_CONDUCT.md).

## Authoring checklist [presence:template-only]

- Save as `CONTRIBUTING.md` at the repository root. Keep the frontmatter and
  refresh `last_updated` on every change.
- The `Summary` block with its `omit in toc` markers is optional. Its list is
  maintained by the Markdown All in One extension, not by hand.
- The sections follow the usual order of a contributor: overview, ways to
  contribute, issue first, workflow, setup, gates, specific procedures,
  commits, checklist, AI, review, security, license.
- Headings are matched by exact level and exact text, in template order. Insert
  no section between two template sections; add your own after the last one,
  `License and conduct` (a warning, not an error).
- Optional sections are `Project-specific changes` and `Generated code`. Delete
  them when they do not apply.
- Replace every bracketed placeholder. Delete a line or a section you cannot
  fill instead of leaving a placeholder.
- Every command in the file must run as written. Test them before saving.
- The links `SECURITY.md`, `LICENSE`, `CODE_OF_CONDUCT.md` and
  `AI_GUIDELINE.md` are placeholder paths: point them at real files or remove
  the link.
- Never put secrets, tokens or personal paths in examples.
- Delete this section and every `[tag:...]` marker before saving.
