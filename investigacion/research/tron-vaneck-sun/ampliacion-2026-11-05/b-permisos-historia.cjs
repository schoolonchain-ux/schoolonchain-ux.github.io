'use strict';
// LÍNEA A · A5 ampliada (mejora B del propietario) — Quién controla los permisos: estado ACTUAL y HISTORIAL de cambios de permisos, umbrales, firmantes,
// operaciones que cada permiso autoriza, y si algún firmante es un contrato o un intermediario. Se conserva el historial, no solo el estado actual.
// Alcance: las cuentas del caso (salvo contratos y la proveedora, 3 M de filas: línea B), los receptores controlados por otra clave y las claves que los controlan.
// SOLO LECTURA. Reproducible: REPRODUCIR=1 node b-permisos-historia.cjs (usa raw/b-2026-11-05/, y las lecturas ya hechas de a1/a2/linea-base).
const fs = require('node:fs'), path = require('node:path'); const L = require('./lib.cjs'); const C = require('./cadena.cjs'); const b58 = require('./b58.cjs');
const OUT = path.join(__dirname, 'b-permisos'); const TG = 'https://api.trongrid.io', TS = 'https://apilist.tronscanapi.com/api'; const M = x => Math.round(x * 100) / 100;
const rd = (...p) => JSON.parse(fs.readFileSync(path.join(__dirname, ...p), 'utf8')); const cuentas = rd('linea-base', 'cuentas.json'), rec = rd('a2-a4-a5', 'receptores-81.json'), anclas = rd('linea-base', 'anclas.json'); const tAncla = Date.parse(anclas.bloque_hora_utc);
const TEF = 'TEF9ZVUxhmGGffvkf59e2vdLfAG1QCMb7B', TT2 = 'TT2T17KZhoDu47i2E4FWxfG79zdkEWkU9N', PROV = 'TWhDfwC8QE6pQyiYy248dNor3uphPEw5M2';
const TIPOS_OP = { 1: 'Transfer', 2: 'TransferAsset', 4: 'VoteWitness', 11: 'FreezeBalance(v1)', 12: 'UnfreezeBalance(v1)', 13: 'WithdrawBalance(recompensa)', 31: 'TriggerSmartContract', 46: 'AccountPermissionUpdate', 54: 'FreezeBalanceV2', 55: 'UnfreezeBalanceV2', 56: 'WithdrawExpireUnfreeze', 57: 'DelegateResource', 58: 'UnDelegateResource', 59: 'CancelAllUnfreezeV2' };
function operaciones(hex) { if (!hex) return null; const b = Buffer.from(hex, 'hex'); const out = []; for (let i = 0; i < b.length * 8; i++) if (b[i >> 3] & (1 << (i & 7))) out.push(TIPOS_OP[i] || ('tipo ' + i)); return out; }
const normPerm = p => p ? { nombre: p.permission_name || p.name || null, umbral: p.threshold, firmantes: (p.keys || []).map(k => ({ direccion: b58(k.address), peso: k.weight })).sort((a, b) => a.direccion < b.direccion ? -1 : 1), operaciones: operaciones(p.operations) } : null;
const clave = p => p ? JSON.stringify([p.umbral, p.firmantes.map(k => k.direccion + ':' + k.peso)]) : null;
const sesionDe = dir => dir === TEF ? 'a1-2026-11-05' : dir === TT2 ? 'a2-2026-11-05' : 'b-2026-11-05';
(async () => {
  const casoDir = cuentas.filter(c => !/Contrato/.test(c.nombre) && c.direccion_consultada !== PROV).map(c => ({ direccion: c.direccion_consultada, nombre: c.nombre }));
  const extra = rec.filter(r => r.controlada_por_otra_clave).map(r => ({ direccion: r.receptor, nombre: 'Receptor de TEF9ZV controlado por otra clave (' + r.familia + ')' })); const llaves = ['TM3sTVyahiGWYktKg8G6miHpTzRurKDt7b', 'TCXrf8SwGjcmQYY1FcFnV3LUXSQpqod3bi', 'TDMZVtpYLEfeTuFxXKNLCZF3vMScMNPVE1', 'TUgSgCQL6pMSy9zByn4sgxqrJa95sZExBG'].map(d => ({ direccion: d, nombre: 'Clave/cuenta relacionada' }));
  const lista = []; for (const x of [...casoDir, ...extra, ...llaves]) if (!lista.find(y => y.direccion === x.direccion)) lista.push(x);
  const resultado = []; const todasLasClaves = new Map();
  for (const x of lista) {
    L.usar('linea-base-2026-11-05'); let a; try { a = await L.post(TG + '/wallet/getaccount', { address: x.direccion, visible: true }); } catch { L.usar('b-2026-11-05'); a = await L.post(TG + '/wallet/getaccount', { address: x.direccion, visible: true }); }
    L.usar('b-2026-11-05'); const ts = await L.get(TS + '/accountv2?address=' + x.direccion).catch(() => ({})); const n = ts.totalTransactionCount || null;
    const actual = { propietario: normPerm(a.owner_permission), activos: (a.active_permission || []).map(normPerm) };   // getaccount con visible:true ya da base58; b58() deja intactas las direcciones T…
    let lectura = { estado: 'no leído', motivo: null }; let eventos = [];
    if (n && n > 60000) lectura = { estado: 'NO LEÍDO', motivo: 'más de 60.000 transacciones según TronScan (' + n + '): se conserva solo el estado actual', tx_tronscan: n };
    else {
      L.usar(sesionDe(x.direccion)); const hasta = x.direccion === TEF || x.direccion === TT2 ? tAncla + 3600e3 : tAncla; const w = await C.txCuenta(x.direccion, { desde: 0, hasta: x.direccion === TEF || x.direccion === TT2 ? hasta : hasta, maxPaginas: 320 });
      eventos = w.filas.filter(f => f.tipo === 'AccountPermissionUpdate' && f.t <= tAncla).map(f => ({ t: C.iso(f.t), tx: f.tx, ok: f.ok, propietario: normPerm(f.permisos.propietario), activos: (f.permisos.activos || []).map(normPerm) }));
      lectura = { estado: w.truncado ? 'PARCIAL' : 'COMPLETO según TronGrid', filas_leidas: w.filas.length, paginas: w.paginas, tx_tronscan: n, coincide_con_tronscan: n ? Math.abs(w.filas.length - n) <= Math.max(5, n * 0.002) : null };
    }
    const ultimo = eventos.filter(e => e.ok).slice(-1)[0]; const sinEv = eventos.length === 0; const propSelf = actual.propietario && actual.propietario.firmantes.length === 1 && actual.propietario.firmantes[0].direccion === x.direccion;
    const cierre = lectura.estado === 'NO LEÍDO' || lectura.estado === 'PARCIAL' ? 'no comprobable' : (ultimo ? (clave(ultimo.propietario) === clave(actual.propietario) ? 'cuadra con el último cambio' : 'NO CUADRA con el último cambio') : (propSelf ? 'sin cambios: permisos por defecto (solo ella misma)' : 'SIN cambios registrados pero el estado actual no es el de por defecto: INCONSISTENCIA'));
    resultado.push({ ...x, creada: a.create_time ? new Date(a.create_time).toISOString().slice(0, 10) : null, actual, lectura, n_cambios_de_permisos: eventos.length, historial: eventos, cierre });
    for (const p of [actual.propietario, ...actual.activos, ...eventos.flatMap(e => [e.propietario, ...e.activos])]) if (p) for (const k of p.firmantes) { const s = todasLasClaves.get(k.direccion) || new Set(); s.add(x.direccion); todasLasClaves.set(k.direccion, s); }
  }
  // Clasificar cada firmante: ¿existe? ¿contrato? ¿etiqueta? ¿en cuántas cuentas del alcance aparece?
  L.usar('b-2026-11-05'); const firmantes = [];
  for (const [k, s] of todasLasClaves) { if (lista.find(y => y.direccion === k && s.size === 1 && s.has(k))) { firmantes.push({ direccion: k, es_ella_misma_en_su_cuenta: true }); continue; } const a = await L.post(TG + '/wallet/getaccount', { address: k, visible: true }); const c = await L.post(TG + '/wallet/getcontract', { value: k, visible: true }); const t = await L.get(TS + '/accountv2?address=' + k).catch(() => ({}));
    firmantes.push({ direccion: k, existe_en_cadena: !!a.address, es_contrato: !!(c.bytecode || c.contract_address), etiqueta: t.publicTag || t.addressTag || null, creada: a.create_time ? new Date(a.create_time).toISOString().slice(0, 10) : null, trx_libre: M((a.balance || 0) / 1e6), firma_en_estas_cuentas_del_alcance: [...s] }); }
  const compartidas = firmantes.filter(f => f.firma_en_estas_cuentas_del_alcance && f.firma_en_estas_cuentas_del_alcance.filter(a => a !== f.direccion).length > 1);
  const h = {}; h['permisos-por-cuenta.json'] = L.guardar(path.join(OUT, 'permisos-por-cuenta.json'), resultado); h['firmantes.json'] = L.guardar(path.join(OUT, 'firmantes.json'), { firmantes, firmantes_en_mas_de_una_cuenta_del_alcance: compartidas.map(f => f.direccion) });
  console.log('cuentas analizadas', resultado.length);
  for (const r of resultado) console.log((r.nombre || '').slice(0, 40).padEnd(40), r.direccion.slice(0, 8), '| propietario', r.actual.propietario ? r.actual.propietario.umbral + '/' + r.actual.propietario.firmantes.length : '-', '| activos', r.actual.activos.map(a => a.nombre + ' ' + a.umbral + '/' + a.firmantes.length).join(','), '| cambios', r.n_cambios_de_permisos, '| lectura', r.lectura.estado, r.lectura.coincide_con_tronscan === false ? '(NO coincide con TronScan)' : '', '| cierre:', r.cierre);
  const tef = resultado.find(r => r.direccion === TEF); console.log('\nTEF9ZV cambios de permisos:', JSON.stringify(tef.historial.map(e => ({ t: e.t, tx: e.tx.slice(0, 10), activos: e.activos.map(a => ({ n: a.nombre, u: a.umbral, f: a.firmantes.length, ops: a.operaciones })) }))));
  console.log('firmantes en más de una cuenta:', JSON.stringify(compartidas.map(f => ({ k: f.direccion, etiqueta: f.etiqueta, cuentas: f.firma_en_estas_cuentas_del_alcance.map(x => x.slice(0, 8)) })))); console.log('firmantes que son contratos:', firmantes.filter(f => f.es_contrato).map(f => f.direccion));
  console.log(JSON.stringify(h, null, 1)); console.log('llamadas', L.metricas.llamadas, 'red', L.metricas.red, 'reintentos', L.metricas.reintentos);
})().catch(e => { console.error('ERROR', e.message, (e.stack || '').split('\n')[1]); process.exit(1); });
