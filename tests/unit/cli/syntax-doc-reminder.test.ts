/**
 * SYNTAX_DOC_REMINDER export: appears in help and verify text output, absent from
 * quiet and JSON modes (src/cli/args.ts line 56, src/cli/verify-report.ts line 291).
 */
import { describe, expect, it } from "vitest";
import { SYNTAX_DOC_REMINDER, SYNTAX_DOC_URL } from "../../../src/cli/args.js";
import { runCliIn } from "../../helpers/cli.js";

const HELP_FIXTURE = "usage-no-config";
const VERIFY_FIXTURE = "schema-pass-several-types-rules-headings";

describe("SYNTAX_DOC_REMINDER export", () => {
  describe("--help output", () => {
    it("contains the reminder line exactly once, ending with newline", async () => {
      const run = await runCliIn(HELP_FIXTURE, ["--help"]);
      expect(run.exitCode).toBe(0);
      expect(run.stdout).toContain(SYNTAX_DOC_REMINDER);
      // Count occurrences: should be exactly 1.
      const matches = (run.stdout.match(/Template syntax reference:/g) || []).length;
      expect(matches).toBe(1);
      // Help output ends with the reminder line and newline.
      expect(run.stdout).toMatch(/Template syntax reference:[^\n]*\n$/);
    });

    it("-h contains the reminder line exactly once", async () => {
      const run = await runCliIn(HELP_FIXTURE, ["-h"]);
      expect(run.exitCode).toBe(0);
      expect(run.stdout).toContain(SYNTAX_DOC_REMINDER);
      const matches = (run.stdout.match(/Template syntax reference:/g) || []).length;
      expect(matches).toBe(1);
    });
  });

  describe("--verify text output", () => {
    it("pretty text contains the reminder exactly once after Config: line", async () => {
      const run = await runCliIn(VERIFY_FIXTURE, ["--verify", "template.md"]);
      expect(run.exitCode).toBe(0);
      // Find indices of Config: and the reminder.
      const configIdx = run.stdout.indexOf("Config:");
      const reminderIdx = run.stdout.indexOf(SYNTAX_DOC_REMINDER);
      expect(configIdx).toBeGreaterThanOrEqual(0);
      expect(reminderIdx).toBeGreaterThan(configIdx);
      // Check it appears exactly once.
      const matches = (run.stdout.match(/Template syntax reference:/g) || []).length;
      expect(matches).toBe(1);
    });

    it("plain text contains the reminder exactly once after Config: line", async () => {
      const run = await runCliIn(VERIFY_FIXTURE, ["--verify", "--format", "plain", "template.md"]);
      expect(run.exitCode).toBe(0);
      const configIdx = run.stdout.indexOf("Config:");
      const reminderIdx = run.stdout.indexOf(SYNTAX_DOC_REMINDER);
      expect(configIdx).toBeGreaterThanOrEqual(0);
      expect(reminderIdx).toBeGreaterThan(configIdx);
      const matches = (run.stdout.match(/Template syntax reference:/g) || []).length;
      expect(matches).toBe(1);
    });
  });

  describe("--verify --quiet output", () => {
    it("quiet text mode has no reminder, stdout is empty for clean template", async () => {
      const run = await runCliIn(VERIFY_FIXTURE, ["--verify", "--quiet", "template.md"]);
      expect(run.exitCode).toBe(0);
      expect(run.stdout).toBe("");
      expect(run.stdout).not.toContain(SYNTAX_DOC_REMINDER);
    });
  });

  describe("--verify --format json output", () => {
    it("JSON output contains no reminder string and parses as valid JSON", async () => {
      const run = await runCliIn(VERIFY_FIXTURE, ["--verify", "--format", "json", "template.md"]);
      expect(run.exitCode).toBe(0);
      // Should parse as JSON without errors.
      const doc = JSON.parse(run.stdout) as Record<string, unknown>;
      expect(doc).toBeDefined();
      // The reminder string should not appear anywhere in the JSON output.
      expect(run.stdout).not.toContain(SYNTAX_DOC_REMINDER);
      expect(run.stdout).not.toContain(SYNTAX_DOC_URL);
    });
  });

  describe("Hardcoded URL constant assertion", () => {
    it("SYNTAX_DOC_REMINDER contains the exact expected URL", () => {
      const expected =
        "Template syntax reference: https://github.com/m21-cerutti/markdown-template-linter/blob/main/docs/syntax-reference.md";
      expect(SYNTAX_DOC_REMINDER).toBe(expected);
    });
  });
});
