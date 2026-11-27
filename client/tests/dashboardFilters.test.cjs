const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const read = file => fs.readFileSync(path.join(__dirname,'../..',file),'utf8');
const compile = text => ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;

test('dashboard orders and quantity use identical selected dates, including empty results', async () => {
 const source = read('client/app/(admin-panel)/admin-panel/page.tsx');
 const begin = source.indexOf('  const params = await searchParams;');
 const end = source.indexOf('  return (',source.indexOf('  const dashboardData',begin));
 const body=compile(source.slice(begin,end)+'\nreturn dashboardData;');
 const run=new Function('searchParams','getDashboardData','getOrderStageCounts','formatDateParam',`return (async()=>{${body}})();`);
 for(const [from,to,quantity] of [['2026-11-01','2026-11-26',12],['2026-11-26','2026-11-26',0],['2026-11-26','2026-11-01',12]]) {
  let dates;
  const result=await run(Promise.resolve({startDate:from,endDate:to}),async(start,end)=>{dates=[start,end];return {total:{orders:quantity ? 3 : 0}};},async filters=>{
   assert.deepEqual(filters,{dateFrom:[from,to].sort()[0],dateTo:[from,to].sort()[1]});
   assert.deepEqual(dates,[filters.dateFrom,filters.dateTo]);
   return {allStatusCount:quantity};
  },date=>date.toISOString().slice(0,10));
  assert.equal(result.total.total_quantity,quantity);
  assert.equal(result.total.orders,quantity ? 3 : 0);
 }
});

function analyticsHandler() {
 const source=read('server/src/controllers/AnalyticsController.ts');
 const start=source.indexOf('    const { startDate, endDate } = req.query;',source.indexOf('router.get(\n  "/dashboard"'));
 const end=source.indexOf('\n  }),',start);
 return new Function('req','res','db','retailerOrderQuantitySql','buildRegularOrderStyleTotalSql',`return (async()=>{${compile(source.slice(start,end))}})();`);
}

test('order analytics include the full end day while customer counting keeps its previous range', async () => {
 const queries=[];let result;
 await analyticsHandler()({query:{startDate:'2026-11-26',endDate:'2026-11-26'}},{json:value=>result=value},{query:async(sql,params)=>{queries.push({sql,params});return [];}},()=> 'ro.quantity',()=> 'os.quantity');
 const filtered=queries.filter(query=>query.params);
 assert.equal(filtered.length,3);
 assert.equal(result.salesByCurrency,undefined);
 for(const {sql,params} of filtered) {
  const customerQuery = sql.match(/SELECT COUNT\(DISTINCT buyer_id\)[\s\S]*?AS customers,/);
  if (customerQuery) {
   assert.equal((customerQuery[0].match(/BETWEEN \? AND \?/g)||[]).length,2);
  }
  assert.doesNotMatch(sql.replace(customerQuery?.[0] || '', ''),/BETWEEN/);
  const ranges=[...sql.matchAll(/orderReceivedDate >= \? AND \w+\.orderReceivedDate < DATE_ADD\(\?, INTERVAL 1 DAY\)/g)];
  assert.equal(ranges.length * 2 + (customerQuery ? 4 : 0),params.length);
  assert.ok(params.every(date=>date==='2026-11-26'));
 }
 assert.match(filtered[1].sql,/COUNT\(\*\) AS order_count/);
 assert.doesNotMatch(filtered[1].sql,/JOIN orderStyles|SUM\(os.quantity\)/);
 assert.equal(result.success,true);
});

test('analytics rejects reversed or invalid dates before querying the database', async () => {
 for(const query of [{startDate:'2026-11-27',endDate:'2026-11-26'},{startDate:'2026-02-30',endDate:'2026-11-26'},{startDate:'bad',endDate:'2026-11-26'},{}]) {
  let status;
  const res={status:value=>{status=value;return res;},json:()=>{}};
  await analyticsHandler()({query},res,{query:()=>assert.fail('Invalid range must not query database')});
  assert.equal(status,400);
 }
});

test('custom date changes apply once and keep reversed endpoints on the selected day', () => {
 const source=read('client/app/(admin-panel)/admin-panel/DateRangeForm.tsx');
 const start=source.indexOf('  const onDateSelect =');
 const end=source.indexOf('  const selectedPreset',start);
 const run=new Function('startDate','endDate','setStartDate','setEndDate','setIsStartOpen','setIsEndOpen','updateURL',compile(source.slice(start,end))+';return onDateSelect;');
 for(const isStart of [true,false]) {
  const date=new Date(isStart?'2026-11-30T00:00:00':'2026-10-01T00:00:00');
  const calls=[];
  run(new Date('2026-11-01T00:00:00'),new Date('2026-11-26T00:00:00'),()=>{},()=>{},()=>{},()=>{},(...values)=>calls.push(values))(date,isStart);
  assert.equal(calls.length,1);
  assert.deepEqual(calls[0],[date,date]);
 }
 assert.doesNotMatch(source,/setTimeout/);
 assert.match(source,/\[startDateValue, endDateValue\]/);
});
