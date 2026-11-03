'use strict';
// TRAMO 3 (auditoría 31-oct): rastreo a fondo del dinero que TRBdWq… repartió DESPUÉS de la foto de las 22:40 UTC del 30-oct (hasta las 10:11:59 del 31-oct: 353 envíos, 58,65 M$). Mismas reglas que los tramos 1 y 2. Corte de lectura T3 en tramo3/t3.json.
// Sin tope de saltos, de billeteras ni de días. Cada billetera se lee en vivo (TronGrid + TronScan) y se calcula qué parte de lo que recibe viene del robo (regla de la mezcla proporcional).
// Se detiene en: casas de cambio con nombre, nodos de servicio (más de 5.000 operaciones), préstamos, puentes y conversiones a USDD. Los contratos de intercambio son neutros: lo que entra de ellos hereda la pureza de la billetera.
// Uso: node traza.cjs  → escribe traza-resultado.json y traza-cache.json junto a los datos en bruto. Reanudable (traza-cache.json).
const fs = require('fs'); const path = require('path');
const { createChainReader } = require('C:/EquipoIA/onchain-core/src/cadena.cjs');
const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs');
const keys = loadTronKeys({ file: 'C:/EquipoIA/tether-blacklist/config.secret.json' });
const OUT = 'C:/EquipoIA/research/auditoria-adversarial-2026-10-31/tramo3/'; const ORIG = 'C:/EquipoIA/research/binance-0x5227-2026-10-30/tron/';
const PX = 0.352, USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', MIN_USD = 350, SEGUIR_USD = 3520,   /* se sigue todo envío de 10.000 TRX (3.520 $) o más: el mismo umbral que el vigilante; lo menor se lee y se cuenta como polvo, pero no abre ramas */ INICIO_ROBO = Date.UTC(2026, 9, 29, 18), HUB = 5000;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SEMILLAS = { TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki: 'reparto (envíos posteriores a la foto)' };
const DEPOSITOS = [];
const RAIZ_REPARTO = 'TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki';
const mkHttp = () => async ({ url, method = 'GET', body = null, timeoutMs = 20000, headers: extra }) => { const headers = Object.assign(body ? { 'content-type': 'application/json', accept: 'application/json' } : { accept: 'application/json' }, extra || {}); if (/api\.trongrid\.io/.test(url) && keys.tronGridKey) headers['TRON-PRO-API-KEY'] = keys.tronGridKey; const r = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(timeoutMs) }); let json = null; try { json = await r.json(); } catch {} return { status: r.status, json }; };
const lectores = [0, 1, 2].map(() => createChainReader({ http: mkHttp(), tronscanKey: keys.tronscanKey, log: () => {} }));
const HG = { accept: 'application/json', 'TRON-PRO-API-KEY': keys.tronGridKey }, HS = { accept: 'application/json', 'TRON-PRO-API-KEY': keys.tronscanKey };
async function getj(u, h, reintentos = 4) { for (let i = 0; i < reintentos; i++) { try { const r = await fetch(u, { headers: h, signal: AbortSignal.timeout(20000) }); if (r.status === 429) { await sleep(1500 * (i + 1)); continue; } return await r.json(); } catch { await sleep(800); } } return null; }

// ---- nombres ya resueltos por el vigilante (gratis) ----
const nombreEv = new Map();
for (const l of fs.readFileSync('C:/EquipoIA/tron-salidas-watch/state/eventos.jsonl', 'utf8').split('\n')) { if (!l) continue; try { const e = JSON.parse(l); if (e.destino && e.nombreDestino) nombreEv.set(e.destino, e.nombreDestino); if (e.origen && e.nombreOrigen) nombreEv.set(e.origen, e.nombreOrigen); } catch {} }
const identCache = new Map(); for (const f of ['identificadas-21h.json']) { try { for (const n of JSON.parse(fs.readFileSync(OUT + f, 'utf8'))) if (n.txs > 0) identCache.set(n.a, n); } catch {} }
try { for (const n of JSON.parse(fs.readFileSync(OUT + 'antepasados-21h.json', 'utf8')).nodos) if (n.txs > 0 && !identCache.has(n.a)) identCache.set(n.a, n); } catch {}
const EXCH = /binance|htx|huobi|okx|okex|bybit|kraken|coinbase|bitfinex|poloniex|kucoin|gate\b|mexc|mxc|bitget|crypto\.com|upbit|bithumb|exchange/i;
const cacheClase = new Map(); try { for (const [k, v] of Object.entries(JSON.parse(fs.readFileSync(OUT + 'traza-clases.json', 'utf8')))) cacheClase.set(k, v); } catch {}
// ---- clasificación de un destino ----
async function clasificar(addr, lector) {
  if (cacheClase.has(addr)) return cacheClase.get(addr);
  let r = null; const nm = nombreEv.get(addr) || '';
  if (/^contrato/.test(nm)) r = claseContrato(nm.replace(/^contrato inteligente\s*/, '').replace(/[«»]/g, ''));
  else if (nm && EXCH.test(nm)) r = { tipo: 'casa', nombre: nm };
  else {
    const j = await getj('https://api.trongrid.io/v1/accounts/' + addr, HG); const d = j && j.data && j.data[0]; const creada = d ? (d.create_time || null) : null;
    if (creada && creada >= INICIO_ROBO) r = { tipo: 'billetera', creada, txs: null, nombre: nm || null };
    else {
      const c = await lector.contratoTron(addr).catch(() => ({ ok: false }));
      if (c && c.ok && c.contrato) r = claseContrato(c.nombre || 'sin nombre');
      else {
        let id = identCache.get(addr);
        if (!id) { for (let i = 0; i < 5 && !id; i++) { await sleep(300); const t = await getj('https://apilist.tronscanapi.com/api/accountv2?address=' + addr, HS, 2); if (t && Number.isFinite(t.transactions) && t.transactions > 0) { id = { a: addr, txs: t.transactions, creada: t.date_created || creada, etiqueta: t.publicTag || t.addressTag || null }; identCache.set(addr, id); } else await sleep(1200 * (i + 1)); } }
        if (!id) r = { tipo: 'no_verificada', creada };
        else if (id.etiqueta && EXCH.test(id.etiqueta)) r = { tipo: 'casa', nombre: id.etiqueta };
        else if (id.txs > HUB) r = { tipo: 'nodo', txs: id.txs, creada: id.creada, nombre: id.etiqueta || nm || null };
        else r = { tipo: 'billetera', creada: id.creada, txs: id.txs, nombre: id.etiqueta || nm || null };
      }
    }
  }
  cacheClase.set(addr, r); return r;
}
function claseContrato(nombre) {
  if (/CErc20|JustLend|jUSDT|jTRX|Comptroller/i.test(nombre)) return { tipo: 'prestamo', nombre };
  if (/OFT|Bridgers|Rango|Prefunded|Stargate|Allbridge|Symbiosis|Meson|DeBridge|Wormhole|LayerZero/i.test(nombre)) return { tipo: 'puente', nombre };
  if (/GemJoin|PSM|USDD/i.test(nombre)) return { tipo: 'usdd', nombre };
  return { tipo: 'swap', nombre };   // enrutadores, pares y piscinas: neutros
}
// ---- lectura de una billetera ----
function aristas(lectura, w) {
  const ent = [], sal = [];
  for (const e of lectura.edges) {
    let v, sim;
    if (e.token === 'native') { v = Number(e.raw) / 1e6 * PX; sim = 'TRX'; } else if (e.token === USDT) { v = Number(e.raw) / 1e6; sim = 'USDT'; } else continue;
    if (!(v >= MIN_USD)) continue;
    const cant = Number(e.raw) / 1e6, x = { v, at: e.at, tx: e.tx, sim, cant, flujo: e.flujo };
    if (e.to === w && e.from !== w) ent.push({ ...x, de: e.from }); else if (e.from === w && e.to !== w) sal.push({ ...x, a: e.to });
  }
  return { ent, sal };
}
async function leer(w, desde, lector) {
  for (let i = 0; i < 7; i++) {   // corrección 31-oct (auditoría): antes 3 intentos con pausas de 2-6 s; el error real era TronGrid HTTP 429
    try { const l = await lector.leerVentana('tron', w, desde, Date.now(), { maxPaginas: 40, orden: 'asc' }); if (l.errores && l.errores.length) { await sleep(4000 * (i + 1)); continue; } const { ent, sal } = aristas(l, w); const parcial = Object.values(l.cobertura || {}).some(c => c && c.completa === false); return { ok: true, ent, sal, parcial }; } catch { await sleep(4000 * (i + 1)); }
  }
  return { ok: false };
}
// Un cambio en un enrutador puede enviar el resultado a OTRA billetera (así encadenan el blanqueo): se decodifica la transacción y cada salida a una billetera se sigue como un salto «virtual».
const swapCache = (() => { try { return JSON.parse(fs.readFileSync(OUT + 'tramo3-swaps.json', 'utf8')); } catch { return {}; } })();
async function salidasDeCambio(tx) {
  if (swapCache[tx]) return swapCache[tx];
  let j = null; for (let i = 0; i < 5 && !j; i++) { await sleep(300); j = await getj('https://apilist.tronscanapi.com/api/transaction-info?hash=' + tx, HS, 2); if (!j || !(j.transfersAllList || j.trc20TransferInfo)) { j = null; await sleep(1000 * (i + 1)); } }
  if (!j) return null;
  const outs = []; for (const t of (j.transfersAllList || [])) { const to = t.to_address; if (!to) continue; const dec = Number.isInteger(t.decimals) ? t.decimals : 6, amt = Number(t.amount_str) / Math.pow(10, dec); let v, sim; if (t.symbol === 'USDT' && t.contract_address === USDT) { v = amt; sim = 'USDT'; } else if (t.symbol === 'TRX') { v = amt * PX; sim = 'TRX'; } else continue; if (!(v >= SEGUIR_USD)) continue; outs.push({ a: to, v, sim, cant: amt }); }
  swapCache[tx] = outs; return outs;
}
const guardarCache = (rec, term) => fs.writeFileSync(OUT + 'tramo3-cache.json', JSON.stringify({ rec, term, t: new Date().toISOString() }));
(async () => {
  if (!fs.existsSync(OUT + 't3.json')) fs.writeFileSync(OUT + 't3.json', JSON.stringify({ t3: Date.now(), iso: new Date().toISOString() }));
  let rec = {}, term = {}; try { const c = JSON.parse(fs.readFileSync(OUT + 'tramo3-cache.json', 'utf8')); rec = c.rec || {}; term = c.term || {}; console.log('reanudando con', Object.keys(rec).length, 'billeteras ya leídas'); } catch {}
  const t0 = Date.now();
  // Nivel 0: las semillas se leen para tener sus aristas (envíos hacia el reparto y los depósitos).
  const nivel0 = Object.keys(SEMILLAS); let cola = [];
  for (const w of nivel0) if (!rec[w]) { const F = JSON.parse(fs.readFileSync(ORIG + 'trb-posfoto-envios.json', 'utf8')).filter(x => x.at <= Date.UTC(2026, 9, 31, 10, 11, 59)); rec[w] = { nivel: 0, seed: true, ok: true, ent: [], sal: F.map(x => ({ v: x.v, at: x.at, tx: x.tx, sim: x.sim, cant: x.cant, flujo: 'envio', a: x.a })), parcial: false, desde: Date.UTC(2026, 9, 30, 22, 40) }; console.log('semilla', w.slice(0, 10), 'envíos', rec[w].sal.length, 'por', Math.round(rec[w].sal.reduce((q, e) => q + e.v, 0))); }
  // Primer nivel de destinos: los de las semillas y el reparto.
  const proc = new Set([...nivel0, ...DEPOSITOS]); let nivel = 0; let frontera = [];   // al reanudar solo las semillas y los depósitos cuentan como hechos; el resto se recorre con su lectura guardada o se repite si falló
  const destinosDe = w => (rec[w].sal || []).map(s => s.a);
  const encolar = async (lista, lector, nv) => {
    const nuevos = new Map();
    for (const { w, e } of lista) { const c = await clasificar(e.a, lector); const t = term[e.a] || (term[e.a] = { clase: c, entradas: [] }); t.clase = c; t.entradas.push({ de: w, v: e.v, at: e.at, tx: e.tx, sim: e.sim, cant: e.cant }); if (c.tipo === 'billetera' && !proc.has(e.a)) { const x = nuevos.get(e.a) || { nivel: nv, desde: e.at }; x.desde = Math.min(x.desde, e.at); nuevos.set(e.a, x); } }
    return nuevos;
  };
  // semillas → siguiente nivel (se excluyen a sí mismas)
  { const lista = []; for (const w of nivel0) if (rec[w].ok) for (const e of rec[w].sal) if (!(e.a in SEMILLAS) && e.v >= SEGUIR_USD) lista.push({ w, e }); const n1 = await encolar(lista, lectores[0], 1); frontera = [...n1]; }
  // las billeteras de depósito: no tienen salidas; se leen igual por si acaso
  for (const w of DEPOSITOS) if (!rec[w]) { const r = await leer(w, Date.UTC(2026, 9, 30, 10), lectores[0]); rec[w] = { nivel: 1, deposito: true, ...r, desde: Date.UTC(2026, 9, 30, 10) }; proc.add(w); }
  frontera = frontera.filter(([a]) => !proc.has(a));
  while (frontera.length) {
    nivel++; console.log('\n== nivel', nivel, '| billeteras a leer', frontera.length, '| minutos', Math.round((Date.now() - t0) / 60000));
    let i = 0, hechas = 0; const siguiente = [];
    async function trabajador(k) {
      while (i < frontera.length) {
        const [w, info] = frontera[i++]; proc.add(w);
        if (rec[w] && rec[w].ok && info.desde >= rec[w].desde - 120000) { for (const e of rec[w].sal) if (e.v >= SEGUIR_USD) siguiente.push({ w, e }); continue; }
        const previa = rec[w]; const desde0 = previa && previa.desde ? Math.min(info.desde, previa.desde) : info.desde; const r = await leer(w, desde0 - 120000, lectores[k]); rec[w] = { nivel: previa && previa.nivel ? previa.nivel : nivel, ...r, desde: desde0, ampliada: previa && previa.ok ? true : undefined };
        if (r.ok) for (const e of r.sal) if (e.v >= SEGUIR_USD) siguiente.push({ w, e });
        if (++hechas % 25 === 0) { console.log('  …', hechas, '/', frontera.length, '| minutos', Math.round((Date.now() - t0) / 60000)); guardarCache(rec, term); fs.writeFileSync(OUT + 'traza-clases.json', JSON.stringify(Object.fromEntries(cacheClase))); }
      }
    }
    await Promise.all([trabajador(0), trabajador(1)]);   // 2 lectores (antes 3) para no pasar el límite de TronGrid
    guardarCache(rec, term);
    // clasificar destinos del nivel (secuencial para no pisar el límite) y formar la frontera siguiente
    const nuevos = new Map(); let j = 0; const grupos = [];
    const lista = siguiente.filter(s => !(s.e.a in SEMILLAS));
    for (const { w, e } of lista) { const c = await clasificar(e.a, lectores[0]); const t = term[e.a] || (term[e.a] = { clase: c, entradas: [] }); t.clase = c; t.entradas.push({ de: w, v: e.v, at: e.at, tx: e.tx, sim: e.sim, cant: e.cant }); if (c.tipo === 'billetera' && (!proc.has(e.a) || (rec[e.a] && e.at < rec[e.a].desde - 120000))) { const x = nuevos.get(e.a) || { desde: e.at }; x.desde = Math.min(x.desde, e.at); nuevos.set(e.a, x); } if (++j % 150 === 0) console.log('   clasificados', j, '/', lista.length); }
    // cambios: seguir el resultado hasta la billetera que lo recibe
    { const cambios = lista.filter(x => { const c = cacheClase.get(x.e.a); return c && c.tipo === 'swap'; }); let kk = 0, nuevasSalidas = 0;
      for (const { w, e } of cambios) {
        rec[w].via = rec[w].via || [];
        if (rec[w].via.some(v => v.tx === e.tx) || (rec[w].viaHechas || []).includes(e.tx)) {   // corrección 1-nov (auditoría): al reanudar, el salto ya decodificado no devolvía su destino a la cola y las lecturas fallidas alcanzadas por cambios nunca se repetían
          for (const v of rec[w].via) if (v.tx === e.tx && !proc.has(v.a)) { const c = await clasificar(v.a, lectores[0]); if (c.tipo === 'billetera') { const x = nuevos.get(v.a) || { desde: v.at }; x.desde = Math.min(x.desde, v.at); nuevos.set(v.a, x); } }
          continue;
        }
        const outs = await salidasDeCambio(e.tx); if (!outs) continue; rec[w].viaHechas = (rec[w].viaHechas || []).concat(e.tx);
        for (const o of outs) { if (o.a === w) continue; const c = await clasificar(o.a, lectores[0]); if (c.tipo === 'swap') continue;
          rec[w].via.push({ a: o.a, v: o.v, at: e.at, tx: e.tx, sim: o.sim, cant: o.cant, via: 'cambio' }); nuevasSalidas++;
          const t = term[o.a] || (term[o.a] = { clase: c, entradas: [] }); t.clase = c; t.entradas.push({ de: w, v: o.v, at: e.at, tx: e.tx, sim: o.sim, cant: o.cant, via: 'cambio' });
          if (c.tipo === 'billetera' && (!proc.has(o.a) || (rec[o.a] && e.at < rec[o.a].desde - 120000))) { const x = nuevos.get(o.a) || { desde: e.at }; x.desde = Math.min(x.desde, e.at); nuevos.set(o.a, x); } }
        if (++kk % 100 === 0) { console.log('   cambios decodificados', kk, '/', cambios.length, '| salidas a billeteras', nuevasSalidas); fs.writeFileSync(OUT + 'tramo3-swaps.json', JSON.stringify(swapCache)); guardarCache(rec, term); }
      }
      console.log('   cambios del nivel:', cambios.length, '| salidas a billeteras halladas:', nuevasSalidas, '| billeteras nuevas por leer:', nuevos.size);
      fs.writeFileSync(OUT + 'tramo3-swaps.json', JSON.stringify(swapCache)); guardarCache(rec, term); }
    fs.writeFileSync(OUT + 'traza-clases.json', JSON.stringify(Object.fromEntries(cacheClase)));
    frontera = [...nuevos]; if (nivel > 200) break;
  }
  guardarCache(rec, term); fs.writeFileSync(OUT + 'tramo3-alcanzadas.json', JSON.stringify([...proc]));   // billeteras realmente alcanzadas con el umbral actual
  console.log('\nBFS terminado: billeteras leídas', Object.keys(rec).length, '| destinos terminales', Object.keys(term).filter(a => term[a].clase.tipo !== 'billetera').length, '| minutos', Math.round((Date.now() - t0) / 60000));
  fs.writeFileSync(OUT + 'tramo3-fin.json', JSON.stringify({ fin: new Date().toISOString(), minutos: Math.round((Date.now() - t0) / 60000) }));
})().catch(e => { console.error('ERROR', e.message, e.stack); process.exit(1); });
