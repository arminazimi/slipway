import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, rmSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { buildExample, target, bundleAvailable } from "./build.mjs";

test("baseurl and url resolution", { skip: bundleAvailable() ? false : "bundle not available" }, (t) => {
  const baseurl = "/slipway";
  const docOut = "_site/docs_baseurl";
  const blogOut = "_site/blog_baseurl";
  const customOut = "_site/custom_domain";

  try {
    const noGithubConfig = join("_site", "no_github_config.yml");
    mkdirSync("_site", { recursive: true });
    writeFileSync(noGithubConfig, "github: {}\n");
    buildExample("gem", docOut, "docs", { baseurl, configs: [noGithubConfig] });
    buildExample("gem", blogOut, "blog", { baseurl, configs: [noGithubConfig] });

    // For the custom domain case
    // We will test custom domain config by creating a temporary config overlay
    const customDomainConfig = join("_site", "custom_domain_config.yml");
    writeFileSync(customDomainConfig, "url: https://example.org\ngithub: {}\n");
    buildExample("gem", customOut, "blog", { baseurl: "", configs: [customDomainConfig] });

    // Check generated files for hardcoded root URLs
    const checkFile = (file) => {
      const content = readFileSync(file, "utf8");
      // Find href="/..." but not href="//..."
      const hrefMatches = content.match(/href="\/(?!\/)[^"]*"/g) || [];
      for (const match of hrefMatches) {
        assert.ok(match.startsWith(`href="${baseurl}/`), `Failed in ${file}: ${match} does not start with ${baseurl}`);
      }

      const srcMatches = content.match(/src="\/(?!\/)[^"]*"/g) || [];
      for (const match of srcMatches) {
        assert.ok(match.startsWith(`src="${baseurl}/`), `Failed in ${file}: ${match} does not start with ${baseurl}`);
      }

      const srcsetMatches = content.match(/srcset="\/(?!\/)[^"]*"/g) || [];
      for (const match of srcsetMatches) {
        assert.ok(match.startsWith(`srcset="${baseurl}/`), `Failed in ${file}: ${match} does not start with ${baseurl}`);
      }
    };

    // Gather some representative HTML files
    const docFiles = ["index.html", "guide/index.html", "404.html"].map(p => join(docOut, p));
    const blogFiles = ["index.html", "about.html", "404.html", "2026/10/20/why-plain-markdown.html", "tags/index.html"].map(p => join(blogOut, p));

    for (const file of [...docFiles, ...blogFiles]) {
      if (existsSync(file)) {
        checkFile(file);
      } else {
        console.warn(`File not found: ${file}`);
      }
    }

    // Check feed.xml, sitemap.xml, search.json
    const checkXmlJson = (file, fileBaseurl, urlPrefix) => {
      const content = readFileSync(file, "utf8");
      // Find any relative URL that starts with /
      const urlMatches = content.match(/"\/[a-zA-Z0-9][^"]*"/g) || [];
      for (const match of urlMatches) {
        if (!match.includes('http://') && !match.includes('https://') && !match.includes('www.w3.org')) {
           assert.ok(match.startsWith(`"${fileBaseurl}/`), `Failed in ${file}: ${match} does not start with ${fileBaseurl}`);
        }
      }

      // Specifically check absolute URL matches
      if (file.endsWith(".xml")) {
        const absoluteMatches = content.match(/>http[s]?:\/\/[^<]+</g) || [];
        for (const match of absoluteMatches) {
          if (!match.includes('www.w3.org')) {
            assert.ok(match.startsWith(`>${urlPrefix}`), `Failed in ${file}: ${match} does not start with ${urlPrefix}`);
          }
        }
      } else if (file.endsWith(".json")) {
        const absoluteMatches = content.match(/"http[s]?:\/\/[^"]+"/g) || [];
        for (const match of absoluteMatches) {
          if (!match.includes('www.w3.org') && !match.includes('schema.org')) {
            assert.ok(match.startsWith(`"${urlPrefix}`), `Failed in ${file}: ${match} does not start with ${urlPrefix}`);
          }
        }
      }
    };

    checkXmlJson(join(blogOut, "feed.xml"), baseurl, "http://localhost:4000/slipway/");
    checkXmlJson(join(blogOut, "sitemap.xml"), baseurl, "http://localhost:4000/slipway/");
    checkXmlJson(join(blogOut, "search.json"), baseurl, "http://localhost:4000/slipway/");

    // Check custom domain feed and sitemap
    checkXmlJson(join(customOut, "feed.xml"), "", "https://example.org/");
    checkXmlJson(join(customOut, "sitemap.xml"), "", "https://example.org/");

  } finally {
    rmSync(docOut, { recursive: true, force: true });
    rmSync(blogOut, { recursive: true, force: true });
    rmSync(customOut, { recursive: true, force: true });
    rmSync("_site/custom_domain_config.yml", { force: true });
    rmSync("_site/no_github_config.yml", { force: true });
  }
});
