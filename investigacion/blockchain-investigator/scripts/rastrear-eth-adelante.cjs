'use strict';
// Rastreo HACIA ADELANTE en Ethereum del ETH que llegó desde TRON por Symbiosis (llegadas-eth.json) y por Chainflip (cambios cuyo depósito hizo una billetera del recorrido).
// Para cada billetera se lee UNA vez su historial completo (ETH normal y salidas de tokens genuinos) y se guardan TODAS sus salidas con su hora. Qué salidas cuentan como seguidas se decide por tiempo:
// una salida solo se sigue si ocurre después de la primera entrada trazada a esa billetera (menos 1 h). Esa primera entrada puede bajar cuando se descubre otro camino más temprano; entonces se vuelve a evaluar
// lo ya leído (sin releer). Cierra el rastro (sin seguir) en: contratos (se anota su nombre), billeteras de uso muy alto (nonce > 1000) y billeteras sin salidas (quietas, con su saldo de hoy).
// Los envíos menores que MIN_ETH se guardan como «polvo» con su hora. Solo lectura. Uso: node rastrear-eth-adelante.cjs <carpeta-del-tramo> → <tramo>/eth-adelante-v2.json (reanudable)
const fs = require('node:fs'); const path = require('node:path');
const { loadEtherscanKey } = require('../../tether-blacklist/src/adapters/bot.cjs'); const K = loadEtherscanKey({ file: path.join(__dirname, '..', '..', 'tether-blacklist', 'config.secret.json') });
const dirs = process.argv.slice(2); const dir = dirs[0]; if (!dir) { console.error('uso: node rastrear-eth-adelante.cjs <carpeta-del-tramo> [otra-carpeta…]  (las semillas salen de todas; el resultado va a la primera)'); process.exit(1); }
const MIN_ETH = +process.env.MIN_ETH || 0.5, NONCE_ALTO = 1000, HOLGURA = 3600; const sleep = ms => new Promise(r => setTimeout(r, ms)); const RPC = 'https://ethereum-rpc.publicnode.com';
const GENUINOS = { '0xdac17f958d2ee523a2206206994597c13d831ec7': ['USDT', 6], '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': ['USDC', 6], '0x6b175474e89094c44da98b954eedeac495271d0f': ['DAI', 18], '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': ['WETH', 18], '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': ['WBTC', 8], '0xae7ab96520de3a18e5e111b5eaab095312d7fe84': ['stETH', 18] };
let proximo = 0; async function turno() { const t = Math.max(Date.now(), proximo); proximo = t + 345; if (t > Date.now()) await sleep(t - Date.now()); }   // Etherscan gratis: 3 consultas/s; un turnero global las espacia (así no choca con el límite ni pierde segundos en reintentos)
async function api(params) { for (let i = 0; i < 6; i++) { await turno(); try { const r = await fetch('https://api.etherscan.io/v2/api?' + new URLSearchParams({ chainid: 1, apikey: K.key, ...params }), { signal: AbortSignal.timeout(40000) }); const j = await r.json(); if (j.status === '1') return j.result; if (/No transactions found|No records found/i.test(String(j.message))) return []; await sleep(1200 * (i + 1)); } catch { await sleep(1200 * (i + 1)); } } return null; }
async function rpc(method, params) { for (let i = 0; i < 5; i++) { try { const r = await fetch(RPC, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }), signal: AbortSignal.timeout(25000) }); const j = await r.json(); if (j.result !== undefined) return j.result; } catch {} await sleep(800 * (i + 1)); } return null; }
const ficha = {}; async function clase(a) { if (ficha[a]) return ficha[a]; const code = await rpc('eth_getCode', [a, 'latest']); const nonce = parseInt((await rpc('eth_getTransactionCount', [a, 'latest'])) || '0x0', 16);
  if (code && code !== '0x') { const s = await api({ module: 'contract', action: 'getsourcecode', address: a }); const nombre = Array.isArray(s) && s[0] && s[0].ContractName || ''; return (ficha[a] = { tipo: 'contrato', nombre: nombre || '(sin verificar)', nonce }); }
  return (ficha[a] = nonce > NONCE_ALTO ? { tipo: 'servicio', nombre: 'billetera de uso muy alto (nonce ' + nonce + ')', nonce } : { tipo: 'billetera', nonce }); }
async function leer(a) {
  const tx = []; for (let p = 1; p <= 10; p++) { const r = await api({ module: 'account', action: 'txlist', address: a, startblock: 0, endblock: 99999999, page: p, offset: 1000, sort: 'asc' }); if (!Array.isArray(r)) return { error: 'sin lectura' }; tx.push(...r); if (r.length < 1000) break; }
  const tk = await api({ module: 'account', action: 'tokentx', address: a, page: 1, offset: 1000, sort: 'asc' }); if (!Array.isArray(tk)) return { error: 'sin lectura de tokens' }; const sb = await rpc('eth_getBalance', [a, 'latest']); const saldo = typeof sb === 'string' && /^0x[0-9a-f]+$/i.test(sb) ? BigInt(sb).toString() : null;
  const salidas = [], polvos = []; let entraEth = 0;
  for (const t of tx) { if (t.isError !== '0') continue; const v = Number(t.value) / 1e18; if (t.to.toLowerCase() === a) entraEth += v; if (t.from.toLowerCase() !== a || v <= 0) continue; if (v < MIN_ETH) polvos.push({ eth: +v.toFixed(6), t: +t.timeStamp }); else salidas.push({ a: t.to.toLowerCase(), eth: +v.toFixed(6), tx: t.hash, t: +t.timeStamp }); }
  const tokens = []; for (const t of Array.isArray(tk) ? tk : []) { const g = GENUINOS[String(t.contractAddress).toLowerCase()]; if (!g || t.from.toLowerCase() !== a) continue; tokens.push({ a: t.to.toLowerCase(), token: g[0], v: +(Number(t.value) / 10 ** g[1]).toFixed(4), tx: t.hash, t: +t.timeStamp }); }
  return { saldoEth: saldo && /^\d+$/.test(String(saldo)) ? Number(saldo) / 1e18 : null, txTotal: tx.length, entraTotalEth: +entraEth.toFixed(4), salidas, polvos, tokens, leidoEn: new Date().toISOString() };
}
(async () => {
  const semillas = new Map(); const sem = (a, t) => { if (!semillas.has(a) || t < semillas.get(a)) semillas.set(a, t); };   // dirección → hora (s) de la primera entrada trazada
  for (const d of dirs) {
  const fLE = path.join(d, 'llegadas-eth.json'); if (fs.existsSync(fLE)) { const L = JSON.parse(fs.readFileSync(fLE, 'utf8')); for (const x of Object.values(L)) if (x.cadena === 1) sem(x.direccion, Date.parse(x.primera) / 1000); }
  const fCF = path.join(d, 'chainflip-destinos.json'), fLL = path.join(d, 'chainflip-llegadas.json');
  if (fs.existsSync(fCF) && fs.existsSync(fLL)) { const CF = JSON.parse(fs.readFileSync(fCF, 'utf8')), LL = JSON.parse(fs.readFileSync(fLL, 'utf8')); for (const v of Object.values(CF)) for (const c of v.canales || []) for (const s of c.cambios) { const l = LL[String(s.nativeId)]; if (!l || !l.nuestro) continue; const act = s.activoDestino || c.activoDestino; if (!['Eth', 'Usdt', 'Usdc'].includes(act)) continue; sem(String(s.destino || c.destino).toLowerCase(), (l.salida && l.salida.hora ? l.salida.hora : Date.parse(s.pedido)) / 1000); } }
  }
  const out = path.join(dir, 'eth-adelante-v2.json'); let S = {}; try { S = JSON.parse(fs.readFileSync(out, 'utf8')); } catch { /* primera vez */ } const nodos = S.nodos || {}; Object.assign(ficha, S.ficha || {});
  const ein = {}; for (const [a, t] of semillas) ein[a] = t;
  const guardar = () => fs.writeFileSync(out, JSON.stringify({ nodos, ficha, semillas: Object.fromEntries(semillas), t: new Date().toISOString() }));
  let pend = new Set(Object.keys(ein)); let leidas = 0;
  async function procesar(a) {
    if (!nodos[a]) { const c = await clase(a); if (c.tipo !== 'billetera') { nodos[a] = { terminal: c }; return []; } const r = await leer(a); nodos[a] = r.error ? { error: r.error } : r; if (++leidas % 20 === 0) { guardar(); console.log('  …', leidas, 'leídas | pendientes', pend.size); } }
    const nd = nodos[a]; if (nd.terminal || nd.error) return []; const t0 = ein[a] - HOLGURA; const cambios = [];
    for (const e of (nd.salidas || []).concat(nd.tokens || [])) { if (e.t < t0) continue; if (ein[e.a] === undefined || e.t < ein[e.a]) { ein[e.a] = e.t; cambios.push(e.a); } }
    return cambios;
  }
  let ronda = 0;
  while (pend.size) { ronda++; const cola = [...pend]; pend = new Set(); console.log('== ronda', ronda, '| billeteras', cola.length);
    async function trab() { while (cola.length) { const a = cola.shift(); for (const x of await procesar(a)) pend.add(x); } } await Promise.all(Array.from({ length: +process.env.TRABAJADORES || 3 }, trab)); guardar(); }
  console.log('RASTREO ETH TERMINADO | nodos', Object.keys(nodos).length, '| con primera entrada trazada', Object.keys(ein).length);
})();
