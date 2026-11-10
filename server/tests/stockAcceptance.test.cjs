const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const file = ts.createSourceFile(
  "controller.ts",
  fs.readFileSync(
    path.join(__dirname, "../src/controllers/RetailerOrdersController.ts"),
    "utf8",
  ),
  ts.ScriptTarget.Latest,
  true,
);
let callback;
function visit(node) {
  if (
    ts.isCallExpression(node) &&
    node.arguments[0]?.text === "/admin/accepted/stock-order"
  ) {
    callback = node.arguments[1].arguments[0].getText(file);
  }
  ts.forEachChild(node, visit);
}
visit(file);
assert.ok(callback, "stock acceptance route exists");
const javascript = ts.transpileModule(`module.exports = ${callback}`, {
  compilerOptions: { target: ts.ScriptTarget.ES2020 },
}).outputText;

function fixture({
  failPayment = false,
  manuallyDeleted = false,
  approved = false,
} = {}) {
  class Stock {}
  class Retailer {}
  class RetailerStockOrders {}
  class RetailerOrder {}
  class StockOrderStyles {}
  class RetailerOrdersPayment {}
  const state = {
    stock: {
      id: 3,
      quantity: 2,
      isDeleted: manuallyDeleted,
      deletedAt: manuallyDeleted ? new Date() : null,
    },
    request: {
      id: 2,
      is_approved: approved ? 1 : 0,
      reservedQuantity: 1,
      quantity: 1,
    },
    orders: [],
    styles: [],
    payments: [],
    committed: false,
  };
  const manager = {
    findOne: async (model, options) => {
      if (model === Stock || model === RetailerStockOrders) {
        assert.equal(options.lock.mode, "pessimistic_write");
        return { ...(model === Stock ? state.stock : state.request) };
      }
      if (model === Retailer)
        return { id: 4, customer: { name: "Test", phoneNumber: "123" } };
      throw Error("Unexpected model");
    },
    createQueryBuilder: () => {
      const builder = {
        select: () => builder,
        where: () => builder,
        getRawOne: async () => ({ stockId: 3 }),
      };
      return builder;
    },
    save: async (record) => {
      if (record instanceof RetailerOrder) {
        record.id = 10;
        state.orders.push({ ...record });
      } else if (record instanceof StockOrderStyles) {
        if (!record.id) {
          record.id = 20 + state.styles.length;
          state.styles.push(record);
        }
      } else if (record instanceof RetailerOrdersPayment) {
        if (failPayment) throw Error("payment insert failed");
        state.payments.push(record);
      } else Object.assign(state.request, record);
      return record;
    },
  };
  const db = {
    transaction: async (fn) => {
      const before = structuredClone(state);
      try {
        const result = await fn(manager);
        state.committed = true;
        return result;
      } catch (error) {
        Object.assign(state, before);
        throw error;
      }
    },
  };
  const dependencies = {
    db,
    Stock,
    Retailer,
    RetailerStockOrders,
    RetailerOrder,
    StockOrderStyles,
    RetailerOrdersPayment,
    parsePositiveOrderQuantity: (value) => Number(value),
    sendQuantityValidationError: () => {
      throw Error("invalid quantity");
    },
    resolveSubmittedOrGeneratedPurchaseOrderNo: async () => "PO#TEST 1",
    getCustomerStoreName: (customer) => customer.name,
    parseIncomingDate: (value) => new Date(value),
    OrderStatus: { Balance_Pending: "Balance Pending" },
    adjustStockQuantity: async (_, delta, passedManager) => {
      assert.equal(passedManager, manager);
      state.stock.quantity += delta;
      return true;
    },
  };
  const module = { exports: {} };
  new Function(...Object.keys(dependencies), "module", javascript)(
    ...Object.values(dependencies),
    module,
  );
  let status = 200;
  let response;
  const res = {
    status: (value) => {
      status = value;
      return res;
    },
    json: (value) => {
      assert.equal(state.committed, true);
      response = value;
      return res;
    },
  };
  const run = () =>
    module.exports(
      {
        body: {
          data: {
            id: 2,
            stock_id: 3,
            retailerId: 4,
            quantity: 2,
            received_date: "2026-11-01",
            orderCancellationDate: "2026-12-01",
            styleNo: "EP30",
          },
        },
      },
      res,
    );
  return { state, run, result: () => ({ status, response }) };
}

test("approval commits quantity, request, pieces and payment before responding", async () => {
  const { state, run, result } = fixture();
  await run();
  assert.equal(state.stock.quantity, 1);
  assert.equal(state.request.reservedQuantity, 2);
  assert.equal(state.request.is_approved, 1);
  assert.equal(state.orders.length, 1);
  assert.equal(state.styles.length, 2);
  assert.equal(state.payments.length, 1);
  assert.equal(result().response.success, true);
});

test("payment failure rolls back the complete approval", async () => {
  const { state, run } = fixture({ failPayment: true });
  await assert.rejects(run(), /payment insert failed/);
  assert.equal(state.stock.quantity, 2);
  assert.equal(state.request.is_approved, 0);
  assert.equal(state.request.reservedQuantity, 1);
  assert.equal(
    state.orders.length + state.styles.length + state.payments.length,
    0,
  );
});

test("repeated approval and manually deleted stock are rejected before writes", async () => {
  for (const options of [{ approved: true }, { manuallyDeleted: true }]) {
    const { state, run, result } = fixture(options);
    await run();
    assert.equal(result().status, 409);
    assert.equal(state.stock.quantity, 2);
    assert.equal(state.orders.length, 0);
  }
});
