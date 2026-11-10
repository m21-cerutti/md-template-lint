---
title: "string"
---
# Book [pattern:"Book {text}"]
## Release [pattern:"[{semver}] - {date}"] [repeat-rules:same-level] [order:descending]
### Step [PATTERN:"Step {digits}"] [Repeat-Rules:Same-Level:Min:2] [Order:First:Number:Ascending]
#### Sprint [pattern:"Sprint {date}"] [repeat-rules:same-level:max:3] [order:first:date:descending]
##### Version [pattern:"v{semver:format:core} \"x\" \\ {{y}}"] [repeat-rules:same-level] [order:first:semver:ascending]
###### Notes [content:subheadings:no-extra]
## Epic [pattern:"Epic {char} - {text}"] [repeat-rules:same-level] [ORDER:ASCENDING]
