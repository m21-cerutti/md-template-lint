---
# [unique-headings-names]
goal: One sentence stating the research question # [presence:required]
priority_order: # [presence:required] [list-of-string] [count:min:1]
  - feature-parity/needs
  - popularity
  - simplicity
  - cost
  - performance
sources: # [presence:required] [list-of-url]
  - https://example.org/source
last_updated: 2026-11-11 # [presence:required] [format:date] [date]
---

# Research report: Topic [pattern:"Research report: {text}"]

A technical solution comparison: sourced facts, a fit-first comparison table, and
one recommended solution with its alternatives. List every source in the
`sources` frontmatter field and cite it next to each fact.

## Goal & criteria [content:non-empty]

**Research question:** Restate the goal from the frontmatter in your own words.

**Priority criteria (ordered):** use the order of `priority_order`. The default is:

1. Feature parity / user needs: does it solve the problem?
2. Popularity: community adoption, stars, maintenance.
3. Simplicity: ease of use, learning curve, setup complexity.
4. Cost: licensing, infrastructure, operational cost.
5. Performance: speed, resource usage, scalability.

## I. Facts [content:list]

One fact per line, each with its source as `[SOURCE: URL]` or `[SOURCE: file:line]`.

- First fact, stated plainly. [SOURCE: https://example.org/source]
- Second fact. [SOURCE: docs/spec.md:42]

## II. Cross-references [content:list]

Where the sources agree or conflict.

- Sources A and B both report the same behaviour.
- Sources A and C disagree on a detail. (A: [SOURCE: https://example.org/a], C: [SOURCE: https://example.org/c])

## III. Gaps [content:list]

What was not found: ambiguities, version-dependent details, unresolved questions.

- Unresolved question, with what would settle it.
- Platform support that is still undocumented.

## IV. Metrics summary [content:table]

### Comparison table [content:table]

Sort rows by the priority criteria (fit first), then by popularity as tiebreaker.
Use one `Fit` column per criterion of `priority_order`, then the key metrics.

| **Solution** | **Fit: criterion 1** | **Fit: criterion 2** | **Popularity** | **Latest version** | **Last update** | **Platforms**  | **License** | **Status**  |
| ------------ | -------------------- | -------------------- | -------------- | ------------------ | --------------- | -------------- | ----------- | ----------- |
| Solution A   | ✓✓✓                  | ✓✓                   | 5.2K stars     | v1.2.0             | 2026-10-01      | Windows, Linux | MIT         | Active      |
| Solution B   | ✓✓                   | ✓✓✓                  | 2.1K stars     | v0.9.0             | 2026-05-12      | macOS, Linux   | Apache-2.0  | Maintenance |

### Fit scoring legend [content:list]

- ✓ = Partial fit (meets the criterion with limitations).
- ✓✓ = Good fit (meets the criterion well).
- ✓✓✓ = Excellent fit (exceeds the criterion).
- ✗ = Does not fit (fails the criterion).

## V. Recommended solution [content:non-empty]

The one solution that best matches the priority criteria. Name it in the first
heading below.

### Solution name [pattern:"{text}"] [content:non-empty]

**Why this solution:** one or two sentences connecting its strengths to the
priorities, for example "Solution X best aligns with your priorities: full
feature parity (✓✓✓), active maintenance and no cost barrier."

### Pros [content:list]

- Specific advantage.
- Another specific advantage.

### Cons [content:list]

- Trade-off or limitation.
- Another trade-off.

### Fit score against your criteria [content:table]

| Criterion   | Assessment    | Evidence                    |
| ----------- | ------------- | --------------------------- |
| Criterion 1 | ✓✓✓ Excellent | Why.                        |
| Criterion 2 | ✓✓ Good       | Why.                        |
| Criterion 3 | ✓ Partial     | Why, and the limitation.    |
| Criterion 4 | ✗ Poor        | Why, or why not applicable. |

### Next steps [content:list]

How to get started, resources and known pitfalls.

- Installation: command or link.
- Documentation: URL.
- Common issues: first known gotcha, second known gotcha.

## Alternative solutions [presence:optional] [content:non-empty]

Use when the decision is still open or several solutions are close in fit. One H3
per alternative.

### Alternative solution name [pattern:"{text}"] [repeat-rules:same-level] [content:non-empty]

**Why to consider:** a brief justification.

**Fit score:** criterion 1: ✓✓, criterion 2: ✓✓✓.

**Trade-offs vs. recommended:**

- Advantage: what it does better.
- Disadvantage: what it does worse.

## Caveats & unknowns [presence:optional] [content:list]

Version-specific gotchas, deprecated features and limits of the research.

- First caveat.
- Second caveat.

## Authoring checklist [presence:template-only]

- Save as `docs/research/topic.md`. Keep the frontmatter and refresh
  `last_updated` on every change.
- `goal` and `sources` are required. `sources` needs at least one URL: an
  empty list is `MTL201`. List every source you cite.
- `priority_order` lists the criteria, most important first; keep at least one.
- Cite every fact with `[SOURCE: URL]` or `[SOURCE: file:line]`.
- The H1 reads `Research report: ` followed by your topic. The first H3 under
  `V. Recommended solution` is the name of the solution you recommend.
- Add one `###` block per alternative under `Alternative solutions`, or delete
  the whole section.
- Headings are matched by exact level and exact text, in template order. Insert
  no section between two template sections; add your own after the last one (a
  warning, not an error). Delete the optional sections you do not need.
- Drop no required heading. For an empty required list write `- None.`; for an
  empty table write `None.` in the first cell.
- Delete this section and every `[tag:...]` marker before saving.
