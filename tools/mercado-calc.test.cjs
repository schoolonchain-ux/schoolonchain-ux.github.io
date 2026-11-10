'use strict';
// Pruebas de los cálculos del Observatorio de mercado (assets/mercado-calc.js): casos de resultado conocido y casos imposibles.
// Uso: node --test tools/mercado-calc.test.cjs
const test = require('node:test'); const assert = require('node:assert/strict');
const M = require('../assets/mercado-calc.js');
const cerca = (a, b, tol = 1e-9) => assert.ok(a != null && Math.abs(a - b) <= tol, a + ' no es ' + b);
const deRetornos = (r, p0 = 100) => { const c = [p0]; for (const x of r) c.push(c[c.length - 1] * Math.exp(x)); return c; };

test('rendimiento a n días', () => {
  cerca(M.rend([100, 110], 1), 0.1); cerca(M.rend([50, 100, 200, 100], 3), 1); cerca(M.rend([100, 90, null], 1), -0.1); // el último con dato es 90
  assert.equal(M.rend([100], 1), null); assert.equal(M.rend([], 1), null); assert.equal(M.rend([null, 100], 1), null); assert.equal(M.rend([0, 100], 1), null);
});
test('volatilidad realizada: valor conocido', () => {
  const r = [0.01, -0.01, 0.01, -0.01]; const c = deRetornos(r);
  cerca(M.vol(c, 4), Math.sqrt((4 * 0.0001) / 3) * Math.sqrt(365) * 100, 1e-9); // desviación muestral de ±0,01 = 0,011547…
  cerca(M.vol(deRetornos([0.02, 0.02, 0.02, 0.02]), 4), 0, 1e-9); // crecer siempre lo mismo no es volatilidad
});
test('volatilidad: sin datos suficientes o con un hueco dentro de la ventana, no hay cifra', () => {
  assert.equal(M.vol([100, 101, 102], 4), null); assert.equal(M.vol([], 30), null); assert.equal(M.vol([100], 1), null);
  const c = deRetornos([0.01, -0.01, 0.01, -0.01, 0.02]); c[3] = null; assert.equal(M.vol(c, 4), null);
});
test('percentil y estado de volatilidad', () => {
  const s = Array.from({ length: 100 }, (_, i) => i + 1); cerca(M.percentil(s), 100); cerca(M.percentil(s.slice().reverse()), 1);
  cerca(M.percentil([...Array(99).fill(5), 5]), 100); assert.equal(M.percentil([1, 2, 3]), null); assert.equal(M.percentil([]), null);
  assert.equal(M.estadoVol(10), 'calma'); assert.equal(M.estadoVol(25), 'normal'); assert.equal(M.estadoVol(74.9), 'normal'); assert.equal(M.estadoVol(75), 'agitado'); assert.equal(M.estadoVol(95), 'extremo'); assert.equal(M.estadoVol(null), null);
});
test('correlación: iguales, opuestos, independientes de escala y casos imposibles', () => {
  const r = [0.01, -0.02, 0.03, 0.005, -0.01, 0.02, -0.03, 0.015]; const a = deRetornos(r), b = deRetornos(r.map((x) => 2 * x)), inv = deRetornos(r.map((x) => -x));
  cerca(M.corr(a, a, 8), 1, 1e-12); cerca(M.corr(a, b, 8), 1, 1e-12); cerca(M.corr(a, inv, 8), -1, 1e-12);
  assert.equal(M.corr(a, b, 9), null); // no hay 9 rendimientos
  assert.equal(M.corr(a, deRetornos(Array(8).fill(0.01)), 8), null); // una serie sin variación no tiene correlación
  assert.equal(M.corr([], [], 5), null);
  const x = deRetornos([1, 2, 3, 4, 5].map((v) => v / 100)), y = deRetornos([2, 1, 4, 3, 5].map((v) => v / 100)); cerca(M.corr(x, y, 5), 0.8, 1e-12); // Pearson de (1,2,3,4,5) y (2,1,4,3,5) = 0,8
});
test('correlación: solo cuentan los días en que los dos tienen dato; la ventana anterior se desplaza', () => {
  const r = [0.01, -0.02, 0.03, 0.005, -0.01, 0.02]; const a = deRetornos(r), b = deRetornos(r); b[2] = null; // b pierde dos rendimientos (los que tocan el hueco)
  assert.equal(M.corr(a, b, 6), null); cerca(M.corr(a, b, 4), 1, 1e-12);
  const largo = deRetornos([0.01, -0.02, 0.03, 0.005, -0.01, 0.02, -0.03, 0.015]); cerca(M.corr(largo, largo, 4, 4), 1, 1e-12); assert.equal(M.corr(largo, largo, 4, 5), null);
});
test('sensibilidad (beta)', () => {
  const r = [0.01, -0.02, 0.03, 0.005, -0.01, 0.02]; const ref = deRetornos(r);
  cerca(M.beta(deRetornos(r.map((x) => 2 * x)), ref, 6), 2, 1e-12); cerca(M.beta(deRetornos(r.map((x) => -0.5 * x)), ref, 6), -0.5, 1e-12); assert.equal(M.beta(ref, deRetornos(Array(6).fill(0)), 6), null);
});
test('caída desde el máximo', () => { cerca(M.caidaDesdeMaximo([100, 120, 90], 3), -0.25); cerca(M.caidaDesdeMaximo([100, 120, 90], 1), 0); cerca(M.caidaDesdeMaximo([200, 100, 120, 90], 3), -0.25); assert.equal(M.caidaDesdeMaximo([], 5), null); });
test('profundidad del libro de órdenes', () => {
  const p = M.profundidad([['99', '1'], ['98', '2'], ['90', '5']], [['101', '1'], ['102', '1'], ['120', '3']], 0.02);
  cerca(p.medio, 100); cerca(p.compras, 99 + 196); cerca(p.ventas, 101 + 102); cerca(p.desequilibrio, (295 - 203) / 498); cerca(p.diferencialPct, 2); assert.equal(p.completo, true);
  assert.equal(M.profundidad([['99', '1']], [['101', '1']], 0.02).completo, false); // el libro leído no llega al ±2 %: se avisa
  assert.equal(M.profundidad([], [], 0.02), null); assert.equal(M.profundidad([['101', '1']], [['99', '1']], 0.02), null); // libro cruzado: no se usa
});
