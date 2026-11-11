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
  '## Details [pattern:"{text}"]',
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
    const target = ["---", "title: Notes", "status: draft", "owner: a", "extra: 1", "extra: 2", "other: y", "---", "", "# Notes", "", "## Overview", "", "Text.", "", "## Context", ""].join("\n");
    const found = await anchors(target);
    expect(found.filter(([code]) => code === "MTL202")).toEqual([
      ["MTL202", 6],
      ["MTL202", 7],
    ]);
  });

  it("MTL601, MTL605 and MTL604 have none; MTL603 the first target heading with its level and text", async () => {
    // Levels match exactly (spec 2.6, change C10): a target without H2 gives MTL605 for the
    // required `{text}` pattern heading (spec 2.10 step 3c), while MTL603 needs an H2 `Draft`,
    // so the codes come from two targets.
    const head = ["---", "title: Notes", "status: draft", "owner: a", "---", ""];
    const noH2 = [...head, "# Notes", ""].join("\n");
    expect(await anchors(noH2)).toEqual([
      ["MTL601", null],
      ["MTL605", null],
      ["MTL601", null],
    ]);
    // Positional run (spec 2.10), level 2: both `## Draft` are set aside (step 1, MTL603 on the
    // first, line 11); the free sibling is `Context` (line 7). `Overview` looks at it: missing
    // (MTL601). `Details` (`{text}` pattern) takes it. `Context` has no sibling left: missing
    // (MTL601). `Details` (an H2) is then matched before `# Notes` (line 9) which precedes it
    // in the template: an order across levels, MTL604, listed after the heading findings.
    const target = [...head, "## Context", "", "# Notes", "", "## Draft", "", "## Draft", ""].join("\n");
    expect(await anchors(target)).toEqual([
      ["MTL601", null],
      ["MTL603", 11],
      ["MTL601", null],
      ["MTL604", null],
    ]);
  });

  it("MTL701 to MTL705 anchor on the first target heading of the checked section", async () => {
    const target = ["---", "title: Notes", "status: draft", "owner: a", "---", "", "# Notes", "", "## Overview", "", "## Details", "", "## Context", "", "## Overview", "", "Text.", ""].join("\n");
    // The run takes line 9 (`Overview`, empty body), 11 (`Details`), 13 (`Context`); the second
    // `## Overview` (line 15, with text) is in the tail: not the match, so line 9 is checked.
    // The tail heading is the warning MTL616, anchored on it (docs/grammar.md "Extra", DIR5).
    expect(await anchors(target)).toEqual([
      ["MTL701", 9],
      ["MTL616", 15],
    ]);
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
      "## Details",
      "",
      "## Context",
      "<!-- md-template-lint end disable MTL202 -->",
      "",
    ].join("\n");
    expect(await anchors(target)).toEqual([
      ["MTL021", 3],
      ["MTL023", 16],
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
    expect(anchorLineOf({ code: "MTL202", severity: "warning", message: "", position: null })).toBe(null);
  });

  it("template diagnostics have none", async () => {
    const status = await checkTemplate(registry, "---\ntitle: x # [optionl]\n---\n");
    if (status.status !== "ok") throw new Error("template is broken");
    expect(status.warnings.map(anchorLineOf)).toEqual([null]);
  });
});
