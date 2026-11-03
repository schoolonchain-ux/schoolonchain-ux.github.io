const fs = require('fs'); const dir = __dirname + '/'; const fallos = [];
const mk = (file) => { let s = fs.readFileSync(dir + file, 'utf8'); return { R(a, b, nmin = 1) { const n = s.split(a).length - 1; if (n < nmin) { fallos.push(file + ' · ' + n + ' · ' + a.slice(0, 90)); return; } s = s.split(a).join(b); }, save() { fs.writeFileSync(dir + file, s); } }; };
const O = mk('objeciones.cjs'), A = mk('armar-entregables.cjs');
// R3-01 premisa del robo
A.R('el robo en dos cadenas, las congelaciones,', 'los movimientos en dos cadenas y las congelaciones (la calificación de «robo» es la premisa del encargo y de los informes; este paquete no incluye una fuente independiente del incidente),');
A.R("<li>El robo en dos cadenas, los importes y las congelaciones de Tether y Circle.</li>", "<li>Los movimientos en dos cadenas, los importes y las congelaciones de Tether y Circle, sobre los datos guardados. <i>Que se trate de un robo (salidas no autorizadas) es la premisa de los informes: este paquete no incluye una fuente independiente del incidente.</i></li>");
// R3-03
A.R('retenido por simulación (movimientos <350 $ no guardados)', 'retenido por simulación (déficit de inventario causado en parte por los filtros del simulador; desglose pendiente)', 0);
A.R('Datos insuficientes para: retenido por simulación (movimientos <350 $ no guardados)', 'Datos insuficientes para: retenido por simulación (déficit de inventario causado en parte por los filtros del simulador; desglose pendiente)', 0);
// R3-04
O.R('aprovisionamiento coordinado sí; «infraestructura propia de este blanqueo» no', 'creación y fondeo próximos en el tiempo (coordinación inferida); «infraestructura propia de este blanqueo» no demostrada');
A.R('está aprovisionado de forma coordinada desde el 8–11 oct y tenía tráfico antes del 29-oct (revisión)', 'tiene creación y fondeo próximos en el tiempo (8–11 oct; la coordinación es una inferencia) y tenía actividad antes del 29-oct (revisión)');
// R3-05 pureza ≠ titularidad ajena
A.R("todo pasa antes por el grupo, que ya mezcla dinero ajeno. <b>Revisión:</b>", "todo pasa antes por el grupo, que recibe además entradas cuyo origen y titularidad no se han determinado (una pureza inferior a 1 no demuestra que sean de otros propietarios). <b>Revisión:</b>", 0);
A.R("el grupo del 11-oct mezcla ya dinero ajeno (pureza del 65 al 81 %)", "el grupo del 11-oct recibe ya entradas no atribuidas al recorrido (pureza del 65 al 81 %; su origen y titularidad no se han determinado)", 0);
// R3-02 THORChain
A.R("rep('Parte vuelve", "rep('y una de ellas lo devuelve a TRON:', 'y una de ellas lo solicita devolver a TRON:');\nrep('<h3>El regreso a TRON por THORChain</h3>', '<h3>Las solicitudes de regreso a TRON por THORChain</h3>');\nrep('y el regreso a TRON por THORChain. Pastilla', 'y las solicitudes de regreso a TRON por THORChain. Pastilla');\nrep('Parte vuelve");
// R3-06 Excel
A.R("'(permiso por defecto)'", "'(sin cobertura verificable: permisos no guardados)'");
A.R("'Transf. USDT/día 12–29 oct (≈, mediana)'", "'Intensidad estimada USDT/día 12–29 oct (mediana; no es conteo)'");
A.R("'Transf. USDT/día 30-oct (≈)'", "'Intensidad estimada USDT/día 30-oct (no es conteo)'");
A.R("'Pedido $ (memos)'", "'Valor de ENTRADA $ de las operaciones con memo a TRON'");
// sin leer: separar resumen y detalle
A.R("add('AUD Sin leer', [{ Tramo: 1, 'Carteras sin leer': 81,", "add('AUD Sin leer mayores', sinLeer['traza-post-cache.json'].mayores.map(([d, v]) => ({ Tramo: 2, Direccion: d, 'Atribuido (pureza del informe) $': Math.round(v) })), [8, 44, 28]);\nadd('AUD Sin leer', [{ Tramo: 1, 'Registros de lectura fallida': 81,");
A.R("{ Tramo: 2, 'Carteras sin leer': 342,", "{ Tramo: 2, 'Registros de lectura fallida': 342,");
A.R(".concat(sinLeer['traza-post-cache.json'].mayores.map(([d, v]) => ({ Tramo: 2, 'Carteras sin leer': d, 'Bruto que les entra $': '', 'Atribuido (pureza del informe) $': Math.round(v) }))), [8, 42, 22, 28]);", ", [8, 28, 22, 28]);");
// R3-07 clases
O.R("id: 'O-05', sev: 'Alta', clase: 'VERIFICADO'", "id: 'O-05', sev: 'Alta', clase: 'VERIFICADO (conteos y brutos) / ESTIMADO (importes atribuidos)'");
A.R("<li>' + OK + ' <b>Billeteras sin leer:</b> 423 registros (81 + 342; 420 direcciones). En el segundo tramo les entran 32,15 M$ brutos y ≈ 10,67 M$ atribuidos con las purezas del propio informe. El original no lo decía.</li>", "<li>' + OK + ' <b>Billeteras sin leer:</b> 423 registros (81 + 342; 420 direcciones); en el segundo tramo les entran 32,15 M$ brutos. ' + EST + ' Con las purezas del propio informe, ≈ 10,67 M$ atribuidos. El original no lo decía.</li>");
A.R("JustLend son 117 movimientos únicos (≈ 4,75 M$).</li>", "JustLend son 117 movimientos únicos (importes transferidos; el ≈ 4,75 M$ atribuido es ' + EST + ').</li>");
// R3-08
O.R('con el retenido de cada modelo el residuo sale ≈ 0,5 M$', 'con el retenido de cada modelo el residuo sale 0,46–0,52 M$ (hipótesis por defecto) y 0,92–0,97 M$ (entradas desconocidas limpias)');
// R3-09 post-foto
A.R("  ['Solapamiento entre tramos',", "  ['Reparto tras la foto (TRBdWq…)', '363 envíos por 60,7 M$ (166,2 M TRX) a 51 billeteras «hasta las 10:11»; resumen: 58,5 M$', 'Dos cortes: hasta 10:11:59 → 353 envíos, 49 billeteras, 166,63 M TRX, 58,65 M$; hasta 10:28:48 → 363, 51, 172,33 M TRX, 60,66 M$. 166,2 M TRX no suman 60,7 M$ a 0,352', 'Se declaran ambos cortes; la hoja original «Reparto TRBdWq» etiqueta como «hasta 10:11» movimientos de 10:24–10:28 y se conserva sin tocar.', 'R3-09'],\n  ['Solapamiento entre tramos',");
A.R("rep('Parte vuelve", "rep('<b>363 envíos por 60,7 M$ (166,2 M TRX) a 51 billeteras</b>', '<b>363 envíos por 60,7 M$ a 51 billeteras (hasta las 10:28:48; 172,3 M TRX)</b> <b>[Revisión: el original decía 166,2 M TRX y rotulaba el corte como 10:11. Hasta 10:11:59 son 353 envíos, 49 billeteras, 166,6 M TRX y 58,7 M$.]</b>');\nrep('Parte vuelve");
// R3 UniversalRouter 1,7M: citar consulta guardada
O.R('(1,7 M de operaciones)', '(1,7 M de operaciones según la consulta a TronScan del 31-oct guardada en resultados/universalrouter-cuenta.json)', 0);
A.R('(1,7 M de operaciones)', '(1,7 M de operaciones según la consulta a TronScan del 31-oct guardada en resultados/universalrouter-cuenta.json)', 0);
O.save(); A.save(); console.log(fallos.length ? 'NO ENCONTRADOS:\n' + fallos.join('\n') : 'todo aplicado');
