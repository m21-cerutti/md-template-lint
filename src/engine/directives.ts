/**
 * Disable directives of a target (docs/spec.md 4.4): validation of the parsed
 * directives (DIR2, DIR6), the range bookkeeping (DIR8) and the coverage rule
 * (DIR7). Pure data, no messages: src/rules/syntax.ts turns the problems into
 * MTL020 to MTL025, and src/engine/pipeline.ts applies the suppression plan
 * after every rule ran (spec 4.1 step 8).
 *
 * The directives come from `DocumentModel.directives` of the TARGET only; a
 * template is never read for directives (DIR4).
 */
import type { Directive, DirectiveVerb } from "../tags/ast.js";
import { codeNumber, type Diagnostic, type RuleCode } from "./model.js";
import { reportSequenced, setAnchorLine, type AnyRule, type TargetContext } from "./rule.js";

/**
 * Run diagnostics of the spec 4.3 "run errors" table. They are codes of the
 * 4.3 tables (a directive naming one gives MTL022, not MTL021), but no rule.
 */
export const RUN_CODES: readonly RuleCode[] = [
  "MTL901",
  "MTL902",
  "MTL903",
  "MTL904",
  "MTL905",
  "MTL906",
  "MTL907",
  "MTL908",
  "MTL909",
  "MTL910",
  "MTL911",
  "MTL912",
  "MTL913",
  "MTL920",
  "MTL921",
  "MTL922",
  "MTL923",
];

/** DIR6: the file diagnostics of a parsed target, MTL101 to MTL899. */
export function isSuppressible(code: string): boolean {
  const number = codeNumber(code);
  return number !== null && number >= 101 && number <= 899;
}

/** One directive diagnostic before it gets its code and message (MTL020 to MTL025). */
export type DirectiveProblem =
  | { readonly kind: "unknown-verb"; readonly directive: Directive; readonly word: string }
  | { readonly kind: "no-code"; readonly directive: Directive; readonly verb: DirectiveVerb }
  | { readonly kind: "unknown-code"; readonly directive: Directive; readonly token: string }
  | { readonly kind: "not-suppressible"; readonly directive: Directive; readonly code: string }
  | { readonly kind: "end-without-begin"; readonly directive: Directive; readonly code: string }
  | { readonly kind: "begin-unclosed"; readonly directive: Directive; readonly code: string }
  | {
      readonly kind: "already-disabled";
      readonly directive: Directive;
      /** The verb of this directive: `disable` or `begin disable`. */
      readonly verb: DirectiveVerb;
      readonly code: string;
      /** Line of the directive that opened the active range. */
      readonly open: number;
    };

/** A `disable` / `begin disable` range, inclusive; `end` null runs to the end of the file. */
export interface DisabledRange {
  readonly start: number;
  readonly end: number | null;
}

/** What the valid directives of one target cover (DIR1, DIR7). */
export interface SuppressionPlan {
  /** Codes of a valid `disable-file`: every diagnostic of the code, anchor or not. */
  readonly document: ReadonlySet<string>;
  /** Lines covered per code by `disable-line` (its line) and `disable-next-line` (line + 1). */
  readonly lines: ReadonlyMap<string, ReadonlySet<number>>;
  /** Ranges per code from `disable` and `begin disable`. */
  readonly ranges: ReadonlyMap<string, readonly DisabledRange[]>;
}

export interface DirectiveAnalysis {
  /** Spec 4.1 step 7 order: directive source order, item order, MTL024 last (DIR8). */
  readonly problems: readonly DirectiveProblem[];
  readonly plan: SuppressionPlan;
}

interface OpenRange {
  readonly start: number;
  readonly directive: Directive;
  /** Index of the code among the valid codes of its directive (MTL024 order). */
  readonly item: number;
}

/** True when `text` is `MTL` and three digits, case-insensitive. */
function isCodeShape(text: string): boolean {
  return codeNumber(text.toUpperCase()) !== null;
}

/**
 * Validate and book-keep the directives of a target, in source order (line,
 * then column). `knownCodes` are the codes of the spec 4.3 tables: the
 * registered rules and the run diagnostics.
 */
export function analyzeDirectives(
  directives: readonly Directive[],
  knownCodes: ReadonlySet<string>,
): DirectiveAnalysis {
  const problems: DirectiveProblem[] = [];
  const document = new Set<string>();
  const lines = new Map<string, Set<number>>();
  const ranges = new Map<string, DisabledRange[]>();
  const open = new Map<string, OpenRange>();
  const ordered = [...directives].sort(
    (a, b) => a.position.line - b.position.line || a.position.column - b.position.column,
  );

  const addLine = (code: string, line: number) => {
    const set = lines.get(code) ?? new Set<number>();
    set.add(line);
    lines.set(code, set);
  };
  const addRange = (code: string, range: DisabledRange) => {
    const list = ranges.get(code) ?? [];
    list.push(range);
    ranges.set(code, list);
  };

  for (const directive of ordered) {
    const verb = directive.verb;
    // DIR2: a malformed verb makes the whole directive inert.
    if (verb === null) {
      problems.push({ kind: "unknown-verb", directive, word: directive.word });
      continue;
    }
    if (directive.items.length === 0) {
      problems.push({ kind: "no-code", directive, verb });
      continue;
    }
    const seen = new Set<string>();
    let valid = 0;
    for (const item of directive.items) {
      const token = item.text.toUpperCase();
      // DIR2: a code (or token) listed twice in one directive counts once.
      if (seen.has(token)) continue;
      seen.add(token);
      if (!isCodeShape(token) || !knownCodes.has(token)) {
        problems.push({ kind: "unknown-code", directive, token: item.text });
        continue;
      }
      if (!isSuppressible(token)) {
        problems.push({ kind: "not-suppressible", directive, code: token });
        continue;
      }
      const code = token;
      const index = valid;
      valid += 1;
      switch (verb) {
        case "disable-line":
          addLine(code, directive.line);
          break;
        case "disable-next-line":
          addLine(code, directive.line + 1);
          break;
        case "disable-file":
          document.add(code);
          break;
        case "disable":
        case "begin disable": {
          const active = open.get(code);
          if (active === undefined) {
            open.set(code, { start: directive.line, directive, item: index });
          } else {
            problems.push({
              kind: "already-disabled",
              directive,
              verb,
              code,
              open: active.start,
            });
          }
          break;
        }
        case "end disable": {
          const active = open.get(code);
          if (active === undefined) problems.push({ kind: "end-without-begin", directive, code });
          else {
            addRange(code, { start: active.start, end: directive.line });
            open.delete(code);
          }
          break;
        }
      }
    }
  }

  // DIR8: still open at the end of the file; MTL024 for `begin disable` only, ordered by
  // the position of the `begin disable`, then by the code order in that directive.
  const unclosed = [...open].sort(
    ([, a], [, b]) =>
      a.directive.position.line - b.directive.position.line ||
      a.directive.position.column - b.directive.position.column ||
      a.item - b.item,
  );
  for (const [code, range] of unclosed) {
    addRange(code, { start: range.start, end: null });
    if (range.directive.verb === "begin disable") {
      problems.push({ kind: "begin-unclosed", directive: range.directive, code });
    }
  }
  return { problems, plan: { document, lines, ranges } };
}

type ProblemKind = DirectiveProblem["kind"];
type ProblemOf<K extends ProblemKind> = Extract<DirectiveProblem, { kind: K }>;

/**
 * The diagnostics of `rule` for the directive problems of `kind` in the target
 * of `context`, for the rules of src/rules/syntax.ts (which own the `text`).
 * Each has the directive position (`<!--` or `#`), the message
 * `Directive on line {line}: <text>`, its index in the analysis as sort key
 * (`reportSequenced`) and the directive line as anchor (data for reporters;
 * these codes are never suppressible, DIR6).
 */
export function directiveDiagnostics<K extends ProblemKind>(
  context: TargetContext,
  rule: Pick<AnyRule, "code" | "severity">,
  kind: K,
  text: (problem: ProblemOf<K>) => string,
): Diagnostic[] {
  const { problems } = analyzeDirectives(context.target.directives, context.knownCodes);
  return problems.flatMap((problem, index) => {
    if (problem.kind !== kind) return [];
    const message = `Directive on line ${problem.directive.line}: ${text(problem as ProblemOf<K>)}`;
    const diagnostic = reportSequenced(rule, message, problem.directive.position, index);
    return [setAnchorLine(diagnostic, problem.directive.line)];
  });
}

/**
 * DIR7: a suppressible diagnostic with `code` and anchor line `anchor` (null:
 * no anchor) is covered by a `disable-file` for its code, or, when it has
 * an anchor, by a line directive or a range on that line. A diagnostic
 * without anchor is covered ONLY by `disable-file`.
 */
export function isCovered(plan: SuppressionPlan, code: string, anchor: number | null): boolean {
  if (!isSuppressible(code)) return false;
  if (plan.document.has(code)) return true;
  if (anchor === null) return false;
  if (plan.lines.get(code)?.has(anchor) === true) return true;
  return (plan.ranges.get(code) ?? []).some(
    (range) => range.start <= anchor && (range.end === null || anchor <= range.end),
  );
}
