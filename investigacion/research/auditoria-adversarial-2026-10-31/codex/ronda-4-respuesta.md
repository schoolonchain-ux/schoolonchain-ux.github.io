**No están cerradas las nueve objeciones:** quedan restos de **R3-01, R3-05 y R3-09**. Las otras seis están corregidas. Revisión sin red, sin escrituras y con cálculos en memoria.

Referencias: [A: auditoría](C:/EquipoIA/docs/auditoria-adversarial-2026-10-31/AUDITORIA-ADVERSARIAL-ROBO-BINANCE-2026-10-31.md), [H: HTML revisado](C:/EquipoIA/docs/articulos/ARTICULO-COMPLETO-ROBO-BINANCE-2026-10-31-REVISADO.html), [D: diferencias](C:/EquipoIA/docs/auditoria-adversarial-2026-10-31/TABLA-DIFERENCIAS-2026-10-31.md), [P: preguntas](C:/EquipoIA/docs/auditoria-adversarial-2026-10-31/PREGUNTAS-ABIERTAS-2026-10-31.md).

X = :codex-file-citation{path="C:/EquipoIA/docs/articulos/CATALOGO-COMPLETO-ROBO-BINANCE-2026-10-31-REVISADO.xlsx" artifact_kind="workbook" purpose="source"}

**R4-01 · alta · R3-01 sigue incompleta en H**

- **Qué afirma:** «COMPROBADO El robo se ejecutó a la vez en dos cadenas» — [H:219](C:/EquipoIA/docs/articulos/ARTICULO-COMPLETO-ROBO-BINANCE-2026-10-31-REVISADO.html:219).
- **Por qué está mal:** sigue certificando el incidente y su ejecución conjunta, aunque A:7 y H:43 reconocen correctamente que el robo es una premisa sin fuente independiente incluida. Los movimientos y su proximidad temporal no cierran esa atribución.
- **Cómo lo comprobé:** recorrí la prosa completa de H excluyendo SVG y tablas; contrasté esta etiqueta con la salvedad añadida y la advertencia del informe original.
- **Qué corregiría:** limitar «COMPROBADO» a las transferencias y sus horas: primer envío observado en TRON a las 20:20; barrido en Ethereum desde las 20:24. Mantener la atribución al incidente como premisa.

**R4-02 · media · R3-05 conserva una de sus dos afirmaciones incorrectas**

- **Qué afirma:** «el grupo del 11-oct mezcla ya dinero ajeno (pureza del 65 al 81 %)» — [H:626](C:/EquipoIA/docs/articulos/ARTICULO-COMPLETO-ROBO-BINANCE-2026-10-31-REVISADO.html:626).
- **Por qué está mal:** una pureza inferior a uno no identifica propietarios distintos. Además, contradice H:614, ya corregido: «entradas cuyo origen y titularidad no se han determinado».
- **Cómo lo comprobé:** búsqueda de variantes de «dinero ajeno» y contraste de ambos párrafos. No es una cita histórica ni contenido de una figura.
- **Qué corregiría:** aplicar también en H:626 la formulación de H:614. A y las hojas AUD no conservan esta afirmación positiva.

**R4-03 · media · R3-09 corrige el detalle, pero deja cifras vigentes incompatibles en el resumen y las preguntas**

- **Qué afirma:** «ha repartido 109,3 M$ […] 58,5 M$ desde entonces» — [H:35](C:/EquipoIA/docs/articulos/ARTICULO-COMPLETO-ROBO-BINANCE-2026-10-31-REVISADO.html:35); «58,5 M$ […] hasta […] 10:11» — H:1174; «Los 58,5 M$ repartidos después de la foto» — [P:17](C:/EquipoIA/docs/auditoria-adversarial-2026-10-31/PREGUNTAS-ABIERTAS-2026-10-31.md:17) y X, `AUD Preguntas abiertas!B14`.
- **Por qué está mal:** 58,5 M$ no corresponde al redondeo de ninguno de los dos cortes. El resumen tampoco advierte que conserva una cifra sustituida. La nueva tabla sí identifica ese resumen antiguo en la columna «Original», pero la contradicción permanece en la prosa vigente.
- **Cómo lo comprobé:** sumé `trb-posfoto-envios.json` y contrasté también las 742 filas de `Reparto TRBdWq`:

  | Corte del 31-oct | Envíos posteriores | Destinos | TRX posteriores | Valor a 0,352 $ |
  |---|---:|---:|---:|---:|
  | 10:11:59 | 353 | 49 | 166.632.776,781761 | 58.654.737,43 $ |
  | 10:28:48 | 363 | 51 | 172.333.715,722032 | 60.661.467,93 $ |

  Incluyendo los **50.773.216,86 $ anteriores a la foto**, el total repartido es **109,43 M$** o **111,43 M$**, respectivamente.
- **Qué corregiría:** elegir y fechar el corte del resumen; actualizar también H:1174, P y `AUD Preguntas abiertas!B14`. Si se conservan cifras antiguas, advertirlo expresamente.

La **nueva fila de D:23 y `AUD Diferencias!C18:D18` cuadra**. El texto añadido en **H:622 también cuadra numéricamente**: 60,7 M$/172,3 M TRX para el corte tardío y 58,7 M$/166,6 M TRX para el temprano. Su encabezado todavía termina en 10:11, aunque el cuerpo aclara ambos cortes; lo incluyo en este mismo cierre pendiente, sin crear otra objeción.

Fuera de estos cierres pendientes: **sin objeciones materiales** nuevas.

**Estado de R3-01…R3-09**

| Objeción | Resultado |
|---|---|
| R3-01 | **Incompleta:** A y la salvedad de H corregidos; sobrevive H:219. |
| R3-02 | **Cerrada:** H:220,882,890 hablan de solicitudes; la ejecución individual sigue pendiente. |
| R3-03 | **Cerrada:** la comparativa ya atribuye parte del déficit a filtros del simulador, con desglose pendiente. |
| R3-04 | **Cerrada:** título O-11, `AUD Objeciones!E12` y H:1181 distinguen proximidad observada y coordinación inferida. |
| R3-05 | **Incompleta:** H:614 corregido; H:626 conserva «dinero ajeno». |
| R3-06 | **Cerrada:** etiquetas corregidas y resumen/detalle separados en X. |
| R3-07 | **Cerrada:** O-05 divide conteos/brutos y atribución; H distingue los importes ESTIMADOS. |
| R3-08 | **Cerrada:** A y X explicitan las dos hipótesis y sus rangos. |
| R3-09 | **Incompleta:** tabla y detalle correctos; resumen, límites y preguntas conservan 58,5 M$. |

**comprobé y cuadra**

- **Regeneración:** cinco Markdown y H coinciden exactamente con una ejecución interceptada en memoria. Las 13 hojas AUD coinciden en contenido con el generador; los blancos omitidos al guardar no constituyen diferencias.
- **Excel:** 37 hojas; las 24 originales conservan **116.495 celdas** sin diferencias de valores, tipos, fórmulas, enlaces o comentarios. No encontré celdas de error ni valores numéricos no finitos.
- **R3-06:** `AUD Nodos!G1:H1` distingue intensidad estimada de conteo; `Q3/Q8` indica falta de cobertura verificable; THORChain `B1` identifica valor de entrada; `AUD Sin leer` contiene los dos resúmenes y `AUD Sin leer mayores` las seis direcciones.
- **Residuos recalculados:** **457.957,31–521.327,12 $** con la hipótesis predeterminada y **921.521,84–970.864,37 $** con entradas desconocidas limpias.
- **Lecturas fallidas:** 81 + 342 registros, **420 direcciones únicas**.
- **Casas:** 249 aristas, **12.500.275,30 $ brutos**, **4.153.524 $ atribuidos**; filtros ≥0,5 y ≥0,75: **2.653.884 $** y **79.590 $**.
- **THORChain:** 1.600 registros y **11.813.818,73915 $ de entrada**; las 11 agrupaciones de X cuadran. El archivo nuevo respalda documentalmente los **1.716.846** registros de operaciones de UniversalRouter.
- **USDT0:** 186 envíos, 183 `DELIVERED`, tres `INFLIGHT`; **8.003.291,035755** enviados y **7.843.785,698263** recibidos.
- Los SHA-256 del HTML y Excel originales coinciden con `SHA256SUMS.txt`.

**no pude comprobar**

- Autenticidad, integridad y estado actual de la cadena; trabajé exclusivamente con archivos guardados.
- Confirmación independiente del robo, carácter no autorizado y unidad del incidente entre cadenas.
- Ejecución individual de THORChain y procedencia económica de las recepciones.
- Recibos USDT0 mediante una nueva obtención y decodificación independiente.
- Serie diaria desde las muestras originales no conservadas y permisos de las dos cuentas sin cobertura.
- Precio histórico de TRX, titularidades, saldos/eventos jUSDT y movimientos omitidos.
- SVG y tablas de H, excluidos del examen solicitado de su prosa; tampoco cada literal de las figuras.
- Apariencia del Excel en una aplicación nativa, recortes y efectos de anchuras de columna.