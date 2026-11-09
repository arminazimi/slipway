import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { CONFIG_FILE } from "../src/config/load.ts";
import type { Page, Site } from "../src/contracts/index.ts";
import { agentsMd } from "../src/outputs/agents-md.ts";
import { buildModel } from "../src/model/build.ts";

const pos = { file: "guide/install.md", line: 1, column: 1, endLine: 1, endColumn: 1 };

function site(overrides: Partial<Site["config"]> = {}, pages: readonly Page[] = [], nav: Site["nav"] = {}): Site {
  return {
    config: {
      title: "Example",
      base: "",
      lang: "en",
      dir: "ltr",
      languages: [],
      source: ".",
      include: [],
      exclude: [],
      navigation: "_data/navigation.yml",
      defaults: [],
      theme: { options: {} },
      search: {},
      redirects: {},
      outputs: {},
      ...overrides,
    },
    pages,
    nav,
    data: {},
  };
}

function page(url: string, file = "guide/install.md", kind: Page["kind"] = "doc"): Page {
  return {
    url,
    source: { ...pos, file },
    frontMatter: {},
    title: url,
    lang: "en",
    dir: "ltr",
    headings: [],
    html: "",
    markdown: "",
    kind,
  };
}

async function run(model: Site): Promise<readonly { path: string; contents: string | Uint8Array }[]> {
  return agentsMd.run(model, { renderPage: async () => "", report: () => {} });
}

test("the output is named after its file", () => {
  assert.equal(agentsMd.name, "agents-md");
});

test("fixtures/docs-site writes one AGENTS.md at the output root, built from its config and model", async () => {
  const root = fileURLToPath(new URL("../../../fixtures/docs-site", import.meta.url));
  const { site: model } = await buildModel(root);
  const files = await run(model);

  assert.deepEqual(files.map((f) => f.path), ["AGENTS.md"]);
  const text = String(files[0]?.contents);
  assert.ok(text.startsWith("# AGENTS.md\n"), "the file starts with its heading");
  assert.ok(text.includes(`**${model.config.title}**`), "the site title comes from the model's config");
  assert.ok(text.includes(`- Title: ${model.config.title}`), "the title line comes from the model's config");
  assert.ok(text.includes(`\`${CONFIG_FILE}\``), "the config file name comes from the engine");
  assert.ok(text.includes("`docs`"), "the navigation list names come from the model");
  assert.ok(text.includes("`/guide/install/`"), "the example URL follows the pretty URL rule");
  const docs = model.pages.filter((p) => p.kind === "doc").length;
  const apps = model.pages.filter((p) => p.kind === "app").length;
  assert.ok(text.includes(`${docs} rendered from Markdown or HTML, and ${apps} app page`), "page counts come from the model");
  assert.ok(text.includes("## How to add a page"));
  assert.ok(text.includes("## How to check a change"));
  assert.ok(text.includes("## Generated files"));
});

test("two builds of the same site write the same bytes", async () => {
  const root = fileURLToPath(new URL("../../../fixtures/docs-site", import.meta.url));
  const first = await run((await buildModel(root)).site);
  const second = await run((await buildModel(root)).site);
  assert.deepEqual(first, second);
});

test("the base path and the repository show up in the file, and an empty base says so", async () => {
  const withBase = await run(
    site({ base: "/evergreen", repository: { url: "https://github.com/example/docs", branch: "trunk", dir: "site" } }),
  );
  const text = String(withBase[0]?.contents);
  assert.ok(text.includes("- Base path: `/evergreen`"));
  assert.ok(text.includes("`/evergreen/guide/new-page/`"));
  assert.ok(text.includes("https://github.com/example/docs, branch `trunk`, folder `site`"));

  const bare = String(((await run(site()))[0])?.contents);
  assert.ok(bare.includes("- Base path: none, the site is at the domain root"));
  assert.ok(bare.includes("- Edit links: none; no repository is set."));
  assert.ok(bare.includes("- URL: not set"));
  assert.ok(bare.includes("- Languages: only the default language"));
});

test("languages are listed in switcher order with their prefixes", async () => {
  const text = String(
    ((await run(
      site({
        languages: [
          { code: "en", name: "English", prefix: "" },
          { code: "fa", name: "Persian", prefix: "/fa" },
        ],
      }),
    ))[0])?.contents,
  );
  assert.ok(text.includes("- Languages, in switcher order:"));
  assert.ok(text.includes("  - English (`en`): the default language, no URL prefix"));
  assert.ok(text.includes("  - Persian (`fa`): URL prefix `/fa`"));
});

test("a site's own AGENTS.md in the source wins, so nothing is written", async () => {
  assert.deepEqual(await run(site({}, [page("/AGENTS/", "AGENTS.md")])), []);
});

test("the source folder decides where the site's own AGENTS.md lives", async () => {
  const owned = site({ source: "docs" }, [page("/AGENTS/", "docs/AGENTS.md")]);
  assert.deepEqual(await run(owned), []);

  const other = site({ source: "docs" }, [page("/guide/install/", "docs/guide/install.md")]);
  assert.equal((await run(other)).length, 1);
});

test("a page whose permalink is the site's /AGENTS.md wins as well, under the base", async () => {
  assert.deepEqual(await run(site({ base: "/evergreen" }, [page("/evergreen/AGENTS.md", "notes.md")])), []);
  assert.equal((await run(site({ base: "/evergreen" }, [page("/evergreen/AGENTS/", "AGENTS-old.md")]))).length, 1);
});
