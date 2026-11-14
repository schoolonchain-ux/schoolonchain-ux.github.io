'use strict';
// FASE 3b · CONTROL INDEPENDIENTE de la «caja»: ¿el saldo real del token en el contrato de JustLend coincide con lo que dice getCash()?
// Y ¿qué parte de TODO el token emitido está metida en JustLend? (un mercado que guarda el 40 % de un token deja a ese token sin otra salida).
const L = require('./lib.cjs'); L.usar('05-2026-11-13'); const A = require('./abi.cjs'); const path = require('node:path');
(async () => {
  const m = require('./resultados/01-mercados.json'), d = require('./resultados/04-liquidez-por-mercado.json');
  const filas = [];
  for (const x of m.mercados) {
    const f = d.mercados.find(y => y.jToken === x.jToken); const trx = x.simbolo === 'jTRX';
    let saldoReal = null, oferta = null;
    if (trx) { const a = await L.get('https://api.trongrid.io/v1/accounts/' + x.jToken); saldoReal = a.data && a.data[0] ? BigInt(a.data[0].balance) : null; }
    else { const r = await A.llamar(x.subyacente, 'balanceOf(address)', [A.argAddr(x.jToken)]); saldoReal = r.ok ? A.u(r.hex) : null; const s = await A.llamar(x.subyacente, 'totalSupply()'); oferta = s.ok ? A.u(s.hex) : null; }
    const dv = 10 ** f.decimales; const caja = BigInt(x.cajaRaw);
    filas.push({ jToken: x.jToken, simbolo: x.simbolo, subyacente: x.subyacente, cajaGetCash: x.cajaRaw, saldoRealDelToken: saldoReal === null ? null : String(saldoReal), coincide: saldoReal === null ? null : saldoReal === caja, difRaw: saldoReal === null ? null : String(saldoReal - caja), ofertaTotal: oferta === null ? null : String(oferta), ofertaTotalHumana: oferta === null ? null : Number(oferta) / dv, enJustLend: Number(caja) / dv, partedeLaOfertaEnJustLend: oferta ? Number(caja) / Number(oferta) : null });
    process.stdout.write('.');
  }
  console.log();
  console.log('guardado sha256', L.guardar(path.join(__dirname, 'resultados', '05-caja-real-y-oferta.json'), { leido: new Date().toISOString(), mercados: filas }));
  for (const r of filas) console.log(r.simbolo.padEnd(9), 'coincide caja=saldo real:', String(r.coincide).padEnd(6), 'dif', r.difRaw, '| oferta total', r.ofertaTotalHumana === null ? '(TRX nativo)' : r.ofertaTotalHumana.toLocaleString('en', { maximumFractionDigits: 0 }), '| en JustLend', r.enJustLend.toLocaleString('en', { maximumFractionDigits: 0 }), '| % de la oferta', r.partedeLaOfertaEnJustLend === null ? '-' : (r.partedeLaOfertaEnJustLend * 100).toFixed(1) + '%');
})().catch(e => { console.error('ERROR', e.message); process.exit(1); });
