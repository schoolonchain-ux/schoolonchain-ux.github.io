const crypto=require('node:crypto');
const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs');
const keys=loadTronKeys({file:'C:/EquipoIA/tether-blacklist/config.secret.json'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ts(addr){await sleep(350);try{const r=await fetch('https://apilist.tronscanapi.com/api/accountv2?address='+addr,{headers:{accept:'application/json',...(keys.tronscanKey?{'TRON-PRO-API-KEY':keys.tronscanKey}:{})},signal:AbortSignal.timeout(15000)});const j=await r.json();return (j.publicTag||j.addressTag||'')+(j.accountType===2?' [contrato]':'')}catch(e){return '(error)'}}
async function grid(url){for(let i=0;i<4;i++){await sleep(400);try{const r=await fetch(url,{headers:{accept:'application/json',...(keys.tronGridKey?{'TRON-PRO-API-KEY':keys.tronGridKey}:{})},signal:AbortSignal.timeout(25000)});if(r.status===429||r.status>=500){await sleep(2000*(i+1));continue}return r.json()}catch{await sleep(1500)}}return null}
(async()=>{
 const T='TT2T17KZhoDu47i2E4FWxfG79zdkEWkU9N';
 // 1) ¿quién es TNUC9Qb1…? sacarlo de las internas de 3ae0bfde… buscando en la lista de la cuenta
 const j0=await grid('https://api.trongrid.io/v1/accounts/'+T+'/transactions?limit=50&min_timestamp='+Date.UTC(2026,10,3,6)+'&max_timestamp='+Date.UTC(2026,10,3,7));
 const t0=(j0&&j0.data||[]).find(t=>t.txID.startsWith('3ae0bfde23'));
 if(t0){const info=await fetch('https://api.trongrid.io/wallet/gettransactioninfobyid',{method:'POST',headers:{'content-type':'application/json',...(keys.tronGridKey?{'TRON-PRO-API-KEY':keys.tronGridKey}:{})},body:JSON.stringify({value:t0.txID})}).then(r=>r.json());
  const it=(info.internal_transactions||[]).find(i=>(i.callValueInfo||[]).some(c=>c.callValue>=1e12));
  if(it){const AL='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';const b58=hex=>{const b=Buffer.from(hex,'hex');const c=crypto.createHash('sha256').update(crypto.createHash('sha256').update(b).digest()).digest().subarray(0,4);let n=BigInt('0x'+Buffer.concat([b,c]).toString('hex')),s='';while(n>0n){s=AL[Number(n%58n)]+s;n/=58n}return s};const v=b58(it.caller_address);console.log('bóveda que devuelve el TRX:',v,'|',await ts(v));}}
 // 2) USDT de la cuenta el 2 y 3 de nov: entradas y salidas ≥1 M con contraparte
 console.log('\n-- USDT/USDD ≥1 M de TT2T17 desde el 1-nov (TRC20):');
 let url='https://api.trongrid.io/v1/accounts/'+T+'/transactions/trc20?limit=200&min_timestamp='+Date.UTC(2026,10,1)+'&order_by=block_timestamp,asc';const rows=[];
 while(url){const j=await grid(url);if(!j||!j.data)break;rows.push(...j.data);url=j.meta&&j.meta.fingerprint?url.split('&fingerprint=')[0]+'&fingerprint='+j.meta.fingerprint:null}
 const nom={};const nombre=async a=>{if(!(a in nom))nom[a]=await ts(a);return nom[a]};
 for(const r of rows){const v=Number(r.value)/10**Number(r.token_info.decimals);if(v<1e6)continue;const sym=r.token_info.symbol;const other=r.from===T?r.to:r.from;console.log(new Date(r.block_timestamp).toISOString().slice(0,16),r.from===T?'SALE  ':'ENTRA ',v.toLocaleString('es-ES',{maximumFractionDigits:0}).padStart(12),sym.padEnd(5),other,'|',await nombre(other),'|',r.transaction_id.slice(0,10))}
 // 3) qué hicieron las dos billeteras nuevas con los 140 M USDT
 for(const a of ['TCFfQYygyfTTYE8So6wQbpNk7BEMomJH9J','TKV6xqB7VPTThF3Ru8VrNh7QQLVReTNvuV']){
  console.log('\n-- movimientos TRC20 ≥100 k de',a);
  const j=await grid('https://api.trongrid.io/v1/accounts/'+a+'/transactions/trc20?limit=200&order_by=block_timestamp,asc');
  for(const r of (j&&j.data||[])){const v=Number(r.value)/10**Number(r.token_info.decimals);if(v<1e5)continue;const other=r.from===a?r.to:r.from;console.log('  ',new Date(r.block_timestamp).toISOString().slice(0,16),r.from===a?'SALE  ':'ENTRA ',v.toLocaleString('es-ES',{maximumFractionDigits:0}).padStart(12),r.token_info.symbol,other,'|',await nombre(other),'|',r.transaction_id.slice(0,10))}
  const acc=await grid('https://api.trongrid.io/v1/accounts/'+a);const d=acc&&acc.data&&acc.data[0];const usdt=d&&(d.trc20||[]).map(o=>Object.entries(o)[0]).find(([k])=>k==='TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t');console.log('   saldo ahora: TRX',d?(d.balance||0)/1e6:'?','USDT',usdt?Number(usdt[1])/1e6:0)}
 const p=await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tron&vs_currencies=usd').then(r=>r.json()).catch(()=>null);console.log('\nprecio TRX (CoinGecko):',p&&p.tron&&p.tron.usd);
})();
