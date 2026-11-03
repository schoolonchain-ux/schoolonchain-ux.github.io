const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs');
const keys = loadTronKeys({ file: 'C:/EquipoIA/tether-blacklist/config.secret.json' });
const W='TNhpfKq83wufEKGjBhQFnT7jnxYmyBzH6F', WTRX='THpxp8RpCUGk55dV7oL1LfxDeP9QvouxmM';
(async()=>{
 let url=`https://api.trongrid.io/v1/accounts/${W}/transactions/trc20?contract_address=${WTRX}&limit=200&only_confirmed=true&order_by=block_timestamp,asc&min_timestamp=${Date.UTC(2026,9,31,0,0,0)}`;
 const rows=[];let pages=0;
 while(url&&pages<30){pages++;let j=null;for(let i=0;i<6&&!j;i++){const r=await fetch(url,{headers:{accept:'application/json','TRON-PRO-API-KEY':keys.tronGridKey}});if(r.status===429){await new Promise(s=>setTimeout(s,3000*(i+1)));continue;}j=await r.json();}
  if(!j)break;rows.push(...(j.data||[]));url=j.meta&&j.meta.links&&j.meta.links.next;await new Promise(s=>setTimeout(s,400));}
 console.log('transferencias',rows.length);for(const t of rows.filter(t=>t.from===W).slice(0,3).concat(rows.filter(t=>t.from===W).slice(-2)))console.log(t.transaction_id,new Date(t.block_timestamp).toISOString());
 const por={};for(const t of rows){const dir=t.from===W?'sale':'entra';const otro=dir==='sale'?t.to:t.from;const v=Number(t.value)/1e6*0.352;const k=dir+' '+otro;por[k]=por[k]||{n:0,v:0,primera:t.block_timestamp,ultima:t.block_timestamp};por[k].n++;por[k].v+=v;por[k].ultima=t.block_timestamp;}
 console.log(Object.entries(por).sort((a,b)=>b[1].v-a[1].v).slice(0,15).map(([k,x])=>k+' n='+x.n+' $'+Math.round(x.v).toLocaleString('en')+' '+new Date(x.primera).toISOString().slice(5,16)+'→'+new Date(x.ultima).toISOString().slice(5,16)).join('\n'));
})();
