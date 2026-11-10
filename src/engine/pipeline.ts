/**
 * Engine entry points for one template and one target (docs/spec.md 4.1, 8.4).
 * Both go through loadDocument (grammar parse with the collecting listeners,
 * then YAML).
 *
 * Emission order of a target (deterministic, spec 4.1 and 8.4):
 * 1. a parse failure runs the `parse` rules only, and stops;
 * 2. `target` rules of step `filename`;
 * 3. for each TEMPLATE field in template order: when the target value is
 *    missing or empty, the `field` rules of step `presence` only (the one
 *    shared guard); otherwise the `field` rules of every other step, in
 *    FIELD_STEPS order;
 * 4. `target` rules of steps `unknown-keys`, `headings`, `content`;
 * inside one step, registry order (category file order, then file order).
 * Errors are returned first, then warnings, each in emission order.
 *
 * The pipeline is async: checks may return a Promise (`[io:exists]` needs
 * file system and network access). Rules run one at a time, each awaited
 * before the next, so the order never depends on io timing.
 */
import { loadDocument } from "./load.js";
import { isEmptyValue, type Diagnostic, type DocumentModel } from "./model.js";
import { rulesOf, runPhase, runRules, type RuleRegistry } from "./registry.js";
import {
  createEnv,
  FIELD_STEPS,
  TARGET_STEPS,
  type FieldRule,
  type RuleEnv,
  type TargetContext,
  type TargetRule,
} from "./rule.js";

export type TemplateStatus =
  | { readonly status: "ok"; readonly model: DocumentModel; readonly warnings: Diagnostic[] }
  | { readonly status: "broken"; readonly diagnostics: Diagnostic[] };

/** Parse a template. Broken (MTL001 to MTL004) or ok with its tag warnings (MTL010 to MTL013). */
export async function checkTemplate(registry: RuleRegistry, text: string): Promise<TemplateStatus> {
  const loaded = loadDocument(text);
  if (!loaded.ok) {
    const context = { phase: "parse", role: "template", failure: loaded.failure } as const;
    return { status: "broken", diagnostics: await runPhase(registry, "parse", context) };
  }
  const context = { phase: "template", template: loaded.model } as const;
  return {
    status: "ok",
    model: loaded.model,
    warnings: await runPhase(registry, "template", context),
  };
}

function byStep<R extends FieldRule | TargetRule>(
  rules: readonly R[],
  steps: readonly string[],
  step: string,
): R[] {
  return steps.includes(step) ? rules.filter((rule) => rule.step === step) : [];
}

/** Errors first, then warnings, each in emission order (spec 4.1, 8.4). */
function errorsFirst(diagnostics: readonly Diagnostic[]): Diagnostic[] {
  return [
    ...diagnostics.filter((diagnostic) => diagnostic.severity === "error"),
    ...diagnostics.filter((diagnostic) => diagnostic.severity === "warning"),
  ];
}

/** Lint one target text against a parsed template, in the order described above. */
export async function checkTarget(
  registry: RuleRegistry,
  template: DocumentModel,
  text: string,
  targetPath: string,
  env: RuleEnv = createEnv(),
): Promise<Diagnostic[]> {
  const loaded = loadDocument(text);
  if (!loaded.ok) {
    const context = { phase: "parse", role: "target", failure: loaded.failure } as const;
    return errorsFirst(await runPhase(registry, "parse", context));
  }
  const target = loaded.model;
  const targetRules = rulesOf(registry, "target");
  const fieldRules = rulesOf(registry, "field");
  const context: TargetContext = { phase: "target", template, target, targetPath, env };
  const [first, ...after] = TARGET_STEPS;
  const out = await runRules(byStep(targetRules, TARGET_STEPS, first), context);
  for (const templateField of template.fields.values()) {
    const value = target.fields.get(templateField.key)?.value ?? null;
    const missing = value === null || isEmptyValue(value);
    const steps = missing ? ["presence"] : FIELD_STEPS.filter((step) => step !== "presence");
    const fieldContext = {
      phase: "field",
      key: templateField.key,
      templateField,
      value,
      template,
      target,
      targetPath,
      env,
    } as const;
    for (const step of steps) {
      out.push(...(await runRules(byStep(fieldRules, FIELD_STEPS, step), fieldContext)));
    }
  }
  for (const step of after) {
    out.push(...(await runRules(byStep(targetRules, TARGET_STEPS, step), context)));
  }
  return errorsFirst(out);
}
