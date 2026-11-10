/** MTL701 content-non-empty (src/rules/content.ts, docs/spec.md 2.6, 4.1 step 6, 4.3). */
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { anchorLineOf, createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL701";
const DIR = "tests/fixtures/pairs/MTL701";

/** Expected message of a section (spec 4.3: `{label}: [content:non-empty] section body is empty`). */
const message = (section: string): string =>
  `Section '${section}': [content:non-empty] section body is empty`;

/**
 * Case -> expected MTL701 messages, plus the template warning codes
 * (`warnings`, from the template parse, usually none). The fixture of a case is
 * `DIR/<name>`. At least 1 passing case and 1 failing case. Silent
 * branches live in `fail-` fixtures where another section of the same file
 * still yields the expected error.
 */
const CASES = [
  {
    // Bodies holding only U+FEFF, U+200B or U+180E are NOT blank for Python
    // `str.isspace` (swapping isPythonSpace for String.trim would flag U+FEFF).
    name: "pass-section-has-text",
    expected: [],
    warnings: [],
  },
  {
    name: "fail-section-body-empty",
    expected: [message("Overview")],
    warnings: [],
  },
  {
    // Space, tab and ideographic space (U+3000) bodies are blank.
    name: "fail-section-body-whitespace-only",
    expected: [message("Overview"), message("Ideographic")],
    warnings: [],
  },
  {
    name: "fail-first-repeated-heading-empty",
    expected: [message("Overview")],
    warnings: [],
  },
  {
    // Silent: tagged section absent from the target, untagged section, and
    // sections tagged [content:table] / [content:list] (other tags, empty bodies).
    name: "fail-only-tagged-empty-section-reported",
    expected: [message("Overview")],
    warnings: [],
  },
  {
    // Also MTL702 for the earlier `Changes` section; the order is asserted below.
    name: "fail-reported-in-template-section-order-across-codes",
    expected: [message("Overview")],
    warnings: [],
  },
  {
    // Spec 4.3: a section-scope heading is labelled `Section '{parent} > {text}'`.
    name: "fail-section-scope-label-names-the-parent",
    expected: [message("Context > Decision")],
    warnings: [],
  },
  {
    // `{parent}` is the matched TARGET parent: `## Hub [pattern:"{text}"]` matched `Actual parent`.
    name: "fail-section-scope-label-uses-target-parent-text",
    expected: [message("Actual parent > Decision")],
    warnings: [],
  },
  {
    // Spec 2.10 worked example 1, variant "content on the release heading": instance line 21
    // (`[1.1.0] - 2026-02-01`, section lines 21 to 22) has an empty body; instances 9 and 15
    // have text. A pattern heading is labelled with the TARGET text and the pattern as written
    // (spec 2.6 "Content tags").
    name: "fail-pattern-heading-label-worked-example-1-content-variant",
    expected: [
      `Section '[1.1.0] - 2026-02-01' (pattern "[{semver}] - {date}"): [content:non-empty] section body is empty`,
    ],
    warnings: [],
  },
  {
    // Spec 2.6: `{pattern}` is the text between the quotes of the tag, escapes as written
    // (`\"` and `{{` / `}}` stay escaped); `{text}` is the target heading text.
    name: "fail-pattern-heading-label-shows-escapes-as-written",
    expected: [
      `Section 'Say "hi" {x}' (pattern "Say \\"{text}\\" {{x}}"): [content:non-empty] section body is empty`,
    ],
    warnings: [],
  },
] as const;

/** Spec 4.4 DIR5: the target line of the checked heading (the sibling its position took, spec 2.10). */
const ANCHORS: readonly { readonly dir: string; readonly anchor: number }[] = [
  { dir: "fail-section-scope-label-names-the-parent", anchor: 7 },
  { dir: "fail-section-scope-label-uses-target-parent-text", anchor: 7 },
  { dir: "fail-pattern-heading-label-worked-example-1-content-variant", anchor: 21 },
  { dir: "fail-pattern-heading-label-shows-escapes-as-written", anchor: 5 },
];

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

/** MTL701 diagnostics and template warning codes for the pair of a case folder. */
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

describe("MTL701 content-non-empty", () => {
  it("is registered in category content, error, target step content", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "content-non-empty",
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

  it("lists content findings in template section order across codes, not grouped by rule", async () => {
    const fixture = `${DIR}/fail-reported-in-template-section-order-across-codes`;
    const status = await checkTemplate(registry, read(`${fixture}/template.md`));
    if (status.status !== "ok") throw new Error(`${fixture}: template is broken`);
    const found = await checkTarget(
      registry,
      status.model,
      read(`${fixture}/target.md`),
      `${fixture}/target.md`,
      createEnv(),
    );
    // Legacy `validate_content`: section `Changes` (MTL702) comes before `Overview` (MTL701).
    expect(found.map((diagnostic) => `${diagnostic.code} ${diagnostic.message}`)).toEqual([
      "MTL702 Section 'Changes': [content:table] no markdown table row found",
      `MTL701 ${message("Overview")}`,
    ]);
  });

  for (const { dir, anchor } of ANCHORS) {
    it(`${dir}: anchored on target line ${anchor}`, async () => {
      const { found } = await lint({ name: dir });
      expect(found.map((diagnostic) => anchorLineOf(diagnostic))).toEqual([anchor]);
    });
  }

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
