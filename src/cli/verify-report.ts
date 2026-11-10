/**
 * Output of `--verify` (docs/spec.md 7.3, 8.3, 8.5). Same conventions as the lint
 * reporters: `pretty` and `plain` text, `json`, run errors on stderr in text,
 * every echoed string through `cleanText`.
 *
 * Text, per template: a header line (`✓ <path>`, `PASS` in plain), then the spec 8.3
 * schema: the `Filename:` line when declared, the `Field  Type  Rules` table, the
 * `Headings:` list and the sections `Unknown tags found`, `Malformed tags:` and
 * `Misplaced tags:` (from the template warnings `MTL010` to `MTL013`, each item followed
 * by the excerpt of its template line, spec 8.3). A broken
 * template prints `TEMPLATE ERROR: <path> - <message>` instead. `--quiet` hides the
 * schema and shows only broken templates and run errors.
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
    status: item.template.status,
  };
  if (item.template.status === "broken") out["error"] = diagnosticJson(item.template.error);
  const schema = item.schema;
  out["filenameCase"] = schema?.filenameCase ?? null;
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
  out["diagnostics"] = item.warnings.map(diagnosticJson);
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

/** Schema block of one ok template; each paragraph is followed by one blank line. */
function schemaLines(
  schema: TemplateSchema,
  warnings: readonly ReportedDiagnostic[],
): { readonly text: readonly string[]; readonly warn: readonly Entry[] } {
  const text: string[] = [];
  if (schema.filenameCase !== null) {
    text.push(`Filename: [filename:case:${cleanText(schema.filenameCase)}]`, "");
  }
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
  // The sections come from the template warnings: unknown (fields, then headings),
  // malformed and misplaced (with line and column).
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
  // Spec 8.3, C09: each item is followed by the excerpt of its template line.
  const of = (code: string, withPosition: boolean): Item[] =>
    warnings
      .filter((diagnostic) => diagnostic.code === code)
      .map((diagnostic) => ({
        text: cleanText(diagnostic.message) + (withPosition ? located(diagnostic) : ""),
        rows:
          diagnostic.excerpt === undefined ? [] : excerptRows(diagnostic.excerpt, EXCERPT_INDENT),
      }));
  section("Unknown tags found (typo or unimplemented feature):", [
    ...of("MTL010", false),
    ...of("MTL011", false),
  ]);
  section("Malformed tags:", of("MTL012", true));
  section("Misplaced tags:", of("MTL013", true));
  return { text, warn };
}

/** Render a verify run: `stdout` and `stderr` text, ready to write. */
export function reportVerify(result: VerifyResult, options: VerifyReportOptions): ReportOutput {
  if (options.format === "json") return reportVerifyJson(result, options.version);
  const pretty = options.format === "pretty";
  const color = pretty && options.color === true;
  const quiet = options.quiet === true;
  const passWord = pretty ? "✓" : "PASS";
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
    } else if (!quiet && item.schema !== null) {
      line("green", `  ${passWord} ${path}`);
      const block = schemaLines(item.schema, item.warnings);
      out.push(...block.text);
      for (const [tone, text] of block.warn) line(tone, text);
    }
  }
  if (!quiet) {
    line("cyan", RULE);
    line("cyan", "Summary");
    line("cyan", RULE);
    out.push(`Templates:    ${summary.templates} checked, ${summary.broken} broken`);
    line("yellow", `Warnings:     ${summary.warnings}`);
    if (summary.runErrors > 0) line("red", `Run errors:   ${summary.runErrors}`);
    out.push("");
    const clean = summary.broken === 0 && summary.runErrors === 0;
    if (clean && summary.templates > 0) line("green", "All templates passed!");
    else if (clean) line("none", "No templates checked.");
    line("cyan", RULE);
  }

  const stderr = result.runErrors.map((diagnostic) =>
    paint("red", runErrorLine(diagnostic), color),
  );
  return { stdout: lines(out), stderr: lines(stderr) };
}
