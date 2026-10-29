import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { parseDocument } from "yaml";

const root = join(import.meta.dirname, "../..");

function findJsonFiles(dir, fileList = []) {
  const files = readdirSync(dir);
  for (const file of files) {
    const filePath = join(dir, file);
    if (statSync(filePath).isDirectory()) {
      findJsonFiles(filePath, fileList);
    } else if (file.endsWith(".json")) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function checkObjectSorted(obj, filePath, path = "") {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return;

  if (obj.properties) {
    const keys = Object.keys(obj.properties);
    const sorted = [...keys].sort();
    for (let i = 0; i < keys.length; i++) {
      assert.equal(keys[i], sorted[i], `In ${filePath}, properties at ${path || "root"} are out of order. Found '${keys[i]}' but expected '${sorted[i]}'`);
    }
  }

  for (const key of Object.keys(obj)) {
    if (key === "properties" || typeof obj[key] === "object") {
      checkObjectSorted(obj[key], filePath, path ? `${path}.${key}` : key);
    }
  }
}

test("schema properties are sorted alphabetically", () => {
  const schemaDir = join(root, "schema");
  const jsonFiles = findJsonFiles(schemaDir);

  for (const file of jsonFiles) {
    const content = readFileSync(file, "utf8");
    const json = JSON.parse(content);
    checkObjectSorted(json, file.replace(root + "/", ""));
  }
});

test("UI strings in every _includes/i18n/<lang>.html are sorted alphabetically", () => {
  const dir = join(root, "_includes/i18n");
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".html"))) {
    const html = readFileSync(join(dir, file), "utf8");
    const keys = [...html.matchAll(/{%- when '([^']+)' -%}/g)].map((m) => m[1]);
    const sorted = [...keys].sort();

    for (let j = 0; j < keys.length; j++) {
      assert.equal(keys[j], sorted[j], `In _includes/i18n/${file}, UI strings are out of order. Found '${keys[j]}' but expected '${sorted[j]}'`);
    }
  }
});

// A test keeps properties in every file under schema/ and the keys in every _includes/i18n/<lang>.html in alphabetical order; generated references follow that order.
// And navigation data
function findNavFiles(dir, fileList = []) {
  const files = readdirSync(dir);
  for (const file of files) {
    const filePath = join(dir, file);
    if (statSync(filePath).isDirectory()) {
       // `.tmp/` is gitignored scratch (check output, build fixtures, workflow worktrees), not the repository.
       if (!filePath.includes('node_modules') && !filePath.includes('.git') && filePath !== join(root, '.tmp')) {
          findNavFiles(filePath, fileList);
       }
    } else if (file === "navigation.yml" && filePath.includes('_data')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

test("navigation data is sorted alphabetically by root keys", () => {
  const navFiles = findNavFiles(root);
  for (const file of navFiles) {
    const content = readFileSync(file, "utf8");
    const doc = parseDocument(content);
    if (doc.contents && doc.contents.items) {
      const keys = doc.contents.items.map(item => item.key.value);
      const sorted = [...keys].sort();
      for (let i = 0; i < keys.length; i++) {
        assert.equal(keys[i], sorted[i], `In ${file.replace(root + "/", "")}, navigation keys are out of order. Found '${keys[i]}' but expected '${sorted[i]}'`);
      }
    }
  }
});
