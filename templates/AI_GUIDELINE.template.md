---
last_updated: 2026-11-11 # [presence:required] [format:date] [date]
---

# AI guideline

How [project name] treats contributions made with AI tools: code
assistants, chat models, agents and bots.

## Summary [presence:optional] [content:non-empty]

- Table of contents: one link per section, written by the extension.

## Scope [content:non-empty]

These rules apply to every outside contribution: issues, pull requests,
discussions, security reports and comments. Maintainers follow the section
`Maintainer use`.

## Principle [content:non-empty]

AI tools are allowed. The human who submits the work is accountable for it.
You must understand every line you submit and be able to explain it without
the tool.

## Disclosure [content:list]

- Say in the pull request or issue that an AI tool helped: the tool name and
  the extent, for example "drafted with [tool], reviewed and edited by me".
- In commits, add an `Assisted-by: [tool]` trailer.
- Disclose translation tools too, so the text is not taken for unreviewed
  output.

## What must be human [content:list]

- The text of an issue.
- The description of a pull request.
- Security reports.
- Design discussion.

Do not paste raw model output into any of them. Review and edit it first.

## Quality bar [content:non-empty]

AI-assisted code meets the same bar as any other code: the quality gates
pass, tests cover the change and the documentation is updated. If a
reviewer can tell that a tool wrote the change, there is more work to do.

## Licensing and copyright [content:non-empty]

You are responsible for the license of what you submit. Do not submit code
you cannot license under [license name], with or without AI.

## Automated issues and pull requests [content:non-empty]

Issues and pull requests filed by bots, scripts or agents are not accepted
without prior maintainer approval. Automatic or bulk submissions are closed
without review.

## Enforcement [content:non-empty]

Unreproducible or fabricated reports and unreviewed submissions are closed.
Repeated low-quality submissions lead to a block.

## Maintainer use [presence:optional] [content:non-empty]

[How maintainers use AI tools on the project, and which of the rules above
they follow. For example: maintainers are exempt from the disclosure rule
but remain accountable for what they merge.]

## Rationale and references [content:non-empty]

[Why the project allows AI tools with disclosure and human accountability:
the issue is the burden on reviewers, not the tool.] Policies of other
projects, for comparison:

- [Project and link: policy summary in one line.]

## Authoring checklist [presence:template-only]

- Save as `AI_GUIDELINE.md` at the repository root. Keep the frontmatter and
  refresh `last_updated` on every change.
- Pick the policy first: allow with disclosure (this skeleton), or ban. A ban
  needs a different `Principle`, `Disclosure` and `Enforcement`; keep the
  other section names.
- The `Summary` block with its `omit in toc` markers is optional. Its list is
  maintained by the Markdown All in One extension, not by hand.
- Keep the order of the sections. `Maintainer use` is optional.
- Replace every bracketed placeholder, or delete the line or section it
  belongs to.
- Link this file from `CONTRIBUTING.md`, in its AI section.
- Keep the rules enforceable: say what a maintainer does when a rule is broken.
- Never put secrets, tokens or personal paths in examples.
- Delete this section and every `[tag:...]` marker before saving.
