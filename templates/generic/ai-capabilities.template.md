---
# [unique-headings-names]
title: AI Capabilities # [presence:required]
last_updated: 2026-09-06 # [presence:required] [format:date] [date]
---

# AI capabilities

## Authoring notes [presence:template-only]

- Save as `docs/ai-capabilities.md`. Keep the frontmatter, delete this
  section and every `[tag:...]` marker from the heading lines.
- List only PROJECT-LOCAL capabilities in the tables. Global capabilities
  live in the user's own opencode configuration: keep the one pointer line
  (no personal path), never list them.
- Do not delete a required heading with no entries: write `None.` in the first
  table cell. Delete the optional sections you do not need.
- Headings are matched by exact level and exact text, in template order. Insert
  no section between two template sections; add your own after the last one,
  `Verification` (a warning, not an error).
- Update this file whenever a capability is added, renamed or removed.

## Scope [content:non-empty]

Map of the AI capabilities configured for this repository. It is a map, not
the rulebook: [AGENTS.md](../AGENTS.md) and the executable configuration
(`opencode.jsonc`, CI, hooks) win on any conflict.

Something listed in [TODO.md](../TODO.md) as planned may not exist yet; check
the actual folder before relying on it.

## Agents [content:table]

Project agents live in `.opencode/agents/`.

| Agent    | Role                                  |
| -------- | ------------------------------------- |
| `[name]` | [Role, scope and limits in one line.] |

## Skills [content:table]

Project skills live in `.opencode/skills/`.

| Skill    | Purpose                              |
| -------- | ------------------------------------ |
| `[name]` | [What it does and when it triggers.] |

## Commands [content:table]

Project commands live in `.opencode/commands/`.

| Command   | Purpose                  |
| --------- | ------------------------ |
| `/[name]` | [What the command runs.] |

## Tools [content:table]

Project tools live in `.opencode/tools/`.

| Tool     | Purpose                               |
| -------- | ------------------------------------- |
| `[name]` | [What it wraps and its side effects.] |

## Scripts [presence:optional] [content:table]

CLI entry points live in `scripts/`.

| Script      | Purpose                                     |
| ----------- | ------------------------------------------- |
| `[name.py]` | [What it does, key flags, dry-run default.] |

## MCP servers [presence:optional] [content:table]

Declared in `opencode.jsonc`.

| Server   | Enabled  | Purpose                                   |
| -------- | -------- | ----------------------------------------- |
| `[name]` | [yes/no] | [What it provides and its prerequisites.] |

## Global capabilities [content:non-empty]

Global agents, skills, commands and MCPs are configured per user, outside this repository, and are not duplicated here. If you keep a global inventory, see that one.

## Verification [content:non-empty]

Validate the capability definitions after any change with the `opencode-lint` skill (command `/lint`).
