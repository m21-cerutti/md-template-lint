/**
 * Shared helpers of the config, runner and reporter tests: fixture paths and the
 * pass/fail split check (at least 1 `pass-` case, at least 1 `fail-` case,
 * one fixture directory per case, no orphan directory of the group).
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect } from "vitest";

export const REPO_ROOT = fileURLToPath(new URL("../../", import.meta.url));

/**
 * The tsx CLI (devDependency, ADR 0007). Tests that spawn a script run it as
 * `process.execPath TSX_CLI <script>`: no shell, no `.cmd` shim, same on Windows and POSIX.
 */
export const TSX_CLI = join(REPO_ROOT, "node_modules", "tsx", "dist", "cli.mjs");

export type FixtureArea = "config" | "runner" | "cli" | "tags" | "directives" | "suppression";

/** Absolute directory of fixture `name` under `tests/fixtures/<area>/`. */
export const fixturePath = (area: FixtureArea, name: string): string =>
  join(REPO_ROOT, "tests", "fixtures", area, name);

export const readFixture = (area: FixtureArea, name: string, file: string): string =>
  readFileSync(join(fixturePath(area, name), file), "utf8");

/**
 * Group prefixes of the areas that declare them. A directory of such an area that starts
 * with none of them is a stray (a misspelled prefix would otherwise be listed by no group
 * and never noticed). `config` and `runner` keep their open list.
 */
export const KNOWN_PREFIXES: Partial<Record<FixtureArea, readonly string[]>> = {
  cli: [
    "exit-",
    "list-",
    "large-",
    "verify-",
    "schema-",
    "format-",
    "wiring-",
    "usage-",
    "suppress-",
    "template-",
  ],
};

/** The names that start with none of `prefixes`, sorted. */
export function strayNames(names: readonly string[], prefixes: readonly string[]): string[] {
  return names.filter((name) => !prefixes.some((prefix) => name.startsWith(prefix))).sort();
}

/**
 * Names of the fixture directories of `area` that start with `prefix`, sorted. Throws when
 * the area declares its prefixes and holds a directory with an unknown one.
 */
export function fixtureDirs(area: FixtureArea, prefix: string): string[] {
  const names = readdirSync(join(REPO_ROOT, "tests", "fixtures", area), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  const known = KNOWN_PREFIXES[area];
  const stray = known === undefined ? [] : strayNames(names, known);
  if (stray.length > 0) {
    throw new Error(
      `fixtures/${area}: directory with an unknown group prefix: ${stray.join(", ")}`,
    );
  }
  return names.filter((name) => name.startsWith(prefix)).sort();
}

/**
 * The split rule of the project tests, for a group of fixtures named
 * `<prefix><case name>` where each case name starts with `pass-` or `fail-`.
 */
export function expectSplit(
  area: FixtureArea,
  prefix: string,
  cases: readonly { readonly name: string }[],
): void {
  expectNameSplit(cases);
  expect(fixtureDirs(area, prefix)).toEqual(
    cases.map((testCase) => `${prefix}${testCase.name}`).sort(),
  );
}

/** The split rule on the case names alone, for a group whose cases need no fixture directory each. */
export function expectNameSplit(cases: readonly { readonly name: string }[]): void {
  const passing = cases.filter((testCase) => testCase.name.startsWith("pass-"));
  const failing = cases.filter((testCase) => testCase.name.startsWith("fail-"));
  expect(passing.length).toBeGreaterThanOrEqual(1);
  expect(failing.length).toBeGreaterThanOrEqual(1);
  expect(passing.length + failing.length).toBe(cases.length);
}
