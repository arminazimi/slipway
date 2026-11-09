// Agent UI gate (issue #1257): the block actions and the page agent menu work by keyboard and
// screen reader, and their scripts stay inside the JavaScript budget.
//
//   node tools/agent-ui/run.ts                build fixtures/docs-site and check it
//   node tools/agent-ui/run.ts --site <dir>   check an already built site instead
//   npm run check                             runs this with every other gate
//
// The gate has two halves. The static half renders the theme's two chrome units and drives their
// client modules with fakes, so a control that is unnamed, hidden without a way to reveal it, or
// wired to nothing fails even when no browser is available. It also compresses each client the way
// the JS budget gate does and fails when the pair exceeds that gate's page budget.
//
// The browser half drives a real page: Tab reaches each control in order, focus stays visible, the
// block action appears on hover and focus, Enter and Space copy, and the menu opens from the
// keyboard. It runs on the fixture only when the fixture actually ships the controls and their
// scripts. Today it does not: the engine collects component islands but not chrome clients, so
// `engine.islands` never loads `chrome/*/client.ts`, and `layouts/doc.ts` does not place the page
// agent menu at all. The gate then prints SKIP with those reasons and exits 0 after the static
// checks, exactly as the issue allows. When the wiring lands, the same browser flow runs on the
// fixture with no change here.
//
// The browser is optional, as in every gate that needs one: when Playwright or Chromium is not
// installed the gate prints SKIP and exits 0. The probe page supplies a fake clipboard and `fetch`
// so a headless run never asks for a permission or reaches the network.
import { createServer } from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { Page as BrowserPage } from "playwright-core";
import type { VNode } from "preact";
import { renderToString } from "preact-render-to-string";
import type { ChromeProps, Page, Site } from "../../packages/engine/src/contracts/index.ts";
import { createCssBundler } from "../../packages/engine/src/render/css.ts";
import { buildIsland } from "../../packages/engine/src/render/islands.ts";
import blockActions from "../../packages/theme/chrome/block-actions/index.ts";
import {
  activate as activateBlockActions,
  type ActionButton,
  type BlockElement,
} from "../../packages/theme/chrome/block-actions/client.ts";
import pageAgentMenu from "../../packages/theme/chrome/page-agent-menu/index.ts";
import {
  activate as activatePageAgentMenu,
  type CopyButton,
  type CopyStatus,
} from "../../packages/theme/chrome/page-agent-menu/client.ts";
import { builtSite } from "../fixture-build/build.ts";
import { budgetBytes, compressedBytes, scriptTags } from "../js-budget-engine/run.ts";
import { chromiumPath, contentType, focusVisible, pageUrl, tabTo, tabTrace } from "../keyboard/run.ts";

/** The repository root: this file sits three levels below it. */
export const root = join(fileURLToPath(import.meta.url), "../../..");

/** The theme root the controls come from. */
export const themeRoot = join(root, "packages/theme");

/** The fixture the gate tests. */
export const FIXTURE = "docs-site" as const;

/** The client script of each control, relative to the theme root. */
export const BLOCK_CLIENT = "chrome/block-actions/client.ts";
export const AGENT_CLIENT = "chrome/page-agent-menu/client.ts";

/** The base stylesheets every probe page loads, in cascade order. */
const BASE_STYLES = ["styles/tokens.css", "styles/fonts.css", "styles/base.css"] as const;

/** The unit stylesheets the probe page loads. */
const PROBE_STYLES = ["chrome/block-actions/style.css", "chrome/page-agent-menu/style.css"] as const;

/** The viewport the browser pass uses. */
export const VIEWPORT = { width: 1280, height: 900 } as const;

/** The three controls the fixture page must render together before the browser pass can run. */
export const BLOCK_SELECTOR = "[data-block-action]";
export const SUMMARY_SELECTOR = ".page-agent-menu-summary";
export const COPY_SELECTOR = "[data-page-agent-copy]";
export const VIEW_SELECTOR = ".page-agent-menu-view";
export const PROVIDER_SELECTOR = ".page-agent-menu-provider";

/** The controls in the order a keyboard user meets them, once the menu is open. */
const MENU_ORDER = [COPY_SELECTOR, VIEW_SELECTOR, PROVIDER_SELECTOR] as const;

/** The rendered chrome markup the static checks read. */
export interface ControlMarkup {
  readonly blockActions: string;
  readonly pageAgentMenu: string;
}

/** A rendered element's attributes and its text with tags removed. */
export interface RenderedElement {
  readonly attrs: string;
  readonly text: string;
}

/** One client script's size, as the JS budget gate measures it. */
export interface ClientSize {
  /** The control whose script it is, such as `block actions`. */
  readonly control: string;
  /** The theme path, or the build path when the script was found in a build. */
  readonly path: string;
  /** Brotli-compressed size in bytes. */
  readonly bytes: number;
  /** Size before compression. */
  readonly raw: number;
  /** Whether the size came from the source module or from a built script. */
  readonly measured: "source" | "build";
}

/** What the fixture build ships, and what it is missing. */
export interface FixtureState {
  /** The block actions template is in a page. */
  readonly blockMarkup: boolean;
  /** The page agent menu is in a page. */
  readonly agentMarkup: boolean;
  /** A page loads the block actions client. */
  readonly blockScript: boolean;
  /** A page loads the page agent menu client. */
  readonly agentScript: boolean;
  /** The first page that renders both controls, when there is one. */
  readonly page: string | undefined;
  /** Why the browser pass cannot run, when it cannot. */
  readonly missing: readonly string[];
}

/** One problem the browser pass found. */
export interface BrowserFinding {
  /** The control, such as `block actions`. */
  readonly control: string;
  /** What went wrong, in one line. */
  readonly message: string;
}

/** What one browser pass found. */
export interface BrowserResult {
  /** Every problem, in the order the flow met it. */
  readonly findings: readonly BrowserFinding[];
  /** Things the pass could not cover, such as a fake clipboard. */
  readonly notes: readonly string[];
}

/** Why the browser pass did not run. */
export interface BrowserSkip {
  /** Why the gate cannot run the browser. */
  readonly skip: string;
}

/** An open browser run that can execute the flow and close what it opened. */
export interface BrowserRun {
  /** Runs the flow once and returns what it found. */
  readonly run: () => Promise<BrowserResult>;
  /** Closes the page, the browser, and any server. */
  readonly close: () => Promise<void>;
}

/** Loads Playwright, so a test can make it look missing. */
export type PlaywrightLoader = () => Promise<{ chromium: typeof import("playwright-core").chromium }>;

/** Options shared by the probe and fixture runs. */
export interface BrowserOptions {
  /** How to load Playwright; the tests replace it. */
  readonly loadPlaywright?: PlaywrightLoader;
}

/** Options of the synthetic page: a test may change the markup before it is served. */
export interface ProbeOptions extends BrowserOptions {
  /** Changes the probe page, so a test can break one control on purpose. */
  readonly mutate?: (html: string) => string;
}

/** Compares by code point, never by locale (ADR 0022, rule 5). */
function byCodePoint(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** A page shaped like the docs fixture, for rendering chrome with no build. */
function fakePage(): Page {
  return {
    url: "/guide/install/",
    source: { file: "fixtures/docs-site/install.md", line: 1, column: 1, endLine: 1, endColumn: 1 },
    frontMatter: { title: "Install" },
    title: "Install",
    lang: "en",
    dir: "ltr",
    headings: [],
    html: "",
    markdown: "",
    kind: "doc",
  };
}

/** A site with a published URL, so the menu's provider links can be filled in. */
function fakeSite(): Site {
  return {
    config: { base: "", url: "https://docs.example.com", theme: { options: {} } },
    pages: [],
    nav: {},
    data: {},
  } as unknown as Site;
}

/** Renders a Preact node to an HTML string. */
function render(node: unknown): string {
  return typeof node === "string" ? node : renderToString(node as VNode);
}

/** Renders both chrome units the way a docs layout places them. */
export function controlsMarkup(): ControlMarkup {
  const page = fakePage();
  const props: ChromeProps = { site: fakeSite(), page, trail: [], pager: {} };
  return {
    blockActions: render(blockActions(props)),
    pageAgentMenu: render(pageAgentMenu(props)),
  };
}

/** Every `<tag>` element in `html`, with its attributes and text. */
export function elements(html: string, tag: string): RenderedElement[] {
  const pattern = new RegExp(`<${tag}\\b([^>]*)>([\\s\\S]*?)</${tag}>`, "gi");
  return [...html.matchAll(pattern)].map((match) => ({
    attrs: match[1] ?? "",
    text: (match[2] ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
  }));
}

/** True when an attribute is present, with or without a value. */
export function hasAttr(attrs: string, name: string): boolean {
  return new RegExp(`(?:^|\\s)${name}(?:\\s*=|\\s|$)`, "i").test(attrs);
}

/** An attribute's value, when it has one. */
export function attr(attrs: string, name: string): string | undefined {
  const match = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>\`]+))`, "i").exec(attrs);
  return match === null ? undefined : (match[1] ?? match[2] ?? match[3]);
}

/** A link's classes, so the menu's own links can be told apart. */
function classes(attrs: string): string[] {
  return (attr(attrs, "class") ?? "").split(/\s+/).filter((name) => name !== "");
}

/**
 * Static checks of the rendered markup: each control is a real button or link, has an accessible
 * name, starts hidden where the client must reveal it, and leaves the tab order alone.
 */
export function markupFindings(markup: ControlMarkup): string[] {
  const findings: string[] = [];

  if (!/<template\b[^>]*\bdata-block-actions\b/i.test(markup.blockActions)) {
    findings.push("block actions: the page has no [data-block-actions] template");
  }
  const blockButton = elements(markup.blockActions, "button").find((element) => hasAttr(element.attrs, "data-block-action"));
  if (blockButton === undefined) {
    findings.push("block actions: the template has no [data-block-action] button");
  } else {
    if (attr(blockButton.attrs, "type") !== "button") findings.push("block actions: the action is not a type=button control");
    if (!hasAttr(blockButton.attrs, "hidden")) findings.push("block actions: the action does not start hidden for the client to reveal");
    if (blockButton.text === "") findings.push("block actions: the action has no accessible name");
    if (hasAttr(blockButton.attrs, "tabindex")) findings.push("block actions: the action sets tabindex, which can take it out of the tab order");
  }

  if (!/<details\b[^>]*\bdata-page-agent-menu\b/i.test(markup.pageAgentMenu)) {
    findings.push("page agent menu: the page has no [data-page-agent-menu] disclosure");
  }
  const summary = elements(markup.pageAgentMenu, "summary")[0];
  if (summary === undefined || summary.text === "") {
    findings.push("page agent menu: the summary has no accessible name");
  } else if (hasAttr(summary.attrs, "tabindex")) {
    findings.push("page agent menu: the summary sets tabindex, which can take it out of the tab order");
  }

  const copy = elements(markup.pageAgentMenu, "button").find((element) => hasAttr(element.attrs, "data-page-agent-copy"));
  if (copy === undefined) {
    findings.push("page agent menu: the menu has no [data-page-agent-copy] button");
  } else {
    if (attr(copy.attrs, "type") !== "button") findings.push("page agent menu: the copy control is not a type=button control");
    if (!hasAttr(copy.attrs, "hidden")) findings.push("page agent menu: the copy control does not start hidden for the client to reveal");
    if (copy.text === "") findings.push("page agent menu: the copy control has no accessible name");
    if (hasAttr(copy.attrs, "tabindex")) findings.push("page agent menu: the copy control sets tabindex, which can take it out of the tab order");
    if ((attr(copy.attrs, "data-markdown") ?? "") === "") findings.push("page agent menu: the copy control names no Markdown twin");
  }

  const links = elements(markup.pageAgentMenu, "a");
  const view = links.find((element) => classes(element.attrs).includes("page-agent-menu-view"));
  if (view === undefined) {
    findings.push("page agent menu: the menu has no View Markdown link");
  } else {
    if (view.text === "") findings.push("page agent menu: the View Markdown link has no accessible name");
    const href = attr(view.attrs, "href") ?? "";
    if (!href.endsWith(".md")) findings.push("page agent menu: the View Markdown link does not point at the page's Markdown twin");
    if (hasAttr(view.attrs, "tabindex")) findings.push("page agent menu: the View Markdown link sets tabindex, which can take it out of the tab order");
  }

  const providers = links.filter((element) => classes(element.attrs).includes("page-agent-menu-provider"));
  if (providers.length === 0) findings.push("page agent menu: the menu offers no agent to open the page in");
  for (const provider of providers) {
    if (provider.text === "") findings.push("page agent menu: an agent link has no accessible name");
    const href = attr(provider.attrs, "href") ?? "";
    if (!/^https?:/i.test(href)) findings.push(`page agent menu: the agent link for "${provider.text}" is not an http(s) address`);
    if (hasAttr(provider.attrs, "tabindex")) findings.push(`page agent menu: the agent link for "${provider.text}" sets tabindex, which can take it out of the tab order`);
  }

  const status = elements(markup.pageAgentMenu, "p").find((element) => hasAttr(element.attrs, "data-page-agent-status"));
  if (status === undefined || attr(status.attrs, "role") !== "status") {
    findings.push("page agent menu: the copy result has no role=status region to announce it");
  }

  return findings;
}

/** A fake button that records its click listeners and what it holds. */
interface FakeButton extends ActionButton {
  readonly listeners: (() => void)[];
}

/** A fake block action button. */
function fakeBlockButton(text: string): FakeButton {
  const listeners: (() => void)[] = [];
  const button: FakeButton = {
    hidden: true,
    textContent: text,
    dataset: {},
    listeners,
    addEventListener(_type, listener) {
      listeners.push(listener);
    },
    cloneNode() {
      return fakeBlockButton(button.textContent ?? "");
    },
  };
  return button;
}

/** Lets the copy promise settle before a fake is read. */
function settle(): Promise<void> {
  return new Promise((done) => setTimeout(done, 0));
}

/** Drives both client modules with fakes: reveal, copy, and stay inert when the APIs are absent. */
export async function clientFindings(): Promise<string[]> {
  const findings: string[] = [];

  const sample = fakeBlockButton("Edit with your agent");
  const template = {
    content: { firstElementChild: sample },
    dataset: { prompt: 'Edit {source}. Current text: "{text}". Change:', copied: "Copied", copyFailed: "Press Ctrl+C" },
  };
  let blockButton: ActionButton | undefined;
  const block: BlockElement = {
    parentElement: null,
    textContent: "Install the tool with npm.",
    getAttribute: (name) => (name === "data-src" ? "docs/install.md:2:1-2:1" : null),
    appendChild: (child) => {
      blockButton = child;
      return child;
    },
  };
  const wrote: string[] = [];
  activateBlockActions({
    template,
    blocks: [block],
    clipboard: {
      writeText: async (text) => {
        wrote.push(text);
      },
    },
    schedule: () => 0,
  });
  if (blockButton === undefined) {
    findings.push("block actions: the client did not stamp an action into a sourced block");
  } else {
    const stamped = blockButton as FakeButton;
    if (stamped.hidden) findings.push("block actions: the client left the action hidden");
    const prompt = stamped.dataset.prompt ?? "";
    if (!prompt.includes("docs/install.md:2:1-2:1")) findings.push("block actions: the copied prompt does not name the block's source");
    if (!prompt.includes("Install the tool with npm.")) findings.push("block actions: the copied prompt does not carry the block's text");
    if (stamped.listeners.length === 0) findings.push("block actions: the action has no click listener");
    else {
      for (const listener of stamped.listeners) listener();
      await settle();
      if (wrote[0] !== prompt) findings.push("block actions: pressing the action did not copy its prompt");
      if (stamped.textContent !== "Copied") findings.push("block actions: the action did not report that it copied");
    }
  }

  let inert: ActionButton | undefined;
  activateBlockActions({
    template,
    blocks: [
      {
        parentElement: null,
        textContent: "No clipboard here.",
        getAttribute: (name) => (name === "data-src" ? "docs/install.md:3:1-3:1" : null),
        appendChild: (child) => {
          inert = child;
          return child;
        },
      },
    ],
    clipboard: undefined,
    schedule: () => 0,
  });
  if (inert !== undefined) findings.push("block actions: the client shows an action in a browser without a clipboard");

  const copy: CopyButton & { listeners: (() => void)[] } = {
    hidden: true,
    dataset: { markdown: "/guide/install/index.md", copied: "Copied", copyFailed: "Press Ctrl+C" },
    listeners: [],
    addEventListener(_type, listener) {
      copy.listeners.push(listener);
    },
  };
  const status: CopyStatus = { textContent: "" };
  const menuWrote: string[] = [];
  activatePageAgentMenu(copy, {
    clipboard: {
      writeText: async (text) => {
        menuWrote.push(text);
      },
    },
    fetchText: () => Promise.resolve("# Install\n"),
    status,
  });
  if (copy.hidden) findings.push("page agent menu: the client left the copy control hidden");
  if (copy.listeners.length === 0) findings.push("page agent menu: the copy control has no click listener");
  else {
    for (const listener of copy.listeners) listener();
    await settle();
    if (menuWrote[0] !== "# Install\n") findings.push("page agent menu: pressing copy did not write the Markdown twin");
    if (status.textContent !== "Copied") findings.push("page agent menu: copying did not announce its result on the status region");
  }

  const inertCopy: CopyButton = { hidden: true, dataset: { markdown: "/guide/install/index.md" }, addEventListener() {} };
  activatePageAgentMenu(inertCopy, { clipboard: undefined, fetchText: undefined, status: { textContent: "" } });
  if (!inertCopy.hidden) findings.push("page agent menu: the client shows copy in a browser without a clipboard or fetch");

  return findings;
}

/** Everything the gate can check without a browser. */
export interface StaticAudit {
  readonly findings: readonly string[];
}

/** Runs the markup and client checks. */
export async function staticAudit(): Promise<StaticAudit> {
  const findings = [...markupFindings(controlsMarkup()), ...(await clientFindings())];
  return { findings };
}

/** Every HTML file under `dir`, sorted. */
function htmlFiles(dir: string): string[] {
  const found: string[] = [];
  const walk = (current: string): void => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (entry.isDirectory()) walk(join(current, entry.name));
      else if (entry.isFile() && entry.name.endsWith(".html")) found.push(join(current, entry.name));
    }
  };
  walk(dir);
  return found.sort(byCodePoint);
}

/** The `src` of every `<script>` in a page. */
function scriptSources(html: string): string[] {
  return scriptTags(html)
    .map((tag) => attr(tag.attrs, "src"))
    .filter((src): src is string => src !== undefined && src !== "");
}

/** The build file a script path names, when it stays inside the build and exists. */
function buildScript(buildDir: string, src: string): string | undefined {
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(src)) return undefined;
  const pathname = src.split(/[?#]/, 1)[0] ?? "";
  const rootDir = resolve(buildDir);
  const file = resolve(rootDir, `.${pathname.startsWith("/") ? pathname : `/${pathname}`}`);
  if (file !== rootDir && !file.startsWith(`${rootDir}${sep}`)) return undefined;
  try {
    return statSync(file).isFile() ? file : undefined;
  } catch {
    return undefined;
  }
}

/** The first built script whose path names `slug`, over every page of a build. */
function builtClient(buildDir: string, slug: string): string | undefined {
  for (const file of htmlFiles(buildDir)) {
    for (const src of scriptSources(readFileSync(file, "utf8"))) {
      if (!src.includes(slug)) continue;
      const found = buildScript(buildDir, src);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

/**
 * The compressed size of each client. A build that ships the script is measured as shipped; until
 * `engine.islands` writes chrome clients, the source is type-stripped and minified with the engine's
 * own island builder, so the number is the script a page would load.
 */
export async function clientSizes(buildDir?: string): Promise<ClientSize[]> {
  const clients = [
    { control: "block actions", file: BLOCK_CLIENT, slug: "block-actions" },
    { control: "page agent menu", file: AGENT_CLIENT, slug: "page-agent-menu" },
  ] as const;

  const sizes: ClientSize[] = [];
  for (const client of clients) {
    const built = buildDir === undefined ? undefined : builtClient(buildDir, client.slug);
    if (built !== undefined) {
      const data = readFileSync(built);
      sizes.push({ control: client.control, path: relativePath(built), bytes: compressedBytes(data), raw: data.length, measured: "build" });
      continue;
    }
    const module = await buildIsland(join(themeRoot, client.file));
    sizes.push({
      control: client.control,
      path: client.file,
      bytes: compressedBytes(module),
      raw: Buffer.byteLength(module),
      measured: "source",
    });
  }
  return sizes;
}

/** A path relative to the repository, so a report reads the same on every machine. */
function relativePath(file: string): string {
  return file.startsWith(`${root}${sep}`) ? file.slice(root.length + 1) : file;
}

/** Problems with a pair of client sizes, using the JS budget gate's page ceiling. */
export function budgetFindings(sizes: readonly ClientSize[], limit = budgetBytes): string[] {
  const findings: string[] = [];
  for (const size of sizes) {
    if (size.bytes > limit) findings.push(`${size.control} client is ${size.bytes} bytes, over the ${limit}-byte page budget`);
  }
  const total = sizes.reduce((sum, size) => sum + size.bytes, 0);
  if (total > limit) findings.push(`the two client scripts total ${total} bytes, over the ${limit}-byte page budget`);
  return findings;
}

/** Reads a build and says which of the controls and their scripts it ships. */
export function fixtureState(buildDir: string): FixtureState {
  let blockMarkup = false;
  let agentMarkup = false;
  let blockScript = false;
  let agentScript = false;
  let page: string | undefined;

  for (const file of htmlFiles(buildDir)) {
    const html = readFileSync(file, "utf8");
    const hasBlock = html.includes("data-block-actions");
    const hasAgent = html.includes("data-page-agent-menu");
    if (hasBlock) blockMarkup = true;
    if (hasAgent) agentMarkup = true;
    for (const tag of scriptTags(html)) {
      const text = `${tag.attrs}\n${tag.body}`;
      if (text.includes("block-actions")) blockScript = true;
      if (text.includes("page-agent-menu")) agentScript = true;
    }
    if (page === undefined && hasBlock && hasAgent) page = pageUrl(buildDir, file);
  }

  const missing: string[] = [];
  if (!blockMarkup) missing.push("the build has no block actions template");
  if (!agentMarkup) {
    missing.push("the doc layout does not place the page agent menu (chrome/page-agent-menu has no slot in layouts/doc.ts)");
  }
  if (!blockScript || !agentScript) {
    missing.push(
      "the built pages do not load the block actions and page agent menu clients (engine.islands is not wired: render/render.ts collects component islands only and pipeline/build.ts drops chrome clients)",
    );
  }
  if (blockMarkup && agentMarkup && page === undefined) {
    missing.push("no single page renders both controls, so the keyboard flow has no page to walk");
  }

  return { blockMarkup, agentMarkup, blockScript, agentScript, page, missing };
}

/** The accessible name of the first element matching `selector`, or `undefined` when there is none. */
export async function accessibleName(page: BrowserPage, selector: string): Promise<string | undefined> {
  return page.evaluate((target) => {
    const element = document.querySelector(target) as HTMLElement | null;
    if (element === null) return undefined;
    const labelledBy = element.getAttribute("aria-labelledby");
    if (labelledBy !== null) {
      const text = labelledBy
        .split(/\s+/)
        .map((id) => document.getElementById(id)?.textContent ?? "")
        .join(" ")
        .trim();
      if (text !== "") return text;
    }
    const label = element.getAttribute("aria-label");
    if (label !== null && label.trim() !== "") return label.trim();
    return (element.textContent ?? "").replace(/\s+/g, " ").trim() || undefined;
  }, selector);
}

/** Waits for the first element matching `selector` to reach an opacity, through its transition. */
async function revealedOpacity(page: BrowserPage, selector: string, value: string): Promise<boolean> {
  return page
    .waitForFunction(
      ({ target, want }) => {
        const element = document.querySelector(target) as HTMLElement | null;
        return element !== null && getComputedStyle(element).opacity === want;
      },
      { target: selector, want: value },
      { timeout: 2000 },
    )
    .then(() => true)
    .catch(() => false);
}

/** The number of strings the fake clipboard has received. */
async function copiedCount(page: BrowserPage): Promise<number> {
  return page.evaluate(() => (globalThis as unknown as { __agentUi: { copied: string[] } }).__agentUi.copied.length);
}

/** Waits until the fake clipboard has at least `count` strings. */
async function waitCopied(page: BrowserPage, count: number): Promise<boolean> {
  return page
    .waitForFunction(
      (wanted) => (globalThis as unknown as { __agentUi: { copied: string[] } }).__agentUi.copied.length >= wanted,
      count,
      { timeout: 3000 },
    )
    .then(() => true)
    .catch(() => false);
}

/** The string the fake clipboard received at `index`. */
async function copiedText(page: BrowserPage, index: number): Promise<string | undefined> {
  return page.evaluate((at) => (globalThis as unknown as { __agentUi: { copied: string[] } }).__agentUi.copied[at], index);
}

/** Asserts every selector is reached, in the order given. */
function orderFindings(control: string, selectors: readonly string[], order: Map<string, number>): BrowserFinding[] {
  const findings: BrowserFinding[] = [];
  let previous = -1;
  for (const selector of selectors) {
    const at = order.get(selector);
    if (at === undefined) {
      findings.push({ control, message: `Tab never reached ${selector}` });
      continue;
    }
    if (at <= previous) findings.push({ control, message: `${selector} comes before the control that should precede it` });
    previous = at;
  }
  return findings;
}

/** Focuses a control with Tab from the top of the page. */
async function focusWithTab(page: BrowserPage, selector: string): Promise<boolean> {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  return (await tabTo(page, selector, 60)) !== undefined;
}

/**
 * The keyboard flow: the controls are revealed, Tab reaches them in order, names and focus rings
 * are there, the block action appears on hover and focus, and Enter/Space copy and open.
 */
export async function scenario(page: BrowserPage): Promise<BrowserResult> {
  const findings: BrowserFinding[] = [];
  const add = (control: string, message: string): void => {
    findings.push({ control, message });
  };

  const revealed = await page
    .waitForFunction(
      () => {
        const block = document.querySelector("[data-block-action]");
        const copy = document.querySelector("[data-page-agent-copy]");
        return block instanceof HTMLElement && !block.hidden && copy instanceof HTMLElement && !copy.hidden;
      },
      undefined,
      { timeout: 5000 },
    )
    .then(() => true)
    .catch(() => false);
  if (!revealed) {
    add("controls", "the client scripts did not reveal the block action and the menu's copy control");
    return { findings, notes: [] };
  }

  const firstOrder = await tabTrace(page, [BLOCK_SELECTOR, SUMMARY_SELECTOR], 60);
  findings.push(...orderFindings("block actions", [BLOCK_SELECTOR, SUMMARY_SELECTOR], firstOrder));

  for (const [control, selector] of [
    ["block actions", BLOCK_SELECTOR],
    ["page agent menu", SUMMARY_SELECTOR],
  ] as const) {
    const name = await accessibleName(page, selector);
    if (name === undefined) add(control, `${selector} has no accessible name`);
    if (!(await focusWithTab(page, selector))) add(control, `Tab never reached ${selector}`);
    else if (!(await focusVisible(page))) add(control, `${selector} has no visible focus`);
  }

  if (await focusWithTab(page, BLOCK_SELECTOR)) {
    if (!(await revealedOpacity(page, BLOCK_SELECTOR, "1"))) add("block actions", "focusing the action does not reveal it");
  }
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.locator(".doc-body [data-src]").first().hover();
  if (!(await revealedOpacity(page, BLOCK_SELECTOR, "1"))) add("block actions", "hovering a block does not reveal its action");
  await page.mouse.move(0, 0);

  const blockSource = await page.getAttribute(".doc-body [data-src]", "data-src");
  const blockText = await page.locator(".doc-body [data-src]").first().evaluate((element) => {
    const clone = element.cloneNode(true) as HTMLElement;
    for (const button of clone.querySelectorAll("[data-block-action]")) button.remove();
    return (clone.textContent ?? "").replace(/\s+/g, " ").trim();
  });

  const beforeBlock = await copiedCount(page);
  await page.locator(BLOCK_SELECTOR).first().focus();
  await page.keyboard.press("Enter");
  if (!(await waitCopied(page, beforeBlock + 1))) {
    add("block actions", "Enter on the action did not copy a prompt");
  } else {
    const prompt = (await copiedText(page, beforeBlock)) ?? "";
    if (blockSource !== null && !prompt.includes(blockSource)) add("block actions", "the copied prompt does not name the block's source");
    if (blockText !== "" && !prompt.includes(blockText)) add("block actions", "the copied prompt does not carry the block's text");
    const label = await page.getAttribute(BLOCK_SELECTOR, "data-copied");
    const shown = (await page.locator(BLOCK_SELECTOR).first().textContent())?.trim();
    if (label !== null && shown !== label) add("block actions", "the action did not report that it copied");
  }

  const secondBlock = page.locator(BLOCK_SELECTOR).nth(1);
  if ((await secondBlock.count()) > 0) {
    const beforeSpace = await copiedCount(page);
    await secondBlock.focus();
    await page.keyboard.press("Space");
    if (!(await waitCopied(page, beforeSpace + 1))) add("block actions", "Space on an action did not copy a prompt");
  }

  await page.locator(SUMMARY_SELECTOR).focus();
  await page.keyboard.press("Enter");
  const opened = await page.evaluate(() => (document.querySelector("[data-page-agent-menu]") as HTMLDetailsElement | null)?.open === true);
  if (!opened) add("page agent menu", "Enter on the summary did not open the menu");

  const menuOrder = await tabTrace(page, MENU_ORDER, 60);
  findings.push(...orderFindings("page agent menu", MENU_ORDER, menuOrder));

  for (const selector of MENU_ORDER) {
    if ((await accessibleName(page, selector)) === undefined) add("page agent menu", `${selector} has no accessible name`);
    if (!(await focusWithTab(page, selector))) add("page agent menu", `Tab never reached ${selector}`);
    else if (!(await focusVisible(page))) add("page agent menu", `${selector} has no visible focus`);
  }

  const viewHref = await page.getAttribute(VIEW_SELECTOR, "href");
  if (viewHref === null || !viewHref.endsWith(".md")) add("page agent menu", "the View Markdown link does not point at the page's Markdown twin");

  const beforeCopy = await copiedCount(page);
  await page.locator(COPY_SELECTOR).focus();
  await page.keyboard.press("Space");
  if (!(await waitCopied(page, beforeCopy + 1))) {
    add("page agent menu", "Space on the copy control did not copy the Markdown twin");
  } else {
    const status = (await page.locator("[data-page-agent-status]").textContent())?.trim() ?? "";
    const label = await page.getAttribute(COPY_SELECTOR, "data-copied");
    if (label !== null && status !== label) add("page agent menu", "copying did not announce its result on the status region");
  }

  return {
    findings,
    notes: ["the browser pass used a fake clipboard and fetch, so no permission prompt or network request was involved."],
  };
}

/** Serves one built site so root-relative URLs work as on a host. */
export interface SiteServer {
  /** The origin every URL starts with. */
  readonly origin: string;
  /** Stops the server. */
  readonly close: () => Promise<void>;
}

/** A local server for a built site. */
export async function serveSite(buildDir: string): Promise<SiteServer> {
  const rootDir = resolve(buildDir);

  const fileAt = (pathname: string): string | undefined => {
    let decoded: string;
    try {
      decoded = decodeURIComponent(pathname);
    } catch {
      return undefined;
    }
    const candidates = decoded.endsWith("/") ? [join(decoded, "index.html")] : [decoded, `${decoded}/index.html`];
    for (const candidate of candidates) {
      const file = resolve(rootDir, `.${candidate}`);
      if (file !== rootDir && !file.startsWith(`${rootDir}${sep}`)) continue;
      try {
        if (statSync(file).isFile()) return file;
      } catch {
        // Try the next candidate.
      }
    }
    return undefined;
  };

  const handler = (request: IncomingMessage, response: ServerResponse): void => {
    let pathname: string;
    try {
      pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
    } catch {
      response.statusCode = 400;
      response.end("bad request");
      return;
    }
    const file = fileAt(pathname);
    if (file === undefined) {
      response.statusCode = 404;
      try {
        response.setHeader("content-type", contentType("404.html"));
        response.end(readFileSync(join(rootDir, "404.html")));
      } catch {
        response.end("not found");
      }
      return;
    }
    response.setHeader("content-type", contentType(file));
    response.end(readFileSync(file));
  };

  const server: Server = createServer(handler);
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const { port } = server.address() as AddressInfo;
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((done) => server.close(() => done())),
  };
}

/** Defines the fakes the client islands need before the page's own scripts run. */
function fakeBrowserApis(): void {
  const state = { copied: [] as string[] };
  Object.defineProperty(globalThis, "__agentUi", { value: state, configurable: true });
  try {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: (text: string) => {
          state.copied.push(String(text));
          return Promise.resolve();
        },
      },
    });
  } catch {
    // The browser keeps its own clipboard; the gate will report an unrevealed control.
  }
  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    value: (url: string) =>
      Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(`# Markdown for ${url}\n`) }),
  });
}

/** Opens Chromium and runs `open` for the flow, or says why it cannot. */
async function startBrowser(open: (page: BrowserPage) => Promise<void>, options: BrowserOptions = {}): Promise<BrowserRun | BrowserSkip> {
  let chromium: typeof import("playwright-core").chromium;
  try {
    const loaded = await (options.loadPlaywright ?? (() => import("playwright-core")))();
    chromium = loaded.chromium;
  } catch {
    return { skip: "playwright-core is not installed (run npm ci)." };
  }

  let executablePath = chromiumPath();
  if (executablePath === undefined) {
    try {
      const bundled = chromium.executablePath();
      if (existsSync(bundled)) executablePath = bundled;
    } catch {
      // No browser installed by Playwright either.
    }
  }
  if (executablePath === undefined) {
    return { skip: "no Chromium found; set CHROME or run `npx playwright install chromium`." };
  }

  const browser = await chromium.launch({ executablePath, headless: true });
  const context = await browser.newContext({ viewport: VIEWPORT, colorScheme: "light" });
  await context.addInitScript(fakeBrowserApis);
  const page = await context.newPage();
  return {
    run: async () => {
      try {
        await open(page);
        return await scenario(page);
      } finally {
        await page.close();
      }
    },
    close: async () => {
      await context.close();
      await browser.close();
    },
  };
}

/** The CSS a probe page loads: the tokens, the base reset, and the two units. */
async function probeCss(): Promise<string> {
  const bundler = createCssBundler({ themeRoot, base: BASE_STYLES });
  const { base, page } = await bundler.page(PROBE_STYLES);
  return `${base.css}\n${page?.css ?? ""}`;
}

/** Keeps `</script>` in a client module from closing the inline script element. */
function inlineModule(source: string): string {
  return source.replace(/<\/script/gi, "<\\/script");
}

/**
 * A synthetic page with both controls and both client modules, so the keyboard flow can run while
 * the fixture build does not ship them. It uses the theme's own markup and CSS, not a copy.
 */
export async function probeHtml(mutate?: (html: string) => string): Promise<string> {
  const markup = controlsMarkup();
  const [blockClient, agentClient, css] = await Promise.all([
    buildIsland(join(themeRoot, BLOCK_CLIENT)),
    buildIsland(join(themeRoot, AGENT_CLIENT)),
    probeCss(),
  ]);
  const html = `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<title>Agent UI probe</title>
<style>${css}</style>
</head>
<body>
<main id="main">
<article class="doc-body">
<p data-src="fixtures/docs-site/install.md:1:1-1:1">Install the tool with npm.</p>
<p data-src="fixtures/docs-site/install.md:2:1-2:1">Then run it.</p>
</article>
${markup.blockActions}
<div class="probe-agent-menu">${markup.pageAgentMenu}</div>
</main>
<script type="module">${inlineModule(blockClient)}</script>
<script type="module">${inlineModule(agentClient)}</script>
</body>
</html>`;
  return mutate === undefined ? html : mutate(html);
}

/** Opens Chromium on the synthetic page and runs the keyboard flow. */
export async function probeRun(options: ProbeOptions = {}): Promise<BrowserRun | BrowserSkip> {
  const html = await probeHtml(options.mutate);
  return startBrowser((page) => page.setContent(html, { waitUntil: "load" }), options);
}

/** Opens Chromium on one page of a built site and runs the keyboard flow. */
export async function siteRun(buildDir: string, page: string, options: BrowserOptions = {}): Promise<BrowserRun | BrowserSkip> {
  const server = await serveSite(buildDir);
  let run: BrowserRun | BrowserSkip;
  try {
    run = await startBrowser(async (browserPage) => {
      await browserPage.goto(`${server.origin}${page}`, { waitUntil: "load" });
    }, options);
  } catch (err) {
    await server.close();
    throw err;
  }
  if ("skip" in run) {
    await server.close();
    return run;
  }
  return {
    run: run.run,
    close: async () => {
      await run.close();
      await server.close();
    },
  };
}

/** Prints a browser result and says whether it passed. */
export function report(result: BrowserResult, staticLine: string): boolean {
  for (const note of result.notes) console.log(`note: ${note}`);
  for (const finding of result.findings) console.error(`FAIL ${finding.control}: ${finding.message}`);
  if (result.findings.length > 0) {
    console.error(`FAIL: agent-ui: ${result.findings.length} keyboard problem(s) in the block actions and page agent menu.`);
    return false;
  }
  console.log(staticLine);
  console.log("OK: agent-ui (block actions and the page agent menu work by keyboard; scripts are inside the JS budget)");
  return true;
}

/** The line that reports the static checks, with each script's size. */
function staticLine(sizes: readonly ClientSize[]): string {
  const each = sizes.map((size) => `${size.control} ${size.bytes}`).join(", ");
  return `OK: agent-ui static (${each} of ${budgetBytes} bytes; markup, names, and client wiring)`;
}

/** Builds the fixture, or uses `--site`, and runs the gate; the entry point. */
export async function main(argv: string[] = process.argv.slice(2)): Promise<number> {
  const at = argv.indexOf("--site");
  let buildDir: string;
  if (at !== -1) {
    buildDir = argv[at + 1] ?? "";
    if (buildDir === "" || !existsSync(buildDir)) {
      console.error(`FAIL: agent-ui: ${buildDir === "" ? "--site needs a folder" : `${buildDir} does not exist`}`);
      return 1;
    }
  } else {
    try {
      buildDir = await builtSite(FIXTURE);
    } catch (err) {
      console.error(`FAIL: agent-ui: the ${FIXTURE} fixture did not build: ${err instanceof Error ? err.message : String(err)}`);
      return 1;
    }
  }

  let sizes: ClientSize[];
  let findings: readonly string[];
  try {
    sizes = await clientSizes(buildDir);
    findings = [...(await staticAudit()).findings, ...budgetFindings(sizes)];
  } catch (err) {
    console.error(`FAIL: agent-ui: the static checks did not run: ${err instanceof Error ? err.message : String(err)}`);
    return 1;
  }
  if (findings.length > 0) {
    for (const finding of findings) console.error(`FAIL ${finding}`);
    console.error(`FAIL: agent-ui: ${findings.length} static problem(s) in the block actions and page agent menu.`);
    return 1;
  }
  const summary = staticLine(sizes);

  const state = fixtureState(buildDir);
  if (state.missing.length > 0 || state.page === undefined) {
    for (const note of state.missing) console.log(`note: ${note}`);
    console.log("SKIP: agent-ui browser pass: the fixture does not ship both controls and their clients, so the keyboard flow has nothing to drive.");
    console.log(summary);
    return 0;
  }

  let run: BrowserRun | BrowserSkip;
  try {
    run = await siteRun(buildDir, state.page);
  } catch (err) {
    console.error(`FAIL: agent-ui: could not start the browser: ${err instanceof Error ? err.message : String(err)}`);
    return 1;
  }
  if ("skip" in run) {
    console.log(`SKIP: agent-ui browser pass: ${run.skip}`);
    console.log(summary);
    return 0;
  }

  try {
    const result = await run.run();
    return report(result, summary) ? 0 : 1;
  } catch (err) {
    console.error(`FAIL: agent-ui: the browser pass did not run: ${err instanceof Error ? err.message : String(err)}`);
    return 1;
  } finally {
    await run.close();
  }
}

const invoked = process.argv[1];
if (invoked !== undefined && import.meta.url === pathToFileURL(resolve(invoked)).href) {
  main().then((code) => {
    process.exitCode = code;
  });
}
