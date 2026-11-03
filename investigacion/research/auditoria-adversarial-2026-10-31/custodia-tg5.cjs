'use strict';
// Cuadre exacto del TRX de TG5iBMQ…: 46.394.098 TRX entran (10.000 de prueba + 46.384.098) y salen 46.383.069 hacia TRBdWq… ¿qué pasa con la diferencia?
const fs = require('fs'); const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs'); const k = loadTronKeys({ file: 'C:/EquipoIA/tether-blacklist/config.secret.json' });
const HG = { accept: 'application/json', 'content-type': 'application/json', 'TRON-PRO-API-KEY': k.tronGridKey }; const sleep = ms => new Promise(r => setTimeout(r, ms));
const TG5 = 'TG5iBMQPrDzJJAUM8GMVBf1hRaJ1wvzsGi';
const G = async (p, b) => { for (let i = 0; i < 4; i++) { try { await sleep(260); const r = await fetch('https://api.trongrid.io' + p, b ? { method: 'POST', headers: HG, body: JSON.stringify(b) } : { headers: HG }); if (r.status === 429) { await sleep(2000); continue; } return await r.json(); } catch { await sleep(800); } } return null; };
(async () => {
  const txs = []; let fp = null; for (let p = 0; p < 20; p++) { const j = await G('/v1/accounts/' + TG5 + '/transactions?only_confirmed=true&limit=200' + (fp ? '&fingerprint=' + fp : '')); const d = (j && j.data) || []; txs.push(...d); fp = j && j.meta && j.meta.fingerprint; if (!fp) break; }
  console.log('transacciones de la cuenta (TronGrid):', txs.length);
  const filas = []; let ent = 0, sal = 0, fees = 0, burn = 0;
  for (const t of txs.sort((a, b) => a.block_timestamp - b.block_timestamp)) {
    const c = t.raw_data.contract[0], v = c.parameter.value; const info = await G('/wallet/gettransactioninfobyid', { value: t.txID }); const fee = (info && info.fee) || 0; const owner = (v.owner_address || '').toLowerCase();
    let tipo = c.type, cant = 0, de = null, a = null; if (c.type === 'TransferContract') { cant = v.amount / 1e6; }
    const esPropia = v.owner_address === TG5 || (v.owner_address || '').toLowerCase() === '4189bf0f6e7d0a7a8a3c6a6c9d4e5f' ; // se compara abajo por dirección base58 con visible
    filas.push({ at: t.block_timestamp, tx: t.txID, tipo, cant, fee: fee / 1e6, ret: t.ret && t.ret[0].contractRet, owner: v.owner_address, to: v.to_address || v.contract_address });
  }
  // dirección en hex para decidir quién paga la comisión
  const acc = await G('/v1/accounts/' + TG5); const saldo = ((acc.data || [])[0] || {}).balance || 0;
  const hexOf = a => { const AL = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'; let n = 0n; for (const ch of a) n = n * 58n + BigInt(AL.indexOf(ch)); return n.toString(16).padStart(50, '0').slice(0, 42); }; const H = hexOf(TG5);
  let totalFee = 0; for (const f of filas) { const mia = (f.owner || '').toLowerCase() === H.toLowerCase(); f.mia = mia; if (mia) totalFee += f.fee; }
  for (const f of filas) { const dir = f.tipo === 'TransferContract'; console.log(new Date(f.at).toISOString().slice(5, 19), f.tipo.padEnd(22), f.ret, f.mia ? 'PROPIA' : 'ajena ', 'TRX', f.cant, 'comisión pagada', f.mia ? f.fee : 0, f.tx.slice(0, 10)); }
  console.log('\ncomisiones pagadas por TG5iBMQ… (campo fee de gettransactioninfobyid):', totalFee.toFixed(6), 'TRX | saldo actual', saldo / 1e6);
  fs.writeFileSync(__dirname + '/resultados/custodia-tg5.json', JSON.stringify({ filas, totalFee, saldo }, null, 1));
})();
