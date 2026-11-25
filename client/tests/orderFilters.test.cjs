const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.join(__dirname, '../..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const compile = source => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;

const helpers = {};
new Function('exports', compile(read('server/src/lib/orderFilters.ts')))(helpers);
const {parseOrderFilter, matchesOrderFilter} = helpers;

test('orders API request preserves combined filters and URL-sensitive values', async () => {
 const source = read('client/lib/data.ts');
 const start = source.indexOf('export const getOrders =');
 const code = compile(source.slice(start, source.indexOf('export const getOrderStageCounts', start)));
 const out = {}; let url;
 new Function('exports', 'fetch', 'cookies', 'API_URL', code)(out, async value => { url=value; return {json:async()=>({orders:[]})}; }, async()=>({get:()=>({value:'token'})}), 'https://example.test');
 await out.getOrders({page:2, orderType:'["Sample","Fresh"]', due:'["lt14","shipped"]', stage:'["Pattern","Shipped"]', beader:'["A & B","C, D"]', exhibitionLocation:'Paris & Rome', dateFrom:'2026-11-01', dateTo:'2026-11-16'});
 const params = new URL(url).searchParams;
 for(const [key,value] of Object.entries({page:'2',orderType:'["Sample","Fresh"]',due:'["lt14","shipped"]',stage:'["Pattern","Shipped"]',beader:'["A & B","C, D"]',exhibitionLocation:'Paris & Rome',dateFrom:'2026-11-01',dateTo:'2026-11-16'})) assert.equal(params.get(key),value);
});

test('due and stage filtering precede pagination and determine the total', () => {
 const source = read('server/src/controllers/OrderController.ts');
 const start = source.indexOf('    const stageFilteredOrders =');
 const end = source.indexOf('  }),', start);
 const run = new Function('formattedOrders','stage','due','skip','pageSize','matchesDueFilter','countResult','stageCounts','allStatusCount','res','matchesOrderFilter', compile(source.slice(start,end)));
 const rows = Array.from({length:120},(_,i)=>({id:i+1,orderStatus:i>=50?'Shipped':'Pattern'}));
 for(const [skip, expected] of [[0,50],[50,20]]) {
  let result;
  run(rows,'["Pattern","Shipped"]','shipped',skip,50,(due,status)=>status==='Shipped',{count:120},{},120,{json:value=>result=value}, matchesOrderFilter);
  assert.equal(result.totalCount,70);
  assert.equal(result.orders.length,expected);
  assert.equal(result.orders[0].id,51+skip);
 }
});

test('all dropdowns preserve other filters and clear pagination when applying multiple values', () => {
 const source = read('client/app/(admin-panel)/admin-panel/orders/MultiOrderFilter.tsx');
 const start = source.indexOf('    const next = new URLSearchParams');
 const end = source.indexOf('  };', start);
 const run = new Function('params','filterKey','values','document','setOpen','router','pathname', compile(source.slice(start,end)));
 for (const key of ['orderType','stage','beader','due']) {
  for (const values of [['A & B','C, D'], []]) {
   let url; const document = {};
   run(new URLSearchParams('exhibitionLocation=Paris&dateFrom=2026-11-01&cPage=3'),key,values,document,()=>{}, {push:value=>url=value}, '/admin-panel/orders');
   const params = new URL(url,'https://example.test').searchParams;
   assert.equal(params.get('exhibitionLocation'),'Paris');
   assert.equal(params.get('dateFrom'),'2026-11-01');
   assert.equal(params.has('cPage'),false);
   assert.deepEqual(parseOrderFilter(params.get(key)),values);
   assert.match(document.cookie, values.length ? /Max-Age=31536000/ : /Max-Age=0/);
  }
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
  await run({searchParams:Promise.resolve(params)}, async()=>({get:key=>({value:key === "orders-beader" ? saved : ""})}), url=>{redirected=url;});
  if (expected) {
   const url = new URL(redirected, 'https://example.test');
   assert.equal(url.searchParams.get('beader'), expected);
   assert.equal(url.searchParams.get('due'), 'shipped');
   assert.equal(url.searchParams.has('cPage'), false);
  } else assert.equal(redirected, undefined);
 }
});


test('all four saved filters restore together and explicit clearing wins', async () => {
 const source = read('client/app/(admin-panel)/admin-panel/orders/page.tsx');
 const start = source.indexOf('  const searchParams = await props.searchParams;');
 const end = source.indexOf('  const currentPage', start);
 const run = new Function('props', 'cookies', 'redirect', `return (async () => {${compile(source.slice(start, end))}})()`);
 const saved = {orderType:'["Fresh","Stock"]',stage:'["Pattern","Shipped"]',beader:'["A & B","C, D"]',due:'["lt14","shipped"]'};
 for (const params of [{}, {stage:'',beader:''}]) {
  let url;
  await run({searchParams:Promise.resolve(params)},async()=>({get:key=>({value:saved[key.replace('orders-','')]})}), value=>url=value);
  const restored = new URL(url,'https://example.test').searchParams;
  for (const key of Object.keys(saved)) assert.equal(restored.get(key),params[key] ?? saved[key]);
 }
});

test('filter encoding supports legacy links, commas, ampersands and deduplicates values', () => {
 assert.deepEqual(parseOrderFilter('A, B & C'),['A, B & C']);
 assert.deepEqual(parseOrderFilter('["A, B","C & D","A, B"]'),['A, B','C & D']);
 assert.equal(matchesOrderFilter('["Pattern","Shipped"]','Shipped'),true);
 assert.equal(matchesOrderFilter('["Pattern","Shipped"]','Beading'),false);
 assert.equal(matchesOrderFilter('','Beading'),true);
 assert.equal(read('client/lib/orderFilters.ts'),read('server/src/lib/orderFilters.ts'));
});

test('due selections match any selected bucket with existing boundaries', () => {
 const source = read('server/src/controllers/OrderController.ts');
 const start = source.indexOf('const matchesDueFilter =');
 const end = source.indexOf('const formatQrBoxColor',start);
 const matches = new Function('parseOrderFilter','getDueDateDifference',compile(source.slice(start,end))+';return matchesDueFilter;')(parseOrderFilter,days=>days);
 const due = '["lt14","shipped"]';
 assert.equal(matches(due,'Pattern',13),true);
 assert.equal(matches(due,'Pattern',14),false);
 assert.equal(matches(due,'Shipped',null),true);
 assert.equal(matches('["lt14","lt28"]','Pattern',27),true);
 assert.equal(matches('["lt14","lt28"]','Pattern',28),false);
 assert.equal(matches('','Pattern',null),true);
});

test('mixed regular and retailer order types use both sources and retain beader restriction', () => {
 const source = read('server/src/controllers/OrderController.ts');
 const start = source.indexOf('  const selectedTypes = parseOrderFilter(orderType);');
 const end = source.indexOf('  const mergedParams',start);
 const run = new Function('parseOrderFilter','orderType','includeRetailerOrders','hasBeaderFilter','regularOrdersQuery','retailerOrdersQuery', 'let unionQuery;'+compile(source.slice(start,end))+';return unionQuery;');
 for(const [types,hasBeader,expected] of [
  ['["Sample","Fresh"]',false,'(regular) UNION ALL (retailer)'],
  ['["Fresh","Stock"]',false,'retailer'],
  ['["Sample","Fresh"]',true,'regular'],
  ['',false,'(regular) UNION ALL (retailer)'],
 ]) {
  const query=name=>({andWhere(){return this;},getQuery(){return name;}});
  assert.equal(run(parseOrderFilter,types,true,hasBeader,query('regular'),query('retailer')),expected);
 }
});

test('multi-beader SQL uses bound parameters and matches any selected beader', async () => {
 const source = read('server/src/controllers/OrderController.ts');
 const start = source.indexOf('async function addOrderStylesBeaderFilter(');
 const end = source.indexOf('\n}',start)+2;
 const filter = new Function('parseOrderFilter','ORDER_BEADERS_TABLE','buildResolvedOrderStyleBeaderSql',compile(source.slice(start,end))+';return addOrderStylesBeaderFilter;')(parseOrderFilter,'order_beaders',()=> 'resolved_beader');
 let sql, params;
 const applied = await filter({andWhere:(query,values)=>{sql=query;params=values;}},'o',JSON.stringify(['A & B',"O'Reilly"]));
 assert.equal(applied,true);
 assert.match(sql,/IN \(:\.\.\.beaderFilter\)/);
 assert.deepEqual(params.beaderFilter,['a & b',"o'reilly"]);
 assert.equal(sql.includes("O'Reilly"),false);
});

test('exports bind multiple order types and beaders without dropping either selection', () => {
 const source = read('server/src/controllers/OrderController.ts');
 const start = source.indexOf('    const includeRegular',source.indexOf('function exportProducts('));
 const end = source.indexOf('    appendIdFilter(',start);
 const run = new Function('selectedTypes','beaderFilters','hasBeaderFilter','selectedExportOrders','buildResolvedOrderStyleBeaderSql', 'const regularWhere=[],regularParams=[];'+compile(source.slice(start,end))+';return {includeRegular,includeRetailer,regularWhere,regularParams};');
 const result=run(['Sample','Fresh'],['a & b','sonu'],true,{hasSelection:false},()=> 'resolved_beader');
 assert.equal(result.includeRegular,true);
 assert.equal(result.includeRetailer,false);
 assert.deepEqual(result.regularParams,['Sample','Fresh','a & b','sonu']);
 assert.equal(result.regularWhere.join(' ').match(/\?/g).length,4);
 const mixed=run(['Sample','Fresh','Stock'],[],false,{hasSelection:false},()=> 'resolved_beader');
 assert.equal(mixed.includeRetailer,true);
});
