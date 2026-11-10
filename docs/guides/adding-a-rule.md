---
title: "Guide: adding a rule"
last_updated: 2026-11-04
---

# Guide: adding a rule

Step by step, from an empty diff to green gates. The walk-through adds one small rule,
`no-todo-value` (code `MTL310`, a warning on any frontmatter value that contains the text `TODO`),
so every command and file below is real. Swap in your own category, name and code. The rule is for
learning: it reads the value but no tag, which a real rule seldom does. If your rule needs a new
template tag, do [Adding a tag](adding-a-tag.md) first.

Read [architecture.md](../architecture.md) (layers, [where the codes live](../architecture.md#where-the-codes-live),
[rule contract](../architecture.md#rule-contract), [emission order](../architecture.md#emission-order-spec-41-84))
and [spec.md](../spec.md) sections [4.1](../spec.md#41-order-of-checks-for-one-target) and
[4.3](../spec.md#43-code-table) before you start. The spec is the contract: when code and spec
disagree, fix one of them in the same change.

## 0. Before you start

```bash
pnpm install --frozen-lockfile
pnpm run build
pnpm run check:rules
```

`check:rules` must pass on a clean tree. To try the guide without keeping the result, work on a
scratch branch, commit there, and delete the branch afterwards:

```bash
git switch -c scratch/try-a-rule
```

(`pnpm run new:rule` also takes `--root <dir>` to write into another tree. The unit test
`tests/unit/new-rule.test.ts` uses it on a copy of `src/rules/`; the spec and the code ranges are
always read from this repository.)

## 1. Choose the category, the phase and the step

A rule lives in `src/rules/<category>.ts`, one file per category, and has a phase (and for two
phases a step) that decide when the pipeline runs it.

| Your rule checks                                   | Category (see spec 4.2) | `--phase`  | `--step`                                      |
| -------------------------------------------------- | ----------------------- | ---------- | --------------------------------------------- |
| A file that does not parse                         | `syntax`                | `parse`    | none                                          |
| A tag problem of a template (a warning, or a template error such as `MTL017`: severity `error`, exit 1) | `syntax` | `template` | none |
| One template field against the target value        | by what it checks       | `field`    | one of `FIELD_STEPS` in `src/engine/rule.ts`  |
| The whole target (file name, headings, content...) | by what it checks       | `target`   | one of `TARGET_STEPS` in `src/engine/rule.ts` |

`FIELD_STEPS` run in this order for each template field: `presence`, `constant`, `count`, `range`,
`order`, `scheme`, `io`, `value-filename`, `case`, `elements`, `type`, `shape` (the format shape checks of `MTL306` to `MTL309`,
appended last). `TARGET_STEPS`: `filename`,
`unknown-keys`, `headings`, `content`, `directives`. The step fixes the emission order (spec 4.1).
The pipeline calls the `field` steps other than `presence` only when the target value is present
and not empty.

The example is a `field` rule of category `format`, step `case` (the closest step of the value
text checks). A code is never renumbered and never reused. `MTL310` is the next code after the
`format` rows of the spec table.

## 2. Write the spec row first

The scaffold reads the code and the severity from the spec, and `pnpm run check:rules` compares
every registered rule with its row (name, category, severity). Add the row to the table under
`#### format (src/rules/format.ts)` in [spec.md 4.3](../spec.md#43-code-table). Use the same
columns as the rows around it. For the example:

```text
| `MTL310` | no-todo-value | warning  | `Field '{key}': value contains TODO` | new |
```

A rule that consumes a tag also needs the tag in the tables of spec section 2 and the category
row of spec section 9. Use the message style of the neighbours (`Field '{key}': ...`,
`Heading: ...`).

`tests/consistency/rules.test.ts` pins the number of spec rows (the `toHaveLength(...)` on
`specCodes()` in the test "reads non-empty inputs"; it exists so a change of table style cannot make a
check pass on nothing). Raise that number by the number of rows you added: by one for the example.

## 3. Scaffold the rule

```bash
pnpm run new:rule -- format no-todo-value --step case
```

The arguments are `<category> <name>` and these options (`scripts/new-rule.ts`, run by `tsx`,
[ADR 0007](../adr/0007-tsx-script-runner.md)):

| Option            | Meaning                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------ |
| `--code MTLnnn`   | Explicit code inside the category range. Default: the spec row with that name, else the next free code.     |
| `--phase <phase>` | `parse`, `template`, `field` or `target`. Default: `template` for category `syntax` or with `--syntax`, else `field`. |
| `--step <step>`   | Required for the phases `field` and `target`, refused for the others.                                         |
| `--syntax`        | A template-only rule in another category (phase `template`).                                                  |
| `--root <dir>`    | Write into another tree (tests).                                                                              |

With the spec row of section 2 in place, the script picks the code `MTL310` from the row and prints:

```text
new:rule: MTL310 no-todo-value (stub) added to src/rules/format.ts
new:rule: test stub tests/target/format/MTL310-no-todo-value.test.ts, fixtures tests/fixtures/pairs/MTL310/
```

Without a spec row it chooses the next free code of the range and adds a third line telling you to
add the row and the pending entry. It never runs git and refuses a name that already exists.

What it wrote:

- In `src/rules/format.ts`, above the line `// new:rule inserts above this line`, a `defineRule({...})`
  entry whose check is `notImplemented("MTL310")` (a stub that throws when run). It also adds
  `notImplemented` to the import from `../engine/rule.js`.
- `tests/target/format/MTL310-no-todo-value.test.ts`: a stub with `const DIR = "tests/fixtures/pairs/MTL310"`,
  a table with `pass-placeholder` and `fail-placeholder`, and `it.todo` cases.
- `tests/fixtures/pairs/MTL310/pass-placeholder/` and `.../fail-placeholder/`, each with a
  `template.md` and a `target.md` holding an empty frontmatter.

The test layout follows the phase, the same rule `check:rules` applies: phase `parse` or `template`
gives `tests/syntax/<category>/<MTLxxx>-<name>.test.ts` with
`tests/fixtures/templates/<MTLxxx>/<case>.md`; phase `field` or `target` gives
`tests/target/<category>/<MTLxxx>-<name>.test.ts` with
`tests/fixtures/pairs/<MTLxxx>/<case>/template.md` and `target.md`.

## 4. Keep the stub pending

A stub counts as a pending rule: add its code to `tests/consistency/pending-rules.json` right after
the scaffold (the script never writes this file) and keep it there
until the check is real. The file maps a code to a short reason and is `{}` when nothing is pending:

```json
{
  "MTL310": "no-todo-value"
}
```

Check the state of the repository:

```bash
pnpm run check:rules
```

It must pass now (spec row, bumped count, stub, pending entry, scaffolded fixtures all agree). A
line such as `MTL310 no-todo-value: stub check, keep it in pending-rules.json` or
`... in docs/spec.md 4.3 but neither implemented ... nor pending ...` says which step is missing.

## 5. Implement the check

In `src/rules/format.ts`, replace the stub. House style is one `const` per rule with a doc comment,
listed in the exported array, so the check can pass the rule to `report`. Move your entry above
`export const rules`, and list the name in the array above the marker:

```ts
/**
 * A scalar value of a template field must not contain the text `TODO`. The pipeline runs step
 * `case` only for a present, non-empty value (spec 4.1 step 3).
 */
const noTodoValue = defineRule({
  code: "MTL310",
  name: "no-todo-value",
  severity: "warning",
  category: "format",
  phase: "field",
  step: "case",
  check: (context: FieldContext): Diagnostic[] => {
    const { value } = context;
    if (typeof value !== "string" || !value.includes("TODO")) return [];
    return [report(noTodoValue, `Field '${context.key}': value contains TODO`)];
  },
});

export const rules: readonly AnyRule[] = [
  // ... the existing rules ...
  noTodoValue,
  // new:rule inserts above this line
];
```

- Remove `notImplemented` from the import when nothing uses it any more (`typecheck` and `lint`
  fail on an unused import). The shorter import then fits on one line, so run `pnpm run format`
  before the gates. It runs `prettier --write .` over the whole tree: check `git status` first if you
  have other uncommitted files.
- Remove `MTL310` from `tests/consistency/pending-rules.json` (back to `{}`). While both the real
  check and the pending entry exist, `check:rules` says `implemented, remove it from pending-rules.json`.
- The message is the spec text, character for character.
- The check receives the context of its phase (`FieldContext`: `key`, `templateField`, `value`,
  `template`, `target`, `targetPath`, `env`) and returns diagnostics, or a promise of them.
  `report(rule, message)` takes the code and the severity from the rule.
- No tag regex outside `grammar/*.g4`. Value patterns live in the rule files or `src/engine/values.ts`.
- No `any`. Do not hand-edit `src/generated/`.
- File system and network only through `context.env.io` (`RuleIo`); tests inject `createMemoryIo`.
- A rule that reports several findings in a step with an order of its own uses `reportItem`
  (io, item order), `reportSection` (content, section order, optional `anchorLine`) or
  `reportSequenced` (directives), see [emission order](../architecture.md#emission-order-spec-41-84).
- A `target` rule whose finding is about one target line that only it knows records that line as
  the anchor with `reportOnLine` or `setAnchorLine`, so a disable directive can cover it. Field
  findings get the key line from the pipeline. See
  [anchor lines](../architecture.md#anchor-lines-spec-44-dir5) and
  [spec 4.4](../spec.md#44-disable-directives-in-target-files).

## 6. Write the fixtures and the test

One fixture per case, named `pass-<what is true>` or `fail-<what goes wrong>` in kebab-case, never
numbered. At least one `pass-` and one `fail-` case, any number of each: a `pass-` case per limit
case, a `fail-` case per distinct failure. The scaffold wrote two placeholder cases: rename each
folder to its descriptive name (in your editor, or `mv` / `Move-Item`; the folders are untracked, so
`git mv` does not apply) and edit its files. For the example the two cases
end up as:

`tests/fixtures/pairs/MTL310/pass-value-without-todo/template.md`:

```markdown
---
title: example
---
```

`tests/fixtures/pairs/MTL310/pass-value-without-todo/target.md`:

```markdown
---
title: hello
---
```

`tests/fixtures/pairs/MTL310/fail-value-contains-todo-marker/template.md` (same as above), and
`.../target.md`:

```markdown
---
title: TODO write this
---
```

Each case folder holds exactly `template.md` and `target.md`. Then replace the stub test with real
cases. This is the shape every `tests/target/` file has (compare
`tests/target/bounds/MTL401-count-min.test.ts`): the case table, a check that the table equals the
fixture folder, and one test per case:

```ts
/** MTL310 no-todo-value (src/rules/format.ts, docs/spec.md 4.3). */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkTarget, checkTemplate } from "../../../src/engine/pipeline.js";
import { createRegistry } from "../../../src/engine/registry.js";
import { createEnv } from "../../../src/engine/rule.js";

const registry = createRegistry();
const CODE = "MTL310";
const DIR = "tests/fixtures/pairs/MTL310";

interface TestCase {
  readonly name: string;
  /** Expected MTL310 messages, in order. */
  readonly expected: readonly string[];
}

/** Case -> fixture dir (same name) -> expected result. At least 1 pass- and 1 fail- case. */
const CASES: readonly TestCase[] = [
  { name: "pass-value-without-todo", expected: [] },
  {
    name: "fail-value-contains-todo-marker",
    expected: ["Field 'title': value contains TODO"],
  },
];

const read = (path: string): string =>
  readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), "utf8");

/** The MTL310 diagnostics for the pair of a fixture folder. */
async function lint(testCase: TestCase) {
  const fixture = `${DIR}/${testCase.name}`;
  const status = await checkTemplate(registry, read(`${fixture}/template.md`));
  if (status.status !== "ok") throw new Error(`${fixture}: template is broken`);
  const found = await checkTarget(
    registry,
    status.model,
    read(`${fixture}/target.md`),
    `${fixture}/target.md`,
    createEnv(),
  );
  return found.filter((diagnostic) => diagnostic.code === CODE);
}

describe("MTL310 no-todo-value", () => {
  it("is registered in category format, warning, field step case", () => {
    expect(registry.byCode.get(CODE)).toMatchObject({
      name: "no-todo-value",
      category: "format",
      severity: "warning",
      phase: "field",
      step: "case",
    });
  });

  it("has at least 1 pass- case and at least 1 fail- case, one fixture dir each", () => {
    const passing = CASES.filter((testCase) => testCase.name.startsWith("pass-"));
    const failing = CASES.filter((testCase) => testCase.name.startsWith("fail-"));
    expect(passing.length).toBeGreaterThanOrEqual(1);
    expect(failing.length).toBeGreaterThanOrEqual(1);
    expect(passing.length + failing.length).toBe(CASES.length);
    const dirs = readdirSync(fileURLToPath(new URL(`../../../${DIR}`, import.meta.url))).sort();
    expect(dirs).toEqual(CASES.map((testCase) => testCase.name).sort());
  });

  for (const testCase of CASES) {
    it(`${testCase.name}: ${DIR}/${testCase.name}`, async () => {
      const found = await lint(testCase);
      expect(found.map((diagnostic) => diagnostic.message)).toEqual(testCase.expected);
      for (const diagnostic of found) expect(diagnostic.severity).toBe("warning");
    });
  }
});
```

What `check:rules` enforces on these files (`tests/consistency/rule-fixtures.ts`): one fixture family
per code (syntax or target, from the phase), one test file per code, the case-name format, the pair
folder shape, a case table (`name: "..."` entries outside comments) equal to the fixture listing, the
fixture folder written as a quoted string in the test file (`const DIR = "..."`), and no orphan
fixture folder or test file. A control outside the pass-/fail- split (for example "no tag, no
diagnostic") lives in `tests/fixtures/rule-controls/<MTLxxx>-<name>/` and is named, quoted, by the
test of its code.

Rules of the road for tests: never touch the network (inject `createEnv`, `createMemoryIo`); keep
case text in fixtures, not inline; the person or agent who writes the tests should not be the one who
wrote the check. The kinds of test, the helpers and the gate order are in [Testing](testing.md).

Variants of the test file:

- Template-only rule (phase `parse` or `template`, layout `tests/syntax/`): the cases are template
  files run through `--verify`; use `verifyFixture` and `expectTemplateCases` of
  `tests/helpers/verify.ts`, as `tests/syntax/syntax/MTL010-unknown-field-tag.test.ts` does.
- Directive warnings (`MTL020` to `MTL025`, `tests/target/syntax/`): use `findingsOf`,
  `expectCases`, `expectDirectiveRule` and `at` of `tests/helpers/directives.ts`.

## 7. Run the gates, in this order

One command at a time, each must exit 0. Run `pnpm run build` right before `pnpm test`: the spawn
tests skip themselves when `dist/cli.js` is older than `src/`.

```bash
pnpm run check:parser
pnpm run check:rules
pnpm run typecheck
pnpm run lint
pnpm run format:check
pnpm run build
pnpm test
```

`pnpm exec vitest run tests/target/format/MTL310-no-todo-value.test.ts` runs your test file alone.
`pnpm run format` (`prettier --write .`) rewrites the whole tree in Prettier style when `format:check` complains.
The coverage gate (`pnpm run coverage`, 85% in `src/engine`, `src/rules` and `src/tags`) is not in CI
(`ci.yml` runs the other gates); run it by hand before a commit (see [CONTRIBUTING.md](../../CONTRIBUTING.md)).

## 8. Update the docs

- [spec.md](../spec.md): the code row (step 2) and, for a rule with a tag, sections 2 and 9.
- README: the rule tables of "Rule syntax by category".
- An ADR in `docs/adr/` for a design decision (see [CONTRIBUTING.md](../../CONTRIBUTING.md)).
- Syntax reference: add a `FIX_NOTES` entry keyed by the code in `scripts/syntax-doc/notes.ts` with the typical fix (one line), then run `pnpm run gen:syntax-doc`.
- Commit as Conventional Commits (`feat(rules): add no-todo-value`).

If you were only trying the guide, commit on the scratch branch, switch back and delete it:

```bash
git switch main
git branch -D scratch/try-a-rule
```

## See also

- [adding-a-rule.md](../adding-a-rule.md): the earlier single-file version of this guide, with the
  scaffold flags in detail.
- [Adding a tag](adding-a-tag.md), [Grammar and listeners](grammar-and-listeners.md), [Testing](testing.md).
- [Architecture](../architecture.md), [spec 4.3 code table](../spec.md#43-code-table), [glossary](../glossary.md).
