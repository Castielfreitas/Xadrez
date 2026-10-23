import {timingSafeEqual} from 'node:crypto';
import {DomainError} from '../src/domain.js';
import {validCpf} from '../src/trust.js';

const origins={sandbox:'https://api-sandbox.asaas.com/v3',production:'https://api.asaas.com/v3'};
const validToken=value=>typeof value==='string'&&value.length>=32&&value.length<=255&&!/\s/.test(value);
const requireValue=(ok,message)=>{if(!ok)throw new DomainError(message);};

// Readiness is private administrative metadata; it never exposes credential values.
export function asaasReadiness(env=process.env){
 const inferred=env.ASAAS_API_KEY?.startsWith('$aact_prod_')?'production':env.ASAAS_API_KEY?.startsWith('$aact_hmlg_')?'sandbox':null;
 let environment=env.ASAAS_ENVIRONMENT?(Object.hasOwn(origins,env.ASAAS_ENVIRONMENT)?env.ASAAS_ENVIRONMENT:null):inferred;
 if(inferred&&environment!==inferred)environment=null;
 const apiKey=Boolean(env.ASAAS_API_KEY?.trim());
 const webhookToken=validToken(env.ASAAS_WEBHOOK_TOKEN)&&env.ASAAS_WEBHOOK_TOKEN!==env.ASAAS_API_KEY;
 return {provider:'asaas',environment,apiKeyConfigured:apiKey,webhookConfigured:webhookToken,credentialsConfigured:Boolean(environment&&apiKey&&webhookToken),businessModelApproved:env.ASAAS_BUSINESS_MODEL_APPROVED==='true',productionAuthorized:env.ASAAS_PRODUCTION_ENABLED==='true',paymentsEnabled:false,stage:'wallet'};
}

function cents(value){requireValue(Number.isSafeInteger(value)&&value>0&&value<=100000000,'Informe um valor válido em centavos.');return value/100;}
function reference(value){requireValue(typeof value==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(value),'Referência da operação inválida.');return value;}
function resource(value,prefix){requireValue(typeof value==='string'&&value.length<=100&&new RegExp('^'+prefix+'[A-Za-z0-9_-]+$').test(value),'Identificador Asaas inválido.');return encodeURIComponent(value);}
function date(value){requireValue(typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value),'Vencimento inválido.');const parsed=new Date(value+'T00:00:00Z');requireValue(Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===value,'Vencimento inválido.');return value;}

// Server-only provider adapter. Wallet mutations live in cash-ledger.js and payments.js.
// POST requests are deliberately never retried: externalReference is not a unique key.
export function createAsaasClient({env=process.env,fetchImpl=globalThis.fetch}={}){
 const status=asaasReadiness(env),key=env.ASAAS_API_KEY;
 async function request(path,body,{configuration=false}={}){
  if(!status.environment||!status.apiKeyConfigured||(body&&!status.credentialsConfigured))throw new DomainError('Integração Asaas aguardando configuração segura.',503);
  if(body&&!configuration&&status.environment==='production'&&(!status.businessModelApproved||!status.productionAuthorized))throw new DomainError('Operação em produção ainda não autorizada para a Arena.',403);
  let response;
  try{response=await fetchImpl(origins[status.environment]+path,{method:body?'POST':'GET',headers:{access_token:key,'User-Agent':'ArenaXadrez/1.0','Content-Type':'application/json',Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(10000),...(body?{body:JSON.stringify(body)}:{})});}
  catch{throw new DomainError('Resposta do Asaas inconclusiva. Concilie a operação antes de tentar novamente.',502);}
  // Do not echo upstream errors: they may contain CPF, account details or credentials.
  if(!response.ok)throw new DomainError('O Asaas não confirmou a operação. Consulte o registro privado da integração.',502);
  try{return await response.json();}catch{throw new DomainError('Resposta do Asaas inválida. Concilie a operação antes de tentar novamente.',502);}
 }
 return {
  confirmSandboxPayment(id){requireValue(status.environment==='sandbox','Simulação permitida somente no Sandbox.');return request('/sandbox/payment/'+resource(id,'pay_')+'/confirm',{});},
  getBalance(){return request('/finance/balance');},
  getAccountStatus(){return request('/myAccount/status');},
  listWebhooks(){return request('/webhooks');},
  createWebhook({url,email}){
   requireValue(typeof url==='string'&&/^https:\/\/[a-z0-9]+\.supabase\.co\/functions\/v1\/arena-finance\?action=asaas-webhook$/.test(url),'URL de webhook inválida.');
   requireValue(typeof email==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),'E-mail inválido.');
   return request('/webhooks',{name:'Arena Xadrez '+status.environment,url,email,enabled:true,interrupted:false,authToken:env.ASAAS_WEBHOOK_TOKEN,sendType:'SEQUENTIALLY',events:['PAYMENT_RECEIVED','PAYMENT_CONFIRMED','PAYMENT_REFUNDED','PAYMENT_REFUND_IN_PROGRESS','PAYMENT_CHARGEBACK_REQUESTED','PAYMENT_CHARGEBACK_DISPUTE','PAYMENT_AWAITING_CHARGEBACK_REVERSAL','TRANSFER_CREATED','TRANSFER_PENDING','TRANSFER_DONE','TRANSFER_FAILED','TRANSFER_CANCELLED']},{configuration:true});
  },
  async createCustomer({name,cpf,email,externalReference}){
   requireValue(typeof name==='string'&&name.trim().length>=5&&name.length<=120,'Nome completo inválido.');
   requireValue(validCpf(cpf),'CPF inválido.');
   requireValue(typeof email==='string'&&email.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),'E-mail inválido.');
   return request('/customers',{name:name.trim(),cpfCnpj:String(cpf).replace(/\D/g,''),email,externalReference:reference(externalReference),notificationDisabled:true});
  },
  createPixCharge({customer,amountCents,dueDate,externalReference}){
   resource(customer,'cus_');
   return request('/payments',{customer,billingType:'PIX',value:cents(amountCents),dueDate:date(dueDate),externalReference:reference(externalReference),description:'Recarga de saldo Arena Xadrez',interest:{value:0},fine:{value:0}});
  },
  createCardCharge({customer,amountCents,dueDate,externalReference}){
   resource(customer,'cus_');
   return request('/payments',{customer,billingType:'CREDIT_CARD',value:cents(amountCents),dueDate:date(dueDate),externalReference:reference(externalReference),description:'Recarga de saldo Arena Xadrez',interest:{value:0},fine:{value:0}});
  },
  getPayment(id){return request('/payments/'+resource(id,'pay_'));},
  listPaymentRefunds(id){return request('/payments/'+resource(id,'pay_')+'/refunds');},
  getPixQrCode(id){return request('/payments/'+resource(id,'pay_')+'/pixQrCode');},
  findPayments(externalReference){return request('/payments?externalReference='+reference(externalReference));},
  createPixTransfer({amountCents,verifiedCpf,pixCpf,externalReference}){
   // Initial payout rail is CPF only. Caller must obtain verifiedCpf from server-side KYC.
   requireValue(validCpf(verifiedCpf)&&validCpf(pixCpf),'CPF do titular inválido.');
   const cpf=String(verifiedCpf).replace(/\D/g,''),destination=String(pixCpf).replace(/\D/g,'');
   requireValue(cpf===destination,'O saque deve usar uma chave Pix CPF do mesmo titular.');
   return request('/transfers',{value:cents(amountCents),pixAddressKey:destination,pixAddressKeyType:'CPF',externalReference:reference(externalReference),description:'Saque Arena Xadrez'});
  },
  async findTransfers(externalReference,createdAt=Date.now()){
   reference(externalReference);requireValue(Number.isFinite(createdAt),'Data da transferência inválida.');const since=date(new Date(createdAt-86400000).toISOString().slice(0,10)),matches=[];
   for(let offset=0;offset<500;offset+=100){const page=await request('/transfers?limit=100&offset='+offset+'&dateCreated%5Bge%5D='+since);requireValue(Array.isArray(page.data),'Lista de transferências inválida.');matches.push(...page.data.filter(t=>t.externalReference===externalReference));if(!page.hasMore)return {data:matches};}
   throw new DomainError('Histórico extenso: concilie esta transferência antes de continuar.',409);
  },
  getTransfer(id){return request('/transfers/'+resource(id,''));},
 };
}

export function authenticateAsaasWebhook(headers,env=process.env){
 const expected=env.ASAAS_WEBHOOK_TOKEN,received=headers?.['asaas-access-token'];
 if(!validToken(expected)||expected===env.ASAAS_API_KEY||typeof received!=='string'||received.length>255)return false;
 const a=Buffer.from(expected),b=Buffer.from(received);return a.length===b.length&&timingSafeEqual(a,b);
}

// Card details stay on Asaas. Never redirect a player to an arbitrary provider URL.
export function cardInvoiceUrl(value,environment){
 let url;try{url=new URL(value);}catch{throw new DomainError('Página de pagamento inválida.',502);}
 const host=environment==='production'?'www.asaas.com':environment==='sandbox'?'sandbox.asaas.com':null;
 requireValue(host&&url.protocol==='https:'&&url.hostname===host&&!url.username&&!url.password&&!url.port&&url.pathname.startsWith('/i/'),'Página de pagamento inválida.');
 return url.href;
}
