const fs=require('fs');const D='C:/EquipoIA/research/binance-0x5227-2026-10-30/tron/';
const leer=(f,t)=>fs.readFileSync(D+f,'utf8').replace(/^\uFEFF/,'').trim().split(/\r?\n/).slice(1).map(l=>{const c=l.split(';');return{t,hora:c[0],de:c[1],a:c[2],tipo:c[3],nombre:c[4],imp:Number(c[5]),tok:c[6],pur:Number(c[7]),robo:Number(c[8]),tx:c[10]}});
const A=leer('traza-aristas-terminales.csv',1),B=leer('traza-post-aristas-terminales.csv',2);
const k=e=>[e.tx,e.de,e.a,e.tok,e.imp].join('|');
const mA=new Map(A.map(e=>[k(e),e])),rep=B.filter(e=>mA.has(k(e)));
const por={};for(const e of rep){por[e.tipo]=(por[e.tipo]||0)+1;}
console.log('aristas tramo1',A.length,'tramo2',B.length,'| repetidas en ambos:',rep.length,JSON.stringify(por));
const pr=rep.filter(e=>e.tipo==='prestamo');for(const e of pr)console.log('  préstamo repetido',e.tx,e.imp,'robo t1',mA.get(k(e)).robo,'robo t2',e.robo);
const pu=rep.filter(e=>e.tipo==='puente');console.log('  puentes repetidos',pu.length,'bruto',Math.round(pu.reduce((s,e)=>s+e.imp,0)),'atrib t1',Math.round(pu.reduce((s,e)=>s+mA.get(k(e)).robo,0)),'atrib t2',Math.round(pu.reduce((s,e)=>s+e.robo,0)));
const c=B.filter(e=>e.tipo==='casa'&&e.pur>=0.8);console.log('casas con pureza>=0.8:',c.map(e=>e.nombre+' '+e.imp+' '+e.pur+' '+e.de.slice(0,10)+' '+e.tx.slice(0,10)).join(' ; '));
const ca=JSON.parse(fs.readFileSync(D+'traza-cache.json','utf8')).rec,cb=JSON.parse(fs.readFileSync(D+'traza-post-cache.json','utf8')).rec;
const fa=Object.keys(ca).filter(w=>ca[w].ok===false),fb=new Set(Object.keys(cb).filter(w=>cb[w].ok===false));console.log('sin leer únicas:',new Set([...fa,...fb]).size,'intersección',fa.filter(w=>fb.has(w)));
const h=JSON.parse(fs.readFileSync('resultados/hueco-aristas.json','utf8'));const arr=Array.isArray(h)?h:(h.aristas||h.filas||Object.values(h));console.log('hueco: tipo',Array.isArray(h)?'lista':Object.keys(h).join(','),'n',arr.length);
const salTx=new Set();for(const w of Object.keys(ca))for(const s of (ca[w].sal||[]))salTx.add(s.tx);let ya=0,yaV=0,tot=0;for(const x of arr){if(!x||!x.tx)continue;tot+=x.v||0;if(salTx.has(x.tx)){ya++;yaV+=x.v||0;}}console.log('  del hueco ya presentes en cache.sal:',ya,Math.round(yaV),'de',arr.length,'bruto total',Math.round(tot));
