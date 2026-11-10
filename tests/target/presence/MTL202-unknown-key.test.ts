/** MTL202 unknown-key (src/rules/presence.ts, docs/spec.md 4.1 step 4, 4.3). */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL202";
const DIR = "tests/fixtures/pairs/MTL202";

/** Spec 4.3 message of MTL202 (a warning). */
const message = (key: string): string => `Unknown key '${key}' not present in template`;

interface TestCase {
  readonly name: string;
  readonly expected: readonly string[];
}

/** Case -> fixture dir (same name) -> expected result: at least 1 passing case and 1 failing case. */
const CASES: readonly TestCase[] = [
  { name: "pass-all-keys-declared", expected: [] },
  // One key the template does not declare.
  { name: "fail-single-undeclared-key", expected: [message("authors")] },
  // Several unknown keys, in target key order.
  { name: "fail-multiple-undeclared-keys", expected: [message("zeta"), message("alpha")] },
  // Key names are case sensitive; an empty value is still an unknown key.
  { name: "fail-key-case-mismatch", expected: [message("Owner")] },
];

const read = (path: string): string => readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

/** Diagnostics of this code for the pair of a fixture folder. */
async function lint(testCase: TestCase) {
  const fixture = `${DIR}/${testCase.name}`;
  const status = await checkTemplate(registry, read(`${fixture}/template.md`));
  if (status.status !== "ok") throw new Error(`${fixture}: template is broken`);
  const found = await checkTarget(registry, status.model, read(`${fixture}/target.md`), `${fixture}/target.md`, createEnv());
  return found.filter((diagnostic) => diagnostic.code === CODE);
}

describe("MTL202 unknown-key", () => {
  it("is registered in category presence, warning, target step unknown-keys", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "unknown-key",
      category: "presence",
      severity: "warning",
      phase: "target",
      step: "unknown-keys",
    });
  });

  it("has at least 1 pass- case and at least 1 fail- case, one fixture dir each", () => {
    const passing = CASES.filter((testCase) => testCase.name.startsWith("pass-"));
    const failing = CASES.filter((testCase) => testCase.name.startsWith("fail-"));
    expect(passing.length).toBeGreaterThanOrEqual(1);
    expect(failing.length).toBeGreaterThanOrEqual(1);
    expect(passing.length + failing.length).toBe(CASES.length);
    expect(CASES.filter((testCase) => testCase.expected.length === 0)).toEqual(passing);
    const dirs = readdirSync(fileURLToPath(new URL(`../../../${DIR}`, import.meta.url))).sort();
    expect(dirs).toEqual(CASES.map((testCase) => testCase.name).sort());
  });

  for (const testCase of CASES) {
    it(`${testCase.name}: ${DIR}/${testCase.name}`, async () => {
      const found = await lint(testCase);
      expect(found.map((diagnostic) => diagnostic.message)).toEqual(testCase.expected);
      for (const diagnostic of found) {
        expect(diagnostic.severity).toBe("warning");
        expect(diagnostic.position).toBeNull();
      }
    });
  }
});
