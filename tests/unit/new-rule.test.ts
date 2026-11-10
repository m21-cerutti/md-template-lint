/**
 * `pnpm run new:rule` (scripts/new-rule.ts), run with `--root` in a temporary
 * tree. One passing case per layout (target, --syntax), failing cases for a
 * missing step and a duplicate rule.
 */
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as prettier from "prettier";
import { ROOT } from "../consistency/consistency.js";

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

async function prettierClean(file: string): Promise<boolean> {
  const options = (await prettier.resolveConfig(join(ROOT, "src", "index.ts"))) ?? {};
  return prettier.check(readFileSync(file, "utf8"), { ...options, filepath: file });
}

describe("new:rule scaffold", () => {
  it("passes: a field rule stub, target test and pair fixtures", async () => {
    const result = run("format", "constant-mismatch", "--step", "constant");
    expect(result.status).toBe(0);
    const ruleFile = join(root, "src", "rules", "format.ts");
    const rule = readFileSync(ruleFile, "utf8");
    expect(rule).toContain(
      'import { defineRule, notImplemented, type AnyRule } from "../engine/rule.js";',
    );
    expect(rule).toContain('    code: "MTL301",\n    name: "constant-mismatch",');
    expect(rule).toContain('    phase: "field",\n    step: "constant",');
    expect(rule).toContain('    check: notImplemented("MTL301"),');
    const test = join(root, "tests", "target", "format", "MTL301-constant-mismatch.test.ts");
    expect(existsSync(test)).toBe(true);
    for (const file of [
      "pass/template.md",
      "pass/target.md",
      "fail-1/template.md",
      "fail-1/target.md",
    ]) {
      expect(existsSync(join(root, "tests", "fixtures", "pairs", "MTL301", file))).toBe(true);
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
    expect(existsSync(join(root, "tests", "fixtures", "templates", "MTL005", "fail-1.md"))).toBe(
      true,
    );
    expect(await prettierClean(join(root, "src", "rules", "syntax.ts"))).toBe(true);
  });

  it("passes: ignores the bare `--` that `pnpm run new:rule -- ...` forwards", () => {
    const result = run("--", "format", "constant-mismatch", "--step", "constant");
    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("MTL301 constant-mismatch (stub) added");
  });

  it("fails: a field rule without --step", () => {
    const result = run("format", "constant-mismatch");
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("phase 'field' needs --step");
  });

  it("fails: a rule that already exists", () => {
    expect(run("format", "constant-mismatch", "--step", "constant").status).toBe(0);
    const again = run("format", "constant-mismatch", "--step", "constant");
    expect(again.status).toBe(1);
    expect(again.stderr).toContain("rule 'constant-mismatch' already exists");
  });
});
