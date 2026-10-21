// Original wood-like impacts synthesized locally. Independent capture and check layers.
let context,master;let enabled=localStorage.getItem('arena-sound')!=='off';
let volume=Number(localStorage.getItem('arena-volume')??.85);if(!Number.isFinite(volume))volume=.85;volume=Math.max(0,Math.min(1,volume));
export const soundEnabled=()=>enabled;
export const soundVolume=()=>volume;
export function setSoundVolume(value){volume=Math.max(0,Math.min(1,Number(value)||0));localStorage.setItem('arena-volume',String(volume));if(master&&context)master.gain.setValueAtTime(volume,context.currentTime);if(volume>0&&!enabled){enabled=true;localStorage.setItem('arena-sound','on');}return volume;}
function setup(){if(context)return context;const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return null;context=new Audio();master=context.createGain();master.gain.setValueAtTime(volume,context.currentTime);const compressor=context.createDynamicsCompressor?.();if(compressor){compressor.threshold.setValueAtTime(-10,context.currentTime);compressor.ratio.setValueAtTime(5,context.currentTime);master.connect(compressor);compressor.connect(context.destination);}else master.connect(context.destination);return context;}
export function unlockSound(){if(!enabled)return;try{const ctx=setup();if(ctx?.state==='suspended')ctx.resume?.().catch(()=>{});}catch{}}
export function toggleSound(){enabled=!enabled;localStorage.setItem('arena-sound',enabled?'on':'off');if(enabled){unlockSound();playSound('move');}return enabled;}
function tone(ctx,hz,peak,duration,offset=0,type='triangle'){const at=ctx.currentTime+offset,o=ctx.createOscillator(),gain=ctx.createGain();o.type=type;o.frequency.setValueAtTime(hz,at);o.frequency.exponentialRampToValueAtTime?.(Math.max(40,hz*.45),at+duration);gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(peak,at+.003);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);o.connect(gain);gain.connect(master);o.start(at);o.stop(at+duration+.02);}
// Several softened fractures fall into a low, granular rubble tail; no sharp crack.
function crumble(ctx){const duration=.85;if(ctx.createBuffer&&ctx.createBufferSource){const buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*duration),ctx.sampleRate),samples=buffer.getChannelData(0);let low=0,body=0;const fragments=[0,.075,.16,.26,.39,.53];for(let i=0;i<samples.length;i++){const t=i/ctx.sampleRate;low=.78*low+.22*(Math.random()*2-1);body=.97*body+.03*low;let envelope=0;for(let n=0;n<fragments.length;n++){const age=t-fragments[n];if(age>=0)envelope+=Math.min(1,age/.022)*Math.exp(-age/(.10+n*.012))*(1-n*.105);}const fade=Math.min(1,(duration-t)/.14);samples[i]=(low*.65+body*2.2)*envelope*fade;}const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;gain.gain.setValueAtTime(.9,ctx.currentTime);source.connect(gain);gain.connect(master);source.start();source.stop(ctx.currentTime+duration);}tone(ctx,115,.12,.3,.025,'sine');tone(ctx,76,.09,.4,.09,'sine');tone(ctx,155,.04,.18,.25,'sine');}
// A sustained friction layer follows the 280 ms slide, then a soft wooden landing.
function slide(ctx){
 const duration=.26;
 if(ctx.createBuffer&&ctx.createBufferSource){
  const buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*duration),ctx.sampleRate),samples=buffer.getChannelData(0);let low=0;
  for(let i=0;i<samples.length;i++){const t=i/ctx.sampleRate,noise=Math.random()*2-1;low=.94*low+.06*noise;samples[i]=low*(.9+.1*Math.sin(t*55)) * Math.min(1,t/.05,(duration-t)/.07);}
  const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;gain.gain.setValueAtTime(.65,ctx.currentTime);source.connect(gain);gain.connect(master);source.start();source.stop(ctx.currentTime+duration);
 }
 tone(ctx,190,.045,.07,.23,'sine');tone(ctx,100,.025,.07,.24,'sine');
}
function emit(ctx,kind){if(!enabled||volume===0)return;if(kind==='capture'||kind==='move'){if(kind==='move')slide(ctx);else crumble(ctx);return;}const notes={castle:[330,490],check:[640,850],end:[523,659,784]}[kind]||[440];notes.forEach((hz,i)=>tone(ctx,hz,.3,.18,i*.09,'sine'));}
export function playSound(kind='move'){if(!enabled)return;try{const ctx=setup();if(!ctx)return;if(ctx.state==='suspended'){ctx.resume().then(()=>emit(ctx,kind)).catch(()=>{});}else emit(ctx,kind);}catch{}}
