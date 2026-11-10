// Release guard (phase A30), run by .github/workflows/release.yml on a tag push:
//
//   tsx scripts/smoke/check-release.ts <tag> <owner>/<name>
//
// Reads package.json in the working directory. Fails when the tag is not `v<version>` or when
// `repository.url` is not this repository (provenance needs both to agree). The rules are in
// scripts/smoke/helpers.ts (checkRelease, unit tested).
// Exit code: 0 ok, 1 a check failed, 2 usage or unreadable package.json.
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
