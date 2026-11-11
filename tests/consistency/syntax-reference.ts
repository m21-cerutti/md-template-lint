/**
 * Drift checks of docs/syntax-reference.md (run by `syntax-reference.test.ts`
 * inside `pnpm run check:rules`). Each check returns human-readable problems;
 * an empty list means no drift. The generated blocks come from
 * scripts/syntax-doc/generate.ts; the checks here also cover what the generator
 * does not: note coverage, the CLI flags (documented in docs/cli.md) and enum lists.
 */
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { isPassFixture, staleBlocks, touchesUrlsOrFiles, WARNING, type BlockName, type ErrorRow, type TagForm } from "../../scripts/syntax-doc/generate.js";
import type { AnyRule } from "../../src/engine/rule.js";
import { ROOT } from "./consistency.js";

export const DOC_PATH = join(ROOT, "docs", "syntax-reference.md");
export const readDoc = () => readFileSync(DOC_PATH, "utf8");
export const CLI_DOC_PATH = join(ROOT, "docs", "cli.md");
export const readCliDoc = () => readFileSync(CLI_DOC_PATH, "utf8");

const REGENERATE = "run `pnpm run gen:syntax-doc` and commit";

/** `region:family` key of a tag form, as notes.ts and the generator key them. */
export const tagKey = (form: TagForm) => `${form.region}:${form.family}`;

/** A generated block of the doc differs from what the sources produce. */
export function checkFresh(doc: string, blocks: Readonly<Record<BlockName, string>>): string[] {
  return staleBlocks(doc, blocks).map(({ name, diff }) => `docs/syntax-reference.md block '${name}' is stale, ${REGENERATE}:\n${diff.join("\n")}`);
}

/** Every code and tag family has a note; every note belongs to a known code or family. */
export function checkNotes(rows: readonly ErrorRow[], forms: readonly TagForm[], fixNotes: Readonly<Record<string, string>>, tagNotes: Readonly<Record<string, unknown>>): string[] {
  const problems: string[] = [];
  const codes = new Set(rows.map((row) => row.code));
  const families = new Set(forms.map(tagKey));
  for (const code of codes) {
    if (!(code in fixNotes)) problems.push(`${code}: no FIX_NOTES entry in scripts/syntax-doc/notes.ts`);
  }
  for (const family of families) {
    if (!(family in tagNotes)) {
      problems.push(`${family}: no TAG_NOTES entry in scripts/syntax-doc/notes.ts`);
    }
  }
  for (const key of Object.keys(fixNotes)) {
    if (!codes.has(key)) problems.push(`FIX_NOTES.${key}: orphan note, no such code`);
  }
  for (const key of Object.keys(tagNotes)) {
    if (!families.has(key)) problems.push(`TAG_NOTES['${key}']: orphan note, no such tag family`);
  }
  return problems;
}

/** Lines of generated block `name`, or undefined when the doc has no such block. */
function blockLines(doc: string, name: BlockName): string[] | undefined {
  const text = doc.replaceAll("\r\n", "\n");
  const begin = `<!-- BEGIN GENERATED: ${name} -->\n`;
  const start = text.indexOf(begin);
  const end = text.indexOf(`\n<!-- END GENERATED: ${name} -->`);
  if (start < 0 || end < start) return undefined;
  return text.slice(start + begin.length, end).split("\n");
}

const tableCells = (line: string) =>
  line
    .slice(1, line.lastIndexOf("|"))
    .split("|")
    .map((entry) => entry.trim());

/**
 * The family table counts the codes the registry holds per category, and the run codes under `run`.
 * `registered` and `runCodes` are the source of truth, the doc is what is checked.
 */
export function checkFamilies(doc: string, registered: readonly AnyRule[], runCodes: readonly string[]): string[] {
  const lines = blockLines(doc, "families");
  if (lines === undefined) return ["docs/syntax-reference.md: families block not found"];
  const expected = new Map<string, number>();
  for (const rule of registered) expected.set(rule.category, (expected.get(rule.category) ?? 0) + 1);
  expected.set("run", runCodes.length);
  const documented = new Map<string, number>();
  for (const line of lines.filter((entry) => entry.startsWith("| `"))) {
    const [family = "", , count = ""] = tableCells(line);
    documented.set(family.replaceAll("`", ""), Number(count));
  }
  const problems: string[] = [];
  for (const [family, count] of expected) {
    const found = documented.get(family);
    if (found === undefined) problems.push(`${family}: family missing in the families block`);
    else if (found !== count) problems.push(`${family}: the doc counts ${found} code(s), the source has ${count}`);
  }
  for (const family of documented.keys()) {
    if (!expected.has(family)) problems.push(`${family}: in the families block but not in the source`);
  }
  return problems;
}

/** Rows of the tags block: one per tag form. */
function tagRows(doc: string): string[] | undefined {
  return blockLines(doc, "tags")?.filter((line) => /^\| (frontmatter|heading) \|/.test(line));
}

/** Every tag form row ends with a link to an existing pass fixture; the doc is at `docDir`. */
export function checkTagLinks(doc: string, forms: readonly TagForm[], docDir: string): string[] {
  const rows = tagRows(doc);
  if (rows === undefined) return ["docs/syntax-reference.md: tags block not found"];
  const problems: string[] = [];
  if (rows.length !== forms.length) problems.push(`tags block has ${rows.length} row(s), the grammar has ${forms.length} tag form(s)`);
  for (const row of rows) {
    const form = tableCells(row)[2] ?? row;
    const target = /\]\(([^)]+)\)\s*\|$/.exec(row)?.[1];
    if (target === undefined) problems.push(`${form}: no fixture link in the last column`);
    else if (!isPassFixture(target)) problems.push(`${form}: ${target} is not a pass fixture`);
    else if (!existsSync(resolve(docDir, target))) problems.push(`${form}: ${target} does not exist`);
  }
  return problems;
}

/** The warning emoji marks exactly the tag forms that reach files or URLs (`touchesUrlsOrFiles` of the generator); rows follow `forms`. */
export function checkWarnings(doc: string, forms: readonly TagForm[]): string[] {
  const rows = tagRows(doc);
  if (rows === undefined) return ["docs/syntax-reference.md: tags block not found"];
  if (rows.length !== forms.length) return [`tags block has ${rows.length} row(s), the grammar has ${forms.length} tag form(s)`];
  const problems: string[] = [];
  for (const [index, row] of rows.entries()) {
    const form = tableCells(row)[2] ?? row;
    const expected = forms[index] !== undefined && touchesUrlsOrFiles(forms[index]);
    const marked = row.includes(WARNING);
    if (expected && !marked) problems.push(`${form}: tag that reaches files or URLs without the warning emoji`);
    if (!expected && marked) problems.push(`${form}: warning emoji on a tag that does not reach files or URLs`);
  }
  return problems;
}

/** The type hints block lists exactly the type names, one per bullet. */
export function checkTypes(doc: string, names: Iterable<string>): string[] {
  const lines = blockLines(doc, "types");
  if (lines === undefined) return ["docs/syntax-reference.md: types block not found"];
  const documented = lines.filter((line) => line.startsWith("- `")).map((line) => line.slice(3, line.lastIndexOf("`")));
  const source = [...names];
  return [
    ...source.filter((name) => !documented.includes(name)).map((name) => `type '${name}' is in the source but not in the doc`),
    ...documented.filter((name) => !source.includes(name)).map((name) => `type '${name}' is in the doc but not in the source`),
  ];
}

/** Long flags (`--name`) in the first column of the flag table of the `## Flags` section of docs/cli.md. */
export function documentedFlags(doc: string): string[] {
  const text = doc.replaceAll("\r\n", "\n");
  const start = text.indexOf("\n## Flags\n");
  if (start < 0) throw new Error("docs/cli.md: section '## Flags' not found");
  const end = text.indexOf("\n## ", start + 1);
  const flags: string[] = [];
  for (const line of text.slice(start, end < 0 ? undefined : end).split("\n")) {
    if (!line.startsWith("| `-")) continue;
    for (const match of (line.split("|")[1] ?? "").matchAll(/--[a-z][a-z-]*/g)) flags.push(match[0]);
  }
  return flags;
}

/** Every documented long flag is in the CLI usage text (src/cli/args.ts USAGE). */
export function checkFlags(doc: string, usage: string): string[] {
  const flags = documentedFlags(doc);
  if (flags.length === 0) return ["docs/cli.md: no flag found in the flag table"];
  return flags.filter((flag) => !usage.split(/\s+/).some((word) => word.replace(/[,=].*$/, "") === flag)).map((flag) => `${flag}: documented in the flag table but not in the USAGE of src/cli/args.ts`);
}

/** Back-quoted values after the first `: ` of the bullet that starts with `prefix`. */
function bulletValues(block: string, prefix: string): string[] | undefined {
  const line = block.split("\n").find((entry) => entry.startsWith(prefix));
  if (line === undefined) return undefined;
  const colon = line.indexOf(": `");
  return colon < 0 ? [] : [...line.slice(colon).matchAll(/`([^`]+)`/g)].map((m) => m[1] ?? "");
}

/**
 * The enums block lists exactly the values of the source constants.
 * `expected` maps a bullet prefix (`- Rule categories`) to the constant.
 */
export function checkEnums(doc: string, expected: Readonly<Record<string, Iterable<string>>>): string[] {
  const text = doc.replaceAll("\r\n", "\n");
  const begin = "<!-- BEGIN GENERATED: enums -->\n";
  const start = text.indexOf(begin);
  const end = text.indexOf("\n<!-- END GENERATED: enums -->");
  if (start < 0 || end < start) return ["docs/syntax-reference.md: enums block not found"];
  const block = text.slice(start + begin.length, end);
  const problems: string[] = [];
  for (const [prefix, constant] of Object.entries(expected)) {
    const documented = bulletValues(block, prefix);
    if (documented === undefined) {
      problems.push(`${prefix}: bullet missing in the enums block`);
      continue;
    }
    const source = [...constant];
    for (const value of source.filter((entry) => !documented.includes(entry))) {
      problems.push(`${prefix}: '${value}' is in the source but not in the doc`);
    }
    for (const value of documented.filter((entry) => !source.includes(entry))) {
      problems.push(`${prefix}: '${value}' is in the doc but not in the source`);
    }
  }
  return problems;
}
