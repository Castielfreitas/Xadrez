-- Authenticated users may RECEIVE only on their own private board channel.
-- No INSERT policy: clients cannot forge authoritative board broadcasts.
create policy arena_receive_own_board on realtime.messages
for select to authenticated using (
 extension = 'broadcast'
 and (select realtime.topic()) = 'arena-board:' || (select auth.uid())::text
);
create or replace function public.arena_broadcast_boards()
returns trigger language plpgsql security invoker set search_path='' as $$
declare g jsonb; board jsonb; recipient text;
begin
 for g in
  select n.value from jsonb_array_elements(coalesce(new.state->'games','[]'::jsonb)) n
  left join jsonb_array_elements(coalesce(old.state->'games','[]'::jsonb)) o on o.value->>'id'=n.value->>'id'
  where jsonb_build_array(n.value->'fen',n.value->'moves',n.value->'status',n.value->'accepted',n.value->'rematches',n.value->'winner',n.value->'result')
    is distinct from jsonb_build_array(o.value->'fen',o.value->'moves',o.value->'status',o.value->'accepted',o.value->'rematches',o.value->'winner',o.value->'result')
 loop
  select jsonb_object_agg(key,value) into board from jsonb_each(g)
  where key=any(array['id','white','black','fen','pgn','moves','status','lastMoveAt','whiteMs','blackMs','rematches','accepted','drawOffers','result','reason','winner','round','tournament']);
  foreach recipient in array array[g->>'white',g->>'black'] loop
   if recipient ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
    perform realtime.send(jsonb_build_object('revision',new.revision,'game',board),'board','arena-board:'||recipient,true);
   end if;
  end loop;
 end loop;
 return new;
exception when others then
 -- Never roll back a move or monetary settlement because a notification failed.
 return new;
end;
$$;
revoke all on function public.arena_broadcast_boards() from public,anon,authenticated;
create trigger arena_private_boards after update on public.arena_state
for each row execute function public.arena_broadcast_boards();

