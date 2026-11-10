/**
 * Package version for `--version` and the report header. `package.json` sits two
 * directories above this file in the source tree (`src/cli`) and in the build
 * (`dist/cli`), so one relative URL serves both. A missing or unreadable file, bad JSON
 * or a `version` that is not a string gives `unknown`.
 */
import { readFileSync } from "node:fs";

const PACKAGE_JSON = new URL("../../package.json", import.meta.url);

export function readVersion(packageJson: URL = PACKAGE_JSON): string {
  try {
    const version = (JSON.parse(readFileSync(packageJson, "utf8")) as { version?: unknown })
      .version;
    return typeof version === "string" ? version : "unknown";
  } catch {
    return "unknown";
  }
}
