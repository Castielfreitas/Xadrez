// Never surface proxy HTML/plain-text responses or retry money/move commands.
export async function readApiResponse(response){
 let data;try{data=JSON.parse(await response.text());}catch{throw Error(response.status===401?'Entre novamente na sua conta.':'O servidor não confirmou a operação. Aguarde a atualização da partida antes de tentar novamente.');}
 if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Resposta inválida do servidor. Aguarde a atualização da partida.');
 return data;
}
