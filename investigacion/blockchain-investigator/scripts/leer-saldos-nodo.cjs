'use strict';
// Saldo ACTUAL de cada billetera de un rastreo leído de un nodo público de TRON (no gasta la cuota de TronGrid ni de TronScan): TRX, USDT, justificantes jUSDT de JustLend, fecha de creación y última operación.
// Uso: node leer-saldos-nodo.cjs <carpeta-del-tramo>   → <tramo>/saldos-actuales.json (reanudable; se une a lo ya leído; cada fila lleva su hora y su fuente)
const fs = require('node:fs'); const path = require('node:path');
const dir = process.argv[2]; if (!dir) { console.error('uso: node leer-saldos-nodo.cjs <carpeta-del-tramo>'); process.exit(1); }
const pref = path.basename(dir.replace(/[\\/]+$/, '')).replace(/-v\d+$/, ''); const out = path.join(dir, process.env.SALDOS_SALIDA || 'saldos-actuales.json'); const NODO = process.env.NODO_TRON || 'https://tron-rpc.publicnode.com';
const { rec, term } = JSON.parse(fs.readFileSync(path.join(dir, pref + '-cache.json'), 'utf8')); const sleep = ms => new Promise(r => setTimeout(r, ms));
const USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', JUSDT = 'TXJgMdjVX5dKiQaUi9QobwNxtSQaFqccvd';
const AL = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'; const aHex = a => { let n = 0n; for (const ch of a) n = n * 58n + BigInt(AL.indexOf(ch)); return n.toString(16).padStart(50, '0').slice(0, 42); };
let S = {}; try { S = JSON.parse(fs.readFileSync(out, 'utf8')); } catch { /* primera lectura */ }
const dirs = [...new Set([...Object.keys(rec), ...Object.keys(term)])].filter(a => /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(a)); const cola = dirs.filter(a => !S[a] || S[a].error); if (process.env.ORDEN_INVERSO) cola.reverse();   // ORDEN_INVERSO=1: empieza por el final de la lista, para trabajar a la vez que otro lector que va por el principio (SALDOS_SALIDA = otro fichero, se unen después)
async function post(ruta, cuerpo) { for (let i = 0; i < 6; i++) { try { const r = await fetch(NODO + ruta, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(cuerpo), signal: AbortSignal.timeout(25000) }); if (r.status === 429) { await sleep(2000 * (i + 1)); continue; } if (!r.ok) { await sleep(1000 * (i + 1)); continue; } return await r.json(); } catch { await sleep(1000 * (i + 1)); } } return null; }
const saldoToken = async (token, a) => { const j = await post('/wallet/triggerconstantcontract', { owner_address: aHex(token), contract_address: aHex(token), function_selector: 'balanceOf(address)', parameter: aHex(a).slice(2).padStart(64, '0'), visible: false }); const c0 = j && j.constant_result && j.constant_result[0]; const c = typeof c0 === 'string' ? c0.slice(0, 64) : c0; /* algunos contratos (jUSDT) devuelven el resultado seguido de ceros de relleno */ return typeof c === 'string' && /^[0-9a-f]{64}$/.test(c) ? BigInt('0x' + c) : null; };
async function leer(a) {
  const c = await post('/wallet/getaccount', { address: a, visible: true }); const u = await saldoToken(USDT, a); const j = await saldoToken(JUSDT, a);
  if (c === null || u === null || j === null) return { error: true, ts: new Date().toISOString() };
  const otros = j > 0n ? { [JUSDT]: { abbr: 'jUSDT', raw: String(j), dec: 8 } } : {};
  return { trx: (Number(c.balance) || 0) / 1e6, usdt: Number(u) / 1e6, otros, creada: c.create_time || null, ultima: c.latest_opration_time || null, ts: new Date().toISOString(), fuente: 'nodo público de TRON (getaccount + balanceOf)' };
}
let hechas = 0; console.log('direcciones', dirs.length, '| por leer', cola.length);
async function trabajador() { while (cola.length) { const a = cola.shift(); S[a] = await leer(a); await sleep(260); if (++hechas % 300 === 0) { fs.writeFileSync(out, JSON.stringify(S)); console.log('  …', hechas, '/', hechas + cola.length); } } }
(async () => { await Promise.all(Array.from({ length: +process.env.TRABAJADORES || 2 }, trabajador)); fs.writeFileSync(out, JSON.stringify(S)); const err = Object.values(S).filter(x => x.error).length; console.log('listo | leídas', Object.keys(S).length, '| con error', err); })();
