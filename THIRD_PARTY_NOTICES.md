# Third-party notices

md-template-lint is MIT licensed (see `LICENSE`). It uses the packages below.
Versions are pinned exactly in `package.json`. Checked on 2026-10-29 against the
installed `node_modules/<pkg>/package.json`, the license file shipped in the
package and the license detected by GitHub for the source repository.

## Runtime dependencies (shipped with the package)

`pnpm ls --prod --depth Infinity` lists exactly these two, with no transitive runtime
dependencies.

| Package    | Version | npm `license` field | Shipped license file                                                        | GitHub repository license          | Conclusion   |
| ---------- | ------- | ------------------- | --------------------------------------------------------------------------- | ---------------------------------- | ------------ |
| `antlr4ng` | 3.0.16  | `BSD-3-Clause`      | `LICENSE.txt`: "The BSD license", Copyright (c) 2012-2023 The ANTLR Project, 3 clauses | `mike-lischke/antlr4ng`: `NOASSERTION` (GitHub cannot classify it; the text is the same 3-clause BSD) | BSD-3-Clause |
| `yaml`     | 2.9.1   | `ISC`               | `LICENSE`: ISC, Copyright Eemeli Aro                                         | `eemeli/yaml`: ISC                 | ISC          |

## Build-time dependency (not shipped)

| Package    | Version | npm `license` field | Shipped license file                                     | GitHub repository license                         | Conclusion   |
| ---------- | ------- | ------------------- | -------------------------------------------------------- | ------------------------------------------------- | ------------ |
| `antlr-ng` | 1.0.10  | `MIT`               | `License.txt`: "BSD 3-clause License", Copyright (c) 2022, 2025, Mike Lischke | `antlr-ng/antlr-ng` (redirected from `mike-lischke/antlr-ng`): `BSD-3-Clause` | BSD-3-Clause |
| `jiti`     | 2.7.0   | `MIT`               | `LICENSE`: MIT, Copyright (c) Pooya Parsa                | not checked (npm field and shipped file agree)    | MIT          |

`jiti` only loads `eslint.config.ts` for `pnpm run lint` (ADR 0004).
`antlr-ng` is only used by `pnpm run gen:parser`. Its own dependencies (`commander`
13.1.0, `stringtemplate4ts` 1.0.9, `unicode-properties` 1.4.1) are MIT on npm and are
not shipped either.

## Findings

- `antlr-ng`: the npm metadata says MIT, but the license file in the npm tarball and
  the GitHub repository both say BSD-3-Clause. We treat it as BSD-3-Clause, the
  stricter of the two. It is a dev dependency, so the package does not redistribute
  it.
- `antlr4ng`: npm, the shipped file and the repository text agree on BSD-3-Clause.
  GitHub only fails to classify the file. Redistribution keeps the copyright notice
  and the three clauses. This file is that notice.
- MIT, BSD-3-Clause and ISC are compatible with distributing md-template-lint under MIT.

## Open item for the owner

- The parser under `src/generated/` is produced by `antlr-ng` from
  `grammar/MdTemplateLexer.g4` and `grammar/MdTemplateParser.g4` and is committed. Neither `antlr-ng` nor `antlr4ng`
  states a license for generated output. The ANTLR project's usual position is
  that generated code belongs to the grammar author, but this was not confirmed
  for antlr-ng. Unresolved; please confirm before the first release.
- The `antlr-ng` npm `license` field (MIT) conflicts with its license file
  (BSD-3-Clause). This could be reported upstream. It does not block us.

## License texts

### antlr4ng (BSD-3-Clause)

Copyright (c) 2012-2023 The ANTLR Project. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are
permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of
   conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice, this list
   of conditions and the following disclaimer in the documentation and/or other
   materials provided with the distribution.
3. Neither name of copyright holders nor the names of its contributors may be used to
   endorse or promote products derived from this software without specific prior
   written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL
THE REGENTS OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

### yaml (ISC)

Copyright Eemeli Aro <eemeli@gmail.com>

Permission to use, copy, modify, and/or distribute this software for any purpose with or
without fee is hereby granted, provided that the above copyright notice and this
permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO
THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO
EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL
DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN
AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN
CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
