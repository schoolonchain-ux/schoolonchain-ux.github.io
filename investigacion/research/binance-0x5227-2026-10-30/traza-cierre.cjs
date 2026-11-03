'use strict';
// Cierre de cuentas del rastreo: de lo que salió de la billetera de reparto, qué parte está en destinos finales, retenida, en polvo, pendiente de lectura o sin explicar.
const fs = require('fs');
const OUT = 'C:/EquipoIA/research/binance-0x5227-2026-10-30/tron/';
const { rec } = JSON.parse(fs.readFileSync(OUT + 'traza-cache.json', 'utf8'));
const R = JSON.parse(fs.readFileSync(OUT + 'traza-resultado.json', 'utf8')); const p = R.pureza, saldo = R.saldo;
const clases = JSON.parse(fs.readFileSync(OUT + 'traza-clases.json', 'utf8'));
const ALC = new Set(JSON.parse(fs.readFileSync(OUT + 'traza-alcanzadas.json', 'utf8')));
const SEM = new Set(['TSpe5HC3PRD2svJcr1YoGszhHk2mtkyZ8A', 'TG5iBMQPrDzJJAUM8GMVBf1hRaJ1wvzsGi', 'TPBkSjkCMn2ckrMuAP8n2J1jdjbw76bKN4', 'TCzBTkqn66yApqbYoPezaEQosM5DAd7Y62', 'TAk1xJNWuBYvJHLsUiBFLeuK6xvpQUFYP5']);
const DEP = new Set(['TKkH2vH6kyi2QKcMbqym53WMuvdd1xvw6K', 'TL2F4GhnaFVZBZPncHYjwfYZFW44NcfVwj', 'TCBAz7itvtX5CjBzVMPQdrbwQLN63ao1fk', 'TJajtPqDqUGh1Sr1j8ugHoSXBVpaFLLHKT']);
const TSTAR = Date.UTC(2026, 9, 30, 22, 40); for (const w of Object.keys(rec)) { if (rec[w].ent) rec[w].ent = rec[w].ent.filter(e => e.at <= TSTAR); if (rec[w].sal) rec[w].sal = rec[w].sal.filter(e => e.at <= TSTAR); }
const SEGUIR = 3520; const fmt = n => Math.round(n).toLocaleString('en'); const PX = 0.352;
const neutral = a => clases[a] && ['swap', 'prestamo', 'puente', 'usdd'].includes(clases[a].tipo);
const W = Object.keys(rec).filter(w => ALC.has(w) && !SEM.has(w) && !DEP.has(w));
let enTotal = 0, salTotal = 0, ret = 0, polvo = 0, swapOut = 0, swapIn = 0, term = 0, cont = 0, fall = 0, fallMonto = 0, parcial = 0;
const filas = [];
for (const w of W) {
  const r = rec[w]; const pw = p[w] || 0;
  if (!r.ok) { fall++; const ent = (r.ent || []); continue; }
  const tIn = r.ent.filter(e => !neutral(e.de)).reduce((s, e) => s + e.v * (SEM.has(e.de) || DEP.has(e.de) ? 1 : (p[e.de] || 0)), 0);
  let tOut = 0, tTerm = 0, tSwap = 0, tCont = 0, tPolvo = 0;
  for (const e of r.sal) { const c = (clases[e.a]); const t = e.v * pw; if (e.v < SEGUIR) { tPolvo += t; continue; } if (!c) continue; if (c.tipo === 'swap') tSwap += t; else if (c.tipo === 'billetera') tCont += t; else tTerm += t; }
  enTotal += tIn; polvo += tPolvo; swapOut += tSwap; cont += tCont; term += tTerm;
  const s = saldo[w]; if (s && s.neto > 0) ret += s.neto * pw;
}
// lo que va a billeteras con lectura fallida (queda sin resolver)
let haciaFallidas = 0, nFall = 0; const fallidas = new Set(W.filter(w => !rec[w].ok));
for (const w of W) { const r = rec[w]; if (!r.ok) continue; for (const e of r.sal) if (e.v >= SEGUIR && fallidas.has(e.a)) haciaFallidas += e.v * (p[w] || 0); }
for (const w of SEM) { const r = rec[w]; if (!r || !r.ok) continue; for (const e of r.sal) if (e.v >= SEGUIR && fallidas.has(e.a)) haciaFallidas += e.v; }
const reparto = rec['TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki']; const salRep = reparto.sal.filter(e => !SEM.has(e.a) && !DEP.has(e.a));
const out = { reparto: { envios: salRep.length, usd: salRep.reduce((s, e) => s + e.v, 0), sobre3520: salRep.filter(e => e.v >= SEGUIR).length }, polvo, terminales: R.totales, retenido: R.retenidoTainted, haciaFallidas, fallidas: fallidas.size, tIn: enTotal };
console.log('Salió de TRBdWq (todos los envíos ≥ 350 $):', fmt(out.reparto.usd), '$ en', out.reparto.envios, 'envíos (', out.reparto.sobre3520, 'de 10.000 TRX o más )');
console.log('Destinos finales (tainted):', fmt(Object.values(R.totales).reduce((a, b) => a + b, 0)), '| nodos', fmt(R.totales.nodo), '| préstamos', fmt(R.totales.prestamo), '| puentes', fmt(R.totales.puente), '| casas', fmt(R.totales.casa));
console.log('Retenido en billeteras (saldo × pureza):', fmt(R.retenidoTainted), '| polvo (envíos < 10.000 TRX, ponderado):', fmt(polvo), '| hacia billeteras con lectura fallida:', fmt(haciaFallidas), 'en', fallidas.size, 'billeteras');
const explicado = Object.values(R.totales).reduce((a, b) => a + b, 0) + R.retenidoTainted + polvo + haciaFallidas; console.log('Explicado:', fmt(explicado), '$ =', Math.round(explicado / out.reparto.usd * 100) + ' % de lo salido; sin explicar:', fmt(out.reparto.usd - explicado), '$ (cambios, tránsito posterior a la lectura y desajustes)');
fs.writeFileSync(OUT + 'traza-cierre.json', JSON.stringify({ ...out, explicado, sinExplicar: out.reparto.usd - explicado }, null, 1));
