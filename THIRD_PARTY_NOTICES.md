---
last_updated: 2026-11-11
---

# Third-party notices

md-template-lint is licensed under MIT, see [LICENSE](LICENSE).
This file lists the third-party material that md-template-lint uses, bundles or
ships, with the license of each item.

Checked on 2026-11-11 against the installed packages in `node_modules` (versions
as locked in `pnpm-lock.yaml`), the license file shipped in each package, and the
generation tool `antlr-ng` 1.0.10.

Scope: runtime dependencies (`dependencies` in `package.json`, no transitive
runtime dependencies) and the material derived from a build tool that ends up in
`dist/` (the generated parser). Not listed: the other build and development
tools (`devDependencies`: compilers, linters, test runners, script runners). They
are not shipped in the package. Runtime dependencies are not bundled: npm
installs them next to the package. `package.json` pins the runtime dependencies
and `antlr-ng` to exact versions; the other development tools use version
ranges.

<!-- prettier-ignore-start -->
<!-- omit in toc -->
## Summary
<!-- prettier-ignore-end -->

- [Packages](#packages)
- [antlr4ng 3.0.16](#antlr4ng-3016)
- [yaml 2.9.1](#yaml-291)
- [antlr-ng 1.0.10](#antlr-ng-1010)
- [Generated or derived material](#generated-or-derived-material)
- [Regeneration](#regeneration)

## Packages

| Package    | Version | License (SPDX) | Scope     |
| ---------- | ------- | -------------- | --------- |
| `antlr4ng` | 3.0.16  | BSD-3-Clause   | runtime   |
| `yaml`     | 2.9.1   | ISC            | runtime   |
| `antlr-ng` | 1.0.10  | BSD-3-Clause   | generated |

## antlr4ng 3.0.16

- Upstream: <https://github.com/mike-lischke/antlr4ng>
- License: BSD-3-Clause
- Copyright: Copyright (c) 2012-2023 The ANTLR Project. All rights reserved.
- Used as: runtime dependency (the generated parser calls it)

```text
[The "BSD license"]
Copyright (c) 2012-2023 The ANTLR Project. All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions
are met:

1. Redistributions of source code must retain the above copyright
notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright
notice, this list of conditions and the following disclaimer in the
documentation and/or other materials provided with the distribution.

3. Neither name of copyright holders nor the names of its contributors
may be used to endorse or promote products derived from this software
without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
``AS IS'' AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE REGENTS OR
CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

## yaml 2.9.1

- Upstream: <https://github.com/eemeli/yaml>
- License: ISC
- Copyright: Copyright Eemeli Aro <eemeli@gmail.com>
- Used as: runtime dependency

```text
Copyright Eemeli Aro <eemeli@gmail.com>

Permission to use, copy, modify, and/or distribute this software for any purpose
with or without fee is hereby granted, provided that the above copyright notice
and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
THIS SOFTWARE.
```

## antlr-ng 1.0.10

- Upstream: <https://github.com/mike-lischke/antlr-ng>
- License: BSD-3-Clause
- Copyright: Copyright (c) 2022, 2025, Mike Lischke. All rights reserved.
- Used as: derived code (build tool that generated the parser shipped in `dist/generated/`; the tool itself is not shipped)

The npm `license` field of this package says MIT, but the license file in the
package says BSD-3-Clause. This file follows the license file, the stricter of the
two.

```text
BSD 3-clause License

Copyright (c) 2022, 2025, Mike Lischke. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS “AS IS” AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

## Generated or derived material

Generated parser (`dist/generated/*.js` and `*.d.ts`: lexer, parser, listener, visitor):
compiled from `src/generated/`, which `antlr-ng` 1.0.10 generates from our own
grammars `grammar/MdTemplateLexer.g4` and `grammar/MdTemplateParser.g4`. The
grammars are our work (MIT, see [LICENSE](LICENSE)). The owner decided on
2026-10-30 that the shipped generated parser is released under the MIT license of
this project, see [ADR 0008](docs/adr/0008-generated-parser-licence.md). The
generated files carry no license header (checked: no "license" or "copyright"
text in `src/generated/`). Neither `antlr-ng` nor `antlr4ng` states a license for
generated output; this is an owner decision, not a legal opinion. The generated
code calls the `antlr4ng` runtime, which stays BSD-3-Clause (above).

## Regeneration

```bash
pnpm ls --prod --depth Infinity
pnpm licenses list --prod
```

Review the diff by hand before committing.
