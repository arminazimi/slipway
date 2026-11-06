## Goal
Define the TypeScript types every engine, output, and theme task codes against, so they can be built in parallel.

## Files

**Create**
- `packages/engine/src/contracts/README.md`
- `packages/engine/src/contracts/index.ts`
- `packages/engine/src/contracts/source.ts`
- `packages/engine/src/contracts/content.ts`
- `packages/engine/src/contracts/config.ts`
- `packages/engine/src/contracts/nav.ts`
- `packages/engine/src/contracts/output.ts`
- `packages/engine/src/contracts/render.ts`
- `packages/engine/src/contracts/plugin.ts`
- `packages/engine/src/contracts/diagnostic.ts`
- `packages/engine/test/contracts.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. `source.ts`: `SourcePos { file, line, column, endLine }` relative to the repository root.
2. `content.ts`: `Page` (url, source, frontMatter, title, lang, dir, headings, html, markdown, kind: doc|app|asset), `Heading`, `Site` (config, pages, nav, data).
3. `config.ts`: `SiteConfig` matching ADR 0024.
4. `nav.ts`: `NavItem`, `NavTree`, `Trail` (breadcrumb), `Pager`.
5. `output.ts`: `Output { name, run(site, ctx): Promise<OutputFile[]> }` and `OutputFile { path, contents }`.
6. `render.ts`: `LayoutProps`, `ChromeProps`, `ComponentProps`, `Island` (client script reference), `Head` (meta, JSON-LD).
7. `plugin.ts`: hook names and signatures (`content`, `model`, `outputs`), unused until `engine.plugins`.
8. `diagnostic.ts`: `Diagnostic { id, severity, message, pos?: SourcePos, help? }`.
9. The test only type-checks example values of each type.

## Done when
- [ ] Every exported type has a doc comment.
- [ ] The contracts README says changes need an ADR.
- [ ] `npm run check` passes.
