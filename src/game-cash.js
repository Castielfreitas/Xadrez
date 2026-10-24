import {DomainError} from './errors.js';
const check=(ok,message)=>{if(!ok)throw new DomainError(message,409);};
export function gameBook(s,source){check(source.currency==='BRL'&&['sandbox','production'].includes(source.paymentEnvironment),'Carteira da partida inválida.');s.cash??={};return s.cash[source.paymentEnvironment]??={accounts:{},customers:{},customerLocks:{},deposits:{},withdrawals:{},inbox:{},ledger:[],processingFees:0};}
function account(b,user){return b.accounts[user]??={available:0,reserved:0,frozen:false};}
export function cashSpendable(s,user,source){const a=account(gameBook(s,source),user);return a.frozen?0:a.available;}
export function cashGameReady(s,source,now=Date.now(),users=[source.white,source.black]){
 if(source.currency!=='BRL')return;
 const b=gameBook(s,source);
 for(const user of users){check(s.players[user]?.status==='active'&&!account(b,user).frozen,'Há uma carteira ou conta em revisão.');let holder=user;if(user==='arena-sandra'&&s.players[user]?.bot){const t=s.tournaments.find(t=>t.id===(source.tournament||source.id));if(t?.currency==='BRL'&&t.sandra&&t.sandraSponsor&&t.paymentEnvironment===source.paymentEnvironment)holder=t.sandraSponsor;else{check((source.bot==='arena-sandra'||source.target==='arena-sandra'&&source.botConsent===true)&&b.computerSponsor,'Participação financeira do computador não configurada.');holder=b.computerSponsor;}check(s.players[holder]?.status==='active'&&!account(b,holder).frozen,'A carteira responsável pelo computador está em revisão.');}const r=s.identities?.[holder];check(r?.status==='verified'&&r.sealed&&now-r.submittedAt<30*86400000,'Verifique sua identidade antes de movimentar reais.');}
}
export function cashGameEntry(s,user,available,reserved,type,ref,now,source){
 check(Number.isSafeInteger(available)&&Number.isSafeInteger(reserved),'Movimentação inválida.');
 const b=gameBook(s,source),a=account(b,user);b.gameHolds??={};
 const key=user+':'+(source.challenge||source.id),hold=b.gameHolds[key]||0;
 if(reserved>0)cashGameReady(s,source,now,[user]);
 check(hold+reserved>=0,'Reserva desta mesa insuficiente.');
 check(Number.isSafeInteger(a.available+available)&&Number.isSafeInteger(a.reserved+reserved)&&a.available+available>=0&&a.reserved+reserved>=0,'Saldo em reais insuficiente.');
 a.available+=available;a.reserved+=reserved;b.gameHolds[key]=hold+reserved;
 b.ledger.push({id:crypto.randomUUID(),user,available,reserved,type,reference:ref,at:now,currency:'BRL'});
}
export function cashPlatformFee(s,amount,ref,now,source){
 check(Number.isSafeInteger(amount)&&amount>=0,'Receita administrativa inválida.');
 if(!amount)return;const b=gameBook(s,source);b.platform??={available:0,claimed:0,ledger:[]};
 check(!b.platform.ledger.some(e=>e.reference===ref),'Receita já contabilizada.');
 b.platform.available+=amount;b.platform.ledger.push({id:crypto.randomUUID(),amount,reference:ref,at:now});
}
