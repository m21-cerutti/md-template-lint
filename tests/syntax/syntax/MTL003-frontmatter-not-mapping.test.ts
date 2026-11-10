/** MTL003 frontmatter-not-mapping (src/rules/syntax.ts, docs/spec.md 2.1, 4.3, 7.3), via `--verify`. */
import { describe, expect, it } from "vitest";
import { createRegistry } from "../../../src/engine/registry.js";
import { expectTemplateCases, verifyFixture, type VerifyCase } from "../../helpers/verify.js";

const CODE = "MTL003";
const DIR = "tests/fixtures/templates/MTL003";
const BROKEN = {
  exitCode: 1,
  status: "broken",
  diagnostics: [
    {
      code: CODE,
      severity: "error",
      message: "YAML frontmatter must be a mapping of 'key: value' pairs",
    },
  ],
} as const;

/** Case -> fixture `<name>.md` -> expected `--verify` result. */
const CASES: readonly VerifyCase[] = [
  // `key: value` pairs.
  { name: "pass-mapping-frontmatter", exitCode: 0, status: "ok", diagnostics: [] },
  // The frontmatter is a YAML sequence.
  { name: "fail-sequence-frontmatter", ...BROKEN },
  // The frontmatter is a plain scalar.
  { name: "fail-scalar-frontmatter", ...BROKEN },
];

describe("MTL003 frontmatter-not-mapping (--verify)", () => {
  it("is registered in category syntax, error, phase parse", () => {
    expect(createRegistry().byCode.get(CODE)).toMatchObject({
      name: "frontmatter-not-mapping",
      category: "syntax",
      severity: "error",
      phase: "parse",
    });
  });

  it("has at least 1 pass- case and at least 1 fail- case, one fixture file each", () => {
    expectTemplateCases(CODE, CASES);
  });

  for (const { name, ...expected } of CASES) {
    it(`${name}: ${DIR}/${name}.md`, async () => {
      expect(await verifyFixture(CODE, name)).toEqual(expected);
    });
  }
});
