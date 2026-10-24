import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {shopItem,COLLECTIONS,COUNTS,SPECIAL_NAMES,ARCHETYPES,PALETTES} from '../src/shop-catalog.js';
import {LEGENDS} from '../src/legend-catalog.js';
test('deployed finance bundle resolves exactly the same catalog metadata and group prices as the canonical server catalog',async()=>{
 const bundle=await readFile(new URL('../supabase/functions/arena-finance/index.ts',import.meta.url),'utf8');
 const start=bundle.indexOf('function Ye(');assert(start>=0);
 const end=bundle.indexOf('function ',start+10);
 const compiled=runInNewContext(bundle.slice(start,end)+';Ye',{
 Va:LEGENDS,Nt:COLLECTIONS,Ga:Array.from({length:8},(_,i)=>shopItem('avatar-'+String(i).padStart(4,'0')).color),lt:COUNTS,Ur:SPECIAL_NAMES,Kr:ARCHETYPES,ta:PALETTES});
 const cases=[undefined,{rules:{'category:avatar':600,'collection:avatar:royal':700,'group:avatar:realistic':900,'group:avatar:legends':1000,'group:avatar:illustrated':800}},{rules:{'group:avatar:realistic':100}},{rules:{'item:avatar-9472':1500,'group:avatar:legends':1200}}];
 for(const [kind,total] of Object.entries(COUNTS))for(let n=0;n<total;n++){const sku=kind+'-'+String(n).padStart(4,'0');for(const pricing of cases)assert.equal(JSON.stringify(compiled(sku,pricing)),JSON.stringify(shopItem(sku,pricing)),sku);}
});
