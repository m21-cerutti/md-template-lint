---
# [unique-headings-names]
# [frontmatter:optional]
---

# TODO

## Epic A — Title (prio MEDIUM) [pattern:"Epic {char} — {text}"] [repeat-rules:same-level] [order:ascending] [content:non-empty]

One short paragraph: the goal of this epic and what "done" means.

| Phase | Tasks                    | Prio   | Deps | Status | Notes | Subagent | Tier |
| ----- | ------------------------ | ------ | ---- | ------ | ----- | -------- | ---- |
| A1    | - first task<br>- second | MEDIUM | -    | todo   |       | doer     | 1    |
| A2    | - next task              | MEDIUM | A1   | todo   |       | doer     | 2    |

## Authoring checklist [presence:template-only]

- Save as `TODO.md` at the repository root. The line
  `# [frontmatter:optional]` in the frontmatter makes the whole block optional
  for the file. This template declares no fields, so omit the block (the usual
  case); without a block the field rules are skipped, and when the block is
  present every field rule applies (see ADR 0015), so fields you add are reported
  as warnings.
- One H2 per epic, in letter order (A, B, C ...): `## Epic X — Title (prio
HIGH|MEDIUM|LOW)`, then one description paragraph, then one table with the
  columns above. Repeat the epic block for every epic.
- Prio: `HIGH`, `MEDIUM` or `LOW`. Status: `todo`, `in-progress` or `done`.
- Subagent and Tier are optional agent-workflow columns. Subagent names the
  agent role that runs the phase; Tier is the capability level it needs (1 is
  the lowest). Drop both columns if no agent runs the phases; use `-` when a
  cell does not apply.
- Notes is free text: blockers, links, the reason for a status change.
- Deps lists the phases it waits on, by id (`A1`) or by number (`1`), or `-` / `—`
  for none. The linter does not check the Deps cell. Tasks are bullets joined
  with `<br>`.
- Mark a phase `done` only after its verification passes.
- Headings are matched by exact level and exact text, in template order. Insert
  no section between two template sections; add your own after the last one (a
  warning, not an error).
- Delete this section and every `[tag:...]` marker before saving.
