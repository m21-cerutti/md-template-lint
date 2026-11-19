/**
 * Projections shared by the characterization tests of large inputs (tests/unit/engine/large-*.test.ts,
 * tests/unit/runner/large-run.test.ts). A large ordered output is pinned three ways, so a failure
 * explains itself: its count, its code sequence and a few explicit rows (readable), and a digest of
 * the WHOLE projection (every message, in order). The digest is only a one-line pin of what the rows
 * and the sequence cannot show in full: a reordered, reworded or moved diagnostic changes it.
 */
import { createHash } from "node:crypto";
import type { Diagnostic } from "../../src/engine/model.js";
import { anchorLineOf } from "../../src/engine/rule.js";

/** The first 32 hex digits of the SHA-256 of the JSON of `value`. */
export function digestOf(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 32);
}

/** Codes in order, a run of one code written `CODExN`: `MTL201 MTL610x40 MTL606`. Any reorder changes it. */
export function codeSequence(codes: readonly string[]): string {
  const parts: string[] = [];
  for (let index = 0; index < codes.length;) {
    let end = index;
    while (end < codes.length && codes[end] === codes[index]) end += 1;
    parts.push(end - index === 1 ? (codes[index] ?? "") : `${codes[index]}x${end - index}`);
    index = end;
  }
  return parts.join(" ");
}

/** One diagnostic as pinned: code, severity, message, position line, heading, anchor line (DIR5). */
export type Row = readonly [code: string, severity: string, message: string, line: number | null, heading: string | null, anchor: number | null];

export const rowOf = (diagnostic: Diagnostic): Row => [diagnostic.code, diagnostic.severity, diagnostic.message, diagnostic.position?.line ?? null, diagnostic.heading ?? null, anchorLineOf(diagnostic)];

/** A row with its message cut to `width` characters, for the inline rows (the digest has the whole message). */
export const shortRow = (row: Row, width = 140): Row => [row[0], row[1], row[2].length > width ? `${row[2].slice(0, width)}...` : row[2], row[3], row[4], row[5]];

/** What a test pins of a list of diagnostics. */
export interface DiagnosticPin {
  readonly count: number;
  readonly suppressed: number;
  readonly sequence: string;
  readonly head: readonly Row[];
  readonly tail: readonly Row[];
  readonly digest: string;
}

export function pinOf(diagnostics: readonly Diagnostic[], suppressed: number, head = 4, tail = 2): DiagnosticPin {
  const rows = diagnostics.map(rowOf);
  return {
    count: rows.length,
    suppressed,
    sequence: codeSequence(rows.map((row) => row[0])),
    head: rows.slice(0, head).map((row) => shortRow(row)),
    tail: rows.slice(Math.max(rows.length - tail, 0)).map((row) => shortRow(row)),
    digest: digestOf(rows),
  };
}
