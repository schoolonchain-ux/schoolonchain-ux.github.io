'use strict';
// Tercera variante de la segunda vía (3-nov): PUREZA=ciclo. Solo diluye lo que entra de un contrato neutro EN EXCESO de lo que la propia billetera le mandó (ida y vuelta legítima no diluye), y además descuenta lo enlazado por «via».
//   por contrato c: exceso_c = max(0, Σ entradas brutas de c − Σ salidas de la billetera hacia c); sinEnlace = max(0, Σ_c exceso_c − Σ entradas enlazadas por «via»).
const fs = require('fs'); const D = 'C:/EquipoIA/research/auditoria-adversarial-2026-10-31/';
function parchear(f) {
  let s = fs.readFileSync(D + f, 'utf8'); const rep = (a, b) => { if (!s.includes(a) || s.split(a).length !== 2) throw new Error(f + ': no (único): ' + a.slice(0, 80)); s = s.replace(a, b); };
  rep("const den = w => totIn[w] + (MODO === 'diluida' ? sinEnlace[w] : 0);",
    "if (MODO === 'ciclo') { for (const w of W) { const ent = new Map(), sal = new Map(); for (const e of rec[w].ent) if (!e.virtual && neutral(e.de)) ent.set(e.de, (ent.get(e.de) || 0) + e.v); for (const e of rec[w].sal || []) sal.set(e.a, (sal.get(e.a) || 0) + e.v); let exceso = 0; for (const [c, v] of ent) exceso += Math.max(0, v - (sal.get(c) || 0)); const enlazado = rec[w].ent.filter(e => e.virtual).reduce((s2, e) => s2 + e.v, 0); sinEnlace[w] = Math.max(0, exceso - enlazado); } }\n" +
    "  const den = w => totIn[w] + (MODO !== 'actual' ? sinEnlace[w] : 0);");
  rep("...(MODO === 'diluida' ? { sinEnlace } : {})", "...(MODO !== 'actual' ? { sinEnlace } : {})");
  fs.writeFileSync(D + f, s); console.log(f, 'parcheado (ciclo)');
}
parchear('analisis-tramo5.cjs'); parchear('analisis-tramo6.cjs');
