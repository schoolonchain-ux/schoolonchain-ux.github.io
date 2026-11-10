'use strict';
// Vuelca lo que calcula la página (assets/mercado-calc.js) para cada activo de data/mercado.json, para contrastarlo con numpy (contraste-mercado.py).
// Uso: node tools/contraste-mercado.cjs data/mercado.json volcado.json
const fs = require('node:fs'); const M = require('../assets/mercado-calc.js');
const D = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); const btc = D.activos[0].c; const out = {};
for (const a of D.activos) { const c = a.c; const o = {}; for (const n of [7, 30, 90]) { o['vol' + n] = M.vol(c, n); o['rend' + n] = M.rend(c, n); } o.percentil30 = M.percentil(M.serieVol(c, 30)); o.corr30 = M.corr(c, btc, 30); o.corr90 = M.corr(c, btc, 90); o.corr30previa = M.corr(c, btc, 30, 30); o.beta90 = M.beta(c, btc, 90); out[a.s] = o; }
// entrega 1: rendimiento a un año, mediana de cada sector de la cesta (con cierres, sin precio en vivo) y cambios de dinero depositado y stablecoins por cadena
for (const a of D.activos) out[a.s].rend365 = M.rend(a.c, 365);
const porS = new Map(D.activos.map((a) => [a.s, a])); const PLAZOS = [1, 7, 30, 90, 365];
out.__sectores = {}; for (const x of D.sectoresCesta || []) { if (!x.miembros) continue; const o = {}; for (const n of [7, 30, 90, 365]) { const g = M.grupo(x.miembros.map((q) => M.rend(porS.get(q).c, n)), 3); o['m' + n] = g ? g.mediana : null; o['n' + n] = g ? g.n : null; o['s' + n] = g ? g.suben : null; } o.camino30 = M.caminoGrupo(x.miembros.map((q) => porS.get(q).c), 30, 3); out.__sectores[x.id] = o; }
out.__redes = {}; for (const r of (D.redes && D.redes.filas) || []) { const o = {}; for (const k of ['tvl', 'st']) if (r[k]) for (const n of PLAZOS) o[k + n] = M.cambio(r[k], n); out.__redes[r.nombre] = o; }
// entrega 2: máximo de un año y de toda la serie, y volatilidad esperada (Deribit) frente a la realizada de BTC y ETH
for (const a of D.activos) for (const n of [365, D.dias.length]) { const m = M.maximo(a.c, n); const k = n === 365 ? 'max365' : 'maxTodo'; out[a.s][k + 'valor'] = m ? m.valor : null; out[a.s][k + 'hace'] = m ? m.hace : null; out[a.s][k + 'caida'] = m ? m.caida : null; }
out.__esperada = {}; for (const x of (D.esperada && D.esperada.filas) || []) { if (!x.v) continue; const a = porS.get(x.s); if (!a) continue; const sv = M.serieVol(a.c, 30); const e = M.esperadaFrenteAReal(x.v, sv, 30); const u = M.ultimo(x.v);
  out.__esperada[x.s] = { hoy: u < 0 ? null : x.v[u], percentil: M.percentil(x.v), dif: u < 0 || M.vol(a.c, 30) == null ? null : x.v[u] - M.vol(a.c, 30), n: e ? e.n : null, mas: e ? e.mas : null, medianaDif: e ? e.medianaDif : null, ultEsperada: e ? e.ultimo.esperada : null, ultOcurrida: e ? e.ultimo.ocurrida : null }; }
fs.writeFileSync(process.argv[3], JSON.stringify(out)); console.log('volcado de ' + D.activos.length + ' activos');
