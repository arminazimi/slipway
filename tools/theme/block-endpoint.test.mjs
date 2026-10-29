import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("endpoint block renders correctly", { skip }, () => {
  const outDir = join(root, ".tmp/block-endpoint-out");
  const testSite = join(root, ".tmp/block-endpoint-site");

  mkdirSync(testSite, { recursive: true });
  writeFileSync(join(testSite, "_config.yml"), "theme: slipway-theme\n");

  const pageContent = `---
layout: default
method: POST
path: /api/test
parameters:
  - name: p1
    type: string
    description: desc1
    required: true
request: '{"req": "val"}'
response: '{"res": "val"}'
---
{% include blocks/endpoint.html method=page.method path=page.path parameters=page.parameters request=page.request response=page.response %}`;

  writeFileSync(join(testSite, "index.md"), pageContent);
  mkdirSync(join(testSite, "_layouts"), { recursive: true });

  const layoutContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Test</title>
  {% include component-css.html name="endpoint" %}
</head>
<body>
  {{ content }}
</body>
</html>
  `;
  writeFileSync(join(testSite, "_layouts", "default.html"), layoutContent);

  mkdirSync(join(testSite, "_data", "i18n"), { recursive: true });
  writeFileSync(
    join(testSite, "_data", "i18n", "en.yml"),
    "description: Description\nexample_request: Example request\nexample_response: Example response\nname: Name\nparameters: Parameters\nrequired: Required\ntype: Type\n"
  );

  buildExample("template", outDir, testSite);

  const html = readFileSync(join(outDir, "index.html"), "utf8");

  // Check CSS is included
  assert.ok(html.includes('<link rel="stylesheet" href="/assets/css/components/endpoint.css">'), "Should link the endpoint component CSS");

  // Check header
  assert.ok(html.includes('<div class="sl-endpoint-header" dir="ltr">'), "Should render the header with LTR direction");
  assert.ok(html.includes('<span class="sl-endpoint-method sl-endpoint-method-post">POST</span>'), "Should render the method");
  assert.ok(html.includes('<code class="sl-endpoint-path">/api/test</code>'), "Should render the path");

  // Check parameters
  assert.ok(html.includes('<div class="sl-endpoint-parameters">'), "Should render parameters container");
  assert.ok(html.includes('<th>Name</th>'), "Should render name heading");
  assert.ok(html.includes('<code>p1</code>'), "Should render parameter name");
  assert.ok(html.includes('<span class="sl-endpoint-param-required">Required</span>'), "Should render required label");
  assert.ok(html.includes('<code>string</code>'), "Should render parameter type");
  assert.ok(html.includes('<td class="sl-endpoint-param-description"><p>desc1</p>'), "Should render parameter description as markdown");

  // Check request
  assert.ok(html.includes('<div class="sl-endpoint-request">'), "Should render request container");
  assert.ok(html.includes('<h2>Example request</h2>'), "Should render request heading");
  assert.ok(html.includes('<code>{&quot;req&quot;: &quot;val&quot;}</code>'), "Should render escaped request");

  // Check response
  assert.ok(html.includes('<div class="sl-endpoint-response">'), "Should render response container");
  assert.ok(html.includes('<h2>Example response</h2>'), "Should render response heading");
  assert.ok(html.includes('<code>{&quot;res&quot;: &quot;val&quot;}</code>'), "Should render escaped response");
});
