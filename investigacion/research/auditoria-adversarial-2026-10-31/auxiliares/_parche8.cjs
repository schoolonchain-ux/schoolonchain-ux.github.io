const fs=require('fs');const f='C:/EquipoIA/research/auditoria-adversarial-2026-10-31/armar-entregables.cjs';let s=fs.readFileSync(f,'utf8');
const a="fm(T3.totales.casa) + ' (FixedFloat)";const b="fe(T3.totales.casa) + ' $ (FixedFloat)";
if(s.split(a).length!==2)throw new Error('a');s=s.replace(a,()=>b);
const c="{ const nombres = ['0-mapa-general'";
if(s.split(c).length!==2)throw new Error('c');
s=s.replace(c,()=>"rep('Último envío de TRBdWq… incluido: 352 envíos, 58,5 M$ desde la foto', 'Último envío de TRBdWq… incluido: 353 envíos, 58,7 M$ desde la foto [Revisión: el original decía 352 envíos y 58,5 M$]');\n"+c);
fs.writeFileSync(f,s);console.log('ok');
