// lint-staged config, run by .husky/pre-commit.
// One function config: commands run in order, formatters first, then checkers.
// Paths ignored by .prettierignore are filtered here so no tool sees them.
import { relative } from "node:path";

const IGNORED = [/^src\/generated\//, /^tests\/fixtures\//, /^docs\/syntax-reference\.md$/, /^docs\/proposals\//];

const rel = (file: string): string => relative(process.cwd(), file).replaceAll("\\", "/");
const args = (files: string[]): string => files.map((file) => `"${file}"`).join(" ");

// Names are wrapped in "..." and lint-staged splits the command string again, so a name with a
// double quote or a leading dash could inject options into a tool: refuse it before any command is built.
const assertSafe = (files: string[]): void => {
  const bad = files.find((file) => file.includes('"') || file.startsWith("-"));
  if (bad !== undefined) {
    throw new Error(`refusing file name that could be read as an option: ${bad}; rename it`);
  }
};

export default (staged: string[]): string[] => {
  const all = staged.map(rel);
  assertSafe(all);
  const kept = all.filter((file) => !IGNORED.some((re) => re.test(file)));
  const withExt = (pattern: RegExp): string[] => kept.filter((file) => pattern.test(file));

  const formattable = withExt(/\.(ts|mts|cts|md|json|jsonc|ya?ml)$/);
  const scripts = withExt(/\.(ts|mts|cts)$/);
  const markdown = withExt(/\.md$/);

  return [
    // formatters
    ...(formattable.length > 0 ? [`prettier --write ${args(formattable)}`] : []),
    ...(scripts.length > 0 ? [`eslint --fix --no-warn-ignored ${args(scripts)}`] : []),
    // checkers: secretlint reads .secretlintignore itself, so it gets every staged file
    ...(all.length > 0 ? [`secretlint ${args(all)}`] : []),
    // project-wide, one run, staged names are not passed
    ...(all.length > 0 ? ["ls-lint"] : []),
    ...(markdown.length > 0 ? [`markdownlint-cli2 ${args(markdown)}`, `node dist/cli.js --quiet ${args(markdown)}`] : []),
  ];
};
