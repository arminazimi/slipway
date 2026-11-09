import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Generates a simple unified diff for a single file.
 */
function generateDiff(file, oldLines, newLines) {
  let diff = `--- ${file}\n+++ ${file}\n`;
  let hasChanges = false;
  for (let i = 0; i < Math.max(oldLines.length, newLines.length); i++) {
    if (oldLines[i] !== newLines[i]) {
      hasChanges = true;
      diff += `@@ -${i + 1},1 +${i + 1},1 @@\n`;
      if (i < oldLines.length) diff += `-${oldLines[i]}\n`;
      if (i < newLines.length) diff += `+${newLines[i]}\n`;
    }
  }
  return hasChanges ? diff : "";
}

/**
 * Applies fixes for safe cases in the report and returns an array of diff strings.
 * If `dryRun` is true, no files are modified.
 */
export function applyFixes(report, sourceDir, options = { dryRun: false }) {
  const diffs = [];
  const findings = report.findings || [];

  const stubs = findings.filter(f => f.id === "jekyll.stubs");
  for (const finding of stubs) {
    if (finding.in !== "source" || !finding.file) continue;
    const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
    const sourceStub = join(repoRoot, "starter-files", finding.file);
    const destStub = join(sourceDir, finding.file);

    if (existsSync(sourceStub)) {
      const content = readFileSync(sourceStub, "utf8");
      if (!options.dryRun) {
        mkdirSync(dirname(destStub), { recursive: true });
        writeFileSync(destStub, content, "utf8");
      }
      diffs.push(`--- /dev/null\n+++ ${finding.file}\n@@ -0,0 +1,${content.split(/\r?\n/).length} @@\n+ (copied from starter-files/${finding.file})\n`);
    }
  }

  const deprecations = findings.filter(f => f.id === "jekyll.deprecated");
  // Group deprecations by file
  const depsByFile = new Map();
  for (const finding of deprecations) {
    if (finding.in !== "source" || !finding.file || !finding.line || !finding.old || !finding.new) continue;
    if (!depsByFile.has(finding.file)) depsByFile.set(finding.file, []);
    depsByFile.get(finding.file).push(finding);
  }

  for (const [file, fileFindings] of depsByFile) {
    const dest = join(sourceDir, file);
    if (!existsSync(dest)) continue;
    const oldContent = readFileSync(dest, "utf8");
    const lines = oldContent.split(/\r?\n/);
    const oldLines = [...lines];

    // Sort findings by line in reverse order, though for single-line replacements it might not matter if they are on different lines.
    // However, if multiple replacements happen on the same line, this simple replace might be tricky.
    // The deprecation check typically gives one key per line.
    for (const finding of fileFindings) {
      const lineIdx = finding.line - 1;
      if (lineIdx >= 0 && lineIdx < lines.length) {
        // Only replace the key part, which is usually the last part of old
        const oldKey = finding.old.split(".").pop();
        const newKey = finding.new.split(".").pop();
        // Replace first occurrence of oldKey that is followed by a colon
        const regex = new RegExp(`(^|\\s)${oldKey}(\\s*:)`);
        lines[lineIdx] = lines[lineIdx].replace(regex, `$1${newKey}$2`);
      }
    }

    const diff = generateDiff(file, oldLines, lines);
    if (diff) {
      diffs.push(diff);
      if (!options.dryRun) {
        // preserve original line endings by re-joining with whatever was there?
        // Since we split by \r?\n, we lose the original ending if it was \r\n.
        // A better way is to just replace in the original text if possible, but line replacement is safer.
        const eol = oldContent.includes("\r\n") ? "\r\n" : "\n";
        writeFileSync(dest, lines.join(eol), "utf8");
      }
    }
  }

  return diffs;
}
