---
title: "Move from a GitHub Pages built-in theme"
description: "How to upgrade your site from a legacy GitHub Pages theme to Slipway."
---

# Move from a GitHub Pages built-in theme

If your site currently uses one of the [built-in GitHub Pages themes](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/adding-a-theme-to-your-github-pages-site-using-jekyll) (such as Minimal, Cayman, Leap Day, etc.), you can migrate to Slipway while keeping your content as is. Pages without front matter will continue to work.

This recipe supports both **Classic mode** and **Actions mode**.

## 1. Update your configuration

In your `_config.yml`, find the `theme:` line and replace it with `remote_theme:`. We recommend pinning to a specific version of Slipway:

```yaml
remote_theme: arminazimi/slipway@v0.1.0-alpha.1
```

## 2. Remove the old theme's stylesheet

Many built-in themes tell you to create an `assets/css/style.scss` file with this content:

```scss
---
---

@import "{{ site.theme }}";
```

Slipway doesn't need this. **Delete `assets/css/style.scss`** completely. Slipway provides its own stylesheet automatically.

## 3. Map legacy settings

Built-in themes often have specific configuration keys in `_config.yml`. Here's how to map them to Slipway:

*   **`logo:`** Move your logo setting under `slipway.logo.light`:
    ```yaml
    slipway:
      logo:
        light: /assets/img/logo.png
    ```
*   **`show_downloads:`** Slipway doesn't have a built-in download button for the repository. If you want to link to your repository, you can add it to the navigation or the `social` links list.
*   **Colors/Brand:** Some themes let you set colors in `_config.yml` (e.g., `google_fonts` or specific color keys). In Slipway, you configure these using [Design Tokens](/recipes/overrides/#design-tokens):
    ```yaml
    slipway:
      tokens:
        accent: "#123456"
        canvas: "#ffffff"
        text: "#333333"
    ```

Once you've made these changes, your site will use Slipway, and your existing Markdown pages will render beautifully with the new theme!
