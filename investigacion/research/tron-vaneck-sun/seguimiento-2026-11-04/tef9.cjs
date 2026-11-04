const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs');
const keys=loadTronKeys({file:'C:/EquipoIA/tether-blacklist/config.secret.json'});const b58=require('./b58.cjs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ts(addr){await sleep(300);try{const r=await fetch('https://apilist.tronscanapi.com/api/accountv2?address='+addr,{headers:{accept:'application/json',...(keys.tronscanKey?{'TRON-PRO-API-KEY':keys.tronscanKey}:{})},signal:AbortSignal.timeout(15000)});const j=await r.json();return {tag:(j.publicTag||j.addressTag||''),contrato:j.accountType===2,creada:j.date_created?new Date(j.date_created).toISOString().slice(0,10):'',txs:j.totalTransactionCount,trx:j.balance/1e6,stake:(j.totalFrozenV2||0)/1e6}}catch(e){return {tag:'(error)'}}}
async function grid(url){for(let i=0;i<4;i++){await sleep(350);try{const r=await fetch(url,{headers:{accept:'application/json',...(keys.tronGridKey?{'TRON-PRO-API-KEY':keys.tronGridKey}:{})},signal:AbortSignal.timeout(25000)});if(r.status===429||r.status>=500){await sleep(2000*(i+1));continue}return r.json()}catch{await sleep(1500)}}return null}
async function pag(url,max=6){let rows=[],p=0;while(url&&p<max){const j=await grid(url);if(!j||!j.data)break;rows.push(...j.data);p++;url=j.meta&&j.meta.fingerprint?url.split('&fingerprint=')[0]+'&fingerprint='+j.meta.fingerprint:null}return rows}
const nom={};const nombre=async a=>{if(!(a in nom))nom[a]=await ts(a);return nom[a]};
(async()=>{
 for(const A of ['TEF9ZVUxhmGGffvkf59e2vdLfAG1QCMb7B','TRUv13DTyTG7bBz3dStnkUGMZttgN1U6jy','TEJmeXhUudtxrxLUM7Akuivtv6wptWxHyz']){
  const f=await ts(A);console.log('\n== '+A,JSON.stringify(f));
  const acc=await grid('https://api.trongrid.io/v1/accounts/'+A);const d=acc&&acc.data&&acc.data[0];console.log('TronGrid: TRX libre',d?((d.balance||0)/1e6).toLocaleString('es-ES',{maximumFractionDigits:0}):'?','| stake',d?((d.frozenV2||[]).reduce((s,x)=>s+(x.amount||0),0)/1e6).toLocaleString('es-ES',{maximumFractionDigits:0}):'?','| delegado a otros',d?((d.account_resource&&d.account_resource.delegated_frozenV2_balance_for_energy||0)/1e6+((d.delegated_frozenV2_balance_for_bandwidth||0)/1e6)).toLocaleString('es-ES',{maximumFractionDigits:0}):'?');
  if(A!=='TEF9ZVUxhmGGffvkf59e2vdLfAG1QCMb7B')continue;
  // historial de TRX ≥ 1 M (todo el tiempo, hasta 6 páginas) y stake
  const nat=await pag('https://api.trongrid.io/v1/accounts/'+A+'/transactions?limit=200&order_by=block_timestamp,asc',6);
  const tipos={};for(const t of nat){tipos[t.raw_data.contract[0].type]=(tipos[t.raw_data.contract[0].type]||0)+1}console.log('transacciones leídas:',nat.length,JSON.stringify(tipos),'| primera',nat[0]&&new Date(nat[0].block_timestamp).toISOString().slice(0,10));
  for(const t of nat){const c=t.raw_data.contract[0],v=c.parameter.value,ts0=new Date(t.block_timestamp).toISOString().slice(0,16);
   if(c.type==='TransferContract'&&v.amount>=1e12){const de=b58(v.owner_address),a=b58(v.to_address);const o=de===A?a:de;const n=await nombre(o);console.log('  ',ts0,de===A?'SALE ':'ENTRA',(v.amount/1e6).toLocaleString('es-ES',{maximumFractionDigits:0}).padStart(12),'TRX',o,'|',n.tag||'(sin etiqueta)',n.creada?'creada '+n.creada:'',n.contrato?'[contrato]':'','|',t.txID.slice(0,10))}
   else if(/Freeze|Delegate|Withdraw|Vote/.test(c.type))console.log('  ',ts0,c.type.replace('Contract',''),((v.unfreeze_balance||v.frozen_balance||v.balance||0)/1e6).toLocaleString('es-ES',{maximumFractionDigits:0}),'TRX',v.receiver_address?'→ '+b58(v.receiver_address):'',c.type==='VoteWitnessContract'?JSON.stringify((v.votes||[]).map(x=>[b58(x.vote_address),x.vote_count])).slice(0,160):'',t.txID.slice(0,10));
   else if(c.type==='TriggerSmartContract'&&v.call_value>=1e12)console.log('  ',ts0,'TRX a contrato',(v.call_value/1e6).toLocaleString('es-ES',{maximumFractionDigits:0}),b58(v.contract_address),t.txID.slice(0,10));}
 }
})();
