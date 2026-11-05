'use strict';
// FASE 0.4 — Medir cuánto cuesta leer el historial de la proveedora TWhDfwC8… (~1,8 M de operaciones): filas por hora en fechas de muestra,
// tiempo por página y tolerancia de la API. Es una MEDICIÓN y una ESTIMACIÓN (se declara: la densidad no es uniforme dentro del día).
// SOLO LECTURA. Reproducible: REPRODUCIR=1 node f0-4-medir-lectura.cjs
const fs = require('node:fs'), path = require('node:path'); const L = require('./lib.cjs'); const C = require('./cadena.cjs');
L.usar('f0-4-2026-11-05'); const OUT = path.join(__dirname, 'f0-4-medicion'); const PROV = 'TWhDfwC8QE6pQyiYy248dNor3uphPEw5M2';
const MUESTRAS = ['2023-12-15', '2024-06-15', '2025-01-15', '2025-09-15', '2026-03-15', '2026-10-15', '2026-11-03'];
(async () => {
  const filas = []; const h = 3600e3;
  for (const d of MUESTRAS) {
    const t0 = Date.parse(d + 'T12:00:00Z'); const a = Date.now(); const tx = await C.txCuenta(PROV, { desde: t0, hasta: t0 + h }); const b = Date.now(); const tk = await C.trc20Cuenta(PROV, { desde: t0, hasta: t0 + h }); const c = Date.now();
    const tipos = tx.filas.reduce((o, f) => { o[f.tipo] = (o[f.tipo] || 0) + 1; return o; }, {});
    filas.push({ muestra: d + ' 12:00-13:00 UTC', filas_transacciones: tx.filas.length, paginas_tx: tx.paginas, ms_tx: b - a, filas_trc20: tk.filas.length, paginas_trc20: tk.paginas, ms_trc20: c - b, tipos_tx: tipos });
    console.log(d, '| tx', tx.filas.length, '(' + tx.paginas + ' pág)', '| trc20', tk.filas.length, '(' + tk.paginas + ' pág)', '|', JSON.stringify(tipos));
  }
  // Estimación: el historial cubre 2023-11-28 → hoy. Interpolación lineal de filas/hora entre muestras (declarada como estimación).
  const dias = i => Date.parse(MUESTRAS[i] + 'T12:00:00Z') / 864e5; let totTx = 0, totTk = 0;
  for (let i = 0; i < MUESTRAS.length - 1; i++) { const n = dias(i + 1) - dias(i); totTx += n * 24 * (filas[i].filas_transacciones + filas[i + 1].filas_transacciones) / 2; totTk += n * 24 * (filas[i].filas_trc20 + filas[i + 1].filas_trc20) / 2; }
  const seg = (Date.now() - 0, 1); const msPag = Math.round(L.metricas.ms / Math.max(1, L.metricas.red)); const pausa = 350;
  const est = { metodo: 'filas por hora medidas a las 12:00 UTC de 7 fechas, interpoladas linealmente y multiplicadas por 24; NO es un recuento', filas_tx_estimadas: Math.round(totTx), filas_trc20_estimadas: Math.round(totTk), paginas_estimadas: Math.round((totTx + totTk) / 200), ms_por_pagina_medido: msPag, pausa_ms: pausa, horas_estimadas_lectura_completa: Math.round(((totTx + totTk) / 200) * (msPag + pausa) / 36e5 * 10) / 10 };
  // Tolerancia: 30 llamadas seguidas con pausa corta a un punto barato
  let r429 = 0; const rr0 = L.metricas.reintentos; const t0 = Date.now(); for (let i = 0; i < 30; i++) { await L.post('https://api.trongrid.io/wallet/getaccount', { address: 'TEF9ZVUxhmGGffvkf59e2vdLfAG1QCMb7B', visible: true, _n: i }, { pausa: 60 }); }
  const tol = { llamadas: 30, pausa_ms: 60, reintentos_provocados: L.metricas.reintentos - rr0, ms_totales: Date.now() - t0 };
  const hs = {}; hs['muestras.json'] = L.guardar(path.join(OUT, 'muestras.json'), filas); hs['estimacion-y-tolerancia.json'] = L.guardar(path.join(OUT, 'estimacion-y-tolerancia.json'), { estimacion: est, tolerancia: tol });
  console.log(JSON.stringify(est, null, 1)); console.log(JSON.stringify(tol)); console.log(JSON.stringify(hs, null, 1));
})().catch(e => { console.error('ERROR', e.message); process.exit(1); });
