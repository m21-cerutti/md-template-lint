---
last_updated: 2026-11-11 # [presence:required] [format:date] [date]
---

# Changelog

All notable changes to this project are listed here. The format follows Keep a
Changelog and the project uses semantic versioning.

## Summary [presence:optional] [content:non-empty]

- Table of contents: one link per section.

## Unreleased

### Added [presence:optional] [content:list]

- New feature, written for a user, not for a developer.

#### Area [pattern:"{text}"] [presence:optional] [repeat-rules:same-level] [content:list]

- New feature of this area (for example CLI, Rules or Documentation).

### Changed [presence:optional] [content:list]

- Change in existing behaviour.

#### Area [pattern:"{text}"] [presence:optional] [repeat-rules:same-level] [content:list]

- Change of this area.

### Deprecated [presence:optional] [content:list]

- Feature that will be removed in a later release.

#### Area [pattern:"{text}"] [presence:optional] [repeat-rules:same-level] [content:list]

- Deprecated feature of this area.

### Removed [presence:optional] [content:list]

- Feature removed in this release.

#### Area [pattern:"{text}"] [presence:optional] [repeat-rules:same-level] [content:list]

- Feature of this area removed in this release.

### Fixed [presence:optional] [content:list]

- Bug fix, with the symptom the user saw.

#### Area [pattern:"{text}"] [presence:optional] [repeat-rules:same-level] [content:list]

- Bug fix of this area.

### Security [presence:optional] [content:list]

- Vulnerability fixed, with the affected versions.

#### Area [pattern:"{text}"] [presence:optional] [repeat-rules:same-level] [content:list]

- Vulnerability of this area.

## Release [pattern:"[{semver}] - {date}"] [presence:optional] [repeat-rules:same-level] [order:first:date:descending] [content:subheadings:disallow]

### Added [presence:optional] [content:list]

- Initial release.

#### Area [pattern:"{text}"] [presence:optional] [repeat-rules:same-level] [content:list]

- New feature of this area (for example CLI, Rules or Documentation).

### Changed [presence:optional] [content:list]

- Change in existing behaviour.

#### Area [pattern:"{text}"] [presence:optional] [repeat-rules:same-level] [content:list]

- Change of this area.

### Deprecated [presence:optional] [content:list]

- Feature that will be removed in a later release.

#### Area [pattern:"{text}"] [presence:optional] [repeat-rules:same-level] [content:list]

- Deprecated feature of this area.

### Removed [presence:optional] [content:list]

- Feature removed in this release.

#### Area [pattern:"{text}"] [presence:optional] [repeat-rules:same-level] [content:list]

- Feature of this area removed in this release.

### Fixed [presence:optional] [content:list]

- Bug fix, with the symptom the user saw.

#### Area [pattern:"{text}"] [presence:optional] [repeat-rules:same-level] [content:list]

- Bug fix of this area.

### Security [presence:optional] [content:list]

- Vulnerability fixed, with the affected versions.

#### Area [pattern:"{text}"] [presence:optional] [repeat-rules:same-level] [content:list]

- Vulnerability of this area.

## Authoring checklist [presence:template-only]

- Save as `CHANGELOG.md` at the repository root. Keep the frontmatter and
  refresh `last_updated` on every change.
- Write release headings as Keep a Changelog does: `## [1.0.0] - 2026-01-01`,
  a version in square brackets, then `-`, then an ISO date. The `## Release`
  heading is a pattern (`[{semver}] - {date}`): its text `Release` is only a
  label, and every `## [X.Y.Z] - YYYY-MM-DD` heading in the real file is
  checked against it. `## Unreleased` stays a plain heading.
- The `Summary` block with its `omit in toc` markers is optional. Its list is
  maintained by the Markdown All in One extension, not by hand.
- Keep `## Unreleased` at the top. Put newer releases above older ones: the
  releases must be in descending date order (a release out of order is
  reported). A file with no release yet is valid, the release heading is
  optional.
- The six groups are `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed` and
  `Security`, as H3 headings. They should appear in that order; a group out of
  order or twice only gives a warning. Headings are matched by exact level and
  exact text, in template order: insert no section between template sections;
  add your own after the last one (a warning, not an error). Every heading
  level can carry tags and is checked, so the groups are marked
  `[presence:optional]`: drop every group that has no entry. A group that is
  present must hold at least one bullet, directly or under its areas. The
  groups are checked under every release, and a release may hold no other
  sub-heading than the groups and their areas.
- Inside a group, entries may be sorted under H4 area headings such as `CLI`,
  `Configuration`, `Rules`, `Syntax`, `Reporting`, `Packaging and release`,
  `Tooling`, `Documentation` and `Tests`. The `#### Area` heading is a pattern
  (`{text}`): its text `Area` is only a label, and the real area names are
  free text. Areas are optional and repeatable: a group may hold bullets
  only, or one H4 per area, with the same area names and order in every
  group. Use no heading deeper than H4.
- Write one bullet per change, in the past tense, aimed at the user.
- Never paste secrets, tokens or private paths into an entry.
- Delete this section and every `[tag:...]` marker before saving.
