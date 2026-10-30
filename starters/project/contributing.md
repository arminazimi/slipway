---
title: Contributing
description: How to report a bug, propose a change, and run the tests.
layout: page
---

## Report a bug

Open an issue with the version, the Node version, and a short script that shows the problem. A failing test is the fastest report.

## Propose a change

1. Open an issue that says what changes and why.
2. Fork the repository and make the change on a branch.
3. Run `npm test` and `npm run lint`.
4. Open a pull request that links the issue.

Small changes do not need an issue first: a typo in this site, a broken link, or a test that is flaky.

## Run the tests

```bash
npm ci
npm test
```

The tests use Node's built-in test runner; there is no global install.
