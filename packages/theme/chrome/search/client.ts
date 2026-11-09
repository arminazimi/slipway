/*
 * Search dialog: loads the Pagefind index on first open, runs the query, groups results by section,
 * and keeps keyboard focus inside the dialog. No index is fetched until the reader opens search, so a
 * page that never searches downloads no search JavaScript data.
 */

/** The filter the engine writes on every indexed page; its first value is the page's section. */
export const SECTION_FILTER = "section";

/** Where a result without a section lands, matching the engine's name for pages outside a group. */
export const OTHER_SECTION = "Other";

/** Most results shown for one query; Pagefind ranks them, and the top of the list is what a reader wants. */
export const RESULT_LIMIT = 20;

/** The status and empty-result text. The theme's other chrome labels are English too. */
export const MESSAGES = {
  loading: "Loading search…",
  searching: "Searching…",
  failed: "Search is unavailable right now.",
} as const;

/** One result Pagefind returns, as `data()` gives it. */
export interface SearchRecord {
  readonly url: string;
  readonly excerpt: string;
  readonly meta?: { readonly title?: string | undefined };
  readonly filters?: Readonly<Record<string, readonly string[]>>;
}

/** One hit in a Pagefind result list. */
export interface SearchHit {
  data(): Promise<SearchRecord>;
}

/** The part of Pagefind's browser API the dialog uses. */
export interface PagefindApi {
  search(term: string): Promise<{ readonly results: readonly SearchHit[] }>;
}

/** Results that share one section, in the order Pagefind ranked them. */
export interface ResultGroup {
  readonly section: string;
  readonly results: readonly SearchRecord[];
}

/** The header's search button: `client.ts` reveals it and returns focus to it when the dialog closes. */
export interface SearchButton {
  hidden: boolean;
  setAttribute(name: string, value: string): void;
  addEventListener(type: "click", listener: () => void): void;
  focus(): void;
}

/** The dialog's close button; it has the same shape as the search button. */
export type SearchClose = SearchButton;

/** The query field. */
export interface SearchInput {
  value: string;
  focus(): void;
  addEventListener(type: "input", listener: () => void): void;
}

/** A result link the dialog can move focus to. */
export interface SearchLink {
  focus(): void;
  click(): void;
}

/** Anything in the dialog that can take keyboard focus, for the focus trap. */
export interface SearchFocusable {
  focus(): void;
}

/** A node in the result list; the browser supplies real nodes, tests a small tree. */
export interface SearchNode {}

/** An element the result renderer builds. */
export interface SearchElement extends SearchNode {
  setAttribute(name: string, value: string): void;
  append(...nodes: SearchNode[]): void;
}

/** The part of `document` the result renderer uses. */
export interface SearchDocument {
  createElement(tag: string): SearchElement;
  createTextNode(text: string): SearchNode;
}

/** The container `client.ts` fills with result nodes. */
export interface SearchResults {
  replaceChildren(...nodes: SearchNode[]): void;
  querySelectorAll(selector: string): Iterable<SearchLink>;
}

/** The status region results and failures are announced on. */
export interface SearchStatus {
  textContent: string | null;
}

/** A keyboard or dialog event as the dialog reads it. */
export interface SearchEvent {
  readonly key?: string | undefined;
  readonly shiftKey?: boolean | undefined;
  readonly target?: unknown;
  preventDefault(): void;
}

/** The `<dialog>` element as the script touches it. */
export interface SearchDialog {
  readonly open: boolean;
  hidden: boolean;
  getAttribute(name: string): string | null;
  setAttribute(name: string, value: string): void;
  showModal(): void;
  close(): void;
  querySelectorAll(selector: string): Iterable<SearchFocusable>;
  addEventListener(type: string, listener: (event: SearchEvent) => void): void;
}

/** The elements the island wires together. */
export interface SearchParts {
  dialog: SearchDialog;
  button: SearchButton;
  close: SearchClose;
  input: SearchInput;
  results: SearchResults;
  status: SearchStatus;
}

/** Everything the island reads from the world; tests pass fakes, the browser supplies its own. */
export interface SearchEnv {
  document: SearchDocument;
  load(url: string): Promise<PagefindApi>;
}

/** What can take keyboard focus inside the dialog. */
const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

/** The five entities Pagefind writes when it escapes page text, plus the apostrophe forms. */
const ENTITIES: Readonly<Record<string, string>> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  "#39": "'",
  "#x27": "'",
};

/** Reads one excerpt fragment back to the text a reader should see. */
function textOf(fragment: string): string {
  return fragment.replace(/&(amp|lt|gt|quot|apos|#39|#x27);/gi, (entity, name: string) => ENTITIES[name.toLowerCase()] ?? entity);
}

/** One run of an excerpt and whether Pagefind marked it as a match. */
interface Segment {
  readonly text: string;
  readonly marked: boolean;
}

/** Pagefind's own emphasis tags; page content is escaped, so these are the only tags an excerpt carries. */
const MARK_TAG = /<mark\b[^>]*>|<\/mark\s*>/gi;

/** Splits an excerpt at its `<mark>` boundaries, leaving every other character as text. */
function segmentsOf(excerpt: string): readonly Segment[] {
  const segments: Segment[] = [];
  let marked = false;
  let last = 0;
  for (const match of excerpt.matchAll(MARK_TAG)) {
    if (match.index > last) segments.push({ text: excerpt.slice(last, match.index), marked });
    marked = !match[0].startsWith("</");
    last = match.index + match[0].length;
  }
  if (last < excerpt.length) segments.push({ text: excerpt.slice(last), marked });
  return segments;
}

/** The section a result belongs to, from the engine's `section` filter; a missing filter reads as `Other`. */
export function sectionOf(record: SearchRecord): string {
  const value = record.filters?.[SECTION_FILTER]?.[0]?.trim();
  return value === undefined || value === "" ? OTHER_SECTION : value;
}

/** Groups ranked results by section, keeping the order each section first appears in. */
export function groupBySection(records: readonly SearchRecord[]): readonly ResultGroup[] {
  const groups = new Map<string, SearchRecord[]>();
  for (const record of records) {
    const section = sectionOf(record);
    const group = groups.get(section);
    if (group === undefined) groups.set(section, [record]);
    else group.push(record);
  }
  return [...groups].map(([section, results]) => ({ section, results }));
}

/** Only links the browser can follow: a `javascript:` or `data:` URL from the index is never a link. */
function safeHref(url: string): string | undefined {
  return url.startsWith("/") || url.startsWith("./") || url.startsWith("../") || /^https?:\/\//i.test(url)
    ? url
    : undefined;
}

/** The excerpt as text nodes, with Pagefind's matches wrapped in plain `<mark>` elements. */
function excerptNode(excerpt: string, doc: SearchDocument): SearchElement {
  const span = doc.createElement("span");
  span.setAttribute("class", "search-result-excerpt");
  for (const segment of segmentsOf(excerpt)) {
    if (!segment.marked) {
      span.append(doc.createTextNode(textOf(segment.text)));
      continue;
    }
    const mark = doc.createElement("mark");
    mark.append(doc.createTextNode(textOf(segment.text)));
    span.append(mark);
  }
  return span;
}

/** One result: a title and excerpt inside a link when the URL is safe, otherwise plain text. */
function resultNode(record: SearchRecord, doc: SearchDocument): SearchNode {
  const href = safeHref(record.url);
  const link = doc.createElement(href === undefined ? "span" : "a");
  link.setAttribute("class", "search-result-link");
  if (href !== undefined) link.setAttribute("href", href);

  const title = record.meta?.title?.trim();
  const titleNode = doc.createElement("span");
  titleNode.setAttribute("class", "search-result-title");
  titleNode.append(doc.createTextNode(title === undefined || title === "" ? record.url : title));

  link.append(titleNode, excerptNode(record.excerpt, doc));

  const item = doc.createElement("li");
  item.setAttribute("class", "search-result");
  item.append(link);
  return item;
}

/** The result list: one section per group, in rank order, built only from elements and text nodes. */
export function resultNodes(records: readonly SearchRecord[], doc: SearchDocument): readonly SearchNode[] {
  return groupBySection(records).map((group) => {
    const heading = doc.createElement("h2");
    heading.setAttribute("class", "search-group-title");
    heading.append(doc.createTextNode(group.section));

    const list = doc.createElement("ul");
    list.setAttribute("class", "search-list");
    for (const record of group.results) list.append(resultNode(record, doc));

    const section = doc.createElement("section");
    section.setAttribute("class", "search-group");
    section.append(heading, list);
    return section;
  });
}

/** Replaces the list's children with nodes for `records`; text never passes through an HTML string. */
export function renderResults(results: SearchResults, records: readonly SearchRecord[], doc: SearchDocument): void {
  results.replaceChildren(...resultNodes(records, doc));
}

/** The index URL for a site `base`: `/pagefind/pagefind.js` at the root, `<base>/pagefind/pagefind.js` below it. */
export function indexUrl(base: string): string {
  const root = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${root}/pagefind/pagefind.js`;
}

/** The text announced when a query finds nothing. */
export function emptyMessage(query: string): string {
  return `No results for “${query}”.`;
}

/** The text announced for a result count. */
export function countMessage(count: number): string {
  return count === 1 ? "1 result." : `${count} results.`;
}

/**
 * Keeps Tab and Shift+Tab inside the dialog: past the last control focus wraps to the first, and before
 * the first it wraps to the last. A focus that has left the dialog returns to its first control.
 */
export function trap(dialog: SearchDialog, event: SearchEvent): void {
  if (event.key !== "Tab") return;
  const items = [...dialog.querySelectorAll(FOCUSABLE)];
  const first = items[0];
  const last = items[items.length - 1];
  if (first === undefined || last === undefined) {
    event.preventDefault();
    return;
  }
  const inside = items.includes(event.target as SearchFocusable);
  if (event.shiftKey === true && (!inside || event.target === first)) {
    event.preventDefault();
    last.focus();
  } else if (event.shiftKey !== true && (!inside || event.target === last)) {
    event.preventDefault();
    first.focus();
  }
}

/**
 * Reveals the search button and wires the dialog: the button opens it, the index loads on that first
 * open only, typing searches, arrows move between results, Enter opens the first, Escape closes, and
 * Tab stays inside. The DOM is touched only through the small interfaces above, so tests need no browser.
 */
export function activate(parts: SearchParts, env: SearchEnv): void {
  const { dialog, button, close, input, results, status } = parts;
  let api: PagefindApi | undefined;
  let loading = false;
  let sequence = 0;

  dialog.hidden = false;
  button.hidden = false;
  button.setAttribute("aria-expanded", "false");

  /** Runs the field's current query against the loaded index; an empty field clears the list. */
  const run = (): void => {
    const query = input.value.trim();
    const current = ++sequence;
    if (api === undefined) return;
    if (query === "") {
      results.replaceChildren();
      status.textContent = "";
      return;
    }
    status.textContent = MESSAGES.searching;
    api
      .search(query)
      .then((page) => Promise.all(page.results.slice(0, RESULT_LIMIT).map((hit) => hit.data())))
      .then(
        (records) => {
          if (current !== sequence) return;
          renderResults(results, records, env.document);
          status.textContent = records.length === 0 ? emptyMessage(query) : countMessage(records.length);
        },
        () => {
          if (current === sequence) status.textContent = MESSAGES.failed;
        },
      );
  };

  /** Opens the dialog and, on the first open, loads the index; later opens reuse it. */
  const show = (): void => {
    if (!dialog.open) dialog.showModal();
    button.setAttribute("aria-expanded", "true");
    input.focus();
    if (api !== undefined || loading) return;
    loading = true;
    status.textContent = MESSAGES.loading;
    env.load(indexUrl(dialog.getAttribute("data-base") ?? "")).then(
      (loaded) => {
        api = loaded;
        loading = false;
        status.textContent = "";
        if (input.value.trim() !== "") run();
      },
      () => {
        loading = false;
        status.textContent = MESSAGES.failed;
      },
    );
  };

  button.addEventListener("click", show);
  close.addEventListener("click", () => dialog.close());
  input.addEventListener("input", run);
  dialog.addEventListener("close", () => {
    button.setAttribute("aria-expanded", "false");
    button.focus();
  });
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      dialog.close();
      return;
    }

    const links = [...results.querySelectorAll("a[href]")];
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (links.length === 0) return;
      event.preventDefault();
      const index = links.indexOf(event.target as SearchLink);
      const next =
        event.key === "ArrowDown"
          ? index + 1 >= links.length
            ? 0
            : index + 1
          : index <= 0
            ? links.length - 1
            : index - 1;
      links[next]?.focus();
      return;
    }

    if (event.key === "Enter" && event.target === (input as unknown)) {
      const first = links[0];
      if (first !== undefined) {
        event.preventDefault();
        first.click();
      }
      return;
    }

    trap(dialog, event);
  });
}

// The island runs in a browser; the theme's tsconfig has no DOM lib, so these are the globals it needs.
declare const document: {
  querySelector(selector: string): unknown;
  createElement(tag: string): SearchElement;
  createTextNode(text: string): SearchNode;
};

/** Imports the Pagefind module from the built index. */
function loadIndex(url: string): Promise<PagefindApi> {
  return import(url) as Promise<PagefindApi>;
}

// The island runs when the browser loads it; nothing happens in a runtime without a document.
if (typeof document !== "undefined") {
  const dialog = document.querySelector("[data-search]");
  const button = document.querySelector("[data-search-open]");
  const close = document.querySelector("[data-search-close]");
  const input = document.querySelector("[data-search-input]");
  const results = document.querySelector("[data-search-results]");
  const status = document.querySelector("[data-search-status]");
  if (dialog && button && close && input && results && status) {
    activate(
      {
        dialog: dialog as SearchDialog,
        button: button as SearchButton,
        close: close as SearchClose,
        input: input as SearchInput,
        results: results as SearchResults,
        status: status as SearchStatus,
      },
      { document, load: loadIndex },
    );
  }
}
