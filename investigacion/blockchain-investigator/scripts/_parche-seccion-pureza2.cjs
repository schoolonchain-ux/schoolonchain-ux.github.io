'use strict';
// Parche (3-nov): sección 17 «Dos vías de pureza en paralelo». Constructor de datos (perdida-rastro.cjs), llamada en el generador, sección HTML e índice.
const fs = require('fs'); const base = 'C:/EquipoIA/blockchain-investigator/';
function parchear(f, pares) { let s = fs.readFileSync(base + f, 'utf8'); for (const [a, b] of pares) { if (!s.includes(a)) throw new Error(f + ': no encontrado: ' + a.slice(0, 70)); if (s.split(a).length !== 2) throw new Error(f + ': aparece más de una vez: ' + a.slice(0, 70)); s = s.replace(a, b); } fs.writeFileSync(base + f, s); }

parchear('src/libro-mayor/perdida-rastro.cjs', [[
  'module.exports = { construirPerdida, construirPolytrop, construirArkham, construirGas };',
  `// Dos (tres) vías de pureza en paralelo (3-nov): la actual (publicada), «ciclo» (la entrada de un contrato neutro en exceso de lo que la billetera le mandó, y sin enlace, diluye la pureza) y «diluida» (cota baja: todo lo que entra de contratos sin enlace diluye).
// Lee los resultados de análisis de cada tramo congelado (tramoN-resultado[.ciclo|.diluida].json y la caché para las salidas por billetera).
function construirPureza2(tramos) {
  const out = []; for (const { nombre, dir, pref } of tramos) {
    const f = s => path.join(dir, pref + '-resultado' + s + '.json'); if (!existe(f('')) || !existe(f('.ciclo'))) continue;
    const V = { actual: j(f('')), ciclo: j(f('.ciclo')), diluida: existe(f('.diluida')) ? j(f('.diluida')) : null }; const ent = V.actual.repartoSalida.v;
    const resumen = R => { const t = R.totales || {}; const dest = Object.values(t).reduce((a, b) => a + b, 0); const suma = dest + R.retenidoTainted + R.polvo + R.sinResolver.total; return { nodo: t.nodo || 0, puente: t.puente || 0, usdd: t.usdd || 0, prestamo: t.prestamo || 0, casa: t.casa || 0, destinos: dest, retenido: R.retenidoTainted, polvo: R.polvo, sinResolver: R.sinResolver.total, suma, relacion: suma / ent }; };
    const vias = { actual: resumen(V.actual), ciclo: resumen(V.ciclo), ...(V.diluida ? { diluida: resumen(V.diluida) } : {}) };
    const cache = j(path.join(dir, pref + '-cache.json')).rec; const pa = V.actual.pureza, pc = V.ciclo.pureza, se = V.ciclo.sinEnlace || {};
    const filas = Object.keys(pa).filter(w => cache[w] && cache[w].ok).map(w => { const sal = (cache[w].sal || []).reduce((s, e) => s + e.v, 0); return { a: w, nivel: cache[w].nivel, puraActual: pa[w], puraCiclo: pc[w], salidas: sal, sinEnlace: se[w] || 0, efecto: (pa[w] - pc[w]) * sal }; }).sort((x, y) => y.efecto - x.efecto);
    out.push({ nombre, pref, entrada: ent, vias, billeterasCambian: filas.filter(x => x.puraActual - x.puraCiclo > 0.05).length, billeterasTotal: filas.length, efectoTotal: filas.reduce((s, x) => s + Math.max(0, x.efecto), 0), top: filas.slice(0, 12) });
  } return out.length ? { tramos: out, fecha: '2026-11-03' } : null;
}
module.exports = { construirPerdida, construirPolytrop, construirArkham, construirGas, construirPureza2 };`]]);

parchear('scripts/informe-trazabilidad.cjs', [
  ['construirArkham, construirGas } = require(', 'construirArkham, construirGas, construirPureza2 } = require('],
  ['polytrop, arkham, gas: construirGas(', "polytrop, arkham, pureza2: construirPureza2([{ nombre: 'Después de la foto (tramo 5)', dir: T5, pref: 'tramo5' }, { nombre: 'Antes de la foto (tramo 6)', dir: T6, pref: 'tramo6' }]), gas: construirGas("]]);

parchear('src/libro-mayor/informe-html.cjs', [["['s16', '16 Cuenta de gas (NUEVO v0.3)'],", "['s16', '16 Cuenta de gas (NUEVO v0.3)'], ['s17', '17 Dos vías de pureza (NUEVO v0.5)'],"]]);

const sec = `  // ============ 17. Dos vías de pureza en paralelo  [NUEVO v0.5]
  (function () {
    var P = D.pureza2; if (!P) return;
    var s = sec('s17', '17 · Dos vías de pureza en paralelo (NUEVO en v0.5)', 'La «pureza» de una billetera es la parte de su dinero que el modelo atribuye al robo; cuando esa billetera envía dinero, el modelo asume que sale con ese mismo porcentaje. La vía ACTUAL (la de todas las cifras de este informe) no cuenta como «dinero que entra» lo que viene de contratos de intercambio, puentes o bóvedas («neutros») y supone que es dinero propio que vuelve. Eso falla si una billetera cobra pagos de otra gente desde una bóveda: se queda con la pureza de lo poco que sí está enlazado con nosotros y todo lo que envía se atribuye al robo. La vía CICLO corrige solo ese caso: lo que entra de un contrato EN EXCESO de lo que la propia billetera le había mandado, y que no está enlazado con una salida nuestra, diluye la pureza. Las dos se calculan siempre; aquí se comparan.');
    s.append(nota('Cada vía se calcula con los mismos datos y el mismo corte; los importes están al precio fijo del análisis (0,352 $/TRX), no a precio de hoy como las partidas de la sección 7. La vía «diluida (cota baja)» diluye TODO lo que entra de contratos sin enlace: corrige de más, porque muchas devoluciones legítimas de cambios no tienen su enlace registrado; se enseña como límite inferior, no como propuesta. Una buena vía debería acercar los dos tramos a «lo que entra = lo que sale».'));
    function pct(x) { return (x * 100).toFixed(1).replace('.', ',') + ' %'; }
    P.tramos.forEach(function (T) {
      s.append(tit(T.nombre + ' · entrada ' + m(T.entrada)));
      var filas = [['Puentes (a otras cadenas)', 'puente'], ['Nodos y servicios (puntos de parada)', 'nodo'], ['USDD', 'usdd'], ['Total en destinos finales', 'destinos'], ['Retenido en billeteras', 'retenido'], ['Polvo no seguido', 'polvo'], ['Entra en contratos sin salida visible', 'sinResolver'], ['SUMA de todo lo anterior', 'suma'], ['Suma / entrada', 'relacion']];
      var cols = [{ t: 'Concepto', v: function (x) { return x[0]; } }, { t: 'Vía ACTUAL', num: 1, v: function (x) { return x[1] === 'relacion' ? pct(T.vias.actual.relacion) : m(T.vias.actual[x[1]]); } }, { t: 'Vía CICLO', num: 1, v: function (x) { return x[1] === 'relacion' ? pct(T.vias.ciclo.relacion) : m(T.vias.ciclo[x[1]]); } }];
      if (T.vias.diluida) cols.push({ t: 'Diluida (cota baja)', num: 1, v: function (x) { return x[1] === 'relacion' ? pct(T.vias.diluida.relacion) : m(T.vias.diluida[x[1]]); } });
      s.append(tabla(cols, filas, { pp: 12, orden: -1 }));
      s.append(nota('Con la vía CICLO cambia la pureza de ' + n(T.billeterasCambian) + ' de las ' + n(T.billeterasTotal) + ' billeteras leídas (baja más de 0,05) y se atribuyen ' + m(T.efectoTotal) + ' menos a lo largo de sus salidas (suma de los saltos, no de los destinos finales).'));
      s.append(tit('Las 12 billeteras que más cambian · ' + T.nombre));
      s.append(tabla([{ t: 'Billetera', v: function (x) { return enlDir(x.a, 'tron'); }, o: function (x) { return x.a; } }, { t: 'Salto', num: 1, v: function (x) { return n(x.nivel); }, o: function (x) { return x.nivel; } }, { t: 'Pureza ACTUAL', num: 1, v: function (x) { return x.puraActual.toFixed(3).replace('.', ','); }, o: function (x) { return x.puraActual; } }, { t: 'Pureza CICLO', num: 1, v: function (x) { return x.puraCiclo.toFixed(3).replace('.', ','); }, o: function (x) { return x.puraCiclo; } }, { t: 'Envía en total', num: 1, v: function (x) { return m(x.salidas); }, o: function (x) { return x.salidas; } }, { t: 'Entrada de contratos sin enlace', num: 1, v: function (x) { return m(x.sinEnlace); }, o: function (x) { return x.sinEnlace; } }, { t: 'Efecto', num: 1, v: function (x) { return m(x.efecto); }, o: function (x) { return x.efecto; } }], T.top, { pp: 12, orden: 6 }));
    });
    s.append(tit('Qué dice cada vía y cuál es el riesgo'));
    var ul = h('ul');
    ul.append(h('li', null, 'ACTUAL: sobrestima cuando una billetera cobra pagos de otros por contratos (el tramo 6 reparte más de lo que entra) y es la que cuadra mejor en el tramo 5. Es la que alimenta las demás secciones.'));
    ul.append(h('li', null, 'CICLO: quita ese sobrante sin tocar las idas y vueltas legítimas; deja los dos tramos más parecidos entre sí, pero ambos algo por debajo de lo que entra. Que quede por debajo NO prueba que ese dinero haya salido de la cadena: es dinero que el modelo ya no puede atribuir.'));
    ul.append(h('li', null, 'Ninguna vía está revisada por una fuente externa todavía. Que dos métodos razonables den destinos distintos es información: el rango entre ambos es la incertidumbre del modelo.'));
    s.append(ul);
  })();

`;
parchear('src/libro-mayor/informe-secciones.js', [['  // ============ Fichas, libro de movimientos, calidad, fuentes, novedades', sec + '  // ============ Fichas, libro de movimientos, calidad, fuentes, novedades']]);
console.log('sección 17 añadida');
