/**
 * Production RuleIo `exists` (docs/spec.md 2.8): never throws, every OS error is "does
 * not exist", a NUL byte (ERR_INVALID_ARG_VALUE) included. Probes the path it is given
 * (the rule passes the folded path the containment check judged).
 */
import { describe, expect, it } from "vitest";
import { createRealIo } from "../../../src/io/index.js";
import { fixturePath, REPO_ROOT } from "../../helpers/fixtures.js";

const io = createRealIo();
const here = (...parts: string[]): string => `${REPO_ROOT}${parts.join("/")}`;

describe("exists", () => {
  it("pass: a file that exists", async () => {
    expect(await io.exists(here("package.json"))).toBe(true);
  });

  it("a directory exists too", async () => {
    expect(await io.exists(fixturePath("runner", "report-sample"))).toBe(true);
  });

  it("a forward-slash path with a folded .. segment is probed as given", async () => {
    expect(await io.exists(here("src", "io", "..", "..", "package.json"))).toBe(true);
  });

  it("fails: a missing file", async () => {
    expect(await io.exists(here("no-such-file.md"))).toBe(false);
  });

  it("fails: a missing parent directory (ENOENT, ENOTDIR)", async () => {
    expect(await io.exists(here("no-such-dir", "a.md"))).toBe(false);
    expect(await io.exists(here("package.json", "a.md"))).toBe(false);
  });

  it("fails: a NUL byte is swallowed (ERR_INVALID_ARG_VALUE), not thrown", async () => {
    expect(await io.exists(here("package.json\u0000.md"))).toBe(false);
    expect(await io.exists("\u0000")).toBe(false);
  });

  it("fails: an empty path and a path that is too long are swallowed", async () => {
    expect(await io.exists("")).toBe(false);
    expect(await io.exists(here("a".repeat(5000)))).toBe(false);
  });
});
