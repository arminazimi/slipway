import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// Function to fetch git output, allowing easy mocking in tests
export function git(args, cwd) {
  return spawnSync("git", args, { cwd, encoding: "utf8" });
}

export function main(rootDir) {
  try {
    const root = rootDir || join(process.cwd());

    // Check if origin/main is available
    const revParse = git(["rev-parse", "origin/main"], root);
    if (revParse.status !== 0) {
      // Quietly skip if origin/main is not available (e.g., shallow clone)
      return;
    }

    const hotFilesPath = join(root, ".github/hot-files.txt");
    if (!existsSync(hotFilesPath)) {
      return;
    }

    // Read the list of hot files
    const hotFilesList = readFileSync(hotFilesPath, "utf8")
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (hotFilesList.length === 0) {
      return;
    }

    // Get the list of changed files compared to origin/main
    const diff = git(["diff", "--name-only", "origin/main...HEAD"], root);
    if (diff.status !== 0) {
      return; // Skip if git diff fails
    }

    const changedFiles = diff.stdout
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0);

    for (const changedFile of changedFiles) {
      if (hotFilesList.includes(changedFile)) {
        console.warn(`Warning: This PR edits a hot file: ${changedFile}`);
      }
    }
  } catch (error) {
    // Never fail, even if there's an error
  }
}

import { fileURLToPath } from "node:url";
if (import.meta.url.startsWith("file:") && process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = join(fileURLToPath(new URL(".", import.meta.url)), "../..");
  main(root);
}
