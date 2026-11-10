/**
 * Every registered rule code has fixtures: a directory `tests/fixtures/pairs/<code>` (target rules)
 * or `tests/fixtures/templates/<code>` (template rules), except the codes listed in
 * OTHER_TESTS, whose tests live in a named file instead. One passing case (the real tree),
 * then failing cases that feed deliberately broken inputs to the check.
 *
 * Part of `pnpm run check:rules` (the folder tests/consistency). The run diagnostics MTL9xx are
 * not rules (not in the registry): their tests live with the runner and the CLI.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createRegistry } from "../../src/engine/registry.js";
import { REPO_ROOT } from "../helpers/fixtures.js";

const FIXTURE_ROOTS = ["tests/fixtures/pairs", "tests/fixtures/templates"] as const;

/**
 * Codes with no fixture directory, each with the test file that covers it. Syntax rules judge a
 * whole text (no frontmatter, invalid YAML, unreadable file, tag syntax), not a template/target
 * pair, and their cases are one-line texts in tests/rules/syntax.test.ts.
 */
const OTHER_TESTS: Readonly<Record<string, string>> = {
  MTL001: "tests/rules/syntax.test.ts",
  MTL002: "tests/rules/syntax.test.ts",
  MTL003: "tests/rules/syntax.test.ts",
  MTL004: "tests/rules/syntax.test.ts",
  MTL010: "tests/rules/syntax.test.ts",
  MTL011: "tests/rules/syntax.test.ts",
  MTL012: "tests/rules/syntax.test.ts",
  MTL013: "tests/rules/syntax.test.ts",
};

const exists = (path: string): boolean => existsSync(join(REPO_ROOT, path));

/** Problems found for `codes`, given a fixture-directory probe and a file reader. */
function problems(
  codes: readonly string[],
  hasFixtureDir: (code: string) => boolean,
  otherTests: Readonly<Record<string, string>>,
  fileHas: (path: string, code: string) => boolean,
): string[] {
  const out: string[] = [];
  for (const code of codes) {
    const file = otherTests[code];
    if (file === undefined) {
      if (!hasFixtureDir(code))
        out.push(`${code}: no directory under ${FIXTURE_ROOTS.join(" or ")}`);
    } else {
      if (hasFixtureDir(code)) out.push(`${code}: has fixtures, drop it from OTHER_TESTS`);
      if (!fileHas(file, code)) out.push(`${code}: ${file} does not mention it`);
    }
  }
  for (const code of Object.keys(otherTests)) {
    if (!codes.includes(code)) out.push(`${code}: in OTHER_TESTS but not a registered rule`);
  }
  return out;
}

const registered = createRegistry().rules.map((rule) => rule.code);
const realDir = (code: string): boolean => FIXTURE_ROOTS.some((root) => exists(`${root}/${code}`));
const realFileHas = (path: string, code: string): boolean =>
  exists(path) && readFileSync(join(REPO_ROOT, path), "utf8").includes(code);

describe("check:rules: fixtures of every rule code", () => {
  it("passes: each registered rule has a fixture directory or a named test file", () => {
    expect(registered.length).toBeGreaterThan(50);
    expect(problems(registered, realDir, OTHER_TESTS, realFileHas)).toEqual([]);
  });

  it("fails: a registered code with neither fixtures nor a test file", () => {
    expect(problems(["MTL101", "MTL199"], realDir, OTHER_TESTS, realFileHas)).toEqual([
      "MTL199: no directory under tests/fixtures/pairs or tests/fixtures/templates",
      ...Object.keys(OTHER_TESTS).map(
        (code) => `${code}: in OTHER_TESTS but not a registered rule`,
      ),
    ]);
  });

  it("fails: an exception that has fixtures, a stale one, and a test file that lacks the code", () => {
    expect(
      problems(
        ["MTL101", "MTL001"],
        realDir,
        { MTL101: "tests/rules/syntax.test.ts", MTL001: "tests/rules/syntax.test.ts", MTL777: "x" },
        (_path, code) => code !== "MTL001",
      ),
    ).toEqual([
      "MTL101: has fixtures, drop it from OTHER_TESTS",
      "MTL001: tests/rules/syntax.test.ts does not mention it",
      "MTL777: in OTHER_TESTS but not a registered rule",
    ]);
  });

  it("fails: an exception whose test file does not exist", () => {
    expect(realFileHas("tests/rules/no-such-file.test.ts", "MTL001")).toBe(false);
  });
});
