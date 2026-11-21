const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const file = ts.createSourceFile('stock.ts', fs.readFileSync(
  path.join(__dirname, '../src/controllers/StockController.ts'), 'utf8',
), ts.ScriptTarget.Latest, true);
let callback;
let route;
function visit(node) {
  if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'put' && node.arguments[0]?.text === '/bulk-discount') {
    route = node;
    callback = node.arguments[node.arguments.length - 1].arguments[0].getText(file);
  }
  ts.forEachChild(node, visit);
}
visit(file);
assert.ok(callback);
const compiled = ts.transpileModule(`module.exports = ${callback}`, {
  compilerOptions: { target: ts.ScriptTarget.ES2020 },
}).outputText;

async function request(body, stocks = [{ id: 1 }, { id: 2 }], queryRepository) {
  const writes = [];
  let transactions = 0;
  const db = { transaction: async run => {
    transactions++;
    return run({ getRepository: model => ({
      find: async () => stocks,
      createQueryBuilder: () => {
        if (queryRepository) return queryRepository(model, writes);
        const write = { model };
        const builder = {
          update: () => builder,
          set: values => { write.values = values; return builder; },
          whereInIds: ids => { write.ids = ids; return builder; },
          where: filter => { write.filter = filter; return builder; },
          setParameter: (key, value) => { write[key] = value; return builder; },
          execute: async () => { writes.push(write); },
        };
        return builder;
      },
    }) });
  } };
  const module = { exports: {} };
  new Function('db', 'Stock', 'StockCurrencyPricing', 'In', 'module', compiled)(
    db, 'Stock', 'CurrencyPricing', queryRepository ? require('typeorm').In : ids => ids, module,
  );
  let status = 200;
  let response;
  const res = { status: value => { status = value; return res; }, json: value => { response = value; } };
  await module.exports({ body }, res);
  return { status, response, writes, transactions };
}

test('rejects invalid selections and percentages before accessing stock', async () => {
  for (const body of [
    undefined, null, {}, { ids: [], discount: 10 }, { ids: [1], discount: -1 },
    { ids: [1], discount: 101 }, { ids: [1], discount: 10.5 },
    { ids: [1], discount: '10' }, { ids: ['1'], discount: 10 },
    { ids: [0], discount: 10 }, { ids: Array(101).fill(1), discount: 10 },
  ]) {
    const result = await request(body);
    assert.equal(result.status, 400);
    assert.equal(result.transactions, 0);
  }
});

test('TypeORM builds MySQL updates restricted to selected stock IDs', async () => {
  const { DataSource, EntitySchema } = require('typeorm');
  const stock = new EntitySchema({
    name: 'Stock', tableName: 'stock', columns: {
      id: { type: Number, primary: true }, price: { type: Number },
      discount: { type: Number }, discountedPrice: { type: Number },
    },
  });
  const currency = new EntitySchema({
    name: 'CurrencyPricing', tableName: 'stock_currency_pricing', columns: {
      id: { type: Number, primary: true }, price: { type: 'decimal', precision: 10, scale: 2 },
      discountedPrice: { type: 'decimal', precision: 10, scale: 2 },
    }, relations: { stock: { type: 'many-to-one', target: 'Stock', joinColumn: { name: 'stockId' } } },
  });
  const source = new DataSource({ type: 'mysql', database: 'offline_test', entities: [stock, currency] });
  await source.buildMetadatas();
  const result = await request({ ids: [1, 2], discount: 10 }, undefined, (model, writes) => {
    const builder = source.getRepository(model).createQueryBuilder().update();
    builder.execute = async () => {
      writes.push(builder.getQueryAndParameters());
      return {};
    };
    return builder;
  });
  const [[baseSql, baseParams], [currencySql, currencyParams]] = result.writes;
  assert.match(baseSql, /UPDATE `stock` SET/);
  assert.match(baseSql, /ROUND\(`price` \* \(100 - \?\) \/ 100\)/);
  assert.match(baseSql, /WHERE `id` IN \(\?, \?\)/);
  assert.deepEqual(baseParams, [10, 10, 1, 2]);
  assert.match(currencySql, /UPDATE `stock_currency_pricing` SET/);
  assert.match(currencySql, /ROUND\(`price` \* \(100 - \?\) \/ 100, 2\)/);
  assert.match(currencySql, /WHERE `stockId` IN \(\?, \?\)/);
  assert.deepEqual(currencyParams, [10, 1, 2]);
});

test('bulk discount requires admin stock permissions before the handler', () => {
  assert.equal(route.arguments[1].getText(file), 'requireAdminUser(["/admin-panel/stock"])');
});

test('missing or deleted stock prevents all writes', async () => {
  const result = await request({ ids: [1, 2], discount: 10 }, [{ id: 1 }]);
  assert.equal(result.status, 404);
  assert.equal(result.writes.length, 0);
});

test('updates selected base and currency prices from original prices in one transaction', async () => {
  for (const discount of [0, 10, 100]) {
    const result = await request({ ids: [1, 2, 1], discount });
    assert.equal(result.status, 200);
    assert.equal(result.response.updatedCount, 2);
    assert.equal(result.transactions, 1);
    assert.equal(result.writes.length, 2);
    const [base, currency] = result.writes;
    assert.deepEqual(base.ids, [1, 2]);
    assert.deepEqual(currency.filter, { stock: { id: [1, 2] } });
    assert.equal(base.values.discount, discount);
    assert.equal(base.discount, discount);
    assert.equal(currency.discount, discount);
    assert.equal(base.values.discountedPrice(), 'ROUND(price * (100 - :discount) / 100)');
    assert.equal(currency.values.discountedPrice(), 'ROUND(price * (100 - :discount) / 100, 2)');
    assert.equal(base.values.price, undefined);
    assert.equal(base.values.quantity, undefined);
    assert.equal(currency.values.price, undefined);
  }
});
