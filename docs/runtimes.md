# Supported runtimes

Slipway needs one runtime: Node.

- **Node:** 24 or later (`engines` in `package.json`; CI runs `npm run check` on Node 24). Node 24 EOL: April 2028.

The engine and the tools are TypeScript that Node runs directly through type stripping, so there is no compile step. Install with `npm ci` from `package-lock.json`.

Ruby, Jekyll, and the `github-pages` gem are not runtimes of Slipway any more; they were removed on 2026-11-09 and must not come back.
