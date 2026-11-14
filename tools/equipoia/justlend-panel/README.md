# justlend-panel · datos del panel «¿Puedo recuperar mi dinero de JustLend?»

Alimenta la pestaña **«Recuperar de JustLend»** de Herramientas (zona 3 · Mi cartera) de la web School On-Chain. Todo es de **solo lectura** (TronGrid sin clave, Binance público para el precio de TRX): nunca envía transacciones.

## Qué hace

`generar.cjs` une tres cosas y escribe `data/justlend-panel.json`:

1. **Lectura en vivo** (`lector.cjs`, unos 3 s): caja, deuda, reservas, depósitos, precio del oráculo, pausas y topes de los 24 mercados; dueño, implementación, oráculo, guardián de pausas y plazo del Timelock; reserva de USDT de la PSM de USDD. Respuesta vacía o con error = fallo declarado, nunca un cero.
2. **Curvas de venta por USDT en sun.io** de los 23 tokens (unos 20 s): el motor del monitor «Liquidez sun.io» (`liquidez-sunswap\`), el mismo de la investigación. «USDT obtenibles» es la cifra segura (envolvente) de la fase 6b de la investigación.
3. **Parte fija** de la investigación del 13-nov-2026 (`catalogo.json`: poderes del emisor de cada token y concentración de titulares; `base-gobierno.json`: dueños e implementaciones de referencia). La comparación de la lectura en vivo con esa referencia produce la lista `cambios` (la pestaña la enseña como alerta roja).

Se niega a escribir (código 2) si: la lectura trae fallos; hay menos de 24 mercados completos o de 23 tokens con curva; la caja declarada de un mercado difiere más de un 10 % del saldo real del token; no hay precio de TRX. Avisos (no bloquean): caja y saldo real difieren entre 1 % y 10 %; caja + deuda − reservas se desvía más de un 2 % del reclamo.

`decidir.cjs` (con `regla.js`, copia de `assets/justlend-regla.js` de la web) valida el fichero nuevo y decide si se publica: ver la cabecera del propio fichero. `Actualizar-JustLend.ps1` (en la carpeta de arriba) lo orquesta: cerrojo propio, respeta `logs\run.lock` (tarea diaria) y `logs\liquidez.lock`, copia local al día, commit con la identidad anónima de Schoolonchain, push y `Comprobar-Despliegue.ps1`. Registro: `logs\justlend.log.jsonl` (`publicado`, `desplegado`, `sin_cambios`, `omitido`, `error`, `simulacion`).

## Ficheros

| Fichero | Qué es |
| --- | --- |
| `generar.cjs` | Genera el fichero de datos (`node generar.cjs <salida.json> [--sin-venta]`). |
| `lector.cjs` | Lectura en vivo por lotes de `eth_call`. Usa el lector del monitor de sun.io. |
| `decidir.cjs`, `regla.js` | Validez y cuándo publicar. `regla.js` = misma regla del semáforo que la web. |
| `catalogo.json`, `base-gobierno.json` | Foto fija del 13-nov (se rehacen con `hacer-catalogo.cjs` y `hacer-base-gobierno.cjs`). |
| `selectores.json`, `hacer-selectores.cjs` | Selectores de las funciones de lectura (calculados una vez). |
| `mercados.json`, `tokens.json`, `b58.cjs` | Mercados de sun.io de los 23 tokens, la lista de tokens y la conversión de direcciones. |

## Si algo falla

- `error` en el registro = lectura no válida: **no** se publica y la pestaña avisa de la antigüedad (con más de 3 h todo pasa a «desconocido»). Mirar el motivo en `logs\justlend.log.jsonl`.
- Un mercado nuevo en el Comptroller aparece como «mercado nuevo sin analizar» en los avisos de gobierno; hay que investigarlo y añadirlo al catálogo (la pestaña seguirá mostrando los 24 conocidos).
- Si se cambia la regla del semáforo en `assets/justlend-regla.js`, copiarla aquí a `regla.js` y comprobar con la prueba de equivalencia (las dos implementaciones deben dar el mismo veredicto).
- Para activar la tarea horaria hace falta crearla (no está creada): mismo patrón que «School On-Chain - Liquidez SUNSwap (cada hora)», con minuto 50 y `Actualizar-JustLend.ps1`.
