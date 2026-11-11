/**
 * `pnpm run check:rules`: docs/syntax-reference.md agrees with the grammar, the
 * registry, the source constants and the CLI. One passing case per check on the
 * real tree, then drift cases that feed deliberately broken inputs.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { errorRows, fixtureLink, generateBlocks, tagForms, touchesUrlsOrFiles, type ErrorRow, type TagForm } from "../../scripts/syntax-doc/generate.js";
import { FIX_NOTES, TAG_FIXTURES, TAG_NOTES } from "../../scripts/syntax-doc/notes.js";
import { FORMAT_NAMES, USAGE } from "../../src/cli/args.js";
import { ON_EMPTY_VALUES } from "../../src/config/types.js";
import { RUN_CODES } from "../../src/engine/directives.js";
import { createRegistry } from "../../src/engine/registry.js";
import { CATEGORIES } from "../../src/engine/rule.js";
import { KNOWN_TYPE_NAMES } from "../../src/tags/types.js";
import { specCodes, specRunCodes } from "./consistency.js";
import { DOC_PATH, checkEnums, checkFamilies, checkFlags, checkFresh, checkNotes, checkTagLinks, checkTypes, checkWarnings, documentedFlags, readCliDoc, readDoc } from "./syntax-reference.js";

const registered = createRegistry().rules;
const rows: ErrorRow[] = errorRows({
  spec: specCodes(),
  specRun: specRunCodes(),
  registered,
  runCodes: RUN_CODES,
});
const forms: TagForm[] = tagForms();
const enums = {
  "- Output formats": FORMAT_NAMES,
  "- `onEmpty` values": ON_EMPTY_VALUES,
  "- Field types": KNOWN_TYPE_NAMES,
  "- Rule categories": CATEGORIES,
};

describe("check:rules syntax reference", () => {
  const doc = readDoc();
  const cliDoc = readCliDoc();

  it("passes: generated blocks are current", () => {
    expect(checkFresh(doc, generateBlocks())).toEqual([]);
  });

  it("passes: every code and tag family has a note, no orphan note", () => {
    expect(checkNotes(rows, forms, FIX_NOTES, TAG_NOTES)).toEqual([]);
  });

  it("passes: documented flags are in the CLI, enum lists match the source", () => {
    expect(checkFlags(cliDoc, USAGE)).toEqual([]);
    expect(checkEnums(doc, enums)).toEqual([]);
  });

  it("passes: the family table counts equal the registry and the run codes", () => {
    expect(checkFamilies(doc, registered, RUN_CODES)).toEqual([]);
  });

  it("passes: every tag form links an existing pass fixture, only io tags carry the warning emoji", () => {
    expect(checkTagLinks(doc, forms, dirname(DOC_PATH))).toEqual([]);
    expect(checkWarnings(doc, forms)).toEqual([]);
  });

  it("passes: every grammar tag family has a fixture entry, every type name is listed", () => {
    const families = new Set(forms.map((entry) => `${entry.region}:${entry.family}`));
    expect(Object.keys(TAG_FIXTURES).sort()).toEqual([...families].sort());
    expect(KNOWN_TYPE_NAMES.size).toBeGreaterThan(0);
    expect(checkTypes(doc, KNOWN_TYPE_NAMES)).toEqual([]);
  });

  it("reads non-empty inputs (a style change cannot make a check pass on nothing)", () => {
    expect(rows.length).toBeGreaterThan(80);
    expect(forms.length).toBeGreaterThan(40);
    expect(documentedFlags(cliDoc)).toEqual(["--config", "--format", "--quiet", "--verify", "--version", "--help"]);
  });

  it("fails: a stale generated block, with the command to run", () => {
    const stale = doc.replace("| `MTL001` |", "| `MTL001` | renamed-by-hand |");
    const problems = checkFresh(stale, generateBlocks());
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("block 'errors' is stale");
    expect(problems[0]).toContain("pnpm run gen:syntax-doc");
  });

  it("fails: a code or a tag family without a note, and orphan notes", () => {
    const without = <T>(notes: Readonly<Record<string, T>>, key: string) => Object.fromEntries(Object.entries(notes).filter(([name]) => name !== key));
    expect(checkNotes(rows, forms, without(FIX_NOTES, "MTL001"), without(TAG_NOTES, "heading:pattern"))).toEqual(["MTL001: no FIX_NOTES entry in scripts/syntax-doc/notes.ts", "heading:pattern: no TAG_NOTES entry in scripts/syntax-doc/notes.ts"]);
    const note = { description: "x", example: "y" };
    expect(checkNotes(rows, forms, { ...FIX_NOTES, MTL999: "x" }, { ...TAG_NOTES, "heading:ghost": note })).toEqual(["FIX_NOTES.MTL999: orphan note, no such code", "TAG_NOTES['heading:ghost']: orphan note, no such tag family"]);
  });

  it("fails: a family count that differs from the registry, a missing or an extra family", () => {
    expect(
      checkFamilies(
        doc.replace(/^(\| `heading` \| [^|]*\| )\d+/m, (_, head: string) => `${head}99`),
        registered,
        RUN_CODES,
      ),
    ).toEqual([`heading: the doc counts 99 code(s), the source has ${registered.filter((rule) => rule.category === "heading").length}`]);
    expect(
      checkFamilies(
        doc,
        registered.filter((rule) => rule.category !== "io"),
        RUN_CODES,
      ),
    ).toEqual(["io: in the families block but not in the source"]);
    expect(checkFamilies(doc, registered, [...RUN_CODES, "MTL999"])).toEqual([`run: the doc counts ${RUN_CODES.length} code(s), the source has ${RUN_CODES.length + 1}`]);
    expect(checkFamilies(doc.replace(/^\| `io` \|/m, "| `ghost` |"), registered, RUN_CODES)).toEqual(["io: family missing in the families block", "ghost: in the families block but not in the source"]);
  });

  it("fails: a tag form link that is missing, dead or not a pass fixture", () => {
    const link = /\]\(([^)]+)\) \|\n/.exec(doc)?.[1] ?? "";
    expect(link).toContain("tests/fixtures/");
    const dead = doc.replace(link, link.replace("template.md", "gone.md"));
    expect(checkTagLinks(dead, forms, dirname(DOC_PATH))).toEqual([expect.stringContaining("gone.md does not exist")]);
    const fail = doc.replace(link, link.replace(/pass-[^/]*/, "fail-x"));
    expect(checkTagLinks(fail, forms, dirname(DOC_PATH))).toEqual([expect.stringContaining("is not a pass fixture")]);
    const bare = doc.replace(/\[[^\]]*\]\(([^)]+)\) \|\n/, " |\n");
    expect(checkTagLinks(bare, forms, dirname(DOC_PATH))).toEqual([expect.stringContaining("no fixture link in the last column")]);
    expect(checkTagLinks(doc, forms.slice(1), dirname(DOC_PATH))).toEqual([`tags block has ${forms.length} row(s), the grammar has ${forms.length - 1} tag form(s)`]);
  });

  it("fails: the generator rejects a fixture entry that is missing, dead, not a pass case or without the tag", () => {
    const [count] = forms;
    if (count === undefined) throw new Error("no tag form");
    const link = (path?: string) => fixtureLink(count, path === undefined ? {} : { "frontmatter:count": path });
    expect(() => link()).toThrow("no TAG_FIXTURES entry for 'frontmatter:count'");
    expect(() => link("tests/fixtures/pairs/MTL401")).toThrow("is not a pass fixture");
    expect(() => link("tests/fixtures/pairs/MTL401/pass-gone/template.md")).toThrow("does not exist");
    expect(() => link(TAG_FIXTURES["frontmatter:presence"])).toThrow("has no [count] tag in its frontmatter");
    expect(link(TAG_FIXTURES["frontmatter:count"])).toMatch(/^\[MTL401 pass\]\(\.\.\/tests\/fixtures\/pairs\/MTL401\/pass-/);
  });

  it("fails: the generator needs a real tag of the family in the right region, not text that looks like one", () => {
    const form = (region: TagForm["region"], family: string) => {
      const found = forms.find((entry) => entry.region === region && entry.family === family);
      if (found === undefined) throw new Error(`no tag form ${region}:${family}`);
      return found;
    };
    const base = mkdtempSync(join(tmpdir(), "mtl-syntax-doc-"));
    try {
      // Lookalikes only: a malformed tag, an inert standalone comment line, a fenced heading, body prose.
      mkdirSync(join(base, "pass-lookalike"));
      writeFileSync(join(base, "pass-lookalike", "template.md"), ["---", "title: x # [count:min:abc]", "# note [range:min:1]", "---", "", "```", "## Fenced [presence:optional]", "```", "", "Prose [content:non-empty]", ""].join("\n"));
      const lookalike = "pass-lookalike/template.md";
      expect(() => fixtureLink(form("frontmatter", "count"), { "frontmatter:count": lookalike }, base)).toThrow("has no [count] tag in its frontmatter");
      expect(() => fixtureLink(form("frontmatter", "range"), { "frontmatter:range": lookalike }, base)).toThrow("has no [range] tag in its frontmatter");
      expect(() => fixtureLink(form("heading", "presence"), { "heading:presence": lookalike }, base)).toThrow("has no [presence] tag in its heading");
      expect(() => fixtureLink(form("heading", "content"), { "heading:content": lookalike }, base)).toThrow("has no [content] tag in its heading");
      // Real tags: found in their own region only.
      mkdirSync(join(base, "pass-real"));
      writeFileSync(join(base, "pass-real", "template.md"), ["---", "title: x # [count:min:1]", "---", "", "## Real [order:ascending] [presence:optional]", ""].join("\n"));
      const real = "pass-real/template.md";
      expect(fixtureLink(form("frontmatter", "count"), { "frontmatter:count": real }, base)).toBe(`[fixture pass](../${real})`);
      expect(fixtureLink(form("heading", "order"), { "heading:order": real }, base)).toBe(`[fixture pass](../${real})`);
      expect(() => fixtureLink(form("frontmatter", "order"), { "frontmatter:order": real }, base)).toThrow("has no [order] tag in its frontmatter");
      const headingCount: TagForm = { region: "heading", family: "count", form: "[count:min:N]" };
      expect(() => fixtureLink(headingCount, { "heading:count": real }, base)).toThrow("has no [count] tag in its heading");
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });

  it("fails: the warning emoji missing on an io tag or present on another tag", () => {
    expect(checkWarnings(doc.replace("`[io:exists]` ⚠️", "`[io:exists]`"), forms)).toEqual(["`[io:exists]`: tag that reaches files or URLs without the warning emoji"]);
    expect(checkWarnings(doc.replace("`[count:min:N]`", "`[count:min:N]` ⚠️"), forms)).toEqual(["`[count:min:N]` ⚠️: warning emoji on a tag that does not reach files or URLs"]);
    expect(checkWarnings(doc, forms.slice(1))).toEqual([`tags block has ${forms.length} row(s), the grammar has ${forms.length - 1} tag form(s)`]);
    expect(forms.filter(touchesUrlsOrFiles).map((entry) => entry.form)).toEqual(["[io:exists]"]);
  });

  it("fails: a type name missing from or extra in the doc", () => {
    expect(checkTypes(doc, [...KNOWN_TYPE_NAMES, "uuid"])).toEqual(["type 'uuid' is in the source but not in the doc"]);
    expect(checkTypes(doc, [...KNOWN_TYPE_NAMES].slice(1))).toEqual(["type 'string' is in the doc but not in the source"]);
  });

  it("fails: a documented flag missing from the CLI usage", () => {
    const bogus = cliDoc.replace("| `--quiet`", "| `--bogus`");
    expect(checkFlags(bogus, USAGE)).toEqual(["--bogus: documented in the flag table but not in the USAGE of src/cli/args.ts"]);
  });

  it("fails: an enum value missing from or extra in the doc", () => {
    expect(checkEnums(doc, { ...enums, "- Output formats": [...FORMAT_NAMES, "yaml"] })).toEqual(["- Output formats: 'yaml' is in the source but not in the doc"]);
    expect(checkEnums(doc, { ...enums, "- Rule categories": CATEGORIES.slice(1) })).toEqual(["- Rule categories: 'syntax' is in the doc but not in the source"]);
    expect(checkEnums(doc, { ...enums, "- Unknown list": ["a"] })).toEqual(["- Unknown list: bullet missing in the enums block"]);
  });
});
