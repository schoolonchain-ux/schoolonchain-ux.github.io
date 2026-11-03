Encontré **seis objeciones materiales nuevas**. Revisión sin red, sin escrituras y con cálculos en memoria.

**R6-01 · Alta · Ventanas incompletas pese a «0 lecturas fallidas».**  
**Qué afirma:** «Leí 3918 billeteras […] sin lecturas fallidas», [H:628](C:/EquipoIA/docs/articulos/ARTICULO-COMPLETO-ROBO-BINANCE-2026-10-31-REVISADO.html:628).  
**Por qué está mal:** el conteo es correcto, pero oculta un fallo adicional de cobertura: **72 billeteras tienen 141 entradas conocidas anteriores a su ventana**, por **6.534.936,56 $ brutos**, ausentes de sus entradas guardadas.  
**Cómo lo comprobé:** crucé cada salida con `rec[destino].desde - 120000` y con las entradas de la receptora. Por ejemplo, `TSGCcr6…` recibió 177.548,01 $ a las **23:53:15**, pero su lectura empieza a las **00:49:18**. El [rastreador:112](C:/EquipoIA/research/auditoria-adversarial-2026-10-31/traza-tramo3.cjs:112) reutiliza cualquier lectura correcta; no la amplía al descubrir llegadas anteriores.  
**Qué corregiría:** invalidar y ampliar esas ventanas, reconstruir el recorrido y recalcular. Mientras tanto, declarar este hueco junto a los resultados: cero fallos de petición no equivale a cobertura temporal completa.

**R6-02 · Media · El exceso declarado omite el polvo.**  
**Qué afirma:** «el modelo reparte 1,68 M$ de más», H:628, [A:97](C:/EquipoIA/docs/auditoria-adversarial-2026-10-31/REVISION-CODEX-2026-10-31.md:97) y `AUD Diferencias!C19`.  
**Por qué está mal:** esa cifra corresponde únicamente a terminales más retenido. El modelo también contabiliza **1.288.432,17 $ de polvo**, omitidos de la conciliación presentada.  
**Cómo lo comprobé:** terminales + retenido = **60.333.917,89 $**; añadiendo polvo = **61.622.350,07 $**, frente a **58.654.737,43 $** de entrada: descuadre contable de **2.967.612,64 $**.  
**Qué corregiría:** mostrar el polvo y ambos subtotales en A/H/X y figuras. No presentar ninguno de estos descuadres como pérdida económica demostrada.

**R6-03 · Media · El reproductor sí escribe en disco.**  
**Qué afirma:** «SIN escribir en disco», [reproducir-tramo2.cjs:2](C:/EquipoIA/research/auditoria-adversarial-2026-10-31/reproducir-tramo2.cjs:2), repetido en A.  
**Por qué está mal:** conserva `fs.writeFileSync` como `escrituraReal` y lo usa al terminar para guardar `resultados/reproduccion-tramo2.json`; también ejecuta `mkdirSync`.  
**Cómo lo comprobé:** inspección de las líneas 34–35. Separadamente ejecuté el análisis original con escrituras interceptadas y red bloqueada: reproduce los resultados publicados.  
**Qué corregiría:** eliminar esas escrituras o describir exactamente la excepción. La reproducción numérica queda confirmada; la afirmación de ausencia de escrituras, refutada.

**R6-04 · Media · Se pierde la clasificación de todos los destinos en H/X.**  
**Qué afirma:** la tabla del tramo 3 ofrece una columna «Clase».  
**Por qué está mal:** H muestra **`[object Object]` en las 13 filas**; X deja vacías **`AUD Tramo 3!A2:A14`**. No permite distinguir nodos, USDD, préstamo, puente y casa.  
**Cómo lo comprobé:** inspeccioné HTML y XML del Excel. La causa está en [armar-entregables.cjs:15](C:/EquipoIA/research/auditoria-adversarial-2026-10-31/armar-entregables.cjs:15): `{ clase, ...x }` sobrescribe la categoría textual con el objeto `x.clase`.  
**Qué corregiría:** conservar ambos campos con nombres distintos y regenerar H/X usando la categoría textual.

**R6-05 · Media · Todavía se presentan nodos como destino final.**  
**Qué afirma:** «TZG47zhb8k… · **el mayor destino final**», [g3:33](C:/EquipoIA/research/auditoria-adversarial-2026-10-31/figuras/g3-blanqueo-tron.cjs:33), también publicado en SVG y H. H:628 introduce el reparto con «**el dinero acaba en**».  
**Por qué está mal:** son puntos donde se detiene el rastreo. La advertencia posterior de H lo reconoce, pero contradice esas formulaciones.  
**Cómo lo comprobé:** contraste entre las etiquetas publicadas, la regla de parada por clasificación como nodo y la propia advertencia de H.  
**Qué corregiría:** «mayor nodo receptor observado» y «el rastreo registra llegadas a».

**R6-06 · Media · La explicación del solape confunde destinos con semillas.**  
**Qué afirma:** «el grupo del 11-oct y TM8uy… ya eran **destinos del segundo tramo**», H:628.  
**Por qué está mal:** esas seis direcciones son las **semillas del segundo tramo**; ninguna aparece entre sus destinos terminales publicados.  
**Cómo lo comprobé:** [traza-post.cjs:13](C:/EquipoIA/research/binance-0x5227-2026-10-30/traza-post.cjs:13) y `traza-post-resultado.json → fin.nodo`.  
**Qué corregiría:** distinguir destinos del primer tramo y puntos de partida del segundo. **Sí es honesto** declarar «no he medido el solape» y abstenerse de sumar; compartir direcciones no cuantifica movimientos ni importes compartidos.

**comprobé y cuadra**

- Ventana previa: **112 billeteras, 297 entradas y 13,99 M$ brutos**. El umbral de 3.520 $ y los 120 segundos corresponden al inicio efectivo de lectura. El relleno llega hasta `desde`, por lo que incluye una zona ya leída; las dos aristas existentes están declaradas.
- Los resultados anteriores y actuales de atribución conservan los importes; cambian la fecha y los diagnósticos de ventana previa. Las 22 aristas del hueco conservan su contenido, con distinto orden.
- Tramo 2: totales, retenido y purezas idénticos al publicado; cero consultas necesarias durante mi ejecución bloqueada.
- Tramo 3: **3.919 direcciones alcanzadas = semilla + 3.918 billeteras**, todas con lectura correcta. El análisis reproduce exactamente los resultados publicados y aplica T3 a entradas, salidas y saltos virtuales.
- No encontré duplicados de transferencias entre salidas directas y virtuales ni entre las aristas terminales.
- Las cifras nuevas de las figuras concuerdan con los JSON, salvo la conciliación incompleta señalada: 353 envíos, 49 destinos, 58,65 M$ y acumulado de 109,43 M$; tercera receptora, 6,47 M$.

**no pude comprobar**

- Autenticidad e integridad de los datos de cadena, etiquetas y clasificación económica mediante fuentes independientes.
- Movimientos omitidos en las 72 ventanas: requieren nuevas lecturas; su efecto completo sobre los resultados sigue sin determinarse.
- Solape monetario entre el tramo 3 y los anteriores.
- Titularidades, destino final económico y saldos reales a T3.
- Apariencia y recortes de SVG/HTML o comportamiento nativo del Excel.