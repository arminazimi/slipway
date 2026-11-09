import type { Code, Parent, Root, RootContent } from "mdast";
import type { Data } from "unist";
import type { Plugin } from "unified";

/** Inclusive run of 1-based line numbers inside a code block: `3-5` is `{ from: 3, to: 5 }`. */
export interface LineRange {
  readonly from: number;
  readonly to: number;
}

/** Structured fence meta a code component reads from `data.code`. Nothing here is highlighted. */
export interface CodeMeta {
  /** The fence's meta string, verbatim. */
  readonly raw: string;
  /** `title="..."`, or `null` when absent or empty. */
  readonly title: string | null;
  /** Lines in bare braces, `{1,3-5}`. */
  readonly highlight: readonly LineRange[];
  /** Lines in `ins={...}`: inserted in a diff. */
  readonly ins: readonly LineRange[];
  /** Lines in `del={...}`: deleted in a diff. */
  readonly del: readonly LineRange[];
  /** `showLineNumbers` turns numbering on; `showLineNumbers=false` turns it off. */
  readonly showLineNumbers: boolean;
}

/** A run of fences inside `:::code-group`, rendered as one set of tabs. */
export interface CodeGroup extends Parent {
  readonly type: "codeGroup";
  readonly children: Code[];
  readonly data?: CodeGroupData;
}

/** `labels[i]` names the tab for `children[i]`: its title, else its language, else its position. */
export interface CodeGroupData extends Data {
  readonly codeGroup: { readonly labels: readonly string[] };
}

/** A code node after this plugin ran. */
export interface CodeData extends Data {
  readonly code: CodeMeta;
}

declare module "mdast" {
  interface BlockContentMap {
    codeGroup: CodeGroup;
  }
  interface RootContentMap {
    codeGroup: CodeGroup;
  }
}

/**
 * One meta token: `key="value"` (or `key='value'`, `key={...}`, `key=bare`), a bare `{...}`
 * line list, or a bare flag word.
 */
const TOKEN = /([A-Za-z][\w-]*)\s*=\s*("[^"]*"|'[^']*'|\{[^}]*\}|\S+)|\{([^}]*)\}|([A-Za-z][\w-]*)/g;

/** A single line (`4`) or an inclusive range (`4-5`). */
const LINE_PART = /^\s*(\d+)\s*(?:-\s*(\d+)\s*)?$/;

/** Removes one pair of matching quotes, or the braces of a `{...}` value. */
function unwrap(value: string): string {
  const first = value.charAt(0);
  const last = value.charAt(value.length - 1);
  if (value.length >= 2 && ((first === '"' && last === '"') || (first === "'" && last === "'"))) {
    return value.slice(1, -1);
  }
  if (value.length >= 2 && first === "{" && last === "}") return value.slice(1, -1);
  return value;
}

/** Parses `1,3-5`. Parts that are not a line or an ascending range (`x`, `0`, `5-3`) are skipped. */
function lineRanges(list: string): LineRange[] {
  const ranges: LineRange[] = [];
  for (const part of list.split(",")) {
    const match = LINE_PART.exec(part);
    if (!match) continue;
    const from = Number(match[1]);
    const to = match[2] === undefined ? from : Number(match[2]);
    if (from < 1 || to < from) continue;
    ranges.push({ from, to });
  }
  return ranges;
}

/** Reads a fence's meta string into {@link CodeMeta}. An empty or unknown meta gives empty fields. */
export function parseCodeMeta(raw: string): CodeMeta {
  let title: string | null = null;
  const highlight: LineRange[] = [];
  const ins: LineRange[] = [];
  const del: LineRange[] = [];
  let showLineNumbers = false;

  for (const match of raw.matchAll(TOKEN)) {
    const [, key, value, bare, flag] = match;
    if (key !== undefined) {
      const text = unwrap(value ?? "");
      if (key === "title") title = text === "" ? null : text;
      else if (key === "ins") ins.push(...lineRanges(text));
      else if (key === "del") del.push(...lineRanges(text));
      else if (key === "showLineNumbers") showLineNumbers = text !== "false";
    } else if (bare !== undefined) {
      highlight.push(...lineRanges(bare));
    } else if (flag === "showLineNumbers") {
      showLineNumbers = true;
    }
  }

  return { raw, title, highlight, ins, del, showLineNumbers };
}

/** The meta a code node carries after this plugin ran, or `undefined` for any other node. */
export function codeMetaOf(node: Code): CodeMeta | undefined {
  return (node.data as CodeData | undefined)?.code;
}

/** Puts `data.code` on every code node, in every container. */
function attachMeta(node: RootContent | Root): void {
  if (node.type === "code") {
    node.data = { ...node.data, code: parseCodeMeta(node.meta ?? "") } satisfies CodeData;
  }
  if ("children" in node) {
    for (const child of node.children) attachMeta(child);
  }
}

/** True for a paragraph whose only text matches `pattern`: the `:::code-group` and `:::` markers. */
function isMarker(node: RootContent, pattern: RegExp): boolean {
  if (node.type !== "paragraph" || node.children.length !== 1) return false;
  const only = node.children[0];
  return only?.type === "text" && pattern.test(only.value.trim());
}

const OPEN = /^:::\s*code-group$/;
const CLOSE = /^:::$/;

/** Index of the `:::` that closes a group starting at `from`, or -1 when only fences come first. */
function closeIndex(siblings: readonly RootContent[], from: number): number {
  let codes = 0;
  for (let i = from; i < siblings.length; i++) {
    const node = siblings[i];
    if (node === undefined) return -1;
    if (node.type === "code") {
      codes += 1;
      continue;
    }
    return isMarker(node, CLOSE) && codes > 0 ? i : -1;
  }
  return -1;
}

/** One group node from the fences between two markers, with the markers' span. */
function buildGroup(open: RootContent, codes: Code[], close: RootContent): CodeGroup {
  const labels = codes.map((code, i) => codeMetaOf(code)?.title ?? code.lang ?? String(i + 1));
  const group: CodeGroup = {
    type: "codeGroup",
    children: codes,
    data: { codeGroup: { labels } },
  };
  if (open.position && close.position) {
    group.position = { start: open.position.start, end: close.position.end };
  }
  return group;
}

/** Replaces each `:::code-group` run among `parent`'s children with one group, then recurses. */
function groupTabs(parent: Parent): void {
  const out: RootContent[] = [];
  const siblings = parent.children;
  for (let i = 0; i < siblings.length; i++) {
    const node = siblings[i];
    if (node === undefined) continue;
    const end = isMarker(node, OPEN) ? closeIndex(siblings, i + 1) : -1;
    if (end !== -1) {
      const codes = siblings.slice(i + 1, end) as Code[];
      const close = siblings[end];
      if (close !== undefined) {
        out.push(buildGroup(node, codes, close));
        i = end;
        continue;
      }
    }
    out.push(node);
  }
  parent.children = out;
  for (const child of out) {
    if ("children" in child) groupTabs(child as Parent);
  }
}

export const name = "code";
export const order = 10;
export const plugin: Plugin<[], Root> = () => (tree) => {
  attachMeta(tree);
  groupTabs(tree);
};
