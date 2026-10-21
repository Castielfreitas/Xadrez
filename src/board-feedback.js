import {Chess} from 'chess.js';
export function boardPosition(game,ply=null){const count=ply===null?game.moves.length:Math.max(0,Math.min(ply,game.moves.length));const chess=new Chess();for(const move of game.moves.slice(0,count))chess.move(move);const last=chess.history({verbose:true}).at(-1);const king=chess.isCheck()?chess.board().flat().find(p=>p?.type==='k'&&p.color===chess.turn())?.square:null;return {chess,last,king,count,live:count===game.moves.length};}
export function drawReason(chess){return chess.isStalemate()?'afogamento':chess.isInsufficientMaterial()?'material insuficiente':chess.isThreefoldRepetition()?'repetição de posição':chess.isDrawByFiftyMoves()?'regra dos 50 lances':'empate';}
export function positionStatus(game,chess){if(chess.isStalemate())return 'Empate por afogamento · sem lances legais e sem xeque';if(chess.isDraw())return 'Empate por '+drawReason(chess);if(game.lastDrawReason&&game.status==='pending')return 'Empate por '+game.lastDrawReason+' · nova partida aguardando aceite';if(chess.isCheckmate())return 'Xeque-mate · '+(chess.turn()==='w'?'Pretas':'Brancas')+' venceram';if(game.status==='finished'||game.status==='review'){if(game.result)return game.result;if(game.winner)return 'Vitória das '+(game.winner===game.white?'brancas':'pretas')+(game.reason==='resign'?' · desistência':game.reason==='timeout'?' · tempo esgotado':'');return 'Partida concluída';}if(chess.isCheck())return 'Xeque · '+(chess.turn()==='w'?'Brancas':'Pretas')+' jogam';return null;}
export function moveSound(chess,last){return chess.isCheckmate()?'end':chess.isCheck()?'check':last?.captured?'capture':last?.flags.includes('k')||last?.flags.includes('q')?'castle':'move';}

export function capturedPieces(chess,color){const order={q:0,r:1,b:2,n:3,p:4};return chess.history({verbose:true}).filter(m=>m.color===color&&m.captured).map(m=>({type:m.captured,color:color==='w'?'b':'w'})).sort((a,b)=>order[a.type]-order[b.type]);}
export function gameOutcome(g,chess,{viewer=null,practice=false}={}){
 if(!['finished','review'].includes(g.status))return null;
 let winner=chess.isCheckmate()?(chess.turn()==='w'?'b':'w'):g.winner?(g.winner===g.white?'w':'b'):null;
 if(practice&&g.computer&&!winner){if(g.result?.includes('Você venceu'))winner=g.humanColor;else if(g.result?.includes('Computador venceu'))winner=g.humanColor==='w'?'b':'w';}
 if(!winner)return chess.isDraw()?{kind:'draw',title:'Empate',detail:'Partida encerrada por '+drawReason(chess)+'.'}:null;
 const own=practice?(g.computer?g.humanColor:null):g.white===viewer?'w':g.black===viewer?'b':null;
 const won=own===winner,reason=chess.isCheckmate()?'xeque-mate':g.reason==='timeout'||g.result?.includes('Tempo esgotado')?'tempo esgotado':g.reason==='resign'||g.result?.includes('desistiu')?'desistência':'resultado confirmado';
 return {kind:own?(won?'win':'loss'):'win',title:own?(won?'Vitória':'Derrota'):'Vitória das '+(winner==='w'?'brancas':'pretas'),detail:own?(reason==='xeque-mate'?(won?'Você deu xeque-mate no seu oponente.':'Seu oponente deu xeque-mate.'):(won?'Você venceu por ':'Seu oponente venceu por ')+reason+'.'):(winner==='w'?'Brancas':'Pretas')+' venceram por '+reason+'.'};
}
