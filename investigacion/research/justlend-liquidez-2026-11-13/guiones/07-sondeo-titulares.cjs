'use strict';
// Sondeo: ¿qué endpoint de TronScan devuelve los mayores titulares de un jToken / token?
const L = require('./lib.cjs'); L.usar('07-2026-11-13');
const JETH = 'TR7BUFRQeq1w5jAZf1FKx85SHuX6PfMqsV';
(async () => {
  for (const u of [
    'https://apilist.tronscanapi.com/api/token_trc20/holders?contract_address=' + JETH + '&start=0&limit=5',
    'https://apilist.tronscanapi.com/api/tokenholders?address=' + JETH + '&start=0&limit=5',
  ]) { try { const r = await L.get(u); console.log(u.slice(0, 110), '\n ->', JSON.stringify(r).slice(0, 700)); } catch (e) { console.log(u, 'ERROR', e.message); } }
})();
