/**
 * Disable directives against REAL rule diagnostics (docs/spec.md 4.4, DIR1 to DIR10; anchors
 * DIR5; messages 4.3). Expected values come from the spec tables, not from the code:
 * a diagnostic on a field sits on the key line, a heading finding on the heading line
 * (DIR5), `MTL101`, a missing key (`MTL201`), `MTL601` and `MTL604` have no anchor. Heading
 * matching is positional (spec 2.6, 2.10, ADR 0012): a swapped same-level pair is two `MTL601`
 * findings, `MTL604` is only an order across levels.
 *
 * Owner rule: the template must make the errors WITHOUT any directive, then one passing
 * case per suppression type. So:
 * - baseline project `tests/fixtures/runner/suppress-fail-real-codes-no-directive` (10 real
 *   codes), and one passing project per type next to it (`suppress-pass-real-*`: disable-line,
 *   disable-next-line, open disable, begin/end block, disable-file in a comment, disable-file in
 *   the frontmatter). The runner test checks their output; this file proves that each passing
 *   target is the baseline target plus directive comments only (stripping them gives the
 *   baseline text back), and runs every code x every verb on the baseline text.
 * - the same for the codes without anchor (`suppress-*-unanchored-*`).
 *
 * Mutation note: directive text edits below are plain string edits (no regex); a directive
 * is written the way a user writes it (`# ...` in the frontmatter, `<!-- ... -->` in the body).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Diagnostic } from "../../../src/engine/model.js";
import { checkTemplate, lintTarget } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { anchorLineOf, createEnv } from "../../../src/engine/rule.js";
import { report } from "../../../src/reporters/index.js";
import { fixturePath } from "../../helpers/fixtures.js";
import { runFixture } from "../../helpers/run.js";

const registry = createRegistry();
const KEYWORD = "md-template-lint";

const runnerText = (fixture: string, file: string): string => readFileSync(join(fixturePath("runner", fixture), file), "utf8");

async function lint(template: string, target: string, path = "notes/real.md") {
  const status = await checkTemplate(registry, template);
  if (status.status !== "ok") throw new Error("template is broken");
  const result = await lintTarget(registry, status.model, target, path, createEnv());
  return { warnings: status.warnings, ...result };
}

/** `CODE@line` of each diagnostic (`none` without position), sorted: order is not under test. */
const signature = (diagnostics: readonly Diagnostic[]): string[] => diagnostics.map((diagnostic) => `${diagnostic.code}@${anchorLineOf(diagnostic) ?? "none"}`).sort();

interface Expected {
  readonly code: string;
  /** 1-based file line of the finding; null: no line. */
  readonly line: number | null;
}
const sign = (list: readonly Expected[]): string[] => list.map((entry) => `${entry.code}@${entry.line ?? "none"}`).sort();

/** Single-line directive comment, as a user writes it. */
const fm = (body: string): string => `# ${KEYWORD} ${body}`;
const html = (body: string): string => `<!-- ${KEYWORD} ${body} -->`;

interface Insert {
  readonly at: number;
  readonly text: string;
}
interface Edit {
  /** Text appended to a line (a trailing comment), by 1-based line. */
  readonly appends: ReadonlyMap<number, string>;
  /** Lines inserted BEFORE the 1-based original line `at`. */
  readonly inserts: readonly Insert[];
}

/** Apply an edit; `remap` gives the new line number of an original line. */
function apply(text: string, edit: Edit) {
  const lines = text.split("\n");
  for (const [line, extra] of edit.appends) lines[line - 1] = `${lines[line - 1] ?? ""}${extra}`;
  for (const insert of [...edit.inserts].sort((a, b) => b.at - a.at)) {
    lines.splice(insert.at - 1, 0, insert.text);
  }
  return {
    text: lines.join("\n"),
    remap: (line: number): number => line + edit.inserts.filter((insert) => insert.at <= line).length,
  };
}

/** 1-based line of the closing `---` of the frontmatter. */
function closingFence(text: string): number {
  const lines = text.split("\n");
  return lines.indexOf("---", 1) + 1;
}

type Verb = "disable-line" | "disable-next-line" | "disable" | "begin disable";
type FileCarrier = "html" | "frontmatter";

/**
 * A directive for `codes` that covers the anchor line `anchor`, with the verb `verb`. Frontmatter
 * lines get `#` comments, body lines get HTML comments. The block form closes on the anchor line
 * (body: `end disable` after the heading text, so no comment line becomes the section body, see
 * DIR4) or on the line below it (frontmatter).
 */
function lineEdit(verb: Verb, codes: string, anchor: number, closing: number): Edit {
  const carrier = anchor < closing ? fm : html;
  switch (verb) {
    case "disable-line":
      return { appends: new Map([[anchor, ` ${carrier(`disable-line ${codes}`)}`]]), inserts: [] };
    case "disable-next-line":
      return {
        appends: new Map(),
        inserts: [{ at: anchor, text: carrier(`disable-next-line ${codes}`) }],
      };
    case "disable":
      return { appends: new Map(), inserts: [{ at: anchor, text: carrier(`disable ${codes}`) }] };
    case "begin disable":
      return anchor < closing
        ? {
            appends: new Map(),
            inserts: [
              { at: anchor, text: fm(`begin disable ${codes}`) },
              { at: anchor + 1, text: fm(`end disable ${codes}`) },
            ],
          }
        : {
            appends: new Map([[anchor, ` ${html(`end disable ${codes}`)}`]]),
            inserts: [{ at: anchor, text: html(`begin disable ${codes}`) }],
          };
  }
}

/** `disable-file` in a body comment (right after the frontmatter) or in the frontmatter. */
function fileEdit(carrier: FileCarrier, codes: string, closing: number): Edit {
  return carrier === "html" ? { appends: new Map(), inserts: [{ at: closing + 1, text: html(`disable-file ${codes}`) }] } : { appends: new Map(), inserts: [{ at: 2, text: fm(`disable-file ${codes}`) }] };
}

/** `text` without any directive comment: whole-line comments dropped, trailing ones cut. */
function stripDirectives(text: string): string {
  const kept: string[] = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith(`# ${KEYWORD}`) || trimmed.startsWith(`<!-- ${KEYWORD}`)) continue;
    let cut = line;
    for (const marker of [` # ${KEYWORD}`, ` <!-- ${KEYWORD}`]) {
      const at = cut.indexOf(marker);
      if (at >= 0) cut = cut.slice(0, at);
    }
    kept.push(cut);
  }
  return kept.join("\n");
}

// ---------------------------------------------------------------------------------------
// The baseline: 10 real findings, no directive.
// ---------------------------------------------------------------------------------------

const REAL = "suppress-fail-real-codes-no-directive";
const REAL_TEMPLATE = runnerText(REAL, "templates/notes.template.md");
const REAL_TARGET = runnerText(REAL, "notes/real.md");

/** Spec 4.3 codes and DIR5 anchors of `REAL_TARGET` (9 errors, then the warning MTL202). */
const REAL_EXPECTED: readonly Expected[] = [
  { code: "MTL201", line: 2 }, // title: (key present, empty value: anchored on the key line)
  { code: "MTL302", line: 3 }, // slug: Not_Kebab, [format:kebab-case]
  { code: "MTL508", line: 4 }, // port: abc, [int]
  { code: "MTL517", line: 5 }, // status: other, draft | done
  { code: "MTL401", line: 6 }, // tags: [a], [count:min:2]
  { code: "MTL404", line: 7 }, // level: 50, [range:max:10]
  { code: "MTL407", line: 8 }, // dates descending, [order:ascending]
  { code: "MTL301", line: 9 }, // kind: other, [format:constant:fixed]
  { code: "MTL202", line: 10 }, // extra: unknown key (warning)
  { code: "MTL701", line: 15 }, // ## Overview, empty section body
];

/**
 * The one template warning (spec 2.9): `dates` (`[list-of-date]`) has no
 * [format:elements:date]. MTL016 sits on column 1 of the template key line.
 */
const datesWithoutFormat = (line: number) => [
  {
    code: "MTL016",
    severity: "warning",
    message: "Field 'dates' (type=list-of-date): no [format:elements:date], default date formats apply",
    position: { line, column: 1 },
  },
];

const VERBS: readonly Verb[] = ["disable-line", "disable-next-line", "disable", "begin disable"];
const CARRIERS: readonly FileCarrier[] = ["html", "frontmatter"];

describe("real codes without any directive (fail- baseline)", () => {
  it("each of the 10 real rules fires on its spec line, nothing else", async () => {
    const result = await lint(REAL_TEMPLATE, REAL_TARGET);
    expect(result.warnings).toEqual(datesWithoutFormat(8));
    expect(signature(result.diagnostics)).toEqual(sign(REAL_EXPECTED));
    expect(result.suppressed).toBe(0);
  });

  it("MTL202 is a warning, the other nine are errors", async () => {
    const { diagnostics } = await lint(REAL_TEMPLATE, REAL_TARGET);
    const warnings = diagnostics.filter((diagnostic) => diagnostic.severity === "warning");
    expect(warnings.map((diagnostic) => diagnostic.code)).toEqual(["MTL202"]);
    expect(diagnostics).toHaveLength(10);
  });

  it("the project exits 1 and the JSON report lists the nine errors and the warning", async () => {
    // The anchor line is internal (DIR5): JSON has no `line` for it; the quoted source lines
    // are pinned by expected.pretty.txt of the fixture (runner suppress test).
    const result = await runFixture(REAL);
    expect(result.summary.exitCode).toBe(1);
    const json = JSON.parse(report(result, { format: "json", version: "1.0.0" }).stdout) as {
      summary: { suppressed: number };
      results: { files: { errors: { code: string }[]; warnings: { code: string }[] }[] }[];
    };
    const [file] = json.results[0]?.files ?? [];
    expect(file?.errors.map((entry) => entry.code).sort()).toEqual(
      REAL_EXPECTED.filter((entry) => entry.code !== "MTL202")
        .map((entry) => entry.code)
        .sort(),
    );
    expect(file?.warnings.map((entry) => entry.code)).toEqual(["MTL202"]);
    expect(json.summary.suppressed).toBe(0);
  });
});

describe("real codes: every code x every verb on the baseline text", () => {
  const closing = closingFence(REAL_TARGET);

  for (const verb of VERBS) {
    for (const entry of REAL_EXPECTED) {
      it(`${verb} ${entry.code}: that finding vanishes, the other nine stay, suppressed is 1`, async () => {
        const edit = lineEdit(verb, entry.code, entry.line ?? 0, closing);
        const { text, remap } = apply(REAL_TARGET, edit);
        const result = await lint(REAL_TEMPLATE, text);
        const rest = REAL_EXPECTED.filter((other) => other.code !== entry.code).map((other) => ({
          code: other.code,
          line: other.line === null ? null : remap(other.line),
        }));
        expect(signature(result.diagnostics)).toEqual(sign(rest));
        expect(result.suppressed).toBe(1);
      });
    }
  }

  for (const carrier of CARRIERS) {
    for (const entry of REAL_EXPECTED) {
      it(`disable-file (${carrier}) ${entry.code}: that finding vanishes, the other nine stay, suppressed is 1`, async () => {
        const { text, remap } = apply(REAL_TARGET, fileEdit(carrier, entry.code, closing));
        const result = await lint(REAL_TEMPLATE, text);
        const rest = REAL_EXPECTED.filter((other) => other.code !== entry.code).map((other) => ({
          code: other.code,
          line: other.line === null ? null : remap(other.line),
        }));
        expect(signature(result.diagnostics)).toEqual(sign(rest));
        expect(result.suppressed).toBe(1);
      });
    }
  }

  it("a directive for another code, on the right line, suppresses nothing", async () => {
    // MTL302 sits on line 3; MTL508 is named there: the codes are matched by code AND line.
    const { text } = apply(REAL_TARGET, lineEdit("disable-line", "MTL508", 3, closing));
    const result = await lint(REAL_TEMPLATE, text);
    expect(signature(result.diagnostics)).toEqual(sign(REAL_EXPECTED));
    expect(result.suppressed).toBe(0);
  });

  it("the right code on the wrong line suppresses nothing", async () => {
    const { text } = apply(REAL_TARGET, lineEdit("disable-line", "MTL302", 4, closing));
    const result = await lint(REAL_TEMPLATE, text);
    expect(signature(result.diagnostics)).toEqual(sign(REAL_EXPECTED));
    expect(result.suppressed).toBe(0);
  });
});

describe("real codes: the passing projects are the baseline plus directives only", () => {
  const PASSING = [
    "suppress-pass-real-disable-line",
    "suppress-pass-real-disable-next-line",
    "suppress-pass-real-disable-open",
    "suppress-pass-real-begin-end-block",
    "suppress-pass-real-disable-file-html",
    "suppress-pass-real-disable-file-frontmatter",
  ];

  for (const name of PASSING) {
    it(`${name}: directives gone gives the baseline text; with them nothing is reported`, async () => {
      const target = runnerText(name, "notes/real.md");
      expect(runnerText(name, "templates/notes.template.md")).toBe(REAL_TEMPLATE);
      expect(stripDirectives(target)).toBe(REAL_TARGET);
      const withDirectives = await lint(REAL_TEMPLATE, target);
      expect(withDirectives.diagnostics).toEqual([]);
      expect(withDirectives.suppressed).toBe(10);
      const without = await lint(REAL_TEMPLATE, stripDirectives(target));
      expect(signature(without.diagnostics)).toEqual(sign(REAL_EXPECTED));
      expect(without.suppressed).toBe(0);
    });

    it(`${name}: the project exits 0 and counts 10 suppressed`, async () => {
      const result = await runFixture(name);
      expect(result.summary).toMatchObject({ exitCode: 0, failed: 0, warnings: 0, suppressed: 10 });
    });
  }
});

// ---------------------------------------------------------------------------------------
// Codes without anchor, and MTL603.
// ---------------------------------------------------------------------------------------

const UNANCHORED = "suppress-fail-unanchored-no-directive";
const UNANCHORED_TEMPLATE = runnerText(UNANCHORED, "templates/notes.template.md");
const UNANCHORED_TARGET = runnerText(UNANCHORED, "notes/Bad_Name.md");
const UNANCHORED_PATH = "notes/Bad_Name.md";

/**
 * `MTL603` is anchored on the line of the template-only heading (DIR5); the others are not.
 * Positional matching (spec 2.6, 2.10, ADR 0012): the level-2 sequence is Overview, Details,
 * Context over the free siblings Details (L7), Overview (L9) (`Guidance`, L11, is set aside by
 * its template-only heading, step 1). `Overview` looks at `Details`: missing. `Details` takes
 * it. `Context` looks at `Overview`: missing. So the swapped pair is TWO `MTL601`, and there is
 * no `MTL604` (a same-level swap cannot be an order error, 2.6 "Order"). `Overview` (L9) is
 * left in the tail: the warning `MTL616`, anchored on it (docs/grammar.md "Extra").
 */
const UNANCHORED_EXPECTED: readonly Expected[] = [
  { code: "MTL101", line: null }, // file name Bad_Name, [filename:case:kebab-case]
  { code: "MTL201", line: null }, // owner is missing: no key line
  { code: "MTL601", line: null }, // 'Overview' is missing (the next sibling is `Details`)
  { code: "MTL601", line: null }, // 'Context' is missing (the next sibling is `Overview`)
  { code: "MTL603", line: 11 }, // ## Guidance is template-only
  { code: "MTL616", line: 9 }, // ## Overview is an extra in the tail (a warning, printed last)
];
/** The codes of the findings without line, each once (a code may fire several times). */
const NO_ANCHOR_CODES = [...new Set(UNANCHORED_EXPECTED.filter((entry) => entry.line === null).map((e) => e.code))];
const ALL_CODES = [...new Set(UNANCHORED_EXPECTED.map((entry) => entry.code))];
/** `UNANCHORED_EXPECTED` without the findings of `code`. */
const without = (code: string): Expected[] => UNANCHORED_EXPECTED.filter((other) => other.code !== code);
/** How many findings `code` has in `UNANCHORED_EXPECTED` (the suppressed count of its disable-file). */
const countOf = (code: string): number => UNANCHORED_EXPECTED.filter((other) => other.code === code).length;

describe("codes without anchor (MTL101, MTL201 missing, MTL601 twice) and MTL603", { tags: ["MTL101", "MTL201", "MTL601", "MTL603", "filename", "presence", "heading"] }, () => {
  const closing = closingFence(UNANCHORED_TARGET);
  const run = (text: string) => lint(UNANCHORED_TEMPLATE, text, UNANCHORED_PATH);

  it("baseline: the five errors and the MTL616 warning fire, only MTL603 and MTL616 have a line, exit 1", async () => {
    const result = await run(UNANCHORED_TARGET);
    expect(signature(result.diagnostics)).toEqual(sign(UNANCHORED_EXPECTED));
    expect(result.suppressed).toBe(0);
    expect((await runFixture(UNANCHORED)).summary.exitCode).toBe(1);
  });

  // DIR7: a diagnostic without anchor is covered ONLY by disable-file. A line directive can
  // be put on the first key line, on the last heading line or open from the top: no effect.
  for (const verb of VERBS) {
    for (const code of NO_ANCHOR_CODES) {
      for (const anchor of [2, 11]) {
        it(`${verb} ${code} at line ${anchor}: still reported, suppressed 0`, async () => {
          const { text, remap } = apply(UNANCHORED_TARGET, lineEdit(verb, code, anchor, closing));
          const result = await run(text);
          const expected = UNANCHORED_EXPECTED.map((other) => ({
            code: other.code,
            line: other.line === null ? null : remap(other.line),
          }));
          expect(signature(result.diagnostics)).toEqual(sign(expected));
          expect(result.suppressed).toBe(0);
        });
      }
    }
  }

  it("an open disable at the top, never closed, still does not cover them", async () => {
    const codes = NO_ANCHOR_CODES.join(", ");
    const { text, remap } = apply(UNANCHORED_TARGET, {
      appends: new Map(),
      inserts: [{ at: 2, text: fm(`disable ${codes}`) }],
    });
    const result = await run(text);
    const expected = UNANCHORED_EXPECTED.map((other) => ({
      code: other.code,
      line: other.line === null ? null : remap(other.line),
    }));
    expect(signature(result.diagnostics)).toEqual(sign(expected));
    expect(result.suppressed).toBe(0);
  });

  // ... and disable-file covers each of them, with both carriers.
  for (const carrier of CARRIERS) {
    for (const code of ALL_CODES) {
      it(`disable-file (${carrier}) ${code}: covered (all ${countOf(code)}), the others stay`, async () => {
        const { text, remap } = apply(UNANCHORED_TARGET, fileEdit(carrier, code, closing));
        const result = await run(text);
        const rest = without(code).map((other) => ({
          code: other.code,
          line: other.line === null ? null : remap(other.line),
        }));
        expect(signature(result.diagnostics)).toEqual(sign(rest));
        expect(result.suppressed).toBe(countOf(code));
      });
    }
  }

  // T4: MTL603 has an anchor (the heading line), so each line or range verb covers it.
  const guidance = 11;
  const lineVerbs: readonly [string, Edit][] = [
    ["disable-line", lineEdit("disable-line", "MTL603", guidance, closing)],
    ["disable-next-line", lineEdit("disable-next-line", "MTL603", guidance, closing)],
    ["disable", lineEdit("disable", "MTL603", guidance, closing)],
    ["begin disable ... end disable", lineEdit("begin disable", "MTL603", guidance, closing)],
    [
      "disable ... end disable",
      {
        appends: new Map([[guidance, ` ${html("end disable MTL603")}`]]),
        inserts: [{ at: guidance, text: html("disable MTL603") }],
      },
    ],
  ];
  for (const [verb, edit] of lineVerbs) {
    it(`MTL603 is covered by ${verb}: the others stay, suppressed 1`, async () => {
      const { text } = apply(UNANCHORED_TARGET, edit);
      const result = await run(text);
      // The other four errors have no line and the MTL616 line (9) is before every inserted
      // line: the edits do not move anything under test.
      const rest = without("MTL603");
      expect(signature(result.diagnostics)).toEqual(sign(rest));
      expect(result.suppressed).toBe(1);
    });
  }

  it("MTL603 on the line before the heading is not covered by disable-line", async () => {
    const { text, remap } = apply(UNANCHORED_TARGET, lineEdit("disable-line", "MTL603", 9, closing));
    const result = await run(text);
    expect(signature(result.diagnostics)).toEqual(sign(UNANCHORED_EXPECTED.map((o) => ({ code: o.code, line: o.line && remap(o.line) }))));
    expect(result.suppressed).toBe(0);
  });

  it("MTL101 (file name) is covered by disable-file only", async () => {
    for (const carrier of CARRIERS) {
      const { text } = apply(UNANCHORED_TARGET, fileEdit(carrier, "MTL101", closing));
      const result = await run(text);
      expect(result.diagnostics.map((diagnostic) => diagnostic.code)).not.toContain("MTL101");
      expect(result.suppressed).toBe(1);
    }
    // The same name with a kebab-case path: the finding does not exist.
    const fixed = await lint(UNANCHORED_TEMPLATE, UNANCHORED_TARGET, "notes/good-name.md");
    expect(fixed.diagnostics.map((diagnostic) => diagnostic.code)).not.toContain("MTL101");
  });

  it("the line-verbs project reports the four findings without anchor, suppresses only MTL603, exit 1", async () => {
    const name = "suppress-fail-unanchored-line-verbs";
    const target = runnerText(name, "notes/Bad_Name.md");
    expect(stripDirectives(target)).toBe(UNANCHORED_TARGET);
    const result = await run(target);
    expect(result.diagnostics.map((diagnostic) => diagnostic.code).sort()).toEqual(["MTL101", "MTL201", "MTL601", "MTL601", "MTL616"]);
    expect(result.suppressed).toBe(1);
    expect((await runFixture(name)).summary).toMatchObject({ exitCode: 1, suppressed: 1 });
  });

  // MTL604 has no anchor either (DIR7). A same-level swap no longer reaches it (positional
  // matching, spec 2.6 "Order"); an order ACROSS levels does: the H2 `Overview` matches before
  // the H1 `Notes` that precedes it in the template.
  describe("MTL604 across levels (no anchor)", { tags: ["MTL604", "heading"] }, () => {
    const template = ["---", "title: string", "---", "", "# Notes", "", "## Overview", ""].join("\n");
    const target = ["---", "title: x", "---", "", "## Overview", "", "# Notes", ""].join("\n");
    const runOrder = (text: string) => lint(template, text, "notes/order.md");
    const baseClosing = closingFence(target);

    it("baseline: one MTL604 without line", async () => {
      const result = await runOrder(target);
      expect(signature(result.diagnostics)).toEqual(["MTL604@none"]);
    });

    it("a line verb on the heading lines does not cover it", async () => {
      for (const verb of VERBS) {
        const { text } = apply(target, lineEdit(verb, "MTL604", 5, baseClosing));
        const result = await runOrder(text);
        expect(signature(result.diagnostics), verb).toEqual(["MTL604@none"]);
        expect(result.suppressed, verb).toBe(0);
      }
    });

    for (const carrier of CARRIERS) {
      it(`disable-file (${carrier}) covers it, suppressed 1`, async () => {
        const { text } = apply(target, fileEdit(carrier, "MTL604", baseClosing));
        const result = await runOrder(text);
        expect(result.diagnostics).toEqual([]);
        expect(result.suppressed).toBe(1);
      });
    }
  });

  it("the disable-file project suppresses all five, exit 0", async () => {
    const name = "suppress-pass-unanchored-disable-file";
    const target = runnerText(name, "notes/Bad_Name.md");
    expect(stripDirectives(target)).toBe(UNANCHORED_TARGET);
    const result = await run(target);
    // The project names the five error findings only: the MTL616 warning stays (line 11 there).
    expect(signature(result.diagnostics)).toEqual(["MTL616@11"]);
    expect(result.suppressed).toBe(5);
    expect((await runFixture(name)).summary).toMatchObject({ exitCode: 0, suppressed: 5 });
  });
});

// ---------------------------------------------------------------------------------------
// MTL804 (io warning), with the in-memory io of the unit tests.
// ---------------------------------------------------------------------------------------

describe("MTL804 (io:exists warning)", { tags: ["MTL804", "io"] }, () => {
  const dir = (name: string, file: string): string => readFileSync(join(fixturePath("suppression", name), file), "utf8");
  const template = dir("fail-io-path-missing-warning-reported", "template.md");
  const target = dir("fail-io-path-missing-warning-reported", "target.md");
  const closing = closingFence(target);
  const key = 3;

  it("baseline: the warning fires on the key line and does not fail the run", async () => {
    const result = await lint(template, target);
    expect(signature(result.diagnostics)).toEqual(["MTL804@3"]);
    expect(result.diagnostics[0]?.severity).toBe("warning");
    expect(result.suppressed).toBe(0);
  });

  for (const verb of VERBS) {
    it(`${verb}: MTL804 vanishes, suppressed is 1`, async () => {
      const { text } = apply(target, lineEdit(verb, "MTL804", key, closing));
      const result = await lint(template, text);
      expect(result.diagnostics).toEqual([]);
      expect(result.suppressed).toBe(1);
    });
  }

  for (const carrier of CARRIERS) {
    it(`disable-file (${carrier}): MTL804 vanishes, suppressed is 1`, async () => {
      const { text } = apply(target, fileEdit(carrier, "MTL804", closing));
      const result = await lint(template, text);
      expect(result.diagnostics).toEqual([]);
      expect(result.suppressed).toBe(1);
    });
  }
});

// ---------------------------------------------------------------------------------------
// Blocks (begin/end disable, open disable) over SEVERAL findings, real rules (DIR1, DIR7).
// ---------------------------------------------------------------------------------------

describe("a block over several findings", () => {
  const BASE_A = "suppress-fail-block-same-code-no-comment";
  const BASE_B = "suppress-fail-block-two-codes-no-comment";
  const BASE_C = "suppress-fail-block-three-no-comment";
  const template = runnerText(BASE_A, "templates/notes.template.md");
  const text = (name: string): string => runnerText(name, "notes/block.md");
  const run = (target: string) => lint(template, target, "notes/block.md");

  const A: readonly Expected[] = [
    { code: "MTL202", line: 5 }, // extra_one
    { code: "MTL202", line: 6 }, // extra_two
    { code: "MTL701", line: 11 }, // ## Overview, empty
    { code: "MTL701", line: 13 }, // ## Details, empty
  ];
  const B: readonly Expected[] = [
    { code: "MTL302", line: 3 }, // slug: Not_Kebab
    { code: "MTL508", line: 4 }, // port: abc
  ];
  const C: readonly Expected[] = [
    { code: "MTL202", line: 4 }, // extra_one
    { code: "MTL508", line: 5 }, // port: abc
    { code: "MTL202", line: 6 }, // extra_two
  ];

  // Every case has a baseline without comment whose real errors fire.
  for (const [name, expected] of [
    [BASE_A, A],
    [BASE_B, B],
    [BASE_C, C],
  ] as const) {
    it(`${name}: the real findings fire at their lines, nothing suppressed, exit 1`, async () => {
      expect(runnerText(name, "templates/notes.template.md")).toBe(template);
      const result = await run(text(name));
      expect(signature(result.diagnostics)).toEqual(sign(expected));
      expect(result.suppressed).toBe(0);
      expect((await runFixture(name)).summary.exitCode).toBe(1);
    });
  }

  // 7a: one block, several findings of the SAME code, all suppressed.
  for (const name of ["suppress-pass-block-same-code-begin-end", "suppress-pass-block-same-code-open-disable"]) {
    it(`${name}: two MTL202 and two MTL701 inside the ranges, all four suppressed, exit 0`, async () => {
      expect(runnerText(name, "templates/notes.template.md")).toBe(template);
      expect(stripDirectives(text(name))).toBe(text(BASE_A));
      const result = await run(text(name));
      expect(result.diagnostics).toEqual([]);
      expect(result.suppressed).toBe(4);
      expect((await runFixture(name)).summary).toMatchObject({ exitCode: 0, suppressed: 4 });
    });
  }

  // 7b: one block naming two codes covers both.
  it("suppress-pass-block-two-codes-begin-end: begin disable MTL302, MTL508 covers both, exit 0", async () => {
    const name = "suppress-pass-block-two-codes-begin-end";
    expect(stripDirectives(text(name))).toBe(text(BASE_B));
    const result = await run(text(name));
    expect(result.diagnostics).toEqual([]);
    expect(result.suppressed).toBe(2);
    expect((await runFixture(name)).summary).toMatchObject({ exitCode: 0, suppressed: 2 });
  });

  // 7c: two errors in the block, only one code named: the other stays.
  it("suppress-fail-block-one-of-two-codes-suppressed: MTL302 gone, MTL508 inside the block stays, exit 1", async () => {
    const name = "suppress-fail-block-one-of-two-codes-suppressed";
    expect(stripDirectives(text(name))).toBe(text(BASE_B));
    const result = await run(text(name));
    expect(signature(result.diagnostics)).toEqual(["MTL508@5"]);
    expect(result.diagnostics[0]?.severity).toBe("error");
    expect(result.suppressed).toBe(1);
    expect((await runFixture(name)).summary).toMatchObject({ exitCode: 1, suppressed: 1 });
  });

  // 7d: the block names A (twice in it) while it also holds B: B stays.
  it("suppress-fail-block-lists-one-code-of-two: both MTL202 gone, the MTL508 between them stays, exit 1", async () => {
    const name = "suppress-fail-block-lists-one-code-of-two";
    expect(stripDirectives(text(name))).toBe(text(BASE_C));
    const result = await run(text(name));
    expect(signature(result.diagnostics)).toEqual(["MTL508@6"]);
    expect(result.suppressed).toBe(2);
    expect((await runFixture(name)).summary).toMatchObject({ exitCode: 1, suppressed: 2 });
  });

  // Range edges on the same baseline text: a block stops at its `end disable` line.
  it("a block closed after the first of two findings of one code leaves the second reported", async () => {
    const edit: Edit = {
      appends: new Map(),
      inserts: [
        { at: 5, text: fm("begin disable MTL202") },
        { at: 6, text: fm("end disable MTL202") },
      ],
    };
    const { text: target, remap } = apply(text(BASE_A), edit);
    const result = await run(target);
    const rest = A.filter((entry) => entry.line !== 5).map((entry) => ({
      code: entry.code,
      line: remap(entry.line ?? 0),
    }));
    expect(signature(result.diagnostics)).toEqual(sign(rest));
    expect(result.suppressed).toBe(1);
  });

  it("a block opened after the first of two findings of one code leaves the first reported", async () => {
    const edit: Edit = {
      appends: new Map(),
      inserts: [
        { at: 6, text: fm("begin disable MTL202") },
        { at: 7, text: fm("end disable MTL202") },
      ],
    };
    const { text: target, remap } = apply(text(BASE_A), edit);
    const result = await run(target);
    const rest = A.filter((entry) => entry.line !== 6).map((entry) => ({
      code: entry.code,
      line: remap(entry.line ?? 0),
    }));
    expect(signature(result.diagnostics)).toEqual(sign(rest));
    expect(result.suppressed).toBe(1);
  });
});

// ---------------------------------------------------------------------------------------
// Directives in a template are inert (DIR4).
// ---------------------------------------------------------------------------------------

describe("a directive in the TEMPLATE suppresses nothing (DIR4)", () => {
  const codes = REAL_EXPECTED.map((entry) => entry.code).join(", ");

  it("html carrier in the template body: MTL302 and the others are still reported", async () => {
    const template = REAL_TEMPLATE.replace("# Notes", `${html(`disable-file ${codes}`)}\n\n# Notes`);
    expect(template).not.toBe(REAL_TEMPLATE);
    const result = await lint(template, REAL_TARGET);
    expect(result.warnings).toEqual(datesWithoutFormat(8));
    expect(signature(result.diagnostics)).toEqual(sign(REAL_EXPECTED));
    expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toContain("MTL302");
    expect(result.suppressed).toBe(0);
  });

  it("frontmatter carrier in the template (whole line and trailing): MTL302 still reported", async () => {
    const lines = REAL_TEMPLATE.split("\n");
    lines.splice(1, 0, fm(`disable-file ${codes}`));
    const template = lines.join("\n").replace("[format:kebab-case]", `[format:kebab-case] # ${KEYWORD} disable-line MTL302`);
    expect(template).toContain(`# ${KEYWORD} disable-line MTL302`);
    const result = await lint(template, REAL_TARGET);
    // One comment line inserted above the keys: `dates` moves to line 9.
    expect(result.warnings).toEqual(datesWithoutFormat(9));
    expect(signature(result.diagnostics)).toEqual(sign(REAL_EXPECTED));
    expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toContain("MTL302");
    expect(result.suppressed).toBe(0);
  });
});

// ---------------------------------------------------------------------------------------
// A directive comment as the whole section body (DIR4: comments stay part of the body text).
// ---------------------------------------------------------------------------------------

describe("a directive comment placed right after a heading is section body", () => {
  const name = "pass-directive-comment-only-body-counts-as-content";
  const read = (file: string): string => readFileSync(join(fixturePath("suppression", name), file), "utf8");
  const template = read("template.md");
  const target = read("target.md");

  // Spec 4.4 DIR4: "Directive comments stay part of the section body text, so a directive line
  // counts as a non-blank line for MTL701, MTL704 and MTL705. Put a directive about a section
  // on its heading line to keep the body unchanged." Spec 2.6: HTML comments are prose.
  it("the comment is the only body line: MTL701 does not fire, the directive still works", async () => {
    const result = await lint(template, target);
    expect(result.diagnostics).toEqual([]);
    expect(result.suppressed).toBe(1);
  });

  it("without the comment the body is blank: MTL701 fires on the heading line, MTL202 is back", async () => {
    const result = await lint(template, stripDirectives(target));
    expect(signature(result.diagnostics)).toEqual(["MTL202@3", "MTL701@8"]);
  });

  it("an ordinary HTML comment as the body counts the same way (prose)", async () => {
    const result = await lint(template, target.replace(html("disable-file MTL202"), "<!-- note -->"));
    expect(signature(result.diagnostics)).toEqual(["MTL202@3"]);
  });

  it("a directive on the heading line keeps the body blank: MTL701 fires", async () => {
    const onHeading = stripDirectives(target).replace("## Overview", `## Overview ${html("disable-line MTL202")}`);
    const result = await lint(template, onHeading);
    expect(signature(result.diagnostics)).toEqual(["MTL202@3", "MTL701@8"]);
    expect(result.suppressed).toBe(0);
  });
});
