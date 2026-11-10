/**
 * MTL606 heading-pattern-mismatch (src/rules/heading.ts, docs/spec.md 2.10 steps 3c and 3d1,
 * "FAILING PIECE", "Consequences", 4.3, 4.4 DIR5 to DIR7, 8.1). A REQUIRED PLACEHOLDER position
 * whose next sibling does not match takes that sibling as a MISMATCH: one error on it, anchored
 * on its line, `{piece}` the failing piece. Only when a sibling is left (else MTL605). The
 * mismatch is not a match: no content, sub-heading or section-scope check under it, not in the
 * order lists, never also MTL612. Every expected value is derived from the spec by hand.
 */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate, lintTarget } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { anchorLineOf, createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL606";
const DIR = "tests/fixtures/pairs/MTL606";

interface Expected {
  readonly message: string;
  /** Target anchor line (DIR5): the line of the mismatched sibling. */
  readonly line: number;
  /** Spec 8.1: the text of the reported target heading. */
  readonly heading: string;
}

interface TestCase {
  readonly name: string;
  readonly expected: readonly Expected[];
}

const mismatch = (
  text: string,
  pattern: string,
  piece: string,
  line: number,
  parent: string | null = null,
): Expected => ({
  message:
    `Heading: ${parent === null ? "" : `Section '${parent}': `}heading '${text}' does not match ` +
    `[pattern:"${pattern}"] at ${piece}`,
  line,
  heading: text,
});

const NOTES_AT_V = (line: number): Expected => mismatch("Notes", "v{semver}", "'v'", line);

/** Case -> fixture dir (same name) -> expected MTL606 findings. At least 1 pass- and 1 fail-. */
const CASES: readonly TestCase[] = [
  // Owner example A (2.10 worked example 4): `1` is purely numeric, not a `{text}` value: taken
  // as a mismatch; the cursor moves, so position 2 (`{number}`) meets `tata`: a second mismatch.
  {
    name: "fail-owner-example-a-both-positions-take-a-mismatch",
    expected: [mismatch("1", "{text}", "{text}", 5), mismatch("tata", "{number}", "{number}", 7)],
  },
  // Owner example E, second target: the required repeat position fails at `{semver}` on line 5
  // (step 3d1 takes it), then the run takes line 7. `Unreleased` is MTL601 (asserted below).
  {
    name: "fail-owner-example-e-repeat-lead-mismatch-then-run",
    expected: [mismatch("1.2 - 2026-10-01", "{semver} - {date}", "{semver}", 5)],
  },
  // Owner example F with a full SemVer (the default-format variant): the heading matches.
  { name: "pass-owner-example-f-full-semver-matches", expected: [] },
  // Owner example F (phase Pf): `1.2` is a `major-minor` value, `2026-10-01` an ISO DATE.
  { name: "pass-owner-example-f-major-minor-matches", expected: [] },
  // Owner example F, second target: the prefix `1.2` is a `major-minor` value, but `.0` does
  // not start with ' - ', so the failing piece is the literal; line 5.
  {
    name: "fail-owner-example-f-major-minor-fails-at-the-literal",
    expected: [mismatch("1.2.0 - 2026-10-01", "{semver:format:major-minor} - {date}", "' - '", 5)],
  },
  // Phase Pf, each non-default format of the 2.10 table at its own required position, the
  // target sibling an ACCEPTED value of the 2.10 list: every position takes its match.
  { name: "pass-pf-every-format-accepts-a-listed-value", expected: [] },
  // The same positions, each sibling a REJECTED value of the 2.10 list: each required
  // placeholder position takes its sibling as a mismatch (step 3c), so the cursor moves on and
  // each line gets one MTL606 at its placeholder (lines 5 to 35).
  {
    name: "fail-pf-every-format-rejects-a-listed-value",
    expected: [
      ["My_heading", "{text:format:snakecase}"],
      ["MyHeading", "{text:format:camelcase}"],
      ["My_Heading", "{text:format:screamcase}"],
      ["my--heading", "{text:format:kebabcase}"],
      ["Release notes", "{text:format:lowercase}"],
      ["Release", "{text:format:uppercase}"],
      ["1e5.0", "{number:format:scientific}"],
      ["1.500", "{number:format:precision:2}"],
      ["+07", "{digits:format:signed}"],
      ["0x1f", "{digits:format:hex}"],
      ["U-42", "{digits:format:uid}"],
      ["1234", "{digits:format:padding:3}"],
      ["1.2.0-rc.1", "{semver:format:core}"],
      ["1.2.0", "{semver:format:major-minor}"],
      ["2026-13", "{date:format:year-month}"],
      ["0000", "{date:format:year}"],
    ].map(([text = "", holder = ""], index) => mismatch(text, holder, holder, 5 + 2 * index)),
  },
  // `## 2026` is refused by `{text:format:snakecase}`: a case format needs a letter (A72n).
  {
    name: "fail-pf-2026-is-no-snakecase-value",
    expected: [mismatch("2026", "{text:format:snakecase}", "{text:format:snakecase}", 5)],
  },
  // Owner example F with a full SemVer: the prefix `1.2.0` is a SEMVER but `.1` does not start
  // with ' - ', so the failing piece is the literal, printed in single quotes.
  {
    name: "fail-owner-example-f-full-semver-fails-at-the-literal",
    expected: [mismatch("1.2.0.1 - 2026-10-01", "{semver} - {date}", "' - '", 5)],
  },
  // FAILING PIECE: the last piece must cover the whole rest; `2026-13-01` is no ISO DATE.
  {
    name: "fail-last-placeholder-fails-at-its-placeholder",
    expected: [mismatch("1.2.0 - 2026-13-01", "{semver} - {date}", "{date}", 5)],
  },
  // Worked example 1 of 2.10, variant bracketed `Unreleased`: the optional literal takes nothing,
  // the required repeat `Release` takes line 7 as a mismatch at `{semver}` (`[` matches).
  {
    name: "fail-worked-example-1-bracketed-unreleased",
    expected: [mismatch("[Unreleased]", "[{semver}] - {date}", "{semver}", 7)],
  },
  // Steps 3c: an optional placeholder position never takes what it does not match: `Notes`
  // stays for the literal `## Notes` (no MTL601 either).
  { name: "pass-optional-placeholder-position-takes-nothing", expected: [] },
  // MTL606 fires only when a sibling is left (owner decision 8 of A72k): MTL605 instead.
  { name: "pass-no-sibling-left-gives-mtl605-not-mtl606", expected: [] },
  // File scope: `Notes` fails at the literal `v`.
  { name: "fail-file-scope-placeholder-takes-a-mismatch", expected: [NOTES_AT_V(7)] },
  // The same pair with `disable-line MTL606` on the anchor line (DIR5, DIR7): silenced.
  { name: "pass-disable-line-silences-it", expected: [] },
  // Section scope: `{in}` is `Section '{parent}': `, the literal `Step ` fails first.
  {
    name: "fail-section-scope-mismatch-names-the-parent",
    expected: [mismatch("Setup", "Step {digits}", "'Step '", 9, "Steps")],
  },
  // A mismatch is not a match: no MTL701 for its empty body, no MTL610 for `### Added`.
  {
    name: "fail-mismatch-is-not-a-match-no-content-or-child-check",
    expected: [NOTES_AT_V(7)],
  },
  // A mismatch is never also MTL612; it counts as unlisted, so `#### Sub` is not reported.
  {
    name: "fail-mismatch-is-not-also-mtl612",
    expected: [mismatch("Misc", "Step {digits}", "'Step '", 9, "Unreleased")],
  },
  // A mismatch is left out of the MTL604 list: `Release` has no match, so no order finding
  // (as a match, line 5 before `# Guide` on line 7 would be an MTL604).
  { name: "fail-mismatch-is-left-out-of-the-order-list", expected: [NOTES_AT_V(5)] },
];

const read = (path: string): string =>
  readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

/** Every diagnostic (after suppression) for the pair of a fixture folder. */
async function lintAll(name: string) {
  const fixture = `${DIR}/${name}`;
  const status = await checkTemplate(registry, read(`${fixture}/template.md`));
  if (status.status !== "ok") throw new Error("template is broken");
  return checkTarget(
    registry,
    status.model,
    read(`${fixture}/target.md`),
    "target.md",
    createEnv(),
  );
}

/** The errors of a fixture as [code, anchor line]. */
async function errorsOf(name: string) {
  return (await lintAll(name))
    .filter((diagnostic) => diagnostic.severity === "error")
    .map((diagnostic) => [diagnostic.code, anchorLineOf(diagnostic)]);
}

describe("MTL606 heading-pattern-mismatch", () => {
  it("is registered in category heading, error, target step headings", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "heading-pattern-mismatch",
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
    });
  }

  it("owner example E: MTL601 (template line 5) before MTL606 (template line 7)", async () => {
    expect(await errorsOf("fail-owner-example-e-repeat-lead-mismatch-then-run")).toEqual([
      ["MTL601", null],
      ["MTL606", 5],
    ]);
  });

  it("owner example A: both findings in template order", async () => {
    expect(await errorsOf("fail-owner-example-a-both-positions-take-a-mismatch")).toEqual([
      ["MTL606", 5],
      ["MTL606", 7],
    ]);
  });

  it("worked example 1: after the mismatch the run takes the instances (MTL703 on line 17)", async () => {
    const found = await lintAll("fail-worked-example-1-bracketed-unreleased");
    const content = found.filter((diagnostic) => diagnostic.code === "MTL703");
    expect(content.map((diagnostic) => [diagnostic.message, anchorLineOf(diagnostic)])).toEqual([
      ["Section '[1.0.0] - 2026-01-10 > Added': [content:list] no markdown list item found", 17],
    ]);
    // MTL606 is printed first (template line 9 before the content step).
    expect(found[0]?.code).toBe(CODE);
  });

  it("no sibling left: MTL605 only, never MTL606 (spec 2.10 'Consequences')", async () => {
    expect(await errorsOf("pass-no-sibling-left-gives-mtl605-not-mtl606")).toEqual([
      ["MTL605", null],
    ]);
  });

  it("an optional placeholder position takes nothing: the next literal takes the sibling", async () => {
    expect(await errorsOf("pass-optional-placeholder-position-takes-nothing")).toEqual([]);
  });

  it("a mismatch is not a match: no content, child, MTL612 or order finding", async () => {
    for (const name of [
      "fail-mismatch-is-not-a-match-no-content-or-child-check",
      "fail-mismatch-is-not-also-mtl612",
      "fail-mismatch-is-left-out-of-the-order-list",
    ]) {
      expect((await lintAll(name)).map((diagnostic) => diagnostic.code)).toEqual([CODE]);
    }
  });

  it("disable-line: the pair is the unsuppressed baseline plus one directive", async () => {
    expect(
      (await lintAll("fail-file-scope-placeholder-takes-a-mismatch")).map((item) => item.code),
    ).toEqual([CODE]);
    const fixture = `${DIR}/pass-disable-line-silences-it`;
    const status = await checkTemplate(registry, read(`${fixture}/template.md`));
    if (status.status !== "ok") throw new Error("template is broken");
    const result = await lintTarget(
      registry,
      status.model,
      read(`${fixture}/target.md`),
      "target.md",
      createEnv(),
    );
    expect(result.diagnostics).toEqual([]);
    expect(result.suppressed).toBe(1);
  });
});
