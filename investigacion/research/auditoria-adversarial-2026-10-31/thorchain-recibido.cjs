'use strict';
// THORChain: lo PEDIDO (memos de las operaciones en Ethereum) frente a lo RECIBIDO en las 11 direcciones TRON de destino (TronScan).
const fs = require('fs'); const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs'); const k = loadTronKeys({ file: 'C:/EquipoIA/tether-blacklist/config.secret.json' });
const HS = { accept: 'application/json', 'TRON-PRO-API-KEY': k.tronscanKey }; const sleep = ms => new Promise(r => setTimeout(r, ms)); const USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', PX = 0.352;
const S = async u => { for (let i = 0; i < 4; i++) { try { await sleep(330); const r = await fetch('https://apilist.tronscanapi.com' + u, { headers: HS, signal: AbortSignal.timeout(25000) }); if (r.status === 429) { await sleep(2000); continue; } return await r.json(); } catch { await sleep(900); } } return null; };
const D = 'C:/EquipoIA/research/binance-0x5227-2026-10-30/tron/'; const th = JSON.parse(fs.readFileSync(D + 'thorchain-decodificado.json', 'utf8')); const fmt = n => Math.round(n).toLocaleString('en');
const dest = {}; for (const o of th) { const d = (o.destinoDir || '').split('/')[0]; if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(d)) continue; const x = dest[d] || (dest[d] = { pedidoUSD: 0, ops: 0, primera: o.hora, ultima: o.hora }); x.pedidoUSD += o.usd || 0; x.ops++; x.primera = Math.min(x.primera, o.hora); x.ultima = Math.max(x.ultima, o.hora); }
(async () => {
  const T0 = Date.UTC(2026, 9, 30, 14, 0), res = []; const remit = {};
  for (const [a, x] of Object.entries(dest)) {
    let usdt = 0, trx = 0, nU = 0, nT = 0; const por = {};
    for (let p = 0; p < 40; p++) { const j = await S('/api/token_trc20/transfers?limit=50&start=' + (p * 50) + '&sort=timestamp&count=true&contract_address=' + USDT + '&relatedAddress=' + a + '&start_timestamp=' + T0 + '&end_timestamp=' + Date.now()); const l = (j && j.token_transfers) || []; for (const t of l) { if (t.to_address === a && t.contractRet === 'SUCCESS') { const q = Number(t.quant) / 1e6; usdt += q; nU++; por[t.from_address] = (por[t.from_address] || 0) + q; } } if (l.length < 50) break; }
    for (let p = 0; p < 40; p++) { const j = await S('/api/transfer?address=' + a + '&limit=50&start=' + (p * 50) + '&sort=timestamp&count=true&start_timestamp=' + T0 + '&end_timestamp=' + Date.now()); const l = (j && j.data) || []; for (const t of l) if (t.tokenName === '_' && t.transferToAddress === a && t.contractRet === 'SUCCESS') { trx += t.amount / 1e6; nT++; } if (l.length < 50) break; }
    const top = Object.entries(por).sort((u, v) => v[1] - u[1]).slice(0, 3); for (const [s, v] of top) remit[s] = (remit[s] || 0) + v;
    res.push({ a, pedidoUSD: x.pedidoUSD, ops: x.ops, recibidoUSDT: usdt, nUSDT: nU, recibidoTRX: trx, nTRX: nT, topRemitentes: top });
    console.log(a.slice(0, 10), 'pedido', fmt(x.pedidoUSD).padStart(10), '$ en', String(x.ops).padStart(3), 'ops | USDT recibido', fmt(usdt).padStart(10), '(' + nU + ') | TRX recibido', fmt(trx), '| remitentes', top.map(([s, v]) => s.slice(0, 8) + ' ' + fmt(v)).join(' ; '));
  }
  fs.writeFileSync(__dirname + '/resultados/thorchain-recibido.json', JSON.stringify({ res, remitentes: remit }, null, 1));
  const ped = res.reduce((s, r) => s + r.pedidoUSD, 0), rec = res.reduce((s, r) => s + r.recibidoUSDT + r.recibidoTRX * PX, 0); console.log('\nPEDIDO (memos)', fmt(ped), '$ | RECIBIDO por esas 11 direcciones desde el 30-oct 14:00 (todas las fuentes)', fmt(rec), '$ (USDT ' + fmt(res.reduce((s, r) => s + r.recibidoUSDT, 0)) + ' + TRX ' + fmt(res.reduce((s, r) => s + r.recibidoTRX, 0)) + ')');
  console.log('remitentes principales (posible vault/router de THORChain en TRON):', Object.entries(remit).sort((u, v) => v[1] - u[1]).slice(0, 5).map(([s, v]) => s + ' ' + fmt(v)).join(' | '));
})();
