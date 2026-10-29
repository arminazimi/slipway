import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validateConfig } from './config.mjs';
import Ajv2020 from "ajv/dist/2020.js";
import { parse } from 'yaml';

const navSchema = JSON.parse(readFileSync(join('schema', 'navigation.schema.json'), 'utf8'));
const validateNav = new Ajv2020({ allErrors: true }).compile(navSchema);

test('recipe-versioned-docs code blocks', () => {
  const content = readFileSync(join('site', 'recipes', 'versioned-docs.md'), 'utf8');
  const codeBlocks = [...content.matchAll(/```yaml\n([\s\S]*?)```/g)];
  assert.ok(codeBlocks.length > 0, 'recipe should have at least one yaml block');

  for (const block of codeBlocks) {
    const yamlContent = block[1];
    let parsed;
    try {
      parsed = parse(yamlContent);
    } catch (err) {
      assert.fail(`Invalid YAML: ${err.message}\n${yamlContent}`);
    }

    if (parsed.slipway !== undefined) {
       const { ok, errors } = validateConfig(parsed);
       assert.ok(ok, `Config validation failed: ${errors.join(', ')}\n${yamlContent}`);
    } else {
       const ok = validateNav(parsed);
       const errors = (validateNav.errors ?? []).map((e) => `${e.instancePath || "/"} ${e.message}`);
       assert.ok(ok, `Navigation config validation failed: ${errors.join(', ')}\n${yamlContent}`);
    }
  }
});
