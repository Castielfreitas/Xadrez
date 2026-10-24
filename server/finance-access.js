import {DomainError} from '../src/errors.js';
import {paymentsStatus} from './payments.js';
export const FINANCIAL_COMMANDS=new Set(['sandra_cash_return','sandra_match','sandra_fund','quick_match','challenge_create','challenge_accept','tournament_create','tournament_join','tournament_reenter','game_accept']);
export function financialActor(state,actor,command,env=process.env){
 const status=paymentsStatus(env),p=command.payload||{};
 const item=state.challenges.find(c=>c.id===p.id)||state.tournaments.find(t=>t.id===p.id)||state.games.find(g=>g.id===p.id);
 if(p.currency==='BRL'&&!['sandra_cash_return','sandra_match','sandra_fund','quick_match','challenge_create','tournament_create'].includes(command.type))throw new DomainError('Moeda não aceita nesta operação.',400);
 const brl=p.currency==='BRL'||item?.currency==='BRL';
 if(brl&&FINANCIAL_COMMANDS.has(command.type)&&(!status.paymentsEnabled||env.ASAAS_GAMES_ENABLED!=='true'))throw new DomainError('Partidas em reais aguardam a liberação operacional.',503);
 if(brl&&FINANCIAL_COMMANDS.has(command.type)&&!state.settings.analysisEnabled)throw new DomainError('Ative a análise de fair play antes de abrir partidas em reais.',409);
 if(brl&&item?.paymentEnvironment&&item.paymentEnvironment!==status.environment)throw new DomainError('Esta operação pertence a outro ambiente financeiro.',409);
 return {...actor,...(p.currency==='BRL'?{server:true}:{}),cashEnabled:status.paymentsEnabled&&env.ASAAS_GAMES_ENABLED==='true',cashEnvironment:status.environment};
}
