'use strict';
// Cierre del tramo 2: referencia = dinero del robo que entra en las semillas (grupo del 11-oct y TM8uy…); se reparte en destinos finales, retenido, polvo y sin explicar. Lista el dinero retenido con saldo vivo.
const fs = require('fs');
const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs');
const keys = loadTronKeys({ file: 'C:/EquipoIA/tether-blacklist/config.secret.json' });
const HG = { accept: 'application/json', 'TRON-PRO-API-KEY': keys.tronGridKey };
const OUT = 'C:/EquipoIA/research/binance-0x5227-2026-10-30/tron/'; const USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const { rec } = JSON.parse(fs.readFileSync(OUT + 'traza-post-cache.json', 'utf8')); const R = JSON.parse(fs.readFileSync(OUT + 'traza-post-resultado.json', 'utf8')); const P0 = JSON.parse(fs.readFileSync(OUT + 'traza-resultado.json', 'utf8')).pureza; const p = R.pureza;
const clases = JSON.parse(fs.readFileSync(OUT + 'traza-clases.json', 'utf8')); const esC = JSON.parse(fs.readFileSync(OUT + 'traza-escontrato.json', 'utf8')); const TSTAR = Date.UTC(2026, 9, 30, 22, 40);
const fmt = n => Math.round(n).toLocaleString('en'); const iso = ms => new Date(ms).toISOString().slice(5, 16).replace('T', ' ');
const neutral = a => (clases[a] && ['swap', 'prestamo', 'puente', 'usdd'].includes(clases[a].tipo)) || esC[a] === true;
const pe = a => (a in p ? p[a] : (P0[a] || 0));
// referencia: lo que entra en las semillas desde billeteras del tramo 1 (no desde otras semillas ni desde contratos)
let ref = 0; const porSemilla = {};
for (const w of Object.keys(rec).filter(w => rec[w].seed)) { const t = rec[w].ent.filter(e => e.at <= TSTAR && !neutral(e.de) && !(rec[e.de] && rec[e.de].seed) && (e.de in P0)).reduce((s, e) => s + e.v * P0[e.de], 0); porSemilla[w] = t; ref += t; }
console.log('entra en las semillas desde el tramo 1:', fmt(ref), '$ | por semilla:', Object.entries(porSemilla).map(([k, v]) => k.slice(0, 8) + ' ' + fmt(v)).join(' ; '));
const t = R.totales; const term = Object.values(t).reduce((a, b) => a + b, 0);
console.log('destinos finales:', fmt(term), '| casas', fmt(t.casa), '| nodos', fmt(t.nodo), '| préstamos', fmt(t.prestamo), '| puentes', fmt(t.puente), '| USDD', fmt(t.usdd));
console.log('retenido (foto):', fmt(R.retenidoTainted), '| polvo:', fmt(R.polvo || 0), '| explicado / referencia:', Math.round((term + R.retenidoTainted + (R.polvo || 0)) / ref * 100) + ' %');
const filas = Object.entries(R.saldo).map(([w, s]) => ({ w, neto: s.neto, p: p[w] || 0, ret: Math.max(0, s.neto) * (p[w] || 0), seed: !!(rec[w] && rec[w].seed), nivel: rec[w] ? rec[w].nivel : null })).filter(f => f.ret > 0).sort((a, b) => b.ret - a.ret);
console.log('\nmayores retenidos (foto):'); (async () => {
  for (const f of filas.slice(0, 12)) { const j = await (await fetch('https://api.trongrid.io/v1/accounts/' + f.w, { headers: HG })).json(); const d = (j.data || [])[0] || {}; f.ahora = Number(d.balance || 0) / 1e6 * 0.352 + Number(((d.trc20 || []).map(o => o[USDT]).find(Boolean)) || 0) / 1e6; await new Promise(r => setTimeout(r, 200)); console.log(' ', f.w, f.seed ? '[semilla]' : '', 'nivel', f.nivel, '| foto', fmt(f.ret), '$ | pureza', f.p.toFixed(2), '| saldo vivo ahora', fmt(f.ahora), '$'); }
  const sumaSemillas = filas.filter(f => f.seed).reduce((s, f) => s + f.ret, 0); console.log('retenido en las semillas (foto):', fmt(sumaSemillas), '$ | fuera de ellas:', fmt(R.retenidoTainted - sumaSemillas), '$');
  fs.writeFileSync(OUT + 'traza-post-cierre.json', JSON.stringify({ ref, porSemilla, term, retenido: R.retenidoTainted, polvo: R.polvo || 0, top: filas.slice(0, 12) }, null, 1));
})();
