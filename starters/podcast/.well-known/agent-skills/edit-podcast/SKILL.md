---
name: edit-podcast
title: Edit the podcast site
description: Edit the podcast site. Use when asked to publish an episode, change the show notes, or fix the feed.
---

The source of this show is at https://github.com/your-org/your-podcast. Read its AGENTS.md before
you edit anything: it names the folders that hold the content, the front-matter schema, and the
command that checks a change.

Change the Markdown, not the built site. An episode lives in `_posts/`, its transcript in
`transcripts/`, and its recording in `audio/`. The feed at `feed.xml` lists every episode, so it
needs the address, the size in bytes, and the length in seconds of each recording.

Never change the address of an episode without keeping the feed and the links to it in step.
