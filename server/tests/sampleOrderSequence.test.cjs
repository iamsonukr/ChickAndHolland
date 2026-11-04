const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");
const ts = require("typescript");

function loadSequence({ next = 110065, products = [] } = {}) {
  const codes = new Set(products);
  let counter = next;
  let locked = false;
  const db = {
    async query(sql, params) {
      if (sql.startsWith("SELECT id FROM products")) {
        return codes.has(params[0]) ? [{ id: 1 }] : [];
      }
      if (sql.includes("SELECT") && sql.includes("order_sequence")) {
        if (sql.includes("FOR UPDATE")) locked = true;
        return [{ id: 1, nextNumber: counter }];
      }
      if (sql.includes("UPDATE order_sequence SET")) {
        assert.ok(locked, "Reservation must hold the sequence lock");
        counter = params[0];
      }
      if (sql.includes("nextNumber = VALUES(nextNumber)")) counter = params[1];
      return [];
    },
    createQueryRunner() {
      return {
        query: db.query,
        async connect() {},
        async startTransaction() {},
        async commitTransaction() { locked = false; },
        async rollbackTransaction() { locked = false; },
        async release() {},
      };
    },
  };
  const source = fs.readFileSync(path.join(__dirname, "../src/utils/generatePO.ts"), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    require(name) {
      assert.equal(name, "../db");
      return db;
    },
  });
  return { api: exports, counter: () => counter };
}

test("preview skips existing product codes without reserving a number", async () => {
  const { api, counter } = loadSequence({ products: ["NS110065", "NS110066"] });
  assert.equal((await api.peekNextSampleOrderStyleNo()).styleNo, "NS110067");
  assert.equal(counter(), 110065);
});

test("reservation skips more than 50 occupied codes and advances the counter", async () => {
  const { api, counter } = loadSequence({
    products: Array.from({ length: 75 }, (_, i) => `NS${110065 + i}`),
  });
  assert.equal((await api.generateNextSampleOrderStyleNo()).styleNo, "NS110140");
  assert.equal(counter(), 110141);
  assert.equal((await api.peekNextSampleOrderStyleNo()).styleNo, "NS110141");
});

test("an available configured number is preserved even with higher products", async () => {
  const { api } = loadSequence({ products: ["NS110070"] });
  assert.equal((await api.peekNextSampleOrderStyleNo()).styleNo, "NS110065");
});

test("resetting to an occupied code reports the next available code", async () => {
  const { api } = loadSequence({ products: ["NS110065"] });
  assert.equal((await api.setSampleOrderSequence(110065)).styleNo, "NS110066");
});

test("global purchase order sequence does not skip product codes", async () => {
  const { api } = loadSequence({ products: ["NS110065"] });
  assert.equal(await api.peekGlobalNextPoNumber(), 110065);
  assert.equal(await api.generateUniquePO("PO#STORE"), "PO#STORE 110065");
});
