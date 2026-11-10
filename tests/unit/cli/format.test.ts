/**
 * CLI output options (docs/spec.md 7.1, 8.2): `--format text|plain|json` selects the
 * pretty, plain or JSON reporter, color only on a terminal with NO_COLOR unset,
 * `--quiet` shrinks the text formats only. Fixtures: tests/fixtures/cli/format-<case>/.
 */
import { describe, expect, it } from "vitest";
import { expectSplit } from "../../helpers/fixtures.js";
import { lintedOf, parseJson, runCliIn } from "../../helpers/cli.js";

const GROUP = "format-";
const CLEAN = `${GROUP}pass-clean-project`;
const FAILING = `${GROUP}fail-lint-failure`;
const RUN_ERROR = `${GROUP}fail-run-error`;
const ESC = "\u001b[";

interface Case {
  readonly name: string;
  readonly exitCode: 0 | 1 | 2;
  /** `root:pair:path` of the linted files. */
  readonly linted: readonly string[];
}

/** Exactly 1 passing case, failing cases >= passing; one fixture directory per case. */
const CASES: readonly Case[] = [
  { name: "pass-clean-project", exitCode: 0, linted: ["project:notes:docs/a.md"] },
  {
    name: "fail-lint-failure",
    exitCode: 1,
    linted: ["project:notes:docs/a.md", "project:notes:docs/b.md"],
  },
  { name: "fail-run-error", exitCode: 2, linted: [] },
];

describe("cli output: layout", () => {
  it("has exactly 1 pass- case, at least as many fail- cases, one directory each", () => {
    expectSplit("cli", GROUP, CASES);
  });
});

describe("cli --format", () => {
  for (const testCase of CASES) {
    it(`${testCase.name}: json is one document whose exit code is the process exit code`, async () => {
      const run = await runCliIn(`${GROUP}${testCase.name}`, ["--format", "json"]);
      const json = parseJson(run.stdout);
      expect(run.exitCode).toBe(testCase.exitCode);
      expect(json.mode).toBe("lint");
      expect(lintedOf(json)).toEqual(testCase.linted);
      expect(json.summary["exitCode"]).toBe(testCase.exitCode);
      expect(run.stderr).toBe("");
    });
  }

  it("text is the default and is the pretty layout with glyphs", async () => {
    const byDefault = await runCliIn(FAILING, []);
    const named = await runCliIn(FAILING, ["--format", "text"]);
    const inline = await runCliIn(FAILING, ["--format=text"]);
    expect(byDefault.stdout).toContain("md-template-lint 9.9.9");
    expect(byDefault.stdout).toContain("  ✓ docs/a.md");
    expect(byDefault.stdout).toContain("  ✗ docs/b.md");
    expect(byDefault.stdout).toContain("      error MTL201 ");
    expect(named).toEqual(byDefault);
    expect(inline).toEqual(byDefault);
  });

  it("plain is the same layout with ASCII words", async () => {
    const run = await runCliIn(FAILING, ["--format", "plain"]);
    expect(run.stdout).toContain("  PASS docs/a.md");
    expect(run.stdout).toContain("  FAIL docs/b.md");
    expect(run.stdout).not.toContain("✓");
    expect(run.stdout).not.toContain("✗");
    expect(run.exitCode).toBe(1);
  });

  it("json lists every file and the version", async () => {
    const run = await runCliIn(FAILING, ["--format=json"]);
    const json = JSON.parse(run.stdout) as { version: string; tool: string };
    expect(json).toMatchObject({ tool: "md-template-lint", version: "9.9.9" });
    expect(run.stdout.endsWith("}\n")).toBe(true);
  });

  it("run errors go to stderr in text and inside the document in json", async () => {
    const text = await runCliIn(RUN_ERROR, []);
    expect(text.stderr).toBe(
      "error MTL910: template not found: templates/missing.template.md (pair 'ghost')\n",
    );
    const json = await runCliIn(RUN_ERROR, ["--format", "json"]);
    expect(json.stderr).toBe("");
    expect(parseJson(json.stdout).runErrors.map((error) => error.code)).toEqual(["MTL910"]);
  });
});

describe("cli color (spec 8.2)", () => {
  it("colors the text format on a terminal", async () => {
    const run = await runCliIn(CLEAN, [], { isTty: true });
    expect(run.stdout).toContain(`${ESC}32m`);
  });

  it("does not color when stdout is not a terminal", async () => {
    expect((await runCliIn(CLEAN, [])).stdout).not.toContain(ESC);
  });

  it("does not color when NO_COLOR is set, even on a terminal", async () => {
    const colored = await runCliIn(CLEAN, [], { isTty: true });
    const none = await runCliIn(CLEAN, [], { isTty: true, noColor: true });
    expect(none.stdout).not.toContain(ESC);
    const stripped = ["32", "31", "33", "36", "35", "90", "0"].reduce(
      (text, code) => text.replaceAll(`${ESC}${code}m`, ""),
      colored.stdout,
    );
    expect(none.stdout).toBe(stripped);
  });

  it("never colors plain or json, even on a terminal", async () => {
    for (const format of ["plain", "json"]) {
      const run = await runCliIn(CLEAN, ["--format", format], { isTty: true });
      expect(run.stdout, format).not.toContain(ESC);
    }
  });

  it("colors a run error line on stderr only through the reporter, on a terminal", async () => {
    const run = await runCliIn(RUN_ERROR, [], { isTty: true });
    expect(run.stderr).toContain(`${ESC}31merror MTL910:`);
  });
});

describe("cli --quiet (spec 7.1, 8.2)", () => {
  it("prints nothing for a clean run", async () => {
    expect(await runCliIn(CLEAN, ["--quiet"])).toMatchObject({
      stdout: "",
      stderr: "",
      exitCode: 0,
    });
  });

  it("prints only the failing file and its errors", async () => {
    const run = await runCliIn(FAILING, ["--quiet"]);
    expect(run.exitCode).toBe(1);
    expect(run.stdout).toContain("  ✗ docs/b.md");
    expect(run.stdout).toContain("      error MTL201 ");
    for (const hidden of ["md-template-lint 9.9.9", "docs/a.md", "Summary", "Template:"]) {
      expect(run.stdout).not.toContain(hidden);
    }
  });

  it("keeps the run errors", async () => {
    const run = await runCliIn(RUN_ERROR, ["--quiet"]);
    expect(run.exitCode).toBe(2);
    expect(run.stderr).toContain("error MTL910:");
    expect(run.stdout).toBe("");
  });

  it("does not shrink json", async () => {
    const quiet = await runCliIn(FAILING, ["--format", "json", "--quiet"]);
    const full = await runCliIn(FAILING, ["--format", "json"]);
    expect(quiet).toEqual(full);
    expect(lintedOf(parseJson(quiet.stdout))).toHaveLength(2);
  });
});
