'use strict';
// Solo lectura (TronGrid). Lee symbol() y decimals() de los tokens que forman los pares de las posiciones de V3 de la segunda cuenta (salida de j5). Uso: node j5b-simbolos-de-los-tokens.cjs
const fs = require('node:fs'), path = require('node:path');
const A = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const dec = (s) => { let n = 0n; for (const ch of s) n = n * 58n + BigInt(A.indexOf(ch)); return n.toString(16).padStart(50, '0').slice(0, 42); };
const P = JSON.parse(fs.readFileSync(path.join(__dirname, 'operaciones-sunio-14-y-17-nov.json'), 'utf8')).posiciones;
const toks = [...new Set(P.flatMap((p) => [p.token0, p.token1]))], pausa = (ms) => new Promise((r) => setTimeout(r, ms));
async function llamar(t, fn) { for (let i = 0; i < 6; i++) { try { const r = await fetch('https://api.trongrid.io/wallet/triggerconstantcontract', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ owner_address: dec(t), contract_address: dec(t), function_selector: fn, parameter: '' }) }); const j = await r.json(); if (j.constant_result && j.constant_result[0]) return j.constant_result[0]; } catch (e) {} await pausa(2000); } throw new Error('sin respuesta ' + t + ' ' + fn); }
(async () => {
  const out = { version: 1, leidoEn: new Date().toISOString(), fuente: 'TronGrid triggerconstantcontract symbol() y decimals()', tokens: {} };
  for (const t of toks) { const s = await llamar(t, 'symbol()'); await pausa(500); const d = await llamar(t, 'decimals()'); await pausa(500); const len = parseInt(s.slice(64, 128), 16); out.tokens[t] = { simbolo: Buffer.from(s.slice(128, 128 + len * 2), 'hex').toString('utf8'), decimales: parseInt(d, 16), bruto: { symbol: s, decimals: d } }; console.log(t, out.tokens[t].simbolo, out.tokens[t].decimales); }
  fs.writeFileSync(path.join(__dirname, 'simbolos-tokens.json'), JSON.stringify(out, null, 1));
})().catch((e) => { console.error('FALLO', e.message); process.exit(1); });
