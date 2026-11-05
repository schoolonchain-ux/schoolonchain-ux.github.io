'use strict';
// LÍNEA A · A6c — (1) Comprobar con HTX 4 los días 30-oct-2025, 12-nov-2025 y 21-mar-2026 como se hizo con mayo-2026 (¿HTX 4 reenvió esos importes a TEF9ZV
// minutos después de que llegaran los de la segunda cuenta?). (2) Un salto más hacia atrás de los depositantes desconocidos. SOLO LECTURA.
// Reproducible: REPRODUCIR=1 node a6c-verificar-y-un-salto-mas.cjs (usa raw/a6c-2026-11-05/).
const fs = require('node:fs'), path = require('node:path'); const L = require('./lib.cjs'); const C = require('./cadena.cjs');
L.usar('a6c-2026-11-05'); const OUT = path.join(__dirname, 'a6-origen'); const TG = 'https://api.trongrid.io', TS = 'https://apilist.tronscanapi.com/api';
const HTX4 = 'TFTWNgDBkQ5wQoP8RXpRznnHvAVV8x5jLu', TEF = 'TEF9ZVUxhmGGffvkf59e2vdLfAG1QCMb7B', PROV = 'TWhDfwC8QE6pQyiYy248dNor3uphPEw5M2'; const M = x => Math.round(x * 100) / 100;
const ent = JSON.parse(fs.readFileSync(path.join(__dirname, 'f0-3-pistas', 'entradas-tef9zv.json'), 'utf8')); const prev = JSON.parse(fs.readFileSync(path.join(__dirname, 'a6-origen', 'origen-entradas-sin-pareja.json'), 'utf8'));
const ancla = Date.parse(JSON.parse(fs.readFileSync(path.join(__dirname, 'linea-base', 'anclas.json'), 'utf8')).bloque_hora_utc);
async function info(dir) { const a = await L.post(TG + '/wallet/getaccount', { address: dir, visible: true }); let t = {}; try { t = await L.get(TS + '/accountv2?address=' + dir); } catch { t = {}; } return { direccion: dir, etiqueta: t.publicTag || t.addressTag || null, creada: a.create_time ? new Date(a.create_time).toISOString().slice(0, 10) : null, n_tx_tronscan: t.totalTransactionCount || null, trx_libre: M((a.balance || 0) / 1e6) }; }
(async () => {
  // (1) días con pareja por día en la tabla de 0.3
  const dias = ['2025-10-30', '2025-11-12', '2026-03-21']; const comp = [];
  for (const d of dias) {
    const ins = ent.filter(e => e.t.slice(0, 10) === d && e.de === HTX4); const t1 = Date.parse(ins[ins.length - 1].t), t0 = Date.parse(ins[0].t) - 3 * 3600e3; const w = await C.txCuenta(HTX4, { desde: t0, hasta: t1 }); const tr = w.filas.filter(f => f.tipo === 'Transfer' && f.ok && f.trx >= 10e6);
    comp.push({ dia: d, entradas_a_TEF9ZV: ins.map(e => ({ t: e.t, trx: e.trx, tx: e.tx })), tx_leidas_HTX4: w.filas.length, entra_en_HTX4_ge10M: tr.filter(f => f.a === HTX4).map(f => ({ t: C.iso(f.t), de: f.de, trx: f.trx, tx: f.tx })), sale_de_HTX4_ge10M: tr.filter(f => f.de === HTX4).map(f => ({ t: C.iso(f.t), a: f.a, trx: f.trx, tx: f.tx })) });
  }
  // proveedora el 20-oct-2026 (ruta directa TT2T17 → puente → proveedora → TEF9ZV)
  const e20 = ent.find(e => e.tx.startsWith('ec9520b9f4')); const tp1 = Date.parse(e20.t), tp0 = tp1 - 3 * 3600e3; const wp = await C.txCuenta(PROV, { desde: tp0, hasta: tp1 }); const trp = wp.filas.filter(f => f.tipo === 'Transfer' && f.ok && f.trx >= 10e6);
  const prov20 = { entrada_a_TEF9ZV: { t: e20.t, trx: e20.trx, tx: e20.tx }, tx_leidas_proveedora: wp.filas.length, entra_ge10M: trp.filter(f => f.a === PROV).map(f => ({ t: C.iso(f.t), de: f.de, trx: f.trx, tx: f.tx })), sale_ge10M: trp.filter(f => f.de === PROV).map(f => ({ t: C.iso(f.t), a: f.a, trx: f.trx, tx: f.tx })) };
  // (2) depositantes desconocidos (direcciones completas sacadas de la lectura anterior) y un salto atrás
  const htx = prev.htx4; const cand = new Map(); const nota = {};
  for (const c of htx) for (const e of c.entradas_ge10M_a_HTX4) cand.set(e.de, { visto: c.dia + ' ' + e.t.slice(11, 16) + ' ' + M(e.trx / 1e6) + ' M', tx: e.tx, t: Date.parse(e.t) });
  for (const c of htx) for (const e of c.salidas_ge10M_de_HTX4) if (e.a !== TEF) cand.set(e.a, { visto: 'RECIBE de HTX 4 ' + c.dia + ' ' + e.t.slice(11, 16) + ' ' + M(e.trx / 1e6) + ' M', tx: e.tx, t: Date.parse(e.t) });
  cand.set('TQwh1Z', null); cand.delete('TQwh1Z'); const tq = (prev.cadena_500M_2nov.TYL7z7VS.movimientos_ge10M.find(m => m.de !== 'TYL7z7VSVRShLoJ6YRQMA4t9pSECt9ZLmz' && /950/.test(String(M(m.trx / 1e6))))); if (tq) cand.set(tq.de, { visto: 'envió 950 M a TYL7z7VS el ' + tq.t.slice(0, 10), tx: tq.tx, t: Date.parse(tq.t) });
  const salida = [];
  for (const [dir, v] of cand) {
    if (dir === HTX4 || dir === TEF) continue; const i = await info(dir); const w = await C.txCuenta(dir, { desde: v.t - 4 * 86400e3, hasta: v.t }); const ins = w.filas.filter(f => f.tipo === 'Transfer' && f.ok && f.a === dir && f.trx >= 10e6).map(f => ({ t: C.iso(f.t), de: f.de, trx: f.trx, tx: f.tx }));
    salida.push({ ...i, visto_en: v.visto, tx_del_hecho: v.tx, entradas_ge10M_en_los_4_dias_previos: ins, creada_el_mismo_dia: i.creada === new Date(v.t).toISOString().slice(0, 10) });
  }
  const h = {}; h['verificacion-htx4-y-proveedora.json'] = L.guardar(path.join(OUT, 'verificacion-htx4-y-proveedora.json'), { htx4: comp, proveedora_20oct: prov20 }); h['depositantes-un-salto-atras.json'] = L.guardar(path.join(OUT, 'depositantes-un-salto-atras.json'), salida);
  for (const c of comp) { console.log('\n== HTX 4 ·', c.dia, '· a TEF9ZV', c.entradas_a_TEF9ZV.map(e => e.t.slice(11, 16) + ' ' + M(e.trx / 1e6)).join(' | ')); console.log('   entra en HTX 4:', c.entra_en_HTX4_ge10M.map(e => e.t.slice(11, 16) + ' ' + M(e.trx / 1e6) + 'M de ' + e.de.slice(0, 8)).join(' | ') || '—'); console.log('   sale de HTX 4:', c.sale_de_HTX4_ge10M.map(e => e.t.slice(11, 16) + ' ' + M(e.trx / 1e6) + 'M a ' + e.a.slice(0, 8)).join(' | ') || '—'); }
  console.log('\n== proveedora 20-oct: entra', prov20.entra_ge10M.map(e => e.t.slice(11, 16) + ' ' + M(e.trx / 1e6) + 'M de ' + e.de.slice(0, 8)).join(' | '), '| sale', prov20.sale_ge10M.map(e => e.t.slice(11, 16) + ' ' + M(e.trx / 1e6) + 'M a ' + e.a.slice(0, 8)).join(' | '));
  console.log('\n== depositantes desconocidos:'); for (const s of salida) console.log('  ', s.direccion, '|', s.visto_en, '| etiqueta', s.etiqueta, '| creada', s.creada, s.creada_el_mismo_dia ? '(el mismo día)' : '', '| tx', s.n_tx_tronscan, '| TRX hoy', s.trx_libre, '\n       ← antes:', s.entradas_ge10M_en_los_4_dias_previos.map(e => e.t.slice(0, 16) + ' ' + M(e.trx / 1e6) + 'M de ' + e.de).join(' | ') || '—');
  console.log(JSON.stringify(h, null, 1)); console.log('llamadas', L.metricas.llamadas, 'red', L.metricas.red);
})().catch(e => { console.error('ERROR', e.message, (e.stack || '').split('\n')[1]); process.exit(1); });
