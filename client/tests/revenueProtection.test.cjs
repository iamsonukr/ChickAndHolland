const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'../..',p),'utf8');
const compile=s=>ts.transpileModule(s,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText;
function revenue() {
 const source=read('server/src/controllers/AnalyticsController.ts');
 const start=source.indexOf('  res.setHeader("Cache-Control", "no-store");',source.indexOf('router.post("/revenue-summary"'));
 const end=source.indexOf('\n}));',start);
 const run=new Function('req','res','revenueAttempts','getRevenuePasswordHash','verifyRevenuePassword','db','buildRegularOrderStyleTotalSql','getRevenueSession','unlockRevenueSession',`return (async()=>{${compile(source.slice(start,end))}})()`);
 return async({password='secret',hash='hash',attempts=new Map(),valid=true,sessionExpiry=null}={})=>{
  let status=200,body,queried=false;
  const res={setHeader(){},status(s){status=s;return res;},json(b){body=b;return b;}};
  await run({headers:{authorization:'Bearer login-token'},body:{password,startDate:'2026-11-01',endDate:'2026-11-27'},adminUser:{id:1}},res,attempts,async()=>hash,async()=>valid,{query:async(sql,params)=>{queried=true;assert.deepEqual(params,['2026-11-01','2026-11-27','2026-11-01','2026-11-27']);return [{currencyId:1,currencyCode:'USD',totalSales:123,orderCount:2}];}},()=> 'os.totalPrice',async()=>sessionExpiry,async()=>Date.now()+60000);
  return {status,body,queried};
 };
}
test('revenue is withheld until configured and correct password supplied',async()=>{
 const run=revenue();
 for(const options of [{hash:null},{valid:false},{password:undefined,valid:false}]) {
  const result=await run(options);assert.equal(result.queried,false);assert.equal(result.body.salesByCurrency,undefined);
 }
 const result=await run();assert.equal(result.status,200);assert.equal(result.body.salesByCurrency[0].totalSales,123);
});
test('revenue password guessing is rate limited',async()=>{
 const run=revenue(),attempts=new Map();
 for(let i=0;i<5;i++) assert.equal((await run({valid:false,attempts})).status,401);
 const result=await run({attempts});assert.equal(result.status,429);assert.equal(result.queried,false);
});
test('authorized reset accepts a new password without a login password and rejects mismatches',async()=>{
 const source=read('server/src/controllers/AdminSettingsController.ts');
 const start=source.indexOf('  const { newPassword, confirmPassword }',source.indexOf('router.put("/revenue-password"'));
 const end=source.indexOf('\n}));',start);
 const run=new Function('req','res','updateRevenuePassword',`return (async()=>{${compile(source.slice(start,end))}})()`);
 for(const [body,expected] of [[{newPassword:'1',confirmPassword:'1'},200],[{newPassword:'1',confirmPassword:'2'},400],[{},400]]) {
  let updated=false,status=200;const res={status:s=>{status=s;return res;},json(){}};
  await run({body},res,async value=>{assert.equal(value,'1');updated=true;});
  assert.equal(status,expected);assert.equal(updated,expected===200);
 }
 const form=read('client/app/(admin-panel)/admin-panel/settings/ChangeRevenuePasswordForm.tsx');
 assert.doesNotMatch(form,/currentPassword|Your Login Password/);
});

test('revenue password reset uses the existing settings permission policy', () => {
 const source=read('server/src/controllers/AdminSettingsController.ts');
 assert.match(source,/router\.put\("\/revenue-password", requireAdminUser\(SETTINGS_PERMISSION_ROUTES\)/);
 const start=source.indexOf('const SETTINGS_PERMISSION_ROUTES =');
 const end=source.indexOf(';',start);
 const permissions=new Function(compile(source.slice(start,end))+';return SETTINGS_PERMISSION_ROUTES;')();
 assert.ok(permissions.includes('/admin-panel/users'));
 assert.ok(permissions.includes('/admin-panel/user-roles'));
 assert.ok(permissions.includes('/admin-panel/settings'));
 assert.equal(permissions.includes('/admin-panel/'),false);
});

test('revenue passwords accept short and long values without bcrypt truncation',async()=>{
 const source=read('server/src/services/resetPassword.service.ts');
 const start=source.indexOf('const revenuePasswordInput');
 const exports={};let stored;
 new Function('exports','createHash','bcrypt','ensureAdminSettingsTable','CONFIG','db','TABLE_NAMES','encryptRevenuePassword',compile(source.slice(start)))(exports,require('node:crypto').createHash,require('../../server/node_modules/bcrypt'),async()=>{},{SALT_ROUNDS:4},{query:async(sql,args)=>{stored=args[1];}},{ADMIN_SETTINGS:'admin_settings'},value=>'encrypted:'+value);
 for(const password of ['1','','a'.repeat(100)+'X','?????']) {
  await exports.updateRevenuePassword(password);
  assert.equal(await exports.verifyRevenuePassword(password,stored),true);
  assert.equal(await exports.verifyRevenuePassword(password+'wrong',stored),false);
 }
 const bcrypt=require('../../server/node_modules/bcrypt');
 assert.equal(await exports.verifyRevenuePassword('old',await bcrypt.hash('old',4)),true);
});


test('an unlocked login session loads new date ranges without the revenue password', async()=>{
 const result=await revenue()({password:null,valid:false,hash:null,sessionExpiry:Date.now()+60000});
 assert.equal(result.status,200);assert.equal(result.queried,true);assert.ok(result.body.expiresAt>Date.now());
 const locked=await revenue()({password:null});
 assert.equal(locked.status,401);assert.equal(locked.queried,false);
});

test('unlock persists for the login token until explicit lock or JWT expiration', async()=>{
 const source=read('server/src/services/revenueSession.service.ts');
 const jwt=require('../../server/node_modules/jsonwebtoken');
 const rows=new Map();
 const database={query:async(sql,args)=>{
  if(sql.startsWith('SELECT')) return rows.has(args[0])?[{settingValue:rows.get(args[0])}]:[];
  if(sql.startsWith('INSERT')) rows.set(args[0],args[1]);
  if(sql.startsWith('DELETE')&&sql.includes('settingKey = ?')) rows.delete(args[0]);
  return [];
 }};
 const load=()=>{
  const exports={};
  new Function('exports','require',compile(source))(exports,name=>{
   if(name==='crypto') return require('node:crypto');
   if(name==='jsonwebtoken') return {default:jwt};
   if(name==='../config') return {default:{JWT_SECRET:'test-secret'}};
   if(name==='../db') return {default:database};
   if(name==='../constants') return {TABLE_NAMES:{ADMIN_SETTINGS:'admin_settings'}};
   if(name==='./resetPassword.service') return {ensureAdminSettingsTable:async()=>{}};
   throw new Error(name);
  });return exports;
 };
 const token=jwt.sign({type:'USER',id:1},'test-secret',{expiresIn:60});
 const other=jwt.sign({type:'USER',id:1,jti:'other-login'},'test-secret',{expiresIn:60});
 const api=load();
 assert.equal(await api.getRevenueSession(token),null);
 const expiresAt=await api.unlockRevenueSession(token);
 assert.equal(expiresAt,jwt.decode(token).exp*1000);
 assert.equal(await load().getRevenueSession(token),expiresAt);
 assert.equal(await api.getRevenueSession(other),null);
 await api.lockRevenueSession(token);
 assert.equal(await api.getRevenueSession(token),null);
 const expired=jwt.sign({type:'USER',id:1},'test-secret',{expiresIn:-1});
 await assert.rejects(api.getRevenueSession(expired),{name:'TokenExpiredError'});
});


test('saved revenue password display is encrypted and detects tampering',()=>{
 const exports={};
 new Function('exports','require',compile(read('server/src/lib/revenuePasswordDisplay.ts')))(exports,name=>{
  if(name==='crypto') return require('node:crypto');
  if(name==='../config') return {default:{JWT_SECRET:'test-secret'}};
  throw new Error(name);
 });
 for(const value of ['', '1', 'long password '.repeat(20)]) {
  const encrypted=exports.encryptRevenuePassword(value);
  assert.notEqual(encrypted,value);
  assert.equal(exports.decryptRevenuePassword(encrypted),value);
  const parts=encrypted.split('.');parts[1]=Buffer.alloc(16).toString('base64');
  assert.throws(()=>exports.decryptRevenuePassword(parts.join('.')));
 }
 const source=read('server/src/controllers/AdminSettingsController.ts');
 assert.match(source,/router.get\("\/revenue-password", requireAdminUser\(SETTINGS_PERMISSION_ROUTES\)/);
});

test('revenue eye toggles the password field and Unlock button as one box',()=>{
 const source=read('client/app/(admin-panel)/admin-panel/RevenueSummary.tsx');
 const code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 for(const visible of [false,true]) {
  let index=0,toggled;
  const exports={};
  const jsx=(type,props)=>({type,props});
  new Function('exports','require',code)(exports,name=>{
   if(name==='react/jsx-runtime') return {jsx,jsxs:jsx,Fragment:'fragment'};
   if(name==='react') return {useEffect(){},useState(initial){const current=index++;return [current===1?visible:initial===true?false:initial,current===1?fn=>{toggled=fn(visible);}:()=>{}];}};
   if(name==='lucide-react') return {Eye:'eye',EyeOff:'eye-off'};
   if(name==='@/lib/constants') return {API_URL:'api'};
   if(name==='@/lib/utils') return {getCookie:()=>''};
   return new Proxy({}, {get:(_,key)=>String(key)});
  });
  const tree=exports.default({dateRange:{startDate:'2026-11-01',endDate:'2026-11-27'}});
  const nodes=[];function walk(node){if(!node||typeof node!=='object')return;if(Array.isArray(node)){node.forEach(walk);return;}nodes.push(node);walk(node.props?.children);}walk(tree);
  assert.equal(nodes.some(n=>n.type==='form'),visible);
  assert.equal(nodes.some(n=>n.props?.['aria-label']==='Revenue Summary password'),visible);
  assert.equal(nodes.some(n=>n.props?.type==='submit'),visible);
  const eye=nodes.find(n=>n.props?.['aria-controls']==='revenue-password-box');
  assert.equal(eye.props['aria-expanded'],visible);eye.props.onClick();assert.equal(toggled,!visible);
 }
});
