'use strict';
// Lee el SALDO ACTUAL (TRX, USDT y otros tokens TRC20), la fecha de creación y la última operación de cada billetera de un rastreo.
// Usa TronScan (accountv2: una sola consulta por billetera, con su propia cuota); TronGrid agotó su cuota diaria de 100.000 consultas el 2-nov. Solo lectura.
// Uso: node leer-saldos.cjs <carpeta-del-tramo>   → <tramo>/saldos-actuales.json (reanudable; guarda la hora de cada lectura y de dónde salió)
const fs = require('node:fs'); const path = require('node:path');
const { loadTronKeys } = require('../../tether-blacklist/src/adapters/bot.cjs'); const keys = loadTronKeys({ file: path.join(__dirname, '..', '..', 'tether-blacklist', 'config.secret.json') });
const dir = process.argv[2]; if (!dir) { console.error('uso: node leer-saldos.cjs <carpeta-del-tramo>'); process.exit(1); }
const pref = path.basename(dir.replace(/[\\/]+$/, '')).replace(/-v\d+$/, ''); const out = path.join(dir, 'saldos-actuales.json');
const { rec, term } = JSON.parse(fs.readFileSync(path.join(dir, pref + '-cache.json'), 'utf8'));
const USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'; const sleep = ms => new Promise(r => setTimeout(r, ms));
let S = {}; try { S = JSON.parse(fs.readFileSync(out, 'utf8')); } catch { /* primera lectura */ }
const dirs = [...new Set([...Object.keys(rec), ...Object.keys(term)])].filter(a => /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(a)); const cola = dirs.filter(a => !S[a] || S[a].error);
async function leer(a) {
  for (let i = 0; i < 7; i++) {
    try {
      const r = await fetch('https://apilist.tronscanapi.com/api/accountv2?address=' + a, { headers: { accept: 'application/json', 'TRON-PRO-API-KEY': keys.tronscanKey }, signal: AbortSignal.timeout(25000) });
      if (r.status === 429) { await sleep(2500 * (i + 1)); continue; } if (!r.ok) { await sleep(1500 * (i + 1)); continue; }
      const d = await r.json(); if (d.Error || d.message || typeof d.balance === 'undefined') { await sleep(/suspended for (\d+)/.test(String(d.Error)) ? (+RegExp.$1 + 2) * 1000 : 3000 * (i + 1)); continue; }   // «Error»: límite de 5 consultas/s de TronScan; se espera lo que pide y se repite (nunca se guarda un saldo de una respuesta de error)
      const ts = new Date().toISOString(); const toks = d.withPriceTokens || d.tokens || []; const otros = {}; let usdt = 0;
      for (const t of toks) { const id = t.tokenId || t.tokenAbbr; const dec = Number.isInteger(t.tokenDecimal) ? t.tokenDecimal : 6; if (id === USDT) usdt = Number(t.balance) / Math.pow(10, dec); else if (id && id !== '_' && Number(t.balance) > 0) otros[id] = { abbr: t.tokenAbbr || null, raw: String(t.balance), dec }; }
      return { trx: (Number(d.balance) || 0) / 1e6, usdt, otros, creada: d.date_created || null, ultima: d.latest_operation_time || null, rojo: d.redTag || null, etiqueta: d.publicTag || d.addressTag || null, ts, fuente: 'TronScan accountv2' };
    } catch { await sleep(1500 * (i + 1)); }
  }
  return { error: true, ts: new Date().toISOString() };
}
let hechas = 0; console.log('direcciones', dirs.length, '| por leer', cola.length);
async function trabajador() { while (cola.length) { const a = cola.shift(); S[a] = await leer(a); await sleep(280); if (++hechas % 200 === 0) { fs.writeFileSync(out, JSON.stringify(S)); console.log('  …', hechas, '/', hechas + cola.length); } } }
(async () => { await trabajador(); fs.writeFileSync(out, JSON.stringify(S)); const err = Object.values(S).filter(x => x.error).length; console.log('listo | leídas', Object.keys(S).length, '| con error', err); })();
