'use strict';
// Puentes: decodifica cada envío a un puente (USDT0/LayerZero, Bridgers, Rango…) hecho por las billeteras rastreadas y averigua a qué cadena y a qué dirección sale el dinero.
// Uso: node puentes.cjs   → escribe tron/puentes-decodificados.json
const fs = require('fs');
const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs');
const keys = loadTronKeys({ file: 'C:/EquipoIA/tether-blacklist/config.secret.json' });
const HG = { accept: 'application/json', 'content-type': 'application/json', 'TRON-PRO-API-KEY': keys.tronGridKey };
const OUT = 'C:/EquipoIA/research/binance-0x5227-2026-10-30/tron/'; const sleep = ms => new Promise(r => setTimeout(r, ms));
const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'; const crypto = require('crypto');
const toB58 = hex => { const b = Buffer.from(hex.replace(/^0x/, ''), 'hex'); const h = crypto.createHash('sha256').update(crypto.createHash('sha256').update(b).digest()).digest(); let n = BigInt('0x' + Buffer.concat([b, h.subarray(0, 4)]).toString('hex')); let s = ''; while (n > 0n) { s = B58[Number(n % 58n)] + s; n /= 58n; } return s; };
const EID = { 30101: 'Ethereum', 30102: 'BNB Chain', 30106: 'Avalanche', 30109: 'Polygon', 30110: 'Arbitrum', 30111: 'Optimism', 30184: 'Base', 30168: 'Solana', 30295: 'Hedera', 30280: 'Sei', 30320: 'Unichain', 30332: 'Sonic', 30362: 'Berachain', 30383: 'Plasma', 30367: 'Flare', 30331: 'Ink', 30165: 'zkSync Era', 30183: 'Linea', 30181: 'Mantle', 30243: 'Blast', 30145: 'Gnosis', 30214: 'Scroll', 30177: 'Polygon zkEVM', 30255: 'Kava', 30267: 'Metis', 30292: 'Mode', 30324: 'Corn', 30339: 'Stable', 30333: 'Rootstock', 30385: 'Monad', 30370: 'Plume', 30390: 'MegaETH', 30316: 'Hyperliquid (HyperEVM)', 30362.5: '' };
async function post(ruta, valor) { for (let i = 0; i < 4; i++) { try { await sleep(260); const r = await fetch('https://api.trongrid.io' + ruta, { method: 'POST', headers: HG, body: JSON.stringify({ value: valor, visible: false }), signal: AbortSignal.timeout(20000) }); if (r.status === 429) { await sleep(2000 * (i + 1)); continue; } return await r.json(); } catch { await sleep(1000); } } return null; }
const clases = JSON.parse(fs.readFileSync(OUT + 'traza-clases.json', 'utf8'));
const cargar = (cache, res) => ({ rec: JSON.parse(fs.readFileSync(OUT + cache, 'utf8')).rec, p: JSON.parse(fs.readFileSync(OUT + res, 'utf8')).pureza });
const T1 = cargar('traza-cache.json', 'traza-resultado.json'), T2 = cargar('traza-post-cache.json', 'traza-post-resultado.json');
const aristas = new Map();
for (const [tramo, T] of [['tramo1', T1], ['tramo2', T2]]) for (const w of Object.keys(T.rec)) { const r = T.rec[w]; if (!r.ok) continue; for (const e of r.sal || []) { const c = clases[e.a]; if (!c || c.tipo !== 'puente') continue; const k = e.tx; const x = aristas.get(k) || { tx: e.tx, desde: w, puente: c.nombre, contrato: e.a, at: e.at, v: e.v, sim: e.sim, cant: e.cant, p: T.p[w] ?? T1.p[w] ?? 0, tramo }; if (!aristas.has(k)) aristas.set(k, x); } }
// también los puentes que aparecen en el registro del vigilante (todo el árbol, incluidos nodos mezcladores), para comparar
const evs = fs.readFileSync('C:/EquipoIA/tron-salidas-watch/state/eventos.jsonl', 'utf8').trim().split('\n').map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
let soloVigilante = 0; for (const e of evs) { if (e.clase !== 'salto' || !/UsdtOFT|OftBridge|Bridgers|Rango|PrefundedAdapter/i.test(e.nombreDestino || '')) continue; if (!aristas.has(e.tx)) { aristas.set(e.tx, { tx: e.tx, desde: e.desde, puente: String(e.nombreDestino).replace(/^contrato inteligente\s*/, '').replace(/[«»]/g, ''), contrato: e.destino, at: e.at, v: e.simbolo === 'USDT' ? e.cantidad : e.cantidad * 0.352, sim: e.simbolo, cant: e.cantidad, p: null, tramo: 'solo vigilante' }); soloVigilante++; } }
// y los envíos a puentes que el rastreo vio como salto «virtual» (el resultado de un cambio): solo están en los CSV de aristas finales
let soloCsv = 0; for (const [tramo, f] of [['tramo1', 'traza-aristas-terminales.csv'], ['tramo2', 'traza-post-aristas-terminales.csv']]) for (const l of fs.readFileSync(OUT + f, 'utf8').split('\n').slice(1)) { const c = l.split(';'); if (c.length < 11 || c[3] !== 'puente' || (aristas.has(c[10]) && aristas.get(c[10]).tramo !== 'solo vigilante')) continue; const cant = Number(c[5]); aristas.set(c[10], { tx: c[10], desde: c[1], puente: c[4], contrato: c[2], at: Date.parse(c[0].replace(' ', 'T') + ':00Z'), v: c[6] === 'USDT' ? cant : cant * 0.352, sim: c[6], cant, p: Number(c[7]), tramo }); soloCsv++; }
console.log('envíos a puentes que solo estaban en los CSV de aristas finales:', soloCsv);
console.log('envíos a puentes:', aristas.size, '| de ellos solo en el registro del vigilante (fuera del recorrido verificado):', soloVigilante);
const decodificarOFT = data => { // send((uint32 dstEid, bytes32 to, uint256 amountLD, uint256 minAmountLD, bytes, bytes, bytes), (uint256,uint256), address)
  const d = data.replace(/^0x/, ''); const sel = d.slice(0, 8); const w = i => d.slice(8 + i * 64, 8 + (i + 1) * 64); const off = parseInt(w(0), 16) * 2; const t = i => d.slice(8 + off + i * 64, 8 + off + (i + 1) * 64);
  const dstEid = parseInt(t(0), 16), to = t(1), amountLD = BigInt('0x' + t(2)), minLD = BigInt('0x' + t(3)); return { sel, dstEid, to, amountLD: Number(amountLD) / 1e6, minLD: Number(minLD) / 1e6, refund: w(3).slice(24) }; };
(async () => {
  const filas = []; let n = 0;
  for (const a of aristas.values()) {
    const tx = await post('/wallet/gettransactionbyid', a.tx); const inf = await post('/wallet/gettransactioninfobyid', a.tx);
    const c = tx && tx.raw_data && tx.raw_data.contract && tx.raw_data.contract[0]; const par = c && c.parameter && c.parameter.value;
    const f = { ...a, ok: !!c, ret: tx && tx.ret && tx.ret[0] && tx.ret[0].contractRet, bloque: inf && inf.blockNumber, llamada: par && par.contract_address ? toB58(par.contract_address) : null, selector: null, destino: null };
    if (par && par.data) { f.selector = par.data.slice(0, 8); if (/OFT/i.test(a.puente) || par.data.slice(0, 8) === 'c7c7f5b3') { try { const o = decodificarOFT(par.data); f.dstEid = o.dstEid; f.cadena = EID[o.dstEid] || 'eid ' + o.dstEid; f.aDireccionBytes32 = o.to; f.evm = /^0{24}/.test(o.to) ? '0x' + o.to.slice(24) : null; f.cantidadEnviada = o.amountLD; f.cantidadMinima = o.minLD; } catch (e) { f.errorDecodificar = String(e.message).slice(0, 60); } } else f.datosHex = par.data.slice(0, 400); }
    const lg = inf && inf.log || []; f.eventos = lg.length; filas.push(f);
    if (++n % 25 === 0) console.log('  …', n, '/', aristas.size);
  }
  fs.writeFileSync(OUT + 'puentes-decodificados.json', JSON.stringify(filas, null, 1));
  const por = {}; for (const f of filas) { const k = f.cadena || '(sin decodificar) ' + f.puente; const x = por[k] || (por[k] = { n: 0, usd: 0, robo: 0, destinos: new Set() }); x.n++; x.usd += f.v; x.robo += f.v * (f.p ?? 0); if (f.evm) x.destinos.add(f.evm); }
  console.log('\nPor cadena de destino:'); for (const [k, x] of Object.entries(por).sort((a, b) => b[1].usd - a[1].usd)) console.log('  ', k.padEnd(34), String(x.n).padStart(4), 'envíos |', Math.round(x.usd).toLocaleString('en').padStart(11), '$ brutos |', Math.round(x.robo).toLocaleString('en').padStart(10), '$ estimados del robo | direcciones destino', x.destinos.size);
  const dec = filas.filter(f => f.evm).length; console.log('decodificados con dirección EVM:', dec, 'de', filas.length, '| con error o sin decodificar:', filas.length - dec);
})().catch(e => console.error('ERROR', e.message, e.stack));
