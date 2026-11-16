const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname,'../src/controllers/CustomerController.ts'),'utf8');
const ast = ts.createSourceFile('customers.ts',source,ts.ScriptTarget.Latest,true);
const routes = {};
function visit(node) {
 if(ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.arguments[0]?.text==='/:id' && ['put','delete'].includes(node.expression.name.text)) routes[node.expression.name.text]=node.arguments[1].arguments[0].getText(ast);
 ts.forEachChild(node,visit);
}
visit(ast);
class Customer {} class Clients {} class Retailer {} class Currency {}
function load(method,db) {
 const js=ts.transpileModule('return '+routes[method],{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText;
 return new Function('db','Customer','Clients','Retailer','Currency','parseStoreLocatorVisibility','assignShippingDetails',js)(db,Customer,Clients,Retailer,Currency,(v,f)=>v??f,()=>{});
}
const response=()=>({statusCode:0,status(n){this.statusCode=n;return this;},json(value){this.body=value;return this;}});
function fixture(fail) {
 let stored={customer:{id:1,name:'Before',client:{id:2},retailer:{id:3},isDeleted:false},client:{id:2},retailer:{id:3}};
 const db={transaction:async fn=>{
  const draft=structuredClone(stored);
  const manager={findOne:async type=>type===Currency?{id:1}:draft.customer,create:(_,data)=>({...data}),
   save:async(type,entity)=>{if(type===Clients&&fail)throw Error('Location failed'); if(type===Customer)draft.customer=entity;else draft.client=entity;},
   update:async(type,id,values)=>{if(type===Clients&&fail)throw Error('Location failed');Object.assign(type===Customer?draft.customer:type===Clients?draft.client:draft.retailer,values);}};
  const result=await fn(manager); stored=draft;return result;
 }};
 return {db,get:()=>stored};
}
test('customer delete rolls back every change when a related update fails',async()=>{
 const f=fixture(true);await assert.rejects(load('delete',f.db)({params:{id:'1'}},response()),/Location failed/);
 assert.equal(f.get().customer.isDeleted,false);
});
test('customer delete commits all related soft deletions',async()=>{
 const f=fixture(false),res=response();await load('delete',f.db)({params:{id:'1'}},res);
 assert.equal(res.body.success,true);for(const name of ['customer','client','retailer'])assert.equal(f.get()[name].isDeleted,true);
});
test('customer edit rolls back when saving its location fails',async()=>{
 const f=fixture(true);await assert.rejects(load('put',f.db)({params:{id:'1'},body:{name:'After',address:'Typed address'}},response()),/Location failed/);
 assert.equal(f.get().customer.name,'Before');
});
test('customer edit saves manual addresses and links the owning client relation',async()=>{
 const f=fixture(false),res=response();await load('put',f.db)({params:{id:'1'},body:{name:'After',storeName:'Store',address:'Typed address',coordinates:{latitude:'',longitude:''}}},res);
 assert.equal(res.body.success,true);assert.equal(f.get().client.address,'Typed address');assert.equal(f.get().client.customer.id,1);assert.equal(f.get().client.latitude,0);
});
