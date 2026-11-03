'use strict';
// Rutas principales hacia los destinos finales y CSV de todas las aristas terminales.
// Uso: node traza-rutas.cjs [post]   → sin argumento, tramo 1 (desde TSpe5HC3…); con «post», tramo 2 (desde el grupo del 11-oct y TM8uyBjRKz…).
const fs = require('fs');
const OUT = 'C:/EquipoIA/research/binance-0x5227-2026-10-30/tron/'; const PRE = process.argv[2] === 'post' ? 'traza-post' : 'traza';
const { rec } = JSON.parse(fs.readFileSync(OUT + PRE + '-cache.json', 'utf8'));
const R = JSON.parse(fs.readFileSync(OUT + PRE + '-resultado.json', 'utf8')); const p = R.pureza; if (PRE === 'traza-post') Object.assign(p, Object.fromEntries(Object.entries(JSON.parse(fs.readFileSync(OUT + 'traza-resultado.json', 'utf8')).pureza).filter(([k]) => !(k in p))));
const T = JSON.parse(fs.readFileSync(OUT + PRE + '-aristas-terminales.json', 'utf8'));
const clases = JSON.parse(fs.readFileSync(OUT + 'traza-clases.json', 'utf8')); const TSTAR = Date.UTC(2026, 9, 30, 22, 40);
const SEM = new Set(PRE === 'traza' ? ['TSpe5HC3PRD2svJcr1YoGszhHk2mtkyZ8A', 'TG5iBMQPrDzJJAUM8GMVBf1hRaJ1wvzsGi', 'TPBkSjkCMn2ckrMuAP8n2J1jdjbw76bKN4', 'TCzBTkqn66yApqbYoPezaEQosM5DAd7Y62', 'TAk1xJNWuBYvJHLsUiBFLeuK6xvpQUFYP5'] : []);
for (const w of Object.keys(rec)) { if (rec[w].ent) rec[w].ent = rec[w].ent.filter(e => e.at <= TSTAR); if (rec[w].via) rec[w].via = rec[w].via.filter(e => e.at <= TSTAR); }
for (const w of Object.keys(rec)) for (const v of rec[w].via || []) { const r2 = rec[v.a]; if (r2 && r2.ok) r2.ent.push({ de: w, v: v.v, at: v.at, tx: v.tx, sim: v.sim, cant: v.cant, virtual: true }); }
const iso = ms => new Date(ms).toISOString().slice(0, 16).replace('T', ' ');
const neutral = a => clases[a] && ['swap', 'prestamo', 'puente', 'usdd'].includes(clases[a].tipo);
const fuerza = e => e.v * (SEM.has(e.de) ? 1 : (p[e.de] || 0));
function ruta(w) {
  const pasos = []; let cur = w; const visto = new Set();
  for (let i = 0; i < 80 && !visto.has(cur); i++) {
    visto.add(cur); const r = rec[cur]; if (!r || !r.ent) break; if (SEM.has(cur) || r.seed) { pasos.unshift({ w: cur, nivel: 0 }); break; }
    const cand = r.ent.filter(e => !neutral(e.de) && fuerza(e) > 0).sort((a, b) => fuerza(b) - fuerza(a)); const e = cand[0];
    pasos.unshift({ w: cur, nivel: r.nivel, tx: e ? e.tx : null, desde: e ? e.de : null, v: e ? e.v : null, at: e ? e.at : null, virtual: e ? !!e.virtual : false }); if (!e) break; cur = e.de;
  }
  return pasos;
}
const salida = [];
for (const e of T.slice(0, 60)) { const pasos = ruta(e.de); salida.push({ destino: e.a, tipo: e.tipo, nombre: e.nombre, tainted: e.tainted, hashFinal: e.tx, horaFinal: e.at, pasos }); }
fs.writeFileSync(OUT + PRE + '-rutas-principales.json', JSON.stringify(salida, null, 1));
const csv = ['hora_utc;desde;hacia;tipo;nombre;importe_token;token;pureza;importe_robo_usd;nivel;tx'].concat(T.map(e => [iso(e.at), e.de, e.a, e.tipo, e.nombre || '', Math.round(e.cant), e.sim, e.pureza.toFixed(3), Math.round(e.tainted), e.nivel, e.tx].join(';')));
fs.writeFileSync(OUT + PRE + '-aristas-terminales.csv', csv.join('\n'));
const prof = salida.map(s => s.pasos.length); console.log('rutas reconstruidas:', salida.length, '| saltos medios', (prof.reduce((a, b) => a + b, 0) / Math.max(1, prof.length)).toFixed(1), '| máximo', Math.max(...prof), '| aristas terminales en el CSV:', csv.length - 1);
for (const s of salida.slice(0, 4)) { console.log('\n→', s.tipo, s.nombre || s.destino.slice(0, 12), Math.round(s.tainted).toLocaleString('en'), '$ | tx final', s.hashFinal.slice(0, 12)); console.log('   ', s.pasos.map(x => x.w.slice(0, 8) + '(' + x.nivel + (x.virtual ? ',cambio' : '') + ')').join(' → ')); }
