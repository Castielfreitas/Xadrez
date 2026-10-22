import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {dirname,join} from 'node:path';
import {Chess} from 'chess.js';
import {applyCommand,SANDRA} from '../src/domain.js';
const require=createRequire(import.meta.url);
const enginePath=join(dirname(require.resolve('stockfish/package.json')),'bin','stockfish-19-lite-single.js');
export function sandraMove(fen){
 const chess=new Chess(fen);if(chess.isGameOver())return Promise.resolve(null);
 return new Promise((resolve,reject)=>{let buffer='',done=false;const child=spawn(process.execPath,[enginePath],{stdio:['pipe','pipe','ignore']});const timer=setTimeout(()=>finish(Error('Stockfish timeout')),10000);function finish(error,move){if(done)return;done=true;clearTimeout(timer);child.kill();error?reject(error):resolve(move);}const send=line=>child.stdin.write(line+'\n');child.on('error',finish);child.on('exit',()=>{if(!done)finish(Error('Stockfish exited'));});child.stdout.on('data',chunk=>{buffer+=chunk;const lines=buffer.split('\n');buffer=lines.pop();for(const line of lines){if(line==='uciok'){send('setoption name Threads value 1');send('setoption name Hash value 64');send('setoption name Skill Level value 20');send('setoption name UCI_LimitStrength value false');send('isready');}if(line==='readyok'){send('position fen '+fen);send('go movetime 1000');}const match=line.match(/^bestmove ([a-h][1-8])([a-h][1-8])([qrbn])?/);if(match){const move={from:match[1],to:match[2],...(match[3]?{promotion:match[3]}:{})};try{chess.move(move);finish(null,move);}catch{finish(Error('Illegal engine move'));}}}});send('uci');});
}
let running;
export function processSandra(db){if(running)return running;running=work(db).finally(()=>{running=null;});return running;}
async function work(db){
 let job;
 for(let n=0;n<4;n++){
  const {data:row,error}=await db.from('arena_state').select('state,revision').eq('id','main').single();if(error)return;
  const g=row.state.games.filter(g=>g.bot===SANDRA&&(!g.botLeaseUntil||g.botLeaseUntil<Date.now())&&(g.status==='pending'&&!g.accepted.includes(SANDRA)||g.status==='playing'&&(new Chess(g.fen).turn()==='w'?g.white:g.black)===SANDRA)).sort((a,b)=>(a.lastMoveAt||a.createdAt||0)-(b.lastMoveAt||b.createdAt||0))[0];if(!g)return;
  if(g.status==='pending'&&!g.accepted.includes(SANDRA)){const next=applyCommand(row.state,{id:SANDRA,server:true},{id:`sandra-accept-${g.id}-${g.rematches}`,type:'game_accept',payload:{id:g.id}});const {data:ok}=await db.rpc('arena_compare_and_swap',{expected_revision:row.revision,next_state:next});if(ok)return;continue;}
  if(g.status!=='playing'||(new Chess(g.fen).turn()==='w'?g.white:g.black)!==SANDRA)return;
  const ticket=crypto.randomUUID();g.botLeaseUntil=Date.now()+15000;g.botTicket=ticket;
  const {data:ok}=await db.rpc('arena_compare_and_swap',{expected_revision:row.revision,next_state:row.state});if(ok){job={id:g.id,fen:g.fen,ply:g.moves.length,round:g.rematches,ticket};break;}
 }
 if(!job)return;
 let move;try{move=await sandraMove(job.fen);}catch{return;}
 if(!move)return;
 for(let n=0;n<5;n++){
  const {data:row,error}=await db.from('arena_state').select('state,revision').eq('id','main').single();if(error)return;const g=row.state.games.find(g=>g.id===job.id);
  if(!g||g.status!=='playing'||g.botTicket!==job.ticket||g.fen!==job.fen||g.moves.length!==job.ply||g.rematches!==job.round)return;
  const next=applyCommand(row.state,{id:SANDRA,server:true},{id:`sandra-move-${g.id}-${g.rematches}-${job.ply}`,type:'move',payload:{id:g.id,ply:job.ply,...move}});const updated=next.games.find(g=>g.id===job.id);delete updated.botLeaseUntil;delete updated.botTicket;
  const {data:ok}=await db.rpc('arena_compare_and_swap',{expected_revision:row.revision,next_state:next});if(ok)return;
 }
}
