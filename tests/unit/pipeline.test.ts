/**
 * Target pipeline (docs/spec.md 4.1, 8.4): field-major order sorted by step,
 * the single missing/empty guard, async checks, and the io handle of
 * `[io:exists]` (in-memory, no network). Each group: 1 passing case, failing
 * cases >= passing.
 */
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../src/engine/pipeline.js";
import { createRegistry, type RuleRegistry } from "../../src/engine/registry.js";
import {
  CATEGORIES,
  createEnv,
  createMemoryIo,
  defineRule,
  FIELD_STEPS,
  notImplemented,
  report,
  reportItem,
  reportSection,
  URL_PROBE_TIMEOUT_MS,
  type AnyRule,
  type Category,
  type FieldContext,
  type FieldStep,
  type TargetContext,
} from "../../src/engine/rule.js";
import type { Diagnostic, DocumentModel } from "../../src/engine/model.js";

function registry(files: Partial<Record<Category, readonly AnyRule[]>>): RuleRegistry {
  const all = Object.fromEntries(CATEGORIES.map((c) => [c, files[c] ?? []]));
  return createRegistry(all as Record<Category, readonly AnyRule[]>);
}

/** A field rule that reports `<step>:<key>` when the value is "bad" (or missing for presence). */
const fieldRule = (code: `MTL${string}`, category: Category, step: FieldStep) => {
  const rule = defineRule({
    code,
    name: step,
    severity: "error",
    category,
    phase: "field",
    step,
    check: (context: FieldContext): Diagnostic[] =>
      step === "presence" || context.value === "bad"
        ? [report(rule, `${step}:${context.key}`)]
        : [],
  });
  return rule;
};

/** A target rule that reports `<step>` when the target has a key named `bad`. */
const targetRule = (
  code: `MTL${string}`,
  category: Category,
  step: "filename" | "unknown-keys" | "headings" | "content",
) => {
  const rule = defineRule({
    code,
    name: step,
    severity: "error",
    category,
    phase: "target",
    step,
    check: (context: TargetContext): Diagnostic[] =>
      context.target.fields.has("bad") ? [report(rule, step)] : [],
  });
  return rule;
};

/** An async rule of the `io` step: probes the value as a path or a URL. */
const ioRule = defineRule({
  code: "MTL804",
  name: "path-missing",
  severity: "warning",
  category: "io",
  phase: "field",
  step: "io",
  check: async (context): Promise<Diagnostic[]> => {
    const value = String(context.value);
    if (value.startsWith("https://")) {
      const probe = await context.env.io.probeUrl(value, URL_PROBE_TIMEOUT_MS);
      return probe.reachable ? [] : [report(ioRule, `url ${value}: ${probe.reason}`)];
    }
    return (await context.env.io.exists(value)) ? [] : [report(ioRule, `missing ${value}`)];
  },
});

// Category order differs from step order on purpose: io (last category) runs before type.
const ordered = registry({
  filename: [targetRule("MTL101", "filename", "filename")],
  presence: [
    fieldRule("MTL201", "presence", "presence"),
    targetRule("MTL202", "presence", "unknown-keys"),
  ],
  format: [fieldRule("MTL301", "format", "constant")],
  type: [fieldRule("MTL501", "type", "type")],
  heading: [targetRule("MTL601", "heading", "headings")],
  content: [targetRule("MTL701", "content", "content")],
  io: [ioRule],
});

async function template(text: string): Promise<DocumentModel> {
  const status = await checkTemplate(ordered, text);
  if (status.status !== "ok") throw new Error("template broken");
  return status.model;
}

const TEMPLATE = "---\na: x\nb: x\nc: x\n---\n# T\n";
const env = createEnv({ io: createMemoryIo(["good", "bad"]) });
const messages = (list: Diagnostic[]) => list.map((d) => `${d.severity} ${d.message}`);

describe("target pipeline: field-major order and the empty-value guard", () => {
  it("passes: a clean target gives no diagnostic", async () => {
    const target = "---\na: good\nb: good\nc: good\n---\n";
    expect(await checkTarget(ordered, await template(TEMPLATE), target, "t.md", env)).toEqual([]);
  });

  it("fails: filename, then each field by step, then target steps; errors before warnings", async () => {
    const target = "---\na: bad\nb: bad\nc: bad\nbad: 1\n---\n";
    const result = await checkTarget(ordered, await template(TEMPLATE), target, "t.md", env);
    expect(messages(result)).toEqual([
      "error filename",
      "error constant:a",
      "error type:a",
      "error constant:b",
      "error type:b",
      "error constant:c",
      "error type:c",
      "error unknown-keys",
      "error headings",
      "error content",
    ]);
  });

  it("fails: a missing or empty value runs only the presence step (one guard)", async () => {
    const target = "---\na: bad\nc: ''\n---\n";
    const result = await checkTarget(ordered, await template(TEMPLATE), target, "t.md", env);
    expect(messages(result)).toEqual([
      "error constant:a",
      "error type:a",
      "error presence:b",
      "error presence:c",
    ]);
  });
});

describe("target pipeline: async io checks (in-memory io, no network)", () => {
  const io = createMemoryIo(["./docs/a.md"], new Map([["https://ok.test", { reachable: true }]]));
  const probe = createEnv({ io, pairRoot: "/pair" });
  const tpl = "---\np: x\n---\n";

  it("passes: an existing path and a reachable URL", async () => {
    const model = await template(tpl);
    expect(await checkTarget(ordered, model, "---\np: ./docs/a.md\n---\n", "t.md", probe)).toEqual(
      [],
    );
    expect(
      await checkTarget(ordered, model, "---\np: https://ok.test\n---\n", "t.md", probe),
    ).toEqual([]);
  });

  it("fails: a missing path is a warning, after the errors", async () => {
    const result = await checkTarget(
      ordered,
      await template(tpl),
      "---\np: ./no.md\n---\n",
      "t.md",
      probe,
    );
    expect(messages(result)).toEqual(["warning missing ./no.md"]);
  });

  it("fails: an unreachable URL carries the probe reason", async () => {
    const result = await checkTarget(
      ordered,
      await template(tpl),
      "---\np: https://down.test\n---\n",
      "t.md",
      probe,
    );
    expect(messages(result)).toEqual(["warning url https://down.test: not probed"]);
  });

  it("fails: a scaffold stub check throws when run", async () => {
    const stubbed = registry({
      format: [
        defineRule({
          code: "MTL301",
          name: "constant-mismatch",
          severity: "error",
          category: "format",
          phase: "field",
          step: "constant",
          check: notImplemented("MTL301"),
        }),
      ],
    });
    const model = await template(tpl);
    await expect(checkTarget(stubbed, model, "---\np: v\n---\n", "t.md", env)).rejects.toThrow(
      "not implemented: MTL301",
    );
  });
});

describe("target pipeline: io step lists findings in item order across rules", () => {
  /** An io rule reporting the given item indexes of the value (one finding per index). */
  const itemRule = (code: `MTL${string}`, indexes: readonly number[]) => {
    const rule = defineRule({
      code,
      name: `items-${code}`,
      severity: "warning",
      category: "io",
      phase: "field",
      step: "io",
      check: (context: FieldContext): Diagnostic[] =>
        indexes.map((index) => reportItem(rule, `${code}:${context.key}:${index}`, index)),
    });
    return rule;
  };
  const itemRegistry = registry({
    // Registry order MTL801 then MTL802; item order interleaves them.
    io: [itemRule("MTL801", [0, 2]), itemRule("MTL802", [1, 3])],
  });
  const tpl = "---\np: x\nq: x\n---\n";
  const target = "---\np: a\nq: b\n---\n";

  it("an io step without finding leaves the result empty", async () => {
    const empty = registry({ io: [] });
    const model = await template(tpl);
    expect(await checkTarget(empty, model, target, "t.md", env)).toEqual([]);
  });

  it("sorts the io findings of one field by item index and keeps fields in template order", async () => {
    const status = await checkTemplate(itemRegistry, tpl);
    if (status.status !== "ok") throw new Error("template broken");
    const result = await checkTarget(itemRegistry, status.model, target, "t.md", env);
    expect(result.map((d) => d.message)).toEqual([
      "MTL801:p:0",
      "MTL802:p:1",
      "MTL801:p:2",
      "MTL802:p:3",
      "MTL801:q:0",
      "MTL802:q:1",
      "MTL801:q:2",
      "MTL802:q:3",
    ]);
  });

  it("never lets the item index reach the diagnostic seen by reporters", async () => {
    const status = await checkTemplate(itemRegistry, tpl);
    if (status.status !== "ok") throw new Error("template broken");
    const result = await checkTarget(itemRegistry, status.model, target, "t.md", env);
    for (const diagnostic of result) {
      expect(Object.keys(diagnostic).sort()).toEqual(["code", "message", "position", "severity"]);
    }
  });
});

describe("target pipeline: env is a required argument", () => {
  it("fails: checkTarget without env does not compile (no silent in-memory io)", async () => {
    const empty = registry({});
    const model = await template("---\np: x\n---\n");
    // @ts-expect-error the env parameter has no default
    const result = await checkTarget(empty, model, "---\np: v\n---\n", "t.md");
    expect(result).toEqual([]);
  });
});

/** The 10 present-value steps of docs/spec.md 4.1 step 3, spelled out (not read from FIELD_STEPS). */
const SPEC_STEP_ORDER = [
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
] as const;

describe("target pipeline: per-field steps run in spec 4.1 order", () => {
  // One rule per step, registered in REVERSE spec order inside one category file.
  const allSteps: readonly FieldStep[] = ["presence", ...SPEC_STEP_ORDER];
  const reversed = [...allSteps].reverse().map((step, index) => {
    const code = `MTL${390 - index}` as const;
    const rule = defineRule({
      code,
      name: step,
      severity: "error",
      category: "format",
      phase: "field",
      step,
      check: (context: FieldContext): Diagnostic[] =>
        step === "presence" || context.value === "bad" ? [report(rule, step)] : [],
    });
    return rule;
  });
  const stepRegistry = registry({ format: reversed });

  it("passes: a clean value triggers no step", async () => {
    const model = await template("---\np: x\n---\n");
    expect(await checkTarget(stepRegistry, model, "---\np: ok\n---\n", "t.md", env)).toEqual([]);
  });

  it("fails: every step of a present value fires in spec order, not registry order", async () => {
    const model = await template("---\np: x\n---\n");
    const result = await checkTarget(stepRegistry, model, "---\np: bad\n---\n", "t.md", env);
    expect(result.map((d) => d.message)).toEqual([...SPEC_STEP_ORDER]);
  });

  it("fails: a missing value fires the presence step alone", async () => {
    const model = await template("---\np: x\n---\n");
    const result = await checkTarget(stepRegistry, model, "---\nq: 1\n---\n", "t.md", env);
    expect(result.map((d) => d.message)).toEqual(["presence"]);
  });

  it("fails: FIELD_STEPS itself is presence, then the spec order", () => {
    expect([...FIELD_STEPS]).toEqual(["presence", ...SPEC_STEP_ORDER]);
  });
});

describe("target pipeline: headings step lists presence findings in template heading order", () => {
  const real = createRegistry();
  const lines = (...text: string[]) => text.join("\n");
  const findings = async (templateText: string, targetText: string) => {
    const status = await checkTemplate(real, templateText);
    if (status.status !== "ok") throw new Error("template broken");
    const found = await checkTarget(real, status.model, targetText, "t.md", env);
    return found.filter((d) => d.code.startsWith("MTL60"));
  };
  const templateText = lines(
    "---",
    "a: x",
    "---",
    "## Alpha",
    "## Beta [presence:exist]",
    "## Draft notes [presence:template-only]",
    "## Omega",
  );

  it("passes: a target that satisfies every heading has no finding", async () => {
    const target = lines("---", "a: x", "---", "# Top", "## Alpha", "## Omega");
    expect(await findings(templateText, target)).toEqual([]);
  });

  it("fails: MTL601, MTL602, MTL603 interleave by template heading, not by rule", async () => {
    // Alpha missing (601), no H2 at all for Beta (602), Draft notes present (603), Omega missing (601).
    const target = lines("---", "a: x", "---", "# Draft notes");
    const found = await findings(templateText, target);
    expect(found.map((d) => `${d.code} ${d.message}`)).toEqual([
      "MTL601 Heading: Missing required heading: 'Alpha'",
      "MTL602 Heading: Missing heading at level H2 [presence:exist]",
      "MTL603 Heading: Heading 'Draft notes' is marked [presence:template-only] and must not appear in the linted file",
      "MTL601 Heading: Missing required heading: 'Omega'",
    ]);
  });

  it("fails: the template line anchor is cleared, and the order finding comes last", async () => {
    const target = lines("---", "a: x", "---", "## Omega", "## Alpha", "## Draft notes");
    const found = await findings(templateText, target);
    expect(found.map((d) => d.code)).toEqual(["MTL603", "MTL604"]);
    expect(found.map((d) => d.position)).toEqual([null, null]);
  });

  it("fails: presence findings carry the template heading text, the order finding none", async () => {
    const target = lines("---", "a: x", "---", "## Omega", "## Alpha", "## Draft notes");
    const found = await findings(templateText, target);
    expect(found.map((d) => [d.code, d.heading])).toEqual([
      ["MTL603", "Draft notes"],
      ["MTL604", undefined],
    ]);
    expect("heading" in (found[1] ?? {})).toBe(false);
  });
});

describe("target pipeline: content step lists findings in template section order", () => {
  const real = createRegistry();
  const lines = (...text: string[]) => text.join("\n");
  const findings = async (templateText: string, targetText: string) => {
    const status = await checkTemplate(real, templateText);
    if (status.status !== "ok") throw new Error("template broken");
    const found = await checkTarget(real, status.model, targetText, "t.md", env);
    return found.filter((d) => d.code.startsWith("MTL70"));
  };

  it("passes: a target whose sections satisfy every content tag has no finding", async () => {
    const templateText = lines(
      "---",
      "a: x",
      "---",
      "## A [content:table]",
      "## B [content:non-empty]",
    );
    const target = lines("---", "a: x", "---", "## A", "| x |", "## B", "text");
    expect(await findings(templateText, target)).toEqual([]);
  });

  it("fails: section A (MTL702) comes before section B (MTL701), not grouped by rule", async () => {
    const templateText = lines(
      "---",
      "a: x",
      "---",
      "## A [content:table]",
      "## B [content:non-empty]",
    );
    const target = lines("---", "a: x", "---", "## A", "## B");
    const found = await findings(templateText, target);
    expect(found.map((d) => `${d.code} ${d.message}`)).toEqual([
      "MTL702 Section 'A': [content:table] no markdown table row found",
      "MTL701 Section 'B': [content:non-empty] section body is empty",
    ]);
  });

  it("fails: one section keeps registry order (MTL701 to MTL705), sections stay in template order", async () => {
    const templateText = lines(
      "---",
      "a: x",
      "---",
      "## A [content:non-empty] [content:list] [content:min-lines:2]",
      "## B [content:table] [content:max-lines:0]",
    );
    const target = lines("---", "a: x", "---", "## A", "## B", "text");
    const found = await findings(templateText, target);
    expect(found.map((d) => `${d.code} ${d.message.split(":")[0]}`)).toEqual([
      "MTL701 Section 'A'",
      "MTL703 Section 'A'",
      "MTL704 Section 'A'",
      "MTL702 Section 'B'",
      "MTL705 Section 'B'",
    ]);
  });

  it("never lets the section index reach the diagnostic seen by reporters", async () => {
    const templateText = lines(
      "---",
      "a: x",
      "---",
      "## A [content:table]",
      "## B [content:non-empty]",
    );
    const found = await findings(templateText, lines("---", "a: x", "---", "## A", "## B"));
    expect(found).toHaveLength(2);
    // The index is not a key; the only addition is the `heading` of the section (spec 8.1).
    for (const diagnostic of found) {
      expect(Object.keys(diagnostic).sort()).toEqual([
        "code",
        "heading",
        "message",
        "position",
        "severity",
      ]);
    }
    expect(found.map((diagnostic) => diagnostic.heading)).toEqual(["A", "B"]);
  });
});

describe("target pipeline: heading of a content finding comes only from a recorded section index", () => {
  const lines = (...text: string[]) => text.join("\n");
  // Two content-step rules: one tags its finding with section 1 (`reportSection`), the other
  // reports through plain `report` and so records no section index at all.
  const tagged = defineRule({
    code: "MTL701",
    name: "tagged",
    severity: "error",
    category: "content",
    phase: "target",
    step: "content",
    check: (): Diagnostic[] => [reportSection(tagged, "tagged finding", 1)],
  });
  const untagged = defineRule({
    code: "MTL702",
    name: "untagged",
    severity: "error",
    category: "content",
    phase: "target",
    step: "content",
    check: (): Diagnostic[] => [report(untagged, "untagged finding")],
  });
  const run = async (rules: readonly AnyRule[]) => {
    const custom = registry({ content: rules });
    const model = await template(lines("---", "a: x", "---", "## First", "## Second"));
    return checkTarget(custom, model, lines("---", "a: x", "---"), "t.md", env);
  };

  it("passes: a finding tagged with section 1 names the second heading", async () => {
    const found = await run([tagged]);
    expect(found.map((d) => [d.message, d.heading])).toEqual([["tagged finding", "Second"]]);
  });

  it("fails: a finding without a recorded section index gets no heading (not section 0)", async () => {
    const found = await run([untagged]);
    expect(found).toHaveLength(1);
    expect(found[0]?.heading).toBeUndefined();
    expect("heading" in (found[0] ?? {})).toBe(false);
  });

  it("fails: a tagged and an untagged finding together: only the tagged one is named", async () => {
    const found = await run([untagged, tagged]);
    expect(found.map((d) => [d.message, d.heading])).toEqual([
      ["untagged finding", undefined],
      ["tagged finding", "Second"],
    ]);
  });

  it("fails: a section index beyond the template sections names nothing", async () => {
    const far = defineRule({
      code: "MTL703",
      name: "far",
      severity: "error",
      category: "content",
      phase: "target",
      step: "content",
      check: (): Diagnostic[] => [reportSection(far, "far finding", 9)],
    });
    const found = await run([far]);
    expect(found.map((d) => d.heading)).toEqual([undefined]);
  });
});

describe("template warnings: sorted by source position across rules", () => {
  const real = createRegistry();
  const lines = (...text: string[]) => text.join("\n");
  const warnings = async (text: string) => {
    const status = await checkTemplate(real, text);
    if (status.status !== "ok") throw new Error("template broken");
    return status.warnings.map((d) => `${d.code}@${d.position?.line}:${d.position?.column}`);
  };

  it("passes: a clean template has no warning", async () => {
    expect(await warnings(lines("---", "a: x # [presence:required]", "---", "## H"))).toEqual([]);
  });

  it("fails: a later rule code on an earlier line comes first", async () => {
    const text = lines("---", "n: x # [count:min:abc]", "---", "## Notes [nope:y]");
    expect(await warnings(text)).toEqual(["MTL012@2:19", "MTL011@4:10"]);
  });

  it("fails: on one line the earlier column comes first", async () => {
    const text = lines("---", "n: x # [count:min:abc] [nope:y]", "---");
    expect(await warnings(text)).toEqual(["MTL012@2:19", "MTL010@2:24"]);
  });
});
