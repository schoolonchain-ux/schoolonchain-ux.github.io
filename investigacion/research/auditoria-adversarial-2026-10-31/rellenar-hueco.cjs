'use strict';
// Rellena el HUECO de ventana del primer tramo: para cada billetera que recibió dinero robado antes de empezar su lectura (la lista se genera en atribucion.cjs), se piden a TronScan sus SALIDAS en ese hueco
// y se clasifica el destino con la misma tabla de clases del informe. No se sigue más allá (los destinos no clasificados quedan como «sin seguir»).
const fs = require('fs'); const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs'); const k = loadTronKeys({ file: 'C:/EquipoIA/tether-blacklist/config.secret.json' });
const HS = { accept: 'application/json', 'TRON-PRO-API-KEY': k.tronscanKey }; const sleep = ms => new Promise(r => setTimeout(r, ms)); const USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', PX = 0.352, SEGUIR = 3520;
const S = async u => { for (let i = 0; i < 4; i++) { try { await sleep(330); const r = await fetch('https://apilist.tronscanapi.com' + u, { headers: HS, signal: AbortSignal.timeout(25000) }); if (r.status === 429) { await sleep(2000); continue; } return await r.json(); } catch { await sleep(900); } } return null; };
const SRC = 'C:/EquipoIA/research/binance-0x5227-2026-10-30/tron/'; const clases = JSON.parse(fs.readFileSync(SRC + 'traza-clases.json', 'utf8'));
const CASAS = new Set(['TU4vEruvZwLLkSfV9bNw12EJTPvNr7Pvaa', 'TLaGjwhvA8XQYSxFAcAXy7Dvuue9eGYitv', 'TBA6CypYJizwA9XdC7Ubgc5F1bxrQ7SqPt', 'TUpHuDkiCCmwaTZBHZvQdwWzGNm5t8J2b9', 'TJ7hhYhVhaxNx6BPyq7yFpqZrQULL3JSdb', 'TEPSrSYPDSQ7yXpMFPq91Fb1QEWpMkRGfn', 'TG2CMGxnTPgQ6V58kiKd7wbyN8ewtAmY76']);
const cl = a => CASAS.has(a) ? { tipo: 'casa', nombre: 'casa (etiqueta)' } : clases[a] || { tipo: 'sin_clasificar' };
const pv = JSON.parse(fs.readFileSync(__dirname + '/resultados/preventana-tramo1.json', 'utf8')); const fmt = n => Math.round(n).toLocaleString('en');
// Pagina hasta agotar (200 por página, máx. 10 páginas) y dice si quedó completo.
const SP = async (base, campo) => { const out = []; for (let p = 0; p < 10; p++) { const j = await S(base + '&limit=200&start=' + (p * 200)); const l = (j && j[campo]) || []; out.push(...l); if (l.length < 200) return { [campo]: out, completo: !!j }; } return { [campo]: out, completo: false }; };
const incompletas = [];
(async () => {
  const aristas = []; let n = 0;
  for (const [w, q] of pv) {
    const a = q.primera - 60000, b = q.desde; if (b <= a) continue;
    const t = await SP('/api/transfer?address=' + w + '&sort=timestamp&count=true&start_timestamp=' + a + '&end_timestamp=' + b, 'data'); const u = await SP('/api/token_trc20/transfers?sort=timestamp&count=true&contract_address=' + USDT + '&relatedAddress=' + w + '&start_timestamp=' + a + '&end_timestamp=' + b, 'token_transfers'); if (!t.completo || !u.completo) incompletas.push(w);
    for (const x of (t && t.data) || []) if (x.tokenName === '_' && x.contractRet === 'SUCCESS' && x.transferFromAddress === w && x.amount / 1e6 * PX >= SEGUIR) aristas.push({ de: w, a: x.transferToAddress, sim: 'TRX', cant: x.amount / 1e6, v: x.amount / 1e6 * PX, at: x.timestamp, tx: x.transactionHash });
    for (const x of (u && u.token_transfers) || []) if (x.contractRet === 'SUCCESS' && x.from_address === w && Number(x.quant) / 1e6 >= SEGUIR) aristas.push({ de: w, a: x.to_address, sim: 'USDT', cant: Number(x.quant) / 1e6, v: Number(x.quant) / 1e6, at: x.block_ts, tx: x.transaction_id });
    if (++n % 20 === 0) console.log('  …', n, '/', pv.length, '| aristas', aristas.length);
  }
  const por = {}; for (const e of aristas) { const c = cl(e.a); const k2 = c.tipo; const x = por[k2] || (por[k2] = { n: 0, v: 0, d: new Set() }); x.n++; x.v += e.v; x.d.add(e.a); e.clase = c.tipo; e.nombre = c.nombre || null; }
  console.log('\nSALIDAS DEL HUECO (≥ 3.520 $):', aristas.length, 'aristas por', fmt(aristas.reduce((s, e) => s + e.v, 0)), '$ brutos');
  for (const [k2, x] of Object.entries(por).sort((a, b) => b[1].v - a[1].v)) console.log('  ', k2.padEnd(14), String(x.n).padStart(4), 'envíos', fmt(x.v).padStart(11), '$ brutos |', x.d.size, 'destinos distintos');
  const casas = aristas.filter(e => e.clase === 'casa'); console.log('\nENVÍOS DIRECTOS A CASAS DE CAMBIO EN EL HUECO:', casas.length); for (const e of casas.slice(0, 15)) console.log('  ', new Date(e.at).toISOString().slice(5, 19), e.de, '->', e.a, e.nombre, fmt(e.v), '$', e.tx);
  console.log('billeteras con lectura incompleta del hueco (más de 10 páginas o fallo):', incompletas.length); fs.writeFileSync(__dirname + '/resultados/hueco-aristas.json', JSON.stringify(aristas, null, 1));
})();
