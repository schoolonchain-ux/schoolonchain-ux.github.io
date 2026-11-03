# Historia de TRON tras el robo a Binance: qué pasó, adónde fue el dinero y qué se ha comprobado

**Qué es.** Un solo documento con todo lo ocurrido en TRON desde el robo del 29-oct-2026 hasta la mañana del 31-oct (10:17 UTC, 11:17 en Madrid): el robo, lo que congeló Tether, el reparto del TRX, el blanqueo, las llegadas a casas de cambio, **los puentes hacia otras cadenas (nuevo)**, por qué siguen llegando avisos al bot, y **una auditoría de las cifras contra datos nuevos de TronGrid y TronScan (nuevo)**. Reúne y corrige el [informe completo del 30-oct](INFORME-COMPLETO-ROBO-BINANCE-2026-10-30.md) y el [informe de trazabilidad del 31-oct](INFORME-TRAZABILIDAD-TRX-ROBO-BINANCE-2026-10-31.md); las cifras de aquellos informes se mantienen salvo lo que se indica en el apartado 9.

**Horas** en UTC salvo que se diga otra cosa (Madrid va una hora por delante desde el 25-oct). El TRX se valora a 0,352 $ y el USDT a 1 $. «Foto» = las 22:40 UTC del 30-oct, la hora a la que están fijadas las cifras del rastreo.

**Fuentes.** TronGrid y TronScan en vivo; Etherscan v2 (Ethereum y Arbitrum); LayerZero Scan (estado de los envíos por el puente USDT0); los registros de los dos vigilantes. Los datos en bruto están en `research/binance-0x5227-2026-10-30/tron/`.

---

## 1. Resumen

- **El robo en TRON:** 612.729.468 USDT y 46.394.098 TRX, sacados de Binance-Hot 7 en tres minutos (29-oct, 20:20 a 20:22).
- **Tether congeló 378.719.468 USDT** (61,8 %) de las dos primeras billeteras, 47 minutos después. El resto escapó: 234 M USDT que el ladrón cambió por **638.190.941 TRX**, más los 46,4 M TRX directos. En total **≈ 684,6 M TRX (≈ 241 M$)**.
- **Dónde está hoy el TRX escapado:**
  - **278.200.902 TRX (97,9 M$) siguen quietos en dos depósitos**: `TKkH2vH6…` (158,2 M) y `TJajtPqD…` (120 M). Ninguno ha emitido una sola transacción.
  - Los otros dos depósitos se han vaciado hacia la billetera de reparto `TRBdWq…`: `TL2F4Ghn…` el 31-oct a las 01:01 UTC y `TCBAz7it…` a las 07:58 UTC, 120 M TRX cada uno.
  - `TRBdWq…` ha recibido en total 406,4 M TRX, conserva unos **95 M TRX** y **ha repartido el resto**.
- **El ritmo se ha duplicado.** Hasta la foto, `TRBdWq…` repartía **2,5 M$ por hora** (379 envíos, 50,8 M$, 122 billeteras). **Desde la foto, en 11,5 horas, ha hecho 352 envíos por 58,5 M$ (5,1 M$ por hora) a 48 billeteras**, 33 de ellas nuevas. Esas 33 ya las tiene el vigilante (32 de 33), pero **este tramo posterior a la foto no está rastreado con el método del apartado 4**: solo se conoce el primer salto.
- **Adónde llegó lo rastreado (a la foto):** el 50 % a nodos de servicio, el 22 % retenido, el 9 % a préstamos (JustLend), el 5 % a puentes, el 1 % a USDD, el 3 % envíos menores; **11 % sin explicar**. **Ninguna billetera de paso envía directamente a una casa de cambio con nombre.**
- **Puentes (nuevo):** el dinero ha salido de TRON hacia Ethereum y Arbitrum por el puente USDT0 (LayerZero) en **186 envíos por 8,0 M$ brutos**; de ellos **183 llegaron y 3 no** (157.000 $, parados: apartado 6.2). Dentro del recorrido rastreado son **149 envíos, 5,07 M$ brutos, unos 3,9 M$ estimados del robo**. Una parte vuelve a TRON por THORChain (apartado 6.4).
- **Auditoría (nuevo, apartado 8):** de 16 transacciones de la cadena de custodia, 15 coinciden en todo con TronGrid y TronScan; **la decimosexta tenía mal la hora en mis informes** (01:01 UTC, no 01:01 de Madrid). De 120 envíos finales al azar coinciden las 120. El reparto de `TRBdWq…` recalculado desde cero da **exactamente** las cifras del informe. De 70 billeteras al azar, el rastreo no se dejó ninguna transferencia que TronScan sí lista. **Un fallo propio encontrado y corregido:** mi primera descodificación de puentes dejó fuera nueve envíos grandes y puso mal la pureza de ocho (apartado 8.4).

---

## 2. Cronología

| Hora (UTC) | Qué pasó | Hash |
|---|---|---|
| **29-oct 20:19** | Se crea `TG5iBMQ…`, la primera billetera del ladrón | |
| 20:20:00 | Binance-Hot 7 manda 10.000 TRX de prueba | `6f983ab745fbea298ec6376054fb16155f3142ec0d9f3fec4c053220cafc9644` |
| 20:21:12 | 46.384.098 TRX | `72f5fbedbc4d6f70113e139312eef09fb28a5fefd49d321bc1e28b6cea5bab9c` |
| 20:22:45 | **612.729.468 USDT** | `4203af9ca1833d09c05666eafbd70d703a3811c0bdcf125106685ab75958253e` |
| 20:45:51 y 20:56:09 | `TG5iBMQ…` pasa 100 M y 200 M USDT a `TPBkSj…` | `fd8061aaa787ce89d707184dbfdd436a578c7840d674505067725de727c06222`, `d40f96e23e95b7ace0ebacd3892f0a1f37555a64da69feedba73443dee4920ee` |
| 20:47 a 21:14 | `TPBkSj…` hace 16 cambios en SunSwap: 234 M USDT por 638,19 M TRX | |
| 20:56:12 | 288.330.000 TRX a `TSpe5HC3…` | `4b329d4495bcdd8df40117cd478f13c5027988147c7deb9add5e4aee3b8107c4` |
| **21:09:12** | **Tether congela `TG5iBMQ…` (312.729.468 USDT)** | `71b0ec0fe873fe820c37cc3ecbab4e83087f87e833d191012a0a4027d20594e1` |
| 21:16 | El ladrón aparta 65.990.000 USDT en `TCzBTk…` | |
| 21:17:39 | Tether congela `TPBkSj…` (vacía) | `bc4e4a76bd262307a4d005d9745e2e8cf3bfe7d38e2ae4d5fcfaa40376721f40` |
| **21:21:12** | **Tether congela `TCzBTk…` (65.990.000 USDT)** | `176a5783fd70f5abbae9569f60398afe5307eefa9d06982ae5a9351e2cbc0f13` |
| 21:42:42 | 349.860.942 TRX a `TSpe5HC3…` | `fb5089f5ce2ae9be6f8e5e3f78470a5a8d694879ac68f6c8cfe3d81450fa6149` |
| 21:43:27 | 9.987 TRX de `TCzBTk…` a `TSpe5HC3…` | `f4d4e4c665c301159ba35210db65377908f764789480b5b2a2b371494b42245a` |
| **30-oct 00:06:09** | `TG5iBMQ…` manda los 46,4 M TRX directos a `TRBdWq…` | `6adfc066520a5880df18eebc61bf048d03e8d7a0fca23b04a6b36c9723892736` |
| 02:19 | `TRBdWq…` empieza a repartir | |
| **10:15 a 10:20** | `TSpe5HC3…` reparte los 638,2 M TRX en cinco envíos (apartado 3) | |
| 10:20:48 | `TAk1xJNW…` pasa sus 120 M a `TRBdWq…` | `0ae2b5a4e1c8849d09e16db5a4dd9d90f7224c3b996a80ccad113bd5b81acd39` |
| 17:00 a 17:30 | 37 bloqueos de Tether a direcciones sin relación visible con el recorrido | |
| 22:05 a 22:12 | Tether bloquea 6 direcciones más (2 de ellas ya vigiladas) | |
| **22:40** | **Foto** del rastreo | |
| **31-oct 01:01:15** | `TL2F4Ghn…` manda 120 M TRX a `TRBdWq…` | `bb05d43bfde6cb869448ad03bf06969e32cc7cd77252a78d41dd7f7c26dbf0b3` |
| **07:58:48** | `TCBAz7it…` manda 120 M TRX a `TRBdWq…` | `d3684f76b615028b350c294c2c774313af2212319de653f5a04ff68bc351d465` |
| 10:11 | Último envío de `TRBdWq…` incluido en este documento | |

---

## 3. El reparto del 30-oct y dónde está hoy

`TSpe5HC3PRD2svJcr1YoGszhHk2mtkyZ8A` guardó el TRX toda la noche y entre las 10:15 y las 10:20 UTC lo repartió:

| Hora (UTC) | A | TRX | Hash | Estado hoy |
|---|---|---|---|---|
| 10:15:21 | `TAk1xJNWuBYvJHLsUiBFLeuK6xvpQUFYP5` | 120.000.000 | `9d0904db84e640d37e9fee8badef0883043db77f5bf9c87ca76e220e0c35c487` | pasó todo a `TRBdWq…` a las 10:20:48 |
| 10:18:09 | `TL2F4GhnaFVZBZPncHYjwfYZFW44NcfVwj` | 120.000.000 | `16585e9664a0e7e74d67caeba2ecdc9869ec9a84a287dc078a12d34ca078c0d1` | **vaciada** el 31-oct 01:01:15 → `TRBdWq…` |
| 10:18:42 | `TCBAz7itvtX5CjBzVMPQdrbwQLN63ao1fk` | 120.000.000 | `037428516b343a326157ae75495ad3227b43e4a4cb0c8c3837e849d7a18d556e` | **vaciada** el 31-oct 07:58:48 → `TRBdWq…` |
| 10:19:24 | `TJajtPqDqUGh1Sr1j8ugHoSXBVpaFLLHKT` | 120.000.000 | `3db47d891cc211c300f9ba1aec264bfca8f9e32fbe220c411f30789a31ac8370` | **quieta** |
| 10:20:18 | `TKkH2vH6kyi2QKcMbqym53WMuvdd1xvw6K` | 158.200.900 | `aff887c4be7cd52eb8905899fc9596eaaf9c49dea59129519ce25d7c69762334` | **quieta** |

Total repartido: 638.200.900 TRX.

**Saldos leídos hoy en las dos fuentes** (coinciden al TRX):

| Billetera | TRX | USDT |
|---|---|---|
| `TKkH2vH6…` | 158.200.902 | 0 |
| `TJajtPqD…` | 120.000.000 | 0 |
| `TCBAz7it…` | 0 | 0 |
| `TL2F4Ghn…` | 0 | 0 |
| `TRBdWq…` | 97.213.060 (94.976.173 en una lectura posterior) | 3 |
| `TSpe5HC3…` | 37 | 0 |
| `TG5iBMQ…` | 0 | **312.729.468 (congelados)** |
| `TCzBTk…` | 0 | **65.990.000 (congelados)** |

**Tether, comprobado en cadena:** `TG5iBMQ…` y `TCzBTk…` están bloqueadas y siguen teniendo dentro 312.729.468 y 65.990.000 USDT. Binance-Hot 7 no está bloqueada. El contrato de USDT registra hoy **67 bloqueos de 66 direcciones** desde el 29-oct (el informe del 30-oct contaba 61 de 60: los 6 nuevos son de las 22:05 a las 22:12 del 30-oct). Las 51 direcciones de la «segunda oleada» siguen todas bloqueadas; hoy suman 5,28 M USDT dentro (el informe decía 3,41 M; no sé por qué han subido: un bloqueo impide sacar, no recibir).

---

## 4. El blanqueo, a la hora de la foto

**Cómo se midió.** Cada billetera que recibe 10.000 TRX (3.520 $) o más del robo se lee en vivo y se siguen sus salidas, sin tope de saltos, billeteras ni días: **1.347 billeteras en 18 niveles** desde `TRBdWq…`, y otras 2.898 en el segundo tramo. La parte que es del robo en cada billetera se calcula con la regla de la mezcla proporcional. Los cambios en enrutadores (SunSwap, BWSwap…) no cortan la traza: se descodifica cada cambio para ver adónde va el resultado.

**Dónde acaban los 50,8 M$ que `TRBdWq…` repartió hasta la foto:**

| Destino | Dinero del robo | Parte |
|---|---|---|
| Nodos de servicio (billeteras con miles de operaciones) | 25,3 M$ | 50 % |
| Retenido en billeteras del recorrido | 11,2 M$ | 22 % |
| Préstamos (JustLend) | 4,8 M$ | 9 % |
| Puente de USDT a otras cadenas | 2,4 M$ | 5 % |
| Conversión a USDD | 0,3 M$ | 1 % |
| Envíos menores de 10.000 TRX, no seguidos | 1,4 M$ | 3 % |
| **Sin explicar** | **5,5 M$** | **11 %** |
| Casas de cambio, directo desde una billetera de paso | **0** | 0 % |

**Los dos puntos por los que pasa la mitad del dinero:**

- `TM8uyBjRKzFtQdMC7tQLvKeeWieaFvXDyc`: recibe el resultado de cientos de cambios hechos desde 371 billeteras. **12,16 M$ del robo en 1.069 envíos.** Es un punto de paso: el 93 % de lo que sale va a `TZG47zhb8kcriWQ2rE719yHs1KqgzwMrvF`, un nodo de 317.000 operaciones, donde el rastreo ya no puede seguir con rigor.
- **El grupo de cinco billeteras creadas el 11-oct** entre las 23:35:09 y las 23:36:33 UTC (`THPaGKe6aZkUcNht24hcscZPLwtcJAbpun`, `TGSNahJvAdh86aR5pdcxiep1mBWSRK3HHL`, `TBAPnuwEht65McDbxDvDYs2XLRSSbYQMUM`, `TLKfB2goHRY1SykEpVbiGdsesACrkCxCeW`, `TH1YKH9MUuJtDmekPia4x9fZXAcpPrMv8B`): **11,85 M$** en 603 envíos. Parecen infraestructura de este blanqueo, pero es una **hipótesis**: no puedo decir quién las controla.

**Del grupo y de `TM8uyBjRKz…` a las casas de cambio (segundo tramo, estimación):** 249 envíos a siete casas, unos 12,5 M$ brutos, de los que **≈ 4,15 M$ se estiman del robo**: Bybit 2,21 M$, OKX 0,95, Gate 0,74, KuCoin 0,14, Bitget 0,08, MXC 0,02, Kraken 0,005. Lo envían billeteras de un solo uso, casi con seguridad direcciones de depósito de clientes de cada casa. Los nombres de las siete billeteras calientes están confirmados por la etiqueta pública de TronScan. El mayor destino del segundo tramo es `TZG47zhb8k…` (11,44 M$ estimados): ahí el rastreo se detiene.

**Lo que ha pasado desde la foto** (22:41 a 10:11 UTC, solo primer salto): 352 envíos, **166,2 M TRX = 58,5 M$**, a 48 billeteras. 15 de ellas ya habían recibido antes (29,0 M$); 33 son nuevas (29,5 M$). Los destinos mayores reciben 6,8 M$, 6,8 M$ y 6,5 M$. **No he seguido adónde van después**; repetir el rastreo con `traza.cjs` actualizaría el cuadro.

---

## 5. Los puentes hacia otras cadenas

Hasta ahora los informes decían «este rastreo no sigue lo que sale de TRON por el puente». Ahora sí: se descodifica la llamada de cada envío para leer la cadena y la dirección de destino, y se comprueba con el mensaje registrado por LayerZero.

### 5.1 Qué puentes se usan

| Puente | Envíos | Bruto | Robo estimado | Cómo se lee el destino |
|---|---|---|---|---|
| **USDT0 / LayerZero (`UsdtOFT`)** | 186 | 8,0 M$ | ≈ 3,9 M$ dentro del rastreo | La llamada trae la cadena (código de LayerZero), la dirección y el importe: **leído y confirmado con LayerZero** |
| Rango (`RangoDiamond`, etiqueta «TrustWallet») | 25 | 0,33 M$ | 0,18 M$ | El destino no está en la llamada: **no leído** |
| Bridgers | 24 | 0,17 M$ | 0,08 M$ | El texto de la llamada trae cadena y dirección: leído en 18 de 24 |
| `Tron_PrefundedAdapter` | 3 | 0,14 M$ | 0 | No descodificado |

### 5.2 USDT0: hacia qué cadenas

| Cadena | Envíos | Bruto |
|---|---|---|
| Ethereum | 168 | 7,83 M$ |
| Arbitrum | 18 | 0,17 M$ |
| Otras (Base, Solana, BNB…) | 0 | |

Las **52 direcciones** de destino en Ethereum y Arbitrum (más una de un solo salto, `0x9de7ead3…`) se han seguido con Etherscan. **Ninguna de las direcciones del robo en Ethereum (las ocho billeteras de los 508.854 ETH) recibe de este puente.** Las mayores:

| Dirección en Ethereum | Envíos | Bruto | Robo estimado | Qué hace después |
|---|---|---|---|---|
| `0x68fbc6f669dd0c7aa3b3307979ee518473717037` | 3 | 550.433 $ | 545.314 $ | lo reenvía todo en 10 minutos, sobre todo a Uniswap |
| `0x1645dc4b3c9d6fd8ec9d21dcc07099c6924d9f1d` | 3 | 490.704 $ | 485.927 $ | lo reenvía todo, sobre todo a Uniswap |
| `0x8db6f39a49f7e26e2e85de598f9faf18e1c570ad` | 3 | 515.797 $ | 402.322 $ | lo reenvía todo, sobre todo a Uniswap |
| `0xbe6eedf71ae89f9d8517ac35595f08195790b77e` | 14 | 392.043 $ | 286.360 $ | THORChain (810.000 $) y contratos; tiene 78.000 USDC dentro |
| `0x3a793b6ffea212acc8e2d2b9b45a3db7c9c4248d` | 1 | 244.103 $ | 190.400 $ | lo reenvía todo en 9 minutos a Uniswap |
| `0xb8ea8bdf42629587be3b67260cce0d2383b81330` | 1 | 243.959 $ | 190.288 $ | lo reenvía todo en menos de un minuto a Uniswap |
| `0x9af28eb4506c4dee5edaaf4d0d9e9f2685a800d3` | 21 | 239.546 $ | 174.363 $ | THORChain y Permit2 |
| `0x3614504fc81cb09ea6d01514d532bebe8d211b4e` | 11 | 210.000 $ | 150.633 $ | THORChain; tiene 105.000 USDT dentro |
| `0x111c09990a872946128a2acd26af398513d97ce5` | 1 | 122.714 $ | 122.714 $ | **el envío no llegó** (apartado 5.3) |

- **Lo que hacen las direcciones:** reenvían casi todo en minutos u horas a contratos de intercambio: Uniswap V3 y V4, THORChain, CoW Protocol (GPv2Settlement), Permit2 y contratos sin verificar. **Solo 6 de las 52 conservan 10.000 $ o más** de stablecoins (552.674 $ en conjunto). Ninguna tiene etiqueta pública conocida.
- **Cautela importante.** Estas direcciones reciben 17 M$ en total de stablecoins desde el 30-oct, pero solo 7,8 M$ vienen de TRON: **mezclan dinero ajeno**. Por eso la parte del robo es una estimación (cada envío lleva la pureza de la billetera de origen), no un importe comprobado.
- **Lo que no sé:** adónde fue el dinero cuando se cambió en Uniswap, CoW o THORChain por otros activos (ETH, tokens). No he seguido esos activos.

### 5.3 Tres envíos que LayerZero no ha entregado

LayerZero Scan marca como **«en camino»** tres envíos, con los dos verificadores del puente (el de USDT0 y el de LayerZero Labs) en espera y con una anulación («nilify») registrada en el destino. **No han llegado a Ethereum.** Suman **157.220 $**:

| Hora (UTC) | Desde (TRON) | Destino | $ | Hash |
|---|---|---|---|---|
| 30-oct 21:07 | `TUEVnWHrugeMo3eU7gQxDSLWjF5ZtH6G3a` | `0x111c09990a872946128a2acd26af398513d97ce5` | 122.714 | `b135ffe83949483d788365c738918aec1096d522e6c3a8c981dd78758749405b` |
| 30-oct 03:07 | `TQXm9qEL64YmGAzZoMspM8qyWPZ3tbqt6X` | `0xb196981c37cfe105506613d1bd4153b9e63df92e` | 1.000 | `dfda4053e466029007cbbcb5d1c56bbc381bb64b0a51cedb11d954cbe55681ec` |
| 31-oct 01:04 | `TCYwSgYdNJ34i9qi5yNovGJ2p9kr8WrizW` | `0x1c59fed4188b8c1c11bd9aa0b3264e7c1648a528` | 33.506 | `e4b0de534b89485f533d106dc668025fa1fa00a4e6eb6df757f5dafc162dcb55` |

**Qué sí sé:** que el destino no ha recibido nada (Etherscan: la dirección `0x111c0999…` no tiene ni una transferencia de tokens en Ethereum, Arbitrum ni Polygon) y que LayerZero lo registra como no entregado. **Qué no sé:** por qué. Que el verificador de USDT0 esté en espera encaja con un bloqueo deliberado de Tether, pero **es una hipótesis**: el estado público no dice quién ni por qué. Lo que sí queda claro es que el dinero de esos tres envíos **salió de TRON y no ha llegado a su destino**.

### 5.4 El regreso a TRON por THORChain

Las direcciones de Ethereum de 5.2 hicieron **1.600 operaciones en THORChain por 11,8 M$** (30-oct 14:53 a 31-oct 10:22). De ellas, **1.580 piden recibir el dinero en TRON** (11 direcciones TRON) y 20 en USDT de TRON (5 direcciones):

| Dirección TRON de destino | Operaciones | $ | Creada |
|---|---|---|---|
| `TBPJerxz9X35ZNqxuMrK9QmpneGgBgB7Vv` | 282 | 2,88 M | 30-oct |
| `TZ274LXvxXBar5ZHqNNEs4YSz5yAwfx7VY` | 194 | 1,98 M | 17-feb-2023 |
| `TK84SxT4dwmST5vWnPEaBa9wiNEERw1f3G` | 240 | 1,46 M | 29-oct |
| `TUNVyMEp5VEuYidTGjt4Z6djSba2N7uPRk` | 221 | 1,33 M | 29-oct |
| `TG8gkMdZJDiBH8hbWtH46URyA7AAk3W1RC` | 141 | 1,26 M | 30-oct |
| `TYm639gyyUCWsCjMta7x2fUbrGkFsssZpd` | 197 | 1,09 M | 30-oct |
| otras cinco | | 1,8 M | |

- **Las 11 ya estaban en el árbol del vigilante.** Reenvían la mayor parte del USDT a tres billeteras de paso mayores: `TXtEs6t2oUWQsNos7m68gbHdE9Q5n6x2oN` (248.640 operaciones, un enrutador), `TU3ymitEKCWQFtASkEeHaPb8NfZcJtCHLt` (8.492) y `TANdmAmc5jyNEFB1gXbEBfaG7Ftj1XNUG1` (913), que a su vez reenvían a `TYVWGh8X…`, `TRV3PsTL…` y `TTbCVPfU…`.
- **Qué significa:** parte del dinero que salió de TRON por el puente **ha vuelto a TRON** convertido por THORChain. Es otra manera de romper el rastro: el dinero sale, se cambia, y entra por direcciones nuevas.
- **Cautela:** los 11,8 M$ de THORChain superan los 7,8 M$ recibidos del puente. Las direcciones mezclan dinero ajeno y **no puedo decir qué parte de esas operaciones es del robo**.

### 5.5 Los puentes pequeños

- **Bridgers (24 envíos, 0,17 M$):** destinos leídos en la llamada: Ethereum 7 envíos (44.435 $, 5 direcciones), USDT en BSC 6 (18.388 $, 3 direcciones), USDT en Ethereum 1 (26.528 $, `0xa97291B7E24D4B8ea2293AffBcA0904cb448519d`), USDC 1 (23.100 $, `0x7B410B379c4A09Af917A57BfC8D58D21F58186f8`), **Solana 2 (8.317 $)** y **Bitcoin 1 (4.637 $, la llamada no incluye la dirección)**. Seis envíos (42.118 $) no traen texto legible. No los he seguido más allá de la dirección.
- **Rango (25 envíos):** la llamada solo lleva la etiqueta «TrustWallet»; el destino no se puede leer sin la API del puente.

---

## 6. Por qué siguen llegando avisos al bot

El bot `@blacklistusdtbot` recibe avisos de **dos vigilantes**:

| Vigilante | Avisos totales | Desde el 30-oct 21:00 UTC | Qué son |
|---|---|---|---|
| **TRON** (`tron-salidas-watch`) | 197 | 46 (de 2 a 7 por hora) | «salto» (una billetera seguida manda 10.000 TRX o más), «salto en lote», resúmenes, 2 entradas, 2 salidas, 1 fallo, 1 recordatorio |
| **Ethereum** (`eth-salidas-watch`) | 12 | 9 | «salida de tokens» de `0x5227f603…`, la billetera del ladrón en Ethereum |

- **Los avisos de TRON son el reflejo del apartado 4:** `TRBdWq…` sigue repartiendo y cada billetera nueva que recibe 10.000 TRX o más se vigila. Hay **11.534 billeteras seguidas, 6.564 abiertas**.
- **Los avisos de Ethereum no son ETH.** Entre las 04:29 y las 07:39 UTC del 31-oct, `0x5227f603…` ha movido nueve tokens menores (PROM, ZAMA, SOPH, NIL, LSK, FUN, RE, ZKP y BLUR). **Los 508.854,45 ETH siguen en las ocho billeteras, sin tocar** (mismas cifras que a las 21:00 del 30-oct). No he valorado esos tokens.
- **El vigilante de TRON va con retraso y cada vez más.** Los ciclos de cada 30 minutos leen entre 1.000 y 1.300 billeteras, pero las pendientes crecieron de **4.482 (07:45) a 5.516 (10:15)**. Los avisos llegan tarde. El último ciclo tuvo 12 errores de lectura. Mejoras posibles, **no aplicadas**: reconocer los nodos de servicio para no abrir sus ramas (la mitad del dinero termina en ellos), y subir la velocidad. Si quieres que las haga, dilo.

---

## 7. Lo que no se puede decir

- **Quién es el ladrón** ni quién controla los nodos de servicio y el grupo del 11-oct. El informe da direcciones, importes y hashes; la identidad solo la conocen las casas de cambio.
- **Qué parte de lo que entra en un nodo, en una dirección de Ethereum o en THORChain es del robo y cuál de otros clientes.** Todas las cifras con «estimado» usan la mezcla proporcional; no son importes comprobados uno a uno.
- **Adónde va el dinero después del primer salto en Ethereum** (qué activos y a quién), después de Bridgers y Rango, y dentro de las casas de cambio.
- **El tramo posterior a la foto** (58,5 M$): solo primer salto.
- **El 11 % sin explicar** del apartado 4.
- **Por qué hay tres envíos del puente parados** (hipótesis en 5.3).

---

## 8. Auditoría: ¿coinciden los datos de TronGrid y TronScan con el análisis?

**Qué se hizo.** Se volvió a pedir a TronGrid y a TronScan el dato en bruto de lo que afirman los informes y se comparó con (a) el informe y (b) la otra fuente. Las dos fuentes leen la misma cadena, así que **no son independientes en lo que respecta a la cadena**; sí lo son en cómo la presentan (formatos, etiquetas). Scripts: `auditoria-fuentes.cjs`, `auditoria-lector.cjs`, `auditoria-puentes.cjs`, `lz-estado.cjs`; resultados en `tron/auditoria-*.json` y `tron/lz-estado.json`.

### 8.1 Resultados

| Comprobación | Resultado |
|---|---|
| **16 transacciones de la cadena de custodia** (origen, cambios, cinco envíos, entradas a `TRBdWq…`), en TronGrid y en TronScan: remitente, destinatario, importe, hora, éxito | **15 coinciden en todo, en las dos fuentes y con el informe.** La decimosexta (`bb05d43b…`) coincide en importe y direcciones, pero **la hora real es 01:01:15 UTC, no «01:01 Madrid»**: error de etiqueta mío. Corregido |
| `TSpe5HC3…`: entradas y salidas | Salen 638.200.900 TRX en cinco envíos. Entran 638.200.942: los tres grandes suman 638.200.929 (la cifra del informe) y hay 18 entradas de 13,7 TRX en total (polvo y mensajes). Balance 37 TRX = entradas − salidas − comisiones. **Cuadra** |
| Los cuatro depósitos «sin una sola transacción propia» | TronGrid y TronScan: `TKkH2vH6…` y `TJajtPqD…` tienen 0 salientes. `TL2F4Ghn…` y `TCBAz7it…` tienen 1 (el envío a `TRBdWq…`). **Era cierto cuando se escribió; ya no** |
| **Saldos** de ocho billeteras, TronGrid frente a TronScan | **8 de 8 idénticos** en TRX y en USDT. Frente al informe (04:15 Madrid): iguales en `TKkH2vH6…`, `TJajtPqD…`, `TL2F4Ghn…` y `TSpe5HC3…`; han cambiado `TCBAz7it…` (vaciada) y `TRBdWq…` (93,0 M → 97,2 M), con movimientos posteriores que constan |
| **Bloqueos de Tether** (llamada `isBlackListed` y eventos `AddedBlackList`) | `TG5iBMQ…` y `TCzBTk…` bloqueadas, con 312.729.468 y 65.990.000 USDT; Hot 7 libre (control). **61 de 61** eventos del informe siguen; 6 nuevos. **51 de 51** direcciones de la segunda oleada siguen bloqueadas |
| **Aristas finales:** 60 al azar del primer tramo (de 2.020) y 60 del segundo (de 2.585), contra las dos fuentes | **120 de 120 coinciden** en importe, destino y hora. 29 son cambios en los que el USDT llega desde el contrato de intercambio y no desde la billetera que pagó: ahí se comprueba que el destino recibe ese importe en esa transacción y que la billetera participa en ella (no que lo que pagó sea exactamente lo que se cambió) |
| **Tablas 5.3 y 7 del informe de trazabilidad** recalculadas desde los CSV de aristas finales | Coinciden todas: `TM8uyBjRKz…` 12,16 M$/1.069/371; grupo del 11-oct 11,85 M$/603; `TZG47zhb8k…` 0,91 M$ y 11,44 M$; JustLend 4,75 M$/117/74; puente 2,35 M$/30/19; USDD 0,33 M$; casas 4,15 M$ (Bybit 87 envíos 2,21 M$…) |
| **El reparto de `TRBdWq…` recalculado desde cero** con TronScan | **379 envíos de 350 $ o más (377 de 10.000 TRX o más), 50.773.217 $, 122 billeteras: igual que el informe y que la lectura guardada, envío por envío.** Un primer intento dio 356 envíos: la lectura de TronScan salió incompleta (lo marcó mi propia comprobación), se repitió completa y es la que cuenta |
| **Lector del rastreo:** 70 billeteras al azar (45 del primer tramo, 25 del segundo), lectura guardada frente a lectura nueva de TronScan | De 565 transferencias de 350 $ o más hasta la foto que lista TronScan, **las 565 están en la lectura guardada, con la misma transacción, remitente, destinatario e importe** (0 omisiones, 0 importes distintos). La lectura guardada trae además **13 movimientos de TRX (2,2 %)** dentro de llamadas a contratos que la lista simple de TronScan no incluye. Las 13 transacciones existen, tuvieron éxito y contienen transferencias internas de TRX; **no he vuelto a comprobar el importe exacto de cada una** y en cuatro no es evidente que cuadre |
| **Nombres de las siete casas de cambio** | **7 de 7** coinciden con la etiqueta pública de TronScan (Bybit, OKX Hot Wallet 8, Gate, Kucoin 4, Bitget 9, MXC, Kraken Hot Wallet) |

### 8.2 Puentes

| Comprobación | Resultado |
|---|---|
| 40 envíos de puente al azar contra TronScan (quién paga, importe, contrato, hora) | **40 de 40** |
| Mi lectura de la llamada frente al mensaje que LayerZero registró para cada uno de los 186 envíos | Cadena de destino **185 de 186**; dirección **185 de 186**; importe dentro del rango enviado–mínimo **185 de 186**. La excepción es un envío de 229.980 USDT (`eca8ece90b06…`) cuya llamada tiene otro formato y que **mi descodificador leyó mal**; con el mensaje de LayerZero queda corregido: Ethereum, `0x9de7ead321892c1f12b1a5e8b5dc21cf540795e5`, entregado, y la dirección reenvía el importe un minuto después a `0x067cb62f4d…` |
| ¿Llegó el dinero? Los 40 envíos mayores contra Etherscan | **39 de 40** aparecen en destino con el mismo importe. El que falta es el de 122.714 $ que LayerZero marca como no entregado |
| Estado de los 186 envíos en LayerZero Scan | 183 entregados (7,85 M$ brutos); 3 en camino y anulados (157.220 $) |
| Totales frente al informe | Puente `UsdtOFT` primer tramo: 30 envíos, 2,349 M$ del robo, 19 billeteras, **idéntico** a la tabla 5.3 (hay 3 envíos menores de 3.520 $ más, que el método no sigue); segundo tramo: 86 envíos, 1,60 M$, idéntico a 7.2 |

### 8.3 Lo que esta auditoría no demuestra

- Que el **método de la mezcla proporcional** sea el correcto: es un modelo, no un dato de la cadena, y TronGrid/TronScan no lo pueden confirmar. Lo que confirman es que **los importes, las direcciones y las horas de cada salto son los que dice la cadena**.
- Que no haya movimientos que el rastreo no vio: se ha comprobado una **muestra** (70 billeteras de 1.347 y 2.898; 120 aristas de 4.605), no todo. En la muestra no hubo ninguna omisión.
- El **11 % sin explicar**.
- Las comprobaciones de Ethereum se hicieron sobre los 40 mayores envíos, no sobre los 186.

### 8.4 Fallos míos encontrados durante la auditoría

1. **Hora mal etiquetada** en el informe de trazabilidad (apartado 9) y en mi memoria: «01:01 Madrid» era 01:01 UTC. Corregido en el informe.
2. **Mi primera descodificación de puentes trató mal nueve envíos del segundo tramo** (1,38 M$ brutos, 0,92 M$ del robo, entre ellos cinco de 168.000 a 244.000 USDT del 30-oct por la mañana): **uno faltaba del todo y ocho tenían el tramo o la pureza equivocados**, porque solo miraba las lecturas guardadas de cada billetera y no los «saltos virtuales» de los cambios. La comparación con los CSV de aristas finales lo detectó; ahora los 136 envíos a puentes de los CSV están todos, con su tramo y su pureza, y se volvió a seguir el destino. Las cifras de los apartados 1 y 5 son las corregidas.
3. **Un envío de 229.980 USDT** leído con la cadena equivocada (arriba).
4. **Una lectura incompleta de TronScan** dio un 356 donde son 379; la comprobación la marcó y se repitió. Lo anoto porque es el tipo de fallo que, sin esa marca, habría parecido una discrepancia real.

---

## 9. Qué cambia respecto a los informes anteriores

| Dónde | Decía | Ahora |
|---|---|---|
| Trazabilidad, apartado 9 y resumen | «31-oct, 01:01:15 (Madrid)» | **01:01:15 UTC** (02:01 Madrid) |
| Trazabilidad, apartados 1, 9 | «Quedan 398,2 M TRX sin tocar en tres depósitos» | **278,2 M TRX en dos depósitos**: `TCBAz7it…` se vació el 31-oct a las 07:58:48 UTC |
| Trazabilidad, apartado 6.4 | «No he decodificado la cadena de destino» del puente | Decodificada: Ethereum 168 envíos y Arbitrum 18 (apartado 5) |
| Trazabilidad, apartado 8 (punto 2) | «Desde `TRBdWq…` salen 2,5 M$ por hora» | Era cierto hasta la foto; **desde la foto, 5,1 M$ por hora** |
| Completo del 30-oct, apartado 7 | Puente: «unos 3,3 M USDT… no he decodificado el destino» | 186 envíos, 8,0 M$ brutos, 183 entregados y 3 parados |
| Completo del 30-oct, apartado 8 | 61 bloqueos de 60 direcciones | 67 de 66 (6 más a las 22:05–22:12 del 30-oct) |

**Lo que no cambia:** la cadena de custodia, lo congelado por Tether (378,7 M USDT), la billetera de reparto, el reparto del 30-oct, las tablas 5.3 y 7 del informe de trazabilidad, y que **ninguna billetera de paso envía directamente a una casa de cambio con nombre**.

---

## 10. Cómo repetirlo

Desde `research/binance-0x5227-2026-10-30/`, con el Node del sistema (fuera del PATH):

```
node traza.cjs ... traza-post.cjs     rastreo completo (ver el informe de trazabilidad)
node puentes.cjs                      descodifica los envíos a puentes
node puentes-seguir.cjs               sigue las direcciones de destino en Ethereum y Arbitrum
node lz-estado.cjs                    estado de cada envío USDT0 en LayerZero Scan
node thorchain.cjs / thorchain-tron.cjs   operaciones de THORChain y sus direcciones TRON
node sumideros-y-bridgers.cjs         sumideros del regreso a TRON y destinos de Bridgers
node auditoria-fuentes.cjs            auditoría contra TronGrid y TronScan (partes A B C D G H)
node auditoria-lector.cjs             recálculo del reparto de TRBdWq y muestra del lector
node auditoria-puentes.cjs            auditoría de puentes (partes P Q X)
```

Ficheros principales en `tron/`: `puentes-decodificados.json`, `puentes-destinos.json`, `puentes-seguimiento.json`, `lz-estado.json`, `thorchain-decodificado.json`, `thorchain-destinos-tron.json`, `bridgers-destinos.json`, `sumideros-thorchain.json`, `trb-posfoto-envios.json`, `auditoria-fuentes.json`, `auditoria-lector.json`, `auditoria-puentes.json`.

---

## Anexo — Direcciones nuevas citadas

| Dirección | Papel |
|---|---|
| `TUEVnWHrugeMo3eU7gQxDSLWjF5ZtH6G3a` | envió el puente de 122.714 $ que no llegó |
| `0x111c09990a872946128a2acd26af398513d97ce5` | destino en Ethereum de ese envío (sin movimientos) |
| `0x9de7ead321892c1f12b1a5e8b5dc21cf540795e5` | destino del envío de 229.980 $ (reenvía en un minuto) |
| `TBPJerxz9X35ZNqxuMrK9QmpneGgBgB7Vv` | mayor receptor TRON de THORChain |
| `TXtEs6t2oUWQsNos7m68gbHdE9Q5n6x2oN` | enrutador (248.640 operaciones) al que reenvían los receptores de THORChain |
| `TFG4wBaDQ8sHWWP1ACeSGnoNR6RRzevLPt` | contrato del puente USDT0 (`UsdtOFT`) en TRON |
