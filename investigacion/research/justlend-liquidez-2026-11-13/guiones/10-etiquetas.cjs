'use strict';
// FASE 4b · ¿Quién es quién entre las cuentas más grandes? Etiqueta pública de TronScan, si es contrato, fecha de creación y saldo en TRX.
const L = require('./lib.cjs'); L.usar('10-2026-11-13'); const path = require('node:path');
const TS = 'https://apilist.tronscanapi.com/api';
(async () => {
  const h = require('./resultados/08-titulares.json'); const top = new Map();
  for (const mk of h.mercados) for (const t of mk.titulares.slice(0, 5)) { if (t.reclamoUSD < 20000) continue; const o = top.get(t.titular) || { mercados: [], usd: 0 }; o.mercados.push(mk.simbolo + ' ' + (t.parte * 100).toFixed(0) + '%'); o.usd += t.reclamoUSD; top.set(t.titular, o); }
  console.log('direcciones a etiquetar:', top.size);
  const out = [];
  for (const [a, o] of [...top].sort((x, y) => y[1].usd - x[1].usd)) {
    const r = await L.get(TS + '/accountv2?address=' + a);
    out.push({ direccion: a, depositoTotalTopUSD: o.usd, mercados: o.mercados, etiqueta: r.addressTag || null, etiquetaPublica: r.publicTag || null, nombreContrato: r.name || null, esContrato: r.accountType === 2 || !!r.isContract || null, creada: r.date_created ? new Date(r.date_created).toISOString() : null, tipo: r.accountType, transacciones: r.totalTransactionCount, trx: r.balance ? r.balance / 1e6 : null, activoPor: r.latest_operation_time ? new Date(r.latest_operation_time).toISOString() : null, redTags: r.redTag || null, greyTag: r.greyTag || null, blueTag: r.blueTag || null, publicTag: r.publicTag || null, bruto: undefined });
  }
  console.log('guardado sha256', L.guardar(path.join(__dirname, 'resultados', '10-etiquetas.json'), { leido: new Date().toISOString(), cuentas: out }));
  for (const c of out.slice(0, 30)) console.log(c.direccion, (c.depositoTotalTopUSD / 1e6).toFixed(1).padStart(8) + ' M$', '|', c.mercados.join(', ').slice(0, 60), '| etiqueta:', c.etiqueta || c.publicTag || c.nombreContrato || '-', '| tipo', c.tipo, '| creada', (c.creada || '').slice(0, 10), '| tx', c.transacciones, '| red/grey/blue:', c.redTags || '-', c.greyTag || '-', c.blueTag || '-');
})().catch(e => { console.error('ERROR', e.message); process.exit(1); });
