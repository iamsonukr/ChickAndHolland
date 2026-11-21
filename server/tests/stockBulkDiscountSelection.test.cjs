const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

test('refreshed stock list excludes hidden selections from checkboxes and submission', async () => {
  const source = fs.readFileSync(path.join(__dirname,
    '../../client/app/(admin-panel)/admin-panel/stock/BulkStockDiscount.tsx'), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: {
    target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  const states = [new Set([1, 2]), '10'];
  const requests = [];
  let refreshed = false;
  const mockRequire = name => {
    if (name === 'react') return {
      createContext: () => ({ Provider: 'Provider' }),
      useState: () => [states.shift(), () => {}],
    };
    if (name === 'react/jsx-runtime') return require(name);
    if (name === 'next/navigation') return { useRouter: () => ({ refresh: () => { refreshed = true; } }) };
    if (name === 'sonner') return { toast: { success: () => {}, error: message => assert.fail(message) } };
    if (name === '@/lib/hooks/usePost') return { default: () => ({
      loading: false,
      executeAsync: async payload => { requests.push(payload); return { updatedCount: 1 }; },
    }) };
    return { Button: 'button', Input: 'input' };
  };
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(mockRequire, module, module.exports);
  const tree = module.exports.default({ ids: [2, 3], children: null });
  assert.deepEqual([...tree.props.value.selected], [2]);
  const form = tree.props.children[0];
  await form.props.onSubmit({ preventDefault() {} });
  assert.deepEqual(requests, [{ ids: [2], discount: 10 }]);
  assert.equal(refreshed, true);
});
