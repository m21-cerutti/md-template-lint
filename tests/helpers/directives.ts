/**
 * Shared steps of the directive rule cases (MTL020 to MTL025, docs/spec.md 4.3, 4.4): lint one
 * pair fixture `<dir>/<case>/template.md` + `target.md` through the pipeline and keep the
 * diagnostics of one code, with the directive position they carry. Each test file still owns
 * its case table and its fixture folder (tests/consistency/rule-fixtures.ts).
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect } from "vitest";
import { checkTemplate, lintTarget } from "../../src/engine/pipeline.js";
import { createRegistry } from "../../src/engine/registry.js";
import { createEnv } from "../../src/engine/rule.js";
import { REPO_ROOT } from "./fixtures.js";

export const registry = createRegistry();

/** One directive warning as asserted: message, then the line and column of the directive. */
export interface Found {
  readonly message: string;
  readonly line: number;
  readonly column: number;
}

/** The warning of the directive at `line`, `column`: `Directive on line {line}: <text>`. */
export const at = (line: number, column: number, text: string): Found => ({
  message: `Directive on line ${line}: ${text}`,
  line,
  column,
});

const read = (path: string): string => readFileSync(join(REPO_ROOT, path), "utf8");

/** The diagnostics of `code` for the pair fixture `<dir>/<name>`; every one is a warning. */
export async function findingsOf(dir: string, name: string, code: string): Promise<Found[]> {
  const fixture = `${dir}/${name}`;
  const status = await checkTemplate(registry, read(`${fixture}/template.md`));
  if (status.status !== "ok") throw new Error(`${fixture}: template is broken`);
  const { diagnostics } = await lintTarget(registry, status.model, read(`${fixture}/target.md`), `${fixture}/target.md`, createEnv());
  return diagnostics
    .filter((diagnostic) => diagnostic.code === code)
    .map((diagnostic) => {
      expect(diagnostic.severity).toBe("warning");
      return {
        message: diagnostic.message,
        line: diagnostic.position?.line ?? 0,
        column: diagnostic.position?.column ?? 0,
      };
    });
}

/** At least 1 pass- and 1 fail- case, pass- cases expect nothing, one fixture folder per case. */
export function expectCases(dir: string, cases: readonly { readonly name: string; readonly expected: readonly Found[] }[]): void {
  const passing = cases.filter((testCase) => testCase.name.startsWith("pass-"));
  const failing = cases.filter((testCase) => testCase.name.startsWith("fail-"));
  expect(passing.length).toBeGreaterThanOrEqual(1);
  expect(failing.length).toBeGreaterThanOrEqual(1);
  expect(passing.length + failing.length).toBe(cases.length);
  expect(cases.filter((testCase) => testCase.expected.length === 0)).toEqual(passing);
  expect(readdirSync(join(REPO_ROOT, dir)).sort()).toEqual(cases.map((testCase) => testCase.name).sort());
}

/** The registry entry of a directive rule: category syntax, warning, target step directives. */
export function expectDirectiveRule(code: string, name: string): void {
  expect(registry.byCode.get(code)).toMatchObject({
    name,
    category: "syntax",
    severity: "warning",
    phase: "target",
    step: "directives",
  });
}
