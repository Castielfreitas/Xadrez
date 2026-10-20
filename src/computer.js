import { Chess } from 'chess.js';
export const LEVELS=[
 {name:'Primeiros lances',depth:1,ms:60,noise:500},
 {name:'Iniciante',depth:1,ms:100,noise:180},
 {name:'Aprendiz',depth:2,ms:180,noise:80},
 {name:'Intermediário',depth:2,ms:350,noise:25},
 {name:'Desafiador',depth:3,ms:600,noise:8},
 {name:'Avançado',depth:4,ms:1000,noise:0},
 {name:'Especialista',depth:5,ms:1800,noise:0},
 {name:'Máximo',depth:6,ms:3000,noise:0}
];
const value={p:100,n:320,b:335,r:500,q:900,k:0};
function evaluate(c){let score=0;for(const row of c.board())for(const p of row){if(!p)continue;const f=p.square.charCodeAt(0)-97,r=Number(p.square[1])-1;const center=7-(Math.abs(3.5-f)+Math.abs(3.5-r));let n=value[p.type];if(p.type==='p')n+=(p.color==='w'?r:7-r)*7;if(['n','b','q'].includes(p.type))n+=center*(p.type==='n'?10:4);score+=p.color==='w'?n:-n;}return score*(c.turn()==='w'?1:-1);}
const order=m=>(m.captured?value[m.captured]*10-value[m.piece]:0)+(m.promotion?800:0)+(m.san.includes('+')?30:0);
export function chooseMove(fen,level=4,{random=Math.random,now=()=>performance.now()}={}){
 const c=new Chess(fen),cfg=LEVELS[Math.max(0,Math.min(7,level-1))],start=now();let nodes=0;const root=c.moves({verbose:true});if(!root.length)return null;
 const timeout={};function search(depth,alpha,beta,ply){if((++nodes&31)===0&&now()-start>=cfg.ms)throw timeout;if(c.isCheckmate())return -100000+ply;if(c.isDraw())return 0;if(!depth)return evaluate(c);let best=-Infinity;const moves=c.moves({verbose:true}).sort((a,b)=>order(b)-order(a));for(const m of moves){c.move(m);let score;try{score=-search(depth-1,-beta,-alpha,ply+1);}finally{c.undo();}best=Math.max(best,score);alpha=Math.max(alpha,score);if(alpha>=beta)break;}return best;}
 let best=root[0],sorted=root.map(move=>({move,score:0}));for(let depth=1;depth<=cfg.depth;depth++){const iteration=[];try{for(const {move} of sorted){if(now()-start>=cfg.ms&&iteration.length)throw timeout;c.move(move);let score;try{score=-search(depth-1,-Infinity,Infinity,1);}finally{c.undo();}score+=(random()-.5)*cfg.noise;iteration.push({move,score});}iteration.sort((a,b)=>b.score-a.score);sorted=iteration;best=sorted[0].move;}catch(e){if(e!==timeout)throw e;break;}}
 return {from:best.from,to:best.to,promotion:best.promotion};
}
