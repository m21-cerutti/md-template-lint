/**
 * Characterization of `analyzeDocument` on large generated documents (A4 of the perf plan,
 * tmp/PLAN_perf-bench.md, target G1): the whole AST (frontmatter lines and their comment tags, body
 * blocks and heading tags, directives, tag findings) and the grammar errors. The expected values were
 * produced by the code at the time of writing, not derived from the spec: a change of the parse
 * strategy (for example a two-stage ANTLR prediction) must not change one node, one position or one
 * finding. The small tag cases are tested by tests/unit/tags/tags.test.ts and its neighbours.
 *
 * Each document is pinned by readable counts (blocks, tags per kind, findings per reason), its first and
 * last directives and findings, and a digest of the WHOLE analysis (every node and position, as JSON).
 * The generator is `kitchenSink` below; it uses every field tag kind and every heading tag kind
 * (checked by the first test), fences with directives and tags inside them, directive comments of every
 * verb, and malformed, unknown and misplaced tags.
 */
import { describe, expect, it } from "vitest";
import { BODY_TAG_KINDS, FRONTMATTER_TAG_KINDS } from "../../../src/tags/ast.js";
import { analyzeDocument, normalizeLineEnds } from "../../../src/tags/parser.js";
import { digestOf } from "../../helpers/characterize.js";
import { bookTarget, bookTemplate, wideTarget, wideTemplate } from "../../helpers/large-docs.js";

/** Comment of one frontmatter key, by key number: every field tag, type hints, malformed and unknown tags. */
const KEY_COMMENTS = [
  "# [presence:optional]",
  "# [presence:conditional:when set]",
  "# [format:constant:abc]",
  "# [format:snake_case]",
  "# [format:kebab-case]",
  "# [format:elements:snake_case]",
  "# [format:elements:kebab-case]",
  "# [format:semver]",
  "# [format:date]",
  "# [format:elements:semver]",
  "# [format:elements:date]",
  "# [format:scheme:https,http]",
  "# [value:filename]",
  "# [count:min:1] [count:max:5]",
  "# [range:min:1] [range:max:5] [int]",
  "# [order:ascending]",
  "# [io:exists]",
  "# [date] [url] [path]",
  "# [filename:case:kebab-case]",
  "# [unique-headings-names]",
  "# [frontmatter:optional]",
  "# [count:min:abc]",
  "# [bogus]",
  "# [content:table]",
  "# [presence:",
  "# md-template-lint disable-line MTL201",
  "# plain comment",
  "",
] as const;

/** One body block (heading, fence, table, list, comment, text) by block number: tags, directives, faults. */
function bodyBlock(index: number): string[] {
  const n = index;
  switch (index % 28) {
    case 0:
      return [`# Title ${n} [presence:optional] [unique-headings-names]`];
    case 1:
      return [`## Section ${n} [presence:conditional:when set] [content:non-empty]`, "Some text."];
    case 2:
      return [`### Item ${n} [pattern:"Item {digits}"] [repeat-rules:same-level:min:2] [order:first:number:ascending]`];
    case 3:
      return [`#### Rel ${n} [pattern:"v{semver}"] [repeat-rules:same-level:max:5] [order:descending]`];
    case 4:
      return [`##### Note ${n} [presence:template-only] [content:table] [content:list]`];
    case 5:
      return [`###### Deep ${n} [content:min-lines:2] [content:max-lines:9] [content:subheadings:disallow] [content:subheadings:no-extra]`];
    case 6:
      return [`## Dated ${n} [pattern:"{date} - {text}"] [order:first:date:ascending]`, "<!-- md-template-lint disable-line MTL601 -->"];
    case 7:
      return [`## Count ${n} [count:min:abc]`, `### Unknown ${n} [bogus:tag] [content:]`];
    case 8:
      return [`## Bad ${n} [pattern:"{bogus}"] [presence:`, `## Open ${n} [pattern:"unterminated]`];
    case 9:
      return ["```md", `## In fence ${n} [presence:optional]`, "<!-- md-template-lint disable-line MTL601 -->", "```"];
    case 10:
      return ["~~~~", "```", `### Tilde ${n}`, "~~~~"];
    case 11:
      return ["| a | b |", "|---|---|", `| ${n} | x |`];
    case 12:
      return [`- item ${n}`, `  - nested [presence:optional]`, `* other`];
    case 13:
      return [`<!-- md-template-lint disable-next-line MTL601, MTL605 -- reason ${n} -->`, `## Next ${n}`];
    case 14:
      return [`<!-- md-template-lint begin disable MTL606 -->`, `## Inside ${n}`, `<!-- md-template-lint end disable -->`];
    case 15:
      return ["<!-- md-template-lint disable-file MTL999 -->", "<!-- md-template-lint disabel MTL601 -->"];
    case 16:
      return ["`<!-- md-template-lint disable-line MTL601 -->` in a code span", "<!-- plain note -->"];
    case 17:
      return [`## Wrong ${n} [format:semver] [io:exists] [filename:case:snake_case]`];
    case 18:
      return [`## Emoji ${n} 🎉 𝒜 [presence:optional]`, `Text with é and 🙂`];
    case 19:
      return [`## Spaced ${n}   [presence:optional]   [content:list]   <!-- md-template-lint disable-line MTL601 -->`];
    case 20:
      return [`## Bare ${n}`, ""];
    case 21:
      return [`##    Wide ${n}    `, `#NoSpace ${n}`, `####### Seven ${n}`];
    case 22:
      return [`## Esc ${n} [pattern:"Say \\"{text}\\" {{x}}"]`];
    case 23:
      return ["<!-- md-template-lint disable-line", "MTL601 -->", "<!-- md-template-lint disable-line MTL601 --> trailing"];
    case 24:
      return [`## Order ${n} [order:ascending] [order:first:semver:descending]`];
    case 25:
      return ["---", `Text after a rule ${n}`];
    case 26:
      return [`    ## Indented ${n}`, `\t## Tabbed ${n}`];
    default:
      return [`Plain paragraph ${n}.`, ""];
  }
}

/** A document with `keys` frontmatter keys and `blocks` body blocks, every construct above in turn. */
function kitchenSink(keys: number, blocks: number, closed = true): string {
  const lines = ["---", "# [filename:case:snake_case]", "# [unique-headings-names]", "# [frontmatter:optional]", "# md-template-lint disable-file MTL202"];
  for (let key = 0; key < keys; key += 1) {
    const comment = KEY_COMMENTS[key % KEY_COMMENTS.length] ?? "";
    lines.push(`key${key}: value${key}${comment === "" ? "" : ` ${comment}`}`);
    if (key % 11 === 5) lines.push(`# standalone comment ${key} [presence:optional]`);
    if (key % 13 === 7) lines.push(`block${key}: |`, "  # [presence:optional] inside a value", "  text # md-template-lint disable-line MTL201");
    if (key % 17 === 9) lines.push(`flow${key}: [a, b, # not a comment`, "  c]");
  }
  lines.push("# [frontmatter:optional]", "# [filename:case:PascalCase]");
  if (closed) lines.push("---");
  for (let block = 0; block < blocks; block += 1) lines.push(...bodyBlock(block));
  return `${lines.join("\n")}\n`;
}

/** Pathological inputs: the parse must give the same tree, the same findings and no grammar error. */
const ODD_INPUTS: Readonly<Record<string, string>> = {
  empty: "",
  "only newline": "\n",
  "nul in value": "---\na: \u0000x\n---\n# h\n",
  bom: "\ufeff---\na: x\n---\n# h\n",
  "unclosed frontmatter": "---\na: x\n# h\n",
  "tab key": '---\n\ta: x\n---\n# h [pattern:"x\n',
  "open brackets": '---\na: x # [presence:\n---\n## h [pattern:"{text" [\n',
  "control characters": "\u0007\u001b[31m\n",
  "lone surrogate": "---\na: \ud800\n---\n# h\n",
  "5000 open brackets": `# ${"[".repeat(5000)}\n`,
  "empty frontmatter": "---\n---\n# h\n",
  "directive in fence": "```\n<!-- md-template-lint disable-line MTL001 -->\n",
  crlf: "---\r\na: x\r\n---\r\n# h\r\n",
  "empty arguments": '---\na: x\n---\n## h [pattern:"{text:format:}"] [order:] [repeat-rules:same-level:min:] [content:] [presence:]\n',
  "malformed comment lines": "---\n# [filename:case:]\n# [unique-headings-names:x]\n# [frontmatter:optional:y]\n---\n",
  "nested fences": "~~~~\n```\n~~~~\n### x\n",
  "no final newline": "---\na: x\n---\n## h [presence:optional]",
};

interface Row {
  readonly [index: number]: unknown;
}

const countBy = (values: readonly string[]): Record<string, number> => {
  const counts: Record<string, number> = {};
  for (const value of values) counts[value] = (counts[value] ?? 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
};

/** The analysis of a text, parsed once: a large document costs seconds to parse (more under coverage). */
const analyses = new Map<string, ReturnType<typeof analyzeDocument>>();
function analyze(text: string): ReturnType<typeof analyzeDocument> {
  let known = analyses.get(text);
  if (known === undefined) {
    known = analyzeDocument(text);
    analyses.set(text, known);
  }
  return known;
}

/** What a test pins of one analysis. */
function summarize(text: string) {
  const analysis = analyze(text);
  const document = analysis.document;
  const frontmatter = document?.frontmatter ?? null;
  const headings = (document?.body ?? []).flatMap((block) => (block.kind === "heading" ? [block] : []));
  const fieldTags = (frontmatter?.lines ?? []).flatMap((line) => (line.kind === "key" ? [...(line.comment?.tags ?? []), ...(line.comment?.inertTags ?? [])] : []));
  const directives: Row[] = (document?.directives ?? []).map((directive) => [directive.region, directive.line, directive.position.column, directive.raw, directive.verb]);
  const findings: Row[] = analysis.findings.map((finding) => [finding.region, finding.reason, finding.tag, finding.position.line, finding.position.column, finding.offending]);
  return {
    document: document === null ? null : { unclosed: document.frontmatterUnclosed, blocks: document.body.length },
    grammarErrors: analysis.grammarErrors.length,
    frontmatter:
      frontmatter === null
        ? null
        : {
            startLine: frontmatter.startLine,
            endLine: frontmatter.endLine,
            lineKinds: countBy(frontmatter.lines.map((line) => line.kind)),
            filename: frontmatter.filename?.convention ?? null,
            uniqueHeadingNames: frontmatter.uniqueHeadingNames,
            frontmatterOptional: frontmatter.frontmatterOptional,
            optionalTags: frontmatter.optionalTags.length,
          },
    blockKinds: countBy((document?.body ?? []).map((block) => block.kind)),
    headingLevels: countBy(headings.map((heading) => String(heading.level))),
    headingTags: countBy(headings.flatMap((heading) => heading.tags.map((tag) => tag.kind))),
    fieldTags: countBy(fieldTags.map((tag) => tag.kind)),
    directives: { count: directives.length, verbs: countBy(directives.map((row) => String(row[4]))), head: directives.slice(0, 3), tail: directives.slice(-2) },
    findings: { count: findings.length, reasons: countBy(findings.map((row) => String(row[1]))), head: findings.slice(0, 3), tail: findings.slice(-2) },
    digest: digestOf({ document, findings: analysis.findings, grammarErrors: analysis.grammarErrors }),
  };
}

const NO_DIRECTIVES = { count: 0, verbs: {}, head: [], tail: [] };
const NO_FINDINGS = { count: 0, reasons: {}, head: [], tail: [] };
const ONE_KEY = { startLine: 1, endLine: 5, lineKinds: { key: 3 }, filename: null, uniqueHeadingNames: false, frontmatterOptional: false, optionalTags: 0 };

const PINS: Readonly<Record<string, unknown>> = {
  sink: {
    document: { unclosed: false, blocks: 1000 },
    grammarErrors: 0,
    frontmatter: {
      startLine: 1,
      endLine: 210,
      lineKinds: { comment: 25, filename: 2, "frontmatter-optional": 2, key: 159, other: 19, "unique-names": 1 },
      filename: "snake_case",
      uniqueHeadingNames: true,
      frontmatterOptional: true,
      optionalTags: 7,
    },
    blockKinds: { blank: 40, fence: 40, heading: 400, "html-comment": 140, "list-item": 60, "table-row": 60, text: 260 },
    headingLevels: { "1": 20, "2": 280, "3": 40, "4": 20, "5": 20, "6": 20 },
    headingTags: { content: 120, "content-lines": 40, order: 100, pattern: 80, presence: 100, repeat: 40, "unique-names": 20 },
    fieldTags: {
      count: 10,
      "filename-case": 5,
      "format-case": 10,
      "format-constant": 5,
      "format-elements": 10,
      "format-elements-shape": 10,
      "format-scheme": 5,
      "format-shape": 10,
      "frontmatter-optional": 5,
      "io-exists": 5,
      "order-ascending": 5,
      presence: 10,
      range: 10,
      "unique-names": 5,
      "value-filename": 5,
    },
    directives: {
      count: 166,
      verbs: { "begin disable": 20, "disable-file": 21, "disable-line": 65, "disable-next-line": 20, "end disable": 20, null: 20 },
      head: [
        ["frontmatter", 5, 1, "# md-template-lint disable-file MTL202", "disable-file"],
        ["frontmatter", 41, 16, "# md-template-lint disable-line MTL201", "disable-line"],
        ["frontmatter", 82, 16, "# md-template-lint disable-line MTL201", "disable-line"],
      ],
      tail: [
        ["body", 1314, 56, "<!-- md-template-lint disable-line MTL601 -->", "disable-line"],
        ["body", 1323, 1, "<!-- md-template-lint disable-line MTL601 -->", "disable-line"],
      ],
    },
    findings: {
      count: 120,
      reasons: { malformed: 90, unknown: 5, "wrong-region": 25 },
      head: [
        ["frontmatter", "malformed", "[count:min:abc]", 37, 29, "abc"],
        ["frontmatter", "unknown", "[bogus]", 38, 18, "[bogus]"],
        ["frontmatter", "wrong-region", "[content:table]", 39, 18, "[content:table]"],
      ],
      tail: [
        ["body", "malformed", '[pattern:"unterminated]', 1287, 36, "<EOF>"],
        ["body", "wrong-region", "[filename:case:snake_case]", 1311, 42, "[filename:case:snake_case]"],
      ],
    },
    digest: "deb279c6bb0fff713be646d21737a925",
  },
  "sink unclosed": {
    document: { unclosed: true, blocks: 0 },
    grammarErrors: 0,
    frontmatter: null,
    blockKinds: {},
    headingLevels: {},
    headingTags: {},
    fieldTags: {},
    directives: NO_DIRECTIVES,
    findings: NO_FINDINGS,
    digest: "a520f5af35acc30bd9447b95c38f1326",
  },
  "book template (600 headings)": {
    document: { unclosed: false, blocks: 600 },
    grammarErrors: 0,
    frontmatter: ONE_KEY,
    blockKinds: { heading: 600 },
    headingLevels: { "1": 1, "2": 55, "3": 332, "4": 106, "5": 53, "6": 53 },
    headingTags: { content: 106, order: 53, pattern: 167, presence: 272, repeat: 106 },
    fieldTags: { "format-shape": 1, presence: 1 },
    directives: NO_DIRECTIVES,
    findings: NO_FINDINGS,
    digest: "8221c34e7c1d4b2530baea789ede39ce",
  },
  "book target, fault level 0": {
    document: { unclosed: false, blocks: 806 },
    grammarErrors: 0,
    frontmatter: ONE_KEY,
    blockKinds: { heading: 514, text: 292 },
    headingLevels: { "1": 1, "2": 54, "3": 290, "4": 91, "5": 53, "6": 25 },
    headingTags: {},
    fieldTags: {},
    directives: NO_DIRECTIVES,
    findings: NO_FINDINGS,
    digest: "92147ca49b713e335706f975ad65371b",
  },
  "book target, fault level 4": {
    document: { unclosed: false, blocks: 796 },
    grammarErrors: 0,
    frontmatter: ONE_KEY,
    blockKinds: { heading: 507, text: 289 },
    headingLevels: { "1": 1, "2": 56, "3": 301, "4": 84, "5": 46, "6": 19 },
    headingTags: {},
    fieldTags: {},
    directives: NO_DIRECTIVES,
    findings: NO_FINDINGS,
    digest: "159d3baf450cc0737656bc7e697f7363",
  },
  "wide template": {
    document: { unclosed: false, blocks: 17 },
    grammarErrors: 0,
    frontmatter: { startLine: 1, endLine: 3, lineKinds: { key: 1 }, filename: null, uniqueHeadingNames: false, frontmatterOptional: false, optionalTags: 0 },
    blockKinds: { heading: 17 },
    headingLevels: { "1": 1, "2": 3, "3": 10, "4": 2, "5": 1 },
    headingTags: { order: 2, pattern: 5, presence: 4, repeat: 3 },
    fieldTags: {},
    directives: NO_DIRECTIVES,
    findings: NO_FINDINGS,
    digest: "a4be274919ef9508698efbe1940ef1ff",
  },
  "wide target (5308 headings)": {
    document: { unclosed: false, blocks: 5619 },
    grammarErrors: 0,
    frontmatter: { startLine: 1, endLine: 3, lineKinds: { key: 1 }, filename: null, uniqueHeadingNames: false, frontmatterOptional: false, optionalTags: 0 },
    blockKinds: { heading: 5308, text: 311 },
    headingLevels: { "1": 1, "2": 255, "3": 4009, "4": 88, "5": 955 },
    headingTags: {},
    fieldTags: {},
    directives: NO_DIRECTIVES,
    findings: NO_FINDINGS,
    digest: "d6c12de3a9da91578eddc20b71319b51",
  },
  // Name -> [findings, directives, digest of the whole analysis]. "bom" and "crlf" share one digest: both analyze to the same tree as the plain document.
  odd: {
    empty: [0, 0, "dbef793117ee6ea3c0c00150444017d4"],
    "only newline": [0, 0, "f0ba5214ac42349b9b8b010a3ca1c406"],
    "nul in value": [0, 0, "58a891de235099aeed06d10c5e5cc911"],
    bom: [0, 0, "5ab6d5591e94a067b1085a31ea96f93c"],
    "unclosed frontmatter": [0, 0, "a520f5af35acc30bd9447b95c38f1326"],
    "tab key": [1, 0, "311bd1e81b91ad1f9e24c3bda9d057ac"],
    "open brackets": [2, 0, "a6b11c487aa7e55ee0dc401e6b2855ca"],
    "control characters": [0, 0, "eb9e8b1475acb0ac7535184b19326776"],
    "lone surrogate": [0, 0, "99721c7d8e31ab0e58390d754701546c"],
    "5000 open brackets": [0, 0, "4f59a8bb5cbcf1096dddec491e33ec6a"],
    "empty frontmatter": [0, 0, "aeb2afabca16c8e06040dab2975e12c9"],
    "directive in fence": [0, 0, "b821cef96978f54382ac9af89af1015c"],
    crlf: [0, 0, "5ab6d5591e94a067b1085a31ea96f93c"],
    "empty arguments": [1, 0, "4510f546810a914abdd42ad1e7956091"],
    "malformed comment lines": [3, 0, "ab2a8d722a129a1345f327e79d795c1c"],
    "nested fences": [0, 0, "d701423a69cd08457031e8f113d202e2"],
    "no final newline": [0, 0, "d3d147ecd5448456e5f3112fd95ac7b0"],
  },
};

const pinned = (name: string, actual: unknown): void => {
  expect(actual).toEqual(PINS[name]);
};

describe("G1: analyzeDocument on a document with every construct (generated)", () => {
  const text = kitchenSink(140, 560);

  it("uses every frontmatter tag kind and every heading tag kind", () => {
    const analysis = analyze(text);
    const frontmatterKinds = new Set(
      (analysis.document?.frontmatter?.lines ?? []).flatMap((line) =>
        line.kind === "key"
          ? [...(line.comment?.tags ?? []), ...(line.comment?.inertTags ?? [])].map((tag) => tag.kind)
          : line.kind === "filename" || line.kind === "unique-names" || line.kind === "frontmatter-optional"
            ? line.tag === null
              ? []
              : [line.tag.kind]
            : [],
      ),
    );
    for (const kind of FRONTMATTER_TAG_KINDS) expect(frontmatterKinds.has(kind), kind).toBe(true);
    const headingKinds = new Set((analysis.document?.body ?? []).flatMap((block) => (block.kind === "heading" ? block.tags.map((tag) => tag.kind) : [])));
    for (const kind of BODY_TAG_KINDS) expect(headingKinds.has(kind), kind).toBe(true);
  }, 60_000);

  it("the whole tree, the directives and the findings are the same", () => {
    pinned("sink", summarize(text));
  }, 60_000);

  it("an unclosed frontmatter of the same size has no body and no directive", () => {
    const unclosed = kitchenSink(140, 0, false);
    expect(analyzeDocument(unclosed).document).toMatchObject({ frontmatterUnclosed: true, body: [], directives: [] });
    pinned("sink unclosed", summarize(unclosed));
  });

  // A smaller document of the same generator: each parse of the large one costs seconds under coverage.
  const small = kitchenSink(40, 112);

  it("CRLF and CR line ends give the very same analysis as LF", () => {
    const lf = analyzeDocument(small);
    expect(analyzeDocument(small.replaceAll("\n", "\r\n"))).toEqual(lf);
    expect(analyzeDocument(small.replaceAll("\n", "\r"))).toEqual(lf);
    expect(normalizeLineEnds(text.replaceAll("\n", "\r\n"))).toBe(text);
  }, 60_000);

  it("is deterministic: the same text analyzed twice gives equal results", () => {
    expect(analyzeDocument(small)).toEqual(analyzeDocument(small));
  }, 60_000);
});

describe("G1: analyzeDocument on the generated templates and targets of the engine tests", () => {
  const documents: readonly (readonly [string, () => string])[] = [
    ["book template (600 headings)", bookTemplate],
    ["book target, fault level 0", () => bookTarget(0, 1)],
    ["book target, fault level 4", () => bookTarget(4, 1)],
    ["wide template", wideTemplate],
    ["wide target (5308 headings)", () => wideTarget(250)],
  ];

  it.each(documents)(
    "%s",
    (name, make) => {
      pinned(name, summarize(make()));
    },
    60_000,
  );
});

describe("G1: pathological inputs", () => {
  // `grammarErrors` is non-empty only on a grammar bug (src/tags/parser.ts:617-618 and 633-634); no input reaches it, so there is no grammar-error case here and every pin keeps it at 0.
  it("never give a grammar error; each gives the same findings and tree", () => {
    const summaries = Object.entries(ODD_INPUTS).map(([name, text]) => [name, summarize(text)] as const);
    expect(summaries.every(([, summary]) => summary.grammarErrors === 0 && summary.document !== null)).toBe(true);
    pinned("odd", Object.fromEntries(summaries.map(([name, summary]) => [name, [summary.findings.count, summary.directives.count, summary.digest]])));
  }, 60_000);
});
