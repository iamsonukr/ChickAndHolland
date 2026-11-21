const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const output = ts.transpileModule(
  fs.readFileSync(path.join(__dirname, "barcodeComment.ts"), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;
const loaded = { exports: {} };
new Function("exports", output)(loaded.exports);
const { getUserBarcodeComment } = loaded.exports;

const note = "QR repair: inherited Repair from grouped barcode PO#BELLAVITA 2560-AR330602-2023. This is a migration baseline, not a new scan.";
assert.equal(getUserBarcodeComment(note), "");
assert.equal(getUserBarcodeComment(note + "\r\nFix loose beads"), "Fix loose beads");
assert.equal(getUserBarcodeComment(note + " Customer note"), "Customer note");
assert.equal(getUserBarcodeComment(note + "\n" + note), "");
assert.equal(getUserBarcodeComment("Repair from grouped barcode: check hem"), "Repair from grouped barcode: check hem");
assert.equal(getUserBarcodeComment("QR repair: inherited Repair from grouped barcode X"), "QR repair: inherited Repair from grouped barcode X");
assert.equal(getUserBarcodeComment("  Customer spacing\nSecond line"), "  Customer spacing\nSecond line");
assert.equal(getUserBarcodeComment(null), "");
assert.equal(getUserBarcodeComment(undefined), "");
console.log("Barcode comment regression checks passed");
