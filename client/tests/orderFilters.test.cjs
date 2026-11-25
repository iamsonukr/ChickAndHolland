const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.join(__dirname, '../..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const compile = source => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;

test('orders API request preserves combined filters and URL-sensitive values', async () => {
 const source = read('client/lib/data.ts');
 const start = source.indexOf('export const getOrders =');
 const code = compile(source.slice(start, source.indexOf('export const getOrderStageCounts', start)));
 const out = {}; let url;
 new Function('exports', 'fetch', 'cookies', 'API_URL', code)(out, async value => { url=value; return {json:async()=>({orders:[]})}; }, async()=>({get:()=>({value:'token'})}), 'https://example.test');
 await out.getOrders({page:2, due:'shipped', stage:'Shipped', beader:'A & B', exhibitionLocation:'Paris & Rome', dateFrom:'2026-11-01', dateTo:'2026-11-16'});
 const params = new URL(url).searchParams;
 for(const [key,value] of Object.entries({page:'2',due:'shipped',stage:'Shipped',beader:'A & B',exhibitionLocation:'Paris & Rome',dateFrom:'2026-11-01',dateTo:'2026-11-16'})) assert.equal(params.get(key),value);
});

test('due and stage filtering precede pagination and determine the total', () => {
 const source = read('server/src/controllers/OrderController.ts');
 const start = source.indexOf('    const stageFilteredOrders =');
 const end = source.indexOf('  }),', start);
 const run = new Function('formattedOrders','stage','due','skip','pageSize','matchesDueFilter','countResult','stageCounts','allStatusCount','res', compile(source.slice(start,end)));
 const rows = Array.from({length:120},(_,i)=>({id:i+1,orderStatus:i>=50?'Shipped':'Pattern'}));
 for(const [skip, expected] of [[0,50],[50,20]]) {
  let result;
  run(rows,'Shipped','shipped',skip,50,(due,status)=>status==='Shipped',{count:120},{},120,{json:value=>result=value});
  assert.equal(result.totalCount,70);
  assert.equal(result.orders.length,expected);
  assert.equal(result.orders[0].id,51+skip);
 }
});

test('stage and beader changes retain exhibition location and reset pagination', () => {
 for(const name of ['StageFilter','BeaderFilter']) {
  const source = read('client/app/(admin-panel)/admin-panel/orders/'+name+'.tsx');
  const start=source.indexOf('    for (const key of');
  const end=source.indexOf('    const nextSearch',start);
  const params = new URLSearchParams('stage=Pattern');
  new Function('params','searchParams',compile(source.slice(start,end)))(params,new URLSearchParams('exhibitionLocation=Paris&dateFrom=2026-11-01&cPage=3'));
  assert.equal(params.get('exhibitionLocation'),'Paris');
  assert.equal(params.get('dateFrom'),'2026-11-01');
  assert.equal(params.has('cPage'),false);
 }
});

test('exports apply exhibition and estimate/invoice search to both order sources', () => {
 const source=read('server/src/controllers/OrderController.ts');
 const start=source.indexOf('    const regularWhere =',source.indexOf('function exportProducts('));
 const end=source.indexOf('    const includeRegular',start);
 const run=new Function('dateFrom','dateTo','exhibitionLocation','likeQuery','sanitizeText',compile(source.slice(start,end)+'\nreturn {regularWhere,regularParams,retailerWhere,retailerParams};'));
 const result=run('2026-11-01','2026-11-16','Paris','%INV-123%',value=>value.trim());
 for(const prefix of ['regular','retailer']) {
  const conditions=result[prefix+'Where'].join(' AND ');
  const values=result[prefix+'Params'];
  assert.match(conditions,/exhibitionLocation/);
  assert.match(conditions,/estimateNo/);
  assert.match(conditions,/invoiceNo/);
  assert.equal((conditions.match(/\?/g)||[]).length,values.length);
  assert.deepEqual(values,['%Paris%','2026-11-01','2026-11-16',...Array(5).fill('%INV-123%')]);
 }
});

test('saved beader is restored on return while explicit selection or clearing wins', async () => {
 const source = read('client/app/(admin-panel)/admin-panel/orders/page.tsx');
 const start = source.indexOf('  const searchParams = await props.searchParams;');
 const end = source.indexOf('  const currentPage', start);
 const run = new Function('props', 'cookies', 'redirect', `return (async () => {${compile(source.slice(start, end))}})()`);
 for (const [params, saved, expected] of [
  [{due:'shipped', cPage:'3'}, 'A & B', 'A & B'],
  [{beader:'SONU'}, 'A & B', null],
  [{beader:''}, 'A & B', null],
  [{}, '', null],
 ]) {
  let redirected;
  await run({searchParams:Promise.resolve(params)}, async()=>({get:()=>({value:saved})}), url=>{redirected=url;});
  if (expected) {
   const url = new URL(redirected, 'https://example.test');
   assert.equal(url.searchParams.get('beader'), expected);
   assert.equal(url.searchParams.get('due'), 'shipped');
   assert.equal(url.searchParams.has('cPage'), false);
  } else assert.equal(redirected, undefined);
 }
});
