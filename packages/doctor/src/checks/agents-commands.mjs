// Checks the commands a site's AGENTS.md gives an agent: the npm scripts it names and the files its
// shell commands read. A warning: it never changes the conformance level. The paths in inline code
// spans are the spec's business (ae.agents-md.paths-exist), so they are not checked here.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { detect } from "../detect.mjs";

export const id = "doctor.agents-commands";
export const level = "warning";

const result = (findings) => ({ status: findings.length ? "fail" : "pass", findings });

const finding = (line, message, fix) => ({ in: "source", file: "AGENTS.md", line, message, fix });

/** The code fence info strings that hold shell commands. */
const shell = new Set(["sh", "bash", "shell", "zsh", "console", "shell-session"]);

/** The commands that read a file: the path after one of them has to exist. */
const readers = new Set([
  "awk",
  "cat",
  "cmp",
  "diff",
  "egrep",
  "file",
  "fgrep",
  "grep",
  "head",
  "jq",
  "less",
  "ls",
  "more",
  "rg",
  "sort",
  "stat",
  "tail",
  "tree",
  "uniq",
  "wc",
  "yq",
]);

/** A word that names a file or a folder in the site. */
const looksLikePath = (token) =>
  !/\s/.test(token) &&
  (token.includes("/") || /\.[A-Za-z][A-Za-z0-9]{0,9}$/.test(token)) &&
  !/^[a-z][a-z0-9+.-]*:/i.test(token) &&
  !token.startsWith("/") &&
  !token.startsWith("-") &&
  !token.startsWith("~") &&
  !/[*?{}$<>|]/.test(token);

/** The lines of the shell code blocks in the text, with their line numbers. */
function shellLines(text) {
  const commands = [];
  let open = null;
  text.split(/\r?\n/).forEach((raw, index) => {
    const line = index + 1;
    const match = /^ {0,3}(`{3,}|~{3,})\s*([^`\s]*)/.exec(raw);
    if (open) {
      if (match && match[1][0] === open.marker[0] && match[1].length >= open.marker.length && !match[2]) {
        if (open.shell) open.lines.forEach((body, offset) => commands.push({ line: open.line + 1 + offset, text: body }));
        open = null;
      } else {
        open.lines.push(raw);
      }
      return;
    }
    if (match) open = { marker: match[1], line, shell: shell.has(match[2].toLowerCase()), lines: [] };
  });
  return commands;
}

/** The command a shell line runs: its first word, without an env assignment or `sudo` in front. */
function commandOf(line) {
  for (const token of line.trim().split(/\s+/)) {
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(token)) continue;
    if (["command", "env", "nohup", "sudo", "time"].includes(token)) continue;
    return token;
  }
  return "";
}

/** The paths a shell line reads: the path-like words of a line that reads a file. */
function readPaths(line) {
  if (!readers.has(commandOf(line))) return [];
  return line.trim().split(/\s+/).filter(looksLikePath);
}

/** Every `npm run <script>` in the text, with its line. A script npm may skip is left out. */
function npmRuns(text) {
  const found = [];
  text.split(/\r?\n/).forEach((line, index) => {
    for (const match of line.matchAll(/\bnpm\s+(?:run|run-script)\s+([A-Za-z0-9][A-Za-z0-9:._-]*)([^\n]*)/g)) {
      if (match[2].includes("--if-present")) continue;
      found.push({ line: index + 1, script: match[1] });
    }
  });
  return found;
}

/** The scripts in the site's package.json, or null when the site has none to read. */
function scriptsOf(site) {
  if (!site.isFile(site.source, "package.json")) return null;
  try {
    const parsed = JSON.parse(site.read("package.json"));
    return parsed && typeof parsed.scripts === "object" && parsed.scripts !== null ? parsed.scripts : {};
  } catch {
    return null;
  }
}

export async function run(site) {
  const agents = site.agents();
  if (!agents || agents.error) return result([]);

  const findings = [];

  // The npm scripts the file names must be scripts of the site.
  const scripts = scriptsOf(site);
  if (scripts) {
    const seen = new Set();
    for (const { line, script } of npmRuns(agents.text)) {
      if (Object.hasOwn(scripts, script)) continue;
      if (seen.has(`${line}:${script}`)) continue;
      seen.add(`${line}:${script}`);
      findings.push(
        finding(
          line,
          `\`npm run ${script}\` is not a script in \`package.json\``,
          `add a \`${script}\` script to \`package.json\`, or change the command in AGENTS.md`,
        ),
      );
    }
  }

  // The files the commands read must exist in the site.
  const outputs = [...site.outputNames(), detect(site.source).outputDir].filter(Boolean);
  for (const { line, text } of shellLines(agents.text)) {
    const seen = new Set();
    for (const token of readPaths(text)) {
      if (seen.has(token)) continue;
      seen.add(token);
      const path = token.replace(/^\.\//, "").replace(/\/+$/, "");
      if (!path || /<[^>]+>/.test(path)) continue;
      if (outputs.some((name) => path === name || path.startsWith(`${name}/`))) continue;
      if (!site.inside(site.source, path)) continue;
      if (existsSync(join(site.source, ...path.split("/")))) continue;
      findings.push(finding(line, `\`${token}\` does not exist in the site`, `create \`${path}\`, or change the command in AGENTS.md`));
    }
  }

  return result(findings);
}
