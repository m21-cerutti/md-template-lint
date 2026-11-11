---
# [unique-headings-names]
# [frontmatter:optional]
last_updated: 2026-11-11 # [presence:required] [format:date] [date]
---

# Project name [pattern:"{text}"]

## Summary [presence:optional] [content:non-empty]

- Table of contents: one link per section.

## Description [content:non-empty]

What the project does, for whom, and why it exists. A diagram may follow.

## Installation [content:non-empty]

```bash
[install command]
```

Requirements: [runtime and minimum version].

## Usage [content:non-empty]

```bash
[smallest working example]
```

## Configuration [content:non-empty]

[Config file name, the main options and their defaults.]

## Template syntax [content:non-empty]

[The tags and the rules they carry, with a link to the full reference.]

## Security [content:non-empty]

[What touches the file system or the network, what is opt-in, how to report a vulnerability.]

## This repository lints its own docs [content:non-empty]

[Which templates the repository checks its own Markdown against, and how to run the check by hand.]

## Documentation [content:non-empty]

- [docs/INDEX.md](docs/INDEX.md): index of everything under `docs/`.

## Development [content:non-empty]

```bash
[install dependencies]
[run the tests]
```

## License [content:non-empty]

[License name], see [LICENSE](LICENSE).

## AI-Assisted Development [content:non-empty]

See [AI_GUIDELINE.md](AI_GUIDELINE.md).

## Authoring checklist [presence:template-only]

- Save as `README.md` at the repository root. The line
  `# [frontmatter:optional]` in the frontmatter makes the whole block optional
  for the file. Without a frontmatter block the field rules are skipped; when the
  block is present, every field rule applies (see ADR 0015): `last_updated` is
  required and must be a current date. GitHub renders the block as a table above
  the text.
- The H1 is the project name. It may sit inside a centred `<div>` block with the
  mascot and the badges: the HTML around it is not a heading and is not checked.
- The `Summary` block with its `omit in toc` markers is optional. Its list is
  maintained by the Markdown All in One extension, not by hand.
- Headings are matched by exact level and exact text, in template order. Insert
  no section between two template sections; add your own after the last one,
  `AI-Assisted Development` (a warning, not an error). H3 headings under a
  section are free.
- Replace every bracketed placeholder. Every command in the file must run as
  written.
- The `LICENSE` and `AI_GUIDELINE.md` links are placeholder paths: point them at
  the real files or remove the link.
- Never put secrets, tokens or personal paths in examples.
- Delete this section and every `[tag:...]` marker before saving.
