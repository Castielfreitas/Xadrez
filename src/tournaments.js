export const TOURNAMENT_COVERS=[{id:'gold',name:'Coroa dourada'},{id:'midnight',name:'Noite azul'},{id:'classic',name:'Clube clássico'},{id:'blitz',name:'Blitz de cobre'}];
export function tournamentPrize(t,players=t.players.length){const pool=t.entry*players,net=pool-Math.floor(pool*t.feeBps/10000);return Math.max(t.prizeGuarantee||0,net);}
export function localDateTime(ms){const d=new Date(ms);return new Date(ms-d.getTimezoneOffset()*60000).toISOString().slice(0,16);}
