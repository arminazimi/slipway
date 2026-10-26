# CI Recipes for Slipway Doctor

You can run `slipway doctor` in any Continuous Integration (CI) environment to enforce your agent-editable site spec. This guide provides recipes for GitLab CI, Netlify, Cloudflare Pages, Vercel, and a local pre-commit hook.

## GitLab CI

Run the doctor after your site builds. Add this job to your `.gitlab-ci.yml`:

```yaml
doctor:
  image: node:22
  stage: test
  script:
    # If your site builds to public/
    - npx slipway doctor . --build public
```

## Netlify

In Netlify, append the doctor check to your build command in `netlify.toml`:

```toml
[build]
  # Assuming the build command outputs to public/
  command = "npm run build && npx slipway doctor . --build public"
  publish = "public"
```

## Cloudflare Pages

In your Cloudflare Pages project settings (or `wrangler.toml`), set the build command to run the doctor after building:

```bash
# If your site builds to _site/ (like Jekyll)
jekyll build && npx slipway doctor . --build _site
```

## Vercel

In Vercel, override the default Build Command in your Project Settings to include the doctor check:

```bash
# If your site builds to public/
npm run build && npx slipway doctor . --build public
```

## pre-commit

You can check your site locally before every commit using [pre-commit](https://pre-commit.com). Add this to your `.pre-commit-config.yaml`:

```yaml
repos:
  - repo: local
    hooks:
      - id: slipway-doctor
        name: Slipway Doctor
        entry: npx slipway doctor .
        language: system
        pass_filenames: false
```

> **Note:** The pre-commit hook runs on the source code without a build directory (`--build`), meaning it only runs the source-level checks (like ensuring stubs are present or no liquid in content).
