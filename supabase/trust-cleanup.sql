-- Recovery for private evidence retention; no secret or document in the request.
select cron.schedule('arena-trust-cleanup','*/5 * * * *',$job$ select net.http_get(url:='https://arena-xadrez.vercel.app/api/index?action=trust-cleanup',timeout_milliseconds:=10000); $job$);
