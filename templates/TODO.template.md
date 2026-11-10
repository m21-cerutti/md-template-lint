---
---

# TODO

## Epic A — Title (prio MEDIUM) [pattern:"Epic {char} — {text}"] [repeat-rules:same-level] [order:ascending]

One short paragraph: the goal of this epic and what "done" means.

| Phase | Tasks                    | Prio   | Deps | Status | Notes | Subagent | Tier |
| ----- | ------------------------ | ------ | ---- | ------ | ----- | -------- | ---- |
| A1    | - first task<br>- second | MEDIUM | -    | todo   |       | doer     | 1    |
| A2    | - next task              | MEDIUM | A1   | todo   |       | doer     | 2    |

## Authoring checklist [presence:template-only]

- Save as `TODO.md` at the repository root. Keep the empty frontmatter block
  (`---` then `---`) so the linter accepts the file.
- One H2 per epic, in letter order (A, B, C ...): `## Epic X — Title (prio
  HIGH|MEDIUM|LOW)`, then one description paragraph, then one table with the
  columns above. Repeat the epic block for every epic.
- Prio: `HIGH`, `MEDIUM` or `LOW`. Status: `todo`, `in-progress` or `done`.
- Subagent and Tier are optional agent-workflow columns. Subagent names the
  agent role that runs the phase; Tier is the capability level it needs (1 is
  the lowest). Drop both columns if no agent runs the phases; use `-` when a
  cell does not apply.
- Notes is free text: blockers, links, the reason for a status change.
- Deps lists phase ids (`A1`) or `-`. Tasks are bullets joined with `<br>`.
- Mark a phase `done` only after its verification passes.
- Delete this section and every `[tag:...]` marker before saving.
