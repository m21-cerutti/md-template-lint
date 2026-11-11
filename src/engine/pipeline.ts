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
 *    FIELD_STEPS order; skipped for a target without frontmatter (ADR 0015);
 * 4. `target` rules of steps `unknown-keys`, `headings`, `content`;
 * 5. `target` rules of step `directives` (MTL020 to MTL025, spec 4.4);
 * inside one step, registry order (category file order, then file order);
 * the `headings` step then orders its presence findings by template heading,
 * the `content` step orders its findings by template section, and the
 * `directives` step follows the directive analysis (MTL024 last).
 * 6. suppression (spec 4.1 step 8): the diagnostics a target directive covers
 *    (code and anchor line, DIR7) are removed and counted.
 * Errors are returned first, then warnings, each in emission order.
 *
 * Anchor lines (spec 4.4 DIR5) live in the side table of src/engine/rule.ts
 * (`anchorLineOf`): field findings take the target key line, MTL202 and the
 * heading and content findings (MTL603, MTL606 to MTL609, MTL610 to MTL612,
 * MTL614 to MTL617, MTL701 to MTL705; MTL607 only when the repeat set has an
 * instance) the target line their rule recorded, the directive warnings their
 * directive line; every other diagnostic has none (MTL101, MTL601, MTL604,
 * MTL605, parse failures, template diagnostics).
 * `env` is required: a caller states its io on purpose (`createEnv` builds an
 * in-memory one for tests; the production runner builds the real one).
 *
 * `checkTemplate` splits the template-phase diagnostics by severity: tag
 * WARNINGS (MTL010 to MTL016, MTL031) and template ERRORS (MTL017, MTL018, MTL019 and
 * MTL030, spec 2.7). A template with errors is still ok (not broken): the
 * runner fails it (exit 1) and still lints its targets. Both lists are sorted
 * by source position (line, then column) across rules, ties in registry order.
 *
 * The pipeline is async: checks may return a Promise (`[io:exists]` needs
 * file system and network access). Rules run one at a time, each awaited
 * before the next, so the order never depends on io timing.
 */
import { analyzeDirectives, isCovered, RUN_CODES } from "./directives.js";
import { loadDocument } from "./load.js";
import { isEmptyValue, type Diagnostic, type DocumentModel } from "./model.js";
import { rulesOf, runPhase, runRules, type RuleRegistry } from "./registry.js";
import { anchorLineOf, FIELD_STEPS, itemIndexOf, recordedSectionIndex, sectionIndexOf, sequenceOf, setAnchorLine, TARGET_STEPS, type FieldRule, type RuleEnv, type TargetContext, type TargetRule } from "./rule.js";

export type TemplateStatus =
  | {
      readonly status: "ok";
      readonly model: DocumentModel;
      /** Template WARNINGS (`MTL010` to `MTL016`, `MTL031`), source order. */
      readonly warnings: Diagnostic[];
      /**
       * Template ERRORS (spec 2.7: `MTL017`, `MTL018`, `MTL019`, `MTL030`), source order.
       * Counted apart from the warnings: they do not make the template broken, but fail it
       * (exit 1 in `--verify` and in a lint run, where the targets are still linted).
       */
      readonly errors: Diagnostic[];
    }
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
 * (MTL010 to MTL016, MTL031) and its template errors (MTL017, MTL018, MTL019, MTL030, spec 2.7)
 * apart, each sorted by source position across rules (spec 4.1, 8.4).
 */
export async function checkTemplate(registry: RuleRegistry, text: string): Promise<TemplateStatus> {
  const loaded = loadDocument(text);
  if (!loaded.ok) {
    const context = { phase: "parse", role: "template", failure: loaded.failure } as const;
    return { status: "broken", diagnostics: await runPhase(registry, "parse", context) };
  }
  const context = { phase: "template", template: loaded.model } as const;
  const found = bySourcePosition(await runPhase(registry, "template", context));
  return {
    status: "ok",
    model: loaded.model,
    warnings: found.filter((diagnostic) => diagnostic.severity === "warning"),
    errors: found.filter((diagnostic) => diagnostic.severity === "error"),
  };
}

function byStep<R extends FieldRule | TargetRule>(rules: readonly R[], steps: readonly string[], step: string): R[] {
  return steps.includes(step) ? rules.filter((rule) => rule.step === step) : [];
}

/**
 * Order of the `headings` step (spec 4.1 step 5, 4.3 "heading"): the findings
 * about one template heading (MTL601, MTL603, MTL605 to MTL610, MTL614, MTL617;
 * MTL611 on its parent; MTL612 and MTL615 on the tagged heading; MTL616 on the
 * last position of its run) in template heading order,
 * then the findings that concern no single heading (MTL604 and
 * MTL613, which carry no template anchor). A heading rule anchors its finding
 * on the template heading line (`position`).
 * The sort is stable, so one heading keeps registry order. The anchor is only a
 * sort key (a line of the template, not of the target): it is cleared, and the
 * text of the heading found at that line becomes the `heading` of the
 * diagnostic (spec 8.1), unless the rule already set a `heading` (MTL611: the
 * target parent text; MTL606, MTL609, MTL612, MTL614 to MTL617: the text of the
 * reported target heading). The target anchor line is kept apart (`anchorLineOf`),
 * not replaced by `heading`: two sections may share one text, a line is unique.
 */
function byTemplateHeading(diagnostics: readonly Diagnostic[], template: DocumentModel): Diagnostic[] {
  const anchored = diagnostics.filter((diagnostic) => diagnostic.position !== null);
  const loose = diagnostics.filter((diagnostic) => diagnostic.position === null);
  const line = (diagnostic: Diagnostic) => diagnostic.position?.line ?? 0;
  const sorted = [...anchored].sort((a, b) => line(a) - line(b));
  const named = sorted.map((diagnostic): Diagnostic => {
    const text = template.sections.find((section) => section.line === line(diagnostic))?.text;
    const copy = {
      ...diagnostic,
      position: null,
      ...(text === undefined || diagnostic.heading !== undefined ? {} : { heading: text }),
    };
    return setAnchorLine(copy, anchorLineOf(diagnostic));
  });
  return [...named, ...loose];
}

/**
 * Order of the `io` step of one field (spec 2.8):
 * one finding per list item, in ITEM order across the codes MTL801 to MTL805,
 * not grouped by rule. The io rules tag each finding with its item index
 * (`reportItem`); the sort is stable, so one item keeps registry order. The
 * index lives in a side table, so nothing is left on the diagnostic.
 */
function byItemIndex(diagnostics: readonly Diagnostic[]): Diagnostic[] {
  return [...diagnostics].sort((a, b) => itemIndexOf(a) - itemIndexOf(b));
}

/**
 * Order of the `content` step (spec 4.1 step 6): one
 * finding per template section, in SECTION order across the codes MTL701 to
 * MTL705, not grouped by rule. The content rules tag each finding with its
 * template section index (`reportSection`); the sort is stable, so one section
 * keeps registry order. The index lives in a side table, so it is not left on
 * the diagnostic; the text of that section becomes its `heading` (spec 8.1).
 */
function bySectionIndex(diagnostics: readonly Diagnostic[], template: DocumentModel): Diagnostic[] {
  return [...diagnostics]
    .sort((a, b) => sectionIndexOf(a) - sectionIndexOf(b))
    .map((diagnostic): Diagnostic => {
      const index = recordedSectionIndex(diagnostic);
      const text = index === null ? undefined : template.sections[index]?.text;
      if (text === undefined) return diagnostic;
      return setAnchorLine({ ...diagnostic, heading: text }, anchorLineOf(diagnostic));
    });
}

/**
 * Order of the `directives` step (spec 4.1 step 7): the directive warnings of
 * the six rules in the order of the directive analysis (directive source
 * order, item order, MTL024 last, DIR8), recorded by `reportSequenced`.
 */
function bySequence(diagnostics: readonly Diagnostic[]): Diagnostic[] {
  return [...diagnostics].sort((a, b) => sequenceOf(a) - sequenceOf(b));
}

/** Errors first, then warnings, each in emission order (spec 4.1, 8.4). */
function errorsFirst(diagnostics: readonly Diagnostic[]): Diagnostic[] {
  return [...diagnostics.filter((diagnostic) => diagnostic.severity === "error"), ...diagnostics.filter((diagnostic) => diagnostic.severity === "warning")];
}

/** Result of one target: what is reported, and how many diagnostics directives removed. */
export interface TargetResult {
  /**
   * Reported diagnostics, errors first, then warnings (spec 4.1). Each one that
   * concerns one target line carries it in the anchor side table
   * (`anchorLineOf`, spec 4.4 DIR5); the others have none.
   */
  readonly diagnostics: Diagnostic[];
  /** Diagnostics removed by the disable directives of the target (spec 4.4 DIR9). */
  readonly suppressed: number;
}

/**
 * Lint one target text against a parsed template, in the order described above,
 * then apply the disable directives of the TARGET (spec 4.1 step 8, 4.4 DIR7):
 * a pure output filter by code and anchor line; every rule still ran in full.
 */
export async function lintTarget(registry: RuleRegistry, template: DocumentModel, text: string, targetPath: string, env: RuleEnv): Promise<TargetResult> {
  const loaded = loadDocument(text, { frontmatterOptional: template.frontmatterOptional });
  if (!loaded.ok) {
    const context = { phase: "parse", role: "target", failure: loaded.failure } as const;
    return { diagnostics: errorsFirst(await runPhase(registry, "parse", context)), suppressed: 0 };
  }
  const target = loaded.model;
  const knownCodes = new Set<string>([...registry.byCode.keys(), ...RUN_CODES]);
  const out = await runTargetRules(registry, template, target, targetPath, env, knownCodes);
  const { plan } = analyzeDirectives(target.directives, knownCodes);
  const kept = out.filter((diagnostic) => !isCovered(plan, diagnostic.code, anchorLineOf(diagnostic)));
  return { diagnostics: errorsFirst(kept), suppressed: out.length - kept.length };
}

/** `lintTarget` without the suppressed count: the reported diagnostics only. */
export async function checkTarget(registry: RuleRegistry, template: DocumentModel, text: string, targetPath: string, env: RuleEnv): Promise<Diagnostic[]> {
  return (await lintTarget(registry, template, text, targetPath, env)).diagnostics;
}

/** Steps 2 to 7 of spec 4.1 on a loaded target, in emission order, with their anchors. */
async function runTargetRules(registry: RuleRegistry, template: DocumentModel, target: DocumentModel, targetPath: string, env: RuleEnv, knownCodes: ReadonlySet<string>): Promise<Diagnostic[]> {
  const targetRules = rulesOf(registry, "target");
  const fieldRules = rulesOf(registry, "field");
  const context: TargetContext = {
    phase: "target",
    template,
    target,
    targetPath,
    env,
    knownCodes,
  };
  const [first, ...after] = TARGET_STEPS;
  const out = await runRules(byStep(targetRules, TARGET_STEPS, first), context);
  // ADR 0015: a target without frontmatter (only loaded under `[frontmatter:optional]`) runs no field rules.
  const templateFields = target.document.frontmatter === null ? [] : template.fields.values();
  for (const templateField of templateFields) {
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
    // DIR5: a field finding anchors on the target key line; none when the key is missing.
    const keyLine = target.fields.get(templateField.key)?.line ?? null;
    for (const step of steps) {
      const found = await runRules(byStep(fieldRules, FIELD_STEPS, step), fieldContext);
      for (const diagnostic of found) setAnchorLine(diagnostic, keyLine);
      out.push(...(step === "io" ? byItemIndex(found) : found));
    }
  }
  for (const step of after) {
    const found = await runRules(byStep(targetRules, TARGET_STEPS, step), context);
    if (step === "headings") out.push(...byTemplateHeading(found, template));
    else if (step === "content") out.push(...bySectionIndex(found, template));
    else if (step === "directives") out.push(...bySequence(found));
    else out.push(...found);
  }
  return out;
}
