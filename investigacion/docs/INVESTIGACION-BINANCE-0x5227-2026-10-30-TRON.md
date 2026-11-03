# Robo a Binance del 29-oct-2026 — Anexo: la pata en TRON

> **SUPERADO el 30-oct a las 22:45 (hora de Madrid):** este documento queda sustituido por [INFORME-COMPLETO-ROBO-BINANCE-2026-10-30.md](INFORME-COMPLETO-ROBO-BINANCE-2026-10-30.md). Los apartados 10 y 11 de abajo, sobre todo, daban como llegadas a casas de cambio cifras que incluían fondos ajenos (nodos de servicio); las cifras comprobadas están en el apartado 6 del informe nuevo.

**Seguimiento del informe** [INVESTIGACION-BINANCE-0x5227-2026-10-30.md](INVESTIGACION-BINANCE-0x5227-2026-10-30.md), que solo cubría Ethereum y Arbitrum.
Lectura en vivo hecha el **30-oct-2026 entre las 11:30 y las 12:00 UTC** con TronScan y TronGrid (las mismas claves del bot de la blacklist). Datos en bruto en `research/binance-0x5227-2026-10-30/tron/`. Horas en UTC. Precio del TRX: 0,352 $ (cierre del 30-10 en Binance, bóveda local); el 29-oct por la noche rondaba 0,34–0,37 $.

---

## 1. Conclusión en breve

- El robo también vació una billetera caliente de Binance en TRON: **Binance-Hot 7** (`TDqSquXBgUCLYvYC4XZgrprLK589dkhSCf`, etiqueta pública de TronScan) envió **612.729.468 USDT y 46.394.098 TRX** a una billetera recién creada, `TG5iBMQ…`, entre las **20:20 y las 20:22:45**. Son dos minutos **antes** del barrido de Binance 14 en Ethereum (20:24:23).
- En menos de una hora el ladrón pasó **300 M USDT** a una segunda billetera, `TPBkSj…`, y los cambió por TRX en SunSwap en 16 operaciones (**234 M USDT → 638.190.941,685 TRX**, a unos 0,367 $ por TRX).
- **Tether tardó 47 minutos** en bloquear la primera billetera (21:09:12). Llegó a tiempo para congelar **312.729.468 USDT** que seguían en `TG5iBMQ…` y, a las 21:21:12, otros **65.990.000 USDT** que acababan de aparcarse en `TCzBTk…`. En TRON quedan congelados **378.719.468 USDT**.
- Se le escaparon **234 M USDT ya convertidos** y los **46,4 M TRX robados directamente**: en total **≈ 684,6 M TRX (≈ 241 M$)**. Ese TRX durmió la noche en `TSpe5HC3…` y hoy, entre las **10:15 y las 10:20**, se repartió en **cinco billeteras nuevas** (4 × 120 M + 158.200.900 TRX). La transacción que señalaste, `aff887c4…`, es la quinta de ese reparto.
- Una de las cinco (`TAk1xJ…`) lo pasó al momento a **`TRBdWq…`**, que es la **billetera de blanqueo**: desde las 00:06 va soltando TRX en trozos de 200.000 a 500.000 a decenas de billeteras creadas hoy, y cada una de esas lo vuelve a repartir en otras 30 o 40. A las 11:33 llevaba **52,3 M TRX** soltados en **47 billeteras** y aún guardaba **114,1 M**. En ningún punto de ese árbol aparece todavía una casa de cambio con nombre.
- La billetera que repartió recibió **dos notas de desconocidos ofreciéndose a «ayudar a mover los fondos»** y decenas de transferencias de 0 TRX desde direcciones falsas que imitan sus últimas letras: el mismo envenenamiento que vimos en Ethereum.

---

## 2. El origen: Binance-Hot 7 → `TG5iBMQ…`

`TG5iBMQPrDzJJAUM8GMVBf1hRaJ1wvzsGi` se creó a las **20:19** del 29-oct. Un minuto después empezó a recibir de Binance-Hot 7:

| Hora (UTC) | Qué | Transacción |
|---|---|---|
| 20:20:00 | 10.000 TRX (prueba) | `6f983ab745fbea298ec6376054fb16155f3142ec0d9f3fec4c053220cafc9644` |
| 20:21:12 | **46.384.098 TRX** | `72f5fbedbc4d6f70113e139312eef09fb28a5fefd49d321bc1e28b6cea5bab9c` |
| 20:22:45 | **612.729.468 USDT** | `4203af9ca1833d09c05666eafbd70d703a3811c0bdcf125106685ab75958253e` |

Revisé **todas** las salidas de Binance-Hot 7 entre las 19:00 y las 24:00 de ese día (1.010 transferencias de tokens y 55 de TRX): la única salida grande hacia una billetera ajena es esa. A partir de las 22:57 Binance pasó lo que quedaba en Hot 7 (NFT, HTX, SUN, TUSD, BTT y 7,1 M TRX) a **Binance-Cold 2**: puso a salvo el resto. Hoy Hot 7 tiene 103 TRX y 2 USDT.

---

## 3. El cambio de USDT a TRX (29-oct, 20:44–21:42)

`TG5iBMQ…` mandó a `TPBkSjkCMn2ckrMuAP8n2J1jdjbw76bKN4` (creada ese mismo día) 10.000 TRX a las 20:44:57 para pagar comisiones y luego **100 M USDT a las 20:45** (`fd8061aaa787ce89d707184dbfdd436a578c7840d674505067725de727c06222`) y **200 M USDT a las 20:56** (`d40f96e23e95b7ace0ebacd3892f0a1f37555a64da69feedba73443dee4920ee`).

`TPBkSj…` dio permiso al enrutador de SunSwap (`TQqgNg13…`, vía Permit2 `TTJxU3P8…`) a las 20:46 y entre las **20:47 y las 21:14** hizo **16 cambios** de USDT a TRX: trece por los pares de SunSwap V2 (`TSUUVjys…`: 10, 30, 30, 10, 10, 10, 30, 30, 20, 10, 5, 2 y 2 M USDT), dos por el gestor de pools de SunSwap V4 (`TVjuTE3V…`: 30 M a las 20:59 y 3 M a las 21:06) y uno de 2 M por el par S-USDT-TRX. Total: **234 M USDT**.

El TRX obtenido salió a `TSpe5HC3PRD2svJcr1YoGszhHk2mtkyZ8A` en dos envíos: **288.330.000 TRX a las 20:56:12** (`4b329d4495bcdd8df40117cd478f13c5027988147c7deb9add5e4aee3b8107c4`) y **349.860.941,685 TRX a las 21:42:42** (`fb5089f5ce2ae9be6f8e5e3f78470a5a8d694879ac68f6c8cfe3d81450fa6149`). Suma: **638.190.941,685 TRX**, es decir, unos 0,367 $ por TRX. Dos detalles más de `TPBkSj…`:

- A las **21:16** apartó **65.990.000 USDT** en `TCzBTkqn66yApqbYoPezaEQosM5DAd7Y62` (`55c2524b47bc569152617f4a6c4f703809467b7afad91a7631b463ca1467fa5c`) junto con 10.000 TRX para comisiones. Esa billetera dio permisos a SunSwap a las 21:19 para cambiarlos también, pero Tether la bloqueó a las 21:21:12 y los 65,99 M quedaron **congelados** ahí.
- A las 21:14 metió 10.000 USDT en JustLend (recibió 918.238 jUSDT, `7bfbd96e4d2f79d9c143f057600a07c0ca51c60c0a358198791a36ab07d5517a`) y a las 21:31 pidió un pequeño préstamo (`36f40afb28552bbaf6f2e74f0e72a6559ed2d5ad68ebb22c11edf3d3e00c7e21`). Importe menor; no he identificado el activo prestado.

Cuadre de los 300 M USDT que recibió: 234 M cambiados + 65,99 M aparcados (congelados) + 0,01 M en JustLend = **300 M**.

---

## 4. Qué congeló Tether y qué se escapó

Eventos `AddedBlackList` del contrato USDT en TRON (TronGrid):

| Hora | Dirección | USDT dentro en ese momento | Transacción |
|---|---|---|---|
| 21:09:12 | `TG5iBMQ…` | **312.729.468** (congelados) | `71b0ec0fe873fe820c37cc3ecbab4e83087f87e833d191012a0a4027d20594e1` |
| 21:17:39 | `TPBkSj…` | 0 (ya los había cambiado o apartado) | `bc4e4a76bd262307a4d005d9745e2e8cf3bfe7d38e2ae4d5fcfaa40376721f40` |
| 21:21:12 | `TCzBTk…` | **65.990.000** (congelados) | `176a5783fd70f5abbae9569f60398afe5307eefa9d06982ae5a9351e2cbc0f13` |

Comprobado también en vivo con `isBlackListed` del contrato: las tres están bloqueadas; `TSpe5HC3…` y las billeteras del reparto no (no tienen USDT).

| | USDT | TRX |
|---|---|---|
| Robado de Binance-Hot 7 | 612.729.468 | 46.394.098 |
| Congelado por Tether | **378.719.468** (61,8 %) | — |
| Escapado | 234.000.000 → 638.190.942 TRX | 46.384.098 (10.000 se fueron en comisiones) |
| **TRX en manos del ladrón** | | **≈ 684.575.040 TRX (≈ 241 M$)** |

En Ethereum Tether bloqueó a las 21:01:35; en TRON la primera lista negra fue a las 21:09:12. En esos 47 minutos desde la recepción el ladrón había sacado 300 M y cambiado 234 M.

---

## 5. El reparto de hoy (30-oct) y el árbol de blanqueo

`TSpe5HC3…` guardó los 638,19 M TRX toda la noche (solo recibió notas y polvo) y a media mañana los repartió:

| Hora | A | TRX | Transacción |
|---|---|---|---|
| 10:15 | `TAk1xJNWuBYvJHLsUiBFLeuK6xvpQUFYP5` | 120.000.000 | `9d0904db84e640d37e9fee8badef0883043db77f5bf9c87ca76e220e0c35c487` |
| 10:18 | `TL2F4GhnaFVZBZPncHYjwfYZFW44NcfVwj` | 120.000.000 | `16585e9664a0e7e74d67caeba2ecdc9869ec9a84a287dc078a12d34ca078c0d1` |
| 10:18 | `TCBAz7itvtX5CjBzVMPQdrbwQLN63ao1fk` | 120.000.000 | `037428516b343a326157ae75495ad3227b43e4a4cb0c8c3837e849d7a18d556e` |
| 10:19 | `TJajtPqDqUGh1Sr1j8ugHoSXBVpaFLLHKT` | 120.000.000 | `3db47d891cc211c300f9ba1aec264bfca8f9e32fbe220c411f30789a31ac8370` |
| 10:20:18 | `TKkH2vH6kyi2QKcMbqym53WMuvdd1xvw6K` | 158.200.900 | `aff887c4be7cd52eb8905899fc9596eaaf9c49dea59129519ce25d7c69762334` |

Las cinco se crearon en el mismo minuto en que recibieron. A `TSpe5HC3…` le quedan 36,8 TRX.

**La billetera de blanqueo `TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki`** se creó a las 00:06 de hoy y recibió primero los **46.383.069 TRX** que quedaban en `TG5iBMQ…` (`6adfc066520a5880df18eebc61bf048d03e8d7a0fca23b04a6b36c9723892736`) y a las 10:20:48 los **120 M** de `TAk1xJ…` (`0ae2b5a4e1c8849d09e16db5a4dd9d90f7224c3b996a80ccad113bd5b81acd39`). Desde las 03:05 suelta TRX sin parar:

- A las 11:33 llevaba **139 envíos, 52.273.205 TRX, a 47 billeteras** creadas hoy; trozos típicos de 200.000 a 500.000 TRX, el mayor de 4,3 M. Le quedaban **114.109.812 TRX**.
- **Segundo salto:** cada receptora lo reenvía casi todo en pocas horas a otras billeteras nuevas y se queda a cero. Ejemplos: `TUoVsNvk…` recibió 11,06 M y los mandó a 11 billeteras; `TXsZPPBh…` recibió 9,36 M y los mandó a 9.
- **Tercer salto:** esas a su vez se abren en abanico: `TKfpgAeb…` 39 envíos a 30 billeteras (6,58 M), `TK4kL5VD…` 50 envíos a 38 (6,07 M), `TFv8JrDG…` 34 envíos a 30 (3,16 M). Algunas direcciones del tercer nivel reciben de varias ramas (`TXGxrJ5v…`, `TGmBqqf2…`, `TTb74FBW…`, `TMi4ZgR8…`), es decir, el abanico vuelve a juntarse.
- **Ninguna** de las direcciones vistas en los tres saltos tiene etiqueta en TronScan ni figura en nuestro directorio de casas de cambio. Todas creadas el 30-oct, saldo casi cero.

**Hipótesis (no probada):** el destino final del árbol serán direcciones de depósito de casas de cambio sin etiqueta pública, o intermediarios OTC. El patrón (cientos de billeteras del día, trozos de pocos cientos de miles, abanicos que se vuelven a juntar) es el de un blanqueo por capas, no el de alguien que aparca el dinero.

**Dónde está el TRX ahora (12:00 UTC):**

| Billetera | TRX |
|---|---|
| `TKkH2vH6…` | 158.200.902 |
| `TL2F4Ghn…` | 120.000.000 |
| `TCBAz7it…` | 120.000.000 |
| `TJajtPqD…` | 120.000.000 |
| `TRBdWqHn…` (blanqueo) | 114.109.812 |
| Ya repartido en el árbol (47 billeteras y sus ramas) | 52.273.205 |
| `TSpe5HC3…`, `TG5iBMQ…`, `TAk1xJ…` | prácticamente vacías |

---

## 6. Las notas, el polvo y el falso «TRX»

**Notas.** `TSpe5HC3…` recibió hoy dos transferencias con mensaje:

- 07:54, 1,9 TRX desde `TQrWFCvcngriESyNHi6v7pGAGdtubVan6o`: *«Hey, brother, let me help you transfer funds. I have experience in this area and can directly transfer TRX here»* (`f03953856152cef274cb4192e397519b1f163158bec4696997c2eccbc8617928`).
- 08:18, 1 TRX desde `TYrd3cjfNaYzVwPaSxj1xtzpLVPTA88888`: *«May I help you bro?»* (`c9f3ef8c36a9dd9fe29e5572fffc9a3f203284261593d48410034ec1bb008294`).

Son desconocidos ofreciendo servicios de blanqueo o intentando engañar al ladrón. No hay respuesta ni envío de vuelta a ninguno de los dos.

**Polvo.** Las billeteras del ladrón reciben decenas de transferencias de 0 a 5 TRX desde direcciones cuyas últimas letras imitan a la receptora (`…YP5`, `…N4`, `…8A`, `…ki`, `…fk`, `…1ZP5`): envenenamiento de direcciones, para que al copiar una del historial se equivoque. Igual que los tokens falsos en Ethereum.

**El falso «TRX» de 312 millones.** En TronScan parece que `TRug7ZsKi7LjSg2n8A9a2CUFurE6u6HSwb` envió «312.729.468 TRX» a `TG5iBMQ…` a las 21:09:15 y «65.990.000 TRX» a `TCzBTk…` a las 21:21:15. **No es TRX**: es el token TRC10 nº 1005092, llamado «BanList (BL)», creado por esa misma cuenta el 2-ago-2025 y que anuncia la web usdtbanlist.com. Es un robot que, **tres segundos después** de cada bloqueo de Tether, manda al bloqueado una cantidad del token igual a los USDT congelados. Lo mismo hizo a las 00:26 y 00:38 con otras nueve direcciones que Tether bloqueó esta noche. Quien lea el historial sin mirar el tipo de token creería que esas cuentas recibieron cientos de millones de TRX.

---

## 7. Qué vigilaba el sistema a mediodía (superado por el apartado 10)

He añadido las cinco billeteras con TRX (`TRBdWq…`, `TKkH2vH6…`, `TL2F4Ghn…`, `TCBAz7it…`, `TJajtPqD…`) al vigilante de TRON (`tron-salidas-watch`, tarea de Windows cada 10 minutos, avisos por @blacklistusdtbot). Para ellas el vigilante avisa de cualquier salida o entrada de **1 M TRX o más** y **no sigue** a las billeteras destino: seguir el árbol de cientos de billeteras del apartado 5 sería inabarcable. Para eso añadí al programa un umbral y un interruptor de seguimiento por cuenta (pruebas: 11 de 11 en verde; prueba en seco sobre las últimas 24 h: 7 avisos, todos coinciden con lo descrito aquí). Las salidas pequeñas de `TRBdWq…` (200.000–500.000 TRX cada pocos minutos) quedan por debajo del umbral a propósito, para no llenar el Telegram.

---

## 8. Lo que no he hecho y los límites

- El árbol de blanqueo lo seguí hasta el **tercer salto** y solo por las ramas más gruesas; no he leído las cientos de billeteras restantes ni buscado el punto en que entran en una casa de cambio.
- Las **nueve direcciones** que Tether bloqueó a las 00:26 y 00:38 de hoy, revisadas a las 16:00: **no tienen relación con este robo** (ninguna contraparte en común, importes de 80.000 a 180.000 USDT, otra mecánica). Las cuatro con USDT dentro (`TKv6wmPu…` 134.812, `TJJaDc2i…` 180.000, `TEft93z8…` 79.800 y `TJtpnwQd…` 129,5) siguen congeladas.
- El activo del pequeño préstamo en JustLend (apartado 3) no está identificado; es irrelevante para las cifras.
- No he visto USDC de Circle ni otros stablecoins en la pata TRON: todo fue USDT y TRX.
- Las cifras de «escapado» suponen que todo el TRX de `TSpe5HC3…` y `TRBdWq…` sigue bajo control del ladrón; no hay prueba de lo contrario.
- Precio en dólares con el cierre del 30-10 (0,352 $); el día del robo se cambió a unos 0,367 $, así que el valor «al momento» era algo mayor.

---

## 9. Actualización de las 16:00 UTC: el árbol de blanqueo, visto desde dentro

**Dónde está el TRX.** Miré el saldo de las 86 billeteras del árbol que había anotado a mediodía: **solo suman 1,9 millones de TRX**. Solo dos pasan de 100.000 (`TUoVsNvk…` 1,03 M y `TJRbgAWa…` 0,80 M). El resto ya lo ha reenviado. Es decir, el dinero **no se queda quieto en el árbol**: cada billetera lo pasa en horas. Ninguna de las 86 tiene nombre de casa de cambio ni de otro servicio.

**Una rama convierte a USDT por el camino.** Siguiendo una rama (`TM32EDad…` → `TRshfHZw…`) el TRX **no se queda como TRX**: a las 11:53 UTC `TRshfHZw…` metió **3.000.000 TRX en un enrutador de intercambios (`BWSwapRouterV1`)** y recibió **1.031.212 USDT** del mismo par de SunSwap por el que el ladrón había cambiado los USDT la noche anterior (tx `4779d9f69d5cfc897b468a89766b1f1670c8678c95d5a56dc44ce1eb6101aa75`). Un minuto después mandó 900.000 USDT de vuelta al par y recibió **2.599.705 TRX** (tx `44f2de90b919…`), y a las 12:01 sacó 2.745.417 TRX a otra billetera. Lectura: el ladrón pasa por USDT y vuelve a TRX para romper el rastro. **Mientras hay USDT en una billetera, Tether puede congelarlo**; por eso el vigilante ya sigue también el USDT.

**Hipótesis (no probada):** el objetivo es llegar a depósitos de casas de cambio o intermediarios sin etiqueta pública, donde ya no se ve nada. Un depósito sin etiqueta no lo puede reconocer el vigilante: solo ve «llegó a una billetera sin nombre».

## 10. Qué vigila ahora el sistema (reemplaza al apartado 7)

El vigilante de TRON (`tron-salidas-watch`, tarea de Windows cada 10 minutos, avisos por @blacklistusdtbot) tiene un **modo árbol** para las cinco billeteras con TRX. **No tiene límite de saltos, de billeteras ni de días**: la primera versión del 30-oct por la tarde fijaba 6 saltos, 250 billeteras y 3 días, y se quitó a petición del propietario.

- **Qué sigue:** toda billetera que recibe **10.000 TRX o más** (1 M en los cuatro depósitos), sea cual sea la profundidad. Sigue TRX y USDT. Una billetera se cierra cuando se queda **vacía** (menos de 10.000 de cada) y se **reabre** si le llega más; la que envía a una casa de cambio **no** se cierra, porque puede guardar más.
- **Qué avisa:** un envío de **3 M o más**, cualquier llegada a una casa de cambio con nombre (al instante la primera de cada una cada día; las siguientes pequeñas solo cuentan en el resumen) y el resumen diario a las 22:00 de Madrid. Si en un ciclo hay más de tres avisos, salen **en un solo mensaje** con las llegadas a casas de cambio primero. Todo lo demás queda anotado en `eventos.jsonl`.
- **Límites que quedan y no son decisión mía:** la velocidad de las APIs. TronScan rechaza peticiones si se le piden demasiadas seguidas; esa billetera se reintenta en el ciclo siguiente sin perder nada. Y cada ciclo se corta a los 20 minutos para no pisar al siguiente; las billeteras que no dan tiempo se leen primero en el ciclo siguiente. Los límites de saltos, billeteras y días se pueden volver a poner en `config/cuentas.json` (`profundidadMaxima`, `maxSeguidos`, `dias`), pero por defecto no hay ninguno.
- **Qué no puede hacer:** reconocer un depósito de casa de cambio que no tenga etiqueta pública; seguir otros tokens que no sean USDT; ver lo que ocurre dentro de un contrato (un enrutador de intercambios, un puente): el aviso dice que la rama pasa por un contrato.

## 11. Resultado de las primeras horas del rastreo sin límites (30-oct, 11:45–17:40 UTC)

Datos del propio vigilante (`state/eventos.jsonl`, `state/estado.json`); las cifras de «han pasado» suman cada salto, así que un mismo dinero cuenta una vez por salto y **no es dinero distinto**.

- **Profundidad:** el árbol llegó a **13 saltos** y **1.125 billeteras** seguidas (788 abiertas, 313 cerradas por vacías). Con el tope de 6 saltos se habría perdido todo lo que sigue.
- **Casas de cambio con nombre alcanzadas** (salto desde el que se llegó entre paréntesis):

| Casa de cambio | Llegadas | Importe | Saltos |
|---|---|---|---|
| Gate | 1 | 3.349.395 USDT | 11 |
| OKX Hot Wallet 8 | 27 | 2.343.722 USDT | 8, 10, 11, 12 |
| Bybit | 6 | 1.090.566 TRX | 5, 8 |
| Kraken Hot Wallet | 35 | 477.406 TRX y 410.368 USDT | 7 |
| KuCoin 4 | 4 | 265.113 USDT | 7, 8, 9 |
| Bitget 9 | 1 | 56.000 USDT | 9 |

  En total, **1,57 M TRX y 6,42 M USDT** (unos 7 M$), una pequeña parte de los 684,6 M TRX robados: el resto sigue en tránsito. Además hay una llegada a MXC cuyo importe no consta en estos datos. **Son las casas de cambio a las que habría que avisar** (con las transacciones de `research/binance-0x5227-2026-10-30/tron/llegadas-exchanges-*.json`); lo que llegó como USDT a un depósito ya solo lo puede congelar la propia casa de cambio.
- **Contratos por el camino:** 582 saltos terminaron en un contrato: enrutadores de intercambios (UniversalRouter 211, MetaRouterGateway 123, BWSwapRouterV1 109), JustLend (39) y un **puente de USDT entre cadenas (UsdtOFT, 17)**. Lo que pasa por el puente sale de TRON y este vigilante ya no lo ve; habría que seguirlo en la otra cadena.
- **Han pasado por el árbol hoy** 3.284 saltos, 318 M TRX y 97 M USDT (suma de saltos, con repetición).
- **Dos fallos míos corregidos en el camino:** (1) el vigilante cerraba la billetera que enviaba a una casa de cambio aunque guardara más fondos; ya no. (2) Mandaba un aviso por cada salto: **120 avisos en dos horas y media**, demasiado; ahora van agrupados.

---

## Anexo A — Direcciones

| Dirección | Papel |
|---|---|
| `TDqSquXBgUCLYvYC4XZgrprLK589dkhSCf` | Binance-Hot 7 (etiqueta de TronScan), origen del dinero |
| `TWd4WrZ9wn84f5x1hZhL4DHvk738ns5jwb` | Binance-Cold 2, donde Binance guardó el resto esa noche |
| `TG5iBMQPrDzJJAUM8GMVBf1hRaJ1wvzsGi` | 1.ª billetera del ladrón; 312,73 M USDT congelados dentro |
| `TPBkSjkCMn2ckrMuAP8n2J1jdjbw76bKN4` | 2.ª billetera; cambió 234 M USDT a TRX |
| `TCzBTkqn66yApqbYoPezaEQosM5DAd7Y62` | 65,99 M USDT congelados dentro |
| `TSpe5HC3PRD2svJcr1YoGszhHk2mtkyZ8A` | guardó 638,19 M TRX la noche del 29 al 30; hoy los repartió; recibió las notas |
| `TAk1xJNWuBYvJHLsUiBFLeuK6xvpQUFYP5` | 120 M de paso hacia la de blanqueo |
| `TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki` | billetera de blanqueo (reparte en trozos) |
| `TKkH2vH6kyi2QKcMbqym53WMuvdd1xvw6K`, `TL2F4GhnaFVZBZPncHYjwfYZFW44NcfVwj`, `TCBAz7itvtX5CjBzVMPQdrbwQLN63ao1fk`, `TJajtPqDqUGh1Sr1j8ugHoSXBVpaFLLHKT` | depósitos de 158,2 M y 3 × 120 M TRX, quietos |
| `TQqgNg13s2DjvXhW1ky4v6TsR8wZGvb7Y4`, `TSUUVjysXV8YqHytSNjfkNXnnB49QDvZpx`, `TVjuTE3V5bMVdpfNhid8kD2v35T2k1u1Br` | SunSwap: enrutador, pares V2 y gestor de pools V4 (contratos públicos) |
| `TXJgMdjVX5dKiQaUi9QobwNxtSQaFqccvd` | JustLend, mercado de USDT (jUSDT) |
| `TRug7ZsKi7LjSg2n8A9a2CUFurE6u6HSwb` | robot «BanList»: manda un token falso a cada dirección que Tether bloquea |
| `TQrWFCvcngriESyNHi6v7pGAGdtubVan6o`, `TYrd3cjfNaYzVwPaSxj1xtzpLVPTA88888` | autores de las dos notas |

## Anexo B — Cómo se hizo

TronScan (`accountv2`, `transaction`, `transfer`, `token_trc20/transfers`, `transaction-info`, `token`) y TronGrid (`/v1/accounts/…/transactions`, eventos del contrato USDT, `triggerconstantcontract` para `isBlackListed`), con las claves del bot de la blacklist leídas solo en el servidor. Las notas se leyeron del campo `raw_data.data` de TronGrid (TronScan no las devuelve en la lista). Los tipos de transacción se comprobaron uno a uno para distinguir TRX real (tipo 1) de tokens TRC10 (tipo 2). Ficheros en `research/binance-0x5227-2026-10-30/tron/` (cuentas, listas de transacciones, eventos de Tether, árbol de reparto, `hashes.json`).
