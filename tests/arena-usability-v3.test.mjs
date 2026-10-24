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
 assert.match(app,/duration:0,easing:.*?fill:'both'/);
 assert.match(app,/pendingVisualMove=\{id:game.id,baseFen:game.fen,ply,game:predicted\}/);
 assert.match(sound,/const duration=\.18/);
 assert.match(css,/transition-duration:0ms!important/);
});
test('capture uses a soft filtered sound with volume control and dynamic compression',()=>{
 assert.match(sound,/function materialNoise\(/);
 assert.match(sound,/function crumble\(/);
 assert.match(sound,/const duration=\.48/);
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

test('menu symbols are slim and dimensional only through subtle shadows',()=>{
 assert.match(app,/stroke-width="1.65"/);
 assert.match(css,/\.nav svg\.arena-menu-icon/);
 assert.match(css,/stroke-width:1.65!important/);
 assert.doesNotMatch(app,/id="arena-3d-bevel"/);
});
