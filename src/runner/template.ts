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

/** A parsed template with the text it was read from (empty when it could not be read). */
export type LoadedTemplate = TemplateStatus & { readonly text: string };

/**
 * Read and parse a template. An unreadable file is a broken template (`MTL004`). The text
 * is kept so `--verify` can quote the template line of a tag warning (spec 8.3).
 */
export async function loadTemplate(registry: RuleRegistry, path: string): Promise<LoadedTemplate> {
  const read = await readUtf8(path);
  if (read.ok) return { ...(await checkTemplate(registry, read.text)), text: read.text };
  const failure = { reason: "file-unreadable", detail: read.detail } as const;
  const context = { phase: "parse", role: "template", failure } as const;
  return { status: "broken", diagnostics: await runPhase(registry, "parse", context), text: "" };
}

/**
 * The template status without its text, so a cache of parsed templates (the lint run keeps
 * one per resolved path) does not retain the text of every template (spec 8.2, EX8).
 */
export function withoutText(loaded: LoadedTemplate): TemplateStatus {
  return loaded.status === "ok"
    ? { status: "ok", model: loaded.model, warnings: loaded.warnings }
    : { status: "broken", diagnostics: loaded.diagnostics };
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
