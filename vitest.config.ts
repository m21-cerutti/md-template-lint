import { configDefaults, defineConfig } from "vitest/config";

const MINIMUM = { lines: 85, statements: 85, functions: 85, branches: 85 };

export default defineConfig({
  test: {
    // tmp/ is scratch space: never run it.
    exclude: [...configDefaults.exclude, "tmp/**"],
    coverage: {
      provider: "v8",
      include: ["src/**"],
      // Generated parser; the CLI entry is only reached through a child process (invisible to v8).
      exclude: ["src/generated/**", "src/cli.ts"],
      reporter: ["text", "json-summary"],
      // Thresholds apply per glob. src/tags is checked twice so the visitors cannot hide a weak parser.
      thresholds: {
        "src/engine/**": MINIMUM,
        "src/rules/**": MINIMUM,
        "src/tags/**": MINIMUM,
        "src/tags/*.ts": MINIMUM,
      },
    },
  },
});
