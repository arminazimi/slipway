# 0027. A diagnostic may carry a `fix`: a replacement on a source span

**Status:** Accepted (2026-11-09). Amends the `Diagnostic` contract of [ADR 0022](0022-engine-contracts.md) (a new optional field). Builds on the spans of [ADR 0026](0026-source-spans.md).

## Context

A `Diagnostic` says what is wrong and, in `help`, how to fix it in words for a person. An agent, or a `mizzen fix` command, cannot apply a sentence. Many findings have one safe, mechanical repair: a link that needs a trailing slash, a key that is misspelled, a code fence without a language. If the repair is data, a tool can apply it and prove it touched nothing else. The engine contracts are frozen (ADR 0023, rule 5), so adding the field needs this ADR first.

## Decision

1. **`Diagnostic` gains an optional `fix`.** It is present only when the repair is safe and mechanical: applying it removes the finding and changes nothing the author did not mean. A diagnostic whose repair needs judgment keeps `help` alone and has no `fix`.

2. **A `fix` is a replacement on one span of one file:** `{ file, line, column, endLine, endColumn, text, description? }`.
   - The span uses the units of ADR 0026: 1-based lines and columns, columns count Unicode code points, a tab is one column, and the end is **inclusive** (`endColumn` names the last character replaced).
   - `text` replaces exactly the characters in the span. The empty string deletes them.
   - `file` is relative to the repository root with `/` separators, like `SourcePos.file`. It may differ from the diagnostic's own `pos.file`: a broken link is reported where it is used and may be repaired elsewhere.
   - `description` is a short phrase for people ("Add a trailing slash"). `help` stays the prose for people; `fix` is the data for tools, and neither replaces the other.
   - The span is non-empty. A pure insertion is written as a replacement of a neighbouring character by itself plus the new text.
   - One diagnostic carries at most one `fix`. A repair that needs several edits is not mechanical enough to be a fix.

3. **Output formats print it.**
   - `formatJson` writes `fix` as it is, after `help`.
   - `formatSarif` writes the SARIF 2.1.0 `fixes` array on the result: one `fix` with `description.text` (when given) and one `artifactChanges` entry holding `artifactLocation` (percent-encoded, `%SRCROOT%`, as for locations) and one `replacement` with a `deletedRegion` and `insertedContent.text`. SARIF's `endColumn` is **exclusive**, so it is written as `endColumn + 1`. The run sets `columnKind` to `unicodeCodePoints` when any result has a fix, so the columns mean the same in SARIF as here.
   - `formatText` prints the `description` as `fix: ...` under `help`; it does not print the replacement.

4. **Applying is not part of this decision.** `mizzen fix`, its conflict handling (overlapping fixes, a stale file), and the agent tools that use `fix` are separate roadmap tasks. This ADR fixes only the shape of the data.

5. **The implementation may change exactly one frozen file:** `packages/engine/src/contracts/diagnostic.ts` (add `fix` and its type). The collector's options and the output formats in `pipeline/diagnostics.ts` change with it. The engine still knows nothing about the theme.

## Consequences

- A tool can apply a fix with no parsing of `help`, and a SARIF viewer (GitHub code scanning, an IDE) can offer it.
- The `fix` carries its own span, so it does not depend on `SourcePos` gaining `endColumn` (ADR 0026) and works whichever lands first.
- Checks that have a safe repair opt in one by one; no existing check changes with this ADR.
- **Not verified:** that any SARIF consumer applies `fixes` with the code-point columns declared here, and how a fix behaves when two diagnostics' spans overlap (left to `mizzen fix`).
