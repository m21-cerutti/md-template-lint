/**
 * Config files that cannot be text fixtures: invalid UTF-8, a byte order mark with CRLF
 * line ends (prettier would rewrite them), a zero-byte file. The bytes are built in code
 * in a temporary folder that is removed afterwards. `loadConfig` never throws (spec 6.6).
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { loadConfig } from "../../../src/config/load.js";

let dir = "";

const FILES = {
  "invalid-utf8.yml": Buffer.from([0x70, 0x61, 0x69, 0x72, 0x73, 0x3a, 0x20, 0xff, 0xfe, 0x0a]),
  "empty.yml": Buffer.alloc(0),
  // BOM, CRLF; the unknown key `colour` is on line 3, column 1.
  "bom-crlf.yml": Buffer.from(["\uFEFFpairs:", "  - template: a.md", "colour: blue", ""].join("\r\n"), "utf8"),
  // BOM, CRLF; the unknown key `inlcude` is on line 3, column 5.
  "bom-crlf-nested.yml": Buffer.from(["\uFEFFpairs:", "  - template: a.md", "    inlcude: x", ""].join("\r\n"), "utf8"),
} as const;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "mtl-config-bytes-"));
  for (const [name, bytes] of Object.entries(FILES)) writeFileSync(join(dir, name), bytes);
});

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

const load = (name: string) => loadConfig({ cwd: dir, configPath: name, home: "/home/test", boundary: dir });

describe("config bytes", () => {
  it("fails: invalid UTF-8 is MTL902 with a path free detail", async () => {
    const result = await load("invalid-utf8.yml");
    expect(result).toMatchObject({
      ok: false,
      errors: [
        {
          code: "MTL902",
          severity: "error",
          message: "cannot parse invalid-utf8.yml: file is not valid UTF-8",
          file: "invalid-utf8.yml",
        },
      ],
    });
  });

  it("fails: a zero-byte file is MTL902 (empty file)", async () => {
    const result = await load("empty.yml");
    expect(result).toMatchObject({
      ok: false,
      errors: [{ code: "MTL902", message: "cannot parse empty.yml: file is empty" }],
    });
  });

  it("fails: with a BOM and CRLF the error line is right and the column is not shifted", async () => {
    const result = await load("bom-crlf-nested.yml");
    if (result.ok) throw new Error("expected errors");
    const unknown = result.errors.find((error) => error.code === "MTL903");
    expect(unknown).toMatchObject({ line: 3, column: 5, key: "pairs[0].inlcude" });
  });

  it("fails: BOM and CRLF, a top-level key on line 3 is found on line 3, column 1", async () => {
    const result = await load("bom-crlf.yml");
    if (result.ok) throw new Error("expected errors");
    const unknown = result.errors.find((error) => error.code === "MTL903");
    expect(unknown).toMatchObject({ line: 3, column: 1, key: "colour" });
  });
});
