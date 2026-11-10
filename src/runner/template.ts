/**
 * Template loading shared by the lint run and `--verify` (docs/spec.md 7.3, 8.2):
 * read the file as strict UTF-8, parse it, and turn a broken one into the report
 * entry the reporters print as `TEMPLATE ERROR`.
 */
import type { Diagnostic } from "../engine/model.js";
import { checkTemplate, type TemplateStatus } from "../engine/pipeline.js";
import { runPhase, type RuleRegistry } from "../engine/registry.js";
import { readUtf8 } from "./files.js";
import type { TemplateReport } from "./types.js";

/** Read and parse a template. An unreadable file is a broken template (`MTL004`). */
export async function loadTemplate(registry: RuleRegistry, path: string): Promise<TemplateStatus> {
  const read = await readUtf8(path);
  if (read.ok) return checkTemplate(registry, read.text);
  const failure = { reason: "file-unreadable", detail: read.detail } as const;
  const context = { phase: "parse", role: "template", failure } as const;
  return { status: "broken", diagnostics: await runPhase(registry, "parse", context) };
}

/** The broken entry of a template: its first error (else its first diagnostic). */
export function brokenReport(
  shown: string,
  diagnostics: readonly Diagnostic[],
): Extract<TemplateReport, { status: "broken" }> {
  const error = diagnostics.find((diagnostic) => diagnostic.severity === "error") ?? diagnostics[0];
  return {
    path: shown,
    status: "broken",
    error: error ?? {
      code: "MTL004",
      severity: "error",
      message: "template could not be parsed",
      position: null,
    },
  };
}
