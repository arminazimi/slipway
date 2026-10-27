import { mkdirSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import * as yaml from "yaml";
import { outside } from "../tools.mjs";

export const definition = {
  name: "create_page",
  description: "Create a new page or post.",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Path to the file to create, relative to the site directory." },
      frontMatter: { type: "string", description: "Front matter for the page as a JSON string." },
      content: { type: "string", description: "Markdown content for the page." },
    },
    required: ["path", "frontMatter", "content"],
    additionalProperties: false,
  },
};

/** Writes a new page with front matter and content. */
export function createPage(site, { path, frontMatter, content }) {
  const base = realpathSync(site);
  const file = resolve(base, path);
  if (outside(base, file)) throw new Error(`${path} is outside the site directory`);
  mkdirSync(dirname(file), { recursive: true });

  let fm = {};
  try {
    fm = JSON.parse(frontMatter);
  } catch (e) {
    throw new Error("frontMatter must be valid JSON");
  }

  const yamlString = Object.keys(fm).length > 0 ? `---\n${yaml.stringify(fm)}---\n` : "";
  writeFileSync(file, `${yamlString}${content}`);
  return { status: "created", file: path };
}

export const handler = (site, args) => createPage(site, args);
