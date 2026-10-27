# Changelog fragments

Each pull request that a site owner would notice adds one file here, `changelog.d/<issue-or-pr-number>.md`, with one line:

```markdown
Search finds Persian pages typed with Arabic letters (#229).
```

A fragment is a single bullet; a line that does not start with `- ` gets one. Extra lines stay under it. Do not edit `CHANGELOG.md`: parallel pull requests would conflict on it. `node tools/release/prepare.mjs <version>` collects the fragments (numbers in order) into the dated section, then deletes them.
