import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../public/style.css',import.meta.url),'utf8');
test('every online move renders a legal optimistic position before awaiting network confirmation',()=>{
 assert.match(app,/pendingVisualMove=\{id:game\.id,baseFen:game\.fen,ply,game:predicted\};\s*selected=null;render\(\);/);
 assert.match(app,/await send\('move',\{id:game\.id,from,to,promotion,ply\}\)/);
 assert.match(app,/finally\{pendingVisualMove=null;render\(\);\}/);
 assert.match(app,/chess\.move\(\{from,to,promotion\}\)/);
 assert.match(app,/confirmed\.fen===pendingVisualMove\.baseFen/);
});
test('live play polls all active game types without waiting for presence writes',()=>{
 assert.match(app,/\(fast\?350:1800\)/);
 assert.match(app,/\},250\);\s*async function enterOnline/);
 assert.match(app,/type:'presence',payload:\{\}\}\)\.catch\(\(\)=>\{\}\)/);
});
test('selection feedback updates only square classes instead of rebuilding the entire chess interface',()=>{
 assert.match(app,/function refreshSquareSelection\(/);
 assert.match(app,/cell\.classList\.toggle\('move-target',legal\.includes/);
 assert.match(app,/selected=null;refreshSquareSelection\(\);return/);
});
test('menu symbols use slim outlines, and board travel is short and visible',()=>{
 assert.match(app,/stroke-width="1.65"/);
 assert.match(css,/\.nav svg\.arena-menu-icon/);
 assert.match(css,/transition-duration:180ms!important;animation-duration:180ms!important/);
});
