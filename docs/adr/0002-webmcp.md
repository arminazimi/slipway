# 0002. WebMCP ships as an opt-in, feature-detected script with read-only tools

**Status:** Accepted (2026-10-18)

## Context

[WebMCP](https://github.com/webmachinelearning/webmcp) lets a web page register tools that a browser's built-in agent, or an agent running in the page, can call: "search this site", "read this page". It is one of Slipway's three signature features (`agent.webmcp`), and the roadmap marks it experimental. Issue #50 asks what the current draft needs, which browsers support it, and how to ship it behind a flag without hurting everyone else.

## Method

- Read the draft specification repository, its implementation-status page, and Chrome's developer documentation (last updated 2026-10-16).
- Tested the installed Chrome 155 with a probe page: is the API present, under which name, does `registerTool` work, and what does a flag change.

## Results

### The API in the current draft

- Registration is `document.modelContext.registerTool(tool, options)`, returning a promise. `navigator.modelContext`, which some blog posts still use, is not in the draft and was `undefined` in the test below.
- A tool is `{ name, description, inputSchema, execute, annotations }`. `inputSchema` is JSON Schema. `execute(input, { signal })` is async and returns the result. `annotations` is optional and holds `readOnlyHint`, `untrustedContentHint`, and `consequentialHint` (all default `false`).
- `options.signal` unregisters the tool when aborted; `options.exposedTo` lists other secure origins that may use it. Without it a tool is for the page's own origin.
- Agents discover tools with `document.modelContext.getTools()` and call them with `executeTool()`; a `toolchange` event announces changes. Cross-origin iframes need `allow="tools"`.
- The draft says it has changed substantially since its first publication in August 2025 and lists open questions (output schemas, streaming, user prompts, service workers). Chrome's page says "WebMCP is under active discussion and subject to change". `provideContext` and declarative form attributes are not part of the draft; a declarative API is only an explainer.

### Who supports it (from the draft's implementation-status page, 2026-10-18)

| Product | Status |
| --- | --- |
| Chrome | Origin trial live in Chrome 149; `about:flags#enable-webmcp-testing` for local development |
| Edge | Origin trial live in Edge 150 |
| ChatGPT Desktop | Supported |
| Brave | Experimental, in Leo AI chat |
| Meta Ray-Ban Display | Coming soon, off by default |
| Firefox, Safari | Standards-position requests open; no implementation listed |

### Test in the installed Chrome 155

| Run | `document.modelContext` | `navigator.modelContext` | `registerTool` |
| --- | --- | --- | --- |
| Default | undefined | undefined | undefined |
| `--enable-features=WebMCPTesting` | object | undefined | function; returns a promise that resolves |

So today the API is absent in a normal Chrome, present behind a flag or origin trial, and named `document.modelContext`. In the headless run, `getTools()` did not answer within 500 ms; it probably needs an agent on the other side, which a headless page does not have. That part was not verified.

## Decision

1. **Ship it, off by default.** `_config.yml` has `webmcp: false`. With `webmcp: true`, the layout adds one small module script. A site that does not enable it carries no WebMCP code.
2. **Feature-detect before anything else.** The script starts with `if (!document.modelContext?.registerTool) return;`. In browsers without the API it does nothing and costs one tiny request. It does not fall back to `navigator.modelContext`, because the draft does not define it; if the draft changes, the script changes in a patch release.
3. **Three tools, all read-only**, with `readOnlyHint: true` and, for the ones that return site text, `untrustedContentHint: true`:
   - `search_site({ query })`: the same client-side index the search box uses, returning titles, URLs, and snippets.
   - `get_page({ path })`: the page's Markdown (the Markdown twin when present, otherwise the main text) with its title and URL.
   - `list_pages({ section? })`: the navigation, as titles and URLs.
   Nothing here can change anything, send anything, or read private data. `exposedTo` is never set; tools are for the page's own origin.
4. **Origin trial tokens are the site owner's.** `webmcp_origin_trial_token` in `_config.yml` becomes `<meta http-equiv="origin-trial" content="...">`. Slipway does not ship a token.
5. **Label it experimental** in the docs and in the starter's `AGENTS.md`, with the date this ADR was written and the link to the draft. The docs say plainly that no mainstream agent is guaranteed to call these tools yet.
6. **Seaworthy checks it.** `readability.webmcp` (Seaworthy issue #382, Phase 5) is a rendered check that the tools are registered and answer; until it exists, the starter's own test loads the page in headless Chrome with `--enable-features=WebMCPTesting` and checks that `search_site` is registered.

## Consequences

- The feature can break for users of the origin trial when the draft changes. That is why it is off by default and why every release note for the script says which draft revision it follows.
- The script depends on the search index and the Markdown twin (`theme.search`, `theme.md-twin`), so it lands in Phase 3 after both.
- The size budget of the core theme (`theme.zero-js`) does not include this script, because it loads only when the feature is on and the browser has the API.
- Not verified here: an agent calling the tools end to end, behavior in Edge, and the `exposedTo` and `allow="tools"` paths. Each needs a test when the script is written.
