# Editing the Example site

Content lives in `pages/`, one Markdown file per page. The front matter of each page follows the schemas listed in `content-schemas.json`. Site settings are in `site.config.yml`.

The build writes the site to `build/`.

## Check your edit

```sh
npm run build
```

## Never

- Never edit `build/`: the next build replaces it.
- Never rename a page without updating the links to it.
