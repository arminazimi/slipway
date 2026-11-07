import type { SourcePos } from "./source.ts";

/** How serious a diagnostic is. An `error` fails the build; a `warning` is reported; `info` is for the reader's information only. */
export type Severity = "error" | "warning" | "info";

/** One finding of the engine, a registry, a plugin, or a theme, such as a broken link or an unknown config key. */
export interface Diagnostic {
  /** Stable identifier, such as `config.unknown-key`; a check ID is never reused for another meaning. */
  readonly id: string;
  /** Whether the finding fails the build. */
  readonly severity: Severity;
  /** What is wrong, in one sentence. */
  readonly message: string;
  /** Where in the source the problem is, when it has a place. */
  readonly pos?: SourcePos;
  /** How to fix it, when the fix is known. */
  readonly help?: string;
}
