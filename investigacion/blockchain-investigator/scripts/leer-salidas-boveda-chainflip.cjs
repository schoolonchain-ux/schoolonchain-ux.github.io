'use strict';
// Salidas de USDT de la bóveda de Chainflip en TRON (TronScan, solo lectura) desde una fecha: son los pagos (egresos y reembolsos) que la bóveda hace en TRON.
// Sirve para ver si un depósito que NO tiene cambio registrado en Chainflip fue devuelto en TRON (importe ≈ depósito − comisión fija).
// Uso: node leer-salidas-boveda-chainflip.cjs <desde ISO> <carpeta-del-tramo>  → <tramo>/vault-chainflip-salidas.json
const fs = require('node:fs'); const path = require('node:path');
const { loadTronKeys } = require('../../tether-blacklist/src/adapters/bot.cjs'); const keys = loadTronKeys({ file: path.join(__dirname, '..', '..', 'tether-blacklist', 'config.secret.json') });
const BOVEDA = 'TEcDijvKSXcfWT7S6rd44H5vNgufm7Y4XC', USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'; const desde = Date.parse(process.argv[2] || '2026-10-29T00:00:00Z'); const dir = process.argv[3]; if (!dir) { console.error('uso: node leer-salidas-boveda-chainflip.cjs <desde ISO> <carpeta>'); process.exit(1); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function pag(start, ini, fin) { for (let i = 0; i < 6; i++) { try { const r = await fetch('https://apilist.tronscanapi.com/api/token_trc20/transfers?' + new URLSearchParams({ limit: 50, start, sort: '-timestamp', contract_address: USDT, fromAddress: BOVEDA, start_timestamp: ini, end_timestamp: fin }), { headers: { 'TRON-PRO-API-KEY': keys.tronscanKey }, signal: AbortSignal.timeout(30000) }); const t = await r.text(); if (r.status === 200 && t.startsWith('{')) return JSON.parse(t); } catch {} await sleep(1500 * (i + 1)); } return null; }
(async () => {
  const filas = []; const VENT = 1 * 3600000; const vistos = new Set(); let incompletas = 0;
  for (let fin = Date.now() + 3600000; fin > desde; fin -= VENT) { const ini = Math.max(desde, fin - VENT); let n = 0;
    for (let st = 0; st < 5000; st += 50) { const j = await pag(st, ini, fin); if (!j) { incompletas++; console.log('lectura incompleta', new Date(ini).toISOString(), st); break; } const rows = j.token_transfers || []; for (const t of rows) { const k = t.transaction_id + t.to_address + t.quant; if (vistos.has(k)) continue; vistos.add(k); filas.push({ tx: t.transaction_id, a: t.to_address, v: Number(t.quant) / 1e6, t: t.block_ts }); n++; } if (rows.length < 50) break; await sleep(600); }
    await sleep(900); }
  fs.writeFileSync(path.join(dir, 'vault-chainflip-salidas.json'), JSON.stringify({ desde: new Date(desde).toISOString(), leidoEn: new Date().toISOString(), n: filas.length, ventanasIncompletas: incompletas, filas }));
  console.log('salidas de USDT de la bóveda desde', new Date(desde).toISOString(), ':', filas.length, '| ventanas incompletas', incompletas, '| total', Math.round(filas.reduce((s, x) => s + x.v, 0)).toLocaleString('es-ES'), 'USDT');
})();
