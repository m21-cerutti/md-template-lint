/**
 * Rule registry: loads the nine category files src/rules/<category>.ts
 * (docs/spec.md 9) and checks the contract on load: unique codes, the
 * category of each rule matches its file, the code lies in the category
 * range (spec 4.2), and `field` / `target` rules have a valid `step`.
 * The Record type makes a missing category a type error.
 */
import { rules as bounds } from "../rules/bounds.js";
import { rules as content } from "../rules/content.js";
import { rules as filename } from "../rules/filename.js";
import { rules as format } from "../rules/format.js";
import { rules as heading } from "../rules/heading.js";
import { rules as io } from "../rules/io.js";
import { rules as presence } from "../rules/presence.js";
import { rules as syntax } from "../rules/syntax.js";
import { rules as type } from "../rules/type.js";
import type { Diagnostic } from "./model.js";
import {
  CATEGORIES,
  CATEGORY_RANGES,
  FIELD_STEPS,
  TARGET_STEPS,
  type AnyRule,
  type Category,
  type Phase,
  type PhaseContexts,
  type Rule,
} from "./rule.js";

/** The category files, keyed by category. */
export const RULE_FILES: Readonly<Record<Category, readonly AnyRule[]>> = {
  syntax,
  filename,
  presence,
  format,
  bounds,
  type,
  heading,
  content,
  io,
};

export interface RuleRegistry {
  /** Every rule, category file order, then file order. */
  readonly rules: readonly AnyRule[];
  readonly byCode: ReadonlyMap<string, AnyRule>;
  readonly byCategory: ReadonlyMap<Category, readonly AnyRule[]>;
}

/** Numeric part of `MTLnnn`, or null when the code is not `MTL` and three digits. */
export function codeNumber(code: string): number | null {
  const digits = code.slice(3);
  if (!code.startsWith("MTL") || digits.length !== 3) return null;
  for (const char of digits) if (char < "0" || char > "9") return null;
  return Number(digits);
}

export class RegistryError extends Error {
  override name = "RegistryError";
}

const STEPS: Readonly<Record<Phase, readonly string[]>> = {
  parse: [],
  template: [],
  field: FIELD_STEPS,
  target: TARGET_STEPS,
};

/** Step problem of `rule`, or null. Read through `unknown`: files may be hand-written. */
function stepProblem(rule: AnyRule): string | null {
  const step: unknown = "step" in rule ? rule.step : undefined;
  const allowed = STEPS[rule.phase];
  if (allowed.length === 0) {
    return step === undefined ? null : `phase '${rule.phase}' takes no step`;
  }
  if (typeof step !== "string" || !allowed.includes(step)) {
    return `phase '${rule.phase}' needs a step, one of ${allowed.join(", ")}`;
  }
  return null;
}

/** Load and validate the rule files. Throws RegistryError on a contract violation. */
export function createRegistry(
  files: Readonly<Record<Category, readonly AnyRule[]>> = RULE_FILES,
): RuleRegistry {
  const rules: AnyRule[] = [];
  const byCode = new Map<string, AnyRule>();
  const byCategory = new Map<Category, readonly AnyRule[]>();
  for (const category of CATEGORIES) {
    const list = files[category];
    const [low = 0, high = -1] = CATEGORY_RANGES[category];
    for (const rule of list) {
      const where = `src/rules/${category}.ts: ${rule.code} ${rule.name}`;
      const number = codeNumber(rule.code);
      if (number === null) throw new RegistryError(`${where}: code must be MTL and 3 digits`);
      if (rule.category !== category) {
        throw new RegistryError(`${where}: category '${rule.category}' does not match the file`);
      }
      if (number < low || number > high) {
        throw new RegistryError(`${where}: code outside the ${category} range ${low}-${high}`);
      }
      const step = stepProblem(rule);
      if (step !== null) throw new RegistryError(`${where}: ${step}`);
      const other = byCode.get(rule.code);
      if (other !== undefined) {
        throw new RegistryError(`${where}: code already used by ${other.category}/${other.name}`);
      }
      byCode.set(rule.code, rule);
      rules.push(rule);
    }
    byCategory.set(category, list);
  }
  return { rules, byCode, byCategory };
}

/** Rules of one phase, registry order. */
export function rulesOf<P extends Phase>(registry: RuleRegistry, phase: P): Rule<P>[] {
  return registry.rules.filter((rule): rule is Rule<P> => rule.phase === phase);
}

/**
 * Run `rules` on `context` one after the other, awaiting each check, so the
 * emission order is the order of `rules` even when checks are async.
 */
export async function runRules<P extends Phase>(
  rules: readonly Rule<P>[],
  context: PhaseContexts[P],
): Promise<Diagnostic[]> {
  const out: Diagnostic[] = [];
  for (const rule of rules) {
    const check = rule.check as (context: PhaseContexts[P]) => ReturnType<typeof rule.check>;
    out.push(...(await check(context)));
  }
  return out;
}

/** Run every rule of `phase` on `context`, registry order. */
export function runPhase<P extends Phase>(
  registry: RuleRegistry,
  phase: P,
  context: PhaseContexts[P],
): Promise<Diagnostic[]> {
  return runRules(rulesOf(registry, phase), context);
}
