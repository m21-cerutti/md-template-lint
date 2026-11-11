/**
 * MTL031 frontmatter-tag-conflict (src/rules/syntax.ts, docs/spec.md 2.7, 4.3, ADR 0015), via
 * `--verify`. A copy of `[frontmatter:optional]` that has no effect: a duplicate standalone
 * comment line (the first line stays effective), the tag after a key, or the tag in mixed
 * comment text. A warning: the template stays ok and `--verify` exits 0. Line and column point
 * at the tag's `[`; one finding per offending tag, in source order.
 */
import { describe, expect, it } from "vitest";
import { loadDocument } from "../../../src/engine/load.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { expectTemplateCases, verifyFixture, type VerifyCase } from "../../helpers/verify.js";

const CODE = "MTL031";
const DIR = "tests/fixtures/templates/MTL031";
const TAG = "[frontmatter:optional]";
const ALONE = "(it must be alone on its comment line)";

const warning = (message: string, line: number, column: number, sourceLine: string) => ({ code: CODE, severity: "warning", message, line, column, sourceLine }) as const;

/** A later standalone line repeats the tag of line `first`. */
const duplicate = (line: number, first: number) => warning(`Comment line ${line}: tag ${TAG} has no effect (already set on line ${first})`, line, 3, `# ${TAG}`);

/** Case -> fixture `<name>.md` -> expected `--verify` result. */
const CASES: readonly VerifyCase[] = [
  // One standalone comment line holding only the tag.
  { name: "pass-single-standalone-line", exitCode: 0, status: "ok", diagnostics: [] },
  // The standalone line after free comment text, another switch line and a key.
  { name: "pass-standalone-line-after-other-comments", exitCode: 0, status: "ok", diagnostics: [] },
  // Tags are case-insensitive.
  { name: "pass-tag-uppercase", exitCode: 0, status: "ok", diagnostics: [] },
  // A second standalone line: warned, the first line stays effective.
  { name: "fail-duplicate-standalone-line", exitCode: 0, status: "ok", diagnostics: [duplicate(4, 2)] },
  // The tag after a key is inert.
  {
    name: "fail-tag-after-key",
    exitCode: 0,
    status: "ok",
    diagnostics: [warning(`Field 'id': tag ${TAG} has no effect ${ALONE}`, 2, 9, `id: x # ${TAG}`)],
  },
  // The tag after free text on a comment line is inert.
  {
    name: "fail-tag-on-mixed-comment-line",
    exitCode: 0,
    status: "ok",
    diagnostics: [warning(`Comment line 2: tag ${TAG} has no effect ${ALONE}`, 2, 8, `# note ${TAG}`)],
  },
  // Three standalone lines: one finding per later line, in source order.
  { name: "fail-three-lines-two-findings", exitCode: 0, status: "ok", diagnostics: [duplicate(4, 2), duplicate(5, 2)] },
  // The tag on a `#` line inside a block scalar is value text (spec 2.1): inert, no finding.
  { name: "pass-tag-inside-block-scalar", exitCode: 0, status: "ok", diagnostics: [] },
];

/** A template whose `# [frontmatter:optional]` line sits inside a `|` block scalar value. */
const blockScalar = (after: string) => ["---", "id: x", "description: |", "  First line.", `  # ${TAG}`, "  Last line.", after, "---", "", "# Title", ""].join("\n");

describe("MTL031 frontmatter-tag-conflict (--verify)", { tags: ["MTL031", "syntax"] }, () => {
  it("is registered in category syntax, warning, phase template, right after MTL030", () => {
    const registry = createRegistry();
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "frontmatter-tag-conflict",
      category: "syntax",
      severity: "warning",
      phase: "template",
    });
    const codes = registry.byCategory.get("syntax")?.map((rule) => rule.code) ?? [];
    expect(codes.indexOf(CODE)).toBe(codes.indexOf("MTL030") + 1);
    expect(codes.at(-1)).toBe(CODE);
  });

  it("has at least 1 pass- case and at least 1 fail- case, one fixture file each", () => {
    expectTemplateCases(CODE, CASES);
  });

  it("a standalone-looking tag line inside a block scalar does not set the switch", () => {
    const loaded = loadDocument(blockScalar("title: y"));
    expect(loaded.ok && loaded.model.frontmatterOptional).toBe(false);
    expect(loaded.ok && loaded.model.optionalTags).toEqual([]);
  });

  it("a real standalone line after a block-scalar copy is the effective switch (no duplicate)", () => {
    const loaded = loadDocument(blockScalar(`# ${TAG}`));
    expect(loaded.ok && loaded.model.frontmatterOptional).toBe(true);
    expect(loaded.ok && loaded.model.optionalTags.map((entry) => entry.placement === "alone" && entry.firstLine)).toEqual([null]);
  });

  for (const { name, ...expected } of CASES) {
    it(`${name}: ${DIR}/${name}.md`, async () => {
      expect(await verifyFixture(CODE, name)).toEqual(expected);
    });
  }
});
