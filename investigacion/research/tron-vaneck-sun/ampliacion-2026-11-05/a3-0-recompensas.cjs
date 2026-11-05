'use strict';
// A3 previo: importe de las recompensas de votos que TEF9ZV cobró (WithdrawBalance). El importe no viene en la lista de transacciones: está en el recibo.
// SOLO LECTURA. Reproducible: REPRODUCIR=1 node a3-0-recompensas.cjs
const fs = require('node:fs'), path = require('node:path'); const L = require('./lib.cjs'); L.usar('a3-2026-11-05'); const OUT = path.join(__dirname, 'a3-libro');
const ev = JSON.parse(fs.readFileSync(path.join(__dirname, 'a1-tef9zv', 'eventos.json'), 'utf8'));
(async () => {
  const w = ev.filter(f => f.tipo === 'WithdrawBalance' && f.ok); const filas = [];
  for (const f of w) { const i = await L.post('https://api.trongrid.io/wallet/gettransactioninfobyid', { value: f.tx }); filas.push({ t: new Date(f.t).toISOString(), tx: f.tx, trx: (i.withdraw_amount || 0) / 1e6, bloque: i.blockNumber }); }
  const h = L.guardar(path.join(OUT, 'recompensas.json'), filas); console.log(JSON.stringify(filas), h);
})().catch(e => { console.error('ERROR', e.message); process.exit(1); });
