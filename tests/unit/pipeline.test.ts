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
  notImplemented,
  report,
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
    await expect(checkTarget(stubbed, model, "---\np: v\n---\n", "t.md")).rejects.toThrow(
      "not implemented: MTL301",
    );
  });
});
