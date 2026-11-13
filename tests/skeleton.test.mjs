import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = p => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'));

test('plugin manifest names the plugin ux', () => {
  const m = read('.claude-plugin/plugin.json');
  assert.equal(m.name, 'ux');
  assert.match(m.version, /^2\./);
  assert.ok(m.description.length > 20);
});

test('marketplace lists ux from the repository root', () => {
  const m = read('.claude-plugin/marketplace.json');
  assert.equal(m.name, 'ux-runbook');
  assert.deepEqual(m.plugins.map(p => [p.name, p.source]), [['ux', './']]);
});

test('package runs on node 20 with one dependency', () => {
  const p = read('package.json');
  assert.equal(p.type, 'module');
  assert.deepEqual(Object.keys(p.dependencies), ['playwright-core']);
  assert.equal(p.scripts.test, 'node --test tests/');
});
