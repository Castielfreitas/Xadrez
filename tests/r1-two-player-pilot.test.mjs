import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,applyCommand} from '../src/domain.js';
import {cashBook,cashAccount,beginDeposit,bindCustomer,bindPayment,settleDeposit} from '../server/cash-ledger.js';

/*
 * Fully isolated and SIMULATED accounting pilot. Never connects to Asaas, user
 * identities, authentication, Supabase, live accounts or production ledgers.
 * The actual monetary pilot must pass provider KYC/approval before activation.
 */
const at=Date.now();
const owner={id:'pilot-admin',admin:true,server:true,cashEnabled:true,cashEnvironment:'sandbox'};
const guest={id:'pilot-guest',server:true,cashEnabled:true,cashEnvironment:'sandbox'};
const paymentRef=(suffix)=>'a0000000-0000-4000-8000-0000000000'+suffix;
let commandSeq=0;
const action=(s,actor,type,payload={},when=at)=>applyCommand(s,actor,{id:paymentRef(String(++commandSeq).padStart(2,'0')),type,payload},when);
function pilot(){
 let s=initialState();
 s.settings.analysisEnabled=true;
 s.settings.autoSettlement=false;
 s.settings.requireIdentityForStake=true;
 for(const [id,name] of [[owner.id,'Admin teste'],[guest.id,'Participante teste']]){
  s.players[id]={id,name,rating:1200,status:'active',available:0,reserved:0,ratingVerified:false,joinedAt:at};
  // Synthetic sealed marker only exists inside this in-memory test fixture.
  s.identities??={};
  s.identities[id]={status:'verified',sealed:'test-fixture-not-a-real-id',submittedAt:at};
 }
 const b=cashBook(s,'sandbox');
 for(const [i,actor] of [owner,guest].entries()){
  const reference=paymentRef(String(i+50).padStart(2,'0'));
  const paymentId='pay_fixture_'+i,customerId='cus_fixture_'+i;
  beginDeposit(s,'sandbox',actor.id,reference,100,at+i*31000,'PIX');
  bindCustomer(s,'sandbox',reference,customerId);
  bindPayment(s,'sandbox',reference,paymentId);
  const confirmed={id:paymentId,externalReference:reference,customer:customerId,billingType:'PIX',status:'RECEIVED',value:1,netValue:0.95};
  assert.equal(settleDeposit(s,'sandbox',confirmed,at+i*31000+1000),true);
  assert.equal(settleDeposit(s,'sandbox',confirmed,at+i*31000+1000),true);
  assert.equal(cashAccount(b,actor.id).available,100);
 }
 const tournamentId=paymentRef('70');
 s=action(s,owner,'tournament_create',{name:'Copa R$1 — SIMULAÇÃO ISOLADA',capacity:2,entry:100,prizeGuarantee:100,economics:'fixed',minutes:5,minRating:0,maxRating:3500,startsAt:at+3600000,sandra:false,currency:'BRL'},at+100);
 assert.equal(s.tournaments.length,1);
 assert.equal(s.tournaments[0].currency,'BRL');
 for(const actor of [owner,guest])s=action(s,actor,'tournament_join',{id:s.tournaments[0].id},at+200);
 return s;
}
test('two simulated R$1 PIX deposits credit each pilot player once, with independent balance and reserved tournament entry',()=>{
 const s=pilot(),b=cashBook(s,'sandbox');
 for(const actor of [owner,guest]){assert.equal(cashAccount(b,actor.id).available,0);assert.equal(cashAccount(b,actor.id).reserved,100);}
 assert.equal(b.ledger.filter(x=>x.type==='deposit').length,2);
 assert.equal(b.ledger.filter(x=>x.type==='tournament_hold').length,2);
 assert.throws(()=>action(s,guest,'tournament_join',{id:s.tournaments[0].id},at+250),/Inscrição já realizada/);
});
test('pilot administrator cancellation restores both R$1 entry holds without external Pix refund or duplicate balance',()=>{
 let s=pilot();const id=s.tournaments[0].id;
 s=action(s,owner,'tournament_cancel',{id},at+300);
 assert.equal(s.tournaments[0].status,'cancelled');
 assert.equal(s.tournaments[0].cancelReason,'cancelled_by_organizer');
 for(const actor of [owner,guest]){const a=cashAccount(cashBook(s,'sandbox'),actor.id);assert.equal(a.available,100);assert.equal(a.reserved,0);}
 assert.equal(cashBook(s,'sandbox').ledger.filter(x=>x.type==='tournament_release').length,2);
});
test('pilot tournament results preserve R$2 escrow and pay R$1 prize plus R$1 gross platform revenue exactly once',()=>{
 let s=pilot(),id=s.tournaments[0].id;
 s=action(s,owner,'tournament_start',{id},at+3600001);
 assert.equal(s.tournaments[0].status,'running');
 const game=s.games.find(g=>g.tournament===id);
 assert(game);
 for(const actor of [owner,guest])s=action(s,actor,'game_accept',{id:game.id},at+3600010);
 assert.equal(s.games.find(g=>g.id===game.id).status,'playing');
 s=action(s,guest,'resign',{id:game.id},at+3600050);
 s=action(s,owner,'approve_result',{id:game.id},at+3600100);
 assert.equal(s.tournaments[0].status,'finished');
 assert.equal(s.tournaments[0].winner,owner.id);
 const b=cashBook(s,'sandbox');
 assert.equal(cashAccount(b,owner.id).available,100);
 assert.equal(cashAccount(b,guest.id).available,0);
 assert.equal(cashAccount(b,owner.id).reserved,0);
 assert.equal(cashAccount(b,guest.id).reserved,0);
 assert.equal(b.platform.available,100);
 assert.equal(b.platform.ledger.filter(x=>x.reference===id).length,1);
 assert.equal(b.ledger.filter(x=>x.type==='tournament_prize').length,1);
 assert.throws(()=>action(s,owner,'approve_result',{id:game.id},at+3600110),/aguardando homologação/i);
});
