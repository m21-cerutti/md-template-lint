/**
 * Python `str.isspace()` whitespace set in the content rules MTL701-MTL705
 * (src/rules/content.ts, docs/spec.md 2.6). The characters are built from
 * code points, so this file stays plain ASCII (the Write tool cannot store
 * U+001C-001F, U+0085 or the no-break space class in a fixture file).
 * Driven through the public pipeline (checkTemplate / checkTarget).
 */
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../src/engine/pipeline.js";
import { createRegistry } from "../../src/engine/registry.js";
import { createEnv } from "../../src/engine/rule.js";

const registry = createRegistry();

const range = (from: number, to: number): number[] =>
  Array.from({ length: to - from + 1 }, (_, index) => from + index);

/**
 * Python whitespace the rules must treat as blank: tab, vertical tab, form
 * feed, the C0 separators, NEL, NBSP and the Unicode spaces. LF is the line
 * separator and CR never reaches a rule: the loader turns CRLF and a lone CR
 * into LF first (spec 1.1, `normalizeLineEnds`), so U+000D has no test here.
 */
const BLANK: readonly number[] = [
  0x09,
  ...range(0x0b, 0x0c),
  ...range(0x1c, 0x1f),
  0x85,
  0xa0,
  0x1680,
  ...range(0x2000, 0x200a),
  0x2028,
  0x2029,
  0x202f,
  0x205f,
];

/** Neighbours of every range edge of the set: not whitespace for Python. */
const NOT_BLANK: readonly number[] = [
  0x08, 0x0e, 0x1b, 0x21, 0x84, 0x86, 0xa1, 0x167f, 0x1681, 0x1fff, 0x2010, 0x2027, 0x202e, 0x2030,
  0x205e, 0x2060, 0x2fff, 0x3001,
];

const label = (codePoint: number): string =>
  `U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}`;

const BLANK_CASES = BLANK.map((codePoint) => [label(codePoint), codePoint] as const);
const NOT_BLANK_CASES = NOT_BLANK.map((codePoint) => [label(codePoint), codePoint] as const);

/** Diagnostics of `code` for a one-section template (`heading` tags) and a target body. */
async function lint(code: string, tags: string, body: string): Promise<string[]> {
  const status = await checkTemplate(
    registry,
    `---\ntitle: "string"\n---\n\n## Body ${tags}\n\nTemplate text.\n`,
  );
  if (status.status !== "ok") throw new Error("template is broken");
  expect(status.warnings).toEqual([]);
  const found = await checkTarget(
    registry,
    status.model,
    `---\ntitle: "x"\n---\n\n## Body\n${body}\n`,
    "target.md",
    createEnv(),
  );
  return found.filter((diagnostic) => diagnostic.code === code).map((d) => d.message);
}

describe("MTL701 content-non-empty: a body of only one character", () => {
  const MESSAGE = "Section 'Body': [content:non-empty] section body is empty";

  it.each(BLANK_CASES)("%s is blank: the body is empty", async (_label, codePoint) => {
    const char = String.fromCodePoint(codePoint);
    expect(await lint("MTL701", "[content:non-empty]", `${char}\n${char}${char}`)).toEqual([
      MESSAGE,
    ]);
  });

  it.each(NOT_BLANK_CASES)("%s is not blank: the body has text", async (_label, codePoint) => {
    const char = String.fromCodePoint(codePoint);
    expect(await lint("MTL701", "[content:non-empty]", char)).toEqual([]);
  });
});

describe("MTL702 content-table: whitespace around a row", () => {
  const MESSAGE = "Section 'Body': [content:table] no markdown table row found";

  it.each(BLANK_CASES)("%s around | a | is trimmed: a row", async (_label, codePoint) => {
    const char = String.fromCodePoint(codePoint);
    expect(await lint("MTL702", "[content:table]", `${char}| a |${char}`)).toEqual([]);
  });

  it.each(NOT_BLANK_CASES)("%s before | a | is not trimmed: no row", async (_label, codePoint) => {
    const char = String.fromCodePoint(codePoint);
    expect(await lint("MTL702", "[content:table]", `${char}| a |${char}`)).toEqual([MESSAGE]);
  });
});

describe("MTL703 content-list: whitespace after the marker", () => {
  const MESSAGE = "Section 'Body': [content:list] no markdown list item found";

  it.each(BLANK_CASES)("-%s then text is a list item", async (_label, codePoint) => {
    const char = String.fromCodePoint(codePoint);
    expect(await lint("MTL703", "[content:list]", `-${char}a`)).toEqual([]);
  });

  it.each(NOT_BLANK_CASES)("-%s then text is not a list item", async (_label, codePoint) => {
    const char = String.fromCodePoint(codePoint);
    expect(await lint("MTL703", "[content:list]", `-${char}a`)).toEqual([MESSAGE]);
  });
});

describe("MTL704 content-min-lines: a line of only one character is not counted", () => {
  it.each(BLANK_CASES)("%s line is blank: only 1 non-blank line", async (_label, codePoint) => {
    const char = String.fromCodePoint(codePoint);
    expect(await lint("MTL704", "[content:min-lines:2]", `Line one.\n${char}`)).toEqual([
      "Section 'Body': [content:min-lines:2] only 1 non-blank line(s)",
    ]);
  });

  it.each(NOT_BLANK_CASES)("%s line is text: 2 non-blank lines", async (_label, codePoint) => {
    const char = String.fromCodePoint(codePoint);
    expect(await lint("MTL704", "[content:min-lines:2]", `Line one.\n${char}`)).toEqual([]);
  });
});

describe("MTL705 content-max-lines: a line of only one character is not counted", () => {
  it.each(BLANK_CASES)("%s line is blank: 1 non-blank line", async (_label, codePoint) => {
    const char = String.fromCodePoint(codePoint);
    expect(await lint("MTL705", "[content:max-lines:1]", `Line one.\n${char}`)).toEqual([]);
  });

  it.each(NOT_BLANK_CASES)("%s line is text: 2 non-blank lines", async (_label, codePoint) => {
    const char = String.fromCodePoint(codePoint);
    expect(await lint("MTL705", "[content:max-lines:1]", `Line one.\n${char}`)).toEqual([
      "Section 'Body': [content:max-lines:1] 2 non-blank line(s)",
    ]);
  });
});
