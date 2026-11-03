'use strict';
// Historia del contrato «Tron_Executor» (Across) en TRON: quién lo creó, cómo se financió, quién lo usó antes del robo (26-30 oct) y si esas direcciones tienen relación con nuestro grafo o con las listas de Polytrop.
// Solo lectura, TronGrid sin clave (1 consulta/s). Guarda las respuestas tal cual en datos/across-ejecutor.json.
const fs = require('fs'); const path = require('path');
const EJ = 'TANdmAmc5jyNEFB1gXbEBfaG7Ftj1XNUG1'; const sl = ms => new Promise(r => setTimeout(r, ms));
const R = 'C:/EquipoIA/research/auditoria-adversarial-2026-10-31/'; const DATOS = path.join(__dirname, '..', 'datos') + '/';
async function g(u, o) { for (let i = 0; i < 5; i++) { try { const r = await fetch(u, Object.assign({ signal: AbortSignal.timeout(25000) }, o || {})); if (r.status === 429) { await sl(2500 * (i + 1)); continue; } return { http: r.status, cuerpo: await r.json() }; } catch { await sl(1500); } } return { http: 0, cuerpo: null }; }
const iso = t => new Date(t).toISOString().slice(0, 16).replace('T', ' ');
(async () => {
  const out = { leidoEn: new Date().toISOString() };
  const k = await g('https://api.trongrid.io/wallet/getcontract', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ value: EJ, visible: true }) }); await sl(1100);
  out.contrato = { http: k.http, nombre: k.cuerpo && k.cuerpo.name, creador: k.cuerpo && k.cuerpo.origin_address, abi: !!(k.cuerpo && k.cuerpo.abi), codigo: !!(k.cuerpo && k.cuerpo.bytecode) };
  const creador = out.contrato.creador;
  const tx = await g('https://api.trongrid.io/v1/accounts/' + EJ + '/transactions?limit=5&order_by=block_timestamp,asc'); await sl(1100);
  out.contratoPrimerasTx = (tx.cuerpo && tx.cuerpo.data || []).map(t => ({ tx: t.txID, t: t.block_timestamp, tipo: t.raw_data.contract[0].type, de: t.raw_data.contract[0].parameter.value.owner_address }));
  // quién es el creador
  const ca = await g('https://api.trongrid.io/v1/accounts/' + creador); await sl(1100); const cd = ca.cuerpo && ca.cuerpo.data && ca.cuerpo.data[0];
  const ct = await g('https://api.trongrid.io/v1/accounts/' + creador + '/transactions?limit=12&order_by=block_timestamp,asc'); await sl(1100);
  const cu = await g('https://api.trongrid.io/v1/accounts/' + creador + '/transactions/trc20?limit=12&order_by=block_timestamp,asc'); await sl(1100);
  out.creador = { direccion: creador, creada: cd && cd.create_time, trx: cd && cd.balance / 1e6, primerasTx: (ct.cuerpo && ct.cuerpo.data || []).map(t => ({ t: t.block_timestamp, tipo: t.raw_data.contract[0].type, v: t.raw_data.contract[0].parameter.value })), primerosTRC20: (cu.cuerpo && cu.cuerpo.data || []).map(t => ({ t: t.block_timestamp, de: t.from, a: t.to, v: t.value, simbolo: t.token_info && t.token_info.symbol })) };
  // uso del ejecutor del 26 al 30 oct (antes del robo): TRC20 ordenados por tiempo
  const ev = []; let fp = null; for (let p = 0; p < 6; p++) { const u = fp ? fp : 'https://api.trongrid.io/v1/accounts/' + EJ + '/transactions/trc20?limit=200&order_by=block_timestamp,asc&min_timestamp=' + Date.UTC(2026, 9, 25) + '&max_timestamp=' + Date.UTC(2026, 9, 31, 4, 0); const r = await g(u); await sl(1100); const d = r.cuerpo && r.cuerpo.data || []; ev.push(...d.map(t => ({ tx: t.transaction_id, tipo: t.type, t: t.block_timestamp, de: t.from, a: t.to, v: t.value, simbolo: t.token_info && t.token_info.symbol, dec: t.token_info && t.token_info.decimals }))); fp = r.cuerpo && r.cuerpo.meta && r.cuerpo.meta.links && r.cuerpo.meta.links.next; if (!fp) break; }
  out.usoPrevio = ev;
  const entrantes = ev.filter(e => e.tipo === 'Transfer' && e.a === EJ); const usuarios = [...new Set(entrantes.map(e => e.de))];
  out.usuarios = []; const cacheT = ['tramo3', 'tramo4', 'tramo5', 'tramo6'].map(t => fs.readFileSync(R + t + '/' + t + '-cache.json', 'utf8')); const csv = fs.readFileSync(DATOS + 'polytrop-binance-hack-addresses.csv', 'utf8');
  for (const u of usuarios.slice(0, 14)) { const a = await g('https://api.trongrid.io/v1/accounts/' + u); await sl(1100); const d = a.cuerpo && a.cuerpo.data && a.cuerpo.data[0]; const p = await g('https://api.trongrid.io/v1/accounts/' + u + '/transactions/trc20?limit=6&order_by=block_timestamp,asc'); await sl(1100);
    out.usuarios.push({ direccion: u, creada: d && d.create_time, enNuestrasCachés: cacheT.some(s => s.includes(u)), enPolytrop: csv.includes(u), primerosTRC20: (p.cuerpo && p.cuerpo.data || []).map(t => ({ t: t.block_timestamp, de: t.from, a: t.to, v: t.value, simbolo: t.token_info && t.token_info.symbol })) }); }
  fs.writeFileSync(DATOS + 'across-ejecutor.json', JSON.stringify(out, null, 1));
  console.log('contrato', JSON.stringify(out.contrato)); console.log('primeras tx del contrato', out.contratoPrimerasTx.map(x => iso(x.t) + ' ' + x.tipo + ' de ' + x.de).join(' | '));
  console.log('CREADOR', creador, 'creada', out.creador.creada && iso(out.creador.creada), 'TRX', out.creador.trx); console.log(' primeras tx:', out.creador.primerasTx.map(x => iso(x.t) + ' ' + x.tipo).join(' | ')); console.log(' primeros TRC20:', out.creador.primerosTRC20.map(x => iso(x.t) + ' ' + (x.de === creador ? 'sale→' + x.a.slice(0, 8) : 'entra←' + x.de.slice(0, 8)) + ' ' + x.v + ' ' + x.simbolo).join(' | '));
  console.log('eventos previos (25-oct → 31-oct 04:00):', ev.length, 'usuarios distintos que envían al ejecutor:', usuarios.length);
  for (const u of out.usuarios) console.log(' ', u.direccion.slice(0, 10), 'creada', u.creada ? iso(u.creada) : '?', 'nuestras:', u.enNuestrasCachés, 'polytrop:', u.enPolytrop, '| primeros:', u.primerosTRC20.slice(0, 3).map(x => iso(x.t).slice(5) + ' ' + (x.de === u.direccion ? 'sale→' : 'entra←') + (x.de === u.direccion ? x.a : x.de).slice(0, 8) + ' ' + Math.round(Number(x.v) / 1e6) + ' ' + x.simbolo).join(' ; '));
})();
