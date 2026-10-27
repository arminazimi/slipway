# Recipe: Translate a page into another site language

This recipe explains how to translate a page into another language while keeping the translation key and links intact.

1.  **Find the original page.**
    Identify the page or post you want to translate (e.g., `about.md` or `_posts/2026-10-20-hello.md`).

2.  **Check for translation_key.**
    If the original page does not have a `translation_key` in its front matter, add one.
    Also, ensure it has a `lang` set (e.g., `lang: en`).

3.  **Create the translation file.**
    For pages, place the new file in the target language's prefix folder (e.g., `fa/about.md`).
    For posts, place it in `_posts/` with a slug that indicates the language (e.g., `_posts/2026-10-20-hello-fa.md`).

4.  **Copy the content and translate.**
    Copy the entire original file, including front matter, to the new file.
    Translate the `title`, `description`, `tags`, and body text into the target language.

5.  **Keep translation_key and links.**
    -   **Important:** Keep the `translation_key` exactly the same as the original. This is how the site links the translations.
    -   **Important:** Keep existing links to other pages exactly as they are. (e.g., `[Install](/docs/install/)`). If there is a translated version of the target page, the language switcher or site structure will handle the routing, or you can update the URL to point directly to the localized path (e.g., `/fa/docs/install/`) if required by site policy, but the standard approach is to maintain structural link parity or explicitly link localized counterparts. For this recipe's scope, keep the links structurally intact or route to their correct language paths as directed by `AGENTS.md`.

6.  **Set the lang and permalink.**
    Set `lang: <target-language>` (e.g., `lang: fa`).
    Set `permalink` to an address under the language prefix (e.g., `permalink: /fa/about.html`).
    Keep `layout`, `date`, code blocks, commands, and URLs unchanged.

7.  **Run checks.**
    Run the validation script to ensure the front matter is valid:
    ```sh
    node "$HOME/.slipway/tools/theme/validate.mjs" .
    ```
