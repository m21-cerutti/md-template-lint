/**
 * Load a Markdown template or target (docs/spec.md 1.1, 1.2, 2.1, 2.6):
 * grammar parse (src/tags/parser.ts analyzeDocument, with the collecting
 * listeners), YAML values with `yaml` (failsafe, uniqueKeys false), inline
 * comments joined to top-level keys BY LINE, H1/H2 sections, inferred types.
 */
import { readFile } from "node:fs/promises";
import {
  isAlias,
  isMap,
  isScalar,
  isSeq,
  LineCounter,
  parseDocument as parseYaml,
  type Document,
} from "yaml";
import type { BodyHeading, FrontmatterComment, TagFinding } from "../tags/ast.js";
import { analyzeDocument, InternalParseError, normalizeLineEnds } from "../tags/parser.js";
import { inferType } from "./infer.js";
import type {
  DocumentModel,
  Field,
  LoadResult,
  ParseFailure,
  Section,
  YamlValue,
} from "./model.js";

function fail(reason: ParseFailure["reason"], detail = ""): LoadResult {
  return { ok: false, failure: { reason, detail } };
}

/** A YAML node as a failsafe value: scalars are strings, an empty value is "". */
function toValue(node: unknown, doc: Document): YamlValue {
  if (isAlias(node)) return toValue(node.resolve(doc), doc);
  if (isScalar(node))
    return node.value === null || node.value === undefined ? "" : String(node.value);
  if (isSeq(node)) return node.items.map((item) => toValue(item, doc));
  if (isMap(node)) {
    const map = new Map<string, YamlValue>();
    for (const pair of node.items) map.set(keyName(pair.key), toValue(pair.value, doc));
    return map;
  }
  return "";
}

function keyName(key: unknown): string {
  if (key === null || key === undefined) return "";
  if (isScalar(key)) return key.value === null || key.value === undefined ? "" : String(key.value);
  return String(key);
}

/** Sections from H1/H2 headings; a body runs to the next heading of equal or higher level. */
function buildSections(headings: readonly BodyHeading[], fileLines: readonly string[]): Section[] {
  const sections = headings.filter((heading) => heading.level <= 2);
  return sections.map((heading, index) => {
    const next = sections.slice(index + 1).find((following) => following.level <= heading.level);
    const end = next === undefined ? fileLines.length : next.line - 1;
    return {
      level: heading.level === 1 ? 1 : 2,
      text: heading.text,
      line: heading.line,
      tags: heading.tags,
      body: fileLines.slice(heading.line, end).join("\n"),
    };
  });
}

/**
 * Parse `text` into a DocumentModel, or a parse failure (MTL001 to MTL003).
 * A grammar bug throws InternalParseError (never a user diagnostic).
 */
export function loadDocument(text: string): LoadResult {
  const analysis = analyzeDocument(text);
  if (analysis.document === null) throw InternalParseError.of(analysis.grammarErrors);
  const document = analysis.document;
  const frontmatter = document.frontmatter;
  if (frontmatter === null) return fail("frontmatter-missing");

  const lineCounter = new LineCounter();
  const yaml = parseYaml(frontmatter.yaml, { schema: "failsafe", uniqueKeys: false, lineCounter });
  const yamlError = yaml.errors[0];
  if (yamlError !== undefined) return fail("yaml-invalid", yamlError.message);
  const contents = yaml.contents;
  if (contents !== null && !isMap(contents)) return fail("frontmatter-not-mapping");

  const comments = new Map<number, FrontmatterComment | null>();
  const filenameLines = new Set<number>();
  for (const line of frontmatter.lines) {
    if (line.kind === "key") comments.set(line.line, line.comment);
    else if (line.kind === "filename") filenameLines.add(line.line);
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

  // Spec 2.1: field-tag findings only on lines that are YAML top-level keys.
  const findings = analysis.findings.filter(
    (finding: TagFinding) =>
      finding.region === "body" ||
      keyLines.has(finding.position.line) ||
      filenameLines.has(finding.position.line),
  );
  const headings = document.body.filter((block): block is BodyHeading => block.kind === "heading");
  const fileLines = normalizeLineEnds(text).split("\n");
  const model: DocumentModel = {
    document,
    fields,
    sections: buildSections(headings, fileLines),
    filename: frontmatter.filename,
    findings,
  };
  return { ok: true, model };
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
