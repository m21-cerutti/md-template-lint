/**
 * Globs of the config (docs/spec.md 6.4): matching semantics and the invalid forms
 * behind MTL907. Table driven, single-line strings.
 */
import { describe, expect, it } from "vitest";
import { compileGlob, matchesGlob } from "../../../src/config/glob.js";

function matcher(glob: string) {
  const result = compileGlob(glob);
  if (!result.ok) throw new Error(`${glob}: ${result.detail}`);
  return (path: string): boolean => matchesGlob(result.glob, path);
}

describe("compileGlob: matching (spec 6.4)", () => {
  const cases: readonly (readonly [string, readonly string[], readonly string[]])[] = [
    // glob, matching paths, non-matching paths
    ["*.md", ["a.md", ".hidden.md"], ["dir/a.md", "a.txt", "a.MD"]],
    ["docs/*.md", ["docs/a.md"], ["docs/sub/a.md", "a.md"]],
    ["a/**/*.md", ["a/x.md", "a/b/x.md", "a/b/c/x.md"], ["a/x.txt", "b/a/x.md"]],
    ["**/*.md", ["x.md", "a/x.md", "a/b/x.md"], ["x.txt"]],
    ["**/README.md", ["README.md", "a/README.md", "a/b/README.md"], ["README.md.bak", "aREADME.md"]],
    ["docs/**", ["docs/a.md", "docs/a/b.md"], ["docs", "other/a.md"]],
    ["**", ["a.md", "a/b.md"], []],
    ["a?c.md", ["abc.md"], ["ac.md", "a/c.md", "abbc.md"]],
    ["[a-c]x.md", ["ax.md", "cx.md"], ["dx.md"]],
    ["[!a]x.md", ["bx.md"], ["ax.md", "/x.md"]],
    ["[^a]x.md", ["bx.md"], ["ax.md"]],
    ["{a,b}/*.md", ["a/x.md", "b/x.md"], ["c/x.md"]],
    ["{a,b}/**/*.md", ["a/x.md", "b/x.md", "b/c/x.md"], ["c/x.md"]],
    ["{*.md,*.txt}", ["a.md", "b.txt"], ["c.json"]],
    ["a.b+c(d).md", ["a.b+c(d).md"], ["aXb+c(d).md"]],
    ["./docs//x.md", ["docs/x.md"], ["./docs/x.md"]],
    ["docs\\*.md", ["docs/x.md"], ["docs\\x.md"]],
    ["**/SKILL.md", ["a/SKILL.md", "SKILL.md"], ["skill.md", "a/skill.md"]],
  ];
  for (const [glob, yes, no] of cases) {
    it(`${glob}`, () => {
      const match = matcher(glob);
      for (const path of yes) expect(match(path), `${glob} should match ${path}`).toBe(true);
      for (const path of no) expect(match(path), `${glob} should not match ${path}`).toBe(false);
    });
  }
});

describe("compileGlob: base directory of the walk", () => {
  const cases: readonly (readonly [string, string])[] = [
    ["docs/adr/*.md", "docs/adr"],
    ["*.md", ""],
    ["**/*.md", ""],
    ["docs/**/*.md", "docs"],
    ["docs/{a,b}/*.md", "docs"],
    ["docs/x.md", "docs"],
    ["a/b/c.md", "a/b"],
    ["./docs/*.md", "docs"],
  ];
  for (const [glob, base] of cases) {
    it(`${glob} -> ${JSON.stringify(base)}`, () => {
      const result = compileGlob(glob);
      expect(result.ok && result.glob.base).toBe(base);
    });
  }
});

describe("compileGlob: invalid globs (MTL907)", { tags: ["MTL907", "run"] }, () => {
  const cases: readonly (readonly [string, string])[] = [
    ["", "empty glob"],
    ["   ", "empty glob"],
    [".", "empty glob"],
    ["!x.md", "starts with '!' (use exclude)"],
    ["/x.md", "absolute path"],
    ["\\x.md", "absolute path"],
    ["C:/x.md", "absolute path"],
    ["c:\\x.md", "absolute path"],
    ["../x.md", "contains '..'"],
    ["a/../x.md", "contains '..'"],
    ["a/..", "contains '..'"],
    ["[abc", "unbalanced '['"],
    ["[]", "unbalanced '['"],
    ["[!]", "unbalanced '['"],
    ["{a,b", "unbalanced '{'"],
    ["{a,{b,c}", "unbalanced '{'"],
    ["a}b", "unbalanced '}'"],
    // The translation accepts these; the regex engine refuses them (reversed range).
    ["[z-a].md", "invalid character class"],
    ["docs/[9-0]*.md", "invalid character class"],
    ["{a,[z-a]}.md", "invalid character class"],
    ["[!z-a].md", "invalid character class"],
  ];
  for (const [glob, detail] of cases) {
    it(`${JSON.stringify(glob)}: ${detail}`, () => {
      expect(compileGlob(glob)).toEqual({ ok: false, detail });
    });
  }

  it("a file name that merely contains .. is valid", () => {
    expect(compileGlob("docs/a..b.md").ok).toBe(true);
  });
});
