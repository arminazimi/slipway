# `drift/`

Checks that compare what a page says with the code it points at. Every function here is a deterministic
transform of its arguments: no disk, clock, network, or environment reads.

- `code-refs.ts`: `codeRefsOf(page)` (asynchronous, parses `page.markdown`) and `codeRefsIn(tree, file?)`
  find `path:line`, `path:line:col`, `path:line-line`, and `path#Lx-Ly` references in text, inline code,
  link URLs, and `test` fences. Paths resolve from the page's source folder unless they start with `/`,
  which anchors them at the repository root. Each result carries the span of the Markdown node that holds
  it, in document order and without duplicates at the same span. The rules are in the module's header
  comment; the cases are in `../../test/drift-code-refs.test.ts`.
