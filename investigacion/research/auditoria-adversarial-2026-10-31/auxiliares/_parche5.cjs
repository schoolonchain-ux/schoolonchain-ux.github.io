const fs = require('fs'); const f = __dirname + '/armar-entregables.cjs'; let s = fs.readFileSync(f, 'utf8');
const R = (a, b) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error('coincidencias ' + n + ': ' + a.slice(0, 80)); s = s.replace(a, () => b); };
// nuevas reps antes de escribir el HTML
R("fs.writeFileSync(ART + 'ARTICULO-COMPLETO-ROBO-BINANCE-2026-10-31-REVISADO.html', h);",
`rep('El robo se ejecutó a la vez en dos cadenas, cada una con sus billeteras:', 'Los movimientos se produjeron a la vez en dos cadenas, cada una con sus billeteras (que se trate de un robo es la premisa de los informes; este paquete no incluye una fuente independiente del incidente):');
rep('el grupo del 11-oct mezcla ya dinero ajeno (pureza del 65 al 81 %)', 'el grupo del 11-oct recibe ya entradas no atribuidas al recorrido (pureza del 65 al 81 %; su origen y titularidad no se han determinado)');
rep('<b>ha repartido 109,3 M$</b>: 50,8 M$ hasta la foto de las 22:40 UTC del 30-oct (rastreados) y <b>58,5 M$ desde entonces (sin rastrear a fondo)</b>', '<b>ha repartido ≈ 109,4 M$ hasta las 10:11:59 del 31-oct</b> (111,4 M$ hasta las 10:28:48): 50,8 M$ hasta la foto de las 22:40 UTC del 30-oct (rastreados) y <b>≈ 58,7 M$ desde entonces hasta las 10:11:59 (60,7 M$ hasta las 10:28:48; sin rastrear a fondo)</b>. Revisión: el original decía 109,3 y 58,5 M$, cifras que no corresponden a ninguno de los dos cortes');
rep('(58,5 M$ repartidos entre las 22:41 del 30-oct y las 10:11 del 31-oct)', '(≈ 58,7 M$ repartidos entre las 22:41 del 30-oct y las 10:11:59 del 31-oct; 60,7 M$ hasta las 10:28:48)');
rep('<h3>Lo que ha pasado desde la foto (22:41 UTC del 30-oct → 10:11 UTC del 31-oct)</h3>', '<h3>Lo que ha pasado desde la foto (22:41 UTC del 30-oct → 10:11 UTC del 31-oct; la tabla llega hasta las 10:28)</h3>');
fs.writeFileSync(ART + 'ARTICULO-COMPLETO-ROBO-BINANCE-2026-10-31-REVISADO.html', h);`);
R("'Los 58,5 M$ repartidos después de la foto (solo primer salto) siguen sin rastrear a fondo.'", "'Los ≈ 58,7 M$ repartidos entre la foto y las 10:11:59 del 31-oct (60,7 M$ hasta las 10:28:48; solo primer salto) siguen sin rastrear a fondo.'");
fs.writeFileSync(f, s); console.log('ok');
