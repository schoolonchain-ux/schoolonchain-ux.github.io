# Inventario de los datos extraídos para el libro mayor (2-nov-2026)

Origen: revisión de solo lectura de `research/binance-0x5227-2026-10-30/` (B), `research/auditoria-adversarial-2026-10-31/` (A), los vigilantes, `tether-blacklist/state/` y los informes. Las cifras y fechas son las que encontró la revisión; **las incoherencias y los huecos de abajo son hechos a resolver antes de que el libro cuadre**.

## 1. Qué fuente alimenta cada parte del libro

| Parte del libro | Fuente principal | Cobertura / corte | Nota |
|---|---|---|---|
| Capital inicial y custodia (robo en Binance Hot 7) | `B/tron/trongrid-trc20-BinanceHot7-29oct.json`, `trc20-/txs-` de TG5iBMQP, TPBkSjkC, TCzBTkqn, TSpe5HC3 | 29-oct 19:00 → 30-oct 11:13 UTC | Hot 7 solo cubre la tarde-noche del 29-oct |
| Reparto de TRBdWq (saltos billetera→billetera, TRON) | `A/tramo5/tramo5-cache.json` + `semillas.json` (733 envíos, 190,2 M$); antes de la foto `B/tron/traza-cache.json` (379 envíos) | tramo 5: corte 2-nov 09:23 UTC | los tramos NO son aditivos (semillas y cortes distintos) |
| Capital y caja del reparto, verificado en cadena | `A/resultados/balance-semilla.json` | foto 30-oct 22:40 → 2-nov 09:23 UTC | entra 518.200.903 TRX, sale 540.341.332 TRX, saldo 131 |
| Ethereum | `B/raw/*.json` (Etherscan) | 29-oct 20:10 → 30-oct 09:47 UTC | varios ficheros con exactamente 100/200/300 filas: posible truncamiento; **filtrar por contrato de token, no por símbolo** (hay USDT falso) |
| Puentes (enviado vs recibido) | `A/resultados/puentes-usdt0.json` (186 envíos, recibo en destino), `B/tron/puentes-decodificados.json`, `puentes-seguimiento.json` | 31-oct | USDT0: 183 entregados, 7.846.071 enviados, 7.843.786 recibidos, comisión 2.285; 3 sin entregar (157.220). Rango, Prefunded, 6 Bridgers y Bitcoin: sin lado destino |
| THORChain | `B/tron/thorchain-decodificado.json`, `A/resultados/thorchain-recibido.json` | 30-31 oct | lo «recibido» son totales de la dirección, no solo THORChain: no concilia limpio |
| Avalanche / Arbitrum / Polygon | `B/tron/avalanche-*.json`, `origenes-otras-cadenas.json` | | solo entradas a 0x5227; nada de lo posterior; el «ETH» de Polygon es un token falso |
| Congelados | `B/tron/tether-AddedBlackList-21h.json` (61 eventos), `tether-bloqueos-relacion-21h.json`, `tether-bloqueos-en-arbol-21h.json`, `auditoria-fuentes.json`, `docs/catalogo/csv/Bloqueos_*.csv` | 29-30 oct | **no hay fichero con importes congelados en Ethereum ni los bloqueos de Circle, XAUt, USD1, PAXG, FDUSD** (solo en prosa en `docs/INVESTIGACION-BINANCE-0x5227-2026-10-30.md`). `tether-blacklist/state/` NO guarda lista de bloqueadas |
| Exchanges / casas | `B/tron/llegadas-directas-verificadas-21h.json` (10 depósitos, 1,77 M$), `traza-post-casas*.json`, `A/resultados/exchanges.json` | | `llegadas-exchanges-21h.json` (≈200 M$) está sin depurar: NO usar como cifra |
| Saldos por billetera | `B/tron/saldos-arbol-21h.json` (2.405 filas, 30-oct 20:46 UTC), `B/eth-saldos-21h.json` | 30-oct | **no hay lectura de saldos reciente de las ~7.600 billeteras del tramo 5** |
| DeFi (JustLend, USDD, SunSwap) | `A/tramo5/*-resultado.json`, `A/tramo4/jtokens-diagnostico.json`, `retiradas-informe.json` | 2-nov | jTokens y LP: diagnóstico en marcha |
| Etiquetas | `docs/catalogo/csv/Direcciones.csv` (2.074, con fuente), `Casas_de_cambio.csv`, `etiquetas.sqlite` (1.227; baja/media confianza) | | procedencia por fila |
| Catálogo consolidado | `docs/catalogo/CATALOGO-COMPLETO-ROBO-BINANCE-2026-10-31.xlsx` + 23 CSV | corte ≈ 31-oct 10:28 UTC | desactualizado respecto a los tramos 4-5 |
| Vigilante TRON | `tron-salidas-watch/state/eventos.jsonl` (122.320 eventos) | 30-oct → 2-nov | totales de `stats` = suma bruta de saltos, no importes atribuibles |

## 2. Incoherencias entre ficheros e informes (a resolver o declarar)

1. **ETH entrante:** informes 196.138 ETH desde Binance 14/16; `raw` suma 197.539,6 (esas dos) y 214.733 en total.
2. **TRX tras el swap:** 638.190.941 (informes) frente a 638.200.929 (trazabilidad; +9.987 TRX de TCzBTk…).
3. **Tether TRON:** 61 eventos/60 direcciones en el fichero; 67/66 en catálogo e historia; congelado 3,41 M → 5,28 M USDT sin segunda lectura guardada.
4. **Depósitos «quietos»:** 518,2 M (informe completo), 398,2 M (trazabilidad), 278,2 M (historia). **Los datos muestran que los cuatro se vaciaron hacia TRBdWq el 31-oct** (01:01:15, 07:58:48, 14:50:51, 18:44:36 UTC). Los informes están atrasados.
5. **Envíos tras la foto:** 352/58,5 M$/48 destinos (historia) frente a 363/60,66 M$/51 (`trb-posfoto-envios.json`, hasta 10:28:48) y 353/58,65 M$ (`semillas.json` filtrado a 10:11:58). El catálogo omite ≈370 envíos posteriores.
6. **`lz-estado.json`** tiene una fila corrupta (`enviado`=1,15e71); la versión corregida está en `puentes-decodificados.json`.
7. **Resultados por tramo no aditivos** (nodos 25,3 → 51,1 → 100,1 M$; casas 4,15 M$ en el tramo 2 y 7.034 $ en el 5 porque unos tramos empiezan en los nodos y otros se detienen en ellos).
8. **Conservación del tramo 1:** entrada 214,26 M$ frente a salida 199,18 M$ (exceso 4,46 M$ en 102 billeteras, defecto 19,5 M$). Tramo 4: −1,1 %.
9. **Precio de ETH:** 2.253,13 $ (1.147 M$) frente a 2.359,69 $ (1.201 M$) para los mismos 508.854 ETH.

## 3. Huecos (sin datos extraídos)

- Ethereum: 294.135 ETH sin origen en `raw` (consolidaciones A–E, receptor 2 y otras 8 direcciones); sin datos de Binance 14/16 ni Binance-Cold 2.
- Arbitrum, Polygon y Avalanche: solo entradas a 0x5227; nada del recorrido posterior (≈19 M$ en Arbitrum sin leer).
- Puentes sin lado destino: Rango (25, 0,33 M$), Prefunded (3), 6 Bridgers sin texto, 1 a Bitcoin; THORChain hacia otras cadenas.
- Billeteras sin leer: tramo 1: 81 (1,11 M$ de entrada); tramo 2: 342 billeteras (32,1 M$ brutos, 10,67 M$ atribuidos).
- Tramo 5: 44,7 M$ «entra en contratos y no se ve salir»; polvo 5,6 M$; 13,29 M$ del recolector (TRX) sin evidencia.
- Precio: fijo 0,352 $/TRX; sin serie horaria de TRX ni de ETH (salvo 71 filas en `precio-trx-vs-ventas.json`).
- Swaps: hay patas descodificadas pero no un libro de cambios con precio de ejecución.
- Saldos actuales de las billeteras del recorrido: sin leer.

## 4. Orden de trabajo acordado

1. Etapa 1 (TRON): libro desde los saltos (tramos 1, 2 y 5) con capital verificado, tres balances, tabla de conciliación y control de calidad; HTML con lo que haya y el resto marcado PENDIENTE/DESCONOCIDO con su causa.
2. Etapa 2: Ethereum y puentes (conciliación enviado/recibido), congelados.
3. Etapa 3: lectura de saldos actuales de todas las billeteras y estado de congelación real (consulta a la lista negra del contrato de Tether).
4. Etapa 4: DeFi, jTokens y LP.
