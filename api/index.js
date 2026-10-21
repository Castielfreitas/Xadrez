import {processSandra} from '../server/sandra.js';
import {trustConfigured,identityPayload,putPrivate,readPrivate,unseal,privateImage,auditEvidenceAccess,cleanupTrust} from '../server/identity.js';
import {storeAvatar} from '../server/avatar.js';
import { waitUntil } from '@vercel/functions';
import { processAnalysis, engineAssetsAvailable } from '../server/analysis.js';
import { createClient } from '@supabase/supabase-js';
import { applyCommand, initialState, publicState, DomainError } from '../src/domain.js';
const config=()=>({url:process.env.SUPABASE_URL,key:process.env.SUPABASE_PUBLISHABLE_KEY});
const db=()=>createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 const query=new URL(req.url,'https://arena.local').searchParams;const action=query.get('action')||'state';
 const c=config(),ready=Boolean(c.url&&c.key&&process.env.SUPABASE_SERVICE_ROLE_KEY);
 if(req.method==='GET'&&action==='config')return res.status(200).json({configured:ready,supabaseUrl:c.url||null,publishableKey:c.key||null,mode:'sandbox',paymentsEnabled:false,lichessEnabled:false,trustConfigured:trustConfigured(),analysisWorkerConfigured:engineAssetsAvailable()});
 if(!ready)return res.status(503).json({error:'Ambiente online ainda não configurado. Use a demonstração local.'});
 try{
 const client=db();let actor=null;
 const token=req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
 if(token){const {data,error}=await client.auth.getUser(token);if(error||!data.user?.email_confirmed_at)throw new DomainError('Entre com uma conta de e-mail confirmado.',401);actor={id:data.user.id,admin:(process.env.ADMIN_EMAILS||'').split(',').map(s=>s.trim().toLowerCase()).includes(data.user.email?.toLowerCase())};}
 const {data:row,error}=await client.from('arena_state').select('state,revision').eq('id','main').single();if(error)throw new Error('Database unavailable');waitUntil(processScheduledTournaments(client).catch(()=>{}));if(actor)waitUntil(processSandra(client).catch(()=>{}));if(row.state.settings.analysisEnabled)waitUntil(processAnalysis(client).catch(()=>{}));
 if(action==='trust-cleanup'&&req.method==='GET'){await cleanupTrust(client);return res.status(200).json({ok:true});}waitUntil(cleanupTrust(client).catch(()=>{}));
 if(req.method==='GET'&&action==='state')return res.status(200).json({state:publicState(row.state,actor?.id,actor?.admin),revision:row.revision,actor});
 if(req.method==='GET'&&action==='trust-evidence'){if(!actor?.admin)throw new DomainError('Acesso exclusivo da administração.',403);const user=query.get('user'),kind=query.get('kind');if(['identity','document','selfie'].includes(kind)&&(!row.state.identities?.[user]||Date.now()-row.state.identities[user].submittedAt>30*86400000))throw new DomainError('Prazo do documento expirado.',410);if(kind==='camera'){const frame=row.state.games.find(g=>g.id===query.get('game'))?.cameraFrames?.[user];if(!frame||Date.now()-frame.at>300000)throw new DomainError('Quadro expirado.',410);}await auditEvidenceAccess(client,user,kind,actor.id);if(kind==='identity'){const record=row.state.identities?.[user];if(!record)throw new DomainError('Identidade inexistente.');return res.status(200).json({details:JSON.parse(unseal(record.sealed).toString())});}const path=kind==='document'?row.state.identities?.[user]?.documentPath:kind==='selfie'?row.state.identities?.[user]?.selfiePath:kind==='camera'?row.state.games.find(g=>g.id===query.get('game'))?.cameraFrames?.[user]?.path:null;if(!path)throw new DomainError('Documento indisponível.');return res.status(200).json({image:'data:image/jpeg;base64,'+(await readPrivate(client.storage,path)).toString('base64')});}
 if(req.method!=='POST')throw new DomainError('Método não permitido.',405);
 if(!actor)throw new DomainError('Entre na sua conta.',401);
 let body=typeof req.body==='string'?JSON.parse(req.body):req.body;
 if(action==='identity-submit'||action==='camera-frame'){if(!row.state.players[actor.id]||row.state.players[actor.id].status!=='active')throw new DomainError('Conta indisponível.',403);if(!trustConfigured())throw new DomainError('Fiscalização aguardando configuração segura.',503);if(action==='identity-submit'){const payload=identityPayload(body);privateImage(body.document);privateImage(body.selfie);const command={id:crypto.randomUUID(),type:'identity_submit',payload:{...payload,documentPath:'pending',selfiePath:'pending'}};applyCommand(row.state,{...actor,server:true},command);payload.documentPath=await putPrivate(client.storage,actor.id,'document',body.document);payload.selfiePath=await putPrivate(client.storage,actor.id,'selfie',body.selfie);body={...command,payload};}else{const payload={game:body.game,notice:body.notice,path:'pending'};const command={id:crypto.randomUUID(),type:'camera_frame',payload};applyCommand(row.state,{...actor,server:true},command);payload.path=await putPrivate(client.storage,actor.id,'camera',body.image);body={...command,payload};}actor={...actor,server:true};}
 if(action==='tournament-cover'){if(!actor.admin)throw new DomainError('Acesso exclusivo da administração.',403);const coverPath=await storeAvatar(client.storage,'tournament-'+actor.id,body?.image);return res.status(200).json({coverPath});}
 if(action==='sandra-avatar'){if(!actor.admin)throw new DomainError('Acesso exclusivo da administração.',403);if(Date.now()-(row.state.players['arena-sandra']?.avatarUpdatedAt||0)<30000)throw new DomainError('Aguarde 30 segundos antes de trocar o avatar da Sandra.');const avatarPath=body?.remove===true?null:await storeAvatar(client.storage,'arena-sandra',body?.image);body={id:crypto.randomUUID(),type:'sandra_avatar',payload:{avatarPath}};actor={...actor,server:true};}
 if(action==='avatar'){if(!row.state.players[actor.id]||row.state.players[actor.id].status!=='active')throw new DomainError('Conta indisponível.',403);if(Date.now()-(row.state.players[actor.id].avatarUpdatedAt||0)<30000)throw new DomainError('Aguarde 30 segundos antes de trocar a foto.');const avatarPath=await storeAvatar(client.storage,actor.id,body?.image);body={id:crypto.randomUUID(),type:'profile_update',payload:{avatarPath}};}
 if(body?.type==='settings'&&(body.payload?.requireIdentityForStake||body.payload?.cameraForStake)&&!trustConfigured())throw new DomainError('Configure a criptografia antes de ativar a fiscalização.',503);
 if(body?.type==='tournament_create'&&body.payload?.cameraFinal&&!trustConfigured())throw new DomainError('Configure a câmera privada antes de criar esta final.',503);
 if(!body||JSON.stringify(body).length>5000)throw new DomainError('Solicitação inválida.');
 if(body.type==='demo_credit')throw new DomainError('Recargas serão liberadas após a ativação dos pagamentos.',403);
 // Compare-and-swap retries make reservations, acceptance and settlement atomic.
 let current=row;
 for(let attempt=0;attempt<5;attempt++){
 const next=applyCommand(current.state||initialState(),actor,body);
 const {data:ok,error:writeError}=await client.rpc('arena_compare_and_swap',{expected_revision:current.revision,next_state:next});if(writeError)throw new Error('Write failed');
 if(ok){if(action==='camera-frame'){const old=current.state.games.find(g=>g.id===body.payload.game)?.cameraFrames?.[actor.id]?.path;if(old)waitUntil(client.storage.from('arena-trust-private').remove([old]).then(()=>{}).catch(()=>{}));}waitUntil(processSandra(client).catch(()=>{}));if(next.settings.analysisEnabled)waitUntil(processAnalysis(client).catch(()=>{}));return res.status(200).json({state:publicState(next,actor.id,actor.admin),revision:current.revision+1,actor:actor?{id:actor.id,admin:actor.admin}:null});}
 const refreshed=await client.from('arena_state').select('state,revision').eq('id','main').single();if(refreshed.error)throw new Error('Refresh failed');current=refreshed.data;
 }
 throw new DomainError('Outro lance está sendo processado. Atualize e tente novamente.',409);
 }catch(e){const status=e instanceof DomainError?e.status:500;return res.status(status).json({error:status===500?'Não foi possível concluir a operação. Tente novamente.':e.message});}
}

export async function processScheduledTournaments(client,now=Date.now()){for(let attempt=0;attempt<5;attempt++){const {data:row,error}=await client.from('arena_state').select('state,revision').eq('id','main').single();if(error||!row)return;const due=row.state.tournaments.filter(t=>t.economics==='fixed'&&t.status==='registration'&&t.startsAt<=now);let next=row.state;for(const t of due){try{next=applyCommand(next,{id:t.createdBy,admin:true},{id:'scheduled-start-'+t.id,type:'tournament_start',payload:{id:t.id}},now);}catch(error){if(!(error instanceof DomainError))throw error;}}if(next===row.state)return;const {data:ok,error:writeError}=await client.rpc('arena_compare_and_swap',{expected_revision:row.revision,next_state:next});if(writeError)throw Error('Tournament write failed');if(ok)return;}}
