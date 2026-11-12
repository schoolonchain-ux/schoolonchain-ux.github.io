'use strict';
// CURVAS DE LIQUIDEZ DE SALIDA (sin red). A partir del estado leído (estado.json) y de la lista de mercados (mercados.json), calcula para cada token cuánto cuesta VENDER un
// importe de dólares por USDT en SUNSwap (V1–V4): comisión + deslizamiento, repartiendo la venta entre los mercados donde sale mejor, por dos rutas:
//   · directa: token → USDT en los mercados token/USDT; · dos saltos: token → TRX/WTRX → USDT (la segunda pata en los mercados WTRX/TRX–USDT; WTRX y TRX se tratan como 1:1).
// El motor es el de la investigación (motor.cjs, enteros BigInt exactos). Una venta «cabe» solo si algún mercado absorbe toda la cantidad dentro de la ventana de ticks leída.
const M = require('./motor.cjs');
const USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', WTRX = 'TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR', TRX = 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb';
const esTRX = a => a === WTRX || a === TRX;
const pot = d => 10n ** BigInt(d);
const aBig = (x, dec) => { if (!(x > 0) || !isFinite(x)) return 0n; const e = x * Math.pow(10, dec); if (e < 9e15) return BigInt(Math.floor(e)); const [mant, ex] = x.toExponential(15).split('e'); const dig = BigInt(mant.replace('.', '')); const exp = Number(ex) - 15 + dec; return exp >= 0 ? dig * 10n ** BigInt(exp) : dig / 10n ** BigInt(-exp); };
// --- mercado simulable a partir de la lectura ---
function construir(m, est) {
  const o = { m, dec0: m.dec0, dec1: m.dec1, tipo: m.version === 'V1' || m.version === 'V2' ? 'CP' : 'CL', cache: new Map() };
  if (m.version === 'V1') { const f = est.v1[m.id]; if (!f) return null; o.motor = new M.ProductoConstante({ version: 'V1', r0: f.trx, r1: f.token }); o.r0 = BigInt(f.trx); o.r1 = BigInt(f.token); }
  else if (m.version === 'V2') { const f = est.v2[m.id]; if (!f) return null; o.motor = new M.ProductoConstante({ version: 'V2', r0: f.r0, r1: f.r1 }); o.r0 = BigInt(f.r0); o.r1 = BigInt(f.r1); }
  else {
    const f = est.cl[m.id]; if (!f) return null; o.f = f; const base = { version: m.version, tickSpacing: m.tickSpacing, sqrtP: f.sqrtP, tick: f.tick, L: f.L, ticks: f.ticks, palabras: f.palabras, mapaCompleto: false };
    if (m.version === 'V3') { const fee = f.feeLeido != null ? f.feeLeido : m.feePpm; o.feeZ = o.feeNoZ = BigInt(fee); o.motor = new M.PoolCL({ ...base, feePips: fee }); }
    else { const pf = BigInt(f.protocolFee || 0), lp = BigInt(f.lpFee); const calc = p => p === 0n ? lp : p + lp - (p * lp) / 1000000n; o.feeZ = calc(pf & 0xfffn); o.feeNoZ = calc(pf >> 12n); o.motor = new M.PoolCL({ ...base, feePips: Number(o.feeZ) }); }
    if (!f.sqrtP || BigInt(f.sqrtP) === 0n) return null; o.sqrtP = BigInt(f.sqrtP); o.L = BigInt(f.L);
  }
  return o;
}
// precio al contado, token1 por token0 (unidades humanas)
function spot(o) { const E = 1n << 128n; const raw = o.tipo === 'CP' ? (o.r0 === 0n ? 0n : o.r1 * E / o.r0) : o.sqrtP * o.sqrtP * E / (1n << 192n); return Number(raw) / Number(E) * Math.pow(10, o.dec0 - o.dec1); }
const vendeToken0 = (o, tok) => o.m.token0 === tok || (esTRX(tok) && esTRX(o.m.token0));
// salida (unidades mínimas del otro token) de vender `entrada` del token `tok` en el mercado o; null si no cabe (ventana, sin liquidez, parcial)
function salida(o, tok, entrada) {
  if (entrada === 0n) return 0n; const z = vendeToken0(o, tok); const clave = (z ? 'z' : 'n') + entrada; if (o.cache.has(clave)) return o.cache.get(clave);
  let r = null;
  try { const s = o.tipo === 'CP' ? o.motor.swap(z, entrada) : o.motor.swap(z, entrada, null, z ? o.feeZ : o.feeNoZ); r = s.noGastado > 0n ? null : s.salida; } catch (e) { if (e.message !== 'VENTANA') throw e; r = null; }
  o.cache.set(clave, r); return r;
}
// reparto de `total` entre los mercados `ms` (todos venden `tok`) para maximizar la salida: trozos iguales, cada uno al mercado que más sube
function mejorReparto(ms, tok, total, N = 32) {
  if (!ms.length || total <= 0n) return null; const trozo = total / BigInt(N) || 1n; const x = ms.map(() => 0n), y = ms.map(() => 0n); let resto = total;
  while (resto > 0n) {
    const c = resto < trozo ? resto : trozo; let mejor = -1, ganancia = -1n, nuevaSal = 0n;
    for (let i = 0; i < ms.length; i++) { const s = salida(ms[i], tok, x[i] + c); if (s == null) continue; const g = s - y[i]; if (g > ganancia) { ganancia = g; mejor = i; nuevaSal = s; } }
    if (mejor < 0) return null;   // ningún mercado absorbe el trozo
    x[mejor] += c; y[mejor] = nuevaSal; resto -= c;
  }
  return { salida: y.reduce((a, b) => a + b, 0n), partes: ms.map((o, i) => ({ o, entrada: x[i], salida: y[i] })).filter(p => p.entrada > 0n) };
}
// --- un token ---
function rutas(tok, mercados, ests) {
  const todos = mercados.map(m => ({ m, o: construir(m, ests) })).filter(x => x.o);
  const directos = todos.filter(x => x.m.roles.includes('directo') && x.m.tokens.includes(tok.simbolo)).map(x => x.o);
  const salto1 = todos.filter(x => x.m.roles.includes('salto1') && x.m.tokens.includes(tok.simbolo)).map(x => x.o);
  const salto2 = todos.filter(x => x.m.roles.includes('salto2')).map(x => x.o);
  return { directos, salto1, salto2 };
}
function perfil(tok, mercados, est, opc = {}) {
  const dec = tok.decimales, N = opc.trozos || 32; const R = rutas(tok, mercados, est);
  // la propia WTRX: sus mercados directos son los de la segunda pata (WTRX y TRX se desenvuelven 1:1)
  const esW = tok.direccion === WTRX; if (esW) R.directos = R.salto2.slice(); R.salto1 = esW ? [] : R.salto1;
  // precio de referencia (USDT por token) = precio al contado del mercado más profundo: el que menos cuesta (comisión + deslizamiento, medido contra su propio precio) al mayor tamaño de prueba
  // (1 M$, 100 mil $, 10 mil $, 1.000 $) que algún mercado absorbe con menos de un 10 % de coste. Un mercado pequeño con el precio desajustado no entra: no absorbe esos tamaños.
  const propio = (o, tk) => { const s = spot(o); return vendeToken0(o, tk) ? s : (s > 0 ? 1 / s : 0); };   // precio al contado del token tk en el mercado o, en unidades del otro token
  const costeA = (o, tk, usdTest, otroPorTk) => { const p = propio(o, tk); if (!(p > 0)) return null; const dec = vendeToken0(o, tk) ? o.dec0 : o.dec1, decO = vendeToken0(o, tk) ? o.dec1 : o.dec0; const ent = aBig(usdTest / (p * otroPorTk), dec); if (ent === 0n) return null; const s = salida(o, tk, ent); if (s == null) return null; return 1 - (Number(s) / Math.pow(10, decO)) / (Number(ent) / Math.pow(10, dec) * p); };
  const masProfundo = (ms, tk, otroPorTk) => { for (const usdTest of [1e6, 1e5, 1e4, 1e3]) { let mejor = null; for (const o of ms) { const c = costeA(o, tk, usdTest, otroPorTk); if (c != null && c < 0.1 && (!mejor || c < mejor.c)) mejor = { o, c }; } if (mejor) return propio(mejor.o, tk); } return 0; };
  const spotD = R.directos.length ? masProfundo(R.directos, tok.direccion, 1) : 0;
  let spot2 = 0; if (R.salto1.length && R.salto2.length && !esW) { const usdtPorTrx = masProfundo(R.salto2, WTRX, 1); if (usdtPorTrx > 0) { const trxPorTok = masProfundo(R.salto1, tok.direccion, usdtPorTrx); spot2 = trxPorTok * usdtPorTrx; } }
  const ref = spotD > 0 ? spotD : spot2;   // si hay mercado directo con profundidad, su precio; si no, el compuesto de dos saltos
  const res = { simbolo: tok.simbolo, direccion: tok.direccion, decimales: dec, precioReferenciaUsdt: ref || null, mercadosDirectos: R.directos.length, mercadosSalto1: R.salto1.length, curva: [], maximos: {} };
  if (!(ref > 0)) { res.sinMercado = true; return res; }
  const vender = (usd) => {   // mejor salida (USDT, unidades humanas) vendiendo `usd` dólares (a precio de referencia)
    const entrada = aBig(usd / ref, dec); if (entrada === 0n) return null; let mejor = null;
    if (R.directos.length) { const r = mejorReparto(R.directos, tok.direccion, entrada, N); if (r) mejor = { ruta: 'directa', out: Number(r.salida) / 1e6, partes: r.partes.map(p => ({ id: p.o.m.id, v: p.o.m.version, par: p.o.m.simbolo0 + '/' + p.o.m.simbolo1, parte: Number(p.entrada * 10000n / entrada) / 10000 })) }; }
    if (R.salto1.length && R.salto2.length && !esW) { const r1 = mejorReparto(R.salto1, tok.direccion, entrada, N); if (r1 && r1.salida > 0n) { const r2 = mejorReparto(R.salto2, WTRX, r1.salida, N); if (r2) { const out = Number(r2.salida) / 1e6; if (!mejor || out > mejor.out) mejor = { ruta: 'dos saltos', out, partes: r1.partes.map(p => ({ id: p.o.m.id, v: p.o.m.version, par: p.o.m.simbolo0 + '/' + p.o.m.simbolo1, parte: Number(p.entrada * 10000n / entrada) / 10000, salto: 1 })).concat(r2.partes.map(p => ({ id: p.o.m.id, v: p.o.m.version, par: p.o.m.simbolo0 + '/' + p.o.m.simbolo1, parte: Number(p.entrada * 10000n / r1.salida) / 10000, salto: 2 }))) }; } } }
    return mejor;
  };
  const coste = usd => { const r = vender(usd); return r ? Math.max(0, 1 - r.out / usd) : 1; };
  const tamanos = opc.tamanos; for (const usd of tamanos) { const r = vender(usd); res.curva.push(r ? { usd, salidaUsdt: Math.round(r.out * 100) / 100, costePct: Math.round(Math.max(0, 1 - r.out / usd) * 100000) / 1000, ruta: r.ruta, partes: r.partes } : { usd, salidaUsdt: null, costePct: 100, ruta: null, partes: [] }); }
  if (opc.sinMaximos) return res;
  // tamaño máximo con coste ≤ c (bisección sobre el tamaño; el coste crece con el tamaño)
  for (const c of [0.005, 0.01, 0.02, 0.05]) { let lo = 1, hi = 100; if (coste(lo) > c) { res.maximos[c * 100] = 0; continue; } let n = 0; while (coste(hi) <= c && hi < 5e8 && n < 40) { lo = hi; hi *= 2; n++; } if (hi >= 5e8 && coste(hi) <= c) { res.maximos[c * 100] = hi; continue; } for (let i = 0; i < 22 && hi / lo > 1.01; i++) { const mid = Math.sqrt(lo * hi); if (coste(mid) <= c) lo = mid; else hi = mid; } res.maximos[c * 100] = Math.round(lo); }
  return res;
}
// cuadrícula de tamaños (USD): espaciada de forma logarítmica entre min y max e incluyendo los números redondos que se preguntan a menudo
const tamanosPorDefecto = (n = 72, min = 100, max = 5e7) => { const base = Array.from({ length: n }, (_, i) => { const v = min * Math.pow(max / min, i / (n - 1)); const mag = Math.pow(10, Math.floor(Math.log10(v)) - 2); return Math.round(v / mag) * mag; }); const redondos = [100, 1e3, 5e3, 1e4, 5e4, 1e5, 2.5e5, 5e5, 1e6, 2.5e6, 5e6, 1e7, 2.5e7, 5e7]; return [...new Set(base.concat(redondos))].sort((a, b) => a - b); };
module.exports = { construir, spot, salida, mejorReparto, perfil, tamanosPorDefecto, USDT, WTRX, TRX };
