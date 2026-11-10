'use strict';
// Sensibilidad del ajuste de JustLend a la objecion H2 de la 2.a revision: el metodo cuenta como "redimido" cualquier USDT que la receptora
// recibe de JustLend antes del corte, sin exigir que sea POSTERIOR a la llegada de los justificantes. Aqui se mide cuanto cambia si se exige ese orden.
const fs = require('fs'); const j = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const A = 'C:/EquipoIA/research/auditoria-adversarial-2026-10-31/';
const res = {};
for (const [dir, pref] of [['tramo5-v04', 'tramo5'], ['tramo6-v03', 'tramo6']]) {
  const D = A + dir + '/'; const { rec, term } = j(D + pref + '-cache.json'); const clases = j(D + 'traza-clases.json'); const corte = j(D + 't4.json').t3; const AT = j(D + pref + '-aristas-terminales.json');
  const tipo = a => { const c = (term[a] && term[a].clase) || clases[a]; return c ? c.tipo : null; }; const ok = a => !!(rec[a] && rec[a].ok);
  const hops = {}, recibido = {}, primera = {};
  for (const [w, r] of Object.entries(rec)) for (const v of r.via || []) if (v.via === 'jtoken' && v.at <= corte) { (hops[w] = hops[w] || []).push(v); recibido[v.a] = (recibido[v.a] || 0) + v.v; primera[v.a] = Math.min(primera[v.a] ?? Infinity, v.at); }
  const calc = estricto => {
    const red = a => ok(a) ? (rec[a].ent || []).filter(e => !e.virtual && e.at <= corte && tipo(e.de) === 'prestamo' && (!estricto || e.at >= (primera[a] ?? Infinity))).reduce((s, e) => s + e.v, 0) : 0;
    const memo = {}, pila = new Set(); const frac = a => { if (a in memo) return memo[a]; const rc = recibido[a] || 0; if (!(rc > 0) || !ok(a) || pila.has(a)) return 0; pila.add(a); let m = red(a); for (const v of hops[a] || []) m += v.v * frac(v.a); pila.delete(a); return (memo[a] = Math.max(0, Math.min(1, m / rc))); };
    let quitado = 0, sinSeg = 0, prest = 0; const frs = {};
    for (const e of AT) { if (e.tipo !== 'prestamo') continue; const w = e.de; if (!(w in frs)) { const dep = (rec[w].sal || []).filter(x => x.at <= corte && tipo(x.a) === 'prestamo').reduce((s, x) => s + x.v, 0); const hs = hops[w] || []; let seg = 0, no = 0; for (const v of hs) { if (ok(v.a)) seg += v.v * frac(v.a); else no += v.v; } const fS = dep > 0 && hs.length ? Math.min(1, seg / dep) : 0; const fN = dep > 0 && hs.length ? Math.max(0, Math.min(1 - fS, no / dep)) : 0; frs[w] = [fS, fN]; }
      const full = e.cant * e.pureza; quitado += full * frs[w][0]; sinSeg += full * frs[w][1]; prest += full * (1 - frs[w][0] - frs[w][1]); }
    return { quitado, sinSeg, prest };
  };
  const a = calc(false), b = calc(true);
  // redenciones anteriores a la llegada de los justificantes
  let antes = 0, nAntes = 0, total = 0; for (const a2 of Object.keys(recibido)) { if (!ok(a2)) continue; for (const e of rec[a2].ent || []) { if (e.virtual || e.at > corte || tipo(e.de) !== 'prestamo') continue; total += e.v; if (e.at < primera[a2]) { antes += e.v; nAntes++; } } }
  // reenvios de segundo nivel a direcciones no leidas
  let seg2 = 0; for (const w of Object.keys(recibido)) for (const v of hops[w] || []) if (!ok(v.a)) seg2 += v.v;
  res[pref] = { metodoDelInforme: a, exigiendoOrdenTemporal: b, cambioEnLoQuitado: b.quitado - a.quitado, redencionesDeReceptoras: total, redencionesAnterioresALaLlegada: antes, nAnteriores: nAntes, reenviosDeSegundoNivelANoLeidas: seg2 };
}
console.log(JSON.stringify(res, null, 1)); if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(res, null, 1));
