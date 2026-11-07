/** A place in a source file. `file` is relative to the repository root, using `/` on every platform; lines and columns are 1-based. */
export interface SourcePos {
  /** Path of the source file, relative to the repository root. */
  readonly file: string;
  /** Line where the node starts. */
  readonly line: number;
  /** Column where the node starts. */
  readonly column: number;
  /** Line where the node ends (the same as `line` for a one-line node). */
  readonly endLine: number;
}
