'use strict';
// Prueba de una segunda fuente para el seguimiento en Ethereum: Blockscout (formato compatible con Etherscan). Compara con Etherscan sobre billeteras ya leídas: mismas transacciones, mismos saldos y velocidad. Solo lectura.
const fs = require('fs'); const path = require('path'); const sleep = ms => new Promise(r => setTimeout(r, ms));
const { loadEtherscanKey } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs'); const K = loadEtherscanKey({ file: 'C:/EquipoIA/tether-blacklist/config.secret.json' });
const S = JSON.parse(fs.readFileSync('tramo6/eth-adelante-v2.json', 'utf8')).nodos;
const muestra = Object.entries(S).filter(([a, n]) => n.txTotal > 0).sort((x, y) => x[1].txTotal - y[1].txTotal).filter((_, i, l) => i % Math.max(1, Math.floor(l.length / 8)) === 0).slice(0, 8).map(([a, n]) => [a, n.txTotal, n.saldoEth]);
async function get(url) { const t0 = Date.now(); try { const r = await fetch(url, { signal: AbortSignal.timeout(40000) }); const txt = await r.text(); let j = null; try { j = JSON.parse(txt); } catch { } return { http: r.status, j, ms: Date.now() - t0, txt: txt.slice(0, 150) }; } catch (e) { return { http: 0, j: null, ms: Date.now() - t0, txt: String(e).slice(0, 100) }; } }
const ES = p => 'https://api.etherscan.io/v2/api?' + new URLSearchParams({ chainid: 1, apikey: K.key, ...p }); const BS = p => 'https://eth.blockscout.com/api?' + new URLSearchParams(p);
(async () => {
  console.log('billeteras de la muestra:', muestra.length);
  for (const [a, tot, saldo] of muestra) {
    const p = { module: 'account', action: 'txlist', address: a, startblock: 0, endblock: 99999999, page: 1, offset: 1000, sort: 'asc' };
    const e = await get(ES(p)); await sleep(250); const b = await get(BS(p)); await sleep(250);
    const eh = new Set((e.j && Array.isArray(e.j.result) ? e.j.result : []).map(t => t.hash)), bh = new Set((b.j && Array.isArray(b.j.result) ? b.j.result : []).map(t => t.hash));
    const comun = [...eh].filter(h => bh.has(h)).length; const t1 = b.j && Array.isArray(b.j.result) && b.j.result[0] ? Object.keys(b.j.result[0]).filter(k => ['hash', 'from', 'to', 'value', 'isError', 'timeStamp'].includes(k)).length : 0;
    const bs = await get(BS({ module: 'account', action: 'balance', address: a, tag: 'latest' })); await sleep(250); const es = await get(ES({ module: 'account', action: 'balance', address: a, tag: 'latest' })); await sleep(250);
    const tk = await get(BS({ module: 'account', action: 'tokentx', address: a, page: 1, offset: 1000, sort: 'asc' })); await sleep(250); const tke = await get(ES({ module: 'account', action: 'tokentx', address: a, page: 1, offset: 1000, sort: 'asc' })); await sleep(250);
    const tkb = new Set((tk.j && Array.isArray(tk.j.result) ? tk.j.result : []).map(t => t.hash + t.contractAddress.toLowerCase())), tke2 = new Set((tke.j && Array.isArray(tke.j.result) ? tke.j.result : []).map(t => t.hash + t.contractAddress.toLowerCase()));
    console.log(a.slice(0, 10), '| ya leída tx', tot, '| txlist Etherscan', eh.size, 'Blockscout', bh.size, 'comunes', comun, '| campos clave', t1 + '/6', '| http', e.http, b.http, '| ms', e.ms, b.ms,
      '| saldo E', es.j && es.j.result, 'B', bs.j && bs.j.result, '| tokentx E', tke2.size, 'B', tkb.size, 'comunes', [...tke2].filter(h => tkb.has(h)).length, '| bs http', bs.http, tk.http, b.http !== 200 ? b.txt : '');
  }
})();
