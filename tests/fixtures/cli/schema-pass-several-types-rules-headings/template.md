---
# [filename:case:snake_case]
id: "string" # [presence:required] [value:filename]
status: "draft | accepted" # [presence:optional]
slug: "string" # [format:kebab-case] [format:constant:fixed]
tags: ["a"] # [count:min:1] [count:max:5] [format:elements:kebab-case]
rating: "3" # [int] [range:min:1] [range:max:5.5]
homepage: "https://example.org" # [format:scheme:https,http,https] [io:exists]
milestones: ["2026-01", "2026-06"] # [order:ascending]
owner: "string" # [presence:conditional:only when risky] [presence:optional]
note: "string" # [count:min:2] [count:min:9]
plain: "string"
everything: "red | green" # [io:exists] [order:ascending] [format:scheme:https,http] [range:max:9] [range:min:1] [count:max:4] [count:min:2] [value:filename] [format:elements:snake_case] [format:snake_case] [format:constant:red] [presence:optional]
---

# ADR [presence:required]

## Context [presence:required] [content:non-empty]

## Options [content:table] [content:list] [content:min-lines:2] [content:max-lines:10]

## Notes [presence:optional]

## Review [pattern:"{text}"]

## Authoring checklist [presence:template-only]

## Gate [presence:required] [presence:conditional:when ready]

## Review gate [presence:conditional:only when risky]

## Both [presence:template-only] [presence:optional]

## Mixed [presence:required] [presence:optional]

## Free text
