export const TOURNAMENT_COVERS=[{id:'gold',name:'Coroa dourada'},{id:'midnight',name:'Noite azul'},{id:'classic',name:'Clube clássico'},{id:'blitz',name:'Blitz de cobre'},{id:'emerald',name:'Cavaleiro esmeralda'},{id:'royal',name:'Taça real'}];
export function tournamentPrize(t,players=t.players.length){if(t.economics==='fixed')return t.fixedPrize;if(Number.isFinite(t.displayPrize))return t.displayPrize;const pool=t.entry*players,net=pool-Math.floor(pool*t.feeBps/10000);return Math.max(t.prizeGuarantee||0,net);}
export function localDateTime(ms){const d=new Date(ms);return new Date(ms-d.getTimezoneOffset()*60000).toISOString().slice(0,16);}

/**
 * Administrative projection only: no credit-to-BRL exchange, wallet credit,
 * payment activation or guarantee of profitability is performed here.
 * Monetary values are integer cents in the selected tournament currency.
 */
export function tournamentViability({capacity,entry,fixedPrize=0,economics='fixed'}){
 const places=Number.isSafeInteger(capacity)?Math.max(2,capacity):2;
 const perPlayer=Number.isSafeInteger(entry)?Math.max(0,entry):0;
 const prize=Number.isSafeInteger(fixedPrize)?Math.max(0,fixedPrize):0;
 const required=economics==='fixed'?perPlayer>0?Math.max(2,Math.floor(prize/perPlayer)+1):Infinity:2;
 const minimumStart=Math.min(required,places);
 const possible=required<=places;
 const expectedReceipts=perPlayer*places;
 const expectedMargin=expectedReceipts-prize;
 const minimumPositiveMarginCents=possible?minimumStart*perPlayer-prize:null;
 return {minimumStart:possible?minimumStart:null,minimumPositiveMargin:possible?minimumStart:null,minimumPositiveMarginCents,remainingToStart:possible?Math.max(0,minimumStart):null,capacity:places,expectedReceipts,expectedMargin,possible};
}

export function tournamentsForTab(tournaments,tab="active"){return tournaments.filter(t=>tab==="finished"?t.status==="finished":tab==="cancelled"?t.status==="cancelled":["registration","running"].includes(t.status));}
