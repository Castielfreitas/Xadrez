import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {runInNewContext} from 'node:vm';import {parseHTML} from 'linkedom';
const app=await readFile(new URL('../src/app.js',import.meta.url),'utf8');
const from=app.indexOf('async function quickMatchForm('),to=app.indexOf('const PLAYER_COUNTRIES',from);
function fixture(enabled=true){let html='';const sandbox={online:true,localDemoAllowed:false,config:{cashGamesEnabled:true},computerOffer:{},state:{settings:{sandraCashChallenges:enabled}},trustRequest:async()=>({enabled,busy:false,maxStakeCents:750}),configure:value=>html=value,timePicker:()=>'',brl:c=>'R$ '+(c/100).toFixed(2),loginForm(){},modal(){}};runInNewContext(app.slice(from,to)+';this.open=quickMatchForm;',sandbox);return {sandbox,get html(){return html;}};}
test('paid setup includes explicit computer option only when enabled and shows the server entry cap',async()=>{
 for(const enabled of [true,false]){const f=fixture(enabled);await f.sandbox.open('stake');assert.equal(f.html.includes('value="sandra"'),enabled);if(enabled){assert.match(f.html,/Entrada máxima/);assert.match(f.html,/R\$ 7.50/);assert.match(f.html,/Escolho enfrentar Cassandra — computador\./);}}
});
test('computer choice clamps input to available bankroll and requires explicit consent without human rating',async()=>{
 const f=fixture(true);await f.sandbox.open('stake');const {document}=parseHTML(f.html);const form=document.querySelector('form');form.querySelector('[name=opponent] option[value=sandra]').selected=true;form.querySelector('[name=mode]').value='stake';
 let previews=0;f.sandbox.updateEntryPreview=()=>previews++;runInNewContext(app.slice(app.indexOf('function updateComputerOpponent('),app.indexOf("document.addEventListener('change',e=>{if(e.target.matches('#quick-form",app.indexOf('function updateComputerOpponent(')))+';this.update=updateComputerOpponent;',f.sandbox);f.sandbox.update(form);
 assert.equal(form.querySelector('[name=stake]').max,'7.50');assert.equal(form.querySelector('[name=stake]').value,'7.50');assert(form.querySelector('[name=botConsent]').required);assert(!form.querySelector('#computer-entry-limit').hidden);assert(form.querySelector('[name=rated]').disabled);assert.equal(previews,1);
 form.querySelector('[name=opponent] option[value=human]').selected=true;f.sandbox.update(form);assert.equal(form.querySelector('[name=stake]').max,'1000.00');assert(form.querySelector('#computer-entry-limit').hidden);assert(form.querySelector('[name=botConsent]').disabled);
});
