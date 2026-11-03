'use strict';
// Catálogo de Ethereum/Arbitrum: mensajes recibidos, envenenamiento de direcciones, tokens falsos/basura y resumen de tokens de 0x5227….
// Uso: node catalogo-eth-mensajes.cjs → tron/catalogo-eth-mensajes.json
const fs = require('fs');
const { loadEtherscanKey } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs');
const KEY = loadEtherscanKey({ file: 'C:/EquipoIA/tether-blacklist/config.secret.json' }).key;
const D = 'C:/EquipoIA/research/binance-0x5227-2026-10-30/tron/'; const sleep = ms => new Promise(r => setTimeout(r, ms));
let ult = 0; async function E(chain, p) { for (let i = 0; i < 4; i++) { const w = ult + 230 - Date.now(); if (w > 0) await sleep(w); ult = Date.now(); const u = new URL('https://api.etherscan.io/v2/api'); u.searchParams.set('chainid', chain); for (const [k, v] of Object.entries(p)) u.searchParams.set(k, v); u.searchParams.set('apikey', KEY); try { const j = await (await fetch(u, { signal: AbortSignal.timeout(30000) })).json(); if (j.status === '0' && /rate limit/i.test(String(j.result || j.message))) { await sleep(1200); continue; } return j; } catch { await sleep(800); } } return null; }
const ADDR = { '0x5227f603c1ee34ce3c06efe6477003bdfccb2f8c': 'dirección del ladrón 0x5227…2f8c', '0x8532fa14acaf483729c449b8458aeddb900543d4': 'Receptor 1', '0x03b0ee5d82990cff1bda48651ac3e436d1a020ea': 'Receptor 2', '0xc887af690e0301cd4edbbce8f8d31b4ec65b286a': 'Consolidación A', '0x897c80d1a9729e94460e2bd93178bd5215158df3': 'Consolidación B', '0x54401f80da97893a15d43566184635b6674bc942': 'Consolidación C', '0x79e70d139fc05aa75f75611fdf2680e9952b544a': 'Consolidación D', '0x8d4b8ee62124b7ee140a51ddd07390a56f1c9e19': 'Consolidación E', '0x0000000000000000000000000000000000000da0': 'cuenta 0x…0da0 (Arbitrum)', '0x3e2bf1ac': null };
const REALES = new Set(Object.keys(ADDR).filter(a => a.length === 42)); for (const a of ['0x28c6c06298d514db089934071355e5743bf21d60', '0xdfd5293d8e347dfe59e90efd55b2956a1343963d']) REALES.add(a);
const CADENAS = [[1, 'Ethereum'], [42161, 'Arbitrum'], [43114, 'Avalanche'], [137, 'Polygon']];
const CONOCIDOS = { '0xdac17f958d2ee523a2206206994597c13d831ec7': 'USDT', '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'USDC', '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 'WETH', '0x912ce59144191c1204e64559fe8253a0e49e6548': 'ARB', '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9': 'USDT', '0xaf88d065e77c8cc2239327c5edb3a432268e5831': 'USDC' };
const norm = s => String(s).normalize('NFKC').replace(/[\u200b-\u200f\u202a-\u202e\u2060-\u206f]/g, '').toLowerCase();
const imitar = ['usdt', 'usdc', 'eth', 'weth', 'arb', 'avax', 'link', 'uni', 'dai', 'wbtc'];
const texto = hex => { if (!hex || hex === '0x') return null; try { const b = Buffer.from(hex.slice(2), 'hex'); if (b.length < 4 || b.length > 2000) return null; const s = b.toString('utf8'); const pr = [...s].filter(c => /[\p{L}\p{N}\p{P}\p{Zs}\p{S}]/u.test(c)).length / [...s].length; return pr > 0.9 && /[A-Za-z\u0400-\u04ff\u4e00-\u9fff]{3}/.test(s) ? s : null; } catch { return null; } };
const parecido = (s, pool) => { let best = null; for (const c of pool) { if (c === s) continue; let p = 2; while (p < s.length && s[p] === c[p]) p++; let q = 0; while (q < s.length && s[s.length - 1 - q] === c[c.length - 1 - q]) q++; if (p >= 6 && q >= 4 && (!best || p + q > best.p + best.q)) best = { c, p: p - 2, q }; } return best; };
(async () => {
  const t0 = Date.now(); const out = { generado: new Date().toISOString(), mensajes: [], polvo: [], falsos: [], tokens: {}, resumen: {} };
  const direcciones = Object.keys(ADDR).filter(a => a.length === 42);
  for (const [chain, cname] of CADENAS) {
    for (const a of direcciones) {
      if (chain !== 1 && chain !== 42161 && a !== '0x5227f603c1ee34ce3c06efe6477003bdfccb2f8c') continue;
      // transacciones normales
      let tx = []; for (let p = 1; p <= 10; p++) { const j = await E(chain, { module: 'account', action: 'txlist', address: a, startblock: 0, endblock: 99999999, page: p, offset: 1000, sort: 'asc' }); if (!j || j.status !== '1' || !Array.isArray(j.result)) { if (j && typeof j.result === 'string' && !/No transactions/i.test(j.result)) out.resumen[chain + a + ' txlist'] = j.result.slice(0, 80); break; } tx.push(...j.result); if (j.result.length < 1000) break; }
      let tk = []; for (let p = 1; p <= 10; p++) { const j = await E(chain, { module: 'account', action: 'tokentx', address: a, startblock: 0, endblock: 99999999, page: p, offset: 1000, sort: 'asc' }); if (!j || j.status !== '1' || !Array.isArray(j.result)) { if (j && typeof j.result === 'string' && !/No transactions/i.test(j.result)) out.resumen[chain + a + ' tokentx'] = j.result.slice(0, 80); break; } tk.push(...j.result); if (j.result.length < 1000) break; }
      out.resumen[cname + ' ' + a] = { txlist: tx.length, tokentx: tk.length };
      // grandes contrapartes
      const pool = new Set(REALES); for (const t of tk) { const cantidad = Number(t.value) / Math.pow(10, Number(t.tokenDecimal) || 0); if (/^(USDT|USDC)$/.test(t.tokenSymbol) && cantidad >= 100000) { pool.add(t.from.toLowerCase()); pool.add(t.to.toLowerCase()); } } for (const t of tx) if (Number(t.value) / 1e18 >= 50) { pool.add(t.from.toLowerCase()); pool.add(t.to.toLowerCase()); }
      pool.delete('0x0000000000000000000000000000000000000000');
      // mensajes y polvo de ETH (entradas)
      for (const t of tx) {
        if (t.to.toLowerCase() !== a || t.from.toLowerCase() === a) continue; const m = texto(t.input); const eth = Number(t.value) / 1e18;
        if (m) out.mensajes.push({ cadena: cname, billetera: a, nombre: ADDR[a], de: t.from, hora: Number(t.timeStamp) * 1000, tx: t.hash, eth, texto: m });
        else if (eth < 0.001 && t.isError === '0') { const p = parecido(t.from.toLowerCase(), pool); out.polvo.push({ cadena: cname, billetera: a, nombre: ADDR[a], tipo: 'ETH', de: t.from, hora: Number(t.timeStamp) * 1000, tx: t.hash, cantidad: eth, token: 'ETH', contrato: '', imita: p ? p.c : null }); }
      }
      // tokens
      const reales = new Set(['0xdac17f958d2ee523a2206206994597c13d831ec7', '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48']);
      const origenLegitimo = new Set(); for (const t of tk) if (t.to.toLowerCase() === a && ['0x28c6c06298d514db089934071355e5743bf21d60', '0xdfd5293d8e347dfe59e90efd55b2956a1343963d', '0xee7ae85f2fe2239e27af91161d7be6e9d8bb4055'].includes(t.from.toLowerCase())) origenLegitimo.add(t.contractAddress.toLowerCase());
      for (const t of tk) {
        const cant = Number(t.value) / Math.pow(10, Number(t.tokenDecimal) || 0), entra = t.to.toLowerCase() === a, c = t.contractAddress.toLowerCase();
        const key = cname + '|' + c; const x = out.tokens[key] || (out.tokens[key] = { cadena: cname, contrato: c, simbolo: t.tokenSymbol, nombre: t.tokenName, decimales: Number(t.tokenDecimal), recibido: 0, enviado: 0, nIn: 0, nOut: 0, legitimo: false, billeteras: new Set() }); x.billeteras.add(a);
        if (entra) { x.recibido += cant; x.nIn++; } else { x.enviado += cant; x.nOut++; }
        if (origenLegitimo.has(c) || CONOCIDOS[c]) x.legitimo = true;
        if (!entra) continue;
        const de = t.from.toLowerCase(); if (pool.has(de) && !/^0x0{30}/.test(de)) continue;
        const simN = norm(t.tokenSymbol), nomN = norm(t.tokenName), suplanta = (imitar.includes(simN) || imitar.includes(nomN)) && !CONOCIDOS[c], raro = /[^\x20-\x7e]/.test(t.tokenSymbol + t.tokenName);
        const stableReal = CONOCIDOS[c] === 'USDT' || CONOCIDOS[c] === 'USDC';
        if (stableReal && cant <= 1) { const p = parecido(de, pool); out.polvo.push({ cadena: cname, billetera: a, nombre: ADDR[a], tipo: cant === 0 ? 'transferencia de 0 (envenenamiento clásico)' : 'polvo de stablecoin', de: t.from, hora: Number(t.timeStamp) * 1000, tx: t.hash, cantidad: cant, token: t.tokenSymbol, contrato: c, imita: p ? p.c : null }); }
        else if (!origenLegitimo.has(c) && !CONOCIDOS[c]) { const p = parecido(de, pool); out.falsos.push({ cadena: cname, billetera: a, nombre: ADDR[a], simbolo: t.tokenSymbol, nombreToken: t.tokenName, contrato: c, de: t.from, hora: Number(t.timeStamp) * 1000, tx: t.hash, cantidad: cant, motivo: suplanta ? 'imita a un token conocido' : raro ? 'nombre con caracteres especiales' : 'token no recibido de Binance (spam/airdrop)', imita: p ? p.c : null }); }
      }
      console.log(cname.padEnd(10), a.slice(0, 12), 'tx', tx.length, 'tokentx', tk.length, '| mensajes', out.mensajes.length, 'polvo', out.polvo.length, 'falsos', out.falsos.length, '| min', Math.round((Date.now() - t0) / 60000));
    }
  }
  for (const x of Object.values(out.tokens)) x.billeteras = [...x.billeteras];
  fs.writeFileSync(D + 'catalogo-eth-mensajes.json', JSON.stringify(out));
  console.log('\nmensajes', out.mensajes.length, '| polvo', out.polvo.length, '| tokens falsos/spam (filas)', out.falsos.length, '| tokens distintos', Object.keys(out.tokens).length, '| min', Math.round((Date.now() - t0) / 60000));
})().catch(e => { console.error('ERROR', e.stack); process.exit(1); });
