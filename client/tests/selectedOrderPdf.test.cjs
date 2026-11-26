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

test('three orders produce three separate PO-named PDFs with every original page', async () => {
 const docs = [await pdfBytes(2),await pdfBytes(1),await pdfBytes(3)];
 const selected = [...orders,{id:8,orderType:'Stock',orderSource:'retailer'}];
 const names = ['PO#AMAN 2692.pdf','PO#SUCCESS 2691.pdf','PO#SUCCESS 2690.pdf'];
 const requests = [];
 const {prepareSelectedOrderPdfs} = load({fetch:()=>{throw new Error('Must generate, not load attachments');}});
 const files = await prepareSelectedOrderPdfs(selected,'https://example.test/api','token',new AbortController().signal,
  async(order,apiUrl,token)=>{requests.push({order,apiUrl,token});return new File([docs[requests.length-1]],names[requests.length-1],{type:'application/pdf'});});
 assert.equal(files.length,3);
 assert.deepEqual(files.map(file=>file.name),names);
 for(let i=0;i<files.length;i++) {
  const pdf = await PDFDocument.load(await files[i].arrayBuffer());
  assert.equal(pdf.getPageCount(),[2,1,3][i]);
  assert.equal(files[i].type,'application/pdf');
  assert.deepEqual(new Uint8Array(await files[i].arrayBuffer()),docs[i]);
 }
 assert.deepEqual(requests.map(request=>request.order),selected);
 assert.equal(requests[0].token,'token');
});

test('a single generated PDF retains all its bytes', async () => {
 const original = await pdfBytes(2);
 const {prepareSelectedOrderPdfs} = load();
 const [file] = await prepareSelectedOrderPdfs([orders[0]],'api','',new AbortController().signal,async()=>new File([original],'PO#7.pdf',{type:'application/pdf'}));
 assert.equal(file.name,'PO#7.pdf');
 assert.deepEqual(new Uint8Array(await file.arrayBuffer()),original);
});

test('generation errors identify the order and do not share a partial selection', async () => {
 const {prepareSelectedOrderPdfs} = load();
 await assert.rejects(prepareSelectedOrderPdfs(orders,'api','',new AbortController().signal,async()=>{throw new Error('Order unavailable');}),/Store order #7: Order unavailable/);
});

test('a changed selection aborts generation', async () => {
 const controller = new AbortController(); controller.abort();
 let generated=false;
 const {prepareSelectedOrderPdfs}=load();
 await assert.rejects(prepareSelectedOrderPdfs(orders,'api','',controller.signal,async()=>{generated=true;}),{name:'AbortError'});
 assert.equal(generated,false);
});

test('share opens once with three separate PO-named files; cancellation does not download', async () => {
 const file=new File(['%PDF-'],'orders.pdf',{type:'application/pdf'});
 let shared;
 const api=load({navigator:{canShare:()=>true,share:data=>{shared=data;return Promise.resolve();}}});
 const files=[file,new File(['%PDF-'],'PO#2.pdf'),new File(['%PDF-'],'PO#3.pdf')];
 const result=api.shareSelectedOrderPdfs(files);
 assert.deepEqual(shared,{files});
 assert.equal(await result,'shared');
 const cancelled=load({navigator:{canShare:()=>true,share:async()=>{throw new DOMException('cancel','AbortError');}}});
 assert.equal(await cancelled.shareSelectedOrderPdfs([file]),'cancelled');
});

test('unsupported sharing downloads each PDF separately with its PO filename and revokes every URL', async () => {
 const files=['PO#1.pdf','PO#2.pdf','PO#3.pdf'].map(name=>new File(['%PDF-'],name,{type:'application/pdf'}));
 const downloads=[],revoked=[];
 let nextUrl=0;
 const api=load({
  document:{createElement:()=>({click(){downloads.push(this.download);},remove(){}}),body:{appendChild(){}}},
  window:{setTimeout:fn=>fn()},
  URL:{createObjectURL:()=>`blob:pdf-${nextUrl++}`,revokeObjectURL:url=>revoked.push(url)},
 });
 assert.equal(await api.shareSelectedOrderPdfs(files),'downloaded');
 assert.deepEqual(downloads,files.map(file=>file.name));
 assert.deepEqual(revoked,['blob:pdf-0','blob:pdf-1','blob:pdf-2']);
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
    loadRegularOrderPreview:async data=>{loaded=data;return {previewData:{purchaseOrderNo:'PO#AMAN 2692',details:[{barcode:'QR-1'}]}};},
    loadRetailerOrderPreview:async data=>{loaded=data;return {purchaseOrderNo:'PO#SUCCESS 2691',details:[{barcode:'QR-2'}]};},
   };
   throw new Error(name);
  };
  new Function('exports','require','fetch',code)(exports,requireMock,async url=>{
   requested=url;
   return {ok:true,json:async()=>({success:true,data:{id:7,is_stock_order:type==='Stock',favourite_order:{id:10},Stock_order:{id:11}}})};
  });
  const file=await exports.generateSelectedOrderPdf({id:7,orderType:type,orderSource:type==='Store'?'regular':'retailer'},'api','token',new AbortController().signal);
  assert.equal(await file.text(),'%PDF-generated');
  assert.equal(file.name,type==='Store'?'PO#AMAN 2692.pdf':'PO#SUCCESS 2691.pdf');
  assert.equal(file.type,'application/pdf');
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
