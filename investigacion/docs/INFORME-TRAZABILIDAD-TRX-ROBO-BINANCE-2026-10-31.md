# Informe de trazabilidad: los TRX del robo a Binance, desde `TSpe5HC3…`

**Qué es.** El rastreo, billetera por billetera y con el hash de cada salto, del TRX que el ladrón del robo a Binance (29-oct-2026) aparcó en `TSpe5HC3PRD2svJcr1YoGszhHk2mtkyZ8A`: de dónde llegó, adónde se repartió, por qué billeteras ha pasado y dónde está o dónde ha terminado. Completa el [informe completo del 30-oct](INFORME-COMPLETO-ROBO-BINANCE-2026-10-30.md) y actualiza lo que ese informe decía sobre el destino del dinero (apartado 8).

**Foto.** Todo el recorrido está **congelado a las 22:40 UTC del 30-oct (23:40 en Madrid)**, antes de que empezara la primera lectura. Cada billetera se leyó en vivo después, entre las 23:42 del 30-oct y las 04:30 del 31-oct (Madrid), pero **solo se cuentan movimientos hasta la hora de la foto**. Así todas las billeteras están a la misma hora. Lo que pasó después está en el apartado 9. Horas en UTC salvo que se diga otra cosa. El TRX se valora a 0,352 $ y el USDT a 1 $.

**Fuentes.** TronGrid y TronScan en vivo. Los datos en bruto, los ficheros de cada paso y el CSV con todas las aristas finales están en `research/binance-0x5227-2026-10-30/tron/` (apartado 10).

---

## 1. Resumen

- **De dónde viene el TRX.** Los **638,2 M TRX** de `TSpe5HC3…` salen de **234 M USDT** que el ladrón cambió en SunSwap. Esos USDT salen a su vez de los **612,7 M USDT** que Binance-Hot 7 mandó a `TG5iBMQ…` el 29-oct (apartado 2). La cuenta de la billetera cuadra: entran 638.200.929 TRX y salen 638.200.900.
- **Adónde fue desde `TSpe5HC3…`.** A las 10:15–10:20 UTC del 30-oct los repartió en cinco envíos: **tres depósitos de 120 M TRX, uno de 158,2 M y uno de 120 M a `TAk1xJNW…`**, que lo pasó a la billetera de reparto `TRBdWq…` (apartado 3).
- **Estado a la hora de la foto:** el 76 % de ese TRX, **518,2 M TRX (182,4 M$)**, seguía **quieto en los cuatro depósitos**. `TRBdWq…` había recibido 166,4 M TRX (120 M de esta ruta y 46,4 M directos del robo) y había repartido en 379 envíos **50,8 M$** a 122 billeteras (apartado 4).
- **Dónde acaban esos 50,8 M$, con la foto de las 23:40:**

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

- **Hallazgos principales.**
  - **Ninguna billetera de paso envía directamente a una casa de cambio con nombre.** Antes pasa por un nodo de servicio.
  - **Dos puntos concentran la mitad del dinero:** `TM8uyBjRKz…` recibe el resultado de cientos de cambios hechos desde 371 billeteras distintas (12,2 M$), y un **grupo de cinco billeteras creadas el 11-oct en menos de dos minutos** recibe otros 11,8 M$ (apartado 5).
  - **El rastreo no tiene tope de saltos:** llegó a **18 saltos** y 1.347 billeteras.
- **Del grupo y de `TM8uyBjRKz…` a las casas de cambio (tramo 2, estimación).** De los 24 M$ que entran en esos seis puntos, **unos 4,2 M$ llegan a casas de cambio** (Bybit 2,2; OKX 1,0; Gate 0,7; KuCoin, Bitget, MXC y Kraken 0,25), y **unos 11,4 M$ pasan a `TZG47zhb8k…`**, un nodo de 317.000 operaciones donde el rastreo ya no puede seguir con rigor (apartado 7).
- **Novedad posterior a la foto.** A las 01:01 UTC del 31-oct el depósito `TL2F4Ghn…` mandó sus **120 M TRX a `TRBdWq…`**. Quedan **398,2 M TRX** sin tocar en tres depósitos (apartado 9). *Actualización del 31-oct a mediodía: `TCBAz7it…` también se vació (07:58 UTC) y quedan **278,2 M TRX en dos depósitos**; ver la [historia consolidada](HISTORIA-TRON-TRAS-EL-ROBO-BINANCE-2026-10-31.md).*

---

## 2. Cadena de custodia hasta `TSpe5HC3…`

| Hora (UTC, 29-oct) | De → a | Qué | Hash |
|---|---|---|---|
| 20:20:00 | Binance-Hot 7 → `TG5iBMQ…` | 10.000 TRX (prueba) | `6f983ab745fbea298ec6376054fb16155f3142ec0d9f3fec4c053220cafc9644` |
| 20:21:12 | Binance-Hot 7 → `TG5iBMQ…` | 46.384.098 TRX | `72f5fbedbc4d6f70113e139312eef09fb28a5fefd49d321bc1e28b6cea5bab9c` |
| 20:22:45 | Binance-Hot 7 → `TG5iBMQ…` | 612.729.468 USDT | `4203af9ca1833d09c05666eafbd70d703a3811c0bdcf125106685ab75958253e` |
| 20:45:51 | `TG5iBMQ…` → `TPBkSj…` | 100.000.000 USDT | `fd8061aaa787ce89d707184dbfdd436a578c7840d674505067725de727c06222` |
| 20:56:09 | `TG5iBMQ…` → `TPBkSj…` | 200.000.000 USDT | `d40f96e23e95b7ace0ebacd3892f0a1f37555a64da69feedba73443dee4920ee` |
| 20:47 a 21:14 | `TPBkSj…` → SunSwap | 16 cambios, 234 M USDT por 638,19 M TRX | (ver informe del 30-oct) |
| 20:56:12 | `TPBkSj…` → `TSpe5HC3…` | 288.330.000 TRX | `4b329d4495bcdd8df40117cd478f13c5027988147c7deb9add5e4aee3b8107c4` |
| 21:42:42 | `TPBkSj…` → `TSpe5HC3…` | 349.860.942 TRX | `fb5089f5ce2ae9be6f8e5e3f78470a5a8d694879ac68f6c8cfe3d81450fa6149` |
| 21:43:27 | `TCzBTk…` → `TSpe5HC3…` | 9.987 TRX | `f4d4e4c665c301159ba35210db65377908f764789480b5b2a2b371494b42245a` |

- Direcciones completas: `TG5iBMQPrDzJJAUM8GMVBf1hRaJ1wvzsGi`, `TPBkSjkCMn2ckrMuAP8n2J1jdjbw76bKN4`, `TCzBTkqn66yApqbYoPezaEQosM5DAd7Y62`, Binance-Hot 7 `TDqSquXBgUCLYvYC4XZgrprLK589dkhSCf`.
- Los 46,4 M TRX directos de Hot 7 no pasaron por `TSpe5HC3…`: `TG5iBMQ…` los mandó a `TRBdWq…` a las 00:06 del 30-oct (`6adfc066520a5880df18eebc61bf048d03e8d7a0fca23b04a6b36c9723892736`). Aun así son dinero del robo y se rastrean igual.
- Tether congeló después los **312,7 M USDT** que quedaron en `TG5iBMQ…` y los **66 M USDT** de `TCzBTk…`. Esos no entran en este rastreo.

---

## 3. De `TSpe5HC3…` a las cinco billeteras (30-oct)

`TSpe5HC3…` guardó el TRX toda la noche. Entre las 10:15 y las 10:20 UTC hizo **cinco envíos**, y desde entonces solo le quedan 37 TRX:

| Hora (UTC) | A | TRX | Hash | Estado |
|---|---|---|---|---|
| 10:15:21 | `TAk1xJNWuBYvJHLsUiBFLeuK6xvpQUFYP5` | 120.000.000 | `9d0904db84e640d37e9fee8badef0883043db77f5bf9c87ca76e220e0c35c487` | lo pasó a `TRBdWq…` a las 10:20:48 (`0ae2b5a4e1c8849d09e16db5a4dd9d90f7224c3b996a80ccad113bd5b81acd39`) |
| 10:18:09 | `TL2F4GhnaFVZBZPncHYjwfYZFW44NcfVwj` | 120.000.000 | `16585e9664a0e7e74d67caeba2ecdc9869ec9a84a287dc078a12d34ca078c0d1` | quieto hasta la 01:01 UTC del 31-oct; ver apartado 9 |
| 10:18:42 | `TCBAz7itvtX5CjBzVMPQdrbwQLN63ao1fk` | 120.000.000 | `037428516b343a326157ae75495ad3227b43e4a4cb0c8c3837e849d7a18d556e` | **quieto** |
| 10:19:24 | `TJajtPqDqUGh1Sr1j8ugHoSXBVpaFLLHKT` | 120.000.000 | `3db47d891cc211c300f9ba1aec264bfca8f9e32fbe220c411f30789a31ac8370` | **quieto** |
| 10:20:18 | `TKkH2vH6kyi2QKcMbqym53WMuvdd1xvw6K` | 158.200.900 | `aff887c4be7cd52eb8905899fc9596eaaf9c49dea59129519ce25d7c69762334` | **quieto** |

Total: 638.200.900 TRX. Las cuatro billeteras de depósito se crearon en el mismo minuto en que recibieron y **no han emitido una sola transacción propia** desde entonces.

---

## 4. La billetera de reparto `TRBdWq…`

`TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki` se creó a las 00:06 UTC del 30-oct. A la hora de la foto había recibido **166,4 M TRX**:

| Hora (UTC) | De | TRX | Hash |
|---|---|---|---|
| 30-oct 00:06:09 | `TG5iBMQ…` | 46.383.069 | `6adfc066520a5880df18eebc61bf048d03e8d7a0fca23b04a6b36c9723892736` |
| 30-oct 10:20:48 | `TAk1xJNW…` | 120.000.000 | `0ae2b5a4e1c8849d09e16db5a4dd9d90f7224c3b996a80ccad113bd5b81acd39` |

De esos 166,4 M, el **72 % procede de `TSpe5HC3…`** y el 28 % es TRX robado directamente de Hot 7. Para el rastreo es dinero del robo al 100 %.

Desde las 02:19 UTC hasta la hora de la foto, `TRBdWq…` hizo **379 envíos de 350 $ o más** (377 de 10.000 TRX o más), por **50,8 M$ en total**, a **122 billeteras distintas**. Cada billetera recibe trozos de 200.000 a 500.000 TRX.

---

## 5. El recorrido: dónde acaba el dinero

### 5.1 Cómo se ha medido

- **Sin tope de saltos, de billeteras ni de días.** Cada billetera que recibe 10.000 TRX (3.520 $) o más del robo se lee en vivo, y se siguen sus salidas hasta un destino final. Es el mismo umbral que usa el vigilante; lo que está por debajo se cuenta aparte como polvo.
- **Qué parte es del robo.** Cada billetera recibe dinero de varias fuentes. Se aplica la regla de la **mezcla proporcional**: si el 90 % de lo que recibe viene del robo, el 90 % de lo que envía se considera del robo. De las 1.356 billeteras con pureza calculada, 1.108 tienen el 95 % o más, 170 entre el 60 y el 95 %, 60 entre el 20 y el 60 % y 18 menos del 20 %: la dilución es pequeña en este tramo.
- **Los cambios no cortan la traza.** Cuando una billetera paga a un enrutador de intercambio, se decodifica la transacción para ver **adónde va el resultado**, que casi nunca vuelve a quien paga: va a otra billetera y se sigue desde ahí. Sin esto, una primera versión de este rastreo dejaba sin explicar el 35 % del dinero; con ello, el 11 %.
- **Dónde se detiene el rastreo.** En una casa de cambio con nombre, en un nodo de servicio (más de 5.000 operaciones), en un préstamo, en un puente o en una conversión a USDD. Lo que pasa por un nodo de servicio se mezcla con dinero ajeno y deja de poder atribuirse con rigor.

### 5.2 Tamaño y profundidad

**1.347 billeteras** leídas, repartidas en **18 niveles** (el nivel 1 es `TRBdWq…`; el rastreo no tiene tope y se paró solo porque ya no había más billeteras de paso que seguir):

| Nivel | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Billeteras | 1 | 122 | 299 | 480 | 230 | 74 | 48 | 33 | 16 | 12 | 10 | 7 | 6 | 4 | 2 | 1 | 1 | 1 |

### 5.3 Destinos finales (foto de las 23:40, sobre 50,8 M$ enviados por `TRBdWq…`)

| Tipo | Destino | Dinero del robo | Envíos | De cuántas billeteras |
|---|---|---|---|---|
| Nodo de servicio | `TM8uyBjRKzFtQdMC7tQLvKeeWieaFvXDyc` | 12,16 M$ | 1.069 | 371 |
| Nodo de servicio | grupo del 11-oct (cinco billeteras, apartado 6) | 11,85 M$ | 603 | 53 a 81 cada una |
| Nodo de servicio | `TZG47zhb8kcriWQ2rE719yHs1KqgzwMrvF` (317.000 operaciones) | 0,91 M$ | 125 | 81 |
| Nodo de servicio | otros cuatro nodos (`TKfz7Pu3…`, `TX5XiRXd…`, `TCPPRajg…`, `TMXawuHt…`) | 0,41 M$ | 67 | |
| Préstamo | JustLend (`CErc20Delegator`) | 4,75 M$ | 117 | 74 |
| Puente | USDT entre cadenas (`UsdtOFT`) | 2,35 M$ | 30 | 19 |
| Puente | Bridgers | 0,01 M$ | 2 | 1 |
| Conversión | USDD (`AuthGemJoin5`) | 0,33 M$ | 7 | 2 |
| Casa de cambio con nombre, directo | (ninguna) | 0 | 0 | 0 |

### 5.4 Dinero retenido

Quedan **11,2 M$** del robo retenidos en billeteras del recorrido a la hora de la foto, calculados con los movimientos (lo que entró menos lo que salió, ponderado por la pureza):

| Dónde | Billeteras | Dinero del robo |
|---|---|---|
| `TRBdWq…` (reparto) | 1 | 7,79 M$ |
| Otras con 100.000 a 1 M$ | 11 | 2,35 M$ |
| Otras con 10.000 a 100.000 $ | 23 | 0,91 M$ |
| Otras con menos de 10.000 $ | 1.063 | 0,12 M$ |

La mayor parte del dinero retenido fuera de `TRBdWq…` está en billeteras de un solo uso que se vacían en horas. Cuando releí a las 04:15 (Madrid) las once mayores, cinco estaban vacías, cinco seguían con 250.000 a 540.000 TRX y una con 77.000 USDT.

### 5.5 Lo que no cuadra

El **11 %** (5,5 M$) no se explica. Son cambios cuyo resultado no he podido decodificar, diferencias de precio entre el TRX y el USDT (el TRX se valora siempre a 0,352 $) y entradas ajenas pequeñas. No lo he desglosado más.

---

## 6. Los puntos de salida

### 6.1 `TM8uyBjRKzFtQdMC7tQLvKeeWieaFvXDyc`: el receptor de los cambios

Creada el 27-nov-2025, con **23.900 operaciones**. Recibe **el resultado de cientos de cambios** que las billeteras de paso hacen en el enrutador `BWSwapRouterV1` (los 1.069 pasan por él): en lugar de recibir ellas el USDT, lo dirigen a esta billetera. En la foto había recibido **12,16 M$ del robo en 1.069 envíos desde 371 billeteras distintas**.

Es un **punto de paso**: en las 7,5 horas anteriores a la lectura entró y salió el mismo importe (2,2 M USDT, casi todo del par de SunSwap) y **el 93 % de lo que sale va a `TZG47zhb8k…`**, el nodo de 317.000 operaciones. Saldo ahora: 35.000 USDT.

### 6.2 El grupo creado el 11-oct

Cinco billeteras creadas con menos de dos minutos de diferencia (23:35:09 a 23:36:33 UTC del 11-oct-2026) y entre 8.400 y 9.300 operaciones cada una: `THPaGKe6aZkUcNht24hcscZPLwtcJAbpun`, `TGSNahJvAdh86aR5pdcxiep1mBWSRK3HHL`, `TBAPnuwEht65McDbxDvDYs2XLRSSbYQMUM`, `TLKfB2goHRY1SykEpVbiGdsesACrkCxCeW` y `TH1YKH9MUuJtDmekPia4x9fZXAcpPrMv8B`.

- Reciben **11,85 M$ del robo** (entre 2,0 y 2,8 M$ cada una), de 53 a 81 billeteras de paso distintas.
- En una muestra de unas 8 horas, **el 64 % del USDT que entró en las cinco** venía de billeteras del recorrido. Por eso parecen **infraestructura de este blanqueo** y no un servicio de uso general. Es una hipótesis: no puedo decir quién las controla.
- Su salida son trozos de unos 100.000 USDT a billeteras nuevas, algunas de las cuales depositan en Bybit, OKX y Bitget (apartado 7).

### 6.3 `TZG47zhb8k…` y los otros nodos

`TZG47zhb8kcriWQ2rE719yHs1KqgzwMrvF`: creada el 23-dic-2025, **317.000 operaciones**, recibe 0,9 M$ del robo directamente más lo que le manda `TM8uyBjRKz…`. Es un nodo de uso intensivo, con mucho dinero ajeno. El resto de nodos (`TKfz7Pu3…` 5,6 M de operaciones, `TX5XiRXd…` 1,6 M, `TCPPRajg…` 615.000) son servicios grandes: reciben poco del robo.

### 6.4 Préstamos y puente

- **JustLend:** 4,75 M$ del robo depositados en el mercado de USDT por 74 billeteras. Es dinero que sigue en TRON, dentro de un contrato; puede retirarse otra vez.
- **Puente `UsdtOFT`:** 2,35 M$ del robo (3,27 M$ brutos) enviados a otra cadena. Este rastreo **no sigue** lo que sale de TRON. No he decodificado la cadena de destino.

---

## 7. Del grupo y de `TM8uyBjRKz…` a las casas de cambio (tramo 2)

**Cómo.** Mismo método, desde seis puntos de partida: las cinco billeteras del grupo del 11-oct y `TM8uyBjRKz…`. Leídas **2.898 billeteras en 18 niveles**, sin tope. La pureza de los puntos de partida, que sale de lo que ellos mismos reciben, es del **65 al 81 % en el grupo** y del **96 % en `TM8uyBjRKz…`**: el grupo mezcla ya mucho dinero ajeno, y lo que sale de él arrastra esa mezcla. Por eso **todas las cifras de este apartado son estimaciones**, no importes comprobados uno a uno como los del apartado 5.

**Qué referencia usar.** Los seis puntos de partida recibieron del recorrido unos **24 M$** (11,85 en el grupo y 12,16 en `TM8uyBjRKz…`). Esos 24 M$ son lo que este tramo reparte.

### 7.1 Llegadas a casas de cambio

**249 envíos a siete casas de cambio** por unos **12,5 M$ brutos**, de los que se estiman **4,15 M$ del robo**:

| Casa | Billetera caliente | Envíos | Bruto | Robo estimado | Remitentes |
|---|---|---|---|---|---|
| Bybit | `TU4vEruvZwLLkSfV9bNw12EJTPvNr7Pvaa` | 87 | 3,34 M$ | **2,21 M$** | 28 |
| OKX (Hot Wallet 8) | `TLaGjwhvA8XQYSxFAcAXy7Dvuue9eGYitv` | 120 | 4,89 M$ | **0,95 M$** | 77 |
| Gate | `TBA6CypYJizwA9XdC7Ubgc5F1bxrQ7SqPt` | 19 | 3,86 M$ | **0,74 M$** | 14 |
| KuCoin 4 | `TUpHuDkiCCmwaTZBHZvQdwWzGNm5t8J2b9` | 6 | 0,20 M$ | 0,14 M$ | 4 |
| Bitget 9 | `TJ7hhYhVhaxNx6BPyq7yFpqZrQULL3JSdb` | 9 | 0,13 M$ | 0,08 M$ | 7 |
| MXC | `TEPSrSYPDSQ7yXpMFPq91Fb1QEWpMkRGfn` | 6 | 0,06 M$ | 0,02 M$ | 5 |
| Kraken (Hot Wallet) | `TG2CMGxnTPgQ6V58kiKd7wbyN8ewtAmY76` | 2 | 0,02 M$ | 0,005 M$ | 2 |
| **Total** | | **249** | **12,5 M$** | **4,15 M$** | |

- **Pureza de los remitentes.** Ninguna casa recibe el dinero por billeteras con pureza alta (80 % o más): 2,65 M$ vienen por billeteras con pureza media (40 a 80 %) y 1,50 M$ por billeteras con pureza baja (menos del 40 %). La razón es que todo pasa antes por el grupo, que ya mezcla.
- **Remitentes más importantes por casa** (los que habría que enseñar a cada una; el CSV tiene todos):

| Casa | Billetera que envía | Envíos | Robo estimado | Pureza | Mayor envío (hash) |
|---|---|---|---|---|---|
| Bybit | `TXYiPCELFdqELhQ4vGhniwJeNqEjruZCKv` | 31 | 1,79 M$ | 0,73 | `ab0a3dcb1da4f0febb28413472874724ea030db28e8b91e338fb3641e973be61` |
| Bybit | `TFL9UDVKRt24TfPxREt1BqFLPiY4RV7rAD` | 18 | 0,16 M$ | 0,73 | `d59a6d69bfdb3d7e8ea5afa38b9379161b0b4360fc768beb56419e7f2990222f` |
| OKX | `TSSXn3hV89W3MXmevCte8nWmyWdh65V62D` | 3 | 0,41 M$ | 0,18 | `99b6933e5101e69fcc5547d026ada40b18a261aa086de55a5a698cd4e6f75d21` |
| OKX | `TE8UuFS41ofPaXGFU36LF8g3G6ZXv2c3MM` | 5 | 0,08 M$ | 0,72 | `1354e167e97a7c27d41bb6a474c7b94534646aa9afc332516d948e556c460ee5` |
| Gate | `TStvMPH7wv3Z6FR4YWxpkbf6iEn3WyRAvC` | 1 | 0,55 M$ | 0,16 | `940bb88e6166db496a3a2e33a99437b5cb6b539c9d1e501665e95d2e571677bd` |
| Gate | `TWwLaM2eFKCRzyPgajH2M6RmBxJY5VsGUe` | 6 | 0,15 M$ | 0,74 | `aeb9e749372f5acfe7d92fd82730199af6d6874b71440ab3705616452c508721` |
| KuCoin 4 | `TBDzipuLEW8Rt6AN5U7H1pVApczv9KGEWX` | 3 | 0,10 M$ | 0,71 | `9fe7a8b336990c4e41fc57e57f307cbe0a09af6b9b34e8a33e80aba97eded1eb` |
| Bitget 9 | `TJeJf1R4EUxySj2cX89okY4tECUHFynoqU` | 3 | 0,07 M$ | 0,70 | `1c5d69cb265a461978bcca21fe7d5e7bb1e87793ecee930e7d2151ef8ef0a769` |

- **Qué son esas billeteras.** Billeteras de un solo uso o de poca actividad que depositan en la casa: casi con seguridad **direcciones de depósito** de clientes de cada casa. Las que llevan pureza del 70 al 75 % están a **dos o tres saltos del grupo**; las de pureza del 16 al 19 % han pasado además por otros nodos mezcladores.
- **Una cautela sobre las cifras de Gate y OKX.** El mayor envío a Gate (3,35 M USDT desde `TStvMPH7wv…`) y el mayor a OKX (900.000 USDT desde `TSSXn3hV89…`) llevan una pureza de solo el 16 al 18 %: son grandes envíos de un nodo mezclador, y solo esa fracción se imputa al robo.

### 7.2 Los otros destinos del tramo 2

| Tipo | Destino | Robo estimado |
|---|---|---|
| Nodo de servicio | `TZG47zhb8kcriWQ2rE719yHs1KqgzwMrvF` (317.000 operaciones) | **11,44 M$** |
| Nodo de servicio | `TLQh52eDXwkHyWLQLmQzSoW4shogGKwjow` (55.800 operaciones) | 3,44 M$ |
| Nodo de servicio | `TWhDfwC8QE6pQyiYy248dNor3uphPEw5M2` (1,8 M de operaciones) | 0,96 M$ |
| Nodo de servicio | `TQ5SdemHpBawdb31DiwcwSVMQB7iduXgSu` (345.000 operaciones) | 0,79 M$ |
| Nodo de servicio | otros 480 nodos | 6,2 M$ |
| Puente | `UsdtOFT` (USDT a otras cadenas) | 1,60 M$ |
| Puente | Rango y Bridgers | 0,14 M$ |
| Conversión | USDD (`AuthGemJoin5`) | 0,22 M$ |
| Préstamo | JustLend | 0,06 M$ |

- **`TZG47zhb8k…` es el mayor destino final de todo el rastreo, y el rastreo se detiene ahí.** Recibe 11,4 M$ en 1.050 envíos, **el 96 % desde `TM8uyBjRKz…`** (que le manda el 93 % de lo que él recibe). Lo que haga después se mezcla con el tráfico de un nodo de uso intensivo, y no puedo atribuirlo al robo con rigor.
- `TWhDfwC8QE6pQyiYy248dNor3uphPEw5M2` es la misma billetera que el artículo sobre las cuentas Vaneck y Sun cita como proveedora de TRON Inc. según Protos. Aquí aparece como un nodo grande por el que pasa algo del recorrido (tres envíos de dos billeteras). **No saco ninguna conclusión de ello.**

### 7.3 Lo que no cierro en cuentas

No doy un total de «dinero retenido» para el tramo 2. El rastreo llega a billeteras recientes y grandes que mezclan fondos ajenos: por ejemplo `TWdD4RqFJFZA4829bGnUbLBKU5FTykTWCa` tiene hoy 25 M$ con una pureza del 21 %, y atribuirle por ese 21 % un saldo "del robo" daría una cifra que no puedo defender. Las cifras de los apartados 5 y 7.1 sí lo son.

---

## 8. Qué cambia respecto al informe del 30-oct

1. **Un segundo punto de salida.** Aquel informe señalaba el grupo del 11-oct como el paso del blanqueo. Con el rastreo completo, `TM8uyBjRKz…` recibe un dinero comparable (12,2 M$ frente a 11,8 M$) y no se veía porque los cambios cortaban la traza.
2. **El ritmo del blanqueo es mayor de lo que dije.** Aquel informe lo estimaba en unos 0,5 M$ por hora midiendo solo lo que entraba en el grupo. Desde `TRBdWq…` salen **2,5 M$ por hora** (50,8 M$ entre las 02:19 y las 22:36 UTC) y a los nodos de servicio llegan del orden de **1,2 M$ por hora**.
3. **Los depósitos quietos son ahora 398,2 M TRX, no 518,2 M**, por el movimiento de la 01:01 (apartado 9).
4. **Lo que no cambia:** las cifras de la cadena de custodia, de lo congelado por Tether y de la billetera de reparto, y que **ninguna billetera de paso envía directamente a una casa de cambio**.

---

## 9. Novedades posteriores a la foto

- **31-oct, 01:01:15 UTC** (02:01 en Madrid; una versión anterior de este informe decía «Madrid» por error, detectado en la auditoría del mismo día): el depósito `TL2F4GhnaFVZBZPncHYjwfYZFW44NcfVwj` envió **120.000.000 TRX a `TRBdWq…`**: `bb05d43bfde6cb869448ad03bf06969e32cc7cd77252a78d41dd7f7c26dbf0b3`.
- **Saldos a las 04:15 (Madrid)**:

| Billetera | TRX |
|---|---|
| `TKkH2vH6…` depósito | 158.200.902 |
| `TCBAz7it…` depósito | 120.000.000 |
| `TJajtPqD…` depósito | 120.000.000 |
| **Tres depósitos quietos** | **398.200.902 (140 M$)** |
| `TL2F4Ghn…` depósito | 0 |
| `TRBdWq…` reparto | 93.014.675 |

- `TRBdWq…` sigue repartiendo. Todo lo posterior a la foto queda fuera de las cifras de arriba. **Repetir el rastreo** con las mismas herramientas actualiza las cifras: apartado 10.

---

## 10. Límites y cómo repetirlo

**Qué no se puede decir.**

- **Quién es el ladrón y quién controla los nodos de servicio.** El informe da direcciones, importes y hashes; la identidad de los clientes solo la conocen las casas de cambio.
- **Qué parte de lo que entra en un nodo de servicio es del robo y qué parte es de otros clientes.** Para el grupo del 11-oct, la pureza (65 a 81 %) sale de lo que recibe en la ventana del rastreo; para el resto de nodos no se ha medido.
- **Lo que sale de TRON por el puente.**
- **El 11 % sin explicar** (apartado 5.5).

**Lo que sí se verificó.** Los 24 hashes y las 37 direcciones completas del informe están comprobados uno a uno contra los datos en bruto guardados. En las billeteras alcanzadas por el rastreo **todas las lecturas fueron correctas**. En el caché quedan 81 lecturas que fallaron en pasadas anteriores; no forman parte del recorrido final.

**Cómo repetirlo.** Desde la carpeta `research/binance-0x5227-2026-10-30/`:

```
node traza.cjs            lee en vivo el recorrido desde TSpe5HC3… (reanudable)
node traza-analisis.cjs   calcula pureza, destinos finales y dinero retenido
node traza-cierre.cjs     cierra cuentas (cuánto queda sin explicar)
node traza-rutas.cjs      rutas principales con hash y CSV de todas las aristas finales
node traza-post.cjs       segundo tramo: desde el grupo del 11-oct y TM8uyBjRKz…
```

Ficheros principales en `research/binance-0x5227-2026-10-30/tron/`: `traza-resultado.json`, `traza-aristas-terminales.csv` (todas las aristas finales del tramo 1, con hash), `traza-post-aristas-terminales.csv` (las del tramo 2), `traza-rutas-principales.json` (rutas), `traza-cierre.json`, `traza-retenido.json`, `traza-post-casas-top.json` (remitentes a cada casa de cambio) y `traza-cache.json` / `traza-post-cache.json` (todas las lecturas).

---

## Anexo — Direcciones citadas

| Dirección | Papel |
|---|---|
| `TDqSquXBgUCLYvYC4XZgrprLK589dkhSCf` | Binance-Hot 7 (origen) |
| `TG5iBMQPrDzJJAUM8GMVBf1hRaJ1wvzsGi` | 1.ª billetera del ladrón |
| `TPBkSjkCMn2ckrMuAP8n2J1jdjbw76bKN4` | cambió 234 M USDT por TRX |
| `TCzBTkqn66yApqbYoPezaEQosM5DAd7Y62` | USDT congelados |
| `TSpe5HC3PRD2svJcr1YoGszhHk2mtkyZ8A` | aparcó 638,2 M TRX |
| `TAk1xJNWuBYvJHLsUiBFLeuK6xvpQUFYP5` | paso de 120 M TRX hacia el reparto |
| `TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki` | billetera de reparto |
| `TKkH2vH6kyi2QKcMbqym53WMuvdd1xvw6K`, `TCBAz7itvtX5CjBzVMPQdrbwQLN63ao1fk`, `TJajtPqDqUGh1Sr1j8ugHoSXBVpaFLLHKT` | depósitos quietos (398,2 M TRX) |
| `TL2F4GhnaFVZBZPncHYjwfYZFW44NcfVwj` | depósito que se movió a la 01:01 del 31-oct |
| `TM8uyBjRKzFtQdMC7tQLvKeeWieaFvXDyc` | receptor de los cambios (12,2 M$) |
| `THPaGKe6aZkUcNht24hcscZPLwtcJAbpun`, `TGSNahJvAdh86aR5pdcxiep1mBWSRK3HHL`, `TBAPnuwEht65McDbxDvDYs2XLRSSbYQMUM`, `TLKfB2goHRY1SykEpVbiGdsesACrkCxCeW`, `TH1YKH9MUuJtDmekPia4x9fZXAcpPrMv8B` | grupo creado el 11-oct (11,85 M$) |
| `TZG47zhb8kcriWQ2rE719yHs1KqgzwMrvF` | nodo de 317.000 operaciones |
