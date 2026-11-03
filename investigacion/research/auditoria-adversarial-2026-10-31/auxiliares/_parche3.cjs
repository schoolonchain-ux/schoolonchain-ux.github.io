const fs = require('fs'); const dir = __dirname + '/';
const fallos = [];
const mk = (file) => { let s = fs.readFileSync(dir + file, 'utf8'); return { R(a, b, nmin = 1) { const n = s.split(a).length - 1; if (n < nmin) { fallos.push(file + ' · ' + n + ' · ' + a.slice(0, 80)); return; } s = s.split(a).join(b); }, save() { fs.writeFileSync(dir + file, s); } }; };
const O = mk('objeciones.cjs'), A = mk('armar-entregables.cjs');

// R2-01 préstamos
O.R('préstamos a 4,79–4,81 M$', 'préstamos a 4,78–4,81 M$'); O.R('préstamos 4,79–4,87', 'préstamos 4,78–4,87');
A.R('4,79–4,81', '4,78–4,81', 0);
// R2-06 cotas -> estrategias
for (const X of [O, A]) { X.R('cota alta', 'extremo alto observado', 0); X.R('cota baja', 'extremo bajo observado', 0); X.R('las dos cotas', 'las dos estrategias extremas', 0); }
// R2-02/03 retenido y 350 $
A.R('(inventario huérfano ≈ 4,9 M$ por movimientos < 350 $ no guardados). El retenido del informe sí se validó contra saldos reales.', '(inventario huérfano ≈ 4,9 M$; causado en parte por los filtros del propio simulador, desglose pendiente). El retenido del informe se contrastó de forma aproximada con el saldo bruto de 25 cuentas; su atribución no está validada.');
A.R('(inventario huérfano ≈ 4,9 M$ por movimientos menores de 350 $ que no se guardan). El retenido del informe se validó contra saldos reales.', '(inventario huérfano ≈ 4,9 M$; causado en parte por los filtros del propio simulador, desglose pendiente). El retenido del informe se contrastó de forma aproximada con el saldo bruto de 25 cuentas; su atribución no está validada.');
O.R('Movimientos <350 $ no guardados', 'Filtros del simulador y movimientos no guardados');
A.R('para validar el «retenido» de forma completa', 'para contrastar el saldo bruto del «retenido» en más cuentas (no validaría su procedencia)', 0);
// R2-04 hueco
O.R('el hueco previo (≤ 1,3 M$ brutos)', 'el hueco previo (20 movimientos adicionales encontrados bajo filtros, 1,00 M$ brutos; cobertura incompleta, no una parte conciliada del residuo)');
// R2-05
O.R('que no reproduzco desde la caché (O-19)', 'que reproduce exactamente el guion original según la revisión Codex (O-19)');
A.R('Segundo tramo: ejecutar el guion original `traza-post-analisis.cjs` con la misma caché y compararlo con mi reproducción (nodos 19,35 vs 22,81; casas 2,70 vs 4,15; retenido 10,5 vs 21,0 M$) para saber si la diferencia es mía o del informe (O-19).', 'Segundo tramo: la diferencia con mi adaptación está resuelta (era mía); queda pendiente que yo repita la ejecución del guion original `traza-post-analisis.cjs` (Codex ya lo hizo dos veces con el mismo resultado) (O-19).');
// R2-07/08/09/10 nodos
O.R('Las cinco ya movían unas 40–340 transferencias USDT al día (ritmo estimado) desde el 12-oct, diecisiete días antes del robo, y el 30-oct pasan a ≈ 1.000–2.600/día: existían y daban servicio a terceros antes del robo.', 'Un estimador de intensidad (extrapola a 24 h el intervalo de las últimas 50 transferencias de cada fecha; no es un conteo diario y no se conservaron las muestras) da unas 40–340 transferencias/día desde el 12-oct, diecisiete días antes del robo, y ≈ 1.000–2.600 el 30-oct: tenían actividad previa con otras direcciones antes del robo.');
O.R('Ninguna comparte una dirección autorizada visible en sus permisos ni primer fondeador', 'En las siete cuentas con permisos guardados no aparecen claves compartidas (TGSNahJv… y TZG47zhb… quedan sin cobertura verificable) ni primer fondeador común');
A.R('primer TRX en 1 min', 'primer TRX en 84 s (23:35:12–23:36:36)');
A.R('tráfico previo al robo de 40–340 transferencias/día (≈)', 'actividad previa al robo (intensidad estimada 40–340 transferencias/día, no un conteo)');
A.R('aprovisionamiento coordinado, control común y servicio a terceros HIPÓTESIS', 'aprovisionamiento coordinado, control común y servicio a terceros HIPÓTESIS; propiedad de los fondos que movían DESCONOCIDA');
A.R('el aprovisionamiento coordinado sí está demostrado, pero las cinco billeteras ya movían 40–340 transferencias USDT al día desde el 12-oct, diecisiete días antes del robo:', 'la proximidad temporal de creación y fondeo está observada (que haya coordinación es un indicio), pero las cinco billeteras ya tenían actividad antes del robo (intensidad estimada de 40–340 transferencias/día desde el 12-oct, no un conteo diario):');
A.R('pero ya movían unas 40–340 transferencias USDT al día (ritmo estimado) desde el 12-oct, antes del robo, y en la muestra', 'pero ya tenían actividad antes del robo (intensidad estimada de 40–340 transferencias/día desde el 12-oct, extrapolada de las últimas 50 de cada fecha; no es un conteo diario), y en la muestra');
A.R('No comparten una dirección autorizada visible en sus permisos ni primer fondeador (no se descarta que un mismo operador tenga todas las claves).', 'En las siete cuentas con permisos guardados no aparecen claves compartidas (dos cuentas, TGSNahJv… y TZG47zhb…, quedan sin cobertura verificable), ni primer fondeador común; esto no descarta que un mismo operador tenga todas las claves.');
// R2-12/13/14 THORChain
O.R('es un enrutador de cambios de uso general, no una dirección de THORChain, así que', 'está clasificado como enrutador de cambios de uso general (no se ha establecido su papel en estas liquidaciones), así que');
A.R('no una dirección de THORChain; por dirección', 'su papel en estas liquidaciones no está establecido; por dirección');
A.R('Parte vuelve a TRON por THORChain (1.580 operaciones a 11 direcciones TRON)', 'Parte se pide volver a TRON por THORChain (1.600 solicitudes con destino en TRON: 1.580 con activo tr y 20 con TRON.USDT; la ejecución individual no está enlazada)', 0);
A.R('pero solo <b>7,8 M$</b> vienen de TRON: mezclan dinero ajeno.', 'pero solo <b>7,8 M$</b> vienen de TRON; el origen y la relación con el robo del resto no se han determinado.', 0);
// R2-16 clases
A.R('los depósitos en JustLend y el reparto por clase de destino (nodos, préstamos, USDD) en todos los modelos ensayados (con rango, ver O-01).', 'los 117 movimientos a JustLend (importes transferidos); el reparto atribuido por clase (nodos, préstamos, USDD) es ESTIMADO y parecido en las cinco estrategias ensayadas (rango en O-01).');
A.R('El reparto por clase (nodos, préstamos, USDD) es casi igual con cualquier modelo de atribución.', 'El reparto atribuido por clase (nodos, préstamos, USDD) es parecido en las cinco estrategias ensayadas (' + "' + EST + '" + ').');
O.R("id: 'O-14', sev: 'Media', clase: 'VERIFICADO'", "id: 'O-14', sev: 'Media', clase: 'ESTIMADO'");
O.R("id: 'O-14'", "id: 'O-14'");
// R2-17 método
A.R('Se sigue cada billetera que recibe 10.000 TRX (3.520 $) o más del robo:', 'Se amplía cada rama cuyas transferencias brutas son de 10.000 TRX (3.520 $) o más, sin mirar todavía su pureza:', 0);
// R2-18
A.R('ver `REVISION-CODEX-2026-10-31.md` para las rondas, lo que se aceptó, lo que se rechazó y los desacuerdos.', 'ver `REVISION-CODEX-2026-10-31.md` (rondas, lo aceptado, lo rechazado y los desacuerdos) y las respuestas originales en `research/auditoria-adversarial-2026-10-31/codex/`.');
O.save(); A.save();
console.log(fallos.length ? 'NO ENCONTRADOS:\n' + fallos.join('\n') : 'todo aplicado');
