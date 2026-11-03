const fs=require('fs');const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs');const k=loadTronKeys({file:'C:/EquipoIA/tether-blacklist/config.secret.json'});
const HS={accept:'application/json','TRON-PRO-API-KEY':k.tronscanKey};const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const S=async u=>{await sleep(330);const r=await fetch('https://apilist.tronscanapi.com'+u,{headers:HS});return r.json();};
const D='C:/EquipoIA/research/binance-0x5227-2026-10-30/tron/';
const E=fs.readFileSync(D+'traza-post-aristas-terminales.csv','utf8').trim().split(/\r?\n/).slice(1).map(l=>l.split(';')).filter(c=>c[3]==='casa');
const agg={};for(const c of E){const k2=c[1]+'>'+c[2]+'|'+c[4];const x=agg[k2]||(agg[k2]={de:c[1],a:c[2],casa:c[4],n:0,bruto:0,robo:0});x.n++;x.bruto+=c[6]==='TRX'?Number(c[5])*0.352:Number(c[5]);x.robo+=Number(c[8]);}
const top=Object.values(agg).sort((a,b)=>b.robo-a.robo).slice(0,8);
(async()=>{for(const t of top){const c=await S('/api/accountv2?address='+t.de);const d=await S('/api/accountv2?address='+t.a);
 // quién alimenta a este remitente en las últimas transferencias USDT
 const j=await S('/api/token_trc20/transfers?limit=50&start=0&sort=-timestamp&contract_address=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t&relatedAddress='+t.de);const l=j.token_transfers||[];
 const ent=l.filter(x=>x.to_address===t.de),sal=l.filter(x=>x.from_address===t.de);const dest=new Set(sal.map(x=>x.to_address));
 console.log(t.casa.padEnd(18),'envía',t.de,'→',t.a,'| aristas',t.n,'| bruto',Math.round(t.bruto),'| atrib',Math.round(t.robo));
 console.log('    remitente: creada',c.date_created?new Date(c.date_created).toISOString().slice(0,10):'?','ops',c.transactions,'tag',c.addressTag||c.publicTag||c.name||null,'| destino tag',d.addressTag||d.publicTag||d.name||null,'| en sus últimas 50 USDT: entradas',ent.length,'(',[...new Set(ent.map(x=>x.from_address.slice(0,8)))].slice(0,5).join(','),') salidas',sal.length,'a',dest.size,'destinos distintos');}
})();
