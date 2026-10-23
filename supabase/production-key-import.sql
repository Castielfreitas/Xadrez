-- Import the existing Vercel production key without exposing its value to an operator.
-- This routine refuses replacement and closes itself when production is selected.
create or replace function arena_private.finance_production_key_import(p_key text) returns boolean
language plpgsql security definer set search_path='' as $$
begin
 if coalesce(auth.jwt()->>'role','')<>'service_role' then raise exception 'service only';end if;
 perform pg_advisory_xact_lock(84610521);
 if not starts_with(p_key,'$aact_prod_') or length(p_key)>4096 then raise exception 'invalid production key';end if;
 if not exists(select 1 from arena_private.finance_config where id=true and environment='sandbox' and not production_enabled and not wallet_enabled) then raise exception 'import closed';end if;
 if exists(select 1 from vault.secrets where name='arena_finance_asaas_key') then raise exception 'key already provisioned';end if;
 perform vault.create_secret(p_key,'arena_finance_asaas_key','Arena production Asaas key; imported server-to-server');
 return true;
end $$;
revoke all on function arena_private.finance_production_key_import(text) from public,anon,authenticated;
grant execute on function arena_private.finance_production_key_import(text) to service_role;
create or replace function public.arena_finance_production_key_import(p_key text) returns boolean
language sql security invoker set search_path='' as $$ select arena_private.finance_production_key_import(p_key); $$;
revoke all on function public.arena_finance_production_key_import(text) from public,anon,authenticated;
grant execute on function public.arena_finance_production_key_import(text) to service_role;
