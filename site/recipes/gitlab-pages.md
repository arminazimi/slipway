---
title: Deploy to GitLab Pages
description: How to deploy your Slipway site to GitLab Pages.
layout: doc
permalink: /recipes/gitlab-pages/
date: 2024-03-20
author: Slipway
---

## Deploy to GitLab Pages

You can build and deploy a Slipway site to GitLab Pages using GitLab CI/CD.

Slipway relies on Jekyll, so you will build your site and push the output to the `public/` directory.

### Prerequisites

Since you will be running the build yourself, you must use standard Jekyll instead of `remote_theme`.

1. Ensure your `Gemfile` includes the theme:
   ```ruby
   source "https://rubygems.org"
   gem "jekyll"
   gem "slipway-theme"
   ```

2. In your `_config.yml`, use `theme` instead of `remote_theme`. If you are deploying to a project page (e.g., `https://username.gitlab.io/projectname`), you also need to set the `baseurl`:
   ```yaml
   baseurl: /projectname
   theme: slipway-theme
   ```

### Setup on GitLab Pages

To configure GitLab Pages, you need to add a `.gitlab-ci.yml` file to the root of your repository. This file will tell GitLab CI/CD how to build your site with the Pages gem and publish the `public/` directory.

Please refer to the [GitLab Pages documentation](https://docs.gitlab.com/ee/user/project/pages/) and the [Jekyll on GitLab Pages documentation](https://docs.gitlab.com/ee/user/project/pages/getting_started_part_four.html#jekyll) for details on how to set up the deployment step.
