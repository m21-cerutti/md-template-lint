---
last_updated: 2026-10-30  # [presence:required] [format:date] type=date
---

# Project name [pattern:"{text}"]

One or two sentences: what the project does, for whom, and why it exists.

## Installation [content:non-empty]

```bash
[install command]
```

Requirements: [runtime and minimum version].

## Usage [content:non-empty]

```bash
[smallest working example]
```

## Configuration [presence:optional] [content:non-empty]

[Config file name, the main options and their defaults.]

## Development [content:non-empty]

```bash
[install dependencies]
[run the tests]
[run the linters]
```

## Contributing [presence:optional] [content:non-empty]

[How to report a bug, propose a change and open a pull request.]

## License [content:non-empty]

[License name], see [LICENSE](LICENSE).

## Authoring checklist [presence:template-only]

- Save as `README.md` at the repository root. Keep the frontmatter and refresh
  `last_updated` on every change.
- The H1 is the project name; the first paragraph under it is the description.
  Known engine gap: the linter checks that an H1 exists but cannot check that
  the description paragraph is not empty.
- Replace every bracketed placeholder. Delete the optional sections you do not
  need; keep the order of the others.
- Every command in the file must run as written. Test them before saving.
- Link to `docs/` for anything longer than a screen.
- The `LICENSE` link is a placeholder path: point it at the real license file
  or remove the link.
- Never put secrets, tokens or personal paths in examples.
- Delete this section and every `[tag:...]` marker before saving.
