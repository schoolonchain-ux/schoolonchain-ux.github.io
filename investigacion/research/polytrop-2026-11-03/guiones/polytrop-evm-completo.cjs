'use strict';
// Barrido completo (solo lectura) de las direcciones EVM del CSV de Polytrop que NO tenemos: Ethereum (chainid 1).
// Por dirección: saldo ETH, USDT y USDC actuales, nº de transacciones (hasta 100), primeras 3 en orden y última. Reanudable.
const fs = require('fs'); const path = require('path');
const { loadEtherscanKey } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs'); const K = loadEtherscanKey({ file: 'C:/EquipoIA/tether-blacklist/config.secret.json' });
const no = JSON.parse(fs.readFileSync(path.join(__dirname, 'polytrop-no-tenemos.json'), 'utf8')).filter(x => x.red === 'evm');
const OUT = path.join(__dirname, 'polytrop-evm-completo.json'); let S = {}; try { S = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch { /* primera vez */ }
const sleep = ms => new Promise(r => setTimeout(r, ms));
const USDT = '0xdac17f958d2ee523a2206206994597c13d831ec7', USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
async function api(params) { for (let i = 0; i < 5; i++) { try { const r = await fetch('https://api.etherscan.io/v2/api?' + new URLSearchParams({ chainid: 1, apikey: K.key, ...params }), { signal: AbortSignal.timeout(30000) }); const j = await r.json(); if (j.status === '1') return j.result; if (/No transactions found|No records/i.test(String(j.message))) return []; if (/not supported/i.test(String(j.result))) return null; await sleep(800 * (i + 1)); } catch { await sleep(800 * (i + 1)); } } return null; }
(async () => {
  let n = 0;
  for (const x of no) {
    if (S[x.a]) continue;
    const b = await api({ module: 'account', action: 'balance', address: x.a, tag: 'latest' }); await sleep(200);
    const tu = await api({ module: 'account', action: 'tokenbalance', contractaddress: USDT, address: x.a, tag: 'latest' }); await sleep(200);
    const tc = await api({ module: 'account', action: 'tokenbalance', contractaddress: USDC, address: x.a, tag: 'latest' }); await sleep(200);
    const tx = await api({ module: 'account', action: 'txlist', address: x.a, startblock: 0, endblock: 99999999, page: 1, offset: 100, sort: 'asc' }); await sleep(200);
    const ok = Array.isArray(tx);
    S[x.a] = { rol: x.rol, eth: b && /^\d+$/.test(String(b)) ? Number(b) / 1e18 : null, usdt: tu && /^\d+$/.test(String(tu)) ? Number(tu) / 1e6 : null, usdc: tc && /^\d+$/.test(String(tc)) ? Number(tc) / 1e6 : null,
      nTx: ok ? tx.length : null, primeras: ok ? tx.slice(0, 3).map(t => ({ de: t.from, a: t.to, eth: Number(t.value) / 1e18, t: +t.timeStamp, tx: t.hash, error: t.isError === '1' })) : null, ultima: ok && tx.length ? +tx[tx.length - 1].timeStamp : null };
    if (++n % 25 === 0) { fs.writeFileSync(OUT, JSON.stringify(S)); console.log(Object.keys(S).length, '/', no.length); }
  }
  fs.writeFileSync(OUT, JSON.stringify(S)); console.log('FIN', Object.keys(S).length);
})();
