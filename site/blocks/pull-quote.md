---
title: Pull Quote block
description: An editorial pull quote with attribution and an optional source link.
layout: page
---

## Basic

{% include blocks/pull-quote.html text="This is a simple pull quote with no attribution." %}

## With author

{% include blocks/pull-quote.html text="The only way to do great work is to love what you do." author="Steve Jobs" %}

## With source

{% include blocks/pull-quote.html text="I have a dream." source="I Have a Dream speech" %}

## With author and source

{% include blocks/pull-quote.html text="Not everything that can be counted counts, and not everything that counts can be counted." author="William Bruce Cameron" source="Informal Sociology: A Casual Introduction to Sociological Thinking" %}

## With author, source, and URL

{% include blocks/pull-quote.html text="I'm not a great programmer; I'm just a good programmer with great habits." author="Kent Beck" source="Twitter" url="https://twitter.com/KentBeck" %}
