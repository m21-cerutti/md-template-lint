---
id: 0006-parity-reached
title: Record that parity with the legacy linter is reached and remove the comparison tooling
status: accepted
date: 2026-10-30
deciders: [owner]
---

# ADR 0006: parity reached, comparison tooling removed

Parity with the legacy Python linter and the PowerShell wrappers was reached on 2026-10-30, and the tool that proved it is removed from the repository.

## Context

[ADR 0001](0001-genesis.md) made `pnpm run parity` the gate before the global install: a harness compared the port with frozen golden outputs of the legacy linter and the wrappers. The final run on 2026-10-30 exited 0.

- Corpus: 16 of the 17 projects of the golden manifest were compared (real documentation, agent and wiki projects of the owner, plus shared template sets). The 17th, `_edge` (legacy command-line edge cases replaced by the spec 7 CLI), was skipped with a reason for each entry. Two synthetic fixtures (`io-exists`, `value-tags`) covered what the corpus does not.
- Entries compared: 100 manifest entries.
- Divergences: 120, all documented, none undocumented: D01 77, D02 37, D12 3, D18 3 (decisions in [spec.md](../spec.md) section 5).

Once parity is reached the harness has no further use. Keeping it costs maintenance (its own tests and fixtures, a CI step, a build step) and it still depends on the frozen corpus and goldens.

## Decision

Parity is closed. The following are removed:

- the `parity` script of `package.json` and its steps in `.github/workflows/ci.yml` and `release.yml`;
- the harness `scripts/parity.ts` and `scripts/parity/`, its tests `tests/unit/parity/` and its synthetic fixtures `tests/parity-fixtures/`;
- `docs/PARITY_REPORT.md` and `tests/golden/DIFF.md`, which only described the harness run;
- every mention of the parity gate in the README, CONTRIBUTING and `docs/`.

At the time of this decision the frozen `legacy/`, `tests/corpus/` and `tests/golden/` data stayed, to be removed later together with the corpus and golden tests. `docs/research/wrapper-parity.md` stays as the research record of the legacy behaviour.

Update (2026-10-30): that later removal is done, so the frozen data no longer exists in the working tree (this settles the "kept to prove parity" line of [ADR 0001](0001-genesis.md)). The frozen data, its capture scripts and the tests that read it are removed. `docs/research/wrapper-parity.md` is shrunk to a history note.

## Consequences

- One gate fewer: `check:parser`, `check:rules`, `typecheck`, `lint`, `format:check`, `test` and `build`.
- The comparison cannot be re-run from the working tree.
- [ADR 0001](0001-genesis.md) and [ADR 0005](0005-packaging-and-release.md) still mention `pnpm run parity`. They carry a short update note pointing here; their decisions are not rewritten, and this record supersedes those mentions.
- The documented divergences remain the decisions of [spec.md](../spec.md) section 5.

## Alternatives considered

| Option                               | Pros                                          | Cons                                                                  | Verdict  |
| ------------------------------------ | --------------------------------------------- | --------------------------------------------------------------------- | -------- |
| Remove the harness, keep this record | Smaller repository, fewer gates               | The run cannot be repeated                                            | Chosen   |
| Keep the harness as a permanent gate | Catches regressions against the legacy output | Needs the frozen corpus and goldens forever, a CI step, its own tests | Rejected |
| Keep only the report                 | Readable result in the tree                   | It documents a command that no longer exists                          | Rejected |
