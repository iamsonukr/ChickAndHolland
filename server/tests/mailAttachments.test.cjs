const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");
const ts = require("typescript");
const { Resend } = require("resend");

function loadMail() {
  const source = fs.readFileSync(path.join(__dirname, "../src/lib/Utils.ts"), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    Buffer,
    process: { env: { RESEND_API_KEY: "re_test", RESEND_FROM_EMAIL: "orders@example.com" } },
    console: { log() {}, error() {} },
    require(name) {
      assert.equal(name, "resend");
      return { Resend };
    },
  });
  return exports.mail;
}

test("mail sends binary and pre-encoded attachments as Base64 through the installed SDK", async (t) => {
  const requests = [];
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    requests.push(JSON.parse(options.body));
    return new Response(JSON.stringify({ id: "test-email" }), { status: 200 });
  });
  const mail = loadMail();
  const pdf = Buffer.from("%PDF-1.4\norder document\n%%EOF");
  const uploaded = Buffer.from([0, 255, 128, 80, 75, 3, 4]);
  const encoded = pdf.toString("base64");
  for (const content of [pdf, uploaded, encoded]) {
    const result = await mail({
      to: "factory@example.com",
      subject: "Order",
      html: "Please find the order attached.",
      attachments: [{ filename: "order.pdf", content }],
    });
    assert.equal(result.id, "test-email");
    const attachment = requests.at(-1).attachments[0];
    assert.equal(typeof attachment.content, "string");
    assert.equal(attachment.filename, "order.pdf");
    assert.deepEqual(Buffer.from(attachment.content, "base64"), Buffer.isBuffer(content) ? content : pdf);
  }
  await mail({ to: "factory@example.com", subject: "Order", text: "No attachment" });
  assert.equal(requests.at(-1).attachments, undefined);
});
