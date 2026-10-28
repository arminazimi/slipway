# `doctor.root-links`

Markdown links starting with `/` are root-relative. They break when a site has a `baseurl`, such as when hosted on GitHub Pages at `/my-project/`. The check reports root-relative links in Markdown files when `baseurl` is configured.

## Why it matters for agents
Agents might write links to pages as root-relative (e.g. `[Page](/page/)`), which break on project sites where a baseurl applies. Agents should be instructed to use relative links (e.g., `[Page](page)`) or Liquid `relative_url` filters instead.

## How to fix
Replace root-relative links with relative paths or use `relative_url` if applicable.

**Bad**
```markdown
[Rules](/rules/)
```

**Good**
```markdown
[Rules](rules)
```
