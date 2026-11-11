/**
 * MTL004 file-unreadable (src/rules/syntax.ts, docs/spec.md 4.3, 7.3), via `--verify`. A template
 * that is not valid UTF-8 is broken (exit 1) and the message carries no path. The two failing
 * fixtures hold raw bytes (`.gitattributes` keeps them as they are).
 */
import { describe, expect, it } from "vitest";
import { createRegistry } from "../../../src/engine/registry.js";
import { expectTemplateCases, verifyFixture, type VerifyCase } from "../../helpers/verify.js";

const CODE = "MTL004";
const DIR = "tests/fixtures/templates/MTL004";
const BROKEN = {
  exitCode: 1,
  status: "broken",
  diagnostics: [{ code: CODE, severity: "error", message: "file is not valid UTF-8" }],
} as const;

/** Case -> fixture `<name>.md` -> expected `--verify` result. */
const CASES: readonly VerifyCase[] = [
  // Non-ASCII text encoded as UTF-8 reads fine.
  { name: "pass-valid-utf8-text", exitCode: 0, status: "ok", diagnostics: [] },
  // The byte 0xFF never occurs in UTF-8.
  { name: "fail-invalid-byte", ...BROKEN },
  // The file ends inside a two-byte sequence (a lone 0xC3).
  { name: "fail-truncated-multibyte-sequence", ...BROKEN },
];

describe("MTL004 file-unreadable (--verify)", { tags: ["MTL004", "syntax"] }, () => {
  it("is registered in category syntax, error, phase parse", () => {
    expect(createRegistry().byCode.get(CODE)).toMatchObject({
      name: "file-unreadable",
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
