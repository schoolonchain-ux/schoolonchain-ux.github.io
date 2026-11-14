# JustLend: ¿cuánto dinero se puede recuperar de verdad? — informe de lectura (13-nov-2026)

Fecha de las lecturas: 13-nov-2026, a partir de las 18:29 UTC (bloque 87973572). Solo lectura de la cadena TRON (TronGrid, TronScan) y de dos fuentes de contraste (Binance, DefiLlama). No se ha enviado ninguna transacción ni se ha tocado ningún sistema vivo. Cada respuesta en bruto está guardada con fecha y huella en `raw/`; cada resultado, en `resultados/` (con su huella en el anexo).

**Origen del encargo:** investigar la liquidez real de JustLend para saber cuánto, y de qué token, se puede recuperar de los préstamos (los fondos depositados en el protocolo) y si la recuperación está comprometida; con ello, definir un panel o herramienta que lo muestre.

**Cómo he interpretado «recuperar»:** retirar de JustLend el dinero depositado («prestado» al protocolo) y poder convertirlo en algo útil (USDT). Si el encargo apuntaba a otra cosa (por ejemplo, la garantía de quien pidió un préstamo, o cuentas concretas de un caso), los datos y el panel sirven igual cambiando la lista de cuentas; dímelo y lo ajusto.

## Resumen en lenguaje llano

1. **Cómo funciona.** JustLend es un «banco» de TRON: depositas un token, te dan un justificante (jToken) y puedes retirarlo **mientras el contrato tenga ese dinero en caja**. Lo que está prestado a otros no puede salir hasta que lo devuelvan. Hay 24 mercados (uno por token; algunos antiguos, cerrados a nuevos depósitos pero con dinero dentro).
2. **La foto de la caja.** A los depositantes se les debe 3.419 M$; en caja hay 3.216 M$; solo 205,2 M$ (6,0 %) está prestado. Es decir, **casi todo el dinero está en el contrato**: el riesgo clásico de «el banco no tiene fondos» es pequeño. La excepción importante es el **USDT** (47,5 % prestado; solo el 52,6 % de lo que se debe a los depositantes está en caja).
3. **Pero «en caja» no es «dinero que puedas usar».** De esos 3.216 M$, 933,5 M$ son **«ETH»** y 450,6 M$ son **«BTC»**: tokens «ETH/BTC en TRON» (no los ETH/BTC de sus cadenas), creados por la cuenta que los emite. Si JustLend te devuelve ese token y quieres convertirlo en USDT vendiéndolo en SunSwap, **solo se obtienen ≈ 143,6 k$ (ETH) y ≈ 1,10 M$ (BTC)**, aunque la caja diga 933,5 M$ y 450,6 M$.
4. **Lo que se convierte en USDT en SunSwap.** Sumando la estimación de venta de cada token **por separado** (sección 5), de los 3.216 M$ de caja saldrían hasta unos **263,5 M$ (8,2 %)**, y de ellos 160,5 M$ ya son USDT. Es una suma de estimaciones independientes: TRX y sTRX comparten los mismos pools de TRX/USDT, así que sin ellos quedarían unos **181,6 M$ (5,6 %)**; una venta conjunta simulada daría un resultado entre ambas cifras (no se ha simulado). Hay además **salidas oficiales** que no pasan por el mercado: la PSM de USDD cambia USDD por USDT 1:1 sin comisión (hoy con 88,03 M$ de USDT dentro, compartidos con todos los poseedores de USDD) y sTRX se cambia por TRX en 14 días. Para el «ETH» y el «BTC» **no se ve ninguna salida oficial verificable en la cadena**.
5. **Concentración extrema.** Una sola cuenta tiene el 100 % del mercado de ETH ([`TCQQjfccKdMi4CnPAzmZW5TALH4HbwceVb`](https://tronscan.org/address/TCQQjfccKdMi4CnPAzmZW5TALH4HbwceVb)), otra el 76 % del de BTC y otra el 62 % del de TRX. En USDT, los 3 mayores depositantes reclaman 159,6 M$, casi toda la caja (160,5 M$): **si esos tres retiraran todo, el cuarto ya no podría salir entero**.
6. **Quien crea el token es quien lo deposita.** La cuenta [`TCQQjfccKdMi4CnPAzmZW5TALH4HbwceVb`](https://tronscan.org/address/TCQQjfccKdMi4CnPAzmZW5TALH4HbwceVb) **firmó ella misma** la creación de 536.001 «ETH» el 2-nov-2024 (14:35 y 14:38 UTC, función `issue`) y los depositó en JustLend (10.000 el 2-nov-2024 y 524.001 el 10-may-2025): es la única depositante de ese mercado. **Y el contrato del token «ETH» tiene como dueño (`owner()`) a esa misma cuenta**; el ABI publicado del token es de tipo Tether e incluye crear (`issue`), congelar direcciones (`addBlackList`), pausar (`pause`) y destruir saldos congelados (`destroyBlackFunds`) (sección 6.2). En BTC, según el índice de TronScan, las 114.000 unidades creadas desde 2020 las firmaron solo dos cuentas ([`TKkrTxXwGszshcrYSashxbyrvGbPmshUoK`](https://tronscan.org/address/TKkrTxXwGszshcrYSashxbyrvGbPmshUoK): 54.000; [`TAyZrEhSYUWZ8c5HgFEjSndKvvTp3CzkYa`](https://tronscan.org/address/TAyZrEhSYUWZ8c5HgFEjSndKvvTp3CzkYa): 60.000); el 5-jul-2022 la primera creó 20.000 BTC y ese mismo día el mayor depositante de jBTC recibió 20.000 BTC de esa cuenta y depositó 20.000 BTC en JustLend. **Esto no demuestra que no tengan respaldo real** (un emisor puede tener ETH/BTC en custodia fuera de TRON), pero la cadena de TRON no permite comprobarlo, y significa que esa «caja» no es liquidez de mercado.
7. **Quién manda y qué puede parar.** El dueño del Comptroller es un contrato Timelock ([`TRWNvb15NmfNKNLhQpxefFz7cNjrYjEw7x`](https://tronscan.org/address/TRWNvb15NmfNKNLhQpxefFz7cNjrYjEw7x)) con 48 horas mínimas de espera: así se anuncian los cambios que haga el dueño. **Pero no todo pasa por esa espera:** el «guardián de pausas» ([`TLntW9Z59LYY5KEi9cmwk3PKjQga828ird`](https://tronscan.org/address/TLntW9Z59LYY5KEi9cmwk3PKjQga828ird), una cuenta normal) y la cuenta que publica los precios ([`TBPtNVdgkB8QPRHAJeZok6D9pqsFdALv9w`](https://tronscan.org/address/TBPtNVdgkB8QPRHAJeZok6D9pqsFdALv9w), otra cuenta normal) actúan directamente. En la lista de funciones del Comptroller **no existe una pausa de retirada** (solo de depósitos, préstamos, traspasos de jTokens y liquidaciones); eso no cubre lo que haga el código de cada mercado ni el dueño de cada token (sección 6.2), que no he leído.
8. **Deudas: el eslabón a vigilar es USDD, no ETH/BTC.** Los 10 mayores depositantes no deben nada. La deuda se concentra en USDT (126,6 M$ en las cuentas leídas) y **92,65 M$ de ella está respaldada en ≥ 90 % por USDD**; el 57 % de la deuda leída está por encima del 90 % de su límite. El oráculo valora USDD exactamente igual que USDT, y lo publica una cuenta normal cada ≈ 30 minutos. La salida de USDD a USDT (PSM) tiene 88,03 M$. El «ETH/BTC» del emisor es hoy solo el 10 % de la garantía de los préstamos **actuales**; pero con los topes de préstamo de hoy se podrían pedir hasta ≈ 96,26 M$ más (55,18 M$ en USDT) y el mayor depositante de BTC tiene 258,2 M$ de poder de préstamo sin deuda (sección 8.7). Además, la deuda no explicada por las cuentas leídas es 37,52 M$ (18 %), de ella 18,08 M$ en USDT.
9. **Comprobaciones superadas.** La caja que declara cada mercado coincide con el saldo real del token en el contrato (24 de 24 en cada una de tres lecturas nuevas e independientes, bloques 87.975.537, 87.975.549, 87.975.561); los precios del oráculo coinciden con Binance; los totales por token coinciden con los que publica DefiLlama; y el propio contrato de JustLend (simulación, sin enviar nada) respondió «permitido» a 12 de 18 peticiones de retirada total de los mayores depositantes de los 6 mercados grandes; 5 las rechazó porque dejarían a esa cuenta en déficit (tienen deuda abierta) y 1 no dio respuesta (un contrato, no una persona).
10. **Revisión adversarial.** Un segundo revisor independiente (Codex, solo lectura, sin memoria, sobre un paquete aislado) intentó refutar este informe: 11 objeciones, **todas aceptadas al menos en parte y corregidas**, y 9 escenarios adversariales que se han recalculado con mis propios datos (sección 11). Lo más importante que cambió: la suma de «lo que se vende» ya no se presenta como mínimo seguro, el control de caja se repitió de verdad, el Timelock solo cubre los cambios del dueño, y el riesgo del «ETH/BTC» del emisor se cuenta también como capacidad de pedir préstamos, no solo como deuda actual.

## 1. Qué se mide: tres capas

«Recuperar» tiene tres capas y cada una puede fallar por separado. El panel que se propone al final las muestra por separado:

| Capa | Pregunta | De dónde sale la respuesta |
| --- | --- | --- |
| **1. Caja de JustLend** | ¿Tiene el contrato ahora mismo el token que quiero retirar? | Lectura del contrato (`getCash`), contrastada con el saldo real del token en el contrato |
| **2. Venta en el mercado** | Si lo retiro y quiero USDT, ¿cuánto pierdo vendiéndolo en SunSwap? | Motor del monitor de liquidez de SunSwap sobre el estado actual de los pools (el mismo ya validado contra los contratos) |
| **3. Salida oficial** | ¿Hay una vía del emisor (sin pasar por el mercado)? ¿Con qué límite o espera? | Contratos oficiales (PSM de USDD; plazo de sTRX); para ETH/BTC no hay nada verificable |

## 2. Foto de los 24 mercados

Datos en bruto: `resultados/01-mercados.json`; cálculo: `04-derivar.cjs`. Definiciones: **reclamo** = lo que el mercado debe a los depositantes (jTokens × tipo de cambio); **caja** = lo que el contrato tiene ahora (lo único retirable de golpe); **cobertura** = caja / reclamo (qué parte del dinero de los depositantes podría salir si todos fueran a la vez); **prestado** = parte del reclamo que está prestada. Precios: oráculo de JustLend (que da el precio en TRX; se pasó a dólares con el TRX/USD de Binance = 0,3132); se contrastó con Binance en la sección 9.

| Mercado (jToken) | Token | Estado | Caja | Reclamo de depositantes | Prestado | Cobertura |
| --- | --- | --- | --- | --- | --- | --- |
| [`TR7BUFRQeq1w5jAZf1FKx85SHuX6PfMqsV`](https://tronscan.org/address/TR7BUFRQeq1w5jAZf1FKx85SHuX6PfMqsV) | ETH | abierto | 933,5 M$ | 933,8 M$ | 0,0 % | 100,0 % |
| [`TJQ9rbVe9ei3nNtyGgBL22Fuu2xYjZaLAQ`](https://tronscan.org/address/TJQ9rbVe9ei3nNtyGgBL22Fuu2xYjZaLAQ) | sTRX | abierto | 740,0 M$ | 740,9 M$ | 0,1 % | 99,9 % |
| [`TE2RzoSV3wFK99w6J9UnnZ4vLfXYoxvRwP`](https://tronscan.org/address/TE2RzoSV3wFK99w6J9UnnZ4vLfXYoxvRwP) | TRX | abierto | 493,2 M$ | 545,0 M$ | 9,7 % | 90,5 % |
| [`TLeEu311Cbw63BcmMHDgDLu7fnk9fqGcqT`](https://tronscan.org/address/TLeEu311Cbw63BcmMHDgDLu7fnk9fqGcqT) | BTC | abierto | 450,6 M$ | 451,8 M$ | 0,3 % | 99,7 % |
| [`TKFRELGGoRgiayhwJTNNLqCNjFoLBh3Mnf`](https://tronscan.org/address/TKFRELGGoRgiayhwJTNNLqCNjFoLBh3Mnf) | USDD | abierto | 404,6 M$ | 404,6 M$ | 0,0 % | 100,0 % |
| [`TXJgMdjVX5dKiQaUi9QobwNxtSQaFqccvd`](https://tronscan.org/address/TXJgMdjVX5dKiQaUi9QobwNxtSQaFqccvd) | USDT | abierto | 160,5 M$ | 305,0 M$ | 47,5 % | 52,6 % |
| [`TWQhCXaWz4eHK4Kd1ErSDHjMFPoPc9czts`](https://tronscan.org/address/TWQhCXaWz4eHK4Kd1ErSDHjMFPoPc9czts) | JST | abierto | 13,07 M$ | 13,92 M$ | 7,4 % | 93,9 % |
| [`TVyvpmaVmz25z2GaXBDDjzLZi5iR5dBzGd`](https://tronscan.org/address/TVyvpmaVmz25z2GaXBDDjzLZi5iR5dBzGd) | WBTC | abierto | 6,13 M$ | 6,13 M$ | 0,0 % | 100,0 % |
| [`TMz7vmyqoq4WKDiztrZpjAZPnzE9XgXaK4`](https://tronscan.org/address/TMz7vmyqoq4WKDiztrZpjAZPnzE9XgXaK4) | U | abierto | 3,41 M$ | 5,05 M$ | 32,5 % | 67,5 % |
| [`TPXDpkg9e3eZzxqxAUyke9S4z4pGJBJw9e`](https://tronscan.org/address/TPXDpkg9e3eZzxqxAUyke9S4z4pGJBJw9e) | SUN | abierto | 4,29 M$ | 4,68 M$ | 10,9 % | 91,6 % |
| [`TSXv71Fy5XdL3Rh2QfBoUu3NAaM4sMif8R`](https://tronscan.org/address/TSXv71Fy5XdL3Rh2QfBoUu3NAaM4sMif8R) | TUSD | abierto | 1,19 M$ | 2,10 M$ | 45,2 % | 56,6 % |
| [`TRg6MnpsFXc82ymUPgf5qbj59ibxiEDWvv`](https://tronscan.org/address/TRg6MnpsFXc82ymUPgf5qbj59ibxiEDWvv) | WIN | abierto | 1,71 M$ | 1,68 M$ | 0,7 % | 100,0 % |
| [`TUaUHU9Dy8x5yNi1pKnFYqHWojot61Jfto`](https://tronscan.org/address/TUaUHU9Dy8x5yNi1pKnFYqHWojot61Jfto) | BTT | abierto | 1,13 M$ | 1,10 M$ | 2,4 % | 100,0 % |
| [`TDA1mWPyAjTRATMGA55UTswGAHhV2itEXR`](https://tronscan.org/address/TDA1mWPyAjTRATMGA55UTswGAHhV2itEXR) | HTX | abierto | 854,2 k$ | 861,8 k$ | 0,9 % | 99,1 % |
| [`TBEKggwqFkrc4KckQVR9BLucAmQugafEZf`](https://tronscan.org/address/TBEKggwqFkrc4KckQVR9BLucAmQugafEZf) | USD1 | abierto | 370,8 k$ | 657,8 k$ | 44,6 % | 56,4 % |
| [`TD5SdLw5scR6mXgyMK2xKrFJpauDjpKqrW`](https://tronscan.org/address/TD5SdLw5scR6mXgyMK2xKrFJpauDjpKqrW) | wstUSDT | abierto | 447,8 k$ | 616,7 k$ | 28,0 % | 72,6 % |
| [`TX7kybeP6UwTBRHLNPYmswFESHfyjm9bAS`](https://tronscan.org/address/TX7kybeP6UwTBRHLNPYmswFESHfyjm9bAS) | USDD (viejo) | solo salida | 363,5 k$ | 442,0 k$ | 35,6 % | 82,2 % |
| [`TFpPyDCKvNFgos3g3WVsAqMrdqhB81JXHE`](https://tronscan.org/address/TFpPyDCKvNFgos3g3WVsAqMrdqhB81JXHE) | NFT | abierto | 445,6 k$ | 423,2 k$ | 0,9 % | 100,0 % |
| [`TGBr8uh9jBVHJhhkwSJvQN2ZAKzVkxDmno`](https://tronscan.org/address/TGBr8uh9jBVHJhhkwSJvQN2ZAKzVkxDmno) | SUN (viejo) | solo salida | 217,5 k$ | 219,2 k$ | 0,9 % | 99,2 % |
| [`TWBxQMb6RD3qmkXUXpNwVCYbL8SHNreru6`](https://tronscan.org/address/TWBxQMb6RD3qmkXUXpNwVCYbL8SHNreru6) | ETH (viejo) | solo salida | 185,3 k$ | 185,2 k$ | 0,0 % | 100,0 % |
| [`TUY54PVeH6WCcYCd6ZXXoBDsHytN9V5PXt`](https://tronscan.org/address/TUY54PVeH6WCcYCd6ZXXoBDsHytN9V5PXt) | WBTT (viejo) | solo salida | 159,8 k$ | 180,7 k$ | 18,4 % | 88,4 % |
| [`TNSBA6KvSvMoTqQcEgpVK7VhHT3z7wifxy`](https://tronscan.org/address/TNSBA6KvSvMoTqQcEgpVK7VhHT3z7wifxy) | USDC (viejo) | solo salida | 189,1 k$ | 33,3 k$ | 2,1 % | 100,0 % |
| [`TL5x9MtSnDy537FXKx53yAaHRRNdg9TkkA`](https://tronscan.org/address/TL5x9MtSnDy537FXKx53yAaHRRNdg9TkkA) | USDJ (viejo) | solo salida | 29,3 k$ | 28,5 k$ | 244,2 % | 100,0 % |
| [`TLHASseQymmpGQdfAyNjkMXFTJh8nzR2x2`](https://tronscan.org/address/TLHASseQymmpGQdfAyNjkMXFTJh8nzR2x2) | BUSD (viejo) | solo salida | 218 $ | 158 $ | 0,0 % | 100,0 % |

«Solo salida» = cerrado a nuevos depósitos y préstamos (mercados antiguos: pausa de «mint» y «borrow» activas y factor de garantía 0), pero el dinero que tenían sigue pudiéndose retirar. Hay tokens repetidos (SUN, ETH, USDD) porque cada uno tiene un mercado viejo y otro nuevo, con contratos de token distintos (p. ej. el «ETH» viejo [`THb4CqiFdwNHsWsQCs4JhzwjMWys4aqCbF`](https://tronscan.org/address/THb4CqiFdwNHsWsQCs4JhzwjMWys4aqCbF) y el nuevo [`TRFe3hT5oYhjSZ6f3ji5FJ7YCfrkWnHRvh`](https://tronscan.org/address/TRFe3hT5oYhjSZ6f3ji5FJ7YCfrkWnHRvh)).

Observación sobre reservas: en varios mercados antiguos (USDC, USDJ) las **reservas del protocolo** son mayores que lo depositado por usuarios (por eso «caja» > «reclamo»); el contrato no separa las reservas de la caja, de modo que quien retira puede llevarse caja que contablemente es del protocolo.

## 3. Quién tiene el dinero (concentración)

Fuente de la lista: TronScan (mayores titulares del jToken), **cada saldo re-leído en la cadena** (`balanceOf` del jToken) y convertido a reclamo con el tipo de cambio. Se leyeron los 50 mayores de cada mercado (hasta 9.942 titulares en el de TRX). Datos: `resultados/08-titulares.json`.

| Mercado | Titulares totales | Mayor titular (dirección completa) | Su parte | 3 mayores | 10 mayores |
| --- | --- | --- | --- | --- | --- |
| jTRX TRX | 9.942 | [`TRzQrtxrEJbSbQNwAsgAHkBMxTX47yNmjo`](https://tronscan.org/address/TRzQrtxrEJbSbQNwAsgAHkBMxTX47yNmjo) (338,9 M$) | 62 % | 96 % | 97 % |
| jUSDT USDT | 3.717 | [`TKVnVyJiTzyCDgTkZRYc5LM4q8B7xXEbh5`](https://tronscan.org/address/TKVnVyJiTzyCDgTkZRYc5LM4q8B7xXEbh5) (89,98 M$) | 30 % | 52 % | 77 % |
| jWIN WIN | 5.755 | [`TMGeBKLqBJZJVKTzyYJ7Jb4gSSBHVjAihw`](https://tronscan.org/address/TMGeBKLqBJZJVKTzyYJ7Jb4gSSBHVjAihw) (237,0 k$) | 14 % | 35 % | 64 % |
| jBTC BTC | 635 | [`TUjx6w55Nx9G4GjjRNEB4e7w5BUH3WmJTZ`](https://tronscan.org/address/TUjx6w55Nx9G4GjjRNEB4e7w5BUH3WmJTZ) (344,3 M$) | 76 % | 96 % | 98 % |
| jJST JST | 4.419 | [`TNAt1jEguurYcEXRtEaNceyD1ws9akevHv`](https://tronscan.org/address/TNAt1jEguurYcEXRtEaNceyD1ws9akevHv) (831,7 k$) | 6 % | 15 % | 39 % |
| jETH ETH | 402 | [`TCQQjfccKdMi4CnPAzmZW5TALH4HbwceVb`](https://tronscan.org/address/TCQQjfccKdMi4CnPAzmZW5TALH4HbwceVb) (933,4 M$) | 100 % | 100 % | 100 % |
| jTUSD TUSD | 442 | [`TT2T17KZhoDu47i2E4FWxfG79zdkEWkU9N`](https://tronscan.org/address/TT2T17KZhoDu47i2E4FWxfG79zdkEWkU9N) (2,05 M$) | 98 % | 99 % | 100 % |
| jSUN SUN | 2.109 | [`TJ6qHGSwYdz1B18TAVg2g6JqmhxfC2YSto`](https://tronscan.org/address/TJ6qHGSwYdz1B18TAVg2g6JqmhxfC2YSto) (786,5 k$) | 17 % | 29 % | 52 % |
| jBTT BTT | 1.467 | [`TPyjyZfsYaXStgz2NmAraF1uZcMtkgNan5`](https://tronscan.org/address/TPyjyZfsYaXStgz2NmAraF1uZcMtkgNan5) (425,7 k$) | 39 % | 55 % | 74 % |
| jSTRX sTRX | 680 | [`TMbTTiY5vZ6fXRWRMdHfB3ay1DcpSGQ9cG`](https://tronscan.org/address/TMbTTiY5vZ6fXRWRMdHfB3ay1DcpSGQ9cG) (375,9 M$) | 51 % | 96 % | 98 % |
| jUSDD USDD | 1.677 | [`TDToUxX8sH4z6moQpK3ZLAN24eupu2ivA4`](https://tronscan.org/address/TDToUxX8sH4z6moQpK3ZLAN24eupu2ivA4) (72,83 M$) | 18 % | 23 % | 35 % |
| jWBTC WBTC | 14 | [`TDToUxX8sH4z6moQpK3ZLAN24eupu2ivA4`](https://tronscan.org/address/TDToUxX8sH4z6moQpK3ZLAN24eupu2ivA4) (6,13 M$) | 100 % | 100 % | 100 % |
| jU U | 5 | [`TDToUxX8sH4z6moQpK3ZLAN24eupu2ivA4`](https://tronscan.org/address/TDToUxX8sH4z6moQpK3ZLAN24eupu2ivA4) (5,05 M$) | 100 % | 100 % | 100 % |

**Etiquetas públicas** (TronScan, `resultados/10-etiquetas.json`): de las 62 cuentas más grandes, solo tienen etiqueta: [`TYRmcmmKvjL1SFQbvPQtJU1YcaXEnH8dvT`](https://tronscan.org/address/TYRmcmmKvjL1SFQbvPQtJU1YcaXEnH8dvT) («SunX: VaultColdWallet 1»); [`TYQuJSyBrExVtzaXBz3WvoTJ2N154DKAyt`](https://tronscan.org/address/TYQuJSyBrExVtzaXBz3WvoTJ2N154DKAyt) («Minter2»); [`TNLFMo5qsFEZ8fctT7MaCHsZ38uT5ox7fK`](https://tronscan.org/address/TNLFMo5qsFEZ8fctT7MaCHsZ38uT5ox7fK) («James007»); [`TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t`](https://tronscan.org/address/TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t) («TetherToken»); [`TA8af7XtEYKs2iXdrv9WWiExpnZyG6ba6v`](https://tronscan.org/address/TA8af7XtEYKs2iXdrv9WWiExpnZyG6ba6v) («HenryTheVacuum»); [`TRNHCEWF4BWME89Yduy5EKZ163uneknDqW`](https://tronscan.org/address/TRNHCEWF4BWME89Yduy5EKZ163uneknDqW) («InTheCrowd»); [`TR9F8RKkE4j8gV8PqzEdRN5hhaPuixVQZK`](https://tronscan.org/address/TR9F8RKkE4j8gV8PqzEdRN5hhaPuixVQZK) («Rahul_tron»); [`TGKLeTRMJyzpHq9ypyukxc3ee4DAyyfbqB`](https://tronscan.org/address/TGKLeTRMJyzpHq9ypyukxc3ee4DAyyfbqB) («Actor»). **El resto, incluidas las que tienen cientos de millones, no tiene etiqueta pública: esta investigación no atribuye a nadie su propiedad.**

### «Carrera de salida» (ejercicio de estrés, no predicción)

Si los mayores depositantes de un mercado retiraran **todo** uno tras otro, ¿en qué puesto se acaba la caja? Solo tiene sentido donde hay dinero prestado: en **USDT** se acaba en el puesto 4 (salen completos los 3 primeros; el siguiente solo podría sacar 868,2 k$); en **TRX**, en el puesto 2. En ETH, BTC o sTRX casi nada está prestado, así que la caja casi iguala los depósitos y lo que decide es la capa 2 y 3. Detalle completo en `resultados/17-carrera-de-salida.json`.

## 4. El «ETH» y el «BTC» de JustLend: de dónde sale ese dinero

Etiquetas: **COMPROBADO** = visible en la cadena con el hash; **ESTIMADO** = cálculo mío; **HIPÓTESIS** = interpretación; **LÍMITE** = lo que esta lectura no puede saber.

### 4.1 «ETH» (token [`THb4CqiFdwNHsWsQCs4JhzwjMWys4aqCbF`](https://tronscan.org/address/THb4CqiFdwNHsWsQCs4JhzwjMWys4aqCbF), el contrato viejo)

- **COMPROBADO.** El mercado [`TR7BUFRQeq1w5jAZf1FKx85SHuX6PfMqsV`](https://tronscan.org/address/TR7BUFRQeq1w5jAZf1FKx85SHuX6PfMqsV) tiene 484.062 ETH en caja (933,5 M$ según el oráculo), de un token que en total tiene emitidos 485.527 (el 99,7 % está dentro de JustLend). Una sola cuenta, [`TCQQjfccKdMi4CnPAzmZW5TALH4HbwceVb`](https://tronscan.org/address/TCQQjfccKdMi4CnPAzmZW5TALH4HbwceVb), tiene el 99,96 % del mercado.
- **COMPROBADO.** Esa cuenta **firmó ella misma** (función `issue(uint256)` del contrato del token) la creación de unidades a su favor:

| Fecha (UTC) | ETH | Transacción |
| --- | --- | --- |
| 2024-11-02 14:35:06 | 1 | [`95d4d6b3952167f7ed35110cacb56f358b04664435befcf473c9c955da63df11`](https://tronscan.org/transaction/95d4d6b3952167f7ed35110cacb56f358b04664435befcf473c9c955da63df11/overview) |
| 2024-11-02 14:38:06 | 536.000 | [`24981cf23d30ded9c2ae305688e875928e5c0fa74212e01d96b47ea8fe65a9c0`](https://tronscan.org/transaction/24981cf23d30ded9c2ae305688e875928e5c0fa74212e01d96b47ea8fe65a9c0/overview) |

- **COMPROBADO.** Y firmó también sus depósitos en el mercado jETH (`mint` = depositar) y la retirada de 50.000 ETH del 10-nov-2025; **2 minutos después** (16:13:33 → 16:15:21 UTC) esos 50.000 fueron enviados a la dirección cero (quemados), como muestra la lista completa de movimientos de la cuenta (`resultados/19-eth-cuenta-grande.json`):

| Fecha (UTC) | Movimiento | ETH | Transacción |
| --- | --- | --- | --- |
| 2024-11-02 15:05:48 | depósito en JustLend | 10.000 | [`d709116063c73580ccd54a4502b6f87ab2c490d80ae72b57b1f2d273a2125a14`](https://tronscan.org/transaction/d709116063c73580ccd54a4502b6f87ab2c490d80ae72b57b1f2d273a2125a14/overview) |
| 2025-05-10 16:51:36 | depósito en JustLend | 1 | [`6fe1c1544a8c705b4af1dd52818ac57bb9a8527b3918c1d398474928d620c7bb`](https://tronscan.org/transaction/6fe1c1544a8c705b4af1dd52818ac57bb9a8527b3918c1d398474928d620c7bb/overview) |
| 2025-05-10 16:52:03 | depósito en JustLend | 524.000 | [`7d5d5755643b78a1f1917e17f90236109796b3fd1b57102cb55a5fc2f4bc84a6`](https://tronscan.org/transaction/7d5d5755643b78a1f1917e17f90236109796b3fd1b57102cb55a5fc2f4bc84a6/overview) |
| 2025-11-10 16:13:33 | retirada de JustLend | 50.000 | [`a318bebb234be68f3cdc3e52f396ae2edb078bf8d25e3a9b5a74115e7d0d2468`](https://tronscan.org/transaction/a318bebb234be68f3cdc3e52f396ae2edb078bf8d25e3a9b5a74115e7d0d2468/overview) |

- **COMPROBADO.** Antes, entre 2020 y 2021, otra cuenta ([`TKkrTxXwGszshcrYSashxbyrvGbPmshUoK`](https://tronscan.org/address/TKkrTxXwGszshcrYSashxbyrvGbPmshUoK)) firmó la creación de 60.000 ETH (6 operaciones). En total se han creado 596.001 ETH y quemado 109.831 (según TronScan); hoy hay 485.527 en circulación: **LÍMITE:** hay una diferencia de 643 ETH entre lo creado menos lo quemado y lo emitido hoy que esta lectura no explica (probablemente quemas que el listado de TronScan no devuelve).
- **COMPROBADO.** El contrato del token «ETH» (ABI publicado, 33 funciones, tipo Tether) define `issue(uint256)` (el selector `cc872b66` de las transacciones coincide con esa función de ese ABI), `redeem`, `pause`, `addBlackList` y `destroyBlackFunds`, y su `owner()` es [`TCQQjfccKdMi4CnPAzmZW5TALH4HbwceVb`](https://tronscan.org/address/TCQQjfccKdMi4CnPAzmZW5TALH4HbwceVb): **la misma cuenta que emitió, deposita y tiene el 99,96 % del mercado**. Hoy el token no está pausado ni deprecado y ni el mercado jETH ni esa cuenta figuran en su lista negra (`resultados/34`, `35`). **INFERENCIA:** en el diseño estándar de ese tipo de token las funciones anteriores son solo del dueño; el ABI no muestra los permisos y no he leído el código.
- **HIPÓTESIS.** La secuencia «crear → depositar como único depositante → (a veces) retirar y quemar» es la de un emisor que usa JustLend como lugar donde «aparcar» unidades emitidas. **No se puede afirmar** que carezcan de respaldo: el emisor puede tener ETH real en custodia fuera de TRON. **LÍMITE:** la cadena de TRON no contiene esa prueba y ninguna etiqueta pública identifica a la cuenta; esta lectura no atribuye a nadie su control.

### 4.2 «BTC» (token [`TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9`](https://tronscan.org/address/TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9))

- **COMPROBADO.** El mercado [`TLeEu311Cbw63BcmMHDgDLu7fnk9fqGcqT`](https://tronscan.org/address/TLeEu311Cbw63BcmMHDgDLu7fnk9fqGcqT) tiene 6.545 BTC en caja (450,6 M$); el token tiene 17.545 BTC emitidos, así que **el 37,3 % de todo el «BTC» está dentro de JustLend**. El mayor depositante, [`TUjx6w55Nx9G4GjjRNEB4e7w5BUH3WmJTZ`](https://tronscan.org/address/TUjx6w55Nx9G4GjjRNEB4e7w5BUH3WmJTZ), tiene el 76 % del mercado (≈ 5.001 BTC).
- **COMPROBADO.** Se han creado 114.000 BTC (15 operaciones `issue(uint256)`) y quemado 96.090 (según TronScan; **LÍMITE:** diferencia de 364 BTC no explicada en mi lectura). Según el índice de TronScan, las creaciones las firmaron solo dos cuentas (**LÍMITE:** la lista tiene 132 movimientos con la dirección cero y el proveedor declara `total` = 10.000 sin más páginas: puede no ser exhaustiva, y la diferencia de oferta de arriba lo sugiere):

| Cuenta firmante | BTC creados | Fechas |
| --- | --- | --- |
| [`TKkrTxXwGszshcrYSashxbyrvGbPmshUoK`](https://tronscan.org/address/TKkrTxXwGszshcrYSashxbyrvGbPmshUoK) | 54.000 | 2020-09-30, 2020-10-05, 2020-10-10, 2020-10-14, 2020-10-31, 2020-11-01, 2020-11-02, 2020-11-03, 2021-03-06, 2021-03-20, 2022-05-23, 2022-07-05 |
| [`TAyZrEhSYUWZ8c5HgFEjSndKvvTp3CzkYa`](https://tronscan.org/address/TAyZrEhSYUWZ8c5HgFEjSndKvvTp3CzkYa) | 60.000 | 2022-08-21 |

- **COMPROBADO.** El contrato del token «BTC» (ABI publicado, 33 funciones, tipo Tether) define `issue(uint256)`, `redeem`, `pause`, `addBlackList` y `destroyBlackFunds`, y su `owner()` es hoy [`TAyZrEhSYUWZ8c5HgFEjSndKvvTp3CzkYa`](https://tronscan.org/address/TAyZrEhSYUWZ8c5HgFEjSndKvvTp3CzkYa) (la segunda de las dos cuentas que figuran como emisoras). `resultados/34-abi-tokens.json`.
- **COMPROBADO.** El 5-jul-2022 a las 09:47 UTC, [`TKkrTxXwGszshcrYSashxbyrvGbPmshUoK`](https://tronscan.org/address/TKkrTxXwGszshcrYSashxbyrvGbPmshUoK) creó 20.000 BTC ([`8d073d46bd3b102c51b1a936ff1273072360acd84aa1f94b26b47f203c697ae3`](https://tronscan.org/transaction/8d073d46bd3b102c51b1a936ff1273072360acd84aa1f94b26b47f203c697ae3/overview)); ese mismo día [`TUjx6w55Nx9G4GjjRNEB4e7w5BUH3WmJTZ`](https://tronscan.org/address/TUjx6w55Nx9G4GjjRNEB4e7w5BUH3WmJTZ) recibió 20.000 BTC de esa cuenta y depositó 20.000 BTC en jBTC ([`5534a56bdcb59ecf388ce44a10dc0970ea3a9125fa2097800995d5ccfa9d609d`](https://tronscan.org/transaction/5534a56bdcb59ecf388ce44a10dc0970ea3a9125fa2097800995d5ccfa9d609d/overview)). El 21-ago-2022 entraron 21.000 BTC más, enviados por [`TQwh1ZDBdqMKDtGWEeDdrRUUbtgaVL1Se2`](https://tronscan.org/address/TQwh1ZDBdqMKDtGWEeDdrRUUbtgaVL1Se2) (sin etiqueta, creada el 28-ene-2021), y el 1-jul-2023, 3.000. Esa cuenta hizo además 30 retiradas por 39.000 BTC en total; hoy le quedan ≈ 5.001.

## 5. Capa 2: si lo retiro, ¿cuánto USDT saco vendiéndolo en SunSwap?

Método: el motor del monitor de liquidez de SunSwap (validado contra los contratos: ver su ficha), sobre los 23 tokens de JustLend y los 76 mercados de SunSwap V1–V4 que los conectan con USDT (directo o pasando por TRX). Estado leído en el bloque 87973973. TRX se mide como WTRX (equivale 1:1). **Coste** = lo que se pierde frente al precio de referencia del propio mercado, incluidas comisiones y el movimiento del precio. **«USDT obtenibles»** = estimación del USDT que se saca vendiendo **toda** la caja del mercado **por separado, contra el estado inicial de los pools** (si el motor da una cifra menor para un tamaño mayor, se toma el mejor tamaño menor: siempre se puede vender solo una parte; pero eso hereda cualquier sobreestimación del motor en ese punto). **No es un mínimo ni una cota garantizada**, y la suma de varios tokens no es una venta conjunta. Datos: `resultados/11-venta.json`, `12-venta-cota.json`.

| Mercado | Caja | Coste de vender 10 mil $ | 100 mil $ | 1 M$ | Tamaño máx. con coste ≤ 1 % | USDT obtenibles vendiendo toda la caja | % de la caja |
| --- | --- | --- | --- | --- | --- | --- | --- |
| jETH ETH | 933,5 M$ | 6,89 % | 41,33 % | 87,46 % | 957 $ | 143,6 k$ | 0,0 % |
| jSTRX sTRX | 740,0 M$ | 0,00 % | 0,30 % | 1,58 % | 573,0 k$ | 9,74 M$ | 1,3 % |
| jTRX TRX | 493,2 M$ | 0,05 % | 0,06 % | 0,11 % | 17,09 M$ | 72,16 M$ | 14,6 % |
| jBTC BTC | 450,6 M$ | 1,19 % | 8,56 % | 47,62 % | 7,8 k$ | 1,10 M$ | 0,2 % |
| jUSDD USDD | 404,6 M$ | 0,00 % | 0,00 % | 0,04 % | 1,55 M$ | 1,55 M$ | 0,4 % |
| jUSDT USDT | 160,5 M$ | 0 % (ya es USDT) | — | — | — | 160,5 M$ | 100,0 % |
| jJST JST | 13,07 M$ | 0,09 % | 0,39 % | 2,87 % | 310,8 k$ | 9,55 M$ | 73,1 % |
| jWBTC WBTC | 6,13 M$ | 3,00 % | 64,22 % | 96,34 % | 3,2 k$ | 37,3 k$ | 0,6 % |
| jSUN SUN | 4,29 M$ | 0,32 % | 1,39 % | 10,81 % | 66,4 k$ | 2,83 M$ | 66,0 % |
| jU U | 3,41 M$ | 0,01 % | 0,04 % | 0,26 % | 1,05 M$ | 997,4 k$ | 29,3 % |
| jWIN WIN | 1,71 M$ | 1,12 % | 7,96 % | 45,60 % | 8,5 k$ | 696,9 k$ | 40,8 % |
| jTUSD TUSD | 1,19 M$ | 0,02 % | 0,06 % | 1,06 % | 990,2 k$ | 1,11 M$ | 93,2 % |
| jBTT BTT | 1,13 M$ | 0,83 % | 5,38 % | 35,14 % | 13,2 k$ | 696,7 k$ | 61,7 % |
| jHTX HTX | 854,2 k$ | 0,10 % | 0,38 % | 3,10 % | 300,8 k$ | 829,3 k$ | 97,1 % |
| jWSTUSDT wstUSDT | 447,8 k$ | sin mercado | — | — | — | sin mercado | — |
| jNFT NFT | 445,6 k$ | 0,81 % | 5,13 % | 33,92 % | 13,9 k$ | 362,2 k$ | 81,3 % |
| jUSD1 USD1 | 370,8 k$ | 0,02 % | 0,06 % | 100,00 % | 425,4 k$ | 370,7 k$ | 100,0 % |
| jUSDD (cerrado) USDD | 363,5 k$ | 0,06 % | 0,52 % | 70,33 % | 107,5 k$ | 224,1 k$ | 61,7 % |
| jSUN (cerrado) SUN | 217,5 k$ | 1,29 % | 9,00 % | 48,91 % | 6,9 k$ | 359,7 k$ | 165,4 % |
| jUSDC (cerrado) USDC | 189,1 k$ | 7,44 % | 43,45 % | 88,42 % | 813 $ | 73,6 k$ | 38,9 % |
| jETH (cerrado) ETH | 185,3 k$ | 3,49 % | 24,83 % | 76,59 % | 2,0 k$ | 117,0 k$ | 63,2 % |
| jWBTT (cerrado) WBTT | 159,8 k$ | 17,77 % | 67,97 % | 95,49 % | 292 $ | 42,7 k$ | 26,7 % |
| jUSDJ (cerrado) USDJ | 29,3 k$ | 9,31 % | 49,87 % | 90,84 % | 662 $ | 22,7 k$ | 77,3 % |
| jBUSD (cerrado) BUSD | 218 $ | sin mercado | — | — | — | sin mercado | — |

**Total (suma de estimaciones individuales):** de 3.216 M$ de caja saldrían hasta **263,5 M$ (8,2 %)** en USDT por SunSwap; 160,5 M$ de esa cifra es el propio USDT (160.561.696,17 M USDT; 160,5 M$ al precio del oráculo). Quitando el USDT, quedan 103,0 M$ sobre 3.056 M$ de caja en otros tokens (3,4 %). **Solapes:** TRX (72,16 M$) y sTRX (9,74 M$), que suman el 31 % del total, y otros tokens de dos saltos pasan por los mismos pools de TRX/USDT: sin TRX ni sTRX el total baja a 181,6 M$. Una simulación conjunta (que actualice las reservas tras cada venta) no se ha hecho y daría una cifra entre ambas.

**Cómo leer la tabla (3 casos):** (1) **TRX** se vende bien (0,11 % a 1 M$ y hasta 17,09 M$ con coste ≤ 1 %), pero SunSwap solo absorbe ≈ 72,16 M$ de los 493,2 M$; (2) **ETH/BTC**: ni 10 mil $ salen sin perder 6,9 % (ETH) o 1,2 % (BTC); vender 1 M$ cuesta 87 % y 48 %; (3) **USDD/U/USD1** tienen mercados muy buenos hasta cierto tamaño (≈ 1–1,5 M$) y no más: el motor no ve liquidez fuera de su rango de precios.

**LÍMITES de esta capa.** (a) Es el coste de una venta única, hecha ahora, sin troceo en el tiempo; trocear en días con el mercado repuesto daría algo más. (b) Solo SunSwap V1–V4; no se miden otros mercados de TRON ni las casas de cambio centralizadas (el TRX, por ejemplo, tiene mucha más salida en otros sitios). (c) Para wstUSDT y BUSD no hay mercado con USDT/TRX en SunSwap. (d) El mercado viejo de SUN muestra «165 %»: el precio de ese pool viejo es 2,5 veces el del oráculo (38,17 $ frente a 15,1 $ por unidad vieja); la tabla lo muestra tal cual, sin recorte (mercado cerrado de 0,2 M$); WBTT usa también un precio de pool distinto del oráculo (no es un error de escala). (e) Los saldos son los de la caja en ese instante e incluyen las **reservas del protocolo**: vender «toda la caja» supera lo que pueden retirar los depositantes cuando las reservas son grandes (USDC y USDJ viejos). (f) El motor se usa en una copia de investigación (`venta/`) que importa los módulos del monitor de liquidez desde fuera de este paquete, de modo que quien revise el paquete aislado no puede repetir ese cálculo; la validación del motor contra los contratos es la del monitor. (g) Validación del motor: véase la ficha del monitor.

## 6. Capa 3: salidas oficiales (sin pasar por el mercado)

| Token | Salida oficial | Estado leído | Límite |
| --- | --- | --- | --- |
| USDD | PSM de USDD [`TBXW4hS5KYjjbJXDpnrPf4zhkLwrpUjbyz`](https://tronscan.org/address/TBXW4hS5KYjjbJXDpnrPf4zhkLwrpUjbyz) (`buyGem`: USDD → USDT) | Habilitada (`buyEnabled` = true); comisión de salida (`tout`) = 0 (0 %), de entrada (`tin`) = 0; USDT en su GemJoin [`TSUYvQ5tdd3DijCD1uGunGLpftHuSZ12sQ`](https://tronscan.org/address/TSUYvQ5tdd3DijCD1uGunGLpftHuSZ12sQ) (**COMPROBADO**, `balanceOf`): 88,03 M$. Se ha usado hoy mismo (varias salidas en una hora, ver abajo). | Hasta 88,03 M$ de USDT **para todos los poseedores** de USDD (hay 1.158 M emitidos; JustLend tiene 404,6 M$ en su mercado nuevo): cubre como mucho el 22 % de esa caja **si nadie más la usa**: es una capacidad compartida y condicionada a que la PSM siga habilitada; no he leído su código ni sus autorizaciones. |
| sTRX | Desatar («unstake») en JustLend → TRX | Según la documentación de JustLend y de TRON: **14 días** de espera y se recibe TRX (no USDT). **LÍMITE:** no lo he verificado en el contrato (su ABI no está publicado en la cadena). | Plazo 14 días; luego el TRX hay que venderlo (capa 2, TRX sale bien). El alternativo rápido es vender sTRX en SunSwap: ≈ 9,74 M$ (sección 5). |
| ETH / BTC (tokens «en TRON») | Canje con el emisor/custodio | **No verificable en la cadena.** La web de JUST (just.network/token) remite a plataformas como Poloniex; la herramienta de conversión de ETH pide iniciar sesión (lectura del 12-nov, ver ficha de JustCrypto). **LÍMITE:** esta lectura no puede decir si esa salida existe, tiene límite o plazo. | Desconocido |
| USDT | No hace falta | Ya es USDT | — |
| Resto (TUSD, USD1, U, HTX, JST, SUN, WIN, BTT, NFT, USDC, wstUSDT, WBTC…) | No investigada | **LÍMITE:** no se han mirado sus salidas oficiales (la cantidad en juego es pequeña: ≈ 34,18 M$ de caja entre todas) | — |

**Uso real de la PSM** (últimas salidas de USDT de su GemJoin, 2026-11-13): 18:49 UTC 38.983 USDT → [`TFA4C5UwysgSJGxQ7cHz8gxNCwPPdxvQhG`](https://tronscan.org/address/TFA4C5UwysgSJGxQ7cHz8gxNCwPPdxvQhG); 18:46 UTC 1.000 USDT → [`TQqgNg13s2DjvXhW1ky4v6TsR8wZGvb7Y4`](https://tronscan.org/address/TQqgNg13s2DjvXhW1ky4v6TsR8wZGvb7Y4); 18:35 UTC 30.000 USDT → [`TG2fm143DtcdKYdMZaPtx8peKNSU5PEt6h`](https://tronscan.org/address/TG2fm143DtcdKYdMZaPtx8peKNSU5PEt6h); 18:30 UTC 20.000 USDT → [`TTz9SmdBfstGZrXtt5dayVj5s76Nbnu6MT`](https://tronscan.org/address/TTz9SmdBfstGZrXtt5dayVj5s76Nbnu6MT); 18:26 UTC 5.346 USDT → [`TCVFcLgbF8MokB8pVLTHLkjF1LtRih1NEd`](https://tronscan.org/address/TCVFcLgbF8MokB8pVLTHLkjF1LtRih1NEd). Las órdenes pasan por `buyGem` (selector 8d7ef9bb) de la PSM. Datos: `resultados/14-psm-uso.json`, `15-psm.json`.

### 6.2 Capa 4: lo que el dueño de cada token puede hacer (crear, congelar, pausar)

Recuperar un token de JustLend no sirve si el dueño de ese token puede congelarlo. Se leyó el **ABI publicado** de los 23 contratos de token subyacentes y su `owner()` (`resultados/35-poderes-de-token.json`). El ABI dice **qué funciones existen**, no quién puede llamarlas: los permisos se atribuyen al diseño estándar solo donde el ABI coincide con él (**INFERENCIA**). Un ABI no publicado significa «desconocido», no «sin poderes».

| Token (contrato) | Caja en JustLend | Crear | Congelar direcciones | Destruir saldos congelados | Pausar | Dueño (`owner()`) |
| --- | --- | --- | --- | --- | --- | --- |
| ETH [`THb4CqiFdwNHsWsQCs4JhzwjMWys4aqCbF`](https://tronscan.org/address/THb4CqiFdwNHsWsQCs4JhzwjMWys4aqCbF) | 933,5 M$ | sí (`issue`) | sí (`addBlackList`) | sí (`destroyBlackFunds`) | sí (`pause`) | [`TCQQjfccKdMi4CnPAzmZW5TALH4HbwceVb`](https://tronscan.org/address/TCQQjfccKdMi4CnPAzmZW5TALH4HbwceVb) |
| sTRX [`TU3kjFuhtEo42tsCBtfYUAZxoqQ4yuSLQ5`](https://tronscan.org/address/TU3kjFuhtEo42tsCBtfYUAZxoqQ4yuSLQ5) | 740,0 M$ | **ABI no publicado** | **ABI no publicado** | **ABI no publicado** | **ABI no publicado** | dirección cero (ninguno) |
| BTC [`TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9`](https://tronscan.org/address/TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9) | 450,6 M$ | sí (`issue`) | sí (`addBlackList`) | sí (`destroyBlackFunds`) | sí (`pause`) | [`TAyZrEhSYUWZ8c5HgFEjSndKvvTp3CzkYa`](https://tronscan.org/address/TAyZrEhSYUWZ8c5HgFEjSndKvvTp3CzkYa) |
| USDD [`TXDk8mbtRbXeYuMNS83CfKPaYYT8XWv9Hz`](https://tronscan.org/address/TXDk8mbtRbXeYuMNS83CfKPaYYT8XWv9Hz) | 404,6 M$ | **ABI no publicado** | **ABI no publicado** | **ABI no publicado** | **ABI no publicado** | — |
| USDT [`TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t`](https://tronscan.org/address/TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t) | 160,5 M$ | sí (`issue`) | sí (`addBlackList`) | sí (`destroyBlackFunds`) | sí (`pause`) | [`TBPxhVAsuzoFnKyXtc1o2UySEydPHgATto`](https://tronscan.org/address/TBPxhVAsuzoFnKyXtc1o2UySEydPHgATto) |
| JST [`TCFLL5dx5ZJdKnWuesXxi1VPwjLVmWZZy9`](https://tronscan.org/address/TCFLL5dx5ZJdKnWuesXxi1VPwjLVmWZZy9) | 13,07 M$ | sí (`mint`) | no | no | no | [`TTmWtSB8FtzmiD5p2ejP5NRf4VLCo1ms9H`](https://tronscan.org/address/TTmWtSB8FtzmiD5p2ejP5NRf4VLCo1ms9H) |
| WBTC [`TYhWwKpw43ENFWBTGpzLHn3882f2au7SMi`](https://tronscan.org/address/TYhWwKpw43ENFWBTGpzLHn3882f2au7SMi) | 6,13 M$ | sí (`mint`) | no | no | sí (`pause`) | [`TPF62tA6ABdmTVUSLgtbdKGXmbAUwcCabt`](https://tronscan.org/address/TPF62tA6ABdmTVUSLgtbdKGXmbAUwcCabt) |
| U [`TFNirp6PbqYE1ZTtWuCMUKJWLNZkoCoeFJ`](https://tronscan.org/address/TFNirp6PbqYE1ZTtWuCMUKJWLNZkoCoeFJ) | 3,41 M$ | **proxy actualizable: poderes desconocidos** | **proxy actualizable: poderes desconocidos** | **proxy actualizable: poderes desconocidos** | **proxy actualizable: poderes desconocidos** | [`TCbJRUNYD2tJEwP9wo41whF3DCrZaXgg6A`](https://tronscan.org/address/TCbJRUNYD2tJEwP9wo41whF3DCrZaXgg6A) |
| SUN [`TSSMHYeV2uE9qYH95DqyoCuNCzEL1NvU3S`](https://tronscan.org/address/TSSMHYeV2uE9qYH95DqyoCuNCzEL1NvU3S) | 4,29 M$ | no | no | no | no | — |
| TUSD [`TUpMhErZL2fhh4sVNULAbNKLokS4GjC1F4`](https://tronscan.org/address/TUpMhErZL2fhh4sVNULAbNKLokS4GjC1F4) | 1,19 M$ | sí (`mint`) | no | no | no | [`TTfLBC7hVJMbHxiBqmKFUaW5dtoPfUWaMA`](https://tronscan.org/address/TTfLBC7hVJMbHxiBqmKFUaW5dtoPfUWaMA) |
| WIN [`TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7`](https://tronscan.org/address/TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7) | 1,71 M$ | sí (`mint`) | no | no | no | — |
| BTT [`TAFjULxiVgT4qWk6UZwjqwZXTSaGaqnVp4`](https://tronscan.org/address/TAFjULxiVgT4qWk6UZwjqwZXTSaGaqnVp4) | 1,13 M$ | no | no | no | no | — |
| HTX [`TUPM7K8REVzD2UdV4R5fe5M8XbnR2DdoJ6`](https://tronscan.org/address/TUPM7K8REVzD2UdV4R5fe5M8XbnR2DdoJ6) | 854,2 k$ | no | no | no | no | — |
| USD1 [`TPFqcBAaaUMCSVRCqPaQ9QnzKhmuoLR6Rc`](https://tronscan.org/address/TPFqcBAaaUMCSVRCqPaQ9QnzKhmuoLR6Rc) | 370,8 k$ | **proxy actualizable: poderes desconocidos** | **proxy actualizable: poderes desconocidos** | **proxy actualizable: poderes desconocidos** | **proxy actualizable: poderes desconocidos** | [`TBZbFrVxJ8uoRQUwGSFXucpa8i2aXzGqJ8`](https://tronscan.org/address/TBZbFrVxJ8uoRQUwGSFXucpa8i2aXzGqJ8) |
| wstUSDT [`TGkxzkDKyMeq2T7edKnyjZoFypyzjkkssq`](https://tronscan.org/address/TGkxzkDKyMeq2T7edKnyjZoFypyzjkkssq) | 447,8 k$ | **ABI no publicado** | **ABI no publicado** | **ABI no publicado** | **ABI no publicado** | [`TXomXpYhRcCCoEyki5Vg8Si1vUFaamFX9t`](https://tronscan.org/address/TXomXpYhRcCCoEyki5Vg8Si1vUFaamFX9t) |
| USDD [`TPYmHEhy5n8TCEfYGqW2rPxsghSfzghPDn`](https://tronscan.org/address/TPYmHEhy5n8TCEfYGqW2rPxsghSfzghPDn) | 363,5 k$ | no | no | no | no | dirección cero (ninguno) |
| NFT [`TFczxzPhnThNSqr5by8tvxsdCFRRz6cPNq`](https://tronscan.org/address/TFczxzPhnThNSqr5by8tvxsdCFRRz6cPNq) | 445,6 k$ | no | no | no | sí (`pause`) | [`T9yD14Nj9j7xAB4dbGeiX9h8unkKLxmGkn`](https://tronscan.org/address/T9yD14Nj9j7xAB4dbGeiX9h8unkKLxmGkn) |
| SUN [`TKkeiboTkxXKJpbmVFbv4a8ov5rAfRDMf9`](https://tronscan.org/address/TKkeiboTkxXKJpbmVFbv4a8ov5rAfRDMf9) | 217,5 k$ | no | no | no | no | — |
| ETH [`TRFe3hT5oYhjSZ6f3ji5FJ7YCfrkWnHRvh`](https://tronscan.org/address/TRFe3hT5oYhjSZ6f3ji5FJ7YCfrkWnHRvh) | 185,3 k$ | sí (`mint`) | no | no | no | — |
| WBTT [`TKfjV9RNKJJCqPvBtK8L7Knykh7DNWvnYt`](https://tronscan.org/address/TKfjV9RNKJJCqPvBtK8L7Knykh7DNWvnYt) | 159,8 k$ | no | no | no | no | dirección cero (ninguno) |
| USDC [`TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8`](https://tronscan.org/address/TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8) | 189,1 k$ | sí (`mint`) | sí (`blacklist`) | no | sí (`pause`) | [`TJqyfyLxfVMnJHu39F7WrPUMipfLD1Xzrb`](https://tronscan.org/address/TJqyfyLxfVMnJHu39F7WrPUMipfLD1Xzrb) |
| USDJ [`TMwFHYXLJaRUPeW6421aqXL4ZEzPRFGkGT`](https://tronscan.org/address/TMwFHYXLJaRUPeW6421aqXL4ZEzPRFGkGT) | 29,3 k$ | sí (`mint`) | no | no | no | dirección cero (ninguno) |
| BUSD [`TMz2SWatiAtZVVcH2ebpsbVtYwUPT9EdjH`](https://tronscan.org/address/TMz2SWatiAtZVVcH2ebpsbVtYwUPT9EdjH) | 218 $ | **proxy actualizable: poderes desconocidos** | **proxy actualizable: poderes desconocidos** | **proxy actualizable: poderes desconocidos** | **proxy actualizable: poderes desconocidos** | [`TDE6LDhCfAQbaxs5RLgjJmYbtP5YyorQeh`](https://tronscan.org/address/TDE6LDhCfAQbaxs5RLgjJmYbtP5YyorQeh) |

**Lectura (COMPROBADO el ABI; permisos = INFERENCIA):** el **USDT**, el «ETH» y el «BTC» de JustLend son del mismo tipo (Tether): quien tiene el `owner()` puede, en ese diseño, crear unidades, congelar una dirección (incluida la de un mercado de JustLend), pausar el token y destruir los saldos congelados. En USDT ese dueño es el emisor oficial; en «ETH» es la cuenta que tiene el 99,96 % del mercado jETH; en «BTC», una de las dos cuentas emisoras. USDC (306 funciones, con lista negra y pausa) y WBTC (pausa) también tienen controles del emisor. **Para el panel:** una caja de JustLend es «recuperable» solo si el token no puede ser congelado o pausado por un tercero; esta capa lo hace visible.

## 7. Quién manda y qué puede parar

| Elemento | Dirección / valor | Qué es |
| --- | --- | --- |
| Comptroller (proxy «Unitroller») | [`TGjYzgCyPobsNS9n6WcbdLVR9dH7mWqFx7`](https://tronscan.org/address/TGjYzgCyPobsNS9n6WcbdLVR9dH7mWqFx7) | Contrato que lista los mercados y decide si se permite retirar, prestar, liquidar |
| Implementación actual | [`TETm1bMHUm9135d5NmUgfkvqZQ4bk6DgWs`](https://tronscan.org/address/TETm1bMHUm9135d5NmUgfkvqZQ4bk6DgWs) | Código que ejecuta el proxy (cambiable con el Timelock) |
| Dueño (`admin`) | [`TRWNvb15NmfNKNLhQpxefFz7cNjrYjEw7x`](https://tronscan.org/address/TRWNvb15NmfNKNLhQpxefFz7cNjrYjEw7x) (contrato «Timelock») | Todos los 24 jTokens y el Comptroller tienen **el mismo dueño** |
| Plazo del Timelock | 48 h mínimo (rango 48 h – 30 días; gracia 14 días) | Los cambios que haga el dueño deben anunciarse y esperar ese plazo. **No cubre** al guardián de pausas ni a la cuenta que publica los precios (actúan sin esa espera) ni al dueño de cada token (6.2) |
| Dueño del Timelock | [`TEqiF5JbhDPD77yjEfnEMncGRZNDt2uogD`](https://tronscan.org/address/TEqiF5JbhDPD77yjEfnEMncGRZNDt2uogD) | **LÍMITE:** no se ha investigado quién lo controla (¿gobernanza o multifirma?) |
| Guardián de pausas | [`TLntW9Z59LYY5KEi9cmwk3PKjQga828ird`](https://tronscan.org/address/TLntW9Z59LYY5KEi9cmwk3PKjQga828ird) (cuenta normal, no contrato) | Según el diseño estándar de Compound en el que se basa JustLend, puede parar: nuevos depósitos (por mercado), nuevos préstamos (por mercado), traspaso de jTokens (global) y liquidaciones (global). **LÍMITE:** el ABI lista esas funciones pero no dice quién puede llamar a cada una; no he leído el código fuente de JustLend |
| Oráculo de precios | [`TGnYnSn4G9PgWFj7QQemh4YMZKp3fkympJ`](https://tronscan.org/address/TGnYnSn4G9PgWFj7QQemh4YMZKp3fkympJ) | Cambiable por el Timelock (`_setPriceOracle`). Los precios los publica **una cuenta normal** cada ≈ 30 min, con tope de variación del 10 % por periodo (sección 8.6) |
| Cuenta que publica los precios | [`TBPtNVdgkB8QPRHAJeZok6D9pqsFdALv9w`](https://tronscan.org/address/TBPtNVdgkB8QPRHAJeZok6D9pqsFdALv9w) (cuenta normal, no contrato) | Última publicación hoy a las 19:10 UTC; hay otra cuenta normal como «administrador de anclas» ([`TEYZj3NDXoC7RGCtRS6iNKmQRdVkx8iSSr`](https://tronscan.org/address/TEYZj3NDXoC7RGCtRS6iNKmQRdVkx8iSSr)) |
| Factor de cierre / incentivo de liquidación | 50 % / 8 % | Se liquida hasta el 50 % de una deuda con un 8 % de premio al liquidador |
| Pausa de retirada | **No figura en el ABI del Comptroller** | Lista de funciones del Comptroller (71 funciones, `resultados/23-abi-comptroller.json`): solo hay pausa de `mint`, `borrow`, `transfer` y `seize`. **LÍMITE:** esto no descarta restricciones en el código de cada jToken, en el proxy o en el token subyacente (que puede congelar direcciones: sección 6.2). Además la retirada falla por falta de caja o por dejar a la cuenta en déficit. |

**Lo que esto significa:** en el Comptroller no hay un botón de pausa de retirada; pero el dueño puede, con 48 h de aviso, cambiar el código, el oráculo o los factores de garantía; el guardián y quien publica los precios actúan **sin** aviso; y el dueño de cada token puede congelarlo o pausarlo (6.2). Es un riesgo de gobierno que el panel debe vigilar (cambios de implementación, de oráculo y del plazo, y los poderes de cada emisor).

## 8. Deudas y garantías: ¿quién debe y con qué lo respalda?

Para saber si la caja puede vaciarse por impagos y si la garantía de los préstamos se puede vender, se leyó la posición completa (depósitos y deudas) de las **807 cuentas** que figuran entre los 50 mayores titulares de algún mercado (sección 3), con el Comptroller (`getAssetsIn`, `getAccountLiquidity`) y cada jToken (`getAccountSnapshot`). Datos: `resultados/09-cuentas.json` y `24-deudas.json`. **LÍMITE:** es una muestra de las cuentas grandes, no de todos los deudores; la tabla siguiente dice qué parte de lo prestado explican.

**Control de la valoración:** el Comptroller da, para cada cuenta, su margen (`getAccountLiquidity`). Mi valoración de depósitos × factor de garantía − deudas coincide con ese margen en las 194 cuentas comparadas (diferencia mediana 0,0000 %, máxima 0,14 %; `26-escala-margen.cjs`). Mi primer intento dio un cociente de 0,001: era mi unidad (el Comptroller da el margen en TRX con escala 10^15, no 10^18), no un fallo de los datos.

### 8.1 Cuánto de lo prestado explican estas cuentas

| Mercado | Prestado | Explicado por las cuentas leídas |
| --- | --- | --- |
| jUSDT USDT | 144,7 M$ | 87,5 % |
| jTRX TRX | 53,02 M$ | 66,4 % |
| jU U | 1,64 M$ | 99,5 % |
| jBTC BTC | 1,26 M$ | 82,4 % |
| jJST JST | 1,03 M$ | 61,5 % |
| jSTRX sTRX | 954,6 k$ | 64,3 % |
| jTUSD TUSD | 949,8 k$ | 85,3 % |
| jSUN SUN | 507,9 k$ | 47,5 % |
| jETH ETH | 306,2 k$ | 99,2 % |
| jUSD1 USD1 | 293,7 k$ | 78,0 % |
| jWSTUSDT wstUSDT | 172,7 k$ | 95,1 % |
| jUSDD USDD | 157,2 k$ | 56,9 % |
| jUSDJ USDJ | 69,6 k$ | 77,3 % |

En total, las cuentas leídas explican **167,7 M$ de 205,2 M$** prestados (81,7 %).

### 8.2 Los gigantes no deben nada

Las 10 cuentas más grandes de las secciones 3 y 4 (ETH, BTC, TRX, sTRX, USDT, USDD) **no tienen ninguna deuda**: son depositantes puros. Es decir, los 933,4 M$ de «ETH» de la primera cuenta y los 344,3 M$ de «BTC» de la segunda no sostienen ningún préstamo suyo.

| Cuenta | Depósitos | Deuda |
| --- | --- | --- |
| [`TCQQjfccKdMi4CnPAzmZW5TALH4HbwceVb`](https://tronscan.org/address/TCQQjfccKdMi4CnPAzmZW5TALH4HbwceVb) | 933,4 M$ | 0 $ |
| [`TUjx6w55Nx9G4GjjRNEB4e7w5BUH3WmJTZ`](https://tronscan.org/address/TUjx6w55Nx9G4GjjRNEB4e7w5BUH3WmJTZ) | 344,3 M$ | 0 $ |
| [`TRzQrtxrEJbSbQNwAsgAHkBMxTX47yNmjo`](https://tronscan.org/address/TRzQrtxrEJbSbQNwAsgAHkBMxTX47yNmjo) | 338,9 M$ | 0 $ |
| [`TMbTTiY5vZ6fXRWRMdHfB3ay1DcpSGQ9cG`](https://tronscan.org/address/TMbTTiY5vZ6fXRWRMdHfB3ay1DcpSGQ9cG) | 375,9 M$ | 0 $ |
| [`TCiRCBNFrL6bFKWL94yWQi5hNMGNp1Nu27`](https://tronscan.org/address/TCiRCBNFrL6bFKWL94yWQi5hNMGNp1Nu27) | 328,9 M$ | 0 $ |
| [`TYL7z7VSVRShLoJ6YRQMA4t9pSECt9ZLmz`](https://tronscan.org/address/TYL7z7VSVRShLoJ6YRQMA4t9pSECt9ZLmz) | 177,3 M$ | 0 $ |
| [`TKVnVyJiTzyCDgTkZRYc5LM4q8B7xXEbh5`](https://tronscan.org/address/TKVnVyJiTzyCDgTkZRYc5LM4q8B7xXEbh5) | 89,98 M$ | 0 $ |
| [`TWPpxPd5PpU5FQk6F6F3HMN5VdufxnVA8K`](https://tronscan.org/address/TWPpxPd5PpU5FQk6F6F3HMN5VdufxnVA8K) | 40,21 M$ | 0 $ |
| [`TYRmcmmKvjL1SFQbvPQtJU1YcaXEnH8dvT`](https://tronscan.org/address/TYRmcmmKvjL1SFQbvPQtJU1YcaXEnH8dvT) | 29,42 M$ | 0 $ |
| [`TDToUxX8sH4z6moQpK3ZLAN24eupu2ivA4`](https://tronscan.org/address/TDToUxX8sH4z6moQpK3ZLAN24eupu2ivA4) | 84,77 M$ | 0 $ |

### 8.3 Mayores deudores

| Cuenta | Deuda | Debe | Garantía que ha puesto (depósito) | Margen que le deja el Comptroller |
| --- | --- | --- | --- | --- |
| [`THxsp9rhGaYB5t6oP8jFPiR1A2XgpA44QW`](https://tronscan.org/address/THxsp9rhGaYB5t6oP8jFPiR1A2XgpA44QW) | 8,53 M$ | jUSDT 8,53 M$ | jBTC 13,78 M$, jNFT 1,4 k$, jWBTT 139,7 k$, jWIN 10,0 k$, jJST 765,3 k$ | 2,27 M$ (21,0 % de su deuda) |
| [`TYCuRGbd67KmCPz2fPmWpjPzj87hzHfmvC`](https://tronscan.org/address/TYCuRGbd67KmCPz2fPmWpjPzj87hzHfmvC) | 8,10 M$ | jUSDT 8,10 M$ | jUSDD 9,77 M$ | 205,6 k$ (2,5 % de su deuda) |
| [`TJ6nABWuRk3GXMamH8Pr3rJuTFuUzfkszV`](https://tronscan.org/address/TJ6nABWuRk3GXMamH8Pr3rJuTFuUzfkszV) | 7,70 M$ | jUSDT 7,70 M$ | jUSDD 9,15 M$ | 79,3 k$ (1,0 % de su deuda) |
| [`TVKPeG4K94Z1GPWy5gyBVc3EJ7Bd1TcfeS`](https://tronscan.org/address/TVKPeG4K94Z1GPWy5gyBVc3EJ7Bd1TcfeS) | 7,03 M$ | jTRX 2,14 M$, jSTRX 593,5 k$, jUSDT 4,30 M$ | jUSDD 8,92 M$, jSUN 171,2 k$ | 638,1 k$ (8,3 % de su deuda) |
| [`TWu8ihukiwSc466NAEwtRF5HMbW61uKXwB`](https://tronscan.org/address/TWu8ihukiwSc466NAEwtRF5HMbW61uKXwB) | 6,39 M$ | jUSDT 6,39 M$ | jUSDD 7,60 M$ | 77,6 k$ (1,2 % de su deuda) |
| [`TDNEahDDvNBwfax5xTyvtQvAsTdAmgHHkb`](https://tronscan.org/address/TDNEahDDvNBwfax5xTyvtQvAsTdAmgHHkb) | 6,38 M$ | jUSDT 6,38 M$ | jUSDD 7,70 M$ | 170,8 k$ (2,6 % de su deuda) |
| [`TMict8UqF83N4LtkigRYaPPFSQ6rZa2YT3`](https://tronscan.org/address/TMict8UqF83N4LtkigRYaPPFSQ6rZa2YT3) | 5,13 M$ | jUSDT 5,13 M$ | jUSDD 6,24 M$ | 178,7 k$ (3,4 % de su deuda) |
| [`TM4A66t3H9RsaXwFJnWrGdRBEGsucXAoHL`](https://tronscan.org/address/TM4A66t3H9RsaXwFJnWrGdRBEGsucXAoHL) | 5,09 M$ | jUSDT 5,09 M$ | jUSDD 6,29 M$ | 252,6 k$ (4,7 % de su deuda) |
| [`TXRPwEn96rDGcTV3dmLttZGbELaAfKtUXz`](https://tronscan.org/address/TXRPwEn96rDGcTV3dmLttZGbELaAfKtUXz) | 4,84 M$ | jUSDT 4,84 M$ | jUSDD 6,10 M$ | 348,3 k$ (6,7 % de su deuda) |
| [`TJhuNQF9S15uJNa1xMtbBZ2115HnF98HSA`](https://tronscan.org/address/TJhuNQF9S15uJNa1xMtbBZ2115HnF98HSA) | 4,70 M$ | jUSDT 4,70 M$ | jUSDD 5,71 M$ | 148,5 k$ (3,1 % de su deuda) |
| [`TShD8hYmacHerZ4VuwK228dKU9sLtPKi86`](https://tronscan.org/address/TShD8hYmacHerZ4VuwK228dKU9sLtPKi86) | 4,15 M$ | jUSDT 4,15 M$ | jUSDD 5,06 M$ | 155,3 k$ (3,6 % de su deuda) |
| [`TNLFMo5qsFEZ8fctT7MaCHsZ38uT5ox7fK`](https://tronscan.org/address/TNLFMo5qsFEZ8fctT7MaCHsZ38uT5ox7fK) | 3,99 M$ | jUSDT 3,49 M$, jU 509,1 k$ | jSTRX 7,85 M$, jUSDD 39,2 k$ | 1,93 M$ (32,5 % de su deuda) |

### 8.4 De qué está hecha la garantía

Entre las cuentas con deuda (> 1.000 $) hay 251 cuentas; deben 167,7 M$ y su «poder de préstamo» (depósito × factor de garantía) suma 209,5 M$. Composición:

| Garantía | Poder de préstamo | Parte |
| --- | --- | --- |
| jUSDD USDD | 126,3 M$ | 60,3 % |
| jUSDT USDT | 24,52 M$ | 11,7 % |
| jBTC BTC | 21,11 M$ | 10,1 % |
| jSTRX sTRX | 20,69 M$ | 9,9 % |
| jTRX TRX | 11,33 M$ | 5,4 % |
| jJST JST | 3,02 M$ | 1,4 % |
| jSUN SUN | 1,18 M$ | 0,6 % |
| jWIN WIN | 489,8 k$ | 0,2 % |
| jWSTUSDT wstUSDT | 292,4 k$ | 0,1 % |
| jBTT BTT | 259,7 k$ | 0,1 % |

**La garantía que sostiene los préstamos es sobre todo USDD** (60 %), no ETH ni BTC: los tokens «ETH» y «BTC» de la sección 4 aportan solo **21,27 M$** (10,2 %). De la deuda en USDT de las cuentas leídas (126,6 M$), **92,65 M$ (73 %) está respaldada en al menos el 90 % por USDD** (28 cuentas): depositan USDD y piden USDT hasta casi su límite.

### 8.5 Deuda cerca de ser liquidada

Medido como deuda ÷ poder de préstamo (100 % = el Comptroller permite liquidar):

| Tramo | Cuentas | Deuda | Parte de la deuda |
| --- | --- | --- | --- |
| en déficit (≥ 100 %) | 3 | 14,2 k$ | 0,0 % |
| 95–100 % | 22 | 66,33 M$ | 39,6 % |
| 90–95 % | 19 | 28,81 M$ | 17,2 % |
| 80–90 % | 37 | 13,51 M$ | 8,1 % |
| < 80 % | 170 | 59,00 M$ | 35,2 % |

**95,14 M$ (57 % de la deuda leída)** está por encima del 90 % de su límite: a esas cuentas les bastaría que su garantía perdiera entre un 0 % y un 10 % de valor frente a su deuda para poder ser liquidadas. Es un perfil típico de «bucle de estables» (depositar USDD, pedir USDT al máximo), no un hallazgo de mala fe.

### 8.6 El oráculo da a USDD el mismo precio que a USDT, y la salida de USDD es limitada

**COMPROBADO — precios.** El oráculo de JustLend da estos precios (en TRX por unidad, `resultados/01-mercados.json`): USDT 3,191075, **USDD 3,191075, TUSD 3,191075, BUSD 3,191075**, USDC 3,194888, USD1 3,185527. USDD, TUSD y BUSD tienen **exactamente el mismo precio que USDT**; USDC y USD1 no.

**COMPROBADO — cómo se fijan los precios** (`resultados/27`–`29`): el oráculo (`PriceOracleProxy`, [`TGnYnSn4G9PgWFj7QQemh4YMZKp3fkympJ`](https://tronscan.org/address/TGnYnSn4G9PgWFj7QQemh4YMZKp3fkympJ)) delega en un «PriceOracle» ([`TMiNCmvD3zdsv6mk7niBU6NPBzVNjYMQTV`](https://tronscan.org/address/TMiNCmvD3zdsv6mk7niBU6NPBzVNjYMQTV)) cuyos precios los **publica una cuenta normal, no un contrato**: [`TBPtNVdgkB8QPRHAJeZok6D9pqsFdALv9w`](https://tronscan.org/address/TBPtNVdgkB8QPRHAJeZok6D9pqsFdALv9w) (creada 2020-12-03, 112.357 transacciones, última el 2026-11-13 19:10 UTC). Publica cada ≈ 30 minutos (sus 8 últimas publicaciones hoy: 19:10, 18:36, 18:09, 17:39, 17:09, 16:36, 16:09, 15:37 UTC), con una variación máxima configurada de **10 %** por periodo de 600 bloques (≈ 30 min) y no está pausado. Hay además un administrador de anclas ([`TEYZj3NDXoC7RGCtRS6iNKmQRdVkx8iSSr`](https://tronscan.org/address/TEYZj3NDXoC7RGCtRS6iNKmQRdVkx8iSSr), otra cuenta normal).

**INFERENCIA** (no he leído el código del oráculo): como ese PriceOracle es el de Compound v1, el tope de variación limita cuánto puede moverse un precio en cada periodo; y que USDD, TUSD y BUSD valgan lo mismo que USDT sugiere que quien publica los precios los fija igual. Si es así, **si el mercado cotizara USDD por debajo de USDT, JustLend tardaría en verlo (como mínimo hasta la siguiente publicación y, con el tope, no de golpe)** y las garantías en USDD seguirían valorándose a la par. Hoy no hay desviación: SunSwap cotiza USDD a ≈ 0,9999 $ y la PSM cambia 1:1.

**Por qué importa para recuperar:** la garantía de ≈ 92,65 M$ de deuda en USDT es USDD, y la salida de USDD a USDT es la PSM (**88,03 M$** de USDT, compartidos con todo el mundo) más ≈ 1,55 M$ en SunSwap. Con una deuda en USDT de 144,7 M$ y una caja de USDT de 160,5 M$ frente a 305,0 M$ de reclamos, **el punto a vigilar para quien tiene USDT depositado no es el ETH ni el BTC, sino lo que valga y se pueda cambiar el USDD que sostiene esos préstamos**. (HIPÓTESIS de riesgo: nada de esto indica que vaya a ocurrir; es lo que el panel debe vigilar.)

### 8.7 Estrés sobre ETH/BTC y capacidad de pedir préstamos (ESTIMADO, no predicción)

**Deuda actual.** Supuesto extremo: la garantía en jETH y jBTC (los tokens de la sección 4) **no vale nada**. Con ese supuesto, 51 cuentas quedarían con **13,22 M$** de **déficit de cobertura ajustada** (poder de préstamo, es decir, con los factores de garantía; 7,9 % de lo que deben las cuentas leídas), y **12,30 M$** si se compara con el valor bruto del resto de su colateral (pérdida económica más cercana). **8,07 M$ son de una sola cuenta.** Sobre las cuentas leídas: faltan 37,52 M$ de deuda por leer.

**Capacidad de pedir préstamos (E1, revisión de Codex).** La exposición actual no es lo único que cuenta: con los **topes de préstamo** de hoy se podrían pedir hasta **96,26 M$** más (lo que falta hasta el tope de cada mercado abierto, limitado por su caja), y el mayor depositante de BTC ([`TUjx6w55Nx9G4GjjRNEB4e7w5BUH3WmJTZ`](https://tronscan.org/address/TUjx6w55Nx9G4GjjRNEB4e7w5BUH3WmJTZ)) tiene **258,2 M$** de poder de préstamo, jBTC activado como garantía y deuda cero. El tramo de USDT (55,18 M$) exigiría 73,58 M$ de garantía con factor 75 %. **COMPROBADO:** los topes, la caja y el poder de esa cuenta. **HIPÓTESIS (no acreditada):** que esa garantía carezca de respaldo o pueda emitirse sin coste, y que alguien lo intente: hoy los 10 mayores depositantes no deben nada. **LÍMITE:** emitir más no está acreditado como posible sin límite; no he leído el código de `issue`.

| Mercado abierto | Tope de préstamo | Ya prestado | Se podría pedir (limitado por la caja) |
| --- | --- | --- | --- |
| jUSDT USDT | 200.000.000 USDT | 144.787.853 | 55,18 M$ |
| jTRX TRX | 230.000.000 TRX | 169.277.378 | 19,02 M$ |
| jUSDD USDD | 10.000.000 USDD | 46.052 | 9,95 M$ |
| jBTC BTC | 100 BTC | 18 | 5,63 M$ |
| jU U | 5.000.000 U | 1.629.028 | 3,40 M$ |
| jTUSD TUSD | 2.000.000 TUSD | 950.326 | 1,05 M$ |
| jETH ETH | 500 ETH | 159 | 658,0 k$ |
| jWSTUSDT wstUSDT | 500.000 wstUSDT | 154.130 | 387,5 k$ |
| jUSD1 USD1 | 2.500.000 USD1 | 294.338 | 370,8 k$ |
| jWBTC WBTC | 5 WBTC | 0 | 344,1 k$ |
| jSUN SUN | 41.000.000 SUN | 33.625.745 | 111,4 k$ |
| jWIN WIN | 2.000.000.000 WIN | 183.163.031 | 109,2 k$ |

**Conclusión (matizada):** hoy el «ETH/BTC» del emisor sostiene poco de la deuda **existente**; pero con los topes actuales podría sostener hasta ≈ 96,26 M$ de deuda **nueva** que saldría de la caja de otros depositantes. Qué pase depende del respaldo real de esos tokens, que esta lectura no puede comprobar.

| Cuenta | Deuda | Garantía sin ETH/BTC del emisor | Deuda sin respaldo |
| --- | --- | --- | --- |
| [`THxsp9rhGaYB5t6oP8jFPiR1A2XgpA44QW`](https://tronscan.org/address/THxsp9rhGaYB5t6oP8jFPiR1A2XgpA44QW) | 8,53 M$ | 465,0 k$ | 8,07 M$ |
| [`TAtKk8WyMHquE3gYonf3ipJQiDYRdc4L3o`](https://tronscan.org/address/TAtKk8WyMHquE3gYonf3ipJQiDYRdc4L3o) | 842,3 k$ | 0 $ | 842,3 k$ |
| [`TRGDYohbUBYHK2Vb3jhgbMnCD71Ty6YgDR`](https://tronscan.org/address/TRGDYohbUBYHK2Vb3jhgbMnCD71Ty6YgDR) | 780,0 k$ | 0 $ | 780,0 k$ |
| [`TCydYeUb4PBy4fquTJkoMXpqqJCGxJhCkX`](https://tronscan.org/address/TCydYeUb4PBy4fquTJkoMXpqqJCGxJhCkX) | 650,6 k$ | 0 $ | 650,6 k$ |
| [`TML3CzqXXh1d2fSRi2xfHuDXpHoPAW6wpA`](https://tronscan.org/address/TML3CzqXXh1d2fSRi2xfHuDXpHoPAW6wpA) | 411,1 k$ | 105,8 k$ | 305,2 k$ |
| [`TUfii2TfoaF8T6QY8S79fHaivczrkdfWJF`](https://tronscan.org/address/TUfii2TfoaF8T6QY8S79fHaivczrkdfWJF) | 232,3 k$ | 174 $ | 232,2 k$ |

## 9. Controles y validaciones

| # | Control | Resultado |
| --- | --- | --- |
| 1 | **Caja declarada = saldo real**, repetido de verdad: para cada mercado, `getCash()` y el saldo real del token en el contrato (`balanceOf`), leídos uno tras otro **sin caché**, 3 vueltas. | **24 de 24 coinciden en las tres vueltas** (bloques 87.975.537, 87.975.549, 87.975.561; `resultados/30`). El primer control (`05`) dio 22 de 24 y dos diferencias (jTRX y jSTRX) por leer con minutos de distancia; mi primera «repetición» (`06`) **reutilizó la caché del lector y no era una repetición** (objeción R1-04 de Codex, aceptada y corregida). **LÍMITE:** getCash y el saldo se leen con ≈ 0,7 s de diferencia: un mercado muy activo podría cambiar en ese lapso (no ocurrió en 72 comparaciones). |
| 2 | **El oráculo de precios** (que da precios en TRX) frente a Binance. | Ver tabla siguiente: coincide dentro del 2 % (el mayor desvío es WIN, 1,9 %, un token de precio ínfimo). |
| 3 | **Totales por token** frente al TVL por token que publica DefiLlama. | Ver tabla siguiente; prestado: 205,2 M$ (mío) frente a 205,8 M$ (DefiLlama). Su TVL total (6.311 M$) incluye ≈ 3.581 M$ de TRX del módulo de staking, que no es dinero de préstamos. **LÍMITE:** es independiente en la implementación, no en el origen de los datos (lee la misma cadena). |
| 4 | **El propio contrato dice si se puede retirar** (simulación `redeemUnderlying`, no envía nada). | 18 peticiones de retirada total de los mayores depositantes de USDT, TRX, ETH, BTC, sTRX y USDD: **12 «permitido»**, 5 «rechazado: dejaría la cuenta en déficit» (tienen deuda), 1 sin respuesta (un contrato). **LÍMITES:** cada simulación parte del estado de ahora, no de uno tras las retiradas anteriores, así que **no valida la corrida secuencial**; y el error «la caja no alcanza» (código 14) no se pudo provocar (ningún depositante tiene más reclamo que la caja de su mercado): esa parte del modelo se apoya en el código de Compound, no en una prueba mía. |
| 5 | **Cuadre contable** (caja + prestado − reservas = reclamo). | **No se usa como control**: el tipo de cambio del contrato se calcula con esa misma fórmula, así que siempre cuadra por construcción. |
| 6 | **Mi valoración de depósitos y deudas frente al margen que da el Comptroller** (`getAccountLiquidity`). | 194 cuentas, diferencia mediana 0,0000 % y máxima 0,14 % (escala 10^15, `26`). **LÍMITE:** valida mi aritmética y mis escalas; **no** valida los precios ni los tipos de cambio, que usa el propio contrato en ambos lados. |
| 7 | **Motor de venta** (capa 2). | Validación del monitor: 110 de 120 cotizaciones idénticas con el contrato. **LÍMITE:** la validación es la del monitor de liquidez; la copia de investigación importa sus módulos desde fuera del paquete, así que un revisor aislado no puede repetirla. |
| 8 | **Integridad de la lectura de las 807 cuentas** (`32`): se reexaminaron las 4.715 llamadas guardadas. | 807 de 807 listas de mercados leídas (0 vacías); **3.101 de 3.101 lecturas de depósito y deuda con código de error 0** (0 fallos); 806 de 807 márgenes leídos: **1 falló por límite de CPU del nodo** ([`TQPCm8M53zTsmjNp9MCX73a5ZswkYHt3Xc`](https://tronscan.org/address/TQPCm8M53zTsmjNp9MCX73a5ZswkYHt3Xc), deuda 18 k$; sus depósitos y deuda sí se leyeron). La hoja guardada muestra un margen para esa cuenta aunque la respuesta en bruto guardada es el fallo: incoherencia menor que no he podido explicar. |
| 9 | **Reproducibilidad y huellas.** | Cada respuesta en bruto guarda fecha, petición y el SHA-256 **del texto HTTP original**. Hasta las ≈ 20:05 UTC del 13-nov los ficheros guardan la respuesta ya interpretada: de una muestra de 365 respuestas **solo 21 (5,8 %) se pueden recalcular** desde el JSON (objeción R1-09, comprobada). Desde la sesión 30 el fichero conserva el texto original cuando hace falta y **147 de 147 huellas se pueden verificar**. Las huellas antiguas prueban lo que se leyó pero no se recalculan desde el fichero. Con `REPRODUCIR=1` los guiones rehacen los resultados sin red. |

**¿Cuándo se leyó cada cosa?** (la foto no es de un único instante; cada resultado indica el suyo)

| Componente | Resultado | Bloque / hora UTC de las lecturas |
| --- | --- | --- |
| Mercados (caja, deuda, precios del oráculo) | `01`, `04` | bloque 87.973.572 (18:29); respuestas 18:29–18:33 |
| Caja = saldo real (repetido) | `30` | bloques 87.975.537 (20:08), 87.975.549 (20:08), 87.975.561 (20:09) |
| Mayores titulares | `08` | 18:38–18:45 |
| Posición de las 807 cuentas | `09`, `24` | 18:46–19:18 (≈ 32 min: las cuentas se leen una tras otra) |
| Venta en SunSwap (motor) | `11`, `12` | bloque 87.973.973 (401 bloques ≈ 20 min después de la foto de mercados) |
| PSM de USDD | `13`–`16` | 18:51–18:51 |
| Oráculo y publicador de precios | `28`, `29` | 19:20–19:20 |

**Oráculo frente a Binance**

| Token | Oráculo de JustLend (en $) | Binance | Diferencia |
| --- | --- | --- | --- |
| BTC | 68.846,6083 $ | 68.887,3200 $ | -0,06 % |
| ETH (viejo) | 1.928,4270 $ | 1.941,6400 $ | -0,68 % |
| SUN (nuevo) | 0,0151 $ | 0,0151 $ | 0,23 % |
| JST | 0,1446 $ | 0,1446 $ | 0,01 % |
| WIN | 0,00006011 $ | 0,00005900 $ | 1,88 % |
| TUSD | 0,9994 $ | 0,9998 $ | -0,04 % |
| USDC | 1,0006 $ | 1,0006 $ | 0,00 % |

**Caja por token frente a DefiLlama** (suma de los mercados viejo y nuevo de cada token)

| Token | Mi caja | DefiLlama | Diferencia |
| --- | --- | --- | --- |
| ETH | 933,7 M$ | 938,5 M$ | -0,51 % |
| STRX | 740,0 M$ | 740,2 M$ | -0,03 % |
| BTC | 450,6 M$ | 451,3 M$ | -0,16 % |
| USDD | 404,9 M$ | 404,6 M$ | 0,09 % |
| USDT | 160,5 M$ | 160,7 M$ | -0,14 % |
| JST | 13,07 M$ | 13,06 M$ | 0,04 % |
| WBTC | 6,13 M$ | 6,14 M$ | -0,05 % |
| SUN | 4,50 M$ | 4,27 M$ | 5,52 % |
| U | 3,41 M$ | 3,38 M$ | 0,81 % |
| WIN | 1,71 M$ | 1,67 M$ | 1,96 % |
| TUSD | 1,19 M$ | 1,19 M$ | 0,04 % |
| BTT | 1,13 M$ | 1,12 M$ | 0,68 % |
| HTX | 854,2 k$ | 853,5 k$ | 0,09 % |
| WBTT | 159,8 k$ | 445,3 k$ | -64,12 % |
| WSTUSDT | 447,8 k$ | 444,3 k$ | 0,80 % |
| NFT | 445,6 k$ | 442,6 k$ | 0,68 % |
| USD1 | 370,8 k$ | 371,1 k$ | -0,07 % |
| USDC | 189,1 k$ | 188,9 k$ | 0,09 % |

Los tokens grandes coinciden dentro del 0,5 % (la diferencia en ETH, −0,51 %, es la del precio: el oráculo da 1.928 $ y Binance 1.942 $). Dos desvíos mayores son de **valoración**, no de cantidad, y afectan a mercados viejos y pequeños: **SUN (+5,5 %)**, porque el mercado viejo de SUN (217 k$) está valorado por el oráculo a 15,1 $ por unidad vieja mientras el pool de SunSwap la cotiza a 38,2 $; y **WBTT (−64 %)**: el oráculo valora WBTT a 0,000326 $ y SunSwap/DefiLlama a ≈ 0,000906 $ (mercado cerrado de 0,16 M$). Esta lectura no investiga esas dos diferencias de precio. Además, `exchangeRateStored` y las deudas «almacenadas» no incluyen los intereses devengados desde la última operación de cada mercado (diferencia pequeña; no cuantificada).

## 10. Lo que NO se afirma, límites y errores míos

**No se afirma:** que el «ETH» o el «BTC» de JustLend carezcan de respaldo; que nadie «controle» una cuenta concreta más allá de lo que figura en la cadena (quién firma una transacción, quién es el `owner()` de un contrato); que algún depositante vaya a retirar; ni quién está detrás de ninguna dirección sin etiqueta. Solo se afirma lo que aparece con hash, y lo demás va etiquetado.

**Límites de esta lectura:**
- Foto de un instante (13-nov-2026, bloque 87.973.572) con lecturas repartidas en ≈ 1,5 h; no hay historial. Una caja que hoy está llena puede vaciarse en minutos.
- Concentración: se leyeron los 50 mayores titulares de cada mercado (807 cuentas distintas); TronScan dice cuántos titulares hay en total (hasta 9.942 en TRX). **Concentración por dirección no es concentración por entidad**: una entidad puede repartirse en muchas direcciones.
- Deuda: las cuentas leídas explican el 81,7 % de lo prestado; **37,52 M$ (18,3 %) no se han leído** (18,08 M$ en USDT, 17,82 M$ en TRX). Cada conclusión de riesgo de la sección 8 es sobre las cuentas leídas; para completar haría falta recorrer todos los eventos de préstamo.
- Capa 2: solo SunSwap V1–V4 y venta única de un golpe, sin simulación conjunta; el motor no ve liquidez fuera de su rango de precios (USDD, U, USD1 pasan a «no cabe» por encima de ≈ 1–1,5 M$ aunque el mercado total sea algo mayor).
- Capa 3: salidas oficiales investigadas solo para USDD, sTRX, ETH y BTC; sTRX se apoya en documentación pública, no en el contrato; la PSM de USDD es una capacidad compartida cuyo código no he leído.
- Capa 4: los poderes de cada token salen del ABI publicado (no del código fuente ni de los permisos); varios tokens grandes (sTRX, USDD nuevo, wstUSDT) **no publican su ABI** y quedan como «desconocido»; y **U, USD1 y BUSD son proxies actualizables**: su ABI visible (5 funciones: `admin`, `upgradeTo`…) es el del proxy, no muestra los poderes reales del token y su administrador puede cambiar el código.
- No se han leído los tipos de interés (¿hay un «kink»?), el código de los jTokens, del proxy de precios ni de la PSM, ni la cola del Timelock; no se ha investigado quién controla el Timelock ([`TEqiF5JbhDPD77yjEfnEMncGRZNDt2uogD`](https://tronscan.org/address/TEqiF5JbhDPD77yjEfnEMncGRZNDt2uogD)).

**Errores míos durante el trabajo (corregidos, y anotados en la Norma):**
1. Mi primer cálculo de precios usó una escala equivocada (1 USDT salía a 0,003 $); lo detecté al ver que los números no cuadraban y comprobé la escala real del oráculo (precio en TRX, escala 10^(33−decimales)) contra Binance.
2. Mi lector de contratos convertía una respuesta vacía (función que no existe) en datos: salió una «dirección» inventada para el token de jTRX y un «false» en las pruebas de pausa. Corregido: respuesta vacía = fallo declarado.
3. Las diferencias de jTRX y jSTRX de la primera comprobación eran un desfase entre lecturas, no un hallazgo.
4. Puse un tope de 400 páginas al leer el historial del token «ETH» (no era un límite del dato) y dejó el origen incompleto; lo resolví preguntando directamente por las transferencias de la cuenta grande y por las creaciones.
5. Lancé una lectura larga de forma que se cortó con la orden que la lanzó; la relancé bien reutilizando lo guardado.
6. Mi primera simulación de retirada pidió una cantidad ínfima de tokens de 18 decimales y el contrato la rechazó por redondeo: no es un hallazgo (las filas «un poco» de `resultados/16` con valores enormes son ese rechazo).
7. Mi primer control de valoración de las deudas contra el Comptroller dio un cociente de 0,001 porque usé la escala 10^18 para su margen; la real es 10^15.
8. **Las «cuatro repeticiones» del control de caja eran una sola lectura**: el lector reutilizaba la caché y dije «0 en las 4». Lo detectó Codex (R1-04); lo corregí repitiéndolo sin caché (`30`).
9. **Dije que cada respuesta en bruto llevaba «huella SHA-256» sin comprobar que se pudiera recalcular**: el fichero guardaba la respuesta interpretada y la huella era del texto original (solo 21 de 365 muestras se recalculan). Corregido para las lecturas nuevas y declarado para las antiguas (R1-09).
11. **En la tabla de poderes de los tokens puse «no» (sin controles) para U, USD1 y BUSD**, que son proxies actualizables: su ABI visible es el del proxy y no dice nada de los poderes reales del token. Lo descubrí al preguntarme el propietario qué era el token U. Corregido: «proxy actualizable: poderes desconocidos» (6.2).
10. **Presenté 263 M$ como «mínimo seguro»** sumando ventas calculadas por separado que comparten pools, y dije que «todo cambio» pasa por 48 h de espera (el guardián y quien publica precios no). Corregidos (R1-01, R1-03).

## 11. Revisión adversarial independiente (Codex, ronda 1) y escenarios

**Cómo se hizo.** El 13-nov-2026 (19:59–20:05 UTC) se pasó el informe a **Codex** (CLI de OpenAI, solo lectura, sesión efímera y sin memoria) con la orden expresa de **refutarlo** y de **ampliar el análisis adversarial**. Se le dio un **paquete aislado** (7.077 ficheros: informe, resultados, guiones y respuestas en bruto; sin red; antes de enviarlo se comprobó que no contenía claves de API ni datos personales). Gastó ≈ 634 mil tokens de entrada (563 mil de caché) y 13,6 mil de salida. Su respuesta íntegra, sin editar, está publicada junto a los datos (`codex/ronda-1/respuesta.md`). **Cada objeción se comprobó aquí contra los datos antes de aceptarla.** Resultado: 11 objeciones, **ninguna rechazada**: 9 aceptadas tal cual y 2 aceptadas en parte (R1-05 y R1-09, donde mi comprobación añadió o matizó). Codex recalculó sin objeción las operaciones aritméticas principales (24 verificaciones, 3.419,37 / 3.216,45 / 205,20 M$).

### 11.1 Las 11 objeciones y qué se hizo

| Objeción (gravedad de Codex) | Qué decía | Mi comprobación | Decisión y cambio |
| --- | --- | --- | --- |
| **R1-01** · alta | Los 263 M$ «mínimos» suman ventas aisladas que comparten pools; la envolvente conserva sobreestimaciones del motor. | Cierto: suma directa 263,48 M$ (con el recorte al oráculo eran 263,33); TRX y sTRX suman el 31 % y comparten los pools de TRX/USDT; las curvas de WTRX, sTRX y WBTC no son monótonas. | **Aceptada.** «Mínimo seguro» retirado; ahora «suma de estimaciones individuales», con la cifra sin TRX ni sTRX; sin recorte (R1-10). La simulación conjunta queda pendiente. |
| **R1-02** · alta | El riesgo ETH/BTC se minimiza con la deuda actual: los topes permiten abrir ≈ 96 M$ más y el mayor depositante de BTC tiene poder de sobra. | Reproducido: capacidad adicional 96,26 M$ (USDT 55,18 M$); necesita 73,58 M$ de garantía y [`TUjx6w55Nx9G4GjjRNEB4e7w5BUH3WmJTZ`](https://tronscan.org/address/TUjx6w55Nx9G4GjjRNEB4e7w5BUH3WmJTZ) tiene 258,21 M$ con jBTC activado y deuda 0; la cuenta ETH tiene el jETH sin activar como garantía. | **Aceptada.** Se separa deuda vigente y capacidad incremental (8.7, E1). La emisión ilimitada y el coste de emitir no están acreditados: queda como condicional. |
| **R1-03** · alta | «No existe pausa de retirada» y «48 h para todo cambio» superan lo que prueban el ABI y los parámetros. | Cierto: el ABI del Comptroller no cubre el código de los jTokens, el proxy ni el token subyacente; y el guardián y el publicador de precios no pasan por el Timelock. | **Aceptada.** Afirmaciones circunscritas al ABI; añadidos los poderes de los tokens (6.2) y la salvedad del Timelock. |
| **R1-04** · media | Las «cuatro repeticiones» del control de caja reutilizan la caché del lector. | Cierto: la sesión 06 tiene 9 respuestas. Repetido sin caché: 24 de 24 en tres vueltas (`30`). | **Aceptada.** Texto corregido; error nº 8. |
| **R1-05** · media | El selector `issue(uint256)` no basta para identificar la función; «firma» es `owner_address`; la lista de emisiones de BTC puede no ser exhaustiva. | En parte refuerza el informe: el ABI de ambos tokens define `issue` y el `owner()` del token ETH es [`TCQQjfccKdMi4CnPAzmZW5TALH4HbwceVb`](https://tronscan.org/address/TCQQjfccKdMi4CnPAzmZW5TALH4HbwceVb), el depositante único. Pero el `total` de 10.000 de TronScan y la diferencia de 364 BTC / 643 ETH confirman que la lista puede no ser exhaustiva. | **Aceptada en parte.** Se mantiene lo comprobado (ABI + `owner()`), los permisos pasan a INFERENCIA y «dos cuentas» queda como «según el índice de TronScan». |
| **R1-06** · media | Los 13,22 M$ de «deuda sin respaldo» son déficit de cobertura ajustada (con factores), no pérdida económica. | Reproducido: ajustado 13,22 M$ en 51 cuentas con ETH/BTC (13,23 M$ en 54 si se cuentan 3 que ya estaban en déficit), sobre valor bruto 12,30 M$. | **Aceptada.** Se muestran las dos cifras. |
| **R1-07** · alta | La muestra de 807 cuentas deja 37,5 M$ de deuda sin leer; concentración por dirección ≠ entidad. | Reproducido: 37,52 M$ (18,3 %); USDT 18,08 M$. | **Aceptada.** El importe sin leer acompaña a cada conclusión de riesgo; límite añadido. |
| **R1-08** · media | La igualdad USDD = USDT en el oráculo es observación; su causa y la cadencia por activo son hipótesis; 8 transacciones no prueban 8 actualizaciones por precio. | Cierto: no leí qué precios fija cada transacción. | **Aceptada.** La igualdad queda como observación y el resto como INFERENCIA/HIPÓTESIS. |
| **R1-09** · media | Las lecturas abarcan varios instantes; el control del Comptroller no es independiente; la huella no se puede recalcular desde el JSON. | Cierto en los tres: 18:29–19:18 UTC (y venta 401 bloques después); misma fuente de precios; **solo 21 de 365 huellas se recalculan**. | **Aceptada.** Tabla de tiempos por componente; controles con sus dependencias; huellas nuevas verificables (147/147) y límite declarado para las antiguas. |
| **R1-10** · media | Recorte arbitrario al valor del oráculo; la caja incluye reservas; USDT en unidades ≠ dólares; PSM = capacidad compartida. | Cierto: SUN viejo recorta 142.225 USDT (explica 263,48 → 263,33); el resto de la sección 6 era 33,63 M$ con las exclusiones listadas. | **Aceptada.** Sin recorte, explicado; unidades separadas; reservas y PSM matizadas. |
| **R1-11** · media | Las simulaciones de retirada son individuales: no validan la corrida secuencial ni el código 14. | Cierto (ya lo decía en parte). | **Aceptada.** Se declara que no validan la corrida; E4 la calcula con modelo, no con prueba. |

### 11.2 Escenarios adversariales (cálculos míos que reproducen los de Codex; lo demás, especulación marcada)

**E1 · Garantía emitida por quien deposita.** Con los topes de préstamo actuales se podrían pedir hasta **96,26 M$** más: USDT 55,18 M$, TRX 19,02 M$, USDD 9,95 M$, BTC 5,63 M$, U 3,40 M$, TUSD 1,05 M$. Para el tramo de USDT harían falta 73,58 M$ de garantía (factor 75 %); [`TUjx6w55Nx9G4GjjRNEB4e7w5BUH3WmJTZ`](https://tronscan.org/address/TUjx6w55Nx9G4GjjRNEB4e7w5BUH3WmJTZ) ya tiene 258,21 M$ de poder con jBTC activado. **COMPROBADO:** la capacidad y el poder; **HIPÓTESIS:** que el token carezca de respaldo o pueda emitirse sin coste, y que alguien lo intente (los 10 mayores depositantes no deben nada). **Alerta propuesta:** capacidad adicional por mercado y por gran titular; emisión seguida de endeudamiento. **Prueba pendiente:** código de `issue`, límites de emisión y respaldo externo.

**E2 · Oráculo con un único publicador.** Con una variación máxima del 10 % por periodo de 600 bloques (≈ 30 min), si el precio real de un activo cae un 50 % en una hora, el oráculo tardaría **7 periodos (≈ 3.5 h)** en alcanzarlo, y tras 2 periodos seguiría sobrevalorándolo un **62 %**; un precio inflado un 10 % por periodo se duplicaría en 8 periodos (≈ 4 h). **ESPECULACIÓN** condicionada a que el límite funcione como en el PriceOracle de Compound v1 (no he leído su código). **Alerta:** una por cada publicación y otra por ausencia de publicación.

**E3 · USDD se aparta de USDT.** Con las 251 cuentas con deuda > 1.000 $ (deudas y demás precios constantes), el USDD de garantía perdiendo valor produce esto (cálculo mío; coincide con el de Codex):

| Caída del USDD | Cuentas con déficit ajustado | Deuda de esas cuentas | Déficit ajustado | Déficit sobre valor bruto (pérdida económica) |
| --- | --- | --- | --- | --- |
| 3 % | 9 | 32,03 M$ | 0,38 M$ | 0,01 M$ |
| 5 % | 18 | 63,83 M$ | 1,36 M$ | 0,01 M$ |
| 10 % | 29 | 89,57 M$ | 5,30 M$ | 0,01 M$ |
| 20 % | 35 | 96,17 M$ | 14,99 M$ | 1,89 M$ |
| 30 % | 43 | 105,56 M$ | 25,65 M$ | 12,06 M$ |
| 50 % | 58 | 115,58 M$ | 48,76 M$ | 36,57 M$ |
| 100 % | 68 | 118,48 M$ | 109,93 M$ | 107,58 M$ |

Lectura: con un 5 % de caída ya hay 18 cuentas liquidables (63,8 M$ de deuda) pero casi ninguna pérdida económica; esta aparece hacia el 20 % y solo si las liquidaciones no funcionan. La PSM (88,03 M$) equivale al 95 % de los 92,65 M$ de deuda en USDT respaldada por USDD, pero comparar ambas cifras omite el premio de liquidación, a los demás poseedores y el resto de la garantía. **Alerta:** desviación persistente USDD/USDT en el mercado, reserva de la PSM y ritmo de salida.

**E4 · Corrida de los mayores depositantes de USDT.** Si los 3 mayores retiran todo (159,69 M$, el 99,46 % de la caja), quedan **0,87 M$** y la utilización pasa del 47,5 % al **99,56 %**. Alta como vulnerabilidad mecánica; probabilidad desconocida. No se leyeron los tipos de interés: no se afirma cómo reaccionarían. **Alerta:** reclamo de las mayores cuentas > 80 % de la caja, y tras cada retirada relevante.

**E5 · Gobierno.** El Timelock da 48 h de aviso a lo que hace el dueño; el guardián de pausas y quien publica los precios actúan sin esa espera; el dueño de cada token puede congelarlo (6.2). Elevar el tope de USDT (hoy 200 M) permitiría pedir prestados los 105,29 M$ de caja que hoy no se pueden; haría falta garantía admitida. **Alerta:** propuestas y `queueTransaction` del Timelock (aviso 48 h), cambios de oráculo, anclas e implementación. **Pendiente:** quién controla el Timelock y su cola.

**E6 · Mercados diminutos (donación / primer depositante).** Codex comprobó que, aunque jU, jUSD1 y jWBTC tienen pocos titulares, su oferta de jTokens es enorme (≈ 499 M, 64,6 M y 8.908 con 8 decimales): el ataque de primer depositante **no es viable hoy**; el riesgo real es de concentración (jU: el mayor titular tiene el 99,99994 %). Plausibilidad baja en el estado observado.

**E7 · Liquidar con colateral ilíquido.** El liquidador cobra un premio del 8 %: solo gana si vende el colateral perdiendo menos del **7,41 %**. Por cada dólar de deuda repagada se recibiría (colateral vendido en sun.io, 1 M$): ETH **0,14 $**, BTC **0,57 $**, WBTC 0,04 $; frente a 1,06–1,08 $ para sTRX, TRX, USDD o JST. Es decir, **liquidar préstamos garantizados con ETH/BTC de este tipo no es rentable con la salida de sun.io**; el mayor deudor con BTC ([`THxsp9rhGaYB5t6oP8jFPiR1A2XgpA44QW`](https://tronscan.org/address/THxsp9rhGaYB5t6oP8jFPiR1A2XgpA44QW), 8,53 M$) quedaría sin liquidar si su garantía cae. Plausibilidad alta para insuficiencia de sun.io; media para paralización económica general (puede haber salidas privadas). **Alerta:** beneficio neto negativo del liquidador y deuda liquidable sin liquidaciones ejecutadas.

**E9 · Caída correlacionada de USDD, sTRX y TRX** (75,5 % del poder de garantía de las cuentas con deuda): una caída conjunta del 50 % dejaría **109 cuentas** con déficit ajustado, **131,98 M$** de deuda afectada y **55,05 M$** de déficit (deudas constantes). **ESPECULACIÓN** en la magnitud; la correlación es una hipótesis. **Alerta:** precio sTRX/TRX, cola de desbloqueo, reservas de la PSM.

### 11.3 Ataques contra el informe y el panel (E8) y lo que se corrigió

| Fallo o ataque | Indicador y tratamiento que debe llevar el panel |
| --- | --- |
| Lectura ausente o error de contrato | Estado «desconocido» y conservar la última lectura válida con su edad visible (nunca un cero). *Ya aplicado en el lector (respuesta vacía = fallo); comprobado en las 4.715 llamadas de las cuentas: 0 fallos en depósitos/deudas.* |
| Posiciones omitidas | Mostrar «cuentas esperadas / leídas», códigos de error y deuda sin explicar (18,3 % hoy). |
| Datos de distintos instantes | Bloque y hora por componente (tabla de la sección 9) y edad máxima antes de retirar la clasificación. |
| Tokens con el mismo símbolo | Identidad por contrato y decimales verificados (aquí hay 3 pares: SUN, ETH, USDD). |
| Etiquetas manipuladas o repartir una posición en muchas direcciones | Fuente y fecha de cada etiqueta, separadas de cualquier atribución; la concentración se muestra por dirección y se dice que no es por entidad. |
| Manipulación puntual de pools / ventana de ticks agotada | Comparar con referencias externas; mostrar la cobertura del motor («no cabe») como desconocida, no como cero. |
| Suma de rutas compartidas | Simulación conjunta con reservas actualizadas (pendiente). |
| PSM disputada | Reserva total compartida, ritmo de salida y habilitación. |
| Margen contractual engañoso por precio | Margen económico alternativo con precio externo (E3, E9). |

**Lo que Codex no pudo comprobar** (y sigue abierto): exactitud y ejecutabilidad del motor de venta; cota conjunta de conversión; código efectivo y permisos (ausencia de bloqueo, cobertura del Timelock, emisión ilimitada, semántica de las anclas); respaldo y canje externo de ETH/BTC; historia íntegra de emisiones y quemas; deudores completos; tipos de interés y *kink*; prueba de insuficiencia de caja con retiradas sucesivas; desbloqueo contractual de sTRX y capacidad íntegra de la PSM; autenticidad externa de las respuestas. Una segunda ronda podría atacar lo que ya se corrigió; no se ha hecho.

## 12. Propuesta: panel «¿Puedo recuperar mi dinero de JustLend?»

**Qué responde, en una frase:** para cada token de JustLend, cuánto hay realmente disponible para retirar ahora, cuánto USDT se saca si se vende, qué salida oficial hay, qué puede hacer el emisor del token y si la recuperación está comprometida; y, si se pega una dirección, qué puede retirar esa cuenta.

### Pantallas

1. **Semáforo por token** (los 17 mercados abiertos + los 7 cerrados con dinero dentro). **Cuatro columnas separadas** (no una sola nota): *caja de JustLend* (disponibilidad contractual), *producto ejecutable de venta* (cuánto USDT y con qué coste), *salida oficial* (plazo y dependencia de terceros) y *poderes del emisor* (congelar, pausar, crear); más un veredicto. Cada fila se despliega con la concentración y la «carrera de salida».
2. **Mi importe.** Se elige token y se escribe un importe a mano (como en el monitor de sun.io). Responde: ¿cabe en la caja?, ¿qué parte puedo sacar de golpe?, ¿cuánto USDT saco y cuánto pierdo?, ¿hay salida oficial y con qué límite o plazo?, ¿en qué puesto de la «carrera» estoy?
3. **Mi cuenta** (solo lectura): se pega una dirección y se lee su posición. Muestra «retirable ahora» = el menor de (su depósito, la caja, lo que le deja el Comptroller sin quedar en déficit) y avisa si una retirada total sería rechazada por la deuda (código 3). **Comprueba también su propia deuda y las restricciones del token.** No se guarda nada.
4. **Avisos e historial.** Una foto horaria (la frecuencia horaria implica retrasos de hasta ≈ 1 h más el tiempo de lectura: se dice en pantalla) y avisos por Telegram cuando: la cobertura de USDT baje de un umbral; cambie el dueño, la implementación o el oráculo; se publique un precio nuevo o **falte** una publicación; el precio de USDD/USDT en el mercado se separe del que publica el oráculo; la deuda a menos del 5 % de ser liquidable supere un umbral; la PSM baje de un mínimo; un mercado quede con la caja por debajo de un % de lo depositado; el reclamo de las mayores cuentas supere el 80 % de la caja; o se emita un token y se pida prestado con él.
5. **Cada cifra pulsable** (regla de la web): cada fila lleva a la transacción, al contrato en TronScan o a la respuesta en bruto.

### Reglas del semáforo (propuesta, ajustables; revisadas tras la objeción de Codex)

Las reglas se aplican **por orden y gana la primera que se cumple** (así no se solapan):

| Orden | Veredicto | Condición (para el importe consultado) |
| --- | --- | --- |
| 1 | **Desconocido** | Alguna lectura falta, falló o es más antigua que el máximo permitido (p. ej. 2 h). |
| 2 | **Comprometido** | La caja es < el importe (un hecho, no una estimación: va antes que cualquier duda sobre el motor). |
| 3 | **Desconocido** | No hay mercado de venta, o el importe supera lo que el motor mide («no cabe»), **y** no hay salida oficial verificable con capacidad ≥ el importe. |
| 4 | **Comprometido** | El coste de venta es > 5 % y no hay salida oficial verificable con capacidad ≥ el importe. |
| 5 | **Parcial** | La caja es < 10 veces el importe; **o** el coste de venta está entre 1 % y 5 %; **o** la única salida es lenta (p. ej. 14 días); **o** los 3 mayores titulares reclaman ≥ 80 % de la caja de ese mercado; **o** el dueño del token puede congelarlo o pausarlo, **o** su ABI no está publicado (no se sabe qué puede hacer): se avisa aparte. |
| 6 | **Recuperable** | Ninguna de las anteriores: la caja es ≥ 10 veces el importe, el coste de venta ≤ 1 % (o el token ya es USDT, o la salida oficial tiene capacidad ≥ el importe) y no hay condición de concentración. |

El umbral de 10 veces y el de 80 % no están calibrados con datos históricos: son un punto de partida. Un importe pequeño de ETH/BTC con coste de venta ≤ 1 % puede salir «parcial» por el aviso de poderes del emisor, no por la venta; por eso esas dos cosas van en columnas separadas.

### Qué hay ya hecho y qué faltaría

- **Ya existe:** el lector de la cadena (este informe, guiones 01–05 y 30), el motor de venta de sun.io (monitor de liquidez, reutilizable), los datos de la PSM de USDD, la forma de publicar pestañas en la web con actualización horaria y el aviso por Telegram del vigilante de USDT0.
- **Faltaría:** convertir los guiones en un lector por lotes (como el del monitor de sun.io) para que la foto horaria sea rápida; leer los tipos de interés; simular las ventas de forma conjunta; leer el historial de eventos para completar deudores; la pantalla; los umbrales; y el historial.
- **Dónde publicarlo** es decisión vuestra: (A) pestaña en las herramientas de la web (pública, con «Mi cuenta» en el navegador del visitante), o (B) pantalla local en ChainScope (privada, con listas de cuentas propias). El lector y los datos son los mismos en ambos casos.

## Anexo A. Ficheros de resultados y su huella (SHA-256 del contenido)

| Fichero | SHA-256 | Qué contiene |
| --- | --- | --- |
| `resultados/01-mercados.json` | `728bfece2686feef724876535f08c02c12068d1606c3f33c66f7c2e1769ed787` | Foto de los 24 mercados (valores en bruto) |
| `resultados/02-gobierno.json` | `66004feca02031c08ce0be93a6b12c685917c30009e9c8ca3c0868053416dd46` | Dueños, implementaciones y pausas |
| `resultados/03-timelock-y-precios.json` | `2ace782c23c3bb90194ba373637913fade575c1f5907d11dc2d82e294a5db078` | Timelock y precios de Binance |
| `resultados/04-liquidez-por-mercado.json` | `d3b1f2635850861563f3c31757b662c7e6d03f2ebfb1494d7dcd22149b538ad9` | Liquidez por mercado (derivada) |
| `resultados/05-caja-real-y-oferta.json` | `a51c9c2729a8ff0b464488b0d36a5c52e6e67ab06fb3afa43556af227f54e5c6` | Caja real frente a saldo y oferta del token |
| `resultados/08-titulares.json` | `e5b67f75966b8a50d7ffdd8933c53013f7442170ad0d397f67cb1cdf03c4091e` | Mayores titulares por mercado |
| `resultados/09-cuentas.json` | `20a6cd925a5faa821db9f9c25aff2ce82d57eeb6da862020ef014af8332ec68a` | Posición de 807 cuentas grandes |
| `resultados/10-etiquetas.json` | `3d6eca818c1816d74b663132fdfe6f8ad7125f81f4e42da2fafd49ce7d17102d` | Etiquetas públicas |
| `resultados/11-venta.json` | `9edc49b01fe2aacb723d550129bec7c2787ce771c165459ab636fcad8fb8b5ed` | Curvas de venta en SunSwap |
| `resultados/12-venta-cota.json` | `9dae78c3119c1019e330d78ada3d4cd267c9c678844b4c6bb0a94a094f276a27` | Cifra segura de USDT obtenibles |
| `resultados/13-salidas-oficiales.json` | `5b114f1f97b070b788f1f372bf38cab5e24399c59af3d50df292dec67b2598e8` | PSM de USDD y sTRX |
| `resultados/14-psm-uso.json` | `7d3b3cb2d8fcf46aa9baa4b219d812f1f81cea22c07f858b29f1836052ed84e5` | Uso de la PSM |
| `resultados/15-psm.json` | `48a4af7b5d1a4909101f2ccb72bfc66dd6f6ed5cca615678af583e93a515c53a` | PSM: comisiones y funciones |
| `resultados/16-simular-retiradas.json` | `4dc29786fedc8cd6e62c725989f874550345df2a8fd4a6ee564797bc060afb6c` | Simulación de retiradas con el contrato |
| `resultados/17-carrera-de-salida.json` | `d5b94814adbf0178bbe091ca08ab2cc872b7e1db4d1d271d7c21fc5b51d15dd7` | Carrera de salida |
| `resultados/18-origen-eth.json` | `d8ef208057feff17ec9fc53b6e9fbf4b23bb0f5f1d6534e9aa51c687d75e8f3d` | Origen del ETH (lectura parcial, ver 19) |
| `resultados/19-eth-cuenta-grande.json` | `d222b3c46c24f909c72da635cee0730a6cf42a10959f4d3a4ee7faf4d91f9ea0` | Movimientos de ETH de la cuenta grande y creaciones |
| `resultados/20-creaciones-eth.json` | `88cc064bd84d68cbcf56f4ff6980371aeebc2e4467dec78d878c826f7f9d8b7c` | Quién firmó las creaciones de ETH |
| `resultados/21-origen-btc.json` | `bff382d7e0de03704d22108773e959f31e5dad3c3aacfad383fbe740faab12b4` | Origen del BTC |
| `resultados/22-contraste-defillama.json` | `2d55f203ebf329ee41310f4356a05aa81ac287ffa5ba8aa882b299203e038b56` | Contraste DefiLlama |
| `resultados/23-abi-comptroller.json` | `38bf7f35ab753c3d459b61e16384bfd8c78fb0182b73a6c90d7dbb83a294b4c6` | Funciones del Comptroller |
| `resultados/24-deudas.json` | `e4373ce6837db17c98821038f3ba40be6713c994b821bc0b7e379653d49613b8` | Deudas y garantías |
| `resultados/25-btc-firmas.json` | `c5dcb5d134fbfac1f5f02b56555f09d05be754a16e6ead98e86d603c485d111a` | Quién firmó las creaciones de BTC |
| `resultados/27-oraculo.json` | `a9bbc6cc9187932375168e5040ba04965bdbceaf7330ac31323ba2194aa3629b` | Funciones del oráculo de precios |
| `resultados/28-oraculo-v1.json` | `19e95595cab689d060031e55e90691661d7e8a2c9f913bbe8d09f2c973dca161` | Oráculo v1: poster, anclas y variación máxima |
| `resultados/29-poster.json` | `f879b4604d04f5494de0851f5ecdfe17b812482e6acc3807256f621147dd927a` | Cuenta que publica los precios y sus últimas publicaciones |
| `resultados/30-control-caja-fresco.json` | `dd613f0c4fc9b35537c0f2d1ba8e3336bf85f416e157557ab743ebb522294d20` | Control de caja repetido sin caché (3 vueltas) |
| `resultados/32-huecos-09.json` | `ebb5d3564bf0bce365877bb027374e7edcb243fe0a3da5457c1a51bb4681b086` | Revisión de las 4.715 llamadas de las cuentas (fallos y códigos de error) |
| `resultados/33-adversarial.json` | `5babcb5b0409aadfaf88f931027667d238032b066df28d7e8139ff52334ddd1a` | Escenarios adversariales: capacidad de préstamo, sensibilidad al USDD, corrida, liquidación, oráculo |
| `resultados/34-abi-tokens.json` | `46df0f08bd51c3bef66b9956424e399bf045208c469255672313ff34454f533d` | ABI y dueño de los tokens ETH y BTC (issue, owner) |
| `resultados/35-poderes-de-token.json` | `0ff7b3bf13c04d09efb9c622b0c3dec32290befdaa11b38bbed4384f4caa0512` | Poderes del emisor sobre los 23 tokens (crear, congelar, pausar) |
| `resultados/36-token-u.json` | `5d788c3f5a0e231ab4aee9276422630c12d4114ed3500bd7497eb5d8c510541c` |  |

Guiones: `00`–`35` (cada uno dice arriba qué hace; el `26` solo imprime, no guarda), `lib.cjs` (lectura con huella), `abi.cjs` (llamadas a contratos), `venta/` (copia de investigación del monitor de SunSwap con los tokens de JustLend). Generador de este informe: `generar-informe.cjs`.