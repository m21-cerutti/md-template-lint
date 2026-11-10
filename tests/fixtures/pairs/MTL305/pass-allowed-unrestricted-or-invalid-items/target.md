---
links:
  - https://a.example.com
  - http://b.example.com
  - not a url
mirrors:
  - ftp://files.example.com
padded:
  - "  https://example.com  "
nested_items:
  - [ftp://files.example.com]
  - {a: ftp://files.example.com}
scalar_value: ftp://files.example.com
mapped:
  a: ftp://files.example.com
free:
  - ftp://files.example.com
plain:
  - ftp://files.example.com
wrong_type:
  - ftp://files.example.com
blank: ""
spaces: "   "
bare:
empty_list: []
---
