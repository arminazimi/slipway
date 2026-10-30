---
title: A design system for four products
description: Four teams, one component library, and a six-week migration that did not stop anyone's roadmap.
layout: post
tags: [case-study, design-systems]
---

## The problem

Four products shared a brand but not a button. Each team had its own spacing scale, its own focus ring, and its own idea of what "small" meant. A change to the brand color took a month.

## What we did

We audited every component in the four products and kept the 22 that carried 90% of the screens. Each one got a name, a set of states, and a written rule for when to use it. We shipped the library package first, then moved one screen per team per week.

## What shipped

- 22 components with tokens for color, spacing, and type.
- A page per component with a live example and the rules.
- A codemod for the 300 most common button variants.

## The result

A brand color change now ships in a day. Two of the four products are on the library with no local overrides; the others are down to a handful of one-off components each.
