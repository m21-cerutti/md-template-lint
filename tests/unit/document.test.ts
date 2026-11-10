import { describe, expect, it } from "vitest";
import { isMap, isScalar, parseDocument as parseYaml } from "yaml";
import { checkTarget, checkTemplate } from "../../src/engine/pipeline.js";
import { createRegistry } from "../../src/engine/registry.js";
import { createEnv, createMemoryIo } from "../../src/engine/rule.js";
import {
  loadDocument,
  parseDocument,
  type BodyHeading,
  type DocumentModel,
  type FrontmatterLine,
} from "../../src/index.js";

const doc = (...lines: string[]) => parseDocument(lines.join("\n"));
const headings = (blocks: ReturnType<typeof parseDocument>["body"]): BodyHeading[] =>
  blocks.filter((b): b is BodyHeading => b.kind === "heading");
const keyLine = (lines: readonly FrontmatterLine[], key: string) =>
  lines.find((l) => l.kind === "key" && l.key === key);

describe("document structure", () => {
  it("splits frontmatter and body regions", () => {
    const result = doc(
      "---",
      "# [filename:case:snake_case]",
      'id: "string" # [presence:required] [value:filename]',
      "tags: [a, b] # [count:min:1]",
      "meta:",
      "  sub: x # [presence:optional]",
      "---",
      "# Title [presence:required]",
      "",
      "## Overview [content:non-empty]",
      "Text with [count:min:1] inside.",
    );
    expect(result.findings).toEqual([]);
    const fm = result.frontmatter;
    expect(fm).toMatchObject({ startLine: 1, endLine: 7 });
    expect(fm?.filename).toMatchObject({
      convention: "snake_case",
      position: { line: 2, column: 3 },
    });
    expect(fm?.lines.map((l) => l.kind)).toEqual(["filename", "key", "key", "key", "other"]);
    expect(fm?.yaml).toContain('id: "string"');
    expect(result.body.map((b) => b.kind)).toEqual(["heading", "blank", "heading", "text"]);
  });

  it("(a) recognizes frontmatter tags in a key comment, located in the file", () => {
    const result = doc("---", "id: x # [presence:optional] [count:max:3]", "---", "# T");
    const line = keyLine(result.frontmatter?.lines ?? [], "id");
    expect(line).toMatchObject({
      kind: "key",
      line: 2,
      comment: {
        text: "[presence:optional] [count:max:3]",
        tags: [
          {
            region: "frontmatter",
            kind: "presence",
            mode: "optional",
            position: { line: 2, column: 9 },
          },
          { region: "frontmatter", kind: "count", bound: "max", value: 3 },
        ],
      },
    });
  });

  it("(b) recognizes body tags on a heading", () => {
    const result = doc("---", "a: b", "---", "## Notes [presence:optional] [content:list]");
    expect(headings(result.body)).toMatchObject([
      {
        level: 2,
        line: 4,
        text: "Notes",
        tags: [
          { region: "body", kind: "presence", mode: "optional", position: { line: 4, column: 10 } },
          { region: "body", kind: "content", check: "list" },
        ],
      },
    ]);
  });

  it("(c) reports tags in the wrong region with line and column", () => {
    const result = doc("---", "a: b # [content:table]", "---", "## Notes [format:snake_case]");
    expect(result.findings).toMatchObject([
      {
        reason: "wrong-region",
        region: "frontmatter",
        tag: "[content:table]",
        position: { line: 2, column: 8 },
        subject: { field: "a" },
      },
      {
        reason: "wrong-region",
        region: "body",
        tag: "[format:snake_case]",
        position: { line: 4, column: 10 },
        subject: { heading: "Notes [format:snake_case]" },
      },
    ]);
  });

  it("(d) ignores tags and headings inside fenced code and one-line HTML comments", () => {
    const result = doc(
      "# Real [presence:optional]",
      "````md",
      "## Fake [presence:bogus]",
      "```",
      "## Still code [count:min:x]",
      "````",
      "<!-- ## Hidden [content:x] -->",
      "  ~~~",
      "# Tilde code [presence:optional]",
      "~~~~",
      "## After",
    );
    expect(result.findings).toEqual([]);
    expect(result.body.map((b) => b.kind)).toEqual([
      "heading",
      "fence",
      "html-comment",
      "fence",
      "heading",
    ]);
    expect(result.body[1]).toMatchObject({
      kind: "fence",
      line: 2,
      endLine: 6,
      marker: "````",
      closed: true,
    });
    expect(headings(result.body).map((h) => h.text)).toEqual(["Real", "After"]);
  });

  it("keeps headings inside a multi-line HTML comment (legacy limitation)", () => {
    const result = doc("<!--", "## Inside", "-->");
    expect(headings(result.body).map((h) => h.text)).toEqual(["Inside"]);
  });

  it("does not open a fence indented by four spaces, and an unclosed fence runs to the end", () => {
    expect(doc("    ```", "## Visible").body.map((b) => b.kind)).toEqual(["text", "heading"]);
    expect(doc("```", "## Hidden").body).toMatchObject([{ kind: "fence", closed: false }]);
  });

  it("(e) parses a document without frontmatter", () => {
    const result = doc("# Title", "", "- item", "| a | b |", "plain");
    expect(result.frontmatter).toBeNull();
    expect(result.body.map((b) => b.kind)).toEqual([
      "heading",
      "blank",
      "list-item",
      "table-row",
      "text",
    ]);
  });

  it("reports an unclosed frontmatter block (rest stays in frontmatter mode)", () => {
    // The lexer stays in frontmatter mode to the end: no frontmatter (MTL001), no body.
    const result = doc("---", "a: b", "## H");
    expect(result.frontmatter).toBeNull();
    expect(result.frontmatterUnclosed).toBe(true);
    expect(result.body).toEqual([]);
  });

  it("closes the frontmatter at the first delimiter line only", () => {
    const result = doc("---", "a: --- x", "---", "---", "# T");
    expect(result.frontmatter).toMatchObject({ endLine: 3 });
    expect(result.body.map((b) => b.kind)).toEqual(["text", "heading"]);
  });

  it("parses an empty frontmatter, a BOM and CRLF line ends", () => {
    const result = parseDocument("\uFEFF---\r\n---\r\n# T [presence:optional]\r\n");
    expect(result.frontmatter).toMatchObject({ startLine: 1, endLine: 2, yaml: "", lines: [] });
    expect(headings(result.body)).toMatchObject([{ text: "T", tags: [{ mode: "optional" }] }]);
  });

  it("peels tags of every heading level H1 to H6 (spec 2.6, ADR 0009)", () => {
    const result = doc(
      "# One [presence:optional]",
      "### Deep [presence:optional]",
      "#### Four [content:list]",
      "##### Five [presence:required] [content:non-empty]",
      "###### Six [content:max-lines:3]",
      "####### seven [presence:optional]",
    );
    expect(result.body).toMatchObject([
      { kind: "heading", level: 1, text: "One", tags: [{ kind: "presence", mode: "optional" }] },
      {
        kind: "heading",
        level: 3,
        text: "Deep",
        tags: [{ region: "body", kind: "presence", mode: "optional", position: { line: 2 } }],
      },
      { kind: "heading", level: 4, text: "Four", tags: [{ kind: "content", check: "list" }] },
      {
        kind: "heading",
        level: 5,
        text: "Five",
        tags: [
          { kind: "presence", mode: "required" },
          { kind: "content", check: "non-empty" },
        ],
      },
      {
        kind: "heading",
        level: 6,
        text: "Six",
        tags: [{ kind: "content-lines", bound: "max", value: 3 }],
      },
      { kind: "text" },
    ]);
    expect(result.findings).toEqual([]);
  });

  it("uses the key without quotes as the finding subject", () => {
    const result = doc("---", '"my key": x # [nope:x]', "'k2': y # [count:min:z]", "---");
    expect(result.findings.map((f) => f.subject)).toEqual([{ field: "my key" }, { field: "k2" }]);
  });

  it("decodes quoted keys so the subject equals the key the yaml package reports", () => {
    const keyLines = [
      String.raw`'it''s': a # [nope:1]`,
      String.raw`"say \"hi\"": b # [nope:2]`,
      String.raw`"back\\slash": c # [nope:3]`,
      String.raw`"tab\there\nnew\/slash": d # [nope:4]`,
      String.raw`"hex\x41\u00e9\U0001F600": e # [nope:5]`,
      String.raw`"keep\qunknown": f # [nope:6]`,
      "plain key: g # [nope:7]",
    ];
    const source = ["---", ...keyLines, "---", ""].join("\n");
    const subjects = parseDocument(source).findings.map((f) =>
      f.subject !== null && "field" in f.subject ? f.subject.field : null,
    );
    // `\q` is not a YAML escape (yaml rejects it), so that line is left out of the yaml check.
    const valid = keyLines.filter((_, index) => index !== 5);
    const yamlDoc = parseYaml(valid.join("\n"), { schema: "failsafe" });
    expect(yamlDoc.errors).toEqual([]);
    const yamlKeys = isMap(yamlDoc.contents)
      ? yamlDoc.contents.items.map((pair) => (isScalar(pair.key) ? String(pair.key.value) : null))
      : [];
    expect(subjects.filter((_, index) => index !== 5)).toEqual(yamlKeys);
    expect(subjects).toEqual([
      "it's",
      'say "hi"',
      "back\\slash",
      "tab\there\nnew/slash",
      "hexA\u00e9\u{1F600}",
      "keep\\qunknown",
      "plain key",
    ]);
  });

  it("never throws on unusual input (stage 1 has a catch-all)", () => {
    const samples = [
      "",
      "---",
      "---\n---",
      "[",
      "]]][[[",
      "---\n'unclosed: \"x\n---\n",
      "---\n- a\n  - b # [x]\n? k\n: v\n---\n```\n",
      "# \n##\n###### [presence:\n<!-- \n|\n1)\n*\n",
      "~~~\n~~\n~~~~ x\n",
      "\u00e9t\u00e9: [caf\u00e9] # [caf\u00e9] type=\u00e9\n",
    ];
    for (const text of samples) {
      expect(() => parseDocument(text)).not.toThrow();
    }
  });

  it("finds the inline comment outside quotes, apostrophes and flow values", () => {
    const result = doc(
      "---",
      "'it''s': \"a # not\" # c-apos-key",
      "owner: it's fine # c-apos-value",
      'color: "#ff0000" # c-hash',
      "url: a#frag # c-frag",
      'esc: "q \\" # in" # c-esc',
      '"a:b": x # c-colon-key',
      "empty: # c-empty",
      'flow: ["a #1", b] # c-flow',
      "glued: y #c-glued",
      "none: z",
      "---",
    );
    const comments = Object.fromEntries(
      (result.frontmatter?.lines ?? []).flatMap((l) =>
        l.kind === "key" ? [[l.key, l.comment?.text ?? null]] : [],
      ),
    );
    expect(comments).toEqual({
      "'it''s'": "c-apos-key",
      owner: "c-apos-value",
      color: "c-hash",
      url: "c-frag",
      esc: "c-esc",
      '"a:b"': "c-colon-key",
      empty: "c-empty",
      flow: "c-flow",
      glued: "c-glued",
      none: null,
    });
  });

  it("parses a large document in reasonable time", () => {
    const fm = Array.from({ length: 200 }, (_, i) => `k${i}: "v" # [presence:optional] type=int`);
    const body = Array.from({ length: 2000 }, (_, i) =>
      i % 10 === 0 ? `## H${i} [content:non-empty]` : `line ${i} with [x] and | pipes |`,
    );
    const started = Date.now();
    const result = doc("---", ...fm, "---", ...body);
    expect(Date.now() - started).toBeLessThan(5000);
    expect(headings(result.body)).toHaveLength(200);
  });
});

/** The template-wide switch on the loaded document model (spec 2.11, ADR 0013). */
describe("DocumentModel.uniqueHeadingNames (spec 2.11)", () => {
  const load = (...lines: string[]): DocumentModel => {
    const result = loadDocument(lines.join("\n"));
    if (!result.ok) throw new Error(`load failed: ${result.failure.reason}`);
    return result.model;
  };

  it("is true with a standalone `# [unique-headings-names]` frontmatter line", () => {
    const model = load("---", "# [unique-headings-names]", 'title: "string"', "---", "# Guide");
    expect(model.uniqueHeadingNames).toBe(true);
    expect(model.findings).toEqual([]);
  });

  it("is true once when the line is written twice", () => {
    const model = load(
      "---",
      "# [unique-headings-names]",
      "a: x",
      "# [UNIQUE-HEADINGS-NAMES]",
      "---",
    );
    expect(model.uniqueHeadingNames).toBe(true);
    expect(model.findings).toEqual([]);
  });

  it.each([
    ["no tag at all", ["---", "a: x", "---", "# Guide"]],
    ["the tag after a key", ["---", 'title: "x" # [unique-headings-names]', "---"]],
    ["the tag on a mixed comment line", ["---", "# note [unique-headings-names]", "a: x", "---"]],
    ["an argument on the line", ["---", "# [unique-headings-names:x]", "a: x", "---"]],
    ["only per-heading tags", ["---", "a: x", "---", "## Usage [unique-headings-names]"]],
  ])("is false with %s", (_label, lines) => {
    expect(load(...lines).uniqueHeadingNames).toBe(false);
  });

  it.each([
    ["a typo of the name", "# [unique-heading-names]"],
    ["another word", "# [todo]"],
  ])("is false, with one unknown finding, for a standalone line holding %s", (_label, written) => {
    const model = load("---", written, "a: x", "---");
    expect(model.uniqueHeadingNames).toBe(false);
    expect(model.findings).toMatchObject([
      { reason: "unknown", tag: written.slice(2), subject: { commentLine: 2 } },
    ]);
    expect(model.findings).toHaveLength(1);
    expect(model.document.frontmatter?.lines[0]).toEqual({
      kind: "comment",
      line: 2,
      raw: written,
    });
  });

  it("an unknown comment-line tag is MTL010 `Comment line N`; a malformed switch stays MTL012", async () => {
    const registry = createRegistry();
    const template = ["---", "a: x", "# note [a] and [b]", "# [unique-headings-names:x]", "---"];
    const status = await checkTemplate(registry, template.join("\n"));
    if (status.status !== "ok") throw new Error("template broken");
    expect(status.warnings.map((d) => [d.code, d.message])).toEqual([
      ["MTL010", "Comment line 3: unknown tag [a]"],
      ["MTL010", "Comment line 3: unknown tag [b]"],
      ["MTL012", "Filename comment: malformed tag [unique-headings-names:x]"],
    ]);
  });

  it("`[todo]` in a TARGET frontmatter comment or body gives no tag finding", async () => {
    const registry = createRegistry();
    const status = await checkTemplate(registry, ["---", "a: x", "---", "# Guide"].join("\n"));
    if (status.status !== "ok") throw new Error("template broken");
    const target = ["---", "# [todo]", "a: x", "---", "# Guide", "", "Text [todo]."].join("\n");
    const env = createEnv({ io: createMemoryIo([]) });
    expect(await checkTarget(registry, status.model, target, "t.md", env)).toEqual([]);
  });

  it("is true with a valid line next to a malformed one, which gives one MTL012 finding", () => {
    const model = load(
      "---",
      "# [unique-headings-names:x]",
      "# [unique-headings-names]",
      "a: x",
      "---",
    );
    expect(model.uniqueHeadingNames).toBe(true);
    expect(model.findings).toMatchObject([
      { reason: "malformed", tag: "[unique-headings-names:x]", position: { line: 2 } },
    ]);
    expect(model.findings).toHaveLength(1);
  });

  it("a TARGET heading carrying the tag has it peeled, so it matches the template heading", async () => {
    // Spec 2.11 placement table, last row: tags in a target are inert; on a target heading the
    // recognized tag is peeled from the text (2.6).
    const registry = createRegistry();
    const status = await checkTemplate(registry, ["---", "a: x", "---", "# Guide"].join("\n"));
    if (status.status !== "ok") throw new Error("template broken");
    const target = ["---", "a: x", "---", "# Guide [unique-headings-names]"].join("\n");
    expect(load(...target.split("\n")).sections).toMatchObject([{ text: "Guide" }]);
    const env = createEnv({ io: createMemoryIo([]) });
    expect(await checkTarget(registry, status.model, target, "t.md", env)).toEqual([]);
  });

  it("`# [unique-headings-names]` in the template BODY is an empty-text H1, not the switch", async () => {
    // Spec 2.11 placement table: an H1 with EMPTY text carrying the per-heading tag; a required
    // exact-text heading no normal target has, so each lint run reports MTL601 for ''.
    const template = ["---", "a: x", "---", "# [unique-headings-names]"].join("\n");
    const model = load(...template.split("\n"));
    expect(model.uniqueHeadingNames).toBe(false);
    expect(model.findings).toEqual([]);
    expect(model.sections).toMatchObject([
      { level: 1, text: "", line: 4, tags: [{ region: "body", kind: "unique-names" }] },
    ]);

    const registry = createRegistry();
    const status = await checkTemplate(registry, template);
    if (status.status !== "ok") throw new Error("template broken");
    const env = createEnv({ io: createMemoryIo([]) });
    const target = ["---", "a: x", "---", "# Guide", "", "Text."].join("\n");
    const found = await checkTarget(registry, status.model, target, "t.md", env);
    expect(found.filter((d) => d.code === "MTL601").map((d) => d.message)).toEqual([
      "Heading: Missing required heading: ''",
    ]);
  });
});
