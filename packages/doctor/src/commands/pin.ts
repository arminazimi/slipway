import { dirname, isAbsolute, join, resolve } from "node:path";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Site } from "../site.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** The engine package every engine site builds with (ADR 0025). */
const enginePackage = "@velella/mizzen";

/** The theme that ships with the engine (ADR 0025) when `theme.name` names none. */
const defaultTheme = "@velella/lateen";

/** The dependency sections a site may pin a package in, in the order they are read. */
const dependencySections = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];

export const usage = `Usage: slipway pin <version> [source-dir] [options]

Updates the npm package pin of an engine site to the given version and prints
upgrade notes.

On an engine site it updates the @velella/mizzen and theme versions in
package.json, adding both pins when the file or the entries are missing.
The theme is theme.name in mizzen.yml or slipway.yml, or the theme that
ships with the engine when the config names none.

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

/** The theme's name from the engine config, or the theme that ships with the engine. */
function themeNameOf(config) {
  const name = config?.data?.theme?.name;
  return typeof name === "string" && name.trim() !== "" ? name.trim() : defaultTheme;
}

/** A theme `name` that names a folder rather than an npm package. */
function isFolderName(name) {
  return name.startsWith(".") || name.startsWith("/") || isAbsolute(name);
}

/** The version a manifest pins `name` at, with the section that holds it, or null. */
function pinnedVersion(manifest, name) {
  for (const section of dependencySections) {
    const version = manifest?.[section]?.[name];
    if (typeof version === "string") return { section, version };
  }
  return null;
}

/** Sets `name` to `version` in the section that already pins it. */
function setPinnedVersion(manifest, name, version, section) {
  manifest[section][name] = version;
}

/** Pins the npm packages an engine site builds with. Returns the exit code. */
function pinEngineSite(sourceDir, source, version, format, { log, error }, upgradingPath) {
  const config = new Site(sourceDir).config();
  if (config.error) {
    error(`slipway pin: ${config.file} does not parse: ${config.error}`);
    return 1;
  }

  const manifestPath = join(sourceDir, "package.json");
  let manifest;
  if (existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    } catch (err) {
      error(`slipway pin: package.json does not parse: ${err.message}`);
      return 1;
    }
  } else {
    manifest = { private: true, type: "module", devDependencies: {} };
  }

  const themeName = themeNameOf(config);
  const names = [enginePackage];
  if (!isFolderName(themeName) && themeName !== enginePackage) names.push(themeName);

  const changes = [];
  for (const name of names) {
    const pinned = pinnedVersion(manifest, name);
    if (pinned) changes.push({ name, from: pinned.version, to: version, section: pinned.section, added: false });
    else changes.push({ name, from: null, to: version, section: "devDependencies", added: true });
  }

  for (const change of changes) {
    if (change.added) (manifest.devDependencies ??= {})[change.name] = version;
    else setPinnedVersion(manifest, change.name, version, change.section);
  }
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  const oldVersion = changes.find((change) => change.name === enginePackage)?.from
    ?? changes.find((change) => change.from !== null)?.from
    ?? null;
  const notes = parseUpgradingNotes(oldVersion, version, upgradingPath);

  if (format === "json") {
    log(JSON.stringify({
      oldVersion,
      newVersion: version,
      packages: changes.map(({ name, from, to }) => ({ name, from, to })),
      notes
    }, null, 2));
  } else {
    for (const change of changes) {
      log(change.from === null
        ? `Pinned ${change.name} at ${change.to}`
        : `Updated ${change.name} from ${change.from} to ${change.to}`);
    }
    printNotes(notes, oldVersion, version, log);
  }

  return 0;
}

function printNotes(notes, oldVersion, version, log) {
  if (notes.length > 0) {
    log(`\nUpgrade notes:`);
    for (const note of notes) {
      log(`\n## ${note.version}\n\n${note.body}`);
    }
  } else if (oldVersion) {
    log(`\nNo upgrade notes found between ${oldVersion} and ${version}.`);
  } else {
    log(`\nNo upgrade notes found up to ${version}.`);
  }
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

  // Find UPGRADING.md
  // Using fileURLToPath from the root package since `npm ci` installs this locally,
  // or it might run inside the repository.
  const pkgRoot = resolve(__dirname, "..", "..", "..", "..");
  const upgradingPath = join(pkgRoot, "UPGRADING.md");

  if (new Site(sourceDir).config()) {
    return pinEngineSite(sourceDir, source, version, format, { log, error }, upgradingPath);
  }
  error(`slipway pin: no engine config (mizzen.yml or slipway.yml) found in ${source}`);
  return 1;
}
