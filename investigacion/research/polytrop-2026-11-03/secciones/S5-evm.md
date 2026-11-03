# S5 · Las direcciones EVM del CSV de Polytrop que no teníamos (lectura completa)

Guion: `guiones/polytrop-evm-completo.cjs` (Etherscan v2, solo Ethereum; BNB Chain no está en el plan gratuito). Resultado: `datos/polytrop-evm-completo.json` (1.588 direcciones: 1.552 «source» y 36 «flagged»). **Esta sección no ha pasado por Codex.**

## Hechos medidos (lectura del 3-nov)
- 1.586 de las 1.588 tienen actividad en Ethereum; 9 alcanzan el tope de lectura de 100 transacciones.
- 497 conservan hoy más de 0,01 ETH; suman **30.138 ETH** (≈ 68 M$ al precio de ETH que usa el informe, ≈ 2.274 $). USDT: 0; USDC: 1 $. No se leyeron otros tokens ni otras redes (Arbitrum y Polygon dieron 0 en una muestra de 32).
- Mayores saldos: 623, 596, 565, 536, 349, 259, 258 y 224 ETH.
- Primera operación: en la mayoría es un ingreso de ETH desde otra billetera; se identifican 309 direcciones distintas que financian a las demás. 208 de esas 309 están en la propia lista de Polytrop y solo 1 está entre las 584 direcciones de nuestro seguimiento de Ethereum.

## Lectura
- Esta parte de Polytrop (cientos de billeteras con ETH sin mover) es casi disjunta de lo nuestro: nosotros seguimos en Ethereum lo que llegó por puentes (584 direcciones) más 8 cuentas vigiladas; Polytrop lista un árbol de reparto de ETH entre unas 1.900 billeteras creadas el 30–31 de octubre.
- Comparación de magnitud: nuestras 7 billeteras principales conservan ≈ 515 mil ETH y nuestras 113 billeteras de puentes ≈ 9.400 ETH; estas 497 suman ≈ 30 mil ETH.

## Límites
- «Source/flagged» sigue siendo una deducción; que una dirección esté en la lista de Polytrop no demuestra por sí solo que su dinero sea del robo (la web de Polytrop no lo documenta).
- El saldo es de la fecha de lectura; el ETH puede haberse movido después.
