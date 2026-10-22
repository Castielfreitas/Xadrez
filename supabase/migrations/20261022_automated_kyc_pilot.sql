-- Arena: provider-bound KYC and isolated pilot accounts. No financial activation.
create table if not exists public.arena_kyc_sessions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 provider text not null default 'didit' check (provider='didit'),
 environment text not null check(environment in ('sandbox','production')),
 provider_session_id text unique,
 status text not null default 'initiating' check(status in ('initiating','pending','in_review','verified','rejected','expired','error')),
 verification_url text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 checked_at timestamptz,
 decision_code text
);
create index if not exists arena_kyc_user_recent on public.arena_kyc_sessions(user_id,created_at desc);
create unique index if not exists arena_kyc_one_active_session on public.arena_kyc_sessions(user_id,environment)
 where status in ('initiating','pending','in_review');
alter table public.arena_kyc_sessions enable row level security;
revoke all on table public.arena_kyc_sessions from public,anon,authenticated;
grant select,insert,update,delete on public.arena_kyc_sessions to service_role;
create table if not exists public.arena_pilot_accounts (
 user_id uuid primary key references auth.users(id) on delete cascade,
 max_deposit_cents integer not null default 100 check(max_deposit_cents between 0 and 100),
 scope text not null default 'sandbox' check(scope='sandbox'),
 created_at timestamptz not null default now()
);
alter table public.arena_pilot_accounts enable row level security;
revoke all on table public.arena_pilot_accounts from public,anon,authenticated;
grant select,insert,update,delete on public.arena_pilot_accounts to service_role;
-- Whitelist the three existing HUMAN accounts without changing wallet/financial flags.
insert into public.arena_pilot_accounts(user_id,max_deposit_cents,scope)
 select id,100,'sandbox' from auth.users
 where id::text in (
  select key from public.arena_state s, lateral jsonb_each(coalesce(s.state->'players','{}'::jsonb))
  where s.id='main' and coalesce(value->>'bot','false')='false'
 ) on conflict(user_id) do nothing;
