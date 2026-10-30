---
layout: doc
title: Block reference
description: "A reference of every block provided by the theme, with live examples and copyable snippets."
permalink: /blocks/
---

Slipway includes several presentation blocks. Here is a live example of each, with copyable snippets you can use in your pages.

## Badge

```liquid
{% raw %}{% include blocks/badge.html label="Beta" status="beta" %}{% endraw %}
```

{% include blocks/badge.html label="Beta" status="beta" %}

## Compare

```liquid
{% raw %}{% include blocks/compare.html pros=page.pros cons=page.cons %}{% endraw %}
```

See [Compare block](./compare.html) for data setup.

## Diff

```liquid
{% raw %}{% include blocks/diff.html removed=page.diff.removed added=page.diff.added %}{% endraw %}
```

See [Diff block](./diff.html) for data setup.

## Endpoint

```liquid
{% raw %}{% include blocks/endpoint.html method=page.method path=page.path parameters=page.parameters request=page.request response=page.response %}{% endraw %}
```

See [Endpoint block](./endpoint.html) for data setup.

## File tree

```liquid
{% raw %}{% include blocks/file-tree.html list=my_markdown_list %}{% endraw %}
```

See [File tree block](./file-tree.html) for data setup.

## Gallery

```liquid
{% raw %}{% include blocks/gallery.html images=page.demo_images %}{% endraw %}
```

See [Gallery block](./gallery.html) for data setup.

## Kbd

```liquid
{% raw %}{% include blocks/kbd.html mac="⌘K" other="Ctrl+K" %}{% endraw %}
```

{% include blocks/kbd.html mac="⌘K" other="Ctrl+K" %}

## Pull quote

```liquid
{% raw %}{% include blocks/pull-quote.html text="This is a simple pull quote with no attribution." %}{% endraw %}
```

{% include blocks/pull-quote.html text="This is a simple pull quote with no attribution." %}

## Stats

```liquid
{% raw %}{% include blocks/stats.html items=page.demo_stats_1 %}{% endraw %}
```

See [Stats block](./stats.html) for data setup.

## Steps

```liquid
{% raw %}{% include blocks/steps.html steps=page.steps %}{% endraw %}
```

See [Steps block](./steps.html) for data setup.

## Terminal

```liquid
{% raw %}{% include blocks/terminal.html commands=page.commands output=page.output %}{% endraw %}
```

See [Terminal block](./terminal.html) for data setup.

## Timeline

```liquid
{% raw %}{% include blocks/timeline.html events=page.events %}{% endraw %}
```

See [Timeline block](./timeline.html) for data setup.
