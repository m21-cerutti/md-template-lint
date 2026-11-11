---
# [unique-headings-names]
title: Ideas # [presence:required]
last_updated: 2026-10-29 # [presence:required] [format:date] [date]
---

# Ideas — {text} [pattern:"Ideas — {text}"] [presence:optional]

## Vision [content:non-empty]

One short paragraph: what this project is for and where it should go.

## Ideas [content:list]

- 2026-10-29 [new] Add a dry-run flag to the sync script.
- 2026-10-30 [explored] Cache the parsed templates between runs.

## Authoring checklist [presence:template-only]

- Save as `IDEA.md` at the repository root. Keep the frontmatter and refresh
  `last_updated` on every change.
- The H1 reads `Ideas — <project name>`.
- One bullet per idea: `- YYYY-MM-DD [status] idea`. Status: new, explored,
  planned, dropped. The linter checks that the list is not empty, not the
  shape of each bullet.
- Headings are matched by exact level and exact text, in template order. Insert
  no section between two template sections; add your own after `Ideas` (a
  warning, not an error). Delete the optional sections you do not need.
- Delete this section and every `[tag:...]` marker before saving.
