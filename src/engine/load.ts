/**
 * Load a Markdown template or target (docs/spec.md 1.1, 1.2, 2.1, 2.6):
 * grammar parse (src/tags/parser.ts analyzeDocument, with the collecting
 * listeners), YAML values with `yaml` (failsafe, uniqueKeys false), inline
 * comments joined to top-level keys BY LINE, sections of every heading level
 * (H1 to H6, with parents), inferred types.
 */
import { readFile } from "node:fs/promises";
import { isAlias, isCollection, isMap, isScalar, isSeq, LineCounter, parseDocument as parseYaml, visit, type Document } from "yaml";
import type { BodyHeading, FrontmatterComment, FrontmatterOptionalPlacement, MarkdownDocument, Region, TagFinding } from "../tags/ast.js";
import { analyzeDocument, InternalParseError, normalizeLineEnds } from "../tags/parser.js";
import { inferType } from "./infer.js";
import type { DocumentModel, Field, HeadingLevel, LoadResult, ParseFailure, Section, YamlValue } from "./model.js";

function fail(reason: ParseFailure["reason"], detail = ""): LoadResult {
  return { ok: false, failure: { reason, detail } };
}

/** A YAML node as a failsafe value: scalars are strings, an empty value is "". */
function toValue(node: unknown, doc: Document): YamlValue {
  if (isAlias(node)) return toValue(node.resolve(doc), doc);
  if (isScalar(node)) return node.value === null || node.value === undefined ? "" : String(node.value);
  if (isSeq(node)) return node.items.map((item) => toValue(item, doc));
  if (isMap(node)) {
    const map = new Map<string, YamlValue>();
    for (const pair of node.items) map.set(keyName(pair.key), toValue(pair.value, doc));
    return map;
  }
  return "";
}

/** A tag finding or a directive written in the body (kept as is by every filter). */
function isBodyRegion(item: { readonly region: Region }): boolean {
  return item.region === "body";
}

function keyName(key: unknown): string {
  if (key === null || key === undefined) return "";
  if (isScalar(key)) return key.value === null || key.value === undefined ? "" : String(key.value);
  return String(key);
}

/**
 * File lines after the first line of a multi-line scalar or flow value: a `#`
 * line there is value text, not a YAML comment (spec 4.4 DIR3).
 */
function valueInteriorLines(doc: Document, lineCounter: LineCounter, startLine: number) {
  const lines = new Set<number>();
  const fileLine = (offset: number) => lineCounter.linePos(offset).line + startLine;
  visit(doc, {
    Node(_key, node) {
      const multiLine = isScalar(node) || (isCollection(node) && node.flow === true);
      if (!multiLine || node.range === undefined || node.range === null) return;
      const [start, end] = node.range;
      const last = fileLine(Math.max(start, end - 1));
      for (let line = fileLine(start) + 1; line <= last; line += 1) lines.add(line);
    },
  });
  return lines;
}

const LEVELS: readonly HeadingLevel[] = [1, 2, 3, 4, 5, 6];

/**
 * Sections from the headings of every level (spec 2.6, change C10): a body
 * runs to the next heading of equal or higher level; the parent is the nearest
 * preceding heading with a lower level.
 */
function buildSections(headings: readonly BodyHeading[], fileLines: readonly string[]): Section[] {
  // One pass with a stack of open headings (strictly increasing levels): heading j closes every
  // open heading of level >= its own (their end is the line before j), and the one left on top
  // is its parent.
  const ends = headings.map(() => fileLines.length);
  const parents: (number | null)[] = [];
  const open: number[] = [];
  headings.forEach((heading, index) => {
    let top = open[open.length - 1];
    while (top !== undefined && (headings[top]?.level ?? 0) >= heading.level) {
      ends[top] = heading.line - 1;
      open.pop();
      top = open[open.length - 1];
    }
    parents.push(top ?? null);
    open.push(index);
  });
  return headings.map((heading, index) => {
    const end = ends[index] ?? fileLines.length;
    const parent = parents[index] ?? null;
    return {
      level: LEVELS.find((level) => level === heading.level) ?? 6,
      text: heading.text,
      line: heading.line,
      tags: heading.tags,
      body: fileLines.slice(heading.line, end).join("\n"),
      endLine: end,
      parent,
    };
  });
}

/** The model parts read from the frontmatter (or their empty values for a body-only target). */
type FrontmatterParts = Omit<DocumentModel, "document" | "sections">;

/** The shared tail of `loadDocument`: sections from the body headings, then the model. */
function withSections(text: string, document: MarkdownDocument, parts: FrontmatterParts): LoadResult {
  const headings = document.body.filter((block): block is BodyHeading => block.kind === "heading");
  const fileLines = normalizeLineEnds(text).split("\n");
  return { ok: true, model: { document, sections: buildSections(headings, fileLines), ...parts } };
}

/** Options of `loadDocument`. */
export interface LoadOptions {
  /**
   * The template carries `[frontmatter:optional]` (ADR 0015): a document with no frontmatter
   * block loads as a body-only model instead of failing with `frontmatter-missing`. An
   * unclosed `---` still fails.
   */
  readonly frontmatterOptional?: boolean;
}

/**
 * Parse `text` into a DocumentModel, or a parse failure (MTL001 to MTL003).
 * A grammar bug throws InternalParseError (never a user diagnostic).
 */
export function loadDocument(text: string, options?: LoadOptions): LoadResult {
  const analysis = analyzeDocument(text);
  if (analysis.document === null) throw InternalParseError.of(analysis.grammarErrors);
  const document = analysis.document;
  const frontmatter = document.frontmatter;
  if (frontmatter === null) {
    if (options?.frontmatterOptional !== true || document.frontmatterUnclosed) return fail("frontmatter-missing");
    // ADR 0015: a body-only target; its body findings and body directives only.
    return withSections(text, document, {
      fields: new Map(),
      filename: null,
      uniqueHeadingNames: false,
      frontmatterOptional: false,
      findings: analysis.findings.filter(isBodyRegion),
      optionalTags: [],
      directives: document.directives.filter(isBodyRegion),
    });
  }

  const lineCounter = new LineCounter();
  const yaml = parseYaml(frontmatter.yaml, { schema: "failsafe", uniqueKeys: false, lineCounter });
  const yamlError = yaml.errors[0];
  if (yamlError !== undefined) return fail("yaml-invalid", yamlError.message);
  const contents = yaml.contents;
  if (contents !== null && !isMap(contents)) return fail("frontmatter-not-mapping");

  const comments = new Map<number, FrontmatterComment | null>();
  const filenameLines = new Set<number>();
  const commentLines = new Set<number>();
  for (const line of frontmatter.lines) {
    if (line.kind === "key") comments.set(line.line, line.comment);
    else if (line.kind === "filename" || line.kind === "unique-names" || line.kind === "frontmatter-optional") filenameLines.add(line.line);
    if (line.kind === "comment" || line.kind === "filename" || line.kind === "unique-names" || line.kind === "frontmatter-optional") {
      commentLines.add(line.line);
    }
  }

  const fields = new Map<string, Field>();
  const keyLines = new Set<number>();
  for (const pair of contents?.items ?? []) {
    const offset = isScalar(pair.key) && pair.key.range ? pair.key.range[0] : null;
    // YAML line 1 is the line after the opening `---`.
    const line = offset === null ? 0 : lineCounter.linePos(offset).line + frontmatter.startLine;
    keyLines.add(line);
    const key = keyName(pair.key);
    const value = toValue(pair.value, yaml);
    const comment = comments.get(line) ?? null;
    fields.set(key, { key, value, line, comment, type: inferType(value, comment) });
  }

  // Spec 2.1: field-tag findings only on lines that are YAML top-level keys, plus the
  // filename / unique-names lines and the standalone comment lines outside a multi-line value.
  const interior = valueInteriorLines(yaml, lineCounter, frontmatter.startLine);
  /** A YAML top-level key line, or a whole-line comment outside a multi-line value. */
  const bindsTags = (line: number) => keyLines.has(line) || (commentLines.has(line) && !interior.has(line));
  const findings = analysis.findings.filter((finding: TagFinding) => isBodyRegion(finding) || filenameLines.has(finding.position.line) || bindsTags(finding.position.line));
  // Spec 2.1: a `[frontmatter:optional]` inside a multi-line value is inert, so it neither sets
  // the switch nor counts as the first standalone line (ADR 0015, MTL031).
  let firstLine: number | null = null;
  const optionalTags = frontmatter.optionalTags
    .filter((entry) => bindsTags(entry.line))
    .map((entry): FrontmatterOptionalPlacement => {
      if (entry.placement !== "alone") return entry;
      const placed = { ...entry, firstLine };
      firstLine ??= entry.line;
      return placed;
    });
  // Spec 4.4 DIR3: frontmatter directives on YAML top-level key lines and on
  // whole-line comments outside a multi-line value; every body directive.
  const directives = document.directives.filter((directive) => isBodyRegion(directive) || bindsTags(directive.line));
  return withSections(text, document, {
    fields,
    filename: frontmatter.filename,
    uniqueHeadingNames: frontmatter.uniqueHeadingNames,
    frontmatterOptional: firstLine !== null,
    findings,
    optionalTags,
    directives,
  });
}

/** Read `path` as strict UTF-8 and load it; read or decode errors are MTL004. */
export async function loadFile(path: string): Promise<LoadResult> {
  let text: string;
  try {
    const bytes = await readFile(path);
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch (error) {
    return fail("file-unreadable", error instanceof Error ? error.message : String(error));
  }
  return loadDocument(text);
}
