import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(import.meta.url), "../../..");

const docsSite = join(root, "spec/docs-site");
const specSrcDir = join(root, "spec/agent-editable");
const specDestDir = join(docsSite, "0.1");
const schemaDir = join(root, "schema");

export function buildSpecSite() {
  if (!existsSync(docsSite)) mkdirSync(docsSite, { recursive: true });
  if (!existsSync(specDestDir)) mkdirSync(specDestDir, { recursive: true });

  const mdFiles = readdirSync(specSrcDir).filter(f => f.endsWith('.md'));
  for (const file of mdFiles) {
    let content = readFileSync(join(specSrcDir, file), "utf8");

    // Fix broken links to schema files.
    content = content.replace(/\.\.\/\.\.\/schema\//g, "");

    if (!content.startsWith("---")) {
       const title = file.replace('.md', '');
       content = `---\nlayout: doc\ntitle: ${title}\n---\n${content}`;
    } else {
       if (!/^layout:\s/m.test(content)) {
           content = content.replace(/^---/, "---\nlayout: doc");
       }
    }
    writeFileSync(join(specDestDir, file), content);
  }

  // Copy tests.json as well
  if (existsSync(join(specSrcDir, "tests.json"))) {
    writeFileSync(join(specDestDir, "tests.json"), readFileSync(join(specSrcDir, "tests.json"), "utf8"));
  }

  const schemaFiles = readdirSync(schemaDir).filter(f => f.endsWith('.schema.json'));
  for (const file of schemaFiles) {
    const srcPath = join(schemaDir, file);
    let schemaJson = JSON.parse(readFileSync(srcPath, "utf8"));
    schemaJson.$id = `https://arminazimi.github.io/slipway/spec/0.1/${file}`;
    writeFileSync(join(specDestDir, file), JSON.stringify(schemaJson, null, 2) + "\n");
  }

  const latestDir = join(docsSite, "latest");
  if (!existsSync(latestDir)) mkdirSync(latestDir, { recursive: true });
  writeFileSync(join(latestDir, "index.md"), "---\nlayout: doc\nredirect_to: /spec/0.1/\n---\n");

  const adapters = readFileSync(join(root, "spec/adapters.md"), "utf8");
  writeFileSync(join(docsSite, "adapters.md"), `---\ntitle: Adapters\ndescription: The generators with a Slipway adapter, and how to add one.\nlayout: doc\n---\n\n${adapters}`);

  writeFileSync(join(docsSite, "_config.yml"), "title: Slipway Spec\ndescription: The Slipway specification for agent-editable sites.\ntheme: slipway-theme\nplugins:\n  - jekyll-remote-theme\n");
  writeFileSync(join(docsSite, "index.md"), "---\ntitle: The Spec\ndescription: The agent-editable site spec.\nlayout: doc\n---\n\nSlipway follows an open spec for agent-editable sites. See the spec for more details on how agents can read and edit your site reliably. (To be expanded in a future task.)\n\nThe [adapter list](adapters.html) covers the generators that implement the spec, and how to add one.\n");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildSpecSite();
}
