/**
 * MTL013 misplaced-tag (src/rules/syntax.ts, docs/spec.md 2.7, 4.3, 7.3, change C05), via
 * `--verify`. A tag of the other region. A warning: `--verify` exits 0.
 */
import { describe, expect, it } from "vitest";
import { createRegistry } from "../../../src/engine/registry.js";
import { expectTemplateCases, verifyFixture, type VerifyCase } from "../../helpers/verify.js";

const CODE = "MTL013";
const DIR = "tests/fixtures/templates/MTL013";

const warning = (message: string, line: number, column: number, sourceLine: string) =>
  ({ code: CODE, severity: "warning", message, line, column, sourceLine }) as const;

/** Case -> fixture `<name>.md` -> expected `--verify` result. */
const CASES: readonly VerifyCase[] = [
  // A field tag on a key line and a heading tag on a heading.
  { name: "pass-tags-in-their-region", exitCode: 0, status: "ok", diagnostics: [] },
  // A heading tag on a key line.
  {
    name: "fail-heading-tag-in-frontmatter",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      warning(
        "Field 'n': tag [content:table] is not valid in frontmatter",
        2,
        8,
        "n: x # [content:table]",
      ),
    ],
  },
  // A field tag on a heading.
  {
    name: "fail-field-tag-in-heading",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      warning(
        "Heading 'Notes [count:min:1]': tag [count:min:1] is not valid in a heading",
        4,
        10,
        "## Notes [count:min:1]",
      ),
    ],
  },
];

describe("MTL013 misplaced-tag (--verify)", () => {
  it("is registered in category syntax, warning, phase template", () => {
    expect(createRegistry().byCode.get(CODE)).toMatchObject({
      name: "misplaced-tag",
      category: "syntax",
      severity: "warning",
      phase: "template",
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
