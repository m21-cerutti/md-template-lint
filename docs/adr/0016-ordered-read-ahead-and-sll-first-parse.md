---
id: 0016-ordered-read-ahead-and-sll-first-parse
title: Read targets ahead but lint them in order, and parse with SLL before LL
status: accepted
date: 2026-11-19
---

# ADR 0016: Ordered read-ahead and SLL-first parse

The runner reads up to 16 target files ahead of the file it lints, but lints and reports them
strictly in file order. The tag parser tries ANTLR's SLL prediction with a bail-out strategy
first and runs the full LL parse only when SLL reports an error. Both are speed changes: the
diagnostics, their order and the exit codes stay the same.

## Context

- The opt-in bench (`pnpm run bench`, see CONTRIBUTING) showed that on the file-count
  workloads (500 and 2000 files) about 40 % of the wall time was idle: `runPair` awaited one
  `lintFile` at a time and each `readUtf8` (three thread-pool round trips) never overlapped with
  the CPU work of the previous file.
- On the template-heavy workloads (a 600-heading template, 200 templates) the ANTLR adaptive
  prediction (full LL) was one of the largest costs of `loadTemplate` and the target parse.
- The output is a contract (see [spec.md](../spec.md)): diagnostics are listed per pair, per
  file, in file order; rules that use `io` (`[io:exists]`) and the `suppressed` count see one target at a
  time. Any change must keep that observable behaviour byte for byte.
- ANTLR documents that an SLL parse that finishes with no syntax error returns the tree full
  LL returns. Only the error path differs, and error texts are part of the output.

## Decision

- **Read ahead, lint in order.** `runPair` (`src/runner/run.ts`) starts `readUtf8` for the next
  `READ_AHEAD` (16) files while it lints the current one. The loop still awaits the read of file
  i, lints it, and pushes its result before it looks at file i+1. Only the I/O overlaps. A
  read failure keeps its slot and its message because `readUtf8` never rejects.
- **SLL first.** `parseSll` (`src/tags/listeners.ts`) parses with `PredictionMode.SLL`, a
  `BailErrorStrategy`, no error listeners and no tag listeners. When it ends with no lexer or
  parser error, its tree is used. On any error it returns null and the caller parses as before
  (full LL, collecting listeners), so every error path, grammar error text and event is the one
  of the LL pass.
- **Invariants to keep.** Results are produced in file order, one target at a time. The memory
  held by the read-ahead is bounded by the window. Listeners never run on a tree from a failed
  SLL attempt. `src/generated/` and the grammars are untouched.

## Consequences

- Positive: on the bench, 500 files go from 341.4 to 158.1 ms and 2000 files from 1348.6 to
  512.7 ms (median, Node v24.15.0, 16 CPUs); the large template and 200 templates workloads
  gain from the SLL pass (see the CHANGELOG for all five workloads).
- Positive: no change of output, so no spec change and no migration.
- Negative: up to 16 file texts are in memory at once instead of one.
- Negative: a document with a syntax error is parsed twice (SLL, then LL). Valid documents are
  the common case and are parsed once.
- Negative: the SLL contract is an ANTLR runtime property; an `antlr4ng` upgrade must keep the
  tests of the fallback green (`tests/unit/tags/sll-fallback.test.ts`).
- Follow-up: the characterization tests (`tests/unit/runner/large-run.test.ts` for the run
  order, `tests/unit/tags/large-parse.test.ts` for the parse) pin the behaviour; they must keep
  passing unchanged for any later change in these two places.

## Alternatives considered

| Option                                          | Pros                               | Cons                                                                  | Verdict  |
| ----------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------- | -------- |
| Read ahead with a bounded window, lint in order | Overlaps I/O, same output order    | Holds up to 16 texts                                                  | Chosen   |
| `Promise.all` over `lintFile`                   | Simplest parallel form             | Rules and `io` probes interleave across targets; unbounded memory     | Rejected |
| `readFileSync` in `readUtf8`                    | No window, no extra state          | Blocks the event loop; only removes the round trips                   | Rejected |
| SLL first, LL on error                          | Faster on valid input, same errors | Two parses on an invalid document; relies on the ANTLR SLL contract   | Chosen   |
| Always full LL (status quo)                     | One code path                      | Keeps the prediction cost on every parse                              | Rejected |
| Drop the second directive pass (grammar change) | Removes a whole lexer pass         | Needs a grammar and parser regeneration; gain inside noise (2 to 5 %) | Rejected |

## Research

- Bench: `scripts/bench.ts`, how to run it in [CONTRIBUTING.md](../../CONTRIBUTING.md#performance);
  the before and after medians are in the [CHANGELOG](../../CHANGELOG.md).
- Code: `src/runner/run.ts` (`READ_AHEAD`, `runPair`), `src/tags/listeners.ts` (`parseSll`),
  `src/tags/parser.ts` (two-stage parse).
