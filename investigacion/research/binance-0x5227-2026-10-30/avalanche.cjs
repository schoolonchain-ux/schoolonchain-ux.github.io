'use strict';
// Avalanche C-Chain sin clave de pago: Routescan (API compatible con Etherscan) + RPC público de Avalanche.
// 1) lo que recibió 0x5227… en Avalanche; 2) ¿están bloqueados el destino y los remitentes por Tether? (llamada isBlackListed en cadena + eventos).
const fs = require('fs');
const RS = 'https://api.routescan.io/v2/network/mainnet/evm/43114/etherscan/api', RPC = 'https://api.avax.network/ext/bc/C/rpc';
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function rs(p) { for (let i = 0; i < 4; i++) { try { await sleep(350); const u = new URL(RS); for (const [k, v] of Object.entries(p)) u.searchParams.set(k, v); const j = await (await fetch(u, { signal: AbortSignal.timeout(30000) })).json(); if (j.status === '0' && /rate|limit/i.test(String(j.message + j.result))) { await sleep(2000); continue; } return j; } catch { await sleep(1000); } } return null; }
async function rpc(method, params) { for (let i = 0; i < 3; i++) { try { await sleep(150); const r = await fetch(RPC, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }), signal: AbortSignal.timeout(30000) }); const j = await r.json(); if (j.error) return { error: j.error.message }; return j; } catch { await sleep(800); } } return null; }
const A5227 = '0x5227f603c1ee34ce3c06efe6477003bdfccb2f8c';
(async () => {
  const out = { generado: new Date().toISOString(), fuente: 'Routescan (Etherscan-compatible, sin clave) + api.avax.network RPC público' };
  const tk = await rs({ module: 'account', action: 'tokentx', address: A5227, startblock: 0, endblock: 99999999, page: 1, offset: 1000, sort: 'asc' });
  const tx = await rs({ module: 'account', action: 'txlist', address: A5227, startblock: 0, endblock: 99999999, page: 1, offset: 1000, sort: 'asc' });
  out.tokentx = (tk && Array.isArray(tk.result)) ? tk.result : []; out.txlist = (tx && Array.isArray(tx.result)) ? tx.result : [];
  console.log('tokentx', out.tokentx.length, 'txlist', out.txlist.length);
  // contratos de token con más importe recibido
  const por = {}; for (const t of out.tokentx) { if (t.to.toLowerCase() !== A5227) continue; const c = Number(t.value) / Math.pow(10, Number(t.tokenDecimal)); const k = t.contractAddress.toLowerCase(); const x = por[k] || (por[k] = { c: k, sim: t.tokenSymbol, nom: t.tokenName, tot: 0, n: 0, de: new Set() }); x.tot += c; x.n++; x.de.add(t.from.toLowerCase()); }
  out.recibido = Object.values(por).map(x => ({ ...x, de: [...x.de] })).sort((a, b) => b.tot - a.tot);
  for (const x of out.recibido.slice(0, 6)) console.log(x.sim, x.nom, x.c, Math.round(x.tot), x.n, 'remitentes', x.de.length);
  fs.writeFileSync('C:/EquipoIA/research/binance-0x5227-2026-10-30/tron/avalanche-bruto.json', JSON.stringify(out));
})();
