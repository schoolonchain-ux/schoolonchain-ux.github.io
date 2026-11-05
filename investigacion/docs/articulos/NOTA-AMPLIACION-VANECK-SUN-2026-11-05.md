# Ampliación del caso Vaneck / Justin Sun — 5 de noviembre de 2026

*School On-Chain. Esta nota amplía la investigación del 29-oct y los seguimientos del 30-oct y 4-nov. Cada afirmación lleva su nivel de evidencia: **VERIFICADO** (se comprueba en la cadena), **ATRIBUCIÓN DE TERCEROS** (lo dicen otros: pista, no prueba), **HIPÓTESIS** (explicación posible) o **DESCONOCIDO**. Todas las direcciones van completas. Corte de las lecturas: 5-nov-2026, 09:18 UTC.*

## Qué NO afirma esta nota
- Que Justin Sun controle ninguna de las cuentas o claves citadas. Él ha negado controlar la «segunda cuenta».
- Que una dirección sea una persona: una etiqueta de TronScan es una atribución de terceros.
- Que el TRX que acaba en una casa de cambio sea de nadie en concreto: el TRX es intercambiable.

## 1. Resumen
1. La cuenta que da energía a las billeteras de Binance tras el robo (`TEF9ZVUxhmGGffvkf59e2vdLfAG1QCMb7B`) **no es nueva**: tiene aproximadamente un año.
2. La cuenta que esta web llamaba «proveedora de TRON Inc.» (`TWhDfwC8QE6pQyiYy248dNor3uphPEw5M2`) es, leída entera, **una cuenta de paso**: 7.091,2 M USDT entran y 7.090,7 M salen. A TRON Inc. le mandó 22,2 M TRX en tres años. Hizo el relevo de 750 M TRX a la cuenta de energía.
3. De las **1.000 direcciones bloqueadas por la TRON Foundation en 2018**, la lista oficial coincide 1.000 de 1.000, al sun, con lo repartido en la cadena. Movieron casi todo su TRX en solo 1.543 envíos y lo concentraron en 14 cuentas de reunión.
4. La **única clave** de la cuenta que TronScan etiqueta «Poloniex» (`TNCmcTdyrYKMtmE1KU2itzeCX76jGm5Not`) es hoy la de la proveedora, entregada con la firma de la cuenta etiquetada «Poloniex 2» (`TUgSgCQL6pMSy9zByn4sgxqrJa95sZExBG`). No hay vínculo de claves con HTX, OKX ni Binance.

## 2. La proveedora y el relevo de fondos — VERIFICADO
- **Lectura completa** de `TWhDfwC8QE6pQyiYy248dNor3uphPEw5M2` desde su creación (28-nov-2023): 1.837.593 movimientos de USDT y TRX; coincide con el recuento de TronScan (1.251.159 transacciones).
- **Totales:** 7.091.212.379 USDT dentro y 7.090.730.698 fuera; 3.318 M TRX dentro y 3.318 M fuera. Hacia TRON Inc.: 22,2 M TRX. Hacia la cuenta de energía: 749.999.997 TRX en tres envíos (20-oct, 2-nov y 4-nov), cada uno con 1 TRX menos de lo recibido.
- **Binance a ambos lados:** la cuenta `TFSd14UQUp6HPamdMGJsWBxfWKMrLYxRmp` (creada el 6-ago-2026) recibió 886,2 M USDT de 20 billeteras de Binance y lo mandó todo a la proveedora. De la proveedora vuelven a Binance, en dos saltos, al menos 389,6 M USDT. La proveedora toca 10 billeteras de Binance (recibe 9,25 M USDT y les manda 254.996 TRX; no recibe TRX de Binance). Los pagos de billeteras de Binance suelen ser retiradas de clientes.
- **Los 140 M USDT del 2-nov:** la segunda cuenta mandó 60 M y 80 M a dos cuentas creadas ese día; cada una los reenvió a la proveedora; de ahí pasaron por otra billetera nueva y **137.999.998,8 USDT llegaron a Binance-Hot 12** (`TJTKCzQpsG19CSMYF9TPtxz6wSHPSyeKfa`). El 3-nov la proveedora devolvió 109.999.997,6 USDT a la segunda cuenta. Las transacciones, una a una, están en el capítulo 7 de la página.
- **HIPÓTESIS:** que sea un «préstamo de un día» encaja con el patrón; la cadena no muestra ningún acuerdo.

### Relaciones entre cuentas, con una regla fija
De 36 parejas con algún flujo de 1 M o más: 1 de **control común** (una cuenta es clave de la otra), 2 de **relación de trabajo** (dinero + operaciones recurrentes + que una sea al menos el 30 % de lo que recibe la otra) y 33 de **dinero simple**. Las huellas (horas, importes terminados en 999, votos) no suben una pareja de nivel. Dos salvedades: la cuenta «Poloniex» no estaba en ese conjunto (con la misma regla, la pareja proveedora ↔ cuenta «Poloniex» sería una segunda de control común), y la regla mide la exclusividad en TRX y energía, no en USDT (la proveedora mandó a la segunda cuenta 151,8 M USDT), así que puede haber más relaciones de trabajo.

## 3. El TRX de la antigua TRON Foundation — VERIFICADO / ATRIBUCIÓN
- La TRON Foundation publicó el 1-jul-2018 la lista de 1.000 direcciones con 33.251.807.424 TRX ([artículo oficial](https://medium.com/tron-foundation/33-251-807-424-trx-were-locked-in-1000-addresses-of-tron-mainnet-feee5a5685c9)). `TSnjgPDQfuxx72iaPy82v3T8HrsN4GVJzW` recibió 33.251.807.524 TRX de la cuenta génesis «Zion» (`TLLM21wteSPs4hKjbxgmH1L6poyMjeTbHm`) y repartió 33.251.807.424 entre esas 1.000 direcciones: coinciden las 1.000.
- Las 1.000 hicieron 1.543 envíos de TRX (unos 33.289 M TRX; entre ellas solo envíos de polvo) y los concentraron en 14 cuentas de reunión (2020–2022).
- **Primer salto** desde esas cuentas (envíos de 100 M o más): 37.219 M TRX en 80 envíos. El 58,7 % fue a billeteras etiquetadas de casas de cambio (Binance-Hot 2: 14.389 M; la cuenta etiquetada «Poloniex»: 3.885 M; OKX 1: 2.882 M; Binance-Hot 1: 690 M) y el 41,3 % a cuentas sin etiqueta que no se han seguido. **El TRX es intercambiable:** esas cuentas recibieron 33.215 M de las 1.000 y enviaron 37.219 M, así que no se puede atribuir cada destino a la Foundation.
- Tres de las cuentas de reunión mandaron 1.131 M TRX a `TWpMnUh9pZS1Mf8yyw9WPiS82WYevKzQo2`, la misma cuenta que recibió 430 M de «Zion» en 2023 y que el 28-jun-2025, en 8,5 minutos, mandó 365.096.751 TRX por dos billeteras intermedias (`THxg4UEzbnqXMiyEwMQ5XPgkdLnPrkHHcb` y `TFZZx3HXBEGqA1hJnYmRvscjS48gihWXY6`) y HTX 4 hasta la tesorería que Protos atribuye a TRON Inc. (`TEySEZLJf6rs2mCujGpDEsgoMVWKLAk9mT`), a la que llegaron 365.096.845 TRX (HTX 4 añade unos pocos TRX de otra procedencia). **ATRIBUCIÓN:** esa cifra coincide con los 365 M TRX que la propia empresa comunicó públicamente ([The Block](https://www.theblock.co/post/360350/srm-entertainment-stakes-365-million-trx-amid-100-million-tron-treasury-strategy)); no se ha comprobado el formulario oficial.
- **HIPÓTESIS:** la parte de «Zion» en esa entrega sale entre el 0 % y el 11,6 % según el método de reparto: **no se sostiene** que ese TRX sea «el de la Foundation».

## 4. Las claves de «Poloniex» — VERIFICADO (claves y firmas) / ATRIBUCIÓN (las etiquetas)
- Se compararon las claves y permisos de **77 cuentas** (3 etiquetadas Poloniex, 3 HTX, 6 OKX, 25 Binance, 26 del caso, 14 cuentas de reunión). **Entre las cuentas de casas de cambio, solo la cuenta «Poloniex» tiene una clave ajena: la proveedora** (peso 3, umbral 3, en propietario y actividad). Todas las de HTX, OKX, Binance y las de reunión tienen solo su clave propia. En el caso tienen claves ajenas la pareja de la proveedora, otra multifirma, la cuenta de energía y `TU3rMHyWHzeEJBReWLzHko728hbz6MtfNg` (controlada por `TM3sTVyahiGWYktKg8G6miHpTzRurKDt7b`).
- **Historial** (permisos leídos desde el 31-oct-2023), con el firmante recuperado de la firma de cada transacción (método comprobado con cuentas de clave propia: 16 de 16):
  1. 11-nov-2023, 17:13 UTC — firma la propia clave de la cuenta; pasa a ser controlada por «Poloniex 2». Es un día después del hackeo público de Poloniex.
  2. 8-ene-2024, 16:29 — firma «Poloniex 2»; repite el cambio.
  3. 8-ene-2024, 16:33 — firma «Poloniex 2»; **la proveedora pasa a ser la única clave**.
- «Poloniex 2» firma además en dos multifirmas 3 de 5 que mueven dinero con la proveedora (la proveedora no es clave de ellas): `TSzSgxRisS5VBXXDcAezTDvnPGi9CbsXvJ` (desde el 29-ago-2024) y `TWPpxPd5PpU5FQk6F6F3HMN5VdufxnVA8K` (28-jul-2026, dos horas y media después de crearla). Una llave de cinco no es control por sí sola.
- La cuenta «Poloniex» solo le mandó a la proveedora 1,15 M USDT de los 7.091 M que mueve: no es su fuente principal.
- **HIPÓTESIS (de la más a la menos sencilla):** (G-1) las cuentas «Poloniex», «Poloniex 2», la proveedora y su pareja están bajo el mismo controlador; (G-2) hay un proveedor de servicios de por medio; (G-3) las etiquetas de TronScan están desfasadas. La cadena no separa G-1 de G-2.

## 5. Lo que ha dicho Justin Sun en público — ATRIBUCIÓN DE TERCEROS (prensa)
Solo prensa que cita sus declaraciones; no se han podido abrir sus publicaciones originales en X.

| Fecha | Casa de cambio | Qué dijo o hizo | Fuente |
|---|---|---|---|
| oct–nov 2019 | Poloniex | Confirma en directo (12-nov) que es uno de los inversores que compraron Poloniex a Circle; antes lo había negado | [The Block](https://www.theblock.co/news/markets/2019-10-18-circle-insiders-say-justin-sun-is-leading-the-investment-consortium-taking-over-poloniex-43811), [Cointelegraph](https://cointelegraph.com/news/tron-founder-justin-sun-admits-investment-in-crypto-exchange-poloniex) |
| 13-sep-2023 | HTX | Presenta el cambio de marca Huobi → HTX como «asesor global» | [The Block](https://www.theblock.co/post/250931/justin-sun-hopes-htx-rebrand-will-help-exchange-keep-pace-with-rivals-global-expansion), [Decrypt](https://decrypt.co/156244/huobi-rebrands-to-htx-at-token2049) |
| 25-sep-2023 | HTX | Confirma un hackeo de ≈ 8 M$ y dice que HTX cubre las pérdidas | [FXStreet](https://www.fxstreet.com/amp/cryptocurrencies/news/htx-global-hacked-for-8-million-justin-sun-communicates-calm-and-offers-employment-for-hacker-202309251841) |
| 10-nov-2023 | Poloniex | Tras el hackeo, escribe en X que Poloniex reembolsará los fondos afectados | [FXStreet](https://fxstreet.com/amp/cryptocurrencies/news/crypto-exchange-poloniex-hack-leads-to-60-million-in-assets-stolen-peckshield-says-202311101206) |
| 18-nov-2023 | Poloniex | Sube la recompensa al hacker a 10 M$ con un mensaje en cadena | [FXStreet](https://fxstreet.com/amp/cryptocurrencies/news/justin-sun-offers-10-million-bounty-to-return-the-110-million-stolen-funds-from-poloniex-202311181255), [Forklog](https://forklog.com/en/justin-sun-raises-bounty-for-poloniex-hacker-to-10-million/) |
| 27-feb-2024 | HTX | Publica en X una captura con ≈ 28.613 BTC (≈ 1.600 M$) en su cuenta de HTX | [CryptoSlate](https://cryptoslate.com/tron-founder-justin-suns-1-6-billion-wallet-balance-dominates-htx-4-9-billion-reserves/), [Daily Hodl](https://dailyhodl.com/2024/02/27/justin-sun-reveals-1622357100-stash-of-bitcoin-btc-sitting-on-crypto-exchange-htx-heres-why) |

En Poloniex se declaró inversor; en HTX, asesor y gran tenedor del token HT, y [niega ser propietario de control](https://www.theblock.co/post/175867/justin-sun-denies-being-real-buyer-of-huobi-stake-sale-exclusive). En los dos hackeos de 2023 dio la cara públicamente (anuncios, reembolsos, recompensas), **pero eso no es un título de propiedad ni una clave**. De OKX no hay ninguna relación de propiedad documentada.

## 6. Correcciones respecto a lo publicado hasta el 4-nov
- La proveedora **no es «de TRON Inc.»**: es una cuenta de paso que le mandó 22,2 M TRX.
- A HTX 4 llegaron **803,2 M TRX** en siete envíos (no 778,2 M): faltaba un envío de 25 M del 2-mar-2026.
- La cuenta de energía **no es nueva** y reparte **1.500,5 M TRX de energía a 79 cuentas** (más 28,8 M de ancho de banda: el total de 1.529,3 M que se citó incluía ambos).
- Los 140 M de USDT del 2-nov: 140 M salieron de la segunda cuenta, 138,0 M llegaron a Binance-Hot 12 y 109,999997 M volvieron el 3-nov.
- Las cifras del primer salto de la Foundation incluyen TRX de otra procedencia: no se atribuyen a la Foundation.

## 7. Límites
- La entrada de USDT de la proveedora incluye algunos envíos suyos a sí misma (125.952,8 USDT según la revisión independiente; no cuentan como salida).
- Revisión independiente: antes de publicar, un revisor distinto (otro modelo de IA, con ejecución de código) rehízo los cálculos con su propio código desde los datos en bruto y señaló errores de redacción y de cifras; están corregidos. No pudo comprobar la selección de las 77 cuentas ni algunas lecturas completas frente a TronScan.
- Los permisos de la cuenta «Poloniex» se leyeron desde el 31-oct-2023 (tope de 60.000 transacciones): lo anterior no se ha leído.
- Solo se comparan las 77 cuentas examinadas: la cadena no permite buscar «todas las cuentas que tienen esta clave».
- Las etiquetas «Poloniex», «Poloniex 2» y «Binance-Hot n» son de TronScan. El nombre «HTX 4» y los de otras cuentas de HTX vienen de nuestra lista interna.
- No se ha seguido el 41,3 % del primer salto que va a cuentas sin etiqueta, ni el interior de las billeteras de Binance ni las vecinas de la proveedora con más de 200 envíos.
- La lectura del historial de 3 de las 1.000 cuentas de la Foundation quedó una transferencia por debajo del total por un tope de TronScan.

## 8. Método y evidencia
Solo lectura de TronGrid y TronScan. Cada respuesta se guarda en bruto con su huella SHA-256; los resultados se rehacen sin internet y dan exactamente lo mismo (65 programas, 95 resultados, 0 diferencias). Los datos en bruto (1,4 GB) no se publican; sí los programas, los resultados y el manifiesto de huellas, en `investigacion/research/tron-vaneck-sun/ampliacion-2026-11-05/`. Los datos de los capítulos nuevos de la página están en `reports/caso-vaneck-sun/energia.json` y se generan con `h1-datos-para-la-web.cjs`; `h2-comprobar-la-web.cjs` comprueba cada dirección (checksum y origen) y las cifras del texto antes de publicar.
