---
title: Terminal block
description: A terminal session with commands, prompts, and optional output.
layout: page
commands: |-
  npm install
  npm run test
output: |-
  Added 123 packages.
  Build successful.
---

## Commands and output

{::nomarkdown}
{% include blocks/terminal.html commands=page.commands output=page.output %}
{:/nomarkdown}

## Custom prompt

{::nomarkdown}
{% include blocks/terminal.html commands=page.commands prompt="%" %}
{:/nomarkdown}

## Right-to-left page

The terminal stays left to right because commands are code, even when the surrounding page is right to left.

{::nomarkdown}
<div dir="rtl">
{% include blocks/terminal.html commands=page.commands output=page.output %}
</div>
{:/nomarkdown}
