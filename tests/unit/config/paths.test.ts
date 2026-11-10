/**
 * Config path resolver (docs/spec.md 6.2, D04): `~`, `C:/` and `C:\` forms, a leading
 * slash, relative paths, `\` read as `/`, `..` folded. Pure functions, table driven.
 */
import { describe, expect, it } from "vitest";
import { displayPath, foldPath, isAbsolutePath, relativeInside, resolvePath } from "../../../src/config/paths.js";

const HOME = "/home/test";
const WIN_HOME = "C:\\Users\\test";

describe("resolvePath", () => {
  const cases: readonly (readonly [string, string, string, string])[] = [
    // value, base, home, expected
    ["docs/adr", "/proj", HOME, "/proj/docs/adr"],
    ["./docs/../templates", "/proj", HOME, "/proj/templates"],
    ["../shared", "/work/proj", HOME, "/work/shared"],
    ["~", "/proj", HOME, "/home/test"],
    ["~/notes", "/proj", HOME, "/home/test/notes"],
    ["~\\notes\\a", "/proj", HOME, "/home/test/notes/a"],
    ["~/notes", "/proj", WIN_HOME, "C:/Users/test/notes"],
    ["C:/data/x", "/proj", HOME, "C:/data/x"],
    ["C:\\data\\x", "/proj", HOME, "C:/data/x"],
    ["d:\\data\\..\\y", "C:/proj", HOME, "d:/y"],
    ["/srv/data", "C:/proj", HOME, "/srv/data"],
    ["\\srv\\data", "C:/proj", HOME, "/srv/data"],
    ["\\\\server\\share\\x", "C:/proj", HOME, "//server/share/x"],
    ["docs", "C:\\proj\\sub", HOME, "C:/proj/sub/docs"],
    ["../../..", "C:/proj", HOME, "C:/"],
    ["  spaced  ", "/proj", HOME, "/proj/spaced"],
  ];
  for (const [value, base, home, expected] of cases) {
    it(`${JSON.stringify(value)} against ${base} -> ${expected}`, () => {
      expect(resolvePath(value, base, home)).toBe(expected);
    });
  }

  it("~user is not expanded: it is a relative name", () => {
    expect(resolvePath("~other/x", "/proj", HOME)).toBe("/proj/~other/x");
  });
});

describe("isAbsolutePath", () => {
  const absolute = ["/x", "\\x", "C:/x", "c:\\x", "//server/share", "C:\\"];
  const relative = ["x", "./x", "../x", "C:x", "~/x", "", "x/C:/y"];
  for (const value of absolute) it(`absolute: ${JSON.stringify(value)}`, () => expect(isAbsolutePath(value)).toBe(true));
  for (const value of relative) it(`relative: ${JSON.stringify(value)}`, () => expect(isAbsolutePath(value)).toBe(false));
});

describe("foldPath, relativeInside, displayPath", () => {
  it("folds . and .. and never climbs above a root", () => {
    expect(foldPath("/a/./b/../c")).toBe("/a/c");
    expect(foldPath("/../../x")).toBe("/x");
    expect(foldPath("a/../../b")).toBe("../b");
    expect(foldPath("")).toBe(".");
  });

  it("relativeInside: inside gives a relative path, outside or a sibling prefix gives null", () => {
    expect(relativeInside("/proj/docs/a.md", "/proj")).toBe("docs/a.md");
    expect(relativeInside("/proj", "/proj")).toBe(".");
    expect(relativeInside("/proj-other/a.md", "/proj")).toBeNull();
    expect(relativeInside("/proj/../x", "/proj")).toBeNull();
    expect(relativeInside("C:/proj/a.md", "c:/proj")).toBe("a.md");
    expect(relativeInside("D:/proj/a.md", "C:/proj")).toBeNull();
  });

  it("relativeInside: directory names are case-sensitive unless ignoreCase is given (fails closed)", () => {
    expect(relativeInside("C:/Projects/x/docs/a.md", "c:/projects/x")).toBeNull();
    expect(relativeInside("/Proj/docs/a.md", "/proj")).toBeNull();
    expect(relativeInside("C:/Projects/x/docs/a.md", "c:/projects/x", false)).toBeNull();
  });

  it("relativeInside: ignoreCase folds the directory part only, the rest keeps its case", () => {
    expect(relativeInside("C:/Projects/X/docs/a.md", "c:/projects/x", true)).toBe("docs/a.md");
    expect(relativeInside("c:/projects/x/DOCS/A.MD", "C:/Projects/X", true)).toBe("DOCS/A.MD");
    expect(relativeInside("/Proj/Docs/a.md", "/proj", true)).toBe("Docs/a.md");
    expect(relativeInside("/PROJ", "/proj", true)).toBe(".");
  });

  it("relativeInside: ignoreCase still rejects a sibling, a shorter path and another drive", () => {
    expect(relativeInside("/PROJ-other/a.md", "/proj", true)).toBeNull();
    expect(relativeInside("/proj", "/proj/sub", true)).toBeNull();
    expect(relativeInside("D:/Proj/a.md", "c:/proj", true)).toBeNull();
  });

  it("displayPath: relative inside the base, absolute with slashes outside", () => {
    expect(displayPath("/proj/templates/x.md", "/proj")).toBe("templates/x.md");
    expect(displayPath("C:\\other\\x.md", "C:/proj")).toBe("C:/other/x.md");
  });
});
