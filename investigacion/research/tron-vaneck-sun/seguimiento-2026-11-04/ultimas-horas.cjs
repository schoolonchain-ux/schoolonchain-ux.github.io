// Solo lectura: movimientos ≥ 1 M (TRX, USDT, USDD) de las 4 cuentas del caso desde las 00:00 UTC de hoy, con nombre de la contraparte.
const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs');
const keys=loadTronKeys({file:'C:/EquipoIA/tether-blacklist/config.secret.json'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ts(addr){await sleep(300);try{const r=await fetch('https://apilist.tronscanapi.com/api/accountv2?address='+addr,{headers:{accept:'application/json',...(keys.tronscanKey?{'TRON-PRO-API-KEY':keys.tronscanKey}:{})},signal:AbortSignal.timeout(15000)});const j=await r.json();return (j.publicTag||j.addressTag||'')+(j.accountType===2?' [contrato]':'')+(j.date_created?' (creada '+new Date(j.date_created).toISOString().slice(0,10)+')':'')}catch(e){return '(error)'}}
async function grid(url){for(let i=0;i<4;i++){await sleep(350);try{const r=await fetch(url,{headers:{accept:'application/json',...(keys.tronGridKey?{'TRON-PRO-API-KEY':keys.tronGridKey}:{})},signal:AbortSignal.timeout(25000)});if(r.status===429||r.status>=500){await sleep(2000*(i+1));continue}return r.json()}catch{await sleep(1500)}}return null}
async function pag(url,max=6){let rows=[],p=0;while(url&&p<max){const j=await grid(url);if(!j||!j.data)break;rows.push(...j.data);p++;url=j.meta&&j.meta.fingerprint?url.split('&fingerprint=')[0]+'&fingerprint='+j.meta.fingerprint:null}return rows}
const b58=require('./b58.cjs');const nom={};const nombre=async a=>{if(!(a in nom))nom[a]=await ts(a);return nom[a]};
const CU={TCGVFGDd62LSrfZEaz3M3fYifWWdSDHRL8:'«Vaneck»',TT2T17KZhoDu47i2E4FWxfG79zdkEWkU9N:'Segunda cuenta',TWhDfwC8QE6pQyiYy248dNor3uphPEw5M2:'Proveedora TRON Inc.',TSzSgxRisS5VBXXDcAezTDvnPGi9CbsXvJ:'Pareja de la proveedora'};
(async()=>{
 const DESDE=Date.UTC(2026,10,4); console.log('ahora',new Date().toISOString().slice(0,16),'UTC · ventana desde',new Date(DESDE).toISOString().slice(0,16));
 for(const [A,n] of Object.entries(CU)){
  console.log('\n== '+n+' '+A);
  const acc=await grid('https://api.trongrid.io/v1/accounts/'+A);const d=acc&&acc.data&&acc.data[0];const usdt=d&&(d.trc20||[]).map(o=>Object.entries(o)[0]).find(([k])=>k==='TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t');
  console.log('saldo: TRX',d?((d.balance||0)/1e6).toLocaleString('es-ES',{maximumFractionDigits:0}):'?','| USDT',usdt?(Number(usdt[1])/1e6).toLocaleString('es-ES',{maximumFractionDigits:0}):0,'| en stake',d?((d.frozenV2||[]).reduce((s,f)=>s+(f.amount||0),0)/1e6).toLocaleString('es-ES',{maximumFractionDigits:0}):'?','| descongelando',d?((d.unfrozenV2||[]).reduce((s,f)=>s+(f.unfreeze_amount||0),0)/1e6).toLocaleString('es-ES',{maximumFractionDigits:0}):'?');
  const nat=await pag('https://api.trongrid.io/v1/accounts/'+A+'/transactions?limit=200&min_timestamp='+DESDE+'&order_by=block_timestamp,asc',3);
  const tipos={};for(const t of nat){const c=t.raw_data.contract[0];tipos[c.type]=(tipos[c.type]||0)+1}console.log('transacciones propias/recibidas hoy:',nat.length,JSON.stringify(tipos));
  for(const t of nat){const c=t.raw_data.contract[0],v=c.parameter.value,ts0=new Date(t.block_timestamp).toISOString().slice(11,16);
   if(c.type==='TransferContract'&&v.amount>=1e12){const de=b58(v.owner_address),a=b58(v.to_address);const o=de===A?a:de;console.log('  ',ts0,de===A?'SALE ':'ENTRA',(v.amount/1e6).toLocaleString('es-ES',{maximumFractionDigits:0}).padStart(12),'TRX  ',o,'|',CU[o]||await nombre(o),'|',t.txID.slice(0,10))}
   else if(['UnfreezeBalanceV2Contract','WithdrawExpireUnfreezeContract','FreezeBalanceV2Contract','DelegateResourceContract','UnDelegateResourceContract','CancelAllUnfreezeV2Contract'].includes(c.type))console.log('  ',ts0,c.type.replace('Contract',''),((v.unfreeze_balance||v.frozen_balance||v.balance||0)/1e6).toLocaleString('es-ES',{maximumFractionDigits:0}),'TRX',t.txID.slice(0,10));
   else if(c.type==='TriggerSmartContract'&&v.call_value>=1e12)console.log('  ',ts0,'TRX a contrato',(v.call_value/1e6).toLocaleString('es-ES',{maximumFractionDigits:0}),t.txID.slice(0,10));}
  const trc=await pag('https://api.trongrid.io/v1/accounts/'+A+'/transactions/trc20?limit=200&min_timestamp='+DESDE+'&order_by=block_timestamp,asc',6);
  let cnt=0;for(const r of trc){const v=Number(r.value)/10**Number(r.token_info.decimals);if(v<1e6)continue;cnt++;const o=r.from===A?r.to:r.from;console.log('  ',new Date(r.block_timestamp).toISOString().slice(11,16),r.from===A?'SALE ':'ENTRA',v.toLocaleString('es-ES',{maximumFractionDigits:0}).padStart(12),r.token_info.symbol.padEnd(5),o,'|',CU[o]||await nombre(o),'|',r.transaction_id.slice(0,10))}
  console.log("  tokens ≥1 M hoy:",cnt,'(filas leídas',trc.length+')');
 }
})();
