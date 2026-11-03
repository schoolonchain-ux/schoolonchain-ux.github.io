# S4 · Las 99 direcciones TRON del CSV de Polytrop sin coincidencia en lo nuestro (v2, tras la revisión de Codex)

Guion: `guiones/polytrop-tron-v2.cjs`. Respuestas de TronGrid guardadas tal cual en `datos/polytrop-tron-v2.json` (estado HTTP, cuenta, saldos de todos los tokens y las **primeras 30** transferencias o aprobaciones TRC20 de cada dirección, con hash, contrato del token, decimales, remitente, destinatario y hora). La lectura v1 (`polytrop-tron.cjs`) se descarta: no guardó los movimientos y no distinguía una cuenta inexistente de un fallo de consulta.

## Qué significa «sin coincidencia»
- 99 direcciones TRON del CSV (44 «source», 55 «flagged») que no están ni como billetera rastreada, ni como terminal, ni mencionadas en el inventario local examinado (ver S2 para los filtros). Si solo se busca el texto en las cuatro cachés de los tramos 3–6 salen 133 (51 «source» y 82 «flagged»); las 99 están entre ellas.
- Ninguna de las 99 aparece, ni siquiera como contraparte, en las cachés actuales de los tramos 3, 4, 5 y 6 (comprobado también por Codex).

## Hechos medidos (v2, leídas el 2-nov a las 23:52 UTC)
- Las 99 consultas de cuenta y las 99 de transferencias respondieron con HTTP 200 (ningún fallo de consulta).
- Fechas de creación: 52 el 31-oct-2026, 7 el 30-oct, 4 el 1-nov, 3 el 2-nov, 11 anteriores al robo (de 2021 a 2026-10-28) y 22 sin fecha (21 respondidas sin cuenta activada y 1 con cuenta pero sin fecha de creación).
- 26 tienen saldo mayor de 1 TRX o algún saldo de token; 21 no tienen cuenta activada.
- 75 tienen alguna transferencia o aprobación TRC20 en sus primeras 30 (en 7 se alcanza el tope de 30, así que su historial puede ser mayor). Tokens vistos: USDT, USDD (contrato `TXDk8mbtRbXeYuMNS83CfKPaYYT8XWv9Hz`), jUSDT, jUSDD y uno más.
- 35 tienen transferencias de USDD; 11 reciben USDD de `TQ27LngyGNB8emD6mt5FqjpCvZxo91EHhn`, que **sí está** en nuestro tramo 6 (nivel 2, con 80 salidas en TRX y 71 pasos «via» en USDT y ninguna en USDD).
- 11 le han aprobado (Approval) gastar USDD al contrato de Symbiosis (`TPuaJ6gnY…`); **ninguna** tiene en sus primeras 30 una transferencia de USDD a ese contrato. Una aprobación da permiso para gastar; el importe que muestra es el permiso concedido, no dinero movido.

## Corrección de un error mío
- En la primera redacción conté como «envíos de 50.000–80.000 USDD a Symbiosis» lo que eran aprobaciones, y como «llaman al enrutador» lo que eran aprobaciones o transferencias hacia él. Una transferencia o aprobación TRC20 no prueba por sí sola una llamada directa. Esas afirmaciones se retiran.

## Qué sí se sostiene y qué no
- Sostenido: nuestro rastreador solo sigue TRX y USDT (`traza-tramo6.cjs`, líneas 4, 56, 64 y 83) y declara terminal la conversión a USDD; en el tramo 6 hay 18,9 M$ atribuidos a `AuthGemJoin5` (190 envíos de 78 billeteras; las 190 entradas son USDT, es una atribución del modelo).
- **No demostrado**: que estas direcciones continúen ese USDD, cuáles ni cuántas, que ese USDD sea dinero del robo, ni que llegue a otra red. Para demostrarlo falta enlazar entrada, conversión, salida y destino transacción a transacción.

## Qué falta para cerrarlo
- Leer el historial completo (más de 30 movimientos) de las 7 direcciones que alcanzaron el tope y de `TQ27Lngy…`, y seguir el USDD que sale de ellas.
- Decidir si «conversión a USDD» sigue siendo parada o pasa a seguirse como un activo más.
