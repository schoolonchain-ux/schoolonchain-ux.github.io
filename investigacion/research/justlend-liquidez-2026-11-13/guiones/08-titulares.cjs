'use strict';
// FASE 4 · Quién tiene depositado el dinero en cada mercado de JustLend (concentración).
// Fuente de la lista: TronScan (mayores titulares del jToken). Cada saldo se RE-LEE de la cadena (balanceOf del jToken) y se convierte a reclamo en moneda con el tipo de cambio.
const L = require('./lib.cjs'); L.usar('08-2026-11-13'); const A = require('./abi.cjs'); const path = require('node:path');
const TS = 'https://apilist.tronscanapi.com/api';
const TOP = 50;
(async () => {
  const m = require('./resultados/01-mercados.json'), d = require('./resultados/04-liquidez-por-mercado.json');
  const salida = [];
  for (const x of m.mercados) {
    const f = d.mercados.find(y => y.jToken === x.jToken); const pag = await L.get(TS + '/token_trc20/holders?contract_address=' + x.jToken + '&start=0&limit=' + TOP);
    const lista = (pag.trc20_tokens || []).map(h => h.holder_address); const tot = pag.total;
    const filas = []; const er = BigInt(x.tipoCambioRaw); const dv = 10 ** f.decimales;
    for (const h of lista) {
      const b = await A.llamar(x.jToken, 'balanceOf(address)', [A.argAddr(h)]); const bal = b.ok ? A.u(b.hex) : null; if (bal === null) continue;
      const reclamoRaw = bal * er / (10n ** 18n); const reclamo = Number(reclamoRaw) / dv;
      filas.push({ titular: h, jTokenRaw: String(bal), reclamo, reclamoUSD: reclamo * f.precioUSD, parte: f.reclamoDepositantes ? reclamo / f.reclamoDepositantes : null, etiquetaTronScan: (pag.trc20_tokens.find(t => t.holder_address === h) || {}).addressTag || null });
    }
    filas.sort((a, b) => b.reclamo - a.reclamo);
    const cum = k => filas.slice(0, k).reduce((s, r) => s + (r.parte || 0), 0);
    salida.push({ jToken: x.jToken, simbolo: x.simbolo, subyacente: f.simboloSubyacente, titularesTotalesTronScan: tot, leidos: filas.length, parteTop1: cum(1), parteTop3: cum(3), parteTop10: cum(10), parteTop50: cum(50), titulares: filas });
    console.log(x.simbolo.padEnd(9), 'titulares', String(tot).padStart(7), '| top1', (cum(1) * 100).toFixed(1).padStart(5) + '%', 'top3', (cum(3) * 100).toFixed(1).padStart(5) + '%', 'top10', (cum(10) * 100).toFixed(1).padStart(5) + '%', '| top1 =', filas[0] ? filas[0].titular + ' ' + (filas[0].reclamoUSD / 1e6).toFixed(3) + ' M$' : '-');
  }
  console.log('guardado sha256', L.guardar(path.join(__dirname, 'resultados', '08-titulares.json'), { leido: new Date().toISOString(), fuente: 'TronScan token_trc20/holders + balanceOf en cadena', mercados: salida }));
})().catch(e => { console.error('ERROR', e.message); process.exit(1); });
