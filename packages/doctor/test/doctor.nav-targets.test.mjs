import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { run } from "../src/checks/doctor.nav-targets.mjs";
import { Site } from "../src/site.mjs";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));
const repo = here("../../../");
const fixture = (name) => here(`fixtures/${name}`);

test("doctor.nav-targets fires on broken url", async () => {
  const site = new Site(fixture("doctor.nav-targets"), { build: join(fixture("doctor.nav-targets"), "build") });
  const { status, findings } = await run(site);
  assert.equal(status, "fail");
  assert.equal(findings.length, 1);
  assert.equal(findings[0].file, "_data/navigation.yml");
  assert.equal(findings[0].line, 5); // url: /broken.html
});

test("doctor.nav-targets is silent on examples", async () => {
  for (const name of ["bare", "minimal", "docs", "blog", "persian"]) {
    const siteDir = join(repo, "examples", name);
    const site = new Site(siteDir, { build: siteDir }); // The build directory is omitted or just mock
    site.sourcemap = () => {
       const parsed = site.dataOf("_data/navigation.yml");
       if (!parsed || !parsed.data) return { data: { pages: [] } };
       const pages = [];
       const walk = (obj) => {
          if (Array.isArray(obj)) obj.forEach(walk);
          else if (obj && typeof obj === 'object') {
             if (obj.url) pages.push({ url: obj.url });
             Object.values(obj).forEach(walk);
          }
       };
       walk(parsed.data);
       return { data: { pages } };
    };
    const { status, findings } = await run(site);
    assert.equal(status, "pass");
    assert.deepEqual(findings, []);
  }
});
