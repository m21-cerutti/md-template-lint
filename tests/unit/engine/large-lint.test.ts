/**
 * Characterization of `lintTarget` on large synthetic documents (A4 of the perf plan, tmp/PLAN_perf-bench.md).
 * The expected values were produced by the code at the time of writing and are NOT derived from the
 * spec: they pin the diagnostics (code, severity, message, position, heading, anchor line), their
 * ORDER and the suppressed count, so a later performance change must not move any of them. Rule
 * semantics are tested elsewhere (tests/target/heading/, tests/unit/engine/heading-run.test.ts).
 *
 * - L1: a 600-heading, 6-level template against five generated targets, from a conforming one to a
 *   very faulty one (tests/helpers/large-docs.ts `bookTemplate`, `bookTarget`).
 * - L2: a small template against a 5308-heading target of 250 repeated parts (`wideTemplate`, `wideTarget`).
 * - O1: the MTL611 findings of L2 alone, plus a small repeat-parent case written out in full.
 *
 * Each large output is pinned by count, code sequence, head and tail rows, and a digest of every row
 * (tests/helpers/characterize.ts); the sequence makes a reorder readable, the digest makes it certain.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { loadDocument } from "../../../src/engine/load.js";
import type { Diagnostic, DocumentModel } from "../../../src/engine/model.js";
import { checkTemplate, lintTarget, type TargetResult } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { anchorLineOf, createEnv } from "../../../src/engine/rule.js";
import { digestOf, pinOf, rowOf, type DiagnosticPin } from "../../helpers/characterize.js";
import { bookTarget, bookTemplate, wideTarget, wideTemplate } from "../../helpers/large-docs.js";

const registry = createRegistry();

async function templateOf(text: string): Promise<DocumentModel> {
  const status = await checkTemplate(registry, text);
  if (status.status !== "ok") throw new Error("template is broken");
  return status.model;
}

const lint = (template: DocumentModel, text: string): Promise<TargetResult> => lintTarget(registry, template, text, "doc.md", createEnv());

/** Errors come before warnings, each group in emission order (spec 4.1). */
const errorsFirst = (diagnostics: readonly Diagnostic[]): boolean => {
  const firstWarning = diagnostics.findIndex((diagnostic) => diagnostic.severity === "warning");
  return firstWarning < 0 || diagnostics.slice(firstWarning).every((diagnostic) => diagnostic.severity === "warning");
};

/** Fault levels 0 to 4 of `bookTarget`, seed 1 (inline rows hold the first 140 characters of a message). */
const BOOK_PINS: readonly DiagnosticPin[] = [
  { count: 0, suppressed: 0, sequence: "", head: [], tail: [], digest: "4f53cda18c2baa0c0354bb5f9a3ecbe5" },
  {
    count: 3,
    suppressed: 0,
    sequence: "MTL306 MTL610 MTL701",
    head: [
      ["MTL306", "error", "Field 'version': value 'x' is not a semantic version [format:semver]", null, null, 4],
      ["MTL610", "error", "Heading: Section 'Chapter 41': missing required heading 'Intro' (H3)", null, "Intro", 615],
      ["MTL701", "error", "Section 'Chapter 33 > Wrap-up': [content:non-empty] section body is empty", null, "Wrap-up", 502],
    ],
    tail: [
      ["MTL610", "error", "Heading: Section 'Chapter 41': missing required heading 'Intro' (H3)", null, "Intro", 615],
      ["MTL701", "error", "Section 'Chapter 33 > Wrap-up': [content:non-empty] section body is empty", null, "Wrap-up", 502],
    ],
    digest: "c7f20c7667463a166aacf4b91eaacea7",
  },
  {
    count: 23,
    suppressed: 2,
    sequence: "MTL606 MTL614 MTL606 MTL610 MTL606x2 MTL607 MTL609 MTL608 MTL610 MTL606 MTL609 MTL610 MTL606 MTL609 MTL612 MTL608 MTL612 MTL610 MTL608 MTL614 MTL606 MTL610",
    head: [
      ["MTL606", "error", "Heading: Section 'Chapter 2': heading 'Owner 12' does not match [pattern:\"Owner {text}\"] at {text}", null, "Owner 12", 57],
      ["MTL614", "error", "Heading: Section 'Chapter 3': 1 heading(s) match [pattern:\"v{semver}\"] after the end of its run [repeat-rules:same-level]: ['v9.9.9']", null, "v9.9.9", 72],
      ["MTL606", "error", "Heading: Section 'Chapter 3': heading 'Stray' does not match [pattern:\"Owner {text}\"] at 'Owner '", null, "Stray", 71],
      ["MTL610", "error", "Heading: Section 'Chapter 3': missing required heading 'Wrap-up' (H3)", null, "Wrap-up", 60],
    ],
    tail: [
      ["MTL606", "error", "Heading: Section 'Chapter 47': heading 'Stray' does not match [pattern:\"Owner {text}\"] at 'Owner '", null, "Stray", 737],
      ["MTL610", "error", "Heading: Section 'Chapter 47': missing required heading 'Wrap-up' (H3)", null, "Wrap-up", 722],
    ],
    digest: "5768a58c5ac6c70fd8859e317aa71f05",
  },
  {
    count: 34,
    suppressed: 10,
    sequence: "MTL612 MTL610x3 MTL607 MTL614 MTL610 MTL607 MTL610 MTL608 MTL607 MTL610x3 MTL612x2 MTL610x3 MTL607 MTL614x2 MTL610x2 MTL612 MTL701x5 MTL202 MTL616x3",
    head: [
      ["MTL612", "error", "Heading: Section 'Wrap-up': heading 'Footnote' at level H4 is not in the template [content:subheadings:disallow]", null, "Footnote", 65],
      ["MTL610", "error", "Heading: Section 'Chapter 9': missing required heading 'Intro' (H3)", null, "Intro", 149],
      ["MTL610", "error", "Heading: Section 'Chapter 10': missing required heading 'Intro' (H3)", null, "Intro", 161],
      ["MTL610", "error", "Heading: Section 'Chapter 19': missing required heading 'Intro' (H3)", null, "Intro", 278],
    ],
    tail: [
      ["MTL616", "warning", "Heading: Section 'Chapter 48': 1 extra heading(s) at level H3 after the template headings: ['Owner Sam']", null, "Owner Sam", 707],
      ["MTL616", "warning", "Heading: Section 'Chapter 49': 2 extra heading(s) at level H3 after the template headings: ['Extra', 'Wrap-up']", null, "Extra", 724],
    ],
    digest: "ebb0526e6d8901c98034d0ab3efd7151",
  },
  {
    count: 136,
    suppressed: 0,
    sequence:
      "MTL201 MTL610 MTL606 MTL608 MTL606x2 MTL607 MTL610 MTL606 MTL607 MTL614x2 MTL606 MTL610 MTL603 MTL610 MTL606 MTL614 MTL606 MTL610x3 MTL606 MTL610 MTL606 MTL607 MTL614 MTL606 MTL610 MTL609 MTL610x2 MTL606 MTL607 MTL614x2 MTL606 MTL610x3 MTL606 MTL607 MTL614 MTL606 MTL610x2 MTL606 MTL607 MTL614 MTL606 MTL610 MTL608 MTL610 MTL606 MTL607 MTL614 MTL606 MTL610 MTL606 MTL607 MTL614 MTL606 MTL610 MTL614 MTL606 MTL610 MTL606 MTL607 MTL606 MTL610x2 MTL608 MTL610 MTL614 MTL606 MTL610x2 MTL612 MTL610 MTL606 MTL607 MTL614 MTL606 MTL610x2 MTL603 MTL612 MTL610 MTL606 MTL607 MTL614x2 MTL606 MTL610x2 MTL614 MTL606 MTL610x2 MTL606 MTL607 MTL614 MTL606 MTL610x2 MTL606 MTL607 MTL614 MTL606 MTL610x4 MTL604 MTL701x2 MTL616x20",
    head: [
      ["MTL201", "error", "Field 'title': required but empty or missing", null, null, 2],
      ["MTL610", "error", "Heading: Section 'Chapter 0': missing required heading 'Intro' (H3)", null, "Intro", 10],
      ["MTL606", "error", "Heading: Section 'Chapter 0': heading 'intro' does not match [pattern:\"Step {digits}\"] at 'Step '", null, "intro", 12],
      ["MTL608", "error", "Heading: Section 'Chapter 1': 3 heading(s) match [pattern:\"v{semver}\"], maximum is 2", null, "Release", 39],
    ],
    tail: [
      ["MTL616", "warning", "Heading: Section 'Chapter 49': 2 extra heading(s) at level H3 after the template headings: ['Extra', 'Wrap-up']", null, "Extra", 760],
      ["MTL616", "warning", "Heading: 1 extra heading(s) at level H2 after the template headings: ['Colophon']", null, "Colophon", 800],
    ],
    digest: "39d454acb798a07ee122888200d910a5",
  },
];

const WIDE_PIN: DiagnosticPin = {
  count: 102,
  suppressed: 0,
  sequence: "MTL611 MTL609 MTL611x6 MTL610x14 MTL606x9 MTL609x8 MTL614x13 MTL606x27 MTL614 MTL616x22",
  head: [
    ["MTL611", "error", "Heading: Section 'Guide': heading order mismatch: template order ['Prelude', 'Alpha', 'Beta', 'Gamma', 'Delta'] vs target order ['Alpha', 'B...", null, "Guide", 6],
    ["MTL609", "error", "Heading: heading 'Part 7' is not in ascending order after 'Part 119', 1 pair(s) out of order [order:first:number:ascending]", null, "Part 7", 2737],
    ["MTL611", "error", "Heading: Section 'Part 29': heading order mismatch: template order ['Prelude', 'Alpha', 'Beta', 'Gamma', 'Item', 'Owner'] vs target order ['...", null, "Part 29", 746],
    ["MTL611", "error", "Heading: Section 'Part 50': heading order mismatch: template order ['Prelude', 'Alpha', 'Beta', 'Gamma', 'Item', 'Owner'] vs target order ['...", null, "Part 50", 1218],
  ],
  tail: [
    ["MTL616", "warning", "Heading: Section 'Part 243': 1 extra heading(s) at level H3 after the template headings: ['Owner Kim']", null, "Owner Kim", 5471],
    ["MTL616", "warning", "Heading: 1 extra heading(s) at level H2 after the template headings: ['Release']", null, "Release", 5621],
  ],
  digest: "a8d2511c266ba78fe65a876c41eeb6df",
};

describe("L1: lintTarget on a 600-heading template and five generated targets", () => {
  let template: DocumentModel;
  beforeAll(async () => {
    template = await templateOf(bookTemplate());
  });

  it("the template has 600 sections over six levels", () => {
    expect(template.sections).toHaveLength(600);
    expect(new Set(template.sections.map((section) => section.level))).toEqual(new Set([1, 2, 3, 4, 5, 6]));
  });

  it.each([0, 1, 2, 3, 4])(
    "target of fault level %i: same diagnostics, same order, same suppressed count",
    async (level) => {
      const result = await lint(template, bookTarget(level, 1));
      expect(pinOf(result.diagnostics, result.suppressed)).toEqual(BOOK_PINS[level]);
      expect(errorsFirst(result.diagnostics)).toBe(true);
    },
    30_000,
  );

  it("the conforming target gives no diagnostic; a faulty one is reproducible (same text, same output)", async () => {
    expect(bookTarget(3, 1)).toBe(bookTarget(3, 1));
    expect(bookTarget(3, 1)).not.toBe(bookTarget(3, 2));
    const first = await lint(template, bookTarget(3, 1));
    const second = await lint(template, bookTarget(3, 1));
    expect(second.diagnostics.map(rowOf)).toEqual(first.diagnostics.map(rowOf));
  }, 30_000);

  it("directives remove only what they cover: disable-file MTL616 and MTL606 keep nothing of those codes", async () => {
    const two = await lint(template, bookTarget(2, 1));
    expect(two.diagnostics.some((diagnostic) => diagnostic.code === "MTL616")).toBe(false);
    expect(two.suppressed).toBe(2);
    const three = await lint(template, bookTarget(3, 1));
    expect(three.diagnostics.some((diagnostic) => diagnostic.code === "MTL606")).toBe(false);
    expect(three.suppressed).toBe(10);
  }, 30_000);
});

describe("L2: lintTarget on a 5308-heading target of 250 repeated parts", () => {
  let template: DocumentModel;
  let result: TargetResult;
  beforeAll(async () => {
    template = await templateOf(wideTemplate());
    result = await lint(template, wideTarget(250));
  }, 60_000);

  it("the target has 5308 sections", () => {
    const loaded = loadDocument(wideTarget(250));
    if (!loaded.ok) throw new Error("load failed");
    expect(loaded.model.sections).toHaveLength(5308);
  });

  it("same diagnostics, same order, nothing suppressed", () => {
    expect(pinOf(result.diagnostics, result.suppressed)).toEqual(WIDE_PIN);
    expect(errorsFirst(result.diagnostics)).toBe(true);
  });

  it("the 22 extra-heading warnings (MTL616) come last, after every error", () => {
    const codes = result.diagnostics.map((diagnostic) => diagnostic.code);
    expect(codes.slice(-22).every((code) => code === "MTL616")).toBe(true);
    expect(result.diagnostics.slice(-22).every((diagnostic) => diagnostic.severity === "warning")).toBe(true);
  });
});

describe("O1: MTL611 on the wide target", () => {
  let found: readonly Diagnostic[];
  beforeAll(async () => {
    const result = await lint(await templateOf(wideTemplate()), wideTarget(250));
    found = result.diagnostics.filter((diagnostic) => diagnostic.code === "MTL611");
  }, 60_000);

  it("one finding per faulty parent: the guide, then the parts in file order, with the target parent as heading and anchor", () => {
    expect(found.map((diagnostic) => [diagnostic.heading, anchorLineOf(diagnostic)])).toEqual([
      ["Guide", 6],
      ["Part 29", 746],
      ["Part 50", 1218],
      ["Part 94", 2164],
      ["Part 96", 2211],
      ["Part 124", 2827],
      ["Part 225", 5072],
    ]);
  });

  it("the messages name the template children (never the invalid-pattern one) and the target headings in file order", () => {
    expect(found.map((diagnostic) => diagnostic.message.length)).toEqual([765, 324, 291, 324, 344, 345, 325]);
    expect(found[0]?.message.startsWith("Heading: Section 'Guide': heading order mismatch: template order ['Prelude', 'Alpha', 'Beta', 'Gamma', 'Delta'] vs target order ['Alpha', 'Beta', 'Prelude', 'Gamma', 'Delta', 'Log 1', 'Log 2', 'Log 3'")).toBe(
      true,
    );
    expect(found[0]?.message.endsWith("'Log 59', 'Log 60']")).toBe(true);
    for (const diagnostic of found.slice(1)) {
      expect(diagnostic.message).toContain("template order ['Prelude', 'Alpha', 'Beta', ");
      expect(diagnostic.message).toContain("'Item', 'Owner'] vs target order ['Alpha', 'Beta', 'Prelude', ");
      expect(diagnostic.message).not.toContain("Oops");
    }
    expect(found.map((diagnostic) => digestOf(rowOf(diagnostic)))).toEqual([
      "1553250ee0885a592b12451a16282882",
      "fb9148f6b271cc255eae1d548e2122eb",
      "8004a585bd288e97aca860f7c48723a5",
      "50e1f3d18b96ea946728d90d55723f0d",
      "b0a363e869f0a503ee00cc7ffa05d108",
      "717f01e6731ff8eec29d2473c77b3697",
      "53420e9a753c0bc613a6ba9de1fe5c7e",
    ]);
  });
});

describe("O1: a repeat parent keeps one order result per instance (written out in full)", () => {
  const TEMPLATE = ["---", "title: x", "---", '## Release [pattern:"v{semver}"] [repeat-rules:same-level]', "#### Fix", "### Add", '### Bug [pattern:"{bogus}"]', ""].join("\n");
  // v1.0.0: `Add` before `Fix` (out of order). v0.9.0: in order. v0.8.0: out of order again.
  const TARGET = ["---", "title: x", "---", "## v1.0.0", "### Add", "#### Fix", "## v0.9.0", "#### Fix", "### Add", "## v0.8.0", "### Add", "#### Fix", ""].join("\n");

  it("reports v1.0.0 and v0.8.0, not v0.9.0; the invalid-pattern child is never listed", async () => {
    const result = await lint(await templateOf(TEMPLATE), TARGET);
    const found = result.diagnostics.filter((diagnostic) => diagnostic.code === "MTL611");
    expect(found.map((diagnostic) => [diagnostic.message, diagnostic.heading, anchorLineOf(diagnostic)])).toEqual([
      ["Heading: Section 'v1.0.0': heading order mismatch: template order ['Fix', 'Add'] vs target order ['Add', 'Fix']", "v1.0.0", 4],
      ["Heading: Section 'v0.8.0': heading order mismatch: template order ['Fix', 'Add'] vs target order ['Add', 'Fix']", "v0.8.0", 10],
    ]);
  });
});
