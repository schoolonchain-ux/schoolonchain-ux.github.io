'use strict';
// Pruebas de la regla del semáforo (regla.js = assets/justlend-regla.js de la web). Uso: node --test prueba-regla.test.cjs
// Cubren cada una de las seis reglas por orden, las excepciones (salida oficial, USDT) y que el orden importa (gana la primera que se cumple).
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const sb = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'regla.js'), 'utf8'), sb); const R = sb.window.JLR;
const curva = [[100, 0.05, 99.95], [1e4, 0.3, 9970], [1e5, 0.9, 99100], [1e6, 3, 970000], [1e7, 20, 8e6]];   // coste en %, salida en USDT
const base = { token: 'FOO', abierto: true, cajaUSD: 1e8, reclamoUSD: 1e8, reclamoUSDfoto: 1e8, parteTop3: 0.3, venta: { esUSDT: false, sinMercado: false, curva }, poderes: { abiPublicado: true, congelar: false, pausar: false } };
const ctx = { psm: 5e7, edadH: 0.5 };
const v = (m, usd, c = ctx) => R.veredicto({ ...base, ...m }, usd, c).v;

test('regla 6: caja holgada, coste ≤ 1 % y sin poderes → recuperable', () => assert.equal(v({}, 1e5), 'recuperable'));
test('regla 1: lectura vieja o ausente → desconocido, antes que cualquier otra', () => {
  assert.equal(v({}, 1e5, { psm: 5e7, edadH: 3.5 }), 'desconocido');
  assert.equal(v({}, 1e5, { psm: 5e7, edadH: null }), 'desconocido');
  assert.equal(v({ cajaUSD: 10 }, 1e5, { psm: 5e7, edadH: 9 }), 'desconocido');   // aunque la caja sea menor que el importe
});
test('regla 2: caja menor que el importe → comprometido (un hecho, va antes que la duda del motor)', () => {
  assert.equal(v({ cajaUSD: 5e4 }, 1e5), 'comprometido');
  assert.equal(v({ cajaUSD: 5e4, venta: { esUSDT: false, sinMercado: true, curva: [] } }, 1e5), 'comprometido');
});
test('regla 3: sin mercado o fuera de rango, sin salida oficial → desconocido; con salida oficial verificable, sigue', () => {
  assert.equal(v({ venta: { esUSDT: false, sinMercado: true, curva: [] } }, 1e5), 'desconocido');
  assert.equal(v({}, 5e7), 'desconocido');   // el importe supera lo que mide el motor (la curva acaba en 1e7)
  assert.notEqual(v({ token: 'USDD', venta: { esUSDT: false, sinMercado: true, curva: [] } }, 1e5), 'desconocido');   // PSM de USDD: salida oficial con 50 M$
  assert.equal(v({ token: 'USDD', venta: { esUSDT: false, sinMercado: true, curva: [] } }, 6e7, { psm: 5e7, edadH: 0 }), 'desconocido');   // 60 M$ > 50 M$ de la PSM: ya no hay salida oficial con capacidad suficiente y no hay mercado → regla 3
});
test('regla 4: vender cuesta más del 5 % y no hay salida oficial → comprometido', () => assert.equal(v({}, 5e6), 'comprometido'));
test('regla 5: parcial por cada una de sus condiciones', () => {
  assert.equal(v({ cajaUSD: 5e5 }, 1e5), 'parcial');                            // importe > 1/10 de la caja
  assert.equal(v({}, 1e6), 'parcial');                                          // coste del 3 % (entre 1 % y 5 %)
  assert.equal(v({ token: 'sTRX' }, 1e5), 'recuperable');                       // salida lenta pero el coste de venta es ≤ 1 %: no es parcial por eso
  assert.equal(v({ token: 'sTRX' }, 1e6), 'parcial');                           // salida lenta y coste > 1 %
  assert.equal(v({ parteTop3: 0.9 }, 1e5), 'parcial');                          // tres cuentas reclaman ≥ 80 % de la caja
  assert.equal(v({ poderes: { abiPublicado: true, congelar: true } }, 1e5), 'parcial');   // el dueño puede congelar
  assert.equal(v({ poderes: { abiPublicado: false, proxy: true } }, 1e5), 'parcial');     // proxy: poderes desconocidos
  assert.equal(v({ poderes: { abiPublicado: false } }, 1e5), 'parcial');                  // ABI no publicado
  assert.equal(v({ poderes: { nativo: true } }, 1e5), 'recuperable');                     // token nativo: sin emisor
});
test('USDT: no hay que venderlo; los poderes del emisor siguen contando', () => {
  assert.equal(v({ token: 'USDT', venta: { esUSDT: true }, poderes: { abiPublicado: true, congelar: true } }, 1e6), 'parcial');
  assert.equal(v({ token: 'USDT', venta: { esUSDT: true }, poderes: { abiPublicado: true } }, 1e6), 'recuperable');
});
test('salida oficial: ETH/BTC no verificable, TRX sin salida propia, sTRX lenta, USDD con la reserva de la PSM', () => {
  assert.equal(R.oficial({ ...base, token: 'ETH' }, ctx).verificable, false);
  assert.equal(R.oficial({ ...base, token: 'BTC', abierto: false }, ctx).tipo, 'No investigada');   // mercado cerrado: sin canje
  assert.equal(R.oficial({ ...base, token: 'sTRX' }, ctx).lenta, true);
  assert.equal(R.oficial({ ...base, token: 'USDD' }, ctx).capacidadUSD, 5e7);
  assert.equal(R.oficial({ ...base, token: 'USDD' }, { psm: null, edadH: 0 }).verificable, false);   // sin leer la PSM no se afirma nada
});
test('costeA y salidaA interpolan en el logaritmo del tamaño y devuelven null fuera de rango', () => {
  assert.equal(R.costeA(curva, 1e4), 0.3); assert.equal(R.costeA(curva, 5e7), null); assert.equal(R.costeA(curva, 0), null); assert.equal(R.costeA([], 100), null);
  const c = R.costeA(curva, 1e5 * Math.sqrt(10)); assert.ok(c > 0.9 && c < 3);
  assert.ok(Math.abs(R.salidaA(curva, 50) - 49.975) < 1e-9);   // por debajo del primer punto: proporcional
});
