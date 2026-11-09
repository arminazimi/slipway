import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

test('Claude plugin is valid', () => {
  assert.ok(existsSync('plugins/claude/slipway/.claude-plugin/plugin.json'));

  const manifest = JSON.parse(readFileSync('plugins/claude/slipway/.claude-plugin/plugin.json', 'utf-8'));
  assert.equal(manifest.name, 'slipway');
  assert.equal(manifest.skills.length, 3);
  assert.ok(manifest.mcpServers.slipway);

  // Verify paths resolve
  assert.ok(existsSync(join('plugins/claude/slipway/.claude-plugin', manifest.skills[0])));
  assert.ok(existsSync(join('plugins/claude/slipway/.claude-plugin', manifest.mcpServers.slipway.args[0])));
});

test('Codex plugin is valid', () => {
  assert.ok(existsSync('plugins/codex/slipway/plugin.toml'));

  const toml = readFileSync('plugins/codex/slipway/plugin.toml', 'utf-8');
  assert.match(toml, /name = "slipway"/);
  assert.match(toml, /slipway-site/);
  assert.match(toml, /slipway-content/);
  assert.match(toml, /slipway-doctor/);
  assert.match(toml, /slipway-mcp.mjs/);

  // verify paths resolve
  const m = toml.match(/path = "(.*?)"/);
  assert.ok(m);
  assert.ok(existsSync(join('plugins/codex/slipway', m[1])));
});
