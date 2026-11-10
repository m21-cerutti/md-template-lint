/** MTL703 content-list (src/rules/content.ts, docs/spec.md 2.6, 4.1 step 6, 4.3). */
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL703";
const DIR = "tests/fixtures/pairs/MTL703";
const MESSAGE = "Section 'Steps': [content:list] no markdown list item found";

/**
 * Case -> expected MTL703 messages, plus the template warning codes
 * (`warnings`, from the template parse, usually none). The fixture of a case is
 * `DIR/<name>`. At least 1 passing case and 1 failing case. Silent
 * branches live in `fail-` fixtures where another section of the same file
 * still yields the expected error.
 */
const CASES = [
  {
    // One [content:list] section per shape: `- a`, `* a`, `+ a`, `1. a`, `12) a`,
    // Arabic-Indic digit (U+0663) and fullwidth digit (U+FF13) markers, a tab and
    // an ideographic space (U+3000) after the marker, U+3000 before it, and a
    // deeply indented nested item (all Python `\d` / `\s` matches).
    name: "pass-list-marker-and-whitespace-shapes",
    expected: [],
    warnings: [],
  },
  {
    name: "fail-section-has-prose-only",
    expected: [MESSAGE],
    warnings: [],
  },
  {
    name: "fail-markers-lack-following-whitespace",
    expected: [MESSAGE],
    warnings: [],
  },
  {
    // Also `²)` (category No), `Ⅳ.` (category Nl), and a marker followed only by
    // U+200B or U+FEFF (not whitespace for Python).
    name: "fail-unsupported-marker-styles",
    expected: [MESSAGE],
    warnings: [],
  },
  {
    name: "fail-list-in-other-section",
    expected: [MESSAGE],
    warnings: [],
  },
  {
    name: "fail-first-repeated-heading-without-list",
    expected: [MESSAGE],
    warnings: [],
  },
  {
    // Silent: tagged section absent from the target, untagged section, and a
    // section tagged [content:non-empty] only (prose body, no list).
    name: "fail-only-tagged-section-without-list-reported",
    expected: [MESSAGE],
    warnings: [],
  },
] as const;

const read = (path: string): string =>
  readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

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

/** MTL703 diagnostics and template warning codes for the pair of a case folder. */
async function lint(testCase: { readonly name: string }) {
  const fixture = `${DIR}/${testCase.name}`;
  const status = await checkTemplate(registry, read(`${fixture}/template.md`));
  if (status.status !== "ok") throw new Error(`${fixture}: template is broken`);
  const found = await checkTarget(
    registry,
    status.model,
    read(`${fixture}/target.md`),
    `${fixture}/target.md`,
    createEnv(),
  );
  return {
    found: found.filter((diagnostic) => diagnostic.code === CODE),
    warnings: status.warnings,
  };
}

describe("MTL703 content-list", () => {
  it("is registered in category content, error, target step content", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "content-list",
      category: "content",
      severity: "error",
      phase: "target",
      step: "content",
    });
  });

  it("has at least 1 pass- case and at least 1 fail- case, one fixture dir each", () => {
    const passing = CASES.filter((testCase) => testCase.name.startsWith("pass-"));
    const failing = CASES.filter((testCase) => testCase.name.startsWith("fail-"));
    expect(passing.length).toBeGreaterThanOrEqual(1);
    expect(failing.length).toBeGreaterThanOrEqual(1);
    expect(passing.length + failing.length).toBe(CASES.length);
    expect(CASES.filter((testCase) => testCase.expected.length === 0)).toEqual(passing);
    // Orphan detection: no directory at any depth besides the cases, and each holds only the pair.
    const names = CASES.map((testCase) => testCase.name).sort();
    const tree = listTree();
    expect(tree.dirs).toEqual(names);
    expect(tree.files).toEqual(
      names.flatMap((name) => [`${name}/target.md`, `${name}/template.md`]).sort(),
    );
  });

  for (const testCase of CASES) {
    it(`${testCase.name}: ${DIR}/${testCase.name}`, async () => {
      const { found, warnings } = await lint(testCase);
      expect(found.map((diagnostic) => diagnostic.message)).toEqual(testCase.expected);
      for (const diagnostic of found) {
        expect(diagnostic.severity).toBe("error");
        expect(diagnostic.position).toBeNull();
      }
      expect(warnings.map((diagnostic) => diagnostic.code)).toEqual(testCase.warnings);
      for (const diagnostic of warnings) expect(diagnostic.severity).toBe("warning");
    });
  }
});
