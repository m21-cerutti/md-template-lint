# Templates

Two folders hold the Markdown templates.

- [`generic/`](generic/): reusable skeletons for any project (ADR, bug, TODO, specs, architecture, IDEA, INDEX, research, research-tech, ai-capabilities, CHANGELOG, README, CONTRIBUTING, AI_GUIDELINE, THIRD_PARTY_NOTICES, and `generic/ai/` for AGENTS, agent, skill and command). Copy one and adapt it.
- This folder: the four variants this repository uses itself, wired in [`../md-template-lint.yml`](../md-template-lint.yml). Each keeps the name of its generic template (except `research-note`) and is fitted to one file of this repository:
  - `CHANGELOG.template.md`: optional `Summary` table of contents (maintained by the Markdown All in One extension) and optional `Area` headings in the groups.
  - `README.template.md`: the sections of this repository's README, optional frontmatter.
  - `research-note.template.md`: free-form history notes in `docs/research/`; only the frontmatter and the H1 are fixed.
  - `spec-technical.template.md`: the numbered sections of `docs/spec.md`.

Every other pair (ADR, AGENTS, ai-capabilities, CONTRIBUTING, AI_GUIDELINE, THIRD_PARTY_NOTICES, architecture, IDEA, TODO, INDEX) uses the template in `generic/` directly. CONTRIBUTING, AI_GUIDELINE, THIRD_PARTY_NOTICES and architecture carry the optional `Summary` table of contents there.

Check any template with `mdtl --verify <file>`. The index is in [`../docs/INDEX.md`](../docs/INDEX.md#templates).
