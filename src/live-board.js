// Accept only server broadcasts from the authenticated private user channel.
// Wallets, rating and fair-play evidence are reconciled separately over HTTP.
export const BOARD_FIELDS=['id','white','black','fen','pgn','moves','status','lastMoveAt','whiteMs','blackMs','rematches','accepted','drawOffers','result','reason','winner','round','tournament'];
export function createLiveBoardSync(){
 let owner=null,httpRevision=-1;const snapshots=new Map();
 function reset(user){owner=user||null;httpRevision=-1;snapshots.clear();}
 function receive(envelope,state,user){
  if(!user||owner!==user)return false;
  const revision=envelope?.revision,g=envelope?.game;
  if(!Number.isSafeInteger(revision)||revision<=httpRevision||!g||typeof g.id!=='string'||typeof g.fen!=='string'||!Array.isArray(g.moves)||![g.white,g.black].includes(user))return false;
  if((snapshots.get(g.id)?.revision??-1)>=revision)return false;
  const current=state.games?.find(v=>v.id===g.id);
  if(!current||current.white!==g.white||current.black!==g.black)return false;
  const board=Object.fromEntries(BOARD_FIELDS.filter(k=>Object.hasOwn(g,k)).map(k=>[k,g[k]]));
  snapshots.set(g.id,{revision,board});Object.assign(current,board);return true;
 }
 function reconcile(state,revision,user){
  if(owner!==user)reset(user);
  if(!Number.isSafeInteger(revision))return state;
  httpRevision=Math.max(httpRevision,revision);
  for(const [id,snapshot] of snapshots){
   if(snapshot.revision<=revision){snapshots.delete(id);continue;}
   const g=state.games?.find(v=>v.id===id);
   if(g&&[g.white,g.black].includes(user)&&g.white===snapshot.board.white&&g.black===snapshot.board.black)Object.assign(g,snapshot.board);
  }
  return state;
 }
 return {reset,receive,reconcile};
}
