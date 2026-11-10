/**
 * MTL015 heading-tag-conflict (src/rules/syntax.ts, docs/spec.md 2.7, 4.3, DIR6, change C10,
 * ADR 0009), via `--verify`. A known heading tag that can have no effect: today
 * `[content:subheadings:disallow]`, `[content:subheadings:no-extra]` (phase P7b), the effective `[pattern:"..."]` tag (phase P3) and the
 * first `[repeat-rules:...]` tag of each kind (phase P4) and the first `[order:...]` tag (phase
 * P7) on a `[presence:template-only]` heading, and those repeat and order tags on a heading
 * without a pattern tag (phases P4, P7). A warning:
 * `--verify` exits 0. It never changes target linting and a target directive cannot disable it.
 */
import { describe, expect, it } from "vitest";
import { checkTemplate, lintTarget } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv } from "../../../src/engine/rule.js";
import type { Diagnostic, DocumentModel } from "../../../src/engine/model.js";
import { runCli } from "../../../src/cli/run.js";
import { foldPath } from "../../../src/config/paths.js";
import { HOME } from "../../helpers/run.js";
import {
  expectTemplateCases,
  templatesDir,
  verifyFixture,
  type VerifyCase,
} from "../../helpers/verify.js";

const CODE = "MTL015";
const DIR = "tests/fixtures/templates/MTL015";
const TAG = "[content:subheadings:disallow]";
const NO_EXTRA = "[content:subheadings:no-extra]";
const REASON = "(the heading is [presence:template-only])";

const warning = (heading: string, line: number, column: number, sourceLine: string) =>
  ({
    code: CODE,
    severity: "warning",
    message: `Heading '${heading}': tag ${TAG} has no effect ${REASON}`,
    line,
    column,
    sourceLine,
  }) as const;

/** An MTL015 warning for another tag than the disallow tag (spec 2.7, 2.10). */
const conflict = (heading: string, tag: string, column: number, sourceLine: string) =>
  ({
    code: CODE,
    severity: "warning",
    message: `Heading '${heading}': tag ${tag} has no effect ${REASON}`,
    line: 7,
    column,
    sourceLine,
  }) as const;

/** Reason of a repeat tag on a heading without any pattern tag (spec 2.7, phase P4). */
const NO_PATTERN = "(the heading has no [pattern:...])";

/** An MTL015 warning on line 7 with an explicit reason. */
const reasoned = (
  heading: string,
  tag: string,
  column: number,
  sourceLine: string,
  reason: string,
  line = 7,
) =>
  ({
    code: CODE,
    severity: "warning",
    message: `Heading '${heading}': tag ${tag} has no effect ${reason}`,
    line,
    column,
    sourceLine,
  }) as const;

const REPEATS =
  "## R [repeat-rules:same-level:max:4] [repeat-rules:same-level:max:5] [repeat-rules:same-level]";
const DRAFT_PATTERN_REPEAT =
  '## Draft [presence:template-only] [pattern:"Draft {text}"] [repeat-rules:same-level]';

const ORDERS = "## R [repeat-rules:same-level] [order:first:date:descending] [order:ascending]";
const DRAFT_ALL =
  '## Draft [presence:template-only] [pattern:"D {text}"] [repeat-rules:same-level] [order:descending]';

const DRAFT_ORDER =
  '## Draft [content:subheadings:disallow] [pattern:"x {text}"] [presence:template-only] [pattern:"y"]';
const DRAFT_INVALID =
  '## Draft [presence:template-only] [pattern:"{x}"] [content:subheadings:disallow]';

/** Case -> fixture `<name>.md` -> expected `--verify` result. */
const CASES: readonly VerifyCase[] = [
  // Spec 2.7, 2.10 (phase P3): a pattern tag on a template-only heading is ignored. Column 35:
  // `## Draft ` is 9 characters, `[presence:template-only]` 24, a space.
  {
    name: "fail-template-only-pattern-tag",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      conflict(
        "Draft",
        '[pattern:"Draft {text}"]',
        35,
        '## Draft [presence:template-only] [pattern:"Draft {text}"]',
      ),
    ],
  },
  // Only the effective (first) pattern tag is reported; findings in tag order: the disallow
  // tag at column 10 (30 characters), then the first pattern tag at column 41.
  {
    name: "fail-template-only-first-pattern-tag-only-in-tag-order",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      conflict("Draft", TAG, 10, DRAFT_ORDER),
      conflict("Draft", '[pattern:"x {text}"]', 41, DRAFT_ORDER),
    ],
  },
  // Spec 2.7: an invalid pattern (MTL014, at its `{`, column 45) gets no MTL015 for its
  // pattern tag; the disallow tag (column 51) keeps its MTL015.
  {
    name: "fail-template-only-invalid-pattern-gets-only-the-disallow-conflict",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      {
        code: "MTL014",
        severity: "warning",
        message: `Heading 'Draft': invalid pattern [pattern:"{x}"] (unknown placeholder {x})`,
        line: 7,
        column: 45,
        sourceLine: DRAFT_INVALID,
      },
      conflict("Draft", TAG, 51, DRAFT_INVALID),
    ],
  },
  // A pattern tag on a required or optional heading takes effect.
  { name: "pass-pattern-without-template-only", exitCode: 0, status: "ok", diagnostics: [] },
  // Spec 2.7 (phase P4): a repeat tag on a heading without a pattern tag is ignored. Column 13:
  // `## Releases ` is 12 characters.
  {
    name: "fail-repeat-tag-without-pattern",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      reasoned(
        "Releases",
        "[repeat-rules:same-level]",
        13,
        "## Releases [repeat-rules:same-level]",
        NO_PATTERN,
      ),
    ],
  },
  // Spec 2.10 "first tag of a kind wins": three repeat kinds (same-level, min, max), so the
  // first tag of each kind is reported, in tag order: max:4 at column 6 (`## R ` is 5), the
  // bare tag at 70 (two 31-character tags, each with a space); the second max (38) is not.
  // Line 9: the min kind, column 6.
  {
    name: "fail-repeat-tags-without-pattern-first-of-each-kind",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      reasoned("R", "[repeat-rules:same-level:max:4]", 6, REPEATS, NO_PATTERN),
      reasoned("R", "[repeat-rules:same-level]", 70, REPEATS, NO_PATTERN),
      reasoned(
        "S",
        "[repeat-rules:same-level:min:2]",
        6,
        "## S [repeat-rules:same-level:min:2]",
        NO_PATTERN,
        9,
      ),
    ],
  },
  // Spec 2.7: pattern and repeat tags on a template-only heading are ignored: the pattern tag
  // at column 35, the repeat tag at 60 (the pattern tag is 24 characters, then a space).
  {
    name: "fail-template-only-pattern-and-repeat-tags",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      conflict("Draft", '[pattern:"Draft {text}"]', 35, DRAFT_PATTERN_REPEAT),
      conflict("Draft", "[repeat-rules:same-level]", 60, DRAFT_PATTERN_REPEAT),
    ],
  },
  // A template-only heading without a pattern: the template-only reason (the first cause).
  {
    name: "fail-template-only-repeat-tag-without-pattern",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      conflict(
        "Draft",
        "[repeat-rules:same-level:max:2]",
        35,
        "## Draft [presence:template-only] [repeat-rules:same-level:max:2]",
      ),
    ],
  },
  // Spec 2.7: an invalid pattern (MTL014 at its `{`, column 22) has a pattern tag, so its repeat
  // tag gets no MTL015 (one cause, one warning); `Notes` (no pattern tag) gets one at column 10.
  {
    name: "fail-invalid-pattern-repeat-tag-gets-no-conflict",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      {
        code: "MTL014",
        severity: "warning",
        message: `Heading 'Release': invalid pattern [pattern:"{x}"] (unknown placeholder {x})`,
        line: 7,
        column: 22,
        sourceLine: '## Release [pattern:"{x}"] [repeat-rules:same-level]',
      },
      reasoned(
        "Notes",
        "[repeat-rules:same-level]",
        10,
        "## Notes [repeat-rules:same-level]",
        NO_PATTERN,
        9,
      ),
    ],
  },
  // A repeat tag on a pattern heading takes effect, before or after the pattern tag.
  { name: "pass-repeat-tag-with-pattern", exitCode: 0, status: "ok", diagnostics: [] },
  // Spec 2.7 (phase P7), worked example 2 of 2.10 line 7: an order tag on a heading without a
  // pattern tag is ignored. Column 35: `## Unreleased ` is 14 characters, the presence tag 19,
  // a space.
  {
    name: "fail-order-tag-without-pattern",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      reasoned(
        "Unreleased",
        "[order:ascending]",
        35,
        "## Unreleased [presence:optional] [order:ascending]",
        NO_PATTERN,
      ),
    ],
  },
  // The repeat tag (column 6) and the FIRST order tag (column 32: the repeat tag is 25
  // characters, then a space) are reported; the second order tag is not (first tag wins).
  {
    name: "fail-order-tags-without-pattern-first-only",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      reasoned("R", "[repeat-rules:same-level]", 6, ORDERS, NO_PATTERN),
      reasoned("R", "[order:first:date:descending]", 32, ORDERS, NO_PATTERN),
    ],
  },
  // Spec 2.7: an order tag on a template-only heading: the template-only reason (first cause).
  {
    name: "fail-template-only-order-tag",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      conflict(
        "Draft",
        "[order:first:semver:ascending]",
        35,
        "## Draft [presence:template-only] [order:first:semver:ascending]",
      ),
    ],
  },
  // Pattern (35), repeat (56: the pattern tag is 20 characters, a space) and order (82: the
  // repeat tag is 25 characters, a space) tags on a template-only heading: one finding each,
  // in tag order.
  {
    name: "fail-template-only-pattern-repeat-and-order-tags",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      conflict("Draft", '[pattern:"D {text}"]', 35, DRAFT_ALL),
      conflict("Draft", "[repeat-rules:same-level]", 56, DRAFT_ALL),
      conflict("Draft", "[order:descending]", 82, DRAFT_ALL),
    ],
  },
  // Spec 2.7: an invalid pattern (MTL014 at its `{`, column 22): no MTL015 for its repeat and
  // order tags (one cause, one warning); `Notes` (no pattern tag) gets one at column 10.
  {
    name: "fail-invalid-pattern-order-tag-gets-no-conflict",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      {
        code: "MTL014",
        severity: "warning",
        message: `Heading 'Release': invalid pattern [pattern:"{x}"] (unknown placeholder {x})`,
        line: 7,
        column: 22,
        sourceLine: '## Release [pattern:"{x}"] [repeat-rules:same-level] [order:descending]',
      },
      reasoned("Notes", "[order:ascending]", 10, "## Notes [order:ascending]", NO_PATTERN, 9),
    ],
  },
  // An order tag on a repeat heading (pattern and repeat tag) takes effect.
  { name: "pass-order-tag-on-repeat-pattern-heading", exitCode: 0, status: "ok", diagnostics: [] },
  // The tag on a heading that is not template-only takes effect.
  { name: "pass-disallow-without-template-only", exitCode: 0, status: "ok", diagnostics: [] },
  // A template-only heading without the tag.
  { name: "pass-template-only-without-disallow", exitCode: 0, status: "ok", diagnostics: [] },
  // An optional heading can match, so the tag can apply.
  { name: "pass-optional-with-disallow", exitCode: 0, status: "ok", diagnostics: [] },
  // Template-only first, then the tag: the position is the one of the tag.
  {
    name: "fail-template-only-then-disallow",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      warning(
        "Authoring checklist",
        7,
        49,
        `## Authoring checklist [presence:template-only] ${TAG}`,
      ),
    ],
  },
  // The tag first, then template-only.
  {
    name: "fail-disallow-then-template-only",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      warning(
        "Authoring checklist",
        7,
        24,
        `## Authoring checklist ${TAG} [presence:template-only]`,
      ),
    ],
  },
  // Every level is read (change C10): an H3 heading.
  {
    name: "fail-template-only-disallow-at-h3",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      warning("Notes for authors", 9, 48, `### Notes for authors [presence:template-only] ${TAG}`),
    ],
  },
  // Spec 2.6 precedence: conditional beats template-only, so the heading is conditional.
  {
    name: "pass-conditional-template-only-with-disallow",
    exitCode: 0,
    status: "ok",
    diagnostics: [],
  },
  // Spec 2.6 precedence: template-only beats required.
  {
    name: "fail-required-template-only-with-disallow",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      warning("Notes", 7, 55, `## Notes [presence:required] [presence:template-only] ${TAG}`),
    ],
  },
  // The tag written twice: one finding per tag (spec 2.7), each at its own column.
  {
    name: "fail-disallow-written-twice",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      warning("Notes", 7, 35, `## Notes [presence:template-only] ${TAG} ${TAG}`),
      warning("Notes", 7, 66, `## Notes [presence:template-only] ${TAG} ${TAG}`),
    ],
  },
  // Two template-only headings with the tag: two warnings, in template order.
  {
    name: "fail-two-template-only-headings",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      warning("Checklist", 7, 39, `## Checklist [presence:template-only] ${TAG}`),
      warning("Review notes", 11, 42, `## Review notes [presence:template-only] ${TAG}`),
    ],
  },
  // Another content tag on a template-only heading is not a defined reason (spec 2.7).
  {
    name: "pass-template-only-with-other-content-tag",
    exitCode: 0,
    status: "ok",
    diagnostics: [],
  },
  // Every level is read (spec 2.6): an H1 heading. Column 48: `# ` + 19 + space + 24 + space + 1.
  {
    name: "fail-template-only-disallow-at-h1",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      warning(
        "Authoring checklist",
        5,
        48,
        `# Authoring checklist [presence:template-only] ${TAG}`,
      ),
    ],
  },
  // Spec 8.2 EX4: a column counts characters. BMP letters and CJK: one column each, tag at 60.
  {
    name: "fail-non-ascii-heading-column-counts-characters",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      warning(
        "Überprüfung der Änderungen 日本語",
        7,
        60,
        `## Überprüfung der Änderungen 日本語 [presence:template-only] ${TAG}`,
      ),
    ],
  },
  // Spec 8.2 EX4: a character outside the BMP (a surrogate pair in UTF-16) is ONE column.
  {
    name: "fail-astral-heading-column-counts-code-points",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      warning(
        "Liste 🙂 de vérification",
        7,
        53,
        `## Liste 🙂 de vérification [presence:template-only] ${TAG}`,
      ),
    ],
  },
  // Phase P7b (spec 2.6, 2.7): `[content:subheadings:no-extra]` on a template-only heading has
  // no effect either. Column 49, as for the disallow tag on the same heading.
  {
    name: "fail-template-only-then-no-extra",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      conflict(
        "Authoring checklist",
        NO_EXTRA,
        49,
        `## Authoring checklist [presence:template-only] ${NO_EXTRA}`,
      ),
    ],
  },
  // Both sub-heading tags: one finding each, in tag order (disallow at 35, no-extra at 66).
  {
    name: "fail-template-only-disallow-and-no-extra",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      conflict("Notes", TAG, 35, `## Notes [presence:template-only] ${TAG} ${NO_EXTRA}`),
      conflict("Notes", NO_EXTRA, 66, `## Notes [presence:template-only] ${TAG} ${NO_EXTRA}`),
    ],
  },
  // The no-extra tag on a heading that is not template-only takes effect.
  { name: "pass-no-extra-without-template-only", exitCode: 0, status: "ok", diagnostics: [] },
  // Phase A80c (spec 2.11, 2.7): `[unique-headings-names]` on a template-only heading has no
  // effect either (worked example 2 of 2.11, variant template-only). Column 35.
  {
    name: "fail-template-only-with-unique-headings-names",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      conflict(
        "Usage",
        "[unique-headings-names]",
        35,
        "## Usage [presence:template-only] [unique-headings-names]",
      ),
    ],
  },
  // A conflict on line 7 and a misplaced field tag on line 9, in source order (the section
  // order of the text report is pinned below).
  {
    name: "fail-conflicting-tag-before-misplaced-tag",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      warning(
        "Authoring checklist",
        7,
        49,
        `## Authoring checklist [presence:template-only] ${TAG}`,
      ),
      {
        code: "MTL013",
        severity: "warning",
        message: "Heading 'Notes [count:min:1]': tag [count:min:1] is not valid in a heading",
        line: 9,
        column: 10,
        sourceLine: "## Notes [count:min:1]",
      },
    ],
  },
];

const registry = createRegistry();

async function model(text: string): Promise<DocumentModel> {
  const status = await checkTemplate(registry, text);
  if (status.status !== "ok") throw new Error("template is broken");
  return status.model;
}

async function lint(template: string, target: string): Promise<Diagnostic[]> {
  const result = await lintTarget(
    registry,
    await model(template),
    target,
    "target.md",
    createEnv(),
  );
  expect(result.suppressed).toBe(0);
  return result.diagnostics;
}

const template = (tags: string): string =>
  `---\ntitle: x\n---\n\n# Guide\n\n## Authoring checklist ${tags}\n`;

describe("MTL015 heading-tag-conflict (--verify)", () => {
  it("is registered in category syntax, warning, phase template", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "heading-tag-conflict",
      category: "syntax",
      severity: "warning",
      phase: "template",
    });
  });

  it("has at least 1 pass- case and at least 1 fail- case, one fixture file each", () => {
    expectTemplateCases(CODE, CASES);
  });

  for (const { name, ...expected } of CASES) {
    it(`${name}: ${DIR}/${name}.md`, async () => {
      expect(await verifyFixture(CODE, name)).toEqual(expected);
    });
  }

  it("does not change the linting of a target", async () => {
    const target = "---\ntitle: x\n---\n\n# Guide\n\n## Authoring checklist\n\n### Step\n";
    const withTag = await lint(template(`[presence:template-only] ${TAG}`), target);
    const without = await lint(template("[presence:template-only]"), target);
    expect(withTag).toEqual(without);
    expect(withTag.map((diagnostic) => diagnostic.code)).toEqual(["MTL603"]);
  });

  it("is not suppressible: a target directive naming it is MTL022 (DIR6)", async () => {
    const target = "---\ntitle: x\n---\n\n# Guide\n\n<!-- md-template-lint disable MTL015 -->\n";
    const found = await lint(template(`[presence:template-only] ${TAG}`), target);
    expect(found.map(({ code, message }) => ({ code, message }))).toEqual([
      { code: "MTL022", message: "Directive on line 7: rule code MTL015 cannot be disabled" },
    ]);
  });
});

/** Stdout lines of `--verify --format <format> <name>.md` on a fixture of this code. */
async function verifyText(format: string, name: string): Promise<string[]> {
  const cwd = foldPath(templatesDir(CODE));
  const run = await runCli(["--verify", "--format", format, `${name}.md`], {
    cwd,
    home: HOME,
    boundary: cwd,
    isTty: false,
    noColor: false,
    version: "9.9.9",
    createIo: () => {
      throw new Error("--verify must not build the io");
    },
  });
  expect(run.stderr).toBe("");
  expect(run.exitCode).toBe(0);
  return run.stdout.split("\n");
}

/** One item of `Conflicting tags:` (spec 8.3): text, then the excerpt 6 spaces in, a caret. */
const item = (heading: string, line: number, column: number, source: string): string[] => [
  `  - Heading '${heading}': tag ${TAG} has no effect ${REASON} (line ${line}, column ${column})`,
  `      ${line} | ${source}`,
  `      ${" ".repeat(String(line).length)} | ${" ".repeat(column - 1)}^`,
];

/** Fixture -> the items of its `Conflicting tags:` section (empty: no section). */
const TEXT_CASES: readonly { readonly name: string; readonly items: readonly string[][] }[] = [
  {
    name: "fail-template-only-then-disallow",
    items: [
      item("Authoring checklist", 7, 49, `## Authoring checklist [presence:template-only] ${TAG}`),
    ],
  },
  {
    name: "fail-template-only-disallow-at-h3",
    items: [
      item("Notes for authors", 9, 48, `### Notes for authors [presence:template-only] ${TAG}`),
    ],
  },
  {
    name: "fail-two-template-only-headings",
    items: [
      item("Checklist", 7, 39, `## Checklist [presence:template-only] ${TAG}`),
      item("Review notes", 11, 42, `## Review notes [presence:template-only] ${TAG}`),
    ],
  },
  // Spec 2.7: the tag written twice gives one finding per tag, each at its own column.
  {
    name: "fail-disallow-written-twice",
    items: [
      item("Notes", 7, 35, `## Notes [presence:template-only] ${TAG} ${TAG}`),
      item("Notes", 7, 66, `## Notes [presence:template-only] ${TAG} ${TAG}`),
    ],
  },
  // Spec 2.6 precedence: template-only beats required; the heading text is `Notes`.
  {
    name: "fail-required-template-only-with-disallow",
    items: [item("Notes", 7, 55, `## Notes [presence:required] [presence:template-only] ${TAG}`)],
  },
  {
    name: "fail-template-only-disallow-at-h1",
    items: [
      item("Authoring checklist", 5, 48, `# Authoring checklist [presence:template-only] ${TAG}`),
    ],
  },
  // Spec 8.2 EX4: characters, not UTF-16 units; the caret sits under the tag.
  {
    name: "fail-non-ascii-heading-column-counts-characters",
    items: [
      item(
        "Überprüfung der Änderungen 日本語",
        7,
        60,
        `## Überprüfung der Änderungen 日本語 [presence:template-only] ${TAG}`,
      ),
    ],
  },
  {
    name: "fail-astral-heading-column-counts-code-points",
    items: [
      item(
        "Liste 🙂 de vérification",
        7,
        53,
        `## Liste 🙂 de vérification [presence:template-only] ${TAG}`,
      ),
    ],
  },
  { name: "pass-disallow-without-template-only", items: [] },
  { name: "pass-template-only-without-disallow", items: [] },
  { name: "pass-optional-with-disallow", items: [] },
  { name: "pass-conditional-template-only-with-disallow", items: [] },
  { name: "pass-template-only-with-other-content-tag", items: [] },
];

describe("MTL015 in the --verify text report (spec 8.3 `Conflicting tags:`)", () => {
  // CLI `--format text` is the `pretty` reporter (spec 7.3); `plain` is the other text one.
  for (const format of ["text", "plain"]) {
    for (const { name, items } of TEXT_CASES) {
      it(`${format} ${name}`, async () => {
        const out = await verifyText(format, name);
        expect(out).toContain(`Warnings:     ${items.length}`);
        if (items.length === 0) {
          expect(out).not.toContain("Conflicting tags:");
          return;
        }
        const start = out.indexOf("Conflicting tags:");
        expect(start).toBeGreaterThan(0);
        const expected = ["Conflicting tags:", ...items.flat(), ""];
        expect(out.slice(start, start + expected.length)).toEqual(expected);
        expect(out.filter((text) => text === "Conflicting tags:")).toHaveLength(1);
      });
    }
  }

  // Spec 8.3 section order: Unknown, Malformed, Misplaced, Conflicting. The conflict is on
  // line 7 and the misplaced tag on line 9, so source order would give the other order.
  for (const format of ["text", "plain"]) {
    it(`${format} fail-conflicting-tag-before-misplaced-tag: Misplaced tags before Conflicting tags`, async () => {
      const out = await verifyText(format, "fail-conflicting-tag-before-misplaced-tag");
      expect(out).toContain("Warnings:     2");
      const start = out.indexOf("Misplaced tags:");
      expect(start).toBeGreaterThan(0);
      const expected = [
        "Misplaced tags:",
        "  - Heading 'Notes [count:min:1]': tag [count:min:1] is not valid in a heading (line 9, column 10)",
        "      9 | ## Notes [count:min:1]",
        "        | ".concat(" ".repeat(9), "^"),
        "",
        "Conflicting tags:",
        ...item(
          "Authoring checklist",
          7,
          49,
          `## Authoring checklist [presence:template-only] ${TAG}`,
        ),
        "",
      ];
      expect(out.slice(start, start + expected.length)).toEqual(expected);
      expect(out.indexOf("Misplaced tags:")).toBeLessThan(out.indexOf("Conflicting tags:"));
    });
  }
});
