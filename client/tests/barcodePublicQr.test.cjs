const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../lib/barcodes.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
} }).outputText;
const exportsObject = {};
new Function('exports', 'process', compiled)(exportsObject, {
  env: { NEXT_PUBLIC_BASE_URL: 'http://localhost:3000' },
});
const { buildBarcodeScanUrl, build2dBarcodeUrl, buildPdf2dBarcodeUrl, normalizeBarcodeValue } = exportsObject;

test('server PDF QRs match client label QRs', () => {
  const source = fs.readFileSync(path.join(__dirname, '../../server/src/lib/barcodes.ts'), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
  } }).outputText;
  const server = {};
  new Function('exports', 'process', js)(server, { env: { CLIENT_URL: 'https://other-app.example' } });
  assert.equal(server.buildPdf2dBarcodeUrl('RET-123'), buildPdf2dBarcodeUrl('RET-123'));
  assert.equal(server.normalizeBarcodeValue(buildBarcodeScanUrl('RET-123')), 'RET-123');
});

test('ordinary cameras open the public image directly regardless of app config, and staff scanners recover the exact barcode', () => {
  for (const code of ['RET-123-01', 'STOCK-42', 'STORE-19', '123', 'PO / + & ? # %']) {
    const image = new URL(build2dBarcodeUrl(code));
    const link = image.searchParams.get('data');
    assert.equal(new URL(link).origin, 'https://chicandholland.com');
    assert.equal(new URL(link).pathname, '/chic-default-qr.png');
    assert.equal(new URL(link).search, '');
    assert.equal(new URLSearchParams(new URL(link).hash.slice(1)).get('code'), code);
    assert.equal(normalizeBarcodeValue(link), code);
    assert.equal(normalizeBarcodeValue(code), code);
    assert.equal(buildBarcodeScanUrl(link), link);
    assert.equal(new URL(buildPdf2dBarcodeUrl(code)).searchParams.get('data'), link);
  }
});

test('blank and placeholder codes never produce printable QRs', () => {
  for (const code of [undefined, null, '', ' ', 'N/A', 'NULL', 'undefined', 'NA', 'https://chicandholland.com/qr']) {
    assert.equal(normalizeBarcodeValue(code), '');
    assert.equal(buildBarcodeScanUrl(code), '');
    assert.equal(build2dBarcodeUrl(code), '');
  }
});

test('staff scanners accept QR links with a trailing slash', () => {
  const link = new URL('https://chicandholland.com/qr/?code=RET-123');
  assert.equal(normalizeBarcodeValue(link.toString()), 'RET-123');
});

const getScanHandler = (filename, scope) => {
  const file = ts.createSourceFile(filename, fs.readFileSync(path.join(__dirname, filename), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let handler;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(file) === 'processBarcode') handler = node.initializer.getText(file);
    ts.forEachChild(node, visit);
  }
  visit(file);
  assert.ok(handler);
  const js = ts.transpileModule(`module.exports = ${handler}`, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
  } }).outputText;
  const module = { exports: {} };
  new Function('module', ...Object.keys(scope), js)(module, ...Object.values(scope));
  return module.exports;
};

test('item stage-master scanner keeps raw, previous-link and direct-image codes on the same flow', async () => {
  const code = 'PIECE-123';
  for (const orderType of ['RETAILER', 'STOCK', 'STORE']) {
    for (const payload of [code, `https://chicandholland.com/qr?code=${code}`, buildBarcodeScanUrl(code)]) {
      const calls = [];
      const handler = getScanHandler('../app/(admin-panel)/admin-panel/orders/[id]/status/StatusScannerButton.tsx', {
        normalizeBarcodeValue, scanLockRef: { current: false }, expectedBarcode: code, orderType,
        setScanLock() {}, setBarcode() {}, unlockScannerSoon() {}, FAIL_SCREEN_MS: 2200,
        showFailScreen: message => assert.fail(message),
        processStoreBarcode: async value => { calls.push(['STORE', value]); },
        processRetailerOrStockBarcode: async value => { calls.push([orderType, value]); },
      });
      await handler(payload);
      assert.deepEqual(calls, [[orderType, code]]);
    }
  }
});

test('global stage-master scanner preserves retailer, stock and store dispatch for new QRs', async () => {
  const code = 'PIECE-456';
  for (const matchingFlow of ['RETAILER', 'STOCK', 'STORE']) {
    const calls = [];
    let outcome;
    const flow = type => async value => {
      assert.equal(value, code);
      calls.push(type);
      return type === matchingFlow ? { success: true, orderType: type, barcode: value } : null;
    };
    const handler = getScanHandler('../app/(admin-panel)/admin-panel/orders/qr-scan/page.tsx', {
      normalizeBarcodeValue, scanLockRef: { current: false }, pendingRetailerShipBarcode: null,
      setScanLock() {}, setBarcode() {}, unlockScannerSoon() {}, setPendingRetailerShipBarcode() {},
      tryRetailerFlow: flow('RETAILER'), tryStockFlow: flow('STOCK'), tryStoreFlow: flow('STORE'),
      setResult: value => { outcome = value; }, SUCCESS_OVERLAY_MS: 2200, FAIL_OVERLAY_MS: 2200,
      showSuccessOverlay() {}, showFailOverlay: () => assert.fail('Unexpected failure'), inputRef: { current: null },
    });
    await handler(buildBarcodeScanUrl(code));
    assert.equal(outcome.orderType, matchingFlow);
    assert.deepEqual(calls, ['RETAILER', 'STOCK', 'STORE'].slice(0, ['RETAILER', 'STOCK', 'STORE'].indexOf(matchingFlow) + 1));
  }
});

test('QR payloads decode using the same decoder as the staff camera', () => {
  const { QRCodeWriter, QRCodeReader, BarcodeFormat, RGBLuminanceSource, HybridBinarizer, BinaryBitmap } = require('@zxing/library');
  for (const size of [80, 120, 160, 320]) {
    const code = 'RETAILER-123456-STYLE-789-PIECE-001';
    const payload = buildBarcodeScanUrl(code);
    const matrix = new QRCodeWriter().encode(payload, BarcodeFormat.QR_CODE, size, size, new Map());
    const width = matrix.getWidth();
    const height = matrix.getHeight();
    const pixels = new Uint8ClampedArray(width * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) pixels[y * width + x] = matrix.get(x, y) ? 0 : 255;
    }
    const bitmap = new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(pixels, width, height)));
    const result = new QRCodeReader().decode(bitmap);
    assert.equal(result.getText(), payload);
    assert.equal(normalizeBarcodeValue(result.getText()), code);
  }
});

test('public QR page renders only the default image without order APIs or login', () => {
  const page = fs.readFileSync(path.join(__dirname, '../app/qr/page.tsx'), 'utf8');
  const js = ts.transpileModule(page, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  const result = {};
  new Function('exports', 'require', js)(result, require);
  const html = require('react-dom/server').renderToStaticMarkup(result.default());
  assert.match(html, /src="\/chic-default-qr.png"/);
  assert.equal(fs.existsSync(path.join(__dirname, '../public/chic-default-qr.png')), true);
  assert.doesNotMatch(page, /fetch\(|redirect\(|cookies\(|useEffect|API_URL/);
});
