import test from 'node:test';import assert from 'node:assert/strict';
import {createFinanceHandler,allowedFinanceOrigin} from '../server/finance-handler.js';
import {setIdentityKey} from '../server/identity.js';
import {financialActor} from '../server/finance-access.js';
import {initialState} from '../src/domain.js';
import {reconcileWallet,claimPlatformRevenue} from '../server/payments.js';
import {cashBook,cashAccount,beginDeposit,bindCustomer,bindPayment} from '../server/cash-ledger.js';
setIdentityKey('11'.repeat(32));
const id='11111111-1111-4111-8111-111111111111';
const env={ASAAS_ENVIRONMENT:'sandbox',ASAAS_API_KEY:'fixture',ASAAS_WEBHOOK_TOKEN:'w'.repeat(64),ASAAS_WALLET_ENABLED:'true',ASAAS_GAMES_ENABLED:'true'};
function database(state=initialState()){let revision=0;return {get state(){return state;},auth:{getUser:async token=>token==='confirmed'?{data:{user:{id:'a',email:'player@example.org',email_confirmed_at:'2026-01-01'}}}:{data:{user:null},error:{message:'invalid'}}},from(){return {select(){return this;},eq(){return this;},async single(){return {data:{state:structuredClone(state),revision}};}};},async rpc(name,args){if(name==='arena_finance_runtime_update')return {data:null};if(args.expected_revision!==revision)return {data:false};state=structuredClone(args.next_state);revision++;return {data:true};}};}
function service(db,provider={}){return createFinanceHandler({db,load:async()=>({config:{worker:'z'.repeat(64),admin_emails:['admin@example.org']},env}),providerFactory:()=>provider});}
const request=(action,body,headers={})=>new Request('https://fixture.supabase.co/functions/v1/arena-finance?action='+action,{method:body===undefined?'GET':'POST',headers:{'content-type':'application/json',...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});
test('finance handler protects origins, user sessions and scheduled invocation',async()=>{const handler=service(database());assert(allowedFinanceOrigin('https://arena-xadrez.vercel.app'));assert(allowedFinanceOrigin('https://arena-xadrez-abc-xadres.vercel.app'));for(const origin of ['https://evil.test','https://arena-xadrez.vercel.app.evil.test','http://arena-xadrez.vercel.app'])assert(!allowedFinanceOrigin(origin));assert.equal((await handler(request('health',undefined,{origin:'https://evil.test'}))).status,403);const health=await handler(request('health'));assert.equal(health.status,200);assert(!JSON.stringify(await health.json()).includes(env.ASAAS_API_KEY));assert.equal((await handler(request('wallet-summary'))).status,401);assert.equal((await handler(request('reconcile',{}))).status,401);assert.equal((await handler(request('wallet-summary',undefined,{authorization:'Bearer invalid'}))).status,401);});
test('webhook must authenticate before persisting and never credits the supplied payload',async()=>{const s=initialState(),db=database(s),handler=service(db);const body={id:'evt_test',event:'PAYMENT_RECEIVED',payment:{id:'pay_test',value:999999}};assert.equal((await handler(request('asaas-webhook',body))).status,401);assert(!db.state.cash);assert.equal((await handler(request('asaas-webhook',body,{'asaas-access-token':env.ASAAS_WEBHOOK_TOKEN}))).status,200);assert.equal(db.state.cash.sandbox.inbox['event:evt_test'].status,'pending');assert.equal(db.state.cash.sandbox.ledger.length,0);await handler(request('asaas-webhook',body,{'asaas-access-token':env.ASAAS_WEBHOOK_TOKEN}));assert.equal(Object.keys(db.state.cash.sandbox.inbox).length,1);});
test('confirmed users cannot forge identity submission or gain server privileges through a currency flag',async()=>{const s=initialState();s.players.a={id:'a',status:'active',available:0,reserved:0};const db=database(s),handler=service(db);const body={id:'forged',type:'identity_submit',payload:{notice:'arena-trust-v1',cpfHash:'a'.repeat(64),sealed:'fake',documentPath:'fake',selfiePath:'fake'}};assert.equal((await handler(request('command',body,{authorization:'Bearer confirmed'}))).status,403);assert.equal((await handler(request('command',{...body,payload:{...body.payload,currency:'BRL'}},{authorization:'Bearer confirmed'}))).status,400);assert(!db.state.identities);assert.equal(financialActor(s,{id:'a'},{type:'presence',payload:{}},env).server,undefined);});
test('scheduled reconciliation recovers a missed webhook and never sends another provider POST',async()=>{const s=initialState();s.players.a={status:'active'};beginDeposit(s,'sandbox','a',id,2000,1,'PIX');bindCustomer(s,'sandbox',id,'cus_test');bindPayment(s,'sandbox',id,'pay_test');const db=database(s);let gets=0;const provider={getPayment:async()=>{gets++;return {id:'pay_test',externalReference:id,customer:'cus_test',billingType:'PIX',value:20,netValue:19,status:'RECEIVED'};}};const result=await reconcileWallet(db,{env,provider,now:100000});assert.equal(result.checked,1);assert.equal(cashAccount(cashBook(db.state,'sandbox'),'a').available,2000);await reconcileWallet(db,{env,provider,now:200000});assert.equal(gets,1);assert.equal(db.state.cash.sandbox.ledger.length,1);assert.equal(db.state.cash.sandbox.lastReconciliation.at,200000);});
test('ambiguous charge is recovered by GET/reference without retrying creation',async()=>{const s=initialState();beginDeposit(s,'sandbox','a',id,2000,1,'CARD');bindCustomer(s,'sandbox',id,'cus_test');s.cash.sandbox.deposits[id].status='uncertain';const db=database(s),provider={findPayments:async ref=>{assert.equal(ref,id);return {data:[{id:'pay_test',externalReference:id,customer:'cus_test',billingType:'CREDIT_CARD',value:20,netValue:19,status:'RECEIVED'}]};}};await reconcileWallet(db,{env,provider,now:100000});assert.equal(db.state.cash.sandbox.accounts.a.available,2000);assert.equal(db.state.cash.sandbox.deposits[id].paymentId,'pay_test');});
test('administrative revenue excludes provider costs and can only be claimed once into a verified wallet',async()=>{const {seal}=await import('../server/identity.js');const s=initialState();s.players.a={id:'a',status:'active'};s.identities={a:{status:'verified',submittedAt:Date.now(),sealed:seal(JSON.stringify({cpf:'52998224725',name:'Pessoa Teste'})).toString('base64')}};const b=cashBook(s,'sandbox');b.platform={available:1000,claimed:0,ledger:[]};b.processingFees=300;const db=database(s),actor={id:'a',admin:true},input={id,amountCents:600};await claimPlatformRevenue(db,actor,input,{env});assert.equal(db.state.cash.sandbox.platform.available,100);assert.equal(db.state.cash.sandbox.accounts.a.available,600);assert.equal(db.state.cash.sandbox.platform.costsCovered,300);await claimPlatformRevenue(db,actor,input,{env});assert.equal(db.state.cash.sandbox.accounts.a.available,600);await assert.rejects(()=>claimPlatformRevenue(db,actor,{...input,amountCents:500},{env}));await assert.rejects(()=>claimPlatformRevenue(db,{id:'a',admin:false},input,{env}));});
test('webhook provisioning claims its operation once and never repeats an ambiguous provider POST',async()=>{const {registerAsaasWebhook}=await import('../server/payments.js');const db=database();let calls=0;const options={env,endpoint:'https://fixture.supabase.co/functions/v1/arena-finance?action=asaas-webhook',email:'admin@example.org',provider:{createWebhook:async()=>{calls++;throw Error('timeout');}}};await assert.rejects(()=>registerAsaasWebhook(db,options));const second=await registerAsaasWebhook(db,options);assert.equal(calls,1);assert(second.pendingReview);assert.equal(db.state.cash.sandbox.webhookSetup.status,'uncertain');});
test('webhook provisioning records the provider ID and metadata retries do not duplicate it',async()=>{const {registerAsaasWebhook}=await import('../server/payments.js');const db=database();let calls=0;const options={env,endpoint:'https://fixture.supabase.co/functions/v1/arena-finance?action=asaas-webhook',email:'admin@example.org',provider:{createWebhook:async()=>{calls++;return {id:'hook_fixture'};}}};assert((await registerAsaasWebhook(db,options)).registered);assert((await registerAsaasWebhook(db,options)).registered);assert.equal(calls,1);assert.equal(db.state.cash.sandbox.webhookSetup.id,'hook_fixture');});


test('uncertain Asaas webhook is recovered by read-only listing without another POST',async()=>{
 const {registerAsaasWebhook}=await import('../server/payments.js');
 const s=initialState();cashBook(s,'sandbox').webhookSetup={status:'uncertain',at:Date.now()};
 const db=database(s);let reads=0,posts=0;
 const endpoint='https://fixture.supabase.co/functions/v1/arena-finance?action=asaas-webhook';
 const r=await registerAsaasWebhook(db,{env,endpoint,email:'admin@example.org',provider:{
  listWebhooks:async()=>{reads++;return {data:[{id:'wh_match',name:'Arena Xadrez sandbox',url:endpoint,enabled:true,interrupted:false,events:['PAYMENT_RECEIVED','TRANSFER_DONE']}]};},
  createWebhook:async()=>{posts++;throw Error('must not repeat');}
 }});
 assert.equal(r.registered,true);assert.equal(r.recovered,true);assert.equal(reads,1);assert.equal(posts,0);
 assert.equal(db.state.cash.sandbox.webhookSetup.status,'registered');
 assert.equal(db.state.cash.sandbox.webhookSetup.id,'wh_match');
});
test('uncertain webhook with duplicates or unverifiable token configuration remains blocked',async()=>{
 const {registerAsaasWebhook}=await import('../server/payments.js');
 const endpoint='https://fixture.supabase.co/functions/v1/arena-finance?action=asaas-webhook';
 for(const candidates of [[{id:'wh_one',name:'Arena Xadrez sandbox',url:endpoint,enabled:true,events:['PAYMENT_RECEIVED','TRANSFER_DONE']},{id:'wh_two',name:'Arena Xadrez sandbox',url:endpoint,enabled:true,events:['PAYMENT_RECEIVED','TRANSFER_DONE']}],[{id:'wh_unverified',name:'Arena Xadrez sandbox',url:endpoint,enabled:true,events:[]}],[]]){
  const s=initialState();cashBook(s,'sandbox').webhookSetup={status:'uncertain',at:Date.now()};
  const db=database(s);let posts=0;
  const r=await registerAsaasWebhook(db,{env,endpoint,email:'admin@example.org',provider:{listWebhooks:async()=>({data:candidates}),createWebhook:async()=>{posts++;}}});
  assert.equal(r.registered,false);assert.equal(r.pendingReview,true);assert.equal(posts,0);
  assert.equal(db.state.cash.sandbox.webhookSetup.status,'uncertain');
 }
});


test('Asaas webhook URL uses the configured Supabase project, not the incoming request host',async()=>{
 const {financeWebhookEndpoint}=await import('../server/finance-handler.js');
 assert.equal(financeWebhookEndpoint({SUPABASE_URL:'https://kjqovtvhgulwufdzfmif.supabase.co'}),'https://kjqovtvhgulwufdzfmif.supabase.co/functions/v1/arena-finance?action=asaas-webhook');
 for(const bad of ['http://kjqovtvhgulwufdzfmif.supabase.co','https://evil.test','https://kjqovtvhgulwufdzfmif.supabase.co.evil.test']){
  assert.throws(()=>financeWebhookEndpoint({SUPABASE_URL:bad}));
 }
});


test('credited Sandbox deposit is polled for completed refunds and debited exactly once',async()=>{
 const s=initialState();s.players.a={status:'active'};const ref='d0000000-0000-4000-8000-000000000999';
 beginDeposit(s,'sandbox','a',ref,2000,1,'PIX');bindCustomer(s,'sandbox',ref,'cus_test');bindPayment(s,'sandbox',ref,'pay_test');
 const db=database(s);let calls=0;
 const provider={getPayment:async()=>{calls++;return {id:'pay_test',externalReference:ref,customer:'cus_test',billingType:'PIX',value:20,netValue:19,status:'RECEIVED',refunds:calls>=2?[{status:'DONE',value:20}]:[]}}};
 await reconcileWallet(db,{env,provider,now:100000});
 assert.equal(db.state.cash.sandbox.accounts.a.available,2000);
 await reconcileWallet(db,{env,provider,now:100100});
 assert.equal(calls,1);
 const result=await reconcileWallet(db,{env,provider,now:3700000});
 assert.equal(result.checked,1);
 assert.equal(db.state.cash.sandbox.accounts.a.available,0);
 assert.equal(db.state.cash.sandbox.deposits[ref].status,'refunded');
 assert.equal(db.state.cash.sandbox.deposits[ref].reversed,true);
 await reconcileWallet(db,{env,provider,now:7400000});
 assert.equal(calls,2);
 assert.equal(db.state.cash.sandbox.ledger.filter(v=>v.type==='deposit_refund').length,1);
});


test('reconciliation confirms a refunded payment using the Asaas refunds listing',async()=>{
 const s=initialState(),ref='d0000000-0000-4000-8000-000000000998';
 beginDeposit(s,'sandbox','a',ref,1000,1,'PIX');bindCustomer(s,'sandbox',ref,'cus_test');bindPayment(s,'sandbox',ref,'pay_test');
 const db=database(s);
 const provider={getPayment:async()=>({id:'pay_test',externalReference:ref,customer:'cus_test',billingType:'PIX',value:10,netValue:9.01,status:'RECEIVED'}),listPaymentRefunds:async()=>({data:[{status:'CANCELLED',value:10},{status:'DONE',value:10}]})};
 await reconcileWallet(db,{env,provider,now:100000});
 assert.equal(db.state.cash.sandbox.accounts.a.available,1000);
 const r=await reconcileWallet(db,{env,provider,now:3700000});
 assert.equal(r.checked,1);assert.equal(r.errors,0);
 assert.equal(db.state.cash.sandbox.accounts.a.available,0);
 assert.equal(db.state.cash.sandbox.deposits[ref].reversed,true);
 assert.equal(db.state.cash.sandbox.ledger.filter(v=>v.type==='deposit_refund').length,1);
});
