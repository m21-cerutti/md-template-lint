/**
 * A6 spike: bind inline comments to top-level frontmatter keys from the YAML
 * document (spec 2.1). Result and decision: docs/research/yaml-spike.md.
 */
import { describe, expect, it } from "vitest";
import { isMap, isScalar, LineCounter, parseDocument, Parser, type Node } from "yaml";
import { parseDocument as parseMarkdown } from "../../../src/index.js";

interface CommentToken {
  readonly offset: number;
  readonly source: string;
}

/** Every comment token of the CST, in source order. */
function cstComments(src: string): CommentToken[] {
  const found: CommentToken[] = [];
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(walk);
    } else if (typeof node === "object" && node !== null) {
      const token = node as { type?: unknown; offset?: unknown; source?: unknown };
      if (token.type === "comment" && typeof token.offset === "number") {
        found.push({ offset: token.offset, source: String(token.source) });
        return;
      }
      Object.values(node).forEach(walk);
    }
  };
  for (const doc of new Parser().parse(src)) walk(doc);
  return found.sort((a, b) => a.offset - b.offset);
}

/** Top-level key -> comment text on the key's own line (last duplicate wins). */
function bindComments(src: string): Map<string, string> {
  const lines = new LineCounter();
  const doc = parseDocument(src, { schema: "failsafe", uniqueKeys: false, lineCounter: lines });
  const keyByLine = new Map<number, string>();
  if (isMap(doc.contents)) {
    for (const pair of doc.contents.items) {
      const key = pair.key as Node;
      if (isScalar(key) && key.range) {
        keyByLine.set(lines.linePos(key.range[0]).line, String(key.value));
      }
    }
  }
  const bound = new Map<string, string>();
  for (const comment of cstComments(src)) {
    const key = keyByLine.get(lines.linePos(comment.offset).line);
    if (key !== undefined && !bound.has(key)) bound.set(key, comment.source.slice(1).trim());
  }
  return bound;
}

describe("yaml comment binding spike", () => {
  it("binds quoted keys, apostrophes and inline comments to the right key", () => {
    const src = [
      "# [filename:case:snake_case]",
      'id: "string" # [presence:required]',
      '"quoted key": x # c-quoted',
      "'it''s': \"a # not\" # c-apos-key",
      "owner: it's fine # c-apos-value",
      'color: "#ff0000" # c-hash',
      "url: a#frag # c-frag",
      'esc: "q \\" # in" # c-esc',
      '"a:b": x # c-colon-key',
      "empty: # c-empty",
      'flow: ["a", "b"] # c-flow',
      "tags: # c-tags",
      "  # not bound",
      "  - a # item, not bound",
      "meta:",
      "  sub: x # sub-key, not bound",
      "last: y #c-glued",
      "",
    ].join("\n");
    expect(Object.fromEntries(bindComments(src))).toEqual({
      id: "[presence:required]",
      "quoted key": "c-quoted",
      "it's": "c-apos-key",
      owner: "c-apos-value",
      color: "c-hash",
      url: "c-frag",
      esc: "c-esc",
      "a:b": "c-colon-key",
      empty: "c-empty",
      flow: "c-flow",
      tags: "c-tags",
      last: "c-glued",
    });
  });

  it("shows the limitation of node comments: lines are merged", () => {
    const doc = parseDocument("k: x # c\n  # next line\nn: y\n", { schema: "failsafe" });
    const value = isMap(doc.contents) ? (doc.contents.items[0]?.value as Node) : null;
    expect(value?.comment).toBe(" c\n next line");
    expect(bindComments("k: x # c\n  # next line\nn: y\n").get("k")).toBe("c");
  });

  it("never binds a whole-line comment", () => {
    expect(bindComments("tags:\n  # before item\n  - a\n").size).toBe(0);
  });

  it("agrees with the grammar's frontmatter key lines (fmKeyLine)", () => {
    const src = [
      'id: "string" # [presence:required]',
      "'it''s': \"a # not\" # c-apos-key",
      "owner: it's fine # c-apos-value",
      'color: "#ff0000" # c-hash',
      "url: a#frag # c-frag",
      'esc: "q \\" # in" # c-esc',
      "empty: # c-empty",
      'flow: ["a #1", b] # c-flow',
      "tags: # c-tags",
      "  - a # item",
      "last: y #c-glued",
      "",
    ].join("\n");
    const fromYaml = [...bindComments(src).values()];
    const fromGrammar = (parseMarkdown(`---\n${src}---\n`).frontmatter?.lines ?? []).flatMap((line) => (line.kind === "key" && line.comment !== null ? [line.comment.text] : []));
    expect(fromGrammar).toEqual(fromYaml);
  });
});
