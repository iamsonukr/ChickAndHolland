const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function gate(controller, targetName, summaryName) {
  const file = ts.createSourceFile(controller, fs.readFileSync(
    path.join(__dirname, '../src/controllers', controller), 'utf8',
  ), ts.ScriptTarget.Latest, true);
  let block;
  function visit(node) {
    if (ts.isIfStatement(node) && node.expression.getText(file).includes(targetName) &&
        node.thenStatement.getText(file).includes(`await ${summaryName}(order)`)) {
      block = node.getText(file);
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  assert.ok(block, `${controller}: ${targetName} payment guard exists`);
  const source = `module.exports = async (order, ${targetName}, res) => { ${block} };`;
  const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2020 },
  }).outputText;
  return async (isStock, stage, balance) => {
    const module = { exports: {} };
    new Function('module', 'OrderStatus', summaryName, compiled)(module, {
      Ready_To_Delivery: 'Ready To Delivery', Shipped: 'Shipped', Balance_Pending: 'Balance Pending',
    }, async () => ({ balance }));
    let response;
    const res = { status: () => res, json: body => { response = body; return body; } };
    await module.exports({ is_stock_order: isStock, orderType: isStock ? 'Stock' : 'Fresh', orderStatus: 'Pattern' }, stage, res);
    return response;
  };
}

for (const [controller, targetName, summaryName] of [
  ['RetailerOrdersController.ts', 'finalStatus', 'getRetailerPaymentSummary'],
  ['RetailerOrdersController.ts', 'targetStatus', 'getRetailerPaymentSummary'],
  ['OrderController.ts', 'status', 'getRegularOrderPaymentSummary'],
]) {
  test(`${controller} ${targetName}: require full payment before stock delivery readiness and shipping`, async () => {
    const check = gate(controller, targetName, summaryName);
    for (const stage of ['Ready To Delivery', 'Shipped']) {
      assert.equal((await check(true, stage, 25)).success, false);
      assert.equal(await check(true, stage, 0), undefined);
      assert.equal(await check(false, stage, 25), undefined);
    }
    assert.equal(await check(true, 'Zarkan', 25), undefined);
  });
}
