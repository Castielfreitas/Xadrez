import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
import {financeBuildOptions} from './finance-build-options.mjs';
await mkdir('supabase/functions/arena-finance',{recursive:true});
await build(financeBuildOptions);
