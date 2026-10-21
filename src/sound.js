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
function impact(ctx,capture){const duration=capture?.24:.11;if(ctx.createBuffer&&ctx.createBufferSource){const buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*duration),ctx.sampleRate),samples=buffer.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1)*Math.exp(-i/(ctx.sampleRate*(capture?.045:.015)));const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;gain.gain.setValueAtTime(capture?.75:.5,ctx.currentTime);source.connect(gain);gain.connect(master);source.start();source.stop(ctx.currentTime+duration);}tone(ctx,capture?180:620,capture?.85:.6,capture?.19:.09);tone(ctx,capture?92:1050,capture?.5:.23,capture?.23:.045,capture?.025:0);if(capture)tone(ctx,420,.35,.09,.055);}
// A sustained friction layer follows the 520 ms slide, then a soft wooden landing.
function slide(ctx){
 const duration=.48;
 if(ctx.createBuffer&&ctx.createBufferSource){
  const buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*duration),ctx.sampleRate),samples=buffer.getChannelData(0);let low=0;
  for(let i=0;i<samples.length;i++){const t=i/ctx.sampleRate,noise=Math.random()*2-1;low=.86*low+.14*noise;samples[i]=low*(.65+.35*Math.sin(t*170)) * Math.min(1,t/.035,(duration-t)/.08);}
  const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;gain.gain.setValueAtTime(1.5,ctx.currentTime);source.connect(gain);gain.connect(master);source.start();source.stop(ctx.currentTime+duration);
 }
 tone(ctx,240,.16,.075,.43);tone(ctx,115,.09,.09,.44);
}
function emit(ctx,kind){if(!enabled||volume===0)return;if(kind==='capture'||kind==='move'){if(kind==='move')slide(ctx);else impact(ctx,true);return;}const notes={castle:[330,490],check:[640,850],end:[523,659,784]}[kind]||[440];notes.forEach((hz,i)=>tone(ctx,hz,.3,.18,i*.09,'sine'));}
export function playSound(kind='move'){if(!enabled)return;try{const ctx=setup();if(!ctx)return;if(ctx.state==='suspended'){ctx.resume().then(()=>emit(ctx,kind)).catch(()=>{});}else emit(ctx,kind);}catch{}}
