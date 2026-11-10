---
urls:
  - https://example.com
  - HTTP://EXAMPLE.COM
  - "http://user@host:8080/a?b=1#c"
  - git+ssh://host
  - a-b.c://host
  - "http://[::1]/x"
  - "https://example.com/a<b>{c}"
padded:
  - " https://example.com "
  - "\thttps://example.com\t"
restricted: [ftp://files.example.com, gopher://old.example]
inferred_from_values: [https://c.example, ftp://d.example]
single_item:
  - https://only.example
note: not a url
site: https://example.com
meta:
  k: v
tags: [www.example.com, example.com]
blank_value:
spaces_only: "   "
empty_list: []
---
