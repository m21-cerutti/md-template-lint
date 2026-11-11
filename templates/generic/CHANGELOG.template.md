---
last_updated: 2026-10-30 # [presence:required] [format:date] [date]
---

# Changelog

All notable changes to this project are listed here. The format follows Keep a
Changelog and the project uses semantic versioning.

## Unreleased

### Added [presence:optional] [content:list]

- New feature, written for a user, not for a developer.

### Changed [presence:optional] [content:list]

- Change in existing behaviour.

### Deprecated [presence:optional] [content:list]

- Feature that will be removed in a later release.

### Removed [presence:optional] [content:list]

- Feature removed in this release.

### Fixed [presence:optional] [content:list]

- Bug fix, with the symptom the user saw.

### Security [presence:optional] [content:list]

- Vulnerability fixed, with the affected versions.

## Release [pattern:"[{semver}] - {date}"] [presence:optional] [repeat-rules:same-level] [order:first:date:descending] [content:subheadings:disallow]

### Added [presence:optional] [content:list]

- Initial release.

### Changed [presence:optional] [content:list]

- Change in existing behaviour.

### Deprecated [presence:optional] [content:list]

- Feature that will be removed in a later release.

### Removed [presence:optional] [content:list]

- Feature removed in this release.

### Fixed [presence:optional] [content:list]

- Bug fix, with the symptom the user saw.

### Security [presence:optional] [content:list]

- Vulnerability fixed, with the affected versions.

## Authoring checklist [presence:template-only]

- Save as `CHANGELOG.md` at the repository root. Keep the frontmatter and
  refresh `last_updated` on every change.
- Write release headings as Keep a Changelog does: `## [1.0.0] - 2026-01-01`,
  a version in square brackets, then `-`, then an ISO date. The `## Release`
  heading is a pattern (`[{semver}] - {date}`): its text `Release` is only a
  label, and every `## [X.Y.Z] - YYYY-MM-DD` heading in the real file is
  checked against it. `## Unreleased` stays a plain heading.
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
  present must hold at least one bullet. The groups are checked under every
  release, and a release may not hold any other sub-heading.
- Write one bullet per change, in the past tense, aimed at the user.
- Never paste secrets, tokens or private paths into an entry.
- Delete this section and every `[tag:...]` marker before saving.
