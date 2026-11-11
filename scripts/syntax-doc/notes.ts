/**
 * Hand-maintained prose notes rendered in docs/syntax-reference.md next to generated tables.
 * Exported FIX_NOTES and TAG_NOTES; missing entries render as em dash.
 * Enforced by pnpm run check:rules: any missing or orphan FIX_NOTES/TAG_NOTES entry fails (see tests/consistency/syntax-reference.ts).
 * Related: docs/guides/adding-a-rule.md, docs/guides/adding-a-tag.md.
 */

/** Description and example of one tag family. */
export interface TagNote {
  readonly description: string;
  readonly example: string;
}

/** Tag family notes, keyed by `<region>:<family>`, e.g. `frontmatter:presence`. */
export const TAG_NOTES: Readonly<Record<string, TagNote>> = {
  "frontmatter:count": {
    description: "Bounds the length of a list value.",
    example: "`tags: [a] # [count:min:1] [count:max:5]`",
  },
  "frontmatter:filename": {
    description: "Template-wide file name case; a standalone comment line, binds to no key, read from the template only.",
    example: "`# [filename:case:kebab-case]`",
  },
  "frontmatter:format": {
    description: "Shape of a value: constant, case style, semver, ISO date, URL scheme allow-list; `elements:` checks each list item.",
    example: "`slug: x # [format:kebab-case]`",
  },
  "frontmatter:io": {
    description: "Opt-in existence or reachability check of a path or URL value; findings are warnings.",
    example: "`home: https://example.org # [io:exists]`",
  },
  "frontmatter:order": {
    description: "A list of dates must be in ascending order.",
    example: "`milestones: [2026-01] # [order:ascending]`",
  },
  "frontmatter:presence": {
    description: "Required (default), optional, or conditional (documentation only, behaves like optional).",
    example: "`owner: x # [presence:optional]`",
  },
  "frontmatter:range": {
    description: "Bounds a numeric value, or each numeric item of a list.",
    example: "`rating: 3 # [int] [range:min:1] [range:max:5]`",
  },
  "frontmatter:unique-headings-names": {
    description: "Standalone comment line: no two target headings may share a name (case folded, any level).",
    example: "`# [unique-headings-names]`",
  },
  "frontmatter:value": {
    description: "The value must equal the target file name without its extension.",
    example: "`id: x # [value:filename]`",
  },
  "heading:content": {
    description: "Section body rules (non-empty, table, list, line bounds) and sub-heading rules (disallow, no-extra).",
    example: "`## Overview [content:non-empty] [content:min-lines:3]`",
  },
  "heading:order": {
    description: "Order of the repeats of one pattern heading, by whole text or by first number, date or semver; needs a repeat tag.",
    example: '`## Step {digits} [pattern:"Step {digits}"] [repeat-rules:same-level] [order:first:number:ascending]`',
  },
  "heading:pattern": {
    description: 'Heading text is a pattern with literal text and placeholders `{text}`, `{number}`, `{digits}`, `{semver}`, `{date}`, `{char}`; escape quotes as `\\"`.',
    example: '`## 1.2.0 [pattern:"{semver}"]`',
  },
  "heading:presence": {
    description: "Required (default), optional, conditional (documentation only), or template-only (guidance that must not appear in the target).",
    example: "`## Notes [presence:optional]`",
  },
  "heading:repeat-rules": {
    description: "Pattern heading may repeat as one consecutive run; optional explicit minimum or maximum (N is 1 or more).",
    example: '`## Release [pattern:"{semver}"] [repeat-rules:same-level:max:5]`',
  },
  "heading:unique-headings-names": {
    description: "No two target headings inside the matched section (heading included) may share a name.",
    example: "`## Changes [unique-headings-names]`",
  },
};

/**
 * One pass fixture (a template) per tag family, keyed like TAG_NOTES, as a path from the repository root.
 * The generator checks that the file exists, is a `pass-` case and holds the family tag in its region.
 */
export const TAG_FIXTURES: Readonly<Record<string, string>> = {
  "frontmatter:count": "tests/fixtures/pairs/MTL401/pass-lengths-meet-minimum-and-other-values-stay-silent/template.md",
  "frontmatter:filename": "tests/fixtures/pairs/MTL101/pass-stem-matches-template-case-and-inert-tags-stay-silent/template.md",
  "frontmatter:format": "tests/fixtures/pairs/MTL301/pass-value-equals-constant/template.md",
  "frontmatter:io": "tests/fixtures/pairs/MTL804/pass-existing-paths-or-not-checked/template.md",
  "frontmatter:order": "tests/fixtures/pairs/MTL407/pass-dates-ascending-and-other-values-stay-silent/template.md",
  "frontmatter:presence": "tests/fixtures/pairs/MTL201/pass-all-required-present/template.md",
  "frontmatter:range": "tests/fixtures/pairs/MTL403/pass-values-at-or-above-minimum-and-other-values-stay-silent/template.md",
  "frontmatter:unique-headings-names": "tests/fixtures/pairs/MTL613/pass-differs-after-folding/template.md",
  "frontmatter:value": "tests/fixtures/pairs/MTL102/pass-value-equals-file-stem/template.md",
  "heading:content": "tests/fixtures/pairs/MTL701/pass-section-has-text/template.md",
  "heading:order": "tests/fixtures/pairs/MTL609/pass-owner-example-j-epic-a-before-epic-b/template.md",
  "heading:pattern": "tests/fixtures/pairs/MTL605/pass-pattern-headings-match-in-both-scopes/template.md",
  "heading:presence": "tests/fixtures/pairs/MTL601/pass-required-heading-present/template.md",
  "heading:repeat-rules": "tests/fixtures/pairs/MTL607/pass-count-above-minimum/template.md",
  "heading:unique-headings-names": "tests/fixtures/pairs/MTL613/pass-repeat-instances-each-their-own-region/template.md",
};

/** Typical fix of an error code, keyed by code, e.g. `MTL201`. */
export const FIX_NOTES: Readonly<Record<string, string>> = {
  MTL001: "Add a `---` ... `---` YAML block at the top of the file.",
  MTL002: "Fix the YAML syntax named in the message.",
  MTL003: "Make the frontmatter a mapping of `key: value` pairs.",
  MTL004: "Check the file exists, is readable and is UTF-8.",
  MTL010: "Fix the tag spelling or remove it.",
  MTL011: "Fix the heading tag spelling or remove it.",
  MTL012: "Correct the tag argument to a valid form.",
  MTL013: "Move the tag to the other region (frontmatter comment or heading).",
  MTL014: "Fix the pattern: known placeholder, valid format, no adjacent placeholders.",
  MTL015: "Remove the tag, or fix the reason it names: drop `[presence:template-only]`, or add a `[pattern:...]`.",
  MTL016: "Add `[format:date]` or `[format:elements:date]` to the field.",
  MTL017: "Change or remove one of two adjacent headings with the same pattern.",
  MTL018: "Drop `[presence:optional]` or the `min` repeat tag.",
  MTL019: "Reorder or re-level child headings so no heading follows a deeper one.",
  MTL020: "Use a valid verb and at least one rule code in the directive.",
  MTL021: "Use a real `MTLnnn` code from the table.",
  MTL022: "Name only suppressible codes (`MTL101` to `MTL899`).",
  MTL023: "Add the matching `disable` or `begin disable`, or remove the `end disable`.",
  MTL024: "Add `end disable` for the code, or use `disable`.",
  MTL025: "Remove the redundant directive.",
  MTL030: "Add a `[repeat-rules:...]` tag or remove the `[order:...]` tag.",
  MTL101: "Rename the file to the required case.",
  MTL102: "Set the field to the file name without its extension.",
  MTL201: "Fill the field, or tag it `[presence:optional]` in the template.",
  MTL202: "Remove the key, or add it to the template.",
  MTL301: "Set the value to the constant.",
  MTL302: "Rewrite the value in the required case.",
  MTL303: "Rewrite the listed items in the required case.",
  MTL304: "Use a URL with an allowed scheme.",
  MTL305: "Use only allowed schemes in the listed URLs.",
  MTL306: "Use a semver value such as `1.2.0` (no `v` prefix).",
  MTL307: "Use a real `YYYY-MM-DD` date.",
  MTL308: "Make every listed item a semver.",
  MTL309: "Make every listed item a real `YYYY-MM-DD` date.",
  MTL401: "Add items to the list.",
  MTL402: "Remove items from the list.",
  MTL403: "Raise the value to the minimum or more.",
  MTL404: "Lower the value to the maximum or less.",
  MTL405: "Raise the listed items to the minimum or more.",
  MTL406: "Lower the listed items to the maximum or less.",
  MTL407: "Sort the dates in ascending order.",
  MTL501: "Use a plain string value.",
  MTL502: "Use a YAML list.",
  MTL503: "Use a nested mapping.",
  MTL504: "Use a real date: `YYYY-MM-DD`, `YYYY-MM`, `YYYY`, `DD/MM/YYYY` or `present`.",
  MTL505: "Use a URL of the form `scheme://host/...`.",
  MTL506: "Use a valid path.",
  MTL507: "Use an alias path of the form `@name/rest`.",
  MTL508: "Use an integer without decimals.",
  MTL509: "Use a valid number.",
  MTL510: "Use `true` or `false`.",
  MTL511: "Use a YAML list of plain strings.",
  MTL512: "Use a YAML list of integers.",
  MTL513: "Use a YAML list of real dates.",
  MTL514: "Use a YAML list of paths.",
  MTL515: "Use a YAML list of URLs.",
  MTL516: "Use a YAML list of `@name/rest` aliases.",
  MTL517: "Pick one of the allowed options.",
  MTL601: "Add the heading at the template position, same level and text.",
  MTL603: "Remove the template-only heading from the target.",
  MTL604: "Reorder the headings as in the template.",
  MTL605: "Add a heading that matches the pattern.",
  MTL606: "Rewrite the heading to match the pattern.",
  MTL607: "Add headings until the minimum is met.",
  MTL608: "Remove headings above the maximum.",
  MTL609: "Reorder the repeated headings as the order tag says.",
  MTL610: "Add the heading inside the parent section.",
  MTL611: "Reorder the child headings as in the template.",
  MTL612: "Remove the heading, or add it to the template.",
  MTL613: "Rename the later duplicate heading.",
  MTL614: "Move the stray heading into the run, or fix its text.",
  MTL615: "Remove the heading, or declare it in the template.",
  MTL616: "Remove the extra headings, or add them to the template.",
  MTL617: "Add the number, date or semver the order tag reads to each heading.",
  MTL701: "Write content under the heading.",
  MTL702: "Add a Markdown table row.",
  MTL703: "Add a list item.",
  MTL704: "Add non-blank lines up to the minimum.",
  MTL705: "Remove non-blank lines down to the maximum.",
  MTL801: "Declare the alias under `aliases` in the config.",
  MTL802: "Create the aliased path or fix the value.",
  MTL803: "Add its folder under `approvedPaths`, or use a relative path.",
  MTL804: "Create the path or fix the value.",
  MTL805: "Fix the URL or check the network.",
  MTL901: "Create `md-template-lint.yml` or pass `--config <path>`.",
  MTL902: "Fix the config YAML syntax.",
  MTL903: "Remove or rename the unknown config key.",
  MTL904: "Give the key a value of the expected type.",
  MTL905: "Use a valid, unique name; `project` is reserved.",
  MTL906: "Declare the root under `roots` or fix the name.",
  MTL907: "Fix the glob: relative, no `..`, no leading `!`, balanced brackets.",
  MTL908: "Set `version: 1` or remove it.",
  MTL909: "Create the root directory or fix its path.",
  MTL910: "Fix the `template` path of the pair.",
  MTL911: "Point `template` to a file, not a directory.",
  MTL912: "Fix the file path argument.",
  MTL913: "Fix `include`/`exclude`, or set `onEmpty: ignore`.",
  MTL920: "Remove the unknown flag; see `--help`.",
  MTL921: "Give the flag its argument.",
  MTL922: "Use a value the flag accepts: `text`, `plain` or `json`.",
  MTL923: "Pass a config or at least one template path to `--verify`.",
};
