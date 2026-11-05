'use strict';
// LÍNEA A · A7 — Energía: delegada ≠ disponible ≠ consumida ≠ ahorrada (mejora A del propietario). Cinco medidas por receptor:
//  1. DELEGADA por TEF9ZV (TRX, línea base)          2. DISPONIBLE (EnergyLimit que da la red hoy; 1 TRX delegado = TotalEnergyLimit/TotalEnergyWeight energía/día)
//  3. CONSUMIDA en las 24 h anteriores a la línea base (suma de las transacciones propias: energía cubierta por stake y TRX quemado)
//  4. POR TRANSACCIÓN (mínimo, mediana, p90, máximo y contrato llamado)        5. LO QUE HABRÍA PAGADO sin delegación (energía total × precio de la energía) y la parte atribuible a TEF9ZV (MODELO).
// SOLO LECTURA. Reproducible: REPRODUCIR=1 node a7-energia.cjs (usa raw/a7-2026-11-05/).
const fs = require('node:fs'), path = require('node:path'); const L = require('./lib.cjs'); const C = require('./cadena.cjs'); const b58 = require('./b58.cjs');
L.usar('a7-2026-11-05'); const OUT = path.join(__dirname, 'a7-energia'); const TG = 'https://api.trongrid.io'; const M = x => Math.round(x * 100) / 100;
const rd = (...p) => JSON.parse(fs.readFileSync(path.join(__dirname, ...p), 'utf8')); const rec = rd('a2-a4-a5', 'receptores-81.json'), anclas = rd('linea-base', 'anclas.json'), cuentas = rd('linea-base', 'cuentas.json'), par = rd('linea-base', 'parametros-red.json');
const tAncla = Date.parse(anclas.bloque_hora_utc); const tef = cuentas.find(c => c.nombre.startsWith('Cuenta de energia')).energia; const TEL = tef.limite_total_red, TEW = tef.peso_total_red; const PRECIO = Number(par.getEnergyFee) / 1e6;   // TRX por unidad de energía
const ENERGIA_POR_TRX_DIA = TEL / TEW; const NUEVAS = 'Binance — billeteras nuevas (creadas tras el robo)';
const pct = (a, p) => a.length ? a.slice().sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(p * a.length))] : null;
(async () => {
  // --- Todos los receptores: disponible y uso aparente (instantáneo)
  const todos = [];
  for (const r of rec) {
    const res = await L.post(TG + '/wallet/getaccountresource', { address: r.receptor, visible: true }); const a = await L.post(TG + '/wallet/getaccount', { address: r.receptor, visible: true });
    const adq = (a.account_resource && a.account_resource.acquired_delegated_frozenV2_balance_for_energy || 0) / 1e6; const propio = ((a.frozenV2 || []).filter(f => f.type === 'ENERGY').reduce((s, f) => s + (f.amount || 0), 0)) / 1e6;
    const limite = res.EnergyLimit || 0, usado = res.EnergyUsed || 0;
    todos.push({ receptor: r.receptor, familia: r.familia, delegada_por_TEF9ZV_trx_energia: r.energia, energia_recibida_en_delegacion_trx_de_todos: M(adq), energia_propia_trx: M(propio), parte_de_TEF9ZV_en_lo_recibido: adq > 0 ? M(r.energia / adq) : null, energia_disponible_al_dia: limite, capacidad_teorica_de_lo_delegado_por_TEF9ZV: Math.round(r.energia * ENERGIA_POR_TRX_DIA), energia_usada_en_la_ventana_de_24h_de_la_red: usado, uso_aparente: limite ? M(usado / limite) : null });
  }
  // --- Consumo real: transacciones propias de las últimas 24 h, para las billeteras de Binance nuevas, Bybit, GasFree y el receptor sin identificar
  const objetivo = rec.filter(r => r.familia === NUEVAS || r.familia === 'Bybit' || r.familia === 'GasFree' || r.receptor === 'TU3rMHyWHzeEJBReWLzHko728hbz6MtfNg'); const consumo = [];
  for (const r of objetivo) {
    const w = await C.txCuenta(r.receptor, { desde: tAncla - 24 * 3600e3, hasta: tAncla, energia: true, maxPaginas: 600 }); const propias = w.filas.filter(f => f.de === r.receptor && f.ok); const fallidas = w.filas.filter(f => f.de === r.receptor && !f.ok).length;
    const tr = propias.filter(f => f.tipo === 'TriggerSmart'); /* cadena.cjs quita el sufijo «Contract» del tipo */ const tot = a => a.reduce((s, f) => s + f.e.total, 0), uso = a => a.reduce((s, f) => s + f.e.uso, 0), fee = a => a.reduce((s, f) => s + f.e.fee, 0);
    const porTx = tr.map(f => f.e.total).filter(x => x > 0); const contratos = {}; for (const f of tr) { const c = contratos[f.a] = contratos[f.a] || { n: 0, energia: 0 }; c.n++; c.energia += f.e.total; }
    const cuenta = todos.find(x => x.receptor === r.receptor); const parte = cuenta.parte_de_TEF9ZV_en_lo_recibido; const energiaTotal = tot(propias), cubierta = uso(propias), quemadaTRX = fee(propias) / 1e6;
    consumo.push({ receptor: r.receptor, familia: r.familia, lectura: { tx_leidas_en_pagina: w.filas.length, paginas: w.paginas, parcial_por_limite_de_paginas: w.truncado, ventana: [new Date(tAncla - 24 * 3600e3).toISOString(), anclas.bloque_hora_utc] },
      transacciones_propias_ok: propias.length, fallidas, llamadas_a_contratos: tr.length, energia_total_consumida: energiaTotal, energia_cubierta_por_stake: cubierta, energia_pagada_quemando_trx: energiaTotal - cubierta, trx_quemados_por_energia: M(quemadaTRX), trx_quemados_por_ancho_de_banda: M(propias.reduce((s, f) => s + f.e.red_fee, 0) / 1e6),
      por_transaccion: { n: porTx.length, minimo: porTx.length ? Math.min(...porTx) : null, mediana: pct(porTx, 0.5), p90: pct(porTx, 0.9), maximo: porTx.length ? Math.max(...porTx) : null }, contratos_llamados: Object.entries(contratos).sort((a, b) => b[1].energia - a[1].energia).slice(0, 4).map(([c, v]) => ({ contrato: c, n: v.n, energia_media: Math.round(v.energia / v.n) })),
      trx_que_habria_pagado_sin_ninguna_delegacion: M(energiaTotal * PRECIO), trx_ahorrados_por_energia_cubierta_por_stake: M(cubierta * PRECIO), parte_de_TEF9ZV_en_la_energia_recibida: parte, trx_ahorrados_atribuibles_a_TEF9ZV_MODELO: parte != null ? M(cubierta * PRECIO * parte) : null });
  }
  const sum = (a, k) => a.reduce((s, x) => s + (x[k] || 0), 0); const nuevas = consumo.filter(c => c.familia === NUEVAS); const tn = todos.filter(t => t.familia === NUEVAS);
  const resumen = { parametros: { energia_por_TRX_y_dia: M(ENERGIA_POR_TRX_DIA), precio_energia_trx_por_unidad: PRECIO, TotalEnergyLimit: TEL, TotalEnergyWeight: TEW },
    binance_nuevas: { billeteras: tn.length, delegada_por_TEF9ZV_trx: M(sum(tn, 'delegada_por_TEF9ZV_trx_energia')), disponible_al_dia: sum(tn, 'energia_disponible_al_dia'), capacidad_teorica_de_TEF9ZV_al_dia: sum(tn, 'capacidad_teorica_de_lo_delegado_por_TEF9ZV'), consumida_24h: sum(nuevas, 'energia_total_consumida'), cubierta_por_stake_24h: sum(nuevas, 'energia_cubierta_por_stake'), pagada_quemando_trx_24h: sum(nuevas, 'energia_pagada_quemando_trx'), trx_quemados_24h: M(sum(nuevas, 'trx_quemados_por_energia')), trx_ahorrados_por_stake_24h: M(sum(nuevas, 'trx_ahorrados_por_energia_cubierta_por_stake')), trx_ahorrados_atribuibles_a_TEF9ZV_24h_MODELO: M(sum(nuevas, 'trx_ahorrados_atribuibles_a_TEF9ZV_MODELO')), parcial: nuevas.some(c => c.lectura.parcial_por_limite_de_paginas) } };
  const h = {}; h['por-receptor-81.json'] = L.guardar(path.join(OUT, 'por-receptor-81.json'), todos); h['consumo-24h.json'] = L.guardar(path.join(OUT, 'consumo-24h.json'), consumo); h['resumen.json'] = L.guardar(path.join(OUT, 'resumen.json'), resumen);
  console.log('1 TRX delegado = ' + M(ENERGIA_POR_TRX_DIA) + ' energía/día · precio de la energía ' + PRECIO + ' TRX/unidad'); console.log(JSON.stringify(resumen.binance_nuevas, null, 1));
  for (const c of consumo) console.log(c.receptor.slice(0, 10), c.familia.slice(0, 22).padEnd(22), '| deleg.TEF', M(rec.find(r => r.receptor === c.receptor).energia / 1e6) + 'M', '| disponible/día', M(todos.find(t => t.receptor === c.receptor).energia_disponible_al_dia / 1e6) + 'M', '| consumida 24h', M(c.energia_total_consumida / 1e6) + 'M', '| cubierta', M(c.energia_cubierta_por_stake / 1e6) + 'M', '| quemada', M(c.energia_pagada_quemando_trx / 1e6) + 'M (' + c.trx_quemados_por_energia + ' TRX)', '| tx', c.llamadas_a_contratos, '| por tx mediana', c.por_transaccion.mediana, 'p90', c.por_transaccion.p90, '| parte TEF', c.parte_de_TEF9ZV_en_la_energia_recibida, c.lectura.parcial_por_limite_de_paginas ? '| PARCIAL' : '');
  console.log('uso aparente (EnergyUsed/EnergyLimit) de los 81:', JSON.stringify(todos.slice().sort((a, b) => b.delegada_por_TEF9ZV_trx_energia - a.delegada_por_TEF9ZV_trx_energia).slice(0, 12).map(t => [t.receptor.slice(0, 8), t.familia.slice(0, 12), t.uso_aparente])));
  console.log(JSON.stringify(h, null, 1)); console.log('llamadas', L.metricas.llamadas, 'red', L.metricas.red, 'reintentos', L.metricas.reintentos);
})().catch(e => { console.error('ERROR', e.message, (e.stack || '').split('\n')[1]); process.exit(1); });
