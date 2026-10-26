import assert from "node:assert/strict";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

test("skips when there is no tag", () => {
  const env = { ...process.env, PATH: process.env.PATH };
  const workDir = mkdtempSync(join(tmpdir(), "slipway-upgrade-test-mock-"));

  try {
    const fakeGit = join(workDir, "git");
    writeFileSync(fakeGit, "#!/bin/sh\nif [ \"$1\" = \"describe\" ]; then exit 128; fi\nexec /usr/bin/git \"$@\"\n");
    spawnSync("chmod", ["+x", fakeGit]);

    env.PATH = `${workDir}:${env.PATH}`;

    const result = spawnSync("node", ["tools/release/upgrade-test.mjs"], { cwd: root, encoding: "utf8", env });
    assert.equal(result.status, 0);
    assert.match(result.stdout, /SKIP: No tag found/);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

test("fails when a build error occurs", () => {
  const env = { ...process.env, PATH: process.env.PATH };
  const workDir = mkdtempSync(join(tmpdir(), "slipway-upgrade-test-mock-err-"));

  try {
    const fakeGit = join(workDir, "git");
    writeFileSync(fakeGit, `#!/bin/sh\nif [ "$1" = "describe" ]; then echo "v0.1.0"; exec true; fi\nif [ "$1" = "archive" ]; then exec true; fi\nexec /usr/bin/git "$@"\n`);
    spawnSync("chmod", ["+x", fakeGit]);

    const fakeTar = join(workDir, "tar");
    writeFileSync(fakeTar, `#!/bin/sh\nwhile [ $# -gt 0 ]; do\n  if [ "$1" = "-C" ]; then OUTDIR=$2; break; fi\n  shift\ndone\nmkdir -p "$OUTDIR/examples/test_site"\ntouch "$OUTDIR/examples/test_site/_config.yml"\nexec true\n`);
    spawnSync("chmod", ["+x", fakeTar]);

    const fakeNode = join(workDir, "node");
    writeFileSync(fakeNode, `#!/bin/sh\nif [ "$1" = "tools/theme/build.mjs" ]; then\n  echo "Some error happened" >&2\n  exec false\nfi\nexec /usr/bin/node "$@"\n`);
    spawnSync("chmod", ["+x", fakeNode]);

    env.PATH = `${workDir}:${env.PATH}`;

    const result = spawnSync(process.execPath, ["tools/release/upgrade-test.mjs"], { cwd: root, encoding: "utf8", env });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /FAIL: Build error for test_site/);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});

test("fails when a new Liquid warning occurs", () => {
  const env = { ...process.env, PATH: process.env.PATH };
  const workDir = mkdtempSync(join(tmpdir(), "slipway-upgrade-test-mock-liq-"));

  try {
    const fakeGit = join(workDir, "git");
    writeFileSync(fakeGit, `#!/bin/sh\nif [ "$1" = "describe" ]; then echo "v0.1.0"; exec true; fi\nif [ "$1" = "archive" ]; then exec true; fi\nexec /usr/bin/git "$@"\n`);
    spawnSync("chmod", ["+x", fakeGit]);

    const fakeTar = join(workDir, "tar");
    writeFileSync(fakeTar, `#!/bin/sh\nwhile [ $# -gt 0 ]; do\n  if [ "$1" = "-C" ]; then OUTDIR=$2; break; fi\n  shift\ndone\nmkdir -p "$OUTDIR/examples/test_site"\ntouch "$OUTDIR/examples/test_site/_config.yml"\nexec true\n`);
    spawnSync("chmod", ["+x", fakeTar]);

    const fakeNode = join(workDir, "node");
    writeFileSync(fakeNode, `#!/bin/sh\nif [ "$1" = "tools/theme/build.mjs" ]; then\n  echo "Liquid Warning: foo"\n  exec true\nfi\nexec /usr/bin/node "$@"\n`);
    spawnSync("chmod", ["+x", fakeNode]);

    env.PATH = `${workDir}:${env.PATH}`;

    const result = spawnSync(process.execPath, ["tools/release/upgrade-test.mjs"], { cwd: root, encoding: "utf8", env });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /FAIL: New Liquid warning in test_site/);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
});
