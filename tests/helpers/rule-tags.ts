/** Vitest tags per error code: one tag per registered code, one per category (family), and the run codes under the `run` family. */
import { RUN_CODES } from "../../src/engine/directives.js";
import { createRegistry } from "../../src/engine/registry.js";
import { CATEGORIES, type Category } from "../../src/engine/rule.js";

export interface RuleTag {
  readonly name: string;
  readonly description: string;
}

/** The family tag of the run codes (MTL901..MTL923): they are codes of the spec, but no rule has them. */
const RUN_FAMILY = "run";

/** The family tag of `code` (its category, or `run` for a run code), or undefined when the code is unknown. */
export function familyOf(code: string): Category | typeof RUN_FAMILY | undefined {
  if (RUN_CODES.includes(code as (typeof RUN_CODES)[number])) return RUN_FAMILY;
  return createRegistry().byCode.get(code)?.category;
}

/** Family tags first, then one tag per registered code (`MTL101`) and per run code (`MTL907`), each with a short description. */
export function ruleTags(): RuleTag[] {
  const registry = createRegistry();
  const families = CATEGORIES.map((category) => ({ name: category, description: `Rules of the ${category} category` }));
  const runFamily = { name: RUN_FAMILY, description: "Run errors: config, paths, usage" };
  const codes = registry.rules.map((rule) => ({ name: rule.code, description: `${rule.code} ${rule.name}` }));
  const runCodes = RUN_CODES.map((code) => ({ name: code, description: `${code} run error` }));
  return [...families, runFamily, ...codes, ...runCodes];
}
