/** MTL001 frontmatter-missing (src/rules/syntax.ts, docs/spec.md 2.1, 4.3, 7.3), via `--verify`. */
import { describe, expect, it } from "vitest";
import { createRegistry } from "../../../src/engine/registry.js";
import { expectTemplateCases, verifyFixture, type VerifyCase } from "../../helpers/verify.js";

const CODE = "MTL001";
const DIR = "tests/fixtures/templates/MTL001";
const BROKEN = {
  exitCode: 1,
  status: "broken",
  diagnostics: [{ code: CODE, severity: "error", message: "File must have YAML frontmatter (---...---)" }],
} as const;

/** Case -> fixture `<name>.md` -> expected `--verify` result. */
const CASES: readonly VerifyCase[] = [
  // The frontmatter opens on the first line and is closed.
  { name: "pass-frontmatter-on-first-line", exitCode: 0, status: "ok", diagnostics: [] },
  // A Markdown file without any `---` block.
  { name: "fail-no-frontmatter", ...BROKEN },
  // Only the first line can open the frontmatter.
  { name: "fail-frontmatter-after-blank-line", ...BROKEN },
  // An opening `---` without a closing one.
  { name: "fail-frontmatter-never-closed", ...BROKEN },
];

describe("MTL001 frontmatter-missing (--verify)", () => {
  it("is registered in category syntax, error, phase parse", () => {
    expect(createRegistry().byCode.get(CODE)).toMatchObject({
      name: "frontmatter-missing",
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
