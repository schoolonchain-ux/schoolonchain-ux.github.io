const fs=require('fs');const OUT='C:/EquipoIA/research/auditoria-adversarial-2026-10-31/tramo4/';
const {rec,term}=JSON.parse(fs.readFileSync(OUT+'tramo4-cache.json','utf8'));const clases=JSON.parse(fs.readFileSync(OUT+'traza-clases.json','utf8'));
const R=JSON.parse(fs.readFileSync(OUT+'tramo4-resultado.json','utf8'));const p=R.pureza;const TS=JSON.parse(fs.readFileSync(OUT+'t4.json','utf8')).t3;
const cl=a=>(term[a]&&term[a].clase)||clases[a];const esC=JSON.parse(fs.readFileSync(OUT+'tramo4-escontrato.json','utf8'));
const neutral=a=>(clases[a]&&['swap','prestamo','puente','usdd'].includes(clases[a].tipo))||esC[a]===true;
for(const w of Object.keys(rec)){for(const k of ['ent','sal','via'])if(rec[w][k])rec[w][k]=rec[w][k].filter(e=>e.at<=TS);}
for(const w of Object.keys(rec))for(const v of rec[w].via||[]){const R2=rec[v.a];if(R2&&R2.ok)R2.ent.push({de:w,v:v.v,at:v.at,virtual:true});}
const f=x=>Math.round(x).toLocaleString('en');const rows=[];let S=0;
for(const w of Object.keys(R.saldo)){const r=rec[w];const pw=p[w]||0;
 const inT=r.ent.filter(e=>!neutral(e.de)).reduce((s,e)=>s+e.v*(p[e.de]||0),0);
 let outSwap=0,outRest=0;for(const e of (r.sal||[])){const c=cl(e.a);if(c&&c.tipo==='swap'&&e.v>=3520)outSwap+=e.v;else outRest+=e.v;}
 const outVia=(r.via||[]).reduce((s,e)=>s+e.v,0);
 const net=r.ent.filter(e=>!e.virtual).reduce((s,e)=>s+e.v,0)-(r.sal||[]).reduce((s,e)=>s+e.v,0);
 const g=inT-pw*(outRest+outVia)-(net>0?net*pw:0);S+=g;rows.push({w:w.slice(0,10),g,pw:+pw.toFixed(2),inT,outSwap,outRest,outVia,net});}
console.log('desajuste total (excluyendo depositos a swaps):',f(S));
rows.sort((a,b)=>b.g-a.g);for(const x of rows.slice(0,15))console.log(x.w,'g',f(x.g).padStart(11),'p',x.pw,'entra_marcado',f(x.inT).padStart(11),'sale_swap',f(x.outSwap).padStart(11),'sale_resto',f(x.outRest).padStart(11),'via',f(x.outVia).padStart(10),'neto',f(x.net).padStart(10));
const pos=rows.filter(x=>x.g>3520);let sp=0;for(const x of pos)sp+=x.g;
console.log('billeteras con desajuste > 3.520 $:',pos.length,'suma',f(sp),'| resto positivo',f(rows.filter(x=>x.g>0&&x.g<=3520).reduce((s,x)=>s+x.g,0)),'| negativo',f(rows.filter(x=>x.g<0).reduce((s,x)=>s+x.g,0)));
const ws=new Set(pos.map(x=>x.w));const cts={};
for(const w of Object.keys(R.saldo)){if(!ws.has(w.slice(0,10)))continue;for(const e of rec[w].sal||[]){const c=cl(e.a);if(c&&c.tipo==='swap'&&e.v>=3520){const o=cts[e.a]||(cts[e.a]={v:0,n:0,nom:c.nombre,w:new Set()});o.v+=e.v;o.n++;o.w.add(w);}}}
for(const [a,x] of Object.entries(cts).sort((a,b)=>b[1].v-a[1].v).slice(0,12))console.log(a.slice(0,10),(x.nom||'').padEnd(22),f(x.v).padStart(12),'n',x.n,'billeteras',x.w.size);
fs.writeFileSync(OUT+'desajuste-billeteras.json',JSON.stringify(pos.map(x=>({w:Object.keys(R.saldo).find(k=>k.startsWith(x.w)),g:x.g}))));
