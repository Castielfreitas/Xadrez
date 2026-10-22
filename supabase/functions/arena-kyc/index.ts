// Dedicated Didit KYC integration. No payment enablement and no bypass for sandbox identities.
import {createClient} from 'npm:@supabase/supabase-js@2.118.0';

const enc=new TextEncoder(),apiBase='https://verification.didit.me/v3/session/';
const corsOrigin=origin=>{try{const u=new URL(origin);return u.protocol==='https:'&&(u.hostname==='arena-xadrez.vercel.app'||/^arena-xadrez-[a-z0-9-]+-xadres\.vercel\.app$/.test(u.hostname))&&!u.port;}catch{return false;}};
const json=(data,status=200,origin='')=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin',...(origin?{'Access-Control-Allow-Origin':origin}:{}),'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'GET,POST,OPTIONS'}});
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
const env=()=>Deno.env.get('DIDIT_ENVIRONMENT')==='production'?'production':'sandbox';
const key=()=>Deno.env.get('DIDIT_API_KEY')||'';
const workflow=()=>Deno.env.get('DIDIT_WORKFLOW_ID')||'';
const configured=()=>Boolean(key().length>15&&workflow().length>5);
const concat=(...parts)=>{const n=new Uint8Array(parts.reduce((s,a)=>s+a.length,0));let p=0;for(const a of parts){n.set(a,p);p+=a.length;}return n;};
function isCpf(input){const cpf=String(input||'').replace(/\D/g,'');if(!/^\d{11}$/.test(cpf)||/^(\d)\1{10}$/.test(cpf))return false;for(let n=9;n<=10;n++){let sum=0;for(let i=0;i<n;i++)sum+=Number(cpf[i])*(n+1-i);if((sum*10)%11%10!==Number(cpf[n]))return false;}return true;}
async function kdf(root,label){if(!/^[a-f0-9]{64}$/i.test(root||''))fail('Criptografia de identidade indisponível.',503);const bytes=Uint8Array.from(root.match(/.{2}/g),v=>parseInt(v,16));const key=await crypto.subtle.importKey('raw',bytes,'HKDF',false,['deriveBits']);return new Uint8Array(await crypto.subtle.deriveBits({name:'HKDF',hash:'SHA-256',salt:enc.encode('arena-trust-v1'),info:enc.encode(label)},key,256));}
async function protectIdentity(root,cpf,name,birthDate){
 const hkey=await crypto.subtle.importKey('raw',await kdf(root,'cpf-deduplication'),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const hash=new Uint8Array(await crypto.subtle.sign('HMAC',hkey,enc.encode(cpf)));
 const cpfHash=Array.from(hash,b=>b.toString(16).padStart(2,'0')).join('');
 const akey=await crypto.subtle.importKey('raw',await kdf(root,'encryption'),{name:'AES-GCM'},false,['encrypt']);
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const cipher=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,tagLength:128},akey,enc.encode(JSON.stringify({cpf,name,birthDate}))));
 const bytes=concat(iv,cipher.slice(-16),cipher.slice(0,-16));
 const sealed=btoa(String.fromCharCode(...bytes));
 return {cpfHash,sealed};
}
const validIdentity=record=>{
 const checked=(arr)=>Array.isArray(arr)&&arr.some(v=>v.status==='Approved');
 if(record?.status!=='Approved')return null;
 if(!checked(record.id_verifications)||!checked(record.liveness_checks)||!checked(record.face_matches))return null;
 const id=record.id_verifications.find(v=>v.status==='Approved');
 const cpf=String(id.personal_number||id.document_number||'').replace(/\D/g,'');
 const name=String(id.full_name||'').trim(),birthDate=String(id.date_of_birth||'');
 if(!isCpf(cpf)||name.length<5||!/^(19|20)\d\d-\d\d-\d\d$/.test(birthDate))return null;
 const years=Date.now()-Date.parse(birthDate+'T00:00:00Z');
 if(!Number.isFinite(years)||years<18*365.25*86400000||years>120*365.25*86400000)return null;
 if(Deno.env.get('DIDIT_REQUIRE_AML')!=='false'&&!checked(record.aml_screenings))return null;
 const warnings=Array.isArray(record.warnings)?record.warnings:[];
 if(warnings.some(w=>String(w?.risk||'').toLowerCase()==='high'))return null;
 return {cpf,name,birthDate};
};
async function provider(path,options={}){
 const response=await fetch(apiBase+path,{...options,headers:{'x-api-key':key(),'Content-Type':'application/json',...(options.headers||{})},signal:AbortSignal.timeout(14000)});
 if(!response.ok)fail('O verificador de identidade está indisponível.',502);
 const data=await response.json();return data;
}
async function configKey(db){
 const {data,error}=await db.rpc('arena_finance_config_read');
 if(error||!data?.kyc)fail('Configuração KYC indisponível.',503);
 return data.kyc;
}
async function syncVerified(db,row,decision){
 const data=validIdentity(decision);
 if(!data)return 'in_review';
 // Sandbox returns test status, NEVER changes the financial identity used by BRL.
 if(row.environment!=='production')return 'verified';
 const protectedData=await protectIdentity(await configKey(db),data.cpf,data.name,data.birthDate);
 for(let attempt=0;attempt<5;attempt++){
  const {data:current,error}=await db.from('arena_state').select('state,revision').eq('id','main').single();
  if(error||!current)fail('Cadastro indisponível.',503);
  const state=current.state;
  if(state.players?.[row.user_id]?.status!=='active')return 'in_review';
  if(Object.entries(state.identities||{}).some(([u,r])=>u!==row.user_id&&r.cpfHash===protectedData.cpfHash))return 'in_review';
  if(state.identities?.[row.user_id]?.status==='verified')return 'verified';
  state.identities??={};
  state.identities[row.user_id]={...protectedData,status:'verified',submittedAt:Date.now(),reviewedAt:Date.now(),reviewer:'automated:didit',reason:'Documento, prova de vida e rosto verificados pelo provedor',notice:'arena-trust-v1',provider:'didit',providerSession:row.provider_session_id};
  state.audit??=[];state.audit.push({id:crypto.randomUUID(),actor:'system:didit',action:'identity_automated_verified',detail:{user:row.user_id},at:Date.now()});
  const {data:ok,error:writeError}=await db.rpc('arena_compare_and_swap',{expected_revision:current.revision,next_state:state});
  if(writeError)fail('Não foi possível finalizar a identidade.',503);
  if(ok)return 'verified';
 }
 return 'in_review';
}
Deno.serve(async req=>{
 const origin=req.headers.get('origin')||'';
 if(origin&&!corsOrigin(origin))return json({error:'Origem não autorizada.'},403);
 if(req.method==='OPTIONS')return json({},204,origin);
 try{
  const url=new URL(req.url),action=url.searchParams.get('action')||'health';
  if(action==='health')return json({service:'arena-kyc',environment:env(),configured:configured()},200,origin);
  if(!['GET','POST'].includes(req.method))fail('Método indisponível.',405);
  const token=req.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if(!token)fail('Entre na sua conta.',401);
  const address=Deno.env.get('SUPABASE_URL')||'',secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  if(!address||!secret)fail('Serviço de identificação indisponível.',503);
  // Never pass user token to this admin client: service-role is server-side only.
  const db=createClient(address,secret,{auth:{autoRefreshToken:false,persistSession:false}});
  const {data:authentication,error:authError}=await db.auth.getUser(token);
  const user=authentication?.user;
  if(authError||!user?.email_confirmed_at)fail('Confirme seu e-mail e entre novamente.',401);
  const {data:actorRow}=await db.from('arena_state').select('state').eq('id','main').single();
  if(actorRow?.state?.players?.[user.id]?.status!=='active')fail('Cadastro indisponível.',403);
  if(!configured())fail('Verificação automática aguardando credenciais do provedor.',503);
  if(action==='start'){
   if(req.method!=='POST')fail('Método inválido.',405);
   const {data:latest}=await db.from('arena_kyc_sessions').select('id,status,verification_url,created_at,provider_session_id').eq('user_id',user.id).eq('environment',env()).order('created_at',{ascending:false}).limit(5);
   const pending=latest?.find(x=>['initiating','pending','in_review'].includes(x.status));
   if(pending?.verification_url)return json({status:pending.status,url:pending.verification_url},200,origin);
   if(pending)fail('Verificação sendo criada. Atualize o status.',409);
   if((latest||[]).filter(x=>Date.now()-Date.parse(x.created_at)<86400000).length>=4)fail('Limite diário de verificações atingido.',429);
   const {data:reservation,error:insertError}=await db.from('arena_kyc_sessions').insert({user_id:user.id,environment:env()}).select('id').single();
   if(insertError||!reservation)fail('Já existe uma sessão em andamento.',409);
   try{
    const data=await provider('',{method:'POST',body:JSON.stringify({workflow_id:workflow(),vendor_data:user.id})});
    const url=String(data.url||data.session_url||'');
    if(!/^https:\/\/[a-z0-9.-]*didit\.me\//i.test(url)||!data.session_id)fail('Resposta de verificação inválida.',502);
    const {error:updateError}=await db.from('arena_kyc_sessions').update({provider_session_id:data.session_id,verification_url:url,status:'pending',updated_at:new Date().toISOString()}).eq('id',reservation.id);
    if(updateError)fail('Falha ao registrar a verificação.',503);
    return json({status:'pending',url},200,origin);
   }catch(e){await db.from('arena_kyc_sessions').update({status:'error'}).eq('id',reservation.id);throw e;}
  }
  if(action==='status'){
   if(req.method!=='GET')fail('Método inválido.',405);
   const {data:sessions,error}=await db.from('arena_kyc_sessions').select('id,user_id,provider_session_id,status,environment,created_at,checked_at').eq('user_id',user.id).eq('environment',env()).order('created_at',{ascending:false}).limit(1);
   if(error)fail('Verificação indisponível.',503);
   const row=sessions?.[0];if(!row)return json({status:'not_started',environment:env()},200,origin);
   if(row.status==='verified')return json({status:'verified',environment:env(),sandboxOnly:env()!=='production'},200,origin);
   if(!row.provider_session_id)return json({status:row.status},200,origin);
   if(row.checked_at&&Date.now()-Date.parse(row.checked_at)<7000)return json({status:row.status,environment:env()},200,origin);
   const decision=await provider(encodeURIComponent(row.provider_session_id)+'/decision/');
   let status='in_review';
   if(decision.status==='Approved')status=await syncVerified(db,row,decision);
   else if(decision.status==='Declined')status='rejected';
   else if(decision.status==='Expired')status='expired';
   else if(decision.status==='Not Finished'||decision.status==='In Progress'||decision.status==='Not Started')status='pending';
   await db.from('arena_kyc_sessions').update({status,decision_code:String(decision.status||'unknown').slice(0,40),checked_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',row.id).eq('user_id',user.id);
   return json({status,environment:env(),sandboxOnly:env()!=='production'},200,origin);
  }
  fail('Rota indisponível.',404);
 }catch(e){return json({error:e instanceof Error?e.message:'Erro interno.'},Number.isInteger(e?.status)?e.status:500,origin);}
});
