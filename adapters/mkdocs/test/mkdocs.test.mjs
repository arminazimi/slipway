import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cpSync, mkdirSync, mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { doctor } from '../../../packages/doctor/src/doctor.mjs';
import { validateSourcemap } from '../../../tools/theme/sourcemap.mjs';

const adapter = fileURLToPath(new URL('..', import.meta.url));
const fixture = fileURLToPath(new URL('site', import.meta.url));

const skip = spawnSync('python3', ['-c', 'import mkdocs']).status === 0 ? false : 'install mkdocs to run this test';

test('mkdocs builds with slipway plugin', { skip }, async () => {
    const dir = mkdtempSync(join(tmpdir(), 'slipway-mkdocs-'));
    cpSync(fixture, dir, { recursive: true });
    cpSync(join(adapter, 'starter'), dir, { recursive: true });

    // MkDocs finds plugins through entry points, so register the local one with a minimal dist-info
    // next to the source instead of pip-installing the adapter.
    const plugins = mkdtempSync(join(tmpdir(), 'slipway-mkdocs-plugin-'));
    cpSync(join(adapter, 'src', 'slipway_mkdocs.py'), join(plugins, 'slipway_mkdocs.py'));
    const info = join(plugins, 'slipway_mkdocs-0.0.0.dist-info');
    mkdirSync(info);
    writeFileSync(join(info, 'METADATA'), 'Metadata-Version: 2.1\nName: slipway-mkdocs\nVersion: 0.0.0\n');
    writeFileSync(join(info, 'entry_points.txt'), '[mkdocs.plugins]\nslipway = slipway_mkdocs:SlipwayPlugin\n');
    const env = { ...process.env, PYTHONPATH: plugins };
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
    rmSync(plugins, { recursive: true, force: true });
});
