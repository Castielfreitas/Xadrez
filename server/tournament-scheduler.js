import {applyCommand,DomainError} from '../src/domain.js';

const FREE_REGISTRATION_EXTENSION_MS=60*60*1000;
const isFreeOpen=t=>t.status==='registration'&&t.entry===0&&t.economics!=='fixed'&&(t.currency===undefined||t.currency===null||t.currency==='TEST');

/**
 * Evaluate tournament registrations on normal API traffic. Real-money
 * tournaments keep their existing fixed-prize cancellation rules.
 * Free tournaments may start automatically at the scheduled time; if fewer
 * than two human players joined, extend registration instead of leaving an
 * expired, unjoinable card on the site.
 */
export async function processScheduledTournaments(client,now=Date.now()){
 for(let attempt=0;attempt<5;attempt++){
  const {data:row,error}=await client.from('arena_state').select('state,revision').eq('id','main').single();
  if(error||!row)return;
  const pending=row.state.tournaments.filter(t=>t.status==='registration'&&t.startsAt<=now);
  if(!pending.length)return;
  let next=structuredClone(row.state),changed=false;
  for(const original of pending){
   const t=next.tournaments.find(t=>t.id===original.id);
   if(!t||t.status!=='registration')continue;
   if(isFreeOpen(t)&&t.players.filter(u=>u!=='arena-sandra').length<2){
    t.startsAt=now+FREE_REGISTRATION_EXTENSION_MS;
    next.audit??=[];
    next.audit.push({id:globalThis.crypto.randomUUID(),actor:'system:free-tournaments',action:'free_tournament_registration_extended',detail:{id:t.id,reason:'insufficient_participants'},at:now});
    changed=true;
    continue;
   }
   if(t.economics!=='fixed'&&!isFreeOpen(t))continue;
   try{
    next=applyCommand(next,{id:t.createdBy,admin:true},{id:'scheduled-start-'+t.id,type:'tournament_start',payload:{id:t.id}},now);
    changed=true;
   }catch(error){if(!(error instanceof DomainError))throw error;}
  }
  if(!changed)return;
  const {data:ok,error:writeError}=await client.rpc('arena_compare_and_swap',{expected_revision:row.revision,next_state:next});
  if(writeError)throw Error('Tournament write failed');
  if(ok)return;
 }
}
