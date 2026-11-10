/**
 * Runner: missing inputs (docs/spec.md 4.3, 6.6, 7.5, D01, D14). A missing root, a
 * missing template and a template that is a directory are run errors (exit 2) that
 * skip only what depends on them. Fixtures: tests/fixtures/runner/inputs-<case>/.
 */
import { describe, expect, it } from "vitest";
import { expectSplit } from "../../helpers/fixtures.js";
import { lintedFiles, runFixture } from "../../helpers/run.js";

const GROUP = "inputs-";

interface Case {
  readonly name: string;
  readonly exitCode: 0 | 1 | 2;
  readonly runErrors: readonly { code: string; message: string; pair?: string; root?: string }[];
  /** `root:pair:path` of the files still linted. */
  readonly linted: readonly string[];
  /** Files with errors among the linted ones (default 0). */
  readonly failed?: number;
}

/** Exactly 1 passing case, failing cases >= passing; one fixture directory per case. */
const CASES: readonly Case[] = [
  { name: "pass-all-present", exitCode: 0, runErrors: [], linted: ["project:notes:docs/a.md"] },
  {
    name: "fail-template-missing",
    exitCode: 2,
    runErrors: [
      {
        code: "MTL910",
        message: "template not found: templates/missing.template.md (pair 'ghost')",
        pair: "ghost",
      },
    ],
    linted: ["project:notes:docs/a.md"],
  },
  {
    name: "fail-template-is-directory",
    exitCode: 2,
    runErrors: [
      {
        code: "MTL911",
        message:
          "template path is not a regular file (for example a directory): templates/dir.template.md (pair 'dir')",
        pair: "dir",
      },
    ],
    linted: [],
  },
  {
    name: "fail-root-missing",
    exitCode: 2,
    runErrors: [
      {
        code: "MTL909",
        message: "root 'ghost' directory not found: does-not-exist",
        root: "ghost",
      },
    ],
    linted: ["project:notes:docs/a.md"],
  },
  {
    // Exit precedence (spec 7.5): a run error (2) wins over a failing file (1).
    name: "fail-run-error-outranks-failing-file",
    exitCode: 2,
    runErrors: [
      {
        code: "MTL910",
        message: "template not found: templates/missing.template.md (pair 'ghost')",
        pair: "ghost",
      },
    ],
    linted: ["project:notes:docs/b.md"],
    failed: 1,
  },
  {
    name: "fail-root-missing-outranks-failing-file",
    exitCode: 2,
    runErrors: [
      {
        code: "MTL909",
        message: "root 'ghost' directory not found: does-not-exist",
        root: "ghost",
      },
    ],
    linted: ["project:notes:docs/b.md"],
    failed: 1,
  },
  {
    // One pair on two roots with one missing template: one MTL910, not one per root.
    name: "fail-template-missing-on-two-roots",
    exitCode: 2,
    runErrors: [
      {
        code: "MTL910",
        message: "template not found: templates/missing.template.md (pair 'ghost')",
        pair: "ghost",
      },
    ],
    linted: [],
  },
];

describe("runner inputs: layout", () => {
  it("has exactly 1 pass- case, at least as many fail- cases, one directory each", () => {
    expectSplit("runner", GROUP, CASES);
  });
});

describe("runner inputs: run errors skip only what depends on them", () => {
  for (const testCase of CASES) {
    it(`${testCase.name}: exit ${testCase.exitCode}`, async () => {
      const result = await runFixture(`${GROUP}${testCase.name}`);
      expect(result.runErrors).toEqual(
        testCase.runErrors.map((error) => ({ ...error, severity: "error" })),
      );
      expect(result.runWarnings).toEqual([]);
      expect(lintedFiles(result)).toEqual(testCase.linted);
      expect(result.summary.exitCode).toBe(testCase.exitCode);
      expect(result.summary.runErrors).toBe(testCase.runErrors.length);
      expect(result.summary.failed).toBe(testCase.failed ?? 0);
    });
  }

  it("fail-template-missing: the other pair still ran and passed (D14)", async () => {
    const result = await runFixture(`${GROUP}fail-template-missing`);
    expect(result.summary).toMatchObject({ files: 1, passed: 1, failed: 0, exitCode: 2 });
  });

  it("fail-root-missing: a run error wins over a clean lint (exit 2, not 0)", async () => {
    const result = await runFixture(`${GROUP}fail-root-missing`);
    expect(result.summary).toMatchObject({ files: 1, passed: 1, failed: 0, exitCode: 2 });
  });
});
