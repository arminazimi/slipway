import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { bundleAvailable } from './build.mjs';
import { spawnSync } from 'node:child_process';

const siteDir = 'site';
const outDir = join('.tmp', 'docs-autonav');

test('autonav listing in guides and recipes', { skip: bundleAvailable() ? false : 'bundle not available' }, () => {
  rmSync(outDir, { recursive: true, force: true });
  const result = spawnSync('bundle', ['exec', 'jekyll', 'build', '-s', siteDir, '-d', outDir]);
  assert.equal(result.status, 0, `jekyll build failed:\n${result.stdout}\n${result.stderr}`);

  const recipesHtml = readFileSync(join(outDir, 'recipes', 'index.html'), 'utf8');
  assert.ok(recipesHtml.includes('href="/recipes/analytics/"'), 'analytics recipe should be listed');
  assert.ok(recipesHtml.includes('href="/recipes/cloudflare-pages/"'), 'cloudflare pages recipe should be listed');

  const guidesHtml = readFileSync(join(outDir, 'guides', 'index.html'), 'utf8');
  assert.ok(guidesHtml.includes('href="/guides/migration/"'), 'migration guide should be listed');
});
