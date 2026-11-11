/** Engine core (A9): loading, comment binding by line, sections, type inference. */
import { describe, expect, it } from "vitest";
import { inferType, loadDocument, parseDocument, type DocumentModel } from "../../src/index.js";
import type { FrontmatterComment } from "../../src/index.js";

const load = (...lines: string[]): DocumentModel => {
  const result = loadDocument(lines.join("\n"));
  if (!result.ok) throw new Error(`load failed: ${result.failure.reason}`);
  return result.model;
};

/** The bound comment of `key: value # <comment>` parsed by the grammar. */
const commentOf = (comment: string): FrontmatterComment | null => {
  const doc = parseDocument(`---\nk: v # ${comment}\n---\n`);
  const line = doc.frontmatter?.lines[0];
  return line?.kind === "key" ? line.comment : null;
};

describe("loadDocument: parse failures", () => {
  it("no frontmatter, unclosed frontmatter -> frontmatter-missing", () => {
    expect(loadDocument("# Title\n")).toEqual({
      ok: false,
      failure: { reason: "frontmatter-missing", detail: "" },
    });
    expect(loadDocument("---\na: b\n")).toMatchObject({
      failure: { reason: "frontmatter-missing" },
    });
  });

  it("invalid YAML -> yaml-invalid with the yaml detail", () => {
    const result = loadDocument("---\na: [b\n---\n");
    expect(result).toMatchObject({ ok: false, failure: { reason: "yaml-invalid" } });
    if (!result.ok) expect(result.failure.detail).not.toBe("");
  });

  it("a list frontmatter -> frontmatter-not-mapping; empty block -> empty mapping", () => {
    expect(loadDocument("---\n- a\n---\n")).toMatchObject({
      failure: { reason: "frontmatter-not-mapping" },
    });
    expect(load("---", "---", "# T").fields.size).toBe(0);
  });
});

describe("loadDocument: the frontmatterOptional option (ADR 0015)", () => {
  it("no frontmatter with the option -> ok, a body-only model", () => {
    const result = loadDocument("# Title\n\ntext\n", { frontmatterOptional: true });
    expect(result).toMatchObject({ ok: true });
    if (!result.ok) throw new Error("load failed");
    expect(result.model.fields.size).toBe(0);
    expect(result.model.filename).toBeNull();
    expect(result.model.uniqueHeadingNames).toBe(false);
    expect(result.model.frontmatterOptional).toBe(false);
    expect(result.model.sections.map((s) => [s.level, s.text, s.line])).toEqual([[1, "Title", 1]]);
  });

  it("unclosed frontmatter with the option -> frontmatter-missing", () => {
    expect(loadDocument("---\na: b\n", { frontmatterOptional: true })).toMatchObject({
      ok: false,
      failure: { reason: "frontmatter-missing" },
    });
  });

  it("no frontmatter with the option off -> frontmatter-missing", () => {
    expect(loadDocument("# Title\n", { frontmatterOptional: false })).toEqual({
      ok: false,
      failure: { reason: "frontmatter-missing", detail: "" },
    });
  });

  it("invalid YAML with the option -> yaml-invalid, as without it", () => {
    expect(loadDocument("---\na: [b\n---\n", { frontmatterOptional: true })).toMatchObject({ ok: false, failure: { reason: "yaml-invalid" } });
  });

  it("frontmatterOptional on the model comes from the template frontmatter line", () => {
    expect(load("---", "# [frontmatter:optional]", "a: b", "---").frontmatterOptional).toBe(true);
    expect(load("---", "a: b", "---").frontmatterOptional).toBe(false);
  });
});

describe("loadDocument: values and binding", () => {
  it("keeps every scalar a string (failsafe) and the last duplicate value", () => {
    const model = load("---", "flag: yes", "when: 2026-08-10", "num: 1.0", "nil: ~", "empty:", "dup: first", "dup: last", "tags: [a, b]", "meta:", "  sub: x", "---");
    expect([...model.fields.keys()]).toEqual(["flag", "when", "num", "nil", "empty", "dup", "tags", "meta"]);
    const value = (key: string) => model.fields.get(key)?.value;
    expect(value("flag")).toBe("yes");
    expect(value("when")).toBe("2026-08-10");
    expect(value("num")).toBe("1.0");
    expect(value("nil")).toBe("~");
    expect(value("empty")).toBe("");
    expect(value("dup")).toBe("last");
    expect(value("tags")).toEqual(["a", "b"]);
    expect(value("meta")).toEqual(new Map([["sub", "x"]]));
    expect(model.fields.get("dup")?.line).toBe(8);
  });

  it("binds a comment to the top-level key on the same line only", () => {
    const model = load("---", "id: x # [presence:optional]", '"a:b": y # quoted', "tags: # [count:min:1]", "  - a # item comment", "meta:", "  sub: x # [presence:optional]", "---");
    expect(model.fields.get("id")?.comment?.text).toBe("[presence:optional]");
    expect(model.fields.get("a:b")?.comment?.text).toBe("quoted");
    expect(model.fields.get("tags")?.comment?.tags).toMatchObject([{ kind: "count" }]);
    expect(model.fields.get("meta")?.comment).toBeNull();
  });

  it("keeps field findings only on YAML key lines (spec 2.1)", () => {
    const model = load("---", "desc: |", "  k: v # [bogus:x]", "id: x # [nope:y]", "---", "## Notes [presence:sometimes]");
    expect(model.findings.map((f) => [f.region, f.reason, f.tag, f.position.line])).toEqual([
      ["frontmatter", "unknown", "[nope:y]", 4],
      ["body", "malformed", "[presence:sometimes]", 6],
    ]);
  });
});

describe("loadDocument: sections", () => {
  it("builds sections from every level with parents; a body keeps its deeper headings", () => {
    const model = load("---", "a: b", "---", "# Title [presence:required]", "intro", "## One", "### Deep", "text", "```", "## not a heading", "```", "## Two", "last");
    // Spec 2.6, change C10: H3 to H6 are sections too; parent = nearest lower-level heading.
    expect(model.sections.map((s) => [s.level, s.text, s.line, s.parent])).toEqual([
      [1, "Title", 4, null],
      [2, "One", 6, 0],
      [3, "Deep", 7, 1],
      [2, "Two", 12, 0],
    ]);
    expect(model.sections[1]?.body).toBe("### Deep\ntext\n```\n## not a heading\n```");
    expect(model.sections[2]?.body).toBe("text\n```\n## not a heading\n```");
    expect(model.sections[0]?.body.split("\n")).toHaveLength(9);
    expect(model.sections[3]?.body).toBe("last");
  });
});

describe("inferType (spec 3.2)", () => {
  it("step A: declared hints in priority order", () => {
    expect(inferType("x", commentOf("[Int] [date]"))).toBe("int");
    // The removed `type=<name>` comment form is plain text: the value decides.
    expect(inferType("x", commentOf("type=Int"))).toBe("string");
    expect(inferType(" Date ", null)).toBe("date");
    expect(inferType("a | b", null)).toBe("enum");
    expect(inferType("x", commentOf("see @assets/"))).toBe("path-alias");
    expect(inferType("x", commentOf("[path-alias]"))).toBe("path-alias");
    expect(inferType("@a/b.png", null)).toBe("path-alias");
    expect(inferType("x", commentOf("format YYYY-MM-DD [url]"))).toBe("date");
    expect(inferType("x", commentOf("ISO date"))).toBe("date");
    expect(inferType("x", commentOf("[rule] [Foo] url"))).toBe("foo");
    expect(inferType("x", commentOf("a lien"))).toBe("url");
    expect(inferType("x", commentOf("a path"))).toBe("path");
    expect(inferType("x", commentOf("plain words"))).toBe("string");
  });

  it("step B: promotion of date, url, path and path-alias hints on a list", () => {
    expect(inferType(["a"], commentOf("[date]"))).toBe("list-of-date");
    expect(inferType(["a"], commentOf("url"))).toBe("list-of-url");
    expect(inferType(["a"], commentOf("[int]"))).toBe("int");
    expect(inferType(["a"], commentOf("[list-of-int]"))).toBe("list-of-int");
    expect(inferType(["a"], commentOf("type=list-of-int"))).toBe("list");
  });

  it("step C: inference from the value alone", () => {
    expect(inferType(new Map([["a", "b"]]), null)).toBe("nested-map");
    expect(inferType(["2026", "present"], null)).toBe("list-of-date");
    expect(inferType(["https://a.org"], null)).toBe("list-of-url");
    expect(inferType(["./a", "b/c.md"], null)).toBe("list-of-path");
    expect(inferType(["a", "./b"], null)).toBe("list");
    expect(inferType([], null)).toBe("list");
    expect(inferType("2026-13-40", null)).toBe("date");
    expect(inferType("Présent", null)).toBe("date");
    expect(inferType("ftp://x", null)).toBe("url");
    expect(inferType("C:\\dir\\file", null)).toBe("path");
    expect(inferType("n/a", null)).toBe("string");
    expect(inferType("and/or", null)).toBe("string");
    expect(inferType("x", null)).toBe("string");
  });

  it("is computed for every loaded field", () => {
    const model = load("---", "when: 2026-01-01", 'tags: ["2026"] # [date]', "---");
    expect(model.fields.get("when")?.type).toBe("date");
    expect(model.fields.get("tags")?.type).toBe("list-of-date");
  });
});
