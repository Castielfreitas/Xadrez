// Provider-only Sandbox probe. It never changes the Arena production database.
// Run with server-side Sandbox credentials in the environment, never command arguments.
import assert from 'node:assert/strict';
import {createAsaasClient,asaasReadiness} from '../server/asaas.js';
const status=asaasReadiness();assert.equal(status.environment,'sandbox','Only Sandbox is permitted');assert(status.credentialsConfigured,'Sandbox credentials and independent webhook token are required');
const provider=createAsaasClient();const reference='homologation_'+crypto.randomUUID();
const customer=await provider.createCustomer({name:'Teste de Integracao Arena',cpf:'52998224725',email:'sandbox@example.org',externalReference:reference});
const dueDate=new Date(Date.now()+86400000).toISOString().slice(0,10);
const payment=await provider.createPixCharge({customer:customer.id,amountCents:1000,dueDate,externalReference:reference});
assert.equal(payment.billingType,'PIX');assert.equal(payment.value,10);
const before=await provider.getPayment(payment.id);assert.equal(before.externalReference,reference);
await provider.confirmSandboxPayment(payment.id);
const confirmed=await provider.getPayment(payment.id);assert(['RECEIVED','CONFIRMED'].includes(confirmed.status));
const balance=await provider.getBalance();assert(Number.isFinite(balance.balance));
console.log(JSON.stringify({environment:'sandbox',customerCreated:true,pixCreated:true,confirmation:confirmed.status,balanceQuery:true,arenaDatabaseChanged:false,withdrawalTested:false,webhookTested:false}));
