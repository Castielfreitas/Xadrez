import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../public/style.css',import.meta.url),'utf8');
const cardStart=app.indexOf('function tournaments(){');
const cardEnd=app.indexOf('function legacyWallet(){',cardStart);
const card=app.slice(cardStart,cardEnd);
const detailStart=app.indexOf('function tournamentDetails(){');
const detailEnd=app.indexOf('function tournaments(){',detailStart);
const detail=app.slice(detailStart,detailEnd);
test('tournament cards contain only summaries and an accessible details action',()=>{
 assert(cardStart>=0 && cardEnd>cardStart);
 assert.match(card,/data-action="view-tournament"/);
 assert.match(card,/Ver campeonato e classificação/);
 assert.doesNotMatch(card,/tournamentStanding\(t\)/);
 assert.doesNotMatch(card,/class="bracket"/);
});
test('live standings, avatar, player country and pairings render inside championship page',()=>{
 assert(detailStart>=0 && detailEnd>detailStart);
 assert.match(detail,/tournamentStanding\(t\)/);
 assert.match(detail,/Confrontos e rodadas/);
 assert.match(detail,/data-game=/);
 assert.match(app,/function tournamentStanding\(t\)/);
 assert.match(app,/tournamentCountry\(row\.p\.country\)/);
 assert.match(app,/avatar\(row\.u\)/);
 assert.match(app,/'tournament-detail':tournamentDetails/);
 assert.match(app,/selectedTournamentId=uid;tab='tournament-detail'/);
});
test('banner title has absolute positioning and cannot be clipped by relative override',()=>{
 assert.match(css,/Torneios: cabeçalho integral e classificação/);
 assert.match(css,/\.tournament-cover>span\{[\s\S]*?position:absolute!important/);
 assert.match(css,/\.tournament-cover>span\{[\s\S]*?max-width:calc\(100% - 26px\)/);
 assert.match(css,/\.tournament-card h2\{overflow-wrap:anywhere/);
 assert.match(css,/@media\(max-width:720px\)/);
});
