/**
 * Config loader and validator (docs/spec.md 6.3, 6.6): every error kind of the spec
 * names file, line and key. Fixtures: tests/fixtures/config/validate-<case>/.
 */
import { describe, expect, it } from "vitest";
import { loadConfig } from "../../../src/config/load.js";
import { foldPath } from "../../../src/config/paths.js";
import { expectSplit, fixturePath } from "../../helpers/fixtures.js";

const GROUP = "validate-";
const HOME = "/home/test";
const FILE = "md-template-lint.yml";

interface Expected {
  readonly code: string;
  readonly line?: number;
  readonly key?: string;
  /** Exact message, or a prefix when `prefix` is set (messages of the YAML library). */
  readonly message: string;
  readonly prefix?: boolean;
}

interface Case {
  readonly name: string;
  /** Config file name inside the fixture directory. */
  readonly file?: string;
  readonly errors: readonly Expected[];
}

/** At least 1 passing case and 1 failing case; one fixture directory per case. */
const CASES: readonly Case[] = [
  { name: "pass-full-config", errors: [] },
  {
    name: "fail-yaml-syntax-error",
    file: "md-template-lint.yml.txt",
    errors: [{ code: "MTL902", line: 5, message: `cannot parse ${FILE}.txt: Flow sequence`, prefix: true }],
  },
  {
    name: "fail-empty-file",
    errors: [{ code: "MTL902", message: `cannot parse ${FILE}: file is empty` }],
  },
  {
    name: "fail-root-is-list",
    errors: [
      {
        code: "MTL902",
        line: 1,
        message: `cannot parse ${FILE}: expected a mapping at the top level, got list`,
      },
    ],
  },
  {
    name: "fail-duplicate-yaml-key",
    errors: [
      {
        code: "MTL902",
        line: 2,
        message: `cannot parse ${FILE}: Map keys must be unique`,
        prefix: true,
      },
    ],
  },
  {
    name: "fail-unknown-top-level-key",
    errors: [{ code: "MTL903", line: 2, key: "colour", message: "colour: unknown key 'colour'" }],
  },
  {
    name: "fail-unknown-pair-key",
    errors: [
      {
        code: "MTL904",
        line: 2,
        key: "pairs[0].include",
        message: "pairs[0].include: required key is missing",
      },
      {
        code: "MTL903",
        line: 3,
        key: "pairs[0].inlcude",
        message: "pairs[0].inlcude: unknown key 'inlcude'",
      },
    ],
  },
  {
    name: "fail-wrong-type-include-number",
    errors: [
      {
        code: "MTL904",
        line: 5,
        key: "pairs[1].include",
        message: "pairs[1].include: expected string or list of strings, got number",
      },
    ],
  },
  {
    name: "fail-pairs-missing",
    errors: [{ code: "MTL904", line: 1, key: "pairs", message: "pairs: required key is missing" }],
  },
  {
    name: "fail-pairs-empty-list",
    errors: [
      {
        code: "MTL904",
        line: 1,
        key: "pairs",
        message: "pairs: expected a non-empty list, got an empty list",
      },
    ],
  },
  {
    name: "fail-template-field-missing",
    errors: [
      {
        code: "MTL904",
        line: 2,
        key: "pairs[0].template",
        message: "pairs[0].template: required key is missing",
      },
    ],
  },
  {
    name: "fail-bad-on-empty",
    errors: [
      {
        code: "MTL904",
        line: 1,
        key: "onEmpty",
        message: "onEmpty: expected one of warn, error, ignore, got 'maybe'",
      },
      {
        code: "MTL904",
        line: 5,
        key: "pairs[0].onEmpty",
        message: "pairs[0].onEmpty: expected one of warn, error, ignore, got number",
      },
    ],
  },
  {
    name: "fail-version-unsupported",
    errors: [{ code: "MTL908", line: 1, key: "version", message: "unsupported config version 2" }],
  },
  {
    name: "fail-version-wrong-type",
    errors: [
      {
        code: "MTL904",
        line: 1,
        key: "version",
        message: "version: expected integer, got string",
      },
    ],
  },
  {
    name: "fail-duplicate-pair-name",
    errors: [
      {
        code: "MTL905",
        line: 5,
        key: "pairs[1].name",
        message: "pairs[1].name: invalid name 'adr' (duplicate)",
      },
    ],
  },
  {
    name: "fail-reserved-root-name",
    errors: [
      {
        code: "MTL905",
        line: 2,
        key: "roots.project",
        message: "roots.project: invalid name 'project' (reserved)",
      },
    ],
  },
  {
    name: "fail-invalid-pair-name",
    errors: [
      {
        code: "MTL905",
        line: 2,
        key: "pairs[0].name",
        message: "pairs[0].name: invalid name 'bad name!'",
      },
    ],
  },
  {
    name: "fail-alias-problems",
    errors: [
      {
        code: "MTL905",
        line: 2,
        key: "aliases.@assets",
        message: "aliases.@assets: invalid name '@assets'",
      },
      {
        code: "MTL904",
        line: 3,
        key: "aliases.docs",
        message: "aliases.docs: expected non-empty string, got number",
      },
    ],
  },
  {
    name: "fail-undeclared-root",
    errors: [
      {
        code: "MTL906",
        line: 5,
        key: "pairs[0].templateRoot",
        message: "pairs[0].templateRoot: root 'tpl' is not declared",
      },
      {
        code: "MTL906",
        line: 6,
        key: "pairs[0].roots[1]",
        message: "pairs[0].roots[1]: root 'app-c' is not declared",
      },
      {
        code: "MTL906",
        line: 9,
        key: "pairs[1].roots",
        message: "pairs[1].roots: root 'ghost' is not declared",
      },
    ],
  },
  {
    name: "fail-bad-globs",
    errors: [
      ["../x", 4, "contains '..'"],
      ["!x.md", 5, "starts with '!' (use exclude)"],
      ["/abs/x.md", 6, "absolute path"],
      ["C:/x.md", 7, "absolute path"],
      ["[abc", 8, "unbalanced '['"],
      ["{a,b", 9, "unbalanced '{'"],
      ["", 10, "empty glob"],
    ]
      .map(([glob, line, detail], index): Expected => ({
        code: "MTL907",
        line: line as number,
        key: `pairs[0].include[${index}]`,
        message: `pairs[0].include[${index}]: invalid glob '${glob as string}': ${detail as string}`,
      }))
      .concat({
        code: "MTL907",
        line: 12,
        key: "pairs[0].exclude",
        message: "pairs[0].exclude: invalid glob 'a}b': unbalanced '}'",
      }),
  },
  {
    name: "fail-approved-paths-not-list",
    errors: [
      {
        code: "MTL904",
        line: 1,
        key: "approvedPaths",
        message: "approvedPaths: expected list of strings, got string",
      },
    ],
  },
  {
    name: "fail-allow-private-not-boolean",
    errors: [
      {
        code: "MTL904",
        line: 1,
        key: "allowPrivateNetworks",
        message: "allowPrivateNetworks: expected boolean, got string",
      },
    ],
  },
  {
    name: "fail-star-roots-without-roots",
    errors: [
      {
        code: "MTL904",
        line: 3,
        key: "pairs[0].roots",
        message: 'pairs[0].roots: expected at least one declared root for "*", got none',
      },
    ],
  },
  {
    name: "fail-reversed-glob-range",
    errors: [
      {
        code: "MTL907",
        line: 3,
        key: "pairs[0].include",
        message: "pairs[0].include: invalid glob '[z-a].md': invalid character class",
      },
      {
        code: "MTL907",
        line: 7,
        key: "pairs[1].include[1]",
        message: "pairs[1].include[1]: invalid glob 'docs/[9-0]*.md': invalid character class",
      },
    ],
  },
  {
    name: "fail-name-not-a-string",
    errors: [
      {
        code: "MTL904",
        line: 2,
        key: "pairs[0].name",
        message: "pairs[0].name: expected string, got number",
      },
      {
        code: "MTL904",
        line: 5,
        key: "pairs[1].name",
        message: "pairs[1].name: expected string, got null",
      },
    ],
  },
  {
    name: "fail-invalid-root-name-no-cascade",
    errors: [
      {
        code: "MTL905",
        line: 2,
        key: "roots.bad name",
        message: "roots.bad name: invalid name 'bad name'",
      },
    ],
  },
  {
    name: "fail-non-string-key",
    errors: [
      {
        code: "MTL904",
        line: 1,
        key: "(root)",
        message: "(root): expected a string key, got number",
      },
      {
        code: "MTL904",
        line: 5,
        key: "pairs[0]",
        message: "pairs[0]: expected a string key, got number",
      },
    ],
  },
  {
    name: "fail-pair-not-a-mapping",
    errors: [
      {
        code: "MTL904",
        line: 2,
        key: "pairs[0]",
        message: "pairs[0]: expected a mapping, got string",
      },
      {
        code: "MTL904",
        line: 3,
        key: "pairs[1]",
        message: "pairs[1]: expected a mapping, got list",
      },
    ],
  },
  {
    name: "fail-template-empty-string",
    errors: [
      {
        code: "MTL904",
        line: 2,
        key: "pairs[0].template",
        message: "pairs[0].template: expected non-empty string, got empty string",
      },
    ],
  },
  {
    // `exclude: []` on the second pair is accepted (no error for it).
    name: "fail-include-empty-list",
    errors: [
      {
        code: "MTL904",
        line: 3,
        key: "pairs[0].include",
        message: "pairs[0].include: expected a non-empty list, got an empty list",
      },
    ],
  },
  {
    name: "fail-description-wrong-type",
    errors: [
      {
        code: "MTL904",
        line: 4,
        key: "pairs[0].description",
        message: "pairs[0].description: expected string, got number",
      },
    ],
  },
  {
    name: "fail-roots-not-a-mapping",
    errors: [
      {
        code: "MTL904",
        line: 1,
        key: "roots",
        message: "roots: expected a mapping, got list",
      },
    ],
  },
  {
    name: "fail-alias-empty-value",
    errors: [
      {
        code: "MTL904",
        line: 2,
        key: "aliases.docs",
        message: "aliases.docs: expected non-empty string, got empty string",
      },
      {
        code: "MTL904",
        line: 3,
        key: "aliases.blank",
        message: "aliases.blank: expected non-empty string, got null",
      },
    ],
  },
  {
    name: "fail-approved-paths-bad-items",
    errors: [
      {
        code: "MTL904",
        line: 2,
        key: "approvedPaths[0]",
        message: "approvedPaths[0]: expected non-empty string, got empty string",
      },
      {
        code: "MTL904",
        line: 3,
        key: "approvedPaths[1]",
        message: "approvedPaths[1]: expected non-empty string, got number",
      },
    ],
  },
  {
    name: "fail-pair-roots-bad-shapes",
    errors: [
      {
        code: "MTL904",
        line: 3,
        key: "pairs[0].roots",
        message: "pairs[0].roots: expected at least one root name, got an empty list",
      },
      {
        code: "MTL904",
        line: 6,
        key: "pairs[1].roots[0]",
        message: "pairs[1].roots[0]: expected root name, got number",
      },
      {
        code: "MTL904",
        line: 9,
        key: "pairs[2].roots",
        message: 'pairs[2].roots: expected root name, list of root names or "*", got number',
      },
    ],
  },
  {
    name: "fail-template-root-not-a-string",
    errors: [
      {
        code: "MTL904",
        line: 3,
        key: "pairs[0].templateRoot",
        message: "pairs[0].templateRoot: expected non-empty string, got number",
      },
    ],
  },
  {
    name: "fail-version-zero",
    errors: [{ code: "MTL908", line: 1, key: "version", message: "unsupported config version 0" }],
  },
  {
    name: "fail-version-fractional",
    errors: [
      {
        code: "MTL904",
        line: 1,
        key: "version",
        message: "version: expected integer, got number",
      },
    ],
  },
  {
    name: "fail-pairs-not-a-list",
    errors: [
      {
        code: "MTL904",
        line: 1,
        key: "pairs",
        message: "pairs: expected a non-empty list, got mapping",
      },
    ],
  },
  {
    // Anchors and aliases are not supported: a config cannot expand (C07).
    name: "fail-yaml-alias",
    errors: [
      {
        code: "MTL904",
        line: 5,
        key: "pairs[1]",
        message: "pairs[1]: expected a mapping, got alias",
      },
    ],
  },
  {
    // `<<` is a plain key in YAML 1.2: an unknown key, never a merge.
    name: "fail-yaml-merge-key",
    errors: [
      {
        code: "MTL903",
        line: 4,
        key: "pairs[0].<<",
        message: "pairs[0].<<: unknown key '<<'",
      },
    ],
  },
  {
    name: "fail-multi-document",
    errors: [
      {
        code: "MTL902",
        line: 4,
        message: `cannot parse ${FILE}: Source contains multiple documents`,
        prefix: true,
      },
    ],
  },
];

const load = (name: string, file = FILE) => loadConfig({ cwd: fixturePath("config", `${GROUP}${name}`), configPath: file, home: HOME });

describe("config validation: layout", () => {
  it("has at least 1 pass- case, at least 1 fail- case, one directory each", () => {
    expectSplit("config", GROUP, CASES);
  });
});

describe("config validation: errors name file, line and key (spec 6.6)", () => {
  for (const testCase of CASES.filter((item) => item.name.startsWith("fail-"))) {
    it(`${testCase.name}: ${testCase.errors.map((error) => error.code).join(", ")}`, async () => {
      const result = await load(testCase.name, testCase.file);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.errors).toHaveLength(testCase.errors.length);
      testCase.errors.forEach((expected, index) => {
        const error = result.errors[index];
        expect(error?.code).toBe(expected.code);
        expect(error?.severity).toBe("error");
        expect(error?.file).toBe(testCase.file ?? FILE);
        expect(error?.line).toBe(expected.line);
        expect(error?.key).toBe(expected.key);
        if (expected.prefix === true) expect(error?.message.startsWith(expected.message)).toBe(true);
        else expect(error?.message).toBe(expected.message);
      });
    });
  }

  it("fail-*: every error that has a line also has a column", async () => {
    for (const testCase of CASES.filter((item) => item.name.startsWith("fail-"))) {
      const result = await load(testCase.name, testCase.file);
      if (result.ok) throw new Error(`${testCase.name}: expected errors`);
      for (const error of result.errors) {
        expect(error.line === undefined).toBe(error.column === undefined);
      }
    }
  });
});

describe("config validation: a valid config (spec 6.3)", () => {
  it("pass-full-config: defaults applied, paths resolved by one resolver (6.2)", async () => {
    const result = await load("pass-full-config");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { config } = result;
    const dir = foldPath(fixturePath("config", `${GROUP}pass-full-config`));
    expect(config.display).toBe(FILE);
    expect(config.dir).toBe(dir);
    expect(config.onEmpty).toBe("error");
    expect(config.allowPrivateNetworks).toBe(true);
    expect([...config.roots]).toEqual([
      ["shared", foldPath(`${dir}/../shared-templates`)],
      ["notes", "/home/test/notes"],
    ]);
    expect([...config.aliases]).toEqual([["assets", `${dir}/assets`]]);
    expect(config.approvedPaths).toEqual(["/home/test/notes"]);
    expect(config.pairs.map((pair) => pair.name)).toEqual(["adr", "agent.template", "agent.template-2"]);
    const [adr, agents, star] = config.pairs;
    expect(adr?.onEmpty).toBe("error");
    expect(adr?.roots).toEqual(["project"]);
    expect(adr?.exclude).toEqual(["**/README.md"]);
    expect(adr?.description).toBe("architecture decision records");
    expect(adr?.templatePath).toBe(`${dir}/docs/templates/adr.template.md`);
    expect(agents?.onEmpty).toBe("ignore");
    // A repeated root name in `roots` is accepted and listed once.
    expect(agents?.roots).toEqual(["project", "notes"]);
    // `exclude: []` is accepted and empty.
    expect(star?.exclude).toEqual([]);
    expect(star?.excludeGlobs).toEqual([]);
    expect(agents?.include).toEqual([".opencode/agents/*.md", "docs/{a,b}/**/*.md"]);
    expect(agents?.templatePath).toBe(foldPath(`${dir}/../shared-templates/agent.template.md`));
    expect(star?.roots).toEqual(["shared", "notes"]);
    expect(star?.templatePath).toBe(`${dir}/agent.template.md`);
  });
});
