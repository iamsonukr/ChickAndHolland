const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const data = fs.readFileSync(path.join(__dirname, '../lib/data.ts'), 'utf8');
function loadLookup(name, fetch) {
  const start = data.indexOf(`export const ${name} =`);
  const source = data.slice(start, data.indexOf('\n};', start) + 3);
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const exports = {};
  new Function('exports', 'fetch', 'API_URL', 'cookies', js)(
    exports, fetch, 'https://example.test', async () => ({ get: () => ({ value: 'token' }) }),
  );
  return exports[name];
}

test('style search and lookup preserve URL-sensitive characters', async () => {
  const code = 'AR/12#3 &?';
  let url;
  const lookup = loadLookup('getProductDetailsByProductCode', async value => {
    url = value;
    return { ok: true, json: async () => ({ id: 1, productCode: code }) };
  });
  assert.equal((await lookup(code)).id, 1);
  assert.equal(url, `https://example.test/products/product-code/${encodeURIComponent(code)}`);
  const search = loadLookup('searchStyleNumbers', async value => {
    url = value;
    return { ok: true, json: async () => ({ success: true, products: [] }) };
  });
  await search(code);
  assert.equal(new URL(url).searchParams.get('query'), code);
});

test('lookup rejects HTTP errors and malformed product payloads', async () => {
  for (const [ok, body] of [[false, { message: 'Missing' }], [true, {}], [true, { id: 1, success: false }]]) {
    const lookup = loadLookup('getProductDetailsByProductCode', async () => ({ ok, json: async () => body }));
    await assert.rejects(lookup('AR1'));
  }
});

test('search rejects HTTP errors and malformed result payloads', async () => {
  for (const [ok, body] of [[false, { products: [] }], [true, {}], [true, { success: false, products: [] }]]) {
    const search = loadLookup('searchStyleNumbers', async () => ({ ok, json: async () => body }));
    await assert.rejects(search('AR1'));
  }
});

const selector = fs.readFileSync(path.join(__dirname, '../components/custom/multi-selector.tsx'), 'utf8');
const effectStart = selector.indexOf('let cancelled = false;');
assert.ok(effectStart >= 0);
const effectBody = selector.slice(effectStart, selector.indexOf('// eslint-disable-next-line', effectStart));
const runSearch = new Function('onSearch', 'open', 'debouncedSearchTerm', 'triggerSearchOnFocus', 'groupBy',
  'setOptions', 'setIsLoading', 'setSearchFailed', 'transToGroupOption', 'console', effectBody);
const flush = () => new Promise(resolve => setImmediate(resolve));
function startSearch(search, state) {
  return runSearch(search, true, 'AR1', false, undefined,
    value => { state.options = value; }, value => { state.loading = value; },
    value => { state.failed = value; }, value => value, { error() {} });
}

test('failed search exits loading and a subsequent search recovers', async () => {
  const state = {};
  startSearch(async () => { throw new Error('Offline'); }, state);
  await flush();
  assert.equal(state.loading, false);
  assert.equal(state.failed, true);
  startSearch(async () => [{ value: 'AR1' }], state);
  await flush();
  assert.equal(state.failed, false);
  assert.deepEqual(state.options, [{ value: 'AR1' }]);
});

test('a cancelled older search cannot replace newer results', async () => {
  const state = {};
  let resolveOld;
  const cleanup = startSearch(() => new Promise(resolve => { resolveOld = resolve; }), state);
  cleanup();
  startSearch(async () => [{ value: 'NEW' }], state);
  await flush();
  resolveOld([{ value: 'OLD' }]);
  await flush();
  assert.deepEqual(state.options, [{ value: 'NEW' }]);
  assert.equal(state.loading, false);
});
