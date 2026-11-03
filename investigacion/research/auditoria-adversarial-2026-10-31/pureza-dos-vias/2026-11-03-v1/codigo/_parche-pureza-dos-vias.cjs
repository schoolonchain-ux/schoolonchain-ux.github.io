'use strict';
// Añade a analisis-tramo5.cjs y analisis-tramo6.cjs una SEGUNDA VÍA de pureza que corre en paralelo a la actual (3-nov, a petición del propietario: «mantén las dos vías de pureza de forma paralela»).
//  · PUREZA=actual   (por defecto): idéntica a la de siempre; escribe tramoN-resultado.json y tramoN-aristas-terminales.json.
//  · PUREZA=diluida: lo que entra de contratos «neutros» y NO está enlazado con salidas nuestras diluye la pureza (entra en el denominador); escribe tramoN-resultado.diluida.json y tramoN-aristas-terminales.diluida.json.
//    «Sin enlace» = max(0, Σ entradas brutas de contratos neutros − Σ entradas enlazadas por «via»), por billetera y por importe (el hash casi nunca coincide: 19 de 1.150 cambios).
const fs = require('fs'); const D = 'C:/EquipoIA/research/auditoria-adversarial-2026-10-31/';
function parchear(f, n) {
  let s = fs.readFileSync(D + f, 'utf8'); const t = 'tramo' + n;
  const rep = (a, b, opcional) => { if (!s.includes(a)) { if (opcional) return; throw new Error(f + ': no encontrado: ' + a.slice(0, 80)); } if (s.split(a).length !== 2) throw new Error(f + ': aparece más de una vez: ' + a.slice(0, 80)); s = s.replace(a, b); };
  if (n === 5) {
    rep("const OUT = 'C:/EquipoIA/research/auditoria-adversarial-2026-10-31/tramo5/';", "const OUT = process.env.TRAMO_DIR || 'C:/EquipoIA/research/auditoria-adversarial-2026-10-31/tramo5-v03/';   // TRAMO_DIR: carpeta congelada donde leer y escribir");
    rep('for (let it = 0; it < 60; it++) {', 'let convergio = false; for (let it = 0; it < (+process.env.VUELTAS || 2000); it++) {');
    rep("console.log('pureza convergida en', it + 1, 'vueltas'); break; } }", "console.log('pureza convergida en', it + 1, 'vueltas'); convergio = true; break; } } if (!convergio) console.log('AVISO: la pureza NO convergió; el resultado no es fiable');");
  }
  rep("const totIn = {}; for (const w of W) { totIn[w] = rec[w].ent.filter(e => !neutral(e.de)).reduce((s, e) => s + e.v, 0); }",
    "const totIn = {}; for (const w of W) { totIn[w] = rec[w].ent.filter(e => !neutral(e.de)).reduce((s, e) => s + e.v, 0); }\n" +
    "  const MODO = process.env.PUREZA || 'actual', SUF = MODO === 'actual' ? '' : '.' + MODO; console.log('método de pureza:', MODO);   // dos vías en paralelo: «actual» (la publicada) y «diluida» (ver _parche-pureza-dos-vias.cjs)\n" +
    "  const sinEnlace = {}; for (const w of W) { const bruto = rec[w].ent.filter(e => !e.virtual && neutral(e.de)).reduce((s, e) => s + e.v, 0), enlazado = rec[w].ent.filter(e => e.virtual).reduce((s, e) => s + e.v, 0); sinEnlace[w] = Math.max(0, bruto - enlazado); }\n" +
    "  const den = w => totIn[w] + (MODO === 'diluida' ? sinEnlace[w] : 0);");
  rep('const nuevo = totIn[w] > 0 ? Math.min(1, t / totIn[w]) : 0;', 'const nuevo = den(w) > 0 ? Math.min(1, t / den(w)) : 0;');
  rep("fs.writeFileSync(OUT + '" + t + "-resultado.json', JSON.stringify({ ...R, pureza: p, saldo }, null, 1));", "fs.writeFileSync(OUT + '" + t + "-resultado' + SUF + '.json', JSON.stringify({ ...R, metodoPureza: MODO, pureza: p, saldo, ...(MODO === 'diluida' ? { sinEnlace } : {}) }, null, 1));");
  rep("fs.writeFileSync(OUT + '" + t + "-aristas-terminales.json',", "fs.writeFileSync(OUT + '" + t + "-aristas-terminales' + SUF + '.json',");
  fs.writeFileSync(D + f, s); console.log(f, 'parcheado');
}
parchear('analisis-tramo5.cjs', 5); parchear('analisis-tramo6.cjs', 6);
