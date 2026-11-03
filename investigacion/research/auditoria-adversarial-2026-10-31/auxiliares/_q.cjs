const fs=require('fs');const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs');const k=loadTronKeys({file:'C:/EquipoIA/tether-blacklist/config.secret.json'});
const HS={accept:'application/json','TRON-PRO-API-KEY':k.tronscanKey};const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const S=async u=>{await sleep(330);const r=await fetch('https://apilist.tronscanapi.com'+u,{headers:HS});return r.json();};
const D='C:/EquipoIA/research/binance-0x5227-2026-10-30/tron/';const cl=JSON.parse(fs.readFileSync(D+'traza-clases.json','utf8'));
(async()=>{
 for(const a of ['TQqgNg13s2DjvXhW1ky4v6TsR8wZGvb7Y4','TYVWGh8XkmU49Hi9PkGAZXiiJPB3J5zJZy','TFGDbUyP8xez44C76fin3bn3Ss6jugoUwJ','TSUUVjysXV8YqHytSNjfkNXnnB49QDvZpx']){
  const c=await S('/api/accountv2?address='+a);
  console.log(a,'| clase en la traza:',JSON.stringify(cl[a]||cl.clases&&cl.clases[a]||null).slice(0,200),'| tag:',c.addressTag||c.publicTag||null,'| contrato:',c.accountType,c.contractInfo?JSON.stringify(c.contractInfo).slice(0,120):'','| creada',c.date_created?new Date(c.date_created).toISOString().slice(0,10):'?','| ops',c.transactions,'| nombre',c.name||'');
  const t=await S('/api/token_trc20/transfers?limit=3&start=0&sort=-timestamp&contract_address=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t&relatedAddress='+a);
  for(const x of (t.token_transfers||[]).slice(0,3)){const tx=await S('/api/transaction-info?hash='+x.transaction_id);console.log('   tx',x.transaction_id.slice(0,12),'trigger→',tx.contractData&&(tx.contractData.contract_address||tx.contractData.to_address),'| método',tx.trigger_info&&tx.trigger_info.methodName,'| from',x.from_address.slice(0,8),'to',x.to_address.slice(0,8),Number(x.quant)/1e6);}
 }
})();
