const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs');
const keys = loadTronKeys({ file: 'C:/EquipoIA/tether-blacklist/config.secret.json' });
const C=process.argv[2], desde=Date.UTC(2026,9,31,0,0,0), hasta=Date.UTC(2026,10,2,0,30,0);
const USDT='TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
(async()=>{
 const info=await (await fetch('https://apilist.tronscanapi.com/api/contract?contract='+C,{headers:{'TRON-PRO-API-KEY':keys.tronscanKey}})).json();
 const d=info&&info.data&&info.data[0]||{};console.log('contrato',JSON.stringify({name:d.name,creator:d.creator&&d.creator.address,verify:d.verify_status,balance:d.balance,trxCount:d.trxCount,date:d.date_created,tag:d.tag1||d.addressTag}));
 let url=`https://api.trongrid.io/v1/accounts/${C}/transactions/trc20?contract_address=${USDT}&limit=200&only_confirmed=true&order_by=block_timestamp,asc&min_timestamp=${desde}&max_timestamp=${hasta}`;
 const ent={},sal={};let n=0,pag=0;
 while(url&&pag<60){pag++;let j=null;for(let i=0;i<6&&!j;i++){const r=await fetch(url,{headers:{accept:'application/json','TRON-PRO-API-KEY':keys.tronGridKey}});if(r.status===429){await new Promise(s=>setTimeout(s,3000*(i+1)));continue;}j=await r.json();}
  if(!j)break;for(const t of j.data||[]){n++;const v=Number(t.value)/1e6;if(t.from===C){sal[t.to]=(sal[t.to]||0)+v;}else{ent[t.from]=(ent[t.from]||0)+v;}}
  url=j.meta&&j.meta.links&&j.meta.links.next;await new Promise(s=>setTimeout(s,350));}
 const f=x=>Math.round(x).toLocaleString('en');const tot=o=>Object.values(o).reduce((a,b)=>a+b,0);
 console.log('transferencias USDT',n,'entra',f(tot(ent)),'de',Object.keys(ent).length,'direcciones | sale',f(tot(sal)),'a',Object.keys(sal).length);
 console.log('sale a:',Object.entries(sal).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([a,v])=>a+' '+f(v)).join('\n'));
})();
