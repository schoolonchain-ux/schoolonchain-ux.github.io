// Solo lectura: nombres públicos en TronScan (clave en memoria, no se imprime) y transacciones internas de las llamadas grandes en TronGrid.
const crypto=require('node:crypto');
const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs');
const keys=loadTronKeys({file:'C:/EquipoIA/tether-blacklist/config.secret.json'});
const AL='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function b58(hex){ if(!hex) return ''; if(/^T[1-9A-Za-z]{33}$/.test(hex)) return hex; const b=Buffer.from(hex,'hex'); const c=crypto.createHash('sha256').update(crypto.createHash('sha256').update(b).digest()).digest().subarray(0,4); let n=BigInt('0x'+Buffer.concat([b,c]).toString('hex')),s=''; while(n>0n){s=AL[Number(n%58n)]+s;n/=58n} for(const x of Buffer.concat([b,c])){if(x===0)s='1'+s;else break} return s; }
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ts(addr){await sleep(350);try{const r=await fetch('https://apilist.tronscanapi.com/api/accountv2?address='+addr,{headers:{accept:'application/json',...(keys.tronscanKey?{'TRON-PRO-API-KEY':keys.tronscanKey}:{})},signal:AbortSignal.timeout(15000)});const j=await r.json();return {tag:j.publicTag||j.addressTag||'',tipo:j.accountType===2?'contrato':'cuenta',nombreContrato:(j.contract_name||j.contractInfo&&j.contractInfo.name||''),creado:j.date_created?new Date(j.date_created).toISOString().slice(0,10):''}}catch(e){return {tag:'(error '+e.message+')'}}}
async function grid(url,body){for(let i=0;i<4;i++){await sleep(400);try{const r=await fetch(url,{method:body?'POST':'GET',headers:{accept:'application/json','content-type':'application/json',...(keys.tronGridKey?{'TRON-PRO-API-KEY':keys.tronGridKey}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(25000)});if(r.status===429||r.status>=500){await sleep(2000*(i+1));continue}return r.json()}catch{await sleep(1500)}}return null}
(async()=>{
 const H={'416158fe96b950111b8f1f31249fedda484e941312':'undeleg 40,8M','4163d090b2101f125f65e8fae5b9744d0e74eb8746':'undeleg 49,1M','4119ffc904ab2e54fa4f54ffdb1cafd89a44170044':'undeleg 86,6M','410b48984414cc0c6a8e599fb6e3bc11e599de2e24':'undeleg 9,9M','41a346f2bd7d43a5d90b7c57a18196be96b2840e61':'undeleg 67,9M','41f372e671e8e872e14f17236ab29c7995296a3bad':'undeleg 73,9M','4189cbcb2372e1c2fbc00f24895a406a0c722c89f3':'undeleg 29,8M','415a67fa7cc56bd6d043a98e17d329c1dc9e14753f':'undeleg 59,9M','4159059d8d9e984547dc247d55f29e581ff1962b98':'undeleg 101,2M','4171ab23b393abe3a1bedd2b2f139e0130f7365163':'contrato 300M+280M TRX','4172db65b2e023e4783d46023e7135c692e527f6cb':'contrato 170M TRX (29-oct)','TCFfQYygyfTTYE8So6wQbpNk7BEMomJH9J':'recibe 60M USDT','TKV6xqB7VPTThF3Ru8VrNh7QQLVReTNvuV':'recibe 80M USDT'};
 console.log('-- nombres (TronScan, clave:',keys.from.tronscan+'):');
 for(const [h,q] of Object.entries(H)){const a=b58(h);const n=await ts(a);console.log(q.padEnd(26),a,'|',n.tag||'(sin etiqueta)',n.tipo||'',n.nombreContrato?'| contrato: '+n.nombreContrato:'',n.creado?'| creada '+n.creado:'')}
 console.log('\n-- transacciones internas de las llamadas grandes (TronGrid):');
 const A='TT2T17KZhoDu47i2E4FWxfG79zdkEWkU9N';
 for(const tx of ['cb1ab6bebd3ae46c1f3593cc5bf595fa725f669dd0e03dd91958dd596d26916b','4547bb06705db5280d277b9ad294ebca41d4e003845b2a1c3ccbf1bc17e3f079','3ae0bfde23','15234c2733b7066181658a0f9009788ad26bb5f2b6e9bc57cf8232ecb5a18f60','3f075befcb17c70143b3aabee370aeeb82d59578b8b9669b09bdaa35dccde766','02906bb2ed867d6ebb5a8d75477b6141e4ef549a1eb8ae6a3e9d339eae371ee1']){
  if(tx.length<64){ // buscar el hash completo
    const j=await grid('https://api.trongrid.io/v1/accounts/'+A+'/transactions?limit=200&min_timestamp='+Date.UTC(2026,10,3)+'&max_timestamp='+Date.UTC(2026,10,3,7));const t=(j&&j.data||[]).find(t=>t.txID.startsWith(tx));if(!t){console.log(tx,'no encontrado');continue}return0=t.txID; }
  const id=tx.length<64?return0:tx; const info=await grid('https://api.trongrid.io/wallet/gettransactioninfobyid',{value:id});
  const its=(info&&info.internal_transactions)||[]; console.log(id.slice(0,10),'resultado',info&&info.receipt&&info.receipt.result,'| internas:',its.length);
  let sumIn=0,sumOut=0;for(const it of its){for(const cv of (it.callValueInfo||[])){if(cv.tokenId||!(cv.callValue>=1e12))continue;const from=b58(it.caller_address),to=b58(it.transferTo_address);if(to===A)sumIn+=cv.callValue/1e6;if(from===A)sumOut+=cv.callValue/1e6;console.log('   ',(cv.callValue/1e6).toLocaleString('es-ES'),'TRX',from.slice(0,8),'→',to.slice(0,8),it.rejected?'RECHAZADA':'')}}
  console.log('    TRX hacia la cuenta:',sumIn.toLocaleString('es-ES'),'| desde la cuenta:',sumOut.toLocaleString('es-ES'));
 }
})();
var return0;
