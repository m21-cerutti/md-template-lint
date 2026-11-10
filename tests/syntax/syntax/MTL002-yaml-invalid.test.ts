/** MTL002 yaml-invalid (src/rules/syntax.ts, docs/spec.md 2.1, 4.3, 7.3), via `--verify`. */
import { describe, expect, it } from "vitest";
import { createRegistry } from "../../../src/engine/registry.js";
import { expectTemplateCases, verifyFixture, type VerifyCase } from "../../helpers/verify.js";

const CODE = "MTL002";
const DIR = "tests/fixtures/templates/MTL002";

/**
 * Spec 4.3: `YAML parse error: {detail}`, the detail is the `yaml` package message (pinned
 * version); the JSON reporter prints its line breaks as spaces.
 */
const broken = (detail: string) =>
  ({
    exitCode: 1,
    status: "broken",
    diagnostics: [{ code: CODE, severity: "error", message: `YAML parse error: ${detail}` }],
  }) as const;

/** Case -> fixture `<name>.md` -> expected `--verify` result. */
const CASES: readonly VerifyCase[] = [
  // Quoted string, flow sequence and nested mapping all parse.
  { name: "pass-valid-yaml", exitCode: 0, status: "ok", diagnostics: [] },
  // A flow sequence `[a, b` that is never closed.
  {
    name: "fail-unclosed-flow-sequence",
    ...broken(
      "Flow sequence in block collection must be sufficiently indented and end with a ] " +
        "at line 2, column 1: tags: [a, b ^ ",
    ),
  },
  // A double-quoted string that is never closed.
  {
    name: "fail-unclosed-quoted-string",
    ...broken('Missing closing "quote at line 2, column 1: title: "open ^ '),
  },
];

describe("MTL002 yaml-invalid (--verify)", () => {
  it("is registered in category syntax, error, phase parse", () => {
    expect(createRegistry().byCode.get(CODE)).toMatchObject({
      name: "yaml-invalid",
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
