/**
 * `readVersion` (src/cli/version.ts): the package version, or `unknown` when
 * package.json cannot be read, is not JSON or has no string `version`. The odd
 * package.json files are written in code in a temporary folder removed afterwards.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readVersion } from "../../../src/cli/version.js";
import { REPO_ROOT } from "../../helpers/fixtures.js";

let folder = "";

beforeAll(() => {
  folder = mkdtempSync(join(tmpdir(), "mtl-cli-version-"));
});

afterAll(() => {
  if (folder !== "") rmSync(folder, { recursive: true, force: true });
});

function packageJson(name: string, text: string): URL {
  const path = join(folder, name);
  writeFileSync(path, text);
  return pathToFileURL(path);
}

describe("cli version", () => {
  it("reads the version of the package", () => {
    const expected = (JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf8")) as { version: string }).version;
    expect(readVersion()).toBe(expected);
  });

  it("reads a string version from the given file", () => {
    expect(readVersion(packageJson("good.json", '{"version": "1.2.3"}'))).toBe("1.2.3");
  });

  it("is unknown when the version is not a string", () => {
    expect(readVersion(packageJson("number.json", '{"version": 5}'))).toBe("unknown");
    expect(readVersion(packageJson("null.json", '{"version": null}'))).toBe("unknown");
  });

  it("is unknown when there is no version", () => {
    expect(readVersion(packageJson("none.json", '{"name": "x"}'))).toBe("unknown");
  });

  it("is unknown when the file is not JSON", () => {
    expect(readVersion(packageJson("bad.json", "{ not json"))).toBe("unknown");
  });

  it("is unknown when the file does not exist", () => {
    expect(readVersion(pathToFileURL(join(folder, "missing.json")))).toBe("unknown");
  });
});
