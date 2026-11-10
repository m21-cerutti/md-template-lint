/**
 * Rule contract (docs/spec.md 4.1, 4.2, 8.4, 9). A rule lives in exactly one
 * category file src/rules/<category>.ts. The registry
 * (src/engine/registry.ts) loads every file; the pipeline
 * (src/engine/pipeline.ts) runs the rules in the order of spec 4.1.
 *
 * Phases:
 * - `parse`: a file failed to parse (MTL001 to MTL004);
 * - `template`: a parsed template on its own (tag findings, `--verify`);
 * - `field`: one template field of one target, ordered by `step` (spec 4.1
 *   step 3). The missing or empty value guard lives in the pipeline only;
 * - `target`: whole-target rules, ordered by `step` (filename before the
 *   fields; unknown keys, headings, content after them).
 */
import type { SourcePosition } from "../tags/ast.js";
import type {
  Diagnostic,
  DocumentModel,
  Field,
  ParseFailure,
  RuleCode,
  Severity,
  YamlValue,
} from "./model.js";
import ranges from "./ranges.json" with { type: "json" };

/** The nine rule categories, one file each in src/rules/ (spec 9). */
export const CATEGORIES = [
  "syntax",
  "filename",
  "presence",
  "format",
  "bounds",
  "type",
  "heading",
  "content",
  "io",
] as const;

export type Category = (typeof CATEGORIES)[number];

/**
 * Code range of each category, inclusive (spec 4.2). Single source:
 * src/engine/ranges.json, also read by scripts/new-rule.ts and checked
 * against the spec by `pnpm run check:rules`. MTL900-999 belong to the engine.
 */
export const CATEGORY_RANGES: Readonly<Record<Category, readonly number[]>> = ranges;

/**
 * Field steps in run order (spec 4.1 step 3). `presence` runs ONLY when the
 * target value is missing or empty; every other step runs only when it is
 * present and non-empty. `type` covers enum (MTL517) or the type rule.
 * `shape` (MTL306 to MTL309, spec 2.9, change C11) is appended last, after
 * `type`, so every existing code keeps its emission order.
 */
export const FIELD_STEPS = [
  "presence",
  "constant",
  "count",
  "range",
  "order",
  "scheme",
  "io",
  "value-filename",
  "case",
  "elements",
  "type",
  "shape",
] as const;

export type FieldStep = (typeof FIELD_STEPS)[number];

/**
 * Whole-target steps in run order (spec 4.1 steps 2, 4, 5, 6, 7). `filename`
 * runs before the fields, the others after them; `directives` (the target
 * directive warnings MTL020 to MTL025) is last.
 */
export const TARGET_STEPS = [
  "filename",
  "unknown-keys",
  "headings",
  "content",
  "directives",
] as const;

export type TargetStep = (typeof TARGET_STEPS)[number];

/** HTTP probe timeout of `[io:exists]` (spec 2.8). */
export const URL_PROBE_TIMEOUT_MS = 5000;

export type UrlProbe =
  { readonly reachable: true } | { readonly reachable: false; readonly reason: string };

/** File system and network access of rules. Never throws (spec 2.8). */
export interface RuleIo {
  /** True when `path` exists. Every OS error counts as "does not exist". */
  exists(path: string): Promise<boolean>;
  /** HEAD, then GET once if HEAD fails; 2xx or 3xx is reachable. */
  probeUrl(url: string, timeoutMs: number): Promise<UrlProbe>;
}

/** Config and io handle of one pair (spec 2.8, 6). */
export interface RuleEnv {
  /** Config `aliases`: alias name -> resolved directory. */
  readonly aliases: ReadonlyMap<string, string>;
  /** Config `approvedPaths`, resolved. */
  readonly approvedPaths: readonly string[];
  /** Root of the pair that matched the target; relative paths resolve here (D11). */
  readonly pairRoot: string;
  readonly io: RuleIo;
}

/**
 * In-memory io for tests and dry runs: only `paths` exist, only `urls`
 * entries answer, everything else is missing or unreachable. No network.
 */
export function createMemoryIo(
  paths: Iterable<string> = [],
  urls: ReadonlyMap<string, UrlProbe> = new Map(),
): RuleIo {
  const existing = new Set(paths);
  return {
    exists: (path) => Promise.resolve(existing.has(path)),
    probeUrl: (url) => Promise.resolve(urls.get(url) ?? { reachable: false, reason: "not probed" }),
  };
}

/** Env with no aliases, no approved paths and the in-memory io. */
export function createEnv(overrides: Partial<RuleEnv> = {}): RuleEnv {
  return {
    aliases: new Map(),
    approvedPaths: [],
    pairRoot: ".",
    io: createMemoryIo(),
    ...overrides,
  };
}

/** A file failed to parse (MTL001 to MTL004). */
export interface ParseContext {
  readonly phase: "parse";
  readonly role: "template" | "target";
  readonly failure: ParseFailure;
}

/** A parsed template, checked on its own (template warnings, `--verify`). */
export interface TemplateContext {
  readonly phase: "template";
  readonly template: DocumentModel;
}

/** A parsed target linted against its template (whole-target rules). */
export interface TargetContext {
  readonly phase: "target";
  readonly template: DocumentModel;
  readonly target: DocumentModel;
  /** Target path as given to the engine (file name stem rules). */
  readonly targetPath: string;
  readonly env: RuleEnv;
  /**
   * Codes of the spec 4.3 tables: the registered rules plus the run diagnostics
   * (`RUN_CODES`). A directive item outside this set is MTL021 (spec 4.4, DIR2).
   */
  readonly knownCodes: ReadonlySet<string>;
}

/** One template field of one target (spec 4.1 step 3). */
export interface FieldContext {
  readonly phase: "field";
  readonly key: string;
  /** The template field: its tags, hints and inferred type. */
  readonly templateField: Field;
  /**
   * The target value: null when the key is missing. Step `presence` sees a
   * missing or empty value; every other step sees a present, non-empty one.
   */
  readonly value: YamlValue | null;
  readonly template: DocumentModel;
  readonly target: DocumentModel;
  readonly targetPath: string;
  readonly env: RuleEnv;
}

export interface PhaseContexts {
  readonly parse: ParseContext;
  readonly template: TemplateContext;
  readonly field: FieldContext;
  readonly target: TargetContext;
}

export type Phase = keyof PhaseContexts;

/** A check may be sync or async; the pipeline awaits each one in order. */
export type RuleResult = readonly Diagnostic[] | Promise<readonly Diagnostic[]>;

interface RuleBase<P extends Phase> {
  readonly code: RuleCode;
  /** Kebab-case name from the spec 4.3 table. */
  readonly name: string;
  /** Default severity; a check may override it per diagnostic (MTL517). */
  readonly severity: Severity;
  readonly category: Category;
  readonly phase: P;
  readonly check: (context: PhaseContexts[P]) => RuleResult;
}

export type ParseRule = RuleBase<"parse">;
export type TemplateRule = RuleBase<"template">;
export interface FieldRule extends RuleBase<"field"> {
  readonly step: FieldStep;
}
export interface TargetRule extends RuleBase<"target"> {
  readonly step: TargetStep;
}

export interface RuleOfPhase {
  readonly parse: ParseRule;
  readonly template: TemplateRule;
  readonly field: FieldRule;
  readonly target: TargetRule;
}

export type Rule<P extends Phase> = RuleOfPhase[P];
export type AnyRule = RuleOfPhase[Phase];

/** Identity helper that keeps the phase and context types of a rule literal. */
export function defineRule<const R extends AnyRule>(rule: R): R {
  return rule;
}

const STUB_CHECKS = new WeakSet<object>();

/**
 * Check of a scaffolded, not yet implemented rule (`pnpm run new:rule`). It
 * throws when run, and `pnpm run check:rules` treats the rule as pending.
 */
export function notImplemented(code: RuleCode): () => never {
  const check = (): never => {
    throw new Error(`not implemented: ${code}`);
  };
  STUB_CHECKS.add(check);
  return check;
}

/** True when `rule` still has the scaffold stub check. */
export function isStub(rule: AnyRule): boolean {
  return STUB_CHECKS.has(rule.check);
}

/** A diagnostic of `rule` (rule severity unless `severity` is given). */
export function report(
  rule: Pick<AnyRule, "code" | "severity">,
  message: string,
  position: SourcePosition | null = null,
  severity: Severity = rule.severity,
): Diagnostic {
  return { code: rule.code, severity, message, position };
}

/**
 * Item index of the diagnostics of the `io` step. A side table (not a field of
 * `Diagnostic`), so the index never reaches a reporter: it is only the sort key
 * the pipeline reads once, right after the step ran.
 */
const ITEM_INDEX = new WeakMap<Diagnostic, number>();

/** A diagnostic about item `index` of a list value, see `byItemIndex` in the pipeline. */
export function reportItem(
  rule: Pick<AnyRule, "code" | "severity">,
  message: string,
  index: number,
): Diagnostic {
  const diagnostic = report(rule, message);
  ITEM_INDEX.set(diagnostic, index);
  return diagnostic;
}

/** Item index set by `reportItem`; 0 for any other diagnostic. */
export function itemIndexOf(diagnostic: Diagnostic): number {
  return ITEM_INDEX.get(diagnostic) ?? 0;
}

/**
 * Template section index of the diagnostics of the `content` step. A side
 * table like `ITEM_INDEX`: the index never reaches a reporter, it is only the
 * sort key the pipeline reads once, right after the step ran.
 */
const SECTION_INDEX = new WeakMap<Diagnostic, number>();

/**
 * A diagnostic about the template section at `index` in `template.sections`,
 * see `bySectionIndex` in the pipeline. `anchorLine` is the target line of the
 * checked section heading (spec 4.4 DIR5), see `anchorLineOf`.
 */
export function reportSection(
  rule: Pick<AnyRule, "code" | "severity">,
  message: string,
  index: number,
  anchorLine: number | null = null,
): Diagnostic {
  const diagnostic = report(rule, message);
  SECTION_INDEX.set(diagnostic, index);
  return setAnchorLine(diagnostic, anchorLine);
}

/** Section index set by `reportSection`; 0 for any other diagnostic (sort key only). */
export function sectionIndexOf(diagnostic: Diagnostic): number {
  return SECTION_INDEX.get(diagnostic) ?? 0;
}

/**
 * Section index recorded by `reportSection`, or null for a diagnostic that was
 * never tagged. Used to name the heading of a finding: an untagged diagnostic
 * must not be attributed to section 0.
 */
export function recordedSectionIndex(diagnostic: Diagnostic): number | null {
  return SECTION_INDEX.get(diagnostic) ?? null;
}

/**
 * Emission order of the `directives` step (spec 4.1 step 7): one sequence over
 * the six directive rules (directive source order, item order, MTL024 last).
 * A side table like `ITEM_INDEX`, read once by the pipeline after the step ran.
 */
const SEQUENCE = new WeakMap<Diagnostic, number>();

/** A diagnostic at `position` with the sort key `sequence`, see `bySequence` in the pipeline. */
export function reportSequenced(
  rule: Pick<AnyRule, "code" | "severity">,
  message: string,
  position: SourcePosition | null,
  sequence: number,
): Diagnostic {
  const diagnostic = report(rule, message, position);
  SEQUENCE.set(diagnostic, sequence);
  return diagnostic;
}

/** Sequence set by `reportSequenced`; 0 for any other diagnostic (sort key only). */
export function sequenceOf(diagnostic: Diagnostic): number {
  return SEQUENCE.get(diagnostic) ?? 0;
}

/**
 * Target anchor line of a diagnostic (spec 4.4 DIR5): one 1-based line of the
 * target file, or none. A side table, never a field of `Diagnostic`, so the
 * reporters and the JSON output stay unchanged. The pipeline records it on the
 * diagnostics it returns; a rule whose finding names one target line it alone
 * knows (MTL202, the key line) records it with `reportOnLine`.
 */
const ANCHOR_LINE = new WeakMap<Diagnostic, number>();

/** Record (or, with null, clear) the target anchor line of `diagnostic`; returns it. */
export function setAnchorLine(diagnostic: Diagnostic, line: number | null): Diagnostic {
  if (line === null) ANCHOR_LINE.delete(diagnostic);
  else ANCHOR_LINE.set(diagnostic, line);
  return diagnostic;
}

/**
 * Target anchor line of `diagnostic` (1-based), or null when it has none: a
 * diagnostic about the whole file (spec 4.4 DIR5), a template diagnostic, or
 * one the pipeline did not return.
 */
export function anchorLineOf(diagnostic: Diagnostic): number | null {
  return ANCHOR_LINE.get(diagnostic) ?? null;
}

/** A diagnostic anchored on target line `line` (spec 4.4 DIR5). */
export function reportOnLine(
  rule: Pick<AnyRule, "code" | "severity">,
  message: string,
  line: number,
): Diagnostic {
  return setAnchorLine(report(rule, message), line);
}
