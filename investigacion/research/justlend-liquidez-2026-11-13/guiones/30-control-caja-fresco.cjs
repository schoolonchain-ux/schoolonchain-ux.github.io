'use strict';
// CONTROL DE CAJA, REPETIDO DE VERDAD (corrige el paso 06, cuyas «cuatro repeticiones» salían de la caché del lector: objeción R1-04 de la revisión de Codex).
// Para cada mercado se leen, SIN CACHÉ y en el mismo instante, la caja que declara el contrato (getCash) y el saldo real del token en el contrato (balanceOf / saldo de TRX), 3 veces,
// con el número de bloque de cada vuelta. Cada respuesta guarda su texto original si hace falta para poder comprobar su huella.
const L = require('./lib.cjs'); L.usar('30-2026-11-13'); const A = require('./abi.cjs'); const path = require('node:path'); const crypto = require('node:crypto');
const SC = { sinCache: true };
(async () => {
  const m = require('./resultados/01-mercados.json').mercados; const vueltas = []; const detalle = [];
  for (let v = 0; v < 3; v++) {
    const nb = await L.post('https://api.trongrid.io/wallet/getnowblock', {}, SC); const bloque = nb.block_header.raw_data.number, t = new Date(nb.block_header.raw_data.timestamp).toISOString();
    let iguales = 0, distintos = []; const t0 = Date.now();
    for (const x of m) {
      const trx = x.simbolo === 'jTRX';
      const c = await A.llamar(x.jToken, 'getCash()', [], SC); const caja = c.ok ? A.u(c.hex) : null;
      let saldo = null; if (trx) { const a = await L.get('https://api.trongrid.io/v1/accounts/' + x.jToken, SC); saldo = a.data && a.data[0] ? BigInt(a.data[0].balance) : null; } else { const b = await A.llamar(x.subyacente, 'balanceOf(address)', [A.argAddr(x.jToken)], SC); saldo = b.ok ? A.u(b.hex) : null; }
      const igual = caja !== null && saldo !== null && caja === saldo; if (igual) iguales++; else distintos.push({ mercado: x.simbolo, jToken: x.jToken, caja: String(caja), saldo: String(saldo), dif: caja !== null && saldo !== null ? String(saldo - caja) : null });
      detalle.push({ vuelta: v + 1, jToken: x.jToken, simbolo: x.simbolo, caja: String(caja), saldoReal: String(saldo), igual });
    }
    const t1 = new Date().toISOString(); vueltas.push({ vuelta: v + 1, bloqueAlEmpezar: bloque, horaBloque: t, termino: t1, segundos: Math.round((Date.now() - t0) / 1000), mercados: m.length, coinciden: iguales, distintos }); console.log('vuelta', v + 1, 'bloque', bloque, 't', t, '| coinciden', iguales, 'de', m.length, '| duración', Math.round((Date.now() - t0) / 1000), 's', distintos.length ? JSON.stringify(distintos.map(d => d.mercado + ' dif ' + d.dif)) : '');
    if (v < 2) await L.sleep(15000);
  }
  console.log('guardado sha256', L.guardar(path.join(__dirname, 'resultados', '30-control-caja-fresco.json'), { generado: new Date().toISOString(), nota: 'Lecturas nuevas sin caché; getCash y saldo real se leen uno detrás de otro (≈ 0,7 s entre ambos) por cada mercado; un mercado con mucha actividad puede cambiar en ese lapso: por eso se repite 3 veces y se muestra cada diferencia.', vueltas, detalle }));
  console.log('métricas', JSON.stringify(L.metricas));
})().catch(e => { console.error('ERROR', e.stack || e.message); process.exit(1); });
