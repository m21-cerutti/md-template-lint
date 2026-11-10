/**
 * The catch-all of the process wrapper (src/cli/main.ts, used by src/cli.ts): anything
 * `runCli` throws is exit 2 with a fixed-shape, path-free message. An error text can carry
 * an absolute path (the policy of `readUtf8`), so only the error code or name is printed.
 * The one fixture read here is `exit-pass-clean-project` (read-only, as a plain clean project).
 */
import { describe, expect, it } from "vitest";
import { execute, failureReason } from "../../../src/cli/main.js";
import type { CliEnv } from "../../../src/cli/run.js";
import { fixtureFile } from "../../helpers/cli.js";

const ENV: CliEnv = { cwd: "/work", isTty: false, noColor: false };
const SECRET = "C:\\Users\\someone\\private\\notes.md";

const throwing = (error: unknown) => () => Promise.reject(error);

describe("cli catch-all: execute", () => {
  it("prints the error code, never the message, and exits 2", async () => {
    const error = Object.assign(new Error(`EACCES: permission denied, open '${SECRET}'`), {
      code: "EACCES",
    });
    const result = await execute([], ENV, throwing(error));
    expect(result).toEqual({
      stdout: "",
      stderr: "error: unexpected failure (EACCES)\n",
      exitCode: 2,
    });
    expect(result.stderr).not.toContain("someone");
    expect(result.stderr).not.toContain("notes.md");
  });

  it("falls back to the error name when there is no code", async () => {
    const result = await execute([], ENV, throwing(new TypeError(`bad path ${SECRET}`)));
    expect(result.stderr).toBe("error: unexpected failure (TypeError)\n");
    expect(result.exitCode).toBe(2);
  });

  it("handles a thrown value that is not an error", async () => {
    for (const value of [`oops ${SECRET}`, null, undefined, 42, {}]) {
      const result = await execute([], ENV, throwing(value));
      expect(result.stderr, String(value)).toBe("error: unexpected failure (unknown error)\n");
      expect(result.exitCode).toBe(2);
    }
  });

  it("shows control characters of a hostile code as visible escapes", async () => {
    const error = Object.assign(new Error("x"), { code: "E\u001b[2J" });
    expect((await execute([], ENV, throwing(error))).stderr).toBe(
      "error: unexpected failure (E\\x1b[2J)\n",
    );
  });

  it("covers a failure while reading the process (the environment thunk)", async () => {
    const result = await execute([], () => {
      throw Object.assign(new Error(`ENOENT: uv_cwd ${SECRET}`), { code: "ENOENT" });
    });
    expect(result.stderr).toBe("error: unexpected failure (ENOENT)\n");
    expect(result.exitCode).toBe(2);
  });

  it("passes a normal result through, with a plain environment or a thunk", async () => {
    const ok = { stdout: "out\n", stderr: "", exitCode: 0 } as const;
    expect(await execute(["a"], ENV, () => Promise.resolve(ok))).toEqual(ok);
    expect(
      await execute(
        ["a"],
        () => ENV,
        () => Promise.resolve(ok),
      ),
    ).toEqual(ok);
  });

  it("hands the argv and the environment to the runner", async () => {
    let seen: unknown = null;
    await execute(
      ["--x", "y"],
      () => ENV,
      (argv, env) => {
        seen = { argv, env };
        return Promise.resolve({ stdout: "", stderr: "", exitCode: 0 });
      },
    );
    expect(seen).toEqual({ argv: ["--x", "y"], env: ENV });
  });
});

describe("cli catch-all: through the real runCli", () => {
  it("an io factory that throws becomes exit 2 without its message", async () => {
    const cwd = fixtureFile("exit-pass-clean-project", ".");
    const run = await execute([], {
      cwd,
      boundary: cwd,
      home: "/home/test",
      isTty: false,
      noColor: false,
      version: "9.9.9",
      createIo: () => {
        throw Object.assign(new Error(`EPERM: operation not permitted, stat '${SECRET}'`), {
          code: "EPERM",
        });
      },
    });
    expect(run).toEqual({
      stdout: "",
      stderr: "error: unexpected failure (EPERM)\n",
      exitCode: 2,
    });
  });
});

describe("cli catch-all: failureReason", () => {
  it("prefers a non-empty code, then the name", () => {
    expect(failureReason(Object.assign(new Error("m"), { code: "EBUSY" }))).toBe("EBUSY");
    expect(failureReason(Object.assign(new RangeError("m"), { code: "" }))).toBe("RangeError");
    expect(failureReason(Object.assign(new Error("m"), { code: 12 }))).toBe("Error");
  });
});
