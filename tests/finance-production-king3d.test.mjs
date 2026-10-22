import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initialState} from '../src/domain.js';
import {cashBook,cashAccount,beginDeposit,bindCustomer,bindPayment,settleDeposit} from '../server/cash-ledger.js';
import {productionReadiness} from '../server/finance-handler.js';

test('checkmate modal reuses actual photoreal 3D king sprite, not unicode chess symbols',()=>{
 const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
 const styles=readFileSync(new URL('../public/style.css',import.meta.url),'utf8');
 assert.match(app,/king-result-piece/);
 assert.match(app,/pieceSVG\(\{color:outcome.kind==='win'\?'w':'b',type:'k'\}\)/);
 assert.match(styles,/\.result-card \.king-result-piece \.piece-real/);
 assert.doesNotMatch(app,/outcome\.kind==='win'\?'♔'/);
});

test('provider completed refunds reverse an already credited Pix deposit exactly once even with RECEIVED payment',()=>{
 const s=initialState(),id='a0000000-0000-4000-8000-000000000981',now=Date.now();
 const b=cashBook(s,'sandbox');
 beginDeposit(s,'sandbox','player',id,100,now);
 bindCustomer(s,'sandbox',id,'cus_fixture_1');
 bindPayment(s,'sandbox',id,'pay_fixture_1');
 const p={id:'pay_fixture_1',externalReference:id,customer:'cus_fixture_1',billingType:'PIX',value:1,netValue:.95,status:'RECEIVED'};
 settleDeposit(s,'sandbox',p,now);
 assert.equal(cashAccount(b,'player').available,100);
 const refunded={...p,refunds:[{status:'CANCELLED',value:1},{status:'DONE',value:1}]};
 settleDeposit(s,'sandbox',refunded,now+100);
 settleDeposit(s,'sandbox',refunded,now+300);
 assert.equal(cashAccount(b,'player').available,0);
 assert.equal(b.deposits[id].status,'refunded');
 assert.equal(b.deposits[id].reversed,true);
 assert.equal(b.ledger.filter(e=>e.type==='deposit_refund').length,1);
});

test('a refunded charge is never credited even if the provider still reports RECEIVED',()=>{
 const s=initialState(),id='a0000000-0000-4000-8000-000000000982',now=Date.now();
 const b=cashBook(s,'sandbox');
 beginDeposit(s,'sandbox','player',id,100,now);
 bindCustomer(s,'sandbox',id,'cus_fixture_2');
 bindPayment(s,'sandbox',id,'pay_fixture_2');
 settleDeposit(s,'sandbox',{id:'pay_fixture_2',externalReference:id,customer:'cus_fixture_2',billingType:'PIX',value:1,netValue:.95,status:'RECEIVED',refunds:[{status:'DONE',value:1}]},now);
 assert.equal(cashAccount(b,'player').available,0);
 assert.equal(b.deposits[id].reversed,true);
 assert.equal(b.ledger.filter(e=>e.type==='deposit').length,0);
});

test('partial refunds freeze the account for review rather than silently crediting extra balance',()=>{
 const s=initialState(),id='a0000000-0000-4000-8000-000000000983',now=Date.now();
 const b=cashBook(s,'sandbox');
 beginDeposit(s,'sandbox','player',id,200,now);
 bindCustomer(s,'sandbox',id,'cus_fixture_3');
 bindPayment(s,'sandbox',id,'pay_fixture_3');
 settleDeposit(s,'sandbox',{id:'pay_fixture_3',externalReference:id,customer:'cus_fixture_3',billingType:'PIX',value:2,netValue:1.94,status:'RECEIVED'},now);
 settleDeposit(s,'sandbox',{id:'pay_fixture_3',externalReference:id,customer:'cus_fixture_3',billingType:'PIX',value:2,netValue:1.94,status:'RECEIVED',refunds:[{status:'DONE',value:1}]},now+50);
 assert.equal(b.accounts.player.frozen,true);
 assert.equal(b.deposits[id].status,'review');
});

test('readiness blocks production activation without model approval, prod token, webhook and two verified players',()=>{
 const now=Date.now(),s=initialState(),base={
  credentialsConfigured:true,environment:'sandbox',apiKeyConfigured:true,webhookConfigured:true,
  identityConfigured:true,businessModelApproved:false,productionAuthorized:false,paymentsEnabled:false
 };
 const config={webhook_registered:true,webhook_setup_status:'registered',last_worker_at:new Date(now).toISOString(),last_worker_status:'ok'};
 s.settings.analysisEnabled=true;
 let check=productionReadiness(s,config,base,{ASAAS_API_KEY:'$aact_hmlg_fixture'},now);
 assert.equal(check.ready,false);
 assert.equal(check.verifiedPilotPlayers,0);
 assert.equal(check.checks.production_environment,false);
 assert.equal(check.checks.business_model_approved,false);
 const prod={...base,environment:'production',businessModelApproved:true,productionAuthorized:true};
 for(const user of ['a','b']){s.players[user]={status:'active'};s.identities??={};s.identities[user]={status:'verified',sealed:'opaque_fixture',submittedAt:now};}
 check=productionReadiness(s,config,prod,{ASAAS_API_KEY:'$aact_prod_fixture'},now);
 assert.equal(check.ready,true);
 assert.equal(check.verifiedPilotPlayers,2);
 assert.equal(check.financialOperationsEnabled,false);
});
