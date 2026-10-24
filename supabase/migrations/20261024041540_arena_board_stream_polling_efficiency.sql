CREATE OR REPLACE FUNCTION public.arena_broadcast_revision()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare old_games jsonb; new_games jsonb;
begin
 select coalesce(jsonb_agg(jsonb_build_array(g->'id',g->'status',g->'white',g->'black',g->'accepted')),'[]'::jsonb)
 into old_games from jsonb_array_elements(coalesce(old.state->'games','[]'::jsonb)) g;
 select coalesce(jsonb_agg(jsonb_build_array(g->'id',g->'status',g->'white',g->'black',g->'accepted')),'[]'::jsonb)
 into new_games from jsonb_array_elements(coalesce(new.state->'games','[]'::jsonb)) g;
 if old_games is distinct from new_games or old.state->'challenges' is distinct from new.state->'challenges' or old.state->'tournaments' is distinct from new.state->'tournaments' then
   perform realtime.send(jsonb_build_object('revision',new.revision),'revision','arena-live-v1',false);
 end if;
 return new;
exception when others then
 -- A notification outage must never reject a move or a wallet transaction.
 return new;
end;
$function$

