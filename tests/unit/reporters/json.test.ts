/**
 * JSON reporter (docs/spec.md 8.5): valid JSON that parses back, stable keys, the
 * optional `heading` on heading diagnostics, `--quiet` does not shrink it. Golden files:
 * tests/fixtures/runner/report-*\/expected.json (compared as parsed JSON, keys checked
 * apart).
 */
import { describe, expect, it } from "vitest";
import { report } from "../../../src/reporters/index.js";
import { readFixture } from "../../helpers/fixtures.js";
import { runFixture } from "../../helpers/run.js";

const VERSION = "1.0.0";

const json = async (name: string, quiet = false) => {
  const result = await runFixture(name);
  const output = report(result, { format: "json", version: VERSION, quiet });
  return { result, output, document: JSON.parse(output.stdout) as Record<string, unknown> };
};

describe("json reporter", () => {
  for (const name of ["report-sample", "report-config-error", "report-multi-root-warnings"]) {
    it(`${name}: valid JSON equal to expected.json, stdout only`, async () => {
      const { output, document } = await json(name);
      expect(document).toEqual(JSON.parse(readFixture("runner", name, "expected.json")));
      expect(output.stderr).toBe("");
      expect(output.stdout.endsWith("}\n")).toBe(true);
    });
  }

  it("report-sample: top level keys are stable and in the order of spec 8.5", async () => {
    const { document } = await json("report-sample");
    expect(Object.keys(document)).toEqual([
      "schemaVersion",
      "tool",
      "version",
      "mode",
      "config",
      "results",
      "runErrors",
      "runWarnings",
      "unmatched",
      "summary",
    ]);
  });

  it("report-sample: nested keys are stable and in the order of spec 8.5", async () => {
    const { document } = await json("report-sample");
    const results = document["results"] as Record<string, unknown>[];
    const [adr, broken] = results as [Record<string, unknown>, Record<string, unknown>];
    expect(Object.keys(adr)).toEqual(["root", "pair", "template", "files"]);
    expect(Object.keys(adr["template"] as object)).toEqual(["path", "status"]);
    expect(Object.keys(broken["template"] as object)).toEqual(["path", "status", "error"]);
    expect(Object.keys((broken["template"] as { error: object }).error)).toEqual([
      "code",
      "severity",
      "message",
    ]);
    const files = adr["files"] as { errors: object[]; warnings: object[] }[];
    expect(Object.keys(files[1] as object)).toEqual(["path", "status", "errors", "warnings"]);
    expect(Object.keys(files[1]?.errors[1] as object)).toEqual([
      "code",
      "severity",
      "message",
      "heading",
    ]);
    const runWarnings = document["runWarnings"] as object[];
    expect(Object.keys(runWarnings[0] as object)).toEqual([
      "code",
      "severity",
      "message",
      "pair",
      "root",
    ]);
    expect(Object.keys(document["summary"] as object)).toEqual([
      "files",
      "passed",
      "failed",
      "warnings",
      "filesWithWarnings",
      "templatesChecked",
      "templatesBroken",
      "runErrors",
      "runWarnings",
      "exitCode",
    ]);
  });

  it("report-multi-root-warnings: warnings count diagnostics, filesWithWarnings counts files", async () => {
    const { document } = await json("report-multi-root-warnings");
    expect(document["summary"]).toMatchObject({ warnings: 2, filesWithWarnings: 1 });
  });

  it("report-config-error: config errors carry file, line, column and key in this order", async () => {
    const { document } = await json("report-config-error");
    const errors = document["runErrors"] as object[];
    expect(Object.keys(errors[0] as object)).toEqual([
      "code",
      "severity",
      "message",
      "file",
      "line",
      "column",
      "key",
    ]);
  });

  it("report-sample: summary.exitCode equals the exit code of the run", async () => {
    const { result, document } = await json("report-sample");
    expect((document["summary"] as { exitCode: number }).exitCode).toBe(result.summary.exitCode);
    expect(result.summary.exitCode).toBe(1);
  });

  it("report-sample: heading is present on the heading diagnostic only (spec 8.1)", async () => {
    const { document } = await json("report-sample");
    const results = document["results"] as { files: { errors: Record<string, unknown>[] }[] }[];
    const errors = results[0]?.files[1]?.errors ?? [];
    expect(errors.map((error) => [error["code"], error["heading"]])).toEqual([
      ["MTL201", undefined],
      ["MTL601", "Context"],
    ]);
    expect("heading" in (errors[0] ?? {})).toBe(false);
  });

  it("report-sample: --quiet does not shrink the document", async () => {
    const loud = await json("report-sample");
    const quiet = await json("report-sample", true);
    expect(quiet.output.stdout).toBe(loud.output.stdout);
  });

  it("report-sample: a note (MTL913 warn) is in runWarnings, never in runErrors or the file warnings", async () => {
    const { document } = await json("report-sample");
    expect(document["runErrors"]).toEqual([]);
    expect(document["runWarnings"]).toHaveLength(1);
    expect((document["summary"] as { warnings: number }).warnings).toBe(2);
  });

  it("report-control-characters: echoed values are sanitized and the JSON stays valid", async () => {
    const { output, document } = await json("report-control-characters");
    const results = document["results"] as { files: { errors: { message: string }[] }[] }[];
    expect(results[0]?.files[0]?.errors.map((error) => error.message)).toEqual([
      "Field 'kind': expected constant value 'abc', got 'evil\\x1b[2Jred\\u202eend'",
      "Field 'note': expected constant value 'abc', got 'first second third'",
    ]);
    expect(output.stdout.includes(String.fromCharCode(27))).toBe(false);
    expect(output.stdout.includes("\u202e")).toBe(false);
  });

  it("a field diagnostic has no heading key (the content heading is covered in the pipeline tests)", async () => {
    const result = await runFixture("broken-fail-skips-only-its-pair");
    const document = JSON.parse(report(result, { format: "json", version: VERSION }).stdout) as {
      results: { files: { errors: Record<string, unknown>[] }[] }[];
    };
    // docs/b.md has an empty title (MTL201), no heading finding.
    expect(document.results[1]?.files[1]?.errors).toEqual([
      {
        code: "MTL201",
        severity: "error",
        message: "Field 'title': required but empty or missing",
      },
    ]);
  });
});
