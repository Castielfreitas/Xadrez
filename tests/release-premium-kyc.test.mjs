import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../public/style.css',import.meta.url),'utf8');
const sound=readFileSync(new URL('../src/sound.js',import.meta.url),'utf8');
const kyc=readFileSync(new URL('../supabase/functions/arena-kyc/index.ts',import.meta.url),'utf8');
const sql=readFileSync(new URL('../supabase/migrations/20261022_automated_kyc_pilot.sql',import.meta.url),'utf8');

test('home uses 3D hero scene and renders true sprite material instead of unicode board text',()=>{
 assert.match(app,/hero-board-scene/);
 assert.match(app,/hero-board-3d/);
 assert.match(css,/\.hero-board-3d\{[\s\S]*?transform-style:preserve-3d/);
 assert.match(css,/\.hero-board \.piece \.piece-real\{display:block/);
});
test('trophies have their own metallic 3D icon while menu navigation remains lightweight',()=>{
 assert.match(app,/arena-trophy-3d/);
 assert.match(app,/arena-trophy-metal/);
 assert.match(css,/svg\.arena-trophy-3d/);
 assert.match(app,/class="arena-menu-icon"/);
});
test('rating appears for both sides, including Casandra and estimated non-official computer difficulty',()=>{
 assert.match(app,/function playerRating/);
 assert.match(app,/bot\)<\/span>/);
 assert.match(app,/Computador <span class="player-rating/);
 assert.match(app,/estimado\)\<\/span>/);
});
test('only local computer gets a deliberate ~230ms reaction, unlike instant online movement',()=>{
 assert.match(app,/Math\.max\(0,230-\(Date\.now\(\)-startedAt\)\)/);
 assert.match(app,/pendingVisualMove=\{id:game\.id,baseFen:game\.fen,ply,game:predicted\}/);
});
test('capture has soft granular collapse without simulated gunshot/kick notes',()=>{
 assert.match(sound,/const duration=\.48/);
 assert.match(sound,/Math\.min\(1,age\/\.035\)/);
 assert.doesNotMatch(sound,/tone\(ctx,90/);
 assert.doesNotMatch(sound,/tone\(ctx,67/);
});
test('automated KYC provider is per-user authenticated, anti-replay, production-only for real identities',()=>{
 assert.match(kyc,/db\.auth\.getUser\(token\)/);
 assert.match(kyc,/\.eq\('user_id',user\.id\)/);
 assert.match(kyc,/const decision=await provider\(/);
 assert.match(kyc,/if\(row\.environment!=='production'\)return 'verified'/);
 assert.match(kyc,/state\.identities\[row\.user_id\]/);
 assert.match(kyc,/state\.identities\?\.\[row\.user_id\]\?\.status==='verified'/);
 assert.match(kyc,/validIdentity\(decision\)/);
 assert.match(kyc,/cpfHash===protectedData\.cpfHash/);
 assert.match(kyc,/DIDIT_REQUIRE_AML/);
});
test('pilot allows a maximum R$1 in sandbox per existing human user and no public access to KYC',()=>{
 assert.match(sql,/max_deposit_cents integer not null default 100/);
 assert.match(sql,/scope text not null default 'sandbox'/);
 assert.match(sql,/enable row level security/);
 assert.match(sql,/revoke all on table public\.arena_kyc_sessions from public,anon,authenticated/);
 assert.doesNotMatch(sql,/update arena_private\.finance_config set.*wallet_enabled\s*=\s*true/is);
});
