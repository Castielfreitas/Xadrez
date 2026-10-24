import test from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {initialState,applyCommand,SANDRA} from '../src/domain.js';
import {sandraMove} from '../server/sandra.js';

test('six participant cup: five disposable profiles and real Cassandra engine, draw replay, elimination, byes and champion',async()=>{
 let s=initialState(),now=Date.now(),seq=0;const admin={id:'qa-admin',admin:true};
 const run=(actor,type,payload={})=>{s=applyCommand(s,actor,{id:'qa-six-'+ ++seq,type,payload},now+=10);};
 run(admin,'register',{name:'QA Admin'});s.settings.sandraTournaments=true;s.settings.analysisEnabled=false;s.settings.autoSettlement=true;
 const humans=Array.from({length:5},(_,i)=>({id:'qa-temporary-'+(i+1)}));
 for(const h of humans)run(h,'register',{name:h.id});
 run(admin,'tournament_create',{name:'QA Six Participants',capacity:6,entry:0,minRating:0,maxRating:3500,minutes:5,startsAt:now+1000,sandra:true,isTest:true});
 const tid=s.tournaments.at(-1).id;
 for(const h of humans)run(h,'tournament_join',{id:tid,botConsent:true});
 assert.equal(s.tournaments.at(-1).players.length,6);
 assert.throws(()=>run(humans[0],'tournament_join',{id:tid,botConsent:true}));
 now+=2000;run(admin,'tournament_start',{id:tid});
 assert.equal(s.games.filter(g=>g.tournament===tid).length,3);
 const accept=g=>{for(const uid of [g.white,g.black])if(!s.games.find(x=>x.id===g.id).accepted.includes(uid))run({id:uid,server:uid===SANDRA},'game_accept',{id:g.id});};
 const first=s.games.find(g=>g.tournament===tid&&!g.bot);accept(first);
 run({id:first.white},'draw',{id:first.id});run({id:first.black},'draw',{id:first.id});
 let replay=s.games.find(g=>g.id===first.id);assert.equal(replay.status,'pending');assert.equal(replay.rematches,1);assert.equal(s.tournaments.at(-1).round,1);
 let botMoves=0,finished=0;
 for(let guard=0;guard<20&&s.tournaments.at(-1).status!=='finished';guard++){
  const games=s.games.filter(g=>g.tournament===tid&&g.status==='pending');
  for(const g0 of games){accept(g0);let g=s.games.find(x=>x.id===g0.id);
   if(g.bot){for(let ply=0;ply<2;ply++){g=s.games.find(x=>x.id===g0.id);const c=new Chess(g.fen),uid=c.turn()==='w'?g.white:g.black;const move=uid===SANDRA?await sandraMove(g.fen):c.moves({verbose:true})[0];run({id:uid,server:uid===SANDRA},'move',{id:g.id,ply:g.moves.length,from:move.from,to:move.to,promotion:move.promotion});if(uid===SANDRA)botMoves++;}}
   g=s.games.find(x=>x.id===g0.id);const loser=g.white===SANDRA?g.black:g.white;run({id:loser,server:loser===SANDRA},'resign',{id:g.id});finished++;
   const terminal=s.games.find(x=>x.id===g.id);assert.equal(terminal.status,'finished');assert.throws(()=>run({id:loser},'move',{id:g.id,ply:terminal.moves.length,from:'a2',to:'a3'}));
  }
 }
 const t=s.tournaments.at(-1);assert.equal(t.status,'finished');assert.equal(t.winner,SANDRA);assert.equal(finished,5);assert.equal(t.round,3);assert.equal(t.prizePaid,0);assert(botMoves>=2);assert(s.games.every(g=>g.status==='finished'));assert(s.ledger.every(e=>e.availableDelta===undefined||Number.isFinite(e.availableDelta)));
 console.log(JSON.stringify({participants:6,temporaryProfiles:5,rounds:t.round,completedGames:finished,engineMoves:botMoves,drawReplay:true,champion:t.winner,realMoneyMoved:0}));
 // Fixture lifetime ends here: no Auth user or production row was created.
});
