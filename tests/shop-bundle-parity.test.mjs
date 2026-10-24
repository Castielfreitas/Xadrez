import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {financeBuildOptions} from '../scripts/finance-build-options.mjs';
test('deployed finance bundle exactly matches the canonical authoritative server implementation',async()=>{
 const bundle=await readFile(new URL('../supabase/functions/arena-finance/index.ts',import.meta.url),'utf8');
 const generated=await build({...financeBuildOptions,write:false});
 assert.equal(bundle,generated.outputFiles[0].text,'Run npm run build:finance before deploying backend changes.');
});
