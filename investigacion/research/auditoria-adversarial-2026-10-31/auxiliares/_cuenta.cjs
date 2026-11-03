const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs');
const keys = loadTronKeys({ file: 'C:/EquipoIA/tether-blacklist/config.secret.json' });
const C=process.argv[2], desde=Date.UTC(2026,9,31,0,0,0), hasta=Date.UTC(2026,10,2,0,30,0);const USDT='TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
(async()=>{
 const a=await (await fetch('https://apilist.tronscanapi.com/api/accountv2?address='+C,{headers:{'TRON-PRO-API-KEY':keys.tronscanKey}})).json();
 console.log('cuenta',JSON.stringify({tag:a.publicTag||a.addressTag,nombre:a.name,txs:a.transactions,creada:a.date_created&&new Date(a.date_created).toISOString().slice(0,10),contrato:a.accountType,bandera:a.blueTag||a.greyTag||a.redTag,trx:a.balance&&a.balance/1e6}));
 let url=`https://api.trongrid.io/v1/accounts/${C}/transactions/trc20?contract_address=${USDT}&limit=200&only_confirmed=true&order_by=block_timestamp,asc&min_timestamp=${desde}&max_timestamp=${hasta}`;
 const ent={},sal={};let n=0,pag=0;
 while(url&&pag<80){pag++;let j=null;for(let i=0;i<6&&!j;i++){const r=await fetch(url,{headers:{accept:'application/json','TRON-PRO-API-KEY':keys.tronGridKey}});if(r.status===429){await new Promise(s=>setTimeout(s,3000*(i+1)));continue;}j=await r.json();}
  if(!j)break;for(const t of j.data||[]){n++;const v=Number(t.value)/1e6;if(!(v<1e12))continue;if(t.from===C){sal[t.to]=(sal[t.to]||0)+v;}else{ent[t.from]=(ent[t.from]||0)+v;}}
  url=j.meta&&j.meta.links&&j.meta.links.next;await new Promise(s=>setTimeout(s,350));}
 const f=x=>Math.round(x).toLocaleString('en');const tot=o=>Object.values(o).reduce((a,b)=>a+b,0);
 console.log('transferencias USDT',n,'entra',f(tot(ent)),'sale',f(tot(sal)),'a',Object.keys(sal).length,'direcciones');
 console.log('sale a:\n'+Object.entries(sal).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([a,v])=>a+' '+f(v)).join('\n'));
 console.log('entra de:\n'+Object.entries(ent).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([a,v])=>a+' '+f(v)).join('\n'));
})();
