---
title: Languages
description: Built-in interface languages, their direction, and how complete each translation is.
layout: doc
permalink: /languages/
date: 2026-10-30
author: Slipway
---
<!-- Generated from _includes/i18n/*.html and _includes/i18n-builtin.html by tools/theme/languages-page.mjs. Do not edit below this line. -->

Slipway ships interface strings in 41 languages. Each translation is one file in `_includes/i18n/`, with one {% raw %}`{%- when 'key' -%}`{% endraw %} per key in the English `en.html`. A translation is complete when it has every key, and a test fails when one is missing or extra. `_includes/i18n-builtin.html` names the codes Slipway ships in `sl_supported` and falls back to English for any other code.

| Language | Code | Direction | Keys | Built in |
| --- | --- | --- | --- | --- |
| el | el | LTR | 76/76 | yes |
| فارسی | fa | RTL | 76/76 | yes |
| العربية | ar | RTL | 76/76 | yes |
| עברית | he | RTL | 76/76 | yes |
| اردو | ur | RTL | 76/76 | yes |
| کوردی | ckb | RTL | 76/76 | yes |
| ދިވެހި | dv | RTL | 76/76 | yes |
| پښتو | ps | RTL | 76/76 | yes |
| سنڌي | sd | RTL | 76/76 | yes |
| ייִדיש | yi | RTL | 76/76 | yes |
| ئۇيغۇرچە | ug | RTL | 76/76 | yes |
| Español | es | LTR | 76/76 | yes |
| Français | fr | LTR | 76/76 | yes |
| Português | pt | LTR | 76/76 | yes |
| Deutsch | de | LTR | 76/76 | yes |
| Italiano | it | LTR | 76/76 | yes |
| Русский | ru | LTR | 76/76 | yes |
| Türkçe | tr | LTR | 76/76 | yes |
| Nederlands | nl | LTR | 76/76 | yes |
| 日本語 | ja | LTR | 76/76 | yes |
| 中文 | zh | LTR | 76/76 | yes |
| az | az | LTR | 76/76 | yes |
| hu | hu | LTR | 76/76 | yes |
| nb | nb | LTR | 76/76 | yes |
| th | th | LTR | 76/76 | yes |
| ta | ta | LTR | 76/76 | yes |
| uk | uk | LTR | 76/76 | yes |
| ro | ro | LTR | 76/76 | yes |
| sw | sw | LTR | 76/76 | yes |
| hi | hi | LTR | 76/76 | yes |
| id | id | LTR | 76/76 | yes |
| ko | ko | LTR | 76/76 | yes |
| ms | ms | LTR | 76/76 | yes |
| bn | bn | LTR | 76/76 | yes |
| vi | vi | LTR | 76/76 | yes |
| cs | cs | LTR | 76/76 | yes |
| da | da | LTR | 76/76 | yes |
| pl | pl | LTR | 76/76 | yes |
| fi | fi | LTR | 76/76 | yes |
| sv | sv | LTR | 76/76 | yes |
| English | en | LTR | 76/76 | yes |

To add a language, copy `en.html`, translate every string in place, and add its code to `sl_supported`. Then regenerate this page with `node tools/theme/languages-page.mjs --write`.
