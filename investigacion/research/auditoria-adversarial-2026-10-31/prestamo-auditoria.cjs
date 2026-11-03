'use strict';
// Auditoría de los depósitos en protocolos de préstamo (JustLend/otros) que el informe trata como «terminal»: ¿son definitivos o los remitentes retiraron después?
// Para cada remitente que depositó, se buscan transferencias USDT desde el mismo protocolo hacia él después del depósito. Solo lectura.
const fs = require('fs');
const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs');
const k = loadTronKeys({ file: 'C:/EquipoIA/tether-blacklist/config.secret.json' });
const HS = { accept: 'application/json', 'TRON-PRO-API-KEY': k.tronscanKey };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const S = async u => { for (let i = 0; i < 4; i++) { try { await sleep(330); const r = await fetch('https://apilist.tronscanapi.com' + u, { headers: HS, signal: AbortSignal.timeout(25000) }); if (r.status === 429) { await sleep(2000); continue; } return await r.json(); } catch { await sleep(900); } } return null; };
const D = 'C:/EquipoIA/research/binance-0x5227-2026-10-30/tron/';
const leer = (f, tramo) => fs.readFileSync(D + f, 'utf8').replace(/^\uFEFF/, '').trim().split(/\r?\n/).slice(1).map(l => { const c = l.split(';'); return { tramo, hora: c[0], de: c[1], a: c[2], tipo: c[3], nombre: c[4] || '(sin nombre)', imp: Number(c[5]), tok: c[6], pur: Number(c[7]), robo: Number(c[8]), niv: Number(c[9]), tx: c[10] }; });
const E = leer('traza-aristas-terminales.csv', 1).concat(leer('traza-post-aristas-terminales.csv', 2)).filter(e => e.tipo === 'prestamo');
const fmt = n => Math.round(n).toLocaleString('en');
const porProt = {}; for (const e of E) { const x = porProt[e.a] || (porProt[e.a] = { nombre: e.nombre, n: 0, bruto: 0, atrib: 0, rem: new Set(), toks: {} }); x.n++; x.bruto += e.tok === 'TRX' ? e.imp * 0.352 : e.imp; x.atrib += e.robo; x.rem.add(e.de); x.toks[e.tok] = (x.toks[e.tok] || 0) + 1; }
console.log('PROTOCOLOS DE PRÉSTAMO COMO TERMINAL:'); for (const [a, x] of Object.entries(porProt).sort((p, q) => q[1].atrib - p[1].atrib)) console.log(' ', a, x.nombre.padEnd(18), 'aristas', x.n, 'bruto$', fmt(x.bruto), 'atrib$', fmt(x.atrib), 'remitentes', x.rem.size, JSON.stringify(x.toks));
const totAtrib = E.reduce((s, e) => s + e.robo, 0); console.log('TOTAL préstamo atribuido', fmt(totAtrib), 'en', E.length, 'aristas');
(async () => {
  const res = []; let retirado = 0, retiradoAtrib = 0;
  const grupos = {}; for (const e of E) { const kx = e.de + '>' + e.a; const g = grupos[kx] || (grupos[kx] = { de: e.de, a: e.a, primera: e.hora, atrib: 0, bruto: 0 }); g.atrib += e.robo; g.bruto += e.tok === 'TRX' ? e.imp * 0.352 : e.imp; if (e.hora < g.primera) g.primera = e.hora; }
  const lista = Object.values(grupos).sort((p, q) => q.atrib - p.atrib).slice(0, 25);
  console.log('\nTop', lista.length, 'pares remitente→protocolo; ¿recibió el remitente USDT desde el protocolo después de depositar?');
  for (const g of lista) {
    const t0 = Date.parse(g.primera.replace(' ', 'T') + ':00Z') - 60000;
    const j = await S('/api/token_trc20/transfers?limit=50&start=0&sort=-timestamp&contract_address=' + USDT + '&relatedAddress=' + g.de + '&start_timestamp=' + t0 + '&end_timestamp=' + Date.now());
    const l = (j && j.token_transfers) || [];
    const dep = l.filter(x => x.from_address === g.de && x.to_address === g.a).reduce((s, x) => s + Number(x.quant) / 1e6, 0);
    const ret = l.filter(x => x.from_address === g.a && x.to_address === g.de).reduce((s, x) => s + Number(x.quant) / 1e6, 0);
    const pagina = l.length >= 50;
    res.push({ ...g, depositadoDesde: dep, retiradoDespues: ret, paginaLlena: pagina });
    retirado += ret; if (g.bruto > 0) retiradoAtrib += g.atrib * Math.min(ret / Math.max(dep, 1), 1);
    console.log(' ', g.de.slice(0, 10), '→', g.a.slice(0, 8), 'atrib', fmt(g.atrib).padStart(9), '| depositado (visto)', fmt(dep).padStart(10), '| retirado después', fmt(ret).padStart(10), pagina ? '(página llena: puede haber más)' : '');
  }
  console.log('\nRetirado después (suma de los 25 pares):', fmt(retirado), '| atribuido equivalente a lo retirado ≈', fmt(retiradoAtrib), 'de', fmt(totAtrib), 'atribuido total a préstamos');
  fs.writeFileSync(__dirname + '/resultados/prestamos.json', JSON.stringify({ protocolos: Object.fromEntries(Object.entries(porProt).map(([a, x]) => [a, { nombre: x.nombre, n: x.n, bruto: x.bruto, atrib: x.atrib, remitentes: x.rem.size }])), totAtrib, pares: res }, null, 1));
})().catch(e => { console.error('ERROR', String(e.message)); process.exit(1); });
