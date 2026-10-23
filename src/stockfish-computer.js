import {Chess} from 'chess.js';
// One local engine per training session: no network round trip for each move.
// The maximum level keeps Stockfish skill 20 and disables Elo limiting.
export function createStrongComputer({WorkerClass=globalThis.Worker}={}){
 const engine=new WorkerClass('/engine/stockfish-19-lite-single.js');
 let ready=false,pending=null,stopped=false,timer;
 const api={onmessage:null,onerror:null,postMessage(job){if(pending)throw Error('Cálculo em andamento.');pending=job;start();},terminate(){stopped=true;clearTimeout(timer);engine.terminate();}};
 function fail(){if(stopped)return;clearTimeout(timer);pending=null;api.onerror?.(new Error('Motor indisponível.'));}
 function start(){if(!ready||!pending)return;const level=Number(pending.level);engine.postMessage('setoption name Skill Level value '+(level>=8?20:level===7?17:13));engine.postMessage('setoption name UCI_LimitStrength value false');engine.postMessage('position fen '+pending.fen);engine.postMessage('go movetime '+(level>=8?300:220));clearTimeout(timer);timer=setTimeout(fail,10000);}
 engine.onerror=fail;
 engine.onmessage=e=>{if(stopped)return;const line=String(e.data).trim();if(line==='uciok'){engine.postMessage('setoption name Hash value 16');engine.postMessage('setoption name Threads value 1');engine.postMessage('isready');}if(line==='readyok'){ready=true;clearTimeout(timer);start();}const m=line.match(/^bestmove ([a-h][1-8])([a-h][1-8])([qrbn])?/);if(m&&pending){const job=pending;pending=null;clearTimeout(timer);const move={from:m[1],to:m[2],...(m[3]?{promotion:m[3]}:{})};try{new Chess(job.fen).move(move);api.onmessage?.({data:{id:job.id,move}});}catch{fail();}}};
 timer=setTimeout(fail,15000);engine.postMessage('uci');return api;
}
