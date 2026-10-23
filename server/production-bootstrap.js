import {timingSafeEqual} from 'node:crypto';
import {DomainError} from '../src/errors.js';
import {createAsaasClient} from './asaas.js';
// One-time server-to-server import. The key never traverses the browser or response.
// Supabase cron's private worker token is the only accepted caller credential.
export async function prepareProductionProvider(db,{key,token,vercelEnvironment}){
 if(vercelEnvironment!=='production')throw new DomainError('Acesso não autorizado.',403);
 const {data:c,error}=await db.rpc('arena_finance_config_read');
 if(error||!c||typeof token!=='string'||typeof c.worker!=='string'||token.length<32||Buffer.byteLength(token)!==Buffer.byteLength(c.worker)||!timingSafeEqual(Buffer.from(token),Buffer.from(c.worker)))throw new DomainError('Acesso não autorizado.',401);
 if(c.environment!=='sandbox'||c.production_enabled||c.wallet_enabled)throw new DomainError('Preparação encerrada.',409);
 if(typeof key!=='string'||!key.startsWith('$aact_prod_'))throw new DomainError('Chave produtiva não disponível na Vercel.',503);
 const provider=createAsaasClient({env:{ASAAS_ENVIRONMENT:'production',ASAAS_API_KEY:key}});
 await provider.getBalance();const status=await provider.getAccountStatus();
 if(status.general!=='APPROVED')throw new DomainError('Conta do processador de pagamentos produtiva ainda não aprovada.',409);
 const saved=await db.rpc('arena_finance_production_key_import',{p_key:key});
 if(saved.error)throw new DomainError('Não foi possível guardar a configuração produtiva.',503);
 return {productionKeyStored:true,providerAccountApproved:true,financialOperationsEnabled:false};
}
