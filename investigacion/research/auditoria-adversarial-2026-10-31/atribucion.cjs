'use strict';
// AUDITORÍA DE LA ATRIBUCIÓN (tramo 1). Solo lee los datos originales (research/binance-0x5227-2026-10-30/tron/) y escribe en esta carpeta.
//  1) Reproduce el método del informe (pureza proporcional estática por punto fijo) y comprueba que da las cifras publicadas.
//  2) Mide si ese método CONSERVA el dinero (¿se «crea» o «pierde» dinero del robo al propagarlo?).
//  3) Repite el reparto con modelos alternativos sobre el MISMO grafo y los MISMOS importes: FIFO, LIFO, mezcla proporcional dinámica (en el tiempo)
//     y las dos cotas teóricas (lo robado sale primero / lo limpio sale primero).
// Uso: node atribucion.cjs [tramo1|tramo2]
const fs = require('fs'), path = require('path');
const TRAMO = process.argv[2] || 'tramo1';
const SRC = 'C:/EquipoIA/research/binance-0x5227-2026-10-30/tron/'; const OUT = path.join(__dirname, 'resultados') + '/'; fs.mkdirSync(OUT, { recursive: true });
const J = f => JSON.parse(fs.readFileSync(SRC + f, 'utf8'));
const CACHE = TRAMO === 'tramo1' ? 'traza-cache.json' : 'traza-post-cache.json', ALCF = TRAMO === 'tramo1' ? 'traza-alcanzadas.json' : 'traza-post-alcanzadas.json', RESF = TRAMO === 'tramo1' ? 'traza-resultado.json' : 'traza-post-resultado.json';
const { rec, term } = J(CACHE); const clases = J('traza-clases.json'); const ALC = new Set(J(ALCF)); const PUB = J(RESF);
const TSTAR = Date.UTC(2026, 9, 30, 22, 40), SEGUIR = 3520;
const P0 = TRAMO === 'tramo1' ? {} : J('traza-resultado.json').pureza;
const SEM = new Set(TRAMO === 'tramo1' ? ['TSpe5HC3PRD2svJcr1YoGszhHk2mtkyZ8A', 'TG5iBMQPrDzJJAUM8GMVBf1hRaJ1wvzsGi', 'TPBkSjkCMn2ckrMuAP8n2J1jdjbw76bKN4', 'TCzBTkqn66yApqbYoPezaEQosM5DAd7Y62', 'TAk1xJNWuBYvJHLsUiBFLeuK6xvpQUFYP5'] : ['THPaGKe6aZkUcNht24hcscZPLwtcJAbpun', 'TGSNahJvAdh86aR5pdcxiep1mBWSRK3HHL', 'TBAPnuwEht65McDbxDvDYs2XLRSSbYQMUM', 'TLKfB2goHRY1SykEpVbiGdsesACrkCxCeW', 'TH1YKH9MUuJtDmekPia4x9fZXAcpPrMv8B', 'TM8uyBjRKzFtQdMC7tQLvKeeWieaFvXDyc'].slice(0, 0));
const DEP = new Set(TRAMO === 'tramo1' ? ['TKkH2vH6kyi2QKcMbqym53WMuvdd1xvw6K', 'TL2F4GhnaFVZBZPncHYjwfYZFW44NcfVwj', 'TCBAz7itvtX5CjBzVMPQdrbwQLN63ao1fk', 'TJajtPqDqUGh1Sr1j8ugHoSXBVpaFLLHKT'] : []);
const pe0 = (p, a) => (a in p ? p[a] : (P0[a] !== undefined ? P0[a] : (SEM.has(a) || DEP.has(a) ? 1 : 0)));
const fmt = n => Math.round(n).toLocaleString('en');
// ---- preparación idéntica a la del informe ----
for (const w of Object.keys(rec)) { for (const k of ['ent', 'sal', 'via']) if (rec[w][k]) rec[w][k] = rec[w][k].filter(e => e.at <= TSTAR); }
for (const w of Object.keys(rec)) for (const v of rec[w].via || []) { const R2 = rec[v.a]; if (R2 && R2.ok) R2.ent.push({ de: w, v: v.v, at: v.at, tx: v.tx, sim: v.sim, cant: v.cant, virtual: true }); }
const esContrato = (() => { try { return J('traza-escontrato.json'); } catch { return {}; } })();
const neutral = a => (clases[a] && ['swap', 'prestamo', 'puente', 'usdd'].includes(clases[a].tipo)) || esContrato[a] === true;
const W = Object.keys(rec).filter(w => ALC.has(w) && rec[w].ok && !SEM.has(w) && !DEP.has(w));
const claseDe = a => (term[a] && term[a].clase) || clases[a];
const tipoDe = a => { const c = claseDe(a); return c ? c.tipo : null; };
const claveDe = (a, c) => c.tipo === 'casa' ? (c.nombre || a) : c.tipo === 'nodo' ? a : (c.nombre || c.tipo);
// ---- MODELO 0: el del informe (pureza proporcional estática por punto fijo) ----
function modeloInforme() {
  const p = {}; for (const s of SEM) p[s] = 1; for (const d of DEP) p[d] = 1; for (const w of W) p[w] = 0;
  const totIn = {}; for (const w of W) totIn[w] = rec[w].ent.filter(e => !neutral(e.de)).reduce((s, e) => s + e.v, 0);
  let vueltas = 0; for (let it = 0; it < 60; it++) { let cambio = 0; vueltas = it + 1; for (const w of W) { const t = rec[w].ent.filter(e => !neutral(e.de)).reduce((s, e) => s + e.v * pe0(p, e.de), 0); const nuevo = totIn[w] > 0 ? Math.min(1, t / totIn[w]) : 0; cambio = Math.max(cambio, Math.abs(nuevo - p[w])); p[w] = nuevo; } if (cambio < 1e-6) break; }
  const R = { terminales: {}, porDestino: {}, polvo: 0, neutrales: 0, continuan: 0, retenido: 0, vueltas, p };
  for (const w of W.concat([...SEM])) { if (!rec[w].ok) continue; const pw = p[w]; for (const e of rec[w].sal.concat(rec[w].via || [])) {
    if (SEM.has(e.a) || DEP.has(e.a)) continue; if (e.v < SEGUIR) { R.polvo += e.v * pw; continue; } const c = claseDe(e.a); if (!c) continue; const t = e.v * pw;
    if (c.tipo === 'swap') { R.neutrales += t; continue; } if (c.tipo === 'billetera') { R.continuan += t; continue; }
    R.terminales[c.tipo] = (R.terminales[c.tipo] || 0) + t; const k = c.tipo + '|' + claveDe(e.a, c); R.porDestino[k] = (R.porDestino[k] || 0) + t; } }
  // Ventana previa (corrección de la revisión): entradas a una billetera w, enviadas por billeteras del recorrido, ANTERIORES al inicio de lectura de w (rec[w].desde - 120 s): no están en rec[w].ent porque no se leyeron.
  { const Wset = new Set(W); R.preVentanaPorW = {}; for (const s2 of W.concat([...SEM])) { const rs = rec[s2]; if (!rs || !rs.ok) continue; for (const e of (rs.sal || []).concat(rs.via || [])) { if (!Wset.has(e.a) || e.v < SEGUIR) continue; const rw = rec[e.a]; if (!rw || !rw.desde || !(e.at < rw.desde - 120000)) continue; const q = R.preVentanaPorW[e.a] || (R.preVentanaPorW[e.a] = { primera: e.at, desde: rw.desde, v: 0, t: 0, n: 0 }); q.primera = Math.min(q.primera, e.at); q.v += e.v; q.t += e.v * (p[s2] || 0); q.n++; } } }
  R.preVentana = { n: 0, billeteras: new Set(), v: 0, tainted: 0 }; for (const [w2, q2] of Object.entries(R.preVentanaPorW)) { R.preVentana.n += q2.n; R.preVentana.billeteras.add(w2); R.preVentana.v += q2.v; R.preVentana.tainted += q2.t; } for (const w of W) { const d = rec[w].desde; if (!d) continue; for (const e of rec[w].ent) if (e.virtual && e.at < d) { R.preVentana.n++; R.preVentana.billeteras.add(w); R.preVentana.v += e.v; R.preVentana.tainted += e.v * (p[e.de] || (SEM.has(e.de) ? 1 : 0)); } }
  R.retenidoCorregido = 0; R.netoNegativo = 0;
  for (const w of W) { const neto = rec[w].ent.filter(e => !e.virtual).reduce((s, e) => s + e.v, 0) - rec[w].sal.reduce((s, e) => s + e.v, 0); if (neto > 0) R.retenido += neto * p[w]; const netoC = rec[w].ent.filter(e => e.virtual || !neutral(e.de)).reduce((s, e) => s + e.v, 0) - rec[w].sal.reduce((s, e) => s + e.v, 0); if (netoC > 0) R.retenidoCorregido += netoC * p[w]; else R.netoNegativo += -netoC * p[w]; }
  return R;
}
// ---- Conservación del modelo del informe: ¿lo robado que sale de una billetera es ≤ lo robado que entró? ----
function conservacion(p) {
  let exceso = 0, defecto = 0, nExceso = 0, sumaIn = 0, sumaOut = 0; const peores = [];
  for (const w of W) {
    const tIn = rec[w].ent.filter(e => !neutral(e.de)).reduce((s, e) => s + e.v * pe0(p, e.de), 0);
    const tOut = rec[w].sal.concat(rec[w].via || []).filter(e => { const t = tipoDe(e.a); return t !== 'swap'; }).reduce((s, e) => s + e.v * p[w], 0);
    sumaIn += tIn; sumaOut += tOut; const d = tOut - tIn; if (d > 1) { exceso += d; nExceso++; peores.push({ w, tIn, tOut, exceso: d }); } else if (d < -1) defecto += -d;
  }
  peores.sort((a, b) => b.exceso - a.exceso);
  return { sumaIn, sumaOut, excesoTotal: exceso, billeterasConExceso: nExceso, defectoTotal: defecto, peores: peores.slice(0, 8) };
}
// ---- MODELOS ALTERNATIVOS: simulación por eventos en el tiempo, un inventario de lotes por billetera ----
function simular(modelo, hip) {
  // eventos de salida desde billeteras rastreadas; entradas limpias desde remitentes no rastreados (para que la dilución cuente igual que en el informe)
  const rastreada = a => W.includes ? false : false;
  const setW = new Set(W);
  const ev = [];
  for (const w of W.concat([...SEM])) { if (!rec[w].ok) continue; for (const e of rec[w].sal.concat(rec[w].via || [])) {
    const t = tipoDe(e.a); if (t === 'swap') { const viaTxs = (rec[w].via || []).filter(x => x.tx === e.tx); if (viaTxs.length) continue; const ret = (rec[w].ent || []).filter(x => x.tx === e.tx && !x.virtual && neutral(x.de)).reduce((s2, x) => s2 + x.v, 0); if (ret > 0) { ev.push({ at: e.at, orden: 1, kind: 'out', de: w, a: '__conv__', v: e.v, ret, conv: true }); continue; } ev.push({ at: e.at, orden: 1, kind: 'out', de: w, a: '__neutral__', v: e.v, tx: e.tx, neutral: true }); continue; }   // un cambio con salto virtual se sigue por el via; si no se pudo decodificar, sale a «neutral sin resolver»
    ev.push({ at: e.at, orden: 1, kind: 'out', de: w, a: e.a, v: e.v, tx: e.tx }); } }
  for (const w of W) for (const e of rec[w].ent) { if (e.virtual || neutral(e.de)) continue; if (SEM.has(e.de) || DEP.has(e.de) || setW.has(e.de)) continue; ev.push({ at: e.at, orden: 0, kind: 'inClean', a: w, v: e.v }); }
  if (TRAMO === 'tramo1' && fs.existsSync(OUT + 'hueco-aristas.json') && !process.argv.includes('--sin-hueco')) for (const g of JSON.parse(fs.readFileSync(OUT + 'hueco-aristas.json', 'utf8'))) { if (!setW.has(g.de)) continue; const t = g.clase; if (t === 'swap') ev.push({ at: g.at, orden: 1, kind: 'out', de: g.de, a: '__neutral__', v: g.v, tx: g.tx, neutral: true }); else ev.push({ at: g.at, orden: 1, kind: 'out', de: g.de, a: g.a, v: g.v, tx: g.tx, hueco: true, clase: g.clase, nombre: g.nombre }); }
  const pagosPorTx = new Set(); for (const w of W) for (const e of rec[w].sal) pagosPorTx.add(w + '|' + e.tx); const viaPorTx = new Set(); for (const w of W) for (const e of rec[w].ent) if (e.virtual) viaPorTx.add(w + '|' + e.tx);
  for (const w of W) for (const e of rec[w].ent) { if (e.virtual || !neutral(e.de) || pagosPorTx.has(w + '|' + e.tx) || viaPorTx.has(w + '|' + e.tx)) continue; ev.push({ at: e.at, orden: 0, kind: 'inUnknown', a: w, v: e.v }); }
  ev.sort((x, y) => x.at - y.at || x.orden - y.orden);
  if (process.env.DEBUGW && modelo === 'fifo') for (const e of ev) if ((e.a && e.a.startsWith(process.env.DEBUGW)) || (e.de && e.de.startsWith(process.env.DEBUGW))) console.log('EV', new Date(e.at).toISOString().slice(5, 19), e.kind, (e.de || '').slice(0, 10), '->', (e.a || '').slice(0, 10), fmt(e.v), (e.tx || '').slice(0, 8));
  const inv = {}; const lotes = w => inv[w] || (inv[w] = []);
  const R = { terminales: {}, porDestino: {}, polvo: 0, neutrales: 0, continuan: 0, retenido: 0, sinInventario: 0, haciaNoRastreadas: 0, inyectado: 0 };
  const retirar = (w, v) => {   // devuelve la parte robada de v según el modelo
    if (SEM.has(w) || DEP.has(w)) return v;   // las semillas son 100 % robo
    const L = lotes(w); let falta = v, t = 0;
    const orden = modelo === 'fifo' ? l => l.shift() : modelo === 'lifo' ? l => l.pop() : null;
    if (modelo === 'dyn') { const tot = L.reduce((s, l) => s + l.amt, 0), tt = L.reduce((s, l) => s + l.t, 0); const x = Math.min(v, tot); const frac = tot > 0 ? tt / tot : 0; t = x * frac; if (tot > 0) { const f = (tot - x) / tot; L.length = 0; if (tot - x > 1e-9) L.push({ amt: tot - x, t: tt * f }); } R.sinInventario += v - x; if (v - x > 1e-9) { R.faltaPorW = R.faltaPorW || {}; R.faltaPorW[w] = (R.faltaPorW[w] || 0) + (v - x); } return t; }
    if (modelo === 'taintfirst' || modelo === 'cleanfirst') { L.sort((a, b) => { const fa = a.amt ? a.t / a.amt : 0, fb = b.amt ? b.t / b.amt : 0; return modelo === 'taintfirst' ? fb - fa : fa - fb; }); const copia = L.slice(); L.length = 0; for (const l of copia) { if (falta <= 1e-9) { L.push(l); continue; } const x = Math.min(falta, l.amt); const tx = l.amt ? l.t * (x / l.amt) : 0; t += tx; falta -= x; if (l.amt - x > 1e-9) L.push({ amt: l.amt - x, t: l.t - tx }); } R.sinInventario += Math.max(0, falta); if (falta > 1e-9) { R.faltaPorW = R.faltaPorW || {}; R.faltaPorW[w] = (R.faltaPorW[w] || 0) + falta; } return t; }
    while (falta > 1e-9 && L.length) { const l = orden(L); const x = Math.min(falta, l.amt); const tx = l.amt ? l.t * (x / l.amt) : 0; t += tx; falta -= x; if (l.amt - x > 1e-9) { const resto = { amt: l.amt - x, t: l.t - tx }; if (modelo === 'fifo') L.unshift(resto); else L.push(resto); } }
    R.sinInventario += Math.max(0, falta); if (falta > 1e-9) { R.faltaPorW = R.faltaPorW || {}; R.faltaPorW[w] = (R.faltaPorW[w] || 0) + falta; } return t;
  };
  for (const e of ev) {
    if (e.kind === 'inClean') { lotes(e.a).push({ amt: e.v, t: 0 }); continue; }
    if (e.kind === 'inUnknown') { let t0 = 0; if (hip === 'mismaPureza') { const L = lotes(e.a), tot = L.reduce((s2, l) => s2 + l.amt, 0), tt = L.reduce((s2, l) => s2 + l.t, 0); t0 = tot > 0 ? e.v * tt / tot : 0; } lotes(e.a).push({ amt: e.v, t: t0 }); R.desconocidoEntra = (R.desconocidoEntra || 0) + e.v; continue; }
    if (e.conv) { if (SEM.has(e.de)) continue; const tc = retirar(e.de, e.v); lotes(e.de).push({ amt: e.ret, t: tc * Math.min(1, e.ret / e.v) }); R.convertido = (R.convertido || 0) + tc; continue; }   // cambio dentro de la misma billetera: lo que paga vuelve como lo que devuelve el contrato (mismo hash), con la misma parte robada
    if (e.neutral) { if (SEM.has(e.de)) continue; const tn = retirar(e.de, e.v); R.neutrales += tn; continue; }   // pago a un cambio sin salida decodificada ni devolución: se consume y se cuenta como «neutral sin resolver»
    const t = retirar(e.de, e.v);
    if (SEM.has(e.de) && !SEM.has(e.a) && !DEP.has(e.a)) R.inyectado += t;
    const tp = tipoDe(e.a);
    if (SEM.has(e.a) || DEP.has(e.a)) continue;
    if (e.v < SEGUIR) { R.polvo += t; continue; }
    if (setW.has(e.a)) { lotes(e.a).push({ amt: e.v, t }); R.continuan += t; continue; }
    const c = e.hueco ? { tipo: e.clase, nombre: e.nombre } : claseDe(e.a); if (!c) { R.haciaNoRastreadas += t; continue; }
    if (c.tipo === 'billetera') { R.haciaNoRastreadas += t; continue; }   // billetera alcanzada pero sin lectura o fuera de W
    R.terminales[c.tipo] = (R.terminales[c.tipo] || 0) + t; const k = c.tipo + '|' + claveDe(e.a, c); R.porDestino[k] = (R.porDestino[k] || 0) + t;
  }
  for (const w of W) for (const l of lotes(w)) R.retenido += l.t;
  R.inv = inv; return R;
}
// ---- ejecución ----
const base = modeloInforme(); const cons = conservacion(base.p);
const pubTot = PUB.totales || {};
const repart0 = (rec['TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki'] ? rec['TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki'].sal : []).filter(e => !SEM.has(e.a) && !DEP.has(e.a)).reduce((s, e) => s + e.v, 0);
const repart = (rec['TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki'] ? rec['TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki'].sal : []).filter(e => !SEM.has(e.a) && !DEP.has(e.a)).reduce((s, e) => s + e.v, 0);
const modelos = { informe: base }; const HIP = process.argv.includes('--hip=limpio') ? 'limpio' : 'mismaPureza'; if (TRAMO === 'tramo1') for (const m of ['fifo', 'lifo', 'dyn', 'taintfirst', 'cleanfirst']) modelos[m] = simular(m, HIP);
console.log('\nHIPÓTESIS sobre entradas de origen desconocido (cambios sin traza propia):', HIP);
const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
console.log('== REPRODUCCIÓN del informe (' + TRAMO + ')');
console.log('   publicado:', JSON.stringify(Object.fromEntries(Object.entries(pubTot).map(([k, v]) => [k, Math.round(v)]))));
console.log('   recalculado:', JSON.stringify(Object.fromEntries(Object.entries(base.terminales).map(([k, v]) => [k, Math.round(v)]))), '| retenido', fmt(base.retenido), '(publicado', fmt(PUB.retenidoTainted), ') | polvo', fmt(base.polvo), '| vueltas', base.vueltas);
console.log('   RETENIDO: informe (solo entradas reales)', fmt(base.retenido), '| corregido (con entradas de cambios decodificadas, sin las del contrato)', fmt(base.retenidoCorregido), '| déficit de billeteras con neto negativo (salió más de lo que entró)', fmt(base.netoNegativo));
console.log('   SIN EXPLICAR (informe):', fmt(repart0 - (Object.values(base.terminales).reduce((a, b) => a + b, 0) + base.retenido + base.polvo)), '| con retenido corregido:', fmt(repart0 - (Object.values(base.terminales).reduce((a, b) => a + b, 0) + base.retenidoCorregido + base.polvo)), '| reparto', fmt(repart0));
console.log('   ARTEFACTO DE VENTANA: entradas virtuales anteriores al inicio de lectura de la billetera receptora:', base.preVentana.n, 'en', base.preVentana.billeteras.size, 'billeteras;', fmt(base.preVentana.v), '$ brutos,', fmt(base.preVentana.tainted), '$ del robo según el método');
console.log('   billeteras', W.length, '(publicado', PUB.billeteras, ')');
console.log('\n== CONSERVACIÓN del modelo del informe: entra lo robado', fmt(cons.sumaIn), '| sale', fmt(cons.sumaOut), '| exceso (sale más de lo que entró) en', cons.billeterasConExceso, 'billeteras:', fmt(cons.excesoTotal), '| defecto:', fmt(cons.defectoTotal));
for (const x of cons.peores) console.log('     ', x.w, 'entra', fmt(x.tIn), 'sale', fmt(x.tOut), 'exceso', fmt(x.exceso));
console.log('\n== COMPARACIÓN DE MODELOS (dinero del robo atribuido, \$)  [reparto TRBdWq: ' + fmt(repart) + ']');
const tipos = ['nodo', 'prestamo', 'puente', 'usdd', 'casa', 'no_verificada'];
console.log('modelo'.padEnd(12), ...tipos.map(t => t.padStart(11)), 'retenido'.padStart(11), 'polvo'.padStart(10), 'noRastr.'.padStart(10), 'sinInv.'.padStart(10), 'inyectado'.padStart(11));
for (const [m, R] of Object.entries(modelos)) console.log(m.padEnd(12), ...tipos.map(t => fmt(R.terminales[t] || 0).padStart(11)), fmt(R.retenido).padStart(11), fmt(R.polvo).padStart(10), fmt(R.haciaNoRastreadas || 0).padStart(10), fmt(R.sinInventario || 0).padStart(10), fmt(R.inyectado || 0).padStart(11));
{ const f = modelos.fifo.inv; const filas = W.map(w => { const neto = rec[w].ent.filter(e => !e.virtual).reduce((s2, e) => s2 + e.v, 0) - rec[w].sal.reduce((s2, e) => s2 + e.v, 0); return { w, sim: (f[w] || []).reduce((s2, l) => s2 + l.t, 0), simTotal: (f[w] || []).reduce((s2, l) => s2 + l.amt, 0), informe: neto > 0 ? neto * base.p[w] : 0, p: base.p[w], nivel: rec[w].nivel }; }).sort((x, y) => (y.sim - y.informe) - (x.sim - x.informe)); fs.writeFileSync(OUT + 'retenido-diferencias-' + TRAMO + '.json', JSON.stringify(filas.slice(0, 40), null, 1)); }
if (process.argv.includes('--diag')) { const f = modelos.fifo.inv; const orig = {}; for (const w of W) { const neto = rec[w].ent.filter(e => !e.virtual).reduce((s, e) => s + e.v, 0) - rec[w].sal.reduce((s, e) => s + e.v, 0); orig[w] = neto > 0 ? neto * base.p[w] : 0; } const filas = W.map(w => ({ w, sim: (f[w] || []).reduce((s, l) => s + l.t, 0), orig: orig[w], p: base.p[w], nivel: rec[w].nivel })).sort((a, b) => (b.sim - b.orig) - (a.sim - a.orig)); console.log('\nDIAG retenido: mayores diferencias sim FIFO - informe'); for (const x of filas.slice(0, 12)) console.log('  ', x.w.slice(0, 12), 'nivel', x.nivel, 'p', x.p.toFixed(3), 'sim', fmt(x.sim), 'informe', fmt(x.orig)); console.log('  suma sim', fmt(filas.reduce((s, x) => s + x.sim, 0)), 'suma informe', fmt(filas.reduce((s, x) => s + x.orig, 0))); }
{ const fp = modelos.fifo.faltaPorW || {}; const top = Object.entries(fp).sort((a, b) => b[1] - a[1]); fs.writeFileSync(OUT + 'faltantes-' + TRAMO + '.json', JSON.stringify(top.slice(0, 40), null, 1)); console.log('\nFALTANTES (outflow sin inventario observado, FIFO): ' + top.length + ' billeteras; las 8 mayores:'); for (const [w, v] of top.slice(0, 8)) { const r = rec[w]; const e = r.ent.reduce((s2, x) => s2 + x.v, 0), o = r.sal.reduce((s2, x) => s2 + x.v, 0); console.log('  ', w.slice(0, 12), 'falta', fmt(v), '| ent total', fmt(e), 'sal total', fmt(o), '| desde', new Date(r.desde).toISOString().slice(5, 16), 'nivel', r.nivel, 'ent virtuales', fmt(r.ent.filter(x => x.virtual).reduce((s2, x) => s2 + x.v, 0))); } }
{ const pv = Object.entries(modelos.informe.preVentanaPorW || {}).sort((a, b) => b[1].t - a[1].t); fs.writeFileSync(OUT + 'preventana-' + TRAMO + '.json', JSON.stringify(pv, null, 1)); console.log('PRE-VENTANA: ' + pv.length + ' billeteras reciben dinero robado ANTES de empezar su lectura; las 6 mayores:'); for (const [w, q] of pv.slice(0, 6)) console.log('  ', w, 'robado', fmt(q.t), 'bruto', fmt(q.v), 'en', q.n, 'envíos | primera', new Date(q.primera).toISOString().slice(5, 16), '| lectura desde', new Date(q.desde).toISOString().slice(5, 16)); }
for (const R of Object.values(modelos)) { delete R.inv; delete R.faltaPorW; delete R.preVentanaPorW; }
fs.writeFileSync(OUT + 'atribucion-' + TRAMO + '.json', JSON.stringify({ tramo: TRAMO, generado: new Date().toISOString(), reparto: repart, publicado: { totales: pubTot, retenido: PUB.retenidoTainted }, conservacion: cons, modelos: Object.fromEntries(Object.entries(modelos).map(([m, R]) => { const { p, ...r } = R; return [m, r]; })) }, null, 1));
