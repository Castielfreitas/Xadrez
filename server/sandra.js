import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {dirname,join} from 'node:path';
import {Chess} from 'chess.js';
import {applyCommand,SANDRA} from '../src/domain.js';
const require=createRequire(import.meta.url);
const enginePath=join(dirname(require.resolve('stockfish/package.json')),'bin','stockfish-19-lite-single.js');
// Reuse the Stockfish 19 process for consecutive turns in the same warm Vercel
// instance. Cold boots still depend on the serverless runtime.
const THINK_MS=220,IDLE_ENGINE_MS=45000;
let engine=null,sequence=Promise.resolve(),idleTimer=null;
const positionCache=new Map();
function stopEngine(e){
 const previous=engine;
 engine=null;
 if(idleTimer){clearTimeout(idleTimer);idleTimer=null;}
 if(previous){
  if(previous.pending){const pending=previous.pending;previous.pending=null;pending.reject(e||Error('Engine unavailable'));}
  if(previous.loading){const loading=previous.loading;previous.loading=null;loading.reject(e||Error('Engine unavailable'));}
  try{previous.child.kill();}catch{}
 }
}
function startEngine(){
 if(engine)return engine.ready;
 const child=spawn(process.execPath,[enginePath],{stdio:['pipe','pipe','ignore']});
 const session={child,buffer:'',pending:null,loading:null,ready:null};
 engine=session;
 session.ready=new Promise((resolve,reject)=>{session.loading={resolve,reject};});
 session.ready.catch(()=>{}); // Handle the startup promise even if the caller exits early.
 const deadline=setTimeout(()=>{if(engine===session)stopEngine(Error('Stockfish startup timeout'));},10000);
 deadline.unref?.();
 const write=cmd=>{if(!child.stdin.destroyed)child.stdin.write(cmd+'\n');};
 child.on('error',e=>{clearTimeout(deadline);if(engine===session)stopEngine(e);});
 child.on('exit',()=>{clearTimeout(deadline);if(engine===session)stopEngine(Error('Stockfish exited'));});
 child.stdout.on('data',data=>{
  session.buffer+=data.toString();
  const rows=session.buffer.split('\n');session.buffer=rows.pop();
  for(const raw of rows){
   const line=raw.trim();
   if(line==='uciok'){write('setoption name Threads value 1');write('setoption name Hash value 16');write('setoption name Skill Level value 20');write('setoption name UCI_LimitStrength value false');write('isready');}
   if(line==='readyok'&&session.loading){clearTimeout(deadline);session.loading.resolve(session);session.loading=null;}
   const match=line.match(/^bestmove ([a-h][1-8])([a-h][1-8])([qrbn])?/);
   if(match&&session.pending){const pending=session.pending;session.pending=null;pending.resolve({from:match[1],to:match[2],...(match[3]?{promotion:match[3]}:{})});}
  }
 });
 write('uci');
 return session.ready;
}
async function calculate(fen){
 const chess=new Chess(fen);if(chess.isGameOver())return null;
 if(idleTimer){clearTimeout(idleTimer);idleTimer=null;}
 const session=await startEngine();
 if(engine!==session)throw Error('Stockfish session changed');
 // Only keep the Node event loop alive while the engine is actually thinking.
 session.child.ref();session.child.stdout.ref?.();session.child.stdin.ref?.();
 return new Promise((resolve,reject)=>{
  let settled=false;
  const deadline=setTimeout(()=>done(Error('Stockfish move timeout')),3000);
  function done(err,move){if(settled)return;settled=true;clearTimeout(deadline);if(session.pending===pending)session.pending=null;if(err){stopEngine(err);reject(err);return;}try{chess.move(move);resolve(move);}catch{stopEngine(Error('Illegal Stockfish move'));reject(Error('Illegal Stockfish move'));}}
  const pending={resolve:move=>done(null,move),reject:err=>done(err)};
  session.pending=pending;
  try{session.child.stdin.write('position fen '+fen+'\n');session.child.stdin.write('go movetime '+THINK_MS+' depth 22\n');}catch(err){done(err);}
 }).finally(()=>{
  if(engine===session){session.child.stdout.unref?.();session.child.stdin.unref?.();session.child.unref();idleTimer=setTimeout(()=>{if(engine===session&&!session.pending)stopEngine();},IDLE_ENGINE_MS);idleTimer.unref?.();}
 });
}
export function sandraMove(fen){
 const work=sequence.then(async()=>{if(positionCache.has(fen))return {...positionCache.get(fen)};const move=await calculate(fen);if(move){positionCache.set(fen,{...move});if(positionCache.size>64)positionCache.delete(positionCache.keys().next().value);}return move;});
 sequence=work.catch(()=>{});
 return work;
}

let running;
export function processSandra(db){if(running)return running;running=work(db).finally(()=>{running=null;});return running;}
async function work(db){
 let job;
 for(let n=0;n<4;n++){
  const {data:row,error}=await db.from('arena_state').select('state,revision').eq('id','main').single();if(error)return;
  const g=row.state.games.filter(g=>g.bot===SANDRA&&(!g.botRetryAt||g.botRetryAt<Date.now())&&(!g.botLeaseUntil||g.botLeaseUntil<Date.now())&&(g.status==='pending'&&!g.accepted.includes(SANDRA)||g.status==='playing'&&(new Chess(g.fen).turn()==='w'?g.white:g.black)===SANDRA)).sort((a,b)=>(a.lastMoveAt||a.createdAt||0)-(b.lastMoveAt||b.createdAt||0))[0];if(!g)return;
  if(g.status==='pending'&&!g.accepted.includes(SANDRA)){const next=applyCommand(row.state,{id:SANDRA,server:true},{id:`sandra-accept-${g.id}-${g.rematches}`,type:'game_accept',payload:{id:g.id}});const {data:ok}=await db.rpc('arena_compare_and_swap',{expected_revision:row.revision,next_state:next});if(ok)return;continue;}
  if(g.status!=='playing'||(new Chess(g.fen).turn()==='w'?g.white:g.black)!==SANDRA)return;
  const ticket=crypto.randomUUID();g.botLeaseUntil=Date.now()+15000;g.botTicket=ticket;
  const {data:ok}=await db.rpc('arena_compare_and_swap',{expected_revision:row.revision,next_state:row.state});if(ok){job={id:g.id,fen:g.fen,ply:g.moves.length,round:g.rematches,ticket};break;}
 }
 if(!job)return;
 let move;try{move=await sandraMove(job.fen);}catch{
  // A startup error must not leave the player waiting for the 15-second lease.
  for(let n=0;n<3;n++){
   const {data:row,error}=await db.from('arena_state').select('state,revision').eq('id','main').single();if(error||!row)break;
   const g=row.state.games.find(g=>g.id===job.id);if(!g||g.botTicket!==job.ticket)break;
   delete g.botLeaseUntil;delete g.botTicket;g.botRetryAt=Date.now()+1000;
   const {data:ok}=await db.rpc('arena_compare_and_swap',{expected_revision:row.revision,next_state:row.state});if(ok)break;
  }
  return;
 }
 if(!move)return;
 for(let n=0;n<5;n++){
  const {data:row,error}=await db.from('arena_state').select('state,revision').eq('id','main').single();if(error)return;const g=row.state.games.find(g=>g.id===job.id);
  if(!g||g.status!=='playing'||g.botTicket!==job.ticket||g.fen!==job.fen||g.moves.length!==job.ply||g.rematches!==job.round)return;
  const next=applyCommand(row.state,{id:SANDRA,server:true},{id:`sandra-move-${g.id}-${g.rematches}-${job.ply}`,type:'move',payload:{id:g.id,ply:job.ply,...move}});const updated=next.games.find(g=>g.id===job.id);delete updated.botLeaseUntil;delete updated.botTicket;
  const {data:ok}=await db.rpc('arena_compare_and_swap',{expected_revision:row.revision,next_state:next});if(ok)return;
 }
}
