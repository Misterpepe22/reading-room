const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const originalScript=html.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(originalScript);
function element(){return {classList:{add(){},remove(){},toggle(){}},style:{},dataset:{},isConnected:true,addEventListener(){},setAttribute(){},getAttribute(){return null},querySelector(){return null},querySelectorAll(){return []},appendChild(){},focus(){},remove(){},getClientRects(){return [{}]}}}
function harness(publicKey,initial={}){
 const values=new Map(Object.entries(initial)),els=new Map(),alerts=[],fetches=[],history=[];
 const doc={readyState:'loading',documentElement:element(),body:element(),head:element(),addEventListener(){},getElementById(id){if(!els.has(id))els.set(id,element());return els.get(id)},querySelector(){return element()},querySelectorAll(){return []},createElement(){return element()}};
 const context={crypto:webcrypto,TextEncoder,TextDecoder,Uint8Array,Uint32Array,ArrayBuffer,Blob,Response,DecompressionStream,CompressionStream,URL,URLSearchParams,AbortSignal,Date,console,btoa,atob,document:doc,location:{search:'',hash:'',pathname:'/reading-room/'},history:{replaceState(...args){history.push(args)}},localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},alert:m=>alerts.push(m),prompt:()=>context.input,fetch:async url=>{fetches.push(url);return context.response||{ok:false,status:404}},setTimeout:()=>0,clearTimeout(){},requestAnimationFrame:()=>1,MutationObserver:class{observe(){}},navigator:{}};
 context.window=context;context.window.addEventListener=()=>{};
 let script=originalScript;
 if(publicKey)script=script.replace(/const INBOX_PUB='[^']+'/,'const INBOX_PUB='+JSON.stringify(publicKey));
 script=script.replace('return {filter,ui,_t:{rid,seal,S,META,removed,patches}};',`return {filter,ui,_t:{rid,seal,S,META,removed,patches,buildUrl,rememberOpened,confirmBatch,pend,stateText,remoteControl,view:()=>({url,pasteMode,sendBlob,sendBody,urlItems,buildError}),setBar:()=>{barEl=document.createElement('div');fabEl=document.createElement('button');bar();return barEl}}};`);
 script=script.replace('if(document.readyState===', 'globalThis.testHooks={marksInit,onLoad,shortTitle};\nif(document.readyState===');
 vm.createContext(context);vm.runInContext(script,context);
 return {context,values,alerts,fetches,history,hooks:context.testHooks};
}
(async()=>{
 const keypair=await webcrypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveBits']);
 const pub=Buffer.from(await webcrypto.subtle.exportKey('spki',keypair.publicKey)).toString('base64');
 const h=harness(pub);const fl=await h.hooks.marksInit('0'.repeat(64));const t=fl._t;
 // End-to-end cryptographic compatibility, with a synthetic inbox key and no real password.
 const payload={v:1,k:'test-patch-key',rm:[],sg:[],rq:[{text:'Prueba áé日🙂',at:123}]};
 const box=Buffer.from(await t.seal(payload),'base64url');assert.equal(box[0],4);
 const ep=await webcrypto.subtle.importKey('raw',box.subarray(0,65),{name:'ECDH',namedCurve:'P-256'},false,[]);
 const shared=await webcrypto.subtle.deriveBits({name:'ECDH',public:ep},keypair.privateKey,256);
 const hk=await webcrypto.subtle.importKey('raw',shared,'HKDF',false,['deriveKey']);
 const key=await webcrypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt:new TextEncoder().encode('rr-inbox/v1'),info:box.subarray(0,65)},hk,{name:'AES-GCM',length:256},false,['decrypt']);
 const compressed=await webcrypto.subtle.decrypt({name:'AES-GCM',iv:box.subarray(65,77)},key,box.subarray(77));
 const decoded=await new Response(new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
 assert.deepEqual(JSON.parse(decoded),payload);console.log('PASS ECDH/HKDF/AES-GCM/gzip envelope round trip');
 const ikm=await webcrypto.subtle.importKey('raw',new Uint8Array(32),'HKDF',false,['deriveKey']);
 const idKey=await webcrypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt:new TextEncoder().encode('reading-room/v2'),info:new TextEncoder().encode('flag-id')},ikm,{name:'HMAC',hash:'SHA-256',length:256},false,['sign']);
 const expected=Buffer.from(await webcrypto.subtle.sign('HMAC',idKey,new TextEncoder().encode('https://x.com/example/status/123'))).toString('hex').slice(0,16);
 assert.equal(await t.rid({link:'https://x.com/example/status/123/?tracking=1'}),expected);console.log('PASS post ID compatibility');
 t.S.rq.a={at:123,text:'Busca retratos',topics:[],quick:[]};await t.buildUrl();let view=t.view();
 assert(view.url.length<=6200);assert.match(view.sendBody,/rr-box:v1:[A-Za-z0-9_-]{100,}:end\n/);assert.equal(view.pasteMode,false);
 t.rememberOpened();assert.equal(t.S.rq.a.sent,undefined);assert(t.S.rq.a.opened);assert.equal(t.pend().rq.length,1);let ticket=t.S.rq.a.opened;
 const persisted=JSON.parse(h.values.get('rr_marks_v1'));assert(persisted.rq.a.opened);assert.equal(persisted.rq.a.sent,undefined);
 console.log('PASS open GitHub does not confirm publication; pending state persists');
 h.context.input='https://github.com/Misterpepe22/reading-room/issues/99';h.context.response={ok:true,json:async()=>({state:'open',user:{id:171266247},body:'wrong batch'})};await t.confirmBatch(ticket);assert.equal(t.S.rq.a.sent,undefined);
 h.context.response={ok:true,json:async()=>({state:'closed',user:{id:171266247},body:view.sendBody})};await t.confirmBatch(ticket);assert.equal(t.S.rq.a.sent,undefined);
 h.context.response={ok:true,json:async()=>({state:'open',user:{id:5},body:view.sendBody})};await t.confirmBatch(ticket);assert.equal(t.S.rq.a.sent,undefined);
 h.context.response={ok:true,json:async()=>({state:'open',user:{id:171266247},body:view.sendBody})};await t.confirmBatch(ticket);assert(t.S.rq.a.sent);assert.equal(t.S.rq.a.issue,h.context.input);assert.equal(t.pend().rq.length,0);assert.match(t.remoteControl(t.S.rq.a),/Cancel on GitHub/);
 console.log('PASS confirmation validates repository, owner, issue state and exact encrypted batch');
 const big=webcrypto.getRandomValues(new Uint8Array(22000));t.S.sg.large={at:456,n:7,t:'A long title',text:Buffer.from(big).toString('base64')+'🙂日á'.repeat(100),quick:[]};await t.buildUrl();view=t.view();assert.equal(view.pasteMode,true);assert(view.url.length<=6200);assert(!view.url.includes('&body='));assert(view.sendBody.length>6200);console.log('PASS oversize single request has encrypted paste fallback and short URL');
 const bar=t.setBar();assert.equal(bar.hidden,false);delete t.S.rq.a;delete t.S.sg.large;assert.equal(t.setBar().hidden,true);console.log('PASS empty list bar state');
 const legacy=harness(pub,{'rr_marks_v1':JSON.stringify({rm:{id:{sent:Date.now()-20*864e5,at:1}},sg:{},rq:{}})});const old=(await legacy.hooks.marksInit('0'.repeat(64)))._t;assert(old.S.rm.id.legacySent);assert(old.S.rm.id.sent);console.log('PASS legacy submissions retained and labelled unverified');
 const corrupt=harness(pub,{'rr_marks_v1':'null'});await corrupt.hooks.marksInit('0'.repeat(64));console.log('PASS malformed local state recovery');
 const clean=harness(pub);clean.context.location.search='?staticrypt_pwd=bad&remember_me&filter=x';clean.context.location.hash='#p10';await clean.hooks.onLoad();assert.equal(clean.history[0][2],'/reading-room/?filter=x#p10');assert.equal(clean.fetches.length,0);console.log('PASS credential URL sanitized before decrypt/fetch');
 const logout=harness(pub,{'staticrypt_passphrase':'synthetic','staticrypt_expiration':'invalid'});await logout.hooks.onLoad();assert.equal(logout.values.has('staticrypt_passphrase'),false);console.log('PASS invalid expiry clears saved access');
 assert(h.hooks.shortTitle({title:'A photorealistic cinematic portrait of a woman beside a carousel'}).length<90);console.log('PASS display title does not alter source record');
 assert(html.includes('.rr-bar[hidden]'));assert(html.includes("w.setAttribute('aria-modal','true')"));assert(html.includes('w.showModal()'));assert(html.includes('autocomplete="current-password"'));console.log('PASS accessibility markup and hidden CSS checks');
})().catch(e=>{console.error(e);process.exitCode=1});
