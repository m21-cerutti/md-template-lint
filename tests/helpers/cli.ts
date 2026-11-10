/**
 * Run the CLI function (`runCli`) inside a fixture project of `tests/fixtures/cli/`.
 * Config discovery stops at the fixture, the home directory is fake and the io is
 * the in-memory one, so a test never reads outside the fixture or touches the network.
 */
import { createMemoryIo, type RuleIo } from "../../src/engine/rule.js";
import type { RealIoOptions } from "../../src/io/index.js";
import { runCli, type CliEnv, type CliResult } from "../../src/cli/run.js";
import { foldPath } from "../../src/config/paths.js";
import { fixturePath } from "./fixtures.js";
import { HOME } from "./run.js";

export const VERSION = "9.9.9";

export interface CliRun extends CliResult {
  /** Options of every `createIo` call, in call order. */
  readonly ioCalls: readonly RealIoOptions[];
}

export async function runCliIn(
  fixture: string,
  args: readonly string[],
  env: Partial<CliEnv> = {},
): Promise<CliRun> {
  const cwd = foldPath(fixturePath("cli", fixture));
  const ioCalls: RealIoOptions[] = [];
  const createIo = (options: RealIoOptions): RuleIo => {
    ioCalls.push(options);
    return createMemoryIo();
  };
  const result = await runCli(args, {
    cwd,
    home: HOME,
    boundary: cwd,
    isTty: false,
    noColor: false,
    version: VERSION,
    createIo,
    ...env,
  });
  return { ...result, ioCalls };
}

/** The parts of the JSON document (spec 8.5) the CLI tests read. */
export interface JsonRun {
  readonly mode: string;
  readonly config: string | null;
  readonly results: readonly {
    readonly root: string;
    readonly pair: string;
    readonly files: readonly { readonly path: string; readonly status: string }[];
  }[];
  readonly templates?: readonly {
    readonly path: string;
    readonly status: string;
    readonly filenameCase: string | null;
    readonly fields: readonly {
      readonly name: string;
      readonly type: string;
      readonly rules: readonly string[];
    }[];
    readonly headings: readonly {
      readonly level: number;
      readonly text: string;
      readonly rules: readonly string[];
    }[];
    readonly diagnostics: readonly { readonly code: string; readonly line?: number }[];
  }[];
  readonly runErrors: readonly { readonly code: string; readonly message: string }[];
  readonly runWarnings: readonly { readonly code: string }[];
  readonly unmatched: readonly string[];
  readonly summary: Readonly<Record<string, number>>;
}

export const parseJson = (stdout: string): JsonRun => JSON.parse(stdout) as JsonRun;

/** `root:pair:path` of every linted file of a JSON run, in output order. */
export const lintedOf = (json: JsonRun): string[] =>
  json.results.flatMap((block) =>
    block.files.map((file) => `${block.root}:${block.pair}:${file.path}`),
  );

/** Absolute, `/`-separated path of a file inside a fixture. */
export const fixtureFile = (fixture: string, file: string): string =>
  foldPath(`${fixturePath("cli", fixture)}/${file}`);
