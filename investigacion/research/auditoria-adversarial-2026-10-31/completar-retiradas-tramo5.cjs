'use strict';
// TRAMO 5 · hueco «retiradas»: una billetera deposita TRX/USDT en un contrato (p. ej. JustLend vía TrxProviderProxy) y más tarde llama a «retirar» SIN enviar valor; el contrato paga al «receptor» que indica la llamada. Esa llamada no aparece como envío de la billetera, así que el rastreador no la veía.
// Este programa lee las llamadas a esos contratos de cada billetera depositante, decodifica quién cobra y las anota como saltos «retirada» en tramo5-cache.json (hace copia antes).
const fs = require('fs'); const crypto = require('crypto');
const { loadTronKeys } = require('C:/EquipoIA/tether-blacklist/src/adapters/bot.cjs');
const keys = loadTronKeys({ file: 'C:/EquipoIA/tether-blacklist/config.secret.json' });
const OUT = 'C:/EquipoIA/research/auditoria-adversarial-2026-10-31/tramo5/'; const PX = 0.352, USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', SEG = 3520;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const CONTRATOS = (process.argv[2] || 'TMDENHFSiRzmJNSEBAFmrDbLkQ672iPN8H,TEcDijvKSXcfWT7S6rd44H5vNgufm7Y4XC').split(',');
const AL = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const aHex = a => { let n = 0n; for (const ch of a) n = n * 58n + BigInt(AL.indexOf(ch)); let h = n.toString(16); h = h.padStart(50, '0'); return h.slice(0, 42); };
const aB58 = hex => { const b = Buffer.from(hex, 'hex'); const c = crypto.createHash('sha256').update(crypto.createHash('sha256').update(b).digest()).digest().subarray(0, 4); let n = BigInt('0x' + Buffer.concat([b, c]).toString('hex')); let s = ''; while (n > 0n) { s = AL[Number(n % 58n)] + s; n /= 58n; } return s; };
for (const c of CONTRATOS) if (aB58(aHex(c)) !== c) { console.error('conversión de dirección incorrecta para', c); process.exit(1); }
const HEX = new Map(CONTRATOS.map(c => [aHex(c), c]));
async function getj(url, h, reint = 6) { for (let i = 0; i < reint; i++) { try { const r = await fetch(url, { headers: Object.assign({ accept: 'application/json' }, h), signal: AbortSignal.timeout(25000) }); if (r.status === 429) { await sleep(3000 * (i + 1)); continue; } if (!r.ok) { await sleep(1500 * (i + 1)); continue; } return await r.json(); } catch { await sleep(1500 * (i + 1)); } } return null; }
const HG = { 'TRON-PRO-API-KEY': keys.tronGridKey }, HS = { 'TRON-PRO-API-KEY': keys.tronscanKey };
(async () => {
  const cachePath = OUT + 'tramo5-cache.json';
  const resp = OUT + 'tramo5-cache.antes-de-retiradas.json'; if (!fs.existsSync(resp)) fs.copyFileSync(cachePath, resp);
  const { rec, term, t } = JSON.parse(fs.readFileSync(cachePath, 'utf8')); const clases = JSON.parse(fs.readFileSync(OUT + 'traza-clases.json', 'utf8'));
  const TS = JSON.parse(fs.readFileSync(OUT + 't4.json', 'utf8')).t3;
  const ws = Object.keys(rec).filter(w => rec[w].ok && (rec[w].sal || []).some(e => CONTRATOS.includes(e.a) && e.v >= SEG));
  console.log('billeteras que depositaron en', CONTRATOS.map(c => c.slice(0, 8)).join(', '), ':', ws.length);
  const swaps = (() => { try { return JSON.parse(fs.readFileSync(OUT + 'tramo5-swaps.json', 'utf8')); } catch { return {}; } })();
  const informe = []; let total = 0, nTx = 0;
  for (const w of ws) {
    const desde = Math.min(...rec[w].sal.filter(e => CONTRATOS.includes(e.a)).map(e => e.at)) - 120000;
    let url = `https://api.trongrid.io/v1/accounts/${w}/transactions?only_confirmed=true&limit=200&order_by=block_timestamp,asc&min_timestamp=${desde}&max_timestamp=${TS}`;
    const txs = []; let pag = 0, completo = true;
    while (url) { const j = await getj(url, HG); if (!j) { completo = false; break; } for (const x of j.data || []) { const c = x.raw_data && x.raw_data.contract && x.raw_data.contract[0]; if (c && c.type === 'TriggerSmartContract' && HEX.has((c.parameter.value.contract_address || '').toLowerCase()) && x.ret && x.ret[0] && x.ret[0].contractRet === 'SUCCESS') txs.push({ tx: x.txID, at: x.block_timestamp, valor: c.parameter.value.call_value || 0, contrato: HEX.get(c.parameter.value.contract_address.toLowerCase()) }); }
      url = j.meta && j.meta.links && j.meta.links.next; pag++; await sleep(350); if (pag > 200) { completo = false; break; } }
    const yaTx = new Set((rec[w].sal || []).map(e => e.tx)); const nuevas = txs.filter(x => !yaTx.has(x.tx)); let sumaW = 0;
    rec[w].via = rec[w].via || []; rec[w].viaHechas = rec[w].viaHechas || [];
    for (const x of nuevas) {
      if (rec[w].via.some(v => v.tx === x.tx) || rec[w].viaHechas.includes(x.tx)) continue;
      let outs = swaps['R:' + x.tx];
      if (!outs) { let j = null; for (let i = 0; i < 5 && !j; i++) { await sleep(300); j = await getj('https://apilist.tronscanapi.com/api/transaction-info?hash=' + x.tx, HS, 2); if (!j || !(j.transfersAllList || j.trc20TransferInfo)) { j = null; await sleep(1000 * (i + 1)); } }
        if (!j) { informe.push({ w, tx: x.tx, error: 'no se pudo decodificar' }); continue; }
        outs = []; for (const tr of (j.transfersAllList || [])) { if (tr.from_address !== x.contrato || !tr.to_address) continue; const dec = Number.isInteger(tr.decimals) ? tr.decimals : 6, amt = Number(tr.amount_str) / Math.pow(10, dec); let v, sim; if (tr.symbol === 'USDT' && tr.contract_address === USDT) { v = amt; sim = 'USDT'; } else if (tr.symbol === 'TRX') { v = amt * PX; sim = 'TRX'; } else continue; outs.push({ a: tr.to_address, v, sim, cant: amt }); }
        swaps['R:' + x.tx] = outs; }
      rec[w].viaHechas.push(x.tx); nTx++;
      for (const o of outs) { if (o.a === w || o.v < SEG) continue; if (clases[o.a] && clases[o.a].tipo === 'swap') continue; rec[w].via.push({ a: o.a, v: o.v, at: x.at, tx: x.tx, sim: o.sim, cant: o.cant, via: 'retirada' }); sumaW += o.v; total += o.v; }
    }
    informe.push({ w, llamadas: txs.length, nuevas: nuevas.length, retirado: Math.round(sumaW), completo });
    console.log(w.slice(0, 10), 'llamadas', txs.length, 'sin envío', nuevas.length, '→ retirado a otras billeteras', Math.round(sumaW).toLocaleString('en'), '$', completo ? '' : '(LECTURA INCOMPLETA)');
    fs.writeFileSync(OUT + 'tramo5-swaps.json', JSON.stringify(swaps)); fs.writeFileSync(cachePath, JSON.stringify({ rec, term, t: new Date().toISOString() }));
  }
  fs.writeFileSync(OUT + 'retiradas-informe.json', JSON.stringify({ contratos: CONTRATOS, informe, total }, null, 1));
  console.log('TOTAL retirado a otras billeteras', Math.round(total).toLocaleString('en'), '$ en', nTx, 'llamadas');
})().catch(e => { console.error('ERROR', e.message, e.stack); process.exit(1); });
