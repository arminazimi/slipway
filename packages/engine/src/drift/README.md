# `drift/`

Checks that compare what a page says with the code it points at. Every function here is a deterministic
transform of its arguments: no clock, network, or environment reads. `git-age.ts` also reads git history
through git, which is an input like the arguments: the same repository gives the same answer (ADR 0022,
rule 5).

- `git-age.ts`: `gitAge(root, pageFile, refFiles)` compares the last commit of a page with the newest
  commit among the files it references and returns the whole days between them, or `"unknown"` when git,
  a work tree, or either history is missing. It never throws, never reads the clock, checks the
  repository once per root, and asks git about each path once across calls. The cases are in
  `../../test/drift-git-age.test.ts`.
- `code-refs.ts`: `codeRefsOf(page)` (asynchronous, parses `page.markdown`) and `codeRefsIn(tree, file?)`
  find `path:line`, `path:line:col`, `path:line-line`, and `path#Lx-Ly` references in text, inline code,
  link URLs, and `test` fences. Paths resolve from the page's source folder unless they start with `/`,
  which anchors them at the repository root. Each result carries the span of the Markdown node that holds
  it, in document order and without duplicates at the same span. The rules are in the module's header
  comment; the cases are in `../../test/drift-code-refs.test.ts`.
