import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

test('runtimes page matches repository versions', async () => {
    const runtimesMd = await fs.readFile('docs/runtimes.md', 'utf8');

    const rubyVersion = (await fs.readFile('.ruby-version', 'utf8')).trim();
    assert.match(runtimesMd, new RegExp(`Ruby:.*${rubyVersion.replace('.', '\\.')}`));

    const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
    const nodeEngine = packageJson.engines.node.replace('>=', '');
    assert.match(runtimesMd, new RegExp(`Node:.*${nodeEngine.replace('.', '\\.')}`));

    const ciYml = await fs.readFile('.github/workflows/ci.yml', 'utf8');
    const ciNodeMatch = ciYml.match(/node-version:\s*(\d+)/);
    if (ciNodeMatch) {
        assert.match(runtimesMd, new RegExp(`Node:.*${ciNodeMatch[1]}`));
    }

    const gemfileLock = await fs.readFile('Gemfile.lock', 'utf8');
    const jekyllMatch = gemfileLock.match(/jekyll\s*\(([\d.]+)\)/);
    if (jekyllMatch) {
         assert.match(runtimesMd, new RegExp(`Jekyll:.*${jekyllMatch[1].replace('.', '\\.')}`));
    }

    const pagesMatch = gemfileLock.match(/github-pages\s*\(([\d.]+)\)/);
    if (pagesMatch) {
         assert.match(runtimesMd, new RegExp(`github-pages:.*${pagesMatch[1].replace('.', '\\.')}`));
    }
});
