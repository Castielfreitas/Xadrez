-- Run only on Arena Xadrez (kjqovtvhgulwufdzfmif). No credential values are emitted.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;
create schema if not exists arena_private;
revoke all on schema arena_private from public,anon,authenticated;
create table if not exists arena_private.finance_config (
 id boolean primary key default true check(id),
 admin_emails text[] not null default array['geova0448@gmail.com'],
 environment text not null default 'sandbox' check(environment in ('sandbox','production')),
 wallet_enabled boolean not null default false,
 games_enabled boolean not null default false,
 model_approved boolean not null default false,
 production_enabled boolean not null default false,
 webhook_registered boolean not null default false,
 webhook_id text,
 webhook_setup_status text not null default 'not_started',
 last_worker_at timestamptz,
 last_worker_status text
);
alter table arena_private.finance_config enable row level security;
revoke all on arena_private.finance_config from public,anon,authenticated;
insert into arena_private.finance_config(id) values(true) on conflict do nothing;
do $$ begin
 if not exists(select 1 from vault.secrets where name='arena_finance_kyc') then perform vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'),'arena_finance_kyc');end if;
 if not exists(select 1 from vault.secrets where name='arena_finance_webhook') then perform vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'),'arena_finance_webhook');end if;
 if not exists(select 1 from vault.secrets where name='arena_finance_worker') then perform vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'),'arena_finance_worker');end if;
end $$;
-- Privileged helpers are in a non-exposed schema; wrappers require the service JWT.
create or replace function arena_private.finance_config_read() returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if coalesce(auth.jwt()->>'role','')<>'service_role' then raise exception 'service only';end if;
 select to_jsonb(c) into result from arena_private.finance_config c where id=true;
 return result||jsonb_build_object('kyc',(select decrypted_secret from vault.decrypted_secrets where name='arena_finance_kyc'),'webhook',(select decrypted_secret from vault.decrypted_secrets where name='arena_finance_webhook'),'worker',(select decrypted_secret from vault.decrypted_secrets where name='arena_finance_worker'),'asaas_key',(select decrypted_secret from vault.decrypted_secrets where name='arena_finance_asaas_key'));
end $$;
revoke all on function arena_private.finance_config_read() from public,anon,authenticated;
grant usage on schema arena_private to service_role;
grant execute on function arena_private.finance_config_read() to service_role;
create or replace function public.arena_finance_config_read() returns jsonb language sql security invoker set search_path='' as $$select arena_private.finance_config_read();$$;
revoke all on function public.arena_finance_config_read() from public,anon,authenticated;
grant execute on function public.arena_finance_config_read() to service_role;
create or replace function arena_private.finance_runtime_update(patch jsonb) returns void language plpgsql security definer set search_path='' as $$
begin
 if coalesce(auth.jwt()->>'role','')<>'service_role' then raise exception 'service only';end if;
 update arena_private.finance_config set last_worker_at=case when patch ? 'worker_status' then now() else last_worker_at end,last_worker_status=coalesce(patch->>'worker_status',last_worker_status),webhook_setup_status=coalesce(patch->>'webhook_setup_status',webhook_setup_status),webhook_registered=coalesce((patch->>'webhook_registered')::boolean,webhook_registered),webhook_id=coalesce(patch->>'webhook_id',webhook_id) where id=true;
end $$;
revoke all on function arena_private.finance_runtime_update(jsonb) from public,anon,authenticated;
grant execute on function arena_private.finance_runtime_update(jsonb) to service_role;
create or replace function public.arena_finance_runtime_update(patch jsonb) returns void language sql security invoker set search_path='' as $$select arena_private.finance_runtime_update(patch);$$;
revoke all on function public.arena_finance_runtime_update(jsonb) from public,anon,authenticated;
grant execute on function public.arena_finance_runtime_update(jsonb) to service_role;
-- One worker per minute, authenticated by an independent secret stored in Vault.
select cron.schedule('arena-finance-reconcile','* * * * *',$cron$
 select net.http_post(url:='https://kjqovtvhgulwufdzfmif.supabase.co/functions/v1/arena-finance?action=reconcile',headers:=jsonb_build_object('Content-Type','application/json','x-arena-worker-token',(select decrypted_secret from vault.decrypted_secrets where name='arena_finance_worker')),body:='{}'::jsonb,timeout_milliseconds:=120000);
$cron$);
select 'Arena finance configured; payment activation remains disabled' as result;
