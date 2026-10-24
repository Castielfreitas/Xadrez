// Public offer exposes an entry cap, never the computer's financial ledger.
export function computerCashOffer(state,environment,{enabled=true}={}){
 const book=state.cash?.[environment],account=book?.accounts?.['arena-sandra'];
 const active=enabled&&state.settings?.sandraCashChallenges===true&&state.players?.['arena-sandra']?.status==='active';
 const busy=(state.games||[]).some(g=>['pending','playing','review'].includes(g.status)&&[g.white,g.black].includes('arena-sandra'));
 const available=Number.isSafeInteger(account?.available)&&!account.frozen?account.available:0;
 return {enabled:active,busy,maxStakeCents:active?Math.max(0,Math.min(100000,available)):0};
}
