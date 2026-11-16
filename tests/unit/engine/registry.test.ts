/** Rule registry (A9): loads the nine category files and checks the contract. */
import { describe, expect, it } from "vitest";
import { codeNumber, createRegistry, RULE_FILES, rulesOf, RegistryError } from "../../../src/engine/registry.js";
import { CATEGORIES, defineRule, type AnyRule, type Category } from "../../../src/engine/rule.js";

const stub = (code: `MTL${string}`, category: Category): AnyRule =>
  defineRule({
    code,
    name: "x",
    severity: "error",
    category,
    phase: "target",
    step: "content",
    check: () => [],
  });

const files = (overrides: Partial<Record<Category, readonly AnyRule[]>>) => ({
  ...Object.fromEntries(CATEGORIES.map((category) => [category, []])),
  ...overrides,
});

describe("rule registry", () => {
  it("loads one rule file per category, nine in total", () => {
    const registry = createRegistry();
    expect([...registry.byCategory.keys()]).toEqual([...CATEGORIES]);
    expect(Object.keys(RULE_FILES).sort()).toEqual([...CATEGORIES].sort());
    expect(registry.byCategory.get("syntax")?.map((rule) => rule.code)).toEqual([
      "MTL001",
      "MTL002",
      "MTL003",
      "MTL004",
      "MTL010",
      "MTL011",
      "MTL012",
      "MTL013",
      "MTL014",
      "MTL015",
      "MTL016",
      "MTL017",
      "MTL018",
      "MTL019",
      "MTL020",
      "MTL021",
      "MTL022",
      "MTL023",
      "MTL024",
      "MTL025",
      "MTL030",
      "MTL031",
    ]);
    expect(registry.byCode.get("MTL012")).toMatchObject({
      name: "malformed-tag",
      category: "syntax",
      severity: "warning",
      phase: "template",
    });
    // The first template-phase ERROR (spec 2.7, phase P7c).
    expect(registry.byCode.get("MTL017")).toMatchObject({
      name: "heading-pattern-duplicate",
      category: "syntax",
      severity: "error",
      phase: "template",
    });
    expect(rulesOf(registry, "parse").map((rule) => rule.code)).toEqual(["MTL001", "MTL002", "MTL003", "MTL004"]);
  });

  it("rejects a duplicate code, a wrong category, an out-of-range or bad code", () => {
    const make = (overrides: Partial<Record<Category, readonly AnyRule[]>>) => () => createRegistry(files(overrides) as Record<Category, readonly AnyRule[]>);
    expect(make({ format: [stub("MTL301", "format"), stub("MTL301", "format")] })).toThrow(/already used/);
    expect(make({ format: [stub("MTL301", "bounds")] })).toThrow(/does not match the file/);
    expect(make({ format: [stub("MTL401", "format")] })).toThrow(/outside the format range/);
    expect(make({ format: [stub("MTL30", "format")] })).toThrow(RegistryError);
  });

  it("requires a valid step for field and target rules, none for the others", () => {
    const make = (rule: unknown) => () => createRegistry(files({ format: [rule as AnyRule] }) as Record<Category, readonly AnyRule[]>);
    const base = { code: "MTL301", name: "x", severity: "error", category: "format" } as const;
    const check = () => [];
    expect(make({ ...base, phase: "field", step: "constant", check })).not.toThrow();
    expect(make({ ...base, phase: "field", check })).toThrow(/phase 'field' needs a step/);
    expect(make({ ...base, phase: "field", step: "headings", check })).toThrow(/needs a step/);
    expect(make({ ...base, phase: "target", step: "constant", check })).toThrow(/phase 'target' needs a step/);
    expect(make({ ...base, phase: "template", step: "constant", check })).toThrow(/takes no step/);
  });

  it("parses rule code numbers", () => {
    expect(codeNumber("MTL013")).toBe(13);
    expect(codeNumber("MTL1x3")).toBeNull();
    expect(codeNumber("XYZ013")).toBeNull();
  });
});
