const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs');
const keys=loadTronKeys({file:'C:/EquipoIA/tether-blacklist/config.secret.json'});const b58=require('./b58.cjs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));const H={accept:'application/json','content-type':'application/json',...(keys.tronGridKey?{'TRON-PRO-API-KEY':keys.tronGridKey}:{})};
async function ts(addr){await sleep(300);try{const r=await fetch('https://apilist.tronscanapi.com/api/accountv2?address='+addr,{headers:{accept:'application/json',...(keys.tronscanKey?{'TRON-PRO-API-KEY':keys.tronscanKey}:{})},signal:AbortSignal.timeout(15000)});const j=await r.json();return (j.publicTag||j.addressTag||'')+(j.date_created?' (creada '+new Date(j.date_created).toISOString().slice(0,10)+')':'')}catch(e){return '(error)'}}
async function post(url,body){for(let i=0;i<4;i++){await sleep(350);try{const r=await fetch(url,{method:'POST',headers:H,body:JSON.stringify(body),signal:AbortSignal.timeout(25000)});if(r.status===429||r.status>=500){await sleep(2000*(i+1));continue}return r.json()}catch{await sleep(1500)}}return null}
async function get(url){for(let i=0;i<4;i++){await sleep(350);try{const r=await fetch(url,{headers:H,signal:AbortSignal.timeout(25000)});if(r.status===429||r.status>=500){await sleep(2000*(i+1));continue}return r.json()}catch{await sleep(1500)}}return null}
(async()=>{
 const A='TEF9ZVUxhmGGffvkf59e2vdLfAG1QCMb7B';
 const idx=await post('https://api.trongrid.io/wallet/getdelegatedresourceaccountindexv2',{value:A,visible:true});
 const tos=(idx&&idx.toAccounts)||[];console.log('TEF9ZV delega ahora a',tos.length,'cuentas');
 const filas=[];for(const to of tos){const d=await post('https://api.trongrid.io/wallet/getdelegatedresourcev2',{fromAddress:A,toAddress:to,visible:true});const e=((d&&d.delegatedResource)||[]).reduce((s,x)=>s+(x.frozen_balance_for_energy||0)+(x.frozen_balance_for_bandwidth||0),0)/1e6;filas.push([to,e])}
 filas.sort((a,b)=>b[1]-a[1]);let tot=0;for(const [to,e] of filas){tot+=e;if(e>=1e6)console.log('  ',e.toLocaleString('es-ES',{maximumFractionDigits:0}).padStart(14),'TRX →',to,'|',await ts(to))}
 console.log('  total delegado:',tot.toLocaleString('es-ES',{maximumFractionDigits:0}),'TRX (',filas.filter(f=>f[1]<1e6).length,'receptores pequeños omitidos )');
 // ¿de dónde sacó la proveedora los 500 M TRX del 2-nov? entradas de TRX ≥ 10 M desde el 29-oct
 const W='TWhDfwC8QE6pQyiYy248dNor3uphPEw5M2';console.log('\n-- TRX ≥ 10 M que entran/salen de la proveedora desde el 29-oct:');
 let url='https://api.trongrid.io/v1/accounts/'+W+'/transactions?limit=200&only_confirmed=true&min_timestamp='+Date.UTC(2026,9,29)+'&order_by=block_timestamp,asc',p=0;
 while(url&&p<15){const j=await get(url);if(!j||!j.data)break;p++;for(const t of j.data){const c=t.raw_data.contract[0],v=c.parameter.value;if(c.type!=='TransferContract'||!(v.amount>=1e13))continue;const de=b58(v.owner_address),a=b58(v.to_address),o=de===W?a:de;console.log('  ',new Date(t.block_timestamp).toISOString().slice(0,16),de===W?'SALE ':'ENTRA',(v.amount/1e6).toLocaleString('es-ES',{maximumFractionDigits:0}).padStart(12),'TRX',o,'|',await ts(o),'|',t.txID.slice(0,10))}url=j.meta&&j.meta.fingerprint?url.split('&fingerprint=')[0]+'&fingerprint='+j.meta.fingerprint:null}
 console.log('  (páginas leídas',p+')');
})();
