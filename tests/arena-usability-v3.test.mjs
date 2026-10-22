import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../public/style.css',import.meta.url),'utf8');
const sound=readFileSync(new URL('../src/sound.js',import.meta.url),'utf8');
const bot=readFileSync(new URL('../server/sandra.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
test('mode selection visibly persists and exposes accessible active state in lobby and setup',()=>{
 assert.match(app,/function selectGameMode\(mode\)/);
 assert.match(app,/localStorage\.setItem\('arena-game-mode',mode\)/);
 assert.match(app,/selectedGameMode==='online'/);
 assert.match(app,/selectedGameMode==='computer'/);
 assert.match(app,/selectedGameMode==='stake'/);
 assert.match(app,/aria-pressed=/);
 assert.match(css,/\.mode-card\.is-selected/);
 assert.match(css,/\.setup-tabs button\.is-selected/);
});
test('board movement and its sound finish promptly',()=>{
 assert.match(app,/duration:105,easing/);
 assert.match(sound,/const duration=\.115/);
 assert.match(css,/transition-duration:\.10s!important/);
});
test('capture uses a crisp full-band sound with volume control and dynamic compression',()=>{
 assert.match(sound,/noise\*\.61\+low\*\.39/);
 assert.match(sound,/gain\.gain\.setValueAtTime\(\.94,at\)/);
 assert.match(sound,/gain\.connect\(master\)/);
 assert.match(sound,/createDynamicsCompressor/);
});
test('Casandra keeps strongest Stockfish options while reusing a warm engine',()=>{
 assert.match(bot,/Skill Level value 20/);
 assert.match(bot,/UCI_LimitStrength value false/);
 assert.match(bot,/THINK_MS=220/);
 assert.match(bot,/if\(engine\)return engine\.ready/);
 assert.match(bot,/sequence=work\.catch/);
});
test('original dimensional favicon is restored and text and icons are enlarged',()=>{
 assert.match(html,/rel="icon" href="\/icon\.svg"/);
 assert.match(css,/\.brand \.brand-knight\{width:60px/);
 assert.match(css,/\.mode-card>svg:first-child\{width:34px/);
 assert.match(css,/\.nav\{font-size:14px/);
});
