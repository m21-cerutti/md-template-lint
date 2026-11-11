---
# [unique-headings-names]
title: Technical specification # [presence:required]
last_updated: 2026-10-29 # [presence:required] [format:date] [date]
---

# Specification title [pattern:"{text}"]

The contract of the system: what it must do, exactly. When this file and the code
disagree, one of them is a bug.

## Scope [content:non-empty]

What this contract covers and what it leaves to other documents.

## Model [content:non-empty]

The core objects and their relations. Define each term once, then use it
unchanged.

## Requirements [content:table]

| Id  | Requirement                          | Verified by        |
| --- | ------------------------------------ | ------------------ |
| R1  | One checkable statement ("must ...") | test or check name |

## Interfaces [content:non-empty]

Inputs, outputs, commands, files, formats and their exact syntax. Use code blocks
for grammars and examples.

## Errors and codes [content:table]

| Code | Name       | Severity | When                    |
| ---- | ---------- | -------- | ----------------------- |
| E001 | short-name | error    | The condition, exactly. |

## Assumptions [presence:optional] [content:list]

- A fact taken as true without proof, and what changes if it is false.

## Authoring checklist [presence:template-only]

- Save as `docs/spec.md`. Keep the frontmatter and refresh `last_updated` on
  every change.
- One statement per requirement. Every requirement names how it is verified.
- Headings are matched by exact level and exact text, in template order. Insert
  no section between two template sections; add your own (configuration,
  output, pipeline) after `Assumptions` (a warning, not an error). Delete the
  optional sections you do not need.
- For an empty required section write `- None.` (list) or `None.` in the first
  cell (table).
- Delete this section and every `[tag:...]` marker before saving.
