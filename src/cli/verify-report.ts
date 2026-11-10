/**
 * Output of `--verify` (docs/spec.md 7.3, 8.3, 8.5). Same conventions as the lint
 * reporters: `pretty` and `plain` text, `json`, run errors on stderr in text,
 * every echoed string through `cleanText`.
 *
 * Text, per template: a header line (`✓ <path>`, `PASS` in plain), then the spec 8.3 schema:
 * the `Filename:` line when declared, the `Unique heading names:` line under the template-wide
 * switch (spec 2.11), the `Field  Type  Rules` table, the `Headings:` list and
 * the sections `Unknown tags found`, `Malformed tags:`, `Misplaced tags:`, `Invalid
 * patterns:`, `Conflicting tags:` and, last, `Date fields without format:` (from the template
 * warnings `MTL010` to `MTL016`, each item followed by the excerpt of its template line, spec
 * 8.3), then the template error sections `Duplicate patterns:` (`MTL017`), `Optional headings
 * with a minimum:` (`MTL018`), `Child headings out of level order:` (`MTL019`) and `Order tags
 * without repeat:` (`MTL030`). A template with a template error has the fail header
 * (`✗ <path>`, `FAIL` in plain), the summary gains `Errors:` and loses `All templates
 * passed!`. A broken template prints `TEMPLATE ERROR: <path> - <message>` instead. `--quiet`
 * hides the schema and shows only broken templates, the fail header and error sections of a
 * template with template errors, and run errors.
 */
import type { RunDiagnostic } from "../config/types.js";
import type { Diagnostic } from "../engine/model.js";
import { excerptRows, sourceLineOf } from "../reporters/excerpt.js";
import { cleanText } from "../reporters/sanitize.js";
import type { ReportFormat, ReportOutput } from "../reporters/index.js";
import type {
  ReportedDiagnostic,
  TemplateSchema,
  VerifyResult,
  VerifyTemplate,
} from "../runner/types.js";

export interface VerifyReportOptions {
  readonly format: ReportFormat;
  readonly version: string;
  /** ANSI color, `pretty` only. */
  readonly color?: boolean;
  readonly quiet?: boolean;
}

const ESC = String.fromCharCode(27);
const ANSI = {
  cyan: "36",
  green: "32",
  red: "31",
  yellow: "33",
  magenta: "35",
  gray: "90",
} as const;
type Tone = keyof typeof ANSI | "none";
const RULE = "========================";

const paint = (tone: Tone, text: string, color: boolean): string =>
  color && tone !== "none" ? `${ESC}[${ANSI[tone]}m${text}${ESC}[0m` : text;

const lines = (items: readonly string[]): string =>
  items.length === 0 ? "" : `${items.join("\n")}\n`;

function runErrorLine(diagnostic: RunDiagnostic): string {
  const where =
    diagnostic.file !== undefined && diagnostic.line !== undefined
      ? ` (${diagnostic.file}:${diagnostic.line}:${diagnostic.column ?? 1})`
      : "";
  return cleanText(`error ${diagnostic.code}: ${diagnostic.message}${where}`);
}

const located = (diagnostic: Diagnostic): string =>
  diagnostic.position === null
    ? ""
    : ` (line ${diagnostic.position.line}, column ${diagnostic.position.column})`;

function diagnosticJson(diagnostic: ReportedDiagnostic): Record<string, unknown> {
  const out: Record<string, unknown> = {
    code: diagnostic.code,
    severity: diagnostic.severity,
    message: cleanText(diagnostic.message),
  };
  if (diagnostic.position !== null) {
    out["line"] = diagnostic.position.line;
    out["column"] = diagnostic.position.column;
    // Spec 8.5: `sourceLine` is the template line, only when it exists.
    const sourceLine = sourceLineOf(diagnostic.excerpt);
    if (sourceLine !== undefined) out["sourceLine"] = sourceLine;
  }
  return out;
}

function runDiagnosticJson(diagnostic: RunDiagnostic): Record<string, unknown> {
  const out: Record<string, unknown> = {
    code: diagnostic.code,
    severity: diagnostic.severity,
    message: cleanText(diagnostic.message),
  };
  if (diagnostic.pair !== undefined) out["pair"] = cleanText(diagnostic.pair);
  if (diagnostic.file !== undefined) out["file"] = cleanText(diagnostic.file);
  if (diagnostic.line !== undefined) out["line"] = diagnostic.line;
  if (diagnostic.column !== undefined) out["column"] = diagnostic.column;
  if (diagnostic.key !== undefined) out["key"] = cleanText(diagnostic.key);
  return out;
}

function templateJson(item: VerifyTemplate): Record<string, unknown> {
  const out: Record<string, unknown> = {
    path: cleanText(item.template.path),
    // Spec 8.5 (A72k): a template that parses and has a template error is `fail`.
    status: item.errors.length > 0 ? "fail" : item.template.status,
  };
  if (item.template.status === "broken") out["error"] = diagnosticJson(item.template.error);
  const schema = item.schema;
  out["filenameCase"] = schema?.filenameCase ?? null;
  // Spec 2.11, 8.5 (A80c): always present, right after `filenameCase`.
  out["uniqueHeadingNames"] = schema?.uniqueHeadingNames ?? false;
  out["fields"] = (schema?.fields ?? []).map((field) => ({
    name: cleanText(field.name),
    type: cleanText(field.type),
    rules: field.rules.map(cleanText),
  }));
  out["headings"] = (schema?.headings ?? []).map((heading) => ({
    level: heading.level,
    text: cleanText(heading.text),
    rules: heading.rules.map(cleanText),
  }));
  // Errors first, then warnings, each in source order (as a file, spec 8.4 item 4).
  out["diagnostics"] = [...item.errors, ...item.warnings].map(diagnosticJson);
  return out;
}

function reportVerifyJson(result: VerifyResult, version: string): ReportOutput {
  const document = {
    schemaVersion: 1,
    tool: "md-template-lint",
    version,
    mode: result.mode,
    config: result.config === null ? null : cleanText(result.config),
    templates: result.templates.map(templateJson),
    runErrors: result.runErrors.map(runDiagnosticJson),
    runWarnings: [],
    // Spec 8.5, 4.4 DIR10: `suppressed` is always present; no target is read, so 0.
    summary: {
      templates: result.summary.templates,
      broken: result.summary.broken,
      // Spec 8.5 (A72k): always present, right after `broken`.
      errors: result.summary.errors,
      warnings: result.summary.warnings,
      suppressed: 0,
      runErrors: result.summary.runErrors,
      exitCode: result.summary.exitCode,
    },
  };
  return { stdout: `${JSON.stringify(document, null, 2)}\n`, stderr: "" };
}

/**
 * The `Field  Type  Rules` table: columns padded to the widest name and type, and under the
 * header a run of `-` of the header length (spec 8.3, legacy `describe()`).
 */
function tableLines(schema: TemplateSchema): string[] {
  const names = schema.fields.map((field) => cleanText(field.name));
  const types = schema.fields.map((field) => cleanText(field.type));
  const nameWidth = Math.max("Field".length, ...names.map((name) => name.length));
  const typeWidth = Math.max("Type".length, ...types.map((type) => type.length));
  const row = (name: string, type: string, rules: string): string =>
    `${name.padEnd(nameWidth)}  ${type.padEnd(typeWidth)}  ${rules}`;
  const header = row("Field", "Type", "Rules");
  const out = [header, "-".repeat(header.length)];
  schema.fields.forEach((field, index) => {
    const rules = field.rules.length === 0 ? "-" : field.rules.map(cleanText).join(", ");
    out.push(row(names[index] ?? "", types[index] ?? "", rules));
  });
  return out;
}

/** Indent of an excerpt under a tag item: 2 more than the item text (spec 8.3, C09). */
const EXCERPT_INDENT = 6;

/** A line of the warning sections with its color: items yellow, excerpts gray. */
type Entry = readonly [tone: Tone, text: string];

/** One tag item: its text and the excerpt rows under it. */
interface Item {
  readonly text: string;
  readonly rows: readonly string[];
}

/** One item per diagnostic of `code`: its text (with line and column) and its excerpt rows. */
function itemsOf(
  diagnostics: readonly ReportedDiagnostic[],
  code: string,
  withPosition: boolean,
): Item[] {
  // Spec 8.3, C09: each item is followed by the excerpt of its template line.
  return diagnostics
    .filter((diagnostic) => diagnostic.code === code)
    .map((diagnostic) => ({
      text: cleanText(diagnostic.message) + (withPosition ? located(diagnostic) : ""),
      rows: diagnostic.excerpt === undefined ? [] : excerptRows(diagnostic.excerpt, EXCERPT_INDENT),
    }));
}

/**
 * The sections of the template errors (spec 8.3), after the warning sections:
 * `Duplicate patterns:` (`MTL017`), then `Optional headings with a minimum:` (`MTL018`), then
 * `Child headings out of level order:` (`MTL019`), last `Order tags without repeat:`
 * (`MTL030`). Items red, excerpts gray; each section ends with a blank line. Also printed
 * under `--quiet` (an error is never hidden).
 */
function errorLines(errors: readonly ReportedDiagnostic[]): Entry[] {
  const out: Entry[] = [];
  const section = (title: string, code: string): void => {
    const items = itemsOf(errors, code, true);
    if (items.length === 0) return;
    out.push(["red", title]);
    for (const item of items) {
      out.push(["red", `  - ${item.text}`]);
      for (const row of item.rows) out.push(["gray", row]);
    }
    out.push(["none", ""]);
  };
  section("Duplicate patterns:", "MTL017");
  section("Optional headings with a minimum:", "MTL018");
  section("Child headings out of level order:", "MTL019");
  section("Order tags without repeat:", "MTL030");
  return out;
}

/** Schema block of one ok template; each paragraph is followed by one blank line. */
function schemaLines(
  schema: TemplateSchema,
  warnings: readonly ReportedDiagnostic[],
): { readonly text: readonly string[]; readonly warn: readonly Entry[] } {
  const text: string[] = [];
  if (schema.filenameCase !== null) {
    text.push(`Filename: [filename:case:${cleanText(schema.filenameCase)}]`);
  }
  // Spec 2.11, 8.3: right after `Filename:` (or in its place), then the blank line.
  if (schema.uniqueHeadingNames) text.push("Unique heading names: [unique-headings-names]");
  if (schema.filenameCase !== null || schema.uniqueHeadingNames) text.push("");
  text.push(...tableLines(schema), "");
  if (schema.headings.length > 0) {
    text.push("Headings:");
    for (const heading of schema.headings) {
      // Presence is always the first rule, so the list is never empty (legacy `describe()`).
      const rules = heading.rules.map(cleanText).join(", ");
      text.push(`  ${"#".repeat(heading.level)} ${cleanText(heading.text)} (${rules})`);
    }
    text.push("");
  }
  // The sections come from the template warnings, in code order: unknown (fields, then
  // headings), malformed, misplaced, invalid patterns, conflicting and, last, date fields
  // without format (with line and column).
  const warn: Entry[] = [];
  const section = (title: string, items: readonly Item[]): void => {
    if (items.length === 0) return;
    warn.push(["yellow", title]);
    for (const item of items) {
      warn.push(["yellow", `  - ${item.text}`]);
      for (const row of item.rows) warn.push(["gray", row]);
    }
    warn.push(["none", ""]);
  };
  const of = (code: string, withPosition: boolean): Item[] => itemsOf(warnings, code, withPosition);
  section("Unknown tags found (typo or unimplemented feature):", [
    ...of("MTL010", false),
    ...of("MTL011", false),
  ]);
  section("Malformed tags:", of("MTL012", true));
  section("Misplaced tags:", of("MTL013", true));
  section("Invalid patterns:", of("MTL014", true));
  section("Conflicting tags:", of("MTL015", true));
  section("Date fields without format:", of("MTL016", true));
  return { text, warn };
}

/** Render a verify run: `stdout` and `stderr` text, ready to write. */
export function reportVerify(result: VerifyResult, options: VerifyReportOptions): ReportOutput {
  if (options.format === "json") return reportVerifyJson(result, options.version);
  const pretty = options.format === "pretty";
  const color = pretty && options.color === true;
  const quiet = options.quiet === true;
  const passWord = pretty ? "✓" : "PASS";
  const failWord = pretty ? "✗" : "FAIL";
  const out: string[] = [];
  const line = (tone: Tone, text: string): void => {
    out.push(paint(tone, text, color));
  };
  const { summary } = result;

  if (!quiet) {
    line("cyan", `md-template-lint ${cleanText(options.version)}`);
    line("cyan", `Config: ${result.config === null ? "(none)" : cleanText(result.config)}`);
    line("cyan", RULE);
    out.push("");
  }
  for (const item of result.templates) {
    const path = cleanText(item.template.path);
    if (item.template.status === "broken") {
      const message = cleanText(item.template.error.message);
      line("magenta", `  TEMPLATE ERROR: ${path} - ${message}`);
      if (!quiet) out.push("");
    } else if (item.schema !== null) {
      // Spec 8.3: a template error makes the header the fail word; `--quiet` keeps that
      // header and the error sections only.
      const failed = item.errors.length > 0;
      if (quiet && !failed) continue;
      if (failed) line("red", `  ${failWord} ${path}`);
      else line("green", `  ${passWord} ${path}`);
      if (!quiet) {
        const block = schemaLines(item.schema, item.warnings);
        out.push(...block.text);
        for (const [tone, text] of block.warn) line(tone, text);
      }
      for (const [tone, text] of errorLines(item.errors)) line(tone, text);
    }
  }
  if (!quiet) {
    line("cyan", RULE);
    line("cyan", "Summary");
    line("cyan", RULE);
    out.push(`Templates:    ${summary.templates} checked, ${summary.broken} broken`);
    if (summary.errors > 0) line("red", `Errors:       ${summary.errors}`);
    line("yellow", `Warnings:     ${summary.warnings}`);
    if (summary.runErrors > 0) line("red", `Run errors:   ${summary.runErrors}`);
    out.push("");
    const clean = summary.broken === 0 && summary.errors === 0 && summary.runErrors === 0;
    if (clean && summary.templates > 0) line("green", "All templates passed!");
    else if (clean) line("none", "No templates checked.");
    line("cyan", RULE);
  }

  const stderr = result.runErrors.map((diagnostic) =>
    paint("red", runErrorLine(diagnostic), color),
  );
  return { stdout: lines(out), stderr: lines(stderr) };
}
