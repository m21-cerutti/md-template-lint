/**
 * The pure helpers of scripts/smoke-pack.ts and scripts/smoke/check-release.ts
 * (scripts/smoke/helpers.ts), plus check-release.ts as a process. No network, no pnpm.
 * Manifests, repository blocks and tarball listings are fixtures in
 * tests/fixtures/release/<group>/<case>.(json|txt); the other groups have tiny inline values
 * (no multi-line documents).
 *
 * Every table group has at least one `pass-` case and one `fail-` case. The
 * fixture groups also assert that their folder holds exactly the listed files (no orphan).
 */
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BIN_NAMES,
  binShimPath,
  checkBinNames,
  checkRelease,
  checkRepositoryUrl,
  checkRun,
  checkTag,
  checkTarballEntries,
  commandInvocation,
  findTarball,
  installedBinPath,
  needsShell,
  parseArgs,
  pnpmInvocation,
  projectLintExpectation,
  quoteForCmd,
  readPackageFields,
  singleDependency,
  spawnPlan,
  tarballEntries,
  unknownOptionExpectation,
  versionExpectation,
} from "../../../scripts/smoke/helpers.ts";
import { runCli } from "../../../src/cli/run.js";
import { foldPath } from "../../../src/config/paths.js";
import { expectNameSplit, REPO_ROOT, TSX_CLI } from "../../helpers/fixtures.js";

const FIXTURES = join(REPO_ROOT, "tests", "fixtures", "release");

function readText(group: string, name: string, extension: "json" | "txt"): string {
  return readFileSync(join(FIXTURES, group, `${name}.${extension}`), "utf8");
}

const readCase = (group: string, name: string): unknown => JSON.parse(readText(group, name, "json")) as unknown;

function expectFolder(group: string, cases: readonly { readonly name: string }[], extension: "json" | "txt" = "json"): void {
  expect(readdirSync(join(FIXTURES, group)).sort()).toEqual(cases.map((testCase) => `${testCase.name}.${extension}`).sort());
}

describe("smoke-pack: parseArgs", () => {
  const cases = [
    {
      name: "pass-tarball-and-offline",
      argv: ["--tarball", "out/x.tgz", "--offline"],
      expected: { tarball: "out/x.tgz", offline: true },
      error: undefined,
    },
    {
      name: "fail-unknown-argument",
      argv: ["--bogus"],
      expected: undefined,
      error: "unknown argument: --bogus",
    },
    {
      name: "fail-tarball-without-value",
      argv: ["--tarball"],
      expected: undefined,
      error: "--tarball needs a file path",
    },
    {
      name: "fail-tarball-followed-by-flag",
      argv: ["--tarball", "--offline"],
      expected: undefined,
      error: "--tarball needs a file path",
    },
  ];

  it("has at least one pass case and one fail case", () => {
    expectNameSplit(cases);
  });

  for (const testCase of cases) {
    it(testCase.name, () => {
      if (testCase.error === undefined) {
        expect(parseArgs(testCase.argv)).toEqual(testCase.expected);
      } else {
        expect(() => parseArgs(testCase.argv)).toThrow(testCase.error);
      }
    });
  }

  it("no argument means pack and a normal (online) install", () => {
    expect(parseArgs([])).toEqual({ tarball: undefined, offline: false });
  });

  it("a bare separator that pnpm may pass through is ignored", () => {
    expect(parseArgs(["--", "--offline"])).toEqual({ tarball: undefined, offline: true });
  });
});

describe("smoke-pack: pnpmInvocation", () => {
  const node = "/usr/bin/node";

  it.each(["/x/pnpm.cjs", "/x/pnpm.mjs", "/x/pnpm.js", "C:\\x\\PNPM.JS"])("starts the script %s with Node, never through a shell", (execPath) => {
    for (const platform of ["linux", "win32"]) {
      expect(pnpmInvocation({ npm_execpath: execPath }, platform, node)).toEqual({
        command: node,
        prefixArgs: [execPath],
        shell: false,
      });
    }
  });

  it("starts a native pnpm executable directly, without a shell", () => {
    expect(pnpmInvocation({ npm_execpath: "/x/pnpm" }, "linux", node)).toEqual({
      command: "/x/pnpm",
      prefixArgs: [],
      shell: false,
    });
    expect(pnpmInvocation({ npm_execpath: "C:\\x\\pnpm.exe" }, "win32", node).shell).toBe(false);
  });

  it.each(["C:\\x\\pnpm.cmd", "C:\\x\\pnpm.bat", "C:\\x\\PNPM.CMD", "C:\\x\\pnpm.BAT"])("starts the Windows shim %s through a shell", (execPath) => {
    expect(pnpmInvocation({ npm_execpath: execPath }, "win32", node)).toEqual({
      command: execPath,
      prefixArgs: [],
      shell: true,
    });
  });

  it.each(["linux", "darwin"])("never uses a shell for a .cmd path on %s", (platform) => {
    expect(pnpmInvocation({ npm_execpath: "/x/pnpm.cmd" }, platform, node).shell).toBe(false);
  });

  it("falls back to the bare name pnpm, through a shell only on Windows", () => {
    expect(pnpmInvocation({}, "win32", node)).toEqual({
      command: "pnpm",
      prefixArgs: [],
      shell: true,
    });
    expect(pnpmInvocation({ npm_execpath: "" }, "linux", node)).toEqual({
      command: "pnpm",
      prefixArgs: [],
      shell: false,
    });
  });
});

describe("smoke-pack: needsShell and commandInvocation", () => {
  it("only a .cmd or .bat file on Windows needs a shell, whatever its case", () => {
    expect(needsShell("a\\b.cmd", "win32")).toBe(true);
    expect(needsShell("a\\b.Bat", "win32")).toBe(true);
    expect(needsShell("a\\b.exe", "win32")).toBe(false);
    expect(needsShell("a/b", "win32")).toBe(false);
    expect(needsShell("a/b.cmd", "linux")).toBe(false);
  });

  it("starts the file as given", () => {
    expect(commandInvocation("C:\\w\\mdtl.cmd", "win32")).toEqual({
      command: "C:\\w\\mdtl.cmd",
      prefixArgs: [],
      shell: true,
    });
    expect(commandInvocation("/w/mdtl", "linux").shell).toBe(false);
  });
});

describe("smoke-pack: quoteForCmd and spawnPlan", () => {
  it("quotes an argument; shell metacharacters stay literal inside the quotes", () => {
    expect(quoteForCmd("plain")).toBe('"plain"');
    expect(quoteForCmd("C:\\Program Files\\x y")).toBe('"C:\\Program Files\\x y"');
    expect(quoteForCmd("a&b|c<d>e^f(g)")).toBe('"a&b|c<d>e^f(g)"');
    expect(quoteForCmd("")).toBe('""');
  });

  it("doubles a trailing backslash so it cannot escape the closing quote", () => {
    expect(quoteForCmd("C:\\dir\\")).toBe('"C:\\dir\\\\"');
    expect(quoteForCmd("a\\b")).toBe('"a\\b"');
  });

  it.each(['a"b', "100%", "a!b", "a\nb", "a\rb", "a\0b"])("refuses the argument %j, which cmd.exe cannot be given literally", (arg) => {
    expect(() => quoteForCmd(arg)).toThrow("cannot be passed safely");
  });

  it("passes the arguments through untouched without a shell", () => {
    const plan = spawnPlan({ command: "node", prefixArgs: ["pnpm.cjs"], shell: false }, ["add", "a b"]);
    expect(plan).toEqual({ command: "node", args: ["pnpm.cjs", "add", "a b"], shell: false });
  });

  it("builds one quoted command line with a shell, and no separate argument", () => {
    const plan = spawnPlan({ command: "C:\\x y\\pnpm.cmd", prefixArgs: [], shell: true }, ["add", "C:\\tmp dir\\p.tgz"]);
    expect(plan).toEqual({
      command: '"C:\\x y\\pnpm.cmd" "add" "C:\\tmp dir\\p.tgz"',
      args: [],
      shell: true,
    });
  });

  it("refuses an unsafe argument instead of passing it to a shell", () => {
    expect(() => spawnPlan({ command: "pnpm", prefixArgs: [], shell: true }, ["add", "a&b%PATH%"])).toThrow("cannot be passed safely");
  });
});

describe("smoke-pack: findTarball", () => {
  const cases = [
    { name: "pass-one-tarball", names: ["md-template-lint-1.2.3.tgz"], error: undefined },
    { name: "fail-no-tarball", names: ["notes.txt"], error: "found 0" },
    { name: "fail-two-tarballs", names: ["a-1.tgz", "a-2.tgz"], error: "found 2" },
  ];

  it("has at least one pass case and one fail case", () => {
    expectNameSplit(cases);
  });

  for (const testCase of cases) {
    it(testCase.name, () => {
      if (testCase.error === undefined) {
        expect(findTarball(testCase.names)).toBe("md-template-lint-1.2.3.tgz");
      } else {
        expect(() => findTarball(testCase.names)).toThrow(testCase.error);
      }
    });
  }
});

describe("smoke-pack: readPackageFields (fixtures/release/manifest)", () => {
  const cases = [
    {
      name: "pass-bin-record",
      expected: { name: "md-template-lint", version: "1.2.3", bin: "dist/cli.js" },
      error: undefined,
    },
    {
      name: "fail-version-not-semver",
      expected: undefined,
      error: "version is not semver: 1.2",
    },
    {
      name: "fail-version-four-parts",
      expected: undefined,
      error: "version is not semver: 1.2.3.4",
    },
    {
      name: "fail-version-v-prefix",
      expected: undefined,
      error: "version is not semver: v1.2.3",
    },
    {
      name: "fail-version-not-string",
      expected: undefined,
      error: "version is not semver: 123",
    },
    {
      name: "fail-bin-entry-missing",
      expected: undefined,
      error: "no bin entry named md-template-lint",
    },
    {
      name: "fail-bin-entry-empty",
      expected: undefined,
      error: "no bin entry named md-template-lint",
    },
    { name: "fail-name-missing", expected: undefined, error: "name is missing" },
    { name: "fail-name-empty", expected: undefined, error: "name is missing" },
    { name: "fail-name-not-string", expected: undefined, error: "name is missing" },
  ];

  it("has at least one pass case and one fail case, one fixture each", () => {
    expectNameSplit(cases);
    expectFolder("manifest", cases);
  });

  for (const testCase of cases) {
    it(testCase.name, () => {
      const manifest = readCase("manifest", testCase.name);
      if (testCase.error === undefined) {
        expect(readPackageFields(manifest, "md-template-lint")).toEqual(testCase.expected);
      } else {
        expect(() => readPackageFields(manifest, "md-template-lint")).toThrow(testCase.error);
      }
    });
  }

  it.each(["1.2.3", "0.0.0", "1.2.3-rc.1", "1.2.3+b5", "1.2.3-rc.1+b5"])("accepts the semver version %s", (version) => {
    const fields = readPackageFields({ name: "p", version, bin: { x: "y.js" } }, "x");
    expect(fields.version).toBe(version);
  });

  it("strips a leading ./ from a string bin and reads it as the only executable", () => {
    const fields = readPackageFields({ name: "p", version: "0.0.1", bin: "./bin/run.js" }, "any");
    expect(fields.bin).toBe("bin/run.js");
  });

  it("reads backslashes of a bin as slashes", () => {
    const fields = readPackageFields({ name: "p", version: "0.0.1", bin: "bin\\run.js" }, "any");
    expect(fields.bin).toBe("bin/run.js");
  });

  // Each value is wrapped in its own array: it.each would spread an array value as arguments.
  it.each([[null], ["package.json"], [["a"]], [42], [undefined]])("rejects a manifest that is not an object: %j", (manifest) => {
    expect(() => readPackageFields(manifest, "x")).toThrow("not an object");
  });
});

describe("smoke-pack: singleDependency (fixtures/release/consumer)", () => {
  const cases = [
    { name: "pass-one-dependency", expected: "md-template-lint", error: undefined },
    { name: "fail-no-dependency", expected: undefined, error: "found 0" },
    { name: "fail-two-dependencies", expected: undefined, error: "found 2" },
  ];

  it("has at least one pass case and one fail case, one fixture each", () => {
    expectNameSplit(cases);
    expectFolder("consumer", cases);
  });

  for (const testCase of cases) {
    it(testCase.name, () => {
      const manifest = readCase("consumer", testCase.name);
      if (testCase.error === undefined) {
        expect(singleDependency(manifest)).toBe(testCase.expected);
      } else {
        expect(() => singleDependency(manifest)).toThrow(testCase.error);
      }
    });
  }
});

describe("smoke-pack: installedBinPath and binShimPath", () => {
  it("joins consumer, node_modules, package name and the bin entry", () => {
    const fields = { name: "md-template-lint", version: "1.2.3", bin: "dist/cli.js" };
    expect(installedBinPath("work", fields)).toBe(join("work", "node_modules", "md-template-lint", "dist", "cli.js"));
  });

  it("splits a scoped package name into its two folders", () => {
    const fields = { name: "@scope/tool", version: "1.0.0", bin: "dist/cli.js" };
    expect(installedBinPath("work", fields)).toBe(join("work", "node_modules", "@scope", "tool", "dist", "cli.js"));
  });

  it("follows a bin entry with several segments", () => {
    const fields = { name: "tool", version: "1.0.0", bin: "dist/bin/cli.js" };
    expect(installedBinPath("work", fields)).toBe(join("work", "node_modules", "tool", "dist", "bin", "cli.js"));
  });

  it("puts the shim in node_modules/.bin, with .cmd only on Windows", () => {
    expect(binShimPath("work", "mdtl", "win32")).toBe(join("work", "node_modules", ".bin", "mdtl.cmd"));
    expect(binShimPath("work", "mdtl", "linux")).toBe(join("work", "node_modules", ".bin", "mdtl"));
  });
});

describe("smoke-pack: checkBinNames", () => {
  const cases = [
    { name: "pass-both-names", manifest: { bin: { mdtl: "dist/cli.js", "md-template-lint": "./dist/cli.js" } }, problems: 0 },
    { name: "fail-alias-missing", manifest: { bin: { mdtl: "dist/cli.js" } }, problems: 1 },
    { name: "fail-wrong-target", manifest: { bin: { mdtl: "dist/other.js", "md-template-lint": "dist/cli.js" } }, problems: 1 },
    { name: "fail-bin-is-a-string", manifest: { bin: "dist/cli.js" }, problems: 2 },
    { name: "fail-no-bin", manifest: {}, problems: 2 },
  ];

  it("has at least one pass case and one fail case", () => {
    expectNameSplit(cases);
  });

  for (const testCase of cases) {
    it(testCase.name, () => {
      expect(checkBinNames(testCase.manifest)).toHaveLength(testCase.problems);
    });
  }

  it("expects the command mdtl and the alias md-template-lint", () => {
    expect(BIN_NAMES).toEqual(["mdtl", "md-template-lint"]);
  });

  it("is satisfied by the real package.json", () => {
    expect(checkBinNames(JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf8")))).toEqual([]);
  });
});

describe("smoke-pack: checkRun", () => {
  const ok = { status: 0, stdout: "1.2.3\n", stderr: "" };
  const cases = [
    {
      name: "pass-exit-stdout-and-stderr-match",
      result: { ...ok, stderr: "note\n" },
      expected: {
        label: "v",
        status: 0,
        stdoutIs: "1.2.3\n",
        stdoutHas: ["1.2"],
        stderrHas: ["note"],
      },
      problems: [],
    },
    {
      name: "fail-wrong-exit-code",
      result: { ...ok, status: 1 },
      expected: { label: "v", status: 0 },
      problems: ["v: exit code 1, expected 0"],
    },
    {
      name: "fail-killed-process-has-no-exit-code",
      result: { ...ok, status: null },
      expected: { label: "v", status: 0 },
      problems: ["v: exit code null, expected 0"],
    },
    {
      name: "fail-stdout-differs",
      result: ok,
      expected: { label: "v", status: 0, stdoutIs: "9.9.9\n" },
      problems: ['v: stdout "1.2.3\\n", expected "9.9.9\\n"'],
    },
    {
      name: "fail-stdout-lacks-text",
      result: ok,
      expected: { label: "v", status: 0, stdoutHas: ["passed"] },
      problems: ['v: stdout lacks "passed"'],
    },
    {
      name: "fail-stderr-lacks-text",
      result: ok,
      expected: { label: "v", status: 0, stderrHas: ["usage", "hint"] },
      problems: ['v: stderr lacks "usage"', 'v: stderr lacks "hint"'],
    },
  ];

  it("has at least one pass case and one fail case", () => {
    expectNameSplit(cases);
  });

  for (const testCase of cases) {
    it(testCase.name, () => {
      expect(checkRun(testCase.result, testCase.expected)).toEqual(testCase.problems);
    });
  }
});

describe("smoke-pack: expectations of the installed CLI", () => {
  const BOGUS_STDERR = "error MTL920: unknown option: --bogus\nTry 'mdtl --help' for usage.\n";

  const cases = [
    {
      name: "pass-real-outputs",
      checks: [
        [{ status: 0, stdout: "1.2.3\n", stderr: "" }, versionExpectation("1.2.3")],
        [{ status: 0, stdout: "x\nAll files passed!\n", stderr: "" }, projectLintExpectation("demo-project")],
        [{ status: 2, stdout: "", stderr: BOGUS_STDERR }, unknownOptionExpectation()],
      ] as const,
      problems: 0,
    },
    {
      name: "fail-version-has-no-newline-or-differs",
      checks: [
        [{ status: 0, stdout: "1.2.3", stderr: "" }, versionExpectation("1.2.3")],
        [{ status: 0, stdout: "mdtl 1.2.3\n", stderr: "" }, versionExpectation("1.2.3")],
      ] as const,
      problems: 2,
    },
    {
      name: "fail-lint-exit-1-or-no-success-line",
      checks: [
        [{ status: 1, stdout: "All files passed!", stderr: "" }, projectLintExpectation("demo-project")],
        [{ status: 0, stdout: "No files linted.\n", stderr: "" }, projectLintExpectation("demo-project")],
      ] as const,
      problems: 2,
    },
    {
      name: "fail-unknown-option-exit-1-or-silent",
      checks: [
        [{ status: 1, stdout: "", stderr: BOGUS_STDERR }, unknownOptionExpectation()],
        [{ status: 2, stdout: "", stderr: "" }, unknownOptionExpectation()],
        [{ status: 2, stdout: BOGUS_STDERR, stderr: "error MTL920: unknown option: --bogus\n" }, unknownOptionExpectation()],
      ] as const,
      problems: 1 + 2 + 1,
    },
  ];

  it("has at least one pass case and one fail case", () => {
    expectNameSplit(cases);
  });

  for (const testCase of cases) {
    it(testCase.name, () => {
      const problems = testCase.checks.flatMap(([result, expected]) => checkRun(result, expected));
      expect(problems).toHaveLength(testCase.problems);
    });
  }

  it("the unknown-option expectation is exit 2 with the code and the usage hint on stderr", () => {
    expect(unknownOptionExpectation()).toEqual({
      label: "unknown option",
      status: 2,
      stderrHas: ["error MTL920: unknown option: --bogus", "Try 'mdtl --help' for usage."],
    });
  });
});

describe("smoke-pack: the fixture project tests/fixtures/smoke/clean-project", () => {
  it("lints clean through the CLI function: exit 0 and the success line", async () => {
    const cwd = foldPath(join(REPO_ROOT, "tests", "fixtures", "smoke", "clean-project"));
    const run = await runCli([], { cwd, boundary: cwd, isTty: false, noColor: false });
    expect(checkRun({ status: run.exitCode, stdout: run.stdout, stderr: run.stderr }, projectLintExpectation("clean-project"))).toEqual([]);
    expect(run.stdout).toContain("Total files:  1");
  });
});

describe("smoke-pack: tarball content (fixtures/release/tarball)", () => {
  const cases = [
    { name: "pass-expected-package", problems: [] },
    { name: "fail-extra-file", problems: ["unexpected file: CONTRIBUTING.md"] },
    { name: "fail-missing-required", problems: ["missing required file: dist/cli.js"] },
    { name: "fail-map-file", problems: ["forbidden source map: dist/cli.js.map"] },
    { name: "fail-tests-leak", problems: ["leaks tests/: tests/unit/engine.test.ts"] },
    { name: "fail-scripts-leak", problems: ["leaks scripts/: scripts/smoke-pack.ts"] },
  ];

  it("has at least one pass case and one fail case, one fixture each", () => {
    expectNameSplit(cases);
    expectFolder("tarball", cases, "txt");
  });

  for (const testCase of cases) {
    it(testCase.name, () => {
      const paths = tarballEntries(readText("tarball", testCase.name, "txt"));
      expect(checkTarballEntries(paths)).toEqual(testCase.problems);
    });
  }

  it("drops directory entries and the package/ prefix", () => {
    expect(tarballEntries("package/dist/\npackage/dist/cli.js\r\n\npackage/package.json\n")).toEqual(["dist/cli.js", "package.json"]);
  });

  it("refuses an entry that does not start with package/", () => {
    expect(() => tarballEntries("package/package.json\nother/file.txt\n")).toThrow("without the package/ prefix: other/file.txt");
  });

  it("reports every required file when the tarball is empty", () => {
    expect(checkTarballEntries([])).toEqual([
      "missing required file: package.json",
      "missing required file: README.md",
      "missing required file: LICENSE",
      "missing required file: CHANGELOG.md",
      "missing required file: THIRD_PARTY_NOTICES.md",
      "missing required file: dist/cli.js",
      "missing required file: dist/index.js",
    ]);
  });

  it.each(["src", "legacy", "tmp"])("flags a file under %s/", (dir) => {
    const paths = tarballEntries(readText("tarball", "pass-expected-package", "txt")).concat(`${dir}/a.ts`);
    expect(checkTarballEntries(paths)).toEqual([`leaks ${dir}/: ${dir}/a.ts`]);
  });

  it("flags a source map outside dist/ as a map, once", () => {
    expect(checkTarballEntries(["package.json", "README.md", "LICENSE", "CHANGELOG.md", "THIRD_PARTY_NOTICES.md", "dist/cli.js", "dist/index.js", "lib/x.js.map"])).toEqual(["forbidden source map: lib/x.js.map"]);
  });
});

describe("release: checkTag", () => {
  const cases = [
    { name: "pass-tag-is-version", tag: "1.2.3", version: "1.2.3", ok: true },
    { name: "fail-wrong-tag", tag: "1.2.4", version: "1.2.3", ok: false },
    { name: "fail-tag-with-leading-v", tag: "v1.2.3", version: "1.2.3", ok: false },
    {
      name: "fail-prerelease-tag-for-release-version",
      tag: "1.2.3-rc.1",
      version: "1.2.3",
      ok: false,
    },
    {
      name: "fail-release-tag-for-prerelease-version",
      tag: "1.2.3",
      version: "1.2.3-rc.1",
      ok: false,
    },
    { name: "fail-empty-tag", tag: "", version: "1.2.3", ok: false },
    { name: "fail-tag-with-suffix", tag: "1.2.3 ", version: "1.2.3", ok: false },
  ];

  it("has at least one pass case and one fail case", () => {
    expectNameSplit(cases);
  });

  for (const testCase of cases) {
    it(testCase.name, () => {
      const problems = checkTag(testCase.tag, testCase.version);
      expect(problems.length === 0).toBe(testCase.ok);
      if (!testCase.ok) expect(problems[0]).toContain("does not match package.json version");
    });
  }

  it("accepts the matching prerelease tag", () => {
    expect(checkTag("1.2.3-rc.1+b5", "1.2.3-rc.1+b5")).toEqual([]);
  });
});

describe("release: checkRepositoryUrl (fixtures/release/repository)", () => {
  const REPO = "example-owner/example-repo";
  const cases = [
    { name: "pass-git-plus-https-url", repository: REPO, problems: 0 },
    // The name of the repository (example-repo) is a prefix of the name in the url
    // (example-repo-extra).
    { name: "fail-prefix-name", repository: REPO, problems: 1 },
    { name: "fail-other-owner", repository: REPO, problems: 1 },
    { name: "fail-extra-path", repository: REPO, problems: 1 },
    { name: "fail-url-missing", repository: REPO, problems: 1 },
  ];

  it("has at least one pass case and one fail case, one fixture each", () => {
    expectNameSplit(cases);
    expectFolder("repository", cases);
  });

  for (const testCase of cases) {
    it(testCase.name, () => {
      const manifest = readCase("repository", testCase.name);
      expect(checkRepositoryUrl(manifest, testCase.repository)).toHaveLength(testCase.problems);
    });
  }

  it.each(["git+https://github.com/o/r.git", "https://github.com/o/r.git", "https://github.com/o/r", "git+https://github.com/O/R.git"])("accepts the url %s for o/r", (url) => {
    expect(checkRepositoryUrl({ repository: { url } }, "o/r")).toEqual([]);
  });

  it.each([
    "git+https://github.com/o/r2.git",
    "git+https://github.com/o/rr.git",
    "git+https://github.com/xo/r.git",
    "git+https://github.com/o/r.git#main",
    "git+ssh://git@github.com/o/r.git",
    "https://example.com/github.com/o/r.git",
    "https://github.com/o/r.git/",
  ])("rejects the url %s for o/r", (url) => {
    expect(checkRepositoryUrl({ repository: { url } }, "o/r")).toHaveLength(1);
  });

  it("rejects a repository that is not <owner>/<name>", () => {
    expect(checkRepositoryUrl({ repository: { url: "x" } }, "o")).toEqual(['repository "o" is not <owner>/<name>']);
  });
});

describe("release: checkRelease", () => {
  const manifest = { version: "1.2.3", repository: { url: "git+https://github.com/o/r.git" } };

  it("is empty when the tag and the repository agree with package.json", () => {
    expect(checkRelease(manifest, "1.2.3", "o/r")).toEqual([]);
  });

  it("reports the tag and the repository problems together", () => {
    expect(checkRelease(manifest, "9.9.9", "o/other")).toHaveLength(2);
  });

  it("reports a package.json without a valid version", () => {
    expect(checkRelease({ version: "x" }, "x", "o/r")).toEqual(["package.json: version is not semver: x"]);
  });
});

describe("release: scripts/smoke/check-release.ts as a process", () => {
  const manifest = JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf8")) as {
    version: string;
    repository: { url: string };
  };
  const repository = /github\.com\/(.+?)(?:\.git)?$/.exec(manifest.repository.url)?.[1] ?? "";

  function check(...args: string[]) {
    const result = spawnSync(process.execPath, [TSX_CLI, "scripts/smoke/check-release.ts", ...args], {
      cwd: REPO_ROOT,
      encoding: "utf8",
    });
    return { status: result.status, stdout: result.stdout, stderr: result.stderr };
  }

  it("exits 0 for the tag <version> of this repository", () => {
    expect(repository).not.toBe("");
    const run = check(manifest.version, repository);
    expect(run.status).toBe(0);
    expect(run.stdout).toContain(`ok   tag ${manifest.version}`);
  });

  it("exits 1 for a tag with a leading v", () => {
    const run = check(`v${manifest.version}`, repository);
    expect(run.status).toBe(1);
    expect(run.stderr).toContain("does not match package.json version");
  });

  it("exits 1 for a repository whose name only starts like ours", () => {
    const run = check(manifest.version, repository.slice(0, -1));
    expect(run.status).toBe(1);
    expect(run.stderr).toContain("repository.url");
  });

  it("exits 2 without arguments", () => {
    const run = check();
    expect(run.status).toBe(2);
    expect(run.stderr).toContain("usage:");
  });
});
