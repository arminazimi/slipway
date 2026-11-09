# Examples

Each `*.ts` file in this folder is one helper for checking the executable examples a page shows in fenced code blocks. A runner that executes the fences reports its findings through these helpers, so the runner and the diagnostic never share a shape by accident. Adding a helper needs no edit to a shared index; deleting one is deleting its file.

## Diagnostic

`diagnostic.ts` exports `exampleFailed`, which builds the `example-failed` finding:

```ts
import { exampleFailed } from "./diagnostic.ts";

exampleFailed({
  pos: { file: "guide/install.md", line: 42, column: 1, endLine: 42, endColumn: 3 },
  page: "/guide/install/",
  expected: "installed 3 packages\n",
  actual: "installed 2 packages\n",
});
```

- `pos` is the fence's source span, so `formatText` prints a code frame at the fence.
- `page` is the page's address, which names the page for a reader who only sees diagnostics.
- `expected` and `actual` are the example's wanted and observed output.
- `exitCode` is optional; when the runner knows it, the message names it.

The severity is **warning**. A failing example means the documentation has gone stale, not that the site is broken, so the finding is reported and carried by the trust model without failing every build.

`firstDifference` is the small helper behind the message. It compares by Unicode code point and returns `offset` (the code point where the two strings first differ, or the shorter length when one is a prefix of the other) plus a bounded window of each side of at most 72 code points, starting up to 16 code points before the difference, with `…` marking a cut. Newlines, tabs, backslashes, and control characters are escaped, so an example that prints several lines or binary-ish text still yields one message line. The result depends only on its two arguments.
