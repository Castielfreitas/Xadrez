// Resolve the authoritative match independently of any modal's open/closed state.
export function matchStatus(state,user,now=Date.now()){
 if(!user)return {phase:'idle'};
 const own=g=>[g.white,g.black].includes(user);
 const game=state.games.find(g=>g.status==='playing'&&own(g))||state.games.find(g=>g.status==='pending'&&own(g));
 if(game)return {phase:game.status,game,other:game.white===user?game.black:game.white,accepted:game.accepted?.includes(user)||false};
 const queue=state.challenges.find(c=>c.creator===user&&c.matchmaking&&c.status==='open'&&(!c.expiresAt||c.expiresAt>now));
 return queue?{phase:'searching',queue}:{phase:'idle'};
}
export function shouldOpenMatch(status,{tab,gameId,practice}){return ['pending','playing'].includes(status.phase)&&(tab!=='board'||gameId!==status.game.id||Boolean(practice));}
