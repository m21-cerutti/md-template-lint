/**
 * CLI usage (docs/spec.md 7.1): `--help` and `--version` win, a usage error is exit 2
 * with a short message and the usage hint on stderr, `--` ends the options.
 * The cases need no project of their own: they run in the one fixture
 * tests/fixtures/cli/usage-no-config/ (no config file, discovery stops there), so the
 * group has no pass-/fail- directory per case; the pass/fail split is checked on the names.
 */
import { describe, expect, it } from "vitest";
import { parseArgs, USAGE } from "../../../src/cli/args.js";
import { fixtureDirs, expectNameSplit } from "../../helpers/fixtures.js";
import { runCliIn, VERSION } from "../../helpers/cli.js";

const FIXTURE = "usage-no-config";
const HINT = "Try 'md-template-lint --help' for usage.";

interface Case {
  readonly name: string;
  readonly args: readonly string[];
  readonly exitCode: 0 | 2;
  /** Usage error: `code: message`; absent for the passing case. */
  readonly error?: string;
}

/** Exactly 1 passing case, failing cases >= passing. */
const CASES: readonly Case[] = [
  { name: "pass-help-wins-over-bad-flag", args: ["--bogus", "--help"], exitCode: 0 },
  {
    name: "fail-unknown-flag",
    args: ["--bogus"],
    exitCode: 2,
    error: "MTL920: unknown option: --bogus",
  },
  {
    name: "fail-unknown-short-flag",
    args: ["-x"],
    exitCode: 2,
    error: "MTL920: unknown option: -x",
  },
  {
    name: "fail-boolean-flag-given-a-value",
    args: ["--quiet=1"],
    exitCode: 2,
    error: "MTL920: unknown option: --quiet=1",
  },
  {
    name: "fail-config-without-value",
    args: ["--config"],
    exitCode: 2,
    error: "MTL921: --config requires an argument",
  },
  {
    name: "fail-config-followed-by-flag",
    args: ["--config", "--quiet"],
    exitCode: 2,
    error: "MTL921: --config requires an argument",
  },
  {
    name: "fail-config-empty-inline-value",
    args: ["--config="],
    exitCode: 2,
    error: "MTL921: --config requires an argument",
  },
  {
    name: "fail-format-without-value",
    args: ["--format"],
    exitCode: 2,
    error: "MTL921: --format requires an argument",
  },
  {
    name: "fail-format-bad-value",
    args: ["--format", "xml"],
    exitCode: 2,
    error: "MTL922: invalid value 'xml' for --format (expected text, plain or json)",
  },
  {
    name: "fail-format-bad-inline-value-is-case-sensitive",
    args: ["--format=Text"],
    exitCode: 2,
    error: "MTL922: invalid value 'Text' for --format (expected text, plain or json)",
  },
  {
    name: "fail-verify-without-config-or-templates",
    args: ["--verify"],
    exitCode: 2,
    error: "MTL923: --verify needs a config or at least one template path",
  },
];

describe("cli usage: layout", () => {
  it("has exactly 1 pass- case, at least as many fail- cases, and the one fixture directory", () => {
    expectNameSplit(CASES);
    expect(fixtureDirs("cli", "usage-")).toEqual([FIXTURE]);
  });
});

describe("cli usage: exit codes and messages (spec 7.1, 7.5)", () => {
  for (const testCase of CASES) {
    it(`${testCase.name}: exit ${testCase.exitCode}`, async () => {
      const run = await runCliIn(FIXTURE, testCase.args);
      expect(run.exitCode).toBe(testCase.exitCode);
      if (testCase.error === undefined) {
        expect(run.stdout).toBe(USAGE);
        expect(run.stderr).toBe("");
      } else {
        expect(run.stdout).toBe("");
        expect(run.stderr).toBe(`error ${testCase.error}\n${HINT}\n`);
      }
      // A usage error stops before any lint: no io was built.
      expect(run.ioCalls).toEqual([]);
    });
  }
});

describe("cli usage: --help, --version and --", () => {
  it("--version prints the version and exits 0", async () => {
    const run = await runCliIn(FIXTURE, ["--version"]);
    expect(run).toMatchObject({ stdout: `${VERSION}\n`, stderr: "", exitCode: 0 });
  });

  it("--version wins over a bad flag; --help wins over --version", async () => {
    expect((await runCliIn(FIXTURE, ["--format", "xml", "--version"])).stdout).toBe(`${VERSION}\n`);
    expect((await runCliIn(FIXTURE, ["--version", "-h"])).stdout).toBe(USAGE);
  });

  it("-h prints the usage", async () => {
    const run = await runCliIn(FIXTURE, ["-h"]);
    expect(run).toMatchObject({ stdout: USAGE, stderr: "", exitCode: 0 });
    expect(USAGE).toContain("--config <path>");
  });

  it("-- ends the options: a later flag-like argument is a file", async () => {
    const run = await runCliIn(FIXTURE, ["--", "--bogus"]);
    // Not a usage error: the run starts and finds no config (MTL901, exit 2).
    expect(run.stderr).toContain("error MTL901:");
    expect(run.stderr).not.toContain("MTL920");
  });

  it("after --, --help, -h and --version are files and reach the run path", async () => {
    for (const word of ["--help", "-h", "--version"]) {
      const run = await runCliIn(FIXTURE, ["--", word]);
      // Not the usage and not the version: the run starts and finds no config (MTL901).
      expect(run.stdout, word).not.toBe(USAGE);
      expect(run.stdout, word).not.toBe(`${VERSION}\n`);
      expect(run.stderr, word).toContain("error MTL901:");
      expect(run.exitCode, word).toBe(2);
      expect(parseArgs(["--", word])).toMatchObject({ kind: "run", options: { files: [word] } });
    }
  });

  it("before --, --help still wins; the arguments after -- are not read", async () => {
    expect((await runCliIn(FIXTURE, ["--help", "--", "--bogus"])).stdout).toBe(USAGE);
    expect((await runCliIn(FIXTURE, ["--", "--bogus", "--format", "xml"])).stderr).not.toContain(
      "MTL92",
    );
  });

  it("-- alone is a run with no files", () => {
    expect(parseArgs(["--"])).toEqual({
      kind: "run",
      options: { configPath: undefined, format: "text", quiet: false, verify: false, files: [] },
    });
  });

  it("echoes a flag with control characters as visible escapes", async () => {
    const run = await runCliIn(FIXTURE, ["--bad\u001b[2J"]);
    expect(run.stderr).toBe(`error MTL920: unknown option: --bad\\x1b[2J\n${HINT}\n`);
  });
});

describe("cli usage: parseArgs", () => {
  it("reads --config and --format in both spellings, the last one wins", () => {
    expect(
      parseArgs(["--config", "a.yml", "--config=b.yml", "--format=json", "--format", "plain"]),
    ).toEqual({
      kind: "run",
      options: { configPath: "b.yml", format: "plain", quiet: false, verify: false, files: [] },
    });
  });

  it("keeps the file arguments in command line order, also after --", () => {
    expect(parseArgs(["b.md", "--quiet", "a.md", "--", "--verify", "c.md"])).toEqual({
      kind: "run",
      options: {
        configPath: undefined,
        format: "text",
        quiet: true,
        verify: false,
        files: ["b.md", "a.md", "--verify", "c.md"],
      },
    });
  });

  it("treats a lone - as a file", () => {
    expect(parseArgs(["-"])).toMatchObject({ kind: "run", options: { files: ["-"] } });
  });
});
