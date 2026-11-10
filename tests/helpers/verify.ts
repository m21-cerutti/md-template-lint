/**
 * Template syntax tests (tests/syntax/): run `md-template-lint --verify --format json <file>`
 * through the CLI function `runCli` (docs/spec.md 7.3) on ONE template fixture of
 * `tests/fixtures/templates/<code>/`. No config is read and no target file is passed; the io
 * factory throws, so a test also proves that `--verify` never builds the io.
 */
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { expect } from "vitest";
import { runCli } from "../../src/cli/run.js";
import { foldPath } from "../../src/config/paths.js";
import { REPO_ROOT, expectNameSplit } from "./fixtures.js";
import { HOME } from "./run.js";

/**
 * One diagnostic of the JSON verify document: line and column only when located, and then
 * `sourceLine`, the template line (docs/spec.md 8.5).
 */
export interface VerifyDiagnostic {
  readonly code: string;
  readonly severity: "error" | "warning";
  readonly message: string;
  readonly line?: number;
  readonly column?: number;
  readonly sourceLine?: string;
}

/** What one `--verify` run of one template gives. */
export interface VerifyOutcome {
  /** Process exit code: 0 ok (warnings do not fail), 1 broken template. */
  readonly exitCode: number;
  readonly status: "ok" | "broken";
  /** The parse error of a broken template, else the tag warnings in source order. */
  readonly diagnostics: readonly VerifyDiagnostic[];
}

/** A case of a syntax test: the fixture `<name>.md` and its expected outcome. */
export interface VerifyCase extends VerifyOutcome {
  readonly name: string;
}

interface VerifyJson {
  readonly templates: readonly {
    readonly status: "ok" | "broken";
    readonly error?: VerifyDiagnostic;
    readonly diagnostics: readonly VerifyDiagnostic[];
  }[];
}

/** Absolute directory of the template fixtures of `code`. */
export const templatesDir = (code: string): string =>
  join(REPO_ROOT, "tests", "fixtures", "templates", code);

/** `--verify` of the fixture `tests/fixtures/templates/<code>/<name>.md`. */
export async function verifyFixture(code: string, name: string): Promise<VerifyOutcome> {
  const cwd = foldPath(templatesDir(code));
  const run = await runCli(["--verify", "--format", "json", `${name}.md`], {
    cwd,
    home: HOME,
    boundary: cwd,
    isTty: false,
    noColor: false,
    version: "9.9.9",
    createIo: () => {
      throw new Error("--verify must not build the io");
    },
  });
  expect(run.stderr).toBe("");
  const json = JSON.parse(run.stdout) as VerifyJson;
  expect(json.templates).toHaveLength(1);
  const [template] = json.templates;
  if (template === undefined) throw new Error(`${code}/${name}.md: no template in the output`);
  return {
    exitCode: run.exitCode,
    status: template.status,
    diagnostics: template.error === undefined ? template.diagnostics : [template.error],
  };
}

/**
 * The split rule of a syntax test: at least 1 `pass-` case and 1 `fail-` case, every
 * passing case is clean, every failing case expects `code`, and the fixture folder holds exactly one `<name>.md` per case.
 */
export function expectTemplateCases(code: string, cases: readonly VerifyCase[]): void {
  expectNameSplit(cases);
  const clean = cases.filter((testCase) => testCase.diagnostics.length === 0);
  expect(clean.map((testCase) => testCase.name)).toEqual(
    cases.filter((testCase) => testCase.name.startsWith("pass-")).map((testCase) => testCase.name),
  );
  for (const testCase of cases.filter((item) => item.name.startsWith("fail-"))) {
    expect(
      testCase.diagnostics.some((diagnostic) => diagnostic.code === code),
      `${testCase.name} expects ${code}`,
    ).toBe(true);
  }
  expect(readdirSync(templatesDir(code)).sort()).toEqual(
    cases.map((testCase) => `${testCase.name}.md`).sort(),
  );
}
