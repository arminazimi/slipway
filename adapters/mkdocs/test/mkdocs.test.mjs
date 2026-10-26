import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cpSync, mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { doctor } from '../../../packages/doctor/src/doctor.mjs';
import { validateSourcemap } from '../../../tools/theme/sourcemap.mjs';

const adapter = fileURLToPath(new URL('..', import.meta.url));
const fixture = fileURLToPath(new URL('site', import.meta.url));

test('mkdocs builds with slipway plugin', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'slipway-mkdocs-'));
    cpSync(fixture, dir, { recursive: true });
    cpSync(join(adapter, 'starter'), dir, { recursive: true });

    // Install the local plugin in current python env if not already installed,
    // or rely on PYTHONPATH=adapters/mkdocs/src
    const env = { ...process.env, PYTHONPATH: join(adapter, 'src') };
    const result = spawnSync('mkdocs', ['build', '-f', join(dir, 'mkdocs.yml')], { env, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr + result.stdout);

    // Check sourcemap
    const mapFile = join(dir, 'site', 'sourcemap.json');
    assert.ok(existsSync(mapFile), 'sourcemap.json created');

    const map = JSON.parse(readFileSync(mapFile, 'utf8'));
    assert.deepEqual(validateSourcemap(map), { ok: true, errors: [] });

    // Check twin
    const twinFile = join(dir, 'site', 'index.md');
    assert.ok(existsSync(twinFile), 'index.md created');
    const twin = readFileSync(twinFile, 'utf8');
    assert.match(twin, /# Hello World/);

    // Check HTML
    const html = readFileSync(join(dir, 'site', 'index.html'), 'utf8');
    assert.match(html, /<link href="\/index.md" rel="alternate" type="text\/markdown"\/>/);
    assert.match(html, /<h1 data-source="docs\/index.md:4" id="hello-world">/); // fixed from :1 to :4 due to front matter offset and title logic

    const report = await doctor(dir, { build: join(dir, 'site') });
    const l3 = new Set(report.tests.filter((r) => r.level === "L3").map((r) => r.id));
    assert.deepEqual(report.findings.filter((f) => f.severity === "error" && !l3.has(f.id)), []);
    assert.equal(report.generator, "mkdocs");
    assert.equal(report.level, "L2");

    rmSync(dir, { recursive: true, force: true });
});
