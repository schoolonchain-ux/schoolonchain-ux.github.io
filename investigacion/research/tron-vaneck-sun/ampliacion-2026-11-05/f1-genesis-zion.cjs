'use strict';
// LÍNEA F · F1 — El origen de todo el TRX: el bloque 0 (génesis) y la cuenta que recibió los 99.000 M, «Zion» (TLLM21wt…). Historial COMPLETO de Zion hasta el corte del expediente:
// a quién repartió el TRX (sobre todo en 2018: ¿las «1.000 direcciones» bloqueadas de la TRON Foundation?), cuánto y cuándo. SOLO LECTURA. Reproducible: REPRODUCIR=1 node f1-genesis-zion.cjs
const fs = require('node:fs'), path = require('node:path'); const L = require('./lib.cjs'); const C = require('./cadena.cjs'); L.usar('f1-2026-11-05');
const OUT = path.join(__dirname, 'f-fundacion'); fs.mkdirSync(OUT, { recursive: true }); const M = x => Math.round(x * 100) / 100; const iso = C.iso; const ANCLA = 1793870328000; const ZION = 'TLLM21wteSPs4hKjbxgmH1L6poyMjeTbHm';
(async () => {
  const tx = await C.txCuenta(ZION, { hasta: ANCLA }); const filas = tx.filas.filter(r => r.ok);
  const tipos = {}; for (const r of filas) tipos[r.tipo] = (tipos[r.tipo] || 0) + 1;
  const sal = filas.filter(r => r.tipo === 'Transfer' && r.de === ZION); const ent = filas.filter(r => r.tipo === 'Transfer' && r.a === ZION);
  const porMonto = {}; for (const r of sal) { const k = String(Math.round(r.trx)); porMonto[k] = (porMonto[k] || 0) + 1; }
  const comunes = Object.entries(porMonto).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const porMes = {}; for (const r of sal) { const m = iso(r.t).slice(0, 7); const o = porMes[m] = porMes[m] || { n: 0, trx: 0 }; o.n++; o.trx += r.trx; }
  const dest = {}; for (const r of sal) { const o = dest[r.a] = dest[r.a] || { n: 0, trx: 0, primera: r.t }; o.n++; o.trx += r.trx; }
  const top = Object.entries(dest).sort((a, b) => b[1].trx - a[1].trx).slice(0, 40);
  const res = { cuenta: ZION, tx_leidas: tx.filas.length, truncada: !!tx.truncado, primera: iso(filas[0].t), ultima: iso(filas[filas.length - 1].t), tipos, transferencias_salientes: sal.length, trx_saliente_total: M(sal.reduce((s, r) => s + r.trx, 0)), transferencias_entrantes: ent.length, trx_entrante_total: M(ent.reduce((s, r) => s + r.trx, 0)), importes_mas_repetidos: comunes, por_mes: Object.fromEntries(Object.entries(porMes).sort().map(([k, v]) => [k, { n: v.n, trx: M(v.trx) }])), mayores_destinos: top.map(([a, v]) => ({ cuenta: a, n: v.n, trx: M(v.trx), primera: iso(v.primera) })), destinos_distintos: Object.keys(dest).length };
  const h = L.guardar(path.join(OUT, 'zion.json'), res);
  console.log('Zion: tx', res.tx_leidas, 'truncada', res.truncada, '|', res.primera, '→', res.ultima, '| tipos', JSON.stringify(tipos)); console.log('salidas', res.transferencias_salientes, M(res.trx_saliente_total / 1e9) + ' B TRX | entradas', res.transferencias_entrantes, M(res.trx_entrante_total / 1e9) + ' B | destinos distintos', res.destinos_distintos); console.log('importes más repetidos (TRX redondeado: veces):', JSON.stringify(comunes)); console.log('por mes:', JSON.stringify(res.por_mes).slice(0, 900));
  for (const d of res.mayores_destinos.slice(0, 15)) console.log('  ', d.cuenta, 'n', d.n, M(d.trx / 1e6) + ' M', d.primera.slice(0, 10)); console.log(h, 'llamadas', L.metricas.llamadas);
})().catch(e => { console.error('ERROR', e.message, (e.stack || '').split('\n')[1]); process.exit(1); });
