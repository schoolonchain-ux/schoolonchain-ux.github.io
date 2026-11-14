'use strict';
// Quién publica los precios del oráculo de JustLend, con qué límites, y cuándo fue su última actividad.
const L = require('./lib.cjs'); L.usar('29-2026-11-13'); const A = require('./abi.cjs'); const path = require('node:path');
const V1 = 'TMiNCmvD3zdsv6mk7niBU6NPBzVNjYMQTV', POSTER = 'TBPtNVdgkB8QPRHAJeZok6D9pqsFdALv9w', AA = 'TEYZj3NDXoC7RGCtRS6iNKmQRdVkx8iSSr';
(async () => {
  const out = { v1: V1, poster: POSTER, anchorAdmin: AA };
  for (const f of ['maxSwingMantissa()', 'maxSwing()', 'numBlocksPerPeriod()', 'paused()']) { const r = await A.llamar(V1, f); out[f] = r.ok ? String(A.u(r.hex)) : null; }
  console.log(JSON.stringify(out));
  for (const [k, a] of [['poster', POSTER], ['anchorAdmin', AA]]) { const c = await L.post('https://api.trongrid.io/wallet/getcontract', { value: a, visible: true }); const t = await L.get('https://apilist.tronscanapi.com/api/accountv2?address=' + a); out[k + 'Info'] = { esContrato: !!(c && (c.bytecode || c.contract_address)), nombre: c && c.name || null, etiqueta: t.addressTag || t.publicTag || null, creada: t.date_created ? new Date(t.date_created).toISOString() : null, tx: t.totalTransactionCount, ultimaActividad: t.latest_operation_time ? new Date(t.latest_operation_time).toISOString() : null }; console.log(k, a, JSON.stringify(out[k + 'Info'])); }
  // últimas llamadas de la cuenta que publica precios
  const tx = await L.get('https://api.trongrid.io/v1/accounts/' + POSTER + '/transactions?limit=8&order_by=block_timestamp,desc&only_confirmed=true');
  out.ultimasTx = (tx.data || []).map(t => ({ tx: t.txID, cuando: new Date(t.block_timestamp).toISOString(), a: t.raw_data.contract[0].parameter.value.contract_address, resultado: t.ret && t.ret[0].contractRet })); for (const t of out.ultimasTx) console.log('  ', t.cuando, t.tx.slice(0, 12), 'resultado', t.resultado);
  console.log('guardado sha256', L.guardar(path.join(__dirname, 'resultados', '29-poster.json'), { leido: new Date().toISOString(), ...out }));
})().catch(e => { console.error('ERROR', e.stack || e.message); process.exit(1); });
