'use strict';
// TRAMO 5 · hueco «justificantes de JustLend» (jUSDT): quien deposita USDT en JustLend recibe jUSDT, que SE PUEDE MANDAR A OTRA BILLETERA y retirar desde allí.
// El diagnóstico (auxiliares/_jtokens.cjs) halló que el 99,4 % de los jUSDT recibidos salió a otras direcciones. Aquí cada transferencia de jUSDT se anota como un salto «jtoken»
// de la billetera que depositó hacia la que lo recibe, valorado con el tipo de cambio de JustLend (exchangeRateStored, ESTIMADO: el tipo sube con el tiempo y aquí se usa el de hoy).
// Después el rastreador sigue a cada receptora (lo que retire y lo que mueva). Hace copia de la caché antes de tocarla.
const fs = require('fs'); const path = require('path');
const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs'); const keys = loadTronKeys({ file: 'C:/EquipoIA/tether-blacklist/config.secret.json' });
const { selector } = require('C:/EquipoIA/chainscope/src/core/keccak.cjs');
const OUT = 'C:/EquipoIA/research/auditoria-adversarial-2026-10-31/tramo5/'; const SEG = 3520; const JUSDT = 'TXJgMdjVX5dKiQaUi9QobwNxtSQaFqccvd';
const AL = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'; const aHex = a => { let n = 0n; for (const ch of a) n = n * 58n + BigInt(AL.indexOf(ch)); return n.toString(16).padStart(50, '0').slice(0, 42); };
async function tipoDeCambio() {
  const r = await fetch('https://tron-rpc.publicnode.com/wallet/triggerconstantcontract', { method: 'POST', headers: { 'content-type': 'application/json', 'TRON-PRO-API-KEY': keys.tronGridKey }, body: JSON.stringify({ owner_address: aHex(JUSDT), contract_address: aHex(JUSDT), function_selector: 'exchangeRateStored()', visible: false }), signal: AbortSignal.timeout(25000) });
  const j = await r.json(); const hex = j.constant_result && j.constant_result[0]; if (!hex) throw new Error('sin tipo de cambio: ' + JSON.stringify(j).slice(0, 200));
  const raw = BigInt('0x' + hex.slice(0, 64));   // USDT(6 dec) por jUSDT(8 dec) × 1e16
  return { raw: raw.toString(), usdtPorJusdt: Number(raw) / 1e16, selector: selector('exchangeRateStored()') };
}
(async () => {
  const cachePath = OUT + 'tramo5-cache.json'; const resp = OUT + 'tramo5-cache.antes-de-jtokens.json'; if (!fs.existsSync(resp)) fs.copyFileSync(cachePath, resp);
  const { rec, term } = JSON.parse(fs.readFileSync(cachePath, 'utf8')); const clases = JSON.parse(fs.readFileSync(OUT + 'traza-clases.json', 'utf8'));
  const TS = JSON.parse(fs.readFileSync(OUT + 't4.json', 'utf8')).t3; const diag = JSON.parse(fs.readFileSync(OUT + 'jtokens-diagnostico.json', 'utf8'))[JUSDT]; if (!diag) throw new Error('sin diagnóstico de jUSDT');
  const tc = await tipoDeCambio(); console.log('tipo de cambio jUSDT → USDT', tc.usdtPorJusdt, '(raw', tc.raw + ')');
  let n = 0, total = 0, peqs = 0; const porReceptora = {};
  for (const p of diag.peers) {
    if (p.at > TS) continue; const w = p.de; if (!rec[w] || !rec[w].ok) continue; const usd = p.v * tc.usdtPorJusdt;
    rec[w].via = rec[w].via || []; if (rec[w].via.some(v => v.tx === p.tx && v.via === 'jtoken')) continue;
    if (usd < SEG) { peqs++; }   // se anota igualmente (el libro lo cuenta), el rastreador solo sigue lo >= 3.520 $
    rec[w].via.push({ a: p.a, v: usd, at: p.at, tx: p.tx, sim: 'jUSDT', cant: p.v, via: 'jtoken', contrato: JUSDT, tipoCambio: tc.usdtPorJusdt }); rec[w].viaHechas = (rec[w].viaHechas || []).concat(p.tx); n++; total += usd; porReceptora[p.a] = (porReceptora[p.a] || 0) + usd;
  }
  fs.writeFileSync(cachePath, JSON.stringify({ rec, term, t: new Date().toISOString() }));
  const top = Object.entries(porReceptora).sort((a, b) => b[1] - a[1]);
  fs.writeFileSync(OUT + 'jtokens-informe.json', JSON.stringify({ contrato: JUSDT, tipoDeCambio: tc, saltos: n, total, pequenos: peqs, receptoras: top.length, mayores: top.slice(0, 25).map(([a, v]) => ({ a, usd: v })) }, null, 1));
  console.log('saltos jtoken anotados', n, 'por', Math.round(total).toLocaleString('en'), '$ a', top.length, 'direcciones | menores de 3.520 $:', peqs);
  console.log('mayores:', top.slice(0, 8).map(([a, v]) => a.slice(0, 8) + ' ' + Math.round(v).toLocaleString('en')).join(' | '));
})().catch(e => { console.error('ERROR', e.message); process.exit(1); });
