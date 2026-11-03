'use strict';
// Parche 6 (1-nov): incorpora a los generadores de la auditoría lo hecho a petición del propietario:
// lista de ventana previa corregida (O-04), reproducción personal del 2.º tramo (O-19), rastreo a fondo del reparto posterior a la foto (tramo 3)
// y figuras revisadas. Solo edita los generadores; los datos originales no se tocan.
const fs = require('fs');
const base = 'C:/EquipoIA/research/auditoria-adversarial-2026-10-31/';
const fallos = [];
function parchear(fichero, pares) {
  let s = fs.readFileSync(base + fichero, 'utf8');
  for (const [a, b] of pares) { const n = s.split(a).length - 1; if (n !== 1) { fallos.push(fichero + ' (' + n + ') · ' + a.slice(0, 90)); continue; } s = s.replace(a, () => b); }
  fs.writeFileSync(base + fichero, s);
}

// ---------------- objeciones.cjs ----------------
parchear('objeciones.cjs', [
  ["Para 123 billeteras había entradas y salidas anteriores", "Para 112 billeteras (lista regenerada el 1-nov; antes se citaban 123 y esa lista se había sobrescrito) había entradas y salidas anteriores"],
  ["faltan: 'Relectura completa de las 123 billeteras.'", "faltan: 'Relectura completa de las 112 billeteras sin el filtro de importe.'"],
  ["Nota de reproducibilidad: la lista de billeteras con ventana previa que usan prueba-preventana.cjs y rellenar-hueco.cjs fue sobrescrita por una reejecución posterior de atribucion.cjs (hoy es []); los resultados guardados son de la ejecución anterior.",
   "Corrección del 1-nov: atribucion.cjs dejaba preventana-tramo1.json vacío (la variable preVentanaPorW nunca se asignaba); ahora la calcula desde las salidas de los remitentes y la lista tiene 112 billeteras (297 entradas, 13,99 M$ brutos, 13,77 M$ manchados). rellenar-hueco.cjs ahora pagina (200 por página, hasta 10 páginas) y da el mismo resultado: 22 aristas, 1.302.209 $ brutos, 0 a casas de cambio, 0 incompletas. Los resultados de atribución no cambian. No he podido comprobar por qué antes se citaban 123 billeteras: esa lista se perdió. Copias de lo anterior en respaldo-antes-de-arreglar/."],
  ["Esta reproducción la hizo Codex; yo no la he repetido. Confirma el cálculo", "Esta reproducción la hizo Codex y la repetí yo personalmente el 1-nov con reproducir-tramo2.cjs (guion original traza-post-analisis.cjs, misma caché, sin red y sin escribir en disco): 0 llamadas de red, todos los campos iguales (casas 4.153.525,16; nodos 22.809.101,90; retenido 21.004.188,78; 2.898 billeteras; diferencia máxima de pureza 0). Confirma el cálculo"],
  ["faltan: 'Que yo repita la ejecución del guion original para confirmarla por segunda vía.'", "faltan: 'Nada sobre el cálculo; la validez económica del modelo es otra cuestión (ver la comparativa de modelos).'"],
]);

// ---------------- armar-entregables.cjs ----------------
parchear('armar-entregables.cjs', [
  ["'123 billeteras; 20 aristas nuevas (1,00 M$ brutos; otras 2 ya estaban en las salidas originales); 0 a casas de cambio; encontrado bajo filtros, sin tope demostrado'", "'112 billeteras (lista regenerada el 1-nov; antes se citaban 123); 20 aristas nuevas (1,00 M$ brutos; otras 2 ya estaban en las salidas originales); 0 a casas de cambio; encontrado bajo filtros, sin tope demostrado'"],
  ["'Cerrado: el segundo tramo es reproducible con el guion original (la reproducción la hizo Codex).'", "'Cerrado: el segundo tramo es reproducible con el guion original (lo hizo Codex y lo repetí yo el 1-nov sin red: todos los campos iguales).'"],
  ["lo reproduce exactamente el guion original (Codex lo ejecutó; yo no lo he repetido) (O-19)", "lo reproduce exactamente el guion original (Codex lo ejecutó y yo lo repetí el 1-nov sin red: todos los campos iguales) (O-19)"],
  ["'Segundo tramo: la diferencia con mi adaptación está resuelta (era mía); queda pendiente que yo repita la ejecución del guion original `traza-post-analisis.cjs` (Codex ya lo hizo dos veces con el mismo resultado) (O-19).'", "'Segundo tramo: resuelto; el guion original `traza-post-analisis.cjs` lo ejecutó Codex dos veces y yo una vez (1-nov, `reproducir-tramo2.cjs`, sin red): mismo resultado en todos los campos (O-19). Queda la validez económica del modelo, no el cálculo.'"],
  ["'Releer las 123 billeteras con ventana previa incompleta (O-04).'", "'Releer sin filtro de importe las 112 billeteras con ventana previa incompleta (O-04); el relleno ya pagina y no cambió el resultado.'"],
  ["'Los ≈ 58,7 M$ repartidos entre la foto y las 10:11:59 del 31-oct (60,7 M$ hasta las 10:28:48; solo primer salto) siguen sin rastrear a fondo.'", "'Reparto posterior a la foto: rastreado a fondo hasta las 17:20 UTC del 31-oct para los envíos hasta las 10:11:59 (58,65 M$). Faltan por rastrear los 10 envíos de 10:12 a 10:28:48 (2,0 M$) y todo lo movido después de las 17:20 UTC; los nodos que absorben 46,6 M$ son ya destinos del segundo tramo y no se ha medido el solape.'"],
  // aviso R1-10 de LEEME: ya corregido
  [" Aviso (Codex R1-10): `atribucion.cjs` vuelve a escribir `resultados/preventana-tramo1.json` y, tal como está, lo deja en `[]`; los resultados de `prueba-preventana.cjs` y `rellenar-hueco.cjs` guardados proceden de una ejecución anterior con la lista original, que ya no se regenera con esta receta. No lo he corregido: queda como pendiente.\\n');",
   " Corrección del 1-nov (Codex R1-10): `atribucion.cjs` ya regenera `resultados/preventana-tramo1.json` (112 billeteras). Scripts añadidos el 1-nov: `reproducir-tramo2.cjs` (repite sin red el guion original del 2.º tramo), `traza-tramo3.cjs` y `analisis-tramo3.cjs` (rastreo a fondo del reparto posterior a la foto, datos en `tramo3/`), `diag-lectura.cjs` (diagnóstico de lecturas fallidas) y `precio-trx-y-ventas.cjs` (precio de TRX frente a lo enviado a intercambios). Reanudar `traza-tramo3.cjs` ya reintenta también las billeteras alcanzadas a través de cambios (antes no).\\n');"],
]);
console.log(fallos.length ? 'NO ENCONTRADOS:\n' + fallos.join('\n') : 'parche aplicado');
