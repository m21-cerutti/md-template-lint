/**
 * Pretty reporter (docs/spec.md 8.2): the wrapper layout, Unicode glyphs, ANSI color
 * only when asked. Expected-output files: tests/fixtures/runner/report-sample/expected.*.txt
 * (written from the spec 8.2 sample, not generated).
 */
import { describe, expect, it } from "vitest";
import { report } from "../../../src/reporters/index.js";
import { readFixture } from "../../helpers/fixtures.js";
import { runFixture } from "../../helpers/run.js";

const VERSION = "1.0.0";
const ESC = String.fromCharCode(27);
/** Color sequences (SGR) added by the reporter. */
const SGR = new RegExp(`${ESC}\\[[0-9;]*m`, "g");

describe("pretty reporter: the spec 8.2 sample", () => {
  it("matches the wrapper layout line for line", async () => {
    const result = await runFixture("report-sample");
    const { stdout, stderr } = report(result, { format: "pretty", version: VERSION });
    expect(stdout).toBe(readFixture("runner", "report-sample", "expected.pretty.txt"));
    expect(stderr).toBe("");
    expect(result.summary.exitCode).toBe(1);
  });

  it("color on: same text plus SGR sequences, nothing else escaped", async () => {
    const result = await runFixture("report-sample");
    const { stdout } = report(result, { format: "pretty", version: VERSION, color: true });
    expect(stdout).toContain(`${ESC}[32m  ✓ docs/adr/0001-first.md${ESC}[0m`);
    expect(stdout).toContain(`${ESC}[31m  ✗ docs/adr/0002-second.md${ESC}[0m`);
    expect(stdout).toContain(`${ESC}[35m  TEMPLATE ERROR:`);
    expect(stdout.replace(SGR, "")).toBe(readFixture("runner", "report-sample", "expected.pretty.txt"));
    expect(stdout.replace(SGR, "").includes(ESC)).toBe(false);
  });

  it("color off (the default) prints no escape at all", async () => {
    const result = await runFixture("report-sample");
    expect(report(result, { format: "pretty", version: VERSION }).stdout.includes(ESC)).toBe(false);
  });

  it("--quiet prints only failing files with their errors and template errors", async () => {
    const result = await runFixture("report-sample");
    const { stdout, stderr } = report(result, { format: "pretty", version: VERSION, quiet: true });
    expect(stdout).toBe(readFixture("runner", "report-sample", "expected.quiet.txt"));
    expect(stderr).toBe("");
  });

  it("--quiet prints nothing when the run is clean", async () => {
    const result = await runFixture("inputs-pass-all-present");
    expect(report(result, { format: "pretty", version: VERSION, quiet: true })).toEqual({
      stdout: "",
      stderr: "",
    });
  });

  it("--quiet with a run error: stdout stays empty, the error is on stderr", async () => {
    const result = await runFixture("inputs-fail-template-missing");
    const { stdout, stderr } = report(result, { format: "pretty", version: VERSION, quiet: true });
    expect(stdout).toBe("");
    expect(stderr).toBe("error MTL910: template not found: templates/missing.template.md (pair 'ghost')\n");
  });

  it("zero files with a broken template: the failure summary shows, not No files linted.", async () => {
    const result = await runFixture("broken-fail-shared-template-counted-once");
    const { stdout } = report(result, { format: "pretty", version: VERSION });
    expect(result.summary.files).toBe(0);
    expect(stdout).not.toContain("No files linted.");
    expect(stdout).not.toContain("All files passed!");
    expect(stdout).toContain("Broken templates:");
  });

  it("a failed file of a non-project root is listed with its root", async () => {
    const result = await runFixture("report-multi-root-warnings");
    const { stdout } = report(result, { format: "pretty", version: VERSION });
    expect(stdout).toContain("Failed files:\n  - docs/b.md (root 'other')\n");
    expect(stdout).toContain("Warnings:     2 (in 1 file(s))\n");
  });

  it("a clean run closes with All files passed! and exit 0", async () => {
    const result = await runFixture("inputs-pass-all-present");
    const { stdout } = report(result, { format: "pretty", version: VERSION });
    expect(stdout).toContain("\nAll files passed!\n========================\n");
    expect(stdout).not.toContain("No files linted.");
    expect(stdout).not.toContain("Run errors:");
    expect(stdout).not.toContain("Run warnings:");
    expect(result.summary.exitCode).toBe(0);
  });

  it("a non-project root adds a Root: line after Template:", async () => {
    const result = await runFixture("expand-multi-root-declaration-order");
    const { stdout } = report(result, { format: "pretty", version: VERSION });
    expect(stdout).toContain("Template: templates/note.template.md\nRoot:     a\nTarget:   docs/*.md (1 file(s))\n");
    expect(stdout).toContain("Template: templates/note.template.md\nTarget:   docs/*.md (1 file(s))\n");
  });

  it("a run error goes to stderr as error MTLnnn: message and is counted in the summary", async () => {
    const result = await runFixture("inputs-fail-template-missing");
    const { stdout, stderr } = report(result, { format: "pretty", version: VERSION });
    expect(stderr).toBe("error MTL910: template not found: templates/missing.template.md (pair 'ghost')\n");
    expect(stdout).toContain("Run errors:   1\n");
    expect(stdout).not.toContain("MTL910");
    expect(stdout).not.toContain("All files passed!");
  });
});
