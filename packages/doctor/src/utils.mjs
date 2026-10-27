import { codeSpans, blocks, headings } from "./markdown.mjs";
import { startTags } from "./html.mjs";
import { allowedFor, splitFrontMatter, parseWithLines } from "./yaml.mjs";

export const pass = { status: "pass", findings: [] };
export const failWith = (findings) => (findings.length ? { status: "fail", findings } : { status: "pass", findings: [] });
export const notRun = (reason) => ({ status: "not-run", findings: [], reason });
export const agentsFinding = (message, line) => ({ in: "source", file: "AGENTS.md", ...(line ? { line } : {}), message });
export const noOutput = { status: "fail", findings: [{ message: "needs the output folder: pass --build <dir>" }] };

export function agentsOr(site) {
  const agents = site.agents();
  if (!agents) return { fail: { status: "fail", findings: [agentsFinding("is missing")] } };
  if (agents.error) return { fail: { status: "fail", findings: [agentsFinding(agents.error)] } };
  return { text: agents.text };
}

export function sourcemapOr(site) {
  if (!site.build) return { fail: noOutput };
  const map = site.sourcemap();
  if (!map) return { fail: { status: "fail", findings: [{ in: "output", file: "sourcemap.json", message: "is missing" }] } };
  if (!map.data) return { fail: { status: "fail", findings: [{ in: "output", file: "sourcemap.json", message: "does not parse" }] } };
  return { pages: Array.isArray(map.data.pages) ? map.data.pages.filter((page) => page && typeof page === "object") : [] };
}

export function indexOr(site) {
  const index = site.index();
  if (!index) return { fail: { status: "fail", findings: [{ in: "source", file: "content-schemas.json", message: "is missing" }] } };
  if (!index.data) return { fail: { status: "fail", findings: [{ in: "source", file: "content-schemas.json", message: "is not a valid index" }] } };
  return { data: index.data };
}

export function contentFiles(site) {
  const entries = site.entries("front-matter");
  if (entries.length) return site.files().filter((path) => entries.some((entry) => site.applies(entry, path)));
  return site.files().filter((path) => /.(md|markdown|mdx|html?)$/i.test(path) && splitFrontMatter(site.read(path)));
}

export const normalize = (span) => span.replace(/^\.\//, "").replace(/\/+$/, "");

export function pathSpans(text) {
  return codeSpans(text).filter(
    ({ value }) =>
      !/\s/.test(value) &&
      (value.includes("/") || /\.[A-Za-z][A-Za-z0-9]{0,9}$/.test(value)) &&
      !/^[a-z][a-z0-9+.-]*:/i.test(value) &&
      !value.startsWith("/") &&
      !value.startsWith("-") &&
      !/[*?{}$]/.test(value) &&
      !/^\.[A-Za-z0-9]+$/.test(value),
  );
}

export function schemaProblems(validate, data, lineOf, offset) {
  if (validate(data)) return [];
  const byKey = new Map();
  for (const error of validate.errors) {
    if (["allOf", "if"].includes(error.keyword)) continue;
    const path = error.instancePath.split("/").slice(1).map((part) => part.replace(/~1/g, "/").replace(/~0/g, "~"));
    let message = error.message;
    let allowed = allowedFor(error);
    if (error.keyword === "additionalProperties" || error.keyword === "unevaluatedProperties") {
      path.push(error.params.additionalProperty ?? error.params.unevaluatedProperty);
      message = "is not a known key";
      allowed = Object.keys(error.parentSchema?.properties ?? {});
    } else if (error.keyword === "required") {
      path.push(error.params.missingProperty);
      message = "is required";
      allowed = [];
    }
    const key = path.join(".") || "/";
    if (byKey.has(key)) continue;
    byKey.set(key, { key, line: lineOf(path) + offset, message, allowed });
  }
  return [...byKey.values()];
}

export function* subschemas(schema) {
  if (!schema || typeof schema !== "object") return;
  yield schema;
  for (const value of Object.values(schema)) {
    if (Array.isArray(value)) for (const item of value) yield* subschemas(item);
    else if (value && typeof value === "object") yield* subschemas(value);
  }
}

export const alnum = (text) => [...text.toLowerCase().matchAll(/[\p{L}\p{N}]/gu)].map((match) => match[0]);

export function inOrder(needle, haystack) {
  let i = 0;
  for (const char of haystack) if (char === needle[i]) i++;
  return i === needle.length;
}

export function headingIds(site, url) {
  const file = site.outputFile(url);
  if (!file) return null;
  const ids = new Map();
  for (const tag of startTags(site.readOutput(file))) {
    const id = tag.attributes.get("id");
    if (id !== undefined && !ids.has(id)) ids.set(id, tag);
  }
  return { file, ids };
}

export function skillsOr(site) {
  if (!site.build) return { fail: noOutput };
  const path = ".well-known/agent-skills/index.json";
  const at = { in: "output", file: path };
  if (!site.isFile(site.build, path)) return { fail: { status: "fail", findings: [{ ...at, message: "is missing" }] } };
  let data;
  try {
    data = JSON.parse(site.readOutput(path));
  } catch (error) {
    return { fail: { status: "fail", findings: [{ ...at, message: `JSON does not parse: ${error.message}` }] } };
  }
  const nonEmpty = (value) => typeof value === "string" && value.trim() !== "";
  if (!data || typeof data !== "object" || !Array.isArray(data.skills) || !data.skills.length) {
    return { fail: { status: "fail", findings: [{ ...at, key: "skills", message: "must be an array with at least one entry" }] } };
  }
  const findings = [];
  data.skills.forEach((skill, i) => {
    for (const field of ["name", "description", "url"]) {
      if (!nonEmpty(skill?.[field])) findings.push({ ...at, key: `skills.${i}.${field}`, message: "must be a non-empty string" });
    }
  });
  return { skills: data.skills, findings };
}

export function skillFile(site, url) {
  if (typeof url !== "string" || /^[a-z][a-z0-9+.-]*:|^\/\//i.test(url)) return null;
  const path = url.startsWith("/") ? url : `/.well-known/agent-skills/${url.replace(/^\.\//, "")}`;
  return site.outputFile(path);
}