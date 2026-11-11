---
title: Wrapper and legacy linter parity research (history note)
last_updated: 2026-10-30
---

# Wrapper and legacy linter parity research (history note)

Phase A1 recorded what the legacy Python linter and its PowerShell wrappers did,
so the port could be compared with them. The record was built on a frozen,
redacted snapshot of the legacy tools, a frozen corpus of template and target
files, and golden outputs captured from the legacy tools on that corpus.

Parity was reached on 2026-10-30 ([ADR 0006](../adr/0006-parity-reached.md)).
After that, the snapshot, the corpus, the golden outputs, their capture scripts
and the tests that read them were removed from the tree (phase A39). The test
suite is now a set of minimal synthetic rule-case tests (see
[architecture.md](../architecture.md), "Tests: rule cases").

The defect ids `D01` to `D18` used in [spec.md](../spec.md) section 5 come from
that research; each one is described and decided in the spec itself, so the
spec does not need this document to be read.
