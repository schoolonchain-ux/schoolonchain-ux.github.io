# Revisión independiente (ronda 6)

Revisor hostil: busca errores, no apruebes. Tus rondas 1-5 están en `research/auditoria-adversarial-2026-10-31/codex/`. Después de la ronda 5 el propietario pidió cinco trabajos que **no has visto**; ya están commiteados (a3e57a4). Solo lectura, cálculos en memoria, sin red. No escribas en ningún fichero del repositorio.

Qué se hizo (registro en `docs/auditoria-adversarial-2026-10-31/REVISION-CODEX-2026-10-31.md`, sección «Trabajos pedidos por el propietario (1-nov-2026)»):

1. `atribucion.cjs`: la lista de billeteras con ventana previa (`resultados/preventana-tramo1.json`) salía vacía; ahora se calcula desde las salidas de los remitentes (112 billeteras). Comprueba que la condición usada (`e.v >= SEGUIR` y `e.at < rw.desde - 120000`) es coherente con cómo `prueba-preventana.cjs` y `rellenar-hueco.cjs` definían el hueco, y que los resultados de atribución no cambian de verdad. Copias de lo anterior en `respaldo-antes-de-arreglar/`.
2. `reproducir-tramo2.cjs`: repetición sin red del guion original del 2.º tramo. Comprueba que de verdad bloquea la red, que no escribe en disco y que compara contra `traza-post-resultado.json` publicado.
3. Rastreo a fondo del reparto posterior a la foto: `traza-tramo3.cjs` (rastreador), `analisis-tramo3.cjs` (análisis), datos en `tramo3/` (`tramo3-cache.json`, `tramo3-resultado.json`, `tramo3-swaps.json`, `t3.json`). Semillas: los 353 envíos de TRBdWq… hasta las 10:11:59 del 31-oct (58,65 M$). Lectura hasta las 17:20:18 UTC del 31-oct (`t3.json`). Resultado: 3.918 billeteras, nivel máximo 42, 0 lecturas fallidas; nodos 46,63 M$, USDD 7,46, préstamo 2,43, puente 0,19, casa 0,004, retenido 3,62; suma 60,33 M$ sobre 58,65 de entrada (declarado como defecto de conservación).
   - Revisa la lógica de reanudación de `traza-tramo3.cjs` (hubo un fallo propio: los saltos a través de cambios ya decodificados no volvían a la cola; corregido; copia previa en `respaldo-antes-de-arreglar/traza-tramo3.antes-reanudacion.cjs`). ¿Quedan billeteras alcanzadas que no se leen, o se cuentan dos veces?
   - ¿El análisis respeta el corte T3 (no cuenta movimientos posteriores) y excluye bien semillas y depósitos?
   - ¿Hay doble conteo entre las aristas «directas» y las «virtuales» a través de cambios (swaps)?
4. Figuras redibujadas (`research/auditoria-adversarial-2026-10-31/figuras/`, salida en `docs/grafos-revisados/*.svg`): comprueba las cifras nuevas escritas en `g1-mapa-general.cjs`, `g2-custodia-tron.cjs` y `g3-blanqueo-tron.cjs` contra `tramo3/tramo3-resultado.json` y `trb-posfoto-envios.json`.
5. HTML revisado (`docs/articulos/ARTICULO-COMPLETO-ROBO-BINANCE-2026-10-31-REVISADO.html`): párrafo y tabla «Rastreo a fondo (tramo 3)» en el apartado «Lo que ha pasado desde la foto»; resumen de las 109,4 M$; hoja `AUD Tramo 3` del Excel revisado; filas nuevas de la tabla de diferencias.

Pide, en este orden:
- Objeciones **MATERIALES** nuevas (cifras mal trasladadas, contradicciones entre A=`docs/auditoria-adversarial-2026-10-31/*.md`, H=HTML y X=Excel, conclusiones sin respaldo, errores de lógica en los scripts, clases mal asignadas). Si no hay materiales, escribe literalmente «sin objeciones materiales» y enumera lo que no pudiste comprobar. No rellenes con objeciones de estilo.
- Si hay algo en lo que afirmo que el rastreo «llega a nodos» y eso se presenta como destino final, dímelo.
- Si el texto de H sobre el solape con los tramos 1 y 2 es honesto con lo que no se midió.

Formato: `R6-nn · gravedad · qué afirma (cita + archivo) · por qué está mal · cómo lo comprobaste · qué corregirías`; al final «comprobé y cuadra» y «no pude comprobar».
