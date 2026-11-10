# Auditoría comparativa: informe de trazabilidad del robo a Binance, edición publicada (v0.7) frente a la última edición local (v0.9.3)

Fecha: 2026-11-10. Encargo del propietario: «No autorizaría todavía la publicación de la versión corregida. Primero pediría una auditoría comparativa de ambas versiones», con seis exigencias. Este documento las contesta una a una.

**Alcance:** solo lectura y cálculo. No se ha publicado nada, no se ha regenerado nada dentro del sistema vivo y no se ha tocado ningún fichero de las dos ediciones ni de los datos congelados. La decisión de qué edición queda como definitiva es del propietario.

**Quién audita y su límite:** esta auditoría la hace Claude (sesión del 10-nov). El informe auditado lo generó también Claude en sesiones anteriores, y las tres «revisiones externas» son sesiones nuevas de otro modelo de la misma familia (Claude Sonnet 5.5). **Ningún humano ni ningún sistema de otro fabricante ha revisado la v0.9.3.** Lo que aquí se afirma se apoya en cálculo reproducible y en lecturas de la cadena, no en la autoridad de quien lo firma.

---

## Resumen en una página

1. **La edición publicada es exactamente la v0.7** (misma huella en local, en el repositorio de la web y en lo que la web sirve hoy).
2. **La v0.9.3 es reproducible al céntimo:** el generador actual, con los datos congelados, vuelve a producir sus 967 cifras y textos sin una sola diferencia, y el mismo fichero de rastro perdido (misma huella).
3. **Capital y congelado no cambian** entre las dos ediciones (TRON 628.109.111 $, congelado 378.719.468 $; Ethereum 3.302.122.177 $).
4. **El importe corregido no son «11,6 M$».** Lo que de verdad se contaba dos veces en TRON son **10.175.908,95 $**, en tres causas:
   - JustLend: **7.064.354,07 $** (la v0.9 quitó 11.642.061,02 $; la 1.ª revisión demostró que 4.577.706,95 $ no eran doble conteo y se restituyeron: 2.439.057,95 $ a «sin localizar» y 2.138.649,00 $ siguen como préstamo).
   - Chainflip: **2.795.172,90 $** (33 transacciones).
   - Symbiosis: **316.381,98 $** (27 cruces revertidos).
5. **La cifra principal de TRON** pasa de −14.601.841,37 $ (v0.7) a −12.335.373,42 $ (v0.9.3). El puente entre ambas cierra **sin residuo** (§6). La v0.7 mezclaba en una sola cifra dos efectos de signo contrario (un exceso del modelo y una caída de precio de 7,91 M$).
6. **La v0.9.3 ya no presenta una cifra, sino un rango** según el método de atribución: −12,34 M$ (método actual), −3,01 M$ (ciclo), +2,91 M$ (con tope de conservación), +35,55 M$ (diluida, cota baja). Esa es la incertidumbre real del modelo; la v0.7 no la enseñaba.
7. **Evidencia en cadena:** leídas hoy en TRON (TronGrid) 98 transacciones que sostienen los tres dobles conteos: las 33 de Chainflip, las 54 de Symbiosis y una muestra de 11 de JustLend. **Las 98 coinciden** con los datos (remitente, destinatario e importe).
8. **Las tres revisiones no «aprobaron» nada:** la 1.ª dijo «no la daría por cerrada», la 2.ª «no firmaría la v0.9.1», la 3.ª «no firmaría la v0.9.2 tal cual». La v0.9.3 corrige lo que señaló la 3.ª, y **nadie ha revisado la v0.9.3 misma** salvo esta auditoría, que cubre sus cifras de TRON pero no todo (§7).

**Conclusión:** las correcciones numéricas de la v0.9.3 respecto a la v0.7 se sostienen por sus pruebas: se recalculan con código independiente, cierran sin residuo y las transacciones existen en la cadena. Lo que sigue sin resolver no es aritmética sino modelo (el rango del punto 6) y partes no auditadas (§7).

---

## 1. Identificador y fecha de cada versión

| | v0.7 (publicada) | v0.9.3 (local) |
|---|---|---|
| Generada | 2026-11-03 17:39:24 UTC | 2026-11-04 11:48:20 UTC |
| Datos hasta (corte) | 2026-11-02 09:23:00 UTC | 2026-11-02 09:23:00 UTC (el mismo) |
| Commit del generador | `f6ee51b` (3-nov 18:40 hora local) | `9056bb9` (4-nov 12:48 hora local) |
| Publicada | Sí: commit `d10de7f` del repositorio de la web (3-nov 18:45) | No |
| SHA-256 del informe (HTML) | `b7854eb8c1b23a5e78f3b2bd15e427e8f46d541735e2e71a02eea6618afe80d1` | `2946d37e628e16a7c86253631e5a712846b2bd4a52e241aea160de7e9eb85312` |
| SHA-256 de los datos (JSON) | `68bd3426181d4e1b0580f15ecc2430c4dd064f43452e704006b5b2193a6b58ab` | `83e92f927c9f2752437afb24c9726a1771adf7f589552e24abc77ed54d568b09` |
| SHA-256 del rastro perdido (CSV) | `9750c634e76e7bea6f6af12970315e10a4d3256ac9902d532319d0b96f7d2583` | `1dd07fff8fb892588aede70d111b13170a216b687500c5a80fe0e762f0cc4e2a` |

Comprobaciones hechas:
- La v0.7 local, la del repositorio de la web (`informe-completo.html` y la copia en `informes-entregados/`) y la que sirve hoy `schoolonchain-ux.github.io` tienen **la misma huella**.
- Regenerada la v0.9.3 en una carpeta temporal con el generador de `9056bb9` (sin cambios sin confirmar) y los datos congelados (`tramo5-v04`, `tramo6-v03`, precios del 2-nov): **967 hojas de 967 iguales**, 0 números distintos, 0 textos distintos; CSV con la misma huella. Los datos de entrada no se modificaron al regenerar.
- La v0.7 **no** se ha regenerado desde su commit (habría que reconstruir su entorno de datos de aquel momento); su identidad se establece por huella, no por regeneración.
- Las 35 pruebas del generador que tocan estas partidas pasan (ejecutadas en la copia temporal).
- Puesta a salvo: las 49 piezas de todas las ediciones (v0.1 a v0.9.3) copiadas a `D:\EquipoIA-backup-informe-trazabilidad-20261110` con su `SHA256SUMS.txt`; copia verificada idéntica. Antes solo existían en una carpeta fuera del control de versiones.

## 2. Comparación de las dos versiones

Fichero completo: `03-matriz-hoja-a-hoja.csv` (una fila por cifra o texto de los datos de cada edición).

| | Cantidad |
|---|---|
| Hojas de la v0.7 | 265 |
| Iguales en la v0.9.3 | 202 |
| Distintas | 63 (39 números, 24 textos) |
| Solo en la v0.7 | 0 |
| Solo en la v0.9.3 | 702 (secciones nuevas: vías de pureza sobre la misma base, puentes USDT0, controles 10 a 18) |

### TRON, partida a partida

| Partida | v0.7 | v0.9.3 | Cambio |
|---|---:|---:|---:|
| Congelados por Tether | 378.719.468,00 | 378.719.468,00 | 0 |
| Localizados en billeteras | 8.675.102,91 | 8.675.102,91 | 0 |
| En protocolos DeFi (préstamos y USDD) | 36.724.491,85 | 27.221.079,83 | −9.503.412,02 |
| En servicios, nodos y casas de cambio | 136.696.708,32 | 136.696.708,32 | 0 |
| Enviado a otras cadenas (puentes) | 52.353.938,57 | 49.242.383,69 | −3.111.554,89 |
| Sin localizar | 6.500.070,59 | 8.939.128,54 | +2.439.057,95 |
| Efecto de precio de la conversión USDT → TRX | 23.041.172,62 | 23.041.172,62 | 0 |
| Deriva de precio del TRX (partida nueva) | — | 7.909.441,00 | +7.909.441,00 |
| **Suma de partidas** | **642.710.952,86** | **640.444.484,91** | **−2.266.467,95** |
| Capital | 628.109.111,49 | 628.109.111,49 | 0 |
| **Diferencia (capital − suma)** | **−14.601.841,37** | **−12.335.373,42** | **+2.266.467,95** |

### Ethereum y global

| | v0.7 | v0.9.3 | Cambio |
|---|---:|---:|---:|
| ARB en Arbitrum (partida nueva, ESTIMADO) | — | 11.877.376,97 | +11.877.376,97 |
| Efecto de precio del oro (partida nueva, ESTIMADO) | — | 1.044.050,29 | +1.044.050,29 |
| Diferencia de Ethereum | −210.784.081,04 | −223.705.508,29 | −12.921.427,26 |
| Diferencia global | −225.385.922,41 | −236.040.881,72 | −10.654.959,31 |

El resto de partidas de Ethereum son idénticas.

## 3. Identificación exacta del importe corregido

Recalculado con código propio (`codigo/auditoria.cjs`, que no importa nada del generador), desde los datos congelados de los dos rastreos:

| Causa | Tramo 5 (después de la foto) | Tramo 6 (antes de la foto) | Total |
|---|---:|---:|---:|
| JustLend: quitado en la v0.9 | 6.645.187,64 | 4.996.873,37 | 11.642.061,02 |
| JustLend: restituido tras la 1.ª revisión | 2.439.062,29 | 2.138.644,65 | 4.577.706,95 |
| **JustLend: doble conteo real** | **4.206.125,35** | **2.858.228,72** | **7.064.354,07** |
| **Chainflip** | **1.309.563,70** | **1.485.609,20** | **2.795.172,90** |
| **Symbiosis** | **176.453,22** | **139.928,76** | **316.381,98** |
| **Total contado dos veces** | **5.692.142,27** | **4.483.766,68** | **10.175.908,95** |

Mi recálculo coincide con lo que publica cada edición, con diferencia 0,00 $ en las nueve cifras contrastadas (`02-puente-de-cifras.json`, apartado `recalculoPropio`): préstamo del tramo 5 y del tramo 6 en las dos ediciones, aumento de «sin localizar», y puentes del tramo 5 y del tramo 6 en las dos ediciones.

**Rectificación de lo que afirmé el 10-nov antes de auditar** («corrige un doble conteo de unos 11,6 M$»): 11,64 M$ es lo que quitó una edición intermedia (v0.9), y esa corrección estaba sobredimensionada. La cifra correcta es la de la tabla.

## 4. Evidencia de los dobles conteos

Fichero completo, transacción por transacción: `04-evidencia-por-transaccion.json` (cada depósito, cada envío de justificantes, cada redención, las 33 transacciones de Chainflip y los 27 cruces de Symbiosis, con sus identificadores, direcciones completas e importes).

### 4.1 JustLend (7.064.354,07 $)

Qué pasaba: una billetera deposita USDT en JustLend y recibe a cambio justificantes (jUSDT). Envía esos justificantes a otra billetera, que los canjea y recupera el USDT, y ese USDT sigue su camino y se cuenta en la partida donde acabe. La v0.7 contaba **además** el depósito original entero como «dinero en préstamos». El mismo dinero, dos veces.

- Tramo 5: 311 depósitos de 174 billeteras; 170 enviaron justificantes; 163 con doble conteo.
- Tramo 6: 120 depósitos de 77 billeteras; 74 enviaron justificantes; 71 con doble conteo.

Ejemplo completo (el mayor del tramo 6), leído hoy en la cadena:
1. `TLLpxir8LqZxGt7PXDKP7A189hrc61KcR1` deposita 573.892,36 USDT en JustLend el 30-oct 13:39:42 UTC. Transacción `f74a30e4441f9376ce55460b3cb0e6bb6a5f2ddc1bc0f7c6dc78b00e436795e8`.
2. 51 segundos después envía los 52.696.142,62 jUSDT recibidos a `TWBL7bEDLAucyrrd9WgAvgk1Rd8GFxBCaA`. Transacción `3393fe86907b0ae42d62dceac146519e5ee3075730aa848315761a60ac4fc62c`.
3. La receptora canjea 301.000 USDT antes de la foto (tres redenciones; la mayor, 200.000 USDT a las 13:49:12 UTC, transacción `db07aae2d7d1ee3267ac2f72ec0542ed5943d20dc81028eabc244eb1e394be62`).
4. Resultado: de ese depósito, el 52,4 % se sigue hasta su redención (300.238 $ era doble conteo) y el 47,6 % no se había canjeado a la hora de la foto (272.201 $ siguen como préstamo).

Lo que **no** era doble conteo y se restituyó:
- 2.439.057,95 $ del tramo 5: justificantes enviados por 7 billeteras al contrato `TTFwhTEP84QRNThixpWiHQK8a19q6v6enn`, que el rastreo no lee. No se sabe adónde fue: pasa a «sin localizar».
- 2.138.649,00 $ del tramo 6: justificantes recibidos por billeteras que no los habían canjeado a la hora de la foto. Siguen como préstamo.

Objeción de la 2.ª revisión que quedó sin cuantificar (su hallazgo H2): el método da por «canjeado» cualquier USDT que la receptora recibe de JustLend, sin exigir que sea posterior a la llegada de los justificantes, y no mira reenvíos de segundo nivel a contratos no leídos. **Medido ahora** (`codigo/orden-temporal.cjs`, `05-sensibilidad-justlend.json`): en estos datos no hay ninguna redención anterior a la llegada de los justificantes (0 de 4.233.475,74 $ en el tramo 5 y 0 de 2.896.521,18 $ en el tramo 6) ni ningún reenvío de segundo nivel a direcciones no leídas. Exigir el orden temporal no cambia ni un céntimo. La objeción es válida como debilidad del método, pero no afecta a estas cifras.

### 4.2 Chainflip (2.795.172,90 $)

Qué pasaba: 33 transacciones en las que una billetera envía USDT a la bóveda de Chainflip en TRON (`TEcDijvKSXcfWT7S6rd44H5vNgufm7Y4XC`) y, **en la misma transacción**, sale casi el mismo importe hacia otra billetera de TRON que el rastreo también sigue. La v0.7 contaba el depósito como «enviado a otra cadena» y además seguía la salida.

- En 28 de las 33, la salida es prácticamente el depósito (en los ejemplos leídos, 7 USDT menos). En 5 no (proporciones salida/depósito: 0,069, 0,081, 0,733, 0,797 y 1,912); en esas solo se quita la parte que la salida cubre.
- Las 33 salidas van a billeteras que el rastreo lee.

Ejemplo, leído hoy en la cadena: transacción `f627f22e96c95b4032f1f50e99f35d1d67605d915674c2c3de4c25bfe0fcf035` (30-oct 23:27:09 UTC): `TJtan1Fw2DyU3MFLgoXNUwT42tiLRv84FS` envía 159.192,775199 USDT a la bóveda y en la misma transacción salen 159.185,587093 USDT hacia `TYrbuz533nmpJCdrAqYVMQG9NaoNZhPjvt`.

### 4.3 Symbiosis (316.381,98 $)

Qué pasaba: 27 envíos al contrato de Symbiosis (`TPuaJ6gnYfE9gLUDFrbWbPx3tMnjG8max1`) cuyo cruce a otra cadena se revirtió y el dinero volvió, en USDT, **a la misma billetera de TRON que lo envió** (27 de 27). La v0.7 los contaba como «enviado a otra cadena» y además seguía la devolución como salida de esa billetera.

- Importe quitado: 316.381,98 $ (valor atribuido del envío). Devuelto en USDT: 326.368,95 $ (176.083,79 + 150.285,16), la cifra que cita la 3.ª revisión.

Ejemplo, leído hoy en la cadena: `TA4iZnpvJATkFc85XPat8mrjRNjXf2GDoU` envía 33.000 TRX (transacción `d0e3531433ba0ea2fa76e3bf9291748631e2d42f2fb06ac22d3cbdacde937820`) y recibe de vuelta 10.586,29959 USDT el 31-oct 12:44:12 UTC (transacción `03bdbd1c70aa55ad8badf28677f55b20925339ec69cfd354c04580fbca4d5fdc`).

### 4.4 Verificación en la cadena

Fuente: `api.trongrid.io` (eventos de la transacción, datos de la transacción y su recibo), leído el 10-nov-2026, sin clave. Para cada transacción se comprueba que existe, que terminó con éxito y que contiene la transferencia con el remitente, el destinatario y el importe que dicen los datos congelados.

| Qué | Transacciones leídas | Coinciden | Cobertura |
|---|---:|---:|---|
| Chainflip: depósito y salida en la misma transacción | 33 | 33 | Todas (100 % de los 2.795.172,90 $) |
| Symbiosis: envío y devolución a la misma billetera | 54 (27 envíos + 27 devoluciones) | 54 | Todas (100 % de los 316.381,98 $) |
| JustLend: depósito, envío de justificantes y redención | 11 | 11 | Muestra de 4 casos |
| **Total** | **98** | **98** | |

Ninguna discrepancia. Lecturas guardadas en `06-verificacion-en-cadena-muestra.json` y `07-verificacion-en-cadena-chainflip-symbiosis.json`.

Límite: de JustLend se ha verificado en la cadena una muestra (11 transacciones de 4 casos, incluidos los dos mayores del tramo 6, el mayor del tramo 5 y un envío al contrato no leído), no las 1.177 transacciones que intervienen (437 depósitos, 326 envíos de justificantes y 414 redenciones). Su total sale del recálculo sobre los datos congelados, no de releer cada una.

## 5. Resultado de las tres revisiones externas

Respuestas íntegras, sin editar: `research/polytrop-2026-11-03/codex/REV-v09-respuesta.md`, `REV2-v091-respuesta.md`, `REV3-v092-respuesta.md` (con el encargo que recibió cada una y sus metadatos). Las tres son sesiones nuevas de Claude Sonnet 5.5, en modo seguro, sin acceso a internet.

| | Revisó | Pudo ejecutar código | Veredicto literal | Qué encontró | Qué se hizo |
|---|---|---|---|---|---|
| 1.ª | v0.9 | Sí | «No la daría por cerrada» | Reprodujo las cifras al dólar. La corrección de JustLend estaba sobredimensionada: unos 4,6 M$ no eran doble conteo. El control 8b era circular. Doble conteo de Chainflip sin corregir. | v0.9.1: se restituyen 4,58 M$; se corrige Chainflip; se rehacen los controles. |
| 2.ª | v0.9.1 | **No** (la máquina no encontraba el programa; lo creyó una denegación) | «No firmaría la v0.9.1» | Sin recalcular nada: contradicciones visibles en el texto (sección 10 a cero, sección 6 sin 1,46 M$), posibles agujeros de lógica en JustLend y Chainflip, y que la diferencia depende del método (rango de −12,4 a +35,5 M$). | v0.9.2: textos y secciones corregidos; el rango pasa a la vista. Los agujeros de JustLend quedaron sin cuantificar (medidos en §4.1 de esta auditoría: efecto 0). |
| 3.ª | v0.9.2 | Sí | «No firmaría la v0.9.2 tal cual» | «Crítica: ninguna. Todo lo que repliqué cuadra»: reconstruyó TRON con código propio y reprodujo cada partida con 0,00 $ de diferencia. Pero: la cifra titular es un exceso del modelo, no una medida; los controles no detectaban errores de valoración (7 de 8 errores inyectados pasaban); doble conteo de Symbiosis confirmado; Chainflip no miraba el importe. | v0.9.3: Symbiosis y Chainflip corregidos; controles 16 a 18 nuevos; cuarta vía con tope de conservación; la cifra se presenta como rango. |

Las marcas «REVISIÓN INVÁLIDA» de la 2.ª y la 3.ª las pone el lanzador cuando cambia algún fichero durante la revisión. El historial del informe las explica como falsos positivos (bases de datos y un artículo que otro trabajo tocaba a la vez; el revisor no tenía herramientas de escritura). **No lo he verificado de forma independiente.**

Lo que las revisiones dejaron expresamente abierto y sigue abierto en la v0.9.3:
1. Ningún control detecta un precio horario mal en todas las horas.
2. Billeteras que sacan más de lo que se les ve entrar (2,06 M$ en el tramo 5): causa sin verificar.
3. Ethereum: el −188,6 M$ es una hipótesis (ventas de tokens); 6.551 ETH (unos 14,9 M$) llegaron después de la congelación y no están separados.
4. Los 8,68 M$ «localizados» y los 136,7 M$ de «servicios y nodos» son donde el modelo deja el dinero, no algo demostrado.
5. 565 contratos clasificados por regla; relevos de Chainflip emparejados por importe y hora.
6. Secciones 14 a 16 (Polytrop, Arkham, cuenta de gas): solo aritmética, no contra sus fuentes.
7. USDT0: 32 de las 73 aristas (3,69 M$ brutos) no tienen fila de llegada comprobada.

## 6. Reconciliación de los totales antes y después

Fichero: `02-puente-de-cifras.json`.

### TRON: de −14.601.841,37 $ a −12.335.373,42 $

| Paso | Efecto en la diferencia | Diferencia tras el paso |
|---|---:|---:|
| v0.7 publicada | | −14.601.841,37 |
| La deriva de precio del TRX pasa a ser una partida propia | −7.909.441,00 | −22.511.282,37 |
| JustLend: se quita el doble conteo real | +7.064.354,07 | −15.446.928,31 |
| Chainflip: se quita la parte que la salida ya sigue | +2.795.172,90 | −12.651.755,41 |
| Symbiosis: los 27 cruces revertidos dejan de ser puente | +316.381,98 | −12.335.373,42 |
| v0.9.3 | | −12.335.373,42 |
| **Residuo** | | **0,00** |

Sobre el primer paso: el capital valora el TRX al precio de la hora en que se recibe (226.348.470,87 $) y el reparto, al precio de la hora en que se reparte (218.439.029,87 $). Es el mismo TRX; el precio bajó entre medias 7.909.441,00 $. En la v0.7 esa caída no era una partida y quedaba dentro de la «diferencia», compensando en parte el exceso del modelo. Por eso la v0.7 enseñaba −14,6 M$ cuando el exceso de sus propias partidas era de −22,5 M$. La aritmética de la partida está comprobada; **su cálculo desde los movimientos originales (qué TRX, a qué hora, a qué precio) no lo he rehecho**.

Identidad del capital de TRON, comprobada: 378.719.468,00 (congelado) + 23.041.172,62 (efecto de la conversión) + 7.909.441,00 (deriva) + 218.439.029,87 (repartido, a precio de reparto) = 628.109.111,49 $.

### Ethereum: de −210.784.081,04 $ a −223.705.508,29 $

−210.784.081,04 − 11.877.376,97 (ARB declarado) − 1.044.050,29 (efecto de precio del oro) = −223.705.508,29. **Residuo 0,00.**

El saldo de Arbitrum lo he releído hoy en la cadena (RPC público `arb1.arbitrum.io`): 74.559.805,2 ARB y 8.426,05 ETH, idénticos a la lectura del 4-nov (mismos valores hexadecimales). No se ha movido. El importe en dólares es una estimación (precio del 2-nov; según la fuente varía ±3 %).

### Global: de −225.385.922,41 $ a −236.040.881,72 $

−225.385.922,41 + 2.266.467,95 (TRON) − 12.921.427,26 (Ethereum) = −236.040.881,72. **Residuo 0,00.**

### La cifra de TRON según el método (solo en la v0.9.3)

| Método de atribución | Diferencia de TRON |
|---|---:|
| Actual (el del informe) | −12.335.373,42 |
| Ciclo | −3.008.027,26 |
| Con tope de conservación | +2.913.719,14 |
| Ciclo con tope | +5.004.840,85 |
| Diluida (cota baja) | +35.553.395,21 |

Calculado como entrada menos suma de partidas por método, desde los datos de la propia v0.9.3. **No he auditado la definición ni el código de los métodos «ciclo», «tope» y «diluida»**; la 1.ª y la 3.ª revisión reprodujeron «actual» y «ciclo», y la 3.ª obtuvo para el tope un valor distinto (≈ +0,5 M$) con otra definición.

## 7. Lo que esta auditoría no cubre

- La v0.7 no se ha regenerado desde su commit; se identifica por huella.
- Los textos del informe v0.9.3 (11,6 MB de HTML) no se han leído enteros ni contrastado frase a frase con las cifras.
- Los métodos alternativos de atribución (ciclo, tope, diluida) y los controles nuevos 16 a 18: no auditados.
- Ethereum: solo las dos partidas que cambian y el saldo de Arbitrum. El resto es idéntico entre ediciones y no se ha vuelto a comprobar.
- Las partidas de TRON que no cambian (servicios y nodos, localizados, USDD, polvo): no recalculadas aquí (la 3.ª revisión las reprodujo sobre la v0.9.2).
- Precios horarios: se usa la misma serie que el informe; un error en esa serie no se detectaría.
- JustLend en la cadena: muestra, no la totalidad (§4.4).
- El panel interactivo de la web (`data.json`) se alimenta aparte del informe; el historial advierte que la partida nueva «Deriva de precio del TRX» saldría sin descripción en su diagrama. No revisado.

## 8. Observación fuera del alcance

La dirección de Arbitrum que guarda 8.426 ETH y 74,56 M ARB figura en los datos como `0x0000000000000000000000000000000000000da0`, una dirección casi nula. La lectura de hoy confirma que los saldos están ahí. Es una dirección de forma muy inusual y el informe (en las dos ediciones) no lo comenta. Leído hoy en la cadena: no tiene código de contrato y su contador de transacciones enviadas es 1, es decir, ha originado una transacción. No sé quién la controla ni cómo se generó (mi primera sospecha, que nadie tuviera su clave y los fondos estuvieran perdidos, no encaja con que haya enviado una transacción). No es un hallazgo: es una pregunta abierta que conviene resolver antes de cerrar el caso.

## 9. Opciones para el propietario

No recomiendo publicar por el número de versión. Lo que las pruebas permiten decir:

- **La v0.7 publicada contiene 10,18 M$ contados dos veces en TRON** y una cifra principal que mezcla dos efectos. Esto está verificado. Dejarla publicada sin aviso no encaja con la política de transparencia que se quiere construir.
- **La v0.9.3 es mejor en todo lo que se ha podido comprobar**, y más honesta sobre lo que no se sabe (rango en vez de cifra única, lista de puntos abiertos). Pero no ha tenido revisión ajena tras sus últimos cambios, y sus textos no están auditados.

Tres caminos, de menor a mayor compromiso:

1. **Aviso sobre la v0.7** (mínimo): la edición publicada se queda como está y lleva encima una nota fechada con los tres dobles conteos, el puente de cifras y el enlace a esta auditoría. No se publica edición nueva.
2. **Publicar la v0.9.3 como edición nueva conservando la v0.7** accesible con su huella, con el registro de cambios y esta auditoría enlazados. Requiere antes revisar los textos de la v0.9.3 y adaptar el panel de la web.
3. **Antes de lo anterior, una revisión de verdad ajena** (una persona, o un sistema de otro fabricante con acceso a la cadena) sobre la v0.9.3 y sobre esta auditoría.

## Ficheros de esta auditoría

| Fichero | Qué es |
|---|---|
| `01-INFORME-AUDITORIA.md` | Este documento |
| `02-puente-de-cifras.json` | Puente v0.7 → v0.9.3 (TRON, Ethereum, global), recálculo propio y rango por método |
| `03-matriz-hoja-a-hoja.csv` | Comparación de cada cifra y texto de los datos de las dos ediciones |
| `04-evidencia-por-transaccion.json` | Cada depósito, justificante, redención, transacción de Chainflip y cruce de Symbiosis |
| `05-sensibilidad-justlend.json` | Efecto de exigir orden temporal en las redenciones (objeción H2) |
| `06-verificacion-en-cadena-muestra.json` | Lecturas de TronGrid de la muestra (25 transacciones) |
| `07-verificacion-en-cadena-chainflip-symbiosis.json` | Lecturas de TronGrid de todos los casos de Chainflip y Symbiosis |
| `codigo/` | Los programas usados (independientes del generador) |
| `SHA256SUMS.txt` | Huellas de todo lo anterior |

Para repetirla: `node codigo/auditoria.cjs salida.json` (recálculo), `node codigo/puente.cjs <v0.7.json> <v0.9.3.json> salida.json <carpeta>` (puente y matriz), `node codigo/verificar-cadena.cjs salida.json verificacion.json` (cadena; con `TODO=1` verifica todos los casos de Chainflip y Symbiosis).
