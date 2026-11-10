/**
 * Runner: a target that does not parse is a file failure printed `Parse error: <message>`
 * (docs/spec.md 4.1 step 1, 4.3 MTL001 to MTL003), exit 1, and the other files are still
 * linted. Fixtures: tests/fixtures/runner/parse-<case>/ (one target `docs/t.md` each).
 */
import { describe, expect, it } from "vitest";
import { expectSplit } from "../../helpers/fixtures.js";
import { runFixture } from "../../helpers/run.js";

const GROUP = "parse-";

interface Case {
  readonly name: string;
  readonly code: string | null;
  /** Expected message, or a prefix when `prefix` is set (messages of the YAML library). */
  readonly message?: string;
  readonly prefix?: boolean;
}

/** Exactly 1 passing case, failing cases >= passing; one fixture directory per case. */
const CASES: readonly Case[] = [
  { name: "pass-clean-target", code: null },
  {
    name: "fail-no-frontmatter",
    code: "MTL001",
    message: "Parse error: File must have YAML frontmatter (---...---)",
  },
  {
    name: "fail-zero-byte-target",
    code: "MTL001",
    message: "Parse error: File must have YAML frontmatter (---...---)",
  },
  {
    name: "fail-yaml-invalid",
    code: "MTL002",
    message: "Parse error: YAML parse error: ",
    prefix: true,
  },
  {
    name: "fail-frontmatter-not-mapping",
    code: "MTL003",
    message: "Parse error: YAML frontmatter must be a mapping of 'key: value' pairs",
  },
];

describe("runner parse errors: layout", () => {
  it("has exactly 1 pass- case, at least as many fail- cases, one directory each", () => {
    expectSplit("runner", GROUP, CASES);
  });
});

describe("runner parse errors: Parse error: prefix on a target (spec 4.1)", () => {
  for (const testCase of CASES) {
    it(`${testCase.name}: ${testCase.code ?? "no diagnostic"}`, async () => {
      const result = await runFixture(`${GROUP}${testCase.name}`);
      const [block] = result.blocks;
      if (block?.kind !== "pair") throw new Error("expected a pair block");
      const [file] = block.files;
      expect(block.files).toHaveLength(1);
      if (testCase.code === null) {
        expect(file).toMatchObject({ path: "docs/t.md", status: "pass", errors: [], warnings: [] });
        expect(result.summary.exitCode).toBe(0);
        return;
      }
      expect(file?.status).toBe("fail");
      expect(file?.errors).toHaveLength(1);
      expect(file?.errors[0]?.code).toBe(testCase.code);
      expect(file?.errors[0]?.severity).toBe("error");
      const message = file?.errors[0]?.message ?? "";
      if (testCase.prefix === true) expect(message.startsWith(testCase.message ?? "")).toBe(true);
      else expect(message).toBe(testCase.message);
      // Only a parse failure is reported; no further check runs on the file.
      expect(file?.warnings).toEqual([]);
      expect(result.summary).toMatchObject({ files: 1, failed: 1, exitCode: 1 });
    });
  }
});
