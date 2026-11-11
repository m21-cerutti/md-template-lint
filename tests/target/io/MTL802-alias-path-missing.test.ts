/** MTL802 alias-path-missing (src/rules/io.ts, docs/spec.md 2.8, 4.3). */
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv, createMemoryIo } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL802";
const DIR = "tests/fixtures/pairs/MTL802";

/**
 * Three config aliases; three files exist under `assets`. The unfolded
 * `assets-root/img/../gone.png` exists too, to prove the probe asks about the
 * FOLDED path (`assets-root/gone.png`, missing) while the message prints the
 * unfolded one.
 */
const env = createEnv({
  aliases: new Map([
    ["assets", "assets-root"],
    ["winstore", "C:\\store\\assets"],
    ["a-b_9", "ab-root"],
  ]),
  io: createMemoryIo(["assets-root/logo.png", "assets-root/a.png", "assets-root/b.png", "assets-root/img/../gone.png"]),
});

/** Case -> fixture -> expected result: at least 1 passing case and 1 failing case. */
const CASES = [
  {
    name: "pass-aliased-paths-exist-or-no-check",
    fixture: "tests/fixtures/pairs/MTL802/pass-aliased-paths-exist-or-no-check",
    expected: [],
  },
  {
    name: "fail-aliased-path-does-not-exist",
    fixture: "tests/fixtures/pairs/MTL802/fail-aliased-path-does-not-exist",
    expected: ["Field 'logo': aliased path '@assets/gone.png' resolved to assets-root/gone.png — does not exist"],
  },
  {
    name: "fail-nested-rest-keeps-sub-folders",
    fixture: "tests/fixtures/pairs/MTL802/fail-nested-rest-keeps-sub-folders",
    expected: ["Field 'logo': aliased path '@assets/img/deep/logo.png' resolved to assets-root/img/deep/logo.png — does not exist"],
  },
  {
    name: "fail-dot-dot-in-rest-is-printed-unfolded",
    fixture: "tests/fixtures/pairs/MTL802/fail-dot-dot-in-rest-is-printed-unfolded",
    expected: ["Field 'logo': aliased path '@assets/img/../gone.png' resolved to assets-root/img/../gone.png — does not exist"],
  },
  {
    name: "fail-alias-name-uses-dash-underscore-digit",
    fixture: "tests/fixtures/pairs/MTL802/fail-alias-name-uses-dash-underscore-digit",
    expected: ["Field 'logo': aliased path '@a-b_9/gone.png' resolved to ab-root/gone.png — does not exist"],
  },
  {
    name: "fail-root-prefixed-rest-is-stripped-under-alias-root",
    fixture: "tests/fixtures/pairs/MTL802/fail-root-prefixed-rest-is-stripped-under-alias-root",
    expected: [
      "Field 'images': aliased path '@assets//etc/x' resolved to assets-root/etc/x — does not exist",
      "Field 'images': aliased path '@assets/C:/x' resolved to assets-root/x — does not exist",
      "Field 'images': aliased path '@assets/\\\\srv\\s\\x' resolved to assets-root/srv/s/x — does not exist",
    ],
  },
  {
    name: "fail-list-reports-only-missing-items-in-order",
    fixture: "tests/fixtures/pairs/MTL802/fail-list-reports-only-missing-items-in-order",
    expected: ["Field 'images': aliased path '@assets/z.png' resolved to assets-root/z.png — does not exist", "Field 'images': aliased path '@assets/y.png' resolved to assets-root/y.png — does not exist"],
  },
  {
    name: "fail-alias-dir-with-backslashes-printed-with-slashes",
    fixture: "tests/fixtures/pairs/MTL802/fail-alias-dir-with-backslashes-printed-with-slashes",
    expected: ["Field 'logo': aliased path '@winstore/logo.png' resolved to C:/store/assets/logo.png — does not exist"],
  },
] as const;

const read = (path: string): string => readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

/** Diagnostics of this code for the pair of a fixture folder. */
async function lint(fixture: string) {
  const status = await checkTemplate(registry, read(`${fixture}/template.md`));
  if (status.status !== "ok") throw new Error(`${fixture}: template is broken`);
  const found = await checkTarget(registry, status.model, read(`${fixture}/target.md`), `${fixture}/target.md`, env);
  return found.filter((diagnostic) => diagnostic.code === CODE);
}

/** Every directory and file under DIR, at any depth, as sorted `/`-separated relative paths. */
function listTree(): { dirs: string[]; files: string[] } {
  const root = fileURLToPath(new URL(`../../../${DIR}`, import.meta.url));
  const dirs: string[] = [];
  const files: string[] = [];
  for (const entry of readdirSync(root, { recursive: true, withFileTypes: true })) {
    const path = relative(root, join(entry.parentPath, entry.name)).replaceAll("\\", "/");
    (entry.isDirectory() ? dirs : files).push(path);
  }
  return { dirs: dirs.sort(), files: files.sort() };
}

describe("MTL802 alias-path-missing", { tags: ["MTL802", "io"] }, () => {
  it("is registered in category io, warning, field step io", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "alias-path-missing",
      category: "io",
      severity: "warning",
      phase: "field",
      step: "io",
    });
  });

  it("has at least 1 pass- case and at least 1 fail- case, one fixture dir each", () => {
    const passing = CASES.filter((testCase) => testCase.name.startsWith("pass-"));
    const failing = CASES.filter((testCase) => testCase.name.startsWith("fail-"));
    expect(passing.length).toBeGreaterThanOrEqual(1);
    expect(failing.length).toBeGreaterThanOrEqual(1);
    expect(passing.length + failing.length).toBe(CASES.length);
    expect(CASES.filter((testCase) => testCase.expected.length === 0)).toEqual(passing);
    expect(CASES.map((testCase) => testCase.fixture)).toEqual(CASES.map((testCase) => `${DIR}/${testCase.name}`));
    // Orphan detection: no directory at any depth besides the cases, and each holds only the pair.
    const names = CASES.map((testCase) => testCase.name).sort();
    const tree = listTree();
    expect(tree.dirs).toEqual(names);
    expect(tree.files).toEqual(names.flatMap((name) => [`${name}/target.md`, `${name}/template.md`]).sort());
  });

  for (const testCase of CASES) {
    it(`${testCase.name}: ${testCase.fixture}`, async () => {
      const found = await lint(testCase.fixture);
      expect(found.map((diagnostic) => diagnostic.message)).toEqual(testCase.expected);
      for (const diagnostic of found) expect(diagnostic.severity).toBe("warning");
    });
  }
});
