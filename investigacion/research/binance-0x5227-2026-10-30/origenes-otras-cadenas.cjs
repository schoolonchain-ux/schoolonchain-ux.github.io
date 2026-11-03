'use strict';
// Entradas a 0x5227… en Arbitrum, Avalanche y Polygon (los 7 remitentes) y reenvío de 0x9de7ead3…; direcciones y hashes completos.
const fs = require('fs');
const { loadEtherscanKey } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs');
const K = loadEtherscanKey({ file: 'C:/EquipoIA/tether-blacklist/config.secret.json' }).key; const sleep = ms => new Promise(r => setTimeout(r, ms));
let ult = 0; async function E(chain, p) { for (let i = 0; i < 4; i++) { const w = ult + 240 - Date.now(); if (w > 0) await sleep(w); ult = Date.now(); const u = new URL('https://api.etherscan.io/v2/api'); u.searchParams.set('chainid', chain); for (const [k, v] of Object.entries(p)) u.searchParams.set(k, v); u.searchParams.set('apikey', K); try { const j = await (await fetch(u)).json(); if (j.status === '0' && /rate limit/i.test(String(j.result || j.message))) { await sleep(1200); continue; } return j; } catch { await sleep(800); } } return null; }
const A5227 = '0x5227f603c1ee34ce3c06efe6477003bdfccb2f8c';
(async () => {
  const out = { entradas: [], reenvio: [] };
  for (const [chain, nombre] of [[42161, 'Arbitrum'], [43114, 'Avalanche'], [137, 'Polygon']]) {
    const tx = await E(chain, { module: 'account', action: 'txlist', address: A5227, startblock: 0, endblock: 99999999, page: 1, offset: 1000, sort: 'asc' });
    const tk = await E(chain, { module: 'account', action: 'tokentx', address: A5227, startblock: 0, endblock: 99999999, page: 1, offset: 1000, sort: 'asc' });
    for (const t of (tx && Array.isArray(tx.result) ? tx.result : [])) if (t.to.toLowerCase() === A5227 && Number(t.value) / 1e18 >= 100) out.entradas.push({ cadena: nombre, token: 'ETH', cantidad: Number(t.value) / 1e18, de: t.from, hora: Number(t.timeStamp) * 1000, tx: t.hash });
    for (const t of (tk && Array.isArray(tk.result) ? tk.result : [])) { const c = Number(t.value) / Math.pow(10, Number(t.tokenDecimal)); if (t.to.toLowerCase() === A5227 && c >= 1000000 && !/^(?!.*)/.test(t.tokenSymbol)) out.entradas.push({ cadena: nombre, token: t.tokenSymbol, contrato: t.contractAddress, cantidad: c, de: t.from, hora: Number(t.timeStamp) * 1000, tx: t.hash }); }
    console.log(nombre, 'tx', (tx && tx.result || []).length, 'tokentx', (tk && tk.result || []).length);
  }
  // reenvío de 0x9de7ead3…
  const a = '0x9de7ead321892c1f12b1a5e8b5dc21cf540795e5'; const tk = await E(1, { module: 'account', action: 'tokentx', address: a, startblock: 0, endblock: 99999999, page: 1, offset: 50, sort: 'asc' });
  for (const t of (tk && Array.isArray(tk.result) ? tk.result : [])) out.reenvio.push({ token: t.tokenSymbol, cantidad: Number(t.value) / Math.pow(10, Number(t.tokenDecimal)), de: t.from, a: t.to, hora: Number(t.timeStamp) * 1000, tx: t.hash });
  fs.writeFileSync('C:/EquipoIA/research/binance-0x5227-2026-10-30/tron/origenes-otras-cadenas.json', JSON.stringify(out, null, 1));
  for (const e of out.entradas) console.log(e.cadena, e.token, Math.round(e.cantidad), e.de, new Date(e.hora).toISOString().slice(5, 16), e.tx);
  for (const e of out.reenvio) console.log('reenvío', e.token, Math.round(e.cantidad), e.de.slice(0, 10), '->', e.a, e.tx);
})();
