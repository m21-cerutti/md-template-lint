/**
 * `pnpm run check:rules`: docs/syntax-reference.md agrees with the grammar, the
 * registry, the source constants and the CLI. One passing case per check on the
 * real tree, then drift cases that feed deliberately broken inputs.
 */
import { describe, expect, it } from "vitest";
import {
  errorRows,
  generateBlocks,
  tagForms,
  type ErrorRow,
  type TagForm,
} from "../../scripts/syntax-doc/generate.js";
import { FIX_NOTES, TAG_NOTES } from "../../scripts/syntax-doc/notes.js";
import { FORMAT_NAMES, USAGE } from "../../src/cli/args.js";
import { ON_EMPTY_VALUES } from "../../src/config/types.js";
import { RUN_CODES } from "../../src/engine/directives.js";
import { createRegistry } from "../../src/engine/registry.js";
import { CATEGORIES, defineRule, notImplemented } from "../../src/engine/rule.js";
import { KNOWN_TYPE_NAMES } from "../../src/tags/types.js";
import { pendingCodes, specCodes, specRunCodes } from "./consistency.js";
import {
  checkEnums,
  checkFlags,
  checkFresh,
  checkNotes,
  checkPending,
  documentedFlags,
  readDoc,
} from "./syntax-reference.js";

const registered = createRegistry().rules;
const pending = pendingCodes();
const rows: ErrorRow[] = errorRows({
  spec: specCodes(),
  specRun: specRunCodes(),
  registered,
  pending,
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

  it("passes: generated blocks are current", () => {
    expect(checkFresh(doc, generateBlocks())).toEqual([]);
  });

  it("passes: every code and tag family has a note, no orphan note", () => {
    expect(checkNotes(rows, forms, FIX_NOTES, TAG_NOTES)).toEqual([]);
  });

  it("passes: nothing pending is implemented or already in the grammar", () => {
    expect(checkPending(pending, registered, doc, forms)).toEqual([]);
  });

  it("passes: documented flags are in the CLI, enum lists match the source", () => {
    expect(checkFlags(doc, USAGE)).toEqual([]);
    expect(checkEnums(doc, enums)).toEqual([]);
  });

  it("reads non-empty inputs (a style change cannot make a check pass on nothing)", () => {
    expect(rows.length).toBeGreaterThan(80);
    expect(forms.length).toBeGreaterThan(40);
    expect(documentedFlags(doc)).toEqual([
      "--config",
      "--format",
      "--quiet",
      "--verify",
      "--version",
      "--help",
    ]);
  });

  it("fails: a stale generated block, with the command to run", () => {
    const stale = doc.replace("| `MTL001` |", "| `MTL001` | renamed-by-hand |");
    const problems = checkFresh(stale, generateBlocks());
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("block 'errors' is stale");
    expect(problems[0]).toContain("pnpm run gen:syntax-doc");
  });

  it("fails: a code or a tag family without a note, and orphan notes", () => {
    const without = <T>(notes: Readonly<Record<string, T>>, key: string) =>
      Object.fromEntries(Object.entries(notes).filter(([name]) => name !== key));
    expect(
      checkNotes(rows, forms, without(FIX_NOTES, "MTL001"), without(TAG_NOTES, "heading:pattern")),
    ).toEqual([
      "MTL001: no FIX_NOTES entry in scripts/syntax-doc/notes.ts",
      "heading:pattern: no TAG_NOTES entry in scripts/syntax-doc/notes.ts",
    ]);
    const note = { description: "x", example: "y" };
    expect(
      checkNotes(
        rows,
        forms,
        { ...FIX_NOTES, MTL999: "x" },
        { ...TAG_NOTES, "heading:ghost": note },
      ),
    ).toEqual([
      "FIX_NOTES.MTL999: orphan note, no such code",
      "TAG_NOTES['heading:ghost']: orphan note, no such tag family",
    ]);
  });

  it("fails: a pending code that is implemented, a pending tag already in the grammar", () => {
    const implemented = registered.find((rule) => rule.code === "MTL301");
    expect(implemented).toBeDefined();
    expect(checkPending({ MTL301: "x" }, registered, doc, forms)).toEqual([
      "MTL301: pending but implemented in src/rules",
    ]);
    const stub = defineRule({
      code: "MTL301",
      name: "constant-mismatch",
      severity: "error",
      category: "format",
      phase: "field",
      step: "constant",
      check: notImplemented("MTL301"),
    });
    expect(checkPending({ MTL301: "x" }, [stub], doc, forms)).toEqual([]);
    const marked = `${doc}\n- \`[format:semver]\` (pending)\n- \`[format:ghost]\` (pending)\n`;
    expect(checkPending({}, registered, marked, forms)).toEqual([
      "[format:semver]: marked (pending) in the doc but already in the grammar",
    ]);
  });

  it("fails: a documented flag missing from the CLI usage", () => {
    const bogus = doc.replace("| `--quiet`", "| `--bogus`");
    expect(checkFlags(bogus, USAGE)).toEqual([
      "--bogus: documented in the CLI table but not in the USAGE of src/cli/args.ts",
    ]);
  });

  it("fails: an enum value missing from or extra in the doc", () => {
    expect(checkEnums(doc, { ...enums, "- Output formats": [...FORMAT_NAMES, "yaml"] })).toEqual([
      "- Output formats: 'yaml' is in the source but not in the doc",
    ]);
    expect(checkEnums(doc, { ...enums, "- Rule categories": CATEGORIES.slice(1) })).toEqual([
      "- Rule categories: 'syntax' is in the doc but not in the source",
    ]);
    expect(checkEnums(doc, { ...enums, "- Unknown list": ["a"] })).toEqual([
      "- Unknown list: bullet missing in the enums block",
    ]);
  });
});
