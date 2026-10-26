import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

const read = (path) => readFileSync(join(root, path), "utf8");
const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

/** The parsed JSON-LD blocks of an HTML page; throws when one is not valid JSON. */
export function jsonLd(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
}

function htmlPages(dir) {
  return readdirSync(dir, { recursive: true }).filter((p) => p.endsWith(".html") && !p.startsWith("assets"));
}

test("the head includes the JSON-LD, built in plain Liquid with every value escaped", () => {
  assert.match(read("_includes/head.html"), /\{%- include jsonld\.html %\}/);
  const include = read("_includes/jsonld.html");
  assert.doesNotMatch(include, /seo_tag|jekyll-seo/);
  assert.match(include, /replace: '<', '\\u003c'/, "a value with </script> must not end the element");
  for (const [layout, type] of [["home", "WebSite"], ["post", "BlogPosting"], ["doc", "TechArticle"], ["archive", "CollectionPage"]]) {
    assert.match(include, new RegExp(`'${layout}'.*'${type}'`));
  }
});

test("the checker reads JSON-LD and rejects broken JSON", () => {
  assert.deepEqual(jsonLd('<script type="application/ld+json">{"a":"\\u003c/script>"}</script>'), [{ a: "</script>" }]);
  assert.throws(() => jsonLd('<script type="application/ld+json">{"a":}</script>'));
});

test("every page of every example has valid JSON-LD of its layout's type, and the 404 page has none", { skip }, () => {
  for (const name of ["minimal", "blog", "docs", "persian", "bare"]) {
    const out = buildExample("gem", join(root, `.tmp-jsonld-${name}`), name);
    for (const page of htmlPages(out)) {
      const blocks = jsonLd(readFileSync(join(out, page), "utf8"));
      if (page === "404.html") {
        assert.equal(blocks.length, 0, `${name}/${page}`);
        continue;
      }
      assert.ok(blocks.length >= 1, `${name}/${page}`);
      const ld = blocks[0]["@graph"] ? blocks[0]["@graph"].find(b => b["@type"] !== "BreadcrumbList") : blocks[0];
      assert.equal(ld["@context"], "https://schema.org", `${name}/${page}`);
      assert.match(ld.url, /^https?:\/\//, `${name}/${page}`);
      assert.ok(ld.inLanguage, `${name}/${page}`);
      assert.ok(ld.name || ld.headline, `${name}/${page}`);
      if (ld["@type"] !== "WebSite") assert.equal(ld.isPartOf["@type"], "WebSite", `${name}/${page}`);
    }
    if (name !== "minimal") continue;
    const get = (p) => { const b = jsonLd(readFileSync(join(out, p), "utf8"))[0]; return b["@graph"] ? b["@graph"].find(x => x["@type"] !== "BreadcrumbList") : b; };
    assert.equal(get("home.html")["@type"], "WebSite");
    const post = get("2026/10/18/hello-world.html");
    assert.equal(post["@type"], "BlogPosting");
    assert.equal(post.headline, "Hello world");
    assert.match(post.datePublished, /^2026-10-18T/);
    assert.deepEqual(post.keywords, ["slipway", "notes"]);
    assert.match(post.url, /\/2026\/10\/18\/hello-world\.html$/);
    assert.equal(get("docs/layouts/index.html")["@type"], "TechArticle");
    assert.equal(get("archive/index.html")["@type"], "CollectionPage");
    assert.equal(get("about.html")["@type"], "WebPage");
    assert.equal(get("fa/post-1/index.html").inLanguage, "fa");
    assert.equal(get("de/index.html").inLanguage, "de");
  }
});
