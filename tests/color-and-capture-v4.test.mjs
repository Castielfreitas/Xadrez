import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {initialState,applyCommand,SANDRA} from '../src/domain.js';
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8'),css=readFileSync(new URL('../public/style.css',import.meta.url),'utf8'),sound=readFileSync(new URL('../src/sound.js',import.meta.url),'utf8');
let seq=0;const act=(s,id,type,payload={})=>applyCommand(s,{id,admin:id==='admin'},{id:'fair-colors-'+(++seq),type,payload},1000+seq);
test('server chooses both colors for human versus Casandra across a series',()=>{
 let s=initialState();
 for(const id of ['admin','human']){s=act(s,id,'register',{name:id});s=act(s,id,'demo_credit');}
 s=act(s,'admin','settings',{sandraChallenges:true,sandraTournaments:true});
 const original=globalThis.crypto.randomUUID.bind(globalThis.crypto);
 const old=globalThis.crypto;
 let salt=0;
 try{
  Object.defineProperty(globalThis,'crypto',{configurable:true,value:{randomUUID:()=>('99999999-8888-4888-a888-'+(salt++%2?'aaaaaaaaaaab':'aaaaaaaaaaaa'))}});
  for(let i=0;i<2;i++){
   const bot=s.players[SANDRA];
   const g=s.games.at(-1);
   if(g){g.status='finished';s.challenges.find(c=>c.id===g.challenge).status='finished';}
   s=act(s,'human','sandra_match',{minutes:5,increment:0,stake:0,botConsent:true});
  }
  assert.notEqual(s.games[0].white,s.games[1].white);
  assert.deepEqual(new Set(s.games.map(g=>g.white)),new Set(['human',SANDRA]));
 }finally{Object.defineProperty(globalThis,'crypto',{configurable:true,value:old});}
});
test('capture FX remain animated even when normal piece movements are instantaneous',()=>{
 assert.match(app,/for\(let i=0;i<16;i\+\+\)/);
 assert.match(css,/\.board \.capture-effect \.piece\.capture-shard\{/);
 assert.match(css,/animation:arena-debris-fall 1050ms/);
 assert.match(css,/\.board \.capture-effect \.capture-splash\{/);
 assert.match(app,/if\(unseenCapture\)crumbleCapture\(unseenCapture,captureFlipped\)/);
});
test('hero knights render with same 3D piece sprites; no emoji glyphs or paid Didit links',()=>{
 assert.match(app,/class="hero-knight-3d"/);
 assert.match(app,/class="practice-knight"/);
 assert.doesNotMatch(app,/floating-tag">♞/);
 assert.doesNotMatch(app,/practice-knight">♞/);
 assert.doesNotMatch(app,/data-action="start-kyc"/);
 assert.match(css,/\.hero-board-3d\{/);
});
test('capture sounds like rolling rubble, not clipped gunfire',()=>{
 assert.match(sound,/const duration=1\.28/);
 assert.match(sound,/createBiquadFilter\?\.\(\)/);
 assert.match(sound,/const rise=Math\.min\(1,t\/\.115\)/);
 assert.doesNotMatch(sound,/tone\(ctx,90/);
});
