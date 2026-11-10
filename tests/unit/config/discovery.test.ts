/**
 * Config discovery (docs/spec.md 6.1): `--config <path>`, else the working directory
 * then each parent. Fixtures: tests/fixtures/config/discover-<case>/. No pass/fail
 * split applies (each case is a different way to find, or not find, the file).
 */
import { describe, expect, it } from "vitest";
import { loadConfig } from "../../../src/config/load.js";
import { foldPath } from "../../../src/config/paths.js";
import { fixtureDirs, fixturePath } from "../../helpers/fixtures.js";

const GROUP = "discover-";
const HOME = "/home/test";

const dir = (name: string): string => foldPath(fixturePath("config", `${GROUP}${name}`));

const CASE_NAMES = [
  "explicit-config-path",
  "fail-missing-config-file",
  "nearest-wins",
  "nested-finds-parent-config",
  "none-found",
] as const;

describe("config discovery", () => {
  it("has one fixture directory per case", () => {
    expect(fixtureDirs("config", GROUP)).toEqual(CASE_NAMES.map((name) => `${GROUP}${name}`));
  });

  it("nested-finds-parent-config: walks up from a sub folder to the config", async () => {
    const root = dir("nested-finds-parent-config");
    const result = await loadConfig({ cwd: `${root}/docs/deep`, home: HOME });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.file).toBe(`${root}/md-template-lint.yml`);
    expect(result.config.dir).toBe(root);
    // The config directory, not the working directory, is the implicit root `project`.
    expect(result.config.pairs[0]?.templatePath).toBe(`${root}/a.md`);
  });

  it("a minimal config gets the documented defaults (spec 6.3)", async () => {
    const root = dir("nested-finds-parent-config");
    const result = await loadConfig({ cwd: root, home: HOME });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { config } = result;
    // Private ranges are an explicit opt-in: off by default (AS8).
    expect(config.allowPrivateNetworks).toBe(false);
    expect(config.version).toBe(1);
    expect(config.onEmpty).toBe("warn");
    expect(config.approvedPaths).toEqual([]);
    expect(config.aliases.size).toBe(0);
    expect(config.roots.size).toBe(0);
    expect(config.pairs[0]).toMatchObject({
      name: "parent",
      templateRoot: "project",
      roots: ["project"],
      include: ["*.md"],
      exclude: [],
      description: null,
      onEmpty: "warn",
    });
  });

  it("fails: a config above the boundary is not found (MTL901)", async () => {
    const root = dir("nested-finds-parent-config");
    const result = await loadConfig({
      cwd: `${root}/docs/deep`,
      boundary: `${root}/docs`,
      home: HOME,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.map((error) => error.code)).toEqual(["MTL901"]);
  });

  it("fails: --config naming a missing file in an existing folder is MTL901", async () => {
    const root = dir("fail-missing-config-file");
    const result = await loadConfig({ cwd: root, configPath: "md-template-lint.yml", home: HOME });
    expect(result).toMatchObject({
      ok: false,
      display: "md-template-lint.yml",
      errors: [{ code: "MTL901", message: "config file not found: md-template-lint.yml" }],
    });
  });

  it("fails: --config naming a directory is MTL901, not a read error", async () => {
    const root = dir("nested-finds-parent-config");
    const result = await loadConfig({ cwd: root, configPath: "docs", home: HOME });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.map((error) => error.code)).toEqual(["MTL901"]);
  });

  it("nearest-wins: the first match going up is used", async () => {
    const root = dir("nearest-wins");
    const inner = await loadConfig({ cwd: `${root}/sub`, home: HOME });
    const outer = await loadConfig({ cwd: root, home: HOME });
    expect(inner.ok && inner.config.pairs[0]?.name).toBe("inner");
    expect(outer.ok && outer.config.pairs[0]?.name).toBe("outer");
  });

  it("explicit-config-path: --config wins over discovery and is relative to the working directory", async () => {
    const root = dir("explicit-config-path");
    const result = await loadConfig({ cwd: root, configPath: "custom/other.yml", home: HOME });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.pairs[0]?.name).toBe("from-explicit");
    expect(result.config.display).toBe("custom/other.yml");
    expect(result.config.dir).toBe(`${root}/custom`);
  });

  it("explicit-config-path: an absolute --config with backslashes is read as slashes (D04)", async () => {
    const root = dir("explicit-config-path");
    const result = await loadConfig({
      cwd: `${root}/custom`,
      configPath: `${root}/custom/other.yml`.replaceAll("/", "\\"),
      home: HOME,
    });
    expect(result.ok && result.config.display).toBe("other.yml");
  });

  it("fails: --config naming a missing file is MTL901 with the path", async () => {
    const root = dir("explicit-config-path");
    const result = await loadConfig({ cwd: root, configPath: "custom/missing.yml", home: HOME });
    expect(result).toMatchObject({
      ok: false,
      display: "custom/missing.yml",
      errors: [
        { code: "MTL901", severity: "error", message: "config file not found: custom/missing.yml" },
      ],
    });
  });

  it("fails: no config from the working directory upward is MTL901", async () => {
    const root = dir("none-found");
    const result = await loadConfig({ cwd: root, boundary: root, home: HOME });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.display).toBeNull();
    expect(result.errors).toEqual([
      {
        code: "MTL901",
        severity: "error",
        message: `no md-template-lint.yml found from ${root} upward`,
      },
    ]);
  });
});
