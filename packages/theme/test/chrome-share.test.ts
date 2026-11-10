import assert from "node:assert/strict";
import { test } from "node:test";
import type { ChromeProps, Page, Pager, Site, SiteConfig, SourcePos, Trail } from "@velella/mizzen/contracts";
import share, { linkedinUrl, shareUrl, xUrl } from "../chrome/share/index.ts";
import { activate, copyLink, type Clipboard, type ShareButton, type ShareEnv, type ShareStatus } from "../chrome/share/client.ts";

const pos: SourcePos = { file: "docs/guide/install.md", line: 3, column: 1, endLine: 9, endColumn: 1 };

function siteConfig(url?: string): SiteConfig {
  return {
    title: "Example",
    ...(url === undefined ? {} : { url }),
    base: "/example",
    lang: "en",
    dir: "ltr",
    languages: [],
    source: ".",
    include: [],
    exclude: [],
    navigation: "_data/navigation.yml",
    defaults: [],
    theme: { options: {} },
    search: { text: 300 },
    redirects: {},
    outputs: {},
  };
}

const trail: Trail = [];
const pager: Pager = {};

function pageWith(url = "/example/guide/install/", kind: Page["kind"] = "doc", lang = "en", dir: Page["dir"] = "ltr"): Page {
  return {
    url,
    source: pos,
    frontMatter: { title: "Install" },
    title: "Install",
    lang,
    dir,
    headings: [],
    html: "",
    markdown: "# Install\n",
    kind,
  };
}

function props(page: Page = pageWith(), url?: string): ChromeProps {
  const site: Site = { config: siteConfig(url), pages: [page], nav: {}, data: {} };
  return { site, page, trail, pager };
}

type VNode = { type: unknown; props: { children?: unknown; [key: string]: unknown } };

function isVNode(node: unknown): node is VNode {
  return typeof node === "object" && node !== null && "type" in node && "props" in node;
}

/** Minimal Preact vnode → HTML string for assertions (no render-to-string dependency). */
function html(node: unknown): string {
  if (node == null || node === false || node === true) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(html).join("");
  if (!isVNode(node)) return "";
  const tag = node.type as string;
  const { children, ...rest } = node.props;
  const attrs = Object.entries(rest)
    .filter(([, value]) => value != null && value !== false)
    .map(([key, value]) => (value === true ? ` ${key}` : ` ${key}="${String(value)}"`))
    .join("");
  return `<${tag}${attrs}>${html(children)}</${tag}>`;
}

test("renders the label, X and LinkedIn links, a hidden copy button, and a status region", () => {
  const out = html(share(props(pageWith(), "https://example.com")));

  assert.match(out, /^<div class="share" data-share>/);
  assert.match(out, /<span class="share-label">Share<\/span>/);
  assert.match(
    out,
    /<a class="share-link" href="https:\/\/twitter\.com\/intent\/tweet\?text=Install&url=https%3A%2F%2Fexample\.com%2Fexample%2Fguide%2Finstall%2F" target="_blank" rel="noopener noreferrer" aria-label="Share on X">/,
  );
  assert.match(
    out,
    /<a class="share-link" href="https:\/\/www\.linkedin\.com\/sharing\/share-offsite\/\?url=https%3A%2F%2Fexample\.com%2Fexample%2Fguide%2Finstall%2F" target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn">/,
  );
  assert.match(
    out,
    /<button type="button" class="share-copy" hidden data-share-copy data-share-url="https:\/\/example\.com\/example\/guide\/install\/" data-copied="Link copied" data-copy-failed="Copy failed">Copy link<\/button>/,
  );
  assert.match(out, /<p class="share-status" role="status" data-share-status><\/p>/);
});

test("the label and buttons follow the page language", () => {
  const out = html(share(props(pageWith("/example/fa/install/", "doc", "fa", "rtl"), "https://example.com")));

  assert.match(out, /<span class="share-label">اشتراک‌گذاری<\/span>/);
  assert.match(out, /aria-label="اشتراک‌گذاری در X"/);
  assert.match(out, /aria-label="اشتراک‌گذاری در لینکدین"/);
  assert.match(out, />کپی پیوند<\/button>/);
  assert.match(out, /data-copied="پیوند کپی شد"/);
});

test("a page that is not a doc page renders nothing", () => {
  assert.equal(share(props(pageWith("/example/dashboard/", "app"))), null);
  assert.equal(share(props(pageWith("/example/logo.png", "asset"))), null);
});

test("without a site url the page URL is shared as written", () => {
  const out = html(share(props(pageWith())));

  assert.match(out, /data-share-url="\/example\/guide\/install\/"/);
  assert.match(out, /url=%2Fexample%2Fguide%2Finstall%2F/);
});

test("shareUrl: absolute when the site sets url, the page URL otherwise", () => {
  assert.equal(shareUrl(siteConfig("https://example.com/"), pageWith()), "https://example.com/example/guide/install/");
  assert.equal(shareUrl(siteConfig(), pageWith()), "/example/guide/install/");
});

test("xUrl and linkedinUrl encode the title and address", () => {
  assert.equal(
    xUrl("Install & Go", "https://example.com/a b"),
    "https://twitter.com/intent/tweet?text=Install%20%26%20Go&url=https%3A%2F%2Fexample.com%2Fa%20b",
  );
  assert.equal(
    linkedinUrl("https://example.com/a b"),
    "https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fexample.com%2Fa%20b",
  );
});

/** A button that records the click listeners wired to it. */
function fakeButton(
  dataset: ShareButton["dataset"] = { shareUrl: "https://example.com/example/guide/install/", copied: "Link copied", copyFailed: "Copy failed" },
): ShareButton & { clicks: Array<() => void> } {
  const fake = {
    hidden: true,
    dataset,
    clicks: [] as Array<() => void>,
    addEventListener(type: string, listener: () => void) {
      assert.equal(type, "click");
      fake.clicks.push(listener);
    },
  };
  return fake;
}

/** An environment whose clipboard records its calls. */
function env(options: { clipboard?: Clipboard | undefined } = {}): ShareEnv & { wrote: string[]; status: ShareStatus } {
  const fake = {
    wrote: [] as string[],
    status: { textContent: "" },
    clipboard:
      "clipboard" in options
        ? options.clipboard
        : ({
            writeText(text: string) {
              fake.wrote.push(text);
              return Promise.resolve();
            },
          } satisfies Clipboard),
  };
  return fake;
}

/** Lets the clipboard promise settle. */
const settle = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

test("copyLink writes the address and announces the confirmation", async () => {
  const button = fakeButton();
  const fake = env();

  await copyLink(button, fake);
  await settle();

  assert.deepEqual(fake.wrote, ["https://example.com/example/guide/install/"]);
  assert.equal(fake.status.textContent, "Link copied");
});

test("copyLink announces the failure when the clipboard rejects", async () => {
  const button = fakeButton();
  const fake = env({ clipboard: { writeText: () => Promise.reject(new Error("denied")) } });

  await copyLink(button, fake);
  await settle();

  assert.equal(fake.status.textContent, "Copy failed");
});

test("copyLink does nothing without a clipboard or an address", async () => {
  const fake = env({ clipboard: undefined });

  await copyLink(fakeButton(), fake);
  await copyLink(fakeButton({}), fake);

  assert.deepEqual(fake.wrote, []);
  assert.equal(fake.status.textContent, "");
});

test("activate reveals the button and wires its click", async () => {
  const button = fakeButton();
  const fake = env();

  activate(button, fake);

  assert.equal(button.hidden, false);
  assert.equal(button.clicks.length, 1);
  button.clicks[0]!();
  await settle();
  assert.deepEqual(fake.wrote, ["https://example.com/example/guide/install/"]);
});

test("activate stays hidden without a clipboard or an address", () => {
  const noClipboard = fakeButton();
  activate(noClipboard, env({ clipboard: undefined }));
  assert.equal(noClipboard.hidden, true);
  assert.equal(noClipboard.clicks.length, 0);

  const noAddress = fakeButton({});
  activate(noAddress, env());
  assert.equal(noAddress.hidden, true);
  assert.equal(noAddress.clicks.length, 0);
});
