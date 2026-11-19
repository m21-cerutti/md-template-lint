/**
 * Characterization of `matchHeadings` on large synthetic documents (A4 of the perf plan,
 * tmp/PLAN_perf-bench.md, target M1). The expected values were produced by the code at the time of
 * writing, not derived from the spec: they pin the whole match output (every entry, every run, every
 * position) so a performance change (memoizing the match, indexing the runs) cannot change it.
 * Semantics of runs and positions are tested by tests/unit/engine/heading-run.test.ts.
 *
 * Pairs: the 600-heading book template against five generated targets, and the small wide template
 * against a 5308-heading target (tests/helpers/large-docs.ts).
 *
 * Projection: one tuple per entry, `[index, scope, instance, checked, match line, mismatch line,
 * parent match line, set-aside line, run number]`, and one view per DISTINCT run (numbered in order of
 * first use), `[level, scope, parent, parent match line, siblings, set aside, tail lines, positions]`
 * with `positions` `[index, match line, instances, mismatch line, next line, found-later line,
 * repeat-miss lines]`. The digest covers both lists; the counts, the first entries, the first and last run and the first position with a mismatch, a found-later hint and a repeat miss are inline.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { loadDocument } from "../../../src/engine/load.js";
import { matchHeadings, type DocumentModel, type HeadingMatch, type HeadingRun, type Section } from "../../../src/engine/model.js";
import { digestOf } from "../../helpers/characterize.js";
import { bookTarget, bookTemplate, wideTarget, wideTemplate } from "../../helpers/large-docs.js";

type Entry = readonly [index: number, scope: string, instance: number, checked: boolean, match: number | null, mismatch: number | null, parentMatch: number | null, setAside: number | null, run: number];
type RunView = readonly [level: number, scope: string, parent: number | null, parentMatch: number | null, siblings: number, setAside: number, tail: readonly number[], positions: readonly (readonly (number | readonly number[] | null)[])[]];

interface Projection {
  readonly entries: readonly Entry[];
  readonly runs: readonly RunView[];
  /** Distinct run objects, in order of first use (the identity the rules rely on inside one array). */
  readonly runObjects: readonly HeadingRun[];
}

const line = (section: Section): number => section.line;

function project(items: readonly HeadingMatch[]): Projection {
  const runObjects: HeadingRun[] = [];
  const entries = items.map((item): Entry => {
    let run = -1;
    if (item.run !== null) {
      run = runObjects.indexOf(item.run);
      if (run < 0) run = runObjects.push(item.run) - 1;
    }
    return [item.index, item.scope, item.instance, item.checked, item.match?.line ?? null, item.mismatch?.line ?? null, item.parentMatch?.line ?? null, item.setAside?.line ?? null, run];
  });
  const runs = runObjects.map((run): RunView => [
    run.level,
    run.scope,
    run.parent,
    run.parentMatch?.line ?? null,
    run.siblings.length,
    run.setAside.length,
    run.tail.map(line),
    run.positions.map((position) => [position.index, position.match?.line ?? null, position.instances.length, position.mismatch?.line ?? null, position.next?.line ?? null, position.foundLater?.line ?? null, position.repeatMisses.map(line)]),
  ]);
  return { entries, runs, runObjects };
}

function modelOf(text: string): DocumentModel {
  const loaded = loadDocument(text);
  if (!loaded.ok) throw new Error(`load failed: ${loaded.failure.reason}`);
  return loaded.model;
}

/** A position view: `[index, match line, instances, mismatch line, next line, found-later line, repeat-miss lines]`. */
type PositionView = readonly (number | readonly number[] | null)[];
/** `[run number, position view]` of the first position of the first run that has the feature; null when none has. */
type Spot = readonly [run: number, position: PositionView] | null;

interface Spots {
  /** The first and the last run, whole. */
  readonly first: RunView;
  readonly last: RunView;
  /** A position that took a mismatch (MTL606), one with a found-later hint (MTL601), one with repeat misses (MTL614). */
  readonly mismatch: Spot;
  readonly foundLater: Spot;
  readonly repeatMiss: Spot;
}

interface Pin {
  readonly targetSections: number;
  readonly entries: number;
  readonly checked: number;
  readonly matched: number;
  readonly runs: number;
  readonly head: readonly Entry[];
  readonly spots: Spots;
  readonly digest: string;
}

/** The first position, over the runs in order, for which `test` holds. */
function spotOf(runs: readonly RunView[], test: (position: PositionView) => boolean): Spot {
  for (const [number, run] of runs.entries()) {
    const position = run[7].find(test);
    if (position !== undefined) return [number, position];
  }
  return null;
}

function spotsOf(runs: readonly RunView[]): Spots {
  const first = runs[0];
  const last = runs[runs.length - 1];
  if (first === undefined || last === undefined) throw new Error("no run");
  return {
    first,
    last,
    mismatch: spotOf(runs, (position) => position[3] !== null),
    foundLater: spotOf(runs, (position) => position[5] !== null),
    repeatMiss: spotOf(runs, (position) => (position[6] as readonly number[]).length > 0),
  };
}

function pinOf(template: DocumentModel, target: DocumentModel): Pin {
  const { entries, runs } = project(matchHeadings(template, target));
  return {
    targetSections: target.sections.length,
    entries: entries.length,
    checked: entries.filter((entry) => entry[3]).length,
    matched: entries.filter((entry) => entry[4] !== null).length,
    runs: runs.length,
    head: entries.slice(0, 3),
    spots: spotsOf(runs),
    digest: digestOf({ entries, runs }),
  };
}

const NO_SPOT = { mismatch: null, foundLater: null, repeatMiss: null } as const;

const BOOK_PINS: readonly Pin[] = [
  {
    targetSections: 514,
    entries: 704,
    checked: 696,
    matched: 514,
    runs: 319,
    head: [
      [0, "file", 0, true, 6, null, null, null, 0],
      [1, "file", 0, true, 8, null, null, null, 1],
      [2, "file", 0, true, 10, null, null, null, 1],
    ],
    spots: { first: [1, "file", null, null, 1, 0, [], [[0, 6, 1, null, 6, null, []]]], last: [4, "section", 592, 807, 0, 0, [], [[593, null, 0, null, null, null, []]]], ...NO_SPOT },
    digest: "827cff3cda7849897c5328e77bbd3f8a",
  },
  {
    targetSections: 501,
    entries: 696,
    checked: 685,
    matched: 501,
    runs: 312,
    head: [
      [0, "file", 0, true, 6, null, null, null, 0],
      [1, "file", 0, true, 8, null, null, null, 1],
      [2, "file", 0, true, 10, null, null, null, 1],
    ],
    spots: { first: [1, "file", null, null, 1, 0, [], [[0, 6, 1, null, 6, null, []]]], last: [4, "section", 592, 787, 0, 0, [], [[593, null, 0, null, null, null, []]]], ...NO_SPOT },
    digest: "06ef17134fd2792e0568aeee393adcb6",
  },
  {
    targetSections: 517,
    entries: 714,
    checked: 696,
    matched: 496,
    runs: 311,
    head: [
      [0, "file", 0, true, 7, null, null, null, 0],
      [1, "file", 0, true, 9, null, null, null, 1],
      [2, "file", 0, true, 11, null, null, null, 1],
    ],
    spots: {
      first: [1, "file", null, null, 1, 0, [], [[0, 7, 1, null, 7, null, []]]],
      last: [4, "section", 592, 813, 1, 0, [], [[593, 815, 1, null, 815, null, []]]],
      mismatch: [14, [32, null, 0, 57, 57, null, []]],
      foundLater: [21, [45, null, 0, null, 72, 74, []]],
      repeatMiss: [21, [42, null, 0, null, 71, null, [72]]],
    },
    digest: "d1d4117395bef0376ae5b744eb109ee5",
  },
  {
    targetSections: 490,
    entries: 696,
    checked: 660,
    matched: 456,
    runs: 286,
    head: [
      [0, "file", 0, true, 8, null, null, null, 0],
      [1, "file", 0, true, 10, null, null, null, 1],
      [2, "file", 0, true, 12, null, null, null, 1],
    ],
    spots: {
      first: [1, "file", null, null, 1, 0, [], [[0, 8, 1, null, 8, null, []]]],
      last: [4, "section", 592, 768, 0, 0, [], [[593, null, 0, null, null, null, []]]],
      mismatch: [106, [221, null, 0, 280, 280, null, [286, 288, 291]]],
      foundLater: [106, [217, null, 0, null, 280, 282, []]],
      repeatMiss: [106, [221, null, 0, 280, 280, null, [286, 288, 291]]],
    },
    digest: "7a46370bfe35e075a26d06586f2a274c",
  },
  {
    targetSections: 507,
    entries: 682,
    checked: 601,
    matched: 368,
    runs: 232,
    head: [
      [0, "file", 0, true, 8, null, null, null, 0],
      [1, "file", 0, true, 6, null, null, null, 1],
      [2, "file", 0, true, 10, null, null, null, 1],
    ],
    spots: {
      first: [1, "file", null, null, 1, 0, [], [[0, 8, 1, null, 8, null, []]]],
      last: [4, "section", 592, 792, 1, 0, [], [[593, 794, 1, null, 794, null, []]]],
      mismatch: [2, [7, 16, 3, 12, 12, null, []]],
      foundLater: [21, [48, null, 0, null, 74, 76, []]],
      repeatMiss: [21, [52, null, 0, 74, 74, null, [80, 82, 85]]],
    },
    digest: "eb275fba279eb7e60fbadcbbbdd5a5bd",
  },
];

const WIDE_PIN: Pin = {
  targetSections: 5308,
  entries: 7875,
  checked: 7620,
  matched: 5097,
  runs: 3557,
  head: [
    [0, "file", 0, true, 4, null, null, null, 0],
    [1, "file", 0, true, 6, null, null, null, 1],
    [2, "section", 0, true, 9, null, 6, null, 2],
  ],
  spots: {
    first: [1, "file", null, null, 1, 0, [], [[0, 4, 1, null, 4, null, []]]],
    last: [5, "section", 12, 5617, 0, 0, [], [[13, null, 0, null, null, null, []]]],
    mismatch: [254, [15, null, 0, 153, 153, null, []]],
    foundLater: [273, [9, null, 0, null, 548, 549, []]],
    repeatMiss: [1, [16, 5619, 2, null, 5619, null, [5622]]],
  },
  digest: "8ee43ff6f88113cb02319bf3b27bfe5a",
};

/** Entries with the same level, scope, parent and parent match share ONE run object, and only they do. */
function expectRunsShared(items: readonly HeadingMatch[]): void {
  const byKey = new Map<string, HeadingRun>();
  for (const item of items) {
    if (item.run === null) continue;
    const key = `${item.run.level}:${item.run.scope}:${item.run.parent ?? "file"}:${item.run.parentMatch?.line ?? 0}`;
    const known = byKey.get(key);
    if (known === undefined) byKey.set(key, item.run);
    else expect(item.run).toBe(known);
  }
  expect(new Set(byKey.values()).size).toBe(byKey.size);
  expect(new Set(items.flatMap((item) => (item.run === null ? [] : [item.run]))).size).toBe(byKey.size);
}

describe("M1: matchHeadings on the 600-heading book template", () => {
  let template: DocumentModel;
  beforeAll(() => {
    template = modelOf(bookTemplate());
  }, 60_000);

  it.each([0, 1, 2, 3, 4])(
    "target of fault level %i: the same entries, runs and positions",
    (level) => {
      const target = modelOf(bookTarget(level, 1));
      expect(pinOf(template, target)).toEqual(BOOK_PINS[level]);
    },
    30_000,
  );

  it("a second call on the same pair returns an equal, equally shared result", () => {
    const target = modelOf(bookTarget(3, 1));
    const first = matchHeadings(template, target);
    const second = matchHeadings(template, target);
    const left = project(first);
    const right = project(second);
    expect(right.entries).toEqual(left.entries);
    expect(right.runs).toEqual(left.runs);
    expectRunsShared(first);
    expectRunsShared(second);
  }, 30_000);

  it("the conforming target matches every checked heading but the template-only and invalid-pattern ones, in template order", () => {
    const items = matchHeadings(template, modelOf(bookTarget(0, 1)));
    // 600 template headings; the repeated and optional ones give entries per instance or per parent entry.
    expect(items.map((item) => item.index)).toEqual([...items.map((item) => item.index)].sort((a, b) => a - b));
    const unchecked = items.filter((item) => !item.checked).map((item) => template.sections[item.index]?.text);
    expect(new Set(unchecked)).toEqual(new Set(["Broken"]));
    const draft = items.filter((item) => template.sections[item.index]?.text === "Draft");
    expect(draft.every((item) => item.match === null && item.setAside === null)).toBe(true);
  }, 30_000);
});

describe("M1: matchHeadings on the 5308-heading wide target", () => {
  let template: DocumentModel;
  let target: DocumentModel;
  let items: readonly HeadingMatch[];
  beforeAll(() => {
    template = modelOf(wideTemplate());
    target = modelOf(wideTarget(250));
    items = matchHeadings(template, target);
  }, 60_000);

  it("the same entries, runs and positions", () => {
    expect(pinOf(template, target)).toEqual(WIDE_PIN);
  }, 60_000);

  it("a second call returns an equal result; runs are shared per level, scope and parent match", () => {
    const again = matchHeadings(template, target);
    expect(project(again).entries).toEqual(project(items).entries);
    expect(digestOf(project(again).runs)).toBe(digestOf(project(items).runs));
    expectRunsShared(items);
    expectRunsShared(again);
  }, 60_000);

  it("the repeat parent has one entry per instance, and its children one entry set per parent entry", () => {
    const parts = items.filter((item) => template.sections[item.index]?.text === "Part");
    expect(parts).toHaveLength(250);
    expect(parts.map((item) => item.instance)).toEqual(Array.from({ length: 250 }, (_, index) => index));
    const alphas = items.filter((item) => template.sections[item.index]?.text === "Alpha" && item.scope === "section");
    // The guide and every part carry an `Alpha` entry (a template `Alpha` per parent).
    expect(alphas).toHaveLength(251);
  }, 30_000);
});
