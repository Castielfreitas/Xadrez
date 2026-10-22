import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,applyCommand,publicState,SANDRA} from '../src/domain.js';
import {tournamentViability} from '../src/tournaments.js';

test('viability calculates correct BRL projection for 1000 players at R$ 3.05 with R$ 10 prize',()=>{
 const x=tournamentViability({capacity:1000,entry:305,fixedPrize:1000,economics:'fixed'});
 assert.equal(x.expectedReceipts,305000);
 assert.equal(x.expectedMargin,304000);
 assert.equal(x.minimumStart,4);
 assert.equal(x.minimumPositiveMargin,4);
 assert.equal(x.possible,true);
});
test('nonprofitable capacity cannot be announced as viable',()=>{
 assert.equal(tournamentViability({capacity:2,entry:100,fixedPrize:1000,economics:'fixed'}).possible,false);
 assert.equal(tournamentViability({capacity:8,entry:0,fixedPrize:100,economics:'fixed'}).minimumStart,null);
});
test('Casandra can enroll in multiple tournaments without receiving fake credits',()=>{
 const now=Date.now(),a={id:'admin',admin:true};
 let s=initialState();s.settings.sandraTournaments=true;s.settings.mode='sandbox';
 s.players.admin={id:'admin',name:'Admin',status:'active',available:5000,reserved:0,joinedAt:now};
 const create=(name,id)=>({id,type:'tournament_create',payload:{name,capacity:8,entry:100,prizeGuarantee:0,economics:'fixed',minutes:5,minRating:0,maxRating:3500,startsAt:now+3600000,sandra:true}});
 s=applyCommand(s,a,{id:'f0000000-0000-4000-8000-000000000001',type:'sandra_fund',payload:{amount:1000}},now);
 s=applyCommand(s,a,create('Copa Um','f0000000-0000-4000-8000-000000000002'),now);
 s=applyCommand(s,a,create('Copa Dois','f0000000-0000-4000-8000-000000000003'),now);
 assert.equal(s.tournaments.length,2);
 assert(s.tournaments.every(t=>t.players.includes(SANDRA)));
 assert.equal(s.players[SANDRA].reserved,200);
 assert.equal(s.players[SANDRA].available,800);
});
test('profile country becomes visible without exposing private balances',()=>{
 const now=Date.now(),a={id:'p'};
 let s=initialState();s.players.p={id:'p',name:'Jogadora',status:'active',available:100,reserved:0,joinedAt:now};
 s=applyCommand(s,a,{id:'f0000000-0000-4000-8000-000000000004',type:'profile_update',payload:{name:'Jogadora',country:'BR'}},now);
 assert.equal(publicState(s,'spectator').players.p.country,'BR');
 assert.equal(publicState(s,'spectator').players.p.available,undefined);
 assert.throws(()=>applyCommand(s,a,{id:'f0000000-0000-4000-8000-000000000005',type:'profile_update',payload:{country:'Brasil'}},now));
});
