const fs=require('fs');const OUT='C:/EquipoIA/research/auditoria-adversarial-2026-10-31/tramo4/';
const {rec,term}=JSON.parse(fs.readFileSync(OUT+'tramo4-cache.json','utf8'));const clases=JSON.parse(fs.readFileSync(OUT+'traza-clases.json','utf8'));
const R=JSON.parse(fs.readFileSync(OUT+'tramo4-resultado.json','utf8'));const p=R.pureza;
const TS=JSON.parse(fs.readFileSync(OUT+'t4.json','utf8')).t3;const SEM='TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki';
const SEG=3520;const cat={};const add=(k,v)=>cat[k]=(cat[k]||0)+v;
for(const w of Object.keys(rec)){if(!rec[w].ok)continue;const pw=p[w]??0;for(const e of (rec[w].sal||[]).concat(rec[w].via||[])){if(e.at>TS)continue;if(e.a===SEM){add('vuelve_a_semilla',e.v*pw);continue;}if(e.v<SEG){add('polvo',e.v*pw);continue;}const c=(term[e.a]&&term[e.a].clase)||clases[e.a];if(!c){add('SIN_CLASE',e.v*pw);continue;}add(c.tipo,e.v*pw);}}
console.log(cat);
// wallets con p>0 que tienen entradas pero cuyo neto es negativo (sacan mas de lo que entra segun lectura)
let neg=0,negN=0;for(const w of Object.keys(R.saldo)){if(R.saldo[w].neto<0){neg+=R.saldo[w].neto*(p[w]||0);negN++;}}console.log('neto negativo x pureza',Math.round(neg),'en',negN);
// pureza media ponderada
let nsem=0;for(const w of Object.keys(rec)){ if(!rec[w].ok) continue; }
// cuantas billeteras con pureza<1 y su entrada
let lo=0,loIn=0;for(const w of Object.keys(R.saldo)){const r=rec[w];const ins=r.ent.filter(e=>!e.virtual).reduce((s,e)=>s+e.v,0);if((p[w]||0)<0.999){lo++;loIn+=ins*(1-(p[w]||0));}}console.log('purezas <1:',lo,'dinero no marcado',Math.round(loIn));
// --- balance por billetera
const esC=JSON.parse(fs.readFileSync(OUT+'tramo4-escontrato.json','utf8'));
const neutral=a=>(clases[a]&&['swap','prestamo','puente','usdd'].includes(clases[a].tipo))||esC[a]===true;
for(const w of Object.keys(rec)){if(rec[w].ent)rec[w].ent=rec[w].ent.filter(e=>e.at<=TS);if(rec[w].sal)rec[w].sal=rec[w].sal.filter(e=>e.at<=TS);if(rec[w].via)rec[w].via=rec[w].via.filter(e=>e.at<=TS);}
for(const w of Object.keys(rec))for(const v of rec[w].via||[]){const R2=rec[v.a];if(R2&&R2.ok)R2.ent.push({de:w,v:v.v,at:v.at,virtual:true});}
let S=0,Sneg=0,Spos=0;const rows=[];
for(const w of Object.keys(R.saldo)){const r=rec[w];const pw=p[w]||0;
 const inN=r.ent.filter(e=>!neutral(e.de));const inT=inN.reduce((s,e)=>s+e.v*(p[e.de]||0),0);
 const inNeutral=r.ent.filter(e=>neutral(e.de)).reduce((s,e)=>s+e.v,0);
 const out=(r.sal||[]).concat(r.via||[]).reduce((s,e)=>s+e.v,0);
 const net=r.ent.filter(e=>!e.virtual).reduce((s,e)=>s+e.v,0)-(r.sal||[]).reduce((s,e)=>s+e.v,0);
 const g=inT-pw*out-(net>0?net*pw:0); S+=g; if(g<0)Sneg+=g;else Spos+=g; rows.push({w,g,pw,inT,out,inNeutral,net,nivel:r.nivel});}
console.log('suma desajuste (entra marcado - sale - retenido)',Math.round(S),'positivo',Math.round(Spos),'negativo',Math.round(Sneg));
rows.sort((a,b)=>b.g-a.g);console.log(rows.slice(0,15).map(x=>({...x,g:Math.round(x.g),inT:Math.round(x.inT),out:Math.round(x.out),inNeutral:Math.round(x.inNeutral),net:Math.round(x.net),pw:+x.pw.toFixed(3)})));
