import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,applyCommand} from '../src/domain.js';
import {processScheduledTournaments} from '../server/tournament-scheduler.js';

let seq=0;
function act(s,user,type,payload,now=1000,admin=false){
 return applyCommand(s,{id:user,admin},{id:'free-online-'+(++seq),type,payload},now);
}
function players(){
 let s=initialState();
 for(const id of ['organizer','alice','bob'])s=act(s,id,'register',{name:id},1000,id==='organizer');
 return s;
}
function freeCup(s){
 return act(s,'organizer','tournament_create',{
  name:'Copa gratuita',capacity:4,entry:0,prizeGuarantee:0,
  minRating:0,maxRating:3500,minutes:5,startsAt:2000,cover:'gold',
  isTest:true,sandra:false,requireVerified:false
 },1100,true);
}
function db(initial){
 let state=structuredClone(initial),revision=1;
 return {
  from(table){assert.equal(table,'arena_state');return {select(){return {eq(){return {async single(){return {data:{state:structuredClone(state),revision}}}}}}}}},
  async rpc(name,params){assert.equal(name,'arena_compare_and_swap');if(params.expected_revision!==revision)return {data:false};state=structuredClone(params.next_state);revision++;return {data:true}},
  snapshot(){return structuredClone(state)}
 };
}
test('two human users can join a free tournament without verified financial identity, and its board starts automatically at the deadline',async()=>{
 let s=freeCup(players()),t=s.tournaments[0];
 s=act(s,'alice','tournament_join',{id:t.id},1200);
 s=act(s,'bob','tournament_join',{id:t.id},1300);
 const driver=db(s);await processScheduledTournaments(driver,2100);
 const next=driver.snapshot();
 assert.equal(next.tournaments[0].status,'running');
 assert.equal(next.games.filter(g=>g.tournament===t.id).length,1);
 assert.deepEqual(new Set([next.games[0].white,next.games[0].black]),new Set(['alice','bob']));
 assert.equal(next.tournaments[0].currency,'TEST');
 assert.equal(next.tournaments[0].entry,0);
 for(const id of ['alice','bob'])assert.equal(next.identities?.[id]?.status,undefined);
});
test('unfilled free tournament extends registration for an hour without losing existing players',async()=>{
 let s=freeCup(players()),t=s.tournaments[0];
 s=act(s,'alice','tournament_join',{id:t.id},1200);
 const driver=db(s);await processScheduledTournaments(driver,2500);
 const result=driver.snapshot();
 assert.equal(result.tournaments[0].status,'registration');
 assert.equal(result.tournaments[0].startsAt,2500+3600000);
 assert.deepEqual(result.tournaments[0].players,['alice']);
 assert(result.audit.some(x=>x.action==='free_tournament_registration_extended'));
 await processScheduledTournaments(driver,2501);
 assert.equal(driver.snapshot().tournaments[0].startsAt,2500+3600000);
});
test('automatically scheduled free tournaments never create BRL charges, withdraw money or require KYC',async()=>{
 const driver=db(freeCup(players()));
 await processScheduledTournaments(driver,2500);
 const result=driver.snapshot();
 assert.equal(result.cash,undefined);
 assert.equal(result.tournaments[0].entry,0);
 assert.equal(result.tournaments[0].currency,'TEST');
 assert.equal(result.tournaments[0].status,'registration');
});
