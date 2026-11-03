const fs=require('fs');const D='C:/EquipoIA/research/polytrop-2026-11-03/datos/';const R='C:/EquipoIA/research/auditoria-adversarial-2026-10-31/';
const F=JSON.parse(fs.readFileSync(D+'financiadora-gas.json','utf8'));const csv=fs.readFileSync(D+'polytrop-binance-hack-addresses.csv','utf8');
const K=new Set();for(const t of ['tramo3','tramo4','tramo5','tramo6']){const c=JSON.parse(fs.readFileSync(R+t+'/'+t+'-cache.json','utf8'));for(const s of ['rec','term'])for(const a of Object.keys(c[s]||{}))K.add(a);}
const rastr=F.receptoras.filter(x=>K.has(x.a));console.log('receptoras de TRX',F.receptoras.length,'| RASTREADAS por nosotros (rec/term):',rastr.length,'| solo mencionadas:',F.receptoras.filter(x=>x.nuestra&&!K.has(x.a)).length);
const pol=F.receptoras.filter(x=>x.polytrop);console.log('en Polytrop',pol.length,'| rastreadas y en Polytrop',pol.filter(x=>K.has(x.a)).length);
// línea base: ¿qué proporción de direcciones TRON "al azar con actividad esos días" estarían rastreadas? tamaño del conjunto
console.log('direcciones rastreadas en total (rec+term):',K.size);
const imp={};for(const x of rastr){const k=Math.round(x.trx/x.n);imp[k]=(imp[k]||0)+1;}console.log('importe medio por envío de las rastreadas:',JSON.stringify(Object.entries(imp).sort((a,b)=>b[1]-a[1]).slice(0,5)));
const imp2={};for(const x of F.receptoras.filter(x=>!K.has(x.a))){const k=Math.round(x.trx/x.n);imp2[k]=(imp2[k]||0)+1;}console.log('importe medio por envío de las NO rastreadas:',JSON.stringify(Object.entries(imp2).sort((a,b)=>b[1]-a[1]).slice(0,8)));
const fx=a=>new Date(a).toISOString().slice(5,16);const h=F.receptoras.filter(x=>K.has(x.a)).map(x=>x.primero).sort();console.log('rastreadas: primer envío entre',fx(h[0]),'y',fx(h[h.length-1]));
