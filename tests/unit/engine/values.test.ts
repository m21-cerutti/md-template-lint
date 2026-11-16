/**
 * Case style helpers of src/engine/values.ts (docs/spec.md 2.3), the value predicates of
 * 2.9 and 3.4, and the heading pattern format predicates of 2.10 (phase Pf). Per
 * behaviour: at least 1 passing case and 1 failing case.
 */
import { describe, expect, it } from "vitest";
import {
  isCamelCase,
  isCamelcaseText,
  isHexDigits,
  isIsoDate,
  isKebabCase,
  isKebabcaseText,
  isLowercaseText,
  isPaddedDigits,
  isPascalCase,
  isPrecisionNumber,
  isScientificNumber,
  isScreamcaseText,
  isSemver,
  isSemverCore,
  isSemverMajorMinor,
  isSignedDigits,
  isSnakeCase,
  isSnakecaseText,
  isUidDigits,
  isUppercaseText,
  isYear,
  isYearMonth,
  isValidDateValue,
  isValidPathAliasValue,
  isValidUrlValue,
  matchesCaseStyle,
  reprValue,
  reprString,
  valueText,
} from "../../../src/engine/values.js";

describe("snake_case", () => {
  it("passes: lowercase words and digits joined by single underscores", () => {
    expect(isSnakeCase("job_2026_notes")).toBe(true);
  });

  it("fails: empty, upper case, doubled or edge underscore, other separators", () => {
    expect(isSnakeCase("")).toBe(false);
    expect(isSnakeCase("Job_notes")).toBe(false);
    expect(isSnakeCase("job__notes")).toBe(false);
    expect(isSnakeCase("_job")).toBe(false);
    expect(isSnakeCase("job_")).toBe(false);
    expect(isSnakeCase("job-notes")).toBe(false);
    expect(isSnakeCase("job notes")).toBe(false);
  });
});

describe("kebab-case", () => {
  it("passes: lowercase words and digits joined by single hyphens", () => {
    expect(isKebabCase("job-2026-notes")).toBe(true);
  });

  it("fails: empty, upper case, doubled or edge hyphen, other separators", () => {
    expect(isKebabCase("")).toBe(false);
    expect(isKebabCase("Job-notes")).toBe(false);
    expect(isKebabCase("job--notes")).toBe(false);
    expect(isKebabCase("-job")).toBe(false);
    expect(isKebabCase("job-")).toBe(false);
    expect(isKebabCase("job_notes")).toBe(false);
  });
});

describe("camelCase", () => {
  it("passes: a lowercase first letter, then letters and digits", () => {
    expect(isCamelCase("jobNotes2")).toBe(true);
  });

  it("fails: empty, upper first letter, digit first, separators", () => {
    expect(isCamelCase("")).toBe(false);
    expect(isCamelCase("JobNotes")).toBe(false);
    expect(isCamelCase("2jobNotes")).toBe(false);
    expect(isCamelCase("job_notes")).toBe(false);
    expect(isCamelCase("job-notes")).toBe(false);
  });
});

describe("PascalCase", () => {
  it("passes: an upper case first letter, then letters and digits", () => {
    expect(isPascalCase("JobNotes2")).toBe(true);
  });

  it("fails: empty, lower first letter, digit first, separators", () => {
    expect(isPascalCase("")).toBe(false);
    expect(isPascalCase("jobNotes")).toBe(false);
    expect(isPascalCase("2JobNotes")).toBe(false);
    expect(isPascalCase("Job_Notes")).toBe(false);
    expect(isPascalCase("Job-Notes")).toBe(false);
  });
});

describe("isValidUrlValue: strict URL predicate (spec 3.4)", () => {
  it("passes: a scheme, an authority, optional path, query and fragment", () => {
    expect(isValidUrlValue("https://example.com")).toBe(true);
    expect(isValidUrlValue("  HTTP://user@host:8080/a?b=1#c  ")).toBe(true);
    expect(isValidUrlValue("git+ssh://host")).toBe(true);
    expect(isValidUrlValue("http://[::1]/x")).toBe(true);
    expect(isValidUrlValue("a-b.c://host")).toBe(true);
  });

  it("passes: whitespace-set edges (tab, no-break space); fails: the same inside the value", () => {
    expect(isValidUrlValue("\thttps://example.com\t")).toBe(true);
    expect(isValidUrlValue("\u00a0https://example.com\u00a0")).toBe(true);
    expect(isValidUrlValue("https://ex\tample.com")).toBe(false);
    expect(isValidUrlValue("https://example.com/a\u00a0b")).toBe(false);
  });

  it("fails: the authority ends at the fragment mark, so `#` right after `//` has no host", () => {
    expect(isValidUrlValue("https://#frag")).toBe(false);
    expect(isValidUrlValue("https://example.com#frag")).toBe(true);
  });

  it("fails: a closing bracket without an opening one in the authority", () => {
    expect(isValidUrlValue("http://::1]/x")).toBe(false);
    expect(isValidUrlValue("http://[::1]/x")).toBe(true);
  });

  it("fails: not a string, blank, no scheme, no authority, whitespace inside", () => {
    expect(isValidUrlValue(["https://example.com"])).toBe(false);
    expect(isValidUrlValue("   ")).toBe(false);
    expect(isValidUrlValue("example.com/a")).toBe(false);
    expect(isValidUrlValue("1http://host")).toBe(false);
    expect(isValidUrlValue("mailto:a@b.c")).toBe(false);
    expect(isValidUrlValue("https:///path")).toBe(false);
    expect(isValidUrlValue("https://?q=1")).toBe(false);
    expect(isValidUrlValue("https://ex ample.com")).toBe(false);
    expect(isValidUrlValue("https://ex\u00a0ample.com")).toBe(false);
  });

  it("fails: a forbidden character in the authority, an unbalanced bracket", () => {
    expect(isValidUrlValue("https://ex<ample.com")).toBe(false);
    expect(isValidUrlValue('https://ex"ample.com')).toBe(false);
    expect(isValidUrlValue("https://ex{ample}.com")).toBe(false);
    expect(isValidUrlValue("https://ex{ample.com")).toBe(false);
    expect(isValidUrlValue("https://ex}ample.com")).toBe(false);
    expect(isValidUrlValue("https://ex>ample.com")).toBe(false);
    expect(isValidUrlValue("https://ex|ample.com")).toBe(false);
    expect(isValidUrlValue("https://ex\\ample.com")).toBe(false);
    expect(isValidUrlValue("https://ex^ample.com")).toBe(false);
    expect(isValidUrlValue("http://[::1/x")).toBe(false);
    expect(isValidUrlValue("https://example.com/a<b>{c}")).toBe(true);
  });

  it("passes: an allow-list is compared lowercased; fails: a scheme outside it", () => {
    const allowed = new Set(["https", "http"]);
    expect(isValidUrlValue("HTTPS://example.com", allowed)).toBe(true);
    expect(isValidUrlValue("ftp://example.com", allowed)).toBe(false);
    expect(isValidUrlValue("ftp://example.com", new Set())).toBe(false);
  });
});

describe("isValidPathAliasValue: strict path alias predicate (spec 3.4)", () => {
  it("passes: @name/rest after trimming, name of letters digits _ -, rest of non-space", () => {
    expect(isValidPathAliasValue("@assets/logo.svg")).toBe(true);
    expect(isValidPathAliasValue("@a/b")).toBe(true);
    expect(isValidPathAliasValue("@My_alias-1/x/y/")).toBe(true);
    expect(isValidPathAliasValue("@assets/a@b")).toBe(true);
    expect(isValidPathAliasValue(" \t@assets/logo.svg\u00a0 ")).toBe(true);
  });

  it("fails: no @, empty name, name outside the charset, no slash, empty rest", () => {
    expect(isValidPathAliasValue("assets/logo.svg")).toBe(false);
    expect(isValidPathAliasValue("@/logo.svg")).toBe(false);
    expect(isValidPathAliasValue("@@assets/logo.svg")).toBe(false);
    expect(isValidPathAliasValue("@as.sets/x")).toBe(false);
    expect(isValidPathAliasValue("@assèts/x")).toBe(false);
    expect(isValidPathAliasValue("@assets")).toBe(false);
    expect(isValidPathAliasValue("@assets/")).toBe(false);
    expect(isValidPathAliasValue("@assets/   ")).toBe(false);
    expect(isValidPathAliasValue("@assets\\logo.svg")).toBe(false);
    expect(isValidPathAliasValue("")).toBe(false);
  });

  it("fails: whitespace in the rest, text before the @, not a string", () => {
    expect(isValidPathAliasValue("@assets/my logo")).toBe(false);
    expect(isValidPathAliasValue("@assets/my\tlogo")).toBe(false);
    expect(isValidPathAliasValue("@assets/my\u00a0logo")).toBe(false);
    expect(isValidPathAliasValue("x @assets/logo")).toBe(false);
    expect(isValidPathAliasValue(["@assets/logo"])).toBe(false);
  });

  it("follows the Unicode whitespace set, not the JS one (U+001C, U+0085, U+FEFF)", () => {
    expect(isValidPathAliasValue("@assets/a\u001cb")).toBe(false);
    expect(isValidPathAliasValue("@assets/a\u0085b")).toBe(false);
    expect(isValidPathAliasValue("@assets/a\ufeffb")).toBe(true);
    expect(isValidPathAliasValue("\u001c@assets/logo\u001f")).toBe(true);
  });
});

describe("isValidDateValue: calendar-strict date predicate (spec 3.4)", () => {
  it("passes: the four shapes with a real date, the ongoing marker, surrounding space", () => {
    expect(isValidDateValue("2024-02-29")).toBe(true);
    expect(isValidDateValue("2026-12")).toBe(true);
    expect(isValidDateValue("2026")).toBe(true);
    expect(isValidDateValue("29/02/2000")).toBe(true);
    expect(isValidDateValue("Présent")).toBe(true);
    expect(isValidDateValue("  PRESENT ")).toBe(true);
    expect(isValidDateValue("PRÉSENT")).toBe(true);
    expect(isValidDateValue(" 2026-01-31\t")).toBe(true);
  });

  it("passes: the last day of each month, 28 February in a non-leap year", () => {
    const lastDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    lastDays.forEach((last, index) => {
      const month = String(index + 1).padStart(2, "0");
      expect(isValidDateValue(`2026-${month}-${last}`)).toBe(true);
      expect(isValidDateValue(`${last}/${month}/2026`)).toBe(true);
    });
    expect(isValidDateValue("2024-02-29")).toBe(true);
    expect(isValidDateValue("2026-01-01")).toBe(true);
  });

  it("fails: the day after the last day of each month, 29 February in a non-leap year", () => {
    const lastDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    lastDays.forEach((last, index) => {
      const month = String(index + 1).padStart(2, "0");
      expect(isValidDateValue(`2026-${month}-${last + 1}`)).toBe(false);
      expect(isValidDateValue(`${last + 1}/${month}/2026`)).toBe(false);
    });
    expect(isValidDateValue("2024-02-30")).toBe(false);
    expect(isValidDateValue("2026-01-32")).toBe(false);
  });

  it("fails: extra text or wrong width around the slash form, a bare year and the marker", () => {
    expect(isValidDateValue("15/01/2026 x")).toBe(false);
    expect(isValidDateValue("x 15/01/2026")).toBe(false);
    expect(isValidDateValue("115/01/2026")).toBe(false);
    expect(isValidDateValue("15/01/20260")).toBe(false);
    expect(isValidDateValue("20260")).toBe(false);
    expect(isValidDateValue("026")).toBe(false);
    expect(isValidDateValue("026-01")).toBe(false);
    expect(isValidDateValue("not present")).toBe(false);
    expect(isValidDateValue("present day")).toBe(false);
    expect(isValidDateValue("presents")).toBe(false);
  });

  it("fails: impossible days and months, year 0000, no leap day in 1900 and 2025", () => {
    expect(isValidDateValue("2025-02-29")).toBe(false);
    expect(isValidDateValue("1900-02-29")).toBe(false);
    expect(isValidDateValue("2026-13-40")).toBe(false);
    expect(isValidDateValue("2026-00-10")).toBe(false);
    expect(isValidDateValue("2026-04-31")).toBe(false);
    expect(isValidDateValue("2026-01-00")).toBe(false);
    expect(isValidDateValue("2026-13")).toBe(false);
    expect(isValidDateValue("31/02/2020")).toBe(false);
    expect(isValidDateValue("0000")).toBe(false);
    expect(isValidDateValue("0000-01-01")).toBe(false);
  });

  it("fails: no zero padding, extra text, other shapes, not a string", () => {
    expect(isValidDateValue("2026-1-2")).toBe(false);
    expect(isValidDateValue("1/2/2026")).toBe(false);
    expect(isValidDateValue("2026-01-15T10:00")).toBe(false);
    expect(isValidDateValue("2026/01/15")).toBe(false);
    expect(isValidDateValue("")).toBe(false);
    expect(isValidDateValue(["2026-01-15"])).toBe(false);
  });
});

describe("isIsoDate: ISO DATE predicate of [format:date] (spec 2.9)", () => {
  it("passes: YYYY-MM-DD naming a real date, leap day included", () => {
    expect(isIsoDate("2026-01-01")).toBe(true);
    expect(isIsoDate("2024-02-29")).toBe(true);
    expect(isIsoDate("0001-01-01")).toBe(true);
    expect(isIsoDate("2026-12-31")).toBe(true);
  });

  it("fails: the other default shapes and the ongoing marker", () => {
    expect(isIsoDate("2026-01")).toBe(false);
    expect(isIsoDate("2026")).toBe(false);
    expect(isIsoDate("31/12/2026")).toBe(false);
    expect(isIsoDate("present")).toBe(false);
    expect(isIsoDate("présent")).toBe(false);
  });

  it("fails: exact text, no trimming and no final newline (owner decision AS16)", () => {
    expect(isIsoDate(" 2026-01-01")).toBe(false);
    expect(isIsoDate("2026-01-01 ")).toBe(false);
    expect(isIsoDate("2026-01-01\n")).toBe(false);
    expect(isIsoDate("\t2026-01-01")).toBe(false);
    expect(isIsoDate("2026-01-01\n\n")).toBe(false);
  });

  it("fails: no zero padding, extra text, empty, non-ASCII digits", () => {
    expect(isIsoDate("2026-1-5")).toBe(false);
    expect(isIsoDate("2026-01-5")).toBe(false);
    expect(isIsoDate("2026-01-01T10:00")).toBe(false);
    expect(isIsoDate("")).toBe(false);
    expect(isIsoDate("2026-01-0\u0661")).toBe(false);
  });

  it("fails: the calendar test of the type date (spec 3.4)", () => {
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("2025-02-29")).toBe(false);
    expect(isIsoDate("1900-02-29")).toBe(false);
    expect(isIsoDate("2026-04-31")).toBe(false);
    expect(isIsoDate("2026-01-00")).toBe(false);
    expect(isIsoDate("2026-13-01")).toBe(false);
    expect(isIsoDate("2026-00-10")).toBe(false);
    expect(isIsoDate("0000-01-01")).toBe(false);
  });
});

describe("isSemver: SEMVER predicate of [format:semver] (spec 2.9)", () => {
  it("passes: SemVer 2.0.0 versions with pre-release and build parts", () => {
    expect(isSemver("0.0.0")).toBe(true);
    expect(isSemver("1.2.3")).toBe(true);
    expect(isSemver("10.20.30")).toBe(true);
    expect(isSemver("1.0.0-rc.1")).toBe(true);
    expect(isSemver("1.0.0-0a")).toBe(true);
    expect(isSemver("1.0.0-1a")).toBe(true);
    expect(isSemver("1.0.0-00a")).toBe(true);
    expect(isSemver("1.0.0--")).toBe(true);
    expect(isSemver("1.0.0+001")).toBe(true);
    expect(isSemver("1.0.0-alpha.1+build.5")).toBe(true);
  });

  it("fails: leading zeros in a number part, numeric pre-release included", () => {
    expect(isSemver("01.2.3")).toBe(false);
    expect(isSemver("1.02.3")).toBe(false);
    expect(isSemver("1.2.03")).toBe(false);
    expect(isSemver("1.0.0-01")).toBe(false);
    expect(isSemver("1.0.0-rc.01")).toBe(false);
  });

  it("fails: v prefix, missing parts, empty identifiers, non-ASCII", () => {
    expect(isSemver("v1.2.3")).toBe(false);
    expect(isSemver("1.2")).toBe(false);
    expect(isSemver("1.2.3.4")).toBe(false);
    expect(isSemver("1.0.0-")).toBe(false);
    expect(isSemver("1.0.0+")).toBe(false);
    expect(isSemver("1.0.0-rc..1")).toBe(false);
    expect(isSemver("1.0.0-rc.")).toBe(false);
    expect(isSemver("1.0.0+a..b")).toBe(false);
    expect(isSemver("1.0.0-\u00e9")).toBe(false);
    expect(isSemver("1.\u0662.0")).toBe(false);
    expect(isSemver("")).toBe(false);
  });

  it("fails: exact text, no trimming and no final newline (owner decision AS16)", () => {
    expect(isSemver(" 1.2.3")).toBe(false);
    expect(isSemver("1.2.3 ")).toBe(false);
    expect(isSemver("1.2.3\n")).toBe(false);
  });
});

describe("reprString: `repr` quoting of a string (Q02)", () => {
  it("passes: plain text in single quotes, printable non-ASCII kept", () => {
    expect(reprString("job notes")).toBe("'job notes'");
    expect(reprString("café 😀")).toBe("'café 😀'");
  });

  it("fails: quotes pick the delimiter, backslash and quote are escaped", () => {
    expect(reprString("it's")).toBe('"it\'s"');
    expect(reprString('say "hi"')).toBe("'say \"hi\"'");
    expect(reprString('it\'s "x"')).toBe("'it\\'s \"x\"'");
    expect(reprString("a\\b")).toBe("'a\\\\b'");
  });

  it("fails: newline, carriage return, tab and other control characters are escaped", () => {
    expect(reprString("a\nb\rc\td")).toBe("'a\\nb\\rc\\td'");
    expect(reprString("a\u0000b\u001fc\u007fd")).toBe("'a\\x00b\\x1fc\\x7fd'");
  });

  it("fails: non-printable code points use \\x, \\u or \\U escapes", () => {
    expect(reprString("a\u00a0b")).toBe("'a\\xa0b'");
    expect(reprString("a\u0085b")).toBe("'a\\x85b'");
    expect(reprString("a\u200bb")).toBe("'a\\u200bb'");
    expect(reprString("a\u2028b")).toBe("'a\\u2028b'");
    expect(reprString("a\u{e0001}b")).toBe("'a\\U000e0001b'");
  });
});

describe("reprValue and valueText: list text and plain text of a YAML value (Q02)", () => {
  it("passes: a list of strings", () => {
    expect(reprValue(["a", "it's"])).toBe("['a', \"it's\"]");
  });

  it("fails: nested list and mapping text, empty containers", () => {
    expect(reprValue(new Map([["k", ["a", "b"]]]))).toBe("{'k': ['a', 'b']}");
    expect(reprValue([["a"], new Map([["k", "v"]])])).toBe("[['a'], {'k': 'v'}]");
    expect(reprValue([])).toBe("[]");
    expect(reprValue(new Map())).toBe("{}");
  });

  it("fails: valueText keeps a string raw and prints a list or mapping as repr text", () => {
    expect(valueText("it's")).toBe("it's");
    expect(valueText(["a"])).toBe("['a']");
    expect(valueText(new Map([["k", "v"]]))).toBe("{'k': 'v'}");
  });
});

describe("matchesCaseStyle: a final newline is allowed, nothing else", () => {
  it("passes: one final newline is allowed (a YAML block scalar ends with one)", () => {
    expect(matchesCaseStyle("snake_case", "job_notes\n")).toBe(true);
  });

  it("fails: two final newlines, a leading or inner space or newline (no trimming)", () => {
    expect(matchesCaseStyle("snake_case", "job_notes\n\n")).toBe(false);
    expect(matchesCaseStyle("snake_case", " job_notes")).toBe(false);
    expect(matchesCaseStyle("snake_case", "job_notes ")).toBe(false);
    expect(matchesCaseStyle("kebab-case", "job-\nnotes")).toBe(false);
  });
});

describe("heading pattern format predicates (spec 2.10 'Each format', phase Pf)", () => {
  /** Predicate, accepted values, rejected values: from the 2.10 lists, exact text. */
  const cases: readonly (readonly [string, (value: string) => boolean, string[], string[]])[] = [
    ["isSnakecaseText", isSnakecaseText, ["my_heading", "step_2", "2_step", "épique_été", "данные_2"], ["2026", "2026_10", "My_heading", "my-heading", "my__heading", "_x", "my heading", ""]],
    ["isCamelcaseText", isCamelcaseText, ["myHeading", "heading", "step2", "étéChaud"], ["MyHeading", "my_heading", "2step", "2026", "my heading"]],
    ["isScreamcaseText", isScreamcaseText, ["MY_HEADING", "STEP_2", "ÉTÉ_2"], ["2026", "My_Heading", "MY-HEADING", "MY__HEADING", "my_heading"]],
    ["isKebabcaseText", isKebabcaseText, ["my-heading", "step-2", "été-chaud"], ["2026", "my_heading", "My-heading", "my--heading", "-x"]],
    ["isLowercaseText", isLowercaseText, ["release notes", "étape 2", "v1.2 notes"], ["Release notes", "2026", "-", ""]],
    ["isUppercaseText", isUppercaseText, ["RELEASE NOTES", "ÉTAPE 2", "V1.2 NOTES"], ["Release", "2026", ""]],
    ["isScientificNumber", isScientificNumber, ["1e5", "01e5", "1.5E-3", "-2e+10", "1.5", "7"], ["1e", "e5", "1.5e-", "1e5.0", "+1e5"]],
    ["isSignedDigits", isSignedDigits, ["42", "+42", "-7", "0"], ["+07", "--1", "+", "1.0"]],
    ["isHexDigits", isHexDigits, ["ff", "0A3F", "007", "7"], ["0x1f", "g1", "-1", ""]],
    ["isUidDigits", isUidDigits, ["U42", "a1b2", "42U", "user7"], ["42", "abc", "U-42", "U 42", "É1"]],
    ["isSemverCore", isSemverCore, ["1.2.0"], ["1.2.0-rc.1", "1.2.0+build", "1.2", "1.02.0"]],
    ["isSemverMajorMinor", isSemverMajorMinor, ["1.2", "0.10"], ["1.2.0", "01.2", "1"]],
    ["isYearMonth", isYearMonth, ["2026-10", "0001-12"], ["2026-13", "2026-00", "0000-10", "2026"]],
    ["isYear", isYear, ["2026", "0001"], ["0000", "26", "20260", "2026\n"]],
  ];
  for (const [name, predicate, accepted, rejected] of cases) {
    it(`${name} passes: ${accepted.join(", ")}`, () => {
      for (const value of accepted) expect(predicate(value), value).toBe(true);
    });
    it(`${name} fails: ${rejected.map((value) => JSON.stringify(value)).join(", ")}`, () => {
      for (const value of rejected) expect(predicate(value), value).toBe(false);
    });
  }

  it("isPrecisionNumber: exactly N decimals, no exponent", () => {
    for (const value of ["1.50", "01.00", "-0.25"]) expect(isPrecisionNumber(value, 2)).toBe(true);
    for (const value of ["1.5", "1.500", "1", "1.50e0"]) expect(isPrecisionNumber(value, 2), value).toBe(false);
    expect(isPrecisionNumber("1.5", 1)).toBe(true);
  });

  it("isPaddedDigits: exactly N ASCII digits, leading zeros allowed, no sign", () => {
    for (const value of ["007", "042", "123"]) expect(isPaddedDigits(value, 3)).toBe(true);
    for (const value of ["7", "0007", "-07", "1234"]) expect(isPaddedDigits(value, 3), value).toBe(false);
    expect(isPaddedDigits("0007", 4)).toBe(true);
  });

  it("the case formats are not the ASCII field case styles of 2.3", () => {
    // A non-ASCII letter passes the heading format, not the field style.
    expect(isSnakecaseText("épique_été")).toBe(true);
    expect(isSnakeCase("épique_été")).toBe(false);
    // A digits-only value passes the field style, not the heading format.
    expect(isSnakeCase("2026")).toBe(true);
    expect(isSnakecaseText("2026")).toBe(false);
  });
});
