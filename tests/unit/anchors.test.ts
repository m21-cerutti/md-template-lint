/**
 * Anchor lines (docs/spec.md 4.4 DIR5): every diagnostic `lintTarget` returns can be resolved
 * to its target anchor line through `anchorLineOf` (a side table, never a field of the
 * diagnostic): 1-based for a finding about one target line, null for a finding about the whole
 * file. Data for the reporters (offending-line display); nothing is printed from it here.
 */
import { describe, expect, it } from "vitest";
import { checkTemplate, checkTarget, lintTarget } from "../../src/engine/pipeline.js";
import { createRegistry } from "../../src/engine/registry.js";
import { anchorLineOf, createEnv } from "../../src/engine/rule.js";
import { anchorLineOf as exported } from "../../src/index.js";

const registry = createRegistry();

const TEMPLATE = [
  "---",
  "# [filename:case:snake_case]",
  "title: Notes",
  "status: draft # [format:constant:draft]",
  "owner: x",
  "---",
  "",
  "# Notes",
  "",
  "## Overview [content:non-empty]",
  "",
  "## Details [presence:exist]",
  "",
  "## Draft [presence:template-only]",
  "",
  "## Context",
  "",
].join("\n");

/** code -> anchor line of each diagnostic, in output order. */
async function anchors(target: string, path = "notes.md"): Promise<[string, number | null][]> {
  const status = await checkTemplate(registry, TEMPLATE);
  if (status.status !== "ok") throw new Error("template is broken");
  const { diagnostics } = await lintTarget(registry, status.model, target, path, createEnv());
  return diagnostics.map((diagnostic) => [diagnostic.code, anchorLineOf(diagnostic)]);
}

describe("anchor lines of target diagnostics (spec 4.4 DIR5)", () => {
  it("field findings anchor on the target key line, an empty value too; a missing key has none", async () => {
    const target = ["---", "title:", "status: final", "---", "", "# Notes", ""].join("\n");
    expect(await anchors(target, "Bad-Name.md")).toEqual(
      expect.arrayContaining([
        ["MTL101", null],
        ["MTL201", 2],
        ["MTL301", 3],
        ["MTL201", null],
      ]),
    );
  });

  it("MTL202 anchors on the key line; a duplicate key on its last occurrence", async () => {
    const target = [
      "---",
      "title: Notes",
      "status: draft",
      "owner: a",
      "extra: 1",
      "extra: 2",
      "other: y",
      "---",
      "",
      "# Notes",
      "",
      "## Overview",
      "",
      "Text.",
      "",
      "## Context",
      "",
    ].join("\n");
    const found = await anchors(target);
    expect(found.filter(([code]) => code === "MTL202")).toEqual([
      ["MTL202", 6],
      ["MTL202", 7],
    ]);
  });

  it("MTL601, MTL602 and MTL604 have none; MTL603 the first target heading with its text", async () => {
    const target = [
      "---",
      "title: Notes",
      "status: draft",
      "owner: a",
      "---",
      "",
      "# Context",
      "",
      "# Notes",
      "",
      "# Draft",
      "",
      "# Draft",
      "",
    ].join("\n");
    expect(await anchors(target)).toEqual([
      ["MTL601", null],
      ["MTL602", null],
      ["MTL603", 11],
      ["MTL604", null],
    ]);
  });

  it("MTL701 to MTL705 anchor on the first target heading of the checked section", async () => {
    const target = [
      "---",
      "title: Notes",
      "status: draft",
      "owner: a",
      "---",
      "",
      "# Notes",
      "",
      "## Overview",
      "",
      "## Details",
      "",
      "## Overview",
      "",
      "Text.",
      "",
      "## Context",
      "",
    ].join("\n");
    expect(await anchors(target)).toEqual([["MTL701", 9]]);
  });

  it("directive warnings anchor on their directive line", async () => {
    const target = [
      "---",
      "title: Notes",
      "status: draft # md-template-lint disable-line MTL2O1",
      "owner: a",
      "---",
      "",
      "# Notes",
      "",
      "## Overview",
      "",
      "Text.",
      "",
      "## Context",
      "<!-- md-template-lint end disable MTL202 -->",
      "",
    ].join("\n");
    expect(await anchors(target)).toEqual([
      ["MTL021", 3],
      ["MTL023", 14],
    ]);
  });

  it("a target parse failure has no anchor", async () => {
    expect(await anchors("no frontmatter\n")).toEqual([["MTL001", null]]);
  });

  it("the anchor is not a field of the diagnostic, and checkTarget keeps it", async () => {
    const status = await checkTemplate(registry, TEMPLATE);
    if (status.status !== "ok") throw new Error("template is broken");
    const target = "---\ntitle: Notes\nstatus: draft\nowner: a\nextra: x\n---\n\n# Notes\n";
    const found = await checkTarget(registry, status.model, target, "notes.md", createEnv());
    const extra = found.find((diagnostic) => diagnostic.code === "MTL202");
    expect(extra).toEqual({
      code: "MTL202",
      severity: "warning",
      message: "Unknown key 'extra' not present in template",
      position: null,
    });
    expect(extra === undefined ? null : exported(extra)).toBe(5);
    // A diagnostic the pipeline did not return has none.
    expect(anchorLineOf({ code: "MTL202", severity: "warning", message: "", position: null })).toBe(
      null,
    );
  });

  it("template diagnostics have none", async () => {
    const status = await checkTemplate(registry, "---\ntitle: x # [optionl]\n---\n");
    if (status.status !== "ok") throw new Error("template is broken");
    expect(status.warnings.map(anchorLineOf)).toEqual([null]);
  });
});
