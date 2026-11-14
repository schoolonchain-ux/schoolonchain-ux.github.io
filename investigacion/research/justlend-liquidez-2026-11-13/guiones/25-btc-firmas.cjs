'use strict';
// FASE 9e · ¿Quién firmó las creaciones del token «BTC» y qué método usó? Y quién es la cuenta TQwh1ZDB… que mandó 21.000 BTC al mayor depositante.
const L = require('./lib.cjs'); L.usar('25-2026-11-13'); const b58 = require('./b58.cjs'); const A = require('./abi.cjs'); const path = require('node:path');
(async () => {
  const j = require('./resultados/21-origen-btc.json'); const out = [];
  const nombres = { [A.selector('issue(uint256)')]: 'issue(uint256)', [A.selector('mint(address,uint256)')]: 'mint(address,uint256)', [A.selector('transfer(address,uint256)')]: 'transfer(address,uint256)' };
  for (const t of j.creaciones) { const x = await L.post('https://api.trongrid.io/wallet/gettransactionbyid', { value: t.tx }); const c = x.raw_data && x.raw_data.contract && x.raw_data.contract[0]; const v = c && c.parameter && c.parameter.value; const sel = v && v.data ? v.data.slice(0, 8) : null; out.push({ tx: t.tx, cuando: t.cuando, btc: t.btc, a: t.a, firma: v && v.owner_address ? b58(v.owner_address) : null, metodo: nombres[sel] || sel }); }
  out.sort((a, b) => a.cuando < b.cuando ? -1 : 1); for (const o of out) console.log(o.cuando, String(o.btc).padStart(8), 'BTC →', o.a.slice(0, 8), '| firma', o.firma, '|', o.metodo);
  const firmas = {}; for (const o of out) firmas[o.firma] = (firmas[o.firma] || 0) + o.btc; console.log('BTC creado por firmante:', JSON.stringify(firmas));
  const TQ = 'TQwh1ZDBNXZk5vKtAjYWYZQ4DNUTh8bCnJ'; const cuentaTQ = (j.cuentaGrande.find(t => t.de.startsWith('TQwh1ZDB')) || {}).de; console.log('TQwh1ZDB… completa:', cuentaTQ);
  let etq = null; if (cuentaTQ) { const r = await L.get('https://apilist.tronscanapi.com/api/accountv2?address=' + cuentaTQ); etq = { etiqueta: r.addressTag || r.publicTag || null, creada: r.date_created ? new Date(r.date_created).toISOString() : null, tx: r.totalTransactionCount }; console.log(JSON.stringify(etq)); }
  console.log('guardado sha256', L.guardar(path.join(__dirname, 'resultados', '25-btc-firmas.json'), { leido: new Date().toISOString(), creaciones: out, firmas, cuentaTQ, etq }));
})().catch(e => { console.error('ERROR', e.stack || e.message); process.exit(1); });
