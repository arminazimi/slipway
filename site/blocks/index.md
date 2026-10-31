---
layout: doc
title: Block reference
description: "A reference of every block provided by the theme, with live examples and copyable snippets."
permalink: /blocks/
---

Slipway includes several presentation blocks. Here is a live example of each, with copyable snippets you can use in your pages.

## Annotations

```liquid
{% raw %}{% include blocks/annotations.html caption=page.annotations.caption language=page.annotations.language code=page.annotations.code notes=page.annotations.notes %}{% endraw %}
```

See [Annotations block](./annotations.html) for data setup.
## Audio

```liquid
{% raw %}{% include blocks/audio.html src=page.audio.src title=page.audio.title chapters=page.audio.chapters transcript=page.audio.transcript transcript_label=page.audio.transcript_label %}{% endraw %}
```

See [Audio block](./audio.html) for data setup.

## Badge

```liquid
{% raw %}{% include blocks/badge.html label="Beta" status="beta" %}{% endraw %}
```

{% include blocks/badge.html label="Beta" status="beta" %}

## Cards

```liquid
{% raw %}{% include blocks/cards.html items=page.cards columns=3 %}{% endraw %}
```

See [Cards block](./cards.html) for data setup.

## Citation

```liquid
{% raw %}{% include blocks/citation.html references=page.references %}{% endraw %}
```

See [Citation block](./citation.html) for the in-text form.
## Code group

```liquid
{% raw %}{% include blocks/code-group.html items=page.group %}{% endraw %}
```

See [Code group block](./code-group.html) for data setup.
## Chart

```liquid
{% raw %}{% include blocks/chart.html data=site.data.chart %}{% endraw %}
```

See [Chart block](./chart.html) for data setup.

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
## Download

```liquid
{% raw %}{% include blocks/download.html url=page.download.url label=page.download.label name=page.download.name size=page.download.size checksum=page.download.checksum name_label=page.download.name_label size_label=page.download.size_label checksum_label=page.download.checksum_label %}{% endraw %}
```

See [Download block](./download.html) for data setup.

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

## Hero

```liquid
{% raw %}{% include blocks/hero.html id=page.hero.id title=page.hero.title lead=page.hero.lead primary_url=page.hero.primary_url primary_label=page.hero.primary_label secondary_url=page.hero.secondary_url secondary_label=page.hero.secondary_label image=page.hero.image image_alt=page.hero.image_alt %}{% endraw %}
```

See [Hero block](./hero.html) for data setup.

## Kbd

```liquid
{% raw %}{% include blocks/kbd.html mac="⌘K" other="Ctrl+K" %}{% endraw %}
```

{% include blocks/kbd.html mac="⌘K" other="Ctrl+K" %}

## Pricing

```liquid
{% raw %}{% include blocks/pricing.html plans=page.plans %}{% endraw %}
```

See [Pricing block](./pricing.html) for data setup.
## People

```liquid
{% raw %}{% include blocks/people.html people=site.data.authors %}{% endraw %}
```

See [People block](./people.html) for data setup.
## Logos

```liquid
{% raw %}{% include blocks/logos.html logos=page.logos %}{% endraw %}
```

See [Logos block](./logos.html) for data setup.

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

## Testimonial

```liquid
{% raw %}{% include blocks/testimonial.html quote=page.testimonial.quote name=page.testimonial.name role=page.testimonial.role avatar=page.testimonial.avatar %}{% endraw %}
```

See [Testimonial block](./testimonial.html) for data setup.

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
