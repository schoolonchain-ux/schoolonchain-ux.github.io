## Veredicto en 5 líneas

La contabilidad principal se reproduce, con 3.419,37 M$ de reclamos, 3.216,45 M$ de caja y 205,20 M$ prestados.
La primera objeción grave es presentar 263,33 M$ como mínimo agregado recuperable sin simular conjuntamente ventas que comparten pools.
La segunda es minimizar ETH/BTC usando deuda actual, cuando los topes permiten abrir aproximadamente 96,26 M$ adicionales con garantía suficiente.
La tercera es afirmar que resulta imposible pausar retiradas y que todo cambio exige 48 horas basándose en ABI y parámetros, sin verificar las rutas de ejecución.
Los 92,65 M$ vinculados a USDD son reproducibles, pero la muestra omite 37,52 M$ de deuda y el estrés confunde déficit de garantía ajustada con pérdida económica.

## Parte A — Objeciones

### R1-01 · alta · tipo cifra · Mínimo agregado de USDT recuperables

**Afirma**

Sección 5 y resumen, «como mínimo 263,3 M$» recuperables vendiendo la caja por SunSwap.

**Objeción**

Cada curva representa una venta aislada contra el estado inicial. Sumar sus resultados exige demostrar que todas esas ventas pueden ejecutarse conjuntamente. Las rutas de dos saltos y las ventas de TRX pueden consumir los mismos pools y las mismas reservas de USDT.

La envolvente tiene una justificación limitada. Con una cantidad disponible se puede vender una parte y conservar el resto. Sin embargo, elegir el máximo de cotizaciones no monótonas conserva cualquier sobreestimación del motor. La envolvente requiere que el punto seleccionado sea ejecutable y correcto.

**Cálculo y evidencia**

Recalculando `resultados/12-venta-cota.json` obtengo

- Suma directa de salidas de los mercados de 263.477.219,65 USDT.
- Suma aplicada por `generar-informe.cjs`, mediante `min(salida, cajaUSD)`, de 263.334.994,38.
- Cociente de esta segunda suma entre la caja de 8,187 %.

En `resultados/11-venta.json` encontré descensos de salida en tres puntos de WTRX, siete de sTRX y ocho de WBTC, entre otros. WTRX entrega 63.528.949,47 USDT para un tamaño de 216 M$, por debajo del punto anterior. sTRX incluye rutas de dos saltos.

`venta/liquidez.cjs` importa el cálculo desde `C:/EquipoIA/web-publicador/liquidez-sunswap/curvas.cjs`, situado fuera del paquete. La validación anunciada de 110/120 cotizaciones carece aquí del material necesario para repetirla.

**Corrección sugerida**

Presentar 263,33 M$ como suma de estimaciones individuales, condicionada a la exactitud del motor. Retirar «mínimo seguro» agregado hasta simular una secuencia conjunta que actualice reservas y ticks después de cada venta. Un resultado «no cabe» debe conservarse como fallo de cobertura del motor.

### R1-02 · alta · tipo lenguaje · Riesgo futuro de ETH/BTC

**Afirma**

Secciones 8.2 y 8.7, los grandes depositantes carecen de deuda y la desaparición del valor de ETH/BTC afecta «muy poco a los préstamos».

**Objeción**

La exposición actual deja fuera la capacidad de abrir préstamos nuevos. El mayor depositante de BTC ya tiene su posición activada como garantía y dispone de poder suficiente para consumir toda la capacidad adicional identificada.

**Cálculo y evidencia**

Para cada mercado abierto calculé, desde `01` y `04`,

\[
\Delta B_i=P_i\min\left(C_i,\max(0,\mathrm{tope}_i-B_i)\right).
\]

La suma es **96,26 M$**. USDT aporta **55,18 M$**, TRX **19,02 M$** y USDD nuevo **9,95 M$**.

En `09-cuentas.json`, `TUjx6w55…` tiene **258,21 M$ de poder de préstamo**, deuda cero y jBTC activado como garantía. La cuenta `TCQQjfcc…` tiene 933,37 M$ depositados en jETH, con factor del 75 %, aunque actualmente su posición figura fuera de los mercados activados como garantía.

**Corrección sugerida**

Separar exposición vigente y capacidad incremental de extracción. Calificar como condicional la posibilidad de monetizar garantía emitida sin respaldo. El paquete acredita emisiones históricas, pero carece de prueba de emisión ilimitada y de su coste económico actual.

### R1-03 · alta · tipo lenguaje · Pausas y protección del Timelock

**Afirma**

Sección 7, «Pausa de retirada. No existe», «la retirada solo falla por falta de caja o por dejar a la cuenta en déficit» y cambios con 48 horas de aviso.

**Objeción**

La ausencia de un nombre de función en el ABI resulta insuficiente para demostrar ausencia de restricciones en la implementación, el proxy o el token subyacente. También quedan sin comprobar permisos, rutas de actualización y operaciones ya encoladas.

Los parámetros del Timelock acreditan su configuración. Extender esa protección a cualquier modificación relevante requiere verificar quién controla cada componente.

**Cálculo y evidencia**

`resultados/03-timelock-y-precios.json` contiene `delaySeg = 172800`, equivalente a 48 horas. La respuesta bruta `raw/03-2026-11-13/fa911b85c12fc78beeeb.json` reproduce ese valor.

`02` identifica administradores e implementaciones. `23` enumera funciones. `28` y `29` identifican además autoridades del oráculo con facultades cuyo alcance efectivo queda sin verificar.

**Corrección sugerida**

Sustituir las afirmaciones absolutas por una conclusión circunscrita al ABI y a las llamadas realizadas. Exigir revisión del código efectivo, sus permisos y la cola del Timelock para afirmar cobertura general de 48 horas.

### R1-04 · media · tipo control · Las cuatro comprobaciones de caja reutilizan caché

**Afirma**

Sección 9, lecturas conjuntas repetidas cuatro veces, con diferencia cero en las cuatro.

**Objeción**

El guion `06` anuncia lecturas «sin caché», pero `lib.cjs` reutiliza cualquier petición idéntica dentro de la sesión. Los cuatro ciclos reutilizan las llamadas constantes de contratos.

**Cálculo y evidencia**

La sesión `raw/06-2026-11-13-1794595068271/` contiene nueve respuestas. Solo hay una lectura de `getCash()` para jTRX, una para jSTRX y una de `balanceOf` de sTRX.

Decodificando las respuestas brutas obtuve

- jTRX, caja y saldo de **1.575.083.627.691.634 unidades mínimas**.
- jSTRX, caja y saldo de **1.783.353.234.359.120.234.249.867.667 unidades mínimas**.

En `05`, 22 mercados coinciden y dos difieren. `06` resuelve esas dos diferencias en otra lectura, pero la repetición independiente de cuatro pares queda refutada por la caché.

**Corrección sugerida**

Informar de 22 coincidencias iniciales y dos coincidencias posteriores. Para repetir el control hacen falta peticiones nuevas y referencias temporales verificables.

### R1-05 · media · tipo lenguaje · Identidad del emisor y exhaustividad histórica

**Afirma**

Sección 4, `issue(uint256)` «COMPROBADO», firma propia y totalidad de las emisiones de BTC atribuida a dos cuentas.

**Objeción**

El selector coincide con el calculado para `issue(uint256)`, pero cuatro bytes carecen de unicidad suficiente para identificar por sí solos el código ejecutado. El campo llamado `firma` en `20` y `25` procede de `owner_address`. La recuperación de las claves firmantes y los permisos de la cuenta requieren comprobaciones adicionales.

La exhaustividad del índice histórico también queda abierta.

**Cálculo y evidencia**

Calculé con `keccak.cjs` el selector `cc872b66`. En `raw/20-2026-11-13/a824b4a953910a7e5d10.json`, la transacción de 536.000 ETH contiene ese selector y el `owner_address` correspondiente a `TCQQjfcc…`. El evento recogido atribuye las unidades a esa misma dirección.

Las emisiones BTC listadas suman **114.000 BTC**, distribuidos en **54.000 y 60.000**. Las quemas suman **96.090,34379474 BTC**. El saldo teórico es **17.909,65620526 BTC**, frente a **17.545,36383690 BTC** de oferta publicada. Faltan explicar **364,29236836 BTC**.

Las tres páginas brutas consultadas para la dirección cero contienen 50, 50 y 32 movimientos, mientras el proveedor devuelve `total = rangeTotal = 10000`.

Para ETH, 596.001 − 109.830,80122241448 da 486.170,1987775855, frente a 485.527,2161601712 de oferta. La diferencia es **642,9826174143 ETH**.

**Corrección sugerida**

Mantener acreditados los movimientos concretos y el titular declarado de la llamada. Rebajar a identificación probable el nombre de función hasta contrastarlo con código. Circunscribir «dos cuentas» a las emisiones recuperadas del índice.

La custodia legítima, la gestión de inventario, los incentivos y la provisión de colateral siguen siendo explicaciones compatibles con esos movimientos.

### R1-06 · media · tipo unidades · Déficit de garantía frente a pérdida económica

**Afirma**

Sección 8.7, ETH/BTC a cero dejaría **13,22 M$ de deuda sin respaldo**.

**Objeción**

El cálculo resta poder de préstamo residual, que incorpora descuentos mediante factores de garantía. Una cuenta puede quedar liquidable y conservar activos suficientes para pagar su deuda.

**Cálculo y evidencia**

Recalculé desde las posiciones de `09`, restringiendo a deuda superior a 1.000 $ y excluyendo los dos mercados definidos por `24`.

- Déficit respecto al poder de préstamo residual de **13.217.007,11 $**, en 51 cuentas.
- Déficit respecto al valor bruto del colateral residual de **12.289.843,72 $**, bajo valoración íntegra de los demás activos.

La segunda cifra también depende de costes de liquidación, realización efectiva y caja de los mercados.

**Corrección sugerida**

Denominar los 13,22 M$ «déficit de cobertura ajustada». Presentar separadamente déficit económico y recuperación ejecutable.

### R1-07 · alta · tipo muestra · Alcance de las conclusiones de deuda

**Afirma**

Sección 8, muestra de 807 cuentas, cobertura del 81,7 % y conclusiones generales sobre qué garantía amenaza a los depositantes.

**Objeción**

La selección por mayores titulares de jTokens favorece determinados perfiles. La fracción descubierta puede tener composición y solvencia distintas. La concentración por dirección tampoco identifica entidades, custodios o control compartido.

**Cálculo y evidencia**

Desde `09`, `04` y `24` obtuve

- Deuda observada de **167.678.214,62 $**.
- Deuda total de **205.195.224,20 $**.
- Diferencia de **37.517.009,58 $**, equivalente al **18,28 %**.

USDT tiene aproximadamente **18,00 M$** sin explicar. TRX presenta cobertura de solo el **66,39 %**.

Los **92.648.975,03 $** de deuda USDT con al menos 90 % del poder de garantía en USDD se reproducen. Ese 90 % mide composición del poder de préstamo. La proximidad al límite es otra variable.

**Corrección sugerida**

Mantener los resultados como descripción de la muestra. Añadir el importe desconocido junto a cada conclusión de riesgo y reconstruir deudores mediante eventos completos.

### R1-08 · media · tipo lenguaje · Precio fijo e interpretación del oráculo

**Afirma**

Sección 8.6, igualdad de precios de estables y explicación probable mediante publicaciones iguales con límite del 10 % por periodo.

**Objeción**

La igualdad observada se reproduce, pero su causa requiere inspeccionar el proxy y las fuentes por activo. Tampoco ocho transacciones de una cuenta prueban ocho actualizaciones efectivas de cada precio relevante.

**Cálculo y evidencia**

Normalizando los decimales de `01`, USDT, USDD, TUSD y BUSD dan **3,191075 TRX por unidad**.

`29` contiene `maxSwingMantissa = 10^17` y `numBlocksPerPeriod = 600`. Las ocho transacciones listadas abarcan 212,65 minutos, con intervalo medio de **30,38 minutos**.

`28` muestra configuración específica del proxy, incluidos campos de direcciones de activos. El paquete carece de una verificación del comportamiento efectivo que permita deducir la política de precio de cada estable.

**Corrección sugerida**

Conservar la igualdad como observación. Tratar el seguimiento del despegue, las reglas de anclas y la cadencia por activo como hipótesis pendientes.

### R1-09 · media · tipo control · Independencia, tiempo y reproducibilidad

**Afirma**

Resumen y sección 9, controles superados y foto asociada al bloque 87973572.

**Objeción**

La lectura comprende varios instantes. El control con el Comptroller verifica coherencia interna de escala y valoración. DefiLlama aporta contraste de implementación y precios, pero también depende de la cadena.

La huella almacenada por `lib.cjs` se calcula sobre el texto HTTP original, mientras el archivo conserva la respuesta JSON interpretada. Sin esos bytes originales, la huella de respuesta puede resultar imposible de recomputar exactamente.

**Cálculo y evidencia**

Las respuestas de `raw/01` abarcan **18:29:56–18:33:02 UTC**. `raw/09` abarca **18:46:16–19:18:06 UTC**. La venta se refiere al bloque **87973973**, 401 bloques posterior al bloque anunciado.

El margen del Comptroller coincide en 194 cuentas usando escala \(10^{15}\), con error relativo máximo de **0,1446 %**. Ese resultado valida la implementación aritmética frente al contrato, manteniendo dependencias comunes de precios y tipos de cambio.

`exchangeRateStored` y saldos de deuda almacenados tampoco equivalen a devengo actualizado al momento hipotético de retirada.

**Corrección sugerida**

Publicar intervalos y bloques efectivos por componente. Describir las dependencias comunes de cada control y conservar los bytes originales para verificar las huellas de respuesta.

### R1-10 · media · tipo cifra · Unidades y límites de las capas 2 y 3

**Afirma**

Secciones 5 y 6, USDT obtenibles, caja disponible y salidas oficiales.

**Objeción**

La conversión de tamaño del motor utiliza correctamente cantidad de tokens por precio de referencia. El generador introduce después un recorte arbitrario al valor del oráculo.

Además, toda la caja incluye reservas del protocolo. Una liquidación global de la caja puede superar los derechos de retirada de los depositantes.

**Cálculo y evidencia**

SUN viejo tiene **217.462,23 $** de caja al oráculo y **359.687,51 USDT** de salida estimada. El generador recorta **142.225,28 USDT**. Ese recorte explica la diferencia entre 263,48 y 263,33 M$.

WBTT usa aproximadamente **443.999,28 $** de tamaño del motor frente a **159,8 k$** al oráculo. `12` incorpora ese cambio de valoración, por lo que atribuirle automáticamente un error de escala sería incorrecto.

USDT ya disponible contiene **160.561.696,17 unidades**, frente a **160.472.534,65 $** al precio del oráculo. La tabla llama USDT obtenibles a esta última valoración.

La PSM contiene **88.033.392,94 USDT**. Equivale aproximadamente al **21,76 %** de la caja nueva de USDD y al **7,60 %** de su oferta total. `15` y `16` acreditan comisiones cero y banderas habilitadas. El saldo del GemJoin sigue siendo una condición de capacidad, pendiente de verificar íntegramente autorizaciones y ejecución.

La caja de los restantes tokens, usando las exclusiones de la sección 6, suma **33,63 M$**, frente a los 34,18 M$ indicados.

**Corrección sugerida**

Separar unidades USDT y valoración en dólares. Retirar el recorte de SUN o explicarlo como convención. Limitar la cantidad vendible a derechos efectivamente retirables y describir la PSM como capacidad compartida condicionada.

### R1-11 · media · tipo control · Simulaciones de retirada y código 14

**Afirma**

Sección 9, 12 retiradas permitidas, cinco rechazadas y una sin respuesta. El error de caja insuficiente carece de prueba directa.

**Objeción**

El recuento coincide. Las pruebas individuales reutilizan el estado inicial, por lo que carecen de alcance para validar la carrera secuencial. El argumento de que ninguna cuenta posee más reclamo que la caja describe la muestra y el estado consultado.

**Cálculo y evidencia**

Reconté `16`, con 12 códigos cero, cinco códigos tres y uno nulo para retirada total. Las peticiones superiores a caja pueden fallar antes por saldo propio insuficiente, como muestran los códigos nueve.

En `17`, la salida de los tres mayores USDT suma **159.604.348,08 $** y deja **868.186,57 $**. Ese estado posterior exige una simulación con mutaciones sucesivas para probar el camino de insuficiencia de caja.

**Corrección sugerida**

Conservar «sin prueba directa del código 14». Verificar mediante ejecución local con estado modificable la retirada sucesiva y el orden real de validaciones.

## Parte A — Verificaciones hechas

| Archivo | Qué recalculaste | Resultado |
| --- | --- | --- |
| `01` y `raw/01` | Decodificación de caja, oferta jToken, cambio, préstamos y reservas en 24 mercados | Coincide, 120 valores |
| `01`, `03` | Precio USD mediante escala \(10^{33-d}\) y TRX/USD 0,3132 | Coincide |
| `01`, `04` | Reclamos mediante multiplicación entera y escala \(10^{18}\) | Coincide |
| `01`, `04` | Totales de reclamos, caja y préstamos | Coincide, 3.419,37 / 3.216,45 / 205,20 M$ |
| `04` | Cobertura USDT y préstamos sobre reclamos | Coincide, aproximadamente 52,62 % y 47,45 % |
| `05` | Coincidencias iniciales caja/saldo | Coincide en 22/24 |
| `raw/06` | Caja y saldo de jTRX y jSTRX | Coincide en la lectura posterior |
| `06`, `lib.cjs`, `raw/06` | Cuatro controles independientes | No coincide, llamadas reutilizadas |
| `05` | Caja ETH sobre oferta del contrato correspondiente | Coincide, 99,6983 % |
| `08`, `01` | Concentraciones top 1/3/10 mediante saldos jToken | Coincide |
| `08`, `17` | Carrera USDT y remanente tras top tres | Coincide, 868.186,57 $ |
| `09`, `24` | Deuda observada y cobertura del total | Coincide, 81,7164 % |
| `09`, `24` | Cinco tramos de proximidad a liquidación | Coincide |
| `09`, `24` | Composición de poder de garantía por símbolo | Coincide |
| `09`, `24` | Deuda USDT con garantía USDD ≥90 % | Coincide, 92.648.975,03 $ |
| `09`, `24` | Estrés ETH/BTC sobre poder residual | Coincide, 13.217.007,11 $ y 51 cuentas |
| `09`, `26` | Escala del margen y error relativo | Coincide, 194 cuentas y máximo 0,1446 % |
| `11`, `12`, generador | Suma de salidas y recorte al valor del oráculo | Coincide aritméticamente |
| `11`, `venta/` | Ejecución conjunta y exactitud del motor | No verificable con el motor incluido |
| `13` | USDT de la PSM y cobertura de oferta USDD | Coincide, 88,03 M y 7,60 % |
| `15`, `16` | Comisiones PSM y habilitación declarada | Coincide |
| `16` | Recuento de retiradas totales | Coincide, 12/5/1 |
| `20`, `keccak.cjs`, `raw/20` | Selector y `owner_address` de emisión ETH | Coincide |
| `21`, `25`, `raw/21` | Emisiones BTC listadas y saldo emisiones menos quemas | Coincide en suma, difiere de oferta actual |
| `03`, `raw/03` | Retardo del Timelock | Coincide, 172.800 segundos |
| `28`, `29` | Parámetros del oráculo e intervalos de actividad | Coincide en valores observados |
| `01` | Igualdad normalizada USDD/TUSD/BUSD con USDT | Coincide |

Sin objeción a las operaciones aritméticas principales identificadas como coincidentes, dentro del alcance de sus entradas.

## Parte B — Escenarios adversariales

El orden combina exposición, facilidad de activación y evidencia disponible. La plausibilidad se refiere al escenario descrito. Los importes valorados al oráculo pueden diferir del producto efectivo de venta.

### E1 · Activación de garantía ETH/BTC y extracción adicional

**Mecanismo y precondiciones**

Un titular de garantía aceptada puede abrir préstamos contra ella y retirar activos de otros mercados. Si el token se emite con coste inferior a la extracción y su respaldo resulta insuficiente, la deuda puede trasladar pérdidas a los depositantes. Se requieren permisos de emisión o control de garantía existente, factores positivos y préstamos habilitados.

**Evidencia a favor y en contra**

`01` asigna factor del 75 % a jETH principal y jBTC. `19`–`21` documentan emisión y depósitos históricos. `09` acredita 258,21 M$ de poder disponible en el mayor titular BTC.

Los diez grandes titulares examinados tienen deuda cero. La emisión ilimitada y la ausencia de respaldo quedan sin acreditar.

**Cuantificación propia**

| Activo prestable | Capacidad adicional aproximada |
| --- | ---: |
| USDT | 55,18 M$ |
| TRX | 19,02 M$ |
| USDD nuevo | 9,95 M$ |
| BTC | 5,63 M$ |
| U | 3,40 M$ |
| TUSD | 1,05 M$ |
| ETH principal | 0,66 M$ |
| Otros mercados habilitados | 1,38 M$ |
| **Total** | **96,26 M$** |

La fórmula aplica caja, préstamos vigentes, topes y pausas. Un préstamo USDT de 55,18 M$ exige aproximadamente **73,58 M$ de garantía** con factor del 75 %. El titular BTC ya supera esa necesidad.

La rentabilidad hipotética requiere que coste de adquisición o emisión, respaldo sacrificado y costes de ejecución sean inferiores al producto extraído. La pérdida definitiva depende de recuperación posterior.

**Plausibilidad**

Media para activación de préstamos. Indeterminada para emisión fraudulenta. El precedente demuestra capacidad histórica de emitir y depositar.

**Detectabilidad y alerta**

Activación de mercados, emisiones, depósitos y nuevos préstamos son observables. La anticipación puede ser nula si se combinan operaciones. El panel debe mostrar capacidad adicional por mercado y por gran titular, con alerta inmediata ante emisión seguida de endeudamiento.

**Prueba pendiente**

Código y permisos de emisión, límites efectivos, respaldo externo y simulación completa de préstamos hasta el tope.

### E3 · Despegue de USDD y competencia por la PSM

**Mecanismo y precondiciones**

Un despegue reduce el valor realizable de USDD y desencadena demanda de USDT en la PSM. Si el oráculo mantiene la paridad, las posiciones pueden continuar formalmente sanas mientras deteriora su respaldo económico. Si actualiza el precio, aparecen liquidaciones y competencia por liquidez.

**Evidencia a favor y en contra**

`09` y `24` muestran 126,26 M$ de poder de garantía USDD y 92,65 M$ de deuda USDT con composición USDD ≥90 %. `13` aporta 88,03 M USDT a la PSM.

Las comisiones cero, habilitación y uso reciente de `14`–`16` favorecen arbitraje estabilizador. El paquete muestra paridad aproximada en la fecha observada.

**Cuantificación propia**

Revaloricé exclusivamente el colateral USDD de las 251 cuentas con deuda superior a 1.000 $. Mantuve las deudas y demás precios constantes y omití respuestas de usuarios y liquidadores.

| Caída USDD | Cuentas con déficit ajustado | Deuda de esas cuentas | Déficit ajustado agregado | Déficit sobre colateral bruto |
| --- | ---: | ---: | ---: | ---: |
| 5 % | 18 | 63,83 M$ | 1,36 M$ | 0,014 M$ |
| 10 % | 29 | 89,57 M$ | 5,30 M$ | 0,014 M$ |
| 20 % | 35 | 96,17 M$ | 14,99 M$ | 1,89 M$ |
| 50 % | 58 | 115,58 M$ | 48,76 M$ | 36,57 M$ |
| 100 % | 68 | 118,48 M$ | 109,93 M$ | 107,58 M$ |

Estas cifras incluyen déficits preexistentes. La PSM equivale al 95,02 % de los 92,65 M$ señalados, pero comparar deuda y reserva omite el premio de liquidación, otros tenedores y el resto del colateral.

**Plausibilidad**

Media como estrés. El paquete acredita dependencia y capacidad limitada, con funcionamiento contemporáneo de la PSM.

**Detectabilidad y alerta**

La desviación de mercado y las salidas de la PSM pueden preceder al déficit contractual. Alertar por desviación persistente, reserva disponible, ritmo de agotamiento y deuda económicamente vulnerable usando precio externo.

**Prueba pendiente**

Código de la PSM y del proxy de precios, profundidad conjunta, autorizaciones y simulación dinámica de liquidaciones.

### E4 · Corrida de los mayores depositantes USDT

**Mecanismo y precondiciones**

Los grandes depositantes retiran en un intervalo corto y consumen la caja. Los siguientes conservan derechos frente al mercado, pero su salida depende de repagos o nuevos depósitos. Se supone ausencia de entradas compensatorias.

**Evidencia a favor y en contra**

`08` y `17` muestran concentración suficiente. `16` devuelve éxito individual a los tres mayores USDT.

Los préstamos todavía constituyen activos del mercado. El escenario demuestra bloqueo de liquidez inmediata, con pérdida definitiva pendiente de impagos.

**Cuantificación propia**

Los tres primeros retiran **159,60 M$**, un **99,46 % de la caja**. Quedan **0,868 M$**.

Aplicando la utilización \(B/(C+B-R)\), esta se aproxima al **99,56 %** después de esas salidas. Los reclamos restantes ascienden a aproximadamente **145,35 M$**.

**Plausibilidad**

Alta como vulnerabilidad mecánica. La probabilidad de retirada coordinada queda indeterminada.

**Detectabilidad y alerta**

Los movimientos de jTokens y retiradas se observan al ejecutarse. La anticipación puede ser nula. Alertar cuando el reclamo de un conjunto de grandes cuentas supera el 80 % de caja y después de cada retirada relevante.

**Prueba pendiente**

Modelo de tipos, existencia y posición del *kink*, tasas extremas y simulación secuencial. La tasa presente carece de capacidad para deducir la reacción futura.

### E2 · Compromiso del publicador o retraso del oráculo

**Mecanismo y precondiciones**

Un precio inflado permite endeudamiento excesivo contra colateral sobrevalorado. Una caída artificial puede habilitar liquidaciones injustas. La velocidad depende de reglas de anclas y permisos que el paquete solo identifica parcialmente.

**Evidencia a favor y en contra**

`28` y `29` identifican un publicador, administrador de anclas, parámetro del 10 % y periodos de 600 bloques. Los controles de precios presentes muestran concordancia aproximada con referencias.

El código efectivo y las actualizaciones por activo quedan pendientes. La ausencia de contrato en una dirección tampoco determina cuántas claves o permisos la controlan.

**Cuantificación propia y condicional**

Si el precio pudiera crecer un 10 % compuesto por periodo,

\[
P_n=P_0(1,1)^n.
\]

Para duplicarlo hacen falta **ocho periodos**, aproximadamente cuatro horas. Con 10 M$ de colateral inicial y factor del 75 %, alcanzar 55,18 M$ de capacidad exige **21 periodos**, aproximadamente 10,5 horas, suponiendo deuda inicial cero.

El tope USDT deja extraer **55,18 M$ adicionales** con la configuración fotografiada. Agotar sus **160,47 M$ de caja** mediante nuevos préstamos requeriría modificar el tope u otros cambios compensatorios.

Si el precio real cae al 50 % en una hora y el oráculo solo puede bajar 10 % por periodo, después de dos periodos seguiría en 81 %. Sobrevaloraría el activo un **62 %** respecto al precio real. Llegar al 50 % exige siete periodos, unas 3,5 horas desde el inicio del ajuste.

**Plausibilidad**

Media para retraso y error operativo. Indeterminada para compromiso. Los tiempos anteriores son especulación condicionada a la semántica real del límite.

**Detectabilidad y alerta**

Observar precios por activo, llamadas, anclas y desviaciones externas. Un monitor horario puede perder dos publicaciones. Alertar por cada actualización y por ausencia de actualización, con referencia al último bloque válido.

**Prueba pendiente**

Código del proxy y oráculo, eventos y argumentos históricos, permisos y mecanismo exacto de anclaje.

### E7 · Liquidaciones inviables por colateral ilíquido

**Mecanismo y precondiciones**

El liquidador paga deuda y recibe colateral con premio nominal del 8 %. Si venderlo consume ese premio, la liquidación puede carecer de incentivo económico. El factor de cierre limita la deuda atendida en una operación y deja exposición pendiente.

**Evidencia a favor y en contra**

`02` fija incentivo 1,08 y cierre del 50 %. `11` muestra costes a 1 M$ de 87,46 % para ETH y 47,62 % para BTC.

La existencia de salidas privadas o custodia con canje podría mejorar la realización. El paquete carece de capacidad para verificarlas.

**Cuantificación propia**

Con coste proporcional de venta \(s\), el ingreso por cada dólar repagado sería \(1,08(1-s)\). El umbral de equilibrio previo a costes adicionales es

\[
s \le 1-\frac1{1,08}=7,4074\%.
\]

A los costes indicados, se recuperarían aproximadamente **0,135 $ para ETH** y **0,566 $ para BTC** por dólar de deuda repagada.

El mayor deudor debe 8,53 M$, principalmente contra BTC. Un cierre inicial del 50 % implica aproximadamente **4,27 M$ de repago** y **4,61 M$ de colateral nominal**. La curva disponible carece de garantía suficiente para acreditar una realización rentable de esa operación.

El estrés ETH/BTC a cero deja **12,29 M$ de déficit sobre colateral bruto residual** en la muestra. Constituye un estrés de pérdida, separado del cálculo ajustado de 13,22 M$.

**Plausibilidad**

Alta para insuficiencia de SunSwap en liquidaciones grandes. Media para paralización económica general, dadas las salidas externas desconocidas.

**Detectabilidad y alerta**

La detectabilidad previa requiere cotizar cada lote liquidable y su realización conjunta. Alertar por beneficio neto negativo del liquidador y por deuda liquidable sin liquidaciones ejecutadas.

**Prueba pendiente**

Simulación de `liquidateBorrow`, redención del colateral recibido, costes de energía, rutas ejecutables y capacidad privada de canje.

### E9 · Caída correlacionada de TRX, sTRX y USDD

**Mecanismo y precondiciones**

Una crisis del ecosistema puede reducir simultáneamente precios, capacidad de conversión y funcionamiento de proveedores. sTRX añade dependencia del mecanismo de desbloqueo y del precio futuro de TRX. La correlación efectiva constituye una hipótesis.

**Evidencia a favor y en contra**

`24` asigna poder de garantía de 126,26 M$ a USDD, 20,69 M$ a sTRX y 11,33 M$ a TRX. Suman aproximadamente el **75,5 % del poder total** de las cuentas deudoras examinadas.

La dependencia común de red resulta observable. La coincidencia de control de todas las entidades y reservas requiere pruebas adicionales.

**Cuantificación propia**

Apliqué una caída simultánea del 50 % a esos tres colaterales, manteniendo todas las deudas constantes. Resultan **109 cuentas** con déficit ajustado, **131,98 M$ de deuda afectada** y **55,05 M$ de déficit ajustado**.

Mantener deudas TRX/sTRX constantes hace este ejercicio conservador para quienes deben esos activos. La caja de TRX y sTRX suma aproximadamente **1.233,2 M$** al precio inicial.

**Plausibilidad**

Media. La concentración está medida y la magnitud del choque es especulativa.

**Detectabilidad y alerta**

Mostrar exposición conjunta, precio sTRX/TRX, colas de desbloqueo, reservas PSM y disponibilidad de red. Anticipación indeterminada. Recalcular margen y realización con choques correlacionados.

**Prueba pendiente**

Mecánica contractual de sTRX, plazos reales, capacidad de desbloqueo, reservas externas y sensibilidad de las deudas denominadas en los mismos activos.

### E5 · Cambio de gobierno o implementación

**Mecanismo y precondiciones**

Una autoridad con capacidad suficiente puede modificar precios, factores, topes o implementación. Un cambio puede aumentar extracción, provocar liquidaciones o impedir operaciones. El alcance depende de la ruta concreta y de sus permisos.

**Evidencia a favor y en contra**

`02`, `03` y `23` muestran administración común, proxy, funciones administrativas y retardo configurado de 48 horas. El retardo ofrece una ventana potencial de reacción.

La identidad y permisos efectivos del administrador del Timelock, las colas y las vías externas al Timelock carecen de verificación.

**Cuantificación propia**

Como exposición inmediata de referencia, USDT tiene **160,47 M$ de caja** y **304,96 M$ de reclamos**. Un bloqueo total afectaría la disponibilidad de esos reclamos.

Elevar el tope de USDT desde 200 M de unidades a un nivel suficiente podría desbloquear los **105,29 M$ de caja** que permanecen fuera de la capacidad adicional actual de préstamo. Esa extracción requeriría además garantía admitida y ejecución autorizada.

**Plausibilidad**

Media como riesgo estructural. El paquete carece de indicios de una propuesta maliciosa.

**Detectabilidad y alerta**

Monitorizar propuestas, `queueTransaction`, destino, firma, argumentos, ETA, cancelación y ejecución. La anticipación sería de 48 horas desde el encolado si esa ruta y retardo gobiernan efectivamente la operación. Alertar también por permisos y anclas del oráculo.

**Prueba pendiente**

Código y cola del Timelock, gobierno superior, permisos y simulación del efecto de cada operación administrativa.

### E6 · Donación, redondeo y mercados concentrados

**Mecanismo y precondiciones**

Un mercado con oferta jToken mínima puede permitir que una donación altere fuertemente el tipo de cambio y produzca redondeos perjudiciales. La viabilidad depende de oferta en unidades mínimas, reglas de acuñación, colateralización y límites. Tener pocos titulares solo señala concentración.

**Evidencia a favor y en contra**

`08` presenta cinco titulares en U, 24 en USD1 y 14 en WBTC. Sin embargo, `01` muestra ofertas de aproximadamente **499,13 millones de jU**, **64,65 millones de jUSD1** y **8.907,62 jWBTC**, todos con ocho decimales.

Estos valores contradicen la premisa de oferta casi vacía en la fotografía actual.

**Cuantificación propia**

La unidad mínima de jWBTC representa aproximadamente

\[
\frac{1}{8907,62\times10^8}\approx1,12\times10^{-12}
\]

de la oferta. En U la fracción es todavía menor. El paquete carece de evidencia para asignar una pérdida positiva ejecutable a un ataque actual de primer depositante.

Como exposición a concentración, U tiene **3,41 M$ de caja** y su mayor dirección posee aproximadamente **99,99994 %** de los jTokens.

**Plausibilidad**

Baja para primer depositante en el estado observado. Media para riesgo de concentración y para futuras situaciones posteriores a salidas masivas.

**Detectabilidad y alerta**

Alertar por oferta jToken en unidades mínimas, saltos del tipo de cambio, transferencias directas al mercado y caídas de oferta. Una donación adversarial puede carecer de aviso previo.

**Prueba pendiente**

Código de mint/redeem, redondeos, mínimos, evolución histórica de oferta y simulación local de donaciones.

## Parte B — Ataques contra el informe y el panel

### E8 · Manipulación de datos, cobertura y clasificación

**Mecanismo y precondiciones**

El adversario puede repartir posiciones, manipular temporalmente pools, aprovechar etiquetas engañosas o inducir fallos de lectura. El panel hereda además fallos ordinarios de proveedores, caché y selección de muestra. La clasificación puede ocultar esas limitaciones si convierte datos ausentes en resultados aparentemente completos.

**Evidencia a favor y en contra**

`lib.cjs` conserva respuestas y peticiones, y `abi.cjs` declara fallo ante respuesta vacía. Esas medidas permiten inspección posterior.

Persisten rutas problemáticas en `09-cuentas.cjs`. Si falla `getAssetsIn`, continúa con lista vacía. Si falla `getAccountSnapshot`, omite la posición. Tampoco verifica el código de error del snapshot antes de usar sus valores.

La caché ya invalida las cuatro repeticiones independientes anunciadas en `06`.

**Cuantificación propia**

- La fracción de deuda descubierta ya suma **37,52 M$**. El panel carece de información para asignarle composición segura.
- Una lectura de deuda perdida podría alterar materialmente los **167,68 M$** observados, según qué cuenta falle.
- WTRX y sTRX aportan conjuntamente **81,90 M USDT**, aproximadamente el **31,1 %** del agregado anunciado. Sus curvas no monótonas y rutas compartidas justifican tratarlas como dependencia relevante del cálculo.
- Dividir una posición del 30 % entre cien direcciones reduciría cada participación al 0,3 % manteniendo el control económico. Es un ejemplo hipotético de evasión de umbrales por dirección.

**Plausibilidad**

Alta para errores de proveedor y obsolescencia. Media para manipulación dirigida. El paquete acredita fallos metodológicos concretos, con intención adversarial sin demostrar.

**Detectabilidad y alerta**

El panel debería incorporar las siguientes reglas concretas.

| Ataque o fallo | Indicador y tratamiento |
| --- | --- |
| Lectura ausente o error contractual | Estado desconocido y conservación de la última lectura válida con edad visible |
| Posiciones omitidas | Número esperado y recibido de snapshots, códigos de error y deuda sin explicar |
| Datos de distintos instantes | Bloque y fecha por componente, con edad máxima antes de retirar clasificación |
| Tokens con símbolo repetido | Identidad por red y dirección de contrato, con decimales verificados |
| Etiquetas manipuladas | Fuente y fecha de etiqueta, separadas de cualquier atribución de control |
| Reparto entre direcciones | Concentración por dirección y agrupaciones justificadas mediante evidencia |
| Manipulación puntual de pools | Comparación entre observaciones y referencias, con alerta por cambios de reservas y precio |
| Ventana de ticks agotada | Cobertura del motor desconocida y rango efectivo visible |
| Suma de rutas compartidas | Simulación conjunta con reservas actualizadas |
| PSM disputada | Reserva total compartida, ritmo de salida y habilitación |
| Margen contractual engañoso por precio | Margen económico alternativo usando precios y realizabilidad externos |

**Objeción al semáforo de la sección 11**

Las reglas propuestas se solapan. Un importe con caja superior a diez veces su tamaño y coste de venta del 3 % satisface una condición de recuperación si hay salida oficial suficiente y también una condición de parcialidad. ETH/BTC puede recibir clasificación comprometida por salida oficial no verificada incluso para importes pequeños con venta disponible.

El umbral de diez veces carece de calibración presentada. En USDT permitiría evaluar favorablemente determinados importes mientras tres direcciones pueden consumir el 99,46 % de caja. La consulta manual también necesita comprobar deuda propia y restricciones contractuales.

Debe establecerse precedencia explícita entre reglas, incluir un estado desconocido y mostrar por separado disponibilidad contractual, producto ejecutable de conversión, plazo y dependencia de terceros. La frecuencia horaria admite retrasos de hasta aproximadamente una hora, más el tiempo de lectura.

**Prueba pendiente**

Ensayos de fallos de proveedor, snapshots incompletos, datos obsoletos, manipulación de pools y reclasificación del semáforo con entradas contradictorias.

## Lo que no pude comprobar

- **Exactitud y ejecutabilidad del motor de venta.** La copia importa módulos externos al paquete. Sus curvas permiten revisar agregación y coherencia, pero faltan implementación completa y pruebas para reproducir el cálculo.
- **Cota conjunta de conversión.** Falta una secuencia de ventas con actualización de estado y costes de ejecución.
- **Código efectivo y permisos.** ABI, parámetros y transacciones seleccionadas resultan insuficientes para acreditar ausencia de bloqueo, cobertura universal del Timelock, emisión ilimitada o semántica exacta de anclas.
- **Respaldo y canje externo de ETH/BTC.** Requiere evidencia de custodia, reservas y condiciones de retirada ajenas a los datos disponibles.
- **Historia íntegra de emisiones y quemas.** Los balances históricos recuperados difieren de la oferta publicada y el índice de TronScan presenta conteos ambiguos.
- **Deudores completos.** La muestra deja 37,52 M$ sin explicar y su reconstrucción puede omitir posiciones ante errores.
- **Tipos bajo estrés y *kink*.** Se identifican modelos de interés, pero falta su lectura y validación.
- **Prueba de insuficiencia de caja y liquidaciones sucesivas.** Las llamadas constantes individuales carecen de estado acumulativo entre operaciones.
- **Desbloqueo contractual de sTRX y capacidad íntegra de la PSM.** Faltan código, autorizaciones y simulaciones completas de canje.
- **Autenticidad externa de las respuestas.** Las peticiones y archivos permiten trazabilidad interna. La concordancia con cadena y las huellas sobre bytes HTTP originales requieren material adicional.

Los cálculos adicionales usaron los precios del paquete y mantuvieron deudas constantes en los escenarios indicados. El trabajo se realizó en solo lectura y sin red.