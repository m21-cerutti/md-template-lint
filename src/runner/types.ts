/**
 * Result of a lint run and of a `--verify` run (docs/spec.md 7, 8). Plain data:
 * reporters render it, the CLI maps `exitCode` to the process exit code. Every path
 * is relative to its root (or to the config directory for templates) and uses `/`
 * (D08, D15).
 *
 * A template is `ok`, `broken` (MTL001 to MTL004: its files are not linted) or, when it
 * parses but has template errors (MTL017, MTL018, MTL019, MTL030, spec 2.7), failed: not
 * broken, and the run exits 1. In a lint run its report has status `fail` and its files are
 * still linted; in `--verify` the errors are in `VerifyTemplate.errors` (JSON status `fail`).
 * Template warnings (MTL010 to MTL016, MTL031) never fail and are printed by `--verify` only.
 */
import type { Diagnostic, HeadingLevel } from "../engine/model.js";
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
  | { readonly path: string; readonly status: "broken"; readonly error: Diagnostic }
  | {
      readonly path: string;
      /**
       * Lint run only (spec 7.5, 8.2, 8.5, owner decision 2 of A72l): the template parses but
       * has template errors (`MTL017`, `MTL018`, `MTL019`, `MTL030`). Not broken: the files
       * of the pair are linted.
       */
      readonly status: "fail";
      /** The template errors, by template line then code, each with its template line (EX8). */
      readonly errors: readonly ReportedDiagnostic[];
    };

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

/**
 * Exit code (spec 7.5): 0 clean, 1 lint failure, broken template or template error, 2 run
 * error.
 */
export type ExitCode = 0 | 1 | 2;

export interface RunResult {
  readonly mode: "lint";
  /** Printed config path, null when none was found. */
  readonly config: string | null;
  /** Pair blocks and stdout notes in output order (spec 8.4). */
  readonly blocks: readonly Block[];
  /** Broken templates, once per distinct template, in order of appearance. */
  readonly brokenTemplates: readonly { readonly path: string; readonly message: string }[];
  /**
   * Templates with template errors (status `fail`), once per distinct template, by path, in
   * order of appearance (spec 8.2 `Failed templates:`). Not a summary key (spec 8.5).
   */
  readonly failedTemplates: readonly string[];
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

/** One heading (any level, H1 to H6) of a template schema. */
export interface SchemaHeading {
  readonly level: HeadingLevel;
  readonly text: string;
  /** Presence first, then content rules. */
  readonly rules: readonly string[];
}

/** What a template declares (spec 8.3, 8.5): filename convention, fields, headings. */
export interface TemplateSchema {
  /** Convention of `# [filename:case:...]`, null when the template declares none. */
  readonly filenameCase: string | null;
  /** The template-wide `# [unique-headings-names]` switch (spec 2.11); false without it. */
  readonly uniqueHeadingNames: boolean;
  /** The template-wide `# [frontmatter:optional]` switch (ADR 0015); false without it. */
  readonly frontmatterOptional: boolean;
  readonly fields: readonly SchemaField[];
  readonly headings: readonly SchemaHeading[];
}

/** One template of a `--verify` run (spec 7.3). */
export interface VerifyTemplate {
  readonly template: TemplateReport;
  /**
   * Tag warnings `MTL010` to `MTL016` and `MTL031` of an ok template, in source order, each with its
   * template line (spec 8.3, C09); empty when broken.
   */
  readonly warnings: readonly ReportedDiagnostic[];
  /**
   * Template ERRORS (`MTL017`, `MTL018`, `MTL019`, `MTL030`, spec 2.7) of an ok template, in
   * source order, each with its template line; empty when broken. At least one makes the
   * template FAIL (spec 7.3, 8.3, 8.5) without making it broken.
   */
  readonly errors: readonly ReportedDiagnostic[];
  /** The schema of an ok template; null when broken. */
  readonly schema: TemplateSchema | null;
}

export interface VerifySummary {
  /** Distinct templates read and parsed. */
  readonly templates: number;
  readonly broken: number;
  /** Template errors of the run (spec 8.3 `Errors:`, 8.5 `summary.errors`), apart from warnings. */
  readonly errors: number;
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
