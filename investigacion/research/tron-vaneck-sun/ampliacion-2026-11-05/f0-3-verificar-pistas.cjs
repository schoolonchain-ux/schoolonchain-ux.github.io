'use strict';
// FASE 0.3 — Verificar por hash las pistas de la relectura: ¿el TRX que entra en la cuenta de energía (TEF9ZV) viene de la segunda cuenta
// (TT2T17) pasando por billeteras de un día y por HTX 4 / la proveedora? SOLO LECTURA. Reproducible: REPRODUCIR=1 node f0-3-verificar-pistas.cjs
const fs = require('node:fs'), path = require('node:path'); const L = require('./lib.cjs'); const C = require('./cadena.cjs');
L.usar('f0-3-2026-11-05'); const OUT = path.join(__dirname, 'f0-3-pistas');
const TEF = 'TEF9ZVUxhmGGffvkf59e2vdLfAG1QCMb7B', TT2 = 'TT2T17KZhoDu47i2E4FWxfG79zdkEWkU9N', HTX4 = 'TFTWNgDBkQ5wQoP8RXpRznnHvAVV8x5jLu', PROV = 'TWhDfwC8QE6pQyiYy248dNor3uphPEw5M2', TPY = 'TPyjyZfsYaXStgz2NmAraF1uZcMtkgNan5', TYL = 'TYL7z7VSVRShLoJ6YRQMA4t9pSECt9ZLmz';
const NOM = { [TEF]: 'cuenta de energía TEF9ZV', [TT2]: 'segunda cuenta TT2T17', [HTX4]: 'HTX 4', [PROV]: 'proveedora TWhDfwC8', [TPY]: 'financiadora TPyjyZ', [TYL]: 'TYL7z7VS (2022)' };
const nom = a => NOM[a] || a; const M = x => Math.round(x * 100) / 100;
const a1 = JSON.parse(fs.readFileSync(path.join(__dirname, 'a1-tef9zv', 'resumen-y-cierre.json'), 'utf8')); const ancla = Date.parse(JSON.parse(fs.readFileSync(path.join(__dirname, 'linea-base', 'anclas.json'), 'utf8')).bloque_hora_utc);
(async () => {
  // 1) Todas las entradas de TRX de TEF9ZV, con su remitente
  const entradas = a1.entradas_trx.filter(e => e.trx >= 1e6).map(e => ({ ...e, de_nombre: nom(e.de) })); const polvo = a1.entradas_trx.filter(e => e.trx < 1e6);   // < 1 M TRX = polvo/publicidad; se cuenta aparte
  // 2) Todo lo que TT2T17 envía (≥ 10 M TRX) desde 2025-10-01
  const tt = await C.txCuenta(TT2, { desde: Date.UTC(2025, 9, 1), hasta: ancla });
  const sale = tt.filas.filter(f => f.tipo === 'Transfer' && f.ok && f.de === TT2 && f.trx >= 10e6);
  // 3) Para cada envío, seguir el primer reenvío ≥ 10 M de la billetera receptora en las 72 h siguientes
  const cadenas = [];
  for (const s of sale) {
    const w = await C.txCuenta(s.a, { desde: s.t, hasta: Math.min(ancla, s.t + 72 * 3600e3) }); const reenvios = w.filas.filter(f => f.tipo === 'Transfer' && f.ok && f.de === s.a && f.trx >= 10e6);
    const r1 = reenvios[0] || null; cadenas.push({ fecha: C.iso(s.t), tt2t17_a_puente: { tx: s.tx, a: s.a, trx: s.trx }, puente_actividad_72h: { n_tx: w.filas.length, reenvios_ge_10M: reenvios.map(r => ({ t: C.iso(r.t), tx: r.tx, a: r.a, a_nombre: nom(r.a), trx: r.trx })) }, primer_destino: r1 ? { a: r1.a, nombre: nom(r1.a), trx: r1.trx, tx: r1.tx, t: C.iso(r1.t), minutos_desde_el_envio: M((r1.t - s.t) / 60e3) } : null });
  }
  // 4) Cruce por día: lo que HTX 4 / la proveedora meten en TEF9ZV frente a lo que TT2T17 mandó ese día a HTX 4 / la proveedora (por la billetera de un día)
  const dia = ms => new Date(ms).toISOString().slice(0, 10); const porDia = {};
  for (const e of entradas) { const d = e.t.slice(0, 10); (porDia[d] = porDia[d] || { entradas_TEF: [], envios_TT2T17: [] }).entradas_TEF.push({ t: e.t, de: e.de_nombre, trx: e.trx, tx: e.tx }); }
  for (const c of cadenas) { const d = c.fecha.slice(0, 10); (porDia[d] = porDia[d] || { entradas_TEF: [], envios_TT2T17: [] }).envios_TT2T17.push({ t: c.fecha, a_puente: c.tt2t17_a_puente.a, trx: c.tt2t17_a_puente.trx, tx_envio: c.tt2t17_a_puente.tx, destino_final_1er_salto: c.primer_destino ? c.primer_destino.nombre : '(sin reenvío ≥10M en 72 h)', tx_reenvio: c.primer_destino && c.primer_destino.tx, t_reenvio: c.primer_destino && c.primer_destino.t }); }
  const tabla = Object.keys(porDia).sort().map(d => { const x = porDia[d]; const eT = x.entradas_TEF.reduce((s, y) => s + y.trx, 0), eS = x.envios_TT2T17.filter(y => /HTX 4|proveedora/.test(y.destino_final_1er_salto)).reduce((s, y) => s + y.trx, 0); const fw = x.envios_TT2T17.filter(y => y.t_reenvio && /HTX 4|proveedora/.test(y.destino_final_1er_salto)).map(y => Date.parse(y.t_reenvio)).sort((p, q) => p - q)[0]; const pr = fw ? x.entradas_TEF.map(y => Date.parse(y.t)).filter(t => t >= fw).sort((p, q) => p - q)[0] : null; return { dia: d, minutos_desde_el_reenvio_hasta_la_1a_entrada_en_TEF9ZV: pr ? M((pr - fw) / 60e3) : null, entra_en_TEF9ZV: M(eT), de_quien: [...new Set(x.entradas_TEF.map(y => y.de))].join(' + '), TT2T17_mando_a_HTX4_o_proveedora_ese_dia: M(eS), diferencia: M(eT - eS), detalle: x }; }).filter(x => x.entra_en_TEF9ZV > 0 || x.TT2T17_mando_a_HTX4_o_proveedora_ese_dia > 0);
  const totales = { entradas_totales_TEF9ZV: M(entradas.reduce((s, e) => s + e.trx, 0)), por_remitente: Object.fromEntries(Object.entries(entradas.reduce((o, e) => { o[e.de_nombre] = (o[e.de_nombre] || 0) + e.trx; return o; }, {})).map(([k, v]) => [k, M(v)])), entradas_menores_de_1M_ignoradas_como_polvo: { n: polvo.length, trx: M(polvo.reduce((s, e) => s + e.trx, 0)) }, envios_TT2T17_ge10M_desde_2025_10: sale.length, paginas_TT2T17: tt.paginas };
  const h = {}; h['entradas-tef9zv.json'] = L.guardar(path.join(OUT, 'entradas-tef9zv.json'), entradas); h['envios-tt2t17-y-primer-reenvio.json'] = L.guardar(path.join(OUT, 'envios-tt2t17-y-primer-reenvio.json'), cadenas); h['cruce-por-dia.json'] = L.guardar(path.join(OUT, 'cruce-por-dia.json'), { totales, tabla });
  console.log(JSON.stringify(totales, null, 1)); console.log('Envíos de TT2T17 ≥10 M desde oct-2025:', sale.length);
  for (const c of cadenas) console.log(c.fecha.slice(0, 16), 'TT2T17 →', c.tt2t17_a_puente.a.slice(0, 8), M(c.tt2t17_a_puente.trx / 1e6) + ' M', '→', c.primer_destino ? c.primer_destino.nombre + ' ' + M(c.primer_destino.trx / 1e6) + ' M (+' + c.primer_destino.minutos_desde_el_envio + ' min)' : '(sin reenvío en 72h)');
  console.log('\nCruce por día (M TRX):'); for (const t of tabla) console.log(t.dia, 'entra en TEF9ZV', M(t.entra_en_TEF9ZV / 1e6), 'de', t.de_quien, '| TT2T17 mandó a HTX4/proveedora', M(t.TT2T17_mando_a_HTX4_o_proveedora_ese_dia / 1e6), '| dif', M(t.diferencia / 1e6), '| min hasta 1ª entrada', t.minutos_desde_el_reenvio_hasta_la_1a_entrada_en_TEF9ZV);
  console.log(JSON.stringify(h, null, 1)); console.log('llamadas', L.metricas.llamadas, 'red', L.metricas.red, 'ms/llamada', Math.round(L.metricas.ms / Math.max(1, L.metricas.red)));
})().catch(e => { console.error('ERROR', e.message); process.exit(1); });
