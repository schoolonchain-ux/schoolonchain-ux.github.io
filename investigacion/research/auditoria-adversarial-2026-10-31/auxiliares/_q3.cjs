const fs=require('fs');const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs');const k=loadTronKeys({file:'C:/EquipoIA/tether-blacklist/config.secret.json'});
const HS={accept:'application/json','TRON-PRO-API-KEY':k.tronscanKey};const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const S=async u=>{await sleep(330);const r=await fetch('https://apilist.tronscanapi.com'+u,{headers:HS});return r.json();};
const D='C:/EquipoIA/research/binance-0x5227-2026-10-30/tron/';const cl=JSON.parse(fs.readFileSync(D+'traza-clases.json','utf8'));
const rec=JSON.parse(fs.readFileSync(D+'traza-post-cache.json','utf8')).rec;
const L=['TYRXKm9WJx7NTS8eCRgEZNvKQCVHHQuZsq','TKmHhKXPhniWkYsEggEK69vYi4sfvsHFzN','TEzpJvmSFk5EKayyoBdw5tJDw1TSF8mbG9','TCSWQVye3AnkMhL35vjLVRe8xJzww2iDoK','TXeTRSbhnbvYKBZzhiHqakE1RJLtKBEgGK'];
(async()=>{for(const a of L){const c=await S('/api/accountv2?address='+a);const r=rec[a];
 console.log(a,'| clase traza:',JSON.stringify(cl[a]||null),'| tag',c.addressTag||c.publicTag||c.name||null,'| ops',c.transactions,'| creada',c.date_created?new Date(c.date_created).toISOString().slice(0,10):'?','| rec:',JSON.stringify({nivel:r.nivel,ok:r.ok,parcial:r.parcial,desde:r.desde,nEnt:(r.ent||[]).length,nSal:(r.sal||[]).length}));
 const j=await S('/api/token_trc20/transfers?limit=5&start=0&sort=-timestamp&contract_address=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t&relatedAddress='+a);
 console.log('    últimas 5 USDT:',(j.token_transfers||[]).map(x=>(x.from_address===a?'sale→'+x.to_address.slice(0,8):'entra←'+x.from_address.slice(0,8))+' '+Math.round(Number(x.quant)/1e6)).join(' | '));}
 // ¿cuántos de los 342 están en terminales (casa/nodo)?
 const bad=Object.entries(rec).filter(([w,r])=>r.ok===false).map(([w])=>w);const tipos={};for(const w of bad){const t=(cl[w]&&cl[w].tipo)||'sin clase';tipos[t]=(tipos[t]||0)+1;}console.log('clases de las 342 sin leer:',JSON.stringify(tipos));
})();
