---
# [filename:case:kebab-case]
title: Short description of the bug  # [presence:required]
status: open | fixed | wontfix  # [presence:required]
date: 2026-10-29  # [presence:required] type=date
component: module, script or tool name  # [presence:required]
severity: low | medium | high | critical  # [presence:required]
---

# Bug [presence:exist]

## Summary [content:non-empty]

One or two sentences: what breaks and when.

## Reproduction steps [content:list]

1. Step one.
2. Step two.

## Expected [content:non-empty]

What should happen.

## Actual [content:non-empty]

What happens instead. Paste the exact error message in a code block.

## Environment [content:list]

- OS:
- Tool / runtime version:
- Relevant config:

## Root cause [presence:optional]

Why it happens. Fill in once known.

## Fix [presence:optional]

What changed, with commit or file reference. Fill in once fixed.

## Authoring checklist [presence:template-only]

- Save as `docs/bugs/YYYY-MM-DD-short-title.md` (kebab-case).
- Set `status: fixed` and fill Root cause and Fix when closed.
- Never paste secrets, tokens or private paths into Actual or Environment.
- Delete this section and every `[tag:...]` marker before saving.
