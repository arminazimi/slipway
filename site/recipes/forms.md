---
title: Contact forms
description: How to add a contact form to a static site without writing backend code.
layout: doc
permalink: /recipes/forms/
date: 2024-03-20
author: Slipway
---

## Modes

Forms work in both **Classic mode** and **Actions mode**.

## Overview

A static site has no backend to process a form. Instead, you can use a form service to handle submissions. These services give you an endpoint URL. When a visitor submits the form, their browser sends a standard HTML `POST` request directly to that URL.

You do not need JavaScript to make this work. A plain HTML form is enough, which means it loads fast, works for everyone, and keeps your site resilient. It will inherit the theme's styles and RTL support automatically.

## HTML Example

Add this HTML to any page, replacing `YOUR_ENDPOINT_URL` with the URL your service gave you:

```html
<form action="YOUR_ENDPOINT_URL" method="POST">
  <p>
    <label for="name">Name</label><br>
    <input type="text" id="name" name="name" required>
  </p>
  <p>
    <label for="email">Email</label><br>
    <input type="email" id="email" name="email" required>
  </p>
  <p>
    <label for="message">Message</label><br>
    <textarea id="message" name="message" required></textarea>
  </p>
  <p>
    <button type="submit">Send</button>
  </p>
</form>
```

## Form Services

There are many services that provide this endpoint. Read their official documentation to set them up:

- [Formspree](https://formspree.io/): A popular service specifically for form endpoints.
- [Netlify Forms](https://docs.netlify.com/forms/setup/): Built into Netlify hosting. Just add `data-netlify="true"` to your `<form>` tag.
- [Basin](https://usebasin.com/): A simple and reliable form endpoint service.
