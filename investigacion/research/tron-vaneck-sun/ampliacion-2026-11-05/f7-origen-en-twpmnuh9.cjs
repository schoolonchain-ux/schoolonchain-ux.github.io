'use strict';
// LÍNEA F · F7 (v2, tras la revisión externa) — Libro COMPLETO de TWpMnUh9…: ¿cuánto del TRX que mandó a THxg4UEz… (365,1 M el 28-jun-2025, camino a TRON Inc.) y a TT2T17… (500 M el 29-jul-2025) viene de Zion (génesis)?
// La v1 solo contaba transferencias directas de TRX y dejaba fuera el TRX aparcado en staking (FreezeBalanceV2: 1.165 M el 15-jul-2023 y 200 M el 19-ago-2024) y en contratos (STRXProxy, JustLend jTRX: 2.051 M en 2024) y lo que volvió de ahí;
// el saldo implícito salía negativo. Aquí el libro incluye: transferencias, TRX congelado y recuperado (WithdrawExpireUnfreeze), recompensas (WithdrawBalance), depósitos en contratos (call_value) y devoluciones (transferencias internas del contrato a la cuenta).
// El TRX aparcado conserva su origen y su antigüedad al volver; lo que vuelve de MÁS (intereses, recompensas) se anota como origen «rendimiento». Tres modelos de salida: primero-en-entrar, último-en-entrar y reparto proporcional.
// SOLO LECTURA. Reproducible: REPRODUCIR=1 node f7-origen-en-twpmnuh9.cjs
const fs = require('node:fs'), path = require('node:path'); const L = require('./lib.cjs'); const C = require('./cadena.cjs'); const b58 = require('./b58.cjs'); L.usar('f7-2026-11-05');
const OUT = path.join(__dirname, 'f-fundacion'); const M = x => Math.round(x * 100) / 100; const iso = C.iso; const ANCLA = 1793870328000; const A = 'TWpMnUh9pZS1Mf8yyw9WPiS82WYevKzQo2'; const ZION = 'TLLM21wteSPs4hKjbxgmH1L6poyMjeTbHm'; const TG = 'https://api.trongrid.io';
(async () => {
  const tx = await C.txCuenta(A, { hasta: ANCLA }); const ev = []; const avisos = [];
  for (const r of tx.filas) {
    if (!r.ok) continue;
    if (r.tipo === 'Transfer' && r.trx > 0) ev.push({ t: r.t, tx: r.tx, k: r.a === A ? 'in' : 'out', otra: r.a === A ? r.de : r.a, trx: r.trx });
    else if (r.tipo === 'FreezeBalanceV2' && r.trx > 0) ev.push({ t: r.t, tx: r.tx, k: 'park', pool: 'staking', trx: r.trx });
    else if (r.tipo === 'TriggerSmart' || r.tipo === 'WithdrawExpireUnfreeze' || r.tipo === 'WithdrawBalance') {
      const inf = await L.post(TG + '/wallet/gettransactioninfobyid', { value: r.tx }).catch(() => ({}));
      if (r.tipo === 'TriggerSmart') {
        if (r.trx > 0) ev.push({ t: r.t, tx: r.tx, k: 'park', pool: 'contrato ' + r.a.slice(0, 8), trx: r.trx });
        for (const it of inf.internal_transactions || []) { if (it.rejected) continue; let to; try { to = b58(it.transferTo_address); } catch { continue; } if (to === A) { const v = (it.callValueInfo || []).reduce((s, c) => s + (c.callValue || 0), 0) / 1e6; if (v > 0) ev.push({ t: r.t, tx: r.tx, k: 'ret', pool: 'contrato ' + r.a.slice(0, 8), trx: v }); } }
      } else if (r.tipo === 'WithdrawExpireUnfreeze') { const v = (inf.withdraw_expire_amount || 0) / 1e6; if (v > 0) ev.push({ t: r.t, tx: r.tx, k: 'ret', pool: 'staking', trx: v }); else avisos.push('sin importe ' + r.tipo + ' ' + r.tx.slice(0, 10)); }
      else if (r.tipo === 'WithdrawBalance') { const v = (inf.withdraw_amount || 0) / 1e6; if (v > 0) ev.push({ t: r.t, tx: r.tx, k: 'rend', trx: v }); }
    }
  }
  ev.sort((a, b) => a.t - b.t || (a.k === 'in' ? -1 : 1)); const ent = ev.filter(e => e.k === 'in'), sal = ev.filter(e => e.k === 'out');
  const nom = o => o === ZION ? 'Zion (génesis)' : o;
  function simular(modelo) {
    const cartera = []; const parqueado = {}; const filas = []; let sinOrigen = 0;
    const tomar = (cant) => {
      const orig = []; let falta = cant;
      if (modelo === 'prop') { const tot = cartera.reduce((s, p) => s + p.resto, 0); const take = Math.min(falta, tot); if (tot > 0) for (const p of cartera) { const parte = take * p.resto / tot; if (parte > 0) { orig.push({ otra: p.otra, t: p.t, v: parte }); p.resto -= parte; } } falta -= take; }
      else { const orden = modelo === 'fifo' ? cartera : [...cartera].reverse(); for (const p of orden) { if (falta <= 1e-9) break; const k = Math.min(p.resto, falta); if (k > 0) { orig.push({ otra: p.otra, t: p.t, v: k }); p.resto -= k; falta -= k; } } }
      return { orig, falta: Math.max(0, falta) };
    };
    for (const e of ev) {
      if (e.k === 'in') cartera.push({ otra: e.otra, resto: e.trx, t: e.t });
      else if (e.k === 'rend') cartera.push({ otra: 'rendimiento (recompensas)', resto: e.trx, t: e.t });
      else if (e.k === 'park') { const r = tomar(e.trx); parqueado[e.pool] = parqueado[e.pool] || []; for (const o of r.orig) parqueado[e.pool].push({ ...o }); if (r.falta > 0) { sinOrigen += r.falta; parqueado[e.pool].push({ otra: 'SIN ORIGEN VISIBLE', t: e.t, v: r.falta }); } }
      else if (e.k === 'ret') { let falta = e.trx; const lotes = parqueado[e.pool] || []; while (falta > 1e-9 && lotes.length) { const l = lotes[0]; const k = Math.min(l.v, falta); cartera.push({ otra: l.otra, resto: k, t: l.t }); l.v -= k; falta -= k; if (l.v <= 1e-9) lotes.shift(); } if (falta > 1e-9) cartera.push({ otra: 'rendimiento (intereses)', resto: falta, t: e.t }); }
      else if (e.k === 'out') { const r = tomar(e.trx); const orig = {}; for (const o of r.orig) orig[o.otra] = (orig[o.otra] || 0) + o.v; if (r.falta > 0) { orig['SIN ORIGEN VISIBLE'] = r.falta; sinOrigen += r.falta; } filas.push({ tx: e.tx, t: e.t, a: e.otra, trx: e.trx, origen: orig }); }
    }
    return { filas, sin_origen_total: sinOrigen, en_cartera_al_corte: cartera.reduce((s, p) => s + p.resto, 0), parqueado_al_corte: Object.fromEntries(Object.entries(parqueado).map(([k, v]) => [k, v.reduce((s, l) => s + l.v, 0)])) };
  }
  const mod = { fifo: simular('fifo'), lifo: simular('lifo'), prop: simular('prop') };
  const interes = sal.filter(o => o.trx >= 100e6).map(o => { const f = m => { const r = mod[m].filas.find(x => x.tx === o.tx); const z = r.origen[ZION] || 0; return { zion_M: M(z / 1e6), porcentaje: M(100 * z / o.trx), sin_origen_visible_M: M((r.origen['SIN ORIGEN VISIBLE'] || 0) / 1e6), rendimiento_M: M(Object.entries(r.origen).filter(([k]) => /^rendimiento/.test(k)).reduce((s, [, v]) => s + v, 0) / 1e6) }; }; return { t: iso(o.t), a: o.otra, trx_M: M(o.trx / 1e6), tx: o.tx, fifo: f('fifo'), lifo: f('lifo'), proporcional: f('prop') }; });
  const resumen = { cuenta: A, version: 2, tx_leidas: tx.filas.length, truncada: !!tx.truncado, entradas_de_TRX_M: M(ent.reduce((s, e) => s + e.trx, 0) / 1e6), salidas_de_TRX_M: M(sal.reduce((s, e) => s + e.trx, 0) / 1e6), aparcado_en_staking_y_contratos_M: M(ev.filter(e => e.k === 'park').reduce((s, e) => s + e.trx, 0) / 1e6), devuelto_por_staking_y_contratos_M: M(ev.filter(e => e.k === 'ret').reduce((s, e) => s + e.trx, 0) / 1e6), recompensas_M: M(ev.filter(e => e.k === 'rend').reduce((s, e) => s + e.trx, 0) / 1e6), sin_origen_visible_total_M: { fifo: M(mod.fifo.sin_origen_total / 1e6), lifo: M(mod.lifo.sin_origen_total / 1e6), proporcional: M(mod.prop.sin_origen_total / 1e6) }, en_cartera_al_corte_M: M(mod.fifo.en_cartera_al_corte / 1e6), parqueado_al_corte_M: Object.fromEntries(Object.entries(mod.fifo.parqueado_al_corte).map(([k, v]) => [k, M(v / 1e6)])), avisos, entradas_de_100M_o_mas: ent.filter(e => e.trx >= 100e6).map(e => ({ t: iso(e.t), de: nom(e.otra), trx_M: M(e.trx / 1e6), tx: e.tx })), salidas_de_100M_o_mas: interes };
  const h = L.guardar(path.join(OUT, 'libro-twpmnuh9.json'), resumen);
  console.log('TWpMnUh9 v2: entra', resumen.entradas_de_TRX_M, 'M | sale', resumen.salidas_de_TRX_M, 'M | aparcado', resumen.aparcado_en_staking_y_contratos_M, 'M | devuelto', resumen.devuelto_por_staking_y_contratos_M, 'M | recompensas', resumen.recompensas_M, 'M | sin origen visible', JSON.stringify(resumen.sin_origen_visible_total_M), '| en cartera al corte', resumen.en_cartera_al_corte_M, '| parqueado', JSON.stringify(resumen.parqueado_al_corte_M), '| avisos', avisos.length);
  for (const s of interes) console.log('  ', s.t.slice(0, 10), s.a.slice(0, 8), String(s.trx_M).padStart(7) + ' M | Zion FIFO', s.fifo.zion_M, '(' + s.fifo.porcentaje + '%) sinOr', s.fifo.sin_origen_visible_M, '| LIFO', s.lifo.zion_M, '(' + s.lifo.porcentaje + '%) sinOr', s.lifo.sin_origen_visible_M, '| prop', s.proporcional.zion_M, '(' + s.proporcional.porcentaje + '%) sinOr', s.proporcional.sin_origen_visible_M);
  console.log(h, 'llamadas', L.metricas.llamadas);
})().catch(e => { console.error('ERROR', e.message, (e.stack || '').split('\n')[1]); process.exit(1); });
