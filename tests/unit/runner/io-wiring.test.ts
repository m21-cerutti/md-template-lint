/**
 * Runner: the io handle given to the rules (docs/spec.md 2.8, D11). The runner builds the
 * RuleEnv of each pair: relative values resolve against the ROOT of the pair, aliases
 * and approved paths come from the config. An injected io records every probe, so the
 * test sees exactly what is asked of the file system. Fixture:
 * tests/fixtures/runner/io-wiring/ (no pass/fail split: one project, one run).
 */
import { describe, expect, it } from "vitest";
import { foldPath } from "../../../src/config/paths.js";
import type { RuleIo } from "../../../src/engine/rule.js";
import { fixtureDirs, fixturePath } from "../../helpers/fixtures.js";
import { runFixture } from "../../helpers/run.js";

describe("runner io wiring", () => {
  it("has the one fixture directory", () => {
    expect(fixtureDirs("runner", "io-")).toEqual(["io-wiring"]);
  });

  it("probes relative values at the pair root, aliases and approved paths from the config", async () => {
    const asked: string[] = [];
    const io: RuleIo = {
      exists: (path) => {
        asked.push(path);
        return Promise.resolve(false);
      },
      probeUrl: () => Promise.reject(new Error("no URL field in this fixture")),
    };
    const result = await runFixture("io-wiring", { io });
    const project = foldPath(fixturePath("runner", "io-wiring"));
    const other = `${project}/other`;

    // Per file, in template field order: local, aliased, (unlisted: not asked), approved,
    // (elsewhere: not asked). The alias directory is a config path, not a root path.
    expect(asked).toEqual([
      `${project}/img/a.png`,
      `${project}/assets/logo.png`,
      "/srv/approved/x.png",
      `${other}/img/a.png`,
      `${project}/assets/logo.png`,
      "/srv/approved/x.png",
    ]);

    const blocks = result.blocks.flatMap((block) => (block.kind === "pair" ? [block] : []));
    expect(blocks.map((block) => block.root)).toEqual(["project", "other"]);
    const warnings = blocks.map((block) =>
      (block.files[0]?.warnings ?? []).map((warning) => [warning.code, warning.message]),
    );
    const expected = (root: string) => [
      ["MTL804", `Field 'local': path 'img/a.png' does not exist (resolved: ${root}/img/a.png)`],
      [
        "MTL802",
        `Field 'aliased': aliased path '@assets/logo.png' resolved to ${project}/assets/logo.png — does not exist`,
      ],
      ["MTL801", "Field 'unlisted': alias '@nope/...' has no entry in config aliases, not checked"],
      [
        "MTL804",
        "Field 'approved': path '/srv/approved/x.png' does not exist (resolved: /srv/approved/x.png)",
      ],
      [
        "MTL803",
        "Field 'elsewhere': absolute path '/srv/other/y.png' skipped by [io:exists] (not checked); add it under approvedPaths in the config",
      ],
    ];
    expect(warnings).toEqual([expected(project), expected(other)]);
    // Every finding of [io:exists] is a warning: the run stays clean (spec 2.8).
    expect(result.summary).toMatchObject({ files: 2, failed: 0, warnings: 10, exitCode: 0 });
  });
});
