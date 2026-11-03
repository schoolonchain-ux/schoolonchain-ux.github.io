'use strict';
// ¿Es real el «artefacto de ventana»? Para las 3 billeteras con más dinero robado recibido ANTES de que empezara su lectura, se piden a TronScan sus movimientos en ese hueco.
const fs = require('fs'); const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs'); const k = loadTronKeys({ file: 'C:/EquipoIA/tether-blacklist/config.secret.json' });
const HS = { accept: 'application/json', 'TRON-PRO-API-KEY': k.tronscanKey }; const sleep = ms => new Promise(r => setTimeout(r, ms)); const USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const S = async u => { await sleep(350); return (await fetch('https://apilist.tronscanapi.com' + u, { headers: HS })).json(); };
const pv = JSON.parse(fs.readFileSync(__dirname + '/resultados/preventana-tramo1.json', 'utf8')); const fmt = n => Math.round(n).toLocaleString('en');
(async () => {
  const salida = [];
  for (const [w, q] of [pv[0], pv[3], pv[4]]) {
    const a = q.primera - 600000, b = q.desde + 60000; console.log('\n', w, 'hueco', new Date(q.primera).toISOString().slice(5, 16), '→', new Date(q.desde).toISOString().slice(5, 16));
    const t = await S('/api/transfer?address=' + w + '&limit=50&start=0&sort=timestamp&count=true&start_timestamp=' + a + '&end_timestamp=' + b); const u = await S('/api/token_trc20/transfers?limit=50&start=0&sort=timestamp&count=true&contract_address=' + USDT + '&relatedAddress=' + w + '&start_timestamp=' + a + '&end_timestamp=' + b);
    const filas = [...(t.data || []).filter(x => x.tokenName === '_').map(x => ({ at: x.timestamp, sim: 'TRX', de: x.transferFromAddress, a: x.transferToAddress, v: x.amount / 1e6, tx: x.transactionHash })), ...(u.token_transfers || []).map(x => ({ at: x.block_ts, sim: 'USDT', de: x.from_address, a: x.to_address, v: Number(x.quant) / 1e6, tx: x.transaction_id }))].sort((x, y) => x.at - y.at);
    for (const f of filas) console.log('  ', new Date(f.at).toISOString().slice(5, 19), f.sim, f.de === w ? 'SALE a ' + f.a.slice(0, 10) : 'ENTRA de ' + f.de.slice(0, 10), fmt(f.v), f.tx.slice(0, 10));
    salida.push({ w, filas });
  }
  fs.writeFileSync(__dirname + '/resultados/prueba-preventana.json', JSON.stringify(salida, null, 1));
})();
