import {storeAvatar} from '../server/avatar.js';
import { waitUntil } from '@vercel/functions';
import { processAnalysis, engineAssetsAvailable } from '../server/analysis.js';
import { createClient } from '@supabase/supabase-js';
import { applyCommand, initialState, publicState, DomainError } from '../src/domain.js';
const config=()=>({url:process.env.SUPABASE_URL,key:process.env.SUPABASE_PUBLISHABLE_KEY});
const db=()=>createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 const action=new URL(req.url,'https://arena.local').searchParams.get('action')||'state';
 const c=config(),ready=Boolean(c.url&&c.key&&process.env.SUPABASE_SERVICE_ROLE_KEY);
 if(req.method==='GET'&&action==='config')return res.status(200).json({configured:ready,supabaseUrl:c.url||null,publishableKey:c.key||null,mode:'sandbox',paymentsEnabled:false,lichessEnabled:false,analysisWorkerConfigured:engineAssetsAvailable()});
 if(!ready)return res.status(503).json({error:'Ambiente online ainda não configurado. Use a demonstração local.'});
 try{
 const client=db();let actor=null;
 const token=req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
 if(token){const {data,error}=await client.auth.getUser(token);if(error||!data.user?.email_confirmed_at)throw new DomainError('Entre com uma conta de e-mail confirmado.',401);actor={id:data.user.id,admin:(process.env.ADMIN_EMAILS||'').split(',').map(s=>s.trim().toLowerCase()).includes(data.user.email?.toLowerCase())};}
 const {data:row,error}=await client.from('arena_state').select('state,revision').eq('id','main').single();if(error)throw new Error('Database unavailable');if(row.state.settings.analysisEnabled)waitUntil(processAnalysis(client).catch(()=>{}));
 if(req.method==='GET'&&action==='state')return res.status(200).json({state:publicState(row.state,actor?.id,actor?.admin),revision:row.revision,actor});
 if(req.method!=='POST')throw new DomainError('Método não permitido.',405);
 if(!actor)throw new DomainError('Entre na sua conta.',401);
 let body=typeof req.body==='string'?JSON.parse(req.body):req.body;
 if(action==='avatar'){if(!row.state.players[actor.id]||row.state.players[actor.id].status!=='active')throw new DomainError('Conta indisponível.',403);if(Date.now()-(row.state.players[actor.id].avatarUpdatedAt||0)<30000)throw new DomainError('Aguarde 30 segundos antes de trocar a foto.');const avatarPath=await storeAvatar(client.storage,actor.id,body?.image);body={id:crypto.randomUUID(),type:'profile_update',payload:{avatarPath}};}
 if(!body||JSON.stringify(body).length>5000)throw new DomainError('Solicitação inválida.');
 // Compare-and-swap retries make reservations, acceptance and settlement atomic.
 let current=row;
 for(let attempt=0;attempt<5;attempt++){
 const next=applyCommand(current.state||initialState(),actor,body);
 const {data:ok,error:writeError}=await client.rpc('arena_compare_and_swap',{expected_revision:current.revision,next_state:next});if(writeError)throw new Error('Write failed');
 if(ok){if(next.settings.analysisEnabled)waitUntil(processAnalysis(client).catch(()=>{}));return res.status(200).json({state:publicState(next,actor.id,actor.admin),revision:current.revision+1,actor});}
 const refreshed=await client.from('arena_state').select('state,revision').eq('id','main').single();if(refreshed.error)throw new Error('Refresh failed');current=refreshed.data;
 }
 throw new DomainError('Outro lance está sendo processado. Atualize e tente novamente.',409);
 }catch(e){const status=e instanceof DomainError?e.status:500;return res.status(status).json({error:status===500?'Não foi possível concluir a operação. Tente novamente.':e.message});}
}
