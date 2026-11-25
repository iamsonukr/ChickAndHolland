const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { PDFDocument } = require('pdf-lib');
const source = fs.readFileSync(path.join(__dirname, '../lib/selectedOrderPdf.ts'), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
function load({fetch, navigator = {}, document, window, URL} = {}) {
 const exports = {};
 new Function('exports','require','fetch','navigator','document','window','URL',code)(exports,require,fetch,navigator,document,window,URL);
 return exports;
}
async function pdfBytes(pages) {
 const pdf = await PDFDocument.create();
 for(let i=0;i<pages;i++) pdf.addPage([300+i,400]);
 return pdf.save();
}
const orders = [{id:7,orderType:'Store',orderSource:'regular'},{id:7,orderType:'Fresh',orderSource:'retailer'}];

test('generated PDFs for all selected orders are merged without requesting uploaded attachments', async () => {
 const docs = [await pdfBytes(2),await pdfBytes(1)];
 const requests = [];
 const {prepareSelectedOrderPdf} = load({fetch:()=>{throw new Error('Must generate, not load attachments');}});
 const file = await prepareSelectedOrderPdf(orders,'https://example.test/api','token',new AbortController().signal,
  async(order,apiUrl,token)=>{requests.push({order,apiUrl,token});return docs[requests.length-1].buffer;});
 const merged = await PDFDocument.load(await file.arrayBuffer());
 assert.equal(merged.getPageCount(),3);
 assert.deepEqual(merged.getPages().map(page=>page.getWidth()),[300,301,300]);
 assert.equal(file.type,'application/pdf');
 assert.equal(file.name,'selected-orders-2.pdf');
 assert.deepEqual(requests.map(request=>request.order),orders);
 assert.equal(requests[0].token,'token');
});

test('a single generated PDF retains all its bytes', async () => {
 const original = await pdfBytes(2);
 const {prepareSelectedOrderPdf} = load();
 const file = await prepareSelectedOrderPdf([orders[0]],'api','',new AbortController().signal,async()=>original.buffer);
 assert.deepEqual(new Uint8Array(await file.arrayBuffer()),original);
});

test('generation errors identify the order and do not share a partial selection', async () => {
 const {prepareSelectedOrderPdf} = load();
 await assert.rejects(prepareSelectedOrderPdf(orders,'api','',new AbortController().signal,async()=>{throw new Error('Order unavailable');}),/Store order #7: Order unavailable/);
});

test('a changed selection aborts generation', async () => {
 const controller = new AbortController(); controller.abort();
 let generated=false;
 const {prepareSelectedOrderPdf}=load();
 await assert.rejects(prepareSelectedOrderPdf(orders,'api','',controller.signal,async()=>{generated=true;}),{name:'AbortError'});
 assert.equal(generated,false);
});

test('share opens immediately with a PDF file; cancellation does not download', async () => {
 const file=new File(['%PDF-'],'orders.pdf',{type:'application/pdf'});
 let shared;
 const api=load({navigator:{canShare:()=>true,share:data=>{shared=data;return Promise.resolve();}}});
 const result=api.shareSelectedOrderPdf(file);
 assert.deepEqual(shared,{files:[file]});
 assert.equal(await result,'shared');
 const cancelled=load({navigator:{canShare:()=>true,share:async()=>{throw new DOMException('cancel','AbortError');}}});
 assert.equal(await cancelled.shareSelectedOrderPdf(file),'cancelled');
});

test('unsupported file sharing downloads the prepared PDF and revokes its URL', async () => {
 const file=new File(['%PDF-'],'orders.pdf',{type:'application/pdf'});
 let clicked=false,revoked=false;const link={click(){clicked=true;},remove(){}};
 const api=load({document:{createElement:()=>link,body:{appendChild(){}}},window:{setTimeout:fn=>fn()},URL:{createObjectURL:()=> 'blob:pdf',revokeObjectURL:()=>{revoked=true;}}});
 assert.equal(await api.shareSelectedOrderPdf(file),'downloaded');
 assert.equal(link.download,'orders.pdf');
 assert.equal(clicked,true);assert.equal(revoked,true);
});


test('sharing generates regular, fresh, and stock orders using the existing preview loaders and templates', async () => {
 const source = fs.readFileSync(path.join(__dirname,'../app/(admin-panel)/admin-panel/orders/generateSelectedOrderPdf.tsx'),'utf8');
 const code = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 for (const type of ['Store','Fresh','Stock']) {
  let rendered, loaded, requested;
  const exports = {};
  const requireMock = name => {
   if(name==='react/jsx-runtime') return {jsx:(type,props)=>({type,props})};
   if(name==='@react-pdf/renderer') return {pdf:document=>{rendered=document;return {toBlob:async()=>new Blob(['%PDF-generated'])};}};
   if(name.endsWith('FreshOrderPdf')) return {default:'regular-template'};
   if(name.endsWith('RetailerPdf')) return {default:'retailer-template'};
   if(name==='@/lib/selectedOrderPdf') return load();
   if(name==='./orderPdfData') return {
    loadRegularOrderPreview:async data=>{loaded=data;return {previewData:{details:[{barcode:'QR-1'}]}};},
    loadRetailerOrderPreview:async data=>{loaded=data;return {details:[{barcode:'QR-2'}]};},
   };
   throw new Error(name);
  };
  new Function('exports','require','fetch',code)(exports,requireMock,async url=>{
   requested=url;
   return {ok:true,json:async()=>({success:true,data:{id:7,is_stock_order:type==='Stock',favourite_order:{id:10},Stock_order:{id:11}}})};
  });
  const bytes=await exports.generateSelectedOrderPdf({id:7,orderType:type,orderSource:type==='Store'?'regular':'retailer'},'api','token',new AbortController().signal);
  assert.equal(new TextDecoder().decode(bytes),'%PDF-generated');
  assert.equal(rendered.type,type==='Store'?'regular-template':'retailer-template');
  assert.equal(loaded.orderType,type);
  if(type!=='Store') {
   assert.equal(requested,'api/retailer-orders/7');
   assert.equal(loaded.favouriteOrder.id,10);
  }
  assert.equal(rendered.props.orderData.details.length,1);
 }
});

test('shared preview data loader builds printable details without an uploaded PDF for all order types', async () => {
 const source = fs.readFileSync(path.join(__dirname,'../app/(admin-panel)/admin-panel/orders/orderPdfData.ts'),'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 const style={id:1,product_id:1,styleNo:'STYLE-1',productCode:'STYLE-1',barcode:'QR-1',quantity:1,size:'38',sizeCountry:'EU',size_country:'EU',image:'image.jpg',convertedFirstProductImage:'image.jpg',colorType:'SAS',mesh_color:'SAS',beading_color:'SAS',lining_color:'SAS'};
 const dataApi={
  getProductColours:async()=>({productColours:[]}),
  getProductColorsCheck:async()=>({data:{}}),
  getRetailerAdminFreshOrderDetails:async()=>({data:[style]}),
  getRetailerAdminStockOrderDetails:async()=>({details:[style]}),
 };
 const exports={};
 new Function('exports','require','fetch',compiled)(exports,name=>{
  if(name==='@/lib/constants') return {API_URL:'api'};
  if(name==='@/lib/data') return dataApi;
  if(name==='../request/StockAcceptedForm') return {convertWebPToJPG:async image=>image};
  throw new Error(name);
 },async()=>({ok:true,json:async()=>({orders:[{id:7,customer:{id:1},styles:[style],purchaeOrderNo:'PO-7',orderType:'Store'}]})}));
 const regular=await exports.loadRegularOrderPreview({id:7},async()=>{});
 assert.equal(regular.previewData.ppt_path,'');
 assert.equal(regular.previewData.details[0].barcode,'QR-1');
 assert.equal(regular.previewData.purchaseOrderNo,'PO-7');
 for(const orderType of ['Fresh','Stock']) {
  const result=await exports.loadRetailerOrderPreview({id:7,orderType,purchaeOrderNo:'PO-7',favouriteOrder:{id:10},Stock_order:{id:11}});
  assert.equal(result.ppt_path,'');
  assert.equal(result.details[0].barcode,'QR-1');
  assert.equal(result.details[0].styleNo,'STYLE-1');
  assert.equal(result.orderType,orderType);
 }
});
