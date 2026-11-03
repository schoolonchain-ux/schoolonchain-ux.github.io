const fs=require('fs');const R='C:/EquipoIA/research/auditoria-adversarial-2026-10-31/';
for(const a of ['TDa5kRYUX3bYGRBrGSDoatjMNKEfcNJb59','TWTzEAWq5ff6YNbgzvpB7jHULdfmZD75F6']){
 for(const t of ['tramo3','tramo4','tramo5','tramo6']){const s=fs.readFileSync(R+t+'/'+t+'-cache.json','utf8');let i=s.indexOf(a),n=0;while(i>=0&&n<2){console.log(t,a.slice(0,8),'…',s.slice(Math.max(0,i-250),i+250).replace(/\s+/g,' '));n++;i=s.indexOf(a,i+500);}}
}
const T=JSON.parse(fs.readFileSync('C:/EquipoIA/research/polytrop-2026-11-03/datos/cuenta-TAT51WDh.json','utf8'));
for(const a of ['TDa5kRYUX3bYGRBrGSDoatjMNKEfcNJb59','TWTzEAWq5ff6YNbgzvpB7jHULdfmZD75F6'])console.log(a.slice(0,8),'pagos a TAT51:',T.trx.filter(x=>x.de===a).map(x=>new Date(x.t).toISOString().slice(5,16)+' '+x.v+' TRX').join(' | '));
