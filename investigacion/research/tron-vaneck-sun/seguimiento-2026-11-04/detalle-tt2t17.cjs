// Lectura de solo lectura en TronGrid (sin clave, 1 consulta cada 400 ms): detalle de los movimientos de TT2T17 desde el 29-oct.
const A='TT2T17KZhoDu47i2E4FWxfG79zdkEWkU9N', GRID='https://api.trongrid.io', DESDE=Date.UTC(2026,9,29);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function get(url,body){for(let i=0;i<5;i++){await sleep(400);try{const r=await fetch(url,{method:body?'POST':'GET',headers:{accept:'application/json',...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(25000)});if(r.status===429||r.status>=500){await sleep(2500*(i+1));continue}return r.json()}catch{await sleep(2000)}}return null}
const b58=require('C:/EquipoIA/onchain-core/src/addr.cjs');
const toB=h=>{try{return (b58.hexToBase58||b58.toBase58||b58.hex2b58)(h)}catch{return h}};
(async()=>{
 // 1) todas las transacciones desde el 29-oct (paginado)
 let url=GRID+'/v1/accounts/'+A+'/transactions?limit=200&min_timestamp='+DESDE+'&order_by=block_timestamp,asc', all=[];
 while(url){const j=await get(url);if(!j||!j.data)break;all.push(...j.data);url=j.meta&&j.meta.fingerprint?GRID+'/v1/accounts/'+A+'/transactions?limit=200&min_timestamp='+DESDE+'&order_by=block_timestamp,asc&fingerprint='+j.meta.fingerprint:null}
 console.log('transacciones desde 29-oct:',all.length);
 const tipos={};for(const t of all){const c=t.raw_data.contract[0];tipos[c.type]=(tipos[c.type]||0)+1}console.log(tipos);
 console.log('\n-- UnDelegateResource / Unfreeze / Withdraw / Transfer (TRX y tokens TRC10):');
 for(const t of all){const c=t.raw_data.contract[0],v=c.parameter.value,ts=new Date(t.block_timestamp).toISOString().slice(0,16);
  if(c.type==='UnDelegateResourceContract')console.log(ts,'UNDELEGATE',(v.balance/1e6).toLocaleString('es-ES'),'TRX',v.resource||'BANDWIDTH','←',toB(v.receiver_address),t.txID.slice(0,10));
  else if(c.type==='UnfreezeBalanceV2Contract')console.log(ts,'UNFREEZE',(v.unfreeze_balance/1e6).toLocaleString('es-ES'),'TRX',v.resource||'BANDWIDTH',t.txID.slice(0,10));
  else if(c.type==='WithdrawExpireUnfreezeContract')console.log(ts,'WITHDRAW',t.txID);
  else if(c.type==='TransferContract')console.log(ts,'TRANSFER',(v.amount/1e6).toLocaleString('es-ES'),'TRX',toB(v.owner_address)===A?'→ '+toB(v.to_address):'← '+toB(v.owner_address),t.txID.slice(0,10));
  else if(c.type==='TransferAssetContract')console.log(ts,'TRC10',v.amount,Buffer.from(v.asset_name,'hex').toString(),toB(v.owner_address)===A?'→ '+toB(v.to_address):'← '+toB(v.owner_address),t.txID.slice(0,10));
 }
 // 2) importe de la retirada
 const w=all.find(t=>t.raw_data.contract[0].type==='WithdrawExpireUnfreezeContract');
 if(w){const info=await get(GRID+'/wallet/gettransactioninfobyid',{value:w.txID});console.log('\nretirada',w.txID.slice(0,10),'withdraw_expire_amount =',info&&info.withdraw_expire_amount!=null?(info.withdraw_expire_amount/1e6).toLocaleString('es-ES')+' TRX':JSON.stringify(info).slice(0,200))}
 // 3) llamadas a contrato con TRX (call_value ≥ 1 M) y sus transacciones internas
 console.log('\n-- llamadas a contrato con ≥1 M TRX:');
 for(const t of all){const c=t.raw_data.contract[0],v=c.parameter.value;if(c.type!=='TriggerSmartContract'||!(v.call_value>=1e12))continue;
  console.log(new Date(t.block_timestamp).toISOString().slice(0,16),(v.call_value/1e6).toLocaleString('es-ES'),'TRX →',toB(v.contract_address),'selector',(v.data||'').slice(0,8),t.txID.slice(0,10))}
 // 4) TRX recibidos por transacciones internas (p. ej. desde TLLENiMp) desde el 29-oct
 console.log('\n-- TRX recibidos/enviados por transacciones internas (≥1 M):');
 let u2=GRID+'/v1/accounts/'+A+'/transactions?limit=200&min_timestamp='+DESDE+'&only_to=true&order_by=block_timestamp,asc';
 // TronGrid: internal tx via /v1/transactions/{tx}/internal? no: usar /wallet/gettransactioninfobyid por cada contrato grande
 const grandes=all.filter(t=>t.raw_data.contract[0].type==='TriggerSmartContract');
 let tot=0;
 for(const t of grandes){const info=await get(GRID+'/wallet/gettransactioninfobyid',{value:t.txID});const its=(info&&info.internal_transactions)||[];
  for(const it of its){const cv=(it.callValueInfo||[]).find(x=>x.callValue>=1e12&&!x.tokenId);if(!cv)continue;const from=toB(it.caller_address),to=toB(it.transferTo_address);
   if(to===A){tot+=cv.callValue/1e6;console.log(new Date(t.block_timestamp).toISOString().slice(0,16),'ENTRA',(cv.callValue/1e6).toLocaleString('es-ES'),'TRX ←',from,t.txID.slice(0,10))}
   else if(from===A)console.log(new Date(t.block_timestamp).toISOString().slice(0,16),'SALE',(cv.callValue/1e6).toLocaleString('es-ES'),'TRX →',to,t.txID.slice(0,10))}}
 console.log('total TRX entrados por internas ≥1 M:',tot.toLocaleString('es-ES'));
})();
