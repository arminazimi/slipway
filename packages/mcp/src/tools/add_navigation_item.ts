import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { Document, parseDocument } from "yaml";

export const definition = {
  name: "add_navigation_item",
  description: "Add a link to the main navigation menu in _data/navigation.yml.",
  inputSchema: {
    type: "object",
    properties: {
      title: { type: "string", description: "The text of the link." },
      url: { type: "string", description: "The URL of the link." },
    },
    required: ["title", "url"],
    additionalProperties: false,
  },
};

/** Adds an item to the main navigation in _data/navigation.yml. */
export function addNavigationItem(site, { title, url }) {
  const base = realpathSync(site);
  const dir = resolve(base, "_data");
  mkdirSync(dir, { recursive: true });
  const file = resolve(dir, "navigation.yml");

  let doc;
  if (existsSync(file)) {
    doc = parseDocument(readFileSync(file, "utf8"));
  } else {
    doc = new Document({});
  }

  if (!doc.has("main")) doc.set("main", doc.createNode([]));
  const main = doc.get("main");
  if (main && typeof main.add === "function") {
    main.add(doc.createNode({ title, url }));
  } else if (main && Array.isArray(main.items)) {
    main.items.push(doc.createNode({ title, url }));
  }

  writeFileSync(file, doc.toString());
  return { status: "added", title, url };
}

export const handler = (site, args) => addNavigationItem(site, args);
