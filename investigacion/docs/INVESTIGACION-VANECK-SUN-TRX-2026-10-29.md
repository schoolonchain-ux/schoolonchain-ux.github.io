# Investigación: la cuenta «Vaneck» de TRON, la segunda cuenta (TT2T17…) y Justin Sun

Fecha de la investigación: **29-oct-2026** (lecturas en vivo entre las 13:10 y las 13:30, hora de Madrid).
Pregunta del propietario: ¿están relacionadas estas dos cuentas entre sí, con HTX, con VanEck o con Binance? ¿Puede ser de Justin Sun o de otra institución?

Fuentes usadas, en este orden:

1. Bóvedas de EquipoIA (lectura con ChainScope / mismos almacenes): `tether-blacklist/state/grafo.sqlite` (aristas y stake), `etiquetas.sqlite`, `direcciones.sqlite`, `desbloqueos-lista.json` (10.000 mayores cuentas con sus etiquetas de TronScan), `chainscope/data/staking-snapshot.json`.
2. TronGrid en vivo (con la clave del propietario): las tres transacciones directas verificadas una a una por su hash; estado actual de las dos cuentas; salidas de 14 billeteras intermedias.
3. TronScan en vivo (API con clave): etiquetas públicas de 55 direcciones.
4. Fuentes públicas de terceros (prensa y analistas), citadas abajo. Ninguna es prueba legal.

Evidencia guardada en `research/tron-vaneck-sun/` (etiquetas leídas, aristas del grafo, informe previo). Informe previo del sistema (ui-fcaec8ac, 29-oct) en el mismo directorio: concluía «no se encontró vínculo»; **esta investigación lo corrige**.

---

## 1. Conclusión en cuatro líneas

1. **Las dos cuentas SÍ están relacionadas, y de forma directa.** La cuenta etiquetada «Vaneck» (TCGVFG…DHRL8) envió a la segunda (TT2T17…kU9N) **802.708.681 TRX el 10-06-2023** y **139.586.000 TRX el 14-04-2025**: 942,3 millones de TRX en total (unos 312 M$ al precio de hoy). Verificado en TronGrid por hash. El informe previo no lo vio porque descartó la segunda cuenta «por ser demasiado grande para leerla entera».
2. **La segunda cuenta está atribuida públicamente a Justin Sun** por Wu Blockchain, EmberCN, Arkham («Justin Sun?») y Protos. Sun **negó** controlarla (Bloomberg, citado por Protos). No es una prueba: es la atribución más repetida.
3. **La cuenta «Vaneck» se financió en 2021 desde otra cuenta también atribuida a Justin Sun** (TPyjyZ…gNan5: OKLink la etiqueta «Justin Sun»; Protos dice que guarda el 56 % del USDD 1.0 y que se fundó desde Poloniex y HTX). Y en 2025 envió 21 M TRX a la **multifirma 2 de USDD** (TPcnRb…PpdGb). Es decir: el dinero entra desde el entorno de Sun y sale hacia el entorno de Sun.
4. **Hipótesis principal: la etiqueta «Vaneck» de TronScan es engañosa.** El ETN de VanEck sobre TRON existe (lanzado el 13-09-2021), pero tiene **9,15 millones de CHF** de patrimonio (28-10-2026), guarda el TRX «en frío en un custodio regulado» y declara **no prestarlo**. Esta cuenta llegó a tener ~1.000 M TRX en 2021, hace stake y lo mueve a una cuenta atribuida a Sun. **No encaja con el ETN.** Encaja con una tesorería del entorno TRON/Sun. No he encontrado quién puso la etiqueta ni cuándo.

Lo que **no** se puede afirmar: que las cuentas sean de Justin Sun en persona (él lo niega), que sean de VanEck (nada lo apoya salvo la etiqueta), ni que vayan a vender.

---

## 2. Las dos cuentas hoy (TronGrid, 29-oct-2026)

| | «Vaneck» TCGVFGDd62LSrfZEaz3M3fYifWWdSDHRL8 | Segunda TT2T17KZhoDu47i2E4FWxfG79zdkEWkU9N |
|---|---|---|
| Etiqueta TronScan | «Vaneck» (publicTag, confirmado hoy con clave) | ninguna |
| Creada | 05-09-2021 (8 días antes de que saliera el ETN de VanEck) | 01-05-2023 |
| Activada por | TPyjyZ…gNan5 (100 TRX; cuenta atribuida a Sun) | Binance-Hot 6 (1.999 TRX + 999 USDT el mismo minuto) |
| Transacciones | 948 | 5.230 |
| TRX libres | 7.523.698 | 586.523.656 |
| TRX saliendo del stake | **132.703.297, disponibles el 31-10-2026** | **305.723.740, disponibles el 03-11-2026** |
| TRX aún delegados a terceros | 0 | 706.517.987 (energía) |
| Otros saldos | 19,5 SUNDOG y tokens basura (airdrops) | 662,9 M sTRX (JustLend), 70,9 M USDD, 21.515 USDT, BTT, JST, WIN, NFT, HTX… |
| Recompensas sin cobrar | 0 | 14,6 M TRX |

Las dos salidas del stake suman **438,4 M TRX ≈ 145 M$** (TRX a 0,331 $, CoinGecko 29-oct). Desbloquear no es vender.

---

## 3. De dónde vino el dinero de «Vaneck» y a dónde fue

Todo del grafo guardado (fuente TronGrid), hashes en `research/tron-vaneck-sun/grafo-aristas-stake-2026-10-29.jsonl`.

**Entradas (2021):**

| Fecha | Desde | TRX | Quién es |
|---|---|---:|---|
| 05-09-2021 | TPyjyZfsYaXStgz2NmAraF1uZcMtkgNan5 | 300.000.000 | **Atribuida a Justin Sun** (OKLink); 1.876 M TRX hoy, puesto 6-7 de la red; 56 % del USDD 1.0 (Protos) |
| 02-10-2021 | TUTtLtGjXWqkTAow7jj7oMhTGLe9XB9YMA | 269.000.000 | Sin etiqueta; creada 15-05-2020; 9,3 M TRX hoy; top-100 de SUN |
| 02-11-2021 | TPyjyZ…gNan5 | 198.525.408 | ídem Sun |
| 06-12-2021 | TPyjyZ…gNan5 | 250.000.000 | ídem Sun |

Devolvió 26,7 M TRX a TPyjyZ… entre nov y dic de 2021. Entradas netas: **~990 M TRX**.

**Salidas grandes:**

| Fecha | Hacia | Cantidad | Quién es | Hash |
|---|---|---:|---|---|
| 10-06-2023 | TT2T17…kU9N | 95.016.954.148 NFT (APENFT) | la segunda cuenta | 92b00c02… |
| **10-06-2023** | **TT2T17…kU9N** | **802.708.681 TRX** | **la segunda cuenta** | dfbb6ced… |
| 06-03-2025 | TPcnRbpuB89eKKkfH2E7iJooAqeEZPpdGb | 21.000.000 TRX | **Multifirma 2 de USDD** (propuesta de Curve); 1.641 M TRX; puesto 13 | 098342f3… |
| **14-04-2025** | **TT2T17…kU9N** | **139.586.000 TRX** | **la segunda cuenta** | 8b0547b5… |
| 17-10-2026 | — | descongela 132.703.297 TRX | disponibles el 31-10 | 217de24e… |

Las dos transferencias de TRX a la segunda cuenta las verifiqué hoy en TronGrid por hash: tipo TransferContract, resultado SUCCESS, importes exactos, el emisor es la cuenta «Vaneck» y el receptor es TT2T17.

**Lo que NO tiene esta cuenta:** ni una sola transferencia con una casa de cambio, ni USDT, ni nada que parezca un custodio: su historial son los movimientos de arriba, airdrops de APENFT (2021-2022) y decenas de tokens basura que le mandan a todas las cuentas grandes.

---

## 4. La segunda cuenta: con quién trata

**Entradas grandes de TRX / estables** (grafo + TronGrid):

| Fecha | Desde | Cantidad | Etiqueta |
|---|---|---:|---|
| 01-05-2023 | TJDENsfB…JhCe | 1.999 TRX + 999 USDT | Binance-Hot 6 (activación de la cuenta) |
| 01-05-2023 | TNXoiAJ3…c32G | 499.999 USDT, luego 2,9 billones de BTT | Binance-Hot 4 |
| 03-05-2023 | TV6MuMXf…iuSi | 230 M TUSD (5 envíos) + 200 M TRX (mayo y sept.) | Binance-Hot 2 |
| 10-06-2023 | TCGVFG…DHRL8 | 802,7 M TRX | **«Vaneck»** |
| 14-06-2023 | TNCmcTdy…5Not | 300.000 M NFT | Poloniex |
| 15-10-2023 | TU1ZA8T2…xZoK | 400 M TRX (4 × 100 M) | HTX 3 |
| 14-04-2025 | TCGVFG…DHRL8 | 139,6 M TRX | **«Vaneck»** |
| 25-01-2026 | TXFBqBbq…JodJ | NFT, BTT, HTX | Bitfinex |
| 08-05-2026 | TAuUCiH4…XTmX | **500 M TRX** | **HTX-Cold 6** |

**A quién delegaba energía** (stake delegado a terceros; retirado el 29-09 y el 20-10-2026, 555,6 M TRX):

Binance-Hot 3, 5, 6, 7, 8, 9, 10 y 11, Binance 2, OKX Hot Wallet 8 y Bybit. Es el patrón de un **proveedor de energía** a casas de cambio (las casas alquilan energía para pagar las comisiones de USDT). Que preste a Binance, OKX y Bybit a la vez descarta que sea la tesorería de una sola casa de cambio.

**Por dónde saca el TRX** (siempre igual: crea una billetera nueva, le manda el TRX y esa billetera lo reenvía el mismo día):

| Fecha | Billetera puente (creada ese día) | TRX | Destino final (leído en vivo en TronGrid) |
|---|---|---:|---|
| 09-11-2023 | THZ1gL92… | 50 M | HTX 3 |
| 27-10-2025 | TNfVaLSy… (creada 2024) | 150 M | **Binance-Hot 7** (esa billetera envió 500 M a Binance-Hot 7 ese día) |
| 30-10-2025 | TGStnGYq… | 100 M | **HTX 4** |
| 12-11-2025 | TB1LbnUG… | 64 M | **HTX 4** |
| 16-11-2025 | TELL9LfB… | 134,2 M | **HTX 4** |
| 21-03-2026 | TM5h24Au… | 200 M | **HTX 4** |
| 07-05-2026 | TBRoa9xa… | 180 M | **HTX 4** |
| 07-05-2026 | TEgMTsmb… | 100 M | **HTX 4** |
| 01-10-2026 | TUVw5u9y… | 100 M | **TWhDfwC8…5M2** (ver abajo) |
| 17-10-2026 | TKK4M7HN… | 150 M | TQWBKLpM… (billetera de barrido creada 18-06-2026; reenvía a TGHojUpU…, creada 15-09-2026; sin etiqueta) |
| 20-10-2026 | TFaboiG8… | 100 M | **TWhDfwC8…5M2** |

Total a **HTX 4** entre oct-2025 y may-2026: **778,2 M TRX**. HTX 4 estaba en la prueba de reservas de HTX y, según Protos (18-sep-2026), fue la billetera que compraba TRX a diario para **TRON Inc.** (la empresa cotizada en Nasdaq con tesorería en TRX) hasta el 29-05, tres días después de que el Reino Unido sancionara a Huobi Global S.A.

**TWhDfwC8QE6pQyiYy248dNor3uphPEw5M2** (sin etiqueta; creada 28-11-2023; 1,25 millones de transacciones; mueve USDT sin parar): según el mismo artículo de Protos, es la billetera **de la que TRON Inc. recibe ahora su TRX**, y «la mayor parte de su TRX viene de Binance, pero también ha recibido de direcciones afiliadas a HTX». Es decir: **200 M TRX recién salidos del stake de la segunda cuenta (1 y 20 de octubre de 2026) han ido a la billetera que abastece la tesorería de TRON Inc.** No he podido comprobar si ese TRX concreto llegó a TRON Inc. (TEySEZLJf6rs2mCujGpDEsgoMVWKLAk9mT); eso requiere seguir esa billetera, que hace miles de movimientos al día.

---

## 5. Qué dicen terceros de cada dirección (no son pruebas)

- **TT2T17KZhoDu47i2E4FWxfG79zdkEWkU9N**
  - Wu Blockchain (ago-2023): «la dirección marcada como Justin Sun retira 200 M USDT de JustLend y los deposita en Huobi». https://x.com/WuBlockchain/status/1688750003240767489
  - EmberCN / 余烬 (abr-2024): la lista entre las direcciones de Sun en Tron junto a TWGHNcdt… y TA6bim7L…. https://x.com/EmberCN/status/1782748132620841383
  - Protos, «Where is Justin Sun's money?»: «comúnmente asociada a Sun, pero él ha negado controlarla» (cita a Bloomberg); interactúa con Huobi y Poloniex; gran usuaria de TUSD. https://protos.com/justin-sun-holdings/
  - Arkham la etiqueta «Justin Sun?»; crypto.news: acuñó 62 M TUSD el 21-07-2023; DailyCoin: «centro de distribución» de fondos del Black Hole, Tether y dos ballenas.
- **TPyjyZfsYaXStgz2NmAraF1uZcMtkgNan5** (la que financió a «Vaneck»)
  - OKLink: etiqueta «Justin Sun». https://www.oklink.com/tron/address/TPyjyZfsYaXStgz2NmAraF1uZcMtkgNan5
  - Protos (25-sep-2025): ~56 % del USDD 1.0; «fundada desde una dirección etiquetada Poloniex, casa de Sun; después recibió fondos de HTX». https://protos.com/justin-sun-usdd-problems/
  - CCN: la mayor tenedora de JST (~5,5 %).
- **TPcnRbpuB89eKKkfH2E7iJooAqeEZPpdGb**: «multisig2» de USDD en la propuesta de Curve (5 de 7 firmas). https://gov.curve.finance/t/proposal-add-usdd-3crv-pool-to-the-gauge-controller/3891
- **TWhDfwC8QE6pQyiYy248dNor3uphPEw5M2**: proveedor actual de TRX de TRON Inc. (Protos, 18-sep-2026). https://protos.com/tron-inc-s-trx-came-from-htx-after-uk-sanctions/
- **VanEck TRON ETN (VTRX, ISIN DE000A3GSUE1)**: lanzado el 13-09-2021; «respaldado por TRX en almacenamiento en frío en un custodio regulado»; «sin préstamo de TRON, sin derivados»; patrimonio 9,15 M CHF (extraETF, 28-10-2026). https://www.vaneck.com/de/en/vtrx/ · https://extraetf.com/ch/etf-profile/DE000A3GSUE1

---

## 6. Hipótesis (ordenadas de más a menos probable) y qué las apoya o las tumba

**H1 — Las dos cuentas pertenecen al mismo entorno: la tesorería de Justin Sun / TRON DAO / USDD.** (La más probable.)
- A favor: «Vaneck» nació con dinero de una cuenta atribuida a Sun (748 M TRX), le devolvió el pico, y 2 años después pasó el 80 % a otra cuenta atribuida a Sun; también pagó 21 M a la multifirma de USDD. La segunda cuenta vive en el ecosistema Sun: sTRX y jUSDT/jTUSD de JustLend, USDD, TUSD acuñado, HTX, Poloniex, y saca el TRX por HTX. Las fechas de desbloqueo (31-10 y 03-11) van seguidas, como una sola operación en dos partes.
- En contra: Sun niega la segunda cuenta; nadie ha vinculado públicamente la cuenta «Vaneck» a Sun; el entorno Sun es grande (TRON DAO, HTX, Poloniex, JustLend, TRON Inc.) y «mismo entorno» no es «misma persona».

**H2 — La etiqueta «Vaneck» es un error o una etiqueta heredada.**
- A favor: tamaño (990 M TRX en 2021 frente a un ETN que hoy vale 9 M CHF ≈ 28 M TRX), comportamiento (stake, airdrops, transferencia a una cuenta privada) y la propia declaración del ETN (TRX en frío, sin préstamo). Las etiquetas de TronScan las pone TronScan a partir de envíos y no publica su origen.
- En contra: la cuenta se creó 8 días antes del lanzamiento del ETN. Podría ser una cuenta abierta para la creación inicial del producto (un participante autorizado que compró TRX al emisor de TRON) y que después se quedó con ese nombre. Aun así, el TRX de un ETN físico no debería acabar en una cuenta privada.

**H3 — Es un proveedor de energía / creador de mercado independiente que trabaja para HTX, Binance, OKX y Bybit.**
- A favor: delega energía a 11 billeteras calientes de 4 casas de cambio; saca el TRX hacia casas de cambio.
- En contra: nadie independiente recibe 800 M TRX de la cuenta que financió Sun, 500 M de la cámara fría de HTX y 400 M de HTX 3 sin dejar rastro de una compra. Un proveedor independiente compra TRX; aquí el TRX **se lo dan**.

**H4 — Es de otra institución (fondo, custodio) sin relación con Sun.** La menos probable: todas las entradas grandes vienen de Sun/HTX/Binance y las salidas van a HTX y a la billetera que alimenta a TRON Inc.

---

## 7. Qué significa para los próximos días

- El 31-10 quedan libres 132,7 M TRX en «Vaneck» y el 03-11, 305,7 M en la segunda. Si siguen el patrón de 2025-2026, saldrán por una billetera nueva hacia **HTX 4** o hacia **TWhDfwC8…** (la que abastece a TRON Inc.). Ninguna de las dos rutas significa venta en mercado: puede ser recolocación, préstamo o compra para la tesorería de TRON Inc.
- Vigilancia barata: las dos cuentas ya están en el grafo; con `/desbloqueos` y el visor de ChainScope se ve el momento exacto del `WithdrawExpireUnfreeze` y el primer salto.

## 8. Qué no he hecho y por qué

- No he seguido más allá del segundo salto en TWhDfwC8… ni en TGHojUpU… (miles de transacciones diarias; requiere una lectura paginada aparte).
- No he consultado Arkham ni Nansen (de pago); las atribuciones a Sun son las que publican medios y analistas.
- No he conseguido el precio histórico del TRX de junio de 2023 y abril de 2025 (la bóveda solo guarda un año y CoinGecko no lo da sin plan de pago): las cifras en dólares son al precio de hoy.
- No he escrito nada en los registros de los bots ni en el cuaderno de ChainScope.

## 9. Corrección a documentos anteriores

- `docs/DISTRIBUCION-TRX.md` (21-oct) contaba 140 M TRX como «Fondo / gestora con nombre: VanEck». Con lo de arriba, esa fila debe leerse como «cuenta etiquetada "Vaneck" por TronScan, probablemente del entorno TRON/Sun»; se añade una nota allí.
- El informe ui-fcaec8ac (29-oct) decía «no se encontró ningún vínculo»: había 3 transferencias directas en el propio grafo. Lección para `/cluster`: cuando una contraparte se descarta «por tamaño», las aristas directas ya leídas deben contarse igual.


## Anexos añadidos el 29-oct (tarde)

- Directorio de direcciones completas con enlace a TronScan: `docs/articulos/DIRECTORIO-DIRECCIONES-TRON-2026-10-29.md`.
- Citas de medios y analistas: `docs/articulos/CITAS-MEDIOS-2026-10-29.md`.
- 15 capturas de TronScan (cuentas y transacciones): `research/tron-vaneck-sun/capturas/`.
- Precios históricos (bóveda, serie diaria de Binance): 802,7 M TRX del 10-06-2023 = 57,8 M$ de entonces; 139,6 M del 14-04-2025 = 35,6 M$; las entradas de 2021 a «Vaneck» = 96,9 M$; los 500 M de HTX-Cold 6 (08-05-2026) = 174,5 M$.


## Corrección del 29-oct (tarde): porcentajes y tamaño del ETN

- Las dos cuentas (438,4 M TRX) son el **70,8 %** de los 619,1 M TRX con fecha de liberación en los 14 días siguientes a la instantánea de ChainScope del 27-10-2026 (13:04 UTC); con la tercera (32 M), el **76,0 %** (`concentracion3` = 0,7559 en `chainscope/data/staking-snapshot.json`). El 78 % del informe previo (ui-fcaec8ac) usaba otro corte (606,8 M). En la primera versión del artículo y del hilo se atribuyó por error el 78 % a las dos cuentas solas; corregido.
- Patrimonio del ETN de VanEck: 9,15 M CHF (extraETF, 28-10-2026) = 9,92 M € (extraETF.de) ≈ 11,0 M$ (1 CHF = 1,204 $, Frankfurter/BCE 28-10-2026) ≈ **33 M TRX** a 0,33 $. La primera versión decía «unos 28 M TRX»; corregido. La cuenta «Vaneck» recibió en 2021 ~990 M TRX (30 veces el producto entero de hoy) y tiene 140 M (4 veces).

## Vigilante de salidas (añadido el 29-oct por la noche)

El propietario publicó el hilo de X y el artículo de Medium el 29-oct y pidió «un vigilante que compruebe las salidas y avise». Está en `tron-salidas-watch/` (README allí): cada 10 minutos (tarea de Windows «EquipoIA - Vigilante salidas TRX», oculta con `Oculto.vbs`) lee por TronGrid las dos cuentas, avisa por Telegram en el chat privado del bot de la blacklist de retiradas del TRX desbloqueado, descongelaciones, envíos y recepciones de 1 M o más (con el nombre del destino y su enlace a TronScan) y sigue hasta 10 días y dos saltos cada billetera nueva que reciba TRX, para decir si acaba en una casa de cambio. El 31-10 y el 03-11 manda un recordatorio por la mañana con lo pendiente de retirar. Lo que avise quedará en `tron-salidas-watch/state/eventos.jsonl` y servirá para cerrar la pregunta que el hilo deja abierta (tuit 10): por dónde salen los 438 M TRX.
