import {createClient} from '@supabase/supabase-js';
import {createFinanceHandler} from './finance-handler.js';
const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
if(!url||!key)throw new Error('Server configuration unavailable');
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
Deno.serve(createFinanceHandler({db}));
