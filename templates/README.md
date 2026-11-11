# Templates

Two folders hold the Markdown templates.

- [`generic/`](generic/): reusable skeletons for any project (ADR, bug, TODO, specs, architecture, IDEA, ai-capabilities, CHANGELOG, README, CONTRIBUTING, AI_GUIDELINE, THIRD_PARTY_NOTICES, and `generic/ai/` for AGENTS, agent, skill and command). Copy one and adapt it.
- This folder: the variants this repository uses itself, wired in [`../md-template-lint.yml`](../md-template-lint.yml). They keep the generic file names and differ only by project choices:
  - an optional `Summary` table of contents, maintained by the Markdown All in One extension (architecture, CHANGELOG, CONTRIBUTING, AI_GUIDELINE, THIRD_PARTY_NOTICES);
  - optional `Area` headings in the CHANGELOG groups;
  - `Overview` as the first CONTRIBUTING section and `Packages` as the package table of the notices (both `Summary` in the generic form).

A pair without a variant (ADR, AGENTS, ai-capabilities and the others) uses the template in `generic/` directly.

Check any template with `mdtl --verify <file>`. The index is in [`../docs/README.md`](../docs/README.md#templates).
