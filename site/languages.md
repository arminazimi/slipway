---
title: Languages
description: Built-in interface languages, their direction, and how complete each translation is.
layout: doc
permalink: /languages/
date: 2026-10-30
author: Slipway
---
<!-- Generated from _includes/i18n/*.html and _includes/i18n-builtin.html by tools/theme/languages-page.mjs. Do not edit below this line. -->

Slipway ships interface strings in 40 languages. Each translation is one file in `_includes/i18n/`, with one {% raw %}`{%- when 'key' -%}`{% endraw %} per key in the English `en.html`. A translation is complete when it has every key, and a test fails when one is missing or extra. `_includes/i18n-builtin.html` names the codes Slipway ships in `sl_supported` and falls back to English for any other code.

| Language | Code | Direction | Keys | Built in |
| --- | --- | --- | --- | --- |
| el | el | LTR | 74/74 | yes |
| فارسی | fa | RTL | 74/74 | yes |
| العربية | ar | RTL | 74/74 | yes |
| עברית | he | RTL | 74/74 | yes |
| اردو | ur | RTL | 74/74 | yes |
| کوردی | ckb | RTL | 74/74 | yes |
| ދިވެހި | dv | RTL | 74/74 | yes |
| پښتو | ps | RTL | 74/74 | yes |
| سنڌي | sd | RTL | 74/74 | yes |
| ייִדיש | yi | RTL | 74/74 | yes |
| ئۇيغۇرچە | ug | RTL | 74/74 | yes |
| Español | es | LTR | 74/74 | yes |
| Français | fr | LTR | 74/74 | yes |
| Português | pt | LTR | 74/74 | yes |
| Deutsch | de | LTR | 74/74 | yes |
| Italiano | it | LTR | 74/74 | yes |
| Русский | ru | LTR | 74/74 | yes |
| Türkçe | tr | LTR | 74/74 | yes |
| Nederlands | nl | LTR | 74/74 | yes |
| 日本語 | ja | LTR | 74/74 | yes |
| 中文 | zh | LTR | 74/74 | yes |
| az | az | LTR | 74/74 | yes |
| hu | hu | LTR | 74/74 | yes |
| nb | nb | LTR | 74/74 | yes |
| th | th | LTR | 74/74 | yes |
| ta | ta | LTR | 74/74 | yes |
| uk | uk | LTR | 74/74 | yes |
| ro | ro | LTR | 74/74 | yes |
| sw | sw | LTR | 74/74 | yes |
| hi | hi | LTR | 74/74 | yes |
| id | id | LTR | 74/74 | yes |
| ko | ko | LTR | 74/74 | yes |
| ms | ms | LTR | 74/74 | yes |
| bn | bn | LTR | 74/74 | yes |
| vi | vi | LTR | 74/74 | yes |
| cs | cs | LTR | 74/74 | yes |
| da | da | LTR | 74/74 | yes |
| pl | pl | LTR | 74/74 | yes |
| fi | fi | LTR | 74/74 | yes |
| English | en | LTR | 74/74 | yes |

To add a language, copy `en.html`, translate every string in place, and add its code to `sl_supported`. Then regenerate this page with `node tools/theme/languages-page.mjs --write`.
