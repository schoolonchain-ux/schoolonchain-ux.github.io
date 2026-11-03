'use strict';
const test = require('node:test'); const assert = require('node:assert/strict');
const { Libro, conciliar, idDe, valorUsd } = require('../src/libro-mayor/modelo.cjs');
const base = { cadena: 'tron', tx: 'aa'.repeat(32), activo: 'TRX', importe: 100, de: 'A', a: 'B', t: 1, tipo: 'transferencia' };

test('cada movimiento tiene id único y determinista; lo incompleto se rechaza', () => {
  const L = new Libro(); const m = L.mov(base); assert.match(m.id, /^m-[0-9a-f]{20}$/); assert.equal(m.id, idDe(base));
  assert.throws(() => L.mov({ ...base, tx: '' }), /sin tx/); assert.throws(() => L.mov({ ...base, importe: -1 }), /importe/); assert.throws(() => L.mov({ ...base, tipo: 'x', tx: 'bb' }), /tipo/);
});
test('el mismo movimiento no se suma dos veces', () => {
  const L = new Libro(); L.mov(base); L.mov(base); assert.equal(L.movs.length, 1); assert.equal(L.avisos[0].tipo, 'duplicado');
  L.mov({ ...base, indice: 1 }); assert.equal(L.movs.length, 2); assert.equal(L.duplicadosExactos().length, 1);   // mismo hash/importe con otro índice: se avisa como posible duplicado
});
test('valor en dólares: TRX a precio fijo declarado, token sin precio = DESCONOCIDO (no 0)', () => {
  const L = new Libro(); const a = L.mov(base); assert.ok(Math.abs(a.usd - 35.2) < 1e-9); assert.equal(a.usdEstado, 'ESTIMADO'); assert.equal(valorUsd('XYZ', 5), null);
  const b = L.mov({ ...base, tx: 'cc', activo: 'XYZ' }); assert.equal(b.usd, null); assert.equal(b.usdEstado, 'DESCONOCIDO'); assert.equal(L.balanceMovimientos().movimientosSinPrecio, 1);
});
test('un swap registra entrada y salida enlazadas', () => {
  const L = new Libro(); const g = L.swap({ cadena: 'tron', tx: 'dd', de: 'A', entrada: { activo: 'TRX', importe: 1000 }, salida: { activo: 'USDT', importe: 350, a: 'A' }, t: 5 });
  assert.equal(L.movs.length, 2); assert.equal(L.porId.get(g.entrada).tipo, 'swap_entrada'); assert.equal(L.porId.get(g.salida).activo, 'USDT'); assert.equal(L.porId.get(g.entrada).grupo, L.porId.get(g.salida).grupo);
});
test('puente: concilia enviado, recibido y comisión; sin recibo queda PENDIENTE; con diferencia sin explicar queda DESCONOCIDO', () => {
  const L = new Libro(); const env = L.mov({ ...base, tx: 'e1', tipo: 'puente_envio', activo: 'USDT', importe: 1000 }); const rec = L.mov({ ...base, cadena: 'eth', tx: 'r1', tipo: 'puente_recibo', activo: 'USDT', importe: 998 });
  assert.equal(L.puente({ id: 'p1', enviado: env, recibido: rec, comision: 2 }).estado, 'VERIFICADO'); assert.equal(L.puente({ id: 'p2', enviado: env, recibido: rec, comision: 0 }).estado, 'DESCONOCIDO'); const p3 = L.puente({ id: 'p3', enviado: env, recibido: null }); assert.equal(p3.estado, 'PENDIENTE'); assert.equal(p3.diferencia, null);
});
test('la conciliación NO fuerza la igualdad: muestra la diferencia real', () => {
  const c = conciliar({ nombre: 'Capital inicial', importe: 1000 }, [{ nombre: 'localizado', importe: 400 }, { nombre: 'servicios', importe: 500 }, { nombre: 'sin localizar', importe: null }]);
  assert.equal(c.sumaPartidas, 900); assert.equal(c.diferencia, 100); assert.equal(c.cuadra, false); assert.deepEqual(c.partidasSinImporte, ['sin localizar']);
  assert.equal(conciliar({ importe: 10 }, [{ nombre: 'a', importe: 10 }]).cuadra, true);
});
test('desde cualquier total se llega a los movimientos que lo componen', () => {
  const L = new Libro(); L.mov(base); L.mov({ ...base, tx: 'zz', importe: 5, a: 'C' }); const comp = L.componentes(m => m.a === 'C'); assert.equal(comp.length, 1); assert.equal(comp[0].tx, 'zz');
});
