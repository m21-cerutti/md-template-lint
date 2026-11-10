/**
 * Template loading shared by the lint run and `--verify` (docs/spec.md 7.3, 8.2):
 * read the file as strict UTF-8, parse it, and turn a broken one into the report
 * entry the reporters print as `TEMPLATE ERROR`.
 */
import type { Diagnostic, DocumentModel } from "../engine/model.js";
import { checkTemplate, type TemplateStatus } from "../engine/pipeline.js";
import { runPhase, type RuleRegistry } from "../engine/registry.js";
import { withExcerpts } from "./excerpt.js";
import { readUtf8 } from "./files.js";
import type { ReportedDiagnostic, TemplateReport } from "./types.js";

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

/** A parsed template as the lint run caches it: no text, template errors with their lines. */
export type LintTemplate =
  | {
      readonly status: "ok";
      readonly model: DocumentModel;
      readonly warnings: Diagnostic[];
      /** Template errors by template line, then code (spec 8.4), each with its excerpt. */
      readonly errors: readonly ReportedDiagnostic[];
    }
  | { readonly status: "broken"; readonly diagnostics: Diagnostic[] };

/** Template line, then code (spec 8.4 item 4); stable, so equal keys keep source order. */
function byLineThenCode(diagnostics: readonly Diagnostic[]): Diagnostic[] {
  const line = (diagnostic: Diagnostic) => diagnostic.position?.line ?? 0;
  return [...diagnostics].sort(
    (a, b) => line(a) - line(b) || (a.code < b.code ? -1 : a.code > b.code ? 1 : 0),
  );
}

/**
 * The template status without its text, so a cache of parsed templates (the lint run keeps
 * one per resolved path) does not retain the text of every template (spec 8.2, EX8). The
 * template errors, the only template lines a lint run quotes, get their excerpts here, from
 * the parsed text, before it is dropped.
 */
export function withoutText(loaded: LoadedTemplate): LintTemplate {
  return loaded.status === "ok"
    ? {
        status: "ok",
        model: loaded.model,
        warnings: loaded.warnings,
        errors: withExcerpts(byLineThenCode(loaded.errors), loaded.text),
      }
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
