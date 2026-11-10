/**
 * Text reporters (docs/spec.md 8.2): `pretty` (wrapper layout, Unicode glyphs,
 * ANSI color when asked) and `plain` (same layout, ASCII words, never colored).
 * Run errors go to stderr as `error MTLnnn: <message>`, everything else to
 * stdout. Every echoed string goes through `cleanText`. A diagnostic with a source line
 * (`ReportedDiagnostic.excerpt`) is followed by its excerpt (`excerpt.ts`).
 */
import type { Diagnostic } from "../engine/model.js";
import type { RunDiagnostic } from "../config/types.js";
import type { FileResult, PairBlock, ReportedDiagnostic, RunResult, TemplateReport } from "../runner/types.js";
import { excerptRows } from "./excerpt.js";
import { cleanText } from "./sanitize.js";

/** Indent of an excerpt under a file diagnostic: 2 more than the diagnostic text (spec 8.2, EX2). */
const EXCERPT_INDENT = 8;

export interface ReportOutput {
  readonly stdout: string;
  readonly stderr: string;
}

export interface TextOptions {
  /** Package version printed in the header. */
  readonly version: string;
  /** ANSI color (`pretty` only; the caller decides from the terminal and `NO_COLOR`). */
  readonly color?: boolean;
  /** Only failing files, template entries, broken templates and run errors (spec 8.2). */
  readonly quiet?: boolean;
}

interface Glyphs {
  readonly pass: string;
  readonly fail: string;
  readonly info: string;
}

const PRETTY_GLYPHS: Glyphs = { pass: "✓", fail: "✗", info: "ℹ" };
const PLAIN_GLYPHS: Glyphs = { pass: "PASS", fail: "FAIL", info: "INFO" };

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

type FailedTemplate = Extract<TemplateReport, { status: "fail" }>;

function paint(tone: Tone, text: string, color: boolean): string {
  return color && tone !== "none" ? `${ESC}[${ANSI[tone]}m${text}${ESC}[0m` : text;
}

/** `error CODE message` / `warn  CODE message`, indented under its file. */
function diagnosticLine(diagnostic: Diagnostic): string {
  const level = diagnostic.severity === "error" ? "error" : "warn ";
  return `      ${level} ${diagnostic.code} ${cleanText(diagnostic.message)}`;
}

/** Stderr line of a run error. Config errors name their location (spec 6.6). */
function runErrorLine(diagnostic: RunDiagnostic): string {
  const where = diagnostic.file !== undefined && diagnostic.line !== undefined ? ` (${diagnostic.file}:${diagnostic.line}:${diagnostic.column ?? 1})` : "";
  return cleanText(`error ${diagnostic.code}: ${diagnostic.message}${where}`);
}

function render(result: RunResult, options: TextOptions, glyphs: Glyphs, color: boolean): ReportOutput {
  const quiet = options.quiet === true;
  const out: string[] = [];
  const line = (tone: Tone, text: string): void => {
    out.push(paint(tone, text, color));
  };
  const { summary } = result;

  const diagnosticLines = (diagnostics: readonly ReportedDiagnostic[]): void => {
    for (const diagnostic of diagnostics) {
      line(diagnostic.severity === "error" ? "red" : "yellow", diagnosticLine(diagnostic));
      // Spec 8.2 EX1 to EX7: the source line under the diagnostic that has one.
      if (diagnostic.excerpt === undefined) continue;
      for (const row of excerptRows(diagnostic.excerpt, EXCERPT_INDENT)) line("gray", row);
    }
  };

  const fileLines = (file: FileResult): void => {
    if (quiet && file.status === "pass") return;
    line(file.status === "pass" ? "green" : "red", `  ${file.status === "pass" ? glyphs.pass : glyphs.fail} ${cleanText(file.path)}`);
    diagnosticLines(quiet ? file.errors : [...file.errors, ...file.warnings]);
  };

  /** The template entry of a template with template errors (spec 8.2, A72l). */
  const templateLines = (template: FailedTemplate): void => {
    line("red", `  ${glyphs.fail} ${cleanText(template.path)} (template)`);
    diagnosticLines(template.errors);
  };

  const pairLines = (block: PairBlock): void => {
    if (!quiet) {
      line("cyan", `Template: ${cleanText(block.template.path)}`);
      if (block.root !== "project") line("cyan", `Root:     ${cleanText(block.root)}`);
      const description = block.description === null ? "" : ` - ${cleanText(block.description)}`;
      const globs = block.include.map(cleanText).join(", ");
      line("cyan", `Target:   ${globs} (${block.fileCount} file(s))${description}`);
      out.push("");
    }
    if (block.template.status === "broken") {
      const message = cleanText(block.template.error.message);
      line("magenta", `  TEMPLATE ERROR: ${cleanText(block.template.path)} - ${message}`);
    } else {
      // Spec 8.2: a template with template errors, before the files, also with --quiet.
      if (block.template.status === "fail") templateLines(block.template);
      for (const file of block.files) fileLines(file);
    }
    if (!quiet) out.push("");
  };

  if (!quiet) {
    line("cyan", `md-template-lint ${cleanText(options.version)}`);
    line("cyan", `Config: ${result.config === null ? "(none)" : cleanText(result.config)}`);
    line("cyan", RULE);
    out.push("");
  }
  for (const block of result.blocks) {
    if (block.kind === "pair") pairLines(block);
    else if (!quiet) {
      line("gray", `${glyphs.info} ${block.diagnostic.code} ${cleanText(block.diagnostic.message)}`);
      out.push("");
    }
  }

  if (!quiet) {
    line("cyan", RULE);
    line("cyan", "Summary");
    line("cyan", RULE);
    out.push(`Total files:  ${summary.files}`);
    line("green", `Passed:       ${summary.passed}`);
    line(summary.failed > 0 ? "red" : "green", `Failed:       ${summary.failed}`);
    line("yellow", `Warnings:     ${summary.warnings} (in ${summary.filesWithWarnings} file(s))`);
    // Spec 8.2, 4.4 DIR9: only when greater than 0, never as `0`.
    if (summary.suppressed > 0) out.push(`Suppressed:   ${summary.suppressed}`);
    out.push(`Templates:    ${summary.templatesChecked} checked, ${summary.templatesBroken} broken`);
    if (summary.runErrors > 0) line("red", `Run errors:   ${summary.runErrors}`);
    if (summary.runWarnings > 0) line("yellow", `Run warnings: ${summary.runWarnings}`);
    out.push("");
    if (result.brokenTemplates.length > 0) {
      line("magenta", "Broken templates:");
      for (const broken of result.brokenTemplates) {
        line("magenta", `  - ${cleanText(broken.path)} - ${cleanText(broken.message)}`);
      }
      out.push("");
    }
    // Spec 8.2 (A72l): after `Broken templates:`, before `Failed files:`.
    if (result.failedTemplates.length > 0) {
      line("red", "Failed templates:");
      for (const path of result.failedTemplates) line("red", `  - ${cleanText(path)}`);
      out.push("");
    }
    const failed = result.blocks.flatMap((block) => (block.kind === "pair" ? block.files.filter((file) => file.status === "fail").map((file) => (block.root === "project" ? file.path : `${file.path} (root '${block.root}')`)) : []));
    if (failed.length > 0) {
      line("red", "Failed files:");
      for (const path of failed) line("red", `  - ${cleanText(path)}`);
      out.push("");
    }
    const clean = summary.failed === 0 && summary.templatesBroken === 0 && result.failedTemplates.length === 0 && summary.runErrors === 0;
    if (clean && summary.files > 0) line("green", "All files passed!");
    else if (clean) line("gray", "No files linted.");
    line("cyan", RULE);
  }

  const stderr = result.runErrors.map((diagnostic) => paint("red", runErrorLine(diagnostic), color));
  const text = (lines: readonly string[]): string => (lines.length === 0 ? "" : `${lines.join("\n")}\n`);
  return { stdout: text(out), stderr: text(stderr) };
}

/** Wrapper layout with Unicode glyphs; `options.color` turns ANSI color on. */
export function reportPretty(result: RunResult, options: TextOptions): ReportOutput {
  return render(result, options, PRETTY_GLYPHS, options.color === true);
}

/** Same layout, ASCII words instead of glyphs, never colored. */
export function reportPlain(result: RunResult, options: TextOptions): ReportOutput {
  return render(result, options, PLAIN_GLYPHS, false);
}
