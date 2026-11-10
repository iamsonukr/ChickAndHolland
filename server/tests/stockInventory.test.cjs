const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

function inventory(initialQuantity, reservation = 0, shipped = false) {
  const state = { quantity: initialQuantity, isDeleted: false, reservation };
  let status = 0;
  let failStatus = false;
  const manager = {
    getRepository: () => ({
      createQueryBuilder: () => {
        let values;
        let minimum = 0;
        let checkAvailability = false;
        const builder = {
          update: () => builder,
          set: (value) => {
            values = value;
            return builder;
          },
          where: () => builder,
          andWhere: (sql, params) => {
            if (sql === "deletedAt IS NULL") checkAvailability = true;
            if (params) minimum = params.quantity;
            return builder;
          },
          execute: async () => {
            if (state.quantity < minimum) return { affected: 0 };
            if (
              checkAvailability &&
              (state.deletedAt || (state.isDeleted && state.quantity > 0))
            )
              return { affected: 0 };
            assert.equal(Object.keys(values)[0], "isDeleted");
            const expression = values.quantity();
            const [, operator, amount] = expression.match(
              /^quantity ([+-]) (\d+)$/,
            );
            const next =
              state.quantity + (operator === "-" ? -1 : 1) * Number(amount);
            assert.equal(
              values.isDeleted(),
              `CASE WHEN deletedAt IS NOT NULL OR (isDeleted = true AND quantity > 0) THEN true WHEN ${expression} <= 0 THEN true ELSE false END`,
            );
            state.isDeleted = Boolean(
              state.deletedAt ||
              (state.isDeleted && state.quantity > 0) ||
              next <= 0,
            );
            state.quantity = next;
            return { affected: 1 };
          },
        };
        return builder;
      },
    }),
    query: async (sql, params) => {
      if (sql.startsWith("SELECT id FROM retailer_orders")) return [{ id: 1 }];
      if (sql.startsWith("UPDATE retailer_orders")) {
        if (failStatus) throw new Error("status write failed");
        status = params[0];
        return {};
      }
      if (
        sql.includes("INNER JOIN retailer_stock_orders") &&
        status !== params[1]
      )
        return [];
      if (sql.includes("SELECT"))
        return [
          {
            orderId: 1,
            stockOrderId: 2,
            stockId: 3,
            orderStatus: shipped ? "Shipped" : "Balance Pending",
            shippingStatus: shipped ? "Shipped" : "Not Shipped",
            orderedQuantity: 3,
            reservedQuantity: state.reservation,
            stockQuantity: state.quantity,
          },
        ];
      state.reservation = params[0];
      return {};
    },
  };
  const db = {
    manager,
    transaction: async (fn) => {
      const before = { ...state };
      const beforeStatus = status;
      try {
        return await fn(manager);
      } catch (error) {
        Object.assign(state, before);
        status = beforeStatus;
        throw error;
      }
    },
  };
  const source = fs.readFileSync(
    path.join(__dirname, "../src/services/stockInventory.service.ts"),
    "utf8",
  );
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", compiled)(
    (name) => {
      if (name === "../db") return db;
      if (name === "../models/Stock") return class Stock {};
      if (name === "../models/Order")
        return {
          OrderStatus: { Shipped: "Shipped" },
          ShippingStatus: { Shipped: "Shipped" },
        };
      throw new Error(`Unexpected import: ${name}`);
    },
    module,
    module.exports,
  );
  return {
    state,
    service: module.exports,
    manager,
    getStatus: () => status,
    setStatus: (value) => {
      status = value;
    },
    failStatusWrite: () => {
      failStatus = true;
    },
  };
}

test("reserving the last pieces hides stock; partial stock stays visible", async () => {
  for (const [quantity, remaining, hidden] of [
    [3, 0, true],
    [5, 2, false],
  ]) {
    const { state, service } = inventory(quantity);
    assert.equal(await service.adjustStockQuantity(3, -3), true);
    assert.equal(state.quantity, remaining);
    assert.equal(state.isDeleted, hidden);
  }
});

test("accepting an already reserved request synchronizes visibility without another deduction", async () => {
  const { state, service } = inventory(0, 3);
  await service.adjustStockQuantity(3, 0);
  assert.equal(state.quantity, 0);
  assert.equal(state.isDeleted, true);
});

test("deletion returns stock once and restoring the order hides depleted stock again", async () => {
  const { state, service } = inventory(0, 3);
  state.isDeleted = true;
  await service.adjustStockInventoryForDeletedRetailerOrders([1], "release");
  assert.deepEqual(state, { quantity: 3, isDeleted: false, reservation: 0 });
  await service.adjustStockInventoryForDeletedRetailerOrders([1], "release");
  assert.equal(state.quantity, 3);
  await service.adjustStockInventoryForDeletedRetailerOrders([1], "reserve");
  assert.deepEqual(state, { quantity: 0, isDeleted: true, reservation: 3 });
});

test("pending request rejection returns stock and makes it visible", async () => {
  const { state, service } = inventory(0, 3);
  await service.releaseStockRequestReservations([2]);
  assert.equal(state.quantity, 3);
  assert.equal(state.isDeleted, false);
});

test("insufficient stock and shipped orders do not change inventory", async () => {
  const { state, service } = inventory(2);
  assert.equal(await service.adjustStockQuantity(3, -3), false);
  const deleted = inventory(2);
  deleted.setStatus(1);
  await assert.rejects(
    deleted.service.adjustStockInventoryForDeletedRetailerOrders(
      [1],
      "reserve",
    ),
  );
  assert.equal(state.quantity, 2);
  const shipped = inventory(0, 3, true);
  await shipped.service.adjustStockInventoryForDeletedRetailerOrders(
    [1],
    "release",
  );
  assert.equal(shipped.state.quantity, 0);
});

test("manual deletion survives stock returns and blocks allocation", async () => {
  const { state, service } = inventory(0, 3);
  state.deletedAt = new Date();
  state.isDeleted = true;
  await service.adjustStockInventoryForDeletedRetailerOrders([1], "release");
  assert.equal(state.quantity, 3);
  assert.equal(state.isDeleted, true);
  assert.equal(await service.adjustStockQuantity(3, -1), false);
});

test("status failure rolls back the returned quantity and reservation", async () => {
  const fixture = inventory(0, 3);
  fixture.state.isDeleted = true;
  fixture.failStatusWrite();
  await assert.rejects(
    fixture.service.adjustStockInventoryForDeletedRetailerOrders(
      [1],
      "release",
    ),
    /status write failed/,
  );
  assert.deepEqual(fixture.state, {
    quantity: 0,
    isDeleted: true,
    reservation: 3,
  });
  assert.equal(fixture.getStatus(), 0);
});

test("order status changes in the same transaction as the reservation", async () => {
  const fixture = inventory(0, 3);
  await fixture.service.adjustStockInventoryForDeletedRetailerOrders(
    [1],
    "release",
  );
  assert.equal(fixture.getStatus(), 1);
  await fixture.service.adjustStockInventoryForDeletedRetailerOrders(
    [1],
    "reserve",
  );
  assert.equal(fixture.getStatus(), 0);
});
