const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function load(relativePath, requireModule) {
  const source = fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  new Function('exports', 'require', code)(exports, requireModule);
  return exports;
}

const stages = load('lib/stageFlow.ts');
const { getOrderTableStatus, getOrderTableStages } = load(
  'app/(admin-panel)/admin-panel/orders/orderTableStatus.ts',
  () => stages,
);

test('stock items in Repair retain Repair in table labels and form defaults', () => {
  for (const order of [
    { orderSource: 'retailer', orderType: 'Stock' },
    ...[true, 1, '1'].map(is_stock_order => ({ is_stock_order })),
  ]) {
    assert.equal(getOrderTableStatus('Repair', order), 'Repair');
    assert.equal(getOrderTableStatus(' Repair ', order), 'Repair');
    assert.ok(getOrderTableStages(order).includes('Repair'));
    for (const status of ['Balance Pending', 'Ready To Delivery', 'Shipped']) {
      assert.equal(getOrderTableStatus(status, order), status);
    }
    assert.equal(getOrderTableStatus('Pattern', order), 'Balance Pending');
    assert.equal(getOrderTableStatus(null, order), 'Balance Pending');
  }
});

test('regular production orders retain all production stages', () => {
  const order = { orderSource: 'regular', orderType: 'Store' };
  for (const status of stages.ORDER_STAGE_FLOW) {
    assert.equal(getOrderTableStatus(status, order), status);
    assert.ok(getOrderTableStages(order).includes(status));
  }
});
