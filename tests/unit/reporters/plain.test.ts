/**
 * Plain reporter: the pretty layout with ASCII words (PASS, FAIL, INFO), never colored.
 * Echoed document values are sanitized (docs/spec.md 8, OWASP A03). Expected-output files:
 * tests/fixtures/runner/report-*\/expected.plain.txt.
 */
import { describe, expect, it } from "vitest";
import { cleanText, report } from "../../../src/reporters/index.js";
import { readFixture } from "../../helpers/fixtures.js";
import { runFixture } from "../../helpers/run.js";

const VERSION = "1.0.0";
const ESC = String.fromCharCode(27);

describe("plain reporter: expected output", () => {
  for (const name of [
    "report-sample",
    "report-control-characters",
    "report-config-error",
    "report-multi-root-warnings",
  ]) {
    it(`${name}: matches expected.plain.txt`, async () => {
      const result = await runFixture(name);
      const { stdout } = report(result, { format: "plain", version: VERSION, color: true });
      expect(stdout).toBe(readFixture("runner", name, "expected.plain.txt"));
      // Plain is never colored, even when color is asked.
      expect(stdout.includes(ESC)).toBe(false);
    });
  }

  it("report-config-error: config errors name file, line and column on stderr", async () => {
    const result = await runFixture("report-config-error");
    const { stderr } = report(result, { format: "plain", version: VERSION });
    expect(stderr).toBe(readFixture("runner", "report-config-error", "expected.stderr.txt"));
    expect(result.summary.exitCode).toBe(2);
    expect(result.blocks).toEqual([]);
  });
});

describe("reporters sanitize control characters of echoed values", () => {
  it("report-control-characters: no raw escape, bidi override or line break reaches any output", async () => {
    const result = await runFixture("report-control-characters");
    for (const format of ["pretty", "plain", "json"] as const) {
      const { stdout, stderr } = report(result, { format, version: VERSION });
      for (const text of [stdout, stderr]) {
        expect(text.includes(ESC), `${format}: ESC`).toBe(false);
        expect(text.includes("\u202e"), `${format}: RLO`).toBe(false);
        expect(text.includes("\r"), `${format}: CR`).toBe(false);
        expect(text.includes("\t"), `${format}: TAB`).toBe(false);
      }
    }
  });

  const cases: readonly (readonly [string, string])[] = [
    ["plain text", "plain text"],
    ["a\nb", "a b"],
    ["a\r\n\tb", "a b"],
    ["a  b", "a  b"],
    [`x${ESC}[2Jy`, "x\\x1b[2Jy"],
    ["bell\u0007", "bell\\x07"],
    ["del\u007f", "del\\x7f"],
    ["c1\u009b", "c1\\x9b"],
    ["rlo\u202etxt", "rlo\\u202etxt"],
    ["isolate\u2066x\u2069", "isolate\\u2066x\\u2069"],
    ["bom\ufeffx", "bom\\ufeffx"],
    ["ls\u2028ps\u2029x", "ls ps x"],
    ["unicode é ✓ 日本", "unicode é ✓ 日本"],
    // kept: a no-break space and an astral character are printable
    ["nbsp\u00a0kept", "nbsp\u00a0kept"],
    ["astral \u{1f600} kept", "astral \u{1f600} kept"],
    ["", ""],
    // the last C0 control, the arabic letter mark, the direction marks
    ["us\u001f", "us\\x1f"],
    ["alm\u061c", "alm\\u061c"],
    ["lrm\u200e rlm\u200f", "lrm\\u200e rlm\\u200f"],
    ["\u202a\u202b\u202c\u202d", "\\u202a\\u202b\\u202c\\u202d"],
    ["\u202e", "\\u202e"],
    ["\u2069", "\\u2069"],
    // a break at the ends keeps one space
    ["\nx\n", " x "],
  ];
  for (const [input, expected] of cases) {
    it(`cleanText(${JSON.stringify(input)})`, () => {
      expect(cleanText(input)).toBe(expected);
    });
  }
});
