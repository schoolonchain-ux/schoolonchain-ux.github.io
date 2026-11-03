# Robo a Binance del 29-oct-2026 — Informe completo y seguimiento (TRON y Ethereum)

**Qué es este documento.** Sustituye al informe de Ethereum del 30-oct por la mañana y a su anexo de TRON. Recoge toda la historia en una sola pieza y la pone al día con lo ocurrido durante el 30-oct. Lo que ya publicaste en Medium queda **superado** por este texto, sobre todo en lo que decía de las llegadas a casas de cambio (apartado 6).

**Cuándo.** Las lecturas de esta versión se hicieron el **30-oct-2026 entre las 21:30 y las 22:45 hora de Madrid** (20:30 a 21:45 UTC); los registros del vigilante cubren desde las 12:45 hora de Madrid (11:45 UTC). Salvo que se diga otra cosa, las horas están en UTC. Precios: TRX a 0,352 $ y ETH a 2.253 $ (cierre del 30-10 en Binance, bóveda local).

**Fuentes.** Etherscan, TronScan y TronGrid leídos en vivo, más los registros de los dos vigilantes que montamos el 30-oct. Los datos en bruto están en `research/binance-0x5227-2026-10-30/` (Ethereum) y `research/binance-0x5227-2026-10-30/tron/` (TRON).

---

## 0. Para quien ya leyó la versión anterior

1. **La cifra de «llegadas a casas de cambio» que di antes estaba mal.** Primero dije unos 7 M$ y luego el vigilante llegó a sumar unos 200 M$. Las dos incluían dinero que no es del robo: el recorrido que sigue el vigilante se cruza con billeteras de servicio, por ejemplo una de 138.000 operaciones que casi solo mueve fondos de la propia OKX. Las cifras comprobadas están en el apartado 6.
2. **La mayor parte del dinero escapado en TRON sigue sin tocar.** 518 M TRX (unos 182 M$) están quietos en cuatro billeteras desde las 10:20 UTC (apartado 3).
3. **El blanqueo es lento y pasa por un grupo de cinco billeteras creadas el mismo minuto, el 11 de octubre.** Es lo más importante que se ha descubierto desde la versión anterior (apartado 5).
4. **Tether ha congelado muy poco en TRON después de la primera noche.** Unos 1,3 M USDT en billeteras relacionadas con el recorrido (apartado 8).
5. **Ethereum no se ha movido.** Los 508.854 ETH siguen donde estaban (apartado 2).
6. **Errores míos que corregí por el camino** están en el apartado 10.

---

## 1. Conclusión

- El robo se hizo a la vez en **dos cadenas**. En Ethereum salió dinero de las billeteras calientes Binance 14 y Binance 16 hacia la dirección `0x5227…2f8c`. En TRON salió de **Binance-Hot 7** hacia una billetera recién creada, `TG5iBMQ…`. En TRON el primer envío fue a las 20:20 UTC, cuatro minutos antes del barrido de Ethereum.
- **Lo que escapó, a precios de hoy:** unos **1.147 M$ en ETH** aparcados sin moverse, otros **19 M$ en ETH** en Arbitrum y unos **241 M$ en TRX**. En total, **del orden de 1.400 M$**, sin contar tokens menores sin vender.
- **Lo que paró Tether, con diferencia:** 1.380 M USDT en Ethereum y **378,7 M USDT en TRON**. Circle bloqueó además 823 M USDC. Otros emisores bloquearon sus tokens dentro de la dirección. Ripple no llegó a tiempo.
- **TRON, dónde está lo escapado (22:00 hora de Madrid):**
  - **518,2 M TRX (182,4 M$, el 76 %)** siguen sin tocar en cuatro billeteras de depósito.
  - **37,5 M TRX (13,2 M$, el 5 %)** esperan en la billetera de reparto `TRBdWq…`.
  - **Unos 129 M TRX (45,4 M$, el 19 %)** han salido hacia un recorrido de cientos de billeteras.
- **Cómo blanquean:** `TRBdWq…` reparte TRX en trozos de 200.000 a 500.000 a 114 billeteras de un solo uso. Esas billeteras lo reenvían, lo cambian por USDT en intercambios descentralizados y lo meten en **un grupo de cinco billeteras creadas el 11-oct entre las 23:35 y las 23:36 UTC**. Del grupo sale en trozos de unos 100.000 USDT hacia billeteras nuevas.
- **Llegadas a casas de cambio, comprobadas:** al menos **1,77 M$** han llegado a Bybit (1,46 M$), OKX (0,29 M$) y Bitget (0,02 M$) desde diez billeteras de depósito. **Todas cuelgan del grupo del 11-oct o de otros nodos de servicio.** Es una parte pequeña de lo escapado, y por ahora el blanqueo avanza a un ritmo del orden de 0,5 M$ por hora.
- **Lo que no puedo decir:** quién es el ladrón, ni quién controla el grupo del 11-oct. Sí puedo decir qué direcciones y qué transacciones habría que enseñar a Bybit, OKX y Bitget y a Tether.

---

## 2. Ethereum: seguimiento

Los hechos del robo en Ethereum no han cambiado y se resumen aquí. El detalle, con todos los hashes, está en el informe del 30-oct por la mañana (`INVESTIGACION-BINANCE-0x5227-2026-10-30.md`).

- Entre las 20:24:23 y las 21:44:11 UTC la dirección `0x5227…2f8c` recibió **directamente de Binance 14 y Binance 16** 1.875,46 M USDT, 196.138 ETH y otros 61 tokens. Tether bloqueó la dirección a las 21:01:35 y a Binance 14 a las 22:06. Circle, XAUt, USD1, PAXG y FDUSD bloquearon después lo suyo.
- **Estado hoy a las 22:30 hora de Madrid** (lectura en vivo con Etherscan):

| Billetera | ETH antes | ETH ahora |
|---|---|---|
| Receptor 1 `0x8532fa14…` | 197.460 | 197.460 |
| Receptor 2 `0x03b0ee5d…` | 17.260 | 17.260 |
| Consolidación A `0xc887af69…` | 137.602 | 137.602 |
| Consolidación B `0x897c80d1…` | 78.415 | 78.415 |
| Consolidación C `0x54401f80…` | 40.601 | 40.601 |
| Consolidación D `0x79e70d13…` | 34.280 | 34.280 |
| Consolidación E `0x8d4b8ee6…` | 3.237 | 3.237 |
| **Total** | **508.854 ETH (≈ 1.147 M$)** | **508.854 ETH** |

- La dirección principal `0x5227…` conserva 4,81 ETH. El vigilante de ETH solo anotó dos ventas pequeñas de tokens desde ella: 3,53 M de DAR a las 11:08 UTC y 13,88 M de CTSI a las 17:25 UTC, las dos hacia contratos sin nombre.
- **Ningún movimiento de ETH desde la mañana.** Ese ETH es libre y nadie puede congelarlo; solo se puede vigilar.

---

## 3. TRON: dónde está lo escapado

El robo en TRON fue de **612.729.468 USDT y 46.394.098 TRX**. Tether congeló 378.719.468 USDT. El resto escapó: 234 M USDT que el ladrón cambió por **638.190.941 TRX**, más los 46,4 M TRX robados directamente, descontadas comisiones. Total escapado: **≈ 684,6 M TRX (≈ 241 M$)**.

**Dónde estaba ese TRX a las 22:00 hora de Madrid** (saldos leídos en vivo):

| Dónde | TRX | ≈ $ | Parte |
|---|---|---|---|
| `TKkH2vH6…` depósito | 158.200.902 | 55,7 M | 23 % |
| `TL2F4Ghn…` depósito | 120.000.000 | 42,2 M | 18 % |
| `TCBAz7it…` depósito | 120.000.000 | 42,2 M | 18 % |
| `TJajtPqD…` depósito | 120.000.000 | 42,2 M | 18 % |
| **Cuatro depósitos sin tocar** | **518.200.902** | **182,4 M** | **76 %** |
| `TRBdWq…` reparto | 37.501.203 | 13,2 M | 5 % |
| **Ya salido hacia el recorrido** | **≈ 128,9 M** | **≈ 45,4 M** | **19 %** |

- Los cuatro depósitos recibieron su TRX entre las 10:15 y las 10:20 UTC desde `TSpe5HC3…` y **no han emitido ni una transacción desde entonces**. Si algún día se mueven, el vigilante avisa de cualquier envío de 1 M TRX o más.
- `TRBdWq…` recibió 46,38 M TRX a las 00:06 UTC y otros 120 M a las 10:20 UTC (166,4 M en total). Desde las 02:19 UTC ha hecho **345 envíos de 10.000 TRX o más, por 132,4 M TRX, a 114 billeteras distintas**, el último a las 20:48 UTC. La diferencia con el neto de 128,9 M son unos 3,5 M que le han llegado de vuelta o por otras vías; no lo he desglosado.
- Estas cifras son **saldos y envíos de las propias billeteras**, no sumas de saltos: son lo más fiable de este informe.

---

## 4. TRON: cómo ocurrió

### 4.1 El origen: Binance-Hot 7 → `TG5iBMQ…`

`TG5iBMQPrDzJJAUM8GMVBf1hRaJ1wvzsGi` se creó a las 20:19 UTC del 29-oct. Un minuto después empezó a recibir de **Binance-Hot 7** (`TDqSquXBgUCLYvYC4XZgrprLK589dkhSCf`, etiqueta pública de TronScan):

| Hora (UTC) | Qué | Transacción |
|---|---|---|
| 20:20:00 | 10.000 TRX (prueba) | `6f983ab745fbea298ec6376054fb16155f3142ec0d9f3fec4c053220cafc9644` |
| 20:21:12 | **46.384.098 TRX** | `72f5fbedbc4d6f70113e139312eef09fb28a5fefd49d321bc1e28b6cea5bab9c` |
| 20:22:45 | **612.729.468 USDT** | `4203af9ca1833d09c05666eafbd70d703a3811c0bdcf125106685ab75958253e` |

Revisé todas las salidas de Binance-Hot 7 entre las 19:00 y las 24:00 de ese día: la única salida grande hacia una billetera ajena es esta. A partir de las 22:57 Binance pasó lo que quedaba a **Binance-Cold 2** (`TWd4WrZ9wn84f5x1hZhL4DHvk738ns5jwb`).

### 4.2 El cambio de USDT a TRX (20:44 a 21:42 UTC)

`TG5iBMQ…` mandó a `TPBkSjkCMn2ckrMuAP8n2J1jdjbw76bKN4` 10.000 TRX para comisiones, 100 M USDT a las 20:45 y 200 M USDT a las 20:56. Entre las 20:47 y las 21:14 `TPBkSj…` hizo **16 cambios** de USDT a TRX en SunSwap, 234 M USDT en total. El TRX salió a `TSpe5HC3PRD2svJcr1YoGszhHk2mtkyZ8A`:

- **288.330.000 TRX** a las 20:56:12: `4b329d4495bcdd8df40117cd478f13c5027988147c7deb9add5e4aee3b8107c4`
- **349.860.941 TRX** a las 21:42:42: `fb5089f5ce2ae9be6f8e5e3f78470a5a8d694879ac68f6c8cfe3d81450fa6149`

A las 21:16 apartó **65.990.000 USDT** en `TCzBTk…` (`TCzBTkqn66yApqbYoPezaEQosM5DAd7Y62`) y a las 21:14 metió 10.000 USDT en JustLend. Cuadran los 300 M USDT que recibió esta billetera: 234 M cambiados, 65,99 M apartados y 0,01 M en JustLend.

### 4.3 Qué congeló Tether esa noche

| Hora (UTC) | Dirección | USDT dentro | Transacción |
|---|---|---|---|
| 21:09:12 | `TG5iBMQ…` | **312.729.468** | `71b0ec0fe873fe820c37cc3ecbab4e83087f87e833d191012a0a4027d20594e1` |
| 21:17:39 | `TPBkSj…` | 0 | `bc4e4a76bd262307a4d005d9745e2e8cf3bfe7d38e2ae4d5fcfaa40376721f40` |
| 21:21:12 | `TCzBTk…` | **65.990.000** | `176a5783fd70f5abbae9569f60398afe5307eefa9d06982ae5a9351e2cbc0f13` |

Total congelado en TRON: **378.719.468 USDT (61,8 % de lo robado)**. Tardó 47 minutos desde la primera recepción; en ese tiempo el ladrón sacó 300 M USDT y cambió 234 M.

### 4.4 El reparto del 30-oct

`TSpe5HC3…` guardó los 638,19 M TRX toda la noche y el 30-oct, entre las 10:15 y las 10:20 UTC, los repartió:

| Hora (UTC) | A | TRX | Transacción |
|---|---|---|---|
| 10:15 | `TAk1xJNW…` | 120.000.000 | `9d0904db84e640d37e9fee8badef0883043db77f5bf9c87ca76e220e0c35c487` |
| 10:18 | `TL2F4Ghn…` | 120.000.000 | `16585e9664a0e7e74d67caeba2ecdc9869ec9a84a287dc078a12d34ca078c0d1` |
| 10:18 | `TCBAz7it…` | 120.000.000 | `037428516b343a326157ae75495ad3227b43e4a4cb0c8c3837e849d7a18d556e` |
| 10:19 | `TJajtPqD…` | 120.000.000 | `3db47d891cc211c300f9ba1aec264bfca8f9e32fbe220c411f30789a31ac8370` |
| 10:20:18 | `TKkH2vH6…` | 158.200.900 | `aff887c4be7cd52eb8905899fc9596eaaf9c49dea59129519ce25d7c69762334` |

`TAk1xJNW…` pasó sus 120 M a `TRBdWq…` a las 10:20:48 (`0ae2b5a4e1c8849d09e16db5a4dd9d90f7224c3b996a80ccad113bd5b81acd39`). Las otras cuatro son los depósitos que siguen quietos.

---

## 5. El blanqueo: lo que se ve desde dentro

Esquema de lo observado, de arriba abajo:

1. **`TRBdWq…`** reparte TRX en trozos de 200.000 a 500.000 a 114 billeteras de un solo uso (primer nivel).
2. Cada una reenvía casi todo en horas a otras billeteras nuevas. El recorrido llegó a **19 saltos** y a más de **3.600 billeteras** seguidas.
3. A lo largo del camino el dinero **pasa por contratos de intercambio** (UniversalRouter, BWSwap, MetaRouter): el TRX se cambia por USDT y vuelve a TRX. Eso rompe el rastro pero no lo saca de TRON.
4. En algún punto entra en **un grupo de cinco billeteras de servicio**, que reciben de decenas de billeteras de un solo uso.
5. Del grupo sale en trozos de unos 100.000 USDT hacia **billeteras nuevas**, y algunas de ellas depositan en **Bybit, OKX y Bitget**.

### 5.1 El grupo creado el 11 de octubre

Cinco billeteras creadas con **menos de dos minutos de diferencia**, el 11-oct-2026 entre las 23:35:09 y las 23:36:33 UTC. Hoy tienen entre 8.400 y 9.300 operaciones cada una. Son nodos de servicio, no billeteras de paso:

| Billetera | Creada (UTC) | Operaciones | TRX | USDT |
|---|---|---|---|---|
| `THPaGKe6aZkUcNht24hcscZPLwtcJAbpun` | 23:35:09 | 9.334 | 1.174.515 | 155.232 |
| `TGSNahJvAdh86aR5pdcxiep1mBWSRK3HHL` | 23:35:12 | 8.427 | 828.866 | 261.007 |
| `TBAPnuwEht65McDbxDvDYs2XLRSSbYQMUM` | 23:35:15 | 8.573 | 1.540.329 | 97.434 |
| `TLKfB2goHRY1SykEpVbiGdsesACrkCxCeW` | 23:36:21 | 8.664 | 1.583.378 | 227.763 |
| `TH1YKH9MUuJtDmekPia4x9fZXAcpPrMv8B` | 23:36:33 | 8.734 | 840.195 | 646.998 |

- **Quién los alimenta.** Comprobé una por una las 94 billeteras que les han enviado dinero del recorrido: **todas son billeteras de paso** (hasta 874 operaciones, mediana de 11). Les han metido en conjunto unos **7,2 M$** (suma de envíos hasta las 22:15 hora de Madrid).
- **Qué peso tiene el recorrido en el grupo.** En una muestra de unas 8 horas (400 transferencias por billetera), entraron en las cinco **4,43 M USDT, de los que el 64 % (2,83 M) vienen de billeteras del recorrido**, y salieron 5,52 M USDT. Más de la mitad de su tráfico reciente es del recorrido, así que el grupo parece más **infraestructura del blanqueo** que un servicio de uso general.
- **Adónde manda.** Su salida va en trozos de unos 100.000 USDT a billeteras de un solo uso. Algunas se crearon el mismo día 30-oct y tienen 2 operaciones: son direcciones de depósito de un solo uso.

**Hipótesis (no probada):** las cinco billeteras las controla quien lava el dinero, o un servicio de mezcla que utiliza. Lo que sí se sostiene con los datos es que el grupo es el punto por el que pasa buena parte del dinero que llega a casas de cambio.

### 5.2 Ritmo

El grupo ha recibido unos 7,2 M$ del recorrido en 14 horas (de las 06:38 a las 21:15 UTC), es decir, **del orden de 0,5 M$ por hora**. Con ese ritmo, sacar los 182 M$ que siguen quietos llevaría semanas. Es una **estimación**, no una previsión: pueden usar otras vías, subir el ritmo o esperar.

---

## 6. Llegadas a casas de cambio

### 6.1 Lo que sí está comprobado

Diez billeteras de poca actividad (entre 16 y 623 operaciones en toda su vida) han enviado a las billeteras calientes de **Bybit, OKX y Bitget**. En las 48 horas anteriores, entre el 87 % y el 100 % de lo que recibió cada una venía de billeteras del recorrido. **Total: 1,77 M$.** Hora de la primera y de la última llegada: 10:01 y 20:46 UTC.

| Casa | Billetera que envía | Llegadas | $ | Mayor envío (hash) |
|---|---|---|---|---|
| Bybit | `TXYiPCELFdqELhQ4vGhniwJeNqEjruZCKv` | 16 | 1.172.481 | `ab0a3dcb1da4f0febb28413472874724ea030db28e8b91e338fb3641e973be61` |
| Bybit | `TLk1ApRsMDfDoWhamxiBfrihGnFirnXwtJ` | 5 | 135.703 | `1ae610cc93ccd7d8c3f682fc583c1f24fdcfcfe4a2492a1bb7fc90d6a7bd399d` |
| Bybit | `TFL9UDVKRt24TfPxREt1BqFLPiY4RV7rAD` | 6 | 78.936 | `91d4f55a83342cef46efb9525bf385deb8b8460b662b7756af04bc7bf39eb138` |
| Bybit | `TZJNGaCXJHq9R6mdqdZRuytWocdTqXNHkY` | 5 | 48.148 | `83e2e0f7f1559dba9cb5892207e20880093e352ed13731dc8cc8fccd71cee4fc` |
| Bybit | `TAY57cdT5Yi9rU8GFDyXGc8dF8hvNWyTqh` | 3 | 26.494 | `e809e79ca587e7289e7c5a578f061776272ad856a7421c675b5626b0be514c4c` |
| OKX | `TE8UuFS41ofPaXGFU36LF8g3G6ZXv2c3MM` | 9 | 241.000 | `437cfc994151604b95217524e8bb47711aa1eddca6bac36ef9d1a90f5a58b0ea` |
| OKX | `TECEnCeAZeVTR1Uo1xaGEZAXdHm98pTLrh` | 1 | 28.598 | `9c66209dea9cb3b45730e0221991fe4a85abb65ae1e98b5e00005bbc7404066e` |
| OKX | `TLBuGwK1TBqZ9zLCax9oMWo2Jcq9JsJfdV` | 1 | 10.356 | `b9c0800b639405ac9a244c94dcfae193b904ee7774b2512df659b1216f0a7477` |
| OKX | `TC1H2MurnUDVYWYrXcptKj33GVvqDxrkjo` | 1 | 10.116 | `c31a7b4fd7604cc96c6519efe52323d50ebaecb7dcdf395b98bef9829363d6a4` |
| Bitget | `TJeJf1R4EUxySj2cX89okY4tECUHFynoqU` | 1 | 21.457 | `680cac75885f1d91336e6e735609eaf29d902e290bb159a4a6184d0d22b3b810` |

- **Por casa:** Bybit 35 llegadas y 1.461.762 $; OKX 12 llegadas y 290.070 $; Bitget 1 llegada y 21.457 $.
- **De dónde cuelgan.** Siguiendo hacia atrás la cadena principal de cada una: **siete pasan por una de las cinco billeteras del grupo del 11-oct** (1,49 M$) y **tres por otros nodos de servicio** (0,28 M$): `TX5XiRXdyz…` (1,6 M de operaciones) y `TZG47zhb8k…` (317.000 operaciones).
- **Qué significa.** Estas diez billeteras son, con alta probabilidad, **direcciones de depósito** que cada casa asigna a un cliente. Quien las abrió es un cliente de la casa: ahí está la persona identificable. Lo que cada casa sabe de esos clientes no está en la cadena.
- **Cautela.** «Alta probabilidad» no es prueba: una billetera de depósito puede mezclar dinero del ladrón con el de otros usuarios, y el grupo mueve también dinero que no es del recorrido (el 36 % de su tráfico reciente).

Billeteras calientes de las casas, para quien quiera avisarlas:

| Casa | Billetera caliente |
|---|---|
| Bybit | `TU4vEruvZwLLkSfV9bNw12EJTPvNr7Pvaa` |
| OKX (OKX Hot Wallet 8) | `TLaGjwhvA8XQYSxFAcAXy7Dvuue9eGYitv` |
| Bitget (Bitget 9) | `TJ7hhYhVhaxNx6BPyq7yFpqZrQULL3JSdb` |

### 6.2 Lo que descarté, y por qué importa

El vigilante anotó **282 llegadas a siete casas de cambio por unos 200 M$** en bruto. Comprobé la procedencia de los remitentes más grandes y **casi nada de eso es del robo**:

| Llegada | Importe | Por qué se descarta |
|---|---|---|
| 19 llegadas a OKX desde `TYE5mNXSQHuPAdCa1etk76BKybD4FKJto6` | ≈ 110 M$ | Billetera de 138.543 operaciones. De los 265,8 M USDT que recibió en 48 h, **216,6 M vienen de la propia OKX Hot Wallet 8** y solo **244.836 $ (0,09 %) del recorrido**. Es un nodo que entra y sale de OKX; no es del ladrón. |
| 1 llegada a Bitfinex desde `TV3Ww3GXsDWgNJzfEUdfjRcmKziwCHCgVK` | 44,1 M$ | Rastreada hacia atrás: `TV3Ww3…` ← `TShzMr5Yao…` ← **`TYE5mNXSQH…`** (la misma de arriba). Tx `d2ed658e45f615422dd4a3173003378525e0b21b36acc746802eed98d46992eb`. |
| 11 llegadas a Bybit desde `TSjC6P3UNhiofAWPpDcUmVGzubVkxDGTuL` | 13,2 M$ | Billetera de 54.599 operaciones; lo que recibe viene en buena parte de la billetera caliente de Bitget. |
| 5 llegadas a OKX desde `TLVSJvHfsFiuYRtmkvpb6YWXsMyNvHgqyK` | 6,5 M$ | Solo el 31 % de lo que recibe viene del recorrido; el resto, de la billetera caliente de Bitget. |
| 1 llegada a Gate desde `TStvMPH7wv3Z6FR4YWxpkbf6iEn3WyRAvC` | 3,3 M$ | Solo el 9 % de lo que recibe viene del recorrido. |
| 1 llegada a Kraken desde `TZDeYHLLSo4nf7bbEw9wkhSPytnDaL3xm7` | 5 M$ | La mitad de lo que recibe viene de la billetera caliente de Bybit. |

**La lección:** cuando el seguimiento llega a una billetera que ya mueve millones de dólares al día por su cuenta, todo lo que sale de ahí parece del robo y no lo es. Ver los apartados 10 y 11.

---

## 7. Puentes, préstamos y contratos

Cifras de la suma de saltos del recorrido completo (incluye parte que no es del robo), así que valen como indicio, no como importe:

- **Intercambios** (UniversalRouter, BWSwapRouterV1, MetaRouterGateway y contratos sin nombre): más de mil saltos. Son cambios de TRX por USDT y al revés dentro de TRON. **No son una salida.**
- **Préstamos** (JustLend, `CErc20Delegator`): 72 saltos con unos 15 M USDT depositados.
- **Puente de USDT entre cadenas** (`UsdtOFT`): 29 saltos con unos 3,3 M USDT. Eso **sale de TRON hacia otra cadena** y este seguimiento ya no lo ve. No he decodificado el destino.
- **Otros puentes** (Bridgers, Rango): 10 saltos, importes muy pequeños.

---

## 8. Tether en TRON después de la primera noche

Desde el 29-oct a las 20:00 UTC, el contrato de USDT en TRON registró **61 bloqueos de 60 direcciones**: 3 esa noche, 9 a las 00:26 y 00:38, 4 a las 13:00, **37 entre las 17:00 y las 17:30** y 7 entre las 19:00 y las 20:00. Desde las 00:30 UTC del 30-oct son **51 direcciones con 3,41 M USDT congelados** en total.

- **Cuatro están relacionadas con el recorrido** (`TJgPGQrtaFDLFQbPhGzYSg1Ri7LU1m7on6` con 995.316 USDT, `TT7AfMinqz2og7uBf3JM1L1fQ3YhuPds1Q` con 181.975, `TM2UYkVQGGVrUmKyncrDRKSViC7KejAWL1` con 149.072 y `TNWyDsFm3PY41YZnFug6xLTXsC545Z7wh9`, sin saldo). Suman **1,33 M USDT**. «Relacionadas» significa que enviaron o recibieron dinero de una billetera del recorrido seguido, que incluye nodos con fondos ajenos; no prueba que ese dinero sea del robo.
- **No sé qué motivó los otros 47 bloqueos**, entre ellos los 37 de las 17:00. En las últimas 50 transferencias de USDT de cada una no se ve relación con el recorrido.
- Comparado con lo movido (cientos de millones de dólares), **lo congelado en el recorrido es muy poco**. Tether bloquea direcciones, no monedas: lo que ya está en depósitos de casas de cambio solo lo pueden congelar ellas.

---

## 9. Notas, polvo y el falso «TRX»

- **Notas.** `TSpe5HC3…` recibió hoy dos transferencias con mensaje: *«Hey, brother, let me help you transfer funds. I have experience in this area and can directly transfer TRX here»* (07:54, `f03953856152cef274cb4192e397519b1f163158bec4696997c2eccbc8617928`) y *«May I help you bro?»* (08:18, `c9f3ef8c36a9dd9fe29e5572fffc9a3f203284261593d48410034ec1bb008294`). Son desconocidos ofreciéndose a ayudar a mover los fondos. No hay respuesta del ladrón.
- **Polvo.** Las billeteras del ladrón en TRON reciben cientos de transferencias de menos de 0,001 TRX (la mayoría de exactamente 0,000002 TRX) de unos 600 remitentes distintos. *Corrección del 31-oct: una versión anterior de este informe decía que imitaban las últimas letras de las billeteras; medido, no es así (solo 2 de 646 comparten las 4 últimas letras con otra contraparte). El envenenamiento por imitación sí está confirmado en Ethereum; ver el catálogo.*
- **El falso «TRX» de 312 millones.** En TronScan parece que `TRug7ZsKi7LjSg2n8A9a2CUFurE6u6HSwb` envió «312.729.468 TRX» a `TG5iBMQ…`. **No es TRX**: es el token TRC10 nº 1005092, «BanList», que un robot envía tres segundos después de cada bloqueo de Tether por el mismo importe congelado. Hay que mirar siempre el tipo de token.

---

## 10. Cómo se ha medido y qué errores corregí

**Método.**

- **Saldos y envíos propios** de las billeteras de partida (apartado 3) se leen directamente: es lo más fiable.
- **Las llegadas a casas de cambio** (apartado 6) se comprobaron de dos formas: qué parte de lo que recibe cada remitente viene del recorrido en las 48 horas anteriores, y si la cadena hacia atrás pasa por un nodo de servicio (más de 5.000 operaciones).
- **Las sumas del vigilante** («319 M TRX y 97 M USDT han pasado por el árbol») son **suma de saltos**: el mismo dinero cuenta en cada salto. No sirven como importes.

**Errores míos que corregí hoy.**

1. Cerraba la billetera que enviaba a una casa de cambio aunque guardara más fondos. Ya no lo hace.
2. Mandaba un aviso por cada salto: unos 120 en dos horas y media. Ahora van agrupados.
3. **Daba como llegadas a casas de cambio cifras que incluían fondos ajenos.** Lo detecté al comprobar los remitentes, corregí el resumen diario del vigilante para que no dé importes de ese tipo y rehíce el apartado 6.
4. Una primera versión de mi cálculo de la «zona limpia» (billeteras sin nodos de servicio entre ellas y el robo) trató como limpias a billeteras cuya consulta había fallado, por ejemplo una de 317.000 operaciones y una del grupo del 11-oct. La descarté. Por eso este informe solo da por buenas las cadenas que verifiqué una a una (apartado 6.1).

**Límites de lo que se ve.**

- **El vigilante va con retraso.** Lee unas 1.000 billeteras por ciclo, y hace falta más de media hora por ciclo. A las 21:33 hora de Madrid había 1.528 billeteras abiertas sin leer en la última hora. No se pierde nada (cada una se lee desde donde se quedó), pero los avisos llegan tarde.
- **No se puede reconocer un depósito de casa de cambio sin etiqueta pública.** Las diez billeteras del apartado 6.1 las identifiqué por su comportamiento, no por una etiqueta.
- **No se sigue más allá de los puentes** (apartado 7) ni lo que ocurre dentro de las casas de cambio.
- **Los saldos del interior del recorrido son incompletos:** 288 de 2.405 lecturas fallaron y las billeteras que el vigilante dio por vacías no se vuelven a leer. Por eso no doy un total de «dinero que sigue en tránsito». Lo que consta con certeza es lo del apartado 3.
- **Lo escapado y lo contado no cuadra al céntimo:** de los 45,4 M$ que salieron de `TRBdWq…`, tengo comprobados 7,2 M$ que entraron en el grupo, 1,77 M$ que llegaron a casas de cambio y unos 3,3 M USDT que fueron al puente. El resto está en tránsito, en contratos o en billeteras que no he leído.

---

## 11. Qué vigilan hoy los dos vigilantes

- **Ethereum** (`eth-salidas-watch`, cada 10 minutos): ocho billeteras, avisa de cualquier salida de 100 ETH o más y de toda salida de tokens, agrupada. Sin fallos.
- **TRON** (`tron-salidas-watch`, cada 10 minutos): las cinco billeteras de partida. Sigue en silencio las billeteras que reciben **10.000 TRX o más**, **sin límite de saltos ni de días**, también el USDT; las cierra cuando se quedan vacías y las reabre si les llega dinero. Avisa de envíos de 3 M o más y de llegadas a casas de cambio con nombre (agrupadas por ciclo), y manda un **resumen diario a las 22:00 hora de Madrid**.
- **Qué falta mejorar** (no está hecho): que el vigilante reconozca los nodos de servicio y no los siga como si fueran del ladrón (la raíz del problema del apartado 6.2), y que lea más rápido las billeteras que no se han movido.

---

## 12. Qué tendría sentido hacer ahora

Son propuestas, no acciones que yo haya hecho:

1. **Avisar a Bybit, OKX y Bitget** con la lista del apartado 6.1: billeteras de depósito, importes, horas y hashes. Esas cuentas son de clientes identificables para ellas.
2. **Avisar a Tether** de las cinco billeteras del grupo del 11-oct, que tienen 1,39 M USDT en conjunto y reciben y mandan USDT sin parar.
3. **Mantener la vigilancia de los cuatro depósitos** con 518 M TRX: si se mueven, es el momento de actuar con las casas de cambio.
4. **Decodificar el destino del puente de USDT** (`UsdtOFT`) para seguir en la otra cadena lo que salió de TRON.

---

## Anexo A — Direcciones citadas

| Dirección | Papel |
|---|---|
| `TDqSquXBgUCLYvYC4XZgrprLK589dkhSCf` | Binance-Hot 7, origen del dinero |
| `TWd4WrZ9wn84f5x1hZhL4DHvk738ns5jwb` | Binance-Cold 2, adonde Binance puso a salvo el resto |
| `TG5iBMQPrDzJJAUM8GMVBf1hRaJ1wvzsGi` | 1.ª billetera del ladrón, 312,73 M USDT congelados |
| `TPBkSjkCMn2ckrMuAP8n2J1jdjbw76bKN4` | cambió 234 M USDT por TRX |
| `TCzBTkqn66yApqbYoPezaEQosM5DAd7Y62` | 65,99 M USDT congelados |
| `TSpe5HC3PRD2svJcr1YoGszhHk2mtkyZ8A` | guardó el TRX la noche del 29 al 30 y lo repartió |
| `TAk1xJNWuBYvJHLsUiBFLeuK6xvpQUFYP5` | paso de 120 M TRX hacia el reparto |
| `TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki` | billetera de reparto, 37,5 M TRX |
| `TKkH2vH6kyi2QKcMbqym53WMuvdd1xvw6K`, `TL2F4GhnaFVZBZPncHYjwfYZFW44NcfVwj`, `TCBAz7itvtX5CjBzVMPQdrbwQLN63ao1fk`, `TJajtPqDqUGh1Sr1j8ugHoSXBVpaFLLHKT` | cuatro depósitos, 518,2 M TRX sin tocar |
| `THPaGKe6aZkUcNht24hcscZPLwtcJAbpun`, `TGSNahJvAdh86aR5pdcxiep1mBWSRK3HHL`, `TBAPnuwEht65McDbxDvDYs2XLRSSbYQMUM`, `TLKfB2goHRY1SykEpVbiGdsesACrkCxCeW`, `TH1YKH9MUuJtDmekPia4x9fZXAcpPrMv8B` | grupo del 11-oct |
| `TYE5mNXSQHuPAdCa1etk76BKybD4FKJto6` | nodo que mueve fondos de la propia OKX (descartado) |
| `TX5XiRXdyz7sdFwF5mnhT1QoGCpbkncpke`, `TZG47zhb8kcriWQ2rE719yHs1KqgzwMrvF` | nodos de servicio por los que pasan tres de las diez billeteras de depósito |
| `TRug7ZsKi7LjSg2n8A9a2CUFurE6u6HSwb` | robot «BanList» (token falso tras cada bloqueo) |
| `TQrWFCvcngriESyNHi6v7pGAGdtubVan6o`, `TYrd3cjfNaYzVwPaSxj1xtzpLVPTA88888` | autores de las dos notas |

## Anexo B — Ficheros de datos

En `research/binance-0x5227-2026-10-30/tron/`: `llegadas-directas-verificadas-21h.json` (las diez billeteras, con hashes y cadenas), `alimentan-grupo-11oct-21h.json` (las 94 billeteras que alimentan al grupo), `grupo-creado-11oct-21h.json` y `grupo-11oct-peso-21h.json` (el grupo y su tráfico), `pureza-remitentes-21h.json` y `pureza-todos-21h.json` (procedencia de los remitentes), `antepasados-21h.json` (cadenas hacia atrás), `saldos-arbol-21h.json` (saldos), `tether-AddedBlackList-21h.json` y `tether-bloqueos-relacion-21h.json` (bloqueos), `llegadas-exchanges-21h.json` (las 282 llegadas en bruto). En `research/binance-0x5227-2026-10-30/`: `eth-saldos-21h.json`.
