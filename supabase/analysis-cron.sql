-- Arena-only recovery. No credentials or private analysis cross the network.
-- Run as project owner. Existing server requests also process the queue after each move.
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.schedule('arena-analysis-recovery','* * * * *',$job$
select net.http_get(url:='https://arena-xadrez.vercel.app/api/index?action=state',timeout_milliseconds:=10000)
where exists(select 1 from public.arena_state where id='main'
 and state#>>'{settings,analysisEnabled}'='true'
 and (jsonb_path_exists(state,'$.games[*].analysis[*] ? (@.status == "pending")')
 or jsonb_path_exists(state,'$.analysisTests[*] ? (@.status == "pending")')));
$job$);
