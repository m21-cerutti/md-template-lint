/**
 * `pnpm run check:rules`: every registered rule code has its rule-case tests and fixtures, and
 * no fixture is an orphan. The check itself is tests/consistency/rule-fixtures.ts (its header
 * lists the rules: at least 1 pass- and 1 fail- case per code, any number of each). Passing
 * cases (the real tree, several pass- cases), then failing cases on small in-memory trees. The run diagnostics MTL9xx are not rules (not in the registry): their tests live with
 * the config, runner and CLI tests.
 */
import { describe, expect, it } from "vitest";
import { createRegistry } from "../../src/engine/registry.js";
import { REPO_ROOT } from "../helpers/fixtures.js";
import {
  caseNameProblem,
  diskTree,
  fixtureProblems,
  memoryTree,
  stripComments,
  tableNames,
  type RuleRef,
} from "./rule-fixtures.js";

const MTL001: RuleRef = { code: "MTL001", category: "syntax", phase: "parse" };
const MTL101: RuleRef = { code: "MTL101", category: "filename", phase: "field" };
const SYNTAX_TEST = "tests/syntax/syntax/MTL001-frontmatter-missing.test.ts";
const TARGET_TEST = "tests/target/filename/MTL101-filename-case.test.ts";
const syntaxText = (...names: string[]) =>
  `const DIR = "tests/fixtures/templates/MTL001";\n${names.map((n) => `{ name: "${n}" }`).join("\n")}`;
const targetText = (...names: string[]) =>
  `const DIR = "tests/fixtures/pairs/MTL101";\n${names.map((n) => `{ name: "${n}" }`).join("\n")}`;
const pair = (name: string) => ({
  [`tests/fixtures/pairs/MTL101/${name}/template.md`]: "",
  [`tests/fixtures/pairs/MTL101/${name}/target.md`]: "",
});
/** A clean tree with one syntax code and one target code. */
const CLEAN = {
  [SYNTAX_TEST]: syntaxText("pass-ok", "fail-broken"),
  "tests/fixtures/templates/MTL001/pass-ok.md": "",
  "tests/fixtures/templates/MTL001/fail-broken.md": "",
  [TARGET_TEST]: targetText("pass-ok", "fail-wrong-case"),
  ...pair("pass-ok"),
  ...pair("fail-wrong-case"),
};

/** A copy of `files` without the given paths. */
const without = (files: Record<string, string>, ...paths: string[]): Record<string, string> =>
  Object.fromEntries(Object.entries(files).filter(([path]) => !paths.includes(path)));

const registered: RuleRef[] = createRegistry().rules.map(({ code, category, phase }) => ({
  code,
  category,
  phase,
}));

describe("check:rules: rule-case tests and fixtures of every rule code", () => {
  it("passes: every registered code has its test file and fixtures, no orphan", () => {
    expect(registered.length).toBeGreaterThan(50);
    expect(fixtureProblems(registered, diskTree(REPO_ROOT))).toEqual([]);
  });

  it("passes: a small clean tree", () => {
    expect(fixtureProblems([MTL001, MTL101], memoryTree(CLEAN))).toEqual([]);
  });

  it("fails: a registered code with no fixtures and no test file", () => {
    const tree = memoryTree(CLEAN);
    const MTL102: RuleRef = { code: "MTL102", category: "filename", phase: "field" };
    expect(fixtureProblems([MTL001, MTL101, MTL102], tree)).toEqual([
      "MTL102: no fixture folder tests/fixtures/pairs/MTL102",
    ]);
  });

  it("fails: orphan fixture folder, orphan test file, non-.md case and unlisted case", () => {
    const tree = memoryTree({
      ...CLEAN,
      "tests/fixtures/templates/MTL099/pass-x.md": "",
      "tests/fixtures/templates/MTL001/fail-notes.txt": "",
      "tests/fixtures/templates/MTL001/fail-unlisted.md": "",
      "tests/target/filename/MTL199-gone.test.ts": "",
    });
    expect(fixtureProblems([MTL001, MTL101], tree)).toEqual([
      "tests/fixtures/templates/MTL099: orphan, no registered rule",
      "tests/target/filename/MTL199-gone.test.ts: no filename rule of this family",
      "tests/fixtures/templates/MTL001/fail-notes.txt: expected one <case>.md file per case",
      `tests/fixtures/templates/MTL001/fail-unlisted: orphan fixture, not in ${SYNTAX_TEST}`,
    ]);
  });

  it("fails: a real code's test file in the wrong category folder", () => {
    const tree = memoryTree({ ...CLEAN, "tests/syntax/filename/MTL001-x.test.ts": "" });
    expect(fixtureProblems([MTL001, MTL101], tree)).toEqual([
      "tests/syntax/filename/MTL001-x.test.ts: no filename rule of this family",
    ]);
  });

  it("fails: a real code's test file in the wrong family folder", () => {
    const tree = memoryTree({
      ...CLEAN,
      "tests/target/syntax/MTL001-x.test.ts": "",
      "tests/syntax/filename/MTL101-x.test.ts": "",
    });
    expect(fixtureProblems([MTL001, MTL101], tree)).toEqual([
      "tests/syntax/filename/MTL101-x.test.ts: no filename rule of this family",
      "tests/target/syntax/MTL001-x.test.ts: no syntax rule of this family",
    ]);
  });

  it("passes: several pass- cases (limit cases) and several fail- cases", () => {
    const tree = memoryTree({
      ...CLEAN,
      [SYNTAX_TEST]: syntaxText(
        "pass-ok",
        "pass-limit",
        "pass-other-limit",
        "fail-broken",
        "fail-x",
      ),
      "tests/fixtures/templates/MTL001/pass-limit.md": "",
      "tests/fixtures/templates/MTL001/pass-other-limit.md": "",
      "tests/fixtures/templates/MTL001/fail-x.md": "",
    });
    expect(fixtureProblems([MTL001, MTL101], tree)).toEqual([]);
  });

  it("fails: no pass- case", () => {
    const tree = memoryTree({
      ...without(CLEAN, "tests/fixtures/templates/MTL001/pass-ok.md"),
      [SYNTAX_TEST]: syntaxText("fail-broken"),
    });
    expect(fixtureProblems([MTL001, MTL101], tree)).toEqual([
      "tests/fixtures/templates/MTL001: 0 pass- cases, expected at least 1",
    ]);
  });

  it("fails: no fail- case", () => {
    const tree = memoryTree({
      ...without(CLEAN, "tests/fixtures/templates/MTL001/fail-broken.md"),
      [SYNTAX_TEST]: syntaxText("pass-ok"),
    });
    expect(fixtureProblems([MTL001, MTL101], tree)).toEqual([
      "tests/fixtures/templates/MTL001: 0 fail- cases, expected at least 1",
    ]);
  });

  it("fails: a listed case without a fixture", () => {
    const tree = memoryTree({
      ...CLEAN,
      [SYNTAX_TEST]: syntaxText("pass-ok", "fail-broken", "fail-missing"),
    });
    expect(fixtureProblems([MTL001, MTL101], tree)).toEqual([
      `${SYNTAX_TEST}: case fail-missing has no fixture in tests/fixtures/templates/MTL001`,
    ]);
  });

  it("fails: a case or the fixture folder named only inside a comment", () => {
    const tree = memoryTree({
      ...CLEAN,
      [SYNTAX_TEST]: [
        'const DIR = "tests/fixtures/templates/MTL001";',
        '{ name: "pass-ok" } // { name: "fail-broken" }',
      ].join("\n"),
      [TARGET_TEST]: [
        '/* const DIR = "tests/fixtures/pairs/MTL101"; */',
        '{ name: "pass-ok" }, { name: "fail-wrong-case", url: "https://x.example/a" }',
      ].join("\n"),
    });
    expect(fixtureProblems([MTL001, MTL101], tree)).toEqual([
      `tests/fixtures/templates/MTL001/fail-broken: orphan fixture, not in ${SYNTAX_TEST}`,
      `${TARGET_TEST}: does not name its fixtures "tests/fixtures/pairs/MTL101"`,
    ]);
  });

  it("fails: wrong family, incomplete pair, bad names, test that does not name its folder", () => {
    const tree = memoryTree({
      [TARGET_TEST]: `{ name: "pass-ok" } { name: "fail-1" }`,
      ...pair("pass-ok"),
      ...pair("fail-1"),
      ...pair("Fail-Upper"),
      "tests/fixtures/pairs/MTL101/fail-no-target/template.md": "",
      "tests/fixtures/templates/MTL101/pass-x.md": "",
    });
    expect(fixtureProblems([MTL101], tree)).toEqual([
      "MTL101: phase field has no fixtures under tests/fixtures/templates",
      "tests/fixtures/pairs/MTL101/fail-no-target: expected a folder with exactly template.md and target.md",
      "tests/fixtures/pairs/MTL101/Fail-Upper: case name does not start with pass- or fail-",
      "tests/fixtures/pairs/MTL101/fail-1: case name is numbered, not descriptive",
      `${TARGET_TEST}: does not name its fixtures "tests/fixtures/pairs/MTL101"`,
      `tests/fixtures/pairs/MTL101/Fail-Upper: orphan fixture, not in ${TARGET_TEST}`,
    ]);
  });

  it("fails: a code with no test file, or two", () => {
    const none = memoryTree(
      Object.fromEntries(Object.entries(CLEAN).filter(([path]) => path !== TARGET_TEST)),
    );
    expect(fixtureProblems([MTL001, MTL101], none)).toEqual([
      "MTL101: 0 test files tests/target/filename/MTL101-*.test.ts",
    ]);
    const two = memoryTree({ ...CLEAN, "tests/target/filename/MTL101-copy.test.ts": "" });
    expect(fixtureProblems([MTL001, MTL101], two)).toEqual([
      "MTL101: 2 test files tests/target/filename/MTL101-*.test.ts",
    ]);
  });

  it("fails: a file where a category folder is expected", () => {
    const tree = memoryTree({ ...CLEAN, "tests/syntax/stray.test.ts": "" });
    expect(fixtureProblems([MTL001, MTL101], tree)).toEqual([
      "tests/syntax/stray.test.ts: expected a category folder",
    ]);
  });

  it("passes and fails: rule-controls folders belong to a code and are named by its test", () => {
    const CONTROL = "tests/fixtures/rule-controls/MTL101-no-tag";
    const named = memoryTree({
      ...CLEAN,
      [TARGET_TEST]: `${targetText("pass-ok", "fail-wrong-case")}\nconst C = "${CONTROL}";`,
      [`${CONTROL}/template.md`]: "",
    });
    expect(fixtureProblems([MTL001, MTL101], named)).toEqual([]);
    const orphans = memoryTree({
      ...CLEAN,
      [`${CONTROL}/template.md`]: "",
      "tests/fixtures/rule-controls/MTL199-gone/template.md": "",
      "tests/fixtures/rule-controls/notes.txt": "",
    });
    expect(fixtureProblems([MTL001, MTL101], orphans)).toEqual([
      `${CONTROL}: orphan control, not named in ${TARGET_TEST}`,
      "tests/fixtures/rule-controls/MTL199-gone: orphan control, expected a folder <registered code>-<name>",
      "tests/fixtures/rule-controls/notes.txt: orphan control, expected a folder <registered code>-<name>",
    ]);
  });

  it("case names: descriptive kebab-case pass-/fail- only", () => {
    expect(caseNameProblem("pass-two-fields-in-order")).toBeNull();
    expect(caseNameProblem("fail-reason-of-exactly-60-is-kept")).toBeNull();
    expect(caseNameProblem("fail-2")).toBe("is numbered, not descriptive");
    expect(caseNameProblem("fail-case-2")).toBe("is numbered, not descriptive");
    expect(caseNameProblem("fail")).toBe("is not kebab-case (a-z, 0-9, -)");
    expect(caseNameProblem("fail-Bad")).toBe("is not kebab-case (a-z, 0-9, -)");
    expect(caseNameProblem("broken-x")).toBe("does not start with pass- or fail-");
  });

  it("table names: name entries outside comments only, strings kept", () => {
    expect(tableNames(`{ name: "pass-a" } { name: "other" } name: "fail-b"`)).toEqual([
      "pass-a",
      "fail-b",
    ]);
    const text = [
      '{ name: "pass-a" } // { name: "fail-line-comment" }',
      '/* { name: "fail-block-comment" } */ { name: "fail-b", url: "https://x.example/c" }',
      "{ note: 'it // is not a comment', name: \"fail-c\" }",
    ].join("\n");
    expect(tableNames(text)).toEqual(["pass-a", "fail-b", "fail-c"]);
    expect(stripComments('a // x\nb /* y */ c "d // e"')).toBe('a \nb  c "d // e"');
  });
});
