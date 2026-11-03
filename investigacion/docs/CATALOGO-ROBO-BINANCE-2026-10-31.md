# Catálogo completo del robo a Binance (TRON y Ethereum): direcciones, hashes, mensajes, envenenamiento, contratos, casas de cambio y tokens

**Qué es.** El índice legible del catálogo. **Todo el detalle está en el libro Excel `docs/catalogo/CATALOGO-COMPLETO-ROBO-BINANCE-2026-10-31.xlsx`** (con filtros en cada hoja) y en los mismos datos en CSV (`docs/catalogo/csv/`). Aquí van las tablas que más se consultan, con **direcciones y hashes completos**. Horas UTC.

**Cadena de cada dato:** TRON · ETHEREUM · ARBITRUM (BSC y Solana solo como destino leído en Bridgers). Cada fila lo indica.

## Límites (leer antes)

- **Dónde se ha buscado.** Mensajes, polvo y tokens basura: en las **10 billeteras del ladrón en TRON** y en las **8 de Ethereum + la de Arbitrum**, desde las 19:00 UTC del 29-oct hasta la mañana del 31-oct. **No** en las miles de billeteras intermedias del recorrido.
- **Mensajes.** Solo existen en transacciones que llevan texto (notas en TRON, datos de entrada en Ethereum). Las transferencias de tokens (TRC20 y ERC20) no llevan nota.
- **Categorías de los mensajes.** Las he puesto con reglas de palabras; el texto completo va al lado para que las corrijas.
- **«Imita a».** Dirección real del caso que comparte el comienzo y/o el final con el remitente. Es un **indicio** de envenenamiento, no una prueba.
- **Una afirmación de mi informe anterior no se sostiene:** el informe del 30-oct decía que las billeteras de TRON reciben polvo «desde direcciones que imitan sus últimas letras». Medido ahora, **ninguna de las 650 transferencias de polvo imita la dirección de su destinatario**; solo 2 comparten las últimas 4 letras con otra contraparte. Lo que sí es masivo es el **polvo en sí** (apartado 2.1). En Ethereum, en cambio, el envenenamiento por imitación sí existe y está confirmado (apartado 2.2).

## 1. Mensajes que ofrecen ayuda

### 1.1 TRON: quién escribe, a qué billetera y en qué transacción

| Hora (UTC) | Remitente (completa) | Destinatario (completa) | Papel del destinatario | TRX | Hash | Texto |
|---|---|---|---|---|---|---|
| 2026-10-30 02:56:39 | `TA9vfEWEpfkF5dBdmDQLe9PheZfzmjbAKn` | `TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki` | TRBdWq… reparto | 1 | `640ef18a0dc828b8a296dc430436352802762d9c5b85d99a62fcd13c3d0bb0f0` | may I help you..... pls |
| 2026-10-30 07:54:36 | `TQrWFCvcngriESyNHi6v7pGAGdtubVan6o` | `TSpe5HC3PRD2svJcr1YoGszhHk2mtkyZ8A` | TSpe5HC3… aparca el TRX | 1.9 | `f03953856152cef274cb4192e397519b1f163158bec4696997c2eccbc8617928` | Hey, brother, let me help you transfer funds. I have experience in this area and can directly transfer TRX here |
| 2026-10-30 07:56:27 | `TQrWFCvcngriESyNHi6v7pGAGdtubVan6o` | `TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki` | TRBdWq… reparto | 2.222 | `a25cbac66978443a4b7eaad5e6b981302799cd5f5197a42f461c97755be38c9c` | Hey, brother, let me help you transfer funds. I have experience in this area and can directly transfer TRX here |
| 2026-10-30 08:05:42 | `TQrWFCvcngriESyNHi6v7pGAGdtubVan6o` | `TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki` | TRBdWq… reparto | 1.172066 | `9e38491ad404235152a8aa554ca0cb470fdd3f86da62c76767183bcb55f1f0bc` | Hi,brother, let me help you transfer funds. I am proficient in Tornado/Near/Change now. I have experience in this area and can directly transfer TRX here |
| 2026-10-30 08:18:57 | `TYrd3cjfNaYzVwPaSxj1xtzpLVPTA88888` | `TSpe5HC3PRD2svJcr1YoGszhHk2mtkyZ8A` | TSpe5HC3… aparca el TRX | 1 | `c9f3ef8c36a9dd9fe29e5572fffc9a3f203284261593d48410034ec1bb008294` | May I help you bro? |
| 2026-10-30 08:20:18 | `TYrd3cjfNaYzVwPaSxj1xtzpLVPTA88888` | `TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki` | TRBdWq… reparto | 1 | `7923c47b1506a17c03174927d1fbedc6de3c32f04b0201c7e88cef6fa288583b` | May I help you bro? |

- `TQrWFCvcngriESyNHi6v7pGAGdtubVan6o` escribe 3 veces («let me help you transfer funds…»), una de ellas ofreciendo «Tornado/Near/Change». `TYrd3cjfNaYzVwPaSxj1xtzpLVPTA88888` escribe 2 veces («May I help you bro?») y `TA9vfEWEpfkF5dBdmDQLe9PheZfzmjbAKn` una. Son desconocidos: **en la cadena no consta ningún mensaje de respuesta** desde las billeteras del ladrón.

Otro mensaje en TRON (no ofrece ayuda):

| Hora (UTC) | Remitente | Destinatario | Hash | Texto |
|---|---|---|---|---|
| 2026-10-31 11:21:42 | `TDXTta4F2Y242Zwe97D88ftAgvx5fj2BAV` | `TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki` | `71248b9fd661488575e7b1f5c25546a36abb9540f3e8c25d09d0ec2c106e3d9a` | Dear hacker, I’ve invested 1.111111 TRX in your startup. My two corgis now claim 51% ownership and demand dividends. One is already wearing a tiny CEO suit. |

### 1.2 Ethereum: oferta de ayuda a cambio de 1.000 ETH (posible estafa)

El mismo texto llegó a las **7 billeteras del botín** entre las 03:55 y las 04:08 UTC del 30-oct desde `0xcb3fde484d2bbde1136d3d2341d32609fce34684`, que pide que se le transfieran 1.000 ETH a esa misma dirección a cambio de «despejar todos los obstáculos» y «garantizar la retirada». Texto:

> Sir, I deeply admire your skills. My other team holds additional auxiliary permissions. If you are willing to transfer 1000 ETH to: 0xcb3fde484d2bbde1136d3d2341d32609fce34684, I will clear all obstacles ahead for you and ensure the complete and flawless withdrawal of your remaining funds. Thank you.

| Hora (UTC) | Remitente (completa) | Destinatario (completa) | Papel | Hash |
|---|---|---|---|---|
| 2026-10-30 03:55:35 | `0xcb3fde484d2bbde1136d3d2341d32609fce34684` | `0x5227f603c1ee34ce3c06efe6477003bdfccb2f8c` | dirección del ladrón 0x5227…2f8c | `0xa814ea63680e608019a818761d25eb3aaa01fc1efaad06716a98333b7f1b2b03` |
| 2026-10-30 03:59:23 | `0xcb3fde484d2bbde1136d3d2341d32609fce34684` | `0x897c80d1a9729e94460e2bd93178bd5215158df3` | Consolidación B | `0x9f96dac65083af6e4494c9039e3da626d6a8cb725ab3a159ce886f01d24caa87` |
| 2026-10-30 04:00:35 | `0xcb3fde484d2bbde1136d3d2341d32609fce34684` | `0xc887af690e0301cd4edbbce8f8d31b4ec65b286a` | Consolidación A | `0x411ca78667336082fdef42565ecbfe29ca90aed438f662a18f6aecd3f3287cc7` |
| 2026-10-30 04:00:59 | `0xcb3fde484d2bbde1136d3d2341d32609fce34684` | `0x8532fa14acaf483729c449b8458aeddb900543d4` | Receptor 1 | `0xed9ea399f418a9f62d0d8ea24135f9c5b63dab5f5b5219db605f95d5123ad312` |
| 2026-10-30 04:03:59 | `0xcb3fde484d2bbde1136d3d2341d32609fce34684` | `0x54401f80da97893a15d43566184635b6674bc942` | Consolidación C | `0x9fb71d714737e93e3afe505eecddb28942f7b5f56ee908a59cbe9ecfb7c0313f` |
| 2026-10-30 04:07:11 | `0xcb3fde484d2bbde1136d3d2341d32609fce34684` | `0x79e70d139fc05aa75f75611fdf2680e9952b544a` | Consolidación D | `0x2b56a5acf410482b8d9acd69ba39245497dafea12c156178d25a45d0af2053d6` |
| 2026-10-30 04:08:47 | `0xcb3fde484d2bbde1136d3d2341d32609fce34684` | `0x8d4b8ee62124b7ee140a51ddd07390a56f1c9e19` | Consolidación E | `0x1295dde357a68e796dc2bb0100e9c5aad7fd2a2f21497f920ef5d60d0ea5d697` |

### 1.3 Los demás mensajes de Ethereum y Arbitrum, por categoría

| Categoría | Mensajes | Remitentes distintos |
|---|---|---|
| Insulto o ruido | 724 | 12 |
| Pide dinero o ayuda | 77 | 29 |
| Reclamación o negociación | 43 | 3 |
| Otro | 33 | 22 |
| Publicidad o spam | 11 | 9 |
| Ofrece ayuda para mover/blanquear fondos | 7 | 1 |
| Felicitación o halago | 1 | 1 |

**Reclamaciones y negociación** (alguien dice ser víctima o pide devolver los fondos):

| Remitente (completa) | Mensajes | Primer mensaje (UTC) | Hash del primero | Texto (principio) |
|---|---|---|---|---|
| `0x3f573a47e186b2677869a236ddc16bb1d1398259` | 1 | 2026-10-30 00:06:59 | `0x1138002945592b58494f3a316b5bf765effc09091a80c24a86f391aa45225dbc` | Whitehat deal available, contact @Oliverzm on telegram. |
| `0x82cc99c961ef61eec1709f561cc3c79e0ec8ba1b` | 3 | 2026-10-30 01:06:35 | `0x551d70453fa19fd76d67e1db7d3618b5ad973c97297d15df52cca31128837210` | Your Excellency，  Congratulations on your success in attacking Binance.  DO NOT refund Binance.  This is their dereliction of duty in failing to take good care of their own funds.  Please make a reasonable assessment bef |
| `0xf3a0f9c26abc5aa9b1a5ee4848083eaebb7792bf` | 39 | 2026-10-30 08:50:23 | `0xc2db3710a9d5bf97ff48a91a50730d02eb7f4a7e84744bb6d388bd29b02f8291` | I am the person whose wallet you hacked. You took 300,000 dollars from me, and it was everything I had. I have children who depend on me, and keeping this money will destroy my children's lives. Please return the funds t |

**Insulto o ruido:** 724 mensajes de 12 remitente(s); el principal repite un mismo texto 699 veces. Están en la hoja «Mensajes ETH-ARB».

**Peticiones de dinero:** 77 mensajes de 29 direcciones, todos con hash en la hoja.

## 2. Envenenamiento de direcciones y polvo

### 2.1 TRON

- **650 transferencias de polvo** recibidas por las billeteras del ladrón, de **616 direcciones distintas**. **633** son de menos de 0,001 TRX y **576** son exactamente 0,000002 TRX.
- Por billetera de destino: TRBdWq… reparto: 593 · TSpe5HC3… aparca el TRX: 17 · TG5iBMQ… 1.ª billetera: 13 · TPBkSj… cambia USDT por TRX: 10 · TL2F4Ghn… depósito: 5 · TKkH2vH6… depósito: 5 · TAk1xJNW… paso de 120 M: 3 · TCzBTk… USDT apartados: 2 · TCBAz7it… depósito: 1 · TJajtPqD… depósito: 1.
- Patrón: un goteo constante en `TRBdWq…` (hasta 46 por hora, más de madrugada del 31-oct), casi siempre un remitente distinto. **No imita la dirección del destinatario.** Hipótesis, no comprobada: envío masivo de «polvo» a todo el que recibe fondos grandes (marcado o rastreo de billeteras).
- **Imitaciones detectadas (últimas 4 letras iguales a otra contraparte del destinatario):**

| Hora (UTC) | Remitente (completa) | Imita a | Destinatario (completa) | TRX | Hash |
|---|---|---|---|---|---|
| 2026-10-30 05:37:33 | `TWNZzE47MBEfh315HNUSALTxp74ap1Dc9L` | TFfkcuQgDafFtgNR2UkiTd5vfxk823Dc9L (final 4, comienzo 1) | `TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki` | 0.000006 | `96ca92351c6582c922aa77c5a57e8f2468479476d0dbfe74b9dc384564e49541` |
| 2026-10-31 04:34:21 | `TMJchApzhcc9NzVHQf5vfAKzwtvYFLnNQE` | TEBCc52p1JoyExK5sri53rW7NFGNZKnNQE (final 4, comienzo 1) | `TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki` | 0.000002 | `10ca4c6fb355b53885b06784d0106832ad17a541ee332aac2cde2ce828d27d61` |

### 2.2 Ethereum y Arbitrum (confirmado)

151 transferencias de polvo o de 0 recibidas por las billeteras del botín; **15 imitan una dirección real del caso** (mismo comienzo de 4 caracteres y mismo final). Ejemplo: `0x9749f766186d9544a421f5414c92182fa50dc762` imita a `0x9749292d74fd460982d0912ea9515ea24736c762`, la intermedia de la rama de 500 M USDT. Todas:

| Hora (UTC) | Cadena | Tipo | Remitente (completa) | Imita a (completa) | Destinatario (completa) | Token | Cantidad | Hash |
|---|---|---|---|---|---|---|---|---|
| 2026-10-29 20:29:47 | ETHEREUM | ETH | `0x9749f766186d9544a421f5414c92182fa50dc762` | `0x9749292d74fd460982d0912ea9515ea24736c762` | `0x5227f603c1ee34ce3c06efe6477003bdfccb2f8c` | ETH | 1e-7 | `0xf30310e63b574218b752aa4e1286ee28034e258dfe1c1cc036010c2f65136113` |
| 2026-10-29 20:30:47 | ETHEREUM | ETH | `0x9749e7ad72c473a9f1cde042f2d633f125fdc762` | `0x9749292d74fd460982d0912ea9515ea24736c762` | `0x5227f603c1ee34ce3c06efe6477003bdfccb2f8c` | ETH | 0 | `0xf0c8cdb3de0209c3b93cd024302233c53333085e2e80f99338024224217c2ee5` |
| 2026-10-29 20:31:23 | ETHEREUM | ETH | `0x9749762465715d3cb1f142791f22a6d22e85c762` | `0x9749292d74fd460982d0912ea9515ea24736c762` | `0x5227f603c1ee34ce3c06efe6477003bdfccb2f8c` | ETH | 0.000001 | `0x3e62327927893cfe2c910ce56e59b752fd4a3d7901182e97d34930fdf993f75a` |
| 2026-10-29 20:31:23 | ETHEREUM | polvo de stablecoin | `0x9749762465715d3cb1f142791f22a6d22e85c762` | `0x9749292d74fd460982d0912ea9515ea24736c762` | `0x5227f603c1ee34ce3c06efe6477003bdfccb2f8c` | USDT | 0.01 | `0x66c2f78d8294c64e821d2bb43e4813b3e8ab148e8f4dff1b1d330b7f8c91b945` |
| 2026-10-29 20:33:59 | ETHEREUM | ETH | `0x9749e7ad72c473a9f1cde042f2d633f125fdc762` | `0x9749292d74fd460982d0912ea9515ea24736c762` | `0x5227f603c1ee34ce3c06efe6477003bdfccb2f8c` | ETH | 0 | `0x8235d06ac20ee58b9f49295e61ebcc33fc89063cc4b19a9ad6e9846c2db8d4e4` |
| 2026-10-30 02:44:35 | ETHEREUM | ETH | `0x853238219d57690e69915dee103460b2e1fe43d4` | `0x8532fa14acaf483729c449b8458aeddb900543d4` | `0x5227f603c1ee34ce3c06efe6477003bdfccb2f8c` | ETH | 0 | `0xc910e30bedc8f98798b318742c7aa5569bf6423998201168e7457b9a74b186a4` |
| 2026-10-30 04:58:23 | ETHEREUM | ETH | `0x0ddf7560bb85298a3ef27e410b2a179434e6697e` | `0x0ddf0480016e6bcb2c1f5d190d221fba1320697e` | `0x5227f603c1ee34ce3c06efe6477003bdfccb2f8c` | ETH | 1e-9 | `0x6e1fc95d14e15cbfe3d89fd844ef6b5fbe45c9a17488745bd88c441c243dc565` |
| 2026-10-30 06:44:23 | ETHEREUM | ETH | `0x0ddf7560bb85298a3ef27e410b2a179434e6697e` | `0x0ddf0480016e6bcb2c1f5d190d221fba1320697e` | `0x5227f603c1ee34ce3c06efe6477003bdfccb2f8c` | ETH | 1e-9 | `0xbd683617f7cdb5be8d394c02e7aa748b25f4d5418d8f0ea87e74418289ceb51d` |
| 2026-10-30 07:50:59 | ETHEREUM | ETH | `0x03b0179df8009b93f84483b14ad186bf080420ea` | `0x03b0ee5d82990cff1bda48651ac3e436d1a020ea` | `0x5227f603c1ee34ce3c06efe6477003bdfccb2f8c` | ETH | 0.000001 | `0x523aeced2d52d13d9eca1741acdb1c8d2731c148f43f5fccf0a183ccf1e4a210` |
| 2026-10-30 07:57:47 | ETHEREUM | ETH | `0x03b0823fe1ad2ef7b69c3c0859fc74fac56520ea` | `0x03b0ee5d82990cff1bda48651ac3e436d1a020ea` | `0x5227f603c1ee34ce3c06efe6477003bdfccb2f8c` | ETH | 0 | `0x3ab7745d276e5f23551b586846fd896a6cc816238ab0976ab2cef186ec4439a7` |
| 2026-10-31 03:36:47 | ETHEREUM | ETH | `0x03b0823fe1ad2ef7b69c3c0859fc74fac56520ea` | `0x03b0ee5d82990cff1bda48651ac3e436d1a020ea` | `0x5227f603c1ee34ce3c06efe6477003bdfccb2f8c` | ETH | 0 | `0xfaf52450be892e2ceb3dafc344a6ccc38ee0aaac0126853b542040fa6ca4d76b` |
| 2026-10-31 06:11:47 | ETHEREUM | ETH | `0x853238219d57690e69915dee103460b2e1fe43d4` | `0x8532fa14acaf483729c449b8458aeddb900543d4` | `0x5227f603c1ee34ce3c06efe6477003bdfccb2f8c` | ETH | 0 | `0x551fd5f7341b657ff99775306f9f33beda36cfbc61da52052e329d6a05159168` |
| 2026-10-31 09:13:35 | ETHEREUM | ETH | `0x853238219d57690e69915dee103460b2e1fe43d4` | `0x8532fa14acaf483729c449b8458aeddb900543d4` | `0x5227f603c1ee34ce3c06efe6477003bdfccb2f8c` | ETH | 0 | `0x0abb93d381b7b9368c2c0b46523171a46f30943111bb0abf80e1c9e5d6237f47` |
| 2026-10-31 09:13:35 | ETHEREUM | ETH | `0x0ddf7560bb85298a3ef27e410b2a179434e6697e` | `0x0ddf0480016e6bcb2c1f5d190d221fba1320697e` | `0x5227f603c1ee34ce3c06efe6477003bdfccb2f8c` | ETH | 0 | `0xbba98607848f7793c89f2c5f87355bcc02682f5603c048c8c31cf287a27d79ee` |
| 2026-10-31 09:14:47 | ETHEREUM | ETH | `0x9749e7ad72c473a9f1cde042f2d633f125fdc762` | `0x9749292d74fd460982d0912ea9515ea24736c762` | `0x5227f603c1ee34ce3c06efe6477003bdfccb2f8c` | ETH | 0 | `0xd9f59c690b1f25bb749e530e63d588a26ba6593f3257299ee84f1f29b7e387fc` |

Las otras 136 (polvo sin imitación evidente) están en la hoja «Envenenamiento ETH-ARB».

## 3. Tokens basura y falsos

### 3.1 TRON: tokens con publicidad en el nombre (TRC10) y otros

| Cadena | Id / contrato | Símbolo | Nombre | Transferencias | Remitentes | Destinatarios | Hash de ejemplo |
|---|---|---|---|---|---|---|---|
| TRON (TRC10) | `1005092` | BL | BanList | 3 | 1 | 3 | `463986b36febc7093aff64fc7368eb6973cf1633edc2769cd06b68e3dfab72a1` |
| TRON (TRC10) | `1005119` | TRC20AdsCOM | BestAdsCoin | 1 | 1 | 1 | `d778ec39d88fa504e77d3b029cd576f2cba5e3abe782731a717a5bb412f72655` |
| TRON (TRC10) | `1005182` | swapgo.io | swapgo.io | 6 | 6 | 6 | `55405d8d6bf23678c5be35aba9a03b220faaa1a9b3b4c004aa5effeef4be8182` |
| TRON (TRC10) | `1005193` | gas.bi | gas.bi | 8 | 8 | 8 | `ee135bc807d3dade3aabceb09cd424d90a61ce88920936296ec765ca21692a0c` |
| TRON (TRC10) | `1005207` | 567u.com | 567u.com | 2 | 2 | 2 | `9c26c8da6c43e39e358eb65a7b3d31e057e9100f06dd82dbaf53ea09ba51e2bd` |
| TRON (TRC10) | `1005208` | U212com | U212com | 3 | 3 | 3 | `c079dd2eb99dcfdb41d5045369c88d09dbd6853f2dad4cd71c37a7e58bdd99ab` |
| TRON (TRC10) | `1005210` | T990com | T990com | 3 | 3 | 3 | `0f8d71634e586a0325d201f503b70953263c5807fb79566d797eebc19a24f6c6` |
| TRON (TRC10) | `1005212` | TG@zapzee | SaveGasfeeOnZapzeeIO | 3 | 3 | 3 | `d41b55f7ee2a608c54117b0a468d71b9fa175ac8ad3c0212355b9897db71518f` |
| TRON (TRC20) | `TXJgMdjVX5dKiQaUi9QobwNxtSQaFqccvd` | jUSDT | JustLend USDT | 1 | 1 | 1 | `7bfbd96e4d2f79d9c143f057600a07c0ca51c60c0a358198791a36ab07d5517a` |
| TRON (TRC20) | `TF7YtqKKzgFSFv4ZbUTR3UFEv5YKRtVEp6` | TG:JF4888 | TG:JF4888 | 2 | 1 | 2 | `6d8a3b6aafd7be43854ab3c4089899769284947efd161a8fddccc3b4eb88cd48` |

- El TRC10 **1005092 «BanList»** es el que TronScan muestra como falsos «312.729.468 TRX»: lo manda un robot tres segundos después de cada bloqueo de Tether, por el importe congelado. No es TRX.
- El resto (`gas.bi`, `swapgo.io`, `567u.com`, `U212com`, `T990com`, «SaveGasfeeOnZapzeeIO», «BestAdsCoin», `TG:JF4888`) son tokens cuyo **nombre es publicidad** (webs o Telegram). El remitente de cada uno está en la hoja «Tokens basura TRON».

### 3.2 Ethereum, Arbitrum y Polygon: tokens falsos o ajenos

| Cadena | Símbolo | Nombre | Contrato (completo) | Motivo | Transferencias | Remitentes | Hash de ejemplo |
|---|---|---|---|---|---|---|---|
| POLYGON | SPEPE | Saiyan PEPE | `0xfca466f2fa8e667a517c9c6cfa99cf985be5d9b1` | origen distinto de Binance: posible airdrop/spam (revisar a mano) | 11 | 1 | `0x247f2e5251f37a9887964dd355eb3aa7e8f82abcb27c1ec2c11779d4d42feb1b` |
| ETHEREUM | ASTEROID | Asteroid Shiba | `0xf280b16ef293d8e534e370794ef26bf312694126` | origen distinto de Binance: posible airdrop/spam (revisar a mano) | 11 | 1 | `0x2aba0e039fa34c0cb42aad59aa02da777cad32b492ad6e654d5a92af131be164` |
| ARBITRUM | KELP | Kelp Hacker Shiba | `0x334a2751af0ca2e3fb5e1444a4bf254538abc4e5` | origen distinto de Binance: posible airdrop/spam (revisar a mano) | 3 | 1 | `0x7aac496dafd233c07c69d9936e02eec247ed5c8b3f1f73d137d1358b2e6cbf70` |
| ARBITRUM | KELP | Kelp Hacker Shiba | `0x625a3b8cf11f4abdc3fa3a8a225e71d88b0ced1d` | origen distinto de Binance: posible airdrop/spam (revisar a mano) | 3 | 1 | `0x9bea77c969579bf86497b4150702d87a145251d1ccc86b33cb050282f8f6a337` |
| ETHEREUM | SKY | SKY Governance Token | `0x56072c95faa701256059aa122697b133aded9279` | origen distinto de Binance: posible airdrop/spam (revisar a mano) | 3 | 1 | `0x982eb1309f20b7ef79625b485db883a040c0df338a494fb06506c01b51528edf` |
| POLYGON | POL | PỌL | `0x3838a62444fde3c846abdf9f25d47db5451417e5` | nombre con caracteres especiales | 2 | 2 | `0xff23b6b44232d974feb14dc0f2ee04896b5ce7c8878034300f680572786c574a` |
| ETHEREUM | DAI | Dai Stablecoin | `0x6b175474e89094c44da98b954eedeac495271d0f` | imita a un token conocido | 2 | 1 | `0xbe4ce2ab2bfb9d4c32d395814e965ba4514568c15f028acf7e650561fbea518f` |
| ETHEREUM | NEWT | Newton | `0xc2da8e5fde943e1da13232c2677609857c664d43` | origen distinto de Binance: posible airdrop/spam (revisar a mano) | 2 | 1 | `0xe1490b2636ebd77943cd3ac2713ba5641f142644b0e7c75120bcb7327edf93cb` |
| ETHEREUM | HOLY | Holy Labs | `0x2216848e673541199b9ce168af2b6148f2ad9247` | origen distinto de Binance: posible airdrop/spam (revisar a mano) | 2 | 1 | `0x25df24c3ded07e87d54bfdad560fe9d83e0a6458080893c45a75d87e0bcd8f01` |
| ETHEREUM | NMR | Numeraire | `0x1776e1f26f98b1a5df9cd347953a26dd3cb46671` | origen distinto de Binance: posible airdrop/spam (revisar a mano) | 1 | 1 | `0xe86ff4434877ef84a77699e732ae83ac1e461be77406a8ef03553e4ca35993b6` |
| ETHEREUM | UUU | UNetworkToken | `0x3543638ed4a9006e4840b105944271bcea15605d` | origen distinto de Binance: posible airdrop/spam (revisar a mano) | 1 | 1 | `0xdc555af185b1e01b665918b2b33ca7c71e6ebaa3fb6449e3387147f01c4bd5e2` |
| ARBITRUM | Mango | MangoSwap | `0x16290a6eadfe4c291ae8f60057632797b63c556a` | origen distinto de Binance: posible airdrop/spam (revisar a mano) | 1 | 1 | `0xc7175f4079c116d2a959fdd39a3e9ebf9e3782a84a7da383c0cfeb6edf7f586c` |
| ETHEREUM | POL | Polygon Ecosystem Token | `0x455e53cbb86018ac2b8092fdcd39d8444affc3f6` | origen distinto de Binance: posible airdrop/spam (revisar a mano) | 1 | 1 | `0x6829d6eab055e4f669a8fbbcb384d881f1a2ed69b55722f3a0fa4a511e637df7` |
| ARBITRUM | GRIMACE | GRIMACE COIN | `0x764bfc309090e7f93edce53e5befa374cdcb7b8e` | origen distinto de Binance: posible airdrop/spam (revisar a mano) | 1 | 1 | `0x5279b8a49decb5600b766e5c83d0068795066c94cb99ffee46959c41bc8e496b` |
| ARBITRUM | USDe | USDe | `0x5d3a1ff2b6bab83b63cd9ad0787074081a52ef34` | origen distinto de Binance: posible airdrop/spam (revisar a mano) | 1 | 1 | `0xc755bd6a2218ff795e0d60265da37010762e71c6c9c99b134832a1085e10e1a1` |
| ARBITRUM | AAVE | Aave Token | `0xba5ddd1f9d7f570dc94a51479a000e3bce967196` | origen distinto de Binance: posible airdrop/spam (revisar a mano) | 1 | 1 | `0x35eb8f1893b199307a98499f8a2403e89d6de6d4802eecbb20afa7a0e15ee653` |
| ETHEREUM | AIB | America is Back | `0xb3a0f70c913aa04404bd177be9e20b47613830b6` | origen distinto de Binance: posible airdrop/spam (revisar a mano) | 1 | 1 | `0xdef4a69a8708c28d82cfcab162d71ee5f7ce637c5502e85532748a094f6d0c9e` |
| POLYGON | MKT | MorroKota | `0xc5c817d007c0d1aaab4704ad48a8c07b09a61ad5` | origen distinto de Binance: posible airdrop/spam (revisar a mano) | 1 | 1 | `0xa0f64081a5079ca9325678251840716f07a40ad54b9efc06d3bc95b2ffb11ef6` |
| ETHEREUM | BTE | Bitreum | `0x51dd8687ecc330e337e62acbf931dc251802ffff` | origen distinto de Binance: posible airdrop/spam (revisar a mano) | 1 | 1 | `0x06e2b3316b5c5dc83358a58dfce6664cb77b8a399c49e27a4ee861f7224e1565` |
| ETHEREUM | ETH | ETH | `0x0923a3c1c705cd1ecda3d5c4e8c91d395d02f4db` | imita a un token conocido | 1 | 1 | `0x4607d87c498c2191d7d2470b6498f3477b99b37ce5ba37bebaf2512b6cd4d027` |
| ETHEREUM | ZKP | zkPass | `0xe1be424f442d0687129128c6c38aace44f8c8dbc` | origen distinto de Binance: posible airdrop/spam (revisar a mano) | 1 | 1 | `0x564e277c5a7c0940fa2334d08c3922796378fcca1ff57fe7b7a3a3add17cced8` |
| ETHEREUM | ROBO | Robo Token | `0x32b4d049fe4c888d2b92eecaf729f44df6b1f36e` | origen distinto de Binance: posible airdrop/spam (revisar a mano) | 1 | 1 | `0x4be8cb97de7032c59c128c1623799031327bffa5db7b133cc0381061f94f099f` |
| ETHEREUM | PUNDIX | Pundi X Token | `0x0fd10b9899882a6f2fcb5c371e17e70fdee00c38` | origen distinto de Binance: posible airdrop/spam (revisar a mano) | 1 | 1 | `0xc28f859d029ce118016d360b9940b509df4e8645af72a0b935a659d467b42666` |
| ETHEREUM | BLUR | Blur | `0x5283d291dbcf85356a21ba090e6db59121208b44` | origen distinto de Binance: posible airdrop/spam (revisar a mano) | 1 | 1 | `0xb1482d2a3ebe8d34f8b404eb902e35d24016ab606ebdb6989bb71f4ea1aa554b` |
| ETHEREUM | CTSI | Cartesi Token | `0x491604c0fdf08347dd1fa4ee062a822a5dd06b5d` | origen distinto de Binance: posible airdrop/spam (revisar a mano) | 1 | 1 | `0xe6c317881432c66e15cab516594e04e247ec556c62b99b2973f51e710393b4f3` |
| ETHEREUM | EURI | EURITE | `0x9d1a7a3191102e9f900faa10540837ba84dcbae7` | origen distinto de Binance: posible airdrop/spam (revisar a mano) | 1 | 1 | `0x4722b956734497458d7747edd434eed204d1b444832715e6d25d77aa57e60579` |
| ETHEREUM | DAR | Dalarnia | `0x081131434f93063751813c619ecca9c4dc7862a3` | origen distinto de Binance: posible airdrop/spam (revisar a mano) | 1 | 1 | `0x3b212710bf742316e4ffb2ac03804c125d9e4786b2a52d344c7b44d1cb5bbb3d` |
| ETHEREUM | SIMP | Simple Token | `0x0ef2346003cfe35022a16da4cd8ed2c8980f2b59` | origen distinto de Binance: posible airdrop/spam (revisar a mano) | 1 | 1 | `0x17f6de59237a5866f5beab083a5e6f919daab5b9820bd8558d992f32154efa87` |
| ETHEREUM | INNBC | InnovativeBioresearchCoin | `0xb67718b98d52318240c52e71a898335da4a28c42` | origen distinto de Binance: posible airdrop/spam (revisar a mano) | 1 | 1 | `0xa86cc8e528d538ea461ef6de71c6c6d18ff4d734508f27213f84268978885a2e` |
| ETHEREUM | OVER | over.computer | `0x743f1b0291a490b924ffcfe8508af2a9ac1a6552` | origen distinto de Binance: posible airdrop/spam (revisar a mano) | 1 | 1 | `0x39998b01a1cad19364e18d3e8890a4f7d6addb3110b72bd08b0575fbbbc2c4c9` |

**«Origen distinto de Binance»** significa que el token no llegó de Binance 14/16 ni del emisor de USDC; puede ser airdrop/spam o una devolución de una billetera auxiliar. Revisar a mano. Los claramente falsos (imitan a DAI o ETH, o llevan caracteres invisibles) están marcados como tales.

## 4. Contratos inteligentes (nombre, dirección completa y qué hacen)

### 4.1 TRON (36 con nombre; los 177 sin nombre público están en la hoja)

| Nombre | Tipo | Qué hace | Dirección completa | Envíos del rastreo |
|---|---|---|---|---|
| USDT0 (OFT, emisor en TRON, formato hex) | contrato / token | dirección del emisor según LayerZero Scan | `0x3a08f76772e200653bb55c2a92998daca62e0e97` |  |
| BWSwapRouterV1 | intercambio | enrutador / pool de intercambio (neutral en el rastreo) | `TTu9T4ff4zvNPz1dfAd36gUeB3xJgYz4G9` | 1561 |
| CrossProxy | intercambio | contrato sin nombre público | `TZ9grqg3LwBKiddGra3WGHPdddJz3tow8N` | 3 |
| Forwarder | intercambio | contrato sin nombre público | `TBi8XGPurxQAwjNQsPVJxdXAeiFMCdvvgv` | 1 |
| MetaRouterGateway | intercambio | enrutador / pool de intercambio (neutral en el rastreo) | `TPuaJ6gnYfE9gLUDFrbWbPx3tMnjG8max1` | 305 |
| MoolahProxy | intercambio | contrato sin nombre público | `TDH4dhmVQQNc1ZNudJwWzBcs2h6ahhWrpp` | 0 |
| MulticallRouterV2 | intercambio | enrutador / pool de intercambio (neutral en el rastreo) | `TYmb1NaNsehpXcsnV19zpAcZ56V4k1NLJ9` | 0 |
| None | intercambio | contrato sin nombre público | `TPSzwHR6UmSr3f4p7hYfxQ2C6yLyX73wWG` | 2 |
| OnchainGateway | intercambio | contrato sin nombre público | `TMviNfNmwfefUXdhGQaDzbo5NiEVTZTqHM` | 5 |
| PayoutBufferV5 | intercambio | contrato sin nombre público | `TFDUbKniPoo9Aoq3HivkZrwQsyy7aiW1W5` | 5 |
| PoolManager | intercambio | enrutador / pool de intercambio (neutral en el rastreo) | `TVjuTE3V5bMVdpfNhid8kD2v35T2k1u1Br` | 7 |
| SmartExchangeRouter | intercambio | enrutador / pool de intercambio (neutral en el rastreo) | `TGnC7LMji8hBpyvZt1TTEJhVpAZ5HFyJ3r` | 204 |
| SmartExchangeRouter | intercambio | enrutador / pool de intercambio (neutral en el rastreo) | `TCFNp179Lg46D16zKoumd4Poa2WFFdtqYj` | 79 |
| SwapRouter | intercambio | enrutador / pool de intercambio (neutral en el rastreo) | `TQAvWQpT9H916GckwWDJNhYZvQMkuRL7PN` | 13 |
| Sweeper | intercambio | contrato sin nombre público | `TFN9NMkaAAAWVnzqaZgqcgrjgZTBZkQsBC` | 7 |
| TransparentUpgradeableProxy | intercambio | contrato sin nombre público | `TD4tamFrCq7KvQEB1LArNXr9sKFC6GaAmt` | 0 |
| TransparentUpgradeableProxy | intercambio | contrato sin nombre público | `TJpMjCCA1wAVKLp6T3eRoZiB8reVAdDvaQ` | 5 |
| TransparentUpgradeableProxy | intercambio | contrato sin nombre público | `TT3kgJohTQJNKDUWwTxtRDMHNNWNvNG3i4` | 1 |
| TronExecutor | intercambio | contrato sin nombre público | `TXAoBBkDirBUP74n9x8kj1P3dwCe3Ce4wG` | 0 |
| TronUsdt0Source | intercambio | contrato sin nombre público | `TNjbTbdRy6jwY5TPcWjherhc8jriz8SFDa` | 1 |
| UniswapV2Router02 | intercambio | enrutador / pool de intercambio (neutral en el rastreo) | `TKzxdSv2FZKQrEqkKVgp5DcwEXBEKMg2Ax` | 0 |
| UniversalRouter | intercambio | enrutador / pool de intercambio (neutral en el rastreo) | `TQqgNg13s2DjvXhW1ky4v6TsR8wZGvb7Y4` | 1139 |
| UpgradableProxy | intercambio | contrato sin nombre público | `TXejU9jmd1ooQyY3Zmpo15yN7MjSFYUESg` | 1 |
| Vault | intercambio | contrato sin nombre público | `TEcDijvKSXcfWT7S6rd44H5vNgufm7Y4XC` | 9 |
| Warm | intercambio | contrato sin nombre público | `TXQ71oFT9BmG6DE3tbe9zVm3KvMtLDFLKT` | 4 |
| WTRX | intercambio | contrato sin nombre público | `TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR` | 0 |
| CErc20Delegator | préstamo | mercado de préstamos JustLend (USDT) | `TXJgMdjVX5dKiQaUi9QobwNxtSQaFqccvd` | 124 |
| Bridgers | puente | puente Bridgers | `TJ4KeiGTvTX4wRUgLARiwr8rGLaurmVkdZ` | 18 |
| BridgersSwap | puente | puente Bridgers | `TSVLdWvSWK2z8uQ1P1kwGvNLvLvwNRb15Y` | 3 |
| BridgersSwap | puente | puente Bridgers | `TRmmbf5ubQvHnMsazNKPEoJyj9acBP6KbY` | 1 |
| BridgersSwap | puente | puente Bridgers | `TGKCgwjZo3QajwUASFHVWusJyZy7ESiMBZ` | 1 |
| OftBridge | puente | puente OFT | `TWPziSAroSacAjDuL52ByQzU86s9mP2gPr` | 1 |
| RangoDiamond | puente | puente / agregador Rango («TrustWallet») | `TYWc7X6YHpp2YrFXwLRsofdiL78JRvDd6u` | 21 |
| UsdtOFT | puente | puente USDT0 / LayerZero | `TFG4wBaDQ8sHWWP1ACeSGnoNR6RRzevLPt` | 156 |
| Tether USD (USDT) | token | contrato del USDT en TRON (bloqueos AddedBlackList) | `TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t` |  |
| AuthGemJoin5 | USDD | módulo de estabilidad USDD (PSM) | `TSUYvQ5tdd3DijCD1uGunGLpftHuSZ12sQ` | 0 |

### 4.2 Ethereum y Arbitrum

| Cadena | Nombre | Qué hace | Dirección completa |
|---|---|---|---|
| ARBITRUM | USD₮0 (token en Arbitrum) | USDT0 en Arbitrum | `0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9` |
| ETHEREUM | PoolManager | enrutador / pool de intercambio (neutral en el rastreo) (destino de las direcciones del puente) | `0x000000000004444c5dc75cb358380d2e3de08a90` |
| ETHEREUM | UniswapV3Pool | enrutador / pool de intercambio (neutral en el rastreo) (destino de las direcciones del puente) | `0x56534741cd8b152df6d48adf7ac51f75169a83b2` |
| ETHEREUM | sin verificar | contrato sin nombre público (destino de las direcciones del puente) | `0xd3d5abbd6dd40b69ca365ae45f1ffd3870b1ddf9` |
| ETHEREUM | UniswapV3Pool | enrutador / pool de intercambio (neutral en el rastreo) (destino de las direcciones del puente) | `0x11b815efb8f581194ae79006d24e0d814b7697f6` |
| ETHEREUM | sin verificar | contrato sin nombre público (destino de las direcciones del puente) | `0xf3c2de39a77b0966cedccfdfb4de0a22dcc416b8` |
| ETHEREUM | THORChain_Router | enrutador / pool de intercambio (neutral en el rastreo) (destino de las direcciones del puente) | `0xd37bbe5744d730a1d98d8dc97c42f0ca46ad7146` |
| ETHEREUM | sin verificar | contrato sin nombre público (destino de las direcciones del puente) | `0x082738d007001080a00099a000004f3006152085` |
| ETHEREUM | sin verificar | contrato sin nombre público (destino de las direcciones del puente) | `0x8f10b468b06c6fd214b65f87778827f7d113f996` |
| ETHEREUM | sin verificar | contrato sin nombre público (destino de las direcciones del puente) | `0x111116058b9828cdcdd810c502b925c14f34ca11` |
| ETHEREUM | Permit2Proxy | contrato sin nombre público (destino de las direcciones del puente) | `0x8eed5e28216c0bc6f817df40ae6ca11c2294cc1c` |
| ETHEREUM | sin verificar | contrato sin nombre público (destino de las direcciones del puente) | `0x006d0e0d006109f0020f3050000a713780b7b000` |
| ETHEREUM | UniswapV3Pool | enrutador / pool de intercambio (neutral en el rastreo) (destino de las direcciones del puente) | `0xc7bbec68d12a0d1830360f8ec58fa599ba1b0e9b` |
| ETHEREUM | GPv2Settlement | contrato sin nombre público (destino de las direcciones del puente) | `0x9008d19f58aabd9ed0d60971565aa8510560ab41` |
| ETHEREUM | GenericSwapExecutor | contrato sin nombre público (destino de las direcciones del puente) | `0xf99f08f69f45541222429aec99315630639bd81b` |
| ETHEREUM | sin verificar | contrato sin nombre público (destino de las direcciones del puente) | `0xdacb42fccbc859a64a2f362d1b6723847dac1cbd` |
| ETHEREUM | UniswapV3Pool | enrutador / pool de intercambio (neutral en el rastreo) (destino de las direcciones del puente) | `0x4e68ccd3e89f51c3074ca5072bbac773960dfa36` |
| ETHEREUM | RelayRouter | enrutador / pool de intercambio (neutral en el rastreo) (destino de las direcciones del puente) | `0x0729e2a4716d9f7dd17858d5d504426d228697f7` |
| ETHEREUM | RelayDepository | contrato sin nombre público (destino de las direcciones del puente) | `0x4cd00e387622c35bddb9b4c962c136462338bc31` |
| ETHEREUM | SwapEscrowV7 | contrato sin nombre público (destino de las direcciones del puente) | `0x9791f20407fcd8e36c53d456e94d05cd724bac2c` |
| ETHEREUM | SwapEscrowV7 | contrato sin nombre público (destino de las direcciones del puente) | `0x538fdaf80df94528898d99a5b3e98d1b601d7f04` |
| ETHEREUM | SwapEscrowV7 | contrato sin nombre público (destino de las direcciones del puente) | `0x87865cc833784e58b9dfe97f06c8ee525d9410db` |
| ETHEREUM | UniswapV3Pool | enrutador / pool de intercambio (neutral en el rastreo) (destino de las direcciones del puente) | `0xe0554a476a092703abdb3ef35c80e0d76d32939f` |
| ETHEREUM | UniswapV3Pool | enrutador / pool de intercambio (neutral en el rastreo) (destino de las direcciones del puente) | `0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640` |
| ETHEREUM | sin verificar | contrato sin nombre público (destino de las direcciones del puente) | `0xb03f746f7ccb513cd67358d1b1941f59be17a7c2` |
| ETHEREUM | sin verificar | contrato sin nombre público (destino de las direcciones del puente) | `0xffe0f681bf17cf1d4fd1b259eb134668175f67ae` |
| ETHEREUM | sin verificar | contrato sin nombre público (destino de las direcciones del puente) | `0xff4d068fc68ed2082c9667b72b7fddfddf7d4783` |
| ETHEREUM | THORChain_Router | router de THORChain en Ethereum: el memo dice la cadena y dirección de destino | `0xd37bbe5744d730a1d98d8dc97c42f0ca46ad7146` |
| ETHEREUM | USDT0 (OFT, receptor en Ethereum) | contrato de LayerZero que acredita el USDT0 de los envíos desde TRON | `0x1f748c76de468e9d11bd340fa9d5cbadf315dfb0` |
| ETHEREUM | Tether USD (USDT) | token USDT en Ethereum | `0xdac17f958d2ee523a2206206994597c13d831ec7` |
| ETHEREUM | USD Coin (USDC) | token USDC en Ethereum (Circle) | `0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48` |
| ETHEREUM | Wrapped Ether (WETH) | token WETH | `0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2` |
| ETHEREUM | USDT0 (token en Ethereum) | USDT0 de Tether en Ethereum | `0x6c96de32cea08842dcc4058c14d3aaad7fa41dee` |

## 5. Casas de cambio (billeteras con dirección completa)

| Cadena | Casa | Dirección completa | Tipo | Para qué aparece | Fuente |
|---|---|---|---|---|---|
| TRON | Bybit | `TU4vEruvZwLLkSfV9bNw12EJTPvNr7Pvaa` | billetera caliente | recibe dinero del recorrido (tramo 2, atribuido; hoja Llegadas a casas) | etiqueta pública de TronScan |
| TRON | OKX Hot Wallet 8 | `TLaGjwhvA8XQYSxFAcAXy7Dvuue9eGYitv` | billetera caliente | recibe dinero del recorrido (tramo 2, atribuido; hoja Llegadas a casas) | etiqueta pública de TronScan |
| TRON | Gate | `TBA6CypYJizwA9XdC7Ubgc5F1bxrQ7SqPt` | billetera caliente | recibe dinero del recorrido (tramo 2, atribuido; hoja Llegadas a casas) | etiqueta pública de TronScan |
| TRON | Kucoin 4 | `TUpHuDkiCCmwaTZBHZvQdwWzGNm5t8J2b9` | billetera caliente | recibe dinero del recorrido (tramo 2, atribuido; hoja Llegadas a casas) | etiqueta pública de TronScan |
| TRON | Bitget 9 | `TJ7hhYhVhaxNx6BPyq7yFpqZrQULL3JSdb` | billetera caliente | recibe dinero del recorrido (tramo 2, atribuido; hoja Llegadas a casas) | etiqueta pública de TronScan |
| TRON | MXC | `TEPSrSYPDSQ7yXpMFPq91Fb1QEWpMkRGfn` | billetera caliente | recibe dinero del recorrido (tramo 2, atribuido; hoja Llegadas a casas) | etiqueta pública de TronScan |
| TRON | Kraken: Hot Wallet | `TG2CMGxnTPgQ6V58kiKd7wbyN8ewtAmY76` | billetera caliente | recibe dinero del recorrido (tramo 2, atribuido; hoja Llegadas a casas) | etiqueta pública de TronScan |
| TRON | Binance-Hot 7 | `TDqSquXBgUCLYvYC4XZgrprLK589dkhSCf` | billetera caliente | ORIGEN del robo en TRON | etiqueta pública de TronScan |
| TRON | Binance-Cold 2 | `TWd4WrZ9wn84f5x1hZhL4DHvk738ns5jwb` | billetera fría | recibe lo que queda de Hot 7 desde las 22:57 UTC del 29-oct | informe del 30-oct |
| ETHEREUM | Binance 14 | `0x28c6c06298d514db089934071355e5743bf21d60` | billetera caliente | ORIGEN del robo en Ethereum (3 barridos); Tether la bloquea a las 22:06:39 | etiqueta de la comunidad de Etherscan (confianza baja) |
| ETHEREUM | Binance 16 | `0xdfd5293d8e347dfe59e90efd55b2956a1343963d` | billetera caliente | ORIGEN del robo en Ethereum (8 transacciones) | etiqueta de la comunidad de Etherscan (confianza baja) |

**Llegadas atribuidas al robo (estimación).** Cada envío con su remitente y su hash está en la hoja «Llegadas a casas (atribuidas)»:

| Casa | Envíos | Robo estimado (USD) |
|---|---|---|
| Bybit | 87 | 2.214.736 |
| OKX Hot Wallet 8 | 120 | 954.597 |
| Gate | 19 | 736.791 |
| Kucoin 4 | 6 | 135.033 |
| Bitget 9 | 9 | 84.654 |
| MXC | 6 | 22.257 |
| Kraken: Hot Wallet | 2 | 5456 |

## 6. Bloqueos de Tether

### 6.1 Ethereum (con hash)

| Hora (UTC) | Dirección bloqueada (completa) | Qué es | Destino del puente | Hash |
|---|---|---|---|---|
| 2026-10-29 21:01:35 | `0x5227f603c1ee34ce3c06efe6477003bdfccb2f8c` | dirección del ladrón 0x5227…2f8c | no | `0x7baba482077843514d9c72bac0110ba0916b0814288a72917e2c3bb27a9d8659` |
| 2026-10-29 21:01:35 | `0x9749292d74fd460982d0912ea9515ea24736c762` | intermedia de la rama de 500 M USDT | no | `0x64a3f49742f4daf1d33b5440cb90bbc13de93bf53f00f5532d6e67967cb1b7de` |
| 2026-10-29 21:01:47 | `0x0ddf0480016e6bcb2c1f5d190d221fba1320697e` | intermedia de la rama de 200 M USDT | no | `0xdb6b11fe4bad377b6945379d8fb0d0b642d3ca1ea366e1e8628e79e77ee0b0f3` |
| 2026-10-29 21:02:47 | `0x8d53903625b8e839b9df4bd28b0efb1cd6b8639a` | sin identificar | no | `0xe48d47c64d9aebbdc2eb17161edbb430841490ee05141d902c3d11032b5dcff4` |
| 2026-10-29 21:12:35 | `0x7aa4d3029e4c6a8e916300014ad95b6d6c03bfd1` | sin identificar | no | `0x28836ef9e83de713b00290cd6336d8296737f2b912de59dca56a149eab258be0` |
| 2026-10-29 21:14:59 | `0xaa246bf639586a6ba46762d378ce50ca4fc654a0` | intermedia con 175 M USDT congelados | no | `0x0c07a5e428ce233a3bcb40f257ad899594421341d63ce94016822063362707bf` |
| 2026-10-29 21:16:47 | `0xccbef95633adb5cd2b5038db5a38d77e726ca263` | sin identificar | no | `0x3c08d84087d7fc14d8f2b35edea7abe3eae4deaedb1e616796ecc487dfdddc47` |
| 2026-10-29 21:18:59 | `0xb171ca86f82070282138352ff7111b494060c8c3` | intermedia con 30 M USDT congelados | no | `0x3445389c8aceb50fe1c155a1208f7289cc8f7f5950139e21dc405333d1aedc93` |
| 2026-10-29 22:06:23 | `0x28c6c06298d514db089934071355e5743bf21d60` | Binance 14 (origen del robo) | no | `0x312e166cb9e602582f426288f755a4b08e1eddb456b7e4bd614adae11080d305` |
| 2026-10-30 13:36:23 | `0xed17ca397ac96f55ea8f2f626a5ff1af0086bd7a` | DESTINO DEL PUENTE USDT0 desde TRON | SÍ | `0x805385f43d77b6a24af76fe6ba007caf486fe587383498d7cedecfc377b078d7` |
| 2026-10-30 13:36:35 | `0x47b4b212de6612d9c4f8ff48133fc9a90697f15f` | posible envenenador: mueve el token falso «U⁯S⁯DΤ» el 30-oct (no consta que enviara a las billeteras del ladrón) | no | `0xc12e13650b57239e32db7fe304094887fa037583a6c9e1b431a5f91e723288fe` |

- **Hallazgo:** `0xed17ca397ac96f55ea8f2f626a5ff1af0086bd7a`, una de las direcciones a las que llega el dinero de TRON por el puente USDT0, fue **bloqueada por Tether el 30-oct a las 13:36:23 UTC** (tenía ≈ 206.000 $ de stablecoins). Es el único bloqueo posterior a la primera noche que coincide con las direcciones del puente.
- Firmante y multifirma del primer bloqueo: `0xac3b242e2e561da9f4ce34746e67d004e6341fa0` → `0xc6cde7c39eb2f0f0095f41570af89efc2c1ea828`.

### 6.2 TRON

**67 bloqueos** (hoja «Bloqueos Tether TRON», con la dirección y el hash de cada evento). Los tres del robo: `TG5iBMQPrDzJJAUM8GMVBf1hRaJ1wvzsGi` (`71b0ec0fe873fe820c37cc3ecbab4e83087f87e833d191012a0a4027d20594e1`), `TPBkSjkCMn2ckrMuAP8n2J1jdjbw76bKN4` (`bc4e4a76bd262307a4d005d9745e2e8cf3bfe7d38e2ae4d5fcfaa40376721f40`) y `TCzBTkqn66yApqbYoPezaEQosM5DAd7Y62` (`176a5783fd70f5abbae9569f60398afe5307eefa9d06982ae5a9351e2cbc0f13`).

## 7. Tokens del botín (resumen; todos en la hoja «Tokens»)

La hoja lista **133 tokens** (66 del botín en Ethereum/Arbitrum/Polygon, el resto ajenos o falsos), con contrato completo y cantidades recibidas y enviadas. En TRON: TRX y USDT (`TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t`).

## 8. Catálogo de direcciones (hoja «Direcciones»)

**2074 direcciones** en total, cada una con categoría, nombre o etiqueta, notas y fuente. Por categoría:

| Categoría | Direcciones |
|---|---|
| Polvo de terceros | 683 |
| Nodo de servicio | 491 |
| Contrato inteligente | 244 |
| Receptor de TRBdWq… | 154 |
| Remitente a casa de cambio (bruto) | 130 |
| Remitente de mensajes | 64 |
| Bloqueada por Tether | 63 |
| Remitente de tokens basura/falsos | 46 |
| Destino del puente USDT0 | 41 |
| Remitente a puente | 40 |
| Destino de Bridgers | 13 |
| Destino del puente USDT0 + Usa THORChain (dirección de destino del puente) | 11 |
| Remitente a puente + Destino TRON de THORChain | 11 |
| Envenenador (imita una dirección real) | 9 |
| Remitente de mensajes + Polvo de terceros | 9 |
| Ladrón Ethereum | 8 |
| Casa de cambio | 7 |
| Ladrón TRON | 7 |
| Auxiliar vendedora | 5 |
| Bloqueada por Tether + Intermedia congelada | 5 |
| Nodo de servicio + Remitente a casa de cambio (bruto) | 5 |
| Polvo de terceros + Remitente de tokens basura/falsos | 3 |
| Receptor de TRBdWq… + Remitente a puente | 3 |
| Binance (origen) | 2 |
| Vendedora a Consolidación C | 2 |

## 9. Todas las hojas del libro

| Hoja | Filas |
|---|---|
| Bloqueos Tether TRON | 67 |
| Destinos finales tramo 1 | 2020 |
| Destinos finales tramo 2 | 2585 |
| Llegadas a casas (atribuidas) | 249 |
| Llegadas brutas vigilante | 282 |
| Reparto TRBdWq | 742 |
| Puentes USDT0 (LayerZero) | 186 |
| Puentes Bridgers-Rango-otros | 53 |
| THORChain (Ethereum→TRON) | 1600 |
| Transacciones clave | 42 |
| Bloqueos Tether ETH | 11 |
| Contratos inteligentes | 246 |
| Casas de cambio | 11 |
| Mensajes TRON | 7 |
| Mensajes ETH-ARB | 896 |
| Envenenamiento TRON | 650 |
| Envenenamiento ETH-ARB | 151 |
| Tokens basura TRON | 32 |
| Tokens falsos ETH-ARB | 60 |
| Tokens | 133 |
| Direcciones | 2074 |
