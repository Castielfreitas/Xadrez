import test from 'node:test';import assert from 'node:assert/strict';
import {Chess} from 'chess.js';import {createLiveBoardSync} from '../src/live-board.js';
const game=()=>({id:'game',white:'alice',black:'bob',fen:new Chess().fen(),moves:[],pgn:'',status:'playing',whiteMs:300000,blackMs:300000,lastMoveAt:1000,stake:1000});
test('two real-player board receivers display committed moves and captures without an HTTP fetch',()=>{
 const a=createLiveBoardSync(),b=createLiveBoardSync(),sa={games:[game()]},sb=structuredClone(sa),c=new Chess();a.reset('alice');b.reset('bob');
 for(const [i,move] of ['e4','d5','exd5'].entries()){
  c.move(move);const update={revision:i+1,game:{...game(),fen:c.fen(),pgn:c.pgn(),moves:c.history()}};
  assert(a.receive(update,sa,'alice'));assert(b.receive(update,sb,'bob'));
  assert.equal(sa.games[0].fen,c.fen());assert.equal(sb.games[0].fen,c.fen());
 }
 assert.equal(new Chess(sb.games[0].fen).get('d5').color,'w');assert.equal(new Chess(sb.games[0].fen).get('e4'),undefined);
});
test('in-flight old HTTP response cannot roll a received move or capture back',()=>{
 const sync=createLiveBoardSync(),state={games:[game()]},c=new Chess();sync.reset('bob');sync.reconcile(state,4,'bob');c.move('e4');
 const event={revision:6,game:{...game(),fen:c.fen(),moves:['e4'],pgn:c.pgn()}};assert(sync.receive(event,state,'bob'));
 const old={games:[game()]};sync.reconcile(old,5,'bob');assert.equal(old.games[0].fen,c.fen());
 assert(!sync.receive({...event,revision:5},state,'bob'));assert(!sync.receive(event,state,'bob'));
 sync.reconcile(structuredClone(state),7,'bob');assert(!sync.receive(event,state,'bob'));
});
test('board stream rejects foreign games, account changes and malformed messages and cannot modify finances',()=>{
 const sync=createLiveBoardSync(),state={games:[game()],cash:{available:100}};sync.reset('bob');
 const event={revision:1,game:{...game(),stake:999999,cash:{available:999},feeBps:0,analysis:['private'],whiteMs:250000}};
 assert(sync.receive(event,state,'bob'));assert.equal(state.games[0].stake,1000);assert.equal(state.games[0].cash,undefined);assert.equal(state.games[0].analysis,undefined);assert.equal(state.games[0].whiteMs,250000);assert.equal(state.cash.available,100);
 assert(!sync.receive({...event,revision:2},state,'eve'));
 assert(!sync.receive({...event,revision:2,game:{...game(),black:'eve'}},state,'bob'));
 assert(!sync.receive({revision:3,game:{id:'game'}},state,'bob'));sync.reset(null);assert(!sync.receive({...event,revision:4},state,'bob'));
});
