'use strict';
// Auditoría de los puentes: (P) agregados, (Q) 40 envíos al azar contra TronScan y (X) la llegada al otro lado en Ethereum/Arbitrum con Etherscan.
// Uso: node auditoria-puentes.cjs [P] [Q] [X] → tron/auditoria-puentes.json
const fs = require('fs');
const { loadTronKeys, loadEtherscanKey } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs');
const CFG = 'C:/EquipoIA/tether-blacklist/config.secret.json'; const keys = loadTronKeys({ file: CFG }); const EK = loadEtherscanKey({ file: CFG }).key;
const HS = { accept: 'application/json', 'TRON-PRO-API-KEY': keys.tronscanKey }; const D = 'C:/EquipoIA/research/binance-0x5227-2026-10-30/tron/'; const sleep = ms => new Promise(r => setTimeout(r, ms));
const USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'; const fmt = n => Math.round(n).toLocaleString('en');
const quiero = process.argv.slice(2).map(s => s.toUpperCase()); const toca = p => !quiero.length || quiero.includes(p);
async function S(u) { for (let i = 0; i < 5; i++) { try { await sleep(330); const r = await fetch('https://apilist.tronscanapi.com' + u, { headers: HS, signal: AbortSignal.timeout(25000) }); if (r.status === 429) { await sleep(2000 * (i + 1)); continue; } return await r.json(); } catch { await sleep(1000 * (i + 1)); } } return null; }
let ult = 0; async function E(chain, p) { for (let i = 0; i < 4; i++) { const w = ult + 240 - Date.now(); if (w > 0) await sleep(w); ult = Date.now(); const u = new URL('https://api.etherscan.io/v2/api'); u.searchParams.set('chainid', chain); for (const [k, v] of Object.entries(p)) u.searchParams.set(k, v); u.searchParams.set('apikey', EK); try { const j = await (await fetch(u, { signal: AbortSignal.timeout(25000) })).json(); if (j.status === '0' && /rate limit/i.test(String(j.result || j.message))) { await sleep(1200); continue; } return j; } catch { await sleep(800); } } return null; }
const F = JSON.parse(fs.readFileSync(D + 'puentes-decodificados.json', 'utf8')); const R = {};
(async () => {
  const t0 = Date.now();
  if (toca('P')) {
    console.log('== P. Totales de los puentes (decodificados con TronGrid)');
    const por = {}; for (const f of F) { const k = f.tramo + ' | ' + f.puente; const x = por[k] || (por[k] = { n: 0, bruto: 0, robo: 0, desde: new Set(), fallidas: 0 }); x.n++; x.bruto += f.v; x.robo += f.v * (f.p ?? 0); x.desde.add(f.desde); if (!f.ok) x.fallidas++; }
    for (const [k, x] of Object.entries(por).sort()) console.log('  ', k.padEnd(28), String(x.n).padStart(4), 'envíos |', fmt(x.bruto).padStart(10), '$ brutos |', fmt(x.robo).padStart(10), '$ robo |', x.desde.size, 'billeteras | fallidas', x.fallidas);
    R.agregados = Object.fromEntries(Object.entries(por).map(([k, x]) => [k, { n: x.n, bruto: x.bruto, robo: x.robo, billeteras: x.desde.size, fallidas: x.fallidas }]));
    const oft = F.filter(f => f.dstEid); const dest = {}; for (const f of oft) { const x = dest[f.cadena] || (dest[f.cadena] = { n: 0, bruto: 0, robo: 0 }); x.n++; x.bruto += f.v; x.robo += f.v * (f.p ?? 0); }
    console.log('   por cadena de destino (USDT0):', Object.entries(dest).sort((a, b) => b[1].bruto - a[1].bruto).map(([k, x]) => `${k} ${x.n} envíos ${fmt(x.bruto)} $ (robo ${fmt(x.robo)})`).join(' ; '));
    R.destinos = dest;
  }
  if (toca('Q')) {
    console.log('\n== Q. 40 envíos de puente al azar contra TronScan: cantidad enviada, contrato y quien paga');
    let sem = 777; const rnd = () => (sem = (sem * 1664525 + 1013904223) % 4294967296) / 4294967296; const a = F.filter(f => f.ok).slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    let ok = 0, mal = []; for (const f of a.slice(0, 40)) {
      const j = await S('/api/transaction-info?hash=' + f.tx); if (!j || !j.hash) { mal.push({ tx: f.tx.slice(0, 12), motivo: 'sin respuesta' }); continue; }
      const tr = (j.trc20TransferInfo || []).filter(t => t.symbol === 'USDT'); const pago = tr.find(t => t.from_address === f.desde && Math.abs(Number(t.amount_str ?? t.amount) / Math.pow(10, t.decimals ?? 6) - f.cant) < 0.01);
      const ctr = j.toAddress === f.contrato || j.contractData?.contract_address === f.contrato; const t = Math.abs(j.timestamp - f.at) <= 3000;
      if (pago && ctr && t && j.contractRet === 'SUCCESS') ok++; else mal.push({ tx: f.tx.slice(0, 12), pago: !!pago, contrato: ctr, hora: t, ret: j.contractRet, esperado: { desde: f.desde.slice(0, 8), cant: f.cant, contrato: f.contrato.slice(0, 8) }, visto: tr.slice(0, 2).map(x => ({ de: x.from_address.slice(0, 8), a: x.to_address.slice(0, 8), c: x.amount_str })) });
    }
    console.log('   coinciden', ok, 'de 40 | fallos', mal.length); for (const m of mal.slice(0, 10)) console.log('    ✗', JSON.stringify(m).slice(0, 300)); R.contraTronScan = { n: 40, ok, fallos: mal };
  }
  if (toca('X')) {
    console.log('\n== X. Llegada al otro lado: ¿aparece en Ethereum/Arbitrum un ingreso de USDT0/USDT por el importe enviado, poco después?');
    const TOK = { 1: ['0x6c96de32cea08842dcc4058c14d3aaad7fa41dee', '0xdac17f958d2ee523a2206206994597c13d831ec7'], 42161: ['0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9'] }; const CH = { Ethereum: 1, Arbitrum: 42161 };
    const oft = F.filter(f => f.ok && f.evm && CH[f.cadena] && f.cantidadMinima).sort((a, b) => b.v - a.v);
    const gr = oft.slice(0, 40); let ok = 0, sinHallar = [], vistos = 0; const cache = {};
    for (const f of gr) {
      const chain = CH[f.cadena]; const key = chain + f.evm; if (!cache[key]) { cache[key] = []; for (const c of TOK[chain]) { const j = await E(chain, { module: 'account', action: 'tokentx', address: f.evm, contractaddress: c, page: 1, offset: 400, sort: 'desc' }); if (j && j.status === '1') cache[key].push(...j.result); } }
      const lo = Math.floor(f.cantidadMinima * 1e6) - 1, hi = Math.ceil(f.cantidadEnviada * 1e6) + 1;
      const hit = cache[key].find(t => t.to.toLowerCase() === f.evm.toLowerCase() && Number(t.value) >= lo && Number(t.value) <= hi && Number(t.timeStamp) * 1000 >= f.at - 60000 && Number(t.timeStamp) * 1000 <= f.at + 6 * 3600000);
      vistos++; if (hit) ok++; else sinHallar.push({ tx: f.tx.slice(0, 12), cadena: f.cadena, evm: f.evm.slice(0, 10), enviado: f.cantidadEnviada, hora: new Date(f.at).toISOString().slice(5, 16) });
    }
    console.log('   los', vistos, 'mayores envíos por USDT0: con ingreso del mismo importe en destino', ok, '| sin hallar', sinHallar.length); for (const m of sinHallar.slice(0, 10)) console.log('    ?', JSON.stringify(m)); R.llegada = { n: vistos, ok, sinHallar };
  }
  fs.writeFileSync(D + 'auditoria-puentes.json', JSON.stringify({ generado: new Date().toISOString(), ...R }, null, 1)); console.log('\nlisto en', Math.round((Date.now() - t0) / 1000), 's');
})().catch(e => { console.error('ERROR', e.stack); process.exit(1); });
