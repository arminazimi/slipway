import { resolve, dirname, join } from "node:path";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const usage = `Usage: slipway pin <version> [source-dir] [options]

Updates the remote_theme pin to the given version and prints upgrade notes.

Options:
  --json               print as json instead of text
  -h, --help           show this help`;

/** Parses arguments. Returns \`{ options }\` or \`{ error }\`. */
export function parseArgs(args) {
  const [command, ...rest] = args;
  if (command === "-h" || command === "--help" || command === "help") return { help: true };
  if (command !== "pin") return { error: command ? `unknown command: ${command}` : "missing command" };

  const options = { format: "text", version: null, source: null };

  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === "-h" || arg === "--help") return { help: true };
    else if (arg === "--json") options.format = "json";
    else if (arg.startsWith("-")) return { error: `unknown option: ${arg}` };
    else if (options.version === null) options.version = arg;
    else if (options.source === null) options.source = arg;
    else return { error: `unexpected argument: ${arg}` };
  }

  if (options.version === null) return { error: "missing <version>" };
  if (options.source === null) options.source = ".";

  return { options };
}

function parseUpgradingNotes(oldVersion, newVersion, upgradingPath) {
  if (!existsSync(upgradingPath)) return [];
  const content = readFileSync(upgradingPath, "utf8");
  const lines = content.split('\n');
  const notes = [];

  let currentVersion = null;
  let capturing = false;
  let currentNoteLines = [];

  for (const line of lines) {
    const match = line.match(/^##\s+(.+)$/);
    if (match) {
      if (currentVersion && capturing) {
        notes.push({ version: currentVersion, body: currentNoteLines.join('\n').trim() });
        currentNoteLines = [];
      }
      currentVersion = match[1].trim();
      // We capture notes for versions that are <= newVersion and > oldVersion (if oldVersion exists)
      // Actually we just capture all versions, then filter later
      capturing = true;
    } else if (capturing) {
      currentNoteLines.push(line);
    }
  }
  if (currentVersion && capturing) {
    notes.push({ version: currentVersion, body: currentNoteLines.join('\n').trim() });
  }

  // simple semver compare to get notes between oldVersion and newVersion
  // Assuming versions in UPGRADING.md are ordered descending (latest first)
  const result = [];
  for (const note of notes) {
    const noteVer = note.version.replace(/^v/, '');
    const oldVer = oldVersion ? oldVersion.replace(/^v/, '') : '';
    const newVer = newVersion.replace(/^v/, '');

    // Compare logic: we want notes for versions greater than oldVersion, up to newVersion
    // Since we don't have a full semver library, we just do string comparison or assume the order in file is correct.
    // If UPGRADING is descending, we take notes until we hit oldVersion.
    // Actually, a simpler approach is to find index of newVersion and oldVersion in the notes list.

    // Let's implement a simple string compare for versions:
    const cmp = (a, b) => {
      const pa = a.split('.').map(Number);
      const pb = b.split('.').map(Number);
      for (let i = 0; i < 3; i++) {
        const na = pa[i] || 0;
        const nb = pb[i] || 0;
        if (na > nb) return 1;
        if (na < nb) return -1;
      }
      return 0;
    };

    let include = false;
    if (oldVersion) {
       if (cmp(noteVer, oldVer) > 0 && cmp(noteVer, newVer) <= 0) {
         include = true;
       }
    } else {
       if (cmp(noteVer, newVer) <= 0) {
         include = true;
       }
    }

    if (include) {
      result.push(note);
    }
  }

  return result;
}

export async function main(args, { log = console.log, error = console.error } = {}) {
  const parsed = parseArgs(args);
  if (parsed.help) {
    log(usage);
    return 0;
  }
  if (parsed.error) {
    error(`slipway pin: ${parsed.error}\n\n${usage}`);
    return 2;
  }

  const { version, source, format } = parsed.options;
  const sourceDir = resolve(source);
  const configPath = join(sourceDir, "_config.yml");

  if (!existsSync(configPath)) {
    error(`slipway pin: no _config.yml found in ${source}`);
    return 1;
  }

  let content = readFileSync(configPath, "utf8");
  const remoteMatch = content.match(/^(.*remote_theme:\s*arminazimi\/slipway@)(.+)((\s*#.*)?)$/m);

  if (!remoteMatch) {
    error(`slipway pin: no remote_theme pin found in _config.yml`);
    return 1;
  }

  const oldVersion = remoteMatch[2].trim();
  const prefix = remoteMatch[1];
  const suffix = remoteMatch[3] || "";

  const newContent = content.replace(remoteMatch[0], `${prefix}${version}${suffix}`);
  writeFileSync(configPath, newContent, "utf8");

  // Find UPGRADING.md
  // Using fileURLToPath from the root package since `npm ci` installs this locally,
  // or it might run inside the repository.
  const pkgRoot = resolve(__dirname, "..", "..", "..", "..");
  const upgradingPath = join(pkgRoot, "UPGRADING.md");

  const notes = parseUpgradingNotes(oldVersion, version, upgradingPath);

  if (format === "json") {
    log(JSON.stringify({
      oldVersion,
      newVersion: version,
      notes
    }, null, 2));
  } else {
    log(`Updated remote_theme from ${oldVersion} to ${version}`);
    if (notes.length > 0) {
      log(`\nUpgrade notes:`);
      for (const note of notes) {
        log(`\n## ${note.version}\n\n${note.body}`);
      }
    } else {
      log(`\nNo upgrade notes found between ${oldVersion} and ${version}.`);
    }
  }

  return 0;
}
