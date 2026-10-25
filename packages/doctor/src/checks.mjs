// One function per automated test id in spec/tests.json. Each returns `{ status, findings, reason? }`:
// status is pass, fail, or not-run; a finding has `message` and, when known, `in` (source or output),
// `file` (relative to that folder), `line`, `key`, and `allowed`.
import { codeSpans, blocks, headings } from "./markdown.mjs";
import { startTags } from "./html.mjs";
import { allowedFor, splitFrontMatter, parseWithLines } from "./yaml.mjs";

const pass = { status: "pass", findings: [] };
const failWith = (findings) => (findings.length ? { status: "fail", findings } : { status: "pass", findings: [] });
const notRun = (reason) => ({ status: "not-run", findings: [], reason });
const agentsFinding = (message, line) => ({ in: "source", file: "AGENTS.md", ...(line ? { line } : {}), message });
const noOutput = { status: "fail", findings: [{ message: "needs the output folder: pass --build <dir>" }] };

/** AGENTS.md text, or a failed result when it is missing or unreadable. */
function agentsOr(site) {
  const agents = site.agents();
  if (!agents) return { fail: { status: "fail", findings: [agentsFinding("is missing")] } };
  if (agents.error) return { fail: { status: "fail", findings: [agentsFinding(agents.error)] } };
  return { text: agents.text };
}

/** A source map that parsed, or a failed result. Schema errors are reported by ae.sourcemap.present only. */
function sourcemapOr(site) {
  if (!site.build) return { fail: noOutput };
  const map = site.sourcemap();
  if (!map) return { fail: { status: "fail", findings: [{ in: "output", file: "sourcemap.json", message: "is missing" }] } };
  if (!map.data) return { fail: { status: "fail", findings: [{ in: "output", file: "sourcemap.json", message: "does not parse" }] } };
  return { pages: Array.isArray(map.data.pages) ? map.data.pages.filter((page) => page && typeof page === "object") : [] };
}

function indexOr(site) {
  const index = site.index();
  if (!index) return { fail: { status: "fail", findings: [{ in: "source", file: "content-schemas.json", message: "is missing" }] } };
  if (!index.data) return { fail: { status: "fail", findings: [{ in: "source", file: "content-schemas.json", message: "is not a valid index" }] } };
  return { data: index.data };
}

/** Files that hold content: those a front-matter entry matches, or, without an index, every file with front matter. */
function contentFiles(site) {
  const entries = site.entries("front-matter");
  if (entries.length) return site.files().filter((path) => entries.some((entry) => site.applies(entry, path)));
  return site.files().filter((path) => /\.(md|markdown|mdx|html?)$/i.test(path) && splitFrontMatter(site.read(path)));
}

const normalize = (span) => span.replace(/^\.\//, "").replace(/\/+$/, "");

/** Code spans that look like source paths: a `/` or a file extension, no spaces, not a URL, flag, glob, or bare extension. */
function pathSpans(text) {
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

/** Problems for one value against one compiled schema: one per key, the most specific error wins. */
function schemaProblems(validate, data, lineOf, offset) {
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

/** Walks a JSON Schema and yields every subschema object. */
function* subschemas(schema) {
  if (!schema || typeof schema !== "object") return;
  yield schema;
  for (const value of Object.values(schema)) {
    if (Array.isArray(value)) for (const item of value) yield* subschemas(item);
    else if (value && typeof value === "object") yield* subschemas(value);
  }
}

/** Lowercased letters and digits. */
const alnum = (text) => [...text.toLowerCase().matchAll(/[\p{L}\p{N}]/gu)].map((match) => match[0]);

function inOrder(needle, haystack) {
  let i = 0;
  for (const char of haystack) if (char === needle[i]) i++;
  return i === needle.length;
}

/** Headings with an id on a built page, by id. Null when the page is missing. */
function headingIds(site, url) {
  const file = site.outputFile(url);
  if (!file) return null;
  const ids = new Map();
  for (const tag of startTags(site.readOutput(file))) {
    const id = tag.attributes.get("id");
    if (id !== undefined && !ids.has(id)) ids.set(id, tag);
  }
  return { file, ids };
}

/** The resolved entries of the skills index, or a failed result. */
function skillsOr(site) {
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

function skillFile(site, url) {
  if (typeof url !== "string" || /^[a-z][a-z0-9+.-]*:|^\/\//i.test(url)) return null;
  const path = url.startsWith("/") ? url : `/.well-known/agent-skills/${url.replace(/^\.\//, "")}`;
  return site.outputFile(path);
}

export const checks = {
  "ae.agents-md.present"(site) {
    const { fail, text } = agentsOr(site);
    if (fail) return fail;
    return text.trim() ? pass : failWith([agentsFinding("is empty")]);
  },

  "ae.agents-md.layout"(site) {
    const { fail, text } = agentsOr(site);
    if (fail) return fail;
    const spans = codeSpans(text).map(({ value }) => normalize(value));
    const content = contentFiles(site);
    const findings = [];
    const namesContent = spans.some((span) => span && content.some((file) => file === span || file.startsWith(`${span}/`)));
    if (!namesContent) findings.push(agentsFinding("names no folder or file that holds content in a code span"));
    if (!site.build) {
      return findings.length ? failWith(findings) : { ...pass, reason: "the output folder part needs --build <dir>" };
    }
    const names = site.outputNames();
    if (!spans.some((span) => names.includes(span))) {
      findings.push(agentsFinding(`does not name the output folder in a code span (expected \`${names[0]}/\`)`));
    }
    return failWith(findings);
  },

  "ae.agents-md.paths-exist"(site) {
    const { fail, text } = agentsOr(site);
    if (fail) return fail;
    const outputs = site.outputNames();
    const findings = [];
    for (const { line, value } of pathSpans(text)) {
      if (/<[^>]+>/.test(value)) continue;
      const path = normalize(value.replace(/:\d+(:\d+)?$/, ""));
      if (!path || outputs.some((name) => path === name || path.startsWith(`${name}/`))) continue;
      const full = site.inside(site.source, path);
      if (!full) findings.push(agentsFinding(`\`${value}\` leaves the source folder`, line));
      else if (!site.files().some((file) => file === path || file.startsWith(`${path}/`)) && !site.isFile(site.source, path)) {
        findings.push(agentsFinding(`\`${value}\` does not exist in the source folder`, line));
      }
    }
    return failWith(findings);
  },

  "ae.agents-md.never"(site) {
    const { fail, text } = agentsOr(site);
    if (fail) return fail;
    const ok = headings(text).some((heading) => /^(never|do not)\b/i.test(heading.text) && heading.hasList);
    return ok ? pass : failWith([agentsFinding('has no "Never" or "Do not" heading followed by a list')]);
  },

  "ae.agents-md.verify"(site) {
    const { fail, text } = agentsOr(site);
    if (fail) return fail;
    const ok = blocks(text).fences.some((block) => ["sh", "bash", "shell"].includes(block.info));
    return ok ? pass : failWith([agentsFinding("has no fenced code block marked sh, bash, or shell")]);
  },

  "ae.agents-md.schemas"(site) {
    const { fail, text } = agentsOr(site);
    if (fail) return fail;
    const ok = codeSpans(text).some(({ value }) => value === "content-schemas.json");
    return ok ? pass : failWith([agentsFinding("does not name `content-schemas.json` in a code span")]);
  },

  "ae.agents-md.size"(site) {
    const agents = site.agents();
    if (!agents) return failWith([agentsFinding("is missing")]);
    return agents.size <= 32768 ? pass : failWith([agentsFinding(`is ${agents.size} bytes, more than 32768`)]);
  },

  "ae.schemas.index"(site) {
    const index = site.index();
    if (!index) return failWith([{ in: "source", file: "content-schemas.json", message: "is missing" }]);
    return failWith((index.errors ?? []).map((error) => ({ in: "source", file: "content-schemas.json", ...error })));
  },

  async "ae.schemas.resolve"(site) {
    const { fail } = indexOr(site);
    if (fail) return fail;
    const findings = [];
    const skipped = [];
    for (const [ref, result] of await site.schemas()) {
      if (result.error) findings.push({ in: "source", file: "content-schemas.json", key: ref, message: result.error });
      if (result.notRun) skipped.push(result.notRun);
    }
    if (findings.length) return failWith(findings);
    return skipped.length ? { ...pass, reason: `not run: ${skipped.join("; ")}` } : pass;
  },

  "ae.schemas.config"() {
    // Which files a generator reads as configuration is learned by detecting the generator (doctor.detect).
    return notRun("needs generator detection, which this version of slipway doctor does not have");
  },

  "ae.schemas.content"(site) {
    const { fail: indexFail } = indexOr(site);
    if (indexFail) return indexFail;
    const { fail, pages } = sourcemapOr(site);
    if (fail) return fail;
    const entries = site.entries("front-matter");
    const findings = [];
    for (const source of new Set(pages.map((page) => page.source))) {
      if (typeof source !== "string" || !site.isFile(site.source, source) || !site.frontMatterOf(source)) continue;
      if (!entries.some((entry) => site.applies(entry, source))) {
        findings.push({ in: "source", file: source, message: "has front matter but no front-matter entry in content-schemas.json matches it" });
      }
    }
    return failWith(findings);
  },

  async "ae.schemas.valid"(site) {
    const { fail, data } = indexOr(site);
    if (fail) return fail;
    const schemas = await site.schemas();
    const findings = [];
    const unsupported = new Set();
    for (const path of site.files()) {
      for (const entry of data.schemas) {
        if (!site.applies(entry, path)) continue;
        const compiled = schemas.get(entry.schema);
        if (!compiled?.validate) continue;
        const parsed = entry.target === "file" ? site.dataOf(path) : site.frontMatterOf(path);
        if (parsed.unsupported) unsupported.add(parsed.unsupported);
        else if (parsed.error) findings.push({ in: "source", file: path, line: parsed.line, key: "/", message: parsed.error });
        else {
          for (const problem of schemaProblems(compiled.validate, parsed.data, parsed.lineOf, parsed.offset)) {
            findings.push({ in: "source", file: path, ...problem });
          }
        }
      }
    }
    findings.sort((a, b) => (a.file === b.file ? a.line - b.line : a.file < b.file ? -1 : 1));
    if (findings.length) return failWith(findings);
    return unsupported.size ? { ...pass, reason: `not checked: ${[...unsupported].join(", ")}` } : pass;
  },

  async "ae.schemas.described"(site) {
    const { fail } = indexOr(site);
    if (fail) return fail;
    const findings = [];
    for (const [ref, { schema }] of await site.schemas()) {
      if (!schema) continue;
      for (const sub of subschemas(schema)) {
        if (!sub.properties || typeof sub.properties !== "object" || Array.isArray(sub.properties)) continue;
        for (const [name, property] of Object.entries(sub.properties)) {
          if (property && typeof property === "object" && !(typeof property.description === "string" && property.description.trim())) {
            findings.push({ in: "source", file: ref, key: name, message: "has no description" });
          }
        }
      }
    }
    return failWith(findings);
  },

  async "ae.schemas.closed"(site) {
    const { fail } = indexOr(site);
    if (fail) return fail;
    const findings = [];
    for (const [ref, { schema }] of await site.schemas()) {
      if (!schema || ![schema.type].flat().includes("object")) continue;
      if (schema.additionalProperties !== false && schema.unevaluatedProperties !== false) {
        findings.push({ in: "source", file: ref, message: "accepts unknown keys: set additionalProperties or unevaluatedProperties to false" });
      }
    }
    return failWith(findings);
  },

  "ae.sourcemap.present"(site) {
    if (!site.build) return noOutput;
    const map = site.sourcemap();
    const at = { in: "output", file: "sourcemap.json" };
    if (!map) return failWith([{ ...at, message: "is missing" }]);
    const findings = (map.errors ?? []).map((error) => ({ ...at, ...error }));
    const seen = new Set();
    for (const page of map.data?.pages ?? []) {
      if (typeof page?.url !== "string") continue;
      if (seen.has(page.url)) findings.push({ ...at, key: page.url, message: "this url is listed more than once" });
      seen.add(page.url);
    }
    return failWith(findings);
  },

  "ae.sourcemap.sources-exist"(site) {
    const { fail, pages } = sourcemapOr(site);
    if (fail) return fail;
    const findings = pages
      .filter((page) => typeof page.source !== "string" || !site.isFile(site.source, page.source))
      .map((page) => ({ in: "output", file: "sourcemap.json", key: page.url, message: `source ${JSON.stringify(page.source)} is not a file in the source folder` }));
    return failWith(findings);
  },

  "ae.sourcemap.urls-exist"(site) {
    const { fail, pages } = sourcemapOr(site);
    if (fail) return fail;
    const findings = pages
      .filter((page) => typeof page.url !== "string" || !site.outputFile(page.url))
      .map((page) => ({ in: "output", file: "sourcemap.json", key: String(page.url), message: "does not resolve to a file in the output folder" }));
    return failWith(findings);
  },

  "ae.sourcemap.coverage"(site) {
    const { fail: indexFail } = indexOr(site);
    if (indexFail) return indexFail;
    const { fail, pages } = sourcemapOr(site);
    if (fail) return fail;
    // Drafts and partials, which publish no page, are learned by detecting the generator (doctor.detect); until then they are listed too.
    const mapped = new Set(pages.map((page) => page.source));
    const entries = site.entries("front-matter");
    const findings = site
      .files()
      .filter((path) => !mapped.has(path) && entries.some((entry) => site.applies(entry, path)))
      .map((path) => ({ in: "source", file: path, message: "matches a front-matter entry but is not a source in sourcemap.json" }));
    return failWith(findings);
  },

  "ae.sourcemap.lines"(site) {
    const { fail, pages } = sourcemapOr(site);
    if (fail) return fail;
    const findings = [];
    for (const page of pages) {
      const at = { in: "output", file: "sourcemap.json", key: String(page.url) };
      if (!Array.isArray(page.sections) || !Array.isArray(page.links)) {
        findings.push({ ...at, message: "has no sections or no links" });
        continue;
      }
      if (typeof page.source !== "string" || !site.isFile(site.source, page.source)) continue;
      const lines = site.read(page.source).split(/\r?\n/);
      const where = (line) => ({ in: "source", file: page.source, line });
      for (const section of page.sections) {
        if (!(section.line <= lines.length)) {
          findings.push({ ...where(section.line), message: `section ${JSON.stringify(section.text)} is past the end of the file` });
          continue;
        }
        const text = alnum(String(section.text ?? ""));
        const here = inOrder(text, alnum(lines[section.line - 1]));
        const before = section.line > 1 && inOrder(text, alnum(lines[section.line - 2]));
        if (!here && !before) findings.push({ ...where(section.line), message: `does not hold section ${JSON.stringify(section.text)}` });
      }
      for (const link of page.links) {
        if (!(link.line <= lines.length) || !lines[link.line - 1].includes(link.href)) {
          findings.push({ ...where(link.line), message: `does not hold link ${JSON.stringify(link.href)}` });
        }
      }
    }
    return failWith(findings);
  },

  "ae.sourcemap.ids"(site) {
    const { fail, pages } = sourcemapOr(site);
    if (fail) return fail;
    const findings = [];
    for (const page of pages) {
      if (!Array.isArray(page.sections) || !page.sections.length) continue;
      const built = headingIds(site, page.url);
      if (!built) continue; // ae.sourcemap.urls-exist reports it.
      for (const section of page.sections) {
        const tag = built.ids.get(section.id);
        const at = { in: "output", file: built.file, key: section.id };
        if (!tag || !/^h[1-6]$/.test(tag.name)) findings.push({ ...at, message: "no heading has this id" });
        else if (tag.name !== `h${section.level}`) findings.push({ ...at, message: `is an ${tag.name}, the map says h${section.level}` });
      }
    }
    return failWith(findings);
  },

  "ae.edit-prompt.source"(site) {
    const { fail, pages } = sourcemapOr(site);
    if (fail) return fail;
    const findings = [];
    for (const page of pages) {
      if (!Array.isArray(page.sections) || !page.sections.length) continue;
      const built = headingIds(site, page.url);
      if (!built) continue;
      for (const section of page.sections) {
        const tag = built.ids.get(section.id);
        if (!tag) continue; // ae.sourcemap.ids reports it.
        const expected = `${page.source}:${section.line}`;
        const actual = tag.attributes.get("data-source");
        if (actual !== expected) {
          findings.push({
            in: "output",
            file: built.file,
            key: section.id,
            message: actual === undefined ? `has no data-source (expected ${expected})` : `has data-source ${actual}, expected ${expected}`,
          });
        }
      }
    }
    return failWith(findings);
  },

  "ae.edit-prompt.without-script"(site) {
    if (!site.build) return noOutput;
    const findings = [];
    for (const file of site.outputHtml()) {
      for (const tag of startTags(site.readOutput(file))) {
        if (tag.attributes.has("data-edit-prompt") && !tag.attributes.has("hidden")) {
          findings.push({ in: "output", file, key: tag.name, message: "has data-edit-prompt but is not hidden in the served HTML" });
        }
      }
    }
    return failWith(findings);
  },

  "ae.skills.index"(site) {
    const { fail, findings } = skillsOr(site);
    return fail ?? failWith(findings);
  },

  "ae.skills.resolve"(site) {
    const { fail, skills } = skillsOr(site);
    if (fail) return fail;
    const findings = [];
    skills.forEach((skill, i) => {
      const at = { in: "output", file: ".well-known/agent-skills/index.json", key: `skills.${i}.url` };
      const file = skillFile(site, skill?.url);
      if (!file) return findings.push({ ...at, message: `${JSON.stringify(skill?.url)} does not resolve to a file on the same site` });
      const block = splitFrontMatter(site.readOutput(file));
      const parsed = block?.format === "yaml" ? parseWithLines(block.text) : null;
      const data = parsed?.data ?? {};
      if (data.name !== skill.name) findings.push({ in: "output", file, key: "name", message: `is ${JSON.stringify(data.name)}, the index says ${JSON.stringify(skill.name)}` });
      if (!(typeof data.description === "string" && data.description.trim())) findings.push({ in: "output", file, key: "description", message: "is missing or empty" });
    });
    return failWith(findings);
  },

  "ae.skills.edit"(site) {
    const { fail, skills } = skillsOr(site);
    if (fail) return fail;
    const ok = skills.some((skill) => {
      const file = skillFile(site, skill?.url);
      if (!file) return false;
      const text = site.readOutput(file);
      return /https:\/\/[^\s)>\]"']+/.test(text) && text.includes("AGENTS.md");
    });
    return ok ? pass : failWith([{ in: "output", file: ".well-known/agent-skills/index.json", message: "no skill gives the source repository's https URL and names AGENTS.md" }]);
  },
};

