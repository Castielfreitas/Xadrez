export const generatedHandle=id=>'jogador_'+String(id||'').replace(/[^a-z0-9]/gi,'').slice(0,12).toLowerCase();
export const isAutomaticHandle=p=>!p?.username||p.username===generatedHandle(p.id);
export const normalizeHandle=value=>String(value??'').trim().replace(/^@/,'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function suggestedHandle(s,name,user){const base=normalizeHandle(name).replace(/[^a-z0-9_]/g,'_').replace(/_+/g,'_').replace(/^_|_$/g,'').slice(0,20);if(base.length<3)return null;let value=base,n=2;while(Object.values(s.players).some(p=>p.id!==user&&userHandle(p)===value)){const suffix='_'+n++;value=base.slice(0,24-suffix.length)+suffix;}return value;}
export const userHandle=p=>p?.bot&&p.id==='arena-sandra'?'sandra_computador':p?.username||generatedHandle(p?.id);
export const isOnline=(p,now=Date.now())=>p?.status==='active'&&Number.isFinite(p.lastSeen)&&now-p.lastSeen<65000;
export const related=(f,a,b)=>[f.from,f.to].includes(a)&&[f.from,f.to].includes(b);
export const blocked=(s,a,b)=>(s.blocks||[]).some(x=>(x.from===a&&x.to===b)||(x.from===b&&x.to===a));
export function socialCount(s,user,now=Date.now()){return (s.friendships||[]).filter(f=>f.to===user&&f.status==='pending').length+s.challenges.filter(c=>c.target===user&&c.status==='open'&&(!c.expiresAt||c.expiresAt>now)).length;}

export function readablePlayers(s){const view={players:Object.fromEntries(Object.entries(s.players||{}).map(([id,p])=>[id,{...p}]))};for(const p of Object.values(view.players)){if(!p.bot&&isAutomaticHandle(p)&&p.name!=='Jogador'){const handle=suggestedHandle(view,p.name,p.id);if(handle)p.username=handle;}}return view.players;}
