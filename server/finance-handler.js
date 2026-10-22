import {timingSafeEqual} from 'node:crypto';
import {DomainError,applyCommand,publicState,autoSettle,expireChallenges} from '../src/domain.js';
import {processScheduledTournaments} from './tournament-scheduler.js';
import {paymentsStatus,walletSummary,createDeposit,depositQr,depositCheckout,createWithdrawal,decideWithdrawal,receivePaymentEvent,reconcileWallet,cashTransaction,claimPlatformRevenue,registerAsaasWebhook} from './payments.js';
import {createAsaasClient} from './asaas.js';
import {cashBook} from './cash-ledger.js';
import {financialActor} from './finance-access.js';
import {identityPayload,putPrivate,privateImage,unseal,readPrivate,auditEvidenceAccess,cleanupTrust,setIdentityKey,trustConfigured} from './identity.js';
const same=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.length>=32&&a.length<=255&&Buffer.byteLength(a)===Buffer.byteLength(b)&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
export function allowedFinanceOrigin(origin){if(!origin)return true;try{const u=new URL(origin);return u.protocol==='https:'&&(u.hostname==='arena-xadrez.vercel.app'||/^arena-xadrez-[a-z0-9-]+-xadres\.vercel\.app$/.test(u.hostname))&&!u.port;}catch{return false;}}
export async function loadFinanceConfig(db,baseEnv=process.env){const {data:c,error}=await db.rpc('arena_finance_config_read');if(error||!c)throw new DomainError('Configuração financeira indisponível.',503);setIdentityKey(c.kyc);
 // Sandbox and production are isolated at the provider. Never carry the
 // Sandbox webhook_registration=true flag into a new production environment.
 if(c.environment==='production'){
  const {data:row,error:stateError}=await db.from('arena_state').select('state').eq('id','main').single();
  if(stateError||!row)throw new DomainError('Não foi possível confirmar o webhook produtivo.',503);
  const productionHook=row.state?.cash?.production?.webhookSetup;
  c.webhook_registered=Boolean(c.webhook_registered&&productionHook?.status==='registered'&&productionHook.id&&productionHook.id===c.webhook_id);
  if(!c.webhook_registered)c.webhook_setup_status='pending_production_registration';
 }
 return {config:c,env:{...baseEnv,ASAAS_API_KEY:baseEnv.ASAAS_API_KEY||c.asaas_key||'',ASAAS_ENVIRONMENT:c.environment,ASAAS_WEBHOOK_TOKEN:c.webhook,ASAAS_WALLET_ENABLED:String(c.wallet_enabled&&c.webhook_registered),ASAAS_GAMES_ENABLED:String(c.games_enabled),ASAAS_BUSINESS_MODEL_APPROVED:String(c.model_approved),ASAAS_PRODUCTION_ENABLED:String(c.production_enabled)}};}
// Read-only, admin-scoped go-live checklist. Never returns secrets, identity
// documents or account balances and never enables a financial feature flag.
export function productionReadiness(state,config,status,env,now=Date.now()){
 const identities=Object.entries(state.identities||{});
 const kyc=identities.filter(([id,r])=>state.players?.[id]?.status==='active'&&r.status==='verified'&&r.sealed&&Number.isFinite(r.submittedAt)&&now-r.submittedAt<30*86400000).length;
 const productionKey=env.ASAAS_API_KEY?.startsWith('$aact_prod_')===true;
 const checks={
  production_environment:status.environment==='production',
  production_api_key:productionKey&&status.apiKeyConfigured,
  webhook_authentication:status.webhookConfigured,
  production_webhook_registered:Boolean(config.webhook_registered)&&config.webhook_setup_status==='registered'&&status.environment==='production',
  identity_encryption:status.identityConfigured,
  verified_pilot_players:kyc>=2,
  business_model_approved:status.businessModelApproved===true,
  production_account_authorized:status.productionAuthorized===true,
  reconciliation_worker_recent:Boolean(config.last_worker_at)&&Number.isFinite(new Date(config.last_worker_at).getTime())&&(now-new Date(config.last_worker_at).getTime())<20*60*1000&&config.last_worker_status==='ok',
  automated_fair_play:state.settings?.analysisEnabled===true
 };
 return {ready:Object.values(checks).every(Boolean),checks,verifiedPilotPlayers:kyc,environment:status.environment,financialOperationsEnabled:status.paymentsEnabled,liveGamesEnabled:status.paymentsEnabled&&env.ASAAS_GAMES_ENABLED==='true',notice:'A aprovação contratual do Asaas e a conciliação real precisam ser verificadas externamente antes de habilitar depósitos.'};
}
export function createFinanceHandler({db,load=loadFinanceConfig,providerFactory=env=>createAsaasClient({env})}){
 return async request=>{
  const origin=request.headers.get('origin'),headers={'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Vary':'Origin'};
  if(origin&&allowedFinanceOrigin(origin))headers['Access-Control-Allow-Origin']=origin;
  const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers});
  if(!allowedFinanceOrigin(origin))return json({error:'Origem não autorizada.'},403);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
  try{
   const url=new URL(request.url),action=url.searchParams.get('action')||'health';
   const {config,env}=await load(db),status=paymentsStatus(env),provider=providerFactory(env);
   if(request.method==='GET'&&action==='health')return json({service:'arena-finance',version:1,trustConfigured:trustConfigured(),paymentsEnabled:status.paymentsEnabled,gamesEnabled:status.paymentsEnabled&&env.ASAAS_GAMES_ENABLED==='true',environment:status.environment});
   if(!['GET','POST'].includes(request.method))return json({error:'Método não permitido.'},405);
   const maxBody=action==='identity-submit'?2500000:action==='asaas-webhook'?131072:12000;let body={};if(request.method==='POST'){if(Number(request.headers.get('content-length'))>maxBody)throw new DomainError('Envio muito grande.',413);const raw=await request.text();if(raw.length>maxBody)throw new DomainError('Envio muito grande.',413);try{body=JSON.parse(raw||'{}');}catch{throw new DomainError('JSON inválido.');}}
   if(action==='asaas-webhook'){
    if(request.method!=='POST')throw new DomainError('Método não permitido.',405);
    const result=await receivePaymentEvent(db,{'asaas-access-token':request.headers.get('asaas-access-token')},body,{env});
    // Acknowledge only after durable persistence. Cron performs authoritative reconciliation.
    return json(result);
   }
   if(action==='reconcile'){
    if(request.method!=='POST'||!same(request.headers.get('x-arena-worker-token'),config.worker))throw new DomainError('Acesso não autorizado.',401);
    let result={skipped:'provider_not_configured'};
    if(status.credentialsConfigured){if(!config.webhook_registered)await registerAsaasWebhook(db,{env,provider,endpoint:url.origin+url.pathname+'?action=asaas-webhook',email:config.admin_emails?.[0]});result=await reconcileWallet(db,{env,provider});}
    await cashTransaction(db,state=>{expireChallenges(state);autoSettle(state);});await processScheduledTournaments(db);await cleanupTrust(db);
    await db.rpc('arena_finance_runtime_update',{patch:{worker_status:result.skipped||'ok'}});return json(result);
   }
   const token=request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];if(!token)throw new DomainError('Entre na sua conta.',401);
   const {data:auth,error:authError}=await db.auth.getUser(token);if(authError||!auth.user?.email_confirmed_at)throw new DomainError('Entre com uma conta de e-mail confirmado.',401);
   const actor={id:auth.user.id,email:auth.user.email,admin:(config.admin_emails||[]).some(e=>e.toLowerCase()===auth.user.email?.toLowerCase())};
   const {data:row,error}=await db.from('arena_state').select('state,revision').eq('id','main').single();if(error||!row)throw new DomainError('Carteira indisponível.',503);
   if(row.state.players[actor.id]?.status!=='active')throw new DomainError('Conta indisponível.',403);
   if(request.method==='GET'){
    if(action==='production-readiness'){if(!actor.admin)throw new DomainError('Acesso exclusivo da administração.',403);return json(productionReadiness(row.state,config,status,env));}
    if(action==='wallet-summary')return json({...walletSummary(row.state,actor,env),...(actor.admin?{setup:{webhookRegistered:config.webhook_registered,webhookStatus:config.webhook_setup_status,lastWorkerAt:config.last_worker_at,lastWorkerStatus:config.last_worker_status}}:{})});
    if(action==='wallet-pix')return json(await depositQr(db,actor,url.searchParams.get('id'),{env,provider}));
    if(action==='wallet-checkout')return json(await depositCheckout(db,actor,url.searchParams.get('id'),{env,provider}));
    if(action==='asaas-status'){if(!actor.admin)throw new DomainError('Acesso exclusivo da administração.',403);if(url.searchParams.get('check')==='true')await provider.getBalance();return json({connected:true,status});}
    if(action==='trust-evidence'){
     if(!actor.admin)throw new DomainError('Acesso exclusivo da administração.',403);const user=url.searchParams.get('user'),kind=url.searchParams.get('kind'),record=row.state.identities?.[user];
     if(!record||Date.now()-record.submittedAt>30*86400000)throw new DomainError('Documento indisponível ou expirado.',410);
     if(!['identity','document','selfie'].includes(kind))throw new DomainError('Evidência inválida.');await auditEvidenceAccess(db,user,kind,actor.id);
     if(kind==='identity')return json({details:JSON.parse(unseal(record.sealed).toString())});
     const path=kind==='document'?record.documentPath:record.selfiePath;if(!path)throw new DomainError('Documento indisponível.',404);
     return json({image:'data:image/jpeg;base64,'+(await readPrivate(db.storage,path)).toString('base64')});
    }
    throw new DomainError('Rota não encontrada.',404);
   }
   if(action==='identity-submit'){
    const payload=identityPayload(body);privateImage(body.document);privateImage(body.selfie);
    const command={id:crypto.randomUUID(),type:'identity_submit',payload:{...payload,documentPath:'pending',selfiePath:'pending'}};applyCommand(row.state,{...actor,server:true},command);
    const paths=[];try{payload.documentPath=await putPrivate(db.storage,actor.id,'document',body.document);paths.push(payload.documentPath);payload.selfiePath=await putPrivate(db.storage,actor.id,'selfie',body.selfie);paths.push(payload.selfiePath);
     const result=await cashTransaction(db,state=>{const next=applyCommand(state,{...actor,server:true},{...command,payload});Object.assign(state,next);return true;});return json({state:publicState(result.state,actor.id,actor.admin),actor:{id:actor.id,admin:actor.admin}});
    }catch(e){if(paths.length)await db.storage.from('arena-trust-private').remove(paths);throw e;}
   }
   if(JSON.stringify(body).length>6000)throw new DomainError('Solicitação inválida.');
   if(action==='wallet-deposit')return json({operation:await createDeposit(db,actor,body,{env,provider})});
   if(action==='wallet-withdraw')return json({operation:await createWithdrawal(db,actor,body,{env})});
   if(action==='wallet-withdraw-decision')return json({operation:await decideWithdrawal(db,actor,body,{env,provider})});
   if(action==='wallet-platform-transfer')return json(await claimPlatformRevenue(db,actor,body,{env}));
   if(action==='command'){
    if(['demo_credit','sandra_fund'].includes(body.type))throw new DomainError('Operação indisponível.',403);
    const result=await cashTransaction(db,state=>{const next=applyCommand(state,financialActor(state,actor,body,env),body);Object.assign(state,next);return true;});return json({state:publicState(result.state,actor.id,actor.admin),actor:{id:actor.id,admin:actor.admin}});
   }
   if(action==='finance-register-webhook'){
    if(!actor.admin)throw new DomainError('Acesso exclusivo da administração.',403);
    return json(await registerAsaasWebhook(db,{env,provider,endpoint:url.origin+url.pathname+'?action=asaas-webhook',email:actor.email}));
   }
   throw new DomainError('Rota não encontrada.',404);
  }catch(error){return json({error:error instanceof DomainError?error.message:'Não foi possível concluir a operação.'},error instanceof DomainError?error.status:500);}
 };
}
