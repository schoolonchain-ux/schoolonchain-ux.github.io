# S3 · El CSV de servicios (8 direcciones) frente a lo nuestro

Archivo: `datos/polytrop-binance-hack-services.csv`.

| Servicio según Polytrop | Dirección | ¿La tenemos? | Cómo la tenemos |
|---|---|---|---|
| ACROSS | `TANdmAmc5jyNEFB1gXbEBfaG7Ftj1XNUG1` | Sí | Terminal «Tron_Executor» (tipo swap) en los tramos 5 y 6; llegadas consultadas en la API de Across |
| Meson | `TKWqpzNucNNBMpfaE47F8CLhA8vzfNndH4` | **Solo en parte** | Nuestro vigilante (`tron-salidas-watch/state/eventos.jsonl`) registró 5 envíos de 10.000 USDT (3 desde `TQZV28z2…`, 1 desde `TXAQd3Bh…` y 1 desde `TUeeD8US…`) y la anotó como «contrato inteligente sin nombre». No es terminal en ningún tramo; en el tramo 6 aparece 3 veces mencionada |
| Thorchain | `TBAPnuwEht65McDbxDvDYs2XLRSSbYQMUM` | Sí | Terminal tipo «nodo» (8.831 operaciones, creada 2026-10-11) |
| Thorchain | `TH1YKH9MUuJtDmekPia4x9fZXAcpPrMv8B` | Sí | Terminal tipo nodo (8.643 operaciones) |
| Thorchain | `THPaGKe6aZkUcNht24hcscZPLwtcJAbpun` | Sí | Terminal tipo nodo (9.295 operaciones) |
| Thorchain | `TLKfB2goHRY1SykEpVbiGdsesACrkCxCeW` | Sí | Terminal tipo nodo (8.556 operaciones) |
| enforcement action | `THARr6WYmvK1Q4MamaHnSecvdo6pfw8opL` | Sí | En `research/auditoria-adversarial-2026-10-31/resultados/congelados-tron.json`; billetera del tramo 6 |
| enforcement action | `TNWyDsFm3PY41YZnFug6xLTXsC545Z7wh9` | Sí | En `congelados-tron.json` y en `docs/INFORME-COMPLETO-ROBO-BINANCE-2026-10-30.md`; billetera de los 4 tramos |

## Lo que nosotros tenemos y Polytrop no lista
- **Una quinta dirección del grupo creado el 11-oct**: `TGSNahJvAdh86aR5pdcxiep1mBWSRK3HHL` (8.344 operaciones), clasificada por nuestro sistema como nodo; no aparece en las listas de Polytrop. Que sea de Thorchain no está demostrado (la clasificación es por tener más de 5.000 operaciones y fecha de creación cercana a las otras cuatro).
- Otras direcciones nuestras tipo «nodo» (TYVWGh8…, TM8uyBj…, TZG47zh… con 42 M$, 31,7 M$ y 3,1 M$ atribuidos en el tramo 6) que no están en la lista de servicios; no sé si Polytrop las tiene bajo otro criterio.

## Diferencia de alcance en los importes
- La página de Polytrop da para «servicios alcanzados» **142 mil $ más importes sin dato** (6 transferencias). En nuestro tramo 6 hay 11,86 M$ atribuidos al puente Chainflip y 117 M$ a nodos. Son magnitudes **no comparables**: desconocemos cómo selecciona y agrega Polytrop las transferencias a servicios (la referencia a «primeras salidas» de su página corresponde a su total trazado, no a este indicador).

## Cómo se comprueba
- Presencia en cachés: `research/auditoria-adversarial-2026-10-31/tramo{3,4,5,6}/tramoN-cache.json`, claves `term` y `rec`.
- Meson: `grep TKWqpzNucN tron-salidas-watch/state/eventos.jsonl` (5 líneas).
- Etiquetas de congeladas: `resultados/congelados-tron.json`.
