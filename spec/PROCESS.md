# Changing a spec

Generators, themes, and checkers adopt a spec only when its changes are predictable, so every normative change goes through a short RFC.

1. **Open.** Copy [`rfcs/0000-template.md`](rfcs/0000-template.md) to `rfcs/NNNN-short-title.md` with the next free number and open a pull request with it. Fill in every section; Compatibility must say whether the change is breaking.
2. **Review.** The pull request stays open for 14 days from the day it was opened, so implementers can comment. A change to the RFC during the window does not restart it, unless it makes a non-breaking change breaking.
3. **Decide.** After the window, the maintainer accepts or declines it and says why in the pull request. A declined RFC is closed with its file unmerged.
4. **Land.** An accepted RFC lands in the same pull request: the RFC file with `Status: Accepted`, the edited spec text, and an entry in [`CHANGELOG.md`](CHANGELOG.md) under the spec's next version that links the RFC. A breaking change raises the version.

Not an RFC: fixing a typo, a link, or an example, or rewording that keeps the meaning. Those need a pull request and a `CHANGELOG.md` line under "Editorial", with no review window.

Until Spec 1.0 the specs are drafts and may change without an RFC; from 1.0 on this process is required ([ADR 0011](../docs/adr/0011-standalone-and-the-spec.md)).
