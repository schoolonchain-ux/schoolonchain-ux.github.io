const fs=require('fs');const OUT='C:/EquipoIA/research/auditoria-adversarial-2026-10-31/tramo4/';
const {rec,term}=JSON.parse(fs.readFileSync(OUT+'tramo4-cache.json','utf8'));const clases=JSON.parse(fs.readFileSync(OUT+'traza-clases.json','utf8'));
const R=JSON.parse(fs.readFileSync(OUT+'tramo4-resultado.json','utf8'));const p=R.pureza;const TS=JSON.parse(fs.readFileSync(OUT+'t4.json','utf8')).t3;
const cl=a=>(term[a]&&term[a].clase)||clases[a];
let swapIn=0,swapInP=0,viaTot=0,viaP=0,swapNoVia=0,swapNoViaP=0,n=0,nn=0;
for(const w of Object.keys(rec)){const r=rec[w];if(!r.ok)continue;const pw=p[w]??0;const viaTx=new Set((r.via||[]).map(v=>v.tx));
 for(const e of r.sal||[]){if(e.at>TS||e.v<3520)continue;const c=cl(e.a);if(c&&c.tipo==='swap'){swapIn+=e.v;swapInP+=e.v*pw;n++;if(!viaTx.has(e.tx)){swapNoVia+=e.v;swapNoViaP+=e.v*pw;nn++;}}}
 for(const v of r.via||[]){if(v.at>TS)continue;viaTot+=v.v;viaP+=v.v*pw;}}
const f=x=>Math.round(x).toLocaleString('en');
console.log({swapIn:f(swapIn),swapInP:f(swapInP),n,viaTot:f(viaTot),viaP:f(viaP),swapSinSalida:f(swapNoVia),swapSinSalidaP:f(swapNoViaP),nn});
// ejemplos de swap sin via
let k=0;for(const w of Object.keys(rec)){const r=rec[w];if(!r.ok)continue;const viaTx=new Set((r.via||[]).map(v=>v.tx));for(const e of r.sal||[]){if(e.at>TS||e.v<3520)continue;const c=cl(e.a);if(c&&c.tipo==='swap'&&!viaTx.has(e.tx)&&k<8){k++;console.log(w.slice(0,8),e.a.slice(0,8),c.nombre||'',f(e.v),e.sim,e.tx.slice(0,10));}}}
console.log('--- clasificación de swaps sin salida a otra billetera');
const sw=JSON.parse(fs.readFileSync(OUT+'tramo4-swaps.json','utf8'));
const cat={};const add=(k,v,pv)=>{cat[k]=cat[k]||{n:0,v:0,vp:0};cat[k].n++;cat[k].v+=v;cat[k].vp+=pv;};
const ejem={};
for(const w of Object.keys(rec)){const r=rec[w];if(!r.ok)continue;const pw=p[w]??0;const viaTx=new Set((r.via||[]).map(v=>v.tx));
 for(const e of r.sal||[]){if(e.at>TS||e.v<3520)continue;const c=cl(e.a);if(!(c&&c.tipo==='swap')||viaTx.has(e.tx))continue;
  const outs=sw[e.tx];let k;
  if(outs===undefined)k='sin_decodificar';else if(!outs.length)k='decodificado_vacio';
  else{const dest=outs.map(o=>o.a);const propio=dest.includes(w);const aOtraClase=dest.filter(d=>d!==w&&d!==e.a).map(d=>{const cc=cl(d);return cc?cc.tipo:(rec[d]?'billetera_leida':'desconocida');});
   if(dest.every(d=>d===e.a))k='salida_= misma direccion destino (no es swap real o pool)';
   else if(propio)k='salida_vuelve_al_remitente'+(aOtraClase.length?'+otras:'+[...new Set(aOtraClase)].join('/'):'');
   else k='otras:'+[...new Set(aOtraClase)].join('/');}
  add(k,e.v,e.v*pw);ejem[k]=ejem[k]||[w,e.tx,e.a];}}
for(const [k,x] of Object.entries(cat))console.log(k.padEnd(70),x.n,Math.round(x.v).toLocaleString('en'),Math.round(x.vp).toLocaleString('en'));
console.log(ejem);
console.log('--- contratos receptores de swaps sin salida resuelta');
const por={};
for(const w of Object.keys(rec)){const r=rec[w];if(!r.ok)continue;const pw=p[w]??0;const viaTx=new Set((r.via||[]).map(v=>v.tx));
 for(const e of r.sal||[]){if(e.at>TS||e.v<3520)continue;const c=cl(e.a);if(!(c&&c.tipo==='swap')||viaTx.has(e.tx))continue;
  const outs=sw[e.tx]||[];if(outs.some(o=>o.a===w))continue;
  const x=por[e.a]||(por[e.a]={n:0,v:0,nom:c.nombre,senders:new Set(),sim:{}});x.n++;x.v+=e.v*pw;x.senders.add(w);x.sim[e.sim]=(x.sim[e.sim]||0)+1;}}
const L=Object.entries(por).sort((a,b)=>b[1].v-a[1].v);
console.log('contratos distintos',L.length);
for(const [a,x] of L.slice(0,25))console.log(a,(x.nom||'').padEnd(20),String(x.n).padStart(4),Math.round(x.v).toLocaleString('en').padStart(12),'remitentes',x.senders.size,JSON.stringify(x.sim));
