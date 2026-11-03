# Revisión independiente con Codex (intentando refutar)

Método: `codex exec` en solo lectura. Cada ronda recibe un encargo de refutar, no de aprobar; yo compruebo cada objeción contra los datos originales antes de aceptarla. Respuestas originales, sin editar: `research/auditoria-adversarial-2026-10-31/codex/ronda-N-respuesta.md` (prompts en `ronda-N-prompt.md`).

Regla: lo que Codex calculó y yo no repetí queda marcado «por Codex, no repetido por mí». No se fuerza consenso; los desacuerdos se anotan al final.

## Ronda 1 (19 objeciones) — todas aceptadas

| Id | Qué dijo | Mi comprobación | Resultado |
|---|---|---|---|
| R1-01 | JustLend contado dos veces (hash `0af27aba…`) | verificada con los CSV | Corregido: 117 movimientos únicos, ≈ 4,75 M$ |
| R1-02 | 99 aristas repetidas entre tramos | verificada (87 nodos, 8 puentes, 3 USDD, 1 préstamo) | Nueva objeción O-20 |
| R1-03 | El segundo tramo sí se reproduce con el guion original | por Codex (también en ronda 2), no repetido por mí | O-19 cerrada como error de mi adaptación |
| R1-04 | «Manchado primero» no es un máximo teórico (2,293 vs 2,275 M$) | por Codex, reproducido en ronda 2 | Redactado como rango observado |
| R1-05 | Hipótesis por defecto del simulador no coincidía con lo documentado | leído el código | Documentado; ficheros `-limpio`/`-pool` históricos no se usan |
| R1-06 | El umbral del simulador es 3.520 $, no 350 $ | verificado en `atribucion.cjs` | Retirada la causa «movimientos <350 $» |
| R1-07 | El inventario agrega dólares, no separa TRX/USDT | leído el código | Salvedad en O-01 |
| R1-08 | El rango 5,2–5,7 M$ del «sin explicar» no se reproduce | por Codex, reproducido en ronda 2 | Retirado |
| R1-09 | 2 de las 22 aristas del hueco ya estaban | verificada (298.919 $) | 20 nuevas, 1,00 M$ |
| R1-10 | La receta deja `preventana-tramo1.json` en `[]` | verificado (2 bytes) | Anotado en LEEME; **sin corregir el script** |
| R1-11 | La validación del retenido compara saldo bruto, no atribución | verificada la fórmula | O-03 rebajada |
| R1-12 | 4,15 M$ no es cota inferior | de acuerdo | Redactado como estimación con cobertura incompleta |
| R1-13 | Permisos/coordinación/terceros exceden la evidencia | de acuerdo | HIPÓTESIS |
| R1-14 | Porcentajes del 30-oct son muestras tardías | verificado con `nodos-ventana.json` | Intervalos declarados |
| R1-15 | Excepción de pureza alta en OKX (0,806) | verificada | Añadida |
| R1-16 | El −10 % de precio no aplica a todo | por Codex, reproducido en ronda 2 (2,19 %) | Corregido |
| R1-17 | THORChain compara valor de entrada (ETH a 2.253 $) | verificado en `thorchain.cjs` | Redactado |
| R1-18 | El recibo no filtraba el contrato del token | verificado; repetí la prueba | 165 eventos del USDT de Ethereum y 18 del USDT0 de Arbitrum |
| R1-19 | 423 registros = 420 direcciones | verificada | Corregido |

## Ronda 2 (18 objeciones)

Codex reejecutó lo que yo había aceptado sin repetir: R1-03, R1-04, R1-08, R1-14, R1-16 y O-20 **coinciden** con lo escrito. Encontró un error de su ronda 1 (mínimo de préstamos con `--hip=limpio`: 4,783 M$, no 4,79).

| Id | Resumen | Decisión |
|---|---|---|
| R2-01 | Préstamos con «limpio»: 4,78–4,81 | Aceptada, corregida |
| R2-02 | Seguía publicada la «validación» del retenido | Aceptada, corregida |
| R2-03 | Seguía la causa «<350 $» | Aceptada, corregida |
| R2-04 | Seguía «≤ 1,3 M$» | Aceptada, corregida |
| R2-05 | Reproducción del tramo 2 «abierta y cerrada» | Aceptada, corregida |
| R2-06 | «cota alta/baja» | Aceptada: «extremos observados / estrategias extremas» |
| R2-07 | «Transferencias/día» no es un conteo | Aceptada: renombrada «intensidad estimada»; muestras no conservadas |
| R2-08 | «Servicio a terceros» sin base | Aceptada: HIPÓTESIS; propiedad de fondos DESCONOCIDA |
| R2-09 | Coordinación presentada como demostrada; 84 s, no 1 min | Aceptada |
| R2-10 | Dos cuentas sin permisos utilizables | Aceptada |
| R2-11 | Metadatos de remitentes sin respuestas guardadas | Aceptada: repetí la consulta y la guardé (`resultados/remitentes-casas.json`, mismos valores) |
| R2-12 | UniversalRouter no excluye papel en THORChain | Aceptada |
| R2-13 | «Parte vuelve a TRON» = solo solicitud (1.600: 1.580 `tr` + 20 `TRON.USDT`) | Aceptada |
| R2-14 | «Mezclan dinero ajeno» no se concluye de una resta | Aceptada |
| R2-15 | Textos de figuras superados | Aceptada: nota en el HTML; **las figuras no se han redibujado** |
| R2-16 | VERIFICADO sobreclasificado en importes atribuidos | Aceptada: O-14 pasa a ESTIMADO; resumen dividido |
| R2-17 | «Sin tope» exagera: límites técnicos (200 niveles, 12/40 páginas) y ampliación por bruto | Aceptada |
| R2-18 | Este documento no existía | Creado |


## Ronda 3 (9 objeciones; Codex confirma que las 12 hojas AUD y los textos generados coinciden con el generador, y que las 24 hojas originales del Excel conservan sus 116.495 celdas)

| Id | Resumen | Decisión |
|---|---|---|
| R3-01 | «El robo» no está verificado por estos datos: solo movimientos y bloqueos; el informe original advertía que no incluía fuente del incidente | Aceptada: redactado como premisa de los informes |
| R3-02 | THORChain «devuelve/regreso» seguía en 3 textos del original | Aceptada: «solicita devolver», «solicitudes de regreso» |
| R3-03 | Comparativa seguía con «<350 $» | Aceptada, corregida |
| R3-04 | «Aprovisionamiento coordinado» en título y conclusión | Aceptada: «creación y fondeo próximos; coordinación inferida» |
| R3-05 | «Mezcla dinero ajeno» por pureza <1 | Aceptada: «entradas cuyo origen y titularidad no se han determinado» |
| R3-06 | Etiquetas del Excel incompatibles (permiso por defecto, USDT/día, Pedido $, hoja Sin leer) | Aceptada: etiquetas corregidas y hoja dividida |
| R3-07 | VERIFICADO agrupa conteos con importes atribuidos (O-05, resumen H) | Aceptada: se divide por subafirmación |
| R3-08 | Residuo ≈ 0,5 M$ solo con la hipótesis por defecto (con «limpio»: 0,92–0,97) | Aceptada, comprobado por Codex |
| R3-09 | Tramo posterior a la foto mezcla cortes: hasta 10:11:59 son 353 envíos/49 billeteras/166,63 M TRX/58,65 M$; hasta 10:28:48 son 363/51/172,33 M/60,66 M$ | Aceptada y **verificada por mí** con trb-posfoto-envios.json; nueva fila en la tabla de diferencias |

Además: guardé la respuesta de TronScan sobre el UniversalRouter (1.716.846 operaciones el 31-oct) para respaldar la cifra «1,7 M».


## Ronda 4 (3 objeciones; cierra R3-02, R3-03, R3-04, R3-06, R3-07 y R3-08; fuera de ellas, «sin objeciones materiales» nuevas)

| Id | Resumen | Decisión |
|---|---|---|
| R4-01 | H seguía diciendo «COMPROBADO: el robo se ejecutó…» | Aceptada: «los movimientos se produjeron…»; el robo es la premisa de los informes |
| R4-02 | Una frase «mezcla ya dinero ajeno» sin corregir | Aceptada |
| R4-03 | 58,5 M$ del resumen/límites/preguntas no corresponde a ningún corte (58,65 M$ a 10:11:59; 60,66 M$ a 10:28:48) | Aceptada: resumen, límites y preguntas fechados con ambos cortes (total ≈ 109,4 / 111,4 M$) |


## Ronda 5 — cierre
Codex: «sin objeciones materiales». Confirma cerradas R4-01, R4-02 y R4-03, y que no hay contradicciones numéricas internas (109,3/109,4/111,4; 58,5/58,7/60,7; 4,75/4,81; 423/420; 22/20; 2,36/1,0–2,3). Observó que la hoja original «Reparto TRBdWq» del Excel conserva la etiqueta «hasta 10:11» en movimientos de 10:17–10:28; está advertido en la tabla de diferencias y no se tocó (las hojas originales se conservan intactas).

## Desacuerdos y límites
No hubo desacuerdos: acepté las 49 objeciones de las rondas 1–4 tras comprobar las verificables contra los datos. Límites que ni Codex ni yo pudimos comprobar: la autenticidad/estado actual de la cadena (Codex trabajó con archivos guardados), que se trate de un robo (premisa de los informes), la ejecución individual de THORChain, titularidad de las direcciones, la serie diaria de actividad de los nodos (muestras no conservadas), los permisos de dos cuentas, el precio histórico del TRX, saldos jUSDT, cada cifra escrita a mano en las figuras (no redibujadas), la apariencia del Excel en una aplicación, y que yo repita personalmente la ejecución del guion original del segundo tramo (la hizo Codex dos veces).

## Trabajos pedidos por el propietario (1-nov-2026) — NO revisados por Codex

Hechos tras las cinco rondas; las cifras nuevas no han pasado por revisión independiente.

| Tarea | Resultado | Dónde |
|---|---|---|
| R1-10: `atribucion.cjs` dejaba la lista de ventana previa vacía | Corregido (la variable `preVentanaPorW` nunca se asignaba). Lista regenerada: 112 billeteras, 297 entradas, 13,99 M$ brutos. Resultados de atribución sin cambios; `rellenar-hueco.cjs` ahora pagina y da lo mismo (22 aristas, 1.302.209 $, 0 a casas). No sé por qué antes se citaban 123 billeteras: esa lista se perdió. | `atribucion.cjs`, `rellenar-hueco.cjs`, copias previas en `respaldo-antes-de-arreglar/` |
| Reproducción personal del 2.º tramo | Repetida sin red con el guion original (las escrituras del análisis original se capturan en memoria; solo guarda su propio resultado en `resultados/reproduccion-tramo2.json`): todos los campos iguales (diferencia máxima de pureza 0). | `reproducir-tramo2.cjs`, `resultados/reproduccion-tramo2.json` |
| Rastreo a fondo de los 58,7 M$ repartidos tras la foto | Versión final (tras la ronda 6): 4.481 billeteras leídas (nivel 70), 0 lecturas fallidas, hasta las 17:20:18 UTC del 31-oct, 0 llegadas conocidas anteriores a la ventana de lectura. Destinos: nodos 51,15; USDD 7,51; préstamo 2,43; puente 0,19; casa 0,004; retenido 3,60 M$. Terminales + retenido = 64,88 M$ sobre 58,65 de entrada (exceso 6,22); con el polvo (1,49) 66,37 (exceso 7,72): el modelo no conserva. La primera versión (3.918 billeteras, nodos 46,63, exceso 1,68) quedó superada. | `traza-tramo3.cjs`, `analisis-tramo3.cjs`, `tramo3/` |
| Causa de las lecturas fallidas del tramo 3 | TronGrid devolvía HTTP 429 (límite de peticiones): confirmado leyendo los errores del lector. Más reintentos y pausas, 2 lectores en vez de 3. Segundo fallo propio: al reanudar, las billeteras alcanzadas a través de cambios ya decodificados no volvían a la cola y 7 lecturas fallidas nunca se repetían; corregido en `traza-tramo3.cjs` (copia previa en `respaldo-antes-de-arreglar/`). | `diag-lectura.cjs`, `traza-tramo3.cjs` |
| Figuras 0 y 1/4 a 4/4 | Redibujadas con las correcciones de la auditoría y las cifras del tramo 3 (también 353 envíos/49 billeteras en lugar de 352/48 y 6,5 M$ en lugar de 6,7 M$ para la tercera receptora hasta las 10:11:59). Originales sin tocar. | `docs/grafos-revisados/`, `research/auditoria-adversarial-2026-10-31/figuras/` |

Pendiente declarado: la hipótesis de que las 423 lecturas fallidas de los tramos 1 y 2 tengan la misma causa (429) no está comprobada; no se han releído.

## Ronda 6 (sobre los trabajos del 1-nov)

Respuesta íntegra en `research/auditoria-adversarial-2026-10-31/codex/ronda-6-respuesta.md`. Seis objeciones materiales; las acepté todas.

| ID | Objeción | Decisión |
|---|---|---|
| R6-01 | 72 billeteras con 141 llegadas conocidas anteriores a su ventana de lectura (6,53 M$ brutos); «0 lecturas fallidas» no equivale a cobertura temporal | Aceptada y verificada (mi comprobación sobre la caché anterior encuentra 78 billeteras/147 llegadas: criterio algo distinto). Corregido el rastreador: una billetera ya leída se vuelve a leer desde antes si se descubre una llegada anterior (101 ampliadas); repetido hasta 0 llegadas anteriores a la ventana (`auxiliares/_chequeo-ventanas.cjs`). El resultado cambió: 4.481 billeteras, nodos 51,15 M$. Copias previas: `respaldo-antes-de-arreglar/traza-tramo3.antes-ventanas.cjs` y `tramo3/tramo3-cache.antes-de-ventanas.json`. |
| R6-02 | El exceso declarado omite el polvo | Aceptada: se muestra terminales + retenido y con polvo en H, X, A y figuras; no se presenta como pérdida económica demostrada. |
| R6-03 | «Sin escribir en disco» es falso: el reproductor guarda su resultado y crea carpeta | Aceptada: texto corregido; la reproducción numérica queda confirmada por Codex. |
| R6-04 | Columna «Clase» salía como [object Object] en H y vacía en X | Aceptada (error mío: `{ clase, ...x }` pisaba el texto); corregido y regenerado. |
| R6-05 | «El mayor destino final» y «el dinero acaba en» presentan nodos como destino final | Aceptada: «mayor nodo receptor observado» y «el rastreo registra llegadas a». |
| R6-06 | «Ya eran destinos del segundo tramo»: son sus semillas | Aceptada y comprobado: son destinos terminales del primer tramo y semillas del segundo. |

## Ronda 7 (sobre las correcciones de la ronda 6)

Respuesta íntegra en `research/auditoria-adversarial-2026-10-31/codex/ronda-7-respuesta.md`. Dos objeciones materiales nuevas y dos cierres parciales; acepté todo. Confirmó: 4.482 direcciones = semilla + 4.481 billeteras, 0 fallos, corte T3 aplicado, 3.541 aristas terminales sin duplicados, totales y conciliación (64,88 / 66,37 M$ frente a 58,65).

| ID | Objeción | Decisión |
|---|---|---|
| R7-01 | La rama de saltos ya decodificados (`via`) solo devolvía destinos a la cola si no estaban procesados; no pedía ampliar ventanas (prueba con caché mínima). La caché publicada no tiene ese hueco | Aceptada: la rama aplica ahora la misma condición de llegada anterior a la ventana. Repetido el rastreo: 0 lecturas nuevas, mismo resultado, 0 llegadas anteriores a la ventana. Copia previa: `respaldo-antes-de-arreglar/traza-tramo3.antes-ronda7.cjs`. |
| R7-02 | H decía que los nodos que absorben 51,15 M$ son las semillas del 2.º tramo, pero esos seis suman 49,55 M$ (los otros 1,60 son TZG47…, TRsqzn…, TKfz7…) | Aceptada: H separa 49,55 M$ (grupo del 11-oct y TM8uy…) de 1,60 M$ (otros nodos). |
| R6-02 parcial | La portada decía solo «+6,2 M$ de más» | Aceptada: la portada nombra el subtotal y añade 7,7 M$ con polvo. |
| R6-03 parcial | Este registro conservaba «sin escribir en disco» | Aceptada: texto precisado arriba. |

Las correcciones de la ronda 7 no han vuelto a pasar por Codex.
