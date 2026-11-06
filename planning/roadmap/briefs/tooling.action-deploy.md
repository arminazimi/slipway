## Goal
A composite Action that installs Node, builds with `slipway build`, runs `slipway check`, and deploys with the official Pages actions.

## Files

**Create**
- `action/deploy/action.yml`
- `action/deploy/README.md`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. All actions pinned by commit SHA.
2. Inputs: site folder, Node version, whether to run doctor.

## Done when
- [ ] A test workflow in the pull request deploys `fixtures/docs-site` to a preview.
- [ ] `npm run check` passes.
