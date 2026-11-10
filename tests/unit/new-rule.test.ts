/**
 * `pnpm run new:rule` (scripts/new-rule.ts), run with `--root` in a temporary
 * tree. Passing cases per layout (target, category syntax, --syntax), each fresh stub also
 * passing the check:rules layout check (tests/consistency/rule-fixtures.ts) on the temp tree;
 * failing cases for a missing step, --syntax with a field phase and a duplicate rule.
 */
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as prettier from "prettier";
import { ROOT } from "../consistency/consistency.js";
import { diskTree, fixtureProblems } from "../consistency/rule-fixtures.js";

let root = "";

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "md-template-lint-new-rule-"));
  cpSync(join(ROOT, "src", "rules"), join(root, "src", "rules"), { recursive: true });
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

const run = (...args: string[]) =>
  spawnSync(process.execPath, [join(ROOT, "scripts", "new-rule.ts"), ...args, "--root", root], {
    encoding: "utf8",
  });

/** A name that is never a docs/spec.md 4.3 row, so the scaffold picks the next free code. */
const FAKE_RULE = "rogue-format-rule";

/** The code the scaffold chose, read from its stdout (it moves as real rules land). */
function scaffoldedCode(stdout: string): string {
  const code = new RegExp(`new:rule: (MTL\\d{3}) ${FAKE_RULE} \\(stub\\) added`).exec(stdout)?.[1];
  if (code === undefined) throw new Error(`no scaffolded code in: ${stdout}`);
  return code;
}

async function prettierClean(file: string): Promise<boolean> {
  const options = (await prettier.resolveConfig(join(ROOT, "src", "index.ts"))) ?? {};
  return prettier.check(readFileSync(file, "utf8"), { ...options, filepath: file });
}

describe("new:rule scaffold", () => {
  it("passes: a field rule stub, target test and pair fixtures", async () => {
    const result = run("format", FAKE_RULE, "--step", "constant");
    expect(result.status).toBe(0);
    const code = scaffoldedCode(result.stdout);
    const ruleFile = join(root, "src", "rules", "format.ts");
    const rule = readFileSync(ruleFile, "utf8");
    expect(rule).toMatch(/import \{[^}]*\bnotImplemented\b[^}]*\} from "..\/engine\/rule\.js";/);
    expect(rule).toContain(`    code: "${code}",\n    name: "${FAKE_RULE}",`);
    expect(rule).toContain('    phase: "field",\n    step: "constant",');
    expect(rule).toContain(`    check: notImplemented("${code}"),`);
    const test = join(root, "tests", "target", "format", `${code}-${FAKE_RULE}.test.ts`);
    expect(existsSync(test)).toBe(true);
    for (const file of [
      "pass-placeholder/template.md",
      "pass-placeholder/target.md",
      "fail-placeholder/template.md",
      "fail-placeholder/target.md",
    ]) {
      expect(existsSync(join(root, "tests", "fixtures", "pairs", code, file))).toBe(true);
    }
    expect(await prettierClean(ruleFile)).toBe(true);
    expect(await prettierClean(test)).toBe(true);
  });

  it("passes: --syntax writes a syntax test and template fixtures", async () => {
    const result = run("syntax", "rogue-tag", "--syntax");
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("is not a docs/spec.md 4.3 row");
    const test = join(root, "tests", "syntax", "syntax", "MTL005-rogue-tag.test.ts");
    expect(existsSync(test)).toBe(true);
    for (const file of ["pass-placeholder.md", "fail-placeholder.md"]) {
      expect(existsSync(join(root, "tests", "fixtures", "templates", "MTL005", file))).toBe(true);
    }
    expect(await prettierClean(join(root, "src", "rules", "syntax.ts"))).toBe(true);
  });

  it("passes: a fresh target stub passes the check:rules layout check", () => {
    const result = run("format", FAKE_RULE, "--step", "constant");
    expect(result.status).toBe(0);
    const rule = {
      code: scaffoldedCode(result.stdout),
      category: "format",
      phase: "field",
    } as const;
    expect(fixtureProblems([rule], diskTree(root))).toEqual([]);
  });

  it("passes: category syntax without --syntax gets the syntax layout and passes the check", async () => {
    const result = run("syntax", "rogue-tag");
    expect(result.status).toBe(0);
    const test = join(root, "tests", "syntax", "syntax", "MTL005-rogue-tag.test.ts");
    expect(readFileSync(test, "utf8")).toContain('const DIR = "tests/fixtures/templates/MTL005";');
    expect(await prettierClean(test)).toBe(true);
    const rule = { code: "MTL005", category: "syntax", phase: "template" } as const;
    expect(fixtureProblems([rule], diskTree(root))).toEqual([]);
  });

  it("passes: --syntax on another category is a template rule in the syntax layout", () => {
    const result = run("format", FAKE_RULE, "--syntax");
    expect(result.status).toBe(0);
    const code = scaffoldedCode(result.stdout);
    expect(readFileSync(join(root, "src", "rules", "format.ts"), "utf8")).toContain(
      `    code: "${code}",\n    name: "${FAKE_RULE}",\n    severity: "error",\n    category: "format",\n    phase: "template",`,
    );
    const rule = { code, category: "format", phase: "template" } as const;
    expect(fixtureProblems([rule], diskTree(root))).toEqual([]);
  });

  it("fails: --syntax with a field phase (the layout would not match the check)", () => {
    const result = run("format", FAKE_RULE, "--syntax", "--phase", "field", "--step", "constant");
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("--syntax needs phase parse or template, not 'field'");
  });

  it("passes: ignores the bare `--` that `pnpm run new:rule -- ...` forwards", () => {
    const result = run("--", "format", FAKE_RULE, "--step", "constant");
    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(scaffoldedCode(result.stdout)).toMatch(/^MTL3\d\d$/);
  });

  it("fails: a field rule without --step", () => {
    const result = run("format", FAKE_RULE);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("phase 'field' needs --step");
  });

  it("fails: a rule that already exists", () => {
    expect(run("format", FAKE_RULE, "--step", "constant").status).toBe(0);
    const again = run("format", FAKE_RULE, "--step", "constant");
    expect(again.status).toBe(1);
    expect(again.stderr).toContain(`rule '${FAKE_RULE}' already exists`);
  });
});
