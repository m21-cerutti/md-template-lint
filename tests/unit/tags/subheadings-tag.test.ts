/**
 * `[content:subheadings:disallow]` parse contract (spec 2.6, 2.7, 4.3 MTL012 and
 * MTL013, ADR 0009): one `bodyContentTag` alternative, read on headings of every
 * level, malformed with any other argument, misplaced in a frontmatter comment.
 */
import { describe, expect, it } from "vitest";
import { parseDocument, type BodyHeading } from "../../../src/index.js";

const doc = (...lines: string[]) => parseDocument(lines.join("\n"));
const headings = (result: ReturnType<typeof parseDocument>): BodyHeading[] => result.body.filter((b): b is BodyHeading => b.kind === "heading");
const DISALLOW = "[content:subheadings:disallow]";

describe("[content:subheadings:disallow] on headings", () => {
  it.each([1, 2, 3, 4, 5, 6])("is peeled from an H%i heading", (level) => {
    const marks = "#".repeat(level);
    const result = doc(`${marks} Releases ${DISALLOW}`);
    expect(result.findings).toEqual([]);
    expect(headings(result)).toMatchObject([
      {
        level,
        line: 1,
        text: "Releases",
        tags: [
          {
            region: "body",
            kind: "content",
            check: "subheadings-disallow",
            position: { line: 1, column: level + 11 },
          },
        ],
      },
    ]);
  });

  it("is peeled on every level of one nested document", () => {
    const result = doc("# Changelog", `## Unreleased ${DISALLOW}`, `### Added ${DISALLOW}`, `#### Details ${DISALLOW}`, `##### Notes ${DISALLOW}`, `###### Misc ${DISALLOW}`);
    expect(result.findings).toEqual([]);
    expect(headings(result).map((h) => [h.level, h.text, h.tags.map((t) => t.kind)])).toEqual([
      [1, "Changelog", []],
      [2, "Unreleased", ["content"]],
      [3, "Added", ["content"]],
      [4, "Details", ["content"]],
      [5, "Notes", ["content"]],
      [6, "Misc", ["content"]],
    ]);
  });
});

describe("[content:subheadings] with a missing or other argument is malformed (MTL012)", { tags: ["MTL012", "syntax"] }, () => {
  it.each([
    ["##", "[content:subheadings]"],
    ["###", "[content:subheadings]"],
    ["######", "[content:subheadings]"],
    ["##", "[content:subheadings:allow]"],
    ["####", "[content:subheadings:allow]"],
    ["#####", "[content:subheadings:disallowed]"],
  ])("%s heading with %s", (marks, tag) => {
    const result = doc("# Top", `${marks} Releases ${tag}`);
    expect(result.findings).toMatchObject([
      {
        region: "body",
        reason: "malformed",
        tag,
        position: { line: 2 },
        subject: { heading: `Releases ${tag}` },
      },
    ]);
    expect(headings(result)[1]).toMatchObject({
      level: marks.length,
      text: `Releases ${tag}`,
      tags: [],
    });
  });
});

describe("[content:subheadings:disallow] in a frontmatter comment is misplaced (MTL013)", { tags: ["MTL013", "syntax"] }, () => {
  it("reports wrong region in the comment and still peels the tag on an H4 heading", () => {
    const result = doc("---", `a: b # ${DISALLOW}`, "---", `#### Deep ${DISALLOW}`);
    expect(result.findings).toMatchObject([
      {
        reason: "wrong-region",
        region: "frontmatter",
        tag: DISALLOW,
        position: { line: 2, column: 8 },
        subject: { field: "a" },
      },
    ]);
    const key = result.frontmatter?.lines[0];
    expect(key?.kind === "key" ? key.comment?.tags : null).toEqual([]);
    expect(headings(result)).toMatchObject([{ level: 4, text: "Deep", tags: [{ kind: "content", check: "subheadings-disallow" }] }]);
  });
});

describe("[content:subheadings:disallow] with a second tag on the same heading", () => {
  it.each([
    [
      `### Unreleased [presence:optional] ${DISALLOW}`,
      [
        { kind: "presence", mode: "optional" },
        { kind: "content", check: "subheadings-disallow" },
      ],
    ],
    [
      `#### Unreleased ${DISALLOW} [presence:required]`,
      [
        { kind: "content", check: "subheadings-disallow" },
        { kind: "presence", mode: "required" },
      ],
    ],
    [
      `###### Unreleased [content:non-empty] ${DISALLOW}`,
      [
        { kind: "content", check: "non-empty" },
        { kind: "content", check: "subheadings-disallow" },
      ],
    ],
  ])("%s", (line, tags) => {
    const result = doc(line);
    expect(result.findings).toEqual([]);
    expect(headings(result)).toMatchObject([{ text: "Unreleased", tags }]);
    expect(headings(result)[0]?.tags).toHaveLength(2);
  });

  it("keeps the tag and reports a malformed neighbour on an H3 heading", () => {
    const result = doc(`### Unreleased [content:subheadings] ${DISALLOW}`);
    expect(result.findings).toMatchObject([{ region: "body", reason: "malformed", tag: "[content:subheadings]" }]);
    expect(headings(result)).toMatchObject([
      {
        text: "Unreleased [content:subheadings]",
        tags: [{ kind: "content", check: "subheadings-disallow" }],
      },
    ]);
  });
});
