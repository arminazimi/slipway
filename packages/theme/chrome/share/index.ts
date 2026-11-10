import { h } from "preact";
import type { Chrome, Page, SiteConfig } from "@velella/mizzen/contracts";
import { t } from "../../i18n/index.ts";

/**
 * Share this page: links to X and LinkedIn with the page title and address, and a copy-link
 * button. The button starts `hidden` and `client.ts` reveals it once the browser has a
 * clipboard, so a visitor without JavaScript never sees a control that would do nothing.
 * The X and LinkedIn links are plain anchors and work without JavaScript.
 *
 * The address is absolute when the site sets `url` (`config.url` without a trailing slash
 * plus the page URL, which already carries `base`); without it the page URL is used as
 * written, so the copy button still copies the current address from the browser.
 */

/** The X logo, drawn on a 24x24 grid with `currentColor`. */
const X_PATH =
  "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z";

/** The LinkedIn logo, drawn on a 24x24 grid with `currentColor`. */
const LINKEDIN_PATH =
  "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z";

/** The page address for sharing: absolute when the site sets `url`, the page URL otherwise. */
export function shareUrl(config: SiteConfig, page: Page): string {
  const root = config.url?.replace(/\/+$/, "");
  return root === undefined || root === "" ? page.url : `${root}${page.url}`;
}

/** The X intent URL for a title and address. */
export function xUrl(title: string, url: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
}

/** The LinkedIn share URL for an address. */
export function linkedinUrl(url: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
}

function xIcon() {
  return h(
    "svg",
    { viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": "true", focusable: "false" },
    h("path", { d: X_PATH }),
  );
}

function linkedinIcon() {
  return h(
    "svg",
    { viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": "true", focusable: "false" },
    h("path", { d: LINKEDIN_PATH }),
  );
}

const share: Chrome = ({ site, page }) => {
  if (page.kind !== "doc") return null;

  const lang = page.lang;
  const url = shareUrl(site.config, page);

  return h(
    "div",
    { class: "share", "data-share": true },
    h("span", { class: "share-label" }, t(lang, "share")),
    h(
      "a",
      {
        class: "share-link",
        href: xUrl(page.title, url),
        target: "_blank",
        rel: "noopener noreferrer",
        "aria-label": t(lang, "share_on_x"),
      },
      xIcon(),
      h("span", { class: "share-link-text" }, "X"),
    ),
    h(
      "a",
      {
        class: "share-link",
        href: linkedinUrl(url),
        target: "_blank",
        rel: "noopener noreferrer",
        "aria-label": t(lang, "share_on_linkedin"),
      },
      linkedinIcon(),
      h("span", { class: "share-link-text" }, "LinkedIn"),
    ),
    h(
      "button",
      {
        type: "button",
        class: "share-copy",
        hidden: true,
        "data-share-copy": true,
        "data-share-url": url,
        "data-copied": t(lang, "share_copied"),
        "data-copy-failed": t(lang, "share_copy_failed"),
      },
      t(lang, "share_copy_link"),
    ),
    h("p", { class: "share-status", role: "status", "data-share-status": true }, ""),
  );
};

export default share;
