import {setIdentityKey} from '../server/identity.js';
setIdentityKey('11'.repeat(32));
import test from 'node:test';import assert from 'node:assert/strict';
import {initialState,applyCommand,publicState,SANDRA} from '../src/domain.js';
import {cashBook,cashAccount} from '../server/cash-ledger.js';import {computerCashOffer} from '../src/computer-cash.js';
import {financialActor} from '../server/finance-access.js';
const now=Date.now();let serial=0;
const actor=id=>({id,server:true,cashEnabled:true,cashEnvironment:'sandbox',admin:id==='admin'});
const cmd=(s,id,type,payload={})=>applyCommand(s,actor(id),{id:'computer-cash-'+(++serial),type,payload},now);
function setup(){let s=initialState();for(const u of ['admin','alice','bob']){s=cmd(s,u,'register',{name:'Pessoa '+u});s.identities??={};s.identities[u]={status:'verified',sealed:'encrypted-fixture',submittedAt:now};cashAccount(cashBook(s,'sandbox'),u).available=10000;}s.settings.sandraCashChallenges=true;s.settings.autoSettlement=true;s=cmd(s,'admin','sandra_fund',{currency:'BRL',amount:3000});return s;}
const match={currency:'BRL',stake:1000,minutes:5,increment:0,botConsent:true};
test('computer bankroll is funded from the admin real wallet and public offer only exposes the available entry cap',()=>{
 const s=setup();assert.equal(s.cash.sandbox.accounts.admin.available,7000);assert.equal(s.cash.sandbox.accounts[SANDRA].available,3000);assert.equal(s.players[SANDRA].available,0);
 assert.deepEqual(computerCashOffer(s,'sandbox'),{enabled:true,busy:false,maxStakeCents:3000});assert.equal(publicState(s,'alice').cash,undefined);
 s.cash.sandbox.accounts[SANDRA].frozen=true;assert.equal(computerCashOffer(s,'sandbox').maxStakeCents,0);
 assert.throws(()=>cmd(s,'alice','sandra_fund',{currency:'BRL',amount:100}),/administração/);
});
test('paid computer option is admin controlled and rejects missing consent, insufficient or frozen funds and sandbox money substitution atomically',()=>{
 const s=setup();for(const mutate of [v=>v.settings.sandraCashChallenges=false,v=>v.cash.sandbox.accounts[SANDRA].available=999,v=>v.cash.sandbox.accounts.alice.available=999,v=>v.cash.sandbox.accounts[SANDRA].frozen=true,v=>v.identities.admin.status='pending',v=>v.identities.alice.status='pending']){
  const copy=structuredClone(s);mutate(copy);const original=structuredClone(copy);assert.throws(()=>cmd(copy,'alice','sandra_match',match));assert.deepEqual(copy,original);
 }
 assert.throws(()=>cmd(s,'alice','sandra_match',{...match,botConsent:false}),/Confirme/);assert.throws(()=>cmd(s,'alice','sandra_match',{...match,stake:0}),/Entrada/);
 const noCash=structuredClone(s);noCash.cash.sandbox.accounts[SANDRA].available=0;noCash.players[SANDRA].available=999999;assert.throws(()=>cmd(noCash,'alice','sandra_match',match),/limite/);
});
test('paid computer reserves both sides once, refuses a competing match and keeps holds through draws',()=>{
 let s=cmd(setup(),'alice','sandra_match',match);const g=s.games.at(-1);assert.equal(g.currency,'BRL');assert.equal(g.rated,false);assert.equal(s.cash.sandbox.accounts.alice.reserved,1000);assert.equal(s.cash.sandbox.accounts[SANDRA].reserved,1000);
 assert.equal(computerCashOffer(s,'sandbox').busy,true);assert.equal(computerCashOffer(s,'sandbox').maxStakeCents,2000);assert.throws(()=>cmd(s,'bob','sandra_match',match),/andamento/);
 s=cmd(s,'alice','game_accept',{id:g.id});s=cmd(s,'alice','draw',{id:g.id});s=cmd(s,SANDRA,'draw',{id:g.id});assert.equal(s.games.at(-1).rematches,1);assert.equal(s.cash.sandbox.accounts[SANDRA].reserved,1000);assert.equal(s.cash.sandbox.accounts.alice.reserved,1000);
});
test('human or computer victory credits only the covered prize and commission, exactly once, without changing human ratings',()=>{
 for(const humanWins of [true,false]){let s=cmd(setup(),'alice','sandra_match',match);const id=s.games.at(-1).id;s=cmd(s,'alice','game_accept',{id});s=cmd(s,humanWins?SANDRA:'alice','resign',{id});
  assert.equal(s.games.at(-1).status,'finished');assert.equal(s.cash.sandbox.accounts.alice.available,humanWins?10800:9000);assert.equal(s.cash.sandbox.accounts[SANDRA].available,humanWins?2000:3800);assert.equal(s.cash.sandbox.platform.available,200);assert.equal(s.cash.sandbox.accounts.alice.reserved,0);assert.equal(s.cash.sandbox.accounts[SANDRA].reserved,0);assert.equal(s.players.alice.rating,1200);
  s=cmd(s,'alice','presence');assert.equal(s.cash.sandbox.platform.available,200);assert.equal(s.cash.sandbox.ledger.filter(e=>e.type==='match_prize').length,1);
 }
});
test('forged paid computer context cannot bypass finance activation or fair-play analysis',()=>{
 const s=setup();assert.throws(()=>applyCommand(s,{id:'alice'},{id:'forged',type:'sandra_match',payload:match},now),/ativação/);
 const env={ASAAS_ENVIRONMENT:'sandbox',ASAAS_API_KEY:'fixture',ASAAS_WEBHOOK_TOKEN:'w'.repeat(64),ASAAS_WALLET_ENABLED:'true',ASAAS_GAMES_ENABLED:'true'};
 assert.throws(()=>financialActor(s,{id:'alice'},{type:'sandra_match',payload:match},{...env,ASAAS_GAMES_ENABLED:'false'}),/liberação/);
 assert.throws(()=>financialActor(s,{id:'alice'},{type:'sandra_match',payload:match},env),/análise/);
 s.settings.analysisEnabled=true;assert.equal(financialActor(s,{id:'alice'},{type:'sandra_match',payload:match},env).cashEnabled,true);
});
test('simultaneous requests cannot overspend the computer bankroll or reserve two active matches',async()=>{
 const {cashTransaction}=await import('../server/payments.js');let state=setup(),revision=0;
 const db={from(){return {select(){return this;},eq(){return this;},async single(){return {data:{state:structuredClone(state),revision}};}};},async rpc(_,args){if(args.expected_revision!==revision)return {data:false};state=structuredClone(args.next_state);revision++;return {data:true};}};
 const results=await Promise.allSettled(['alice','bob'].map(user=>cashTransaction(db,s=>{Object.assign(s,cmd(s,user,'sandra_match',match));})));
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(state.games.length,1);assert.equal(state.cash.sandbox.accounts[SANDRA].reserved,1000);assert.equal(state.cash.sandbox.accounts[SANDRA].available,2000);
});
test('aborting an unaccepted computer game returns both original BRL holds once',()=>{
 let s=cmd(setup(),'alice','sandra_match',match);const id=s.games.at(-1).id;s=applyCommand(s,actor('alice'),{id:'abort',type:'game_abort',payload:{id}},now+91000);
 assert.equal(s.cash.sandbox.accounts.alice.available,10000);assert.equal(s.cash.sandbox.accounts[SANDRA].available,3000);assert.equal(s.cash.sandbox.accounts[SANDRA].reserved,0);assert.throws(()=>cmd(s,'alice','game_abort',{id}));
});
test('admin can retrieve only spendable computer funds while keeping an active table reservation intact',()=>{
 let s=cmd(setup(),'alice','sandra_match',match);s=cmd(s,'admin','sandra_cash_return',{currency:'BRL',amount:1500});assert.equal(s.cash.sandbox.accounts.admin.available,8500);assert.equal(s.cash.sandbox.accounts[SANDRA].available,500);assert.equal(s.cash.sandbox.accounts[SANDRA].reserved,1000);
 assert.throws(()=>cmd(s,'admin','sandra_cash_return',{currency:'BRL',amount:501}),/Saldo/);assert.throws(()=>cmd(s,'alice','sandra_cash_return',{currency:'BRL',amount:100}),/administração/);assert.equal(computerCashOffer(s,'sandbox').maxStakeCents,500);
});
test('computer entry cap follows its real spendable balance even above the human quick-search default',()=>{
 let s=setup();s.cash.sandbox.accounts.alice.available=500000;s.cash.sandbox.accounts[SANDRA].available=400000;assert.equal(computerCashOffer(s,'sandbox').maxStakeCents,400000);
 s=cmd(s,'alice','sandra_match',{...match,stake:400000});assert.equal(s.cash.sandbox.accounts[SANDRA].reserved,400000);assert.equal(s.cash.sandbox.accounts[SANDRA].available,0);assert.equal(s.cash.sandbox.accounts.alice.reserved,400000);
});
