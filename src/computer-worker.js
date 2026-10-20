import { chooseMove } from './computer.js';
self.onmessage=e=>{const {id,fen,level}=e.data;try{self.postMessage({id,move:chooseMove(fen,level)});}catch{self.postMessage({id,error:'Não foi possível calcular o lance. Reinicie o treino.'});}};
