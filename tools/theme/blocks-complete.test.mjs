import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { root } from "./tokens.mjs";

const includesDir = join(root, "_includes/blocks");
const names = readdirSync(includesDir)
  .filter((file) => file.endsWith(".html"))
  .map((file) => file.replace(/\.html$/, ""))
  .sort();

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const includeRegex = (template, name) =>
  new RegExp(`\\{%-?\\s*include\\s+${escapeRegExp(template)}/${escapeRegExp(name)}\\.html`);
const componentCssRegex = (name) =>
  new RegExp(`\\{%-?\\s*include\\s+component-css\\.html\\s+name=["']${escapeRegExp(name)}["']`);
const componentCssNames = (source) =>
  [...source.matchAll(/\{%-?\s*include\s+component-css\.html\s+name=["']([^"']+)["']/g)].map((match) => match[1]);

test("the completeness check discovers blocks on disk", () => {
  assert.ok(names.length > 0, `No blocks found in _includes/blocks (looked in ${includesDir})`);
});

for (const name of names) {
  test(`block "${name}" is complete`, () => {
    const problems = [];

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
      problems.push(`_includes/blocks/${name}.html: the block name must be kebab-case`);
    }

    const includePath = join(includesDir, `${name}.html`);
    const include = readFileSync(includePath, "utf8");

    const docsFile = `site/blocks/${name}.md`;
    const docsPath = join(root, docsFile);
    const docs = existsSync(docsPath) ? readFileSync(docsPath, "utf8") : null;
    if (docs === null) {
      problems.push(`${docsFile} is missing; add a documentation page`);
    } else if (!includeRegex("blocks", name).test(docs)) {
      problems.push(`${docsFile} does not use the block; add {% include blocks/${name}.html ... %}`);
    }

    const indexFile = "site/blocks/index.md";
    const indexPath = join(root, indexFile);
    const index = existsSync(indexPath) ? readFileSync(indexPath, "utf8") : null;
    if (index === null) {
      problems.push(`${indexFile} is missing; add the block reference page`);
    } else if (!includeRegex("blocks", name).test(index)) {
      problems.push(`${indexFile} does not list the block; add a copyable {% include blocks/${name}.html ... %} snippet`);
    }

    const testFile = `tools/theme/block-${name}.test.mjs`;
    const testPath = join(root, testFile);
    const testSource = existsSync(testPath) ? readFileSync(testPath, "utf8") : null;
    if (testSource === null) {
      problems.push(`${testFile} is missing; add a test that builds the block`);
    } else if (!includeRegex("blocks", name).test(testSource)) {
      problems.push(`${testFile} does not exercise the block; include blocks/${name}.html in its fixture`);
    }

    const linkedNames = componentCssNames(include);
    for (const linked of linkedNames) {
      if (linked !== name) {
        problems.push(
          `_includes/blocks/${name}.html links component-css.html name="${linked}"; a block may only link its own stylesheet`,
        );
      }
      const stylesheet = `assets/css/components/${linked}.css`;
      if (!existsSync(join(root, stylesheet))) {
        problems.push(`_includes/blocks/${name}.html links ${stylesheet}, but that file does not exist`);
      }
    }

    const stylesheet = `assets/css/components/${name}.css`;
    if (existsSync(join(root, stylesheet))) {
      const linked =
        linkedNames.includes(name) ||
        (docs !== null && componentCssRegex(name).test(docs)) ||
        (testSource !== null && componentCssRegex(name).test(testSource));
      if (!linked) {
        problems.push(
          `${stylesheet} exists but nothing links it; add {% include component-css.html name="${name}" %} to the include or documentation page`,
        );
      }
    }

    if (problems.length > 0) {
      assert.fail(`block "${name}" is incomplete:\n  - ${problems.join("\n  - ")}`);
    }
  });
}
