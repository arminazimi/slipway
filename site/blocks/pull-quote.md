---
title: Pull Quote block
description: An editorial pull quote with attribution and an optional source link.
layout: page
---

{::nomarkdown}{% include component-css.html name="pull-quote" %}{:/nomarkdown}

## Left-to-right

### Basic

{% include blocks/pull-quote.html text="This is a simple pull quote with no attribution." %}

```liquid
{% raw %}{% include blocks/pull-quote.html text="This is a simple pull quote with no attribution." %}{% endraw %}
```

### With author

{% include blocks/pull-quote.html text="The only way to do great work is to love what you do." author="Steve Jobs" %}

```liquid
{% raw %}{% include blocks/pull-quote.html text="The only way to do great work is to love what you do." author="Steve Jobs" %}{% endraw %}
```

### With source

{% include blocks/pull-quote.html text="I have a dream." source="I Have a Dream speech" %}

```liquid
{% raw %}{% include blocks/pull-quote.html text="I have a dream." source="I Have a Dream speech" %}{% endraw %}
```

### With author and source

{% include blocks/pull-quote.html text="Not everything that can be counted counts, and not everything that counts can be counted." author="William Bruce Cameron" source="Informal Sociology: A Casual Introduction to Sociological Thinking" %}

```liquid
{% raw %}{% include blocks/pull-quote.html text="Not everything that can be counted counts, and not everything that counts can be counted." author="William Bruce Cameron" source="Informal Sociology: A Casual Introduction to Sociological Thinking" %}{% endraw %}
```

### With author, source, and URL

{% include blocks/pull-quote.html text="I'm not a great programmer; I'm just a good programmer with great habits." author="Kent Beck" source="Twitter" url="https://twitter.com/KentBeck" %}

```liquid
{% raw %}{% include blocks/pull-quote.html text="I'm not a great programmer; I'm just a good programmer with great habits." author="Kent Beck" source="Twitter" url="https://twitter.com/KentBeck" %}{% endraw %}
```

## Right-to-left

<div dir="rtl">
{% include blocks/pull-quote.html text="تنها راه انجام کارهای بزرگ، دوست داشتن کاری است که انجام می‌دهید." author="استیو جابز" source="سخنرانی آغازین استنفورد" %}
</div>

```html
{% raw %}<div dir="rtl">
  {% include blocks/pull-quote.html text="تنها راه انجام کارهای بزرگ، دوست داشتن کاری است که انجام می‌دهید." author="استیو جابز" source="سخنرانی آغازین استنفورد" %}
</div>{% endraw %}
```
