/**
 * Generated pair names (docs/spec.md 6.3): file name of the template without its last
 * extension, unsafe characters replaced by `-`, `pair` when empty, `-2`, `-3` suffixes
 * for a taken name. Explicit names are read first. Fixture:
 * tests/fixtures/config/naming-generated-names/. No pass/fail split applies.
 */
import { describe, expect, it } from "vitest";
import { loadConfig } from "../../../src/config/load.js";
import { fixtureDirs, fixturePath } from "../../helpers/fixtures.js";

describe("generated pair names", () => {
  it("has one fixture directory", () => {
    expect(fixtureDirs("config", "naming-")).toEqual(["naming-generated-names"]);
  });

  it("applies the rules of spec 6.3, in config order, after the explicit names", async () => {
    const result = await loadConfig({
      cwd: fixturePath("config", "naming-generated-names"),
      home: "/home/test",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.pairs.map((pair) => pair.name)).toEqual([
      // taken by the LATER explicit name `adr.template`
      "adr.template-2",
      "adr.template",
      // `.md` has an empty stem
      "pair",
      "pair-2",
      // space and parentheses are outside [A-Za-z0-9_.-]; a backslash separates folders
      "my-note--v2-",
      "other.template",
      "other.template-2",
    ]);
  });
});
