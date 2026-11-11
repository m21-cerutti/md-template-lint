---
# [filename:case:kebab-case]
# [unique-headings-names]
description: One line on what the agent does and when to pick it # [presence:required]
mode: primary | subagent | all # [presence:required]
model: provider/model-id # [presence:optional] [string]
permissions: # [presence:optional]
  - { action: edit, resource: "*", effect: ask }
  - { action: shell, resource: "*", effect: ask }
  - { action: shell, resource: "git push*", effect: deny }
---

# Agent title [pattern:"{text}"]

One sentence: the agent in plain words.

## Role [content:non-empty]

Who the agent is and the one job it owns. Name what it must never do.

## Task [content:non-empty]

What the caller hands over and what the agent does with it. State the inputs it
expects and the steps it follows, in order.

## Format [content:non-empty]

The exact shape of the final answer: sections, tables or a verdict line. The
caller parses it, so keep it stable.

## Rules [presence:optional] [content:list]

- Short, checkable rule one.
- Short, checkable rule two.

## Authoring checklist [presence:template-only]

- Save as `.opencode/agents/short-name.md` (kebab-case); the file name is the
  agent name.
- `mode`: `primary` agents talk to the user, `subagent` agents are called by
  another agent, `all` allows both.
- `model` is optional; leave it out to inherit the default. Never hard-code a
  key or a private endpoint.
- `permissions` is a list of rows `{ action, resource, effect }`. `action` is
  the tool (`edit`, `shell`, `webfetch`), `resource` is a pattern in quotes, and
  `effect` is `allow`, `ask` or `deny`. Start strict (`ask` or `deny`) and open
  only what the role needs; a later row wins over an earlier one.
- Keep Role, Task and Format short. A long prompt costs tokens on every call.
- Headings are matched by exact level and exact text, in template order. Insert
  no section between two template sections; add your own after the last one,
  `Rules` (a warning, not an error). Delete the optional sections you do not
  need.
- Delete this section and every `[tag:...]` marker before saving.
