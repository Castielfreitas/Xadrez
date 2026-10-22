import {DomainError} from '../src/errors.js';

export const PAYMENT_NOTICE='arena-payments-v1';
export function check(ok,message,status=400){if(!ok)throw new DomainError(message,status);}
export function cashBook(state,environment){
 check(['sandbox','production'].includes(environment),'Ambiente financeiro inválido.');
 state.cash??={};return state.cash[environment]??={accounts:{},customers:{},customerLocks:{},deposits:{},withdrawals:{},inbox:{},ledger:[],processingFees:0};
}
export function cashAccount(book,user){return book.accounts[user]??={available:0,reserved:0,frozen:false};}
export function moneyCents(value){check(Number.isFinite(value)&&value>=0,'Valor do provedor inválido.');const n=Math.round(value*100);check(Number.isSafeInteger(n)&&Math.abs(value*100-n)<.00001,'Valor do provedor inválido.');return n;}
export function operationId(value){check(typeof value==='string'&&/^[a-f0-9-]{36}$/i.test(value),'Identificador financeiro inválido.');return value;}
export function amount(value){check(Number.isSafeInteger(value)&&value>=100&&value<=10000000,'Informe entre R$ 1,00 e R$ 100.000,00.');return value;}
function post(book,user,available,reserved,type,reference,now,{debt=false}={}){
 const account=cashAccount(book,user),a=account.available+available,r=account.reserved+reserved;
 check(Number.isSafeInteger(a)&&Number.isSafeInteger(r)&&r>=0&&(debt||a>=0),'Saldo em reais insuficiente.');
 account.available=a;account.reserved=r;if(a<0)account.frozen=true;
 book.ledger.push({id:crypto.randomUUID(),user,available,reserved,type,reference,at:now,currency:'BRL'});
}
export function beginDeposit(state,environment,user,id,value,now=Date.now(),method='PIX'){
 const book=cashBook(state,environment);operationId(id);amount(value);check(['PIX','CARD'].includes(method),'Forma de pagamento inválida.');
 const old=book.deposits[id];if(old){check(old.user===user&&old.amount===value&&(old.method||'PIX')===method,'Referência financeira já utilizada.',409);return {operation:old,claimed:false};}
 check(!cashAccount(book,user).frozen,'Carteira em revisão.',403);
 check(!Object.values(book.deposits).some(d=>d.user===user&&now-d.createdAt<30000),'Aguarde 30 segundos antes de criar outra recarga.',429);
 check(Object.values(book.deposits).filter(d=>d.user===user&&['creating','pending','uncertain'].includes(d.status)).length<5,'Conclua as recargas pendentes antes de criar outra.');
 if(!book.customers[user]){check(!book.customerLocks[user],'Cadastro financeiro em processamento ou conciliação.',409);book.customerLocks[user]=id;}
 const operation={id,user,amount:value,method,status:'creating',createdAt:now,notice:PAYMENT_NOTICE,customerId:book.customers[user]||null,paymentId:null,credited:false,reversed:false};
 book.deposits[id]=operation;return {operation,claimed:true};
}
export function bindCustomer(state,environment,id,customerId){const b=cashBook(state,environment),d=b.deposits[id];check(d&&typeof customerId==='string'&&/^cus_[a-zA-Z0-9_-]+$/.test(customerId),'Cliente financeiro inválido.');check(!d.customerId||d.customerId===customerId,'Cliente financeiro divergente.',409);d.customerId=customerId;b.customers[d.user]=customerId;if(b.customerLocks[d.user]===id)delete b.customerLocks[d.user];}
export function bindPayment(state,environment,id,paymentId){const b=cashBook(state,environment),d=b.deposits[id];check(d&&typeof paymentId==='string'&&/^pay_[a-zA-Z0-9_-]+$/.test(paymentId),'Cobrança inválida.');check(!d.paymentId||d.paymentId===paymentId,'Cobrança divergente.',409);check(!Object.values(b.deposits).some(other=>other.id!==id&&other.paymentId===paymentId),'Cobrança já vinculada.',409);d.paymentId=paymentId;if(['creating','uncertain'].includes(d.status))d.status='pending';}
export function settleDeposit(state,environment,payment,now=Date.now()){
 const b=cashBook(state,environment),d=b.deposits[payment.externalReference];if(!d)return false;
 check(((d.method||'PIX')==='PIX'?payment.billingType==='PIX':['CREDIT_CARD','DEBIT_CARD'].includes(payment.billingType))&&payment.customer===d.customerId&&moneyCents(payment.value)===d.amount,'Dados de cobrança divergentes.',409);
 bindPayment(state,environment,d.id,payment.id);
 if(payment.status==='RECEIVED'&&!payment.deleted&&!d.credited){
  check(!d.reversed,'Cobrança devolvida não pode ser creditada.',409);const net=moneyCents(payment.netValue);check(net<=d.amount,'Valor líquido inválido.');
  post(b,d.user,d.amount,0,'deposit',d.id,now);d.credited=true;d.status='credited';d.receivedAt=now;d.fee=d.amount-net;b.processingFees+=d.fee;
 }
 if(payment.status==='REFUNDED'){
  if(d.credited&&!d.reversed)post(b,d.user,-d.amount,0,'deposit_refund',d.id,now,{debt:true});
  d.reversed=true;d.status='refunded';
 }
 if(['REFUND_REQUESTED','REFUND_IN_PROGRESS','PARTIALLY_REFUNDED','CHARGEBACK_REQUESTED','CHARGEBACK_DISPUTE','AWAITING_CHARGEBACK_REVERSAL'].includes(payment.status)){
  cashAccount(b,d.user).frozen=true;d.status='review';
 }
 return true;
}
export function requestWithdrawal(state,environment,user,id,value,sealedCpf,now=Date.now()){
 const b=cashBook(state,environment);operationId(id);amount(value);const old=b.withdrawals[id];if(old){check(old.user===user&&old.amount===value,'Referência financeira já utilizada.',409);return old;}
 check(!cashAccount(b,user).frozen,'Carteira em revisão.',403);
 check(!Object.values(b.withdrawals).some(w=>w.user===user&&['requested','submitting','pending','uncertain'].includes(w.status)),'Você já possui um saque em andamento.',409);
 post(b,user,-value,value,'withdrawal_hold',id,now);
 return b.withdrawals[id]={id,user,amount:value,sealedCpf,status:'requested',createdAt:now,notice:PAYMENT_NOTICE,transferId:null};
}
export function claimWithdrawal(state,environment,id,admin,now=Date.now()){
 const b=cashBook(state,environment),w=b.withdrawals[id];check(w,'Saque não encontrado.',404);check(!cashAccount(b,w.user).frozen,'Carteira em revisão.',403);
 if(w.status!=='requested')return {operation:w,claimed:false};
 w.status='submitting';w.approvedBy=admin;w.approvedAt=now;return {operation:w,claimed:true};
}
export function bindTransfer(state,environment,id,transferId){const b=cashBook(state,environment),w=b.withdrawals[id];check(w&&typeof transferId==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(transferId),'Transferência inválida.');check(!w.transferId||w.transferId===transferId,'Transferência divergente.',409);check(!Object.values(b.withdrawals).some(other=>other.id!==id&&other.transferId===transferId),'Transferência já vinculada.',409);w.transferId=transferId;if(['submitting','uncertain'].includes(w.status))w.status='pending';}
export function settleWithdrawal(state,environment,transfer,now=Date.now()){
 const b=cashBook(state,environment),w=b.withdrawals[transfer.externalReference];if(!w)return false;
 check(['submitting','pending','uncertain','done','failed'].includes(w.status),'Transferência sem autorização registrada.',409);
 check(moneyCents(transfer.value)===w.amount,'Valor de saque divergente.',409);bindTransfer(state,environment,w.id,transfer.id);
 if(['done','failed'].includes(w.status))return true;
 if(transfer.status==='DONE'){post(b,w.user,0,-w.amount,'withdrawal_paid',w.id,now);w.status='done';w.finishedAt=now;delete w.sealedCpf;}
 if(['FAILED','CANCELLED'].includes(transfer.status)){post(b,w.user,w.amount,-w.amount,'withdrawal_return',w.id,now);w.status='failed';w.finishedAt=now;delete w.sealedCpf;}
 return true;
}
export function rejectWithdrawal(state,environment,id,admin,now=Date.now()){
 const b=cashBook(state,environment),w=b.withdrawals[id];check(w,'Saque não encontrado.',404);if(w.status==='rejected')return;
 check(w.status==='requested','Saque já enviado ao provedor não pode ser devolvido manualmente.',409);
 post(b,w.user,w.amount,-w.amount,'withdrawal_rejected',id,now);w.status='rejected';w.rejectedBy=admin;delete w.sealedCpf;
}
export function cashView(state,environment,user,admin=false){
 const b=cashBook(structuredClone(state),environment),own=Object.hasOwn(b.accounts,user)?b.accounts[user]:{available:0,reserved:0,frozen:false};
 const clean=({sealedCpf,...item})=>item;
 return {currency:'BRL',environment,account:own,deposits:Object.values(b.deposits).filter(d=>admin||d.user===user).map(clean),withdrawals:Object.values(b.withdrawals).filter(w=>admin||w.user===user).map(clean),ledger:b.ledger.filter(e=>admin||e.user===user),...(admin?{platform:b.platform?{available:b.platform.available,claimed:b.platform.claimed,netAvailable:Math.max(0,b.platform.available-Math.max(0,b.processingFees-(b.platform.costsCovered||0)))}:{available:0,claimed:0,netAvailable:0},lastReconciliation:b.lastReconciliation||null,processingFees:b.processingFees,pendingEvents:Object.values(b.inbox).filter(e=>e.status!=='done').length}:{})};
}
