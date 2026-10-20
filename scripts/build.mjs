import { build } from 'esbuild';
import { cp,mkdir,rm } from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});await cp('public','dist',{recursive:true});
await build({entryPoints:['src/app.js'],bundle:true,minify:true,format:'esm',outfile:'dist/app.js',target:'es2022'});

await build({entryPoints:['src/computer-worker.js'],bundle:true,minify:true,format:'esm',outfile:'dist/computer-worker.js',target:'es2022'});
