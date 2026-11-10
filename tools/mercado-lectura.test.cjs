'use strict';
// Pruebas de la lectura del día del Observatorio (assets/mercado-lectura.js): cada regla en su frontera, casos imposibles y la lectura real de data/mercado.json.
// Uso: node --test tools/mercado-lectura.test.cjs
const test = require('node:test'); const assert = require('node:assert/strict'); const fs = require('node:fs'); const path = require('node:path');
const L = require('../assets/mercado-lectura.js'); const M = require('../assets/mercado-calc.js');
const dias = (n) => Array.from({ length: n }, (_, i) => new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10));
const plana = (n, ultimo) => { const c = new Array(n).fill(100); c[n - 1] = 100 * (1 + ultimo); return c; };
// cesta de prueba: «sube» activos cierran +1 % y el resto −1 %
const cesta = (total, sube, n = 40) => ({ leidoEn: '2026-03-01T07:00:00Z', dias: dias(n), activos: Array.from({ length: total }, (_, i) => ({ s: i === 0 ? 'BTC' : i === 1 ? 'ETH' : 'A' + i, n: 'Activo ' + i, c: plana(n, i < sube ? 0.01 : -0.01) })) });
const punto = (H, k) => L.frases(H).find((p) => p.k === k);
const sinBasura = (t) => assert.ok(!/null|NaN|undefined|Infinity|sin dato/.test(t), 'texto con basura: ' + t);

test('el día: las cinco palabras de amplitud en sus fronteras', () => {
  const tono = (sube) => L.hechos(cesta(10, sube), []).dia.tono;
  assert.equal(tono(10), 'Día de subidas casi generales'); assert.equal(tono(8), 'Día de subidas casi generales');
  assert.equal(tono(7), 'Día con más subidas que bajadas'); assert.equal(tono(6), 'Día con más subidas que bajadas');
  assert.equal(tono(5), 'Día repartido');
  assert.equal(tono(4), 'Día con más bajadas que subidas'); assert.equal(tono(3), 'Día con más bajadas que subidas');
  assert.equal(tono(2), 'Día de bajadas casi generales'); assert.equal(tono(0), 'Día de bajadas casi generales');
  // la misma regla sin pasar por los datos, con una cesta que no es de 10
  assert.equal(L.tonoAmplitud(40, 48), 'Día de subidas casi generales'); assert.equal(L.tonoAmplitud(38, 48), 'Día con más subidas que bajadas'); assert.equal(L.tonoAmplitud(24, 48), 'Día repartido'); assert.equal(L.tonoAmplitud(19, 48), 'Día con más bajadas que subidas'); assert.equal(L.tonoAmplitud(9, 48), 'Día de bajadas casi generales');
});

test('el día: cuenta, mediana, mejor y peor, y la frase dice esas cifras', () => {
  const D = cesta(12, 9); D.activos[5].c[39] = 130; D.activos[11].c[39] = 80; // A5 +30 %, A11 −20 %
  const H = L.hechos(D, []); const d = H.dia;
  assert.equal(d.dia, D.dias[39]); assert.equal(d.n, 12); assert.equal(d.suben, 9); assert.equal(d.bajan, 3);
  assert.ok(Math.abs(d.mediana - 0.01) < 1e-12); assert.equal(d.mejor.s, 'A5'); assert.equal(d.peor.s, 'A11');
  const t = L.texto(punto(H, 'dia')); sinBasura(t);
  assert.match(t, /9 de 12 activos/); assert.match(t, /A5 \(\+30,0 %\)/); assert.match(t, /A11 \(−20,0 %\)/); assert.match(t, /Bitcoin, \+1,0 %; ether, \+1,0 %/);
});

test('el día: un activo sin cierre ese día no cuenta, y con menos de diez no se dice nada', () => {
  const D = cesta(12, 12); D.activos[3].c[39] = null; D.activos[4].c[39] = null;
  assert.equal(L.hechos(D, []).dia.n, 10);
  D.activos[6].c[39] = null; const H = L.hechos(D, []);
  assert.equal(H.dia, null); assert.equal(punto(H, 'dia'), undefined);
});

test('el día: sector con la mediana de sus activos, mínimo tres con dato', () => {
  const D = cesta(12, 6); D.sectoresCesta = [{ id: 'arriba', nombre: 'Arriba', miembros: ['BTC', 'ETH', 'A2', 'NOESTA'] }, { id: 'abajo', nombre: 'Abajo', miembros: ['A9', 'A10', 'A11'] }, { id: 'corto', nombre: 'Corto', miembros: ['A7', 'A8'] }];
  const d = L.hechos(D, []).dia;
  assert.equal(d.sectores.length, 2); assert.equal(d.sectorMejor.id, 'arriba'); assert.equal(d.sectorPeor.id, 'abajo'); assert.equal(d.sectorMejor.n, 3);
  D.sectoresCesta = D.sectoresCesta.slice(0, 1); const H = L.hechos(D, []);
  assert.equal(H.dia.sectorMejor, null); assert.ok(!/Por sectores/.test(L.texto(punto(H, 'dia')))); // con un solo sector no hay mejor ni peor
});

test('el capital: sin foto de otro día no se compara; con ella, «el mismo» por debajo de 0,05 puntos', () => {
  const D = cesta(12, 6); D.global = { capTotalUsd: 2.5e12, dominanciaPct: { btc: 60, eth: 10 } }; D.stables = { totalUsd: 2.5e11, serie: dias(40).map((d, i) => [d, 2e11 + i * 1e9]) };
  let H = L.hechos(D, [{ dia: '2026-03-01', btcPct: 55 }]); // la fila del mismo día de la lectura no es «otro día»
  assert.equal(H.capital.previa, null); let t = L.texto(punto(H, 'capital')); sinBasura(t);
  assert.match(t, /2,50 billones de dólares/); assert.match(t, /60 están en bitcoin, 10 en ether y 10 en stablecoins/); assert.ok(!/foto/.test(t));
  assert.ok(Math.abs(H.capital.c30.cambio - (2.39e11 / 2.09e11 - 1)) < 1e-12); assert.match(t, /han subido un 14,4 % en 30 días/);
  H = L.hechos(D, [{ dia: '2026-02-27', btcPct: 50 }, { dia: '2026-02-28', btcPct: 59.96 }]); assert.equal(H.capital.previa.dia, '2026-02-28'); assert.match(L.texto(punto(H, 'capital')), /es el mismo que en la foto del 28-feb/);
  H = L.hechos(D, [{ dia: '2026-02-28', btcPct: 59.6 }]); assert.match(L.texto(punto(H, 'capital')), /ha subido 0,4 puntos desde la foto del 28-feb/);
  H = L.hechos(D, [{ dia: '2026-02-28', btcPct: 61.2 }]); assert.match(L.texto(punto(H, 'capital')), /ha bajado 1,2 puntos desde la foto del 28-feb/);
  delete D.global; assert.equal(L.hechos(D, []).capital, null);
});

test('la liquidez: qué lado pesa, «al menos» y comparación solo con los libros comunes', () => {
  const D = cesta(12, 6); const libro = (s, c, v, completo = true) => ({ s, par: s + 'USDT', url: 'u', compras: c, ventas: v, completo });
  D.liquidez = { filas: [libro('BTC', 105e6, 95e6), { s: 'ETH', fallo: 'no responde' }] };
  let H = L.hechos(D, []); assert.equal(H.liquidez.n, 1); assert.equal(H.liquidez.lado, 'los dos lados están parejos'); // justo 0,05 no basta
  D.liquidez.filas[0] = libro('BTC', 106e6, 94e6); assert.equal(L.hechos(D, []).liquidez.lado, 'pesa más el lado comprador');
  D.liquidez.filas[0] = libro('BTC', 94e6, 106e6); assert.equal(L.hechos(D, []).liquidez.lado, 'pesa más el lado vendedor');
  D.liquidez.filas = [libro('BTC', 60e6, 40e6), libro('ETH', 30e6, 30e6, false)];
  H = L.hechos(D, [{ dia: '2026-02-28', libros: { BTC: { compras: 40e6, ventas: 40e6 }, SOL: { compras: 9e9, ventas: 9e9 } } }]);
  assert.equal(H.liquidez.previa.n, 1); assert.ok(Math.abs(H.liquidez.previa.cambio - 0.25) < 1e-12); assert.equal(H.liquidez.alMenos, true);
  const t = L.texto(punto(H, 'liquidez')); sinBasura(t); assert.match(t, /al menos 90,0 M\$ esperando para comprar y al menos 70,0 M\$ para vender/); assert.match(t, /un 25,0 % más que en la foto del 28-feb/);
  D.liquidez = { filas: [], fallo: 'x' }; assert.equal(L.hechos(D, []).liquidez, null);
});

test('la volatilidad: «ayer» es la misma cuenta con los datos hasta ayer, y un cambio de estado se dice', () => {
  // 100 días tranquilos, 60 movidos, 39 muy tranquilos y un último día con un salto: de calma a extremo
  const r = []; for (let i = 0; i < 199; i++) r.push((i % 2 ? 1 : -1) * (i < 100 ? 0.012 : i < 160 ? 0.02 : 0.01)); r.push(0.3);
  const c = [100]; for (const x of r) c.push(c[c.length - 1] * Math.exp(x));
  const D = { leidoEn: '2026-08-01T07:00:00Z', dias: dias(c.length), activos: [{ s: 'BTC', n: 'Bitcoin', c }, { s: 'ETH', n: 'Ether', c: c.map((x, i) => x * (1 + (i % 7) / 100)) }] };
  const H = L.hechos(D, []); const b = H.vol.btc;
  assert.equal(b.e, 'extremo'); assert.equal(b.eAyer, 'calma');
  assert.equal(b.pAyer, M.percentil(M.serieVol(c.slice(0, -1), 30))); assert.equal(b.p, M.percentil(M.serieVol(c, 30)));
  const t = L.texto(punto(H, 'vol')); sinBasura(t); assert.match(t, /Bitcoin pasa de «calma» a «extremo»/); assert.match(t, /de 2 activos están agitados o en extremo \(el día anterior, /);
  // sin el salto, sigue igual
  const D2 = { leidoEn: D.leidoEn, dias: dias(c.length - 1), activos: [{ s: 'BTC', n: 'Bitcoin', c: c.slice(0, -1) }] };
  assert.match(L.texto(punto(L.hechos(D2, []), 'vol')), /Bitcoin sigue en «calma»/);
});

test('la volatilidad esperada solo se dice si es del último día cerrado o del anterior', () => {
  const D = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'mercado.json'), 'utf8')); const x = D.esperada.filas.find((q) => q.s === 'BTC'); if (!x || !x.v) return;
  const H = L.hechos(D, []); assert.ok(H.vol.esperada); assert.ok(Math.abs(H.vol.esperada.dif - (x.v[M.ultimo(x.v)] - M.vol(D.activos[0].c, 30))) < 1e-12);
  const n = x.v.length; x.v[n - 1] = null; x.v[n - 2] = null; assert.equal(L.hechos(D, []).vol.esperada, null);
});

test('los desacoples: la lista es la del bloque y «ayer» es la misma regla con los datos hasta ayer (datos reales)', () => {
  const D = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'mercado.json'), 'utf8')); const H = L.hechos(D, []); const btc = D.activos[0].c;
  for (const a of D.activos.slice(1)) {
    const f = H.des.tabla.find((x) => x.s === a.s); const c30 = M.corr(a.c, btc, 30), prev = M.corr(a.c, btc, 30, 30);
    assert.equal(f.hoy, c30 == null || prev == null ? null : c30 - prev <= -0.2);
    const ca = M.corr(a.c.slice(0, -1), btc.slice(0, -1), 30), pa = M.corr(a.c.slice(0, -1), btc.slice(0, -1), 30, 30);
    assert.equal(f.ayer, ca == null || pa == null ? null : ca - pa <= -0.2, a.s);
  }
  assert.deepEqual(H.des.lista.map((x) => x.s).sort(), H.des.tabla.filter((x) => x.hoy).map((x) => x.s).sort());
  assert.deepEqual(H.des.entran, H.des.tabla.filter((x) => x.hoy && x.ayer === false).map((x) => x.s).sort((p, q) => H.des.lista.findIndex((x) => x.s === p) - H.des.lista.findIndex((x) => x.s === q)));
});

test('los desacoples: ninguno, uno, muchos, entradas y salidas', () => {
  const base = { n: 47, entran: [], salen: [], medianaHoy: 0.61, medianaAntes: 0.7 }; const f = (des) => L.texto(L.frases({ des }).find((p) => p.k === 'des'));
  assert.match(f({ ...base, lista: [] }), /^Ninguno de los 47 activos se ha desacoplado de bitcoin\. La correlación mediana de la cesta con bitcoin es 0,61 \(en los 30 días anteriores, 0,70\)\.$/);
  assert.match(f({ ...base, lista: [{ s: 'TRX', d: -0.3 }], entran: ['TRX'] }), /^1 de 47 activos se mueve estos 30 días menos pegado a bitcoin que los 30 anteriores: TRX\. Entra hoy en la lista TRX\./);
  const siete = ['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((s) => ({ s, d: -0.3 }));
  const t = f({ ...base, lista: siete, entran: ['A', 'B'], salen: ['X', 'Y', 'Z'] }); sinBasura(t);
  assert.match(t, /^7 de 47 activos se mueven .*: A, B, C, D y E y 2 más\. Entran hoy en la lista A y B\. Salen de ella X, Y y Z\./);
});

test('casos imposibles: sin datos no hay frases ni errores', () => {
  for (const D of [null, undefined, {}, { activos: [], dias: [] }, { activos: [{ s: 'BTC', c: [] }], dias: ['2026-01-01'] }, { activos: [{ s: 'BTC', c: [null, null] }, { s: 'ETH', c: [1, null] }], dias: ['2026-01-01', '2026-01-02'], liquidez: {}, esperada: {}, global: {}, stables: {} }]) {
    const H = L.hechos(D, null); assert.deepEqual(L.frases(H), []);
  }
  assert.deepEqual(L.frases(null), []);
});

test('la lectura real de hoy: cinco puntos, sin basura y con todas las referencias resolubles', () => {
  const D = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'mercado.json'), 'utf8')); const S = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'mercado-serie.json'), 'utf8'));
  const H = L.hechos(D, S.filas); const P = L.frases(H);
  assert.deepEqual(P.map((p) => p.k), ['dia', 'capital', 'liquidez', 'vol', 'des']);
  const simbolos = new Set(D.activos.map((a) => a.s)); const sectores = new Set(D.sectoresCesta.map((x) => x.id)); const REFS = new Set(['amplitud', 'activo', 'sector', 'capital', 'stables', 'liquidez', 'estado', 'volCesta', 'esperada', 'desacoples', 'par']);
  for (const p of P) {
    sinBasura(L.texto(p)); assert.ok(p.partes.some((x) => typeof x !== 'string'), 'un punto sin ninguna cifra enlazada: ' + p.k);
    for (const x of p.partes) { if (typeof x === 'string') continue; assert.ok(REFS.has(x.ref), 'referencia desconocida: ' + x.ref); if (['activo', 'estado', 'esperada', 'par'].includes(x.ref)) assert.ok(simbolos.has(x.s), x.s); if (x.ref === 'sector') assert.ok(sectores.has(x.id), x.id); }
  }
  // las cifras de la frase del día son las de los cierres
  const fin = D.dias.length - 1; const r = D.activos.filter((a) => a.c[fin] != null && a.c[fin - 1] != null).map((a) => a.c[fin] / a.c[fin - 1] - 1);
  assert.equal(H.dia.n, r.length); assert.equal(H.dia.suben, r.filter((x) => x >= 0).length);
});

test('las reglas que enseña la página nombran los umbrales que usa el programa', () => {
  const t = L.REGLAS.map((x) => x[1]).join(' ');
  assert.match(t, /80 %/); assert.match(t, /60/); assert.match(t, /40/); assert.match(t, new RegExp('menos de ' + L.MIN_CESTA + ' activos')); assert.match(t, /0,05 puntos/); assert.match(t, /menor del 5 %/); assert.match(t, /0,2 o más/);
  assert.equal(L.REGLAS.length, 5);
});
