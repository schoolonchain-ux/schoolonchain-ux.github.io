# S2 · Cruce de las 7.067 direcciones del CSV con lo que tenemos

Guion: `guiones/polytrop-cruce.cjs` v2 (resultado por dirección en `datos/polytrop-cruce.json`; lista de las que no tenemos en `datos/polytrop-no-tenemos.json`). La v1 contaba como «mención» los propios materiales de esta comparación; la v2 los excluye (y excluye también las salidas del informe v0.2) y reproduce las cifras de abajo, que Codex recalculó de forma independiente.

## Qué significa «tenemos»
- **Rastreada**: la dirección aparece como billetera leída o como terminal en las cachés de los tramos 3, 4, 5 y 6 (`research/auditoria-adversarial-2026-10-31/tramoN/tramoN-cache.json`, claves `rec` y `term`), o en el seguimiento de Ethereum (`tramo5/eth-adelante-v2.json`, `nodos`).
- **Solo mencionada**: no está rastreada, pero su texto aparece en algún dato, informe o guion de `research/`, `blockchain-investigator/`, `docs/`, `tron-salidas-watch/`, `eth-salidas-watch/`, `chainscope/data`, `audits/`.
- **No tenemos**: ninguna de las dos, bajo estos filtros (el barrido omite ficheros de más de 60 MB, nombres con «antes-de», `.bak` o `.v1.`, carpetas de respaldo y profundidad mayor de 6; no prueba que no exista en ningún sitio de EquipoIA).

## Resultado
| Rol en el CSV | Total | Rastreadas | Solo mencionadas | No las tenemos |
|---|---|---|---|---|
| source | 3.848 | 2.073 | 168 | 1.607 |
| flagged | 3.219 | 2.789 | 339 | 91 |

De las que **no tenemos**:
| Rol / red | Cantidad |
|---|---|
| source EVM (Ethereum y similares) | 1.552 |
| source TRON | 44 |
| source otras redes: 10 Bitcoin y 1 probable Solana (`9Skj…`); la Bitcoin `bc1qqjvps2…` aparece ya mencionada en nuestros datos y no cuenta aquí | 11 |
| flagged EVM | 36 |
| flagged TRON | 55 |

## Al revés: lo nuestro que el CSV no tiene
- Nuestras billeteras rastreadas que **no** están en el CSV: tramo 3: 1.746 de 4.482; tramo 4: 4.485 de 7.572; tramo 5: 4.723 de 7.917; tramo 6: 3.440 de 7.147 en la caché que usé al principio; Codex recalcula 3.689 de 7.396 con la caché posterior (la del tramo 6 sigue cambiando mientras avanza su rastreo: las cifras del tramo 6 son de la fecha de lectura). (En el guion `polytrop-inverso.cjs`; sus «entradas en $» son sumas brutas entre saltos y **no** son dinero distinto: solo sirven para ordenar.)
- Direcciones clave nuestras que no están en el CSV: `0x5227…2f8c` (dirección principal del robo en Ethereum), 7 de las 8 cuentas vigiladas de Ethereum (solo «Consolidación E» está; la dirección principal es una de las ausentes), las cuatro direcciones que Tether bloqueó tras recibir 500 M, 200 M, 175 M y 30 M USDT (hoy dos de ellas, las de 500 M y 200 M, tienen un saldo de USDT casi nulo y las de 175 M y 30 M conservan cerca de ese importe: bloqueada no quiere decir que conserve lo recibido), 3 de las 5 billeteras TRON de arranque (`TG5iB…`, `TPBkS…`, `TCzBT…`; sí están `TSpe5…` y `TAk1x…`).
- Billeteras con entradas brutas millonarias que no están en el CSV: `TMHDa7s7…` (8,7 M$), `TSdDWs4y…`, `TL2KtuXt…`, `TNx6cvwE…` (más de 4 M$ cada una; las cuatro creadas el 31-oct, después de iniciado el incidente) y, en el tramo 6, `TB7pUXyw…` (17,5 M$, creada el 16-jun-2026, antes del robo).

## Límites de este cruce
- «Entradas brutas» repite dinero que pasa de una billetera a otra; no es el importe del robo en esa billetera.
- Que una dirección no esté en el CSV no prueba que Polytrop no la vea: el CSV podría ser un recorte (la página habla de 7,55 K «wallets under watch» y el CSV tiene 7,06 K).
- El criterio de nuestras cachés cambió entre tramos (tramo 3 y 4 son versiones previas del método); el cruce cuenta presencia, no calidad.
