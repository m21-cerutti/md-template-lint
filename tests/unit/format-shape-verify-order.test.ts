/**
 * `--verify` rule token order of the field format shape tags (docs/spec.md 8.3, 2.9): per
 * field the order is presence, constant, case, elements case, shape, elements shape,
 * value-filename, ... so a shape token always prints BEFORE `value:filename`, whatever the
 * order of the tags in the comment.
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { runCli } from "../../src/cli/run.js";
import { foldPath } from "../../src/config/paths.js";
import { checkTemplate } from "../../src/engine/pipeline.js";
import { createRegistry } from "../../src/engine/registry.js";
import { describeTemplate } from "../../src/runner/schema.js";
import { HOME } from "../helpers/run.js";

const TEMPLATE = [
  "---",
  'version: "1.0.0" # [value:filename] [format:semver]',
  "released: 2026-01-01 # [value:filename] [format:date]",
  'supported: ["1.0.0"] # [value:filename] [format:elements:semver]',
  'milestones: ["2026-01-01"] # [value:filename] [format:elements:date]',
  'both: "1.0.0" # [value:filename] [format:elements:date] [format:date] [format:elements:semver] [format:semver]',
  "---",
  "",
  "# Release notes",
  "",
].join("\n");

/** Field -> expected rule tokens (spec 8.3 order). */
const EXPECTED: readonly (readonly [string, readonly string[]])[] = [
  ["version", ["presence:required", "format:semver", "value:filename"]],
  ["released", ["presence:required", "format:date", "value:filename"]],
  ["supported", ["presence:required", "format:elements:semver", "value:filename"]],
  ["milestones", ["presence:required", "format:elements:date", "value:filename"]],
  // The first tag of each kind: the scalar shape, then the elements shape, then the filename.
  ["both", ["presence:required", "format:date", "format:elements:date", "value:filename"]],
];

describe("shape tokens print before value:filename (spec 8.3)", () => {
  it("describeTemplate gives the shape token before value:filename for every shape tag", async () => {
    const status = await checkTemplate(createRegistry(), TEMPLATE);
    if (status.status !== "ok") throw new Error("template is broken");
    const rules = new Map(describeTemplate(status.model).fields.map((f) => [f.name, f.rules]));
    for (const [field, tokens] of EXPECTED) expect(rules.get(field)).toEqual(tokens);
  });

  describe("--verify text output", () => {
    let folder = "";

    beforeAll(() => {
      folder = mkdtempSync(join(tmpdir(), "mtl-shape-order-"));
      writeFileSync(join(folder, "t.template.md"), TEMPLATE);
    });

    afterAll(() => {
      if (folder !== "") rmSync(folder, { recursive: true, force: true });
    });

    it("lists the shape token before value:filename in the Rules column", async () => {
      const cwd = foldPath(folder);
      const run = await runCli(["--verify", "--format", "plain", "t.template.md"], {
        cwd,
        home: HOME,
        boundary: cwd,
        isTty: false,
        noColor: false,
        version: "9.9.9",
        createIo: () => {
          throw new Error("--verify must not build the io");
        },
      });
      expect(run.stderr).toBe("");
      expect(run.exitCode).toBe(0);
      const rows = run.stdout.split("\n");
      for (const [field, tokens] of EXPECTED) {
        const row = rows.find((line) => line.startsWith(`${field} `));
        expect(row, `row of ${field}`).toBeDefined();
        expect(row?.endsWith(tokens.join(", ")), `${field}: ${row}`).toBe(true);
      }
    });
  });
});
