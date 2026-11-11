import type { UserConfig } from "@commitlint/types";
import { RuleConfigSeverity } from "@commitlint/types";

const Configuration: UserConfig = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Default list minus "ci": the repo records CI changes as "build" (see git log).
    "type-enum": [RuleConfigSeverity.Error, "always", ["feat", "fix", "docs", "style", "refactor", "test", "chore", "perf", "build", "revert"]],
    "type-case": [RuleConfigSeverity.Error, "always", "lower-case"],
    "type-empty": [RuleConfigSeverity.Error, "never"],

    "scope-case": [RuleConfigSeverity.Error, "always", "lower-case"],
    // Warning only: many repo commits have no scope (for example "docs: ...", "chore: ...").
    "scope-empty": [RuleConfigSeverity.Warning, "never"],

    "subject-empty": [RuleConfigSeverity.Error, "never"],
    // Default: forbids sentence/start/pascal/upper case but allows identifiers such as MTL101, SECRET~1, printWidth.
    "subject-case": [RuleConfigSeverity.Error, "never", ["sentence-case", "start-case", "pascal-case", "upper-case"]],
    "subject-full-stop": [RuleConfigSeverity.Error, "never", "."],

    // Stricter than the default 100: keeps git log --oneline readable.
    "header-max-length": [RuleConfigSeverity.Error, "always", 72],
    // Disabled: the default minimum is 0, so the rule has nothing to check.
    "header-min-length": [RuleConfigSeverity.Disabled],

    // Warning only: a missing blank line is a style slip, not a reason to block the commit.
    "body-leading-blank": [RuleConfigSeverity.Warning, "always"],
    // Same as the default; stated so the limit is visible in this file.
    "body-max-line-length": [RuleConfigSeverity.Error, "always", 100],
    // Disabled: a subject-only commit is valid.
    "body-empty": [RuleConfigSeverity.Disabled],

    // Warning only: same reason as body-leading-blank.
    "footer-leading-blank": [RuleConfigSeverity.Warning, "always"],
    // Same as the default; stated so the limit is visible in this file.
    "footer-max-line-length": [RuleConfigSeverity.Error, "always", 100],
  },

  // Work-in-progress commits are allowed; git merge/revert messages are covered by defaultIgnores.
  ignores: [(message: string) => message.toLowerCase().startsWith("wip")],

  defaultIgnores: true,
};

export default Configuration;
