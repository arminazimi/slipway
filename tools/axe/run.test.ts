import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import type { Page } from "../../packages/engine/src/contracts/index.ts";
import { buildModel } from "../../packages/engine/src/model/build.ts";
import { builtSite } from "../fixture-build/build.ts";
import {
  audit,
  componentNames,
  COMPONENT_MARKERS,
  discover,
  FIXTURE,
  fileOf,
  layoutNames,
  layoutOf,
  linesFor,
  playwrightAuditor,
  report,
  root,
  THEMES,
  type Auditor,
  type Target,
  type Violation,
} from "./run.ts";

/** A temporary folder; every test that writes files uses one. */
function folder(t: { after: (fn: () => void) => void }, files: Record<string, string> = {}): string {
  const dir = mkdtempSync(join(tmpdir(), "axe-gate-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
  return dir;
}

/** A page in the model, with the fields the gate reads. */
function page(url: string, layout?: string): Page {
  return {
    url,
    source: { file: `${url.replace(/^\/|\/$/g, "") || "index"}.md`, line: 1, column: 1, endLine: 1, endColumn: 1 },
    frontMatter: layout === undefined ? {} : { layout },
    title: url,
    lang: "en",
    dir: "ltr",
    headings: [],
    html: "",
    markdown: "",
    kind: "doc",
  };
}

/** A violation with one node, so a failure has something to name. */
function violation(id: string): Violation {
  return {
    id,
    impact: "serious",
    help: `${id} help`,
    helpUrl: `https://example.com/${id}`,
    nodes: [{ target: ["main > img"], html: "<img>", failureSummary: `${id} failed` }],
  };
}

/** Runs a test with console output silenced, so a gate that reports a failure stays quiet in the test log. */
async function quiet<T>(fn: () => Promise<T> | T): Promise<T> {
  const [log, error] = [console.log, console.error];
  console.log = console.error = () => {};
  try {
    return await fn();
  } finally {
    console.log = log;
    console.error = error;
  }
}

test("reads the theme's layouts and components, leaving out the base shell", (t) => {
  const dir = folder(t, {
    "layouts/README.md": "# Layouts\n",
    "layouts/base.ts": "export default 1;\n",
    "layouts/doc.ts": "export default 1;\n",
    "layouts/home.ts": "export default 1;\n",
    "layouts/not-found.ts": "export default 1;\n",
    "layouts/doc.test.ts": "// not a layout\n",
    "components/callout/index.ts": "export default 1;\n",
    "components/code/index.ts": "export default 1;\n",
    "components/README.md": "# Components\n",
  });

  assert.deepEqual(layoutNames(join(dir, "layouts")), ["doc", "home", "not-found"]);
  assert.deepEqual(componentNames(join(dir, "components")), ["callout", "code"]);
});

test("maps a URL to the file a static host serves", () => {
  assert.equal(fileOf("/build", "/"), join("/build", "index.html"));
  assert.equal(fileOf("/build", "/guide/"), join("/build", "guide", "index.html"));
  assert.equal(fileOf("/build", "/404.html"), join("/build", "404.html"));
  assert.equal(fileOf("/build", "/guide/#anchor"), join("/build", "guide", "index.html"));
});

test("a page with no layout uses the engine's default", () => {
  assert.equal(layoutOf(page("/")), "doc");
  assert.equal(layoutOf(page("/404.html", "not-found")), "not-found");
});

test("picks one page per layout and one page per component, and reports the gaps", (t) => {
  const build = folder(t, {
    "index.html": '<main><div class="callout">Note</div><pre>code</pre></main>',
    "guide/index.html": '<main><span class="badge badge-tip">New</span></main>',
    "404.html": "<main>Not found</main>",
  });
  const theme = folder(t, {
    "layouts/base.ts": "export default 1;\n",
    "layouts/doc.ts": "export default 1;\n",
    "layouts/home.ts": "export default 1;\n",
    "layouts/not-found.ts": "export default 1;\n",
    "components/badge/index.ts": "export default 1;\n",
    "components/callout/index.ts": "export default 1;\n",
    "components/code/index.ts": "export default 1;\n",
    "components/table/index.ts": "export default 1;\n",
  });
  const pages = [page("/"), page("/guide/"), page("/404.html", "not-found")];

  const found = discover(build, pages, join(theme, "layouts"), join(theme, "components"));

  assert.deepEqual(found.targets, [
    { url: "/", names: ["component callout", "component code", "layout doc"] },
    { url: "/404.html", names: ["layout not-found"] },
    { url: "/guide/", names: ["component badge"] },
  ]);
  assert.deepEqual(found.gaps, ["component table", "layout home"]);
});

test("a component without a marker stops the gate instead of being skipped", (t) => {
  const build = folder(t, { "index.html": "<main></main>" });
  const theme = folder(t, {
    "layouts/doc.ts": "export default 1;\n",
    "components/callout/index.ts": "export default 1;\n",
    "components/new-thing/index.ts": "export default 1;\n",
  });

  assert.throws(
    () => discover(build, [page("/")], join(theme, "layouts"), join(theme, "components")),
    /no marker for component "new-thing"/,
  );
});

test("audits every page in every theme and names the failures", async () => {
  const targets: Target[] = [
    { url: "/good/", names: ["layout doc"] },
    { url: "/bad/", names: ["component callout"] },
  ];
  const seen: string[] = [];
  const auditor: Auditor = async (url, theme) => {
    seen.push(`${theme} ${url}`);
    return url === "/bad/" ? [violation("image-alt")] : [];
  };

  const result = await audit(targets, THEMES, auditor);

  assert.deepEqual(seen, ["light /good/", "light /bad/", "dark /good/", "dark /bad/"]);
  assert.equal(result.pages.length, 4);
  assert.equal(result.failures.length, 2);
  assert.deepEqual(result.failures.map((failure) => failure.theme), ["light", "dark"]);
  assert.equal(result.failures[0]!.target.url, "/bad/");
  assert.match(linesFor(result.failures[0]!)[0]!, /FAIL light \/bad\/ \(component callout\): 1 violation/);
  assert.match(linesFor(result.failures[0]!)[2]!, /main > img/);
});

test("the report fails on a violation and passes when every page is clean", async () => {
  const bad = await audit([{ url: "/bad/", names: ["layout doc"] }], ["light"], async () => [violation("image-alt")]);
  assert.equal(await quiet(() => report(bad, ["layout home"])), false);

  const clean = await audit([{ url: "/", names: ["layout doc"] }], THEMES, async () => []);
  assert.equal(await quiet(() => report(clean, ["layout home"])), true);
});

test("every component name has a marker, so a new component cannot slip through", () => {
  const names = componentNames(join(root, "packages/theme/components"));
  assert.ok(names.length > 0);
  assert.deepEqual(
    names.filter((name) => COMPONENT_MARKERS[name] === undefined),
    [],
  );
});

test("the gate passes fixtures/docs-site and fails a deliberately broken copy", async (t) => {
  const build = await builtSite(FIXTURE);
  const model = await buildModel(join(root, "fixtures", FIXTURE));
  const discovery = discover(build, model.site.pages, join(root, "packages/theme/layouts"), join(root, "packages/theme/components"));
  assert.ok(discovery.targets.length >= 4, `expected several pages to audit, found ${discovery.targets.length}`);

  const real = await playwrightAuditor(build);
  if ("skip" in real) {
    t.skip(real.skip);
    return;
  }

  try {
    const clean = await audit(discovery.targets, THEMES, real.auditor);
    assert.deepEqual(
      clean.failures.flatMap((failure) => linesFor(failure)),
      [],
      "the docs fixture passes axe in both themes",
    );
  } finally {
    await real.close();
  }

  // A copy with one image missing its alt text is the "deliberately broken fixture" the issue asks for.
  const copy = join(folder(t), "site");
  cpSync(build, copy, { recursive: true });
  const page = join(copy, "features", "index.html");
  const html = readFileSync(page, "utf8");
  const marker = '<main id="main" tabindex="-1">';
  assert.ok(html.includes(marker), "the features page has the main landmark");
  writeFileSync(page, html.replace(marker, `${marker}<img src="missing.png">`));

  const broken = await playwrightAuditor(copy);
  assert.ok(!("skip" in broken), "the same browser audits the broken copy");
  try {
    const result = await audit([{ url: "/features/", names: ["component callout"] }], ["light"], broken.auditor);
    assert.ok(result.failures.length > 0, "the gate fails the broken copy");
    assert.ok(
      result.failures[0]!.violations.some((found) => found.id === "image-alt"),
      `expected image-alt, got ${result.failures[0]!.violations.map((found) => found.id).join(", ")}`,
    );
  } finally {
    await broken.close();
  }
});
