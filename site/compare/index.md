---
title: "Compare Slipway"
layout: doc
description: "An honest comparison of Slipway with other popular themes and hosted platforms."
permalink: /compare/
date: 2026-10-26
author: Slipway
---

When choosing a theme or platform for your documentation or blog, it's important to understand the trade-offs. This page honestly compares Slipway against other popular Jekyll themes—[Minimal Mistakes](#minimal-mistakes), [Just the Docs](#just-the-docs), and [Chirpy](#chirpy)—as well as [hosted docs platforms](#hosted-docs-platforms).

Slipway is designed to be **agent-editable**, explicitly verifying edits against [strict schemas and Seaworthy tests](/spec/). It prioritizes robust **Right-to-Left (RTL)** support, zero-JavaScript graceful degradation, and standard JSON-LD structured data. However, it might not be the right fit for everyone.

## Slipway vs. Minimal Mistakes {#minimal-mistakes}

**[Minimal Mistakes](https://mmistakes.github.io/minimal-mistakes/)** is a highly versatile, feature-rich Jekyll theme suitable for personal sites, blogs, and portfolios. It has a massive community and years of plugins and layouts.

**Why choose Minimal Mistakes:**
- **Mature ecosystem:** It has an extensive track record, widespread adoption, and numerous community tutorials.
- **Extreme flexibility:** A wide variety of layouts (galleries, splash pages) and configuration options for complex site structures.
- **Rich features:** Built-in integrations for comments (Disqus, Utterances), search variants, and various UI components.

**Why choose Slipway instead:**
- **Agent-editability:** Slipway forces strict schemas, `sourcemap.json` generation, and Seaworthy validation, ensuring AI agents can confidently edit and verify content. Minimal Mistakes lacks these guardrails, making automated edits risky.
- **RTL out of the box:** Slipway treats Right-to-Left languages (like Arabic, Persian, Hebrew) as first-class citizens with logical CSS properties, specific font stacks, and bidirectional layout checks.
- **Zero-JavaScript baseline:** Slipway ensures core functionality remains intact even with JavaScript completely disabled.

## Slipway vs. Just the Docs {#just-the-docs}

**[Just the Docs](https://just-the-docs.github.io/just-the-docs/)** is a fast, responsive, and highly customizable Jekyll theme specifically tailored for documentation.

**Why choose Just the Docs:**
- **Simplicity:** It provides a very clean, straightforward documentation layout.
- **Familiarity:** It is the default for many open-source projects and GitHub Pages users.
- **Granular navigation:** Its nested, hierarchical navigation sidebar is deeply customizable and well-suited for massive documentation trees.

**Why choose Slipway instead:**
- **Editorial features:** Slipway bridges documentation and editorial content, offering distinct layouts for blogs, series, and authors alongside its `doc` layout.
- **Seaworthy verification:** Slipway is built to pass Seaworthy checks by default, giving AI agents clear paths to manage documentation securely.
- **Accessibility & RTL:** While Just the Docs is accessible, Slipway provides native RTL and strict WCAG AA contrast validation across all theme tokens.

## Slipway vs. Chirpy {#chirpy}

**[Chirpy](https://chirpy.cotes.page/)** is a text-focused Jekyll theme with a modern aesthetic, excellent for technical blogging.

**Why choose Chirpy:**
- **Technical blogging focus:** Chirpy excels at displaying code, math (MathJax), and technical posts with a clean sidebar.
- **Feature-complete for blogs:** It includes recent posts, trending tags, a timeline, and built-in search tailored for heavy bloggers.
- **UI polish:** It features a polished, app-like dual-pane layout out of the box.

**Why choose Slipway instead:**
- **Mixed content:** If your site requires a mix of landing pages, documentation, and a blog, Slipway's varied layouts (`home`, `doc`, `post`, `page`) are more versatile.
- **Agent workflows:** Chirpy is designed for human authors. Slipway's `slipway doctor`, Markdown twins, and `AGENTS.md` make it safe for autonomous agents to manage posts and fix errors.
- **Localization:** Slipway's explicit focus on localized UI strings and RTL alignment is superior for multilingual or Arabic/Persian/Hebrew sites.

## Slipway vs. Hosted Docs Platforms {#hosted-docs-platforms}

Hosted documentation platforms provide fully managed, "doc-as-code" experiences, often integrating with specific frameworks.

**Why choose Hosted Docs Platforms:**
- **Zero setup:** You don't manage builds, GitHub Actions, or local Ruby environments.
- **Dynamic features:** They often include server-side search, user authentication, and interactive API playgrounds.
- **Framework integration:** Platforms often tie deeply into specific React/Vue/Node ecosystems.

**Why choose Slipway instead:**
- **Ownership:** Slipway sites are static (built via Jekyll or adapters like Hugo/Eleventy). You own the HTML and host it anywhere (GitHub Pages, Netlify, plain NGINX) without vendor lock-in.
- **Static simplicity:** No Node.js vulnerabilities, no React hydration issues, and a tiny footprint. The entire site works without JavaScript.
- **Open Agent Spec:** Slipway uses the open agent-editable spec. Any agent (like a local LLM or an MCP server) can edit your site, rather than relying on a proprietary AI assistant provided by the hosted platform.
