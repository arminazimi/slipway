---
title: A site in two languages
description: English from the left, Persian from the right, one page at a time.
layout: home
variant: landing
lang: en
translation_key: home
cta_text: Read the guide
cta_url: /guide.html
features:
  - title: One page, two languages
    text: The switcher in the header opens the translation of the page you are reading.
    url: /about.html
  - title: Right to left, built in
    text: Persian pages lay themselves out right to left, with no extra CSS.
    url: /fa/
  - title: Same key, same page
    text: Translations share a translation_key in their front matter, and that is all it takes.
    url: /guide.html
---

Slipway Bilingual is a sample site with an English side and a Persian side. Every page here exists twice, once in each language, and both copies share a `translation_key`, so the switcher in the header opens the translation of the page you are reading.

The Persian pages are laid out right to left from their `lang`, with no extra stylesheet and no direction setting.
