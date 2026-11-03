# Seguimiento del 2-nov-2026: el reparto posterior a la foto, rastreado a fondo (tramo 4)

> **Estado:** trabajo NUEVO, todavía **sin revisión de Codex** y sin incorporar al informe revisado ni a las figuras. Los datos salen de `research/auditoria-adversarial-2026-10-31/tramo4/` (rastreo y análisis reproducibles). El informe revisado anterior sigue diciendo «≈109,4 M$ repartidos» y «58,7 M$ rastreados»: **esas cifras han quedado atrasadas** por lo que sigue.

## 1. Qué cambió

- La billetera de reparto `TRBdWq…` recibió el 31-oct dos depósitos que el informe daba por «quietos» (120 M TRX a las 14:50 y 158,2 M TRX a las 18:44 UTC) y **los repartió**. Su último envío es del 1-nov a las 05:33 UTC y le quedan 131 TRX.
- Desde la foto ha enviado **733 veces** (las de 3.520 $ o más) un total de **190,20 M$** a **112 billeteras**. El informe rastreaba a fondo 58,65 M$ (353 envíos).
- Corte común de todo el análisis: **2026-11-02T00:28:23.361Z**. Precio fijo de 0,352 $ por TRX (limitación declarada; falta la serie horaria).

## 2. Rastreo

- Billeteras leídas: **7571** (nivel máximo 42), **lecturas fallidas 0**, parciales 0, llegadas anteriores a su ventana de lectura: 0 (comprobado con `auxiliares/_chequeo-ventanas-t4.cjs`).
- Mismas reglas que el tramo 3: sin topes de saltos ni de billeteras; se sigue lo ≥ 3.520 $; los «nodos» (muchas operaciones) son puntos donde se detiene el rastreo, no destinos demostrados.

## 3. Dos huecos del método que se han cerrado

**3.1 Retiradas sin envío (JustLend).** La billetera `TNhpfKq83w…` recibió 52,8 M$ directos de `TRBdWq…` (38 envíos) y depositó 51,2 M$ en JustLend a través de `TMDENHFS…` (TrxProviderProxy; método `deposit(vault, receiver)`). Más tarde llamó a `withdraw`/`redeem` indicando como **receptor** otras direcciones: esas llamadas **no envían valor**, así que no aparecían como envíos suyos y el rastreo no las veía. Se leyeron las llamadas de las 50 billeteras que depositaron en esos contratos (9 con retiradas hacia otras billeteras): **54,71 M$** de retiradas recuperadas, 0 lecturas incompletas (`completar-retiradas.cjs`, `tramo4/retiradas-informe.json`). Antes de este arreglo, esa billetera figuraba con ~53 M$ de desajuste.

**3.2 Contrato recolector.** `TXtEs6t2…` (contrato sin verificar, creado el 2025-09-01, 253.118 operaciones; método observado `depositErc20(depositor, token, amount, id)`) recibió **683 depósitos de 113 billeteras del recorrido por 51,87 M$ brutos**. Se comprobó en cadena que, de los 58.826.875 USDT que salieron de ese contrato entre el 31-oct 00:00 y el 2-nov 00:30 UTC, **58.826.752 fueron a una única dirección, `TYVWGh8XkmU49Hi9PkGAZXiiJPB3J5zJZy`** (329.773 operaciones, creada el 2024-12-31, sin etiqueta pública). Por eso cada depósito se anotó como un salto hacia esa dirección (`completar-recolectores.cjs`). **Es una regla basada en un comportamiento observado en esa ventana, no una identificación del servicio.**

## 4. Adónde llega el dinero (mezcla proporcional, 190,2 M$ de entrada)

| Destino | Importe |
|---|---|
| Nodos (puntos de parada del rastreo, ver §5) | 113,42 M$ |
| USDD (GemJoin) | 23,64 M$ |
| Préstamos (CErc20Delegator) | 6,70 M$ |
| Puentes (UsdtOFT, Prefunded, Bridgers) | 0,27 M$ |
| Casas de cambio (FixedFloat, Gate) | 7034 $ |
| Retenido en billeteras del recorrido | 7,03 M$ |
| Polvo (salidas < 3.520 $) | 5,60 M$ |
| Entra en contratos y no se ve salir (§6) | 31,42 M$ |
| **Suma** | **188,10 M$** |
| Entrada | 190,20 M$ |
| Diferencia (suma − entrada) | -2,10 M$ (-1,1 %) |

La diferencia es un defecto contable del modelo (pureza estática por billetera; ver la auditoría), **no una pérdida económica demostrada**. Antes de cerrar los dos huecos de §3 la suma era de 101,6 M$ (faltaban 88,6 M$).

## 5. Los nodos

| Dirección | Importe | Bruto | Envíos | Billeteras origen | Operaciones |
|---|---|---|---|---|---|
| TYVWGh8X…zJZy | 49,57 M$ | 51,87 M$ | 683 | 113 | 329.773 |
| TM8uyBjR…XDyc | 19,57 M$ | 20,25 M$ | 1819 | 1249 | 23.880 |
| TBAPnuwE…QMUM | 8,20 M$ | 11,11 M$ | 361 | 44 | 8831 |
| TGSNahJv…3HHL | 8,10 M$ | 10,87 M$ | 376 | 40 | 8344 |
| TLKfB2go…xCeW | 7,93 M$ | 10,72 M$ | 380 | 44 | 8556 |
| THPaGKe6…bpun | 7,01 M$ | 9,45 M$ | 345 | 43 | 9295 |
| TH1YKH9M…Mv8B | 6,64 M$ | 8,95 M$ | 344 | 39 | 8643 |
| TZG47zhb…MrvF | 1,88 M$ | 1,93 M$ | 270 | 268 | 317.156 |
| TJbZXZR9…gvU9 | 1,52 M$ | 1,52 M$ | 254 | 252 | 1.516.496 |
| TRsqznGX…yBZa | 0,98 M$ | 1,02 M$ | 39 | 39 | 26.167 |
| TD64NDwZ…pxL7 | 0,91 M$ | 0,91 M$ | 55 | 31 | 89.048 |
| TRLWnRCw…EuEg | 0,67 M$ | 0,67 M$ | 34 | 24 | 22.779 |
| TSc4Bc4C…CYqD | 0,27 M$ | 0,27 M$ | 12 | 11 | 10.739 |
| TKfz7Pu3…HGE2 | 0,12 M$ | 0,12 M$ | 18 | 18 | 5.599.480 |
| TSBHPFbP…DGCq | 0,04 M$ | 0,04 M$ | 4 | 4 | 833.363 |
| TBtfrdjX…gLxX | 0,02 M$ | 0,02 M$ | 1 | 1 | 7207 |

`TYVWGh8X…` es ahora el mayor receptor observado (49,57 M$). Comprobación manual, **fuera del modelo**, de lo que hace después (USDT, 31-oct a 2-nov): envió 61,6 M$ a 2.909 direcciones, de ellas **43,27 M$ a `TAYmju2Z…`** y 6,81 M$ a `TUx8aD2B…`; `TAYmju2Z…` reenvió los 43,27 M$ íntegros a `TB8h4xAu…` (58.061 operaciones), que a su vez envió 47,97 M$ a `TLaGjwhv…`. Son pasos de reenvío sin etiqueta pública; **no se han rastreado a fondo ni se afirma quién los controla**.

## 6. Lo que sigue sin resolver: 31,42 M$ que entran en contratos sin que se vea la salida

| Contrato | Importe | Envíos | Billeteras |
|---|---|---|---|
| TPuaJ6gn…max1 (MetaRouterGateway) | 13,95 M$ | 1001 | 259 |
| TEcDijvK…Y4XC (Vault) | 2,32 M$ | 26 | 26 |
| TNUC9Qb1…jWFR (WTRX) | 0,67 M$ | 10 | 3 |
| TX2Ut1re…vnd5 (sin nombre) | 0,42 M$ | 11 | 3 |
| TGdqvQw1…Djko (sin nombre) | 0,25 M$ | 1 | 1 |
| TExp8Hjp…6FJz (sin nombre) | 0,25 M$ | 1 | 1 |
| TTu9T4ff…z4G9 (BWSwapRouterV1) | 0,21 M$ | 15 | 13 |
| TNtf4XbW…fZEP (sin nombre) | 0,17 M$ | 1 | 1 |
| TGnC7LMj…yJ3r (SmartExchangeRouter) | 0,16 M$ | 43 | 43 |
| TLzLUvth…oFrf (sin nombre) | 0,15 M$ | 1 | 1 |

(151 contratos en total; el resto suma 12,88 M$.) Lo principal:

- **MetaRouterGateway `TPuaJ6gnY…` (13,95 M$, 1.001 envíos de 259 billeteras):** en las transacciones examinadas cambia TRX por USDT y envía el USDT al contrato proxy `TD4tamFrCq…`, que reparte a muchas direcciones. **Parece un cruce de cadenas, pero no está confirmado.** Sin resolver.
- **Vault `TEcDijvKSX…` (2,3 M$, 26 depósitos):** no se hallaron llamadas de retirada de esas billeteras con el método usado para JustLend; sin resolver.
- El resto son intercambios y contratos sueltos donde la salida no vuelve a una billetera del recorrido o no se decodificó (entre ellos, WTRX y varios sin nombre).

## 7. Limitaciones que siguen abiertas

- Este tramo **contiene** los 353 envíos del tramo 3 y se solapa con los tramos 1–2: **no se pueden sumar**; el solape monetario no está medido.
- Los 190,2 M$ son un valor bruto de lo enviado por `TRBdWq…` valorado a 0,352 $/TRX; su origen (saldo previo a la foto + los dos depósitos) no se ha reconciliado aquí.
- Solo se siguen TRX y USDT; otros tokens (p. ej. WTRX, jTRX) y las transferencias internas de contratos no se leen salvo las decodificadas arriba.
- Los nodos son puntos de parada, no destinos finales; ninguna etiqueta de titularidad está verificada.
- Las 423 lecturas fallidas de los tramos 1–2, el precio horario y los demás huecos de `PREGUNTAS-ABIERTAS-2026-10-31.md` siguen pendientes.

## 8. Reproducción

```
node traza-tramo4.cjs            # rastreo (reanudable)
node completar-retiradas.cjs     # §3.1
node completar-recolectores.cjs  # §3.2
node traza-tramo4.cjs            # reanudar tras anotar los saltos
node analisis-tramo4.cjs         # reparto
node armar-seguimiento-2nov.cjs  # este documento
```
