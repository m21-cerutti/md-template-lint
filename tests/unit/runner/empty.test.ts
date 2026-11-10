/**
 * Runner: empty target sets follow `onEmpty` (docs/spec.md 7.4, D02). Fixtures:
 * tests/fixtures/runner/empty-<case>/. `warn` is a run warning (exit 0), `error` a run
 * error (exit 2), `ignore` says nothing; a pair value overrides the global one.
 */
import { describe, expect, it } from "vitest";
import { report } from "../../../src/reporters/index.js";
import { expectSplit } from "../../helpers/fixtures.js";
import { runFixture } from "../../helpers/run.js";

const GROUP = "empty-";
const MESSAGE = "no files matched pair 'bugs' in root 'project'";
const DIAGNOSTIC = { code: "MTL913", message: MESSAGE, pair: "bugs", root: "project" };

interface Case {
  readonly name: string;
  readonly exitCode: 0 | 2;
  readonly severity: "warning" | "error" | null;
}

/** Exactly 1 passing case (nothing reported), failing cases >= passing. */
const CASES: readonly Case[] = [
  { name: "pass-ignore", exitCode: 0, severity: null },
  { name: "fail-warn-by-default", exitCode: 0, severity: "warning" },
  { name: "fail-error-global", exitCode: 2, severity: "error" },
  { name: "fail-pair-override-wins", exitCode: 2, severity: "error" },
];

describe("runner empty target sets: layout", () => {
  it("has exactly 1 pass- case, at least as many fail- cases, one directory each", () => {
    expectSplit("runner", GROUP, CASES);
  });
});

describe("runner empty target sets: onEmpty (spec 7.4)", () => {
  for (const testCase of CASES) {
    it(`${testCase.name}: ${testCase.severity ?? "silent"}, exit ${testCase.exitCode}`, async () => {
      const result = await runFixture(`${GROUP}${testCase.name}`);
      const expectError = testCase.severity === "error";
      const expectWarning = testCase.severity === "warning";
      expect(result.runErrors).toEqual(expectError ? [{ ...DIAGNOSTIC, severity: "error" }] : []);
      expect(result.runWarnings).toEqual(
        expectWarning ? [{ ...DIAGNOSTIC, severity: "warning" }] : [],
      );
      // Only a warning is printed in place on stdout; an error goes to stderr (7.4).
      expect(result.blocks).toHaveLength(expectWarning ? 1 : 0);
      expect(result.summary).toMatchObject({
        files: 0,
        // Run diagnostics never count as file warnings (D06).
        warnings: 0,
        runErrors: expectError ? 1 : 0,
        runWarnings: expectWarning ? 1 : 0,
        templatesChecked: 0,
        exitCode: testCase.exitCode,
      });
    });

    it(`${testCase.name}: closing line (spec 7.4, 8.2)`, async () => {
      const result = await runFixture(`${GROUP}${testCase.name}`);
      const { stdout, stderr } = report(result, { format: "plain", version: "1.0.0" });
      // "No files linted." replaces "All files passed!" unless a run error shows.
      expect(stdout.includes("No files linted.")).toBe(testCase.severity !== "error");
      expect(stdout.includes("All files passed!")).toBe(false);
      expect(stdout.includes(`INFO MTL913 ${MESSAGE}`)).toBe(testCase.severity === "warning");
      expect(stderr).toBe(testCase.severity === "error" ? `error MTL913: ${MESSAGE}\n` : "");
    });
  }
});
