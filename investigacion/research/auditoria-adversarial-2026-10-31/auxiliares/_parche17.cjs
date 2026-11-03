const fs=require('fs');const f='C:/EquipoIA/research/auditoria-adversarial-2026-10-31/armar-entregables.cjs';let s=fs.readFileSync(f,'utf8');const e=[];
const r=(a,b)=>{const n=s.split(a).length-1;if(n!==1){e.push(n+' '+a.slice(0,70));return}s=s.replace(a,()=>b)};
r(".larga td:last-child{min-width:420px;white-space:pre-wrap;word-break:break-word}", ".larga td.t{min-width:460px;max-width:620px;white-space:pre-wrap;word-break:break-word}");
r("return '<td>' + (esCod(c) && v ? '<code>' + esc(v) + '</code>' : esc(v)) + '</td>';", "return '<td' + (/^Texto/.test(c) ? ' class=\"t\"' : '') + '>' + (esCod(c) && v ? '<code>' + esc(v) + '</code>' : esc(v)) + '</td>';");
r("['Hora (UTC)', 'Cadena', 'Categoría', 'Remitente (completa)', 'Destinatario (completa)', 'Destinatario (papel)', 'Hash', 'Texto del mensaje']", "['Hora (UTC)', 'Cadena', 'Categoría', 'Texto del mensaje', 'Remitente (completa)', 'Destinatario (papel)', 'Destinatario (completa)', 'Hash']");
fs.writeFileSync(f,s);console.log(e.length?e.join('\n'):'ok');
