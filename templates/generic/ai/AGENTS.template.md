---
title: AGENTS.md # [presence:required]
last_updated: 2026-10-30 # [presence:required] [format:date] [date]
---

# AGENTS.md

## Mandatory Instructions [content:list]

- [Project rule: the one rule every change must respect.]
- [Security rule: what must never be committed or exposed.]
- [Session rule: what to run or record before ending a task.]
- [Escalation rule: when to stop and ask a human or a stronger model.]

## Behavioral Principles [content:list]

- **Think Before Coding.** Don't assume. If a requirement has multiple
  interpretations, list them. If a simpler approach exists, say so.
- **Keep It Simple.** No unrequested features. No abstraction for one-off
  code. If 50 lines solve it, don't write 200.
- **Make Surgical Changes.** Only modify what is necessary. Don't touch code
  you don't understand. Don't improve unrelated files along the way.
- **Goal-Driven Execution.** Turn instructions into verifiable goals: "fix
  the bug" becomes "write a failing test, then make it pass".

## Do NOT [content:list]

- Do NOT [forbidden action specific to this project].
- Do NOT [second forbidden action specific to this project].
- Do NOT commit credentials, `.env` files, keys or tokens.

## Project Purpose [content:non-empty]

[One paragraph: what the project does, who uses it, and what it is not.]

## Tech Stack and Key Tools [content:list]

- **Language:** [language and minimum runtime version]
- **Package manager:** [tool name]
- **Build/Test:** [build tool and test runner]
- **Linter/Formatter:** [linter and formatter names]
- **Type checker:** [type checker name, or "none"]

## Project Structure [presence:optional] [content:non-empty]

[Top-level folders and what each one holds, one line per folder.]

## How to Build and Test [content:non-empty]

```bash
[install command]
[format check command]
[lint command]
[test command]
```

## Acceptance Criteria and Quality Gates [content:list]

- All tests pass.
- Format and lint checks pass.
- Changes are documented (README, `docs/`).
- Commit message follows Conventional Commits.
- No credentials committed (`.env`, keys, tokens).

## Error Handling and Recovery [content:list]

- **Test failure:** find the root cause, fix, re-run before moving on.
- **Type or lint error:** fix at the source; do not silence the checker.
- **Missing information:** ask the user before guessing.
- **Same error twice:** escalate to a higher-tier model instead of retrying.

## Agent Workflow [presence:optional] [content:list]

1. **Plan:** break multi-step work into small tracked items.
2. **Execute:** one item at a time; commit only after verification passes.
3. **Verify:** run the build and test commands above.
4. **Document:** update the README or `docs/` for non-obvious changes.

## References [content:list]

- AI capability inventory: [docs/ai-capabilities.md](docs/ai-capabilities.md)
- Project configuration: `[config file name]`
- Tool documentation: [https://example.com/docs](https://example.com/docs)

## Authoring checklist [presence:template-only]

- Save as `AGENTS.md` at the repo root.
- Replace every bracketed placeholder, or delete the line or section it
  belongs to.
- Keep the file short. Link long material from References instead of pasting it.
- Do not list agents, skills, commands or tools here. Put them in
  `docs/ai-capabilities.md`.
- Keep the section order. Optional sections may be dropped.
- No credentials and no personal paths.
- Delete this section and every `[tag:...]` marker before saving.
