# Cruces de cadena del robo a Binance: método y límites (2-nov-2026)

Este documento explica, sin tecnicismos innecesarios, **cómo se ha averiguado a dónde va el dinero que sale de TRON por puentes y cambiadores**, qué es demostrable y qué es deducción. Las cifras definitivas están en el informe de trazabilidad (`blockchain-investigator/state/informe-trazabilidad/`); aquí solo está el método.

## Regla general de los estados
- **VERIFICADO**: hay evidencia directa que se puede contrastar (una transacción, una lectura de la cadena).
- **ESTIMADO**: sale de un modelo declarado (reparto proporcional, emparejamiento por importe y hora, precio de la hora).
- **DESCONOCIDO**: no hay datos públicos que lo aclaren; se dice por qué.

## 1. Symbiosis (contrato MetaRouterGateway `TPuaJ6gn…`)
1. El evento del portal dice que el dinero pasa a la cadena **13.863.860, que es la cadena propia de Symbiosis** (paso intermedio, no un destino desconocido; lo confirma `api.symbiosis.finance/crosschain/v1/chains`).
2. La **cadena final** se lee de los datos de la propia llamada (`metaRoute` → `metaSynthesize` → `metaBurnSyntheticToken`, campo `chainID`). Se decodifica la estructura; si no cuadra, la transacción se marca «no decodificable» (hubo 0 de 1.009). Script: `scripts/decodificar-metarouter-destino.cjs`.
3. La **llegada** (hash, receptor, activo, importe) sale de `api.symbiosis.finance/crosschain/v1/tx/728126428/<hash>`. El remitente que da la API coincide con la billetera del rastreo en todos los envíos. Script: `scripts/symbiosis-llegadas.cjs`.
4. Cada llegada a Ethereum/Arbitrum se **comprueba en Etherscan** (el receptor aparece con ese hash e importe, ±0,5 %). Script: `scripts/verificar-llegadas-evm.cjs`.
5. Un cruce **revertido** no es un destino: su recibo es la devolución en la cadena de origen.

## 2. Chainflip (bóveda `TEcDijvK…` en TRON)
- Los contratos «Vault» y los «CreatedByContract» son la bóveda de Chainflip y sus **canales de depósito** (un contrato por cambio; las llamadas `allBatch` llevan `swapID` y firma de grupo).
- El explorador público (`explorer-service-processor.chainflip.io/graphql`) da, por dirección de canal, los cambios y su destino; la API `chainflip-swap.chainflip.io/v2/swaps/<id>` da el hash del depósito y de la salida y los reembolsos. Scripts: `chainflip-destinos.cjs`, `chainflip-llegadas.cjs`.
- **Los canales se reutilizan y reciben depósitos de otras personas**: solo cuentan los cambios cuyo hash de depósito es una salida de una billetera del recorrido («nuestro»).
- **Reembolsos**: un cambio puede devolverse en TRON (entero o en parte); es un recibo en TRON, no un destino.
- **Relevos (inferencia, ESTIMADO)**: un depósito en un canal que NO tiene cambio registrado y al que la bóveda responde en minutos con un pago de USDT de importe = depósito − una comisión casi fija (la regla acepta 7,15–7,25 USDT; se reparte entre pagos y depósitos uno a uno, ventana −2 min … +3 h). Los canales que solo reenvían a la bóveda no cuentan como depósito aparte. No existe referencia de transacción que lo demuestre. Script: `research/auditoria-adversarial-2026-10-31/completar-relevos-chainflip.cjs`. El rastreador sigue a la billetera que cobra (`via: 'relevo'`).
- El circuito completo se repite hasta que no aparecen canales ni relevos nuevos: `iterar-chainflip.sh <tramo>`.

## 3. Across (ejecutor `TANdmAmc…`) y prefinanciados
- La API de estado de Across (`app.across.to/api/deposit/status`) da, por hash de depósito, la cadena de destino y el hash de la llegada; el evento `FilledRelay` del recibo da el receptor. Script: `across-llegadas.cjs`.
- Todos los envíos llegan a **un único contrato «Executor»** de Ethereum (nombre verificado en Etherscan, `across-receptores.json`) que ejecuta el siguiente paso con instrucciones cifradas: el rastro termina ahí (servicio, no destino final).
- Los depósitos «prefinanciados» (`store(witness, token, amount)`) se ejecutan en transacciones aparte sin referencia al depósito: su destino es DESCONOCIDO.

## 4. Seguimiento hacia adelante en Ethereum
- Semillas: receptores de Symbiosis y destinos de Chainflip del recorrido. Script: `rastrear-eth-adelante.cjs` (resultado `eth-adelante-v2.json`).
- Se lee **una vez** el historial completo de cada billetera y se guardan todas sus salidas con su hora. **Una salida solo se sigue si ocurre después de la primera entrada trazada a esa billetera** (menos 1 h); esa primera entrada baja si se descubre un camino más temprano, y se vuelve a evaluar lo ya leído.
- Cierra en contratos (se anota su nombre), billeteras de uso muy alto (nonce > 1.000) y billeteras sin salidas (quietas, con saldo de hoy). Envíos menores de 0,5 ETH se suman como «polvo».
- **Reparto proporcional** (como la «pureza» de TRON): pureza = entrada trazada / (lo que saca desde su primera entrada + su saldo de hoy), tope 1. Conserva el total: nada de lo trazado supera lo que llegó por los cruces. Lo que no se explica se muestra como diferencia, sin ajustarlo.

## 5. Lo que queda DESCONOCIDO y por qué
- Depósitos en Chainflip sin cambio registrado ni pago que cuadre: el explorador no los registra y la bóveda no publica qué hizo con ellos.
- Across: instrucciones cifradas tras el «Executor» y prefinanciados.
- Enrutadores de cambio (BWSwap, SmartExchange, UniversalRouter…) cuya salida no se decodifica.
- Posiciones DeFi en contratos propios sin verificar.
- Bridgers (importe pequeño): no hay consulta pública por hash.

## 6. Lecciones de la revisión adversarial (revisor Claude independiente; Codex sin créditos)
- Un canal que reenvía a la bóveda es el segundo tramo del mismo dinero: no se cuenta dos veces.
- Las salidas de una billetera anteriores a la primera entrada trazada no son del robo (esto reducía a 4 ETH una diferencia de 364 ETH).
- Un reembolso de Chainflip no es un «cambio hecho».
- Las etiquetas VERIFICADO/ESTIMADO se leen del dato, no se escriben a mano.
