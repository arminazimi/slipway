# `doctor.agents-commands`

The commands a site's `AGENTS.md` gives an agent have to work in that site. This check finds the
`npm run <script>` commands it names that are not scripts of the site's `package.json`, and the files
its shell commands read that do not exist in the site. It is a warning: it never changes the level the
site reaches, and every finding names the file and the line in `AGENTS.md`.

The paths in inline code spans are the spec's business: `ae.agents-md.paths-exist` checks that every
path in a code span exists, and fails L0 when one does not. This check looks at the commands, which
that test does not read.

## Why it matters for agents

An agent follows `AGENTS.md` without checking it. A command that cannot work sends the agent in a
loop: it runs `npm run deploy`, npm says the script does not exist, and the agent either invents a
script or gives up. A command that reads a file the site does not have wastes the same round trip.
The site owner sees the result only as a slow or confused agent.

## How to fix

For a missing script, add it to the site's `package.json`:

```json
{
  "scripts": {
    "deploy": "bundle exec jekyll build && git push origin main"
  }
}
```

or change the command in `AGENTS.md` to one the site has.

For a missing file, create it, or point the command at a file the site has.

## Examples

**Bad:** `AGENTS.md` names a script the site does not have, and reads a file the site does not have.

````markdown
## Check your edit

```sh
npm run build
npm run deploy
cat _data/navigation.yml
```
````

**Good:** every script is in the site's `package.json`, and every file the commands read exists.

````markdown
## Check your edit

```sh
npm run build
cat _data/navigation.yml
```
````
