import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initialState,applyCommand,publicState} from '../src/domain.js';
import {TRUST_NOTICE,precheckIdentity} from '../src/trust.js';
const ui=readFileSync(new URL('../src/trust-ui.js',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../public/style.css',import.meta.url),'utf8');
let id=0;const run=(state,user,type,payload,flags={})=>applyCommand(state,{id:user,admin:user==='admin',...flags},{id:'admin-review-'+(++id),type,payload},1000+id);
const fixture={cpfHash:'b'.repeat(64),sealed:'encrypted_fixture',documentPath:'private/doc',selfiePath:'private/selfie',notice:TRUST_NOTICE};
function state(){
 let s=initialState();
 for(const user of ['admin','one','two'])s=run(s,user,'register',{name:'Jogador '+user});
 s=run(s,'one','identity_submit',fixture,{server:true});
 s=run(s,'two','identity_submit',{...fixture,cpfHash:'c'.repeat(64)},{server:true});
 return s;
}
test('automatic screening validates completeness but never grants financial identity',()=>{
 let s=state();
 s=run(s,'admin','identity_screening_toggle',{enabled:true});
 assert.equal(s.settings.identityAutoScreening,true);
 assert.equal(s.identities.one.status,'pending');
 assert.equal(s.identities.one.screening,'complete');
 assert.equal(precheckIdentity({cpfHash:'bad',sealed:'x'},3000).complete,false);
 s=run(s,'admin','identity_screening_toggle',{enabled:false});
 assert.equal(s.settings.identityAutoScreening,false);
 assert.throws(()=>run(s,'one','identity_screening_toggle',{enabled:true}),/administração/);
});
test('screening new identity requests does not promote them to verified',()=>{
 let s=initialState();s=run(s,'admin','register',{name:'Administrador'});
 s=run(s,'one','register',{name:'Jogador Teste'});
 s=run(s,'admin','identity_screening_toggle',{enabled:true});
 s=run(s,'one','identity_submit',fixture,{server:true});
 assert.equal(s.identities.one.screening,'complete');
 assert.equal(s.identities.one.status,'pending');
});
test('approved identities move out of the pending list, and non-admin responses have no review queue',()=>{
 let s=state();
 s=run(s,'admin','identity_review',{user:'one',status:'verified',reason:'Conferência manual concluída com os documentos.'});
 const adminView=publicState(s,'admin',true),userView=publicState(s,'two',false);
 assert.equal(adminView.identityReviews.filter(r=>r.status==='verified').length,1);
 assert.equal(adminView.identityReviews.filter(r=>r.status==='pending').length,1);
 assert.equal(userView.identityReviews,undefined);
 assert.equal(userView.identities,undefined);
 assert.equal(adminView.identityReviews.find(r=>r.user==='one').screening,null);
});
test('admin workbench includes three tabs, selection, approve-all action, and secure evidence review',()=>{
 assert.match(ui,/identityTab\(next\)/);
 assert.match(ui,/Novos \/ Pendentes/);
 assert.match(ui,/Aprovados/);
 assert.match(ui,/Rejeitados/);
 assert.match(ui,/data-action="identity-select-all"/);
 assert.match(ui,/data-action="identity-approve-selected"/);
 assert.match(ui,/data-identity-select=/);
 assert.match(ui,/inspectedIdentityUsers\.has\(r\.user\)/);
 assert.match(ui,/if\(form\.id==='identity-batch-form'\)/);
 assert.match(app,/trust\.identityTab\(button\.dataset\.status\)/);
 assert.match(app,/identity_screening_toggle/);
 assert.match(css,/\.identity-tabs/);
});
test('bulk selections never approve without viewing evidence in the current session',()=>{
 assert.match(ui,/inspectedIdentityUsers\.add\(user\);modal/);
 assert.match(ui,/Abra e confira CPF, documento e selfie/);
 assert.match(ui,/Aprovar/);
 assert.match(ui,/identity_review/);
 assert.doesNotMatch(ui,/identity_bulk_approve_unchecked/);
});

test('administrator own pending identity is selectable individually and by select-all',async()=>{const {parseHTML}=await import('linkedom');const {createTrustUI}=await import('../src/trust-ui.js');const old=globalThis.document;const {document}=parseHTML('<html><body><span id="identity-selected-count"></span></body></html>');globalThis.document=document;try{const s={identityReviews:[{user:'admin',status:'pending',submittedAt:1}],settings:{},games:[]};const panel=createTrustUI({state:()=>s,actor:()=>({id:'admin',admin:true}),config:()=>({}),modal:()=>{},send:async()=>true,request:async()=>({}),render:()=>{},esc:String,name:String,toast:()=>{}});const markup=panel.adminPanel();assert.match(markup,/data-identity-select="admin"/);assert.doesNotMatch(markup,/disabled title="Outra pessoa/);panel.selectIdentity('admin',true);assert.equal(document.querySelector('#identity-selected-count').textContent,'1');panel.selectIdentity('admin',false);panel.selectAllIdentities();assert.match(panel.adminPanel(),/id="identity-selected-count">1/);}finally{globalThis.document=old;}});
