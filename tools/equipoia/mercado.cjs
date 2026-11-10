'use strict';
// Genera data/mercado.json: los datos del Observatorio de mercado. Solo LEE servicios públicos, sin clave. Sin IA.
//  - Cesta: los N mayores activos por capitalización (CoinGecko, una lectura) que cotizan contra USDT en Binance, sin stablecoins
//    (lista de DefiLlama), sin versiones envueltas o en depósito de otro activo ni oro en fichas. Si el precio de Binance no coincide
//    con el de CoinGecko (otro activo con las mismas letras), el activo se descarta y se anota.
//  - Series: cierres y volumen diarios de Binance (días ya cerrados; el día en curso lo pone la página con una lectura en vivo).
//  - Capital: capitalización total y dominancia de hoy (CoinGecko global); stablecoins en circulación, total y por cadena (DefiLlama).
//  - Redes: dinero depositado por cadena, hoy y hace 7 y 30 días (DefiLlama).  - Sectores: clasificación y cifras de 24 h de CoinGecko.
// Si una lectura imprescindible falla o sale incompleta NO se escribe nada (la web sigue con el fichero anterior y dice su antigüedad).
// Uso: node mercado.cjs <carpeta-del-repositorio> [nº de activos, 50 por defecto]
const fs = require('node:fs'); const path = require('node:path');
const REPO = process.argv[2]; if (!REPO) { console.error('Uso: node mercado.cjs <carpeta-del-repositorio> [n]'); process.exit(1); }
const N = Math.max(10, Math.min(80, Number(process.argv[3]) || 50)); const DIAS = 760;
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const fuentes = [];
async function leer(url, que, { intentos = 3, espera = 4000 } = {}) {
  let ult;
  for (let i = 0; i < intentos; i++) {
    try { const r = await fetch(url, { headers: { accept: 'application/json', 'user-agent': 'observatorio-mercado' }, signal: AbortSignal.timeout(40000) }); if (r.status === 429) { ult = new Error('HTTP 429'); await dormir(espera * (i + 2) * 3); continue; } if (!r.ok) throw new Error('HTTP ' + r.status); const j = await r.json(); if (que && !fuentes.some((f) => f.url === url)) fuentes.push({ que, url }); return j; } catch (e) { ult = e; await dormir(espera); }
  }
  throw new Error((que || url) + ': ' + (ult && ult.message));
}
const dia = (ms) => new Date(ms).toISOString().slice(0, 10);
const red = (x, d) => (x == null || !isFinite(x) ? null : Number(Number(x).toPrecision(d)));
const ENVUELTOS = { WBTC: 'bitcoin envuelto', WETH: 'ether envuelto', WBETH: 'ether en depósito (Binance)', STETH: 'ether en depósito (Lido)', WSTETH: 'ether en depósito (Lido)', WEETH: 'ether en depósito', BNSOL: 'solana en depósito (Binance)', CBBTC: 'bitcoin envuelto (Coinbase)', PAXG: 'oro en fichas', XAUT: 'oro en fichas' };

(async () => {
  const ahora = Date.now();
  // ---- capital de hoy
  const G = (await leer('https://api.coingecko.com/api/v3/global', 'Capitalización total y dominancia de hoy (CoinGecko)')).data;
  if (!G || !G.total_market_cap || !(G.total_market_cap.usd > 1e11)) throw new Error('CoinGecko global: capitalización total ausente o absurda');
  const global = { capTotalUsd: Math.round(G.total_market_cap.usd), volumen24hUsd: Math.round(G.total_volume.usd), cambio24hPct: red(G.market_cap_change_percentage_24h_usd, 4), dominanciaPct: { btc: red(G.market_cap_percentage.btc, 5), eth: red(G.market_cap_percentage.eth, 5) }, leidoEn: new Date(G.updated_at * 1000).toISOString() };
  // ---- stablecoins (DefiLlama)
  const ST = await leer('https://stablecoins.llama.fi/stablecoins?includePrices=false', 'Lista de stablecoins (DefiLlama)');
  const simbolosEstables = new Set((ST.peggedAssets || []).map((p) => String(p.symbol || '').toUpperCase()));
  if (simbolosEstables.size < 50) throw new Error('DefiLlama: lista de stablecoins demasiado corta');
  const usdDe = (x) => (x && x.totalCirculatingUSD && typeof x.totalCirculatingUSD.peggedUSD === 'number' ? x.totalCirculatingUSD.peggedUSD : null);
  const serieSt = (arr) => arr.map((x) => [dia(Number(x.date) * 1000), usdDe(x)]).filter((x) => x[1] != null && x[1] > 0);
  const stTot = serieSt(await leer('https://stablecoins.llama.fi/stablecoincharts/all', 'Stablecoins en circulación, serie diaria (DefiLlama)'));
  if (stTot.length < 400) throw new Error('DefiLlama: serie de stablecoins demasiado corta');
  const atras = (s, n) => (s.length > n ? s[s.length - 1 - n][1] : null);
  const stCad = (await leer('https://stablecoins.llama.fi/stablecoinchains', 'Stablecoins por cadena, hoy (DefiLlama)')).map((c) => ({ nombre: c.name, usd: usdDe(c) })).filter((c) => c.usd > 0).sort((a, b) => b.usd - a.usd).slice(0, 8);
  for (const c of stCad) { try { const s = serieSt(await leer('https://stablecoins.llama.fi/stablecoincharts/' + encodeURIComponent(c.nombre), 'Stablecoins en ' + c.nombre + ', serie diaria (DefiLlama)')); c.usd = Math.round(s[s.length - 1][1]); c.hace7 = red(atras(s, 7), 9); c.hace30 = red(atras(s, 30), 9); c.hace90 = red(atras(s, 90), 9); c.dia = s[s.length - 1][0]; } catch (e) { c.sinSerie = e.message; c.usd = Math.round(c.usd); } await dormir(250); }
  const stables = { totalUsd: Math.round(stTot[stTot.length - 1][1]), dia: stTot[stTot.length - 1][0], serie: stTot.slice(-400).map((x) => [x[0], Math.round(x[1])]), porCadena: stCad };
  // ---- dinero depositado por cadena (DefiLlama)
  const CH = (await leer('https://api.llama.fi/v2/chains', 'Dinero depositado por cadena, hoy (DefiLlama)')).filter((c) => c.tvl > 0).sort((a, b) => b.tvl - a.tvl).slice(0, 10);
  const cadenas = [];
  for (const c of CH) { const o = { nombre: c.name, tvl: Math.round(c.tvl), token: c.tokenSymbol || null }; try { const s = (await leer('https://api.llama.fi/v2/historicalChainTvl/' + encodeURIComponent(c.name), 'Dinero depositado en ' + c.name + ', serie diaria (DefiLlama)')).map((x) => [dia(x.date * 1000), x.tvl]); o.dia = s[s.length - 1][0]; o.tvl = Math.round(s[s.length - 1][1]); o.hace7 = Math.round(atras(s, 7)); o.hace30 = Math.round(atras(s, 30)); o.hace90 = Math.round(atras(s, 90)); } catch (e) { o.sinSerie = e.message; } cadenas.push(o); await dormir(250); }
  // ---- sectores (clasificación de CoinGecko, etiqueta de terceros)
  let sectores = [], sectoresFallo = null;
  try { sectores = (await leer('https://api.coingecko.com/api/v3/coins/categories', 'Sectores: capitalización, cambio y volumen de 24 h (CoinGecko)', { espera: 8000 })).filter((s) => s.market_cap > 0 && typeof s.market_cap_change_24h === 'number').sort((a, b) => b.market_cap - a.market_cap).slice(0, 40).map((s) => ({ id: s.id, nombre: s.name, capUsd: Math.round(s.market_cap), cambio24hPct: red(s.market_cap_change_24h, 4), volumen24hUsd: Math.round(s.volume_24h || 0) })); } catch (e) { sectoresFallo = e.message; }
  // ---- cesta
  await dormir(3000);
  const M = await leer('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false', 'Los 250 mayores activos por capitalización (CoinGecko)', { espera: 8000 });
  if (!Array.isArray(M) || M.length < 200) throw new Error('CoinGecko: lista de activos incompleta');
  const T = await leer('https://data-api.binance.vision/api/v3/ticker/24hr?type=MINI', 'Precio y volumen de 24 h de todos los pares (Binance)');
  const par = new Map(T.map((t) => [t.symbol, t]));
  const excluidos = [], cesta = [];
  for (const m of M) {
    if (cesta.length >= N) break; const s = String(m.symbol || '').toUpperCase();
    if (simbolosEstables.has(s)) { excluidos.push({ s, n: m.name, motivo: 'stablecoin (lista de DefiLlama)' }); continue; }
    if (ENVUELTOS[s]) { excluidos.push({ s, n: m.name, motivo: ENVUELTOS[s] }); continue; }
    const t = par.get(s + 'USDT'); if (!t) { excluidos.push({ s, n: m.name, motivo: 'no cotiza contra USDT en Binance' }); continue; }
    const pb = Number(t.lastPrice); if (!(pb > 0) || Math.abs(pb / m.current_price - 1) > 0.03) { excluidos.push({ s, n: m.name, motivo: 'el precio de Binance (' + pb + ') no coincide con el de CoinGecko (' + m.current_price + '): puede ser otro activo con las mismas letras' }); continue; }
    cesta.push({ s, n: m.name, id: m.id, par: s + 'USDT', rango: m.market_cap_rank, capUsd: Math.round(m.market_cap) });
  }
  if (cesta.length < Math.min(N, 30) || cesta[0].s !== 'BTC') throw new Error('cesta incompleta (' + cesta.length + ') o sin BTC en cabeza');
  // ---- series diarias (Binance): solo días cerrados
  const hoy = dia(ahora); const rejilla = []; for (let i = DIAS; i >= 1; i--) rejilla.push(dia(ahora - i * 86400000));
  const pos = new Map(rejilla.map((d, i) => [d, i]));
  for (const a of cesta) {
    const k = await leer('https://data-api.binance.vision/api/v3/klines?symbol=' + a.par + '&interval=1d&limit=1000', null);
    a.url = 'https://data-api.binance.vision/api/v3/klines?symbol=' + a.par + '&interval=1d&limit=1000';
    a.c = new Array(rejilla.length).fill(null); a.v = new Array(rejilla.length).fill(null);
    for (const x of k) { const d = dia(x[0]); if (d >= hoy || x[6] > ahora) continue; const i = pos.get(d); if (i == null) continue; a.c[i] = red(x[4], 7); a.v[i] = Math.round(Number(x[7])); }
    a.dias = a.c.filter((x) => x != null).length; await dormir(120);
  }
  fuentes.push({ que: 'Cierres y volumen diarios de cada activo (Binance, datos públicos de mercado; una dirección por par, en cada activo)', url: 'https://data-api.binance.vision/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=1000' });
  // anclado al dólar aunque no esté en la lista de DefiLlama: sus últimos 90 cierres no se han separado más de un 3 % de 1 $
  const anclado = (a) => { const u = a.c.filter((x) => x != null).slice(-90); return u.length >= 30 && u.every((x) => Math.abs(x - 1) <= 0.03); };
  const cortos = cesta.filter((a) => a.dias < 120); const fijos = cesta.filter((a) => a.dias >= 120 && anclado(a)); const buena = cesta.filter((a) => a.dias >= 120 && !anclado(a));
  for (const a of cortos) excluidos.push({ s: a.s, n: a.n, motivo: 'menos de 120 días cotizando en Binance (' + a.dias + ')' });
  for (const a of fijos) excluidos.push({ s: a.s, n: a.n, motivo: 'anclado al dólar: sus últimos 90 cierres no se separan más de un 3 % de 1 $' });
  if (buena.length < Math.min(N, 30) - 5) throw new Error('demasiados activos sin historia suficiente');
  if (buena[0].c[buena[0].c.length - 1] == null) throw new Error('falta el cierre de ayer de BTC');
  const out = {
    version: 1, leidoEn: new Date(ahora).toISOString(),
    metodo: { cesta: 'Los ' + N + ' mayores activos por capitalización de CoinGecko que cotizan contra USDT en Binance, sin stablecoins, sin versiones envueltas o en depósito y sin oro en fichas. Son los mayores de HOY: los que desaparecieron no están.', series: 'Cierres diarios de Binance en UTC, solo días cerrados. El día en curso lo añade la página con una lectura en vivo.', sectores: 'Los sectores son la clasificación de CoinGecko, una etiqueta de terceros.' },
    fuentes, global, stables, cadenas, sectores, ...(sectoresFallo ? { sectoresFallo } : {}), dias: rejilla, activos: buena, excluidos,
  };
  const dst = path.join(REPO, 'data', 'mercado.json'); fs.writeFileSync(dst, JSON.stringify(out) + '\n');
  console.log('OK mercado.json: ' + buena.length + ' activos, ' + rejilla.length + ' días, ' + sectores.length + ' sectores, ' + cadenas.length + ' cadenas, stablecoins ' + Math.round(stables.totalUsd / 1e9) + ' mil M$, ' + excluidos.length + ' excluidos, ' + Math.round(fs.statSync(dst).size / 1024) + ' KB');
})().catch((e) => { console.error('FALLO mercado: ' + e.message); process.exit(1); });
