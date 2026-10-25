# slipway doctor Action

Runs [`slipway doctor`](../../packages/doctor/README.md) on any static site and shows each finding as an annotation on the pull request, at the file and line it is about. The step fails when the site does not reach the level you ask for.

```yaml
- uses: actions/checkout@v4
- uses: arminazimi/slipway/action/doctor@main
  with:
    path: .
    build: _site
```

Build the site in an earlier step so `build` exists; without it, the tests on the output fail.

## With SARIF for code scanning

```yaml
permissions:
  security-events: write
steps:
  - uses: actions/checkout@v4
  - id: doctor
    uses: arminazimi/slipway/action/doctor@main
    with:
      build: _site
      sarif: "true"
  - if: always()
    uses: github/codeql-action/upload-sarif@v3
    with:
      sarif_file: ${{ steps.doctor.outputs.sarif-file }}
```

`if: always()` uploads the file even when the doctor step fails. Findings with no file, such as a missing output folder, do not show in code scanning; they still show as annotations and in the log.

## Inputs

| Input | Default | Meaning |
| --- | --- | --- |
| `path` | `.` | The site's source folder. |
| `build` | none | The built output folder. |
| `level` | `L1` | Fail unless the site reaches this level, `L0` to `L3`. `none` reports without failing. |
| `format` | `text` | The log output, `text` or `json`. Annotations are written either way. |
| `sarif` | `false` | Also write a SARIF 2.1.0 file. |
| `sarif-file` | `slipway.sarif` | Where to write it. |
| `setup-node` | `true` | Install Node 22 with `actions/setup-node`; set to `false` when the job already has Node 22 or later. |

Outputs: `level` (`L0` to `L3`, or `none`) and `sarif-file`.

Paths are relative to the repository root, the folder the job runs in. GitHub shows at most 10 errors and 10 warnings per step as annotations; the log has them all. The Action installs the doctor's two dependencies in its own folder and never touches the site's `package.json`. It reads only the folders you give it and uses no network.
