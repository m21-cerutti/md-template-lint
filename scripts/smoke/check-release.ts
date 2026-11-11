/**
 * Usage: tsx scripts/smoke/check-release.ts <tag> <owner>/<name>
 * Release guard (phase A30): verifies tag is v<version> and repository.url matches.
 * Provenance requires both to agree. Exit code: 0 ok, 1 check failed, 2 usage error.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { checkRelease } from "./helpers.ts";

const [tag, repository, ...extra] = process.argv.slice(2);
if (tag === undefined || repository === undefined || extra.length > 0) {
  process.stderr.write("usage: tsx scripts/smoke/check-release.ts <tag> <owner>/<name>\n");
  process.exitCode = 2;
} else {
  try {
    const manifest = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as unknown;
    const problems = checkRelease(manifest, tag, repository);
    for (const problem of problems) process.stderr.write(`FAIL ${problem}\n`);
    if (problems.length === 0) process.stdout.write(`ok   tag ${tag} and repository ${repository}\n`);
    process.exitCode = problems.length === 0 ? 0 : 1;
  } catch (error) {
    process.stderr.write(`check-release: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 2;
  }
}
