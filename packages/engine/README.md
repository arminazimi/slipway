# @slipway/engine

The docs engine: config, the content model, Markdown, navigation, the render host, outputs, diagnostics, and the CLI ([ADR 0022](../../docs/adr/0022-engine.md), [ADR 0023](../../docs/adr/0023-engine-theme-boundary.md)). The name is temporary; the final one comes when the engine gets its own repository.

It knows nothing about the theme: nothing here imports from `packages/theme/`, and no Slipway name, color, or layout appears in it.

## No build step

The source is TypeScript that Node runs directly through type stripping (Node 24 or later). Use only erasable syntax (no `enum`, `namespace`, or parameter properties), import local files with their `.ts` extension, and mark type-only imports with `import type`. `tsconfig.json` enforces this and emits nothing; never commit compiled output.

## Commands

From the repository root:

- `npm run check` runs the tests below and the type check with everything else.
- `npm test --workspace @slipway/engine` runs `node --test` on `test/**/*.test.ts`.
- `npm run typecheck --workspace @slipway/engine` runs `tsc --noEmit`.

## Layout

- `src/index.ts`: the public entry. It exports only `version` for now.
- `test/`: `*.test.ts` files for `node --test`.
