---
# [unique-headings-names]
goal: One sentence stating the research question # [presence:required]
sources: # [presence:required] [list-of-url]
  - https://example.org/source
last_updated: 2026-11-11 # [presence:required] [format:date] [date]
---

# Research: Topic [pattern:"Research: {text}"]

A question and answer research note: sourced facts first, then where they agree
or conflict, what is still unknown, and a direct answer. List every source in the
`sources` frontmatter field and cite it next to each fact.

## Question & goal [content:non-empty]

**What are we researching?** Restate the goal from the frontmatter in your own words.

## I. Facts [content:list]

One fact per line, each with its source as `[SOURCE: URL]` or `[SOURCE: file:line]`.

- First fact, stated plainly. [SOURCE: https://example.org/source]
- Second fact. [SOURCE: docs/spec.md:42]

## II. Cross-references [content:list]

Where the sources agree or conflict.

- Sources A and B both report the same behaviour.
- Sources A and C disagree on a detail. (A: [SOURCE: https://example.org/a], C: [SOURCE: https://example.org/c])

## III. Gaps [content:list]

What was not found: ambiguities, unresolved questions, missing context.

- Unresolved question, with what would settle it.
- Missing context that limits the answer.

## Answer [content:non-empty]

A direct answer to the research question that synthesizes the key facts, in one to
three sentences connecting the findings to the original question.

### Key points [content:list]

The most relevant facts, as a short list.

- First key point.
- Second key point.

### Caveats & limitations [content:list]

Version-specific gotchas, context-dependent answers and limits of the research.

- First caveat.
- Second caveat.

## Authoring checklist [presence:template-only]

- Save as `docs/research/topic.md`. Keep the frontmatter and refresh
  `last_updated` on every change.
- `goal` and `sources` are required. `sources` needs at least one URL: an
  empty list is `MTL201`. List every source you cite.
- Cite every fact with `[SOURCE: URL]` or `[SOURCE: file:line]`.
- The H1 reads `Research: ` followed by your topic.
- Headings are matched by exact level and exact text, in template order. Insert
  no section between two template sections; add your own after the last one (a
  warning, not an error).
- Drop no required heading. For an empty required list write `- None.`
- Delete this section and every `[tag:...]` marker before saving.
