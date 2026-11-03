'use strict';
// TRAMO 6 (auditoría 3-nov): análisis del rastreo a fondo de lo repartido por TRBdWq… ANTES de la foto (copia de analisis-tramo5.cjs); semilla TRBdWq… con pureza 1. El corte T3 de este tramo es la FOTO (30-oct 22:40 UTC), no la hora de lectura. Basado en traza-analisis.cjs: lee tramo6-cache.json (salida de traza.cjs), calcula la pureza de cada billetera (mezcla proporcional), reparte el dinero por destino final y lee los saldos.
const fs = require('fs');
const { createChainReader } = require('C:/EquipoIA/onchain-core/src/cadena.cjs');
const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs');
const keys = loadTronKeys({ file: 'C:/EquipoIA/tether-blacklist/config.secret.json' });
const OUT = process.env.TRAMO_DIR || 'C:/EquipoIA/research/auditoria-adversarial-2026-10-31/tramo6-v03/';   // TRAMO_DIR: carpeta congelada donde leer y escribir (p. ej. tramo6-v03/)
const PX = 0.352, USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', SEGUIR_USD = 3520;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fmt = n => Math.round(n).toLocaleString('en');
const HG = { accept: 'application/json', 'TRON-PRO-API-KEY': keys.tronGridKey };
const http = async ({ url, method = 'GET', body = null, timeoutMs = 20000, headers: extra }) => { const headers = Object.assign({ accept: 'application/json' }, extra || {}); if (/api\.trongrid\.io/.test(url) && keys.tronGridKey) headers['TRON-PRO-API-KEY'] = keys.tronGridKey; const r = await fetch(url, { method, headers, signal: AbortSignal.timeout(timeoutMs) }); let json = null; try { json = await r.json(); } catch {} return { status: r.status, json }; };
const lector = createChainReader({ http, tronscanKey: keys.tronscanKey, log: () => {} });
const { rec, term } = JSON.parse(fs.readFileSync(OUT + 'tramo6-cache.json', 'utf8'));
const clases = JSON.parse(fs.readFileSync(OUT + 'traza-clases.json', 'utf8'));
const MAN = (() => { try { return JSON.parse(fs.readFileSync('C:/EquipoIA/research/auditoria-adversarial-2026-10-31/resultados/contratos-clasificados.json', 'utf8')); } catch { return null; } })();   // contratos clasificados con evidencia (clasificar-contratos-sin-resolver.cjs)
if (MAN) for (const [a, c] of Object.entries(MAN.contratos)) { const cl = c.regla === 'puente' ? { tipo: 'puente', nombre: c.nombre } : (c.regla === 'atrapado' || c.regla === 'servicio') ? { tipo: 'nodo', nombre: c.nombre } : null; if (!cl) continue; clases[a] = cl; if (term[a]) term[a].clase = cl; }
const TSTAR = JSON.parse(fs.readFileSync(OUT + 't4.json', 'utf8')).t3;   // corte de análisis de ESTE tramo (en tramo6-v03/t4.json = la foto, 30-oct 22:40 UTC; en tramo5 es la hora de lectura, 2-nov 09:23 UTC)
for (const w of Object.keys(rec)) { if (rec[w].ent) rec[w].ent = rec[w].ent.filter(e => e.at <= TSTAR); if (rec[w].sal) rec[w].sal = rec[w].sal.filter(e => e.at <= TSTAR); if (rec[w].via) rec[w].via = rec[w].via.filter(e => e.at <= TSTAR); }
for (const w of Object.keys(rec)) for (const v of rec[w].via || []) { const R2 = rec[v.a]; if (R2 && R2.ok) R2.ent.push({ de: w, v: v.v, at: v.at, tx: v.tx, sim: v.sim, cant: v.cant, virtual: true }); }
const SEM = new Set(['TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki']);
const DEP = new Set();
const EXCH = /binance|htx|huobi|okx|okex|bybit|kraken|coinbase|bitfinex|poloniex|kucoin|gate\b|mexc|mxc|bitget|crypto\.com|upbit|bithumb|exchange/i;
(async () => {
  // 1) remitentes desconocidos: ¿contratos (neutros) o carteras ajenas?
  const conocidos = a => rec[a] || clases[a]; const desconocidos = new Set(); let cacheCont = {}; try { cacheCont = JSON.parse(fs.readFileSync(OUT + 'tramo6-escontrato.json', 'utf8')); } catch {}
  for (const w of Object.keys(rec)) for (const e of rec[w].ent || []) if (!conocidos(e.de) && !SEM.has(e.de)) desconocidos.add(e.de);
  console.log('remitentes sin clasificar:', desconocidos.size); const esContrato = new Map(); let n = 0;
  for (const a of desconocidos) { if (a in cacheCont) { esContrato.set(a, cacheCont[a]); continue; } const c = await lector.contratoTron(a).catch(() => ({ ok: false })); esContrato.set(a, !!(c && c.ok && c.contrato)); cacheCont[a] = esContrato.get(a); if (++n % 100 === 0) { console.log('  …', n); fs.writeFileSync(OUT + 'tramo6-escontrato.json', JSON.stringify(cacheCont)); } }
  fs.writeFileSync(OUT + 'tramo6-escontrato.json', JSON.stringify(cacheCont));
  const neutral = a => (clases[a] && (clases[a].tipo === 'swap' || clases[a].tipo === 'prestamo' || clases[a].tipo === 'puente' || clases[a].tipo === 'usdd')) || esContrato.get(a) === true;
  // 2) pureza por punto fijo
  const ALC = new Set(JSON.parse(fs.readFileSync(OUT + 'tramo6-alcanzadas.json', 'utf8'))); const W = Object.keys(rec).filter(w => ALC.has(w) && rec[w].ok && !SEM.has(w) && !DEP.has(w)); const p = {}; for (const s of SEM) p[s] = 1; for (const d of DEP) p[d] = 1; for (const w of W) p[w] = 0;
  const totIn = {}; for (const w of W) { totIn[w] = rec[w].ent.filter(e => !neutral(e.de)).reduce((s, e) => s + e.v, 0); }
  const MODO = process.env.PUREZA || 'actual', SUF = MODO === 'actual' ? '' : '.' + MODO; console.log('método de pureza:', MODO);   // dos vías en paralelo: «actual» (la publicada) y «diluida» (ver _parche-pureza-dos-vias.cjs)
  const sinEnlace = {}; for (const w of W) { const bruto = rec[w].ent.filter(e => !e.virtual && neutral(e.de)).reduce((s, e) => s + e.v, 0), enlazado = rec[w].ent.filter(e => e.virtual).reduce((s, e) => s + e.v, 0); sinEnlace[w] = Math.max(0, bruto - enlazado); }
  if (MODO === 'ciclo') { for (const w of W) { const ent = new Map(), sal = new Map(); for (const e of rec[w].ent) if (!e.virtual && neutral(e.de)) ent.set(e.de, (ent.get(e.de) || 0) + e.v); for (const e of rec[w].sal || []) sal.set(e.a, (sal.get(e.a) || 0) + e.v); let exceso = 0; for (const [c, v] of ent) exceso += Math.max(0, v - (sal.get(c) || 0)); const enlazado = rec[w].ent.filter(e => e.virtual).reduce((s2, e) => s2 + e.v, 0); sinEnlace[w] = Math.max(0, exceso - enlazado); } }
  const den = w => totIn[w] + (MODO !== 'actual' ? sinEnlace[w] : 0);
  let convergio = false; for (let it = 0; it < (+process.env.VUELTAS || 2000); it++) { let cambio = 0; for (const w of W) { const t = rec[w].ent.filter(e => !neutral(e.de)).reduce((s, e) => s + e.v * (p[e.de] || 0), 0); const nuevo = den(w) > 0 ? Math.min(1, t / den(w)) : 0; cambio = Math.max(cambio, Math.abs(nuevo - p[w])); p[w] = nuevo; } if (cambio < 1e-6) { console.log('pureza convergida en', it + 1, 'vueltas'); convergio = true; break; } } if (!convergio) console.log('AVISO: la pureza NO convergió; el resultado no es fiable');
  // 2b) justificantes de JustLend (jUSDT): lo depositado de lo que la billetera luego MANDÓ A OTRA DIRECCIÓN (saltos «jtoken») ya no se queda en «préstamos»: sigue su camino por la receptora.
  //     La parte que se queda es 1 − (valor de los justificantes enviados / valor depositado) de esa billetera (ESTIMADO: valor al tipo de cambio de hoy).
  const fracPrestamo = {}; for (const w of W.concat([...SEM])) { if (!rec[w].ok) continue; let dep = 0, mov = 0; for (const e of rec[w].sal || []) { const c0 = (term[e.a] && term[e.a].clase) || clases[e.a]; if (c0 && c0.tipo === 'prestamo') dep += e.v; } for (const v of rec[w].via || []) if (v.via === 'jtoken') mov += v.v; if (mov > 0) fracPrestamo[w] = dep > 0 ? Math.max(0, 1 - mov / dep) : 1; }
  // 3) destinos finales (aristas terminales)
  const fin = { casa: {}, nodo: {}, prestamo: {}, puente: {}, usdd: {}, no_verificada: {}, perdida: 0 }; const aristasT = []; let continuan = 0, neutrales = 0, polvo = 0;
  for (const w of W.concat([...SEM])) { if (!rec[w].ok) continue; const pw = p[w]; const relevoTx = new Set((rec[w].via || []).filter(v => v.via === 'relevo').map(v => v.tx)); for (const e of rec[w].sal.concat(rec[w].via || [])) {
    if (SEM.has(e.a) || DEP.has(e.a)) continue; if (e.via === undefined && relevoTx.has(e.tx)) continue; if (e.via === 'recolector' && relevoTx.has(e.tx)) continue; if (e.v < SEGUIR_USD) { polvo += e.v * pw; continue; } const c = (term[e.a] && term[e.a].clase) || clases[e.a]; if (!c) continue; const fr = (c.tipo === 'prestamo' && fracPrestamo[w] !== undefined) ? fracPrestamo[w] : 1; const t = e.v * pw * fr;
    if (c.tipo === 'swap') { neutrales += t; continue; } if (c.tipo === 'billetera') { continuan += t; continue; }
    const k = c.tipo === 'casa' ? (c.nombre || e.a) : c.tipo === 'nodo' ? e.a : (c.nombre || c.tipo); const o = fin[c.tipo]; const x = o[k] || (o[k] = { v: 0, vBruto: 0, n: 0, senders: new Set(), dest: e.a, clase: c, primera: e.at, ultima: e.at }); x.v += t; x.vBruto += e.v * fr; x.n++; x.senders.add(w); x.primera = Math.min(x.primera, e.at); x.ultima = Math.max(x.ultima, e.at);
    aristasT.push({ de: w, a: e.a, tipo: c.tipo, nombre: c.nombre || null, v: e.v, pureza: pw, tainted: t, sim: e.sim, cant: e.cant, at: e.at, tx: e.tx, nivel: rec[w].nivel }); } }
  // 3b) entradas en contratos (cambios, bóvedas, enrutadores) cuyo resultado NO se ve: no hay salto de esa transacción y la salida decodificada no vuelve al remitente. Es dinero que entra en un contrato sin que el rastreo vea a quién sale.
  const RET_CONTRATOS = (() => { try { return JSON.parse(fs.readFileSync(OUT + 'retiradas-informe.json', 'utf8')).contratos; } catch { return []; } })();
  const swC = (() => { try { return JSON.parse(fs.readFileSync(OUT + 'tramo6-swaps.json', 'utf8')); } catch { return {}; } })(); const sinRes = {}; let sinResTot = 0, sinResBruto = 0, sinResN = 0;
  for (const w of W) { const r = rec[w]; const viaTx = new Set((r.via || []).map(v => v.tx)); for (const e of r.sal) { if (e.v < SEGUIR_USD) continue; const c = (term[e.a] && term[e.a].clase) || clases[e.a]; if (!c || c.tipo !== 'swap') continue; if (viaTx.has(e.tx)) continue; if (RET_CONTRATOS.includes(e.a) && (r.via || []).some(v => v.via === 'retirada')) continue; /* sus retiradas ya se leyeron (completar-retiradas.cjs) */ const outs = swC[e.tx]; if (outs && outs.some(o => o.a === w)) continue; const x = sinRes[e.a] || (sinRes[e.a] = { nombre: c.nombre, v: 0, vBruto: 0, n: 0, senders: new Set() }); x.v += e.v * p[w]; x.vBruto += e.v; x.n++; x.senders.add(w); sinResTot += e.v * p[w]; sinResBruto += e.v; sinResN++; } }
  // 4) retenido a la hora de la foto: neto de todo lo que entró y salió de cada billetera hasta TSTAR, ponderado por la pureza (sin leer saldos: así todas las billeteras están a la misma hora)
  const saldo = {}; let fallos = 0; let retenido = 0; for (const w of W) { const neto = rec[w].ent.filter(e => !e.virtual).reduce((s2, e) => s2 + e.v, 0) - rec[w].sal.reduce((s2, e) => s2 + e.v, 0); saldo[w] = { neto }; if (neto > 0) retenido += neto * p[w]; }
  // 5) resumen
  const niv = {}; for (const w of W) niv[rec[w].nivel] = (niv[rec[w].nivel] || 0) + 1;
  const fallidas = W.filter(w => !rec[w].ok).length, parciales = W.filter(w => rec[w].parcial).length;
  const R = { generado: new Date().toISOString(), billeteras: W.length, nivelMax: Math.max(...Object.values(rec).map(r => r.nivel)), porNivel: niv, fallidas: Object.keys(rec).filter(w => !rec[w].ok).length, parciales, retenidoTainted: retenido, saldosLeidos: Object.keys(saldo).length, saldosFallidos: fallos, neutrales, continuan, polvo };
  const resumen = obj => Object.entries(obj).map(([k2, x]) => ({ k: k2, v: x.v, vBruto: x.vBruto, n: x.n, senders: x.senders.size, dest: x.dest, clase: x.clase, primera: x.primera, ultima: x.ultima })).sort((a, b) => b.v - a.v);
  R.sinResolver = { total: sinResTot, bruto: sinResBruto, n: sinResN, contratos: Object.entries(sinRes).map(([a, x]) => ({ a, nombre: x.nombre, v: x.v, vBruto: x.vBruto, n: x.n, remitentes: x.senders.size })).sort((m, q) => q.v - m.v) };
  R.fin = { casa: resumen(fin.casa), nodo: resumen(fin.nodo), prestamo: resumen(fin.prestamo), puente: resumen(fin.puente), usdd: resumen(fin.usdd), no_verificada: resumen(fin.no_verificada) };
  R.totales = Object.fromEntries(Object.entries(R.fin).map(([t, l]) => [t, l.reduce((s, x) => s + x.v, 0)]));
  const salidaReparto = (rec['TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki'] ? rec['TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki'].sal : []).filter(e => !SEM.has(e.a) && !DEP.has(e.a)); R.repartoSalida = { envios: salidaReparto.length, v: salidaReparto.reduce((s, e) => s + e.v, 0), destinos: new Set(salidaReparto.map(e => e.a)).size, purezaReparto: p['TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki'] };
  fs.writeFileSync(OUT + 'tramo6-resultado' + SUF + '.json', JSON.stringify({ ...R, metodoPureza: MODO, pureza: p, saldo, ...(MODO !== 'actual' ? { sinEnlace } : {}) }, null, 1));
  fs.writeFileSync(OUT + 'tramo6-aristas-terminales' + SUF + '.json', JSON.stringify(aristasT.sort((a, b) => b.tainted - a.tainted), null, 1));
  console.log('\nbilleteras leídas (sin semillas ni depósitos):', R.billeteras, '| nivel máximo', R.nivelMax, '| lecturas fallidas', R.fallidas, '| parciales', parciales);
  console.log('por nivel:', JSON.stringify(niv));
  console.log('reparto: envíos', R.repartoSalida.envios, 'por', fmt(R.repartoSalida.v), '$ a', R.repartoSalida.destinos, 'billeteras | pureza de TRBdWq', R.repartoSalida.purezaReparto);
  console.log('\n== Dinero del robo que llega a destinos finales (mezcla proporcional, $)');
  for (const [t, v] of Object.entries(R.totales)) console.log('  ', t.padEnd(14), fmt(v).padStart(12));
  console.log('   retenido en billeteras del recorrido (saldo × pureza):', fmt(retenido), '| neutrales (intercambios):', fmt(neutrales), '| siguen a otra billetera (suma de saltos):', fmt(continuan));
  console.log('\n== Conciliación: entrada', fmt(R.repartoSalida.v), '| destinos finales', fmt(Object.values(R.totales).reduce((q, v) => q + v, 0)), '| retenido', fmt(retenido), '| polvo', fmt(polvo), '| entra en contratos sin salida resuelta', fmt(sinResTot), '(bruto', fmt(sinResBruto) + ',', sinResN, 'envíos)');
  for (const x of R.sinResolver.contratos.slice(0, 12)) console.log('   sin resolver', x.a.slice(0, 10), String(x.nombre).padEnd(24), fmt(x.v).padStart(12), '$ en', x.n, 'envíos de', x.remitentes, 'billeteras');
  for (const t of ['casa', 'nodo', 'prestamo', 'puente', 'usdd']) { console.log('\n--', t); for (const x of R.fin[t].slice(0, 12)) console.log('  ', String(x.k).slice(0, 40).padEnd(40), fmt(x.v).padStart(11), '$ (bruto', fmt(x.vBruto) + ') en', String(x.n).padStart(3), 'envíos de', String(x.senders).padStart(3), 'billeteras', x.clase.txs ? '| ' + x.clase.txs + ' ops' : '', x.clase.creada ? '| creada ' + new Date(x.clase.creada).toISOString().slice(0, 10) : ''); }
})().catch(e => { console.error('ERROR', e.message, e.stack); process.exit(1); });
