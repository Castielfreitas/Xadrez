import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {setIdentityKey,identityPayload,unseal,seal} from '../server/identity.js';
import {initialState,applyCommand,publicState} from '../src/domain.js';
import {TRUST_NOTICE,precheckIdentity} from '../src/trust.js';
import {COUNTRY_CODES,identityAccess} from '../src/identity-access.js';
import {createDeposit,createWithdrawal,transferCash,walletSummary} from '../server/payments.js';
import {cashBook,cashAccount} from '../server/cash-ledger.js';
import {createTrustUI} from '../src/trust-ui.js';
import {createPaymentsUI} from '../src/payments-ui.js';
setIdentityKey('e1'.repeat(32));
const now=Date.now(),notice=TRUST_NOTICE;
const raw={name:'Synthetic Foreign Player',documentType:'passport',documentNumber:'TEST-AB123',issuingCountry:'PT',residenceCountry:'PT',birthDate:'1990-01-01',documentExpiry:'2030-01-01',notice};
let sequence=0;
function command(state,id,type,payload,flags={}){return applyCommand(state,{id,...flags},{id:'international-'+(++sequence),type,payload},now);}
function verified(){let s=initialState();for(const id of ['foreign','domestic','admin'])s=command(s,id,'register',{name:'Synthetic '+id});const p=identityPayload(raw,now);s=command(s,'foreign','identity_submit',{...p,documentPath:'private/doc',selfiePath:'private/selfie'},{server:true});s=command(s,'admin','identity_review',{user:'foreign',status:'verified',reason:'Synthetic passport evidence reviewed in this test.'},{admin:true});s.identities.domestic={status:'verified',submittedAt:now,sealed:seal(JSON.stringify({cpf:'52998224725',name:'Synthetic Domestic'})).toString('base64')};for(const id of ['foreign','domestic','admin'])cashAccount(cashBook(s,'sandbox'),id).available=10000;return s;}
function database(state){let revision=0;return {get state(){return state;},from(){return {select(){return this;},eq(){return this;},async single(){return {data:{state:structuredClone(state),revision}};}};},async rpc(_,args){if(args.expected_revision!==revision)return {data:false};state=structuredClone(args.next_state);revision++;return {data:true};}};}
const env={ASAAS_ENVIRONMENT:'sandbox',ASAAS_API_KEY:'fixture',ASAAS_WEBHOOK_TOKEN:'w'.repeat(64),ASAAS_WALLET_ENABLED:'true',ASAAS_GAMES_ENABLED:'true'};
const operation='11111111-1111-4111-8111-111111111111';
test('passport payload authenticates encrypted identity and scopes document hash to issuing country',()=>{
 const a=identityPayload(raw,now),b=identityPayload({...raw,documentNumber:'testab123'},now),c=identityPayload({...raw,issuingCountry:'US'},now);
 assert.equal(COUNTRY_CODES.length,249);assert.equal(new Set(COUNTRY_CODES).size,249);
 assert.equal(a.cpfHash,undefined);assert.match(a.documentHash,/^[a-f0-9]{64}$/);assert.equal(a.documentHash,b.documentHash);assert.notEqual(a.documentHash,c.documentHash);assert.notEqual(a.sealed,b.sealed);
 assert.equal(JSON.parse(unseal(a.sealed)).documentNumber,'TESTAB123');assert.equal(a.documentType,'passport');assert.equal(a.residenceCountry,'PT');assert(!JSON.stringify(a).includes('TESTAB123'));
});
test('invalid passport countries, expired/impossible dates, minor identity and missing consent are rejected',()=>{
 for(const patch of [{residenceCountry:'XX'},{issuingCountry:'ZZ'},{documentExpiry:'2020-01-01'},{documentExpiry:'2030-02-30'},{documentNumber:'<script>'},{documentType:'other'},{birthDate:'2020-01-01'},{notice:'wrong'}])assert.throws(()=>identityPayload({...raw,...patch},now));
 const cpf=identityPayload({name:'Synthetic CPF Holder',cpf:'52998224725',birthDate:'1990-01-01',notice},now);assert.match(cpf.cpfHash,/^[a-f0-9]{64}$/);assert.equal(cpf.documentType,'cpf');assert.equal(identityAccess({...cpf,status:'verified',submittedAt:now},now).financiallyEligible,true);
});
test('passport manual approval remains separate from financial availability and exposes no document numbers, hashes or evidence paths',()=>{
 const s=verified(),record=s.identities.foreign;assert.equal(record.status,'verified');assert.equal(precheckIdentity(record,now).complete,true);assert.equal(identityAccess(record,now).identityVerified,true);assert.equal(identityAccess(record,now).financiallyEligible,false);
 assert.equal(identityAccess(record,Date.parse('2030-01-02')).identityVerified,false);
 const own=publicState(s,'foreign'),other=publicState(s,'domestic'),admin=publicState(s,'admin',true);
 assert.equal(own.identity.documentType,'passport');assert.equal(other.identity.documentType,'cpf');assert.equal(other.identityReviews,undefined);assert.equal(admin.identityReviews.find(r=>r.user==='foreign').documentType,'passport');
 for(const view of [own,other,admin]){const text=JSON.stringify(view);for(const secret of [record.documentHash,record.sealed,'private/doc','TESTAB123'])assert(!text.includes(secret));}
});
test('passport user can play free online while BRL search and tournament entry cannot reserve money',()=>{
 let s=verified();s.settings.requireIntegrityConsent=false;
 s=command(s,'foreign','quick_match',{minutes:5,stake:0,autoStart:true});s=command(s,'domestic','quick_match',{minutes:5,stake:0,autoStart:true});assert.equal(s.games.at(-1).status,'playing');
 const paid=verified(),snapshot=structuredClone(paid),flags={server:true,cashEnabled:true,cashEnvironment:'sandbox'};
 assert.throws(()=>command(paid,'foreign','quick_match',{minutes:5,stake:1000,currency:'BRL'},flags),/sem CPF/);assert.deepEqual(paid,snapshot);
 paid.tournaments.push({id:'t',currency:'BRL',paymentEnvironment:'sandbox',entry:1000,startsAt:now+60000,status:'registration',players:[],capacity:4});const before=structuredClone(paid);
 assert.throws(()=>command(paid,'foreign','tournament_join',{id:'t'},flags),/sem CPF/);assert.deepEqual(paid,before);
});
test('direct financial requests reject unsupported identity before any provider call or ledger mutation',async()=>{
 const db=database(verified()),before=structuredClone(db.state),actor={id:'foreign',email:'fixture@example.invalid'};let calls=0;
 const provider=new Proxy({},{get(){return async()=>{calls++;throw Error('Provider must not be called');};}});
 for(const method of ['CARD','PIX'])await assert.rejects(()=>createDeposit(db,actor,{id:operation,amountCents:1000,method,consent:'arena-payments-v1'},{env,provider}),/sem CPF/);
 for(const method of ['TED','PIX'])await assert.rejects(()=>createWithdrawal(db,actor,{id:operation,amountCents:1000,method,consent:'arena-payments-v1'},{env}),/sem CPF/);
 for(const [from,to]of [['foreign','domestic'],['domestic','foreign']])await assert.rejects(()=>transferCash(db,{id:from},{id:operation,to,amountCents:1000,consent:'arena-payments-v1'},{env}),/sem CPF/);
 assert.equal(calls,0);assert.deepEqual(db.state,before);
 const summary=walletSummary(db.state,actor,env);assert.equal(summary.identityVerified,true);assert.equal(summary.financiallyEligible,false);assert.deepEqual(summary.depositMethods,[]);assert.deepEqual(summary.payoutMethods,[]);assert.equal(summary.internationalPayouts,false);assert.equal(summary.internationalSetup,undefined);
 assert.equal(walletSummary(db.state,{id:'admin',admin:true},env).internationalSetup.providerConfigured,false);
 assert.equal(walletSummary(db.state,{id:'domestic'},env).financiallyEligible,true);
});
test('identity form switches document requirements without requesting CPF for passport submission',async()=>{
 const {window}=parseHTML('<html><body><dialog id="modal"></dialog></body></html>'),old=globalThis.document;globalThis.document=window.document;
 try{const calls=[],ui=createTrustUI({state:()=>({settings:{},games:[]}),actor:()=>({id:'foreign'}),config:()=>({trustConfigured:true}),modal:html=>{document.querySelector('#modal').innerHTML=html;},send:async()=>true,request:async(...args)=>calls.push(args),render:()=>{},esc:String,name:String,toast:()=>{}});ui.identityForm();const form=document.querySelector('#identity-form'),select=form.querySelector('[name="documentType"]');select.querySelector('[value="cpf"]').removeAttribute('selected');select.querySelector('[value="passport"]').setAttribute('selected','');select.dispatchEvent(new window.Event('change'));
 assert(form.querySelector('[data-identity-document="cpf"]').disabled);assert(!form.querySelector('[data-identity-document="passport"]').disabled);assert.equal(form.querySelector('#identity-document-label').textContent,'Página do passaporte com foto e dados');assert.match(form.textContent,/sem CPF ainda não estão disponíveis/);assert.equal(form.querySelector('[name="issuingCountry"]').querySelectorAll('option').length,250);assert.equal(calls.length,0);
 }finally{globalThis.document=old;}
});
test('wallet keeps passport approval visible but disables unsupported financial actions',()=>{
 const {window}=parseHTML('<html><body><div id="wallet"></div></body></html>'),old=globalThis.document,interval=globalThis.setInterval;globalThis.document=window.document;globalThis.setInterval=()=>0;
 try{const ui=createPaymentsUI({actor:()=>({id:'foreign'}),config:()=>({configured:false}),request:async()=>{},modal:()=>{},esc:String,toast:()=>{}});ui.updateSummary(walletSummary(verified(),{id:'foreign'},env));document.querySelector('#wallet').innerHTML=ui.render();for(const action of ['deposit','withdraw','transfer'])assert(document.querySelector('[data-payment="'+action+'"]').disabled);assert.match(document.querySelector('#wallet').textContent,/sem CPF ainda não estão disponíveis/);assert.doesNotMatch(document.querySelector('#wallet').textContent,/Seu saldo em reais pode ser usado/);
 }finally{globalThis.document=old;globalThis.setInterval=interval;}
});
test('authenticated identity API uploads encrypted passport evidence, supports admin review and returns accurate wallet capabilities',async()=>{
 const {createFinanceHandler}=await import('../server/finance-handler.js'),{readFile}=await import('node:fs/promises');
 let s=initialState();for(const id of ['foreign','admin'])s=command(s,id,'register',{name:'Synthetic '+id});const db=database(s),files=new Map();
 db.auth={getUser:async token=>['foreign','admin'].includes(token)?{data:{user:{id:token,email:token+'@example.invalid',email_confirmed_at:'2026-01-01'}}}:{data:{user:null},error:{}}};
 db.storage={createBucket:async()=>({error:null}),getBucket:async()=>({data:{public:false}}),from:()=>({upload:async(path,data)=>{files.set(path,Buffer.from(data));return {error:null};},remove:async()=>({error:null}),download:async path=>({data:new Blob([files.get(path)])})})};
 const handler=createFinanceHandler({db,load:async()=>({env,config:{admin_emails:['admin@example.invalid']}}),providerFactory:()=>({})});
 const call=(actor,action,body)=>handler(new Request('https://fixture.supabase.co/functions/v1/arena-finance?action='+action,{method:body?'POST':'GET',headers:{authorization:'Bearer '+actor,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}));
 const jpeg=(await readFile(new URL('avatar-fixture.txt',import.meta.url),'utf8')).trim(),image='data:image/jpeg;base64,'+jpeg;
 const submitted=await call('foreign','identity-submit',{...raw,document:image,selfie:image});assert.equal(submitted.status,200);
 const response=await submitted.json();assert.equal(response.state.identity.status,'pending');assert.equal(response.state.identity.documentType,'passport');assert.equal(files.size,2);for(const bytes of files.values())assert.equal(unseal(bytes).toString('base64'),jpeg);
 const privateResponse=await call('foreign','trust-evidence&user=foreign&kind=identity');assert.equal(privateResponse.status,403);
 const evidence=await call('admin','trust-evidence&user=foreign&kind=identity');assert.equal(evidence.status,200);assert.equal((await evidence.json()).details.documentNumber,'TESTAB123');
 const reviewed=await call('admin','command',{id:'review-passport-api',type:'identity_review',payload:{user:'foreign',status:'verified',reason:'Synthetic passport and selfie reviewed in test.'}});assert.equal(reviewed.status,200);assert.equal(db.state.identities.foreign.status,'verified');
 const wallet=await call('foreign','wallet-summary'),capabilities=await wallet.json();assert.equal(wallet.status,200);assert.equal(capabilities.identityVerified,true);assert.equal(capabilities.financiallyEligible,false);assert.equal(capabilities.internationalPayouts,false);assert(!JSON.stringify(capabilities).includes('TESTAB123'));assert(db.state.audit.some(e=>e.action==='identity_review'));
});
