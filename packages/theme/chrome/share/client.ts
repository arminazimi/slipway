/*
 * Share island: writes the page address to the clipboard when the reader asks for a copy.
 * The button stays hidden unless the browser has a clipboard, so a visitor without
 * JavaScript (or without the API) never sees a control that would do nothing. Nothing is
 * requested until the reader asks for a copy. The X and LinkedIn links are plain anchors
 * and need no island.
 */

/** The parts of the copy button the island reads and writes. */
export interface ShareButton {
  hidden: boolean;
  dataset: { shareUrl?: string; copied?: string; copyFailed?: string };
  addEventListener(type: "click", listener: () => void): void;
}

/** The status region the island announces the result on. */
export interface ShareStatus {
  textContent: string | null;
}

/** The part of `navigator.clipboard` the island uses. */
export interface Clipboard {
  writeText(text: string): Promise<void>;
}

/** Everything the island reads from the world; tests pass fakes, the browser supplies its own. */
export interface ShareEnv {
  clipboard?: Clipboard | undefined;
  status: ShareStatus;
}

/** Writes the button's address to the clipboard, announcing the outcome on the status region. */
export function copyLink(button: ShareButton, env: ShareEnv): Promise<void> {
  const clipboard = env.clipboard;
  const url = button.dataset.shareUrl;
  if (clipboard === undefined || url === undefined || url === "") return Promise.resolve();
  env.status.textContent = "";
  return clipboard.writeText(url).then(
    () => {
      env.status.textContent = button.dataset.copied ?? "";
    },
    () => {
      env.status.textContent = button.dataset.copyFailed ?? "";
    },
  );
}

/**
 * Reveals the button and wires its click, unless the browser lacks the clipboard or the
 * button names no address.
 */
export function activate(button: ShareButton, env: ShareEnv): void {
  if (env.clipboard === undefined) return;
  if (button.dataset.shareUrl === undefined || button.dataset.shareUrl === "") return;
  button.hidden = false;
  button.addEventListener("click", () => {
    void copyLink(button, env);
  });
}

/** The browser environment: the page's clipboard and the unit's status region. */
const globals = globalThis as unknown as {
  document?: {
    querySelector(selector: string): unknown;
  };
  navigator?: { clipboard?: Clipboard };
};

// The island runs when the browser loads it; nothing happens in a runtime without a document.
if (globals.document !== undefined) {
  const document = globals.document;
  const button = document.querySelector("[data-share-copy]");
  const status = document.querySelector("[data-share-status]");
  if (button !== null && status !== null) {
    activate(button as ShareButton, {
      clipboard: globals.navigator?.clipboard,
      status: status as ShareStatus,
    });
  }
}
