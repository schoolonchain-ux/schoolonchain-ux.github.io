const fs=require('fs');const OUT='C:/EquipoIA/research/auditoria-adversarial-2026-10-31/tramo4/';
const {rec,term}=JSON.parse(fs.readFileSync(OUT+'tramo4-cache.json','utf8'));const clases=JSON.parse(fs.readFileSync(OUT+'traza-clases.json','utf8'));
const R=JSON.parse(fs.readFileSync(OUT+'tramo4-resultado.json','utf8'));const p=R.pureza;const TS=JSON.parse(fs.readFileSync(OUT+'t4.json','utf8')).t3;
const cl=a=>(term[a]&&term[a].clase)||clases[a];const esC=JSON.parse(fs.readFileSync(OUT+'tramo4-escontrato.json','utf8'));
const out={},inn={};const f=x=>Math.round(x).toLocaleString('en');
for(const w of Object.keys(R.saldo)){const r=rec[w];const pw=p[w]||0;
 for(const e of r.sal||[]){if(e.at>TS||e.v<3520)continue;const c=cl(e.a);if(c&&c.tipo==='swap'){const o=out[e.a]||(out[e.a]={v:0,vp:0,n:0,nom:c.nombre});o.v+=e.v;o.vp+=e.v*pw;o.n++;}}
 for(const e of r.ent||[]){if(e.at>TS||e.virtual||e.v<3520)continue;const c=cl(e.de);const neu=(c&&['swap','prestamo','puente','usdd'].includes(c.tipo))||esC[e.de]===true;if(neu){const o=inn[e.de]||(inn[e.de]={v:0,n:0,nom:c&&c.nombre});o.v+=e.v;o.n++;}}}
let to=0,ti=0;for(const x of Object.values(out))to+=x.v;for(const x of Object.values(inn))ti+=x.v;
console.log('a contratos swap (bruto >=3520):',f(to),'| entradas >=3520 desde contratos neutros:',f(ti));
const L=Object.entries(out).sort((a,b)=>b[1].vp-a[1].vp).slice(0,14);
for(const [a,x] of L)console.log(a.slice(0,10),(x.nom||'').padEnd(20),'sale',f(x.v).padStart(12),'n',String(x.n).padStart(4),'| vuelve de esa misma dir:',inn[a]?f(inn[a].v):0);
console.log('contratos que devuelven mas:');
for(const [a,x] of Object.entries(inn).sort((a,b)=>b[1].v-a[1].v).slice(0,14))console.log(a.slice(0,10),(x.nom||'').padEnd(20),'entra',f(x.v).padStart(12),'n',x.n);
