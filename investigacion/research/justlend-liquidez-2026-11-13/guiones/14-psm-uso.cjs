'use strict';
// ¿Se usa de verdad la salida oficial de USDD (PSM)? Se miran las últimas salidas de USDT del GemJoin y qué contrato las ordena.
const L = require('./lib.cjs'); L.usar('14-2026-11-13'); const A = require('./abi.cjs'); const path = require('node:path'); const b58 = require('./b58.cjs');
const USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', GEMJOIN = 'TSUYvQ5tdd3DijCD1uGunGLpftHuSZ12sQ';
(async () => {
  const sal = await L.get('https://api.trongrid.io/v1/accounts/' + GEMJOIN + '/transactions/trc20?only_from=true&limit=20&contract_address=' + USDT);
  const ent = await L.get('https://api.trongrid.io/v1/accounts/' + GEMJOIN + '/transactions/trc20?only_to=true&limit=20&contract_address=' + USDT);
  const f = (arr) => (arr.data || []).map(t => ({ tx: t.transaction_id, cuando: new Date(t.block_timestamp).toISOString(), de: t.from, a: t.to, usdt: Number(t.value) / 1e6 }));
  const S = f(sal), E = f(ent); console.log('últimas SALIDAS de USDT del GemJoin:'); S.slice(0, 8).forEach(s => console.log(' ', s.cuando, s.usdt.toLocaleString('en'), '→', s.a, s.tx.slice(0, 12))); console.log('últimas ENTRADAS:'); E.slice(0, 8).forEach(s => console.log(' ', s.cuando, s.usdt.toLocaleString('en'), '←', s.de, s.tx.slice(0, 12)));
  // contrato que ordena la salida
  const psm = new Map();
  for (const s of S.slice(0, 6)) { const t = await L.post('https://api.trongrid.io/wallet/gettransactionbyid', { value: s.tx }); const c = t.raw_data && t.raw_data.contract && t.raw_data.contract[0]; const v = c && c.parameter && c.parameter.value; const dst = v && v.contract_address ? b58(v.contract_address) : null; const dato = v && v.data ? v.data.slice(0, 8) : null; s.contratoLlamado = dst; s.selector = dato; s.quienLlama = v && v.owner_address ? b58(v.owner_address) : null; psm.set(dst, (psm.get(dst) || 0) + 1); console.log('   tx', s.tx.slice(0, 12), 'llama a', dst, 'selector', dato, 'desde', s.quienLlama); }
  console.log('guardado sha256', L.guardar(path.join(__dirname, 'resultados', '14-psm-uso.json'), { leido: new Date().toISOString(), gemJoin: GEMJOIN, ultimasSalidas: S, ultimasEntradas: E }));
})().catch(e => { console.error('ERROR', e.stack || e.message); process.exit(1); });
