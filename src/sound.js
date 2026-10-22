// Original wood-like impacts synthesized locally. Independent capture and check layers.
let context,master;let enabled=localStorage.getItem('arena-sound')!=='off';
let volume=Number(localStorage.getItem('arena-volume')??.85);if(!Number.isFinite(volume))volume=.85;volume=Math.max(0,Math.min(1,volume));
export const soundEnabled=()=>enabled;
export const soundVolume=()=>volume;
export function setSoundVolume(value){volume=Math.max(0,Math.min(1,Number(value)||0));localStorage.setItem('arena-volume',String(volume));if(master&&context)master.gain.setValueAtTime(volume,context.currentTime);if(volume>0&&!enabled){enabled=true;localStorage.setItem('arena-sound','on');}return volume;}
function setup(){if(context)return context;const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return null;context=new Audio();master=context.createGain();master.gain.setValueAtTime(volume,context.currentTime);const compressor=context.createDynamicsCompressor?.();if(compressor){compressor.threshold.setValueAtTime(-14,context.currentTime);compressor.ratio.setValueAtTime(4,context.currentTime);master.connect(compressor);compressor.connect(context.destination);}else master.connect(context.destination);return context;}
export function unlockSound(){if(!enabled)return;try{const ctx=setup();if(ctx?.state==='suspended')ctx.resume?.().catch(()=>{});}catch{}}
export function toggleSound(){enabled=!enabled;localStorage.setItem('arena-sound',enabled?'on':'off');if(enabled){unlockSound();playSound('move');}return enabled;}
function tone(ctx,hz,peak,duration,offset=0,type='triangle'){const at=ctx.currentTime+offset,o=ctx.createOscillator(),gain=ctx.createGain();o.type=type;o.frequency.setValueAtTime(hz,at);o.frequency.exponentialRampToValueAtTime?.(Math.max(40,hz*.45),at+duration);gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(peak,at+.003);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);o.connect(gain);gain.connect(master);o.start(at);o.stop(at+duration+.02);}
// Material-based audio: friction of a heavy wooden chess piece over the
// board, followed by a rounded touchdown. No synthetic note at the end.
function materialNoise(ctx,duration,generate,peak){
 if(!ctx.createBuffer||!ctx.createBufferSource)return;
 const at=ctx.currentTime,len=Math.ceil(ctx.sampleRate*duration);
 const buffer=ctx.createBuffer(1,len,ctx.sampleRate),samples=buffer.getChannelData(0);
 let low=0,grain=0;
 for(let i=0;i<len;i++){
  const t=i/ctx.sampleRate,white=Math.random()*2-1;
  low=.94*low+.06*white;grain=.74*grain+.26*white;
  samples[i]=Math.max(-1,Math.min(1,generate(t,white,grain,low,duration)));
 }
 const source=ctx.createBufferSource(),gain=ctx.createGain();
 source.buffer=buffer;gain.gain.setValueAtTime(Math.max(0,Math.min(1,peak)),at);
 source.connect(gain);gain.connect(master);source.start(at);source.stop(at+duration);
}
// A single, continuous rough collapse (stone/wood splintering) instead of
// several high-pitched clicks. Use broad rumble and granular debris.
function crumble(ctx){
 const duration=.49;
 materialNoise(ctx,duration,(t,white,grain,low)=>{
  const initial=Math.min(1,t/.014)*Math.exp(-t/0.25);
  const buckle=(t>.075&&t<.31)?0.8:0.45;
  const debris=Math.exp(-Math.max(0,t-.22)/.13);
  const rumble=Math.sin(2*Math.PI*(82-40*t)*t)*Math.exp(-t/.16);
  return (low*.95+grain*.36+white*.10)*initial*buckle
       +grain*.36*debris*Math.max(0,1-t/.49)
       +rumble*.24*Math.exp(-t/.22);
 },.97);
 tone(ctx,90,.10,.17,0,'sine');
 tone(ctx,67,.075,.23,.035,'sine');
}
// Short continuous wooden drag with a soft settling scrape, never a tap.
function slide(ctx){
 const duration=.18;
 materialNoise(ctx,duration,(t,white,grain,low)=>{
  const rise=Math.min(1,t/.018);
  const travel=Math.max(0,1-t/.17);
  const roughness=.72+.16*Math.sin(t*355);
  const landing=Math.exp(-Math.pow((t-.139)/.022,2));
  return (low*.86+grain*.30+white*.06)*rise*travel*roughness
       +(low*.42+grain*.14)*landing;
 },.80);
}
function emit(ctx,kind){if(!enabled||volume===0)return;if(kind==='capture'||kind==='move'){if(kind==='move')slide(ctx);else crumble(ctx);return;}const notes={castle:[330,490],check:[640,850],end:[523,659,784]}[kind]||[440];notes.forEach((hz,i)=>tone(ctx,hz,.3,.18,i*.09,'sine'));}
export function playSound(kind='move'){if(!enabled)return;try{const ctx=setup();if(!ctx)return;if(ctx.state==='suspended'){ctx.resume().then(()=>emit(ctx,kind)).catch(()=>{});}else emit(ctx,kind);}catch{}}
