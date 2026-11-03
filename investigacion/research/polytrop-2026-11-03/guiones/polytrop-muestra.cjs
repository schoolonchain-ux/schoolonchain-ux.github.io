'use strict';
const fs = require('fs'); const path = require('path');
const { loadEtherscanKey } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs'); const K = loadEtherscanKey({ file: 'C:/EquipoIA/tether-blacklist/config.secret.json' });
const no = JSON.parse(fs.readFileSync(path.join(__dirname, 'polytrop-no-tenemos.json'), 'utf8'));
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function api(chainid, params) { for (let i = 0; i < 5; i++) { try { const r = await fetch('https://api.etherscan.io/v2/api?' + new URLSearchParams({ chainid, apikey: K.key, ...params }), { signal: AbortSignal.timeout(30000) }); const j = await r.json(); if (j.status === '1') return j.result; if (/No transactions found|No records/i.test(String(j.message))) return []; await sleep(1000 * (i + 1)); } catch { await sleep(1000 * (i + 1)); } } return null; }
const pick = (arr, n) => { const o = [], step = Math.max(1, Math.floor(arr.length / n)); for (let i = 0; i < arr.length && o.length < n; i += step) o.push(arr[i]); return o; };
(async () => {
  const src = no.filter(x => x.rol === 'source' && x.red === 'evm'), fl = no.filter(x => x.rol === 'flagged' && x.red === 'evm');
  const muestra = pick(src, 24).concat(pick(fl, 8)); const out = [];
  for (const x of muestra) {
    const res = { a: x.a, rol: x.rol };
    for (const [nom, cid] of [['eth', 1], ['arb', 42161], ['pol', 137]]) {
      const b = await api(cid, { module: 'account', action: 'balance', address: x.a, tag: 'latest' }); await sleep(210);
      const t = await api(cid, { module: 'account', action: 'txlist', address: x.a, startblock: 0, endblock: 99999999, page: 1, offset: 3, sort: 'asc' }); await sleep(210);
      const u = await api(cid, { module: 'account', action: 'txlist', address: x.a, startblock: 0, endblock: 99999999, page: 1, offset: 1, sort: 'desc' }); await sleep(210);
      res[nom] = { saldo: b && /^\d+$/.test(String(b)) ? +(Number(b) / 1e18).toFixed(5) : null, primera: Array.isArray(t) && t[0] ? new Date(t[0].timeStamp * 1000).toISOString().slice(0, 16) : null, ultima: Array.isArray(u) && u[0] ? new Date(u[0].timeStamp * 1000).toISOString().slice(0, 16) : null, primeras: Array.isArray(t) ? t.slice(0, 2).map(y => (y.from === x.a ? 'OUT→' + y.to.slice(0, 10) : 'IN←' + y.from.slice(0, 10)) + ' ' + (Number(y.value) / 1e18).toFixed(3)) : null };
    }
    out.push(res); console.log(JSON.stringify(res));
  }
  fs.writeFileSync(path.join(__dirname, 'polytrop-muestra.json'), JSON.stringify(out, null, 1));
})();
