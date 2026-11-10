/**
 * MTL016 date-format-missing (src/rules/syntax.ts, docs/spec.md 2.9, 4.3, 8.3, DIR6,
 * change C11, ADR 0010), via `--verify`. A template field of inferred type `date` without
 * `[format:date]`, or of type `list-of-date` without `[format:elements:date]`: one warning
 * per field, at column 1 of its key line. A warning: `--verify` exits 0. It never changes
 * target linting, a normal lint run never prints it and a target directive cannot disable it.
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { checkTemplate, lintTarget } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv, createMemoryIo } from "../../../src/engine/rule.js";
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

const CODE = "MTL016";
const DIR = "tests/fixtures/templates/MTL016";
const DATE = "[format:date]";
const ELEMENTS = "[format:elements:date]";

/** Spec 4.3 message; `tag` is the missing tag of the type. */
const message = (key: string, type: string, tag: string): string =>
  `Field '${key}' (type=${type}): no ${tag}, default date formats apply`;

/** Spec 2.9: position is the template key line, column 1. */
const warning = (key: string, type: string, tag: string, line: number, sourceLine: string) =>
  ({
    code: CODE,
    severity: "warning",
    message: message(key, type, tag),
    line,
    column: 1,
    sourceLine,
  }) as const;

/** The MTL015 finding of `fail-date-field-before-conflicting-tag` (spec 2.7). */
const CONFLICT_SOURCE =
  "## Authoring checklist [presence:template-only] [content:subheadings:disallow]";
const CONFLICT_MESSAGE =
  "Heading 'Authoring checklist': tag [content:subheadings:disallow] has no effect " +
  "(the heading is [presence:template-only])";
const CONFLICT = {
  code: "MTL015",
  severity: "warning",
  message: CONFLICT_MESSAGE,
  line: 7,
  column: 49,
  sourceLine: CONFLICT_SOURCE,
} as const;
/** The same conflicting heading, written on line 11 of `fail-date-field-with-every-other-warning`. */
const CONFLICT_AT_11 = { ...CONFLICT, line: 11 } as const;

/** Case -> fixture `<name>.md` -> expected `--verify` result. */
const CASES: readonly VerifyCase[] = [
  // A date-like value is type `date` (spec 3.2 step C3); no format tag.
  {
    name: "fail-date-field-without-format",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      warning("released", "date", DATE, 3, "released: 2026-01-01 # [presence:required]"),
    ],
  },
  // Every item date-like: type `list-of-date` (spec 3.2 step C2), no comment at all.
  {
    name: "fail-list-of-date-field-without-format",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      warning("milestones", "list-of-date", ELEMENTS, 3, 'milestones: ["2026-01-01", "2026-02"]'),
    ],
  },
  // The scalar tag on a list-of-date field does not count (spec 2.9).
  {
    name: "fail-scalar-tag-on-list-of-date",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      warning(
        "history",
        "list-of-date",
        ELEMENTS,
        2,
        'history: ["2025-12-01"] # [presence:optional] [format:date]',
      ),
    ],
  },
  // The elements tag on a date field does not count either (spec 2.9 "or the reverse").
  {
    name: "fail-elements-tag-on-date-field",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      warning("released", "date", DATE, 2, "released: 2026-01-01 # [format:elements:date]"),
    ],
  },
  // Worked example 2 of spec 2.9: two warnings in template order, none for `version`.
  {
    name: "fail-two-fields-in-template-order",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      warning("released", "date", DATE, 3, "released: 2026-01-01 # [presence:required]"),
      warning(
        "history",
        "list-of-date",
        ELEMENTS,
        4,
        'history: ["2025-12-01"] # [presence:optional] [format:date]',
      ),
    ],
  },
  // A date-like value with only other tags (presence, case, a semver shape).
  {
    name: "fail-date-like-field-with-other-tags",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      warning(
        "due",
        "date",
        DATE,
        2,
        "due: 2026-10 # [presence:optional] [format:snake_case] [format:semver]",
      ),
    ],
  },
  // The inferred type counts, so a `type=date` hint does too (spec 3.2 step A1, AS16).
  {
    name: "fail-type-hint-date-without-format",
    exitCode: 0,
    status: "ok",
    diagnostics: [warning("due", "date", DATE, 2, "due: soon # type=date")],
  },
  // The first scalar shape tag wins (spec 2.1, 2.9): `[format:semver]` here, not the date.
  {
    name: "fail-semver-tag-before-date-tag",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      warning("released", "date", DATE, 2, "released: 2026-01-01 # [format:semver] [format:date]"),
    ],
  },
  // A duplicate key: the last occurrence wins (Q06), its line and its (empty) comment.
  {
    name: "fail-duplicate-key-last-occurrence",
    exitCode: 0,
    status: "ok",
    diagnostics: [warning("released", "date", DATE, 4, "released: 2026-02-01")],
  },
  // A date field on line 2 and a conflicting heading tag (MTL015) on line 7: source order
  // here; the text report puts its section last anyway (pinned below).
  {
    name: "fail-date-field-before-conflicting-tag",
    exitCode: 0,
    status: "ok",
    diagnostics: [warning("released", "date", DATE, 2, "released: 2026-01-01"), CONFLICT],
  },
  // The first elements shape tag wins (spec 2.1, 2.9): `[format:elements:semver]` here, so
  // the elements date tag written after it does not count.
  {
    name: "fail-elements-semver-tag-before-elements-date",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      warning(
        "milestones",
        "list-of-date",
        ELEMENTS,
        3,
        'milestones: ["2026-01-01"] # [format:elements:semver] [format:elements:date]',
      ),
    ],
  },
  // A `type=list-of-date` hint makes the type (spec 3.2 step A1) even for a non-date item;
  // no tag, or the scalar tag only, still warns with the elements tag.
  {
    name: "fail-type-hint-list-of-date-without-format",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      warning("history", "list-of-date", ELEMENTS, 2, 'history: ["soon"] # type=list-of-date'),
      warning(
        "wrong_kind",
        "list-of-date",
        ELEMENTS,
        3,
        'wrong_kind: ["soon"] # type=list-of-date [format:date]',
      ),
    ],
  },
  // Every other template warning plus MTL016: source order in the JSON diagnostics (spec
  // 4.1, 8.4); the text report puts the date section last (pinned below).
  {
    name: "fail-date-field-with-every-other-warning",
    exitCode: 0,
    status: "ok",
    diagnostics: [
      warning("released", "date", DATE, 2, "released: 2026-01-01"),
      {
        code: "MTL010",
        severity: "warning",
        message: "Field 'id': unknown tag [nope:y]",
        line: 3,
        column: 9,
        sourceLine: "id: x # [nope:y]",
      },
      {
        code: "MTL012",
        severity: "warning",
        message: "Field 'n': malformed tag [count:min:abc]",
        line: 4,
        column: 19,
        sourceLine: "n: x # [count:min:abc]",
      },
      {
        code: "MTL013",
        severity: "warning",
        message: "Heading 'Guide [format:semver]': tag [format:semver] is not valid in a heading",
        line: 7,
        column: 9,
        sourceLine: "# Guide [format:semver]",
      },
      {
        code: "MTL011",
        severity: "warning",
        message: "Heading 'Notes [nope:y]': unknown tag [nope:y]",
        line: 9,
        column: 10,
        sourceLine: "## Notes [nope:y]",
      },
      CONFLICT_AT_11,
    ],
  },
  // Worked example 2, variant "formats added": no warning.
  { name: "pass-formats-added", exitCode: 0, status: "ok", diagnostics: [] },
  // The inferred type counts (spec 2.9, 3.2 step A1): `type=string` makes a date-like value
  // a `string` field, `type=list-of-string` a plain list: no date field, no warning. Two
  // spaces before the `#` are allowed.
  { name: "pass-type-hint-string-on-date-like-value", exitCode: 0, status: "ok", diagnostics: [] },
  // A duplicate key: the last occurrence wins (Q06). The untagged first occurrences are
  // replaced by the tagged last ones (`type=list-of-date` hint included): no warning.
  { name: "pass-duplicate-key-tagged-last", exitCode: 0, status: "ok", diagnostics: [] },
  // Boundaries of the inference (spec 3.2 step C2): an empty list is `list`, a mixed list
  // (not every item date-like) is `list`, a single non-date item is `list`: no warning.
  { name: "pass-empty-and-mixed-lists", exitCode: 0, status: "ok", diagnostics: [] },
  // A template without any field (empty frontmatter block) has nothing to warn about.
  { name: "pass-template-with-no-fields", exitCode: 0, status: "ok", diagnostics: [] },
  // Both tags on each field: the one of its type is there.
  { name: "pass-both-tags-on-each-date-field", exitCode: 0, status: "ok", diagnostics: [] },
  // A `string` field (also with `[format:date]`) is no date field.
  { name: "pass-string-field", exitCode: 0, status: "ok", diagnostics: [] },
  // A date field with `[format:date]`; format keywords are case-insensitive (spec 2.9).
  { name: "pass-date-field-with-format-date", exitCode: 0, status: "ok", diagnostics: [] },
  // A list-of-date field with `[format:elements:date]`.
  { name: "pass-list-of-date-with-elements-date", exitCode: 0, status: "ok", diagnostics: [] },
  // An enum and plain lists are no date fields.
  { name: "pass-enum-and-plain-list", exitCode: 0, status: "ok", diagnostics: [] },
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

const template = (comment: string): string =>
  `---\nreleased: 2026-01-01${comment}\n---\n\n# Release notes\n`;

describe("MTL016 date-format-missing (--verify)", () => {
  it("is registered in category syntax, warning, phase template", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "date-format-missing",
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

  it("does not change the linting of a target (default date parsing applies)", async () => {
    // Worked example 2, variant: a target `released: 2026-10` passes without the format.
    const target = "---\nreleased: 2026-10\n---\n\n# Release notes\n";
    const without = await lint(template(""), target);
    expect(without).toEqual([]);
    const status = await checkTemplate(registry, template(""));
    expect(status.status === "ok" ? status.warnings.map(({ code }) => code) : []).toEqual([CODE]);
  });

  it("is not suppressible: a target directive naming it is MTL022 (DIR6)", async () => {
    const target =
      "---\nreleased: 2026-01-01\n---\n\n<!-- md-template-lint disable-file MTL016 -->\n\n# Release notes\n";
    const found = await lint(template(""), target);
    expect(found.map(({ code, message }) => ({ code, message }))).toEqual([
      { code: "MTL022", message: "Directive on line 5: rule code MTL016 cannot be disabled" },
    ]);
  });
});

const ioThrows = () => {
  throw new Error("this run must not build the io");
};

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
    createIo: ioThrows,
  });
  expect(run.stderr).toBe("");
  expect(run.exitCode).toBe(0);
  return run.stdout.split("\n");
}

/** One item of `Date fields without format:` (spec 8.3): text, excerpt 6 spaces in, a caret. */
const item = (key: string, type: string, tag: string, line: number, source: string): string[] => [
  `  - ${message(key, type, tag)} (line ${line}, column 1)`,
  `      ${line} | ${source}`,
  `      ${" ".repeat(String(line).length)} | ^`,
];

const SECTION = "Date fields without format:";

/** Fixture -> the items of its section (empty: no section). */
const TEXT_CASES: readonly { readonly name: string; readonly items: readonly string[][] }[] = [
  {
    name: "fail-two-fields-in-template-order",
    items: [
      item("released", "date", DATE, 3, "released: 2026-01-01 # [presence:required]"),
      item(
        "history",
        "list-of-date",
        ELEMENTS,
        4,
        'history: ["2025-12-01"] # [presence:optional] [format:date]',
      ),
    ],
  },
  {
    name: "fail-list-of-date-field-without-format",
    items: [
      item("milestones", "list-of-date", ELEMENTS, 3, 'milestones: ["2026-01-01", "2026-02"]'),
    ],
  },
  {
    name: "fail-duplicate-key-last-occurrence",
    items: [item("released", "date", DATE, 4, "released: 2026-02-01")],
  },
  { name: "pass-formats-added", items: [] },
  { name: "pass-string-field", items: [] },
  { name: "pass-enum-and-plain-list", items: [] },
];

describe("MTL016 in the --verify text report (spec 8.3 `Date fields without format:`)", () => {
  // CLI `--format text` is the `pretty` reporter (spec 7.3); `plain` is the other text one.
  for (const format of ["text", "plain"]) {
    for (const { name, items } of TEXT_CASES) {
      it(`${format} ${name}`, async () => {
        const out = await verifyText(format, name);
        expect(out).toContain(`Warnings:     ${items.length}`);
        if (items.length === 0) {
          expect(out).not.toContain(SECTION);
          return;
        }
        const start = out.indexOf(SECTION);
        expect(start).toBeGreaterThan(0);
        // The section is the last one: right after it comes the summary rule line.
        const expected = [SECTION, ...items.flat(), "", "========================", "Summary"];
        expect(out.slice(start, start + expected.length)).toEqual(expected);
        expect(out.filter((text) => text === SECTION)).toHaveLength(1);
      });
    }
  }

  // Spec 8.3 section order: ..., Conflicting tags, then Date fields without format LAST. The
  // date field is on line 2 and the conflict on line 7, so source order would give the reverse.
  for (const format of ["text", "plain"]) {
    it(`${format} fail-date-field-before-conflicting-tag: Conflicting tags, then Date fields`, async () => {
      const out = await verifyText(format, "fail-date-field-before-conflicting-tag");
      expect(out).toContain("Warnings:     2");
      const start = out.indexOf("Conflicting tags:");
      expect(start).toBeGreaterThan(0);
      const expected = [
        "Conflicting tags:",
        `  - ${CONFLICT_MESSAGE} (line 7, column 49)`,
        `      7 | ${CONFLICT_SOURCE}`,
        `        | ${" ".repeat(48)}^`,
        "",
        SECTION,
        ...item("released", "date", DATE, 2, "released: 2026-01-01"),
        "",
        "========================",
        "Summary",
      ];
      expect(out.slice(start, start + expected.length)).toEqual(expected);
    });
  }
});

/** Spec 8.3 order of the sections of the template warnings; the date section is the LAST one. */
const SECTION_TITLES = [
  "Unknown tags found (typo or unimplemented feature):",
  "Malformed tags:",
  "Misplaced tags:",
  "Conflicting tags:",
  SECTION,
];

describe("MTL016 section is the last one of the --verify text report (spec 8.3)", () => {
  for (const format of ["text", "plain"]) {
    it(`${format} fail-date-field-with-every-other-warning: five sections in spec order`, async () => {
      const out = await verifyText(format, "fail-date-field-with-every-other-warning");
      expect(out).toContain("Warnings:     6");
      // The date field is on line 2, before every other warning: source order would put its
      // section first; the report puts it last.
      expect(out.filter((text) => SECTION_TITLES.includes(text))).toEqual(SECTION_TITLES);
      const start = out.indexOf(SECTION);
      const expected = [
        SECTION,
        ...item("released", "date", DATE, 2, "released: 2026-01-01"),
        "",
        "========================",
        "Summary",
      ];
      expect(out.slice(start, start + expected.length)).toEqual(expected);
    });
  }
});

/** Spec 2.9 worked example 2: the whole plain output, `<version>` being 9.9.9. */
const WORKED_EXAMPLE_2 = `md-template-lint 9.9.9
Config: (none)
========================

  PASS release.template.md
Field     Type          Rules
-----------------------------
version   string        presence:required, format:semver
released  date          presence:required
history   list-of-date  presence:optional, format:date

Headings:
  # Release notes (presence:required)

Date fields without format:
  - Field 'released' (type=date): no [format:date], default date formats apply (line 3, column 1)
      3 | released: 2026-01-01 # [presence:required]
        | ^
  - Field 'history' (type=list-of-date): no [format:elements:date], default date formats apply (line 4, column 1)
      4 | history: ["2025-12-01"] # [presence:optional] [format:date]
        | ^

========================
Summary
========================
Templates:    1 checked, 0 broken
Warnings:     2

All templates passed!
========================
`;

describe("MTL016 worked example 2 (spec 2.9), golden output", () => {
  let folder = "";

  beforeAll(() => {
    // The fixture is the worked example template; the spec names it `release.template.md`.
    folder = mkdtempSync(join(tmpdir(), "mtl-mtl016-"));
    const text = readFileSync(
      join(templatesDir(CODE), "fail-two-fields-in-template-order.md"),
      "utf8",
    ).replaceAll("\r\n", "\n");
    writeFileSync(join(folder, "release.template.md"), text);
    // A project for a normal lint run (spec 7.2): one pair, one valid target.
    writeFileSync(
      join(folder, "md-template-lint.yml"),
      "pairs:\n  - name: release\n    template: release.template.md\n    include: docs/*.md\n",
    );
    mkdirSync(join(folder, "docs"));
    writeFileSync(
      join(folder, "docs", "release.md"),
      '---\nversion: "1.0.0"\nreleased: 2026-10\nhistory: ["2025-12-01"]\n---\n\n# Release notes\n',
    );
  });

  afterAll(() => {
    if (folder !== "") rmSync(folder, { recursive: true, force: true });
  });

  const run = (args: readonly string[]) => {
    const cwd = foldPath(folder);
    return runCli([...args], {
      cwd,
      home: HOME,
      boundary: cwd,
      isTty: false,
      noColor: false,
      version: "9.9.9",
      createIo: args.includes("--verify") ? ioThrows : () => createMemoryIo(),
    });
  };

  it("a normal lint run prints no MTL016 and exits 0 (template warnings: --verify only)", async () => {
    for (const format of ["plain", "json"]) {
      const result = await run(["--format", format]);
      expect(result.stderr).toBe("");
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("release.md");
      expect(result.stdout).not.toContain(CODE);
      expect(result.stdout).not.toContain(SECTION);
    }
  });

  it("the default format and `--format text` (pretty) of a normal lint run print no MTL016", async () => {
    for (const args of [[], ["--format", "text"]]) {
      const result = await run(args);
      expect(result.stderr).toBe("");
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("release.md");
      expect(result.stdout).not.toContain(CODE);
      expect(result.stdout).not.toContain(SECTION);
      expect(result.stdout).not.toContain("default date formats apply");
    }
  });

  it("--verify --format plain prints the spec output and exits 0", async () => {
    const result = await run(["--verify", "--format", "plain", "release.template.md"]);
    expect(result).toEqual({ stdout: WORKED_EXAMPLE_2, stderr: "", exitCode: 0 });
  });

  it("--verify (pretty) has the same text after a glyph header", async () => {
    const result = await run(["--verify", "release.template.md"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.replace("  ✓ release.template.md", "  PASS release.template.md")).toBe(
      WORKED_EXAMPLE_2,
    );
  });

  it("--verify --format json lists both warnings in the diagnostics, warnings 2", async () => {
    const result = await run(["--verify", "--format", "json", "release.template.md"]);
    expect(result.exitCode).toBe(0);
    const json = JSON.parse(result.stdout) as {
      templates: { diagnostics: unknown[] }[];
      summary: { warnings: number; exitCode: number };
    };
    expect(json.templates[0]?.diagnostics).toEqual(
      CASES.find((testCase) => testCase.name === "fail-two-fields-in-template-order")?.diagnostics,
    );
    expect(json.summary).toMatchObject({ warnings: 2, exitCode: 0 });
  });
});
