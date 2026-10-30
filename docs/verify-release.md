# Verify a release

Slipway releases are built by the [release workflow](../.github/workflows/release.yml) from a tagged commit on `main`. Once a release includes the SBOM and attestation steps, it carries two things you can check:

- `slipway-<version>.cdx.json`, a CycloneDX SBOM attached to the GitHub release. It covers the theme files, the gem's runtime dependencies, and the npm packages under `packages/` and `plugins/` with their dependencies.
- a build provenance attestation for `slipway-theme-<version>.gem`, the gem the same workflow builds and publishes to RubyGems.

Releases made before those steps, such as `v0.1.0`, have neither: their GitHub release has no assets and their gem has no attestation.

The commands on this page are examples. They read from GitHub and RubyGems, so `npm run check` does not run them; copy them into a terminal with network access and set `VERSION` to the release you want to check (the examples use `0.2.0`).

## What you need

- [GitHub CLI](https://cli.github.com) 2.49.0 or later, when `gh attestation verify` arrived (use a current release). `gh --version` prints yours.
- Ruby with RubyGems, for `gem fetch`.
- [`jq`](https://jqlang.github.io/jq/) to read the SBOM.

## 1. Download the release assets

```bash
# Example: run in an empty folder, with VERSION set to the release you want to check.
VERSION=0.2.0
gh release download "v$VERSION" --repo arminazimi/slipway
```

The tag is `v<version>` and the asset names use the bare version, so `v0.2.0` carries `slipway-0.2.0.cdx.json`. `gh release download` writes every asset of that release into the current folder. On a release that has none, it prints `no assets to download` and exits 1, as earlier releases do.

The gem itself is published to RubyGems; the next step fetches it from there.

## 2. Verify the gem's attestation

```bash
# Example: fetch the published gem, then check its attestation.
gem fetch slipway-theme --version "$VERSION"
gh attestation verify "slipway-theme-$VERSION.gem" --repo arminazimi/slipway
```

`gem fetch` writes `slipway-theme-<version>.gem`, the file the release workflow attested and pushed. On success, `gh attestation verify` prints `Verification succeeded!` and the details of the attestation it verified, including the signing workflow. It fails when the file's digest does not match an attestation from that repository, for example after an edit or a local rebuild; fetch the published file instead of building your own.

To require the release workflow itself as the signer, add `--signer-workflow arminazimi/slipway/.github/workflows/release.yml`.

## 3. Inspect the SBOM

```bash
# Example: count the components, then list their names and versions.
jq '.components | length' "slipway-$VERSION.cdx.json"
jq -r '.components[] | "\(.name) \(.version // "")"' "slipway-$VERSION.cdx.json" | sort
```

The SBOM is standard CycloneDX JSON, so any CycloneDX viewer or SBOM tool can read it; these two commands are enough to see what it lists. The first prints the number of components, the second prints each component's name and version.

## 4. Check the gem checksum

```bash
# Example: print the SHA-256 RubyGems publishes and the one your download has.
curl -fsSL "https://rubygems.org/api/v2/rubygems/slipway-theme/versions/$VERSION.json" | jq -r .sha
shasum -a 256 "slipway-theme-$VERSION.gem"
```

Both print the SHA-256 of the gem and they must match. The first comes from RubyGems' version API, the second from the file you fetched; on Linux, use `sha256sum` instead of `shasum -a 256`. The attestation above checks the same digest against the workflow.

## What each check shows

| Check | What it shows |
| --- | --- |
| Release assets | The files the release carries, including the SBOM. |
| `gh attestation verify` | The gem's digest is in a signed statement from a workflow in `arminazimi/slipway`; the output names the workflow and ref. |
| SBOM | The components the release was built from. The SBOM is not signed by itself. |
| Checksums | Your copy of the gem matches the file RubyGems publishes. |
