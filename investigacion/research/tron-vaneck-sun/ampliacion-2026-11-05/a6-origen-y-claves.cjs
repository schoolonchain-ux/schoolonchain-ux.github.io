'use strict';
// LÍNEA A · A6 (de dónde viene el TRX de TEF9ZV que NO coincide con envíos de TT2T17) y A5b (quiénes son las claves de TEF9ZV y las compartidas).
// SOLO LECTURA. Reproducible: REPRODUCIR=1 node a6-origen-y-claves.cjs (usa raw/a6-2026-11-05/).
const fs = require('node:fs'), path = require('node:path'); const L = require('./lib.cjs'); const C = require('./cadena.cjs');
L.usar('a6-2026-11-05'); const OUT = path.join(__dirname, 'a6-origen'); const TG = 'https://api.trongrid.io', TS = 'https://apilist.tronscanapi.com/api';
const HTX4 = 'TFTWNgDBkQ5wQoP8RXpRznnHvAVV8x5jLu', TEF = 'TEF9ZVUxhmGGffvkf59e2vdLfAG1QCMb7B', TT2 = 'TT2T17KZhoDu47i2E4FWxfG79zdkEWkU9N', PROV = 'TWhDfwC8QE6pQyiYy248dNor3uphPEw5M2', TYL = 'TYL7z7VSVRShLoJ6YRQMA4t9pSECt9ZLmz', TPY = 'TPyjyZfsYaXStgz2NmAraF1uZcMtkgNan5';
const M = x => Math.round(x * 100) / 100; const p = JSON.parse(fs.readFileSync(path.join(__dirname, 'a2-a4-a5', 'permisos-y-claves.json'), 'utf8')); const ancla = Date.parse(JSON.parse(fs.readFileSync(path.join(__dirname, 'linea-base', 'anclas.json'), 'utf8')).bloque_hora_utc);
const cuentasLB = JSON.parse(fs.readFileSync(path.join(__dirname, 'linea-base', 'cuentas.json'), 'utf8')); const tefLB = cuentasLB.find(c => c.direccion_consultada === TEF);
const ent = JSON.parse(fs.readFileSync(path.join(__dirname, 'f0-3-pistas', 'entradas-tef9zv.json'), 'utf8'));
async function info(dir) { const a = await L.post(TG + '/wallet/getaccount', { address: dir, visible: true }); let t = {}; try { t = await L.get(TS + '/accountv2?address=' + dir); } catch { t = {}; } const o = a.owner_permission; return { direccion: dir, existe_en_cadena: !!a.address, etiqueta: t.publicTag || t.addressTag || null, creada: a.create_time ? new Date(a.create_time).toISOString().slice(0, 10) : null, n_tx_tronscan: t.totalTransactionCount || null, clave_propietaria: o ? (o.keys || []).map(k => k.address) : [], trx_libre: (a.balance || 0) / 1e6 }; }
(async () => {
  // ---- A6a: entradas de HTX 4 a TEF9ZV que no coinciden con envíos de TT2T17: qué entró en HTX 4 en las 6 h anteriores (≥ 10 M TRX)
  const casos = [['2026-02-02', 100e6], ['2026-03-02', 100e6], ['2026-05-07', 360e6]]; const htx = [];
  for (const [d, imp] of casos) {
    const ins = ent.filter(e => e.t.slice(0, 10) === d && e.de === HTX4); if (!ins.length) continue; const t1 = Date.parse(ins[ins.length - 1].t), t0 = Date.parse(ins[0].t) - 6 * 3600e3;
    const w = await C.txCuenta(HTX4, { desde: t0, hasta: t1 }); const tr = w.filas.filter(f => f.tipo === 'Transfer' && f.ok && f.trx >= 10e6);
    htx.push({ dia: d, entradas_a_TEF9ZV: ins.map(e => ({ t: e.t, trx: e.trx, tx: e.tx })), ventana: [C.iso(t0), C.iso(t1)], tx_leidas_HTX4: w.filas.length, entradas_ge10M_a_HTX4: tr.filter(f => f.a === HTX4).map(f => ({ t: C.iso(f.t), de: f.de, trx: f.trx, tx: f.tx })), salidas_ge10M_de_HTX4: tr.filter(f => f.de === HTX4).map(f => ({ t: C.iso(f.t), a: f.a, trx: f.trx, tx: f.tx })) });
  }
  // ---- A6b: cadena de los 500 M del 2-nov: proveedora ← TJHKNV4J ← TYL7z7VS ← TPyjyZ
  const e500 = ent.find(e => e.tx.startsWith('b02dee0924')); const t2 = Date.parse('2026-11-02T00:00:00Z');
  const provIn = (await C.txCuenta(PROV, { desde: t2, hasta: t2 + 86400e3 })).filas.filter(f => f.tipo === 'Transfer' && f.ok && f.a === PROV && f.trx >= 10e6);
  const puente500 = provIn.length ? provIn[0].de : null; const detalle500 = { entrada_proveedora_ge10M_el_2nov: provIn.map(f => ({ t: C.iso(f.t), de: f.de, trx: f.trx, tx: f.tx })) };
  if (puente500) { const w = await C.txCuenta(puente500, { desde: 0, hasta: ancla }); detalle500.puente = { direccion: puente500, tx: w.filas.length, creada_primera_tx: w.filas[0] && C.iso(w.filas[0].t), movimientos_ge10M: w.filas.filter(f => f.tipo === 'Transfer' && f.ok && f.trx >= 10e6).map(f => ({ t: C.iso(f.t), de: f.de, a: f.a, trx: f.trx, tx: f.tx })) }; }
  const tyl = await C.txCuenta(TYL, { desde: 0, hasta: ancla }); detalle500.TYL7z7VS = { tx: tyl.filas.length, movimientos_ge10M: tyl.filas.filter(f => f.tipo === 'Transfer' && f.ok && f.trx >= 10e6).map(f => ({ t: C.iso(f.t), de: f.de, a: f.a, trx: f.trx, tx: f.tx })) };
  // ---- A5b: quiénes son las claves del permiso «Resource Delegation I» y las demás claves relevantes
  const rd = (tefLB.permisos_activos || []).find(x => x && /Resource/i.test(x.nombre)); const clavesRD = rd ? rd.claves : []; const extra = ['TM3sTVyahiGWYktKg8G6miHpTzRurKDt7b', 'TUgSgCQL6pMSy9zByn4sgxqrJa95sZExBG', 'TAbcZfVgqe8x49LN4i2iFudcXBhab5FS7h', 'TDMZVtpYLEfeTuFxXKNLCZF3vMScMNPVE1'];
  const claves = []; for (const k of [...clavesRD.map(c => c.direccion), ...extra]) claves.push(Object.assign(await info(k), { rol: clavesRD.some(c => c.direccion === k) ? 'clave del permiso «Resource Delegation I» de TEF9ZV' : 'clave compartida / de un receptor' }));
  const h = {}; h['origen-entradas-sin-pareja.json'] = L.guardar(path.join(OUT, 'origen-entradas-sin-pareja.json'), { htx4: htx, cadena_500M_2nov: detalle500, entrada_500M: e500 }); h['claves.json'] = L.guardar(path.join(OUT, 'claves.json'), { permiso_resource_delegation_I: rd, claves });
  for (const c of htx) { console.log('\n== HTX 4 ·', c.dia, '· a TEF9ZV entró', c.entradas_a_TEF9ZV.map(e => M(e.trx / 1e6)).join('+'), 'M · ventana', c.ventana.map(x => x.slice(5, 16)).join('→'), '· tx de HTX 4 leídas', c.tx_leidas_HTX4); console.log('   entra en HTX 4 (≥10M):', c.entradas_ge10M_a_HTX4.map(e => e.t.slice(11, 16) + ' ' + M(e.trx / 1e6) + 'M de ' + e.de.slice(0, 8)).join(' | ') || '—'); console.log('   sale de HTX 4 (≥10M):', c.salidas_ge10M_de_HTX4.map(e => e.t.slice(11, 16) + ' ' + M(e.trx / 1e6) + 'M a ' + e.a.slice(0, 8)).join(' | ') || '—'); }
  console.log('\n== cadena de los 500 M: entradas a la proveedora el 2-nov ≥10M:', JSON.stringify(detalle500.entrada_proveedora_ge10M_el_2nov.map(f => [f.t.slice(11, 16), M(f.trx / 1e6), f.de.slice(0, 10)])));
  if (detalle500.puente) console.log('   puente', puente500, 'tx', detalle500.puente.tx, detalle500.puente.movimientos_ge10M.map(f => f.t.slice(0, 16) + ' ' + f.de.slice(0, 6) + '→' + f.a.slice(0, 6) + ' ' + M(f.trx / 1e6) + 'M').join(' | '));
  console.log('   TYL7z7VS tx', detalle500.TYL7z7VS.tx, detalle500.TYL7z7VS.movimientos_ge10M.map(f => f.t.slice(0, 10) + ' ' + f.de.slice(0, 6) + '→' + f.a.slice(0, 6) + ' ' + M(f.trx / 1e6) + 'M').join(' | '));
  console.log('\n== claves:'); for (const c of claves) console.log('  ', c.direccion, '|', c.rol, '| existe', c.existe_en_cadena, '| creada', c.creada, '| etiqueta', c.etiqueta, '| tx', c.n_tx_tronscan, '| su clave:', c.clave_propietaria.map(k => k === c.direccion ? 'ella misma' : k.slice(0, 10)).join(','), '| TRX', Math.round(c.trx_libre));
  console.log(JSON.stringify(h, null, 1)); console.log('llamadas', L.metricas.llamadas, 'red', L.metricas.red);
})().catch(e => { console.error('ERROR', e.message, (e.stack || '').split('\n')[1]); process.exit(1); });
