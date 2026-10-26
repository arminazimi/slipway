import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export function getLatestTag() {
  const result = spawnSync("git", ["describe", "--tags", "--abbrev=0"], { cwd: root, encoding: "utf8" });
  if (result.status !== 0) return null;
  return result.stdout.trim();
}

export function extractExamples(tag, outDir) {
  const archive = spawnSync("git", ["archive", tag, "examples/"], { cwd: root });
  if (archive.status !== 0) throw new Error(`git archive failed`);

  const tar = spawnSync("tar", ["-x", "-C", outDir], { input: archive.stdout, cwd: root });
  if (tar.status !== 0) throw new Error(`tar extraction failed`);
}

export function buildWithJekyll(sourceDir, destDir) {
  // Use node tools/theme/build.mjs gem destDir sourceDir
  const result = spawnSync("node", ["tools/theme/build.mjs", "gem", destDir, sourceDir], { cwd: root, encoding: "utf8", env: process.env });
  return {
    status: result.status,
    output: `${result.stdout}\n${result.stderr}`
  };
}

export function runUpgradeTest() {
  const tag = getLatestTag();
  if (!tag) {
    console.log("SKIP: No tag found to test upgrade from.");
    return 0;
  }
  console.log(`Testing upgrade from ${tag}...`);

  const workDir = mkdtempSync(join(tmpdir(), "slipway-upgrade-test-"));
  try {
    extractExamples(tag, workDir);
    const examplesDir = join(workDir, "examples");
    if (!existsSync(examplesDir)) {
      console.log(`SKIP: No examples directory found in tag ${tag}.`);
      return 0;
    }
    const examples = readdirSync(examplesDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && existsSync(join(examplesDir, entry.name, "_config.yml")))
      .map((entry) => entry.name);

    let failed = false;
    for (const name of examples) {
      console.log(`Building example: ${name}`);
      const source = join(examplesDir, name);
      const dest = join(workDir, "_site", name);

      const { status, output } = buildWithJekyll(source, dest);

      // Print deprecation warnings without failing
      const warnings = output.split('\n').filter(line => line.toLowerCase().includes("deprecation warning"));
      if (warnings.length > 0) {
        console.log(`WARN: Deprecation warnings in ${name}:`);
        for (const warn of warnings) console.log(warn);
      }

      if (status !== 0) {
        console.error(`FAIL: Build error for ${name}\n${output}`);
        failed = true;
      } else if (output.includes("Liquid Warning:")) {
        console.error(`FAIL: New Liquid warning in ${name}\n${output}`);
        failed = true;
      } else {
        console.log(`OK: ${name} built successfully.`);
      }
    }

    if (failed) return 1;

    console.log(`OK: All examples from ${tag} built successfully with the current theme.`);
    return 0;
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = runUpgradeTest();
}
