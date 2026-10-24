-- Only invalidation signals are broadcast. State, identities and wallets stay private.
create or replace function public.arena_broadcast_revision()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare old_games jsonb; new_games jsonb;
begin
 select coalesce(jsonb_agg(jsonb_build_array(g->'id',g->'fen',g->'status',g->'white',g->'black',g->'accepted',g->'moves')),'[]'::jsonb)
 into old_games from jsonb_array_elements(coalesce(old.state->'games','[]'::jsonb)) g;
 select coalesce(jsonb_agg(jsonb_build_array(g->'id',g->'fen',g->'status',g->'white',g->'black',g->'accepted',g->'moves')),'[]'::jsonb)
 into new_games from jsonb_array_elements(coalesce(new.state->'games','[]'::jsonb)) g;
 if old_games is distinct from new_games or old.state->'challenges' is distinct from new.state->'challenges' or old.state->'tournaments' is distinct from new.state->'tournaments' then
   perform realtime.send(jsonb_build_object('revision',new.revision),'revision','arena-live-v1',false);
 end if;
 return new;
exception when others then
 -- A notification outage must never reject a move or a wallet transaction.
 return new;
end;
$$;
revoke all on function public.arena_broadcast_revision() from public, anon, authenticated;
drop trigger if exists arena_live_revision on public.arena_state;
create trigger arena_live_revision after update on public.arena_state
for each row execute function public.arena_broadcast_revision();
