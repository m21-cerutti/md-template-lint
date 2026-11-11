---
# [filename:case:kebab-case]
# [unique-headings-names]
id: 0000-record-template # [presence:required] [value:filename] [format:kebab-case]
title: Short imperative statement of the decision # [presence:required]
status: proposed | accepted | rejected | superseded | deprecated # [presence:required]
date: 2026-10-29 # [presence:required] [format:date] [date]
deciders: [Name] # [presence:optional]
supersedes: 0000-other-record # [presence:optional]
---

# ADR 0000: Title [pattern:"ADR {digits:format:padding:4}: {text}"]

One-sentence restatement of the decision, readable on its own.

## Context [content:non-empty]

Forces at play: constraints, existing code to reuse, scale figures, prior art,
what breaks if nothing is decided. State facts, not preferences.

## Decision [content:non-empty]

What was chosen, in the present tense: "The backend uses X."
Include the concrete shape (names, folders, protocols) that follows from it.

## Consequences [content:list]

- Positive consequence.
- Negative consequence or accepted cost.
- Follow-up work this decision creates.

## Alternatives considered [content:table]

| Option          | Pros                | Cons          | Verdict  |
| --------------- | ------------------- | ------------- | -------- |
| Chosen option   | why it wins         | what it costs | Chosen   |
| Rejected option | what was attractive | why it lost   | Rejected |

## Research [presence:optional] [content:non-empty]

Sources, measurements or spikes that fed the decision. Link them.

## Notes [presence:optional] [content:non-empty]

Open points, review date, or links to related records.

## Authoring checklist [presence:template-only]

- Save as `docs/adr/NNNN-short-title.md`; `id` equals the filename stem.
- The H1 reads `ADR NNNN: Title`; NNNN is four digits and is the number in the
  file name.
- `status` starts at `proposed`; flip to `accepted` once the decision is live,
  or to `rejected` when it is turned down.
- `deciders` is optional: list the people or roles who took the decision.
- When this record replaces an older one, set `supersedes` and flip the old
  record to `superseded`.
- Keep at least one rejected option: an ADR with a single option documents
  nothing.
- Headings are matched by exact level and exact text, in template order. Insert
  no section between two template sections; add your own after `Notes` (a
  warning, not an error). Delete the optional sections you do not need.
- Delete this section and every `[tag:...]` marker before saving.
