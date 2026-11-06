## Goal
Record the engine architecture so every engine task builds the same thing.

## Files

**Create**
- `docs/adr/0022-engine.md`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Language: TypeScript run by Node 24 without a compile step (type stripping); existing `.mjs` stays and gains `// @ts-check` over time.
2. Pipeline: config → discover → front matter → Markdown (remark, with positions) → HTML (rehype) → site model → render (Preact `renderToString`, no client framework) → outputs.
3. Client code: small islands (plain modules) only for components on the page; pages work without JavaScript.
4. Rust: hot paths (parse, highlight) may move to Rust through NAPI later behind the same TypeScript API; nothing in 0.3.0 depends on it.
5. Determinism: the same input gives byte-identical output.
6. Source positions: every block element in the output carries its source file and line, which feeds source maps.
7. List the libraries chosen (unified, remark-gfm, rehype, Shiki, Pagefind, Lightning CSS, preact, preact-render-to-string) and why.

## Done when
- [ ] The ADR is merged with status Accepted.
- [ ] Each library has a one-line reason and an alternative that was rejected.
- [ ] `npm run check` passes.
