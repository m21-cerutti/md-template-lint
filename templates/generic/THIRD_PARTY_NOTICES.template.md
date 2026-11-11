---
# [unique-headings-names]
last_updated: 2026-11-11 # [presence:required] [format:date] [date]
---

# Third-party notices

[Project name] is licensed under [project license], see [LICENSE](LICENSE).
This file lists the third-party material that [project name] uses, bundles or
ships, with the license of each item.

Checked on [date] against [source of truth: lockfile, installed packages, or
the generation tool and its version].

Scope: [runtime dependencies only, runtime and bundled, or all]. Not listed:
[non-bundled build tools]. They are not shipped in the package.

## Summary [presence:optional] [content:non-empty]

- Table of contents: one link per section.

## Packages [content:table]

| Package | Version | License (SPDX) | Scope                       |
| ------- | ------- | -------------- | --------------------------- |
| [name]  | [1.0.0] | [MIT]          | [runtime, build, generated] |

## Package [pattern:"{text} {semver}"] [presence:optional] [repeat-rules:same-level] [content:non-empty]

- Upstream: [repository or home page URL]
- License: [SPDX id]
- Copyright: [copyright line]
- Used as: [runtime dependency, bundled, or derived code]

```text
[Full license text, copied from the package, with its copyright line.]
```

Repeat this block once per package, with the heading `name version`. When
several packages share one license text, write the text once and list the
packages that share it.

## Generated or derived material [presence:optional] [content:non-empty]

[Item]: [origin, tool and version, license decision, link to the decision
record].

## Regeneration [content:non-empty]

```bash
[command that lists the packages and their licenses]
```

Review the diff by hand before committing.

## Authoring checklist [presence:template-only]

- Save as `THIRD_PARTY_NOTICES.md` at the repository root. Keep the
  frontmatter and refresh `last_updated` on every change.
- List only what the package or distribution ships. Dependencies that are
  not bundled do not belong here.
- Write each package heading as `name version` (for example
  `left-pad 1.3.0`). The `## Package` heading is a pattern: its text
  `Package` is only a label, and every consecutive heading of the same level
  that matches `{text} {semver}` is checked against it. The package blocks
  are optional, so a file with none is valid.
- The `Summary` block with its `omit in toc` markers is optional. Its list is
  maintained by the Markdown All in One extension, not by hand.
- Headings are matched by exact level and exact text, in template order: Packages,
  the package blocks, Generated or derived material, Regeneration. Insert no
  section between them; add your own after `Regeneration` (a warning, not an
  error). Delete the optional sections you do not need.
- Every block carries the four bullets Upstream, License, Copyright and Used
  as, and the full license text. Public-domain items carry the URL of the
  statement and no license text.
- Replace every bracketed placeholder. Generate the package list with a tool
  and review it; do not type versions by hand.
- Never put secrets, tokens or personal paths in the file.
- Delete this section and every `[tag:...]` marker before saving.
