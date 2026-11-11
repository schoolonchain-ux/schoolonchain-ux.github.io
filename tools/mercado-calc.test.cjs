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
test('cambio a n días de una serie diaria (dinero depositado, stablecoins)', () => {
  cerca(M.cambio([100, 110, 121], 1), 0.1); cerca(M.cambio([100, 110, 121], 2), 0.21); cerca(M.cambio([200, null, 100, null], 2), -0.5); // el último con dato es 100
  assert.equal(M.cambio([100, null, 110], 1), null); // falta justo el día con el que se compara: no se toma el vecino
  assert.equal(M.cambio([100, 110], 5), null); assert.equal(M.cambio([], 1), null); assert.equal(M.cambio([0, 10], 1), null); assert.equal(M.cambio([null, null], 1), null);
  assert.deepEqual(M.atras([5, 6, 7, null], 2), { hoy: 7, antes: 5, i: 2 }); assert.equal(M.atras([5, 6, 7], 3), null);
});
test('mediana', () => {
  cerca(M.mediana([3, 1, 2]), 2); cerca(M.mediana([4, 1, 3, 2]), 2.5); cerca(M.mediana([7]), 7); cerca(M.mediana([null, 5, undefined, 1, NaN]), 3); cerca(M.mediana([-0.1, -0.3, 0.2]), -0.1);
  assert.equal(M.mediana([]), null); assert.equal(M.mediana([null, NaN]), null); assert.equal(M.mediana(null), null);
  const a = [3, 1, 2]; M.mediana(a); assert.deepEqual(a, [3, 1, 2]); // no desordena lo que recibe
});
test('rendimiento de un grupo (sector): mediana, cuántos suben y mínimo de activos', () => {
  assert.deepEqual(M.grupo([0.1, -0.2, 0.3]), { n: 3, suben: 2, mediana: 0.1 }); assert.deepEqual(M.grupo([0.1, null, -0.2, 0.3, -0.4]), { n: 4, suben: 2, mediana: -0.05 });
  assert.equal(M.grupo([0.1, -0.2]), null); assert.equal(M.grupo([0.1, null, null]), null); assert.equal(M.grupo([]), null); assert.equal(M.grupo(null), null); // con menos de tres no hay cifra
  assert.deepEqual(M.grupo([0.5, 0.1], 2), { n: 2, suben: 2, mediana: 0.3 }); assert.deepEqual(M.grupo([0, -0.1, -0.2]), { n: 3, suben: 1, mediana: -0.1 }); // quedarse igual cuenta como no bajar
});
test('camino de un grupo: mediana día a día desde el primer día del periodo', () => {
  const a = [100, 110, 121], b = [100, 90, 81], c = [100, 120, 150]; const y = M.caminoGrupo([a, b, c], 2);
  assert.equal(y.length, 3); cerca(y[0], 0); cerca(y[1], 0.1); cerca(y[2], 0.21);
  cerca(y[2], M.grupo([a, b, c].map((q) => M.rend(q, 2))).mediana); // el final es la cifra del sector
  const hueco = M.caminoGrupo([a, [100, null, 81], c], 2); cerca(hueco[0], 0); assert.equal(hueco[1], null); cerca(hueco[2], 0.21); // el día en que solo dos tienen dato no hay cifra
  assert.deepEqual(M.caminoGrupo([a, b], 2), [null, null, null]); assert.deepEqual(M.caminoGrupo([a, b, [null, 5, 6]], 2), [null, null, null]); // menos de tres con dato al empezar el periodo
  assert.deepEqual(M.caminoGrupo([], 1), [null, null]); assert.deepEqual(M.caminoGrupo(null, 1), [null, null]);
  const largo = [1, 1, 100, 110, 121, null]; cerca(M.caminoGrupo([largo, b, c], 2)[2], 0.21); // cada serie cuenta desde su propio último dato
});
test('máximo de n días: valor, hace cuánto y caída; con empate, el más reciente', () => {
  assert.deepEqual(M.maximo([100, 120, 90], 3), { i: 1, valor: 120, hace: 1, caida: 90 / 120 - 1 }); assert.deepEqual(M.maximo([100, 120, 90], 1), { i: 2, valor: 90, hace: 0, caida: 0 });
  assert.equal(M.maximo([5, 5, 4], 3).i, 1); assert.equal(M.maximo([200, 100, 120, 90], 3).valor, 120); assert.equal(M.maximo([], 5), null); assert.equal(M.maximo([null, null], 5), null);
  const m = M.maximo([80, null, 100, null, 50, null], 10); assert.equal(m.i, 2); assert.equal(m.hace, 2); cerca(m.caida, -0.5); // el último dato es el 50; los huecos no cuentan
  cerca(M.maximo([100, 120, 90, 60], 4).caida, M.caidaDesdeMaximo([100, 120, 90, 60], 4)); // coincide con la función que ya había
});
test('esperado frente a ocurrido: empareja lo esperado hace h días con lo ocurrido hasta hoy', () => {
  const esp = [50, 40, 30, null, 20, 99], real = [null, null, 45, 35, 25, null, 10];
  const r = M.esperadaFrenteAReal(esp, real, 2, 3); assert.equal(r.n, 3); assert.equal(r.mas, 3); cerca(r.medianaDif, 5); assert.deepEqual(r.ultimo, { i: 4, esperada: 30, ocurrida: 25 });
  assert.equal(M.esperadaFrenteAReal(esp, real, 2), null); // por defecto hacen falta 60 pares
  const q = M.esperadaFrenteAReal([10, 20, 30, 40], [0, 15, 15, 35], 1, 1); assert.equal(q.n, 3); assert.equal(q.mas, 1); cerca(q.medianaDif, -5); // 10−15, 20−15, 30−35
  assert.equal(M.esperadaFrenteAReal([], [], 30, 1), null); assert.equal(M.esperadaFrenteAReal(null, null, 30, 1), null);
});
test('matriz de correlación: simétrica, coincide con la correlación de cada pareja y admite la ventana anterior', () => {
  const r = [0.01, -0.02, 0.03, 0.005, -0.01, 0.02, -0.015, 0.012]; const a = deRetornos(r), b = deRetornos(r.map((x) => 2 * x)), c = deRetornos(r.map((x) => -x)), d = deRetornos([0.02, 0.01, -0.03, 0.004, 0.02, -0.01, 0.005, -0.02]);
  const m = M.matrizCorr([a, b, c, d], 6); cerca(m[0][0], 1, 1e-12); cerca(m[0][1], 1, 1e-12); cerca(m[0][2], -1, 1e-12); cerca(m[1][2], -1, 1e-12);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { assert.equal(m[i][j], m[j][i]); if (i !== j) cerca(m[i][j], M.corr([a, b, c, d][i], [a, b, c, d][j], 6), 1e-12); }
  const p = M.matrizCorr([a, d], 4, 3); cerca(p[0][1], M.corr(a, d, 4, 3), 1e-12);
  assert.equal(M.matrizCorr([a, d], 9)[0][1], null); assert.deepEqual(M.matrizCorr([], 5), []); assert.equal(M.matrizCorr([a, deRetornos(Array(8).fill(0))], 6)[0][1], null);
});
test('correlación de una pareja a lo largo del tiempo: cada día coincide con la correlación de la ventana que acaba ese día', () => {
  const a = deRetornos([0.01, -0.02, 0.03, 0.005, -0.01, 0.02, -0.015, 0.012, 0.004, -0.007]), b = deRetornos([0.02, 0.01, -0.03, 0.004, 0.02, -0.01, 0.005, -0.02, 0.011, 0.003]);
  const s = M.serieCorr(a, b, 4); assert.equal(s.length, a.length); for (let i = 0; i < 4; i++) assert.equal(s[i], null);
  const u = a.length - 1; cerca(s[u], M.corr(a, b, 4), 1e-12); for (let k = 1; k <= 5; k++) cerca(s[u - k], M.corr(a, b, 4, k), 1e-12);
  const h = a.slice(); h[5] = null; const sh = M.serieCorr(h, b, 4); cerca(sh[u], M.corr(h, b, 4), 1e-12); // con un hueco se usan los cuatro últimos días comunes
  assert.deepEqual(M.serieCorr([], [], 4), []);
});

test('parejas que se nombran en la matriz: la más alta, la más cercana a cero y la más baja solo si es negativa', () => {
  // el caso que vio el propietario el 11-nov: −0,63 no es «la que menos relación tiene»; esa es −0,18
  assert.deepEqual(M.destacadas([0.94, -0.2, -0.18, -0.63, 0.57]), { alto: 0, cero: 2, reves: 3 });
  assert.deepEqual(M.destacadas([0.9, 0.5, 0.1]), { alto: 0, cero: 2, reves: null }); // nada por debajo de cero: no hay pareja «al revés»
  assert.deepEqual(M.destacadas([0.9, 0.5, -0.05]), { alto: 0, cero: 2, reves: 2 }); // la única negativa es también la más cercana a cero
  assert.deepEqual(M.destacadas([-0.3, -0.7]), { alto: 0, cero: 0, reves: 1 });
  assert.deepEqual(M.destacadas([null, 0.4, undefined, NaN]), { alto: 1, cero: 1, reves: null });
  assert.deepEqual(M.destacadas([0.2, -0.2]), { alto: 0, cero: 0, reves: 1 }); // empate en distancia a cero: la primera
  assert.equal(M.destacadas([]), null); assert.equal(M.destacadas([null]), null); assert.equal(M.destacadas(null), null);
});
