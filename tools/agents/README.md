# Agent environment setup

`setup.sh` installs everything `npm run check` needs on a bare VM: Node 22, the Ruby in `.ruby-version`, the GitHub Pages gem (`bundle install`), npm packages, and Playwright browsers. Each step is skipped when its tool is already installed, so running it twice changes nothing.

```bash
bash tools/agents/setup.sh
SLIPWAY_REQUIRE_BUILD=1 npm run check
```

## Jules

Open the repository in Jules, go to **Configuration** → **Initial setup**, and paste:

```bash
bash tools/agents/setup.sh
```

Run the setup once, then run it against a session to check it. Jules writes its working files to `.jules/`, which `.gitignore` excludes.

## Other agents

Codex, Copilot, and any other cloud agent: run the same command as the environment setup step, or as the first command of the task.
