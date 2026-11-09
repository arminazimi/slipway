# Override slots

**Status:** the engine has no override mechanism yet. The slots below were part of the Jekyll theme, which was removed, and their engine version is not built. The public contract is kept in [ADR 0012](adr/0012-public-api.md).

| Slot | Use | Status |
| --- | --- | --- |
| `assets/css/custom.css` | Your own CSS, loaded after the theme's styles, so a token you set there wins. Prefer tokens over styling theme classes. | Public contract (ADR 0012); not built in the engine yet |
| `assets/images/social.png` | The default `og:image` of every page, a 1200 × 630 image. | Public contract (ADR 0012); not built in the engine yet |
| `_includes/head-custom.html`, `_includes/footer-custom.html` | Extra markup at the end of `<head>` and inside `<footer>`. | Jekyll-only; removed with the Jekyll theme, no engine equivalent yet |

Pages must read without JavaScript, and right-to-left must work, so any CSS in a slot uses logical properties (`margin-inline-start`, not `margin-left`).
