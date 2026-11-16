const assert=require('node:assert/strict');
const {test}=require('node:test');
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),{z}=require('zod');
const source=fs.readFileSync(path.join(__dirname,'../lib/formSchemas.ts'),'utf8');
const ast=ts.createSourceFile('schema.ts',source,ts.ScriptTarget.Latest,true);
let expression;
for(const stmt of ast.statements)if(ts.isVariableStatement(stmt))for(const d of stmt.declarationList.declarations)if(d.name.getText(ast)==='createCustomerFormSchema')expression=d.initializer.getText(ast);
const create=new Function('z','isDisposableEmailDomain',ts.transpileModule('return '+expression,{}).outputText)(z,()=>false);
const legacy={name:'Imported customer',storeName:'Store',website:'',phoneNumber:'',contactPerson:'',email:'',proximity:'1',city_name:'',country_id:''};
test('legacy customers with blank optional details can be edited',()=>assert.equal(create(true).safeParse(legacy).success,true));
test('new customers still require complete details',()=>assert.equal(create(false).safeParse(legacy).success,false));
test('edit rejects malformed emails and incomplete separate shipping details',()=>{
 assert.equal(create(true).safeParse({...legacy,email:'invalid'}).success,false);
 assert.equal(create(true).safeParse({...legacy,sameAsBillingAddress:false}).success,false);
});
