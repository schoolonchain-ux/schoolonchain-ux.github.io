'use strict';
// TRAMO 4 (auditoría 2-nov): análisis del rastreo a fondo de lo repartido por TRBdWq… después de la foto; semilla TRBdWq… con pureza 1, corte T3. Basado en traza-analisis.cjs: lee tramo4-cache.json (salida de traza.cjs), calcula la pureza de cada billetera (mezcla proporcional), reparte el dinero por destino final y lee los saldos.
const fs = require('fs');
const { createChainReader } = require('C:/EquipoIA/onchain-core/src/cadena.cjs');
const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs');
const keys = loadTronKeys({ file: 'C:/EquipoIA/tether-blacklist/config.secret.json' });
const OUT = 'C:/EquipoIA/research/auditoria-adversarial-2026-10-31/tramo4/';
const PX = 0.352, USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', SEGUIR_USD = 3520;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fmt = n => Math.round(n).toLocaleString('en');
const HG = { accept: 'application/json', 'TRON-PRO-API-KEY': keys.tronGridKey };
const http = async ({ url, method = 'GET', body = null, timeoutMs = 20000, headers: extra }) => { const headers = Object.assign({ accept: 'application/json' }, extra || {}); if (/api\.trongrid\.io/.test(url) && keys.tronGridKey) headers['TRON-PRO-API-KEY'] = keys.tronGridKey; const r = await fetch(url, { method, headers, signal: AbortSignal.timeout(timeoutMs) }); let json = null; try { json = await r.json(); } catch {} return { status: r.status, json }; };
const lector = createChainReader({ http, tronscanKey: keys.tronscanKey, log: () => {} });
const { rec, term } = JSON.parse(fs.readFileSync(OUT + 'tramo4-cache.json', 'utf8'));
const clases = JSON.parse(fs.readFileSync(OUT + 'traza-clases.json', 'utf8'));
const TSTAR = JSON.parse(fs.readFileSync(OUT + 't4.json', 'utf8')).t3;   // foto común: 23:40 hora de Madrid del 30-oct; ninguna lectura empezó antes
for (const w of Object.keys(rec)) { if (rec[w].ent) rec[w].ent = rec[w].ent.filter(e => e.at <= TSTAR); if (rec[w].sal) rec[w].sal = rec[w].sal.filter(e => e.at <= TSTAR); if (rec[w].via) rec[w].via = rec[w].via.filter(e => e.at <= TSTAR); }
for (const w of Object.keys(rec)) for (const v of rec[w].via || []) { const R2 = rec[v.a]; if (R2 && R2.ok) R2.ent.push({ de: w, v: v.v, at: v.at, tx: v.tx, sim: v.sim, cant: v.cant, virtual: true }); }
const SEM = new Set(['TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki']);
const DEP = new Set();
const EXCH = /binance|htx|huobi|okx|okex|bybit|kraken|coinbase|bitfinex|poloniex|kucoin|gate\b|mexc|mxc|bitget|crypto\.com|upbit|bithumb|exchange/i;
(async () => {
  // 1) remitentes desconocidos: ¿contratos (neutros) o carteras ajenas?
  const conocidos = a => rec[a] || clases[a]; const desconocidos = new Set(); let cacheCont = {}; try { cacheCont = JSON.parse(fs.readFileSync(OUT + 'tramo4-escontrato.json', 'utf8')); } catch {}
  for (const w of Object.keys(rec)) for (const e of rec[w].ent || []) if (!conocidos(e.de) && !SEM.has(e.de)) desconocidos.add(e.de);
  console.log('remitentes sin clasificar:', desconocidos.size); const esContrato = new Map(); let n = 0;
  for (const a of desconocidos) { if (a in cacheCont) { esContrato.set(a, cacheCont[a]); continue; } const c = await lector.contratoTron(a).catch(() => ({ ok: false })); esContrato.set(a, !!(c && c.ok && c.contrato)); cacheCont[a] = esContrato.get(a); if (++n % 100 === 0) { console.log('  …', n); fs.writeFileSync(OUT + 'tramo4-escontrato.json', JSON.stringify(cacheCont)); } }
  fs.writeFileSync(OUT + 'tramo4-escontrato.json', JSON.stringify(cacheCont));
  const neutral = a => (clases[a] && (clases[a].tipo === 'swap' || clases[a].tipo === 'prestamo' || clases[a].tipo === 'puente' || clases[a].tipo === 'usdd')) || esContrato.get(a) === true;
  // 2) pureza por punto fijo
  const ALC = new Set(JSON.parse(fs.readFileSync(OUT + 'tramo4-alcanzadas.json', 'utf8'))); const W = Object.keys(rec).filter(w => ALC.has(w) && rec[w].ok && !SEM.has(w) && !DEP.has(w)); const p = {}; for (const s of SEM) p[s] = 1; for (const d of DEP) p[d] = 1; for (const w of W) p[w] = 0;
  const totIn = {}; for (const w of W) { totIn[w] = rec[w].ent.filter(e => !neutral(e.de)).reduce((s, e) => s + e.v, 0); }
  for (let it = 0; it < 60; it++) { let cambio = 0; for (const w of W) { const t = rec[w].ent.filter(e => !neutral(e.de)).reduce((s, e) => s + e.v * (p[e.de] || 0), 0); const nuevo = totIn[w] > 0 ? Math.min(1, t / totIn[w]) : 0; cambio = Math.max(cambio, Math.abs(nuevo - p[w])); p[w] = nuevo; } if (cambio < 1e-6) { console.log('pureza convergida en', it + 1, 'vueltas'); break; } }
  // 3) destinos finales (aristas terminales)
  const fin = { casa: {}, nodo: {}, prestamo: {}, puente: {}, usdd: {}, no_verificada: {}, perdida: 0 }; const aristasT = []; let continuan = 0, neutrales = 0, polvo = 0;
  for (const w of W.concat([...SEM])) { if (!rec[w].ok) continue; const pw = p[w]; for (const e of rec[w].sal.concat(rec[w].via || [])) {
    if (SEM.has(e.a) || DEP.has(e.a)) continue; if (e.v < SEGUIR_USD) { polvo += e.v * pw; continue; } const c = (term[e.a] && term[e.a].clase) || clases[e.a]; if (!c) continue; const t = e.v * pw;
    if (c.tipo === 'swap') { neutrales += t; continue; } if (c.tipo === 'billetera') { continuan += t; continue; }
    const k = c.tipo === 'casa' ? (c.nombre || e.a) : c.tipo === 'nodo' ? e.a : (c.nombre || c.tipo); const o = fin[c.tipo]; const x = o[k] || (o[k] = { v: 0, vBruto: 0, n: 0, senders: new Set(), dest: e.a, clase: c, primera: e.at, ultima: e.at }); x.v += t; x.vBruto += e.v; x.n++; x.senders.add(w); x.primera = Math.min(x.primera, e.at); x.ultima = Math.max(x.ultima, e.at);
    aristasT.push({ de: w, a: e.a, tipo: c.tipo, nombre: c.nombre || null, v: e.v, pureza: pw, tainted: t, sim: e.sim, cant: e.cant, at: e.at, tx: e.tx, nivel: rec[w].nivel }); } }
  // 4) retenido a la hora de la foto: neto de todo lo que entró y salió de cada billetera hasta TSTAR, ponderado por la pureza (sin leer saldos: así todas las billeteras están a la misma hora)
  const saldo = {}; let fallos = 0; let retenido = 0; for (const w of W) { const neto = rec[w].ent.filter(e => !e.virtual).reduce((s2, e) => s2 + e.v, 0) - rec[w].sal.reduce((s2, e) => s2 + e.v, 0); saldo[w] = { neto }; if (neto > 0) retenido += neto * p[w]; }
  // 5) resumen
  const niv = {}; for (const w of W) niv[rec[w].nivel] = (niv[rec[w].nivel] || 0) + 1;
  const fallidas = W.filter(w => !rec[w].ok).length, parciales = W.filter(w => rec[w].parcial).length;
  const R = { generado: new Date().toISOString(), billeteras: W.length, nivelMax: Math.max(...Object.values(rec).map(r => r.nivel)), porNivel: niv, fallidas: Object.keys(rec).filter(w => !rec[w].ok).length, parciales, retenidoTainted: retenido, saldosLeidos: Object.keys(saldo).length, saldosFallidos: fallos, neutrales, continuan, polvo };
  const resumen = obj => Object.entries(obj).map(([k2, x]) => ({ k: k2, v: x.v, vBruto: x.vBruto, n: x.n, senders: x.senders.size, dest: x.dest, clase: x.clase, primera: x.primera, ultima: x.ultima })).sort((a, b) => b.v - a.v);
  R.fin = { casa: resumen(fin.casa), nodo: resumen(fin.nodo), prestamo: resumen(fin.prestamo), puente: resumen(fin.puente), usdd: resumen(fin.usdd), no_verificada: resumen(fin.no_verificada) };
  R.totales = Object.fromEntries(Object.entries(R.fin).map(([t, l]) => [t, l.reduce((s, x) => s + x.v, 0)]));
  const salidaReparto = (rec['TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki'] ? rec['TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki'].sal : []).filter(e => !SEM.has(e.a) && !DEP.has(e.a)); R.repartoSalida = { envios: salidaReparto.length, v: salidaReparto.reduce((s, e) => s + e.v, 0), destinos: new Set(salidaReparto.map(e => e.a)).size, purezaReparto: p['TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki'] };
  fs.writeFileSync(OUT + 'tramo4-resultado.json', JSON.stringify({ ...R, pureza: p, saldo }, null, 1));
  fs.writeFileSync(OUT + 'tramo4-aristas-terminales.json', JSON.stringify(aristasT.sort((a, b) => b.tainted - a.tainted), null, 1));
  console.log('\nbilleteras leídas (sin semillas ni depósitos):', R.billeteras, '| nivel máximo', R.nivelMax, '| lecturas fallidas', R.fallidas, '| parciales', parciales);
  console.log('por nivel:', JSON.stringify(niv));
  console.log('reparto: envíos', R.repartoSalida.envios, 'por', fmt(R.repartoSalida.v), '$ a', R.repartoSalida.destinos, 'billeteras | pureza de TRBdWq', R.repartoSalida.purezaReparto);
  console.log('\n== Dinero del robo que llega a destinos finales (mezcla proporcional, $)');
  for (const [t, v] of Object.entries(R.totales)) console.log('  ', t.padEnd(14), fmt(v).padStart(12));
  console.log('   retenido en billeteras del recorrido (saldo × pureza):', fmt(retenido), '| neutrales (intercambios):', fmt(neutrales), '| siguen a otra billetera (suma de saltos):', fmt(continuan));
  for (const t of ['casa', 'nodo', 'prestamo', 'puente', 'usdd']) { console.log('\n--', t); for (const x of R.fin[t].slice(0, 12)) console.log('  ', String(x.k).slice(0, 40).padEnd(40), fmt(x.v).padStart(11), '$ (bruto', fmt(x.vBruto) + ') en', String(x.n).padStart(3), 'envíos de', String(x.senders).padStart(3), 'billeteras', x.clase.txs ? '| ' + x.clase.txs + ' ops' : '', x.clase.creada ? '| creada ' + new Date(x.clase.creada).toISOString().slice(0, 10) : ''); }
})().catch(e => { console.error('ERROR', e.message, e.stack); process.exit(1); });
