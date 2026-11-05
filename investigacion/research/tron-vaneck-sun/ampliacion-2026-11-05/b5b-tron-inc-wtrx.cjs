'use strict';
// LÍNEA B · B5b — La dirección que Protos llama «tesorería de TRON Inc.» (TEySEZLJ…) guarda 2,74 M TRX libres, pero recibió 677,6 M TRX en 2025 y los envolvió en WTRX con llamadas a `deposit()`.
// Comprobación: saldo de WTRX de esa dirección (consulta al contrato) y perfil de quien le mandó los 677,6 M (TFZZx3HX…). SOLO LECTURA. Reproducible: REPRODUCIR=1 node b5b-tron-inc-wtrx.cjs
const fs = require('node:fs'), path = require('node:path'); const L = require('./lib.cjs'); const C = require('./cadena.cjs'); L.usar('b5b-2026-11-05');
const OUT = path.join(__dirname, 'b-proveedora'); const TG = 'https://api.trongrid.io', TS = 'https://apilist.tronscanapi.com/api'; const M = x => Math.round(x * 100) / 100; const tAncla = Date.parse(JSON.parse(fs.readFileSync(path.join(__dirname, 'linea-base', 'anclas.json'), 'utf8')).bloque_hora_utc);
const TI = 'TEySEZLJf6rs2mCujGpDEsgoMVWKLAk9mT', WTRX = 'TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR'; const AL = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'; const deB58 = s => { let n = 0n; for (const c of s) n = n * 58n + BigInt(AL.indexOf(c)); let h = n.toString(16); if (h.length % 2) h = '0' + h; return h; };
(async () => {
  const bal = await L.post(TG + '/wallet/triggerconstantcontract', { owner_address: TI, contract_address: WTRX, function_selector: 'balanceOf(address)', parameter: '000000000000000000000000' + deB58(TI).slice(2, 42), visible: true }); const wtrx = Number(BigInt('0x' + bal.constant_result[0])) / 1e6;
  const a = await L.post(TG + '/wallet/getaccount', { address: TI, visible: true }); const libre = (a.balance || 0) / 1e6;
  // llamadas deposit()/transfer desde la dirección
  L.usar('b5-2026-11-05'); const w = await C.txCuenta(TI, { desde: 0, hasta: tAncla, maxPaginas: 60 }); L.usar('b5b-2026-11-05');
  const llam = w.filas.filter(f => f.tipo === 'TriggerSmart' && f.de === TI).map(f => ({ t: C.iso(f.t), contrato: f.a, selector: (f.datos || '').slice(0, 8), trx_adjuntos: M(f.trx), tx: f.tx }));
  const FZ = 'TFZZx3HXBEWvXKbFKFzQbtBwXQvsKJYp3W'; const dirFZ = (w.filas.find(f => f.tipo === 'Transfer' && f.a === TI && f.trx >= 100e6) || {}).de; const g = await L.post(TG + '/wallet/getaccount', { address: dirFZ, visible: true }); const t = await L.get(TS + '/accountv2?address=' + dirFZ).catch(() => ({}));
  const fz = { direccion: dirFZ, etiqueta: t.publicTag || t.addressTag || null, creada: g.create_time ? new Date(g.create_time).toISOString().slice(0, 10) : null, n_tx: t.totalTransactionCount || null, trx_libre: M((g.balance || 0) / 1e6) };
  const res = { direccion: TI, trx_libre: M(libre), wtrx_saldo: M(wtrx), total_trx_mas_wtrx: M(libre + wtrx), llamadas_a_contratos: llam, quien_le_mando_los_677M: fz };
  const h = L.guardar(path.join(OUT, 'tron-inc-wtrx.json'), res);
  console.log('TRX libre', libre.toLocaleString('es-ES'), '| WTRX', wtrx.toLocaleString('es-ES'), '| total', (libre + wtrx).toLocaleString('es-ES')); console.log('llamadas a contratos:', JSON.stringify(llam.map(l => [l.t.slice(0, 10), l.selector, l.trx_adjuntos, l.contrato.slice(0, 8)]))); console.log('quien mandó los 677,6 M:', JSON.stringify(fz)); console.log(h, 'llamadas', L.metricas.llamadas, 'red', L.metricas.red);
})().catch(e => { console.error('ERROR', e.message, (e.stack || '').split('\n')[1]); process.exit(1); });
