---
title: Logos block
description: A row of customer or partner logos that keeps its contrast in light and dark mode.
layout: page
logos:
  - name: Slipway
    image: /assets/images/social.png
    url: /
    alt: Slipway logo
  - name: Slipway
    image: /assets/images/social.png
    alt: Slipway logo without a link
logos_plain:
  - name: Slipway
    image: /assets/images/social.png
    alt: Slipway logo
logos_rtl:
  - name: اسلیپ‌وی
    image: /assets/images/social.png
    url: /
    alt: نشان اسلیپ‌وی
  - name: اسلیپ‌وی
    image: /assets/images/social.png
    alt: نشان اسلیپ‌وی بدون پیوند
---

{::nomarkdown}{% include component-css.html name="logos" %}{:/nomarkdown}

## With a title

Logos sit on a token surface, desaturated and dimmed; a link lifts its logo to full opacity on hover, and dark mode shows every logo at full opacity.

{::nomarkdown}
{% include blocks/logos.html title="Trusted by" logos=page.logos %}
{:/nomarkdown}

## Without a title

{::nomarkdown}
{% include blocks/logos.html logos=page.logos_plain %}
{:/nomarkdown}

## Right-to-left

{::nomarkdown}
<div dir="rtl">
{% include blocks/logos.html title="مورد اعتماد" logos=page.logos_rtl %}
</div>
{:/nomarkdown}
