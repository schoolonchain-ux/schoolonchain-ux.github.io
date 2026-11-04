const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs');
const keys=loadTronKeys({file:'C:/EquipoIA/tether-blacklist/config.secret.json'});const b58=require('./b58.cjs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));const H={accept:'application/json',...(keys.tronGridKey?{'TRON-PRO-API-KEY':keys.tronGridKey}:{})};
async function ts(addr){await sleep(300);try{const r=await fetch('https://apilist.tronscanapi.com/api/accountv2?address='+addr,{headers:{accept:'application/json',...(keys.tronscanKey?{'TRON-PRO-API-KEY':keys.tronscanKey}:{})},signal:AbortSignal.timeout(15000)});const j=await r.json();return (j.publicTag||j.addressTag||'')+(j.date_created?' (creada '+new Date(j.date_created).toISOString().slice(0,10)+')':'')}catch(e){return '(error)'}}
async function get(url){for(let i=0;i<4;i++){await sleep(350);try{const r=await fetch(url,{headers:H,signal:AbortSignal.timeout(25000)});if(r.status===429||r.status>=500){await sleep(2000*(i+1));continue}return r.json()}catch{await sleep(1500)}}return null}
(async()=>{
 let A='TJHKNV4Jwmk7YQht2LFrkQZd9pzvSuN543';
 for(let salto=1;salto<=4;salto++){
  console.log('\n== salto',salto,A,'|',await ts(A));
  const j=await get('https://api.trongrid.io/v1/accounts/'+A+'/transactions?limit=200&order_by=block_timestamp,asc');let origen=null;
  for(const t of (j&&j.data)||[]){const c=t.raw_data.contract[0],v=c.parameter.value;if(c.type==='TransferContract'&&v.amount>=1e13){const de=b58(v.owner_address),a=b58(v.to_address);console.log('  ',new Date(t.block_timestamp).toISOString().slice(0,16),de===A?'SALE ':'ENTRA',(v.amount/1e6).toLocaleString('es-ES',{maximumFractionDigits:0}).padStart(12),'TRX',de===A?a:de,'|',await ts(de===A?a:de),'|',t.txID.slice(0,10));if(de!==A&&!origen)origen=de}
   else if(/Withdraw|Unfreeze/.test(c.type))console.log('  ',new Date(t.block_timestamp).toISOString().slice(0,16),c.type.replace('Contract',''),((v.unfreeze_balance||0)/1e6).toLocaleString('es-ES'),t.txID.slice(0,10));}
  const info=await ts(A); if(!origen||/Binance|HTX|OKX|Bybit|Kraken|Gate|KuCoin|Bitget|MEXC/i.test(info))break; A=origen;
 }
})();
