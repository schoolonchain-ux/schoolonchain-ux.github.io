'use strict';
// AUDITORIA COMPARATIVA v0.7 -> v0.9.3 del informe de trazabilidad (robo a Binance, TRON).
// Codigo propio: NO importa nada de blockchain-investigator/src. Solo lee los datos congelados de los rastreos.
// Uso: node auditoria.cjs salida.json
const fs = require('fs'); const j = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const A = 'C:/EquipoIA/research/auditoria-adversarial-2026-10-31/';
const PX = j('C:/EquipoIA/blockchain-investigator/src/libro-mayor/datos/precios-1h.json').TRX;
const px = t => { if (t < PX[0][0] || t > PX[PX.length - 1][0] + 3600000) return null; let r = null; for (const k of PX) { if (k[0] <= t) r = k; else break; } return r ? r[1] : null; };
const usd = e => (e.sim === 'USDT' || e.sim === 'USDC') ? e.cant : (e.sim === 'TRX' && px(e.at) != null ? e.cant * px(e.at) : e.v);
const METAROUTER = 'TPuaJ6gnYfE9gLUDFrbWbPx3tMnjG8max1', SEMILLA = 'TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki', SEG = 3520;
const out = { tramos: {} };
for (const [dir, pref, fase] of [['tramo5-v04', 'tramo5', 'B (despues de la foto)'], ['tramo6-v03', 'tramo6', 'A (antes de la foto)']]) {
  const D = A + dir + '/'; const { rec, term } = j(D + pref + '-cache.json'); const clases = j(D + 'traza-clases.json'); const R = j(D + pref + '-resultado.json'); const corte = j(D + 't4.json').t3; const AT = j(D + pref + '-aristas-terminales.json');
  const tipo = a => { const c = (term[a] && term[a].clase) || clases[a]; return c ? c.tipo : null; };
  const ok = a => !!(rec[a] && rec[a].ok);

  // ---------- 1) JUSTLEND
  const pre = AT.filter(e => e.tipo === 'prestamo');
  const v07 = pre.reduce((s, e) => s + usd(e) * e.pureza, 0);
  const hops = {}, recibido = {};
  for (const [w, r] of Object.entries(rec)) for (const v of r.via || []) if (v.via === 'jtoken' && v.at <= corte) { (hops[w] = hops[w] || []).push(v); recibido[v.a] = (recibido[v.a] || 0) + v.v; }
  const redenciones = a => ok(a) ? (rec[a].ent || []).filter(e => !e.virtual && e.at <= corte && tipo(e.de) === 'prestamo') : [];
  const memo = {}, pila = new Set();
  const fracRedimida = a => { if (a in memo) return memo[a]; const rc = recibido[a] || 0; if (!(rc > 0) || !ok(a) || pila.has(a)) return 0; pila.add(a); let m = redenciones(a).reduce((s, e) => s + e.v, 0); for (const v of hops[a] || []) m += v.v * fracRedimida(v.a); pila.delete(a); return (memo[a] = Math.max(0, Math.min(1, m / rc))); };
  const depositantes = {};
  for (const w of new Set(pre.map(e => e.de))) {
    const deps = (rec[w].sal || []).filter(e => e.at <= corte && tipo(e.a) === 'prestamo'); const dep = deps.reduce((s, e) => s + e.v, 0); const hs = hops[w] || [];
    let seg = 0, noLeido = 0; const det = [];
    for (const v of hs) {
      if (ok(v.a)) { const f = fracRedimida(v.a); seg += v.v * f; det.push({ tx: v.tx, a: v.a, jusdt: v.cant, usd: v.v, at: v.at, destino: 'billetera leida', fraccionRedimida: f, redenciones: redenciones(v.a).map(e => ({ tx: e.tx, de: e.de, usd: e.v, at: e.at })) }); }
      else { noLeido += v.v; det.push({ tx: v.tx, a: v.a, jusdt: v.cant, usd: v.v, at: v.at, destino: 'NO leida por el rastreo', tipo: tipo(v.a) }); }
    }
    const frSeg = dep > 0 && hs.length ? Math.min(1, seg / dep) : 0; const frSin = dep > 0 && hs.length ? Math.max(0, Math.min(1 - frSeg, noLeido / dep)) : 0;
    depositantes[w] = { dep, nDep: deps.length, depositos: deps.map(e => ({ tx: e.tx, a: e.a, usd: e.v, at: e.at })), justificantes: det, seguido: seg, noLeido, frSeguido: frSeg, frSinSeguir: frSin, frPrestamo: Math.max(0, 1 - frSeg - frSin) };
  }
  let v093 = 0, sinSeguir = 0, quitado = 0; const porDep = {};
  for (const e of pre) {
    const d = depositantes[e.de]; const full = usd(e) * e.pureza; v093 += full * d.frPrestamo; sinSeguir += full * d.frSinSeguir; quitado += full * d.frSeguido;
    const q = porDep[e.de] = porDep[e.de] || { completo: 0, sigue: 0, sinSeguir: 0, prestamo: 0, aristas: 0 }; q.completo += full; q.sigue += full * d.frSeguido; q.sinSeguir += full * d.frSinSeguir; q.prestamo += full * d.frPrestamo; q.aristas++;
  }
  const frAn = pre.reduce((s, e) => s + usd(e) * e.pureza * (1 - ((e.v * e.pureza) > 0 ? Math.min(1, Math.max(0, e.tainted / (e.v * e.pureza))) : 1)), 0);

  // ---------- 2) CHAINFLIP: deposito en un puente cuya MISMA transaccion tiene una salida decodificada ("cambio") a otra direccion
  const cambios = {}; for (const [w, r] of Object.entries(rec)) for (const v of r.via || []) if (v.via === 'cambio') (cambios[w + '|' + v.tx] = cambios[w + '|' + v.tx] || []).push(v);
  const cf = []; let cfQuit = 0, cfEntero = 0;
  for (const e of AT) {
    if (e.tipo !== 'puente') continue; const sal = (cambios[e.de + '|' + e.tx] || []).filter(v => v.a !== e.a); if (!sal.length) continue;
    const o = sal.reduce((s, v) => s + v.v, 0); let keep = e.v > 0 ? Math.max(0, 1 - o / e.v) : 0; if (keep < 0.02) keep = 0; const full = usd(e) * e.pureza; cfQuit += full * (1 - keep); cfEntero += full;
    cf.push({ tx: e.tx, de: e.de, boveda: e.a, nombre: e.nombre, sim: e.sim, cant: e.cant, at: e.at, depositoUsdFijo: e.v, pureza: e.pureza, atribuido: full, salidas: sal.map(v => ({ a: v.a, sim: v.sim, cant: v.cant, usd: v.v, leida: ok(v.a) })), salidaSobreDeposito: e.v > 0 ? o / e.v : null, seConserva: keep, quitado: full * (1 - keep) });
  }
  const puenteAristas = AT.filter(e => e.tipo === 'puente').reduce((s, e) => s + usd(e) * e.pureza, 0);

  // ---------- 3) SYMBIOSIS: envios al MetaRouter; los revertidos cuyo dinero volvio a TRON
  const p = R.pureza || {}; const fS = D + 'symbiosis-llegadas.json'; const SY = fs.existsSync(fS) ? j(fS) : {}; const sy = []; let syTodo = 0, syRev = 0, syN = 0;
  const swaps = fs.existsSync(D + pref + '-swaps.json') ? j(D + pref + '-swaps.json') : {}; const RET = new Set((fs.existsSync(D + 'retiradas-informe.json') ? j(D + 'retiradas-informe.json') : { contratos: [] }).contratos || []);
  for (const [w, r] of Object.entries(rec)) {
    if (!r.ok) continue; const pw = w === SEMILLA ? 1 : (p[w] || 0); if (!(pw > 0)) continue; const viaTx = new Set((r.via || []).map(v => v.tx)); const tieneRet = (r.via || []).some(v => v.via === 'retirada');
    for (const e of r.sal || []) {
      if (e.at > corte || e.a !== METAROUTER || e.v < SEG) continue; if (viaTx.has(e.tx)) continue; if (RET.has(e.a) && tieneRet) continue; const o = swaps[e.tx]; if (o && o.some(q => q.a === w)) continue;
      const at = usd(e) * pw; syTodo += at; syN++; const x = SY[e.tx]; const rev = !!(x && x.estado === 'Reverted' && x.llegada && x.llegada.cadena === 728126428);
      if (rev) { syRev += at; sy.push({ tx: e.tx, de: w, sim: e.sim, cant: e.cant, at: e.at, atribuido: at, pureza: pw, estado: x.estado, llegada: x.llegada }); }
    }
  }
  out.tramos[pref] = {
    fase, corte: new Date(corte).toISOString(),
    justlend: { aristas: pre.length, depositantes: Object.keys(depositantes).length, conJustificantes: Object.values(depositantes).filter(d => d.justificantes.length).length, prestamo_v07: v07, prestamo_v093: v093, pasaASinLocalizar: sinSeguir, dobleConteoQuitado: quitado, reduccionDelAnalisis_v09: frAn, porDepositante: porDep, detalle: depositantes },
    chainflip: { n: cf.length, depositoEnteroAtribuido: cfEntero, quitado_v093: cfQuit, items: cf }, puenteAristasSinAjuste: puenteAristas,
    symbiosis: { enviosContados: syN, todos: syTodo, revertidosConDevolucion: syRev, n: sy.length, items: sy }
  };
}
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
const f = n => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
for (const [k, t] of Object.entries(out.tramos)) {
  console.log('\n##', k, t.fase, 'corte', t.corte); const J = t.justlend;
  console.log(' JustLend: aristas', J.aristas, 'depositantes', J.depositantes, 'con justificantes', J.conJustificantes);
  console.log('   prestamo v0.7 =', f(J.prestamo_v07), '| v0.9.3 =', f(J.prestamo_v093), '| a sin localizar =', f(J.pasaASinLocalizar), '| doble conteo quitado =', f(J.dobleConteoQuitado), '| (reduccion del analisis, v0.9) =', f(J.reduccionDelAnalisis_v09));
  console.log(' Chainflip: n', t.chainflip.n, 'deposito entero', f(t.chainflip.depositoEnteroAtribuido), 'quitado', f(t.chainflip.quitado_v093), '| puente (aristas, sin ajuste) =', f(t.puenteAristasSinAjuste));
  console.log(' Symbiosis: envios', t.symbiosis.enviosContados, 'todos', f(t.symbiosis.todos), '| revertidos devueltos', f(t.symbiosis.revertidosConDevolucion), 'n', t.symbiosis.n);
}
