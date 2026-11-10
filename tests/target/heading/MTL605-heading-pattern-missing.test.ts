/**
 * MTL605 heading-pattern-missing (src/rules/heading.ts, docs/spec.md 2.10 "Presence of a
 * pattern heading", steps 3b and 3c, 4.3, 4.4 DIR5 to DIR7). A required pattern heading whose
 * position took nothing: a literal pattern whose next sibling differs or is absent, or a
 * placeholder pattern with no sibling left. No anchor, in both scopes: only `disable-file`.
 */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { anchorLineOf, createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL605";
const DIR = "tests/fixtures/pairs/MTL605";

interface Expected {
  readonly message: string;
  /** The LABEL of the pattern heading (spec 2.10, 8.1); `""` for an empty label. */
  readonly heading: string;
}

interface TestCase {
  readonly name: string;
  readonly expected: readonly Expected[];
}

const RELEASE = {
  message: 'Heading: missing required heading matching [pattern:"[{semver}] - {date}"] (H2)',
  heading: "Release",
};
const STEP = {
  message: `Heading: Section 'Steps': missing required heading matching [pattern:"Step {digits}"] (H3)`,
  heading: "Step",
};

/** Case -> fixture dir (same name) -> expected result. At least 1 pass- and 1 fail- case. */
const CASES: readonly TestCase[] = [
  // Worked example 1 of 2.10, variant "no release": `## Unreleased` takes line 7, no sibling
  // is left for the required `## Release`.
  { name: "fail-file-scope-placeholder-pattern-with-no-sibling-left", expected: [RELEASE] },
  // The same pair with `disable-file MTL605` in the target: silenced (spec 2.10, DIR7).
  { name: "pass-disable-file-silences-it", expected: [] },
  // Owner example D of 2.10: the literal pattern `toto` takes line 5; `{text}` has no sibling
  // left. Its label is empty, so the heading member is "".
  {
    name: "fail-owner-example-d-literal-pattern-takes-the-only-sibling",
    expected: [
      {
        message: 'Heading: missing required heading matching [pattern:"{text}"] (H2)',
        heading: "",
      },
    ],
  },
  // Step 3b: a literal pattern whose next sibling (`Details`) differs takes nothing: MTL605,
  // never MTL601; `## Details` then takes that sibling.
  {
    name: "fail-literal-pattern-whose-next-sibling-differs",
    expected: [
      {
        message: 'Heading: missing required heading matching [pattern:"Overview"] (H2)',
        heading: "Overview",
      },
    ],
  },
  // Step 3c: a placeholder position with a sibling left that does not match is a mismatch
  // (MTL606), never MTL605.
  { name: "pass-placeholder-pattern-with-a-sibling-left-is-not-missing", expected: [] },
  // Section scope: `{in}` is `Section '{parent}': `, the level H3.
  { name: "fail-section-scope-placeholder-pattern-with-no-sibling-left", expected: [STEP] },
  // No anchor in section scope either (spec 2.10): a line directive on the parent line does
  // not cover it.
  { name: "fail-disable-line-on-the-parent-line-does-not-silence-it", expected: [STEP] },
  // Optional pattern headings absent, in file scope (a non-matching sibling left) and in
  // section scope (no sibling left): no finding.
  { name: "pass-optional-pattern-headings-absent-in-both-scopes", expected: [] },
  // Both pattern headings match their siblings: no finding.
  { name: "pass-pattern-headings-match-in-both-scopes", expected: [] },
  // Sorted with MTL601 by template line (asserted below).
  {
    name: "fail-sorted-with-mtl601-by-template-line",
    expected: [
      {
        message: 'Heading: missing required heading matching [pattern:"v{semver}"] (H2)',
        heading: "Release",
      },
    ],
  },
];

const read = (path: string): string =>
  readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

/** Every diagnostic for a template and a target text. */
async function lintText(template: string, target: string) {
  const status = await checkTemplate(registry, template);
  if (status.status !== "ok") throw new Error("template is broken");
  return checkTarget(registry, status.model, target, "target.md", createEnv());
}

/** Every diagnostic for the pair of a fixture folder. */
async function lintAll(name: string) {
  const fixture = `${DIR}/${name}`;
  return lintText(read(`${fixture}/template.md`), read(`${fixture}/target.md`));
}

/** The errors of a lint as [code, message, anchor line]. */
async function errorsOf(found: ReturnType<typeof lintText>) {
  return (await found)
    .filter((diagnostic) => diagnostic.severity === "error")
    .map((diagnostic) => [diagnostic.code, diagnostic.message, anchorLineOf(diagnostic)]);
}

const head = "---\ntitle: x\n---\n\n";

describe("MTL605 heading-pattern-missing", () => {
  it("is registered in category heading, error, target step headings", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "heading-pattern-missing",
      category: "heading",
      severity: "error",
      phase: "target",
      step: "headings",
    });
  });

  it("has at least 1 pass- case and at least 1 fail- case, one fixture dir each", () => {
    const passing = CASES.filter((testCase) => testCase.name.startsWith("pass-"));
    const failing = CASES.filter((testCase) => testCase.name.startsWith("fail-"));
    expect(passing.length).toBeGreaterThanOrEqual(1);
    expect(failing.length).toBeGreaterThanOrEqual(1);
    expect(passing.length + failing.length).toBe(CASES.length);
    expect(CASES.filter((testCase) => testCase.expected.length === 0)).toEqual(passing);
    const dirs = readdirSync(fileURLToPath(new URL(`../../../${DIR}`, import.meta.url))).sort();
    expect(dirs).toEqual(CASES.map((testCase) => testCase.name).sort());
  });

  for (const testCase of CASES) {
    it(`${testCase.name}: ${DIR}/${testCase.name}`, async () => {
      const found = (await lintAll(testCase.name)).filter((diagnostic) => diagnostic.code === CODE);
      expect(
        found.map((diagnostic) => ({ message: diagnostic.message, heading: diagnostic.heading })),
      ).toEqual(testCase.expected);
      for (const diagnostic of found) {
        expect(diagnostic.severity).toBe("error");
        // No anchor (spec 4.4 DIR5) and the template-line sort key is cleared.
        expect(anchorLineOf(diagnostic)).toBeNull();
        expect(diagnostic.position).toBeNull();
      }
    });
  }

  it("the disable-file pair is the unsuppressed baseline plus one directive", async () => {
    const baseline = await lintAll("fail-file-scope-placeholder-pattern-with-no-sibling-left");
    expect(baseline.map((diagnostic) => diagnostic.code)).toEqual(["MTL605"]);
    expect(await lintAll("pass-disable-file-silences-it")).toEqual([]);
  });

  it("sorts with MTL601 by template line (spec 4.3 emission order)", async () => {
    // Template lines: `## Alpha` 7, `## Release` 9, `## Omega` 11; none is in the target.
    const found = await lintAll("fail-sorted-with-mtl601-by-template-line");
    expect(found.map((diagnostic) => [diagnostic.code, diagnostic.heading])).toEqual([
      ["MTL601", "Alpha"],
      ["MTL605", "Release"],
      ["MTL601", "Omega"],
    ]);
  });

  it("a pattern heading is never MTL601 or MTL610 (spec 2.10: MTL605 replaces them)", async () => {
    for (const name of [
      "fail-literal-pattern-whose-next-sibling-differs",
      "fail-owner-example-d-literal-pattern-takes-the-only-sibling",
      "fail-section-scope-placeholder-pattern-with-no-sibling-left",
    ]) {
      const codes = (await lintAll(name)).map((diagnostic) => diagnostic.code);
      expect(codes).toEqual(["MTL605"]);
    }
    // A required placeholder position with a sibling left takes it as a mismatch (spec 2.10
    // step 3c, phase P4): MTL606 only, never MTL601 or MTL605.
    const codes = (
      await lintAll("pass-placeholder-pattern-with-a-sibling-left-is-not-missing")
    ).map((diagnostic) => diagnostic.code);
    expect(codes).toEqual(["MTL606"]);
  });

  it("the pattern match is the parent of its section-scope children (MTL610 names it)", async () => {
    const template = `${head}# C\n\n## Release [pattern:"[{semver}] - {date}"]\n\n### Added\n`;
    expect(await errorsOf(lintText(template, `${head}# C\n\n## [1.2.0] - 2026-03-01\n`))).toEqual([
      [
        "MTL610",
        "Heading: Section '[1.2.0] - 2026-03-01': missing required heading 'Added' (H3)",
        7,
      ],
    ]);
  });

  it("content rules read the section the pattern matched", async () => {
    // Spec 2.6 "Content tags": a pattern heading is labelled with the matched target text and
    // the pattern as written, `Section '{text}' (pattern "{pattern}")`.
    const template = `${head}# C\n\n## Release [pattern:"v{semver}"] [content:non-empty]\n`;
    expect(await errorsOf(lintText(template, `${head}# C\n\n## v1.2.0\n`))).toEqual([
      [
        "MTL701",
        `Section 'v1.2.0' (pattern "v{semver}"): [content:non-empty] section body is empty`,
        7,
      ],
    ]);
    expect(await errorsOf(lintText(template, `${head}# C\n\n## v1.2.0\n\nText.\n`))).toEqual([]);
  });

  it("MTL612 lists a target heading that a pattern of the subtree matches (spec 2.6)", async () => {
    const template =
      `${head}# C\n\n## Unreleased [content:subheadings:disallow]\n\n` +
      '### Added [pattern:"Added {text}"] [presence:optional]\n';
    const target = (child: string) => `${head}# C\n\n## Unreleased\n\n### ${child}\n`;
    expect(await errorsOf(lintText(template, target("Added stuff")))).toEqual([]);
    expect(await errorsOf(lintText(template, target("Misc")))).toEqual([
      [
        "MTL612",
        "Heading: Section 'Unreleased': heading 'Misc' at level H3 is not in the template " +
          "[content:subheadings:disallow]",
        9,
      ],
    ]);
  });
});
