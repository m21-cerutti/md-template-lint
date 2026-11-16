/**
 * Region separation by lexer modes (grammar/MdTemplateLexer.g4): frontmatter
 * vs body, fenced code, document start, line ends.
 */
import { describe, expect, it } from "vitest";
import { parseDocument, type BodyHeading } from "../../../src/index.js";

const doc = (...lines: string[]) => parseDocument(lines.join("\n"));
const headingTexts = (text: string) =>
  parseDocument(text)
    .body.filter((b): b is BodyHeading => b.kind === "heading")
    .map((h) => h.text);
const reasons = (text: string) => parseDocument(text).findings.map((f) => `${f.region}:${f.reason}`);

describe("frontmatter delimiters", () => {
  it.each([
    ["first line opens", "---\na: b\n---\n# T\n", true],
    ["trailing spaces allowed", "---  \na: b\n---\t\n# T\n", true],
    ["blank line before", "\n---\na: b\n---\n", false],
    ["text before", "x\n---\na: b\n---\n", false],
    ["four dashes", "----\na: b\n---\n", false],
  ])("%s", (_label, text, opened) => {
    expect(parseDocument(text).frontmatter !== null).toBe(opened);
  });

  it("treats a later --- line in the body as text, not a delimiter", () => {
    const result = doc("---", "a: b", "---", "# T", "---", "## U");
    expect(result.body.map((b) => b.kind)).toEqual(["heading", "text", "heading"]);
  });

  it("keeps --- inside a value and an indented --- in the frontmatter", () => {
    const result = doc("---", "a: --- x", "  ---", "---", "# T");
    expect(result.frontmatter?.endLine).toBe(4);
  });

  it("parses an empty frontmatter and an unterminated one", () => {
    expect(parseDocument("---\n---\n").frontmatter).toMatchObject({ yaml: "", lines: [] });
    const open = parseDocument("---\na: b # [presence:optional]\n# T [presence:optional]\n");
    expect(open).toMatchObject({ frontmatter: null, frontmatterUnclosed: true, body: [] });
  });

  it("accepts CRLF and lone CR line ends", () => {
    const result = parseDocument("---\r\na: b # [presence:optional]\r\n---\r# T [content:list]\r\n");
    expect(result.frontmatter?.lines).toMatchObject([{ kind: "key", key: "a", comment: { tags: [{ mode: "optional" }] } }]);
    expect(headingTexts("---\r\n---\r\n# T [content:list]")).toEqual(["T"]);
  });
});

describe("region separation", () => {
  it("reports a frontmatter-only tag on a heading and a body-only tag in a comment", () => {
    expect(reasons("---\na: b # [content:table]\n---\n# T [count:min:1]\n")).toEqual(["frontmatter:wrong-region", "body:wrong-region"]);
  });

  it("does not read tags in body text lines, lists or tables", () => {
    expect(reasons("# T\ntext [count:min:x]\n- [foo:bar]\n| [presence:x] |\n")).toEqual([]);
  });

  it("reads several tags on one comment and one heading", () => {
    const result = doc("---", "a: b # [presence:optional] [count:max:2] [format:kebab-case]", "---", "## H [presence:required] [content:non-empty] [content:max-lines:3]");
    const key = result.frontmatter?.lines[0];
    expect(key?.kind === "key" ? key.comment?.tags.length : 0).toBe(3);
    expect(result.body[0]).toMatchObject({ kind: "heading", text: "H" });
    expect(result.body[0]?.kind === "heading" ? result.body[0].tags.length : 0).toBe(3);
  });

  it("reads tags on H3 to H6 headings exactly like on H1 and H2", () => {
    const deep = "### A [presence:bogus]\n#### C [nope:x]\n###### B [count:min:1]\n";
    const shallow = "# A [presence:bogus]\n## C [nope:x]\n# B [count:min:1]\n";
    const expected = ["body:malformed", "body:unknown", "body:wrong-region"];
    expect(reasons(deep)).toEqual(expected);
    expect(reasons(shallow)).toEqual(expected);
    expect(parseDocument(deep).findings).toMatchObject([
      {
        tag: "[presence:bogus]",
        position: { line: 1 },
        subject: { heading: "A [presence:bogus]" },
      },
      { tag: "[nope:x]", position: { line: 2, column: 8 }, subject: { heading: "C [nope:x]" } },
      {
        tag: "[count:min:1]",
        position: { line: 3, column: 10 },
        subject: { heading: "B [count:min:1]" },
      },
    ]);
  });

  it("treats tags in inline code as plain text: found in a comment, not trailing a heading", () => {
    const result = doc("---", "a: b # `[presence:optional]`", "---", "## H `[count:min:1]`");
    expect(result.findings).toEqual([]);
    const key = result.frontmatter?.lines[0];
    expect(key?.kind === "key" ? key.comment?.tags : []).toMatchObject([{ mode: "optional" }]);
    expect(result.body[0]).toMatchObject({ text: "H `[count:min:1]`", tags: [] });
  });
});

describe("fenced code (FENCE_BACKTICK, FENCE_TILDE)", () => {
  it.each([
    ["backtick fence", "```\n## A [count:min:x]\n```\n## B\n", ["B"]],
    ["tilde fence", "~~~\n## A [presence:bogus]\n~~~\n## B\n", ["B"]],
    ["shorter closer does not close", "````\n```\n## A\n````\n## B\n", ["B"]],
    ["longer closer closes", "```\n## A\n`````\n## B\n", ["B"]],
    ["other character does not close", "~~~\n```\n## A\n~~~\n## B\n", ["B"]],
    ["closer with text does not close", "```\n``` x\n## A\n```\n## B\n", ["B"]],
    ["three-space indent opens", "   ```\n## A\n```\n## B\n", ["B"]],
    ["four-space indent does not open", "    ```\n## A\n", ["A"]],
    ["unclosed runs to the end", "```\n## A\n## B\n", []],
  ])("%s", (_label, text, expected) => {
    expect(headingTexts(text)).toEqual(expected);
    expect(parseDocument(text).findings).toEqual([]);
  });
});
