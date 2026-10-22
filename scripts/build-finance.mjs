import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
await mkdir('supabase/functions/arena-finance',{recursive:true});
await build({entryPoints:['server/edge-finance.js'],bundle:true,minify:true,format:'esm',platform:'neutral',mainFields:['module','main'],target:'es2022',outfile:'supabase/functions/arena-finance/index.ts',external:['node:*','npm:*'],alias:{'@supabase/supabase-js':'npm:@supabase/supabase-js@2.118.0'},banner:{js:"import process from 'node:process'; import {Buffer} from 'node:buffer';"}});
