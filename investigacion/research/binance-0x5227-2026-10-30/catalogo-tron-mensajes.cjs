'use strict';
// Catálogo de TRON: mensajes (notas) recibidos por las billeteras del ladrón, polvo/envenenamiento de direcciones y tokens basura.
// Uso: node catalogo-tron-mensajes.cjs → tron/catalogo-tron-mensajes.json
const fs = require('fs');
const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs');
const keys = loadTronKeys({ file: 'C:/EquipoIA/tether-blacklist/config.secret.json' }); const HS = { accept: 'application/json', 'TRON-PRO-API-KEY': keys.tronscanKey };
const D = 'C:/EquipoIA/research/binance-0x5227-2026-10-30/tron/'; const sleep = ms => new Promise(r => setTimeout(r, ms)); const USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const W = { TG5iBMQPrDzJJAUM8GMVBf1hRaJ1wvzsGi: 'TG5iBMQ… 1.ª billetera', TPBkSjkCMn2ckrMuAP8n2J1jdjbw76bKN4: 'TPBkSj… cambia USDT por TRX', TCzBTkqn66yApqbYoPezaEQosM5DAd7Y62: 'TCzBTk… USDT apartados', TSpe5HC3PRD2svJcr1YoGszhHk2mtkyZ8A: 'TSpe5HC3… aparca el TRX', TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki: 'TRBdWq… reparto', TAk1xJNWuBYvJHLsUiBFLeuK6xvpQUFYP5: 'TAk1xJNW… paso de 120 M', TL2F4GhnaFVZBZPncHYjwfYZFW44NcfVwj: 'TL2F4Ghn… depósito', TCBAz7itvtX5CjBzVMPQdrbwQLN63ao1fk: 'TCBAz7it… depósito', TJajtPqDqUGh1Sr1j8ugHoSXBVpaFLLHKT: 'TJajtPqD… depósito', TKkH2vH6kyi2QKcMbqym53WMuvdd1xvw6K: 'TKkH2vH6… depósito' };
const T0 = Date.UTC(2026, 9, 29, 19, 0);
async function S(u) { for (let i = 0; i < 5; i++) { try { await sleep(340); const r = await fetch('https://apilist.tronscanapi.com' + u, { headers: HS, signal: AbortSignal.timeout(25000) }); if (r.status === 429) { await sleep(2000 * (i + 1)); continue; } return await r.json(); } catch { await sleep(1000 * (i + 1)); } } return null; }
const iso = ms => new Date(ms).toISOString().slice(0, 19).replace('T', ' ');
(async () => {
  const t0 = Date.now(); const out = { generado: new Date().toISOString(), billeteras: W, filas: [], tokens: {}, errores: [] };
  // contrapartes reales (para detectar imitaciones): billeteras del ladrón + las del recorrido que han tratado con ellas + casas y orígenes
  const real = new Set(Object.keys(W)); real.add('TDqSquXBgUCLYvYC4XZgrprLK589dkhSCf');
  for (const f of ['traza-cache.json', 'traza-post-cache.json']) { const rec = JSON.parse(fs.readFileSync(D + f, 'utf8')).rec; for (const [a, r] of Object.entries(rec)) { if (!(a in W) && !(r.nivel <= 2)) continue; real.add(a); for (const e of [...(r.ent || []), ...(r.sal || [])]) if (e.v >= 100000) real.add(e.de || e.a); } }
  const realL = [...real];
  const parecido = s => { let best = null; for (const c of realL) { if (c === s) continue; let p = 0; while (p < s.length && s[p] === c[p]) p++; let q = 0; while (q < s.length && s[s.length - 1 - q] === c[c.length - 1 - q]) q++; if (p >= 4 && q >= 4) { if (!best || p + q > best.p + best.q) best = { c, p, q }; } } return best; };
  for (const [w, nombre] of Object.entries(W)) {
    // 1) TRX nativo y TRC10 (con nota)
    let rows = [], total = null; for (let p = 0; p < 400; p++) { const j = await S(`/api/transfer?address=${w}&limit=50&start=${p * 50}&sort=timestamp&count=true&start_timestamp=${T0}&end_timestamp=${Date.now()}`); if (!j) { out.errores.push(['transfer', w, p]); break; } if (p === 0) total = j.total; const d = j.data || []; rows.push(...d); if (d.length < 50) break; }
    // 2) TRC20 (USDT y otros)
    let r20 = []; for (let p = 0; p < 400; p++) { const j = await S(`/api/token_trc20/transfers?limit=50&start=${p * 50}&sort=timestamp&count=true&relatedAddress=${w}&start_timestamp=${T0}&end_timestamp=${Date.now()}`); if (!j) { out.errores.push(['trc20', w, p]); break; } const d = j.token_transfers || []; r20.push(...d); if (d.length < 50) break; }
    let nPequenas = 0;
    for (const t of rows) {
      const entra = t.transferToAddress === w, sale = t.transferFromAddress === w; if (!entra && !sale) continue; const trx = t.tokenName === '_', cant = trx ? t.amount / 1e6 : t.amount / Math.pow(10, (t.tokenInfo && t.tokenInfo.tokenDecimal) || 0);
      const grande = trx && cant >= 10000;
      const f = { billetera: w, nombre, sentido: entra ? 'entra' : 'sale', contraparte: entra ? t.transferFromAddress : t.transferToAddress, hora: t.timestamp, tx: t.transactionHash, tipo: trx ? 'TRX' : 'TRC10', token: trx ? 'TRX' : (t.tokenInfo ? t.tokenInfo.tokenAbbr : ''), tokenNombre: trx ? 'TRX' : (t.tokenInfo ? t.tokenInfo.tokenName : ''), tokenId: trx ? '_' : t.tokenName, cantidad: cant, grande, nota: null };
      if (!trx) { const k = f.tokenId; const x = out.tokens[k] || (out.tokens[k] = { id: k, abreviatura: f.token, nombre: f.tokenNombre, red: 'TRON (TRC10)', n: 0, destinatarios: new Set(), remitentes: new Set(), ejemplo: t.transactionHash }); x.n++; x.destinatarios.add(w); x.remitentes.add(f.contraparte); }
      out.filas.push(f);
      if (entra && !grande) nPequenas++;
    }
    for (const t of r20) {
      const entra = t.to_address === w, sale = t.from_address === w; if (!entra && !sale) continue; const dec = Number(t.tokenInfo && t.tokenInfo.tokenDecimal) || 6; const cant = Number(t.quant) / Math.pow(10, dec); const esUsdt = t.contract_address === USDT;
      const f = { billetera: w, nombre, sentido: entra ? 'entra' : 'sale', contraparte: entra ? t.from_address : t.to_address, hora: t.block_ts, tx: t.transaction_id, tipo: 'TRC20', token: t.tokenInfo ? t.tokenInfo.tokenAbbr : '', tokenNombre: t.tokenInfo ? t.tokenInfo.tokenName : '', tokenId: t.contract_address, cantidad: cant, grande: esUsdt && cant >= 350, nota: null, usdt: esUsdt };
      if (!esUsdt) { const k = t.contract_address; const x = out.tokens[k] || (out.tokens[k] = { id: k, abreviatura: f.token, nombre: f.tokenNombre, red: 'TRON (TRC20)', n: 0, destinatarios: new Set(), remitentes: new Set(), ejemplo: t.transaction_id }); x.n++; x.destinatarios.add(w); x.remitentes.add(f.contraparte); }
      out.filas.push(f);
    }
    console.log(nombre.padEnd(34), 'TRX/TRC10', rows.length, '(total TronScan', total, ') | TRC20', r20.length, '| pequeñas que entran', nPequenas, '| min', Math.round((Date.now() - t0) / 60000));
  }
  // notas: se piden por transacción a todo lo que entra y no es grande (TRX/TRC10), y a las salidas de las billeteras que no son el reparto
  const pedir = out.filas.filter(f => f.tipo !== 'TRC20' && ((f.sentido === 'entra' && !f.grande) || (f.sentido === 'sale' && f.billetera !== 'TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki')));
  const vistos = new Map(); let n = 0;
  for (const f of pedir) { if (!vistos.has(f.tx)) { const j = await S('/api/transaction-info?hash=' + f.tx); vistos.set(f.tx, j && j.data ? String(j.data) : ''); if (++n % 100 === 0) console.log('  notas…', n, '/', new Set(pedir.map(x => x.tx)).size, '| min', Math.round((Date.now() - t0) / 60000)); } f.nota = vistos.get(f.tx) || null; }
  for (const f of out.filas) { if (f.sentido === 'entra' && !f.grande) { const p = parecido(f.contraparte); if (p) f.imita = p.c; } }
  for (const x of Object.values(out.tokens)) { x.destinatarios = [...x.destinatarios]; x.remitentes = [...x.remitentes]; }
  fs.writeFileSync(D + 'catalogo-tron-mensajes.json', JSON.stringify(out));
  const ent = out.filas.filter(f => f.sentido === 'entra'); const conNota = out.filas.filter(f => f.nota);
  console.log('\nfilas', out.filas.length, '| entran', ent.length, '| con nota', conNota.length, '| tokens basura', Object.keys(out.tokens).length, '| con imitación', out.filas.filter(f => f.imita).length, '| errores', out.errores.length, '| min', Math.round((Date.now() - t0) / 60000));
})().catch(e => { console.error('ERROR', e.stack); process.exit(1); });
