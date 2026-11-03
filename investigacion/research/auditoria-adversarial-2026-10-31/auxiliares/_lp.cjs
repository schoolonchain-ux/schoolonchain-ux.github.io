'use strict';
// ¿Las billeteras del recorrido montan o deshacen liquidez (LP) en SunSwap/JustSwap o usan JustLend? Lee las LLAMADAS a contratos de cada billetera que tocó un contrato de cambio (TronGrid, solo lectura)
// y cuenta qué función llamó (por el selector de 4 bytes). La señal que interesa: «deshace LP sin haberlo montado» (lo recibió de otra billetera) y «monta LP y no lo deshace» (lo pasó a otra).
// Uso: node _lp.cjs [tramo4]   → tramoN/lp-diagnostico.json (reanudable: tramoN/lp-cache.json)
const fs = require('fs'); const { selector } = require('C:/EquipoIA/chainscope/src/core/keccak.cjs');
const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs'); const keys = loadTronKeys({ file: 'C:/EquipoIA/tether-blacklist/config.secret.json' });
const pref = process.argv[2] || 'tramo4'; const D = 'C:/EquipoIA/research/auditoria-adversarial-2026-10-31/' + pref + '/';
const { rec, term } = JSON.parse(fs.readFileSync(D + pref + '-cache.json', 'utf8')); const clases = JSON.parse(fs.readFileSync(D + 'traza-clases.json', 'utf8'));
const TS = JSON.parse(fs.readFileSync(D + 't4.json', 'utf8')).t3; const sleep = ms => new Promise(r => setTimeout(r, ms));
const FIRMAS = {
  'V2 · monta LP': ['addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256)', 'addLiquidityETH(address,uint256,uint256,uint256,address,uint256)'],
  'V2 · deshace LP': ['removeLiquidity(address,address,uint256,uint256,uint256,address,uint256)', 'removeLiquidityETH(address,uint256,uint256,uint256,address,uint256)', 'removeLiquidityETHSupportingFeeOnTransferTokens(address,uint256,uint256,uint256,address,uint256)'],
  'V1 · monta LP': ['addLiquidity(uint256,uint256,uint256)'], 'V1 · deshace LP': ['removeLiquidity(uint256,uint256,uint256,uint256)'],
  'V3 · crea posición (mint)': ['mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))'], 'V3 · añade liquidez': ['increaseLiquidity((uint256,uint256,uint256,uint256,uint256,uint256))'],
  'V3 · quita liquidez': ['decreaseLiquidity((uint256,uint128,uint256,uint256,uint256))'], 'V3 · cobra/retira (collect)': ['collect((uint256,address,uint128,uint128))'], 'V3 · cierra posición (burn)': ['burn(uint256)'],
  'multicall (V3 y routers)': ['multicall(bytes[])', 'multicall(uint256,bytes[])'], 'transfiere un NFT (posición V3)': ['safeTransferFrom(address,address,uint256)', 'safeTransferFrom(address,address,uint256,bytes)'],
  'JustLend · deposita (mint)': ['mint(uint256)'], 'JustLend · retira (redeem)': ['redeem(uint256)'], 'JustLend · retira (redeemUnderlying)': ['redeemUnderlying(uint256)'],
  'transfiere un token': ['transfer(address,uint256)'], 'aprueba un token': ['approve(address,uint256)'],
};
const SEL = {}; for (const [nombre, fs2] of Object.entries(FIRMAS)) for (const f of fs2) SEL[selector(f)] = nombre;
const conSwap = {}; for (const w of Object.keys(rec)) { if (!rec[w].ok) continue; for (const e of rec[w].sal || []) { const c = (term[e.a] && term[e.a].clase) || clases[e.a]; if (c && c.tipo === 'swap' && e.v >= 3520 && e.at <= TS) { const x = conSwap[w] || (conSwap[w] = { desde: e.at }); x.desde = Math.min(x.desde, e.at); } } }
const ws = Object.keys(conSwap); let cache = {}; try { cache = JSON.parse(fs.readFileSync(D + 'lp-cache.json', 'utf8')); } catch { /* primera vez */ }
async function getj(url) { for (let i = 0; i < 7; i++) { try { const r = await fetch(url, { headers: { accept: 'application/json', 'TRON-PRO-API-KEY': keys.tronGridKey }, signal: AbortSignal.timeout(25000) }); if (r.status === 429) { await sleep(3000 * (i + 1)); continue; } if (!r.ok) { await sleep(1500 * (i + 1)); continue; } return await r.json(); } catch { await sleep(1500 * (i + 1)); } } return null; }
let hechas = Object.keys(cache).length; const cola = ws.filter(w => !cache[w]); console.log('billeteras', ws.length, '| ya leídas', hechas, '| por leer', cola.length);
async function trabajador() {
  while (cola.length) {
    const w = cola.shift(); const desde = conSwap[w].desde - 120000; let url = `https://api.trongrid.io/v1/accounts/${w}/transactions?only_confirmed=true&limit=200&order_by=block_timestamp,asc&min_timestamp=${desde}&max_timestamp=${TS}`; const cuenta = {}; const ejemplos = {}; let pag = 0, ok = true, nCalls = 0;
    while (url) { const j = await getj(url); if (!j) { ok = false; break; } for (const x of j.data || []) { const c = x.raw_data && x.raw_data.contract && x.raw_data.contract[0]; if (!c || c.type !== 'TriggerSmartContract' || !(x.ret && x.ret[0] && x.ret[0].contractRet === 'SUCCESS')) continue; const d = String(c.parameter.value.data || ''); const sel = d.slice(0, 8); nCalls++; const n = SEL[sel]; if (!n) continue; cuenta[n] = (cuenta[n] || 0) + 1; (ejemplos[n] = ejemplos[n] || []).length < 3 && ejemplos[n].push({ tx: x.txID, contrato: c.parameter.value.contract_address, at: x.block_timestamp }); }
      url = j.meta && j.meta.links && j.meta.links.next; pag++; await sleep(300); if (pag > 60) { ok = false; break; } }
    cache[w] = { ok, nCalls, cuenta, ejemplos }; hechas++; if (hechas % 50 === 0) { console.log('  …', hechas, '/', ws.length); fs.writeFileSync(D + 'lp-cache.json', JSON.stringify(cache)); }
  }
}
(async () => {
  await Promise.all([trabajador(), trabajador()]); fs.writeFileSync(D + 'lp-cache.json', JSON.stringify(cache));
  const tot = {}, wal = {}; let fallos = 0; for (const [w, r] of Object.entries(cache)) { if (!r.ok) fallos++; for (const [n, k] of Object.entries(r.cuenta)) { tot[n] = (tot[n] || 0) + k; wal[n] = (wal[n] || 0) + 1; } }
  const monta = Object.entries(cache).filter(([, r]) => Object.keys(r.cuenta).some(n => /monta|crea posición|añade/.test(n))).map(([w]) => w), deshace = Object.entries(cache).filter(([, r]) => Object.keys(r.cuenta).some(n => /deshace|quita|cierra|cobra/.test(n))).map(([w]) => w);
  const sinMontar = deshace.filter(w => !monta.includes(w)), sinDeshacer = monta.filter(w => !deshace.includes(w));
  const R = { leidas: ws.length, fallos, llamadasPorFuncion: tot, billeterasPorFuncion: wal, montan: monta.length, deshacen: deshace.length, deshacenSinMontar: sinMontar, montanSinDeshacer: sinDeshacer };
  fs.writeFileSync(D + 'lp-diagnostico.json', JSON.stringify(R, null, 1)); console.log(JSON.stringify({ ...R, deshacenSinMontar: sinMontar.length, montanSinDeshacer: sinDeshacer.length }, null, 1));
})().catch(e => { console.error('ERROR', e.message); process.exit(1); });
