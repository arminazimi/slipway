# Slipway Podcast

The podcast starter for [Slipway](../../README.md): a small show with episodes, show notes,
transcripts, and an RSS feed that podcast directories accept.

Copy this folder into a new repository, or use **Use this template** on GitHub. It is a complete
site: the theme does the rest.

## What is in here

| Path | What it is for |
| --- | --- |
| `_posts/` | The episodes. One Markdown file per episode, with the show notes. |
| `audio/` | The recordings. One audio file per episode. |
| `transcripts/` | The transcripts, one page per episode. |
| `feed.xml` | The RSS feed, with the iTunes namespace. |
| `episodes.md` | The episode archive. |
| `authors/` | The pages of the hosts of the show. |
| `content-schemas.json` and `schema/` | Which JSON Schema checks which file. |
| `_plugins/` | Slipway's own Jekyll plugins: they write the source map, the Markdown twin of every page, and the agent-skills index. |
| `.well-known/agent-skills/` | The index that tells an agent what it can do with this site. |
| `AGENTS.md` | What an agent reads before it edits the site. |

## Publish it

1. Copy this folder into a new repository, or use **Use this template**.
2. Set `url` in `_config.yml` to the address the site will be published at. Podcast directories
   need absolute URLs in the feed, and Jekyll builds them from this setting.
3. Turn on GitHub Pages for the repository.

## The two build modes

On GitHub Pages the site builds in classic mode, where GitHub runs Jekyll without custom
plugins: every page, the feed, the sitemap, and the search index work, and the source map holds
the page and the file behind it.

The starter ships Slipway's plugins, so a build that runs them writes the source map with exact
lines, the Markdown twin of every page, and the agent-skills index. That is the build an Actions
workflow does, and the one `slipway doctor` reports the top level for:

```sh
bundle exec jekyll build
npx slipway doctor . --build _site --level L3
```

## The feed

`feed.xml` is an RSS 2.0 file with the iTunes namespace. Every episode in `_posts/` becomes one
item, with the recording as its enclosure:

| Front matter | What it is |
| --- | --- |
| `audio` | The path of the recording, such as `/audio/episode-1.mp3`. |
| `audio_length` | The size of the recording in bytes. The feed needs it. |
| `audio_type` | The media type of the recording, such as `audio/mpeg`. |
| `duration` | How long the episode runs, in seconds. |
| `season` and `number` | Where the episode sits in the series. |
| `explicit` | Whether the episode has explicit content. |

Before you submit the feed to a directory, replace the sample content:

- The cover art. `assets/img/cover.svg` is a placeholder; directories ask for a square JPG or PNG
  of at least 1400 by 1400 pixels, and for the file name to end in `.jpg` or `.png`.
- The owner. `itunes:owner` in `feed.xml` names the address of the person who owns the feed.
- The recordings. The files in `audio/` are two seconds of silence; `audio_length` and `duration`
  in the episode's front matter must match the file you put there.

## Notes on what the theme does not have yet

- There is no audio player block. The episodes link to the recording, and the feed carries it as
  the enclosure, which is what podcast apps play.
- There is no episode list block. The archive uses the theme's `archive` layout, and the home
  page uses its `blog` variant, which lists every episode.
- There is no transcript block. The transcripts are ordinary pages under `transcripts/`.

## Local development

1. Run `bundle install`
2. Run `bundle exec jekyll serve`
3. Open `http://localhost:4000` in your browser

Run `npx slipway doctor . --build _site --level L3` after a build to check the site against the
agent-editable spec.
