const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function load(relative, overrides = {}) {
  const file = path.join(__dirname, relative);
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const module = { exports: {} };
  const localRequire = (name) => {
    if (Object.hasOwn(overrides, name)) return overrides[name];
    if (name.startsWith('.')) {
      const base = path.resolve(path.dirname(file), name);
      return load(path.relative(__dirname, fs.existsSync(base+'.ts') ? base+'.ts' : base+'.tsx'), overrides);
    }
    return require(name);
  };
  new Function('require', 'module', 'exports', output)(localRequire, module, module.exports);
  return module.exports;
}

const pieces = load('orderPieces.ts');
const group = {
  id: 10, barcode: 'original', styleNo: 'AR330557', quantity: 99, size: 'Custom',
  customSize: '[]', customSizesQuantity: JSON.stringify([
    { size: 34, quantity: 2 }, { size: 38, quantity: 1 },
    { size: 40, quantity: 1 }, { size: 44, quantity: 1 }, { size: 36, quantity: 1 },
  ]), subtotal: '10.01', discount: '1.01', totalPrice: '9.00',
  currentStatus: 'Beading', photoUrls: '["reference.jpg"]',
};
assert.deepEqual(pieces.expandOrderStylePieces(group).map(p => p.size), ['34', '34', '38', '40', '44', '36']);
assert.equal(pieces.expandOrderStylePieces({ quantity: 3 }).length, 3);
for (const quantity of [0, -1, 1.5, '', 'abc']) {
  assert.throws(() => pieces.expandOrderStylePieces({ quantity }));
}
assert.throws(() => pieces.expandOrderStylePieces({customSizesQuantity:[{size:34,quantity:0}]}));

// Exercise persistence, existing-barcode retention, cents, and repeat repair.
let rows = [group];
let nextId = 20;
const queries = [];
const order = { id: 1, purchaeOrderNo: 'VICTORIA' };
const manager = {
  findOne: async () => order,
  createQueryBuilder() {
    const q = { addSelect:()=>q, where:()=>q, setLock:()=>q, getMany:async()=>rows.map(r=>({...r})) };
    return q;
  },
  query: async (sql, params) => {
    queries.push({sql, params});
    if (sql.startsWith('SELECT status')) return [{status:'Stitching',createdAt:new Date('2026-09-25T00:00:00Z')}];
    return sql.startsWith('SELECT') ? [{ beader: 'ISRAEL' }] : [];
  },
  create: (_, fields) => ({...fields}),
  save: async entity => {
    if (!entity.id) entity.id = nextId++;
    const i=rows.findIndex(r=>r.id===entity.id);
    if(i<0) rows.push({...entity}); else rows[i]={...entity};
    return entity;
  },
};
const service = load('../services/regularOrderPieces.service.ts', {
  '../db': { default: { transaction: async fn => fn(manager) } },
  '../models/Order': { default: class Order {} },
  '../models/OrderStyle': { default: class Style {} },
  '../utils/ensureOrderBeadersTable': { ORDER_BEADERS_TABLE:'order_beaders' },
});
(async () => {
  assert.equal(await service.ensureRegularOrderPieces(1), 5);
  assert.equal(rows.length, 6);
  assert.equal(new Set(rows.map(r=>r.barcode)).size, 6);
  assert.equal(rows[0].barcode, 'original');
  assert.ok(rows.every(r=>r.currentStatus==='Stitching'));
  const baselines = queries.filter(q=>q.sql.startsWith('INSERT INTO store_style_progress'));
  assert.equal(baselines.length,5);
  assert.ok(baselines.every(q=>q.params[1]==='Stitching'));
  assert.equal(queries.filter(q=>q.sql.startsWith('INSERT INTO barcode_comments')).length,5);
  assert.ok(rows.every(r=>r.quantity===1 && r.customSizesQuantity==='[]' && r.photoUrls===group.photoUrls));
  for(const field of ['subtotal','discount','totalPrice']) {
    assert.equal(rows.reduce((n,r)=>n+Math.round(r[field]*100),0),Math.round(group[field]*100));
  }
  assert.equal(await service.ensureRegularOrderPieces(1),0);
  assert.equal(rows.length,6);
  const mixed = pieces.buildPiecePricing({subtotal:240,unitPrice:100,discount:24,totalPrice:216},[{size:34},{size:54}]);
  assert.deepEqual(mixed.map(p=>p.unitPrice),[100,140]);
  assert.deepEqual(mixed.map(p=>p.totalPrice),[90,126]);
  const rounded = pieces.buildPiecePricing({subtotal:10,discount:0.02,totalPrice:9.98},[{size:34},{size:34},{size:34}]);
  assert.equal(rounded.reduce((n,p)=>n+Math.round(p.totalPrice*100),0),998);
  assert.ok(rounded.every(p=>Math.round(p.subtotal*100)-Math.round(p.discount*100)===Math.round(p.totalPrice*100)));
  const validate = load('orderPdfValidation.ts').assertPdfPieceDetails;
  const clientValidate = load('../../../client/lib/orderPdfValidation.ts').assertPdfPieceDetails;
  for (const check of [validate, clientValidate]) {
    assert.doesNotThrow(()=>check(rows));
    assert.throws(()=>check([]));
    assert.throws(()=>check([{quantity:4,barcode:'a'}]));
    assert.throws(()=>check([{quantity:1,barcode:'a'},{quantity:1,barcode:' a '}]));
    assert.throws(()=>check([{quantity:1,barcode:'N/A'}]));
    assert.throws(()=>check([{quantity:1,barcode:'a',customSizesQuantity:[{size:34,quantity:1},{size:36,quantity:1}]}]));
  }
  const Pdf = load('../pdf/GroupedOrderPdf.tsx', {
    '@react-pdf/renderer': {
      Document:'Document', Page:'Page', Image:'Image', Text:'Text', View:'View',
      StyleSheet:{create:styles=>styles},
    },
  }).default;
  const document = Pdf({orderData:{details:rows, purchaseOrderNo:'VICTORIA'}});
  const pages = document.props.children;
  assert.equal(pages.length,2);
  function qrImages(node) {
    if (Array.isArray(node)) return node.flatMap(qrImages);
    if (!node?.props) return [];
    const images = qrImages(node.props.children);
    return node.type==='Image' && String(node.props.src).includes('create-qr-code') ? [node.props.src,...images] : images;
  }
  assert.deepEqual(pages.map(p=>qrImages(p).length),[4,2]);
  assert.equal(new Set(qrImages(document)).size,6);
  function textValues(node) {
    if (Array.isArray(node)) return node.flatMap(textValues);
    if (typeof node==='string') return [node];
    return node?.props ? textValues(node.props.children) : [];
  }
  assert.ok(rows.every(r=>textValues(document).includes(r.barcode)));
  // Increasing a scanned single-piece row creates new unscanned pieces.
  rows = [{...group, customSizesQuantity:'[]', size:34, quantity:3}];
  queries.length = 0;
  assert.equal(await service.ensureRegularOrderPieces(1,{previousPieceCounts:new Map([[10,1]])}),2);
  assert.equal(rows[0].currentStatus,'Stitching');
  assert.ok(rows.slice(1).every(r=>r.currentStatus===null));
  assert.equal(queries.filter(q=>q.sql.startsWith('INSERT INTO store_style_progress')).length,0);
  console.log('Order piece regression checks passed (stage inheritance, size pricing, rounding, stale/duplicate QR rejection, full labels, idempotency, pagination 4+2).');
})().catch(e=>{console.error(e);process.exitCode=1;});
