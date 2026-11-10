/**
 * Result of a lint run (docs/spec.md 7, 8). Plain data: reporters render it, the
 * CLI maps `exitCode` to the process exit code. Every path is relative to its
 * root (or to the config directory for templates) and uses `/` (D08, D15).
 */
import type { Diagnostic } from "../engine/model.js";
import type { RunDiagnostic } from "../config/types.js";

/**
 * The source line of a diagnostic (spec 8.1, change C09): one line of the file the
 * diagnostic belongs to (the target, or the template for a template-phase diagnostic).
 */
export interface SourceExcerpt {
  /** 1-based line number, as `line` of the diagnostic or its anchor line (4.4 DIR5). */
  readonly line: number;
  /** 1-based column of the diagnostic position; null for an anchor-only excerpt. */
  readonly column: number | null;
  /**
   * The shown part of the line, raw (the reporters sanitize it): at most `EXCERPT_WIDTH`
   * characters, a string of its own (spec 8.2, EX8). Never the whole line.
   */
  readonly text: string;
  /** Characters of the line before `text`; above 0, the shown text starts with `...` (EX5). */
  readonly before: number;
  /** Characters of the line after `text`; above 0, the shown text ends with `...` (EX5). */
  readonly after: number;
  /** Index of the caret character in `text`; null when there is no column (EX2, EX4). */
  readonly caret: number | null;
  /**
   * The first `EXCERPT_WIDTH` characters of the line, raw, for the JSON `sourceLine`
   * (spec 8.5); null for an anchor-only excerpt, which has none.
   */
  readonly head: string | null;
  /** True when the line is longer than `head`: JSON adds `...`. */
  readonly headCut: boolean;
}

/** A diagnostic the runner handed over, with its source line when it has one. */
export interface ReportedDiagnostic extends Diagnostic {
  readonly excerpt?: SourceExcerpt;
}

export interface FileResult {
  /** Root-relative path. */
  readonly path: string;
  readonly status: "pass" | "fail";
  /** Error diagnostics in emission order (spec 4.1). */
  readonly errors: readonly ReportedDiagnostic[];
  /** Warning diagnostics in emission order. */
  readonly warnings: readonly ReportedDiagnostic[];
}

export type TemplateReport =
  | { readonly path: string; readonly status: "ok" }
  | { readonly path: string; readonly status: "broken"; readonly error: Diagnostic };

/** One pair on one root that has files to lint (spec 8.2 block). */
export interface PairBlock {
  readonly kind: "pair";
  readonly root: string;
  readonly pair: string;
  readonly template: TemplateReport;
  readonly include: readonly string[];
  readonly description: string | null;
  /** Files matched by the pair, also when the template is broken and none is linted. */
  readonly fileCount: number;
  /** Linted files; empty when the template is broken. */
  readonly files: readonly FileResult[];
}

/** A stdout note in the place where a pair would have been (`MTL913` with `warn`). */
export interface NoteBlock {
  readonly kind: "note";
  readonly diagnostic: RunDiagnostic;
}

export type Block = PairBlock | NoteBlock;

export interface RunSummary {
  readonly files: number;
  readonly passed: number;
  readonly failed: number;
  /** Warning diagnostics of files (run warnings are not counted, D06). */
  readonly warnings: number;
  readonly filesWithWarnings: number;
  /**
   * Diagnostics removed by disable directives, per pair-file lint (spec 4.4
   * DIR9). They are in no file result and count nowhere else.
   */
  readonly suppressed: number;
  /** Distinct templates of pairs that had files. */
  readonly templatesChecked: number;
  readonly templatesBroken: number;
  readonly runErrors: number;
  readonly runWarnings: number;
  readonly exitCode: ExitCode;
}

/** Exit code (spec 7.5): 0 clean, 1 lint failure or broken template, 2 run error. */
export type ExitCode = 0 | 1 | 2;

export interface RunResult {
  readonly mode: "lint";
  /** Printed config path, null when none was found. */
  readonly config: string | null;
  /** Pair blocks and stdout notes in output order (spec 8.4). */
  readonly blocks: readonly Block[];
  /** Broken templates, once per distinct template, in order of appearance. */
  readonly brokenTemplates: readonly { readonly path: string; readonly message: string }[];
  /** Error-severity `MTL9xx`. */
  readonly runErrors: readonly RunDiagnostic[];
  /** Warning-severity `MTL9xx` (`MTL913` with `onEmpty: warn`). */
  readonly runWarnings: readonly RunDiagnostic[];
  /** File-list arguments that matched no pair (always empty in a full run). */
  readonly unmatched: readonly string[];
  readonly summary: RunSummary;
}

/** One field of a template schema (spec 8.3 table row). */
export interface SchemaField {
  readonly name: string;
  /** Inferred type (spec 3.2). */
  readonly type: string;
  /** Rule tokens in the order of spec 8.3, empty when the template field has none. */
  readonly rules: readonly string[];
}

/** One H1 or H2 section of a template schema. */
export interface SchemaHeading {
  readonly level: 1 | 2;
  readonly text: string;
  /** Presence first, then content rules. */
  readonly rules: readonly string[];
}

/** What a template declares (spec 8.3, 8.5): filename convention, fields, headings. */
export interface TemplateSchema {
  /** Convention of `# [filename:case:...]`, null when the template declares none. */
  readonly filenameCase: string | null;
  readonly fields: readonly SchemaField[];
  readonly headings: readonly SchemaHeading[];
}

/** One template of a `--verify` run (spec 7.3). */
export interface VerifyTemplate {
  readonly template: TemplateReport;
  /**
   * Tag warnings `MTL010` to `MTL013` of an ok template, in source order, each with its
   * template line (spec 8.3, C09); empty when broken.
   */
  readonly warnings: readonly ReportedDiagnostic[];
  /** The schema of an ok template; null when broken. */
  readonly schema: TemplateSchema | null;
}

export interface VerifySummary {
  /** Distinct templates read and parsed. */
  readonly templates: number;
  readonly broken: number;
  readonly warnings: number;
  readonly runErrors: number;
  readonly exitCode: ExitCode;
}

/** Result of `--verify` (spec 7.3): template syntax only, no target is read. */
export interface VerifyResult {
  readonly mode: "verify";
  /** Printed config path, null when none was used. */
  readonly config: string | null;
  /** Templates in pair order (or argument order), deduplicated by resolved path. */
  readonly templates: readonly VerifyTemplate[];
  /** Config errors, `MTL910` and `MTL911`. */
  readonly runErrors: readonly RunDiagnostic[];
  readonly summary: VerifySummary;
}
