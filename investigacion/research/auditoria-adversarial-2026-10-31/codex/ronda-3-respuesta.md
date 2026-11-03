**Siguen existiendo objeciones materiales.** Las correcciones no están completas, aunque la regeneración es coherente: los textos generados y las 12 hojas «AUD …» coinciden con el generador actual. Los problemas restantes están en el contenido y en algunas etiquetas del Excel.

Trabajé sin red ni escrituras, con lecturas y cálculos en memoria.

Referencias: [A: auditoría](C:/EquipoIA/docs/auditoria-adversarial-2026-10-31/AUDITORIA-ADVERSARIAL-ROBO-BINANCE-2026-10-31.md), [H: HTML](C:/EquipoIA/docs/articulos/ARTICULO-COMPLETO-ROBO-BINANCE-2026-10-31-REVISADO.html), [C: comparativa](C:/EquipoIA/docs/auditoria-adversarial-2026-10-31/COMPARATIVA-MODELOS-ATRIBUCION-2026-10-31.md), [D: diferencias](C:/EquipoIA/docs/auditoria-adversarial-2026-10-31/TABLA-DIFERENCIAS-2026-10-31.md), [V: decisiones](C:/EquipoIA/docs/auditoria-adversarial-2026-10-31/REVISION-CODEX-2026-10-31.md), [O: objeciones.cjs](C:/EquipoIA/research/auditoria-adversarial-2026-10-31/objeciones.cjs).

X = :codex-file-citation{path="C:/EquipoIA/docs/articulos/CATALOGO-COMPLETO-ROBO-BINANCE-2026-10-31-REVISADO.xlsx" artifact_kind="workbook" purpose="source"}

**R3-01 · alta · La verificación de movimientos y bloqueos se extiende injustificadamente a la premisa del robo.**

- **Qué afirma:** «Aguanta (VERIFICADO): el robo en dos cadenas» — A:7; «Lo que aguanta (VERIFICADO) […] El robo en dos cadenas» — H:43.
- **Por qué está mal:** las transferencias, la proximidad temporal y las restricciones de los emisores no prueban por sí mismas que las salidas fueran no autorizadas ni que ambos conjuntos correspondan al mismo incidente. Un bloqueo tampoco identifica su motivo. El [informe original aportado](C:/EquipoIA/research/binance-0x5227-2026-10-30/informe-equipoia-original.txt:51) advertía expresamente: «Los informes no incluyen ninguna fuente sobre ese incidente».
- **Cómo lo comprobé:** contrasté esa advertencia con las pruebas de custodia y congelaciones guardadas y con el alcance declarado de la auditoría. No encontré en el material examinado una confirmación independiente del incidente que cierre ese salto.
- **Qué corregiría:** separar **movimientos y bloqueos verificados sobre los datos guardados** de **atribución al incidente**, tratada como premisa contextual pendiente de una fuente identificada. No estoy afirmando que no hubiera robo; estoy refutando que estas pruebas lo verifiquen.

**R3-02 · alta · El regreso ejecutado por THORChain continúa afirmado fuera del resumen corregido.**

- **Qué afirma:** «una de ellas lo devuelve a TRON» — H:220; «el regreso a TRON por THORChain» — H:882; «El regreso a TRON por THORChain» — H:890.
- **Por qué está mal:** contradice el resumen corregido de H:37, que reconoce que son solicitudes y que la ejecución individual no está enlazada. La coincidencia agregada con UniversalRouter no establece ese regreso.
- **Cómo lo comprobé:** búsqueda de todo H excluyendo SVG y tablas; contraste con los 1.600 registros de `thorchain-decodificado.json` y la comparación agregada guardada.
- **Qué corregiría:** sustituir también esos tres textos por «solicitudes con destino en TRON». La cautela posterior no elimina la afirmación positiva anterior.

**R3-03 · media · Sobrevive la causa incorrecta «movimientos <350 $».**

- **Qué afirma:** «Datos insuficientes para: retenido por simulación (movimientos <350 $ no guardados)» — C:5.
- **Por qué está mal:** vuelve a atribuir el problema a esa causa, mientras A:46 explica que el simulador descarta transferencias conocidas inferiores a 3.520 $ antes de acreditarlas y que el desglose causal sigue pendiente.
- **Cómo lo comprobé:** búsqueda exhaustiva de los Markdown y lectura de `simular()`. El literal procede de `armar-entregables.cjs:78`.
- **Qué corregiría:** usar la misma formulación limitada de A: «déficit de inventario causado en parte por los filtros del simulador; desglose pendiente». **R2-03 no está cerrada.**

**R3-04 · media · La coordinación sigue convertida en hecho en un título y una conclusión.**

- **Qué afirma:** «aprovisionamiento coordinado sí» — A:129 y O:118; «está aprovisionado de forma coordinada desde el 8–11 oct» — H:1181. El título también aparece en X, `AUD Objeciones!E12`.
- **Por qué está mal:** el cuerpo de O-11 clasifica correctamente la coordinación como hipótesis, pero estos textos la dan por establecida. Las fechas próximas acreditan proximidad temporal; falta distinguir coordinación de otros mecanismos de creación y fondeo.
- **Cómo lo comprobé:** contraste entre título, cuerpo, clasificación, conclusión de H y celda del Excel.
- **Qué corregiría:** «creación y fondeo próximos en el tiempo; coordinación inferida». Los **84 segundos** ya están corregidos en D.

**R3-05 · media · La pureza calculada todavía se usa para identificar dinero de otros propietarios.**

- **Qué afirma:** «el grupo, que ya mezcla dinero ajeno» — H:614; «el grupo del 11-oct mezcla ya dinero ajeno (pureza del 65 al 81 %)» — H:626.
- **Por qué está mal:** una pureza inferior a uno identifica entradas que el modelo no atribuye al recorrido. No demuestra titularidad independiente: pueden ser fondos del mismo operador, rutas no seguidas o circulación repetida. Es el mismo salto que se retiró en la cautela de Ethereum.
- **Cómo lo comprobé:** búsqueda ampliada a las variantes «mezcla dinero ajeno» y «mezcla ya dinero ajeno», además del literal solicitado.
- **Qué corregiría:** «recibe entradas adicionales cuyo origen y titularidad no se han determinado». La corrección de R2-14 solo se trasladó al párrafo de Ethereum.

**R3-06 · media · El Excel reproduce datos, pero conserva etiquetas incompatibles con las correcciones.**

- **Qué afirma:** en X:
  - `AUD Nodos!Q3` y `Q8`: «(permiso por defecto)».
  - `AUD Nodos!G1:H1`: «Transf. USDT/día…».
  - `AUD THORChain pedido-recibido!B1`: «Pedido $ (memos)».
  - `AUD Sin leer!B4:B9`: direcciones bajo el encabezado «Carteras sin leer», que en B2:B3 contiene conteos.
- **Por qué está mal:** ausencia de permisos utilizables no equivale a permiso por defecto; la intensidad extrapolada no es conteo diario; el valor de entrada no es importe pedido de salida; y la última columna mezcla conteos con identificadores sin distinguir resumen y detalle.
- **Cómo lo comprobé:** inspección de todas las celdas «AUD», comparación con los JSON y reconstrucción del libro enteramente en memoria. Es exactamente lo que genera `armar-entregables.cjs:109,113–114`.
- **Qué corregiría:** «sin cobertura verificable» en Q3/Q8; encabezados de intensidad y valor de entrada; separar «Número de cuentas» de «Dirección». No encontré un desplazamiento accidental general de celdas, pero **sí esta asignación semántica incorrecta**.

**R3-07 · media · «VERIFICADO» todavía agrupa conteos observados con importes atribuidos.**

- **Qué afirma:** O-05 sigue con `clase: 'VERIFICADO'` — O:51, A:65 y X `AUD Objeciones!C6`; H:43 incluye bajo VERIFICADO los 10,67 M$ atribuidos y, en el bloque del solapamiento, «JustLend […] ≈ 4,75 M$».
- **Por qué está mal:** los conteos y el solapamiento se pueden verificar; esos importes dependen de purezas. La mención del modelo dentro del párrafo ayuda, pero no satisface la separación aceptada en R2-16.
- **Cómo lo comprobé:** revisé las 20 clases y su traslado a A, H y X. O-14 **sí** pasó correctamente a ESTIMADO.
- **Qué corregiría:** clasificar por subafirmación: conteos/brutos observados, VERIFICADO sobre los datos guardados; importes atribuidos, ESTIMADO. No rebajaría indiscriminadamente todas las filas que contienen cálculos: verificar una reproducción es distinto de verificar procedencia económica.

**R3-08 · media · La cifra del residuo omite una condición que duplica aproximadamente el resultado.**

- **Qué afirma:** «con el retenido de cada modelo el residuo sale ≈ 0,5 M$» — A:78, O:65 y X `AUD Objeciones!G7`.
- **Por qué está mal:** solo describe la hipótesis predeterminada. Con entradas desconocidas limpias queda aproximadamente **0,92–0,97 M$**.
- **Cómo lo comprobé:** reejecuté `atribucion.cjs` en memoria, interceptando las escrituras. Apliqué `reparto − terminales − polvo − retenido`:
  - Predeterminada: **457.957,31–521.327,12 $**.
  - `--hip=limpio`: **921.521,84–970.864,37 $**.
- **Qué corregiría:** añadir explícitamente ambas condiciones y rangos. Esta salvedad ya figuraba al final de mi ronda 2, aunque no como objeción numerada.

**R3-09 · media · El tramo posterior a la foto mezcla cortes horarios y magnitudes.**

- **Qué afirma:** «22:41 […] → 10:11», «363 envíos por 60,7 M$ (166,2 M TRX) a 51 billeteras» — H:622. El resumen H:35 mantiene 58,5 M$ posteriores. A las preguntas abiertas también se trasladan 58,5 M$.
- **Por qué está mal:** esas magnitudes no corresponden al mismo corte. Además, 166,2 M TRX a 0,352 $ no son 60,7 M$.
- **Cómo lo comprobé:** sumé los registros de `trb-posfoto-envios.json`:
  
  | Corte | Envíos | Destinos | TRX | Valor a 0,352 $ |
  |---|---:|---:|---:|---:|
  | Hasta 10:11:59 | 353 | 49 | 166.632.776,781761 | 58.654.737,43 $ |
  | Hasta 10:28:48 | 363 | 51 | 172.333.715,722032 | 60.661.467,93 $ |

  La hoja original preservada `Reparto TRBdWq` también etiqueta movimientos de las 10:24–10:28 como «hasta 10:11».
- **Qué corregiría:** elegir un corte y regenerar todas sus cifras y referencias. Como las hojas originales deben preservarse, documentaría su etiqueta errónea en una hoja AUD.

Estos últimos hallazgos no prueban que todos los errores se introdujeran en ronda 2. **No detecté una desincronización causada por la regeneración**; sí encontré correcciones parciales y defectos anteriores que sobreviven.

**Estado de las 18 objeciones de ronda 2**

| R2 | Resultado actual |
|---|---|
| 01 | **Corregida.** Reproduje el mínimo de préstamos: 4.782.972,082785 $. |
| 02 | **Corregida.** Se limita el contraste a saldo bruto de 25 cuentas; no valida procedencia. |
| 03 | **Incompleta:** C:5; R3-03. |
| 04 | **Corregida.** O-06 ya no presenta el hueco como ≤1,3 M$. |
| 05 | **Corregida.** Diagnóstico cerrado; repetición personal separada. |
| 06 | **Corregida en A/H.** Estrategias y rango observado, sin cota teórica. |
| 07 | **Corregida en prosa; incompleta en X:** G1:H1; R3-06. Las muestras siguen ausentes. |
| 08 | **Corregida la afirmación de servicio a terceros.** Persiste la inferencia de propiedad de R3-05. |
| 09 | **Incompleta:** título O-11 y H:1181; R3-04. |
| 10 | **Corregida en A/H; incompleta en X:** Q3/Q8; R3-06. |
| 11 | **Corregida en el respaldo guardado.** Ahora existe `remitentes-casas.json`; cuadran los metadatos y 41 entradas de 50 de TStv…. |
| 12 | **Corregido el papel no establecido de UniversalRouter.** Los «1,7 M de operaciones» siguen sin respaldo guardado identificado. |
| 13 | **Incompleta:** H:220,882,890; R3-02. |
| 14 | **Corregido el párrafo concreto; incompleta la limpieza general:** R3-05. |
| 15 | **Resuelta mediante nota explícita de sustitución.** Las figuras siguen sin corregir ni validar íntegramente. |
| 16 | **Incompleta:** O-14 corregida; persisten agrupaciones de R3-07. |
| 17 | **Límites y umbral bruto declarados correctamente.** H:47 conserva «Sin tope…», pero la aclaración inmediata enumera los límites efectivos. |
| 18 | **Corregida.** El documento existe. |

**Búsqueda exhaustiva de restos**

Las líneas siguientes son las **originales de los archivos**, conservadas al excluir SVG y tablas de H. L = `LEEME.md`. Una coincidencia no implica un error: distingo citas históricas, negaciones y hashes.

| Búsqueda | Todas las líneas con coincidencias |
|---|---|
| `cota` | A:72,156; C:5; D:15; V:22,42. Negaciones o registro histórico. |
| `validó` | Ninguna. |
| `350 $` | A:46; C:5; V:16,39. **C:5 sigue siendo afirmación incorrecta**; las demás explican su retirada. |
| `1,3 M$` | V:40, cita histórica retirada. |
| `demostrado` | A:36,39,61,74,134,140; D:10,14; H:48,626. No encontré aquí una afirmación positiva de coordinación demostrada. |
| `servicio a terceros` | A:138; D:18; V:44. Marcado como hipótesis. |
| `devuelve/vuelve` | A:121; L:18; V:49; H:47,220,607,1109. **H:220 es el resto material de THORChain**; A:121 cita lo que afirmaba el informe, y las demás coincidencias tienen otros sentidos. |
| `mezclan dinero ajeno` | V:50; H:43,893. Son citas retiradas. **Las variantes positivas sobreviven en H:614,626.** |
| `robusto` | Ninguna. |
| `casi igual` | Ninguna. |
| `423` | A:9,72,100,200; D:15; V:29; H:36,43,367,1182. Conteos correctos; A:100 y H:367 coinciden dentro de un hash. |
| `118` | A:166; D:9. Referencias al doble conteo retirado. |
| `4,81` | A:8,25,166; V:37. Retirada del total antiguo o extremo correcto del escenario limpio. |

**Comprobé y cuadra**

- **Originales congelados:** los SHA-256 del HTML y Excel coinciden con `SHA256SUMS.txt`.
- **Preservación del Excel:** las 24 hojas originales conservan el contenido de **116.495 celdas**, sin diferencias en valores, tipos, fórmulas, enlaces o comentarios frente al :codex-file-citation{path="C:/EquipoIA/docs/articulos/ORIGINAL-INTACTO/CATALOGO-COMPLETO-ROBO-BINANCE-2026-10-31.ORIGINAL.xlsx" artifact_kind="workbook" purpose="source"}. Hay diferencias en metadatos de anchura de columnas de 23 hojas; no afirmo identidad visual o binaria.
- **Regeneración:** los cinco Markdown generados y H coinciden exactamente con una ejecución interceptada en memoria. Las 12 hojas AUD coinciden celda a celda con el generador.
- **Integridad de celdas:** no encontré `undefined`, `NaN`, números no finitos ni celdas de error. Las diez aristas principales coinciden con el CSV en hash, remitente, destino, pureza y bruto redondeado.
- **USDT0:** 186 hashes de origen únicos y 183 hashes de destino únicos. Enviado: **8.003.291,035755 USDT**; recibido en los 183 registros: **7.843.785,698263**; diferencia de los entregados: **2.284,847729**. Los 183 constan exitosos; emisores registrados: 165 USDT Ethereum y 18 USDT0 Arbitrum. Hashes, cadenas, destinos e importes enviados coinciden con los datos decodificados.
- **THORChain:** cuadran los 1.600 registros y **11.813.818,73915 $ de entrada**. Las 11 agrupaciones del Excel cuadran tras normalizar el sufijo `/…` de los memos.
- **TG5iBMQ…:** la conciliación completa en memoria, incluyendo polvo, deja **0,032011 TRX**, igual al saldo guardado. No encontré un error material en su aritmética. Eso verifica movimientos y saldo, no autorización ni identidad.
- **Sesgos ya reconocidos:** la selección de las 25 cuentas por discrepancia, la circularidad del porcentaje del recorrido y la incapacidad del muestreo para detectar cuentas no leídas están declaradas. La estabilidad entre cinco estrategias sigue condicionada al mismo grafo y sus clases; no constituye una validación independiente del grafo.

**No pude comprobar**

- Autenticidad y estado actual de la cadena sin red; el contraste de esta ronda utiliza archivos guardados.
- Confirmación independiente del incidente, su carácter no autorizado y la unidad del supuesto robo entre cadenas.
- Ejecución individual de THORChain y procedencia económica de sus recepciones.
- Recibos USDT0 completos mediante una nueva lectura y decodificación independiente: comprobé los campos y contratos conservados en los resultados.
- Serie diaria desde eventos originales, permisos de las dos cuentas sin cobertura, ni los «1,7 M de operaciones» de UniversalRouter.
- Precio histórico de TRX, propietarios, saldos y eventos jUSDT, cobertura de movimientos omitidos y cada literal de las figuras.
- Apariencia del Excel en una aplicación nativa, recortes visuales o efecto de las anchuras de columna.