---
# [unique-headings-names]
# [frontmatter:optional]
title: Index title # [presence:required]
last_updated: 2026-11-11 # [presence:required] [format:date] [date]
---

# Index title [pattern:"{text}"]

What this folder holds and who should read it, in one or two sentences.

## Summary [presence:optional] [content:non-empty]

- Table of contents: one link per section.

## Section title [pattern:"{text}"] [presence:optional] [repeat-rules:same-level] [content:non-empty]

| File               | What it is           |
| ------------------ | -------------------- |
| [name.md](name.md) | One-line description |

## Authoring checklist [presence:template-only]

- Save as `INDEX.md` (or `README.md`) in the folder it indexes. The line
  `# [frontmatter:optional]` in the frontmatter makes the whole block optional
  for the file. Without a frontmatter block the field rules are skipped; when the
  block is present, every field rule applies (see ADR 0015): `title` is required
  and `last_updated` must be a current date.
- List every file of the folder once, grouped by purpose, one line each. A link
  or a table are both fine.
- Sections are free: any number of H2 headings with any text, each with a
  non-empty body. H3 headings under a section are free too.
- The `Summary` block with its `omit in toc` markers is optional. Its list is
  maintained by the Markdown All in One extension, not by hand.
- Headings are matched by exact level, in template order. Put `Summary` first;
  a `See also` section is just another section.
- Delete this section and every `[tag:...]` marker before saving.
