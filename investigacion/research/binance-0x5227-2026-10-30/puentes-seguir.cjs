'use strict';
// Sigue en Ethereum y Arbitrum (Etherscan v2) las direcciones a las que llegó el dinero que salió de TRON por el puente USDT0.
// Uso: node puentes-seguir.cjs  → lee tron/puentes-destinos.json y escribe tron/puentes-seguimiento.json
const fs = require('fs'); const { DatabaseSync } = require('node:sqlite');
const { loadEtherscanKey } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs');
const KEY = loadEtherscanKey({ file: 'C:/EquipoIA/tether-blacklist/config.secret.json' }).key;
const OUT = 'C:/EquipoIA/research/binance-0x5227-2026-10-30/tron/'; const sleep = ms => new Promise(r => setTimeout(r, ms));
const CHAIN = { Ethereum: 1, Arbitrum: 42161 };
const db = new DatabaseSync('C:/EquipoIA/tether-blacklist/state/etiquetas.sqlite', { readOnly: true }); const st = db.prepare('select nombre,tipo from etiquetas where red=? and direccion=?');
const etiqueta = (cadena, a) => { try { const r = st.get(cadena.toLowerCase(), a) || st.get('ethereum', a); return r ? r.nombre + ' (' + r.tipo + ')' : null; } catch { return null; } };
let ult = 0, peticiones = 0;
async function api(chain, params) { for (let i = 0; i < 4; i++) { const w = ult + 240 - Date.now(); if (w > 0) await sleep(w); ult = Date.now(); peticiones++; const u = new URL('https://api.etherscan.io/v2/api'); u.searchParams.set('chainid', chain); for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v); u.searchParams.set('apikey', KEY); try { const r = await fetch(u, { signal: AbortSignal.timeout(25000) }); const j = await r.json(); if (j.status === '0' && /rate limit/i.test(String(j.result || j.message))) { await sleep(1200); continue; } return j; } catch { await sleep(800); } } return null; }
const lista = j => (j && j.status === '1' && Array.isArray(j.result)) ? j.result : [];
const D = JSON.parse(fs.readFileSync(OUT + 'puentes-destinos.json', 'utf8')); const T0 = Date.UTC(2026, 9, 30) / 1000;
const fmt = n => Math.round(n).toLocaleString('en'); const iso = s => new Date(s * 1000).toISOString().slice(5, 16).replace('T', ' ');
const esUSD = t => /^(USDT|USD₮0|USDC|USDe|USD1|DAI|FDUSD|PYUSD)/i.test(t.tokenSymbol) && Number(t.tokenDecimal) === 6 || /^(DAI)$/i.test(t.tokenSymbol);
const cacheNombre = new Map();
async function nombreDe(chain, cadena, a) { const k = chain + a; if (cacheNombre.has(k)) return cacheNombre.get(k); let n = etiqueta(cadena, a); if (!n) { const c = await api(chain, { module: 'proxy', action: 'eth_getCode', address: a, tag: 'latest' }); const esC = c && typeof c.result === 'string' && c.result.length > 2; if (esC) { const s = await api(chain, { module: 'contract', action: 'getsourcecode', address: a }); const nom = s && Array.isArray(s.result) && s.result[0] && s.result[0].ContractName; n = 'contrato ' + (nom || 'sin verificar'); } else n = null; } cacheNombre.set(k, n); return n; }
(async () => {
  const res = [];
  for (const d of D) {
    const chain = CHAIN[d.cadena]; if (!chain) continue;
    const tk = lista(await api(chain, { module: 'account', action: 'tokentx', address: d.evm, page: 1, offset: 300, sort: 'desc' }));
    const eth = await api(chain, { module: 'account', action: 'balance', address: d.evm, tag: 'latest' });
    const tx = lista(await api(chain, { module: 'account', action: 'txlist', address: d.evm, page: 1, offset: 60, sort: 'desc' }));
    const a = d.evm.toLowerCase(); const usd = tk.filter(esUSD);
    const ent = usd.filter(t => t.to.toLowerCase() === a && Number(t.timeStamp) >= T0), sal = usd.filter(t => t.from.toLowerCase() === a && Number(t.timeStamp) >= T0);
    const sum = l => l.reduce((s, t) => s + Number(t.value) / 1e6, 0);
    const bal = {}; for (const [sim, ct] of Object.entries({ USDT: chain === 1 ? '0xdac17f958d2ee523a2206206994597c13d831ec7' : '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', USDT0: '0x6c96de32cea08842dcc4058c14d3aaad7fa41dee', USDC: chain === 1 ? '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' : '0xaf88d065e77c8cc2239327c5edb3a432268e5831' })) { if (chain !== 1 && sim === 'USDT0') continue; const j = await api(chain, { module: 'account', action: 'tokenbalance', contractaddress: ct, address: d.evm, tag: 'latest' }); bal[sim] = j && j.status === '1' ? Number(j.result) / 1e6 : null; }
    const a2 = {}; for (const t of sal) { const k = t.to.toLowerCase(); const x = a2[k] || (a2[k] = { a: k, v: 0, n: 0, sim: new Set() }); x.v += Number(t.value) / 1e6; x.n++; x.sim.add(t.tokenSymbol); }
    const destinos = Object.values(a2).sort((x, y) => y.v - x.v).slice(0, 4); for (const x of destinos) { x.nombre = x.v >= 5000 ? await nombreDe(chain, d.cadena, x.a) : null; x.sim = [...x.sim].join(','); }
    const f = { cadena: d.cadena, evm: d.evm, recibidoDesdeTron: d.usd, roboEstimado: d.robo, enviosPuente: d.n, entradasUSD: sum(ent), salidasUSD: sum(sal), nEntradas: ent.length, nSalidas: sal.length, primeraEntrada: ent.length ? Math.min(...ent.map(t => Number(t.timeStamp))) : null, ultimaSalida: sal.length ? Math.max(...sal.map(t => Number(t.timeStamp))) : null, ethSaldo: eth && eth.status === '1' ? Number(BigInt(eth.result) / 10n ** 12n) / 1e6 : null, saldos: bal, txPropias: tx.filter(t => t.from.toLowerCase() === a).length, destinos, etiqueta: etiqueta(d.cadena, d.evm) };
    res.push(f); if (res.length % 10 === 0) console.log('  …', res.length, '/', D.length, '| peticiones', peticiones);
  }
  fs.writeFileSync(OUT + 'puentes-seguimiento.json', JSON.stringify(res, null, 1));
  const tot = k => res.reduce((s, f) => s + (f[k] || 0), 0);
  console.log('\ndirecciones seguidas:', res.length, '| recibido desde TRON (USDT0 bruto):', fmt(tot('recibidoDesdeTron')), '| entradas de stablecoins desde 30-oct:', fmt(tot('entradasUSD')), '| salidas:', fmt(tot('salidasUSD')));
  const sal = res.filter(f => (f.saldos.USDT || 0) + (f.saldos.USDT0 || 0) + (f.saldos.USDC || 0) >= 10000); console.log('con ≥ 10.000 $ de stablecoins todavía dentro:', sal.length, '→', fmt(sal.reduce((s, f) => s + (f.saldos.USDT || 0) + (f.saldos.USDT0 || 0) + (f.saldos.USDC || 0), 0)), '$');
  const porNombre = {}; for (const f of res) for (const x of f.destinos) { const k = x.nombre || '(sin etiqueta)'; porNombre[k] = (porNombre[k] || 0) + x.v; } console.log('\nadónde reenvían (top por importe):'); for (const [k, v] of Object.entries(porNombre).sort((a, b) => b[1] - a[1]).slice(0, 15)) console.log('  ', k.padEnd(48), fmt(v).padStart(11), '$');
  console.log('\nlas 12 mayores:'); for (const f of res.sort((a, b) => b.roboEstimado - a.roboEstimado).slice(0, 12)) console.log(' ', f.cadena.padEnd(9), f.evm, '| recibió', fmt(f.recibidoDesdeTron).padStart(9), '| entradas', fmt(f.entradasUSD).padStart(9), 'salidas', fmt(f.salidasUSD).padStart(9), '| dentro USDT', fmt(f.saldos.USDT || 0), 'USDT0', fmt(f.saldos.USDT0 || 0), 'USDC', fmt(f.saldos.USDC || 0), '| ETH', f.ethSaldo, '| →', f.destinos.slice(0, 2).map(x => (x.nombre || x.a.slice(0, 8)) + ' ' + fmt(x.v)).join(' ; '));
})().catch(e => console.error('ERROR', e.message, e.stack));
