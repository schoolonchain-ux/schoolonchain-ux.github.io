'use strict';
// Parche 7 (1-nov): tramo 3 en el HTML revisado, tabla de diferencias y hoja Excel; figuras revisadas incrustadas.
const fs = require('fs');
const f = 'C:/EquipoIA/research/auditoria-adversarial-2026-10-31/armar-entregables.cjs';
let s = fs.readFileSync(f, 'utf8'); const fallos = [];
const R1 = (a, b) => { const n = s.split(a).length - 1; if (n !== 1) { fallos.push(n + ' · ' + a.slice(0, 80)); return; } s = s.replace(a, () => b); };

// 1) datos del tramo 3
R1("const J = f => JSON.parse(fs.readFileSync(R + f, 'utf8'));",
  "const J = f => JSON.parse(fs.readFileSync(R + f, 'utf8'));\n" +
  "const T3 = JSON.parse(fs.readFileSync(R + '../tramo3/tramo3-resultado.json', 'utf8'));\n" +
  "const T3FIN = Object.entries(T3.fin).flatMap(([clase, l]) => l.map(x => ({ clase, ...x })));\n" +
  "const T3SUMA = Object.values(T3.totales).reduce((a, b) => a + b, 0) + T3.retenidoTainted;");

// 2) filas de la tabla de diferencias
R1("'R3-09'],\n",
  "'R3-09'],\n" +
  "  ['Reparto tras la foto: rastreo a fondo (tramo 3)', 'Solo primer salto: «no rastreado a fondo»', '3.918 billeteras leídas (nivel máximo 42, 0 lecturas fallidas) hasta las 17:20:18 UTC del 31-oct para los 353 envíos hasta las 10:11:59 (58,65 M$): nodos 46,63; USDD 7,46; préstamo JustLend 2,43; puente 0,19; casa de cambio 0,004 (FixedFloat 3.520 $); retenido 3,62 M$. El modelo reparte 60,33 M$ sobre 58,65 de entrada (+1,68 M$): no conserva.', 'Se añade como ESTIMADO con sus límites; los 10 envíos de 10:12 a 10:28:48 no están rastreados a fondo.', 'Petición del propietario 1-nov'],\n" +
  "  ['Lista de ventana previa (preventana-tramo1.json)', 'No existe', 'Antes vacía por un fallo de atribucion.cjs; regenerada: 112 billeteras, 297 entradas, 13,99 M$ brutos', 'Corregido; los resultados de atribución no cambian.', 'O-04'],\n" +
  "  ['Reproducción personal del 2.º tramo', 'Solo la hizo Codex', 'Repetida por mí sin red el 1-nov: todos los campos iguales (diferencia máxima de pureza 0)', 'Cerrado.', 'O-19'],\n");

// 3) resumen de la revisión
R1("<b>≈ 58,7 M$ desde entonces hasta las 10:11:59 (60,7 M$ hasta las 10:28:48; sin rastrear a fondo)</b>",
  "<b>≈ 58,7 M$ desde entonces hasta las 10:11:59 (60,7 M$ hasta las 10:28:48; los de las 10:11:59, rastreados a fondo en el tramo 3, ver abajo)</b>");

// 4) párrafo nuevo, figuras revisadas y enlaces
const bloque = [
  "rep('<span class=\"b lim\">LÍMITE</span> Solo se conoce el primer salto: no he seguido adónde van después. 32 de las 33 billeteras nuevas ya las tiene el vigilante.</p>',",
  "  '<span class=\"b est\">ESTIMADO</span> <b>Rastreo a fondo (tramo 3).</b> Sigo los 353 envíos hasta las 10:11:59 (58,65 M$ a 49 billeteras) billetera a billetera con los datos de la cadena hasta las 17:20:18 UTC del 31-oct (lo movido después no cuenta). Leí ' + fe(T3.billeteras) + ' billeteras (nivel máximo ' + T3.nivelMax + '), sin lecturas fallidas. Con el mismo método de mezcla proporcional que los otros tramos, el dinero acaba en: nodos de servicio ' + fm(T3.totales.nodo) + ' M$ (' + fm(34302218) + ' en las 5 billeteras del 11-oct y ' + fm(T3FIN.find(x => x.k.startsWith(\"TM8uy\")).v) + ' en <code>TM8uy…</code>), USDD ' + fm(T3.totales.usdd) + ', préstamo JustLend ' + fm(T3.totales.prestamo) + ', puente ' + fm(T3.totales.puente) + ', casa de cambio ' + fm(T3.totales.casa) + ' (FixedFloat) y retenido en billeteras del recorrido ' + fm(T3.retenidoTainted) + ' M$. <span class=\"b lim\">LÍMITE</span> Eso suma ' + fm(T3SUMA) + ' M$ sobre 58,65 de entrada: el modelo reparte ' + fm(T3SUMA - 58654737) + ' M$ de más, el mismo defecto de conservación declarado arriba. Los 10 envíos de las 10:12 a las 10:28:48 (≈ 2,0 M$) no están rastreados a fondo. Los nodos que absorben 46,6 M$ (el grupo del 11-oct y <code>TM8uy…</code>) ya eran destinos del segundo tramo: no sumo este tramo a los otros y no he medido el solape. «En nodos» es un punto donde el rastreo se detiene, no un destino final demostrado.</p>' +",
  "  tabla(['Destino', 'Clase', 'Atribuido (M$)', 'Bruto (M$)', 'Envíos', 'Billeteras que envían'], T3FIN.slice().sort((a, b) => b.v - a.v).map(x => ({ Destino: x.dest + ' (' + x.k + ')', Clase: x.clase, 'Atribuido (M$)': fm(x.v), 'Bruto (M$)': fm(x.vBruto), Envíos: fe(x.n), 'Billeteras que envían': fe(x.senders) }))));",
  "{ const nombres = ['0-mapa-general', '1de4-custodia-tron', '2de4-blanqueo-tron', '3de4-puentes', '4de4-ethereum']; let k = 0;",
  "  h = h.replace(/<svg xmlns=\"http:\\/\\/www\\.w3\\.org\\/2000\\/svg\" data-w[\\s\\S]*?<\\/svg>/g, () => fs.readFileSync('C:/EquipoIA/docs/grafos-revisados/' + nombres[k++] + '.svg', 'utf8').trim().replace(/^<svg([^>]*?) width=\"(\\d+)\" height=\"(\\d+)\"/, '<svg$1 data-w=\"$2\" data-h=\"$3\"'));",
  "  if (k !== 5) throw new Error('Figuras sustituidas: ' + k);",
  "  h = h.split('../grafos/').join('../grafos-revisados/'); }",
  ""
].join('\n');
R1("fs.writeFileSync(ART + 'ARTICULO-COMPLETO-ROBO-BINANCE-2026-10-31-REVISADO.html', h);", bloque + "fs.writeFileSync(ART + 'ARTICULO-COMPLETO-ROBO-BINANCE-2026-10-31-REVISADO.html', h);");

// 5) hoja Excel
R1("add('AUD Preguntas abiertas',", "add('AUD Tramo 3', T3FIN.slice().sort((a, b) => b.v - a.v).map(x => ({ Clase: x.clase, Destino: x.k, Direccion: x.dest, 'Atribuido $': Math.round(x.v), 'Bruto $': Math.round(x.vBruto), Envios: x.n, 'Billeteras que envian': x.senders, 'Primera (UTC)': new Date(x.primera).toISOString().slice(0, 19), 'Ultima (UTC)': new Date(x.ultima).toISOString().slice(0, 19) })).concat([{ Clase: 'retenido', Destino: 'saldo × pureza en billeteras del recorrido', 'Atribuido $': Math.round(T3.retenidoTainted) }]), [12, 36, 38, 14, 14, 8, 12, 20, 20]);\nadd('AUD Preguntas abiertas',");
fs.writeFileSync(f, s);
console.log(fallos.length ? 'NO ENCONTRADOS:\n' + fallos.join('\n') : 'ok');
