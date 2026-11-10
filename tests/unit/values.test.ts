/**
 * Case style helpers of src/engine/values.ts (docs/spec.md 2.3). Per
 * behaviour: exactly 1 passing case, failing cases >= passing.
 */
import { describe, expect, it } from "vitest";
import {
  isCamelCase,
  isKebabCase,
  isPascalCase,
  isSnakeCase,
  isValidDateValue,
  isValidPathAliasValue,
  isValidUrlValue,
  matchesCaseStyle,
  pyRepr,
  pyReprString,
  valueText,
} from "../../src/engine/values.js";

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

  it("passes: Python strip() edges (tab, no-break space); fails: the same inside the value", () => {
    expect(isValidUrlValue("\thttps://example.com\t")).toBe(true);
    expect(isValidUrlValue("\u00a0https://example.com\u00a0")).toBe(true);
    expect(isValidUrlValue("https://ex\tample.com")).toBe(false);
    expect(isValidUrlValue("https://example.com/a\u00a0b")).toBe(false);
  });

  it("fails: the authority ends at the fragment mark, so `#` right after `//` has no host", () => {
    expect(isValidUrlValue("https://#frag")).toBe(false);
    expect(isValidUrlValue("https://example.com#frag")).toBe(true);
  });

  it("fails: a closing bracket without an opening one in the authority (Python urlsplit)", () => {
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

  it("follows the Python whitespace set, not the JS one (U+001C, U+0085, U+FEFF)", () => {
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

describe("pyReprString: Python `repr` of a string (Q02)", () => {
  it("passes: plain text in single quotes, printable non-ASCII kept", () => {
    expect(pyReprString("job notes")).toBe("'job notes'");
    expect(pyReprString("café 😀")).toBe("'café 😀'");
  });

  it("fails: quotes pick the delimiter, backslash and quote are escaped", () => {
    expect(pyReprString("it's")).toBe('"it\'s"');
    expect(pyReprString('say "hi"')).toBe("'say \"hi\"'");
    expect(pyReprString('it\'s "x"')).toBe("'it\\'s \"x\"'");
    expect(pyReprString("a\\b")).toBe("'a\\\\b'");
  });

  it("fails: newline, carriage return, tab and other control characters are escaped", () => {
    expect(pyReprString("a\nb\rc\td")).toBe("'a\\nb\\rc\\td'");
    expect(pyReprString("a\u0000b\u001fc\u007fd")).toBe("'a\\x00b\\x1fc\\x7fd'");
  });

  it("fails: non-printable code points use \\x, \\u or \\U like Python", () => {
    expect(pyReprString("a\u00a0b")).toBe("'a\\xa0b'");
    expect(pyReprString("a\u0085b")).toBe("'a\\x85b'");
    expect(pyReprString("a\u200bb")).toBe("'a\\u200bb'");
    expect(pyReprString("a\u2028b")).toBe("'a\\u2028b'");
    expect(pyReprString("a\u{e0001}b")).toBe("'a\\U000e0001b'");
  });
});

describe("pyRepr and valueText: Python `repr` and `str` of a YAML value (Q02)", () => {
  it("passes: a list of strings", () => {
    expect(pyRepr(["a", "it's"])).toBe("['a', \"it's\"]");
  });

  it("fails: nested list and mapping text, empty containers", () => {
    expect(pyRepr(new Map([["k", ["a", "b"]]]))).toBe("{'k': ['a', 'b']}");
    expect(pyRepr([["a"], new Map([["k", "v"]])])).toBe("[['a'], {'k': 'v'}]");
    expect(pyRepr([])).toBe("[]");
    expect(pyRepr(new Map())).toBe("{}");
  });

  it("fails: valueText keeps a string raw and prints a list or mapping as Python text", () => {
    expect(valueText("it's")).toBe("it's");
    expect(valueText(["a"])).toBe("['a']");
    expect(valueText(new Map([["k", "v"]]))).toBe("{'k': 'v'}");
  });
});

describe("matchesCaseStyle: legacy `re.match(...$)` parity", () => {
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
