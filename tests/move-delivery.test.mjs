import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
const app=await readFile(new URL('../src/app.js',import.meta.url),'utf8');
test('computer result commits immediately with no artificial timer and rejects stale engine generations',()=>{
 const start=app.indexOf('function computerTurn()'),end=app.indexOf('async function playMove',start);
 let committed=0,posted;const worker={postMessage:m=>{posted=m;}},practice={computer:true,status:'playing',fen:'fixture',humanColor:'w',level:8};
 const sandbox={practice,thinking:false,engineGeneration:0,computerWorker:worker,Chess:class{turn(){return 'b';}},createStrongComputer:()=>worker,commitPracticeMove:()=>committed++,render(){},toast(){},cancelComputer(){},setTimeout(){throw Error('artificial wait');}};
 runInNewContext(app.slice(start,end)+';computerTurn();',sandbox);
 assert.equal(posted.level,8);worker.onmessage({data:{id:posted.id,move:{from:'e7',to:'e5'}}});assert.equal(committed,1);
 sandbox.engineGeneration++;worker.onmessage({data:{id:posted.id,move:{}}});assert.equal(committed,1);
});
test('realtime notifications coalesce and authenticated authoritative state refresh remains the source of moves',()=>{
 const start=app.indexOf('let lastStatePoll='),end=app.indexOf('async function pollOnlineState',start);
 let callback,subscribed,timers=[],polls=0;const channel={on(type,filter,cb){assert.equal(type,'broadcast');assert.equal(filter.event,'revision');callback=cb;return this;},subscribe(cb){subscribed=cb;return this;}};
 const sandbox={online:true,client:{channel:topic=>{assert.equal(topic,'arena-live-v1');return channel;}},setTimeout(fn){timers.push(fn);return timers.length;},pollOnlineState:()=>polls++,Date,session:null};
 runInNewContext(app.slice(start,end)+';connectLiveState();connectLiveState();',sandbox);
 callback({payload:{state:'untrusted'}});callback({});subscribed('SUBSCRIBED');assert.equal(timers.length,1);
 timers.shift()();assert.equal(polls,1);
});
