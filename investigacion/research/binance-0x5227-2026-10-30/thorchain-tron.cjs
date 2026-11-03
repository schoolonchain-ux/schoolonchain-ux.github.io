'use strict';
// Las 11 direcciones TRON a las que THORChain devuelve el dinero, y los puentes pequeños (Bridgers, Rango…) cuyo destino se intenta leer del texto de la llamada.
const fs = require('fs');
const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs');
const keys = loadTronKeys({ file: 'C:/EquipoIA/tether-blacklist/config.secret.json' });
const H = { accept: 'application/json', 'TRON-PRO-API-KEY': keys.tronscanKey }, HG = { accept: 'application/json', 'TRON-PRO-API-KEY': keys.tronGridKey };
const OUT = 'C:/EquipoIA/research/binance-0x5227-2026-10-30/tron/'; const sleep = ms => new Promise(r => setTimeout(r, ms)); const USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const get = async (u, h = H) => { for (let i = 0; i < 4; i++) { try { await sleep(300); const r = await fetch(u, { headers: h, signal: AbortSignal.timeout(20000) }); if (r.status === 429) { await sleep(2000 * (i + 1)); continue; } return await r.json(); } catch { await sleep(800); } } return {}; };
const fmt = n => Math.round(n).toLocaleString('en'); const iso = ms => new Date(ms).toISOString().slice(5, 16).replace('T', ' ');
const ops = JSON.parse(fs.readFileSync(OUT + 'thorchain-decodificado.json', 'utf8')); const estado = JSON.parse(fs.readFileSync('C:/EquipoIA/tron-salidas-watch/state/estado.json', 'utf8')); const clases = JSON.parse(fs.readFileSync(OUT + 'traza-clases.json', 'utf8'));
const dst = {}; for (const o of ops) { if (!o.destinoDir) continue; const a = o.destinoDir.split('/')[0]; if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(a)) continue; const x = dst[a] || (dst[a] = { a, n: 0, usd: 0, primera: o.hora, ultima: o.hora, desdeEVM: new Set() }); x.n++; x.usd += o.usd || 0; x.primera = Math.min(x.primera, o.hora); x.ultima = Math.max(x.ultima, o.hora); x.desdeEVM.add(o.desde); }
const lista = Object.values(dst).sort((a, b) => b.usd - a.usd); console.log('direcciones TRON destino de THORChain:', lista.length);
(async () => {
  const res = [];
  for (const x of lista) {
    const c = await get('https://apilist.tronscanapi.com/api/accountv2?address=' + x.a); const g = ((await get('https://api.trongrid.io/v1/accounts/' + x.a, HG)).data || [])[0] || {};
    const t = await get('https://apilist.tronscanapi.com/api/token_trc20/transfers?limit=50&start=0&sort=-timestamp&count=true&contract_address=' + USDT + '&relatedAddress=' + x.a); const fl = t.token_transfers || [];
    let ent = 0, sal = 0; const dest = {}; for (const f of fl) { const q = Number(f.quant) / 1e6; if (f.to_address === x.a) ent += q; else { sal += q; const k = f.to_address + ((f.to_address_tag && f.to_address_tag.to_address_tag) ? ' (' + f.to_address_tag.to_address_tag + ')' : ''); dest[k] = (dest[k] || 0) + q; } }
    const enArbol = !!estado.destinos[x.a], cls = clases[x.a];
    const f2 = { a: x.a, ops: x.n, usd: x.usd, desdeEVM: x.desdeEVM.size, primera: x.primera, ultima: x.ultima, creada: c.date_created ? new Date(c.date_created).toISOString().slice(0, 10) : null, txs: c.transactions, etiqueta: c.publicTag || c.addressTag || null, trx: Number(g.balance || 0) / 1e6, usdtEnMuestra: { ent, sal, n: fl.length }, destinosUSDT: Object.entries(dest).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => k.slice(0, 44) + ' ' + fmt(v)), enArbolDelVigilante: enArbol, clase: cls ? cls.tipo : null };
    res.push(f2); console.log(x.a, '| ops', String(x.n).padStart(3), fmt(x.usd).padStart(10), '$ | desde', x.desdeEVM.size, 'EVM | creada', f2.creada, '| operaciones', f2.txs, '| TRX', fmt(f2.trx), '| etiqueta', f2.etiqueta || '-', '| en el árbol del vigilante:', enArbol ? 'sí' : 'no', '| USDT (muestra ' + fl.length + '): entra', fmt(ent), 'sale', fmt(sal), '→', f2.destinosUSDT.join(' ; '));
  }
  fs.writeFileSync(OUT + 'thorchain-destinos-tron.json', JSON.stringify(res, null, 1));
  // puentes pequeños: texto legible dentro de la llamada
  const F = JSON.parse(fs.readFileSync(OUT + 'puentes-decodificados.json', 'utf8')).filter(f => !f.evm && f.datosHex !== undefined || (!f.evm && f.selector));
  console.log('\npuentes pequeños sin decodificar:', F.length);
  const txt = {}; let k = 0;
  for (const f of F.slice(0, 80)) { const j = await (await fetch('https://api.trongrid.io/wallet/gettransactionbyid', { method: 'POST', headers: { ...HG, 'content-type': 'application/json' }, body: JSON.stringify({ value: f.tx }) })).json(); const d = (j.raw_data && j.raw_data.contract[0].parameter.value.data) || ''; await sleep(260); const bytes = Buffer.from(d, 'hex'); const cad = bytes.toString('latin1').match(/[ -~]{6,}/g) || []; const evm = (bytes.toString('hex').match(/(?<![0-9a-f])[0-9a-f]{24}([0-9a-f]{40})/g) || []); txt[f.tx] = { puente: f.puente, sel: d.slice(0, 8), cadenas: cad.slice(0, 4), v: f.v, p: f.p }; if (++k % 25 === 0) console.log('  …', k); }
  fs.writeFileSync(OUT + 'puentes-pequenos-texto.json', JSON.stringify(txt, null, 1));
  const por = {}; for (const [tx, x] of Object.entries(txt)) { const key = x.puente + ' | ' + (x.cadenas.join(' / ').slice(0, 70) || '(sin texto)'); por[key] = (por[key] || 0) + 1; } console.log('texto legible por puente:'); for (const [k2, n] of Object.entries(por).sort((a, b) => b[1] - a[1]).slice(0, 14)) console.log('  ', String(n).padStart(3), k2);
})();
