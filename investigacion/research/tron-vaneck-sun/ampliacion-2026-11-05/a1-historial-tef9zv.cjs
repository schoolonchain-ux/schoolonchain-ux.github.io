'use strict';
// LÍNEA A · A1 — Historial completo de la cuenta de energía TEF9ZV… y REPETICIÓN (replay) de sus delegaciones.
// Control de cierre: el resultado del replay hasta el instante de la línea base debe igualar linea-base/delegaciones.json.
// SOLO LECTURA. Reproducible: REPRODUCIR=1 node a1-historial-tef9zv.cjs (usa raw/a1-2026-11-05/).
const fs = require('node:fs'), path = require('node:path'); const L = require('./lib.cjs'); const C = require('./cadena.cjs');
L.usar('a1-2026-11-05'); const OUT = path.join(__dirname, 'a1-tef9zv'); const TEF = 'TEF9ZVUxhmGGffvkf59e2vdLfAG1QCMb7B';
const ancla = JSON.parse(fs.readFileSync(path.join(__dirname, 'linea-base', 'anclas.json'), 'utf8')); const tAncla = Date.parse(ancla.bloque_hora_utc);
const base = JSON.parse(fs.readFileSync(path.join(__dirname, 'linea-base', 'delegaciones.json'), 'utf8'))['Cuenta de energia (TEF9ZV)'];
(async () => {
  const { filas, paginas } = await C.txCuenta(TEF, { desde: 0, hasta: tAncla + 3600e3 });   // hasta 1 h después del ancla; el replay corta en el ancla
  const ev = filas.filter(f => f.t <= tAncla), despues = filas.filter(f => f.t > tAncla);
  const porTipo = {}, fallidas = []; for (const f of ev) { porTipo[f.tipo] = (porTipo[f.tipo] || 0) + 1; if (!f.ok) fallidas.push(f.tx); }
  // Replay de delegaciones (solo transacciones con resultado SUCCESS)
  const est = {}; const k = (r, rec) => r + '|' + rec; const serie = [];
  for (const f of ev) {
    if (!f.ok) continue;
    if (f.tipo === 'DelegateResource') est[k(f.a, f.recurso)] = (est[k(f.a, f.recurso)] || 0) + f.trx;
    else if (f.tipo === 'UnDelegateResource') est[k(f.a, f.recurso)] = (est[k(f.a, f.recurso)] || 0) - f.trx;
    else continue;
    const tot = Object.values(est).reduce((s, v) => s + v, 0); serie.push({ t: C.iso(f.t), tx: f.tx, tipo: f.tipo, receptor: f.a, recurso: f.recurso, trx: f.trx, total_delegado_tras: Math.round(tot * 1e6) / 1e6 });
  }
  // Comparación con la cadena en el ancla
  const real = {}; for (const r of base.receptores) { if (r.energia) real[k(r.receptor, 'ENERGY')] = r.energia; if (r.ancho_banda) real[k(r.receptor, 'BANDWIDTH')] = r.ancho_banda; }
  const claves = new Set([...Object.keys(est).filter(x => Math.abs(est[x]) > 1e-6), ...Object.keys(real)]); const dif = [];
  for (const x of claves) { const a = est[x] || 0, b = real[x] || 0; if (Math.abs(a - b) > 0.5) dif.push({ receptor_recurso: x, replay: a, cadena: b, diferencia: Math.round((a - b) * 1e6) / 1e6 }); }
  const totReplay = Object.values(est).reduce((s, v) => s + v, 0), totReal = base.total_energia + base.total_ancho_banda;
  // Entradas y salidas de TRX
  const entradas = ev.filter(f => f.tipo === 'Transfer' && f.ok && f.a === TEF), salidas = ev.filter(f => f.tipo === 'Transfer' && f.ok && f.de === TEF);
  const congelaciones = ev.filter(f => f.tipo === 'FreezeBalanceV2' && f.ok).map(f => ({ t: C.iso(f.t), tx: f.tx, trx: f.trx, recurso: f.recurso })); const descongelaciones = ev.filter(f => f.tipo === 'UnfreezeBalanceV2').map(f => ({ t: C.iso(f.t), tx: f.tx, trx: f.trx, recurso: f.recurso, ok: f.ok }));
  const resultado = {
    ancla: ancla.bloque_hora_utc, paginas_leidas: paginas, transacciones_hasta_ancla: ev.length, transacciones_posteriores_al_ancla: despues.length, por_tipo: porTipo, fallidas: fallidas.length,
    CIERRE: { total_replay_trx: Math.round(totReplay * 1e6) / 1e6, total_cadena_trx: Math.round(totReal * 1e6) / 1e6, diferencia_trx: Math.round((totReplay - totReal) * 1e6) / 1e6, receptores_con_diferencia: dif.length, cuadra: dif.length === 0 && Math.abs(totReplay - totReal) < 0.5, diferencias: dif.slice(0, 30) },
    entradas_trx: entradas.map(f => ({ t: C.iso(f.t), tx: f.tx, de: f.de, trx: f.trx })), salidas_trx: salidas.map(f => ({ t: C.iso(f.t), tx: f.tx, a: f.a, trx: f.trx })),
    total_entradas_trx: entradas.reduce((s, f) => s + f.trx, 0), total_salidas_trx: salidas.reduce((s, f) => s + f.trx, 0), congelaciones, descongelaciones
  };
  const h = {}; h['eventos.json'] = L.guardar(path.join(OUT, 'eventos.json'), filas); h['serie-delegaciones.json'] = L.guardar(path.join(OUT, 'serie-delegaciones.json'), serie); h['resumen-y-cierre.json'] = L.guardar(path.join(OUT, 'resumen-y-cierre.json'), resultado);
  console.log('páginas', paginas, '| tx hasta el ancla', ev.length, '| posteriores', despues.length, '| tipos', JSON.stringify(porTipo), '| fallidas', fallidas.length);
  console.log('CIERRE replay', resultado.CIERRE.total_replay_trx.toLocaleString('es-ES'), 'vs cadena', resultado.CIERRE.total_cadena_trx.toLocaleString('es-ES'), '→ diferencia', resultado.CIERRE.diferencia_trx, '| receptores con diferencia', dif.length, '| CUADRA:', resultado.CIERRE.cuadra);
  if (dif.length) console.log(JSON.stringify(dif.slice(0, 8), null, 1));
  console.log('entradas TRX', entradas.length, 'total', resultado.total_entradas_trx.toLocaleString('es-ES'), '| salidas', salidas.length, 'total', resultado.total_salidas_trx.toLocaleString('es-ES'));
  console.log(JSON.stringify(h, null, 1)); console.log('llamadas', L.metricas.llamadas, 'red', L.metricas.red, 'ms/llamada', Math.round(L.metricas.ms / Math.max(1, L.metricas.red)));
})().catch(e => { console.error('ERROR', e.message); process.exit(1); });
