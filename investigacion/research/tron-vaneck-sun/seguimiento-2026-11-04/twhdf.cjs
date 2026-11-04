const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs');
const keys=loadTronKeys({file:'C:/EquipoIA/tether-blacklist/config.secret.json'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ts(addr){await sleep(300);try{const r=await fetch('https://apilist.tronscanapi.com/api/accountv2?address='+addr,{headers:{accept:'application/json',...(keys.tronscanKey?{'TRON-PRO-API-KEY':keys.tronscanKey}:{})},signal:AbortSignal.timeout(15000)});const j=await r.json();return (j.publicTag||j.addressTag||'')+(j.accountType===2?' [contrato]':'')+(j.date_created?' (creada '+new Date(j.date_created).toISOString().slice(0,10)+')':'')}catch(e){return '(error)'}}
async function grid(url){for(let i=0;i<4;i++){await sleep(350);try{const r=await fetch(url,{headers:{accept:'application/json',...(keys.tronGridKey?{'TRON-PRO-API-KEY':keys.tronGridKey}:{})},signal:AbortSignal.timeout(25000)});if(r.status===429||r.status>=500){await sleep(2000*(i+1));continue}return r.json()}catch{await sleep(1500)}}return null}
(async()=>{
 const W='TWhDfwC8QE6pQyiYy248dNor3uphPEw5M2', USDT='TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
 console.log('TWhDfwC8:',await ts(W));
 const acc=await grid('https://api.trongrid.io/v1/accounts/'+W);const d=acc&&acc.data&&acc.data[0];const u=d&&(d.trc20||[]).map(o=>Object.entries(o)[0]).find(([k])=>k===USDT);console.log('saldo ahora: TRX',d?((d.balance||0)/1e6).toLocaleString('es-ES'):'?','USDT',u?(Number(u[1])/1e6).toLocaleString('es-ES'):0);
 let url='https://api.trongrid.io/v1/accounts/'+W+'/transactions/trc20?limit=200&contract_address='+USDT+'&min_timestamp='+Date.UTC(2026,10,2,6)+'&order_by=block_timestamp,asc';let rows=[],pags=0;
 while(url&&pags<25){const j=await grid(url);if(!j||!j.data)break;rows.push(...j.data);pags++;url=j.meta&&j.meta.fingerprint?url.split('&fingerprint=')[0]+'&fingerprint='+j.meta.fingerprint:null}
 console.log('transferencias USDT leídas desde el 2-nov 06:00:',rows.length,'(páginas',pags+')','| última leída:',rows.length?new Date(rows[rows.length-1].block_timestamp).toISOString().slice(0,16):'-');
 const nom={};const nombre=async a=>{if(!(a in nom))nom[a]=await ts(a);return nom[a]};
 let inT=0,outT=0;const agg={};
 for(const r of rows){const v=Number(r.value)/1e6;const other=r.from===W?r.to:r.from;const k=(r.from===W?'SALE  ':'ENTRA ')+other;agg[k]=(agg[k]||0)+v;if(r.from===W)outT+=v;else inT+=v;
  if(v>=5e6)console.log(new Date(r.block_timestamp).toISOString().slice(0,16),r.from===W?'SALE  ':'ENTRA ',v.toLocaleString('es-ES',{maximumFractionDigits:0}).padStart(12),'USDT',other,'|',await nombre(other),'|',r.transaction_id.slice(0,10))}
 console.log('\ntotal entradas',inT.toLocaleString('es-ES',{maximumFractionDigits:0}),'salidas',outT.toLocaleString('es-ES',{maximumFractionDigits:0}));
 console.log('\n-- contrapartes con ≥10 M acumulados:');for(const [k,v] of Object.entries(agg).sort((a,b)=>b[1]-a[1]))if(v>=1e7)console.log(' ',k,v.toLocaleString('es-ES',{maximumFractionDigits:0}),'|',await nombre(k.slice(6)));
})();
