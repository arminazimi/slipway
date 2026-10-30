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
| el | el | LTR | 75/75 | yes |
| فارسی | fa | RTL | 75/75 | yes |
| العربية | ar | RTL | 75/75 | yes |
| עברית | he | RTL | 75/75 | yes |
| اردو | ur | RTL | 75/75 | yes |
| کوردی | ckb | RTL | 75/75 | yes |
| ދިވެހި | dv | RTL | 75/75 | yes |
| پښتو | ps | RTL | 75/75 | yes |
| سنڌي | sd | RTL | 75/75 | yes |
| ייִדיש | yi | RTL | 75/75 | yes |
| ئۇيغۇرچە | ug | RTL | 75/75 | yes |
| Español | es | LTR | 75/75 | yes |
| Français | fr | LTR | 75/75 | yes |
| Português | pt | LTR | 75/75 | yes |
| Deutsch | de | LTR | 75/75 | yes |
| Italiano | it | LTR | 75/75 | yes |
| Русский | ru | LTR | 75/75 | yes |
| Türkçe | tr | LTR | 75/75 | yes |
| Nederlands | nl | LTR | 75/75 | yes |
| 日本語 | ja | LTR | 75/75 | yes |
| 中文 | zh | LTR | 75/75 | yes |
| az | az | LTR | 75/75 | yes |
| hu | hu | LTR | 75/75 | yes |
| nb | nb | LTR | 75/75 | yes |
| th | th | LTR | 75/75 | yes |
| ta | ta | LTR | 75/75 | yes |
| uk | uk | LTR | 75/75 | yes |
| ro | ro | LTR | 75/75 | yes |
| sw | sw | LTR | 75/75 | yes |
| hi | hi | LTR | 75/75 | yes |
| id | id | LTR | 75/75 | yes |
| ko | ko | LTR | 75/75 | yes |
| ms | ms | LTR | 75/75 | yes |
| bn | bn | LTR | 75/75 | yes |
| vi | vi | LTR | 75/75 | yes |
| cs | cs | LTR | 75/75 | yes |
| da | da | LTR | 75/75 | yes |
| pl | pl | LTR | 75/75 | yes |
| fi | fi | LTR | 75/75 | yes |
| English | en | LTR | 75/75 | yes |

To add a language, copy `en.html`, translate every string in place, and add its code to `sl_supported`. Then regenerate this page with `node tools/theme/languages-page.mjs --write`.
