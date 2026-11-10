/**
 * Regression fixtures of the POSITIONAL heading match (docs/spec.md 2.6 "Match of T", 2.10
 * "Positional match", ADR 0012, phase Pm): the worked examples of 2.6 (the exact-level guide
 * and the `[content:subheadings:disallow]` changelog, with their variants) and the exact-text
 * parts of the owner examples B, C, E, H and I of 2.10 worked example 4, plus the run rules
 * they rest on (an extra between template headings shifts the run, an extra after the last
 * position is allowed, template-only copies are set aside, a section-scope run is per parent).
 * Fixtures: `tests/fixtures/positional/<case>/{template.md,target.md}`.
 *
 * The cases B, C, E and H with a REQUIRED `[pattern:"{text}"]` heading for the pattern position
 * (migrated from the dropped `exist` presence tag, spec 2.6 "Dropped tag"): the position
 * takes the next sibling whatever its (not purely numeric) text (2.10 step 3c). Phase P4 adds the pattern forms of the owner examples B, C, G and H (a
 * matching sibling is always taken, also by a repeat run) and the repeat INSTANCES (2.10 step
 * 3d2, "Repeat rules": section-scope children, content tags and the disallow tag per instance,
 * the first instance in the order list, MTL605 at zero instances); owner examples A, E and F
 * are MTL606 fixtures (tests/fixtures/pairs/MTL606/). Owner example G with a tail sibling
 * (`MTL614`) is a later phase. The warnings of the spec outputs (`MTL616`, a later phase) are
 * not asserted: only the ERRORS and their exact messages are, the `MTL601` "found later" hint
 * (phase P7g, owner example I) included. Phase Pf adds the placeholder FORMAT cases (`007`
 * under `padding:3` and `{number}`, explicit default format names, a formatted repeat).
 */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../src/engine/pipeline.js";
import { createRegistry } from "../../src/engine/registry.js";
import { anchorLineOf, createEnv } from "../../src/engine/rule.js";

const registry = createRegistry();
const DIR = "tests/fixtures/positional";

interface Finding {
  readonly code: string;
  readonly message: string;
  /** Target anchor line (spec 4.4 DIR5); null: no anchor. */
  readonly anchor: number | null;
}

interface TestCase {
  readonly name: string;
  readonly expected: readonly Finding[];
}

const unlisted = (parent: string, text: string, level: number, anchor: number): Finding => ({
  code: "MTL612",
  message: `Heading: Section '${parent}': heading '${text}' at level H${level} ` + "is not in the template [content:subheadings:disallow]",
  anchor,
});

const missing = (text: string): Finding => ({
  code: "MTL601",
  message: `Heading: Missing required heading: '${text}'`,
  anchor: null,
});

/** `MTL601` with the "found later" hint (spec 2.10 step 3b, 4.3; owner decision 6 of A72l). */
const missingLater = (text: string, line: number): Finding => ({
  code: "MTL601",
  message: `Heading: Missing required heading: '${text}' (found later at line ${line}, out of order)`,
  anchor: null,
});

const CASES: readonly TestCase[] = [
  // Spec 2.6 worked example 1: `# Context` is level 1, the level-2 run has no sibling, so
  // `## Context` is missing and `### Decision` (parent without match) is not checked. No MTL604
  // (`Context` has no match), no MTL610. The extra `# Context` gives MTL616 (a later phase).
  { name: "fail-spec-guide-h1-context-against-h2-template", expected: [missing("Context")] },
  {
    // Variant: `## Context` takes line 7, the level-3 run has no sibling (`#### Decision`).
    name: "fail-spec-guide-variant-h4-decision-in-h3-position",
    expected: [
      {
        code: "MTL610",
        message: "Heading: Section 'Context': missing required heading 'Decision' (H3)",
        anchor: 7,
      },
    ],
  },
  // Spec 2.6 worked example 2: `Details` (line 13, topmost under the listed `Added`) and `Misc`
  // (line 17) are unlisted; `Sub` (its ancestor `Misc` is unlisted) is not reported; `## Fixed`
  // is outside the region. `Added` (line 9) matches and its list is checked: no finding.
  {
    name: "fail-spec-changelog-disallow",
    expected: [unlisted("Unreleased", "Details", 4, 13), unlisted("Unreleased", "Misc", 3, 17)],
  },
  {
    // Variant: line 9 reads `#### Added`, level 4, so it is not listed (and not the match of
    // `### Added`): three errors, lines 9, 13, 17.
    name: "fail-spec-changelog-added-at-level-four-variant",
    expected: [unlisted("Unreleased", "Added", 4, 9), unlisted("Unreleased", "Details", 4, 13), unlisted("Unreleased", "Misc", 3, 17)],
  },
  // Variant: no tag, no error (the spec output has the two MTL616 warnings, a later phase).
  { name: "pass-spec-changelog-without-the-disallow-tag", expected: [] },
  // Owner example B (exact-text part, a required `{text}` for the pattern position): the
  // pattern position takes line 5 (a sibling that matches the position is always taken); the
  // literal `toto` has no sibling left.
  {
    name: "fail-owner-b-earlier-required-pattern-position-takes-the-sibling",
    expected: [missing("toto")],
  },
  // Owner example C: the same with an optional literal: no finding.
  { name: "pass-owner-c-optional-literal-with-no-sibling-left", expected: [] },
  // Owner example E: the literal `Unreleased` does not match line 5 and takes nothing (it never
  // takes a heading it does not match); the `{text}` position runs on from line 5.
  {
    name: "fail-owner-e-literal-position-does-not-take-another-sibling",
    expected: [missing("Unreleased")],
  },
  // Owner example H, SMOKE only (passes under first-match too): the `{text}` position takes
  // `Intro`, the optional literal `Notes` takes the next sibling.
  { name: "pass-owner-h-smoke-later-literal-after-an-earlier-position", expected: [] },
  // Owner example H, the discriminating case: the `{text}` position meets the text of the LATER
  // literal `Beta` first (line 5) and takes it; `Alpha` takes line 7; the optional `Beta` has no
  // sibling left. A later exact-text heading does not take a sibling from an earlier position
  // (spec 2.10 "Consequences"). Under first-match `Beta` would match line 5 again, after `Alpha`
  // in the template order list [Any 0, Alpha 1, Beta 0]: an MTL604 error.
  {
    name: "pass-owner-h-required-pattern-position-meets-the-later-literal-text-first",
    expected: [],
  },
  // Owner example I (with the "found later" hint, phase P7g): a swapped pair is a missing
  // heading, never an order error (no MTL604); `Alpha` is found later at line 7.
  {
    name: "fail-owner-i-swapped-pair-is-missing-not-order",
    expected: [missingLater("Alpha", 7)],
  },
  {
    // Spec 2.6 "Extra": A takes line 5; B and C look at the extra `X` (line 7): both missing,
    // although they are present later (the run has no gaps and never goes back). From the
    // cursor (line 7) onward, B is at line 9 and C at line 11: both get the hint (2.10 3b).
    name: "fail-extra-between-template-headings-shifts-the-run",
    expected: [missingLater("B", 9), missingLater("C", 11)],
  },
  // Spec 2.6 "Extra": siblings after the last position are extra, allowed (MTL616 is a warning).
  { name: "pass-extra-after-the-last-position-is-allowed", expected: [] },
  {
    // Spec 2.10 step 1: every `## T` is set aside, the first gets MTL603; the run A, B is not
    // shifted by them.
    name: "fail-template-only-copies-are-set-aside-and-do-not-shift-the-run",
    expected: [
      {
        code: "MTL603",
        message: "Heading: Heading 'T' is marked [presence:template-only] " + "and must not appear in the linted file",
        anchor: 7,
      },
    ],
  },
  {
    // Spec 2.6 "Siblings"/"Sequence": a section-scope run is per parent. `### X` of `## P`
    // takes line 9; `### X` of `## Q` walks the siblings of Q only (`### Y`): missing.
    name: "fail-section-scope-run-is-per-parent-not-shared",
    expected: [
      {
        code: "MTL610",
        message: "Heading: Section 'Q': missing required heading 'X' (H3)",
        anchor: 11,
      },
    ],
  },
  // Owner example B (2.10 worked example 4): the optional `{text}` position matches line 5 and
  // takes it (a matching sibling is always taken); the literal `toto` has no sibling left.
  {
    name: "fail-owner-b-pattern-position-takes-the-matching-sibling",
    expected: [missing("toto")],
  },
  // Owner example C: `{text}` takes line 5; the optional `toto` has no sibling left.
  { name: "pass-owner-c-pattern-position-then-optional-literal", expected: [] },
  // Owner example G: the repeat takes `1.2.0` and `1.1.0`; the optional `Hotfix` takes nothing.
  { name: "pass-owner-g-repeat-takes-both-optional-pattern-takes-nothing", expected: [] },
  // Owner example G: `1.1.1-hotfix` is a SEMVER (pre-release `hotfix`): an instance.
  { name: "pass-owner-g-prerelease-semver-is-an-instance", expected: [] },
  // Owner example G, required `Hotfix`: the repeat takes both siblings, none is left for
  // `Hotfix`: MTL605 (no MTL606: without the run `Hotfix` would meet `1.1.0`).
  {
    name: "fail-owner-g-variant-required-pattern-after-the-repeat-has-no-sibling",
    expected: [
      {
        code: "MTL605",
        message: 'Heading: missing required heading matching [pattern:"hotfix {semver}"] (H2)',
        anchor: null,
      },
    ],
  },
  // Owner example H: `Notes` is a `{text}` value, the repeat takes both lines; the optional
  // `Notes` has no sibling left.
  { name: "pass-owner-h-repeat-takes-the-later-literal-text", expected: [] },
  // Owner example H with a required `Notes`: the repeat still takes line 7, so `Notes` is
  // missing (an exact-text heading later in the template does not take it away).
  {
    name: "fail-owner-h-variant-required-literal-after-the-repeat-is-missing",
    expected: [missing("Notes")],
  },
  // Spec 2.10 "Repeat rules": the children of a repeat heading are checked once per instance,
  // in the section of that instance; MTL610 names the instance and anchors on its line (11).
  {
    name: "fail-repeat-instances-each-check-their-children-mtl610",
    expected: [
      {
        code: "MTL610",
        message: "Heading: Section '[1.1.0] - 2026-02-01': missing required heading 'Added' (H3)",
        anchor: 11,
      },
    ],
  },
  // Worked example 1 of 2.10 without the order tag and the tail: `### Added` of the instance
  // line 15 has no list item: MTL703 with `{parent}` the instance text, on line 17.
  {
    name: "fail-repeat-instances-each-check-their-content-mtl703",
    expected: [
      {
        code: "MTL703",
        message: "Section '[1.0.0] - 2026-01-10 > Added': [content:list] no markdown list item found",
        anchor: 17,
      },
    ],
  },
  // `[content:subheadings:disallow]` on a repeat heading applies inside every instance (2.10
  // "Interplay"): `#### Deep` under the first, `### Misc` under the second, each named by its
  // instance.
  {
    name: "fail-repeat-instances-each-check-disallow-mtl612",
    expected: [unlisted("[1.2.0] - 2026-03-01", "Deep", 4, 11), unlisted("[1.1.0] - 2026-02-01", "Misc", 3, 15)],
  },
  // Step 3d3: zero instances of a required repeat heading, nothing taken by step 3d1: MTL605.
  {
    name: "fail-required-repeat-with-zero-instances-is-mtl605",
    expected: [
      {
        code: "MTL605",
        message: 'Heading: missing required heading matching [pattern:"[{semver}] - {date}"] (H2)',
        anchor: null,
      },
    ],
  },
  // A literal repeat position (no placeholder) never takes a mismatch: zero instances, MTL605.
  {
    name: "fail-literal-repeat-whose-next-sibling-differs-is-mtl605",
    expected: [
      {
        code: "MTL605",
        message: 'Heading: missing required heading matching [pattern:"Notes"] (H2)',
        anchor: null,
      },
    ],
  },
  // An optional repeat heading with zero instances: no finding (its minimum is 0).
  { name: "pass-optional-repeat-with-zero-instances", expected: [] },
  // Phase Pf (spec 2.10 "Each format"): `007` is a `padding:3` value (exactly 3 digits) and a
  // `{number}` default value (leading zeros allowed, A72n): both positions take their sibling.
  { name: "pass-pf-007-under-padding-3-and-under-number", expected: [] },
  // The default format names written explicitly (`human`, `decimal`, `full`) equal no format.
  { name: "pass-pf-explicit-default-format-names-equal-no-format", expected: [] },
  // `{number:format:decimal}` rejects `1e5` as `{number}` does: a mismatch at the placeholder.
  {
    name: "fail-pf-explicit-default-name-rejects-like-no-format",
    expected: [
      {
        code: "MTL606",
        message: "Heading: heading '1e5' does not match [pattern:\"{number:format:decimal}\"] " + "at {number:format:decimal}",
        anchor: 5,
      },
    ],
  },
  // A formatted repeat heading: the run takes every `Item NNN` sibling.
  { name: "pass-pf-formatted-repeat-takes-every-padded-instance", expected: [] },
  // FAILING PIECE example of 2.10: `Item 7` against `Item {digits:format:padding:3}` fails at
  // the placeholder; the required repeat takes it as a mismatch (step 3d1), the run then takes
  // `Item 042` (line 7).
  {
    name: "fail-pf-formatted-repeat-lead-mismatch-item-7",
    expected: [
      {
        code: "MTL606",
        message: "Heading: heading 'Item 7' does not match " + '[pattern:"Item {digits:format:padding:3}"] at {digits:format:padding:3}',
        anchor: 5,
      },
    ],
  },
  // The first instance is the match of T for MTL604: `R` is listed once, by line 5, which
  // comes before `# Top` (line 7).
  {
    name: "fail-repeat-heading-counts-once-in-the-order-list",
    expected: [
      {
        code: "MTL604",
        message: "Heading: Heading order mismatch: template order ['Top', 'R'] " + "vs target order ['v1.0.0', 'Top', 'v2.0.0']",
        anchor: null,
      },
    ],
  },
];

const read = (path: string): string => readFileSync(fileURLToPath(new URL(`../../${path}`, import.meta.url)), "utf8");

/** The error findings (warnings are a later phase's MTL616) for the pair of a case folder. */
async function lintErrors(name: string): Promise<Finding[]> {
  const fixture = `${DIR}/${name}`;
  const status = await checkTemplate(registry, read(`${fixture}/template.md`));
  if (status.status !== "ok") throw new Error(`${fixture}: template is broken`);
  expect(status.warnings).toEqual([]);
  const found = await checkTarget(registry, status.model, read(`${fixture}/target.md`), `${fixture}/target.md`, createEnv());
  return found
    .filter((diagnostic) => diagnostic.severity === "error")
    .map((diagnostic) => ({
      code: diagnostic.code,
      message: diagnostic.message,
      anchor: anchorLineOf(diagnostic),
    }));
}

describe("positional heading match: spec 2.6 worked examples and owner examples", () => {
  it("has at least 1 pass- case and 1 fail- case, one fixture dir each", () => {
    const passing = CASES.filter((testCase) => testCase.name.startsWith("pass-"));
    const failing = CASES.filter((testCase) => testCase.name.startsWith("fail-"));
    expect(passing.length).toBeGreaterThanOrEqual(1);
    expect(failing.length).toBeGreaterThanOrEqual(1);
    expect(passing.length + failing.length).toBe(CASES.length);
    expect(CASES.filter((testCase) => testCase.expected.length === 0)).toEqual(passing);
    const dirs = readdirSync(fileURLToPath(new URL(`../../${DIR}`, import.meta.url))).sort();
    expect(dirs).toEqual(CASES.map((testCase) => testCase.name).sort());
  });

  for (const testCase of CASES) {
    it(`${testCase.name}: ${DIR}/${testCase.name}`, async () => {
      expect(await lintErrors(testCase.name)).toEqual(testCase.expected);
    });
  }

  it("the content tags of a repeat heading read each instance, anchored on it", async () => {
    // Instances on lines 7, 11 and 13; only line 7 has a body. The pattern-heading label of
    // 2.6 is phase Pl, so only the codes and anchors are asserted here.
    const head = "---\ntitle: x\n---\n\n";
    const status = await checkTemplate(registry, `${head}# C\n\n## Release [pattern:"v{semver}"] [repeat-rules:same-level] [content:non-empty]\n`);
    if (status.status !== "ok") throw new Error("template is broken");
    const target = `${head}# C\n\n## v1.2.0\n\nText.\n\n## v1.1.0\n\n## v1.0.0\n`;
    const found = await checkTarget(registry, status.model, target, "a.md", createEnv());
    expect(found.map((diagnostic) => [diagnostic.code, anchorLineOf(diagnostic)])).toEqual([
      ["MTL701", 11],
      ["MTL701", 13],
    ]);
  });
});
