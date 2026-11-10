/**
 * src/rules/syntax.ts (MTL001-MTL004, MTL010-MTL013). One passing case, one
 * failing case per code (docs/spec.md 2.7, 4.3).
 */
import { describe, expect, it } from "vitest";
import { checkTemplate, createRegistry, type Diagnostic } from "../../src/index.js";

const registry = createRegistry();
const lines = (...text: string[]) => text.join("\n");

/** Diagnostics of a template: parse diagnostics when broken, else its tag warnings. */
async function diagnostics(text: string): Promise<Diagnostic[]> {
  const status = await checkTemplate(registry, text);
  return status.status === "broken" ? status.diagnostics : status.warnings;
}

const brief = (list: Diagnostic[]) =>
  list.map((d) => [d.code, d.severity, d.message, d.position?.line, d.position?.column]);

describe("syntax rules", () => {
  it("passes: a clean template gives no diagnostic", async () => {
    const text = lines(
      "---",
      "# [filename:case:snake_case]",
      "id: x # [presence:required] [value:filename] [date] [rule]",
      "desc: |",
      "  k: v # [bogus:x]",
      "---",
      "## Notes [presence:optional] [content:list]",
      "Text with [count:min:1] inside.",
    );
    expect(await diagnostics(text)).toEqual([]);
  });

  it("fails MTL001: no frontmatter", async () => {
    expect(brief(await diagnostics("# Title\n"))).toEqual([
      ["MTL001", "error", "File must have YAML frontmatter (---...---)", undefined, undefined],
    ]);
  });

  it("fails MTL002: invalid YAML", async () => {
    const [first] = await diagnostics("---\na: [b\n---\n");
    expect(first).toMatchObject({ code: "MTL002", severity: "error" });
    expect(first?.message.startsWith("YAML parse error: ")).toBe(true);
  });

  it("fails MTL003: frontmatter is not a mapping", async () => {
    expect(brief(await diagnostics("---\n- a\n---\n"))).toEqual([
      [
        "MTL003",
        "error",
        "YAML frontmatter must be a mapping of 'key: value' pairs",
        undefined,
        undefined,
      ],
    ]);
  });

  it("fails MTL004: unreadable file (parse context)", async () => {
    const [rule] = registry.rules.filter((r) => r.code === "MTL004");
    expect(rule?.phase).toBe("parse");
    if (rule?.phase !== "parse") return;
    const context = {
      phase: "parse",
      role: "target",
      failure: { reason: "file-unreadable", detail: "EACCES: denied" },
    } as const;
    expect(await rule.check(context)).toEqual([
      { code: "MTL004", severity: "error", message: "EACCES: denied", position: null },
    ]);
  });

  it("fails MTL010: unknown field tag on a YAML key line", async () => {
    expect(brief(await diagnostics(lines("---", "id: x # [nope:y]", "---")))).toEqual([
      ["MTL010", "warning", "Field 'id': unknown tag [nope:y]", 2, 9],
    ]);
  });

  it("fails MTL011: unknown heading tag", async () => {
    expect(brief(await diagnostics(lines("---", "a: b", "---", "## Notes [nope:y]")))).toEqual([
      ["MTL011", "warning", "Heading 'Notes [nope:y]': unknown tag [nope:y]", 4, 10],
    ]);
  });

  it("fails MTL012: malformed tag, field and heading", async () => {
    const text = lines("---", "n: x # [count:min:abc]", "---", "## Notes [content:min-lines:x]");
    expect(brief(await diagnostics(text))).toEqual([
      ["MTL012", "warning", "Field 'n': malformed tag [count:min:abc]", 2, 19],
      [
        "MTL012",
        "warning",
        "Heading 'Notes [content:min-lines:x]': malformed tag [content:min-lines:x]",
        4,
        29,
      ],
    ]);
  });

  it("fails MTL013: misplaced tag in both regions", async () => {
    const text = lines("---", "n: x # [content:table]", "---", "## Notes [count:min:1]");
    expect(brief(await diagnostics(text))).toEqual([
      ["MTL013", "warning", "Field 'n': tag [content:table] is not valid in frontmatter", 2, 8],
      [
        "MTL013",
        "warning",
        "Heading 'Notes [count:min:1]': tag [count:min:1] is not valid in a heading",
        4,
        10,
      ],
    ]);
  });
});
