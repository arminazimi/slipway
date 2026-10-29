import { test } from 'node:test';
import assert from 'node:assert';
import { pseudoLoc } from './run.mjs';

test('pseudoLoc unit test', () => {
  assert.strictEqual(pseudoLoc(''), '');
  assert.strictEqual(pseudoLoc('About the author'), 'Ábóút thé áúthórxxxxxx');
  assert.strictEqual(pseudoLoc('Part {n} of {total}'), 'Párt {n} óf {total}xxx');
});
