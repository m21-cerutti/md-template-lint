---
# [filename:case:snake_case]
id: short_bug_title  # [presence:required] [value:filename] [format:snake_case]
title: Short description of the bug  # [presence:required]
status: draft | reported | fixed | wontfix  # [presence:required]
date: 2026-10-29  # [presence:required] type=date
component: module, script or tool name  # [presence:required]
severity: low | medium | high | critical  # [presence:optional]
upstream: https://example.org/project  # [presence:required] type=url [format:scheme:https]
issue_url: https://example.org/project/issues/1  # [presence:optional] type=url [format:scheme:https]
environment:  # [presence:optional]
  - OS and version
  - Runtime or tool version
tags: [tag-one, tag-two]  # [presence:optional] [count:max:6] [format:elements:kebab-case]
---

# Bug [presence:exist]

## Description [content:non-empty]

One or two sentences: what breaks and when.

## Minimal Example [content:non-empty]

The smallest input or command that triggers the bug. Use a code block.

## How to Reproduce [content:list]

1. Step one.
2. Step two.

## Expected vs Result [content:table]

| Expected                 | Result                          |
| ------------------------ | ------------------------------- |
| What should happen.      | What happens instead.           |

## Context [presence:optional]

Why it matters, what you were doing, links to related reports. Paste the exact
error message in a code block.

## Possible Fixes or Workarounds [presence:optional]

Ideas, patches, or a way to avoid the bug. Add the commit or file reference once
fixed.

## Notes [presence:optional]

Anything else: upstream status, follow-ups.

## Authoring checklist [presence:template-only]

- Save as `docs/bugs/short_title.md` (snake_case); `id` equals the filename stem.
- `upstream` is the home page of the project the bug lives in; `issue_url` is
  the report you filed there, once it exists.
- Status values:
  - `draft`: written locally, not yet reported anywhere.
  - `reported`: filed upstream, `issue_url` set, waiting for a fix.
  - `fixed`: resolved; fill Possible Fixes or Workarounds with the change.
  - `wontfix`: closed on purpose; say why in Notes.
- Never paste secrets, tokens or private paths into the example or environment.
- Delete this section and every `[tag:...]` marker before saving.
