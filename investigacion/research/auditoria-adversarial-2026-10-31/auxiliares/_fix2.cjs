const fs=require('fs');const f='analisis-tramo4.cjs';let s=fs.readFileSync(f,'utf8');
const a="if (viaTx.has(e.tx)) continue; const outs = swC[e.tx];";
if(s.split(a).length!==2)throw new Error('ancla');
s=s.replace(a,"if (viaTx.has(e.tx)) continue; if (RET_CONTRATOS.includes(e.a) && (r.via || []).some(v => v.via === 'retirada')) continue; /* sus retiradas ya se leyeron (completar-retiradas.cjs) */ const outs = swC[e.tx];");
const b="  const swC = (() =>";
s=s.replace(b,"  const RET_CONTRATOS = (() => { try { return JSON.parse(fs.readFileSync(OUT + 'retiradas-informe.json', 'utf8')).contratos; } catch { return []; } })();\n"+b);
fs.writeFileSync(f,s);
