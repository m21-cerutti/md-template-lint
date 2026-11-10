/**
 * JSON reporter (docs/spec.md 8.5): one document on stdout and nothing else (run
 * errors are inside it). Keys are stable, arrays follow the output order of
 * 8.4. `--quiet` does not shrink it. Echoed strings go through `cleanText`. A diagnostic
 * with a `line` and a source line also has `sourceLine` (8.5).
 */
import type { RunDiagnostic } from "../config/types.js";
import type { PairBlock, ReportedDiagnostic, RunResult } from "../runner/types.js";
import { sourceLineOf } from "./excerpt.js";
import { cleanText } from "./sanitize.js";
import type { ReportOutput } from "./text.js";

function diagnosticJson(diagnostic: ReportedDiagnostic): Record<string, unknown> {
  const out: Record<string, unknown> = {
    code: diagnostic.code,
    severity: diagnostic.severity,
    message: cleanText(diagnostic.message),
  };
  if (diagnostic.heading !== undefined) out["heading"] = cleanText(diagnostic.heading);
  if (diagnostic.position !== null) {
    out["line"] = diagnostic.position.line;
    out["column"] = diagnostic.position.column;
    // Spec 8.5: `sourceLine` sits next to `line`, only when the line exists.
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
  if (diagnostic.root !== undefined) out["root"] = cleanText(diagnostic.root);
  if (diagnostic.file !== undefined) out["file"] = cleanText(diagnostic.file);
  if (diagnostic.line !== undefined) out["line"] = diagnostic.line;
  if (diagnostic.column !== undefined) out["column"] = diagnostic.column;
  if (diagnostic.key !== undefined) out["key"] = cleanText(diagnostic.key);
  return out;
}

function pairJson(block: PairBlock): Record<string, unknown> {
  const template: Record<string, unknown> = {
    path: cleanText(block.template.path),
    status: block.template.status,
  };
  if (block.template.status === "broken") template["error"] = diagnosticJson(block.template.error);
  return {
    root: cleanText(block.root),
    pair: cleanText(block.pair),
    template,
    files: block.files.map((file) => ({
      path: cleanText(file.path),
      status: file.status,
      errors: file.errors.map(diagnosticJson),
      warnings: file.warnings.map(diagnosticJson),
    })),
  };
}

/** The JSON document of a run (spec 8.5). */
export function reportJson(result: RunResult, version: string): ReportOutput {
  const document = {
    schemaVersion: 1,
    tool: "md-template-lint",
    version,
    mode: result.mode,
    config: result.config === null ? null : cleanText(result.config),
    results: result.blocks.flatMap((block) => (block.kind === "pair" ? [pairJson(block)] : [])),
    runErrors: result.runErrors.map(runDiagnosticJson),
    runWarnings: result.runWarnings.map(runDiagnosticJson),
    unmatched: result.unmatched.map(cleanText),
    summary: { ...result.summary },
  };
  return { stdout: `${JSON.stringify(document, null, 2)}\n`, stderr: "" };
}
