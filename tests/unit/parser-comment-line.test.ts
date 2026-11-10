/**
 * Frontmatter comment lines and key comments of the document parser (src/tags/parser.ts,
 * src/tags/key.ts): the kind given to every frontmatter line, a bracket of an unknown family
 * that is plain prose, the decoding of a quoted key in a finding subject, and a malformed
 * `[filename:...]` directive on its own line.
 *
 * Fixture of a case: `tests/fixtures/tags/<name>/document.md`. At least 1 passing case and 1
 * failing case.
 */
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { fixturePath, expectSplit } from "../helpers/fixtures.js";
import { analyzeDocument } from "../../src/tags/parser.js";

interface Expected {
  readonly name: string;
  readonly frontmatterKinds: readonly string[];
  readonly bodyKinds: readonly string[];
  readonly findings: readonly {
    readonly reason: string;
    readonly tag: string;
    readonly subject: unknown;
  }[];
}

const CASES: readonly Expected[] = [
  {
    // Whole-line comment, own-line `[presence:...]` (a candidate that is not a filename directive,
    // so a plain comment), own-line and inline `[note: ...]` (unknown family, prose: no finding),
    // a key without value, a blank line, an indented continuation line, and a heading with the
    // same prose bracket.
    name: "pass-every-frontmatter-line-kind",
    frontmatterKinds: ["comment", "comment", "comment", "key", "key", "blank", "other"],
    bodyKinds: ["heading", "text", "heading"],
    findings: [],
  },
  {
    // Keys: invalid hex escape and out-of-range code point are kept as written, `''` is decoded,
    // `\x41` is decoded.
    name: "fail-quoted-key-subject-decoding",
    frontmatterKinds: ["key", "key", "key", "key"],
    bodyKinds: [],
    findings: [
      { reason: "unknown", tag: "[nope:y]", subject: { field: "a\\x4Zb" } },
      { reason: "unknown", tag: "[nope:y]", subject: { field: "c\\UFFFFFFFFd" } },
      { reason: "unknown", tag: "[nope:y]", subject: { field: "it's" } },
      { reason: "unknown", tag: "[nope:y]", subject: { field: "tabA" } },
    ],
  },
  {
    name: "fail-malformed-filename-directive",
    frontmatterKinds: ["filename", "key"],
    bodyKinds: [],
    findings: [{ reason: "malformed", tag: "[filename:case:bogus]", subject: null }],
  },
];

const read = (name: string): string =>
  readFileSync(`${fixturePath("tags", name)}/document.md`, "utf8");

describe("parser: frontmatter comment lines and key comments", () => {
  it("has at least 1 pass- case and at least 1 fail- case, one fixture dir each", () => {
    expectSplit("tags", "", CASES);
    for (const testCase of CASES) {
      expect(readdirSync(fixturePath("tags", testCase.name))).toEqual(["document.md"]);
    }
  });

  for (const testCase of CASES) {
    it(`${testCase.name}: tests/fixtures/tags/${testCase.name}`, () => {
      const analysis = analyzeDocument(read(testCase.name));
      expect(analysis.grammarErrors).toEqual([]);
      expect(analysis.document?.frontmatter?.lines.map((line) => line.kind)).toEqual(
        testCase.frontmatterKinds,
      );
      expect(analysis.document?.body.map((block) => block.kind)).toEqual(testCase.bodyKinds);
      expect(
        analysis.findings.map((f) => ({ reason: f.reason, tag: f.tag, subject: f.subject })),
      ).toEqual(testCase.findings);
    });
  }
});
