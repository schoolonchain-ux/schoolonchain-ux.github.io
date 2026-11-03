# tron-salidas-watch · Vigilante de salidas de TRX

Nace el 29-oct-2026 de la investigación «Vaneck» / Justin Sun (`docs/INVESTIGACION-VANECK-SUN-TRX-2026-10-29.md`): dos cuentas sacan 438 M TRX del stake (132,7 M libres el 31-10 y 305,7 M el 03-11) y el propietario quiere saber **a dónde van** sin mirar TronScan cada hora.

Solo lee la cadena (TronGrid, con la clave del bot de la blacklist) y avisa al propietario **en el chat privado del bot @blacklistusdtbot**, usando su misma clave de Telegram solo para enviar (no toca el estado de ese bot ni compite con él: enviar mensajes no choca con la recepción). No firma ni envía transacciones. No escribe fuera de `state/`.

## Qué avisa (y qué no)

| Hecho | Aviso |
|---|---|
| La cuenta **retira al saldo** el TRX desbloqueado (`WithdrawExpireUnfreeze`) | 🔓 con el saldo libre leído en ese momento. La cadena no dice cuánto se retiró en esa operación y el aviso lo declara. |
| Empieza una **descongelación** nueva (≥ umbral) o la cancela | 🧊 / ↩️ |
| **Envía** ≥ 1 M TRX (o 1 M unidades de un token) | 📤 con el **nombre del destino** si lo conocemos y su enlace a TronScan. Si el destino es una casa de cambio, se dice que ahí termina lo visible. Si es un contrato, se dice que es un contrato. Si es una billetera nueva, **se la sigue 10 días**. |
| **Recibe** ≥ 1 M | 📥 con el nombre del origen. |
| Cambia un token por otro en la misma operación | 🔄 un solo aviso («ha cambiado 30 M USDD por 30 M USDT»). |
| Una billetera seguida **mueve** ≥ 1 M TRX | ↪️ «el TRX que salió de X ha seguido camino → HTX 4». Hasta dos saltos; en una casa de cambio se cierra el seguimiento. |
| Día del desbloqueo | 📅 recordatorio a partir de las 08:00 (hora de Madrid) con lo que sigue pendiente de retirar. Una vez por fecha. |
| TronGrid falla tres ciclos seguidos (~30 min) | ⚠️ una vez cada 6 h como mucho. Al volver, retoma donde lo dejó: el cursor solo avanza con lecturas completas. |

Si no pasa nada, **no manda nada**. Cada hecho se avisa **una sola vez** (clave única en `state/eventos.jsonl`), aunque la ventana de lectura se solape.

**Nombres de direcciones**, por este orden: directorio propio `config/conocidas.json` (las direcciones del artículo, con su fuente), etiquetas del bot de la blacklist (`tether-blacklist/state/etiquetas.sqlite`, solo lectura), lista de las 10.000 mayores cuentas de TronScan (`desbloqueos-lista.json`), etiqueta pública de TronScan en vivo (con clave, cacheada 7 días) y, si no hay nombre, comprobación de si es un contrato. Una etiqueta de casa de cambio significa «billetera operada por esa casa», no «dinero de esa casa».

**Dólares:** último cierre diario de la bóveda (`C:/EquipoIA-vault/views/trx-price-1d-binance-usd.json`), siempre con la fecha del precio al lado. Si no hay precio, no se inventa.

## Uso

```text
node src/cli.cjs activar     manda el aviso «vigilante en marcha» (prueba de entrega) y hace el primer ciclo
node src/cli.cjs ejecutar    un ciclo (lo lanza la tarea de Windows cada 10 minutos; un cerrojo evita dos a la vez)
node src/cli.cjs estado      qué vigila, hasta dónde ha leído, billeteras seguidas, últimos avisos
node src/cli.cjs probar      lee las últimas 24 h reales y muestra lo que HABRÍA avisado; no envía ni guarda nada
```

Node no está en el PATH: `C:\Users\Equipo\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`. Pruebas: desde esta carpeta, `node --test`.

**Programado:** tarea de Windows «EquipoIA - Vigilante salidas TRX», cada 10 minutos, oculta con `C:\EquipoIA\Oculto.vbs` → `Ejecutar-Vigilante.ps1` (sin solapes: cerrojo + `IgnoreNew`; si el equipo estaba apagado, recupera al volver). Cada ciclo deja una línea en `state/vigilante.log.jsonl`. Para quitarla: `Unregister-ScheduledTask -TaskName 'EquipoIA - Vigilante salidas TRX'`. Para cambiar cuentas, umbral o días de seguimiento: `config/cuentas.json` (se relee en cada ciclo).

## Ficheros de estado (`state/`, no se versiona)

- `estado.json` — hasta dónde se ha leído cada cuenta, billeteras seguidas (con nivel y plazo), caché de etiquetas de TronScan, recordatorios enviados, fallos seguidos.
- `eventos.jsonl` — solo se añade: cada hecho avisado con su clave única (evita repetir).
- `avisos.jsonl` — cada mensaje enviado (o fallido) con su `message_id`.
- `ciclos.log.jsonl` y `vigilante.log.jsonl` — una línea por ciclo (del programa y del lanzador).

## Límites declarados

- TronGrid no expone las transferencias internas de TRON: un envío hecho desde dentro de un contrato no se ve. Tampoco se siguen los tokens más allá del primer movimiento (solo el TRX se sigue entre billeteras).
- El importe de una retirada de lo descongelado no viene en la transacción: se da el saldo leído, no el importe retirado.
- Un destino «sin nombre conocido» no es una billetera «limpia» ni «nueva» con seguridad: solo que ninguna de nuestras fuentes le pone nombre.
- Los avisos salen por la clave del bot de la blacklist al chat privado del propietario; si el propietario bloquea ese bot, el aviso falla y queda anotado.
