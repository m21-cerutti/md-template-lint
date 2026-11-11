/**
 * Usage: pnpm run gen:syntax-doc | pnpm run check:syntax-doc
 * Generates machine-derived blocks of docs/syntax-reference.md (tags, types, families, errors, enums) between
 * HTML comments. Sources: rule registry, grammar ATN, exported constants. Prose from notes.ts.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { FORMAT_NAMES } from "../../src/cli/args.js";
import { ON_EMPTY_VALUES } from "../../src/config/types.js";
import { RUN_CODES } from "../../src/engine/directives.js";
import { createRegistry } from "../../src/engine/registry.js";
import { CATEGORIES, type AnyRule } from "../../src/engine/rule.js";
import { MdTemplateLexer } from "../../src/generated/MdTemplateLexer.js";
import { MdTemplateParser } from "../../src/generated/MdTemplateParser.js";
import type { BodyTag, FrontmatterTag } from "../../src/tags/ast.js";
import { parseDocument } from "../../src/tags/parser.js";
import { KNOWN_TYPE_NAMES } from "../../src/tags/types.js";
import { firstSymbols, sentences, sentenceText, specCodes, specRunCodes, type SpecCode, type SpecRunCode } from "../../tests/consistency/consistency.js";
import { FIX_NOTES, TAG_FIXTURES, TAG_NOTES } from "./notes.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DEFAULT_DOC = join(root, "docs", "syntax-reference.md");

export const BLOCK_NAMES = ["tags", "types", "families", "errors", "enums"] as const;
export type BlockName = (typeof BLOCK_NAMES)[number];

const MISSING = "—";
const SAME_AS_ABOVE = '"';

/** Pipes break a table cell. */
const cell = (text: string) => (text === "" ? MISSING : text.replaceAll("|", "\\|"));
const code = (text: string) => `\`${text}\``;

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export type ErrorStatus = "implemented" | "run";

export interface ErrorRow {
  readonly code: string;
  readonly name: string;
  readonly severity: string;
  readonly category: string;
  readonly status: ErrorStatus;
  readonly message: string;
}

export interface ErrorSources {
  readonly spec: readonly SpecCode[];
  readonly specRun: readonly SpecRunCode[];
  readonly registered: readonly AnyRule[];
  readonly runCodes: readonly string[];
}

/** Run errors are errors, except these (docs/spec.md 4.2: `MTL913` may be a warning). */
const RUN_SEVERITY: Readonly<Record<string, string>> = { MTL913: "error or warning" };

/**
 * The leading backtick-quoted message(s) of a spec message cell: `a`, `a` or
 * `b`, `a`, `b` or `c`. The explanation after them is dropped.
 */
export function leadingMessage(cellText: string): string {
  const connectors = [", or ", " or ", ", "];
  let end = 0;
  while (cellText[end] === "`") {
    const close = cellText.indexOf("`", end + 1);
    if (close < 0) break;
    end = close + 1;
    const rest = cellText.slice(end);
    const connector = connectors.find((candidate) => rest.startsWith(`${candidate}\``));
    if (connector === undefined) break;
    end += connector.length;
  }
  return end === 0 ? cellText : cellText.slice(0, end);
}

/** One row per code of the registry, the spec 4.3 tables and the run codes. */
export function errorRows(sources: ErrorSources): ErrorRow[] {
  const specByCode = new Map(sources.spec.map((entry) => [entry.code, entry]));
  const runByCode = new Map(sources.specRun.map((entry) => [entry.code, entry]));
  const ruleByCode = new Map<string, AnyRule>(sources.registered.map((rule) => [rule.code, rule]));
  const all = new Set<string>([...specByCode.keys(), ...runByCode.keys(), ...ruleByCode.keys(), ...sources.runCodes]);
  const rows: ErrorRow[] = [];
  for (const entry of [...all].sort()) {
    const run = runByCode.get(entry);
    if (run !== undefined || sources.runCodes.includes(entry)) {
      rows.push({
        code: entry,
        name: run?.name ?? "",
        severity: RUN_SEVERITY[entry] ?? "error",
        category: "run",
        status: "run",
        message: leadingMessage(run?.message ?? ""),
      });
      continue;
    }
    const spec = specByCode.get(entry);
    const rule = ruleByCode.get(entry);
    // `pnpm run check:rules` fails for a spec code without a real rule, so every other row is implemented.
    rows.push({
      code: entry,
      name: spec?.name ?? rule?.name ?? "",
      severity: spec?.severity ?? rule?.severity ?? "",
      category: spec?.category ?? rule?.category ?? "",
      status: "implemented",
      message: leadingMessage(spec?.message ?? ""),
    });
  }
  return rows;
}

export function renderErrors(rows: readonly ErrorRow[]): string {
  const lines = ["| Code | Name | Severity | Category | Status | Message | Typical fix |", "| ---- | ---- | -------- | -------- | ------ | ------- | ----------- |"];
  for (const row of rows) {
    const fix = FIX_NOTES[row.code] ?? "";
    lines.push(`| ${code(row.code)} | ${cell(row.name)} | ${cell(row.severity)} | ${cell(row.category)} | ` + `${row.status} | ${cell(row.message)} | ${cell(fix)} |`);
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

export interface TagForm {
  readonly region: "frontmatter" | "heading";
  /** The family keyword, first word of the tag (`presence`, `format`, ...). */
  readonly family: string;
  /** Normalised form: numbers are `N`, free text is `<text>`. */
  readonly form: string;
}

const TAG_REGIONS = [
  { region: "frontmatter", rule: MdTemplateParser.RULE_fmTagBody },
  { region: "heading", rule: MdTemplateParser.RULE_bodyTagBody },
] as const;

/** Tokens that stand for user text: the sample text of the lexer is replaced by a placeholder. */
const PLACEHOLDERS: Readonly<Record<string, string>> = {
  NUMBER: "N",
  FREE_TEXT: "<text>",
  SCHEME_TEXT: "<schemes>",
  PATTERN_QUOTE: '"<pattern>',
  PAT_END: '"',
};

const tokenName = (type: number) => MdTemplateLexer.symbolicNames[type] ?? String(type);

/** A sign or a decimal part does not change the form: `-N.N` is `N`. */
function withoutNumberDecoration(tokens: readonly number[]): number[] {
  const kept: number[] = [];
  for (let index = 0; index < tokens.length; index += 1) {
    const name = tokenName(tokens[index] ?? -1);
    if (name === "DASH") continue;
    if (name === "DOT") {
      index += 1;
      continue;
    }
    kept.push(tokens[index] ?? -1);
  }
  return kept;
}

/**
 * Text of one token: its placeholder, else its literal (`'count'`, the written
 * form; a case-insensitive rule would sample as `COUNT`), else the text its
 * lexer rule matches (`:`, case-sensitive keywords).
 */
function tokenForm(token: number): string {
  const placeholder = PLACEHOLDERS[tokenName(token)];
  if (placeholder !== undefined) return placeholder;
  const literal = MdTemplateLexer.literalNames[token];
  if (literal !== null && literal !== undefined) return literal.slice(1, -1);
  const text = sentenceText([token]);
  if (typeof text !== "string") throw new Error(`syntax-doc: ${text.problem}`);
  return text;
}

/** Every tag form of the grammar, frontmatter first, families sorted, forms in grammar order. */
export function tagForms(): TagForm[] {
  const atn = MdTemplateParser._ATN;
  const forms: TagForm[] = [];
  for (const { region, rule } of TAG_REGIONS) {
    const found: TagForm[] = [];
    for (const alternative of firstSymbols(atn, rule).rules) {
      for (const sentence of sentences(atn, alternative)) {
        const last = sentence.at(-1);
        // `constant:` with no text is the empty-argument form of the `constant:<text>` entry.
        if (last !== undefined && tokenName(last).endsWith("_ARG")) continue;
        const tokens = withoutNumberDecoration(sentence);
        const family = tokenForm(tokens[0] ?? -1);
        const form = `[${tokens.map(tokenForm).join("")}]`;
        if (!found.some((entry) => entry.family === family && entry.form === form)) {
          found.push({ region, family, form });
        }
      }
    }
    const families = [...new Set(found.map((entry) => entry.family))].sort();
    for (const family of families) forms.push(...found.filter((entry) => entry.family === family));
  }
  return forms;
}

/** The `io` family is the only one that reaches the filesystem or the network (`env.io` in src/rules/io.ts): it gets the warning mark. */
export const touchesUrlsOrFiles = (entry: TagForm) => entry.family === "io";

export const WARNING = "⚠️";

/** A fixture path with a `pass-` case folder or file in it (tests/README.md, the `pass-` and `fail-` rule). */
export const isPassFixture = (path: string) => /(^|\/)pass-[^/]*(\/|$)/.test(path);

/**
 * Grammar family of each AST tag kind (src/tags/ast.ts), keyed per region. The compiler rejects a
 * missing or extra kind. The tag text itself is never read here: the project parser decides what is a tag.
 */
const FRONTMATTER_FAMILY = {
  presence: "presence",
  "format-constant": "format",
  "format-case": "format",
  "format-elements": "format",
  "format-shape": "format",
  "format-elements-shape": "format",
  "format-scheme": "format",
  "value-filename": "value",
  count: "count",
  range: "range",
  "order-ascending": "order",
  "io-exists": "io",
  "filename-case": "filename",
  "unique-names": "unique-headings-names",
  "frontmatter-optional": "frontmatter",
} satisfies Record<FrontmatterTag["kind"], string>;

const BODY_FAMILY = {
  presence: "presence",
  content: "content",
  "content-lines": "content",
  pattern: "pattern",
  repeat: "repeat-rules",
  order: "order",
  "unique-names": "unique-headings-names",
} satisfies Record<BodyTag["kind"], string>;

/**
 * Families of the well-formed tags of a template, per region (`heading` is the `body` region of the AST),
 * as parsed by src/tags/parser.ts. A malformed or misplaced bracket, a standalone comment line other than
 * the filename, unique-names and frontmatter-optional switches, a fenced heading and body prose give no tag.
 */
export function documentTagFamilies(text: string): Record<TagForm["region"], ReadonlySet<string>> {
  const document = parseDocument(text);
  const frontmatter = new Set<string>();
  for (const line of document.frontmatter?.lines ?? []) {
    if (line.kind === "key") {
      for (const tag of [...(line.comment?.tags ?? []), ...(line.comment?.inertTags ?? [])]) frontmatter.add(FRONTMATTER_FAMILY[tag.kind]);
    } else if ((line.kind === "filename" || line.kind === "unique-names" || line.kind === "frontmatter-optional") && line.tag !== null) {
      frontmatter.add(FRONTMATTER_FAMILY[line.tag.kind]);
    }
  }
  const heading = new Set<string>();
  for (const block of document.body) {
    if (block.kind === "heading") for (const tag of block.tags) heading.add(BODY_FAMILY[tag.kind]);
  }
  return { frontmatter, heading };
}

/**
 * Link to the pass fixture of a tag family, written for the doc in `docs/` (hence `../`). Throws when the fixture is not a `pass-` case,
 * does not exist, or does not hold the family tag in the region of the form.
 */
export function fixtureLink(entry: TagForm, fixtures: Readonly<Record<string, string>> = TAG_FIXTURES, base: string = root): string {
  const key = `${entry.region}:${entry.family}`;
  const path = fixtures[key];
  if (path === undefined) throw new Error(`syntax-doc: no TAG_FIXTURES entry for '${key}' in scripts/syntax-doc/notes.ts`);
  if (!isPassFixture(path)) throw new Error(`syntax-doc: TAG_FIXTURES['${key}'] is not a pass fixture: ${path}`);
  let text: string;
  try {
    text = readFileSync(join(base, path), "utf8");
  } catch {
    throw new Error(`syntax-doc: TAG_FIXTURES['${key}'] does not exist: ${path}`);
  }
  if (!documentTagFamilies(text)[entry.region].has(entry.family)) throw new Error(`syntax-doc: TAG_FIXTURES['${key}'] has no [${entry.family}] tag in its ${entry.region}: ${path}`);
  const id = /MTL\d{3}/.exec(path)?.[0] ?? "fixture";
  return `[${id} pass](../${path})`;
}

export function renderTags(forms: readonly TagForm[], fixtures: Readonly<Record<string, string>> = TAG_FIXTURES, base: string = root): string {
  const lines = [`${WARNING} marks a tag that reads the filesystem or the network.`, "", "| Region | Family | Tag form | Description | Example | Fixture |", "| ------ | ------ | -------- | ----------- | ------- | ------- |"];
  let previous = "";
  for (const entry of forms) {
    const key = `${entry.region}:${entry.family}`;
    const first = key !== previous;
    previous = key;
    const note = TAG_NOTES[key];
    const description = first ? cell(note?.description ?? "") : SAME_AS_ABOVE;
    const example = first ? cell(note?.example ?? "") : SAME_AS_ABOVE;
    const form = touchesUrlsOrFiles(entry) ? `${code(entry.form)} ${WARNING}` : code(entry.form);
    lines.push(`| ${entry.region} | ${code(entry.family)} | ${form} | ${description} | ${example} | ${fixtureLink(entry, fixtures, base)} |`);
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Families and type hints
// ---------------------------------------------------------------------------

/** One error family (the rule category, or `run`): its codes. */
export function renderFamilies(rows: readonly ErrorRow[]): string {
  const families = new Map<string, ErrorRow[]>();
  for (const row of rows) families.set(row.category, [...(families.get(row.category) ?? []), row]);
  const lines = ["| Family | Code range | Count | Severities |", "| ------ | ---------- | ----- | ---------- |"];
  for (const [family, members] of families) {
    const codes = members.map((row) => row.code);
    const severities = [...new Set(members.flatMap((row) => row.severity.split(" or ")))].sort();
    lines.push(`| ${code(family)} | ${code(codes[0] ?? "")}–${code(codes.at(-1) ?? "")} | ${members.length} | ${severities.join(", ")} |`);
  }
  return lines.join("\n");
}

/** The type names, one bullet each; each is also the one-word hint `[<name>]`. */
export function renderTypes(names: Iterable<string>): string {
  const list = [...names];
  return [`${list.length} type names; each one is also the type hint \`[<type-name>]\`:`, "", ...list.map((name) => `- ${code(name)}`)].join("\n");
}

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

const list = (values: Iterable<string>) => [...values].map(code).join(", ");

export function renderEnums(): string {
  return [`- Output formats (\`--format\`): ${list(FORMAT_NAMES)}`, `- \`onEmpty\` values: ${list(ON_EMPTY_VALUES)}`, `- Field types (${KNOWN_TYPE_NAMES.size}): ${list(KNOWN_TYPE_NAMES)}`, `- Rule categories: ${list(CATEGORIES)}`].join("\n");
}

// ---------------------------------------------------------------------------
// Blocks
// ---------------------------------------------------------------------------

/** The generated text of each block, lines joined with `\n`. */
export function generateBlocks(): Record<BlockName, string> {
  const rows = errorRows({
    spec: specCodes(),
    specRun: specRunCodes(),
    registered: createRegistry().rules,
    runCodes: RUN_CODES,
  });
  return {
    tags: renderTags(tagForms()),
    types: renderTypes(KNOWN_TYPE_NAMES),
    families: renderFamilies(rows),
    errors: renderErrors(rows),
    enums: renderEnums(),
  };
}

const beginMarker = (name: BlockName) => `<!-- BEGIN GENERATED: ${name} -->`;
const endMarker = (name: BlockName) => `<!-- END GENERATED: ${name} -->`;

/** Offsets of the content of block `name`: just after its BEGIN marker, just before its END marker. */
function blockRange(doc: string, name: BlockName): { start: number; end: number } {
  const begin = doc.indexOf(beginMarker(name));
  const end = doc.indexOf(endMarker(name));
  if (begin < 0 || end < 0 || doc.indexOf(beginMarker(name), begin + 1) >= 0) {
    throw new Error(`syntax-doc: need exactly one '${beginMarker(name)}' and its END marker`);
  }
  if (end < begin) throw new Error(`syntax-doc: block '${name}' ends before it begins`);
  return { start: begin + beginMarker(name).length, end };
}

/** The doc with every generated block replaced; the rest is returned byte for byte. */
export function applyBlocks(doc: string, blocks: Readonly<Record<BlockName, string>>): string {
  const eol = doc.includes("\r\n") ? "\r\n" : "\n";
  let out = doc;
  for (const name of BLOCK_NAMES) {
    const { start, end } = blockRange(out, name);
    const body = blocks[name].replaceAll("\n", eol);
    out = `${out.slice(0, start)}${eol}${body}${eol}${out.slice(end)}`;
  }
  return out;
}

/** Current content of block `name`, lines joined with `\n`, without the framing line breaks. */
function currentBlock(doc: string, name: BlockName): string {
  const { start, end } = blockRange(doc, name);
  return doc.slice(start, end).replaceAll("\r\n", "\n").replace(/^\n/, "").replace(/\n$/, "");
}

/** Line diff (`- ` removed, `+ ` added, unchanged lines dropped) by longest common subsequence. */
export function lineDiff(before: string, after: string): string[] {
  const a = before.split("\n");
  const b = after.split("\n");
  const table = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      const row = table[i] ?? [];
      row[j] = a[i] === b[j] ? (table[i + 1]?.[j + 1] ?? 0) + 1 : Math.max(table[i + 1]?.[j] ?? 0, row[j + 1] ?? 0);
    }
  }
  const out: string[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      i += 1;
      j += 1;
    } else if (j >= b.length || (i < a.length && (table[i + 1]?.[j] ?? 0) >= (table[i]?.[j + 1] ?? 0))) {
      out.push(`- ${a[i]}`);
      i += 1;
    } else {
      out.push(`+ ${b[j]}`);
      j += 1;
    }
  }
  return out;
}

/** Stale blocks of `doc` with their diff; empty when the doc is current. */
export function staleBlocks(doc: string, blocks: Readonly<Record<BlockName, string>>): { name: BlockName; diff: string[] }[] {
  const stale: { name: BlockName; diff: string[] }[] = [];
  for (const name of BLOCK_NAMES) {
    const current = currentBlock(doc, name);
    if (current !== blocks[name]) stale.push({ name, diff: lineDiff(current, blocks[name]) });
  }
  return stale;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

/** Returns the process exit code: 0 ok, 1 stale (check), 2 usage or marker error. */
export function main(argv: readonly string[]): number {
  const [mode, flag, path] = argv;
  const usage = "usage: generate.ts <write|check> [--file <path>]";
  if ((mode !== "write" && mode !== "check") || (flag !== undefined && flag !== "--file")) {
    process.stderr.write(`${usage}\n`);
    return 2;
  }
  if (flag === "--file" && path === undefined) {
    process.stderr.write(`${usage}\n`);
    return 2;
  }
  const file = path === undefined ? DEFAULT_DOC : resolve(path);
  try {
    const doc = readFileSync(file, "utf8");
    const blocks = generateBlocks();
    if (mode === "write") {
      const updated = applyBlocks(doc, blocks);
      if (updated !== doc) writeFileSync(file, updated, "utf8");
      process.stdout.write(`gen:syntax-doc ${updated === doc ? "unchanged" : "updated"}: ${file}\n`);
      return 0;
    }
    const stale = staleBlocks(doc, blocks);
    if (stale.length === 0) {
      process.stdout.write(`check:syntax-doc OK: ${file}\n`);
      return 0;
    }
    process.stderr.write(`check:syntax-doc FAILED: ${file} is stale.\n` + stale.map(({ name, diff }) => `block '${name}':\n${diff.map((line) => `  ${line}\n`).join("")}`).join("") + "Run `pnpm run gen:syntax-doc` and commit.\n");
    return 1;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    return 2;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  process.exitCode = main(process.argv.slice(2));
}
