---
# [filename:case:snake_case]
# [unique-headings-names]
id: short_bug_title # [presence:required] [value:filename] [format:snake_case]
title: Short description of the bug # [presence:required]
status: draft | reported | fixed | wontfix # [presence:required]
date: 2026-10-29 # [presence:required] [format:date] [date]
component: module, script or tool name # [presence:required]
severity: low | medium | high | critical # [presence:optional]
upstream: https://example.org/project # [presence:required] [url] [format:scheme:https]
issue_url: https://example.org/project/issues/1 # [presence:optional] [url] [format:scheme:https]
environment: # [presence:optional]
  - OS and version
  - Runtime or tool version
tags: [tag-one, tag-two] # [presence:optional] [count:max:6] [format:elements:kebab-case]
---

# Bug title [pattern:"{text}"]

## Description [content:non-empty]

One or two sentences: what breaks and when.

## Minimal example [content:non-empty]

The smallest input or command that triggers the bug. Use a code block.

## How to reproduce [content:list]

1. Step one.
2. Step two.

## Expected vs result [content:table]

| Expected            | Result                |
| ------------------- | --------------------- |
| What should happen. | What happens instead. |

## Context [presence:optional] [content:non-empty]

Why it matters, what you were doing, links to related reports. Paste the exact
error message in a code block.

## Possible fixes or workarounds [presence:optional] [content:non-empty]

Ideas, patches, or a way to avoid the bug. Add the commit or file reference once
fixed.

## Notes [presence:optional] [content:non-empty]

Anything else: upstream status, follow-ups.

## Authoring checklist [presence:template-only]

- Save as `docs/bugs/short_title.md` (snake_case); `id` equals the filename stem.
- `upstream` is the home page of the project the bug lives in; `issue_url` is
  the report you filed there, once it exists.
- Status values:
  - `draft`: written locally, not yet reported anywhere.
  - `reported`: filed upstream, `issue_url` set, waiting for a fix.
  - `fixed`: resolved; fill Possible fixes or workarounds with the change.
  - `wontfix`: closed on purpose; say why in Notes.
- Headings are matched by exact level and exact text, in template order. Insert
  no section between two template sections; add your own after the last one,
  `Notes` (a warning, not an error). Delete the optional sections you do not
  need.
- For an empty required list write `- None.`; for an empty table write `None.`
  in the first cell.
- Never paste secrets, tokens or private paths into the example or environment.
- Delete this section and every `[tag:...]` marker before saving.
