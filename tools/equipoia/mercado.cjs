'use strict';
// Genera data/mercado.json: los datos del Observatorio de mercado. Solo LEE servicios públicos, sin clave. Sin IA.
//  - Cesta: los N mayores activos por capitalización (CoinGecko, una lectura) que cotizan contra USDT en Binance, sin stablecoins
//    (lista de DefiLlama), sin versiones envueltas o en depósito de otro activo ni oro en fichas. Si el precio de Binance no coincide
//    con el de CoinGecko (otro activo con las mismas letras), el activo se descarta y se anota.
//  - Series: cierres y volumen diarios de Binance (días ya cerrados; el día en curso lo pone la página con una lectura en vivo).
//  - Capital: capitalización total y dominancia de hoy (CoinGecko global); stablecoins en circulación, total y por cadena (DefiLlama).
//  - Redes: dinero depositado y stablecoins por cadena, con 400 días de serie diaria (DefiLlama).
//  - Volatilidad esperada: el índice de Deribit (DVOL) de BTC y ETH, un cierre por día sobre la misma rejilla de días. Si falla, se anota y lo demás sigue.
//  - Sectores: cifras de 24 h de CoinGecko y, para una lista FIJA de sectores, qué activos de la cesta pone CoinGecko en cada uno.
//  - Libros de órdenes de los ocho mayores: dinero esperando a ±1 % y ±2 % del precio en Binance (contra USDT) y en Kraken (contra el dólar).
//    Si el precio de Kraken se separa más de un 3 % del de Binance se descarta (otro activo con las mismas letras).
//  - Serie propia (data/mercado-serie.json): una fila por día con lo que no tiene histórico gratuito (capital total, dominancia y profundidad
//    de los libros). La primera lectura de cada día queda fijada: una fila escrita no se vuelve a tocar.
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

// Sectores que se siguen en la cesta. Lista FIJA: identificador de la categoría en CoinGecko, nombre en español y nombre original.
const SECTORES = [
  ['layer-1', 'Cadenas base (capa 1)', 'Layer 1 (L1)'], ['layer-2', 'Segundas capas (capa 2)', 'Layer 2 (L2)'], ['proof-of-work-pow', 'Prueba de trabajo (minería)', 'Proof of Work (PoW)'],
  ['decentralized-finance-defi', 'Finanzas descentralizadas (DeFi)', 'Decentralized Finance (DeFi)'], ['decentralized-exchange', 'Casas de cambio descentralizadas', 'Decentralized Exchange (DEX)'],
  ['lending-borrowing', 'Préstamos', 'Lending/Borrowing Protocols'], ['decentralized-perpetuals', 'Futuros perpetuos', 'Perpetuals'], ['exchange-based-tokens', 'Fichas de casas de cambio', 'Exchange-based Tokens'],
  ['meme-token', 'Memes', 'Meme'], ['artificial-intelligence', 'Inteligencia artificial', 'Artificial Intelligence (AI)'], ['privacy-coins', 'Privacidad', 'Privacy Coins'],
  ['real-world-assets-rwa', 'Activos del mundo real', 'Real World Assets (RWA)'], ['oracle', 'Oráculos', 'Oracle'], ['proof-of-stake-pos', 'Prueba de participación', 'Proof of Stake (PoS)'],
  ['depin', 'Infraestructura física (DePIN)', 'DePIN'], ['layer-0-l0', 'Cadenas de cadenas (capa 0)', 'Layer 0 (L0)'],
];

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
  const stables = { totalUsd: Math.round(stTot[stTot.length - 1][1]), dia: stTot[stTot.length - 1][0], serie: stTot.slice(-400).map((x) => [x[0], Math.round(x[1])]) };
  // ---- redes: dinero depositado y stablecoins por cadena, con 400 días de serie diaria (DefiLlama), en millones de dólares
  const DR = 400; const diasRed = []; for (let i = DR - 1; i >= 0; i--) diasRed.push(dia(ahora - i * 86400000));
  const posRed = new Map(diasRed.map((d, i) => [d, i]));
  const enRejilla = (pares) => { const a = new Array(DR).fill(null); for (const [d, v] of pares) { const i = posRed.get(d); if (i != null && typeof v === 'number' && v > 0) a[i] = red(v / 1e6, 7); } return a; };
  const CHT = (await leer('https://api.llama.fi/v2/chains', 'Dinero depositado por cadena, hoy (DefiLlama)')).filter((c) => c.tvl > 0).sort((a, b) => b.tvl - a.tvl);
  const STC = (await leer('https://stablecoins.llama.fi/stablecoinchains', 'Stablecoins por cadena, hoy (DefiLlama)')).map((c) => ({ nombre: c.name, usd: usdDe(c) })).filter((c) => c.usd > 0).sort((a, b) => b.usd - a.usd);
  const nombresRed = [...new Set(CHT.slice(0, 10).map((c) => c.name).concat(STC.slice(0, 8).map((c) => c.nombre)))];
  const redes = { unidad: 'millones de dólares', dias: diasRed, filas: [] };
  for (const nombre of nombresRed) {
    const t = CHT.find((c) => c.name === nombre); const o = { nombre, token: (t && t.tokenSymbol) || null };
    o.urlTvl = 'https://api.llama.fi/v2/historicalChainTvl/' + encodeURIComponent(nombre); o.urlSt = 'https://stablecoins.llama.fi/stablecoincharts/' + encodeURIComponent(nombre);
    try { o.tvl = enRejilla((await leer(o.urlTvl, null)).map((x) => [dia(x.date * 1000), x.tvl])); if (!o.tvl.some((x) => x != null)) throw new Error('serie vacía'); } catch (e) { delete o.tvl; o.sinTvl = e.message; }
    await dormir(250);
    try { o.st = enRejilla(serieSt(await leer(o.urlSt, null))); if (!o.st.some((x) => x != null)) throw new Error('serie vacía'); } catch (e) { delete o.st; o.sinSt = e.message; }
    redes.filas.push(o); await dormir(250);
  }
  if (redes.filas.filter((x) => x.tvl).length < 6 || redes.filas.filter((x) => x.st).length < 5) throw new Error('DefiLlama: faltan demasiadas series por cadena');
  fuentes.push({ que: 'Dinero depositado en cada cadena, serie diaria (DefiLlama; una dirección por cadena, en cada fila)', url: 'https://api.llama.fi/v2/historicalChainTvl/Ethereum' });
  fuentes.push({ que: 'Stablecoins en cada cadena, serie diaria (DefiLlama; una dirección por cadena, en cada fila)', url: 'https://stablecoins.llama.fi/stablecoincharts/Ethereum' });
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
  // ---- volatilidad esperada (Deribit): índice DVOL de BTC y ETH, la volatilidad anual que descuentan sus opciones para los 30 días siguientes.
  //      Un valor por día (cierre del día en UTC) sobre la misma rejilla que los cierres de Binance; solo días cerrados. Una lectura por moneda.
  const esperada = { que: 'Índice de volatilidad de Deribit (DVOL): volatilidad anual, en %, que descuentan las opciones para los 30 días siguientes. Cierre de cada día en UTC.', filas: [] };
  for (const mon of ['BTC', 'ETH']) {
    const u = 'https://www.deribit.com/api/v2/public/get_volatility_index_data?currency=' + mon + '&start_timestamp=' + Date.parse(rejilla[0] + 'T00:00:00Z') + '&end_timestamp=' + (Date.parse(hoy + 'T00:00:00Z') - 1) + '&resolution=1D'; const o = { s: mon, url: u };
    try {
      const j = await leer(u, null); const d = j && j.result && j.result.data; if (!Array.isArray(d) || d.length < 300) throw new Error('serie corta o ausente (' + (Array.isArray(d) ? d.length : 0) + ' días)');
      if (j.result.continuation) throw new Error('la respuesta llegó partida');
      const v = new Array(rejilla.length).fill(null); for (const x of d) { const i = pos.get(dia(x[0])); const c = Number(x[4]); if (i != null && c > 0 && c < 1000) v[i] = red(c, 5); }
      if (v[v.length - 1] == null) throw new Error('falta el cierre de ayer'); o.v = v; o.dias = v.filter((x) => x != null).length;
    } catch (e) { o.fallo = e.message; }
    esperada.filas.push(o); await dormir(500);
  }
  fuentes.push({ que: 'Volatilidad esperada de bitcoin y ether, índice DVOL diario (Deribit; una dirección por moneda, en cada fila)', url: 'https://www.deribit.com/api/v2/public/get_volatility_index_data?currency=BTC&start_timestamp=' + Date.parse(rejilla[0] + 'T00:00:00Z') + '&end_timestamp=' + (Date.parse(hoy + 'T00:00:00Z') - 1) + '&resolution=1D' });
  // ---- foto de los libros de órdenes de los ocho mayores (Binance). Cada lectura profunda cuenta mucho para el límite de Binance (250 de 6.000 por minuto):
  //      por eso se hace aquí, una vez al día y despacio, y NO desde el navegador de cada visitante.
  let CALC = null; for (const p of [path.join(__dirname, 'mercado-calc.js'), path.join(__dirname, '..', '..', 'assets', 'mercado-calc.js'), path.join(REPO, 'assets', 'mercado-calc.js')]) { if (fs.existsSync(p)) { CALC = require(p); break; } }
  const liquidez = { banda: 0.01, banda2: 0.02, filas: [] };
  if (!CALC) liquidez.fallo = 'no se encontró el módulo de cálculo';
  // una foto de un libro: las dos bandas con la misma lectura
  const foto = (bids, asks) => { const p = CALC.profundidad(bids, asks, liquidez.banda), q = CALC.profundidad(bids, asks, liquidez.banda2); if (!p || !q) throw new Error('libro vacío o cruzado'); return { hora: new Date().toISOString(), medio: red(p.medio, 8), diferencialPct: red(p.diferencialPct, 4), compras: Math.round(p.compras), ventas: Math.round(p.ventas), desequilibrio: red(p.desequilibrio, 4), completo: p.completo, b2: { compras: Math.round(q.compras), ventas: Math.round(q.ventas), desequilibrio: red(q.desequilibrio, 4), completo: q.completo } }; };
  // Kraken: qué activos cotizan contra el dólar (una lectura de su lista de pares). Kraken llama XBT a bitcoin y XDG a dogecoin.
  let paresK = null, falloK = null;
  if (CALC) try { const j = await leer('https://api.kraken.com/0/public/AssetPairs', null); if (!j || (Array.isArray(j.error) && j.error.length) || !j.result) throw new Error('respuesta sin pares'); paresK = new Map(); for (const v of Object.values(j.result)) { if (!v || !v.wsname || v.status !== 'online') continue; const [b, q] = String(v.wsname).split('/'); if (q === 'USD') paresK.set({ XBT: 'BTC', XDG: 'DOGE' }[b] || b, v.altname); } if (paresK.size < 50) throw new Error('lista de pares demasiado corta (' + paresK.size + ')'); } catch (e) { falloK = e.message; paresK = null; }
  if (CALC) for (const a of buena.slice(0, 8)) {
    const u = 'https://data-api.binance.vision/api/v3/depth?symbol=' + a.par + '&limit=5000'; let x;
    try { const j = await leer(u, null, { intentos: 1 }); x = Object.assign({ s: a.s, par: a.par, url: u }, foto(j.bids, j.asks)); } catch (e) { x = { s: a.s, par: a.par, url: u, fallo: e.message }; }
    if (!paresK) x.kraken = { fallo: 'no se pudo leer la lista de pares de Kraken (' + falloK + ')' };
    else if (!paresK.has(a.s)) x.kraken = { noCotiza: true };
    else {
      const pk = paresK.get(a.s), uk = 'https://api.kraken.com/0/public/Depth?pair=' + pk + '&count=500';
      try {
        const j = await leer(uk, null, { intentos: 2 }); if (!j || (Array.isArray(j.error) && j.error.length) || !j.result) throw new Error('Kraken responde con error' + (j && j.error && j.error.length ? ': ' + j.error.join(', ') : ''));
        const k = Object.keys(j.result); const b = k.length === 1 ? j.result[k[0]] : null; if (!b || !Array.isArray(b.bids) || !Array.isArray(b.asks)) throw new Error('respuesta sin libro');
        const ft = foto(b.bids, b.asks); if (x.medio && Math.abs(ft.medio / x.medio - 1) > 0.03) throw new Error('el precio de Kraken (' + ft.medio + ') no coincide con el de Binance (' + x.medio + '): se descarta');
        x.kraken = Object.assign({ par: pk, url: uk }, ft);
      } catch (e) { x.kraken = { par: pk, url: uk, fallo: e.message }; }
    }
    liquidez.filas.push(x); await dormir(3500);
  }
  fuentes.push({ que: 'Libro de órdenes de cada par contra el dólar (Kraken; una dirección por par, en cada fila)', url: 'https://api.kraken.com/0/public/Depth?pair=XBTUSD&count=500' });
  fuentes.push({ que: 'Libro de órdenes de cada par (Binance; una dirección por par, en cada fila)', url: 'https://data-api.binance.vision/api/v3/depth?symbol=BTCUSDT&limit=5000' });
  // ---- sectores de la cesta: qué activos de la cesta pone CoinGecko en cada sector de la lista fija (una lectura por sector, despacio:
  //      CoinGecko limita las consultas). Si una lectura falla, ese sector queda sin dato y se dice; no se rellena.
  const idCesta = new Map(buena.map((a) => [a.id, a.s])); const sectoresCesta = [];
  for (const [id, nombre, original] of SECTORES) {
    const u = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=' + id + '&order=market_cap_desc&per_page=250&page=1&sparkline=false'; const o = { id, nombre, original, url: u };
    try { const j = await leer(u, null, { espera: 8000 }); if (!Array.isArray(j) || !j.length) throw new Error('respuesta vacía'); o.leidos = j.length; o.miembros = j.filter((m) => idCesta.has(m.id)).map((m) => idCesta.get(m.id)); } catch (e) { o.fallo = e.message; }
    sectoresCesta.push(o); await dormir(7000);
  }
  fuentes.push({ que: 'Activos de cada sector (CoinGecko; una dirección por sector, en cada ficha)', url: 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=layer-1&order=market_cap_desc&per_page=250&page=1&sparkline=false' });
  // ---- serie propia: lo que no tiene histórico gratuito. Una fila por día (UTC); la primera lectura del día queda fijada.
  const fSerie = path.join(REPO, 'data', 'mercado-serie.json');
  let serie = { version: 1, que: 'Lectura propia diaria del Observatorio de mercado: capital total y dominancia (CoinGecko), stablecoins (DefiLlama) y profundidad de los libros a ±1 % (Binance). Una fila por día; una fila escrita no se modifica.', filas: [] };
  if (fs.existsSync(fSerie)) { let j; try { j = JSON.parse(fs.readFileSync(fSerie, 'utf8')); } catch (e) { throw new Error('la serie propia existe pero no se puede leer (' + e.message + '); no se toca nada'); } if (!j || j.version !== 1 || !Array.isArray(j.filas)) throw new Error('la serie propia tiene un formato inesperado; no se toca nada'); serie = j; }
  let filaNueva = false;
  if (!serie.filas.some((x) => x.dia === hoy)) {
    const guarda = (x) => ({ compras: x.compras, ventas: x.ventas, diferencialPct: x.diferencialPct, completo: x.completo, compras2: x.b2.compras, ventas2: x.b2.ventas, completo2: x.b2.completo });
    const libros = {}, kraken = {}; for (const x of liquidez.filas) { if (!x.fallo) libros[x.s] = guarda(x); if (x.kraken && x.kraken.compras != null) kraken[x.s] = guarda(x.kraken); }
    serie.filas.push({ dia: hoy, leidoEn: new Date(ahora).toISOString(), capTotalUsd: global.capTotalUsd, btcPct: global.dominanciaPct.btc, ethPct: global.dominanciaPct.eth, stablesUsd: stables.totalUsd, libros, kraken });
    serie.filas.sort((a, b) => (a.dia < b.dia ? -1 : 1)); filaNueva = true;
  }
  const out = {
    version: 2, leidoEn: new Date(ahora).toISOString(),
    metodo: { cesta: 'Los ' + N + ' mayores activos por capitalización de CoinGecko que cotizan contra USDT en Binance, sin stablecoins, sin versiones envueltas o en depósito y sin oro en fichas. Son los mayores de HOY: los que desaparecieron no están.', series: 'Cierres diarios de Binance en UTC, solo días cerrados. El día en curso lo añade la página con una lectura en vivo.', sectores: 'Los sectores son la clasificación de CoinGecko, una etiqueta de terceros, y un mismo activo puede estar en varios. Se sigue una lista fija de ' + SECTORES.length + ' sectores; el rendimiento de un sector es la mediana del de los activos de la cesta que CoinGecko pone en él, y hacen falta al menos tres.' },
    fuentes, global, stables, redes, liquidez, esperada, sectores, sectoresCesta, ...(sectoresFallo ? { sectoresFallo } : {}), dias: rejilla, activos: buena, excluidos,
  };
  const dst = path.join(REPO, 'data', 'mercado.json'); fs.writeFileSync(dst, JSON.stringify(out) + '\n');
  if (filaNueva) fs.writeFileSync(fSerie, JSON.stringify(serie) + '\n');
  console.log('OK mercado.json: ' + buena.length + ' activos, ' + rejilla.length + ' días, ' + sectores.length + ' sectores (' + sectoresCesta.filter((x) => x.miembros).length + ' de ' + SECTORES.length + ' con sus activos), ' + redes.filas.length + ' cadenas, serie propia de ' + serie.filas.length + ' días' + (filaNueva ? ' (fila de hoy añadida)' : ' (la de hoy ya estaba)') + ', stablecoins ' + Math.round(stables.totalUsd / 1e9) + ' mil M$, ' + excluidos.length + ' excluidos, volatilidad esperada de ' + (esperada.filas.filter((x) => x.v).map((x) => x.s).join(' y ') || 'ninguna moneda') + ', ' + liquidez.filas.filter((x) => !x.fallo).length + ' libros de Binance y ' + liquidez.filas.filter((x) => x.kraken && x.kraken.compras != null).length + ' de Kraken, ' + Math.round(fs.statSync(dst).size / 1024) + ' KB');
})().catch((e) => { console.error('FALLO mercado: ' + e.message); process.exit(1); });
