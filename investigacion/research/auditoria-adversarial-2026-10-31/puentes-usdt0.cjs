'use strict';
// Auditoría de los envíos USDT0: enviado, recibido según LayerZero, recibido según el recibo de la transacción de llegada (Etherscan), comisión y estado.
const fs = require('fs'); const { loadEtherscanKey } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs'); const K = loadEtherscanKey({ file: 'C:/EquipoIA/tether-blacklist/config.secret.json' }).key;
const D = 'C:/EquipoIA/research/binance-0x5227-2026-10-30/tron/'; const sleep = ms => new Promise(r => setTimeout(r, ms));
let ult = 0; async function E(chain, p) { for (let i = 0; i < 4; i++) { const w = ult + 240 - Date.now(); if (w > 0) await sleep(w); ult = Date.now(); const u = new URL('https://api.etherscan.io/v2/api'); u.searchParams.set('chainid', chain); for (const [k, v] of Object.entries(p)) u.searchParams.set(k, v); u.searchParams.set('apikey', K); try { const j = await (await fetch(u, { signal: AbortSignal.timeout(30000) })).json(); if (j.status === '0' && /rate limit/i.test(String(j.result || j.message))) { await sleep(1200); continue; } return j; } catch { await sleep(800); } } return null; }
const lz = JSON.parse(fs.readFileSync(D + 'lz-estado.json', 'utf8')), pd = new Map(JSON.parse(fs.readFileSync(D + 'puentes-decodificados.json', 'utf8')).map(f => [f.tx, f]));
const TRANSFER = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'; const fmt = n => Math.round(n).toLocaleString('en');
(async () => {
  const filas = []; let n = 0;
  for (const r of lz) {
    const f = pd.get(r.tx); const chain = f.cadena === 'Arbitrum' ? 42161 : 1; const fila = { tx: r.tx, hora: f.at, cadena: f.cadena, evm: f.evm, enviado: f.cantidadEnviada, minimo: f.cantidadMinima, lzEstado: r.estado, lzDestino: r.destino, nilify: !!r.nilify, recibidoLZ: r.importeLZ, dstTx: r.dstTx || null, recibidoRecibo: null, receptorRecibo: null, bloqueDst: null, p: f.p, tramo: f.tramo, v: f.v };
    if (r.estado === 'DELIVERED' && r.dstTx) {
      const j = await E(chain, { module: 'proxy', action: 'eth_getTransactionReceipt', txhash: r.dstTx }); const rc = j && j.result;
      if (rc && Array.isArray(rc.logs)) { fila.bloqueDst = parseInt(rc.blockNumber, 16); let tot = 0, quien = null; for (const l of rc.logs) { if (l.topics && l.topics[0] === TRANSFER && l.topics.length === 3) { const to = '0x' + l.topics[2].slice(26); if (to.toLowerCase() === (f.evm || '').toLowerCase()) { tot += Number(BigInt(l.data)) / 1e6; quien = to; (fila.contratosToken = fila.contratosToken || []).push(l.address.toLowerCase()); } } } fila.recibidoRecibo = tot || null; fila.receptorRecibo = quien; fila.estadoRecibo = rc.status === '0x1' ? 'éxito' : 'FALLÓ'; } else fila.estadoRecibo = 'sin recibo';
    }
    filas.push(fila); if (++n % 40 === 0) console.log('  …', n, '/', lz.length);
  }
  fs.writeFileSync(__dirname + '/resultados/puentes-usdt0.json', JSON.stringify(filas, null, 1));
  const ent = filas.filter(x => x.lzEstado === 'DELIVERED'), conRec = ent.filter(x => x.recibidoRecibo), noEnt = filas.filter(x => x.lzEstado !== 'DELIVERED');
  const sum = (l, k) => l.reduce((s, x) => s + (x[k] || 0), 0);
  console.log('\nENVÍOS', filas.length, '| entregados', ent.length, '| no entregados', noEnt.length, '(' + fmt(sum(noEnt, 'enviado')) + ' USDT enviados)');
  console.log('enviado (entregados)', fmt(sum(ent, 'enviado')), '| recibido según LayerZero', fmt(sum(ent, 'recibidoLZ')), '| recibido según recibo en destino', fmt(sum(conRec, 'recibidoRecibo')), 'en', conRec.length, 'envíos');
  const dif = conRec.map(x => x.enviado - x.recibidoRecibo); console.log('comisión (enviado − recibido en destino): total', fmt(dif.reduce((a, b) => a + b, 0)), '| media por envío', (dif.reduce((a, b) => a + b, 0) / dif.length).toFixed(2), '| máx', Math.max(...dif).toFixed(2), '| mín', Math.min(...dif).toFixed(2));
  const incoh = conRec.filter(x => Math.abs(x.recibidoRecibo - x.recibidoLZ) > 0.02); console.log('recibo ≠ payload de LayerZero (>0,02 USDT):', incoh.length); for (const x of incoh.slice(0, 6)) console.log('   ', x.tx.slice(0, 10), 'LZ', x.recibidoLZ, 'recibo', x.recibidoRecibo, 'enviado', x.enviado);
  const toks = {}; for (const x of filas) for (const c of (x.contratosToken || [])) { const k = x.cadena + ' ' + c; toks[k] = (toks[k] || 0) + 1; } console.log('contratos que emiten el Transfer contado, por cadena:', JSON.stringify(toks));
  const sinRec = ent.filter(x => !x.recibidoRecibo); console.log('entregados sin Transfer al destino en el recibo:', sinRec.length, sinRec.slice(0, 5).map(x => x.tx.slice(0, 10) + ' ' + x.dstTx));
})();
