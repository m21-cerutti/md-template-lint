/**
 * `pnpm run check:rules`: every `tests/**` file named `MTL<nnn>-*.test.ts` tags its tests with its own
 * code and its family (the category of the code in the registry), so `vitest --tags-filter MTL101`
 * and `--tags-filter heading` select them. The tag list itself is `ruleTags()` (vitest.config.ts).
 */
import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { describe, expect, it } from "vitest";
import { RUN_CODES } from "../../src/engine/directives.js";
import { familyOf, ruleTags } from "../helpers/rule-tags.js";
import { ROOT } from "./consistency.js";

const TESTS = join(ROOT, "tests");
const RULE_TEST = /^(MTL\d{3})-.+\.test\.ts$/;

/** Every quoted name inside a `tags: [...]` option of `text`. */
function declaredTags(text: string): Set<string> {
  const names = new Set<string>();
  for (const list of text.matchAll(/\btags:\s*\[([^\]]*)\]/g)) {
    for (const name of (list[1] ?? "").matchAll(/["']([^"']+)["']/g)) names.add(name[1] ?? "");
  }
  return names;
}

/** Problems of the rule test files `files` (path -> source text); an empty list means no drift. */
export function checkRuleTestTags(files: ReadonlyMap<string, string>): string[] {
  const problems: string[] = [];
  for (const [path, text] of files) {
    const code = RULE_TEST.exec(basename(path))?.[1];
    if (code === undefined) continue;
    const family = familyOf(code);
    if (family === undefined) {
      problems.push(`${path}: ${code} is not in the registry`);
      continue;
    }
    const tags = declaredTags(text);
    for (const name of [code, family]) {
      if (!tags.has(name)) problems.push(`${path}: missing tag '${name}' (add it to the \`tags: [...]\` option of its describe)`);
    }
  }
  return problems;
}

function ruleTestFiles(): Map<string, string> {
  const files = new Map<string, string>();
  for (const entry of readdirSync(TESTS, { recursive: true, encoding: "utf8" })) {
    if (RULE_TEST.test(basename(entry))) files.set(`tests/${entry.replaceAll("\\", "/")}`, readFileSync(join(TESTS, entry), "utf8"));
  }
  return files;
}

describe("check:rules test tags", () => {
  it("passes: every rule test file declares its code tag and its family tag", () => {
    expect(checkRuleTestTags(ruleTestFiles())).toEqual([]);
  });

  it("reads non-empty inputs (a layout change cannot make the check pass on nothing)", () => {
    expect(ruleTestFiles().size).toBeGreaterThanOrEqual(80);
    const names = ruleTags().map((tag) => tag.name);
    expect(names).toContain("MTL101");
    expect(names).toContain("heading");
    expect(new Set(names).size).toBe(names.length);
  });

  it("declares every run code and the `run` family as tags", () => {
    const names = ruleTags().map((tag) => tag.name);
    expect(names).toContain("run");
    for (const code of RUN_CODES) expect(names).toContain(code);
    expect(names).toContain("MTL907");
  });

  it("derives the family of a code from the registry, `run` for a run code", () => {
    expect(familyOf("MTL101")).toBe("filename");
    expect(familyOf("MTL604")).toBe("heading");
    expect(familyOf("MTL907")).toBe("run");
    expect(familyOf("MTL999")).toBeUndefined();
  });

  it("fails: a file without tags, one tag missing, an unknown code; passes a tagged file", () => {
    const tagged = 'describe("MTL101 x", { tags: ["MTL101", "filename"] }, () => {});';
    const files = new Map([
      ["tests/target/filename/MTL101-a.test.ts", tagged],
      ["tests/target/filename/MTL102-b.test.ts", 'describe("MTL102 x", () => {});'],
      ["tests/target/bounds/MTL401-c.test.ts", 'describe("MTL401 x", { tags: ["MTL401"] }, () => {});'],
      ["tests/target/bounds/MTL999-d.test.ts", tagged],
      ["tests/unit/engine/engine.test.ts", "describe('no code in the name', () => {});"],
    ]);
    expect(checkRuleTestTags(files)).toEqual([
      "tests/target/filename/MTL102-b.test.ts: missing tag 'MTL102' (add it to the `tags: [...]` option of its describe)",
      "tests/target/filename/MTL102-b.test.ts: missing tag 'filename' (add it to the `tags: [...]` option of its describe)",
      "tests/target/bounds/MTL401-c.test.ts: missing tag 'bounds' (add it to the `tags: [...]` option of its describe)",
      "tests/target/bounds/MTL999-d.test.ts: MTL999 is not in the registry",
    ]);
  });
});
