# 0007. Source maps: three levels, from a Liquid page map to a plugin with exact lines

**Status:** Accepted (2026-10-18)

## Context

Slipway's signature is that a finding on a built page points at the Markdown file and line an agent should edit, not at the generated HTML. Seaworthy defines the file format (`spec.source-map`, Seaworthy issue #381); Slipway has to produce it. Issue #49 asks what can be produced on classic GitHub Pages, with no build step and no custom code, and what needs Actions mode.

## Method

The same throwaway site as ADR 0006: the `github-pages` gem 232 (Jekyll 3.10.0, kramdown 2.4.0), Ruby 3.3.12. A document with tricky headings (inline code, an apostrophe, an accented word, a Persian heading with a zero-width non-joiner, a setext heading, a duplicate title, and `#` lines inside a code fence) and a document with links in a paragraph and in a list. Three experiments: a page-to-file map in Liquid, a section-to-line map computed in Liquid from the included source, and a script that walks kramdown's parse tree, the way a Jekyll plugin could.

## Results

### Page to file: works in pure Liquid

A page with `{% for p in site.pages | concat: site.docs | concat: site.posts %}` and `p.url`, `p.path` emitted a JSON map with no stubs: `/docs/intro.html` maps to `_docs/intro.md`. It also lists generated pages (stylesheets, the twin stubs of ADR 0006), so the real map filters by folder.

### Section to line in Liquid: possible, but approximate

A stub page can include the source and scan its lines (`split` on newline, a fence flag, and `forloop.index`). Line numbers are exact, front matter included. The problems:

| Case | Result |
| --- | --- |
| `# Install npm packages` | line 6, found |
| `#` lines inside a code fence | skipped correctly |
| Heading id, apostrophe: `What's new?` | Liquid `slugify` gives `faq-what-s-new`; the page's id is `faq-whats-new` |
| Heading id, Persian with ZWNJ | Liquid gives `راست-به-چپ…`; the page's id is `راستبهچپ…` |
| Duplicate title | the page's second id is `…-1`; Liquid cannot number duplicates without more state |
| Setext heading (`Title` over `-----`) | missed |
| Links and paragraphs | not mapped |

So Liquid can number headings but cannot reproduce kramdown's ids, cannot see setext headings, and cannot map links. It also needs one stub per page.

### Section and link to line from kramdown's tree: exact

kramdown records a line (`options[:location]`) on every block and span element. A script that parses the document body (after the front matter) and walks the tree got exact lines and the page's own ids:

| Element | Result |
| --- | --- |
| Headings, including the setext one | line 23 for the setext heading; ids identical to the HTML (`faq-whats-new`, `راستبهچپ-…`, `install-npm-packages-1`) |
| Code block | the line of the opening fence |
| Paragraph | the first line |
| Link | the line of the link, also inside a list item (a broken link in a post at line 8 was found at line 8) |

The offset for the front matter was 3 lines and was added to the tree's lines. A Jekyll plugin runs the same code inside the build, so it needs no separate script.

## Decision

Slipway supports three levels, and the map is one file, `sourcemap.json` at the site root, in the format of Seaworthy's contract (not yet written; the field names below are placeholders until `spec.source-map` exists).

1. **Level 0, classic Pages, no tooling: page to file.** A Liquid page emits `{ url, source }` for content pages (collections, posts, and pages in content folders; not generated files). This is the whole of what pure Liquid does reliably. Seaworthy can report "this page comes from `_docs/intro.md`" but not a line.
2. **Level 1, classic Pages plus a committed map: sections and links to lines.** `npm run sourcemap` (the same script style as ADR 0006's stubs) walks kramdown's tree with the same kramdown version Pages uses and writes `sourcemap.json` with exact lines and ids. It needs Ruby on the author's machine, so it is optional; CI runs it and fails when the committed file is stale. This keeps the site deployable without a build.
3. **Level 2, Actions mode: the plugin generates it at build.** The same code as a Jekyll generator, so nothing is committed and the map cannot go stale. This is the default for the starters that use Actions.
4. **Not a Liquid-computed line map.** It is approximate in ways that look right in a demo and are wrong on real documents (ids, setext, duplicates), which is the worst kind of source map. Level 0 states its limit instead of guessing.
5. **Sections are identified by id and by order.** The map lists headings in document order with `id`, `level`, `line`, and `text`, so a consumer can match by id first and by order and text if an id differs.
6. **Test with a real finding.** `sourcemap.e2e` plants a broken link in a Markdown post and expects Seaworthy to report it at that line, in levels 1 and 2.

## Consequences

- Level 0 is honest and cheap but cannot point at a line, so "Edit with your agent" prompts at that level name the file and the section heading only. The exact line needs level 1 or 2.
- Both of the higher levels depend on kramdown's `location`; if a kramdown release changes it, the map tests fail first. The script pins the version Pages reports (2.4.0 on 2026-10-18).
- Source maps for non-Markdown sources (HTML pages, data files) are out of scope.
- **Not verified:** the Seaworthy contract itself, a real Pages deployment, performance on a site with thousands of pages, and Markdown with Liquid or `{::options}` blocks (excluded by the content rules of ADR 0003 and 0006).
