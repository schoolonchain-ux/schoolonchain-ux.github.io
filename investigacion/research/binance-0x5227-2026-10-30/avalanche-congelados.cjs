'use strict';
// ¿Bloqueó Tether alguna de las direcciones de Avalanche? Llamadas de solo lectura al RPC público de Avalanche (sin clave).
const fs = require('fs'); const RPC = 'https://api.avax.network/ext/bc/C/rpc'; const USDT = '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7'; const sleep = ms => new Promise(r => setTimeout(r, ms));
async function rpc(method, params) { for (let i = 0; i < 3; i++) { try { await sleep(120); const r = await fetch(RPC, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }), signal: AbortSignal.timeout(30000) }); const j = await r.json(); return j; } catch { await sleep(800); } } return null; }
const pad = a => a.toLowerCase().replace(/^0x/, '').padStart(64, '0');
const call = async (data, to = USDT) => { const j = await rpc('eth_call', [{ to, data }, 'latest']); return j && j.result !== undefined ? j.result : (j && j.error ? 'ERR ' + j.error.message : null); };
const DIRS = { '0x5227f603c1ee34ce3c06efe6477003bdfccb2f8c': 'dirección del ladrón 0x5227…', '0x3bce63c6c9abf7a47f52c9a3a7950867700b0158': 'remitente 1 (3,22 M USDt + 432.846 AVAX)', '0x9f8c163cba728e99993abe7495f06c0a3c8ac8b9': 'remitente 2 (5,19 M USDt + 573.469 AVAX)', '0xaba2d404c5c41da5964453a368aff2604ae80a14': 'remitente de 388.252 AVAX', '0x6d8be5cdf0d7dee1f04e25fd70b001ae3b907824': 'remitente de 419.533 AVAX', '0x978b21a854dbefcd6d51dfd269875d158046240b': 'remitente de 444.537 AVAX (23:04)', '0x80358c5b8f9b2cc27147a1e0f2a6c9a30eb2c397': 'destino de 1.813.999 AVAX (21:45:34)', '0x2ef0f69cb884a0bd8a64a6cf88c61e716f87f033': 'destino de 444.436 AVAX (30-oct 12:15)', '0x8035462c655c627283d76169c014f47b2a45c397': 'imitador de 0x80358c5b…c397', '0x2ef06a5a9142b0db354175e1af94b0a5a059f033': 'imitador de 0x2ef0f69c…f033' };
(async () => {
  const out = { generado: new Date().toISOString(), contrato: USDT, fuente: 'api.avax.network (RPC público)', funciones: {}, direcciones: [], eventos: null };
  // ¿qué funciones de bloqueo tiene el contrato? se prueban los selectores más comunes
  for (const [nombre, sel] of [['isBlackListed(address)', '0xe47d6060'], ['isBlocked(address)', '0xfbac3951'], ['getBlackListStatus(address)', '0x59bf1abe'], ['isBlacklisted(address)', '0xfe575a87'], ['isFrozen(address)', '0xe5839836']]) { const r = await call(sel + pad('0x5227f603c1ee34ce3c06efe6477003bdfccb2f8c')); out.funciones[nombre] = r; }
  console.log('funciones probadas con 0x5227…:', JSON.stringify(out.funciones));
  const total = await call('0x18160ddd'); out.totalSupply = total; const nombre = await call('0x06fdde03'); console.log('totalSupply', total && total.length < 80 ? BigInt(total) / 1000000n : total);
  for (const [a, n] of Object.entries(DIRS)) {
    const bal = await call('0x70a08231' + pad(a)); const f = {}; for (const [nm, sel] of [['isBlackListed(address)', '0xe47d6060'], ['isBlocked(address)', '0xfbac3951'], ['isBlacklisted(address)', '0xfe575a87']]) { f[nm] = await call(sel + pad(a)); }
    const avax = await rpc('eth_getBalance', [a, 'latest']); const code = await rpc('eth_getCode', [a, 'latest']);
    const r = { direccion: a, papel: n, usdt: bal && /^0x[0-9a-f]+$/.test(bal) ? Number(BigInt(bal)) / 1e6 : bal, avax: avax && avax.result ? Number(BigInt(avax.result) / 10n ** 12n) / 1e6 : null, esContrato: code && code.result && code.result.length > 2, ...f }; out.direcciones.push(r);
    console.log(n.padEnd(46), a.slice(0, 12), '| USDt', r.usdt, '| AVAX', r.avax, '| isBlackListed', f['isBlackListed(address)'] ? f['isBlackListed(address)'].slice(-1) : f['isBlackListed(address)'], '| contrato', r.esContrato);
  }
  // eventos AddedBlackList en el contrato desde el 29-oct (bloque ≈ 98.890.000)
  const topics = ['0x42e160154868087d6bfdc0ca23d96a1c1cfa32f1b72ba9ba27b69b98a0d819dc', '0xd7e9ec6e6ecd65492dce6bf513cd6867560d49544421d0783ddf06e76c24470c'];
  out.eventos = [];
  for (const t of topics) { const j = await rpc('eth_getLogs', [{ address: USDT, fromBlock: '0x' + (98880000).toString(16), toBlock: 'latest', topics: [t] }]); const l = j && Array.isArray(j.result) ? j.result : []; for (const x of l) out.eventos.push({ topic: t, bloque: parseInt(x.blockNumber, 16), tx: x.transactionHash, dato: x.data, topics: x.topics }); console.log('eventos', t.slice(0, 10), l.length, j && j.error ? j.error.message : ''); }
  fs.writeFileSync('C:/EquipoIA/research/binance-0x5227-2026-10-30/tron/avalanche-congelados.json', JSON.stringify(out, null, 1));
})();
