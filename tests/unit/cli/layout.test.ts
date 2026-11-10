/**
 * Layout of tests/fixtures/cli/: every directory belongs to a known group prefix. A
 * misspelled prefix (`exits-`, `lists-`) would be listed by no group test, so its
 * fixture would never be checked; `fixtureDirs` throws on such a directory and
 * these tests pin that.
 */
import { describe, expect, it } from "vitest";
import { fixtureDirs, KNOWN_PREFIXES, strayNames } from "../../helpers/fixtures.js";

const PREFIXES = KNOWN_PREFIXES.cli ?? [];

describe("cli fixtures: group prefixes", () => {
  it("declares the groups of this folder", () => {
    expect(PREFIXES).toEqual([
      "exit-",
      "list-",
      "large-",
      "verify-",
      "schema-",
      "format-",
      "wiring-",
      "usage-",
    ]);
  });

  it("every directory of the area starts with a known prefix", () => {
    // `fixtureDirs` throws when one does not: listing with the empty prefix reads them all.
    const all = fixtureDirs("cli", "");
    expect(all.length).toBeGreaterThan(30);
    expect(strayNames(all, PREFIXES)).toEqual([]);
  });

  it("strayNames finds a misspelled or unknown prefix", () => {
    expect(
      strayNames(["exit-pass-a", "exits-pass-b", "lists-fail-c", "other", "usage-x"], PREFIXES),
    ).toEqual(["exits-pass-b", "lists-fail-c", "other"]);
  });

  it("strayNames is empty when every name has a known prefix", () => {
    expect(strayNames(["exit-a", "schema-b"], PREFIXES)).toEqual([]);
  });
});
