import {createHash} from 'node:crypto';
import {bankDestination,sameBankDestination} from './bank-destination.js';
import {createAsaasClient,asaasReadiness,authenticateAsaasWebhook,cardInvoiceUrl} from './asaas.js';
import {trustConfigured,unseal,seal} from './identity.js';
import {PAYMENT_NOTICE,check,moneyCents,cashBook,cashAccount,cashView,beginDeposit,bindCustomer,bindPayment,settleDeposit,requestWithdrawal,claimWithdrawal,bindTransfer,settleWithdrawal,rejectWithdrawal,operationId} from './cash-ledger.js';

export function paymentsStatus(env=process.env){const p=asaasReadiness(env);return {...p,identityConfigured:trustConfigured(),paymentsEnabled:Boolean(p.credentialsConfigured&&trustConfigured()&&env.ASAAS_WALLET_ENABLED==='true'&&(p.environment==='sandbox'||p.businessModelApproved&&p.productionAuthorized))};}
export async function cashTransaction(db,mutate){
 for(let attempt=0;attempt<6;attempt++){
  const {data:row,error}=await db.from('arena_state').select('state,revision').eq('id','main').single();check(!error&&row,'Carteira temporariamente indisponível.',503);
  const next=structuredClone(row.state),result=mutate(next);
  const {data:ok,error:writeError}=await db.rpc('arena_compare_and_swap',{expected_revision:row.revision,next_state:next});check(!writeError,'Carteira temporariamente indisponível.',503);if(ok)return {state:next,result};
 }
 check(false,'Outra movimentação está sendo processada. Tente novamente.',409);
}
function active(state,user){check(state.players[user]?.status==='active','Conta indisponível.',403);}
function financialIdentity(state,user){
 active(state,user);const identity=state.identities?.[user];check(identity?.status==='verified'&&identity.sealed&&Date.now()-identity.submittedAt<30*86400000,'Verifique sua identidade antes de movimentar reais.',403);
 return JSON.parse(unseal(identity.sealed).toString());
}
function enabled(env){const status=paymentsStatus(env);check(status.paymentsEnabled,'Recargas e saques aguardam a ativação da integração.',503);return status.environment;}
function publicOperation({sealedCpf,sealedBankAccount,destinationHash,...operation}){return operation;}

export async function createDeposit(db,actor,input,{env=process.env,provider=createAsaasClient({env}),now=Date.now()}={}){
 const environment=enabled(env),method=input.method||'PIX';check(['PIX','CARD'].includes(method),'Forma de pagamento inválida.');check(input.consent===PAYMENT_NOTICE,'Confirme o compartilhamento dos dados de cobrança.');operationId(input.id);
 const reservation=await cashTransaction(db,state=>{const identity=financialIdentity(state,actor.id);return {...beginDeposit(state,environment,actor.id,input.id,input.amountCents,now,method),identity};});
 let d=reservation.result.operation;
 if(!reservation.result.claimed)return publicOperation(d);
 try{
  if(!d.customerId){const identity=reservation.result.identity;const customer=await provider.createCustomer({name:identity.name,cpf:identity.cpf,email:actor.email,externalReference:'arena_'+actor.id});await cashTransaction(db,state=>bindCustomer(state,environment,d.id,customer.id));d={...d,customerId:customer.id};}
  const dueDate=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now));
  const payment=await provider[method==='CARD'?'createCardCharge':'createPixCharge']({customer:d.customerId,amountCents:d.amount,dueDate,externalReference:d.id});
  const stored=await cashTransaction(db,state=>{bindPayment(state,environment,d.id,payment.id);return cashBook(state,environment).deposits[d.id];});return publicOperation(stored.result);
 }catch(error){await cashTransaction(db,state=>{const op=cashBook(state,environment).deposits[d.id];if(op&&op.status==='creating')op.status='uncertain';});throw error;}
}
export async function depositQr(db,actor,id,{env=process.env,provider=createAsaasClient({env})}={}){
 operationId(id);const p=asaasReadiness(env);check(p.environment,'Ambiente financeiro não configurado.',503);const {data:row,error}=await db.from('arena_state').select('state,revision').eq('id','main').single();check(!error&&row,'Carteira indisponível.',503);
 active(row.state,actor.id);const d=cashBook(row.state,p.environment).deposits[id];check(d?.user===actor.id,'Recarga não encontrada.',404);check((d.method||'PIX')==='PIX'&&d.paymentId&&d.status==='pending','Recarga indisponível para pagamento.');
 const qr=await provider.getPixQrCode(d.paymentId);check(typeof qr.encodedImage==='string'&&qr.encodedImage.length<1000000&&/^[A-Za-z0-9+/=]+$/.test(qr.encodedImage)&&typeof qr.payload==='string'&&qr.payload.length<=2048,'QR Code inválido.',502);
 return {encodedImage:qr.encodedImage,payload:qr.payload,expirationDate:qr.expirationDate};
}
export async function depositCheckout(db,actor,id,{env=process.env,provider=createAsaasClient({env})}={}){
 operationId(id);const environment=asaasReadiness(env).environment;check(environment,'Ambiente financeiro não configurado.',503);
 const {data:row,error}=await db.from('arena_state').select('state,revision').eq('id','main').single();check(!error&&row,'Carteira indisponível.',503);
 active(row.state,actor.id);const d=cashBook(row.state,environment).deposits[id];check(d?.user===actor.id,'Recarga não encontrada.',404);
 check(d.method==='CARD'&&d.paymentId&&d.status==='pending','Recarga indisponível para pagamento.');
 const payment=await provider.getPayment(d.paymentId);
 check(payment.id===d.paymentId&&payment.customer===d.customerId&&payment.externalReference===d.id&&moneyCents(payment.value)===d.amount&&['CREDIT_CARD','DEBIT_CARD'].includes(payment.billingType)&&!payment.deleted&&['PENDING','OVERDUE'].includes(payment.status),'Cobrança indisponível ou divergente.',409);
 return {url:cardInvoiceUrl(payment.invoiceUrl,environment)};
}
export async function createWithdrawal(db,actor,input,{env=process.env}={}){
 const environment=enabled(env);check(!input.method||['PIX','TED'].includes(input.method),'Saque por cartão ou transferência internacional não disponível neste provedor.');check(input.consent===PAYMENT_NOTICE,'Confirme as condições do saque.');
 const r=await cashTransaction(db,state=>{const identity=financialIdentity(state,actor.id),method=input.method||'PIX';
  const account=method==='TED'?bankDestination(input.bankAccount,identity):null;
  const destination={method,...(account?{sealedBankAccount:seal(JSON.stringify(account)).toString('base64'),destinationHash:createHash('sha256').update(JSON.stringify(account)).digest('hex'),destinationLabel:'Banco '+account.bank.code+' · conta ••••'+account.account.slice(-2)+'-'+account.accountDigit}:{})};
  return requestWithdrawal(state,environment,actor.id,input.id,input.amountCents,seal(identity.cpf).toString('base64'),Date.now(),destination);});return publicOperation(r.result);
}
export async function decideWithdrawal(db,actor,input,{env=process.env,provider=createAsaasClient({env})}={}){
 check(actor.admin,'Acesso exclusivo da administração.',403);const environment=enabled(env);operationId(input.id);check(['approve','reject'].includes(input.decision),'Decisão inválida.');
 if(input.decision==='reject'){await cashTransaction(db,state=>rejectWithdrawal(state,environment,input.id,actor.id));return {status:'rejected'};}
 const r=await cashTransaction(db,state=>{const w=cashBook(state,environment).withdrawals[input.id];check(w,'Saque não encontrado.',404);financialIdentity(state,w.user);return claimWithdrawal(state,environment,input.id,actor.id);});
 const w=r.result.operation;if(!r.result.claimed)return publicOperation(w);
 let submitted=false;try{
  const identity=await cashTransaction(db,state=>financialIdentity(state,w.user)),cpf=unseal(w.sealedCpf).toString();check(identity.result.cpf===cpf,'Identidade do saque alterada.');
  if(provider.getBalance){const balance=await provider.getBalance();check(moneyCents(balance.balance)>=w.amount,'Saldo do provedor insuficiente para este saque.',409);}
  let bankAccount;if(w.method==='TED'){bankAccount=JSON.parse(unseal(w.sealedBankAccount).toString());check(bankAccount.cpfCnpj===cpf&&bankAccount.ownerName===identity.result.name.trim(),'Titularidade bancária alterada.');check(typeof provider.createBankTransfer==='function','Saque bancário indisponível.',503);}
  submitted=true;const transfer=w.method==='TED'?await provider.createBankTransfer({amountCents:w.amount,verifiedCpf:cpf,bankAccount,externalReference:w.id}):await provider.createPixTransfer({amountCents:w.amount,verifiedCpf:cpf,pixCpf:cpf,externalReference:w.id});
  const stored=await cashTransaction(db,state=>{bindTransfer(state,environment,w.id,transfer.id);return cashBook(state,environment).withdrawals[w.id];});return publicOperation(stored.result);
 }catch(error){await cashTransaction(db,state=>{const op=cashBook(state,environment).withdrawals[w.id];if(op?.status==='submitting')op.status=submitted?'uncertain':'requested';});throw error;}
}
export async function receivePaymentEvent(db,headers,input,{env=process.env,now=Date.now()}={}){
 check(authenticateAsaasWebhook(headers,env),'Notificação não autorizada.',401);const environment=asaasReadiness(env).environment;check(environment,'Ambiente financeiro não configurado.',503);
 check(typeof input?.id==='string'&&input.id.length>0&&input.id.length<=200&&typeof input.event==='string'&&input.event.length<=100,'Notificação inválida.');
 const kind=input.event.startsWith('PAYMENT_')?'payment':input.event.startsWith('TRANSFER_')?'transfer':null;
 const resource=input[kind]?.id;check(!kind||typeof resource==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(resource),'Recurso inválido.');
 await cashTransaction(db,state=>{const b=cashBook(state,environment),key='event:'+input.id;if(!Object.hasOwn(b.inbox,key))b.inbox[key]={id:input.id,event:input.event,resource,kind,status:kind?'pending':'done',receivedAt:now,attempts:0};});
 return {received:true};
}
function verifyRecoveredTransfer(state,environment,transfer){
 const w=cashBook(state,environment).withdrawals[transfer.externalReference];if(!w||['done','failed'].includes(w.status))return;
 if(w.method==='TED'){const expected=JSON.parse(unseal(w.sealedBankAccount).toString());check(transfer.operationType==='TED'&&sameBankDestination(expected,transfer.bankAccount),'Destino bancário do saque não confirmado. Revisão necessária.',409);return;}
 if(w.transferId)return;
 check(w.sealedCpf&&typeof transfer.pixAddressKey==='string'&&transfer.pixAddressKey.replace(/\D/g,'')===unseal(w.sealedCpf).toString(),'Destino do saque não confirmado. Revisão necessária.',409);
}
let processing;
export function processPaymentEvents(db,options={}){if(processing)return processing;processing=processEvents(db,options).finally(()=>{processing=null;});return processing;}
async function processEvents(db,{env=process.env,provider=createAsaasClient({env}),now=Date.now()}={}){
 const environment=asaasReadiness(env).environment;if(!environment)return;
 const {data:row,error}=await db.from('arena_state').select('state,revision').eq('id','main').single();if(error||!row)return;
 const events=Object.values(cashBook(row.state,environment).inbox).filter(e=>e.status==='pending'&&(!e.retryAt||e.retryAt<=now)).slice(0,2);
 for(const event of events){try{
  const resource=await (event.kind==='payment'?provider.getPayment(event.resource):provider.getTransfer(event.resource));check(resource.id===event.resource,'Identificador do provedor divergente.',409);
  await cashTransaction(db,state=>{const b=cashBook(state,environment),stored=b.inbox['event:'+event.id];if(stored?.status!=='pending')return;
   if(event.kind==='payment')settleDeposit(state,environment,resource,now);else{verifyRecoveredTransfer(state,environment,resource);settleWithdrawal(state,environment,resource,now);}stored.status='done';stored.processedAt=now;
  });
 }catch{await cashTransaction(db,state=>{const e=cashBook(state,environment).inbox['event:'+event.id];if(e?.status==='pending'){e.attempts++;e.retryAt=now+Math.min(3600000,10000*2**Math.min(e.attempts,8));e.error='provider_reconciliation_pending';}});}}
}
export function walletSummary(state,actor,env=process.env){const status=paymentsStatus(env);return {enabled:status.paymentsEnabled,payoutMethods:['PIX','TED'],depositMethods:['PIX','CARD'],internationalPayouts:false,identityVerified:state.identities?.[actor.id]?.status==='verified'&&Boolean(state.identities[actor.id].sealed)&&Date.now()-state.identities[actor.id].submittedAt<30*86400000,notice:PAYMENT_NOTICE,...cashView(state,status.environment||'production',actor.id,actor.admin),...(actor.admin?{providerStatus:status}:{})};}

// Scheduled sweep recovers missed webhooks and ambiguous POST responses using GET only.
export async function reconcileWallet(db,{env=process.env,provider=createAsaasClient({env}),now=Date.now(),limit=8}={}){
 const environment=asaasReadiness(env).environment;check(environment,'Ambiente financeiro não configurado.',503);
 await processPaymentEvents(db,{env,provider,now});
 const {data:row,error}=await db.from('arena_state').select('state,revision').eq('id','main').single();check(!error&&row,'Conciliação indisponível.',503);
 const b=cashBook(row.state,environment),jobs=[...Object.values(b.deposits).filter(d=>['creating','pending','uncertain'].includes(d.status)||(['credited','review'].includes(d.status)&&!d.reversed&&!!d.paymentId&&Number.isFinite(d.receivedAt)&&d.receivedAt<=now&&now-d.receivedAt<=180*86400000)).map(d=>({kind:'deposit',op:d})),...Object.values(b.withdrawals).filter(w=>['submitting','pending','uncertain'].includes(w.status)).map(w=>({kind:'withdrawal',op:w}))].filter(j=>!j.op.nextReconcileAt||j.op.nextReconcileAt<=now).sort((a,b)=>(Number(['credited','review'].includes(a.op.status))-Number(['credited','review'].includes(b.op.status)))||(a.op.lastReconciledAt||0)-(b.op.lastReconciledAt||0)).slice(0,limit);
 const result={checked:0,pending:0,errors:0};
 for(const {kind,op} of jobs){try{
  let resource;
  if(kind==='deposit'){
   if(op.paymentId){resource=await provider.getPayment(op.paymentId);if(['credited','review'].includes(op.status)&&provider.listPaymentRefunds){const refunds=await provider.listPaymentRefunds(op.paymentId);check(Array.isArray(refunds?.data),'Estornos indisponíveis para conciliação.',502);resource={...resource,refunds:refunds.data};}}
   else if(op.customerId){const matches=await provider.findPayments(op.id);check(Array.isArray(matches.data)&&matches.data.length<=1,'Cobranças duplicadas exigem revisão.',409);resource=matches.data[0];}
  }else if(op.transferId)resource=await provider.getTransfer(op.transferId);
  else if(provider.findTransfers){const matches=await provider.findTransfers(op.id,op.createdAt);check(Array.isArray(matches.data)&&matches.data.length<=1,'Transferências duplicadas exigem revisão.',409);resource=matches.data[0];}
  await cashTransaction(db,state=>{const book=cashBook(state,environment),current=(kind==='deposit'?book.deposits:book.withdrawals)[op.id];if(!current)return;if(resource){check(resource.externalReference===op.id,'Referência divergente.',409);if(kind==='deposit')settleDeposit(state,environment,resource,now);else{verifyRecoveredTransfer(state,environment,resource);settleWithdrawal(state,environment,resource,now);}}current.lastReconciledAt=now;current.nextReconcileAt=now+(['credited','review'].includes(current.status)?3600000:60000);delete current.reconcileError;});result.checked++;if(!resource)result.pending++;
 }catch{result.errors++;await cashTransaction(db,state=>{const book=cashBook(state,environment),current=(kind==='deposit'?book.deposits:book.withdrawals)[op.id];if(current){current.lastReconciledAt=now;current.nextReconcileAt=now+300000;current.reconcileError='manual_or_provider_review';}});}}
 await cashTransaction(db,state=>{cashBook(state,environment).lastReconciliation={at:now,...result};});return result;
}
export async function claimPlatformRevenue(db,actor,input,{env=process.env}={}){
 check(actor.admin,'Acesso exclusivo da administração.',403);const environment=enabled(env);operationId(input.id);check(Number.isSafeInteger(input.amountCents)&&input.amountCents>=100,'Valor inválido.');
 return (await cashTransaction(db,state=>{financialIdentity(state,actor.id);const b=cashBook(state,environment),p=b.platform;check(p,'Receita indisponível.');const prior=p.ledger.find(e=>e.claim===input.id);if(prior){check(prior.admin===actor.id&&prior.amount===-input.amountCents,'Referência já utilizada.',409);return {claimed:true};}const costs=Math.max(0,(b.processingFees||0)-(p.costsCovered||0));check(p.available-costs>=input.amountCents,'Receita líquida insuficiente após custos do provedor.');p.available-=input.amountCents+costs;p.costsCovered=(p.costsCovered||0)+costs;p.claimed+=input.amountCents;p.ledger.push({id:crypto.randomUUID(),claim:input.id,amount:-input.amountCents,costs,at:Date.now(),admin:actor.id});const a=b.accounts[actor.id]??={available:0,reserved:0,frozen:false};check(!a.frozen,'Carteira em revisão.');a.available+=input.amountCents;b.ledger.push({id:crypto.randomUUID(),user:actor.id,available:input.amountCents,reserved:0,type:'platform_revenue',reference:input.id,currency:'BRL',at:Date.now()});return {claimed:true};})).result;
}

export async function registerAsaasWebhook(db,{env=process.env,provider=createAsaasClient({env}),endpoint,email}){
 const status=asaasReadiness(env);check(status.credentialsConfigured,'Configure a chave Asaas do ambiente selecionado.',503);
 const claim=await cashTransaction(db,state=>{const b=cashBook(state,status.environment);if(b.webhookSetup)return {claimed:false,...b.webhookSetup};b.webhookSetup={status:'creating',at:Date.now()};return {claimed:true};});
 const sync=async id=>{const {error}=await db.rpc('arena_finance_runtime_update',{patch:{webhook_registered:true,webhook_id:id,webhook_setup_status:'registered'}});check(!error,'Registro salvo; configuração em conciliação.',503);};
 if(!claim.result.claimed){if(claim.result.status==='registered'){await sync(claim.result.id);return {registered:true};}return {registered:false,pendingReview:true};}
 try{const response=await provider.createWebhook({url:endpoint,email});check(typeof response.id==='string','Resposta inconclusiva.',502);await cashTransaction(db,state=>{cashBook(state,status.environment).webhookSetup={status:'registered',id:response.id,at:Date.now()};});await sync(response.id);return {registered:true};}
 catch(error){await cashTransaction(db,state=>{const op=cashBook(state,status.environment).webhookSetup;if(op?.status==='creating')op.status='uncertain';});await db.rpc('arena_finance_runtime_update',{patch:{webhook_setup_status:'uncertain'}});throw error;}
}

// Internal BRL transfer: the two ledger entries and balances commit in one CAS.
export async function transferCash(db,actor,input,{env=process.env,now=Date.now()}={}){
 const environment=enabled(env);operationId(input.id);
 check(input.consent===PAYMENT_NOTICE,'Confirme a transferência.');
 check(typeof input.to==='string'&&input.to!==actor.id,'Escolha outro jogador.');
 check(Number.isSafeInteger(input.amountCents)&&input.amountCents>=100&&input.amountCents<=10000000,'Valor inválido.');
 return (await cashTransaction(db,state=>{
  financialIdentity(state,actor.id);financialIdentity(state,input.to);
  check(!state.players[actor.id].bot&&!state.players[input.to].bot,'Transferências disponíveis somente entre jogadores.');
  const book=cashBook(state,environment),from=cashAccount(book,actor.id),to=cashAccount(book,input.to);
  check(!from.frozen&&!to.frozen,'Carteira em revisão.',403);
  book.transfers??={};const prior=book.transfers[input.id];
  if(prior){check(prior.from===actor.id&&prior.to===input.to&&prior.amount===input.amountCents,'Referência já utilizada.',409);return prior;}
  check(from.available>=input.amountCents,'Saldo disponível insuficiente.');
  check(Number.isSafeInteger(to.available+input.amountCents),'Limite de saldo atingido.');
  from.available-=input.amountCents;to.available+=input.amountCents;
  const operation={id:input.id,from:actor.id,to:input.to,amount:input.amountCents,status:'done',at:now,currency:'BRL'};
  book.transfers[input.id]=operation;
  for(const [user,available,type] of [[actor.id,-input.amountCents,'transfer_sent'],[input.to,input.amountCents,'transfer_received']])book.ledger.push({id:crypto.randomUUID(),user,available,reserved:0,type,reference:input.id,at:now,currency:'BRL'});
  return operation;
 })).result;
}
