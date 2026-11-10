/**
 * Drift checks of docs/syntax-reference.md (run by `syntax-reference.test.ts`
 * inside `pnpm run check:rules`). Each check returns human-readable problems;
 * an empty list means no drift. The generated blocks come from
 * scripts/syntax-doc/generate.ts; the checks here also cover what the generator
 * does not: note coverage, pending markers, CLI flags and enum lists.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  staleBlocks,
  type BlockName,
  type ErrorRow,
  type TagForm,
} from "../../scripts/syntax-doc/generate.js";
import type { AnyRule } from "../../src/engine/rule.js";
import { isStub } from "../../src/engine/rule.js";
import { ROOT } from "./consistency.js";

export const DOC_PATH = join(ROOT, "docs", "syntax-reference.md");
export const readDoc = () => readFileSync(DOC_PATH, "utf8");

const REGENERATE = "run `pnpm run gen:syntax-doc` and commit";

/** `region:family` key of a tag form, as notes.ts and the generator key them. */
export const tagKey = (form: TagForm) => `${form.region}:${form.family}`;

/** A generated block of the doc differs from what the sources produce. */
export function checkFresh(doc: string, blocks: Readonly<Record<BlockName, string>>): string[] {
  return staleBlocks(doc, blocks).map(
    ({ name, diff }) =>
      `docs/syntax-reference.md block '${name}' is stale, ${REGENERATE}:\n${diff.join("\n")}`,
  );
}

/** Every code and tag family has a note; every note belongs to a known code or family. */
export function checkNotes(
  rows: readonly ErrorRow[],
  forms: readonly TagForm[],
  fixNotes: Readonly<Record<string, string>>,
  tagNotes: Readonly<Record<string, unknown>>,
): string[] {
  const problems: string[] = [];
  const codes = new Set(rows.map((row) => row.code));
  const families = new Set(forms.map(tagKey));
  for (const code of codes) {
    if (!(code in fixNotes))
      problems.push(`${code}: no FIX_NOTES entry in scripts/syntax-doc/notes.ts`);
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

/**
 * Pending means not built yet: a pending code has no implemented rule (a
 * scaffold stub does not count) and a tag form the doc marks `(pending)` is
 * not in the grammar. Both are vacuous while nothing is pending.
 */
export function checkPending(
  pending: Readonly<Record<string, string>>,
  registered: readonly AnyRule[],
  doc: string,
  forms: readonly TagForm[],
): string[] {
  const problems: string[] = [];
  const implemented = new Set<string>(
    registered.filter((rule) => !isStub(rule)).map((rule) => rule.code),
  );
  for (const code of Object.keys(pending)) {
    if (implemented.has(code)) problems.push(`${code}: pending but implemented in src/rules`);
  }
  const inGrammar = new Set(forms.map((form) => form.form));
  for (const line of doc.replaceAll("\r\n", "\n").split("\n")) {
    if (!line.includes("(pending)")) continue;
    for (const match of line.matchAll(/`(\[[^`]+\])`/g)) {
      const form = match[1] ?? "";
      if (inGrammar.has(form)) {
        problems.push(`${form}: marked (pending) in the doc but already in the grammar`);
      }
    }
  }
  return problems;
}

/** Long flags (`--name`) in the first column of the flag table of the doc's `## CLI` section. */
export function documentedFlags(doc: string): string[] {
  const text = doc.replaceAll("\r\n", "\n");
  const start = text.indexOf("\n## CLI\n");
  if (start < 0) throw new Error("docs/syntax-reference.md: section '## CLI' not found");
  const end = text.indexOf("\n## ", start + 1);
  const flags: string[] = [];
  for (const line of text.slice(start, end < 0 ? undefined : end).split("\n")) {
    if (!line.startsWith("| `-")) continue;
    for (const match of (line.split("|")[1] ?? "").matchAll(/--[a-z][a-z-]*/g))
      flags.push(match[0]);
  }
  return flags;
}

/** Every documented long flag is in the CLI usage text (src/cli/args.ts USAGE). */
export function checkFlags(doc: string, usage: string): string[] {
  const flags = documentedFlags(doc);
  if (flags.length === 0) return ["docs/syntax-reference.md: no flag found in the CLI table"];
  return flags
    .filter((flag) => !usage.split(/\s+/).some((word) => word.replace(/[,=].*$/, "") === flag))
    .map((flag) => `${flag}: documented in the CLI table but not in the USAGE of src/cli/args.ts`);
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
export function checkEnums(
  doc: string,
  expected: Readonly<Record<string, Iterable<string>>>,
): string[] {
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
