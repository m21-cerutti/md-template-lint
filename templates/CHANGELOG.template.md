---
last_updated: 2026-10-30  # [presence:required] type=date
---

# Changelog

All notable changes to this project are listed here. The format follows Keep a
Changelog and the project uses semantic versioning.

## Unreleased

### Added

- New feature, written for a user, not for a developer.

### Changed

- Change in existing behaviour.

### Deprecated

- Feature that will be removed in a later release.

### Removed

- Feature removed in this release.

### Fixed

- Bug fix, with the symptom the user saw.

### Security

- Vulnerability fixed, with the affected versions.

## 1.0.0 - 2026-01-01 [presence:optional] [content:list]

### Added

- Initial release.

## Authoring checklist [presence:template-only]

- Save as `CHANGELOG.md` at the repository root. Keep the frontmatter and
  refresh `last_updated` on every change.
- Keep a Changelog writes release headings as `## [1.0.0] - 2026-01-01`. A
  trailing `[...]` on a heading is read as a template tag, so this template
  uses the plain form `## Unreleased` and `## 1.0.0 - 2026-01-01`. Use the
  plain form in the real file too, otherwise the linter reports the bracketed
  heading as missing.
- Known engine gap: the linter cannot check that a release heading looks like
  `X.Y.Z - YYYY-MM-DD`, because a version and date heading pattern rule does not
  exist yet. Until then the placeholder release heading is optional and its text
  is not compared.
- Keep `## Unreleased` at the top. Put newer releases above older ones.
- The six groups are `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed` and
  `Security`, in that order, as H3 headings. Only H1 and H2 headings can carry
  tags, so the groups cannot be marked optional or checked: drop every group
  that has no entry.
- Write one bullet per change, in the past tense, aimed at the user.
- Never paste secrets, tokens or private paths into an entry.
- Delete this section and every `[tag:...]` marker before saving.
