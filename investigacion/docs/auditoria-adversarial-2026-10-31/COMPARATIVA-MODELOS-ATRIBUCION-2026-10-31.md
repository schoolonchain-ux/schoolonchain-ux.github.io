# Comparativa de modelos de atribución (primer tramo)

Versión del 2026-10-31. Original intacto en `docs/articulos/ORIGINAL-INTACTO/` (checksums en `SHA256SUMS.txt`). Todo lo de aquí sale de los scripts de `research/auditoria-adversarial-2026-10-31/`.

Supuestos: (1) simulación por eventos de cada billetera con inventario «manchado/limpio»; (2) FIFO consume primero lo más antiguo; LIFO lo más reciente; mezcla móvil reparte proporcionalmente en cada salida; «manchado primero» y «limpio primero» son los extremos observados, no cotas teóricas (una prioridad mixta dio 2,293 M$ en puentes frente a 2,275); (3) los cambios decodificados conservan el inventario; (4) las entradas de origen desconocido reciben la misma pureza que la billetera (hipótesis por defecto «mismaPureza»; con «limpio» los nodos bajan a 24,8–25,5 M$ según el rerun de Codex); el inventario es en dólares agregados por billetera, sin separar TRX y USDT; (5) ventana previa incompleta (O-04). Datos insuficientes para: retenido por simulación (déficit de inventario causado en parte por los filtros del simulador; desglose pendiente).

| Modelo | Nodos M$ | Préstamos M$ | Puentes M$ | USDD M$ | Sin clasificar M$ | Retenido M$ (*) | Polvo M$ | Inventario huérfano M$ |
|---|---|---|---|---|---|---|---|---|
| Publicado en el informe | 25,33 | 4,75 | 2,36 | 0,33 | — | 11,18 | — | — |
| Informe (pureza fija, reproducido) | 25,54 | 4,75 | 2,36 | 0,33 | 0,00 | 11,19 | 1,37 | — |
| FIFO | 25,46 | 4,86 | 1,61 | 0,32 | 0,18 | 16,98 | 0,90 | 4,89 |
| LIFO | 25,43 | 4,86 | 2,23 | 0,32 | 0,25 | 16,27 | 0,91 | 4,89 |
| Mezcla móvil (pool) | 25,47 | 4,84 | 1,68 | 0,32 | 0,19 | 16,90 | 0,91 | 4,89 |
| Lo manchado primero (extremo alto observado) | 25,80 | 4,87 | 2,28 | 0,32 | 0,27 | 15,83 | 0,90 | 4,89 |
| Lo limpio primero (extremo bajo observado) | 25,16 | 4,85 | 0,97 | 0,32 | 0,17 | 17,94 | 0,90 | 4,89 |

## Test de conservación del modelo del informe

- Entrada atribuida total: 214,26 M$; salida atribuida: 199,18 M$.
- Billeteras con exceso (sale más robo del que entra): 102; exceso total 4,46 M$; defecto total en otras 19,53 M$.
- Mayores: TM32EDad1ZiMob3S5Rx8VJB6dnjMjD1NTY (+1,12 M$); TANBLHyBFUH2gu9NFBKMxE9kW2fbdPxQP1 (+0,67 M$); TKdLoLkYLpVygaknB2q3YPHaoL9o3AXbce (+0,63 M$); TKBLWEB2CVk1LWdbi8SHfnF2XeUWExvpod (+0,27 M$); TJRbgAWaRUG2hb83nQsuVUC1RP1Y18dHfK (+0,21 M$); TQXm9qEL64YmGAzZoMspM8qyWPZ3tbqt6X (+0,21 M$); TWbRdu55N4Cwwu83fe8pomQaUCEoHVsrqy (+0,14 M$); TCXrtGCPAxvm6ekWWds4rZ8hJDouY7pFW3 (+0,12 M$).

## Destino por nodo (M$, modelos informe / FIFO / LIFO)

| Destino | Informe | FIFO | LIFO |
|---|---|---|---|
| usdd/AuthGemJoin5 | 0,33 | 0,32 | 0,32 |
| nodo/THPaGKe6aZkUcNht24hcscZPLwtcJAbpun | 2,23 | 2,17 | 1,98 |
| nodo/TM8uyBjRKzFtQdMC7tQLvKeeWieaFvXDyc | 12,29 | 12,30 | 12,31 |
| nodo/TBAPnuwEht65McDbxDvDYs2XLRSSbYQMUM | 2,03 | 2,16 | 2,12 |
| nodo/TGSNahJvAdh86aR5pdcxiep1mBWSRK3HHL | 2,81 | 2,80 | 2,93 |
| nodo/TLKfB2goHRY1SykEpVbiGdsesACrkCxCeW | 2,14 | 2,21 | 2,13 |
| nodo/TH1YKH9MUuJtDmekPia4x9fZXAcpPrMv8B | 2,64 | 2,44 | 2,57 |
| nodo/TZG47zhb8kcriWQ2rE719yHs1KqgzwMrvF | 0,98 | 0,98 | 0,99 |
| nodo/TX5XiRXdyz7sdFwF5mnhT1QoGCpbkncpke | 0,13 | 0,13 | 0,13 |
| puente/UsdtOFT | 2,35 | 1,60 | 2,23 |
| prestamo/CErc20Delegator | 4,75 | 4,86 | 4,86 |
| nodo/TKfz7Pu3jtxWrfHzVeozQjXsb3RfuUHGE2 | 0,17 | 0,18 | 0,16 |
| nodo/TCPPRajgXVBkR5Qvpd3RHh4xUvibhzrqSa | 0,11 | 0,10 | 0,11 |
| nodo/TMXawuHt4RoYUQ9pynNsyzqpTxxxLKZHsY | 0,00 | 0,00 | 0,00 |
| puente/BridgersSwap | 0,01 | 0,01 | 0,01 |
