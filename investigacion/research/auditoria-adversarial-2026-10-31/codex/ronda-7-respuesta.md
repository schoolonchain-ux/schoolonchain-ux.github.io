Encontré **dos objeciones materiales nuevas** y dos correcciones de publicación aún incompletas. Revisión sin red, sin escrituras y con cálculos en memoria.

**R7-01 · Media · La ampliación de ventanas sigue incompleta para `via` ya decodificados.**

- **Qué afirma:** R6-01 se considera corregida. Sin embargo, [traza-tramo3.cjs:129](/C:/EquipoIA/research/auditoria-adversarial-2026-10-31/traza-tramo3.cjs:129) solo devuelve esos destinos a la cola cuando `!proc.has(v.a)`.
- **Por qué está mal:** si la receptora ya está procesada y el salto guardado precede a su ventana, esa rama no solicita ampliarla. Las ramas de salidas directas y cambios recién decodificados sí contemplan ese caso.
- **Cómo lo comprobé:** ejecuté el rastreador en memoria con una caché mínima: semilla→A y semilla→B; A conserva un cambio decodificado hacia B en `1000000`, pero B tiene `desde=2000000`. La reanudación termina con **0 lecturas y el hueco intacto**, anterior a `desde−120000`. **La caché publicada actual no presenta ese hueco:** mi cruce completo da cero.
- **Qué corregiría:** aplicar también en esta rama la condición de llegada anterior a la ventana y acumular la fecha mínima. R6-01 está cerrada para los datos actuales, pero no completamente para la lógica de reanudación.

**R7-02 · Media · H asigna 51,15 M$ a seis nodos que suman 49,55 M$.**

- **Qué afirma:** «Los nodos que absorben 51,15 M$ (el grupo del 11-oct y TM8uy…) son […] semillas del segundo», [H:628](/C:/EquipoIA/docs/articulos/ARTICULO-COMPLETO-ROBO-BINANCE-2026-10-31-REVISADO.html:628).
- **Por qué está mal:** esos seis nodos suman **49.550.635,33 $**. Los otros **1.595.718,84 $** corresponden a TZG47…, TRsqzn… y TKfz7…, que no son esas semillas. La propia tabla de H muestra los nueve nodos.
- **Cómo lo comprobé:** sumé `fin.nodo` por dirección en `tramo3-resultado.json` y contrasté las seis semillas de `traza-post.cjs`.
- **Qué corregiría:** «De los 51,15 M$ registrados en nodos, 49,55 M$ corresponden al grupo del 11-oct y TM8uy…, destinos del primer tramo y semillas del segundo; otros nodos reciben 1,60 M$». Mantendría la advertencia de solape monetario no medido.

Además, **no daría por cerradas íntegramente estas dos correcciones anteriores**; no las cuento como objeciones nuevas:

- **R6-02, parcial:** H, la tabla de diferencias, X y la figura 2/4 incorporan el polvo. La **portada sigue diciendo únicamente «el modelo suma 6,2 M$ de más»**, sin identificar ese subtotal ni añadir los **7,7 M$ con polvo**: [generador:43](/C:/EquipoIA/research/auditoria-adversarial-2026-10-31/figuras/g1-mapa-general.cjs:43), trasladado al SVG publicado y a H.
- **R6-03, parcial:** el comentario del reproductor describe correctamente sus escrituras, pero [REVISION-CODEX:96](/C:/EquipoIA/docs/auditoria-adversarial-2026-10-31/REVISION-CODEX-2026-10-31.md:96) conserva «sin red y sin escribir en disco». Debe precisar que captura las escrituras del análisis original y guarda su propio resultado.

**comprobé y cuadra**

- Ventanas: con salidas directas y `via` ≥3.520 $, obtengo **78 billeteras y 147 llegadas anteriores** en la caché anterior, frente a **0 en la actual**. Esto reproduce tu criterio.
- Cobertura actual: **4.482 direcciones = semilla + 4.481 billeteras**, nivel máximo 70, cero lecturas fallidas o parciales y ninguna billetera conocida alcanzada sin leer.
- Reanudación actual: cero consultas, cero lecturas nuevas, mismas direcciones y `rec` idéntico. Añade **12.448 registros a `term.entradas`**; ese registro interno contiene duplicados, pero el análisis no los suma y no alteran los importes publicados.
- Reproduje todos los campos del resultado, salvo la fecha de generación, interceptando las escrituras. El corte **T3 = 31-oct, 17:20:18.307 UTC** se aplica a entradas, salidas y `via`. Las **3.541 aristas terminales** no contienen duplicados ni movimientos posteriores a T3.
- Totales: nodos **51,146354 M$**, USDD **7,509612**, préstamo **2,428091**, puente **0,194386**, casa **3.520 $**, retenido **3,596248 M$**.
- Conciliación: terminales + retenido **64.878.211,50 $**; con polvo **66.371.300,49 $**; entrada **58.654.737,43 $**. Excesos respectivos: **6.223.474,07 $** y **7.716.563,06 $**.
- **R6-04:** las clases están presentes y correctas en H y en `AUD Tramo 3!A2:A15` de :codex-file-citation{path="C:/EquipoIA/docs/articulos/CATALOGO-COMPLETO-ROBO-BINANCE-2026-10-31-REVISADO.xlsx" purpose="source" artifact_kind="workbook" sheet="AUD Tramo 3" range="A1:I15"}.
- **R6-05:** corregidas las dos formulaciones señaladas. **R6-06:** correcta la distinción entre destinos del primero y semillas del segundo, con la contradicción cuantitativa descrita en R7-02.
- H explica la ampliación de cobertura y declara honestamente el mayor descuadre como defecto contable del modelo, sin presentarlo como pérdida económica demostrada.

**no pude comprobar**

- Autenticidad e integridad de las respuestas de cadena, movimientos omitidos por las fuentes y validez independiente de las clasificaciones.
- Solape monetario entre tramos, titularidades, destino económico final y saldos reales a T3.
- Apariencia, recortes y legibilidad de las figuras; presentación y comportamiento nativo del Excel.