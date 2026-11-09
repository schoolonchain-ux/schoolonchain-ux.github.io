#!/usr/bin/env node
/* fundamentales-indice.cjs — índice diario para la página «Laboratorio de fundamentales» de la web School On-Chain.
   La página se alimenta en vivo desde el navegador del visitante (CoinGecko, DefiLlama, Coin Metrics, TronScan, ultrasound, GitHub),
   pero hay tres cosas que no puede hacer el navegador y se preparan aquí una vez al día:
     1) saber qué cadena y qué protocolos de DefiLlama corresponden a cada token (la lista completa pesa más de 9 MB);
     2) guardar el texto de método de DefiLlama (qué cuenta como «comisiones», «ingresos» o «valor para el token») y la
        cobertura de Coin Metrics de cada activo, para detectar cuándo cambian y marcarlo en la ficha;
     3) la lista de sugerencias del buscador (los 250 tokens con más capitalización de CoinGecko; el resto sale del propio índice).
   Escribe DOS ficheros en la misma carpeta:
     - <salida>                      índice que carga la página (tokens, sugerencias, cobertura y los cambios detectados, con sus textos)
     - fundamentales-metodos.json    textos de método completos del día; la página NO lo carga, sirve para comparar al día siguiente
   Solo lectura. Sin claves. Sin IA. Uso:  node fundamentales-indice.cjs <salida.json> [indice-anterior.json]
   Si se pasa el índice anterior (el publicado), se busca a su lado fundamentales-metodos.json y las diferencias de método o
   cobertura se anotan en «cambios» con la fecha de hoy (acumulando los cambios anteriores). */
'use strict';
const fs = require('fs');
const path = require('path');

const salida = process.argv[2];
const rutaAnterior = process.argv[3];
if (!salida) { console.error('uso: node fundamentales-indice.cjs <salida.json> [indice-anterior.json]'); process.exit(2); }
const salidaMetodos = path.join(path.dirname(salida), 'fundamentales-metodos.json');

const URLS = {
  cadenas: 'https://api.llama.fi/v2/chains',
  fees: 'https://api.llama.fi/overview/fees?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true',
  protocolos: 'https://api.llama.fi/protocols',
  lite: 'https://api.llama.fi/lite/protocols2?b=2',
  coingecko: 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false',
  coinmetrics: 'https://community-api.coinmetrics.io/v4/catalog-v2/asset-metrics?page_size=5000',
};
// Métricas de Coin Metrics que usa la ficha (las demás no se guardan)
const METRICAS = ['AdrActCnt', 'AdrBalCnt', 'TxCnt', 'TxTfrCnt', 'FeeTotNtv', 'IssTotNtv', 'IssTotUSD', 'SplyCur', 'HashRate', 'BlkCnt', 'CapMrktCurUSD'];
const CAMPOS_METODO = ['UserFees', 'Fees', 'Revenue', 'ProtocolRevenue', 'SupplySideRevenue', 'HoldersRevenue'];

async function traer(u, reintentos = 2) {
  for (let i = 0; ; i++) {
    try {
      const r = await fetch(u, { signal: AbortSignal.timeout(120000), headers: { accept: 'application/json', 'user-agent': 'SchoolOnChain-publicador/1.0 (+https://schoolonchain-ux.github.io)' } });
      if (!r.ok) throw new Error('HTTP ' + r.status + ' en ' + u);
      return await r.json();
    } catch (e) { if (i >= reintentos) throw e; await new Promise((s) => setTimeout(s, 4000 * (i + 1))); }
  }
}
const redondea = (x) => (x == null || !isFinite(x) ? null : Math.round(x));
const hoy = new Date().toISOString().slice(0, 10);

(async () => {
  const t0 = Date.now();
  const [cadenas, fees, protocolos, lite, cg, cm] = await Promise.all([
    traer(URLS.cadenas), traer(URLS.fees), traer(URLS.protocolos), traer(URLS.lite), traer(URLS.coingecko).catch((e) => ({ error: String(e.message) })), traer(URLS.coinmetrics),
  ]);

  /* --- métodos: textos únicos + índice por clave («cadena:tron», «protocolo:aave-v3») --- */
  const textos = []; const idxTexto = new Map();
  const T = (s) => { if (!s) return null; s = String(s).trim(); if (!idxTexto.has(s)) { idxTexto.set(s, textos.length); textos.push(s); } return idxTexto.get(s); };
  const metodos = {};
  const metodoDe = (m) => { if (!m || typeof m !== 'object') return null; const o = {}; let hay = false; for (const k of CAMPOS_METODO) if (m[k]) { o[k] = T(m[k]); hay = true; } return hay ? o : null; };

  const feesCadenas = new Map(); // nombre en minúsculas → {slug, metodo}
  const feesProt = new Map();    // slug → {metodo}
  for (const p of fees.protocols || []) {
    if (p.protocolType === 'chain') feesCadenas.set(String(p.name).toLowerCase(), { slug: p.slug, metodo: metodoDe(p.methodology) });
    else feesProt.set(p.slug, { metodo: metodoDe(p.methodology) });
  }

  /* --- tokens: {gid: {s, n, c:[nombreCadena, tvl, slugFees], p:[protocolo...]}}
         protocolo = [slug, nombre, categoría, nºcadenas, tvl, tvlAyer, tvlSemana, tvlMes, tieneFees(0/1), esPadre(0/1), hijos]
         hijo      = [slug, nombre, categoría, tvl]                                                                          --- */
  const tokens = {};
  const tok = (gid) => (tokens[gid] = tokens[gid] || { s: null, n: null });
  // 1) nombres y símbolos oficiales: CoinGecko (los 250 mayores)
  const top = [];
  if (Array.isArray(cg)) for (const c of cg) { top.push([c.id, (c.symbol || '').toUpperCase(), c.name, c.market_cap_rank || null]); const t = tok(c.id); t.s = (c.symbol || '').toUpperCase(); t.n = c.name; }
  // 2) cadenas (si dos cadenas comparten token, se queda la de más TVL: BNB ↔ «Binance» y «BSC»)
  let nCadenas = 0;
  for (const c of cadenas) {
    if (!c.gecko_id) continue;
    const f = feesCadenas.get(String(c.name).toLowerCase());
    const t = tok(c.gecko_id); t.s = t.s || c.tokenSymbol || null; t.n = t.n || c.name;
    if (t.c && (t.c[1] || 0) >= (c.tvl || 0) && t.c[2]) continue;
    t.c = [c.name, redondea(c.tvl), f ? f.slug : null];
    if (f && f.metodo) metodos['cadena:' + f.slug] = f.metodo;
    nCadenas++;
  }
  // 3) protocolos: slug y padre de /protocols; TVL de ayer/semana/mes y los padres con token, de lite/protocols2
  const porId = new Map(); for (const p of lite.protocols || []) porId.set(String(p.defillamaId), p);
  const hijosDe = new Map();
  for (const p of protocolos) if (p.parentProtocol) (hijosDe.get(p.parentProtocol) || hijosDe.set(p.parentProtocol, []).get(p.parentProtocol)).push(p);
  const anotaMetodo = (slug) => { const f = feesProt.get(slug); if (f && f.metodo) metodos['protocolo:' + slug] = f.metodo; return !!f; };
  const entrada = (p) => { const l = porId.get(String(p.id)) || {}; return [p.slug, p.name, p.category || null, (p.chains || []).length, redondea(p.tvl) || 0, redondea(l.tvlPrevDay), redondea(l.tvlPrevWeek), redondea(l.tvlPrevMonth), anotaMetodo(p.slug) ? 1 : 0, 0, null]; };
  let nPadres = 0, nProt = 0;
  const cubiertos = new Set();
  for (const pp of lite.parentProtocols || []) {
    if (!pp.gecko_id) continue;
    const hijos = (hijosDe.get(pp.id) || []).map(entrada);
    const suma = (i) => hijos.reduce((s, h) => s + (h[i] || 0), 0);
    const cuenta = {}; hijos.forEach((h) => { if (h[2]) cuenta[h[2]] = (cuenta[h[2]] || 0) + 1; });
    const categoria = Object.keys(cuenta).sort((a, b) => cuenta[b] - cuenta[a])[0] || null;
    const t = tok(pp.gecko_id); t.s = t.s || pp.symbol || null; t.n = t.n || pp.name;
    (t.p = t.p || []).push([pp.id.replace(/^parent#/, ''), pp.name, categoria, (pp.chains || []).length, suma(4), suma(5), suma(6), suma(7), hijos.some((h) => h[8]) ? 1 : 0, 1, hijos.map((h) => [h[0], h[1], h[2], h[4]])]);
    hijos.forEach((h) => cubiertos.add(h[0])); nPadres++;
  }
  for (const p of protocolos) {
    if (!p.gecko_id || cubiertos.has(p.slug) || p.category === 'Chain') continue;
    const e = entrada(p);
    if (!e[4] && !e[8]) continue;                       // sin TVL y sin comisiones: no aporta nada a la ficha
    const t = tok(p.gecko_id); t.s = t.s || (p.symbol && p.symbol !== '-' ? p.symbol : null); t.n = t.n || p.name;
    (t.p = t.p || []).push(e); nProt++;
  }
  for (const [gid, t] of Object.entries(tokens)) if (!t.c && !t.p) delete tokens[gid];  // solo CoinGecko: la ficha ya lo sabe por su cuenta

  /* --- cobertura de Coin Metrics (solo las métricas que usa la ficha, solo activos que tienen alguna) --- */
  const cobertura = {};
  for (const a of cm.data || []) {
    const ms = a.metrics.filter((m) => METRICAS.includes(m.metric) && m.frequencies.some((f) => f.frequency === '1d')).map((m) => m.metric);
    if (ms.length) cobertura[a.asset] = ms.sort();
  }

  /* --- cambios de método o cobertura frente a la publicación anterior --- */
  let cambios = [];
  if (rutaAnterior && fs.existsSync(rutaAnterior)) {
    try {
      const ant = JSON.parse(fs.readFileSync(rutaAnterior, 'utf8'));
      cambios = Array.isArray(ant.cambios) ? ant.cambios.slice() : [];
      const rutaMetAnt = path.join(path.dirname(rutaAnterior), 'fundamentales-metodos.json');
      const antM = fs.existsSync(rutaMetAnt) ? JSON.parse(fs.readFileSync(rutaMetAnt, 'utf8')) : null;
      if (antM) {
        const ayer = antM.leidoEn ? antM.leidoEn.slice(0, 10) : null;
        const resuelve = (m, tx) => { if (!m) return null; const o = {}; for (const k of Object.keys(m)) o[k] = tx[m[k]] || null; return o; };
        for (const clave of new Set([...Object.keys(antM.metodos || {}), ...Object.keys(metodos)])) {
          const a = resuelve((antM.metodos || {})[clave], antM.textos || []), b = resuelve(metodos[clave], textos);
          if (JSON.stringify(a) !== JSON.stringify(b)) cambios.push({ fecha: hoy, desde: ayer, tipo: 'metodo', clave, antes: a, despues: b });
        }
        for (const asset of new Set([...Object.keys(antM.cobertura || {}), ...Object.keys(cobertura)])) {
          const a = ((antM.cobertura || {})[asset] || []).join(','), b = (cobertura[asset] || []).join(',');
          if (a !== b) cambios.push({ fecha: hoy, desde: ayer, tipo: 'cobertura', clave: 'coinmetrics:' + asset, antes: a || null, despues: b || null });
        }
        if (cambios.length > 2000) cambios = cambios.slice(-2000);
      } else console.error('aviso: no hay fundamentales-metodos.json anterior junto a ' + rutaAnterior + '; hoy no se comparan métodos');
    } catch (e) { console.error('aviso: no se pudo comparar con la publicación anterior: ' + e.message); }
  }

  const leidoEn = new Date().toISOString();
  const out = {
    version: 1, leidoEn,
    fuentes: Object.values(URLS),
    comprobaciones: { cadenas: nCadenas, padresConToken: nPadres, protocolosConToken: nProt, tokens: Object.keys(tokens).length, metodos: Object.keys(metodos).length, textos: textos.length, coberturas: Object.keys(cobertura).length, top: top.length, coingecko: Array.isArray(cg) ? 'ok' : 'sin respuesta: ' + (cg && cg.error), cambiosHoy: cambios.filter((c) => c.fecha === hoy).length, segundos: Math.round((Date.now() - t0) / 1000) },
    tokens, top, cobertura, cambios,
  };
  const fallos = [];
  if (nCadenas < 200) fallos.push('pocas cadenas (' + nCadenas + ')');
  if (Object.keys(tokens).length < 1500) fallos.push('pocos tokens (' + Object.keys(tokens).length + ')');
  if (Object.keys(metodos).length < 1000) fallos.push('pocos métodos (' + Object.keys(metodos).length + ')');
  if (Object.keys(cobertura).length < 100) fallos.push('poca cobertura de Coin Metrics (' + Object.keys(cobertura).length + ')');
  if (!tokens.tron || !tokens.tron.c || tokens.tron.c[2] !== 'tron') fallos.push('TRX no enlaza con la cadena Tron de DefiLlama');
  if (!tokens.aave || !tokens.aave.p || !tokens.aave.p.some((p) => p[0] === 'aave' && p[9] === 1)) fallos.push('AAVE no enlaza con el protocolo padre aave');
  if (fallos.length) { console.error('comprobación fallida: ' + fallos.join('; ')); process.exit(1); }
  fs.writeFileSync(salida, JSON.stringify(out));
  fs.writeFileSync(salidaMetodos, JSON.stringify({ version: 1, leidoEn, metodos, textos, cobertura }));
  console.log(JSON.stringify(out.comprobaciones) + ' → ' + salida + ' (' + Math.round(fs.statSync(salida).size / 1024) + ' KB) + ' + path.basename(salidaMetodos) + ' (' + Math.round(fs.statSync(salidaMetodos).size / 1024) + ' KB)');
})().catch((e) => { console.error('error: ' + (e && e.message)); process.exit(1); });
