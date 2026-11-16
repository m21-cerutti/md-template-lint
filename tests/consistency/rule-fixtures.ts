/**
 * The rule-case layout check of `pnpm run check:rules` (A39 layout, docs/architecture.md
 * "Tests: rule cases"). Pure functions over a read-only `Tree`, so the same check runs on the
 * repository (tests/consistency/rule-fixtures.test.ts), on small in-memory trees, and on a
 * throwaway `pnpm run new:rule` scaffold (tests/unit/scripts/new-rule.test.ts).
 *
 * - Template-only codes (phase `parse` or `template`): one test file
 *   `tests/syntax/<category>/<code>-<name>.test.ts`, fixtures `tests/fixtures/templates/<code>/`,
 *   one `<case>.md` file per case.
 * - Target codes (phase `field` or `target`): one test file
 *   `tests/target/<category>/<code>-<name>.test.ts`, fixtures `tests/fixtures/pairs/<code>/`,
 *   one `<case>/` folder per case holding exactly `template.md` and `target.md`.
 * - Case names are descriptive kebab-case `pass-<name>` / `fail-<name>`, never numbered; at least
 *   1 `pass-` case and at least 1 `fail-` case, any number of each (several `pass-` cases test limit
 *   cases); one fixture per case.
 * - The case table of the test file (its `name: "..."` entries outside comments) equals the
 *   fixture listing, the test file names its fixture folder as a quoted string, and every folder
 *   under the two fixture roots and every test file under tests/syntax and tests/target belongs to
 *   a registered code of that category and family.
 * - `tests/fixtures/rule-controls/<code>-<name>/` holds controls outside the pass-/fail- split
 *   (for example "no tag, no diagnostic"); each one belongs to a registered code and is named,
 *   quoted, by the test file of that code.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Phase } from "../../src/engine/rule.js";

/** Read-only view of a tree: paths are posix and relative to its root. */
export interface Tree {
  /** Entry names of a directory, sorted; null when it is not a directory. */
  list(path: string): string[] | null;
  /** Text of a file; null when it is not a file. */
  read(path: string): string | null;
}

export interface RuleRef {
  readonly code: string;
  readonly category: string;
  readonly phase: Phase;
}

interface Family {
  readonly fixtures: string;
  readonly tests: string;
  /** `file`: one `<case>.md` per case; `pair`: one `<case>/` folder with template + target. */
  readonly shape: "file" | "pair";
}

const SYNTAX: Family = {
  fixtures: "tests/fixtures/templates",
  tests: "tests/syntax",
  shape: "file",
};
const TARGET: Family = { fixtures: "tests/fixtures/pairs", tests: "tests/target", shape: "pair" };
const FAMILIES = [SYNTAX, TARGET] as const;
const PAIR_FILES = ["target.md", "template.md"];
export const CONTROLS = "tests/fixtures/rule-controls";

const familyOf = (phase: Phase): Family => (phase === "parse" || phase === "template" ? SYNTAX : TARGET);

const isWord = (part: string): boolean => part.length > 0 && [...part].every((c) => (c >= "a" && c <= "z") || (c >= "0" && c <= "9"));
const isNumber = (part: string): boolean => [...part].every((c) => c >= "0" && c <= "9");

/** Why `name` is not a descriptive kebab-case `pass-` / `fail-` case name, or null. */
export function caseNameProblem(name: string): string | null {
  const [prefix = "", ...rest] = name.split("-");
  if (prefix !== "pass" && prefix !== "fail") return "does not start with pass- or fail-";
  if (rest.length === 0 || !rest.every(isWord)) return "is not kebab-case (a-z, 0-9, -)";
  if (rest.every(isNumber) || isNumber(rest.at(-1) ?? "")) return "is numbered, not descriptive";
  return null;
}

/**
 * `text` without its `//` and `/* *\/` comments. String literals (`"`, `'`, backtick) are kept
 * as they are, so a `//` inside a URL string is not a comment. Enough for test sources: a
 * backtick inside a `${...}` of a template literal is not tracked.
 */
export function stripComments(text: string): string {
  let out = "";
  let quote: string | null = null;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i] ?? "";
    if (quote !== null) {
      out += char;
      if (char === "\\") {
        out += text[i + 1] ?? "";
        i += 1;
      } else if (char === quote) {
        quote = null;
      }
    } else if (char === "/" && text[i + 1] === "/") {
      const end = text.indexOf("\n", i);
      i = end < 0 ? text.length : end - 1;
    } else if (char === "/" && text[i + 1] === "*") {
      const end = text.indexOf("*/", i + 2);
      i = end < 0 ? text.length : end + 1;
    } else {
      if (char === '"' || char === "'" || char === "`") quote = char;
      out += char;
    }
  }
  return out;
}

/** The `pass-` / `fail-` values of `name: "..."` in a test file, comments ignored, in order. */
export function tableNames(text: string): string[] {
  const code = stripComments(text);
  const names: string[] = [];
  const marker = 'name: "';
  let index = code.indexOf(marker);
  while (index >= 0) {
    const from = index + marker.length;
    const name = code.slice(from, code.indexOf('"', from));
    if (name.startsWith("pass-") || name.startsWith("fail-")) names.push(name);
    index = code.indexOf(marker, from);
  }
  return names;
}

/** The one test file of `rule` (path), or a problem. */
function testFileOf(rule: RuleRef, tree: Tree): { file: string } | { problem: string } {
  const testDir = `${familyOf(rule.phase).tests}/${rule.category}`;
  const tests = (tree.list(testDir) ?? []).filter((file) => file.startsWith(`${rule.code}-`) && file.endsWith(".test.ts"));
  if (tests.length !== 1) {
    return {
      problem: `${rule.code}: ${tests.length} test files ${testDir}/${rule.code}-*.test.ts`,
    };
  }
  return { file: `${testDir}/${tests[0] ?? ""}` };
}

/** Problems of the case folder of one code. */
function codeProblems(rule: RuleRef, tree: Tree): string[] {
  const out: string[] = [];
  const family = familyOf(rule.phase);
  const other = family === SYNTAX ? TARGET : SYNTAX;
  const dir = `${family.fixtures}/${rule.code}`;
  if (tree.list(`${other.fixtures}/${rule.code}`) !== null) {
    out.push(`${rule.code}: phase ${rule.phase} has no fixtures under ${other.fixtures}`);
  }
  const entries = tree.list(dir);
  if (entries === null) return [...out, `${rule.code}: no fixture folder ${dir}`];

  const cases: string[] = [];
  for (const entry of entries) {
    const path = `${dir}/${entry}`;
    if (family.shape === "file") {
      if (!entry.endsWith(".md") || tree.read(path) === null) {
        out.push(`${path}: expected one <case>.md file per case`);
        continue;
      }
      cases.push(entry.slice(0, -3));
    } else {
      const files = tree.list(path);
      if (files === null || files.join() !== PAIR_FILES.join()) {
        out.push(`${path}: expected a folder with exactly template.md and target.md`);
        continue;
      }
      cases.push(entry);
    }
  }
  for (const name of cases) {
    const problem = caseNameProblem(name);
    if (problem !== null) out.push(`${dir}/${name}: case name ${problem}`);
  }
  const passing = cases.filter((name) => name.startsWith("pass-")).length;
  const failing = cases.filter((name) => name.startsWith("fail-")).length;
  if (passing < 1) out.push(`${dir}: ${passing} pass- cases, expected at least 1`);
  if (failing < 1) out.push(`${dir}: ${failing} fail- cases, expected at least 1`);

  const test = testFileOf(rule, tree);
  if ("problem" in test) return [...out, test.problem];
  const text = stripComments(tree.read(test.file) ?? "");
  if (!text.includes(`"${dir}"`)) out.push(`${test.file}: does not name its fixtures "${dir}"`);
  const table = tableNames(text);
  for (const name of cases) {
    if (!table.includes(name)) out.push(`${dir}/${name}: orphan fixture, not in ${test.file}`);
  }
  for (const name of table) {
    if (!cases.includes(name)) out.push(`${test.file}: case ${name} has no fixture in ${dir}`);
  }
  return out;
}

/** Problems of the control folders: each belongs to a registered code and its test names it. */
function controlProblems(byCode: ReadonlyMap<string, RuleRef>, tree: Tree): string[] {
  const out: string[] = [];
  for (const entry of tree.list(CONTROLS) ?? []) {
    const dir = `${CONTROLS}/${entry}`;
    const rule = byCode.get(entry.split("-")[0] ?? "");
    if (rule === undefined || tree.list(dir) === null) {
      out.push(`${dir}: orphan control, expected a folder <registered code>-<name>`);
      continue;
    }
    const test = testFileOf(rule, tree);
    if ("problem" in test) continue; // reported by codeProblems
    if (!stripComments(tree.read(test.file) ?? "").includes(`"${dir}"`)) {
      out.push(`${dir}: orphan control, not named in ${test.file}`);
    }
  }
  return out;
}

/** Every problem of the rule-case tests and fixtures of `rules` in `tree`. */
export function fixtureProblems(rules: readonly RuleRef[], tree: Tree): string[] {
  const out: string[] = [];
  const byCode = new Map(rules.map((rule) => [rule.code, rule]));
  for (const family of FAMILIES) {
    for (const entry of tree.list(family.fixtures) ?? []) {
      if (!byCode.has(entry)) out.push(`${family.fixtures}/${entry}: orphan, no registered rule`);
    }
    for (const category of tree.list(family.tests) ?? []) {
      const files = tree.list(`${family.tests}/${category}`);
      if (files === null) out.push(`${family.tests}/${category}: expected a category folder`);
      for (const file of files ?? []) {
        const rule = byCode.get(file.split("-")[0] ?? "");
        if (rule === undefined || rule.category !== category || familyOf(rule.phase) !== family) {
          out.push(`${family.tests}/${category}/${file}: no ${category} rule of this family`);
        }
      }
    }
  }
  out.push(...controlProblems(byCode, tree));
  for (const rule of rules) out.push(...codeProblems(rule, tree));
  return out;
}

/** The tree on disk under the absolute directory `root`. */
export function diskTree(root: string): Tree {
  return {
    list(path) {
      const full = join(root, path);
      if (!existsSync(full) || !statSync(full).isDirectory()) return null;
      return readdirSync(full).sort();
    },
    read(path) {
      const full = join(root, path);
      if (!existsSync(full) || !statSync(full).isFile()) return null;
      return readFileSync(full, "utf8");
    },
  };
}

/** An in-memory tree from `{ "a/b.md": "text" }`; folders are the path prefixes. */
export function memoryTree(files: Readonly<Record<string, string>>): Tree {
  return {
    list(path) {
      const names = new Set<string>();
      for (const file of Object.keys(files)) {
        if (file.startsWith(`${path}/`)) names.add(file.slice(path.length + 1).split("/")[0] ?? "");
      }
      return names.size === 0 ? null : [...names].sort();
    },
    read: (path) => files[path] ?? null,
  };
}
