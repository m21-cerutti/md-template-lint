/**
 * MTL613 heading-unique-names (src/rules/heading.ts, docs/spec.md 2.11, 4.3, 4.4 DIR5 to DIR7,
 * 8.1). Under `[unique-headings-names]` (template-wide frontmatter line, or per heading for the
 * region of each match or instance) every later target heading whose text equals an earlier
 * one of a scope after `toLowerCase()` is one error, anchored on its own line, naming the line
 * of the earliest one. Full fixture list of 2.11 (phase A80d): worked examples 1 to 3 with their
 * variants, folding, regions, nesting, interplay with MTL601/MTL612/MTL615/MTL616, the inert
 * placements and the suppression forms. Expected values derived from the spec by hand.
 *
 * Each case lists the MTL613 findings (`expected`), every diagnostic left after suppression
 * (`all`, as [code, anchor line] in emission order) and the suppressed count. A `pass-` case
 * has no diagnostic at all; a `fail-` case has at least one (not always an MTL613: a block that
 * silences MTL613 while another code is still reported is a `fail-` case with `expected` empty).
 */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate, lintTarget } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { anchorLineOf, createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL613";
const DIR = "tests/fixtures/pairs/MTL613";

interface Expected {
  readonly message: string;
  /** Target anchor line (DIR5): the later duplicate. */
  readonly line: number;
  /** Spec 8.1: the text of the later duplicate. */
  readonly heading: string;
}

type Found = readonly [code: string, line: number | null];

interface Outcome {
  readonly expected: readonly Expected[];
  /** Every diagnostic left after suppression as [code, anchor line], in emission order. */
  readonly all: readonly Found[];
  /** Diagnostics removed by the disable directives of the target (DIR9). */
  readonly suppressed: number;
}

interface TestCase extends Outcome {
  readonly name: string;
}

/** Spec 4.3: `Heading: duplicate heading name '{text}' (first at line {line})`. */
const duplicate = (text: string, first: number, line: number): Expected => ({
  message: `Heading: duplicate heading name '${text}' (first at line ${first})`,
  line,
  heading: text,
});

/** An outcome whose only diagnostics are the MTL613 findings. */
const fail = (expected: readonly Expected[], suppressed = 0): Outcome => ({
  expected,
  all: expected.map((item) => [CODE, item.line] as const),
  suppressed,
});

/** An outcome with no diagnostic at all (pass-). */
const pass = (suppressed = 0): Outcome => ({ expected: [], all: [], suppressed });

/** Worked example 1 of 2.11 findings: line 13 names line 9, line 15 names line 7. */
const EXAMPLE_ONE = [duplicate("Steps", 9, 13), duplicate("setup", 7, 15)];
/** Worked example 2 of 2.11 with the template-wide switch: both lines name line 9. */
const EXAMPLE_TWO_WIDE = [duplicate("Notes", 9, 13), duplicate("NOTES", 9, 17)];
/** The MTL616 warning that still lists the second `### Added` of worked example 3. */
const EXTRA_ADDED: Found = ["MTL616", 17];
/** Worked example 3 with a duplicate release (line 13) and a switch above the instances. */
const RELEASES = [
  duplicate("[1.2.0] - 2026-03-01", 7, 13),
  duplicate("Added", 9, 15),
  duplicate("Added", 9, 17),
];

/** Case -> fixture dir (same name) -> expected findings. At least 1 pass- and 1 fail-. */
const CASES: readonly TestCase[] = [
  // Worked example 1 of 2.11: whole file; line 13 folds to `steps` (first line 9), line 15 to
  // `setup` (first line 7, another level).
  { name: "fail-template-wide-duplicate-at-another-level", ...fail(EXAMPLE_ONE) },
  // Worked example 1 without the switch: no finding.
  { name: "pass-no-switch-duplicates-allowed", ...pass() },
  // Worked example 2 of 2.11: region of `## Usage` (line 11) is lines 11 to 17; line 9 is
  // outside, so line 17 names line 13.
  {
    name: "fail-per-heading-duplicate-inside-the-region",
    ...fail([duplicate("NOTES", 13, 17)]),
  },
  // Worked example 2 without line 17: line 13 repeats line 9, outside the region.
  { name: "pass-per-heading-duplicate-outside-the-region-is-allowed", ...pass() },
  // Worked example 3 of 2.11: each release instance is its own region; line 17 repeats
  // line 15 inside the instance of line 13; line 15 against line 9 is another region. The
  // MTL616 warning still lists line 17 (additive principle).
  {
    name: "fail-repeat-instance-duplicate-group",
    expected: [duplicate("Added", 15, 17)],
    all: [[CODE, 17], EXTRA_ADDED],
    suppressed: 0,
  },
  // Folding (owner decision 2): `NOTES` and `Étape`/`ÉTAPE` equal after `toLowerCase()`; the
  // text in the message is the later heading as written, the first line is the earlier one.
  {
    name: "fail-template-wide-case-insensitive-duplicate",
    ...fail([duplicate("NOTES", 7, 9), duplicate("ÉTAPE", 11, 13)]),
  },
  // Folding keeps what `toLowerCase()` keeps: `Straße` is not `STRASSE`, `Notes` is not `Notes:`.
  { name: "pass-differs-after-folding", ...pass() },
  // Worked example 1 variant, H1 title: line 15 reads `### Guide`, no exemption for the H1.
  {
    name: "fail-template-wide-h1-title-repeated-as-h2",
    ...fail([duplicate("Steps", 9, 13), duplicate("Guide", 5, 15)]),
  },
  // Three headings `Notes` give two findings, both naming the first line, texts as written.
  {
    name: "fail-three-duplicates-give-two-findings-naming-the-first",
    ...fail([duplicate("notes", 7, 9), duplicate("NOTES", 7, 11)]),
  },
  // The region contains the tagged heading itself (line 7): `### usage` (line 9) repeats it.
  {
    name: "fail-per-heading-region-includes-the-tagged-heading",
    ...fail([duplicate("usage", 7, 9)]),
  },
  // Nested regions (`# Guide` lines 5 to end, `## Setup` lines 9 to end): lines 11 and 13 are in
  // both; the outermost scope holds `Notes` on line 7, so both name line 7 (not 11), one each.
  {
    name: "fail-nested-tagged-regions-give-one-finding-naming-the-outermost-first",
    ...fail([duplicate("Notes", 7, 11), duplicate("notes", 7, 13)]),
  },
  // Worked example 3 variant, template-wide: every repeated group is a duplicate; the MTL616
  // warning for line 17 is unchanged.
  {
    name: "fail-template-wide-reports-repeated-groups",
    expected: [duplicate("Added", 9, 15), duplicate("Added", 9, 17)],
    all: [[CODE, 15], [CODE, 17], EXTRA_ADDED],
    suppressed: 0,
  },
  // Worked example 3 variant, no-extra: line 17 gets MTL615 (which replaces its MTL616) and
  // MTL613; MTL615 first, MTL613 comes last in step 5.
  {
    name: "fail-duplicate-also-gets-mtl615-under-no-extra",
    expected: [duplicate("Added", 15, 17)],
    all: [
      ["MTL615", 17],
      [CODE, 17],
    ],
    suppressed: 0,
  },
  // `Extra` (line 11) and `extra` (line 13) are not in the template: MTL612 on both, and the
  // second also repeats the first: MTL613. Independent codes, both reported.
  {
    name: "fail-duplicate-also-gets-mtl612-under-disallow",
    expected: [duplicate("extra", 11, 13)],
    all: [
      ["MTL612", 11],
      ["MTL612", 13],
      [CODE, 13],
    ],
    suppressed: 0,
  },
  // Pattern headings: the stored TARGET texts are compared, `Step 1` and `step 1` are equal.
  { name: "fail-pattern-instances-with-the-same-text", ...fail([duplicate("step 1", 7, 9)]) },
  // Worked example 3 without line 17: no duplicate in any instance.
  { name: "pass-repeat-instances-each-their-own-region", ...pass() },
  // No Unicode normalization: line 7 is NFC `Étape`, line 9 the NFD spelling of the same text
  // (the test decomposes it, see `DECOMPOSED`): the folded texts differ.
  { name: "pass-nfc-and-nfd-spellings-differ", ...pass() },
  // Headings inside fenced code are not headings (2.6) and never take part.
  { name: "pass-heading-in-fenced-code-is-not-compared", ...pass() },
  // An absent optional tagged heading has no match, so no region.
  { name: "pass-absent-optional-tagged-heading-has-no-effect", ...pass() },
  // A template-only tagged heading has no effect (MTL015 is a template warning only).
  { name: "pass-template-only-tagged-heading-has-no-effect", ...pass() },
  // The tag after a frontmatter key is inert (as the filename tag on a key line, 2.5).
  { name: "pass-tag-on-a-key-line-is-inert", ...pass() },
  // A mixed comment line (`# note [unique-headings-names]`) is inert: only a line holding the
  // tag alone is the switch.
  { name: "pass-mixed-comment-line-is-inert", ...pass() },
  // Worked example 2 variant, template-wide switch instead: lines 13 and 17 name line 9.
  {
    name: "fail-template-wide-reports-both-duplicates-of-the-region-example",
    ...fail(EXAMPLE_TWO_WIDE),
  },
  // Both switches together: the findings are those of the template-wide switch alone.
  {
    name: "fail-both-switches-give-the-findings-of-the-template-wide-one",
    ...fail(EXAMPLE_TWO_WIDE),
  },
  // Worked example 2 variant, the tagged heading is missing: no match, no region, MTL601 only.
  {
    name: "fail-per-heading-missing-tagged-heading-gives-only-mtl601",
    expected: [],
    all: [["MTL601", null]],
    suppressed: 0,
  },
  // Known limit of worked example 3: with the tag on `## Release` only, a duplicate release
  // text (line 13) lies in another region and is not reported; line 17 still names line 15.
  {
    name: "fail-duplicate-release-only-per-heading-switch-reports-inside-one-region",
    expected: [duplicate("Added", 15, 17)],
    all: [[CODE, 17], EXTRA_ADDED],
    suppressed: 0,
  },
  // Worked example 3 variant, template-wide with a duplicate release: line 13 names line 7;
  // the groups of the later release name the earlier ones (line 9).
  {
    name: "fail-template-wide-duplicate-release-takes-the-earliest-line",
    expected: RELEASES,
    all: [[CODE, 13], [CODE, 15], [CODE, 17], EXTRA_ADDED],
    suppressed: 0,
  },
  // Earliest-line merge across scopes: `# Changelog` and `## Release` both tagged. Line 17
  // is a duplicate in its instance region (first line 15) and in the parent region (first
  // line 9): one finding, the earliest line (9) wins. Line 13 is reported by the parent only.
  {
    name: "fail-parent-tag-merges-the-region-of-each-release-into-the-earliest-line",
    expected: RELEASES,
    all: [[CODE, 13], [CODE, 15], [CODE, 17], EXTRA_ADDED],
    suppressed: 0,
  },
  // Suppression (4.4 DIR6): `disable-line` on the later duplicate removes its finding.
  { name: "pass-disable-line-on-the-later-duplicate", ...pass(1) },
  // `disable-next-line` on the line before the later duplicate.
  { name: "pass-disable-next-line-on-the-later-duplicate", ...pass(1) },
  // A `begin disable` / `end disable` block over two later duplicates (lines 11 and 13).
  { name: "pass-begin-end-block-covers-several-duplicates", ...pass(2) },
  // `disable-file MTL613` silences every duplicate (lines 9 and 11).
  { name: "pass-disable-file-silences-every-duplicate", ...pass(2) },
  // The block silences MTL613 on line 13 (suppressed 1); the MTL612 of lines 11 and 13 stay.
  {
    name: "fail-block-silences-mtl613-but-another-code-is-still-reported",
    expected: [],
    all: [
      ["MTL612", 11],
      ["MTL612", 13],
    ],
    suppressed: 1,
  },
  // A directive on the FIRST heading removes nothing (the first heading has no MTL613).
  {
    name: "fail-disable-line-on-the-first-heading-removes-nothing",
    ...fail([duplicate("NOTES", 7, 9)]),
  },
  // Worked example 1 variant, suppression: line 13 is suppressed but still counts as an
  // occurrence, so the added `### Steps` on line 17 names line 9, not line 13.
  {
    name: "fail-suppressed-later-duplicate-still-counts-as-an-occurrence",
    ...fail([duplicate("setup", 7, 15), duplicate("Steps", 9, 17)], 1),
  },
  // Placement table of 2.11: `# [unique-headings-names]` in the template BODY is an H1 with
  // EMPTY text (not the switch): every run reports `Missing required heading: ''`. The target
  // H1 `Guide` is not reported as an extra: MTL616 is silent for a run whose template headings
  // all have empty text (spec 2.10 step 4). No MTL613: nothing is switched on.
  {
    name: "fail-template-body-switch-line-is-an-empty-h1-heading",
    expected: [],
    all: [["MTL601", null]],
    suppressed: 0,
  },
];

const read = (path: string): string =>
  readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

/**
 * Cases whose target holds one line stored precomposed (NFC) that the test decomposes (NFD)
 * before the lint, since a fixture file cannot be relied on to keep a combining sequence:
 * case -> 1-based line.
 */
const DECOMPOSED: Readonly<Record<string, number>> = {
  "pass-nfc-and-nfd-spellings-differ": 9,
};

/** The target text of a fixture, with the line of `DECOMPOSED` (if any) in NFD. */
function targetOf(name: string): string {
  const text = read(`${DIR}/${name}/target.md`);
  const line = DECOMPOSED[name];
  if (line === undefined) return text;
  return text
    .split("\n")
    .map((row, index) => (index === line - 1 ? row.normalize("NFD") : row))
    .join("\n");
}

/** The target of a fixture, linted: diagnostics after suppression, and the suppressed count. */
async function lintResult(name: string) {
  const status = await checkTemplate(registry, read(`${DIR}/${name}/template.md`));
  if (status.status !== "ok") throw new Error("template is broken");
  return lintTarget(registry, status.model, targetOf(name), "target.md", createEnv());
}

/** Every diagnostic (after suppression) for the pair of a fixture folder. */
async function lintAll(name: string) {
  return (await lintResult(name)).diagnostics;
}

describe("MTL613 heading-unique-names", () => {
  it("is registered in category heading, error, target step headings", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "heading-unique-names",
      category: "heading",
      severity: "error",
      phase: "target",
      step: "headings",
    });
  });

  it("is the last heading rule (no template anchor: emitted after MTL604, spec 2.11)", () => {
    const heading = registry.rules.filter((rule) => rule.category === "heading");
    expect(heading.at(-1)?.code).toBe(CODE);
  });

  it("has at least 1 pass- case and at least 1 fail- case, one fixture dir each", () => {
    const passes = CASES.filter((testCase) => testCase.name.startsWith("pass-"));
    const fails = CASES.filter((testCase) => testCase.name.startsWith("fail-"));
    expect(passes.length).toBeGreaterThanOrEqual(1);
    expect(fails.length).toBeGreaterThanOrEqual(1);
    expect(passes.length + fails.length).toBe(CASES.length);
    // A pass- case has no diagnostic left at all; a fail- case has at least one.
    expect(CASES.filter((testCase) => testCase.all.length === 0)).toEqual(passes);
    const dirs = readdirSync(fileURLToPath(new URL(`../../../${DIR}`, import.meta.url))).sort();
    expect(dirs).toEqual(CASES.map((testCase) => testCase.name).sort());
  });

  it("the MTL613 lines of `all` are the lines of `expected`, in the same order", () => {
    for (const testCase of CASES) {
      const lines = testCase.all.filter(([code]) => code === CODE).map(([, line]) => line);
      expect(lines, testCase.name).toEqual(testCase.expected.map((item) => item.line));
    }
  });

  for (const testCase of CASES) {
    it(`${testCase.name}: ${DIR}/${testCase.name}`, async () => {
      const result = await lintResult(testCase.name);
      const found = result.diagnostics.filter((diagnostic) => diagnostic.code === CODE);
      expect(
        found.map((diagnostic) => ({
          message: diagnostic.message,
          line: anchorLineOf(diagnostic),
          heading: diagnostic.heading,
        })),
      ).toEqual(testCase.expected);
      for (const diagnostic of found) {
        expect(diagnostic.severity).toBe("error");
        // The template-line sort key is cleared (the anchor is internal, spec 8.1).
        expect(diagnostic.position).toBeNull();
      }
      expect(
        result.diagnostics.map((diagnostic) => [diagnostic.code, anchorLineOf(diagnostic)]),
      ).toEqual(testCase.all);
      expect(result.suppressed).toBe(testCase.suppressed);
    });
  }

  it("the NFC/NFD case holds two spellings of one text that differ in code units", () => {
    const rows = targetOf("pass-nfc-and-nfd-spellings-differ").split("\n");
    const [nfc, nfd] = [rows[6] ?? "", rows[8] ?? ""];
    expect(nfd).not.toBe(nfc);
    expect(nfd.length).toBeGreaterThan(nfc.length);
    expect(nfd.normalize("NFC")).toBe(nfc.normalize("NFC"));
  });

  it("worked example 3: MTL613 on line 17, then the MTL616 warning that still lists it", async () => {
    const found = await lintAll("fail-repeat-instance-duplicate-group");
    expect(found.map((diagnostic) => [diagnostic.code, anchorLineOf(diagnostic)])).toEqual([
      [CODE, 17],
      ["MTL616", 17],
    ]);
    expect(found[1]?.message).toBe(
      "Heading: Section '[1.1.0] - 2026-02-01': 1 extra heading(s) at level H3 after the " +
        "template headings: ['Added']",
    );
  });

  it("worked example 3 with no-extra: MTL615 comes first, MTL613 last, no MTL616", async () => {
    const found = await lintAll("fail-duplicate-also-gets-mtl615-under-no-extra");
    expect(found.map((diagnostic) => diagnostic.severity)).toEqual(["error", "error"]);
    expect(found.map((diagnostic) => diagnostic.code)).toEqual(["MTL615", CODE]);
    expect(found[0]?.message).toBe(
      "Heading: Section '[1.1.0] - 2026-02-01': heading 'Added' at level H3 is not declared at " +
        "this position [content:subheadings:no-extra]",
    );
  });

  it("MTL613 is emitted after every other heading error (spec 2.11 emission order)", async () => {
    const name = "fail-duplicate-also-gets-mtl612-under-disallow";
    const status = await checkTemplate(registry, read(`${DIR}/${name}/template.md`));
    if (status.status !== "ok") throw new Error("template is broken");
    const all = await checkTarget(
      registry,
      status.model,
      read(`${DIR}/${name}/target.md`),
      "target.md",
      createEnv(),
    );
    expect(all.map((diagnostic) => diagnostic.code)).toEqual(["MTL612", "MTL612", CODE]);
  });

  it("a missing tagged heading reports only the missing heading, by name", async () => {
    const found = await lintAll("fail-per-heading-missing-tagged-heading-gives-only-mtl601");
    expect(found.map((diagnostic) => diagnostic.message)).toEqual([
      "Heading: Missing required heading: 'Usage'",
    ]);
  });

  it("`# [unique-headings-names]` in the template body is a required H1 with empty text", async () => {
    const found = await lintAll("fail-template-body-switch-line-is-an-empty-h1-heading");
    expect(found.map((diagnostic) => diagnostic.message)).toEqual([
      "Heading: Missing required heading: ''",
    ]);
    // An empty-text template heading gets no MTL616 (spec 2.10 step 4).
    expect(found.map((diagnostic) => diagnostic.code)).not.toContain("MTL616");
  });
});
