Encontré correcciones incompletas, afirmaciones todavía sobreclasificadas y **un error numérico de mi ronda 1** que debes corregir: el mínimo de préstamos con `--hip=limpio`.

Trabajé exclusivamente en memoria, sin red ni escrituras. Reejecuté los guiones mediante un entorno que interceptaba sus escrituras; en el segundo tramo sustituí los adaptadores de red por funciones bloqueadas. Esto comprueba los cálculos sobre los archivos guardados, no vuelve a verificar la cadena.

Referencias: **A** = [auditoría](C:/EquipoIA/docs/auditoria-adversarial-2026-10-31/AUDITORIA-ADVERSARIAL-ROBO-BINANCE-2026-10-31.md); **H** = [HTML revisado](C:/EquipoIA/docs/articulos/ARTICULO-COMPLETO-ROBO-BINANCE-2026-10-31-REVISADO.html); **R** = `research/auditoria-adversarial-2026-10-31/resultados/`; **D** = `research/binance-0x5227-2026-10-30/tron/`.

**R2-01 · media · El mínimo de préstamos con entradas desconocidas limpias es incorrecto.**  
**Afirma:** «préstamos a 4,79–4,81 M$» — A, O-01; `objeciones.cjs`.  
**Por qué está mal:** la mezcla móvil baja a **4.782.972,082785413 $**. Mi R1-05 omitió ese mínimo: el error procede de mi respuesta anterior, no de tu traslado.  
**Cómo lo comprobé:** ejecución de `atribucion.cjs tramo1 --hip=limpio`, manteniendo el código y los datos actuales e interceptando las escrituras.  
**Qué corregiría:** **4,783–4,812 M$**, o **4,78–4,81 M$** con dos decimales. Los resultados son:

| Modelo | Nodos, $ | Préstamos, $ |
|---|---:|---:|
| FIFO | 25.140.835,09858677 | 4.806.617,632560362 |
| LIFO | 25.080.650,448811054 | 4.793.022,495377314 |
| Mezcla móvil | 25.128.419,20610691 | 4.782.972,082785413 |
| Manchado primero | 25.491.775,6563476 | 4.812.333,841055646 |
| Limpio primero | 24.807.390,64842995 | 4.790.058,187642837 |

El rango de nodos trasladado sí cuadra.

**R2-02 · alta · Sigue publicada la validación del retenido que se había retirado.**  
**Afirma:** «El retenido del informe sí se validó contra saldos reales» — A, nota bajo la comparativa; «El retenido del informe se validó contra saldos reales» — H, revisión adversarial.  
**Por qué está mal:** contradice O-03 y la tabla de diferencias corregida. El contraste es del saldo **bruto implícito** de 25 cuentas seleccionadas, no de la atribución de 11,2 M$.  
**Cómo lo comprobé:** búsqueda completa de los cinco Markdown y del texto de H, excluyendo SVG y tablas; localización del literal generador en `armar-entregables.cjs:150`.  
**Qué corregiría:** sustituir ambas notas por la formulación limitada de O-03. También corregiría «validar el retenido de forma completa» en `PREGUNTAS-ABIERTAS`: obtener saldos históricos completos seguiría sin validar su procedencia.

**R2-03 · media · Persiste la explicación causal incorrecta del inventario huérfano.**  
**Afirma:** «≈ 4,9 M$ por movimientos menores de 350 $ que no se guardan» — H y nota de A; formulación equivalente en `COMPARATIVA-MODELOS…md`.  
**Por qué está mal:** O-03 ya reconoce que el simulador descarta transferencias conocidas inferiores a **3.520 $** antes de acreditarlas a destinatarias simuladas. No se ha descompuesto cuánto déficit corresponde a cada causa.  
**Cómo lo comprobé:** comparación del flujo de `simular()` con las notas de los entregables y su generador.  
**Qué corregiría:** «déficit de inventario observado, causado en parte por los filtros del simulador; desglose pendiente». Retirar la atribución exclusiva a movimientos inferiores a 350 $.

**R2-04 · media · Sobrevive una cota del hueco expresamente refutada.**  
**Afirma:** «el hueco previo (≤ 1,3 M$ brutos)» — A, O-06; `objeciones.cjs`, `enContra` de O-06.  
**Por qué está mal:** contradice O-04: una página por activo y un filtro mínimo no establecen una cota del hueco completo. Además, dos movimientos ya estaban guardados.  
**Cómo lo comprobé:** búsqueda textual y contraste entre O-04 y O-06.  
**Qué corregiría:** «20 movimientos adicionales encontrados bajo esos filtros, por 1.003.289,602436 $ brutos; cobertura incompleta». No tratar ese bruto como una parte conciliada del residuo atribuido.

**R2-05 · media · La reproducción del segundo tramo está simultáneamente abierta y cerrada.**  
**Afirma:** «que no reproduzco desde la caché (O-19)» — A, O-13; «para saber si la diferencia es mía o del informe» — `PREGUNTAS-ABIERTAS…md`, pregunta 1.  
**Por qué está mal:** O-19 identifica correctamente la discrepancia de tu adaptación y cierra ese diagnóstico.  
**Cómo lo comprobé:** volví a ejecutar el guion original. Obtengo:

- Casas: **4.153.525,156827273 $**.
- Nodos: **22.809.101,90357268 $**.
- Retenido: **21.004.188,77939667 $**.
- Billeteras: **2.898**.
- Diferencia máxima respecto a las purezas publicadas: **0**.

**Qué corregiría:** retirar la falta de reproducción como evidencia contra O-13. Puede quedar pendiente tu repetición personal, pero no el diagnóstico ya resuelto.

**R2-06 · media · Se siguen llamando cotas a estrategias que no lo son.**  
**Afirma:** «cota alta» y «cota baja» — A, O-01/O-02; «las dos cotas» — H, revisión y método.  
**Por qué está mal:** la aclaración posterior no elimina la contradicción terminológica.  
**Cómo lo comprobé:** repetí la modificación en memoria: prioridad manchada hacia destinatarias situadas a un máximo de cinco pasos de un puente y limpia hacia las demás. Resultado: **2.293.421,1210908187 $**, frente a **2.275.238,6703233835 $** de manchado primero. R1-04 se reproduce.  
**Qué corregiría:** «dos estrategias de prioridad». En la comparativa, «extremos observados» debe limitarse expresamente a las cinco estrategias originales.

**R2-07 · alta · “Transferencias/día” no estima justificadamente el total diario.**  
**Afirma:** «40–340 transferencias USDT al día» y subida a «≈ 1.000–2.600/día» — A, O-11; H; `notas/nodos-hallazgos.md`.  
**Por qué está mal/sin respaldo:** el script extrapola a 24 horas el intervalo entre las últimas 50 operaciones. Eso mide intensidad reciente; convertirla en actividad diaria exige estabilidad durante el día, que no se prueba. Además:

- Entre 50 eventos hay **49 intervalos**, pero el numerador es 50.
- El mínimo artificial de un minuto modifica las intensidades altas.
- «Si hay menos de 50 es exacto» necesita acreditar respuesta correcta, filtro temporal y día completo; el 31-oct aún estaba en curso.
- Una respuesta sin la lista esperada puede convertirse en cero.
- El JSON conserva solo el resultado, sin eventos, amplitud temporal ni tamaño de muestra.

**Cómo lo comprobé:** lectura de `nodos-serie-diaria.cjs` y de su JSON. No están guardadas las muestras necesarias para recalcular la serie.  
**Qué corregiría:** «intensidad extrapolada de las últimas 50 transferencias de cada fecha; no representa un conteo diario». Retirar «actividad estable previa» y cualquier magnitud del incremento diario presentada como medida.

**R2-08 · media · La corrección sobre terceros se contradice a sí misma.**  
**Afirma:** «existían y daban servicio a terceros antes del robo» — A, O-11. Las notas hablan de «tráfico previo y ajeno» y «fondos de otros clientes».  
**Por qué está mal:** el propio O-11 añade después que la independencia de esas contrapartes no está demostrada. Tráfico previo acredita actividad previa, no clientes independientes.  
**Cómo lo comprobé:** comparación entre las afirmaciones, alternativas y efecto de O-11, y las conclusiones de `nodos-hallazgos.md`.  
**Qué corregiría:** «tenían actividad previa con otras direcciones». Servicio a terceros: **HIPÓTESIS**. Propiedad de los fondos: **DESCONOCIDO**.

**R2-09 · media · El aprovisionamiento coordinado vuelve a presentarse como demostrado.**  
**Afirma:** «el aprovisionamiento coordinado sí está demostrado» — H, revisión adversarial.  
**Por qué está mal:** contradice el párrafo detallado de H y O-11, donde correctamente se clasifica como indicio/hipótesis.  
**Cómo lo comprobé:** cotejé `nodos.json` y `nodos-ventana.json`. Las fechas y los cinco primeros fondeadores consignados coinciden con lo guardado; los fondeadores figuran creados el 8-oct entre 18:50 y 18:53. Eso no identifica la causa de la proximidad temporal.  
**Qué corregiría:** «proximidad temporal de creación y fondeo observada; coordinación inferida». Tampoco llamaría «primer TRX en 1 min» al intervalo exacto: va de **23:35:12 a 23:36:36**, **84 segundos**.

**R2-10 · media · La conclusión de permisos omite dos cuentas sin datos utilizables.**  
**Afirma:** «Ninguna comparte una dirección autorizada visible en sus permisos» — A, O-11; H.  
**Por qué está incompleto:** `nodos.json` guarda `owner:[]` y `activas:[]` para **TGSNahJv…** y **TZG47zhb…**. El script transforma una respuesta vacía o fallida en esos mismos arrays; no conserva un estado que permita distinguirlo.  
**Cómo lo comprobé:** inspección de los permisos de las nueve cuentas y del tratamiento de la respuesta de `/wallet/getaccount`.  
**Qué corregiría:** «No aparecen claves compartidas entre las siete cuentas con permisos guardados; dos quedan sin cobertura verificable». Para el grupo de cinco, una queda sin esa cobertura.

**R2-11 · media · Los datos biográficos de los remitentes a casas carecen de respaldo guardado.**  
**Afirma:** TStvMPH7wv… tiene «4.509 operaciones», «41 de sus últimas 50» son entradas; TFL9UDVKRt… existe desde 2021 y tiene 728 operaciones; TXYiPCELFd… tiene 360 — A, O-12; H.  
**Por qué está sin respaldo reproducible:** las cachés y `exchanges.json` permiten comprobar los envíos a casas, pero no esos metadatos ni esa muestra reciente. Encontré **`_q2.cjs`**, que sí contiene la consulta ad hoc; no encontré sus respuestas guardadas. El guion por sí solo no acredita sus resultados.  
**Cómo lo comprobé:** inspección de `_q2.cjs`, `exchanges-auditoria.cjs`, sus resultados y las tres cuentas en la caché. Sí cuadra el bruto de TXYi… hacia Bybit: **2.455.746,7679999988 $** en 31 aristas del CSV.  
**Qué corregiría:** conservar las respuestas y sus fechas, o marcar esos metadatos como consultas no reproducibles con el paquete. «Cada remitente envía a una única dirección» debe restringirse a las salidas observadas en la ventana guardada.

**R2-12 · media · UniversalRouter no excluye participación en una liquidación de THORChain.**  
**Afirma:** «no una dirección de THORChain» — A, O-10; H.  
**Por qué está sin respaldo:** `traza-clases.json` confirma que el contrato está clasificado como `swap/UniversalRouter`. Eso no demuestra que no pueda intervenir en una ruta de liquidación. Tampoco encontré guardada la respuesta que respalda sus «1,7 M de operaciones».  
**Cómo lo comprobé:** clase local del contrato, `_q.cjs` y `thorchain-recibido.cjs`.  
**Qué corregiría:** «Contrato clasificado como UniversalRouter; no se ha establecido su papel en estas liquidaciones». La correspondencia operación por operación sigue desconocida.

**R2-13 · alta · Se sigue afirmando un regreso ejecutado que los memos solo solicitan.**  
**Afirma:** «Parte vuelve a TRON por THORChain» — H, resumen; «THORChain devuelve 1.580 operaciones» — `g1-mapa-general.cjs`.  
**Por qué está sin respaldo:** las transacciones de entrada y sus memos prueban una solicitud de destino. La comparación con recepciones agregadas no acredita la ejecución individual ni el regreso de fondos atribuibles al robo.  
**Cómo lo comprobé:** `thorchain-decodificado.json`, `thorchain.cjs` y `thorchain-recibido.cjs`. El desglose es:

- `tr`: **1.580 operaciones**, valor de entrada **11.654.829,559149994 $**.
- `TRON.USDT`: **20 operaciones**, **158.989,17999999996 $**.
- Total: **1.600 operaciones**, **11.813.818,739149995 $**.

Las veinte también tienen destinos en TRON, repartidos entre cinco de las once direcciones.  
**Qué corregiría:** «1.600 solicitudes con destino en TRON: 1.580 con activo `tr` y 20 con `TRON.USDT`; ejecución individual pendiente de enlazar». Retirar «devuelve» y «parte vuelve» como hechos comprobados.

**R2-14 · media · Recibir más que desde el puente no demuestra dinero ajeno.**  
**Afirma:** «reciben 17 M$ […] pero solo 7,8 M$ vienen de TRON: mezclan dinero ajeno» — H, cautela THORChain; `g4-puentes.cjs`.  
**Por qué está sin respaldo:** fondos de otras procedencias observadas pueden pertenecer al mismo operador, proceder de otros recorridos o incluir circulación repetida. La resta no identifica titularidad ni origen independiente.  
**Cómo lo comprobé:** alcance de los agregados de entradas y del seguimiento: no hay identificación de propietarios que permita esa inferencia.  
**Qué corregiría:** «reciben entradas adicionales cuyo origen y relación con el robo no se han determinado».

**R2-15 · media · Las figuras contienen cifras y afirmaciones superadas que no quedan conciliadas.**  
**Afirma:** «primer tramo 2,35 M$ + segundo tramo 1,60 M$», «posterior a la foto (35 envíos)» — `g4-puentes.cjs`; «pureza del 16 al 74 %» — `g3-blanqueo-tron.cjs`.  
**Por qué está mal:** en el JSON actual de puentes USDT0 hay **37** registros `solo vigilante`, y su asignación guardada por tramo es:

| Etiqueta guardada | Envíos | Importe enviado, USDT | `Σ(v × p)`, $ |
|---|---:|---:|---:|
| tramo1 | 25 | 2.122.323,0842699995 | 1.902.687,555785016 |
| tramo2 | 124 | 2.943.805,3891109983 | 2.038.297,8286776494 |
| solo vigilante | 37 | 2.937.162,5623739995 | 0 |

La distribución manual 2,35/1,60 no corresponde a esas etiquetas. Además, las purezas del CSV de casas van de **0,006 a 0,806**, no de 0,16 a 0,74.  
**Cómo lo comprobé:** agregación de `puentes-decodificados.json` y mínimo/máximo de las 249 aristas a casas.  
**Qué corregiría:** generar las cifras desde datos y explicar la regla de asignación de movimientos solapados. Esa asignación guardada tampoco equivale a una atribución conjunta validada. Una advertencia general de prevalencia del texto no concilia estas cifras.

**R2-16 · media · “VERIFICADO” sigue cubriendo importes atribuidos y generalizaciones no verificadas.**  
**Afirma:** «Aguanta (VERIFICADO) […] el reparto por clase» — A, resumen; «casi igual con cualquier modelo» — H; «≈ 4,75 M$ depositados», clase VERIFICADO — O-14.  
**Por qué está sobreclasificado:** reproducir resultados bajo cinco estrategias y determinados supuestos verifica el comportamiento de esos cálculos. No verifica procedencia económica ni estabilidad frente a cualquier modelo. En JustLend, los **117 movimientos** y el bruto pueden comprobarse separadamente; los **4,75 M$ del robo** dependen de purezas.  
**Cómo lo comprobé:** separación entre cantidades transferidas y campos calculados; revisión de las clases O-01…O-20.  
**Qué corregiría:** dividir las afirmaciones: movimientos y reproducción **VERIFICADOS sobre los datos guardados**; atribución **ESTIMADA**; estabilidad limitada a las variantes ensayadas. O-05 necesita la misma separación entre conteos e importes atribuidos. O-09 tiene ahora soporte adicional del contrato emisor; no encuentro motivo numérico para rebajar sus sumas.

**R2-17 · media · La descripción del rastreo exagera su ausencia de límites.**  
**Afirma:** «Sin tope de saltos, de billeteras ni de días» y «recibe […] 3.520 $ o más del robo» — H, método.  
**Por qué está mal:** los rastreadores tienen `if (nivel > 200) break`, límites de paginación —12 y 40 páginas— y un inicio temporal fijado. Además, deciden seguir por **`e.v` bruto**, antes de calcular la pureza; no por el importe atribuible al robo.  
**Cómo lo comprobé:** lectura de `traza.cjs` y `traza-post.cjs`, especialmente las condiciones de lectura y encolado.  
**Qué corregiría:** declarar los límites efectivos y «se amplían ramas por transferencias brutas ≥3.520 $». No afirmo que el tope de 200 niveles truncara esta ejecución: los niveles publicados son inferiores.

**R2-18 · baja · La revisión independiente enlazada no está en el paquete indicado.**  
**Afirma:** «ver `REVISION-CODEX-2026-10-31.md`» — A, resumen.  
**Por qué está mal:** ese archivo no existe en `docs/auditoria-adversarial-2026-10-31/`.  
**Cómo lo comprobé:** inventario del directorio y lectura de los entregables.  
**Qué corregiría:** enlazar la respuesta existente de ronda 1 y, cuando se archive, esta ronda. No presentar un documento inexistente como evidencia accesible.

**Comprobé y cuadra**

- **R1-03:** reproducción exacta del segundo tramo; números arriba. El traslado de O-19 es correcto.
- **R1-04:** contraejemplo mixto **2.293.421,1210908187 $**; correcto.
- **R1-05:** nodos correctos; préstamos requieren la corrección de R2-01.
- **R1-08:** repetí la fórmula  
  `reparto − suma de terminales − polvo − retenido`.  
  Con la hipótesis predeterminada, los resultados son los siguientes, redondeados a seis decimales:

| Modelo | Con su retenido, $ | Con retenido publicado, $ |
|---|---:|---:|
| FIFO | 469.380,142130 | 6.263.330,674273 |
| LIFO | 503.055,321197 | 5.592.488,075928 |
| Mezcla móvil | 476.109,463598 | 6.191.125,516668 |
| Manchado primero | 521.327,122981 | 5.165.722,641321 |
| Limpio primero | 457.957,309029 | 7.216.870,134919 |

  El punto fijo reproducido deja **5.235.481,143496152 $** con su retenido. El traslado de esos resultados cuadra. **El ≈0,5 M$ debe limitarse a la hipótesis predeterminada:** con `--hip=limpio`, el residuo con retenido propio abarca **921.521,8419796638–970.864,3723783009 $**.

- **R1-14:** los intervalos y porcentajes consignados en los resúmenes guardados son:

| Cuenta | Muestra del 30-oct, UTC | Entrada desde recorrido |
|---|---|---:|
| THPaGKe6… | 18:43:06–23:59:21 | 95,288137 % |
| TGSNahJv… | 20:25:33–23:59:36 | 96,823810 % |
| TBAPnuwE… | 19:29:09–23:54:39 | 91,770196 % |
| TLKfB2go… | 20:53:48–23:59:45 | 99,021617 % |
| TH1YKH9M… | 20:52:57–23:59:54 | 98,446942 % |
| TQ5SdemH… | 23:14:36–23:59:39 | 100 % |

  En las cinco primeras, los porcentajes guardados del 31-oct abarcan **37,775261218184546–50,59801760657449 %**. El traslado de R1-14 cuadra; no equivale a recontar eventos brutos no conservados.

- **R1-16:** **9.825.409 USDT + 7.599.052 TRX**. Bruto a 0,352: **12.500.275,304 $**; a 0,316: **12.226.709,432 $**. Diferencia: **273.565,872 $**, **2,1884787762431186 %**. Traslado correcto.
- **O-20:** **2.020 + 2.585 registros; 4.506 movimientos únicos**, con 99 compartidos: 87 nodos, ocho puentes, tres USDD y un préstamo. El desglose publicado cuadra.
- Los cinco primeros fondeadores y las fechas de creación consignadas coinciden con `nodos*.json`.
- Las cifras principales de casas del grafo —Bybit, OKX y Gate— coinciden con el CSV a su precisión publicada.
- La cifra de seis direcciones del puente con ≥10.000 $ suma **552.673,9574889999 $**, compatible con los 552.674 $ escritos.
- Busqué exhaustivamente los restos solicitados en los cinco Markdown y en H sin SVG ni tablas. **No quedan afirmaciones positivas de «423 billeteras», «118 aristas», «19 objeciones» o «robusto».** «5,2–5,7» y «máximo teórico» aparecen en A como afirmaciones retiradas; «cota inferior» aparece negada. Los restos problemáticos efectivos son los señalados arriba.

**No pude comprobar**

- La serie diaria desde sus muestras originales: no se conservaron los eventos ni sus intervalos.
- Los metadatos y las últimas 50 transferencias de los tres remitentes a casas: está `_q2.cjs`, pero no sus respuestas.
- La ejecución individual de THORChain, sus hashes de salida y el papel exacto de `TQqgNg13…`.
- Los permisos de las dos cuentas guardadas con arrays vacíos.
- El precio histórico de 0,316 $, la independencia de contrapartes o la identidad de operadores.
- Cada literal de las cinco figuras contra evidencia primaria; identifiqué las contradicciones concretas anteriores, sin certificar los restantes.
- El contenido y presentación del Excel revisado: esta revisión no inspeccionó el libro.