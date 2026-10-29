import { resolve, join } from "node:path";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { parseDocument, YAMLSeq, YAMLMap, isMap, isSeq } from "yaml";
import Ajv2020 from "ajv/dist/2020.js";

export const usage = `Usage: slipway nav <source-dir> [options]

Add, remove, or check items in _data/navigation.yml.

Options:
  --add <list>         the list key to add to (e.g., main or docs)
  --remove <list>      the list key to remove from
  --title <title>      the link title (required with --add)
  --url <url>          the link URL (required with --add or --remove)
  --parent <title>     the parent group title (optional with --add)
  --json               output result as JSON
  -h, --help           show this help`;

export function parseArgs(args) {
  const [command, ...rest] = args;
  if (command === "-h" || command === "--help" || command === "help") return { help: true };
  if (command !== "nav") return { error: command ? `unknown command: ${command}` : "missing command" };
  const options = { source: null, add: null, remove: null, title: null, url: null, parent: null, json: false };
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    const value = () => {
      const next = rest[++i];
      if (next === undefined || next.startsWith("--")) throw new Error(`${arg} needs a value`);
      return next;
    };
    try {
      if (arg === "-h" || arg === "--help") return { help: true };
      else if (arg === "--add") options.add = value();
      else if (arg === "--remove") options.remove = value();
      else if (arg === "--title") options.title = value();
      else if (arg === "--url") options.url = value();
      else if (arg === "--parent") options.parent = value();
      else if (arg === "--json") options.json = true;
      else if (arg.startsWith("-")) return { error: `unknown option: ${arg}` };
      else if (options.source === null) options.source = arg;
      else return { error: `unexpected argument: ${arg}` };
    } catch (error) {
      return { error: error.message };
    }
  }

  if (options.source === null) return { error: "missing <source-dir>" };
  if (options.add && options.remove) return { error: "cannot use both --add and --remove" };
  if (options.add) {
    if (!options.title) return { error: "--add needs --title" };
    if (!options.url) return { error: "--add needs --url" };
  } else if (options.remove) {
    if (!options.url) return { error: "--remove needs --url" };
  }
  return { options };
}

export async function main(args, { log = console.log, error = console.error } = {}) {
  const parsed = parseArgs(args);
  if (parsed.help) {
    log(usage);
    return 0;
  }
  if (parsed.error) {
    error(`slipway nav: ${parsed.error}\n\n${usage}`);
    return 2;
  }

  const { source, add, remove, title, url, parent, json } = parsed.options;
  const sourceDir = resolve(source);
  const dataDir = join(sourceDir, "_data");
  const navPath = join(dataDir, "navigation.yml");

  if (!existsSync(navPath)) {
    if (json) log(JSON.stringify({ error: `no _data/navigation.yml found in ${sourceDir}` }));
    else error(`slipway nav: no _data/navigation.yml found in ${sourceDir}`);
    return 1;
  }

  let content;
  try {
    content = readFileSync(navPath, "utf8");
  } catch (err) {
    if (json) log(JSON.stringify({ error: err.message }));
    else error(`slipway nav: ${err.message}`);
    return 1;
  }

  const doc = parseDocument(content);
  if (doc.errors.length > 0) {
    if (json) log(JSON.stringify({ error: doc.errors[0].message }));
    else error(`slipway nav: parse error: ${doc.errors[0].message}`);
    return 1;
  }

  let modified = false;

  if (add) {
    let listNode = doc.get(add);
    if (!listNode) {
      listNode = new YAMLSeq();
      doc.set(add, listNode);
    }

    if (parent) {
      let groupNode = listNode.items.find(item => isMap(item) && item.get("title") === parent && item.get("children"));
      if (!groupNode) {
        groupNode = new YAMLMap();
        groupNode.set("title", parent);
        groupNode.set("children", new YAMLSeq());
        listNode.items.push(groupNode);
      }
      const childrenNode = groupNode.get("children");
      const linkNode = new YAMLMap();
      linkNode.set("title", title);
      linkNode.set("url", url);
      childrenNode.items.push(linkNode);
    } else {
      const linkNode = new YAMLMap();
      linkNode.set("title", title);
      linkNode.set("url", url);
      listNode.items.push(linkNode);
    }
    modified = true;
  } else if (remove) {
    let listNode = doc.get(remove);
    if (listNode && isSeq(listNode)) {
      // Look for the URL in top-level items and children
      let removed = false;
      for (let i = listNode.items.length - 1; i >= 0; i--) {
        const item = listNode.items[i];
        if (isMap(item)) {
          if (item.get("url") === url) {
            listNode.items.splice(i, 1);
            removed = true;
          } else if (item.get("children") && isSeq(item.get("children"))) {
            const childrenNode = item.get("children");
            for (let j = childrenNode.items.length - 1; j >= 0; j--) {
              const child = childrenNode.items[j];
              if (isMap(child) && child.get("url") === url) {
                childrenNode.items.splice(j, 1);
                removed = true;
              }
            }
            if (childrenNode.items.length === 0) {
              listNode.items.splice(i, 1);
            }
          }
        }
      }
      if (removed) {
        modified = true;
      }
    }
  }

  // Schema validation
  const data = doc.toJS();

  // Read schema definition
  let schemaContent;
  let validate;
  try {
    const ajv = new Ajv2020({ allErrors: true });
    schemaContent = readFileSync(join(import.meta.dirname, "../../../../schema/navigation.schema.json"), "utf8");
    const schema = JSON.parse(schemaContent);
    validate = ajv.compile(schema);
  } catch (err) {
    if (json) log(JSON.stringify({ error: `failed to load schema: ${err.message}` }));
    else error(`slipway nav: failed to load schema: ${err.message}`);
    return 1;
  }

  const valid = validate(data);
  if (!valid) {
    const errObj = validate.errors[0];
    const errMsg = `${errObj.instancePath} ${errObj.message}`;
    if (json) log(JSON.stringify({ error: `schema validation failed: ${errMsg}` }));
    else error(`slipway nav: schema validation failed: ${errMsg}`);
    return 1;
  }

  if (modified) {
    try {
      writeFileSync(navPath, doc.toString(), "utf8");
    } catch (err) {
      if (json) log(JSON.stringify({ error: err.message }));
      else error(`slipway nav: ${err.message}`);
      return 1;
    }
  }

  if (json) {
    log(JSON.stringify({ success: true, modified }));
  } else {
    if (modified) {
      log("navigation updated");
    } else if (add || remove) {
      log("no changes made");
    } else {
      log("navigation is valid");
    }
  }

  return 0;
}
