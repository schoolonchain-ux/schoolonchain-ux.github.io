'use strict';
// Guarda la respuesta de TronScan para el contrato TQqgNg13… (UniversalRouter) con fecha de consulta: respalda «1,7 M de operaciones». Solo lectura.
const fs = require('fs');
const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs');
const k = loadTronKeys({ file: 'C:/EquipoIA/tether-blacklist/config.secret.json' });
(async () => {
  const a = 'TQqgNg13s2DjvXhW1ky4v6TsR8wZGvb7Y4';
  const r = await fetch('https://apilist.tronscanapi.com/api/accountv2?address=' + a, { headers: { accept: 'application/json', 'TRON-PRO-API-KEY': k.tronscanKey } });
  const j = await r.json();
  fs.writeFileSync(__dirname + '/resultados/universalrouter-cuenta.json', JSON.stringify({ consultadoUTC: new Date().toISOString(), address: a, name: j.name, transactions: j.transactions, accountType: j.accountType, addressTag: j.addressTag || null }, null, 1));
  console.log(j.name, j.transactions);
})().catch(e => { console.error('ERROR', e.message); process.exit(1); });
