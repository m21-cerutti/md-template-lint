/**
 * Where the field format shape tags bind (docs/spec.md 2.1, 2.9): a comment binds to a
 * TOP-LEVEL key only, so a shape tag on an indented sub-key or on a list item is inert (no
 * effect, no warning, even a bad shape); a scalar shape tag on a top-level key whose target
 * value is a list or a mapping is skipped (the type rule reports the shape).
 */
import { describe, expect, it } from "vitest";
import { checkTemplate, lintTarget } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();

async function lint(template: string, target: string) {
  const status = await checkTemplate(registry, template);
  if (status.status !== "ok") throw new Error("template is broken");
  const result = await lintTarget(registry, status.model, target, "target.md", createEnv());
  return {
    warnings: status.warnings.map((warning) => warning.code),
    codes: result.diagnostics.map((diagnostic) => diagnostic.code),
  };
}

describe("shape tags on an indented sub-key or a list item bind to nothing (spec 2.1)", () => {
  const template = ["---", "meta:", '  version: "1.0.0" # [format:semver]', '  released: "2026-01-01" # [format:date]', "supported:", '  - "1.0.0" # [format:elements:semver]', "---", ""].join("\n");

  it("gives no effect: bad values under the commented sub-key and item pass", async () => {
    const target = ["---", "meta:", "  version: v1", "  released: soon", "supported:", "  - v1", "---", ""].join("\n");
    expect(await lint(template, target)).toEqual({ warnings: [], codes: [] });
  });

  it("gives no malformed-tag warning for a bad shape on a sub-key or a list item", async () => {
    const bad = ["---", "meta:", "  version: x # [format:dates]", "supported:", "  - x # [format:elements:semvers]", "---", ""].join("\n");
    expect(await lint(bad, "---\nmeta:\n  version: x\nsupported:\n  - x\n---\n")).toEqual({
      warnings: [],
      codes: [],
    });
  });
});

describe("a shape tag on a top-level key follows the target value shape (spec 2.9)", () => {
  const template = ["---", 'version: "1.0.0" # [format:semver]', 'due: "string" # [format:date]', 'supported: ["1.0.0"] # [format:elements:semver]', 'milestones: ["2026-01-01"] # [format:elements:date]', "---", ""].join("\n");

  it("skips the scalar tags on a list value: only the type rule reports (MTL501)", async () => {
    const target = "---\nversion: [v1]\ndue: [soon]\nsupported: [1.0.0]\nmilestones: [2026-01-01]\n---\n";
    expect((await lint(template, target)).codes).toEqual(["MTL501", "MTL501"]);
  });

  it("skips the scalar tags on a mapping value: only the type rule reports (MTL501)", async () => {
    const target = "---\nversion:\n  a: v1\ndue:\n  a: soon\nsupported: [1.0.0]\nmilestones: [2026-01-01]\n---\n";
    expect((await lint(template, target)).codes).toEqual(["MTL501", "MTL501"]);
  });

  it("skips the elements tags on a scalar value: only the type rule reports (MTL502, MTL513)", async () => {
    const target = "---\nversion: 1.0.0\ndue: 2026-01-01\nsupported: v1\nmilestones: soon\n---\n";
    expect((await lint(template, target)).codes).toEqual(["MTL502", "MTL513"]);
  });
});
