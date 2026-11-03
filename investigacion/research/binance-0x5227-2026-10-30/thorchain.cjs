'use strict';
// Decodifica las operaciones de THORChain hechas por las direcciones destino del puente USDT0 y averigua a qué cadena y dirección salen.
// Uso: node thorchain.cjs → tron/thorchain-decodificado.json
const fs = require('fs');
const { loadEtherscanKey } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs');
const KEY = loadEtherscanKey({ file: 'C:/EquipoIA/tether-blacklist/config.secret.json' }).key;
const OUT = 'C:/EquipoIA/research/binance-0x5227-2026-10-30/tron/'; const sleep = ms => new Promise(r => setTimeout(r, ms));
let ult = 0;
async function api(chain, params) { for (let i = 0; i < 4; i++) { const w = ult + 240 - Date.now(); if (w > 0) await sleep(w); ult = Date.now(); const u = new URL('https://api.etherscan.io/v2/api'); u.searchParams.set('chainid', chain); for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v); u.searchParams.set('apikey', KEY); try { const r = await fetch(u, { signal: AbortSignal.timeout(25000) }); const j = await r.json(); if (j.status === '0' && /rate limit/i.test(String(j.result || j.message))) { await sleep(1200); continue; } return j; } catch { await sleep(800); } } return null; }
const lista = j => (j && j.status === '1' && Array.isArray(j.result)) ? j.result : [];
const S = JSON.parse(fs.readFileSync(OUT + 'puentes-seguimiento.json', 'utf8')); const fmt = n => Math.round(n).toLocaleString('en'); const iso = s => new Date(s * 1000).toISOString().slice(5, 16).replace('T', ' ');
const ASSET = { '0xdac17f958d2ee523a2206206994597c13d831ec7': ['USDT', 6], '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': ['USDC', 6], '0x6c96de32cea08842dcc4058c14d3aaad7fa41dee': ['USDT0', 6], '0x0000000000000000000000000000000000000000': ['ETH', 18], '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9': ['USDT', 6], '0xaf88d065e77c8cc2239327c5edb3a432268e5831': ['USDC', 6] };
const decodificar = input => { const d = input.replace(/^0x/, ''); const sel = d.slice(0, 8); if (sel !== '44bc937b') return { sel }; const w = i => d.slice(8 + i * 64, 8 + (i + 1) * 64); const off = parseInt(w(3), 16) * 2; const len = parseInt(d.slice(8 + off, 8 + off + 64), 16); const memo = Buffer.from(d.slice(8 + off + 64, 8 + off + 64 + len * 2), 'hex').toString('utf8'); return { sel, vault: '0x' + w(0).slice(24), asset: '0x' + w(1).slice(24), amount: BigInt('0x' + w(2)), memo }; };
(async () => {
  const router = new Set(); for (const f of S) for (const x of f.destinos) if (/THORChain/i.test(x.nombre || '')) router.add(x.a);
  console.log('routers THORChain vistos:', [...router].join(', '));
  const usuarios = S.filter(f => f.destinos.some(x => /THORChain/i.test(x.nombre || '')));
  console.log('direcciones que usan THORChain:', usuarios.length);
  const ops = [];
  for (const f of usuarios) {
    const chain = f.cadena === 'Ethereum' ? 1 : 42161;
    const tx = lista(await api(chain, { module: 'account', action: 'txlist', address: f.evm, page: 1, offset: 400, sort: 'desc' }));
    for (const t of tx) { if (!router.has(t.to.toLowerCase())) continue; if (Number(t.timeStamp) < Date.UTC(2026, 9, 30) / 1000) continue; if (t.isError === '1') continue; let o; try { o = decodificar(t.input); } catch { continue; } if (!o.memo) continue; const [a, d] = ASSET[o.asset] || [o.asset.slice(0, 8), 18]; const cant = Number(o.amount) / Math.pow(10, d); const usd = a === 'ETH' ? cant * 2253 : (/^USD/.test(a) ? cant : null); const p = o.memo.split(':'); ops.push({ desde: f.evm, hora: Number(t.timeStamp), tx: t.hash, asset: a, cantidad: cant, usd, memo: o.memo, funcion: p[0], destinoAsset: p[1] || null, destinoDir: p[2] || null }); }
    console.log('  ', f.evm.slice(0, 10), 'operaciones THORChain hallazgos acumulados:', ops.length);
  }
  fs.writeFileSync(OUT + 'thorchain-decodificado.json', JSON.stringify(ops, null, 1));
  const por = {}; for (const o of ops) { const k = (o.destinoAsset || '?'); const x = por[k] || (por[k] = { n: 0, usd: 0, dir: new Set() }); x.n++; x.usd += o.usd || 0; if (o.destinoDir) x.dir.add(o.destinoDir); }
  console.log('\noperaciones THORChain decodificadas:', ops.length, '| $', fmt(ops.reduce((s, o) => s + (o.usd || 0), 0)));
  console.log('Por activo y cadena de destino:'); for (const [k, x] of Object.entries(por).sort((a, b) => b[1].usd - a[1].usd)) console.log('  ', k.padEnd(18), String(x.n).padStart(4), 'operaciones |', fmt(x.usd).padStart(10), '$ | direcciones destino', x.dir.size);
  const dir = {}; for (const o of ops) { if (!o.destinoDir) continue; const k = o.destinoAsset + ' ' + o.destinoDir; const x = dir[k] || (dir[k] = { n: 0, usd: 0, primera: o.hora, ultima: o.hora }); x.n++; x.usd += o.usd || 0; x.primera = Math.min(x.primera, o.hora); x.ultima = Math.max(x.ultima, o.hora); }
  console.log('\nDirecciones destino (top):'); for (const [k, x] of Object.entries(dir).sort((a, b) => b[1].usd - a[1].usd).slice(0, 15)) console.log('  ', k.slice(0, 90).padEnd(92), String(x.n).padStart(3), 'ops', fmt(x.usd).padStart(10), '$', iso(x.primera), '→', iso(x.ultima));
})().catch(e => console.error('ERROR', e.message, e.stack));
