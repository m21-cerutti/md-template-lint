/**
 * `pnpm run check:rules`: the hand-kept lists of ADR 0002, the category
 * ranges and the spec code table agree with the grammar, the visitors and
 * the rule registry. One passing case (the real tree), then drift cases that
 * feed deliberately broken inputs to each check.
 */
import { describe, expect, it } from "vitest";
import { defineRule, notImplemented } from "../../src/engine/rule.js";
import { MdTemplateLexer } from "../../src/generated/MdTemplateLexer.js";
import { MdTemplateParser } from "../../src/generated/MdTemplateParser.js";
import { FRONTMATTER_TAG_VISITORS } from "../../src/tags/visitors/index.js";
import {
  allProblems,
  checkAstKinds,
  checkCodes,
  checkDefaultModeMirror,
  checkRanges,
  checkRuleFiles,
  checkTypeNames,
  checkVisitorRegistry,
  compareMirror,
  firstSymbols,
  modeKeywords,
  modeRules,
  sentences,
  specCodes,
  specRanges,
  specTypeNames,
  tagFamilies,
} from "./consistency.js";

const lexerRule = (name: string) => MdTemplateLexer.ruleNames.indexOf(name);

describe("check:rules", () => {
  it("passes: no drift between grammar, visitors, types, ranges, rules and spec", () => {
    expect(allProblems()).toEqual([]);
  });

  it("reads non-empty inputs (a style change cannot make a check pass on nothing)", () => {
    expect(specCodes()).toHaveLength(85);
    expect(specTypeNames()).toHaveLength(17);
    expect(specRanges().size).toBe(9);
    const atn = MdTemplateParser._ATN;
    expect(firstSymbols(atn, MdTemplateParser.RULE_tagFamily).tokens.size).toBe(13);
    expect(firstSymbols(atn, MdTemplateParser.RULE_tagWord).tokens.size).toBe(9);
    expect(firstSymbols(atn, MdTemplateParser.RULE_fmTagBody).rules.size).toBe(10);
    expect(firstSymbols(atn, MdTemplateParser.RULE_bodyTagBody).rules.size).toBe(6);
    expect(sentences(atn, MdTemplateParser.RULE_fmCountTag)).toHaveLength(2);
    expect(modeKeywords(MdTemplateLexer.TAG_TEXT)).toEqual(["ISO", "LIEN", "PATH", "RULE", "URL"]);
    expect(modeRules(MdTemplateLexer.BODY).length).toBeGreaterThanOrEqual(8);
    expect(tagFamilies().get("frontmatter:range")).toBe("fmRangeTag");
    expect(tagFamilies().get("body:content-lines")).toBe("bodyContentTag");
  });

  it("fails: a spec code that no rule registers (no staging list exists)", () => {
    expect(checkCodes(specCodes(), [])).toContain("MTL001 frontmatter-missing: in docs/spec.md 4.3 but no rule is registered in src/rules/syntax.ts");
    const [first] = specCodes();
    if (first === undefined) throw new Error("docs/spec.md 4.3 has no code");
    expect(checkCodes([first], [])).toEqual([`${first.code} ${first.name}: in docs/spec.md 4.3 but no rule is registered in src/rules/${first.category}.ts`]);
  });

  it("fails: a registered rule missing from the spec", () => {
    const rogue = defineRule({
      code: "MTL099",
      name: "rogue",
      severity: "error",
      category: "syntax",
      phase: "template",
      check: () => [],
    });
    expect(checkCodes([], [rogue])).toEqual(["MTL099 rogue: registered but not in docs/spec.md 4.3"]);
  });

  it("fails: a scaffold stub until its check is implemented", () => {
    const stub = defineRule({
      code: "MTL301",
      name: "constant-mismatch",
      severity: "error",
      category: "format",
      phase: "field",
      step: "constant",
      check: notImplemented("MTL301"),
    });
    const constant = specCodes().filter((entry) => entry.code === "MTL301");
    expect(checkCodes(constant, [stub])).toEqual(["MTL301 constant-mismatch: in docs/spec.md 4.3 but the rule in src/rules/format.ts is still a stub check (implement it)"]);
    const real = defineRule({ ...stub, check: () => [] });
    expect(checkCodes(constant, [real])).toEqual([]);
  });

  it("fails: a visitor registry drift", () => {
    expect(checkVisitorRegistry(FRONTMATTER_TAG_VISITORS.slice(1))).toEqual(["visitors/index.ts FRONTMATTER_TAG_VISITORS: 0 visitors handle fmPresenceTag (expected exactly 1)"]);
  });

  it("fails: a KNOWN_TYPE_NAMES drift", () => {
    const known = new Set(specTypeNames().filter((name) => name !== "list-of-url"));
    expect(checkTypeNames(known)).toEqual(["KNOWN_TYPE_NAMES (src/tags/types.ts) vs spec 3.1: missing list-of-url", "LIST_PROMOTABLE_HINTS: list-of-url is not a known type"]);
  });

  it("fails: an AST kind list drift (missing and extra kind)", () => {
    expect(checkAstKinds(["presence"], ["presence", "content", "content-lines", "ghost"])).toEqual(
      expect.arrayContaining(["FRONTMATTER_TAG_KINDS (src/tags/ast.ts) vs grammar + visitors: missing count", "BODY_TAG_KINDS (src/tags/ast.ts) vs grammar + visitors: unexpected ghost"]),
    );
  });

  it("fails: a DEFAULT_MODE mirror drift (pattern, wrong mode, zero rules found)", () => {
    expect(compareMirror(lexerRule("DS_TABLE"), lexerRule("B_LIST"))).toEqual(["DEFAULT_MODE: DS_TABLE vs B_LIST: patterns differ", "DEFAULT_MODE: DS_TABLE vs B_LIST: token types differ"]);
    expect(compareMirror(lexerRule("DS_TABLE"), lexerRule("B_TABLE"))).toEqual([]);
    expect(checkDefaultModeMirror(MdTemplateLexer.DEFAULT_MODE, MdTemplateLexer.BODY_TEXT)).toEqual(["DEFAULT_MODE: found 0 B_ rules in BODY_TEXT, expected 8"]);
  });

  it("fails: a range drift and a stray rule file", () => {
    const ranges = new Map(specRanges());
    ranges.set("format", [300, 349]);
    expect(checkRanges(undefined, ranges)).toEqual(["src/engine/ranges.json format: 300-399 vs spec 4.2 300-349"]);
    expect(checkRuleFiles(["syntax.ts", "extra.ts"])).toContain("src/rules/*.ts vs the nine categories: unexpected extra");
  });
});
