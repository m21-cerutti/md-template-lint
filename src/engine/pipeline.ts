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
 * inside one step, registry order (category file order, then file order);
 * the `headings` step then orders its presence findings by template heading,
 * and the `content` step orders its findings by template section.
 * Errors are returned first, then warnings, each in emission order.
 * `env` is required: a caller states its io on purpose (`createEnv` builds an
 * in-memory one for tests; the production runner builds the real one).
 *
 * Template warnings (`checkTemplate`) are sorted by source position (line,
 * then column) across rules, ties in registry order.
 *
 * The pipeline is async: checks may return a Promise (`[io:exists]` needs
 * file system and network access). Rules run one at a time, each awaited
 * before the next, so the order never depends on io timing.
 */
import { loadDocument } from "./load.js";
import { isEmptyValue, type Diagnostic, type DocumentModel } from "./model.js";
import { rulesOf, runPhase, runRules, type RuleRegistry } from "./registry.js";
import {
  FIELD_STEPS,
  itemIndexOf,
  sectionIndexOf,
  TARGET_STEPS,
  type FieldRule,
  type RuleEnv,
  type TargetContext,
  type TargetRule,
} from "./rule.js";

export type TemplateStatus =
  | { readonly status: "ok"; readonly model: DocumentModel; readonly warnings: Diagnostic[] }
  | { readonly status: "broken"; readonly diagnostics: Diagnostic[] };

/**
 * Source order: by line, then column; a diagnostic without a position first.
 * The sort is stable, so equal positions keep registry order.
 */
function bySourcePosition(diagnostics: readonly Diagnostic[]): Diagnostic[] {
  const line = (diagnostic: Diagnostic) => diagnostic.position?.line ?? 0;
  const column = (diagnostic: Diagnostic) => diagnostic.position?.column ?? 0;
  return [...diagnostics].sort((a, b) => line(a) - line(b) || column(a) - column(b));
}

/**
 * Parse a template. Broken (MTL001 to MTL004) or ok with its tag warnings
 * (MTL010 to MTL013), sorted by source position across rules (spec 4.1, 8.4).
 */
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
    warnings: bySourcePosition(await runPhase(registry, "template", context)),
  };
}

function byStep<R extends FieldRule | TargetRule>(
  rules: readonly R[],
  steps: readonly string[],
  step: string,
): R[] {
  return steps.includes(step) ? rules.filter((rule) => rule.step === step) : [];
}

/**
 * Order of the `headings` step (spec 4.1 step 5): the presence findings
 * (MTL601 to MTL603) in template heading order, as the legacy validator emits
 * them, then the findings that concern no single heading (MTL604).
 * A heading rule anchors its finding on the template heading line (`position`).
 * The sort is stable, so one heading keeps registry order. The anchor is only a
 * sort key: it is cleared, since it is a line of the template, not of the target.
 */
function byTemplateHeading(diagnostics: readonly Diagnostic[]): Diagnostic[] {
  const anchored = diagnostics.filter((diagnostic) => diagnostic.position !== null);
  const loose = diagnostics.filter((diagnostic) => diagnostic.position === null);
  const line = (diagnostic: Diagnostic) => diagnostic.position?.line ?? 0;
  const sorted = [...anchored].sort((a, b) => line(a) - line(b));
  return [...sorted.map((diagnostic) => ({ ...diagnostic, position: null })), ...loose];
}

/**
 * Order of the `io` step of one field (spec 2.8, legacy `_check_io_exists`):
 * one finding per list item, in ITEM order across the codes MTL801 to MTL805,
 * not grouped by rule. The io rules tag each finding with its item index
 * (`reportItem`); the sort is stable, so one item keeps registry order. The
 * index lives in a side table, so nothing is left on the diagnostic.
 */
function byItemIndex(diagnostics: readonly Diagnostic[]): Diagnostic[] {
  return [...diagnostics].sort((a, b) => itemIndexOf(a) - itemIndexOf(b));
}

/**
 * Order of the `content` step (spec 4.1 step 6, legacy `validate_content`): one
 * finding per template section, in SECTION order across the codes MTL701 to
 * MTL705, not grouped by rule. The content rules tag each finding with its
 * template section index (`reportSection`); the sort is stable, so one section
 * keeps registry order. The index lives in a side table, so nothing is left on
 * the diagnostic.
 */
function bySectionIndex(diagnostics: readonly Diagnostic[]): Diagnostic[] {
  return [...diagnostics].sort((a, b) => sectionIndexOf(a) - sectionIndexOf(b));
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
  env: RuleEnv,
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
      const found = await runRules(byStep(fieldRules, FIELD_STEPS, step), fieldContext);
      out.push(...(step === "io" ? byItemIndex(found) : found));
    }
  }
  for (const step of after) {
    const found = await runRules(byStep(targetRules, TARGET_STEPS, step), context);
    if (step === "headings") out.push(...byTemplateHeading(found));
    else if (step === "content") out.push(...bySectionIndex(found));
    else out.push(...found);
  }
  return errorsFirst(out);
}
