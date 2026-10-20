export const userHandle=p=>p?.username||'jogador_'+String(p?.id||'').replace(/[^a-z0-9]/gi,'').slice(0,12).toLowerCase();
export const isOnline=(p,now=Date.now())=>p?.status==='active'&&Number.isFinite(p.lastSeen)&&now-p.lastSeen<65000;
export const related=(f,a,b)=>[f.from,f.to].includes(a)&&[f.from,f.to].includes(b);
export const blocked=(s,a,b)=>(s.blocks||[]).some(x=>(x.from===a&&x.to===b)||(x.from===b&&x.to===a));
export function socialCount(s,user,now=Date.now()){return (s.friendships||[]).filter(f=>f.to===user&&f.status==='pending').length+s.challenges.filter(c=>c.target===user&&c.status==='open'&&(!c.expiresAt||c.expiresAt>now)).length;}
