import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {runInNewContext} from 'node:vm';
const source=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const declaration=source.split('\n').find(line=>line.startsWith('const money='));
const format=(n,currency,online=true)=>runInNewContext(declaration+';money(n,source)',{n,source:{currency},online,localDemoAllowed:false,brl:n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n/100)});
test('production monetary display formats actual BRL and never relabels historical test balances as cash',()=>{assert.match(format(1800,'BRL'),/R\$\s*18,00/);assert.equal(format(1800,'TEST'),'—');assert.equal(format(1800,undefined),'—');assert.match(format(0,'TEST'),/R\$\s*0,00/);assert.equal(format(1800,'BRL',false),'Entre para ver valores');});
