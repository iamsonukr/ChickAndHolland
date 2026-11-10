const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const file = ts.createSourceFile('stock.ts', fs.readFileSync(
  path.join(__dirname, '../src/controllers/StockController.ts'), 'utf8',
), ts.ScriptTarget.Latest, true);
let callback;
function visit(node) {
  if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'get' && node.arguments[0]?.text === '/') {
    callback = node.arguments[1].arguments[0].getText(file);
  }
  ts.forEachChild(node, visit);
}
visit(file);
assert.ok(callback);

test('stock rows and pagination counts exclude zero, negative and manually hidden stock', async () => {
  const rows = [
    { id: 1, quantity: 0, isDeleted: false },
    { id: 2, quantity: -1, isDeleted: false },
    { id: 3, quantity: 5, isDeleted: true },
    { id: 4, quantity: 2, isDeleted: false },
  ];
  const repository = { createQueryBuilder: () => {
    const conditions = [];
    const filtered = () => rows.filter(row =>
      (!conditions.includes('stock.isDeleted = false') || !row.isDeleted) &&
      (!conditions.includes('stock.quantity > 0') || row.quantity > 0));
    const builder = new Proxy({}, { get: (_, method) => {
      if (method === 'getMany') return async () => filtered();
      if (method === 'getCount') return async () => filtered().length;
      return (...args) => {
        if (method === 'where' || method === 'andWhere') conditions.push(args[0]);
        return builder;
      };
    } });
    return builder;
  } };
  const module = { exports: {} };
  const compiled = ts.transpileModule(`module.exports = ${callback}`, {
    compilerOptions: { target: ts.ScriptTarget.ES2020 },
  }).outputText;
  new Function('db', 'Stock', 'Product', 'ProductImage', 'StockCurrencyPricing',
    'Currency', 'Brackets', 'getStockWithCurrencyPricing', 'module', compiled)(
    { getRepository: () => repository }, {}, {}, {}, {}, {}, class Brackets {},
    rows => rows, module,
  );
  for (const query of [{}, { page: '1' }, { page: '1', source: 'warehouse' }]) {
    let response;
    await module.exports({ query }, { json: value => { response = value; } });
    assert.deepEqual(response.stock.map(row => row.id), [4]);
    assert.equal(response.totalCount, 1);
  }
});
