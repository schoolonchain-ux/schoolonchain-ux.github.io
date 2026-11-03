# blockchain-investigator — Blockchain Intelligence Specialist (fases 1-2)

Adaptadores de **solo lectura** que leen la cadena y las fuentes documentales y guardan lo leído, con su procedencia, en un **expediente** de ChainScope. Plan completo: `docs/chainscope/PLAN-INVESTIGADOR-BLOCKCHAIN.md`.

Estado (30-oct-2026): **fases 1, 2 y 3 construidas y probadas; sin desplegar** (el ChainScope vivo no tiene la puerta del investigador hasta que se reinicie con el código nuevo, y el puente no ofrece el ejecutor hasta que se reinicie el núcleo; mientras tanto el ejecutor sale como «no disponible»). Fase 4 (pantalla «Investigaciones» de ChainScope, solo lectura) y fase 5 (informe de 18 apartados) también construidas. Faltan: revisión con Codex (6) y el caso de aceptación (7).

## Qué hay

| Módulo | Qué hace | Límite que declara |
|---|---|---|
| `src/transporte.cjs` | Única salida a internet: lista cerrada de servidores, GET/POST de consulta, registro de cada petición (sin claves) | un host fuera de la lista se rechaza antes de salir |
| `src/rpc.cjs` | JSON-RPC de solo lectura con varios proveedores y respaldo; devuelve la respuesta **cruda** con proveedor y hora UTC | nunca envía transacciones (lista cerrada de métodos) |
| `src/transaccion.cjs` | Transacción + recibo + bloque → transferencias, valor, swaps, balance neto exacto (BigInt) | las transferencias internas de ETH no están en el recibo |
| `src/swaps.cjs` | Decodifica eventos Swap de Uniswap V2/V3/V4, Balancer V2 y Curve; identificadores calculados de la firma | V4 no dice las monedas en el evento; lo no reconocido se declara «sin decodificar» |
| `src/tokens.cjs` | Identidad del token **por contrato**; «verificado» solo si está en la lista comprobada de onchain-core | un símbolo reportado por el contrato no es identidad |
| `src/contrato.cjs` | Código, proxy (EIP-1967/1167/1822/ZOS), administrador, funciones de control por selector, vistas, Sourcify, eventos de control, estado de bloqueo (`isBlackListed`/`isBlocked`) | un selector en el bytecode no prueba que la función esté activa |
| `src/fondos.cjs` | Rastreo de fondos estructurado (motor de `/ruta`): salto 1 observado, siguientes FIFO rotulado como estimación | FIFO no demuestra procedencia; se detiene en exchanges, puentes, mezcladores y contratos sin identificar |
| `src/documentos.cjs` | Lee páginas públicas de dominios autorizados (`config/dominios-documentales.json`) | fuente de terceros; no sigue redirecciones; Binance responde con un desafío anti-bot (HTTP 202) |
| `src/registrador.cjs` | Convierte lo leído en evidencias, relaciones y consultas del expediente, sin modelo de lenguaje; sube antes cada lectura cruda | las reglas las impone el almacén de ChainScope |
| `src/cliente-expediente.cjs` | Cliente de la puerta del investigador (`/servicio/investigador/v1/*`, ficha propia) | solo 127.0.0.1 |

## Agente (fase 3)

- `src/agente.cjs`: bucle de investigación. El **modelo propone** (hipótesis con lo que las confirmaría y refutaría, qué consultar, cómo se relaciona cada evidencia con cada hipótesis, veredictos); el **código decide**: valida cada parámetro, ejecuta solo herramientas de la lista cerrada (`src/herramientas.cjs`), aplica el presupuesto (consultas, tiempo, rondas, llamadas al modelo) y el almacén de ChainScope rechaza lo que incumple las reglas. Un rechazo no se esquiva: la hipótesis queda «sin resolver» con el motivo.
- Etapas: plan → rondas (ejecutar → digerir → decidir; si quedan ramas de rastreo relevantes sin seguir y hay presupuesto, profundiza un salto más) → **contraprueba obligatoria** por hipótesis → veredictos → cierre honesto (si se detiene por un límite lo anota en el expediente con lo que quedó sin hacer).
- Guarda tras cada paso (cola de trabajo en el expediente) y **se reanuda**: `--reanudar inv-xxxx` sigue donde quedó, sin repetir el plan ni duplicar lo registrado.
- Herramientas: `transaccion`, `contrato`, `bloqueo`, `eventos`, `ruta`, `etiquetas`, `chainscope` (datos guardados), `documento` (dominios autorizados), `precio` (estimación).
- `src/entorno.cjs` arma los adaptadores reales; `src/modelo.cjs` llama a la CLI de Claude (mismo modelo y aislamiento que el puente) para la línea de comandos; dentro del puente se usa su `invokeAgent`.
- Invocable desde el sistema: ejecutor `exec.blockchain-investigation` / acción `run_investigation` en `objective-engine/` (cableado en `bridge.cjs`), o por línea de comandos: `node bin/investigar.cjs --pregunta "…" [--profundidad 3 --minimo 1000000 --max-consultas 150 --rondas 5]`, `--reanudar inv-xxxx`, `--temporal` (ChainScope de pruebas).

## Informe (fase 5)

`src/informe.cjs` genera, a partir de un expediente y **sin modelo de lenguaje**, un informe de 18 apartados en **PDF + HTML + Markdown + JSON** con un manifiesto de huellas (`<nombre>.manifiesto.json`): datos del expediente · pregunta · resumen ejecutivo · conclusiones · metodología (con los **controles automáticos** realizados) · fuentes y cobertura · ficha de direcciones · cronología · movimientos directos · rutas de fondos y grafo (SVG propio) · contratos · swaps · relaciones entre entidades · hipótesis · evidencias a favor y en contra · limitaciones · referencias verificables · anexo con el origen de cada cifra (evidencia, fuente, hash y lectura original).

- Importes en enteros exactos (BigInt) con sus decimales; no se suman activos distintos; los dólares solo como estimación con su fuente.
- Marcas visuales Y de texto: HECHO EN CADENA, ESTIMACIÓN, ETIQUETA DE TERCEROS, FUENTE EXTERNA, NO COMPROBADO. Los textos del expediente se escapan y el marcador privado se elimina de los datos: un texto externo no puede disfrazar una estimación de hecho.
- Controles automáticos (se listan también los que fallan): libro íntegro, relaciones con evidencia, directas con su hash, sin duplicados, formato de hashes y direcciones, horas coherentes, cronología, totales recalculados, inferencias prudentes, veredictos conforme a las reglas y lecturas originales existentes.
- Uso: `node bin/informe.cjs inv-xxxx` (expediente de ChainScope), `--archivo expediente.json`, `--salida carpeta`, `--sin-pdf`. `bin/investigar.cjs` y el ejecutor del puente lo generan al terminar.

## Revisión independiente (fase 6)

`src/revision.cjs` (`bin/revisar.cjs`): un **segundo revisor (Codex)** comprueba el expediente contra los **datos originales** y el agente responde, hasta **10 rondas**. Es lo que permite pasar un expediente a «cerrado»: **el almacén de ChainScope no deja cerrarlo** sin una revisión aprobada sobre su contenido final (`revisionAprobadaVigente`); si el contenido cambia después de aprobar, hay que revisar otra vez.

- **Paquete de evidencia** (una carpeta por ronda en `state/revisiones/<exp>/ronda-NN/paquete`): `expediente.json`, `informe.md`, `reglas.md`, `LEEME.md` (instrucciones del revisor), `rondas-previas.json` (objeciones y respuestas anteriores) y `lecturas/` con **cada lectura cruda** (respuesta de la API, huella sha256 ya comprobada por ChainScope) + `INDICE.json` que dice qué evidencias salen de cada una. El manifiesto con las huellas de todo se guarda en el expediente.
- **Codex** se lanza como sesión **efímera, sin memoria ni configuración del usuario** (`--ignore-user-config --ephemeral`), `-s read-only`, con esquema de salida estricto. Hace falta `-c windows.sandbox="elevated"`: sin eso Windows bloquea la lectura de los archivos del paquete (comprobado el 31-oct). **Límite real:** el sandbox de solo lectura impide escribir, pero no impide leer fuera de la carpeta (comprobado: Codex pudo leer `~/.codex/config.toml`); el aislamiento de lectura es por carpeta de trabajo e instrucción, no por el sandbox.
- **El código manda sobre el revisor:** si dice «aprobado» con objeciones críticas/altas/medias, se convierte en «con objeciones»; una aprobación sin **contrastes reales** (mínimo 8 verificaciones, sobre al menos 3 archivos distintos que existan en el paquete) no se admite (se reintenta una vez y, si no, la revisión queda sin concluir). Cada salida cruda y cada manifiesto se guardan por su huella.
- **El agente responde** a cada objeción con corregida · discutida · límite reconocido, usando solo acciones de una lista cerrada (nueva consulta, vincular, reescribir un veredicto, rectificar una evidencia, dejar un límite). **Las reglas del almacén se aplican igual** (pedir «confirmada» sin evidencia sólida se rechaza); una «corregida» sin ninguna acción aplicada no cuenta. Una evidencia **no se edita** (el libro la protege): se **rectifica** aparte y queda visible junto a ella.
- **Paradas honestas:** aprobado · se agotaron las 10 rondas · desacuerdo estancado (mismas objeciones graves y ningún cambio aplicado en dos rondas seguidas) · revisor caído o sin concluir. En los casos sin aprobación el expediente sigue «pendiente de revisión» y se anota; nunca se da por revisado.
- Informe: apartado 5 «Revisión independiente» (rondas, objeciones, respuestas, rectificaciones) y el estado dice la verdad (pendiente / no aprobado / cerrado).
- Uso: botón «Pedir la revisión independiente» en ChainScope → Investigaciones, o `node bin/revisar.cjs --expediente inv-xxxx [--rondas 10 --puerto 5720 --datos <carpeta>]`. `bin/investigar.cjs` la hace al terminar la investigación (`--sin-revision` solo para pruebas). El ejecutor del puente **no** la lanza (podría tardar horas): deja el expediente «pendiente de revisión» y lo dice.
- **Retirar y segunda instancia (2-nov):** una evidencia que ya no es cierta se **RETIRA** con constancia (`retirar` en la respuesta del agente: deja de contar en las reglas y sale del cuerpo del informe, pero consta con su motivo; no si la cita una relación). Un expediente que agota las 10 rondas tiene **segunda instancia** (`bin/revisar.cjs --derivar inv-x`): copia completa con rectificaciones/retiradas heredadas como «ronda 0», cita al padre y sus objeciones; una vez por expediente y un derivado no se vuelve a derivar. El paquete de revisión lleva `expediente.json` (VISTA EFECTIVA) y `expediente-original.json` (el almacén tal cual). Si Codex no tiene cupo (límite de uso de la cuenta) se dice y NO se anota nada en el expediente; revisar **de una en una**.
- Pruebas: `test/revision.test.cjs` (11) y las del almacén en `chainscope/test/investigaciones.test.cjs`.
- **Primer caso real (31-oct, `inv-ed6af503`, 0x5227…2f8c):** Codex puso 26 objeciones en 10 rondas (6, 6, 4, 3, 2, 2, 1, 1, 1 y la aprobación) y el agente respondió 22 «corregida», 3 «límite reconocido» y 1 «sin respuesta». Resultado de fondo: la hipótesis amplia «hubo fondos congelados» (confirmada por el agente) se **sustituyó** por otra más estrecha (solo consta el estado de lista negra de esa dirección en el contrato USDT de Ethereum); la de «pasaron por Binance» y las de relación con Binance quedaron **sin resolver** (Binance 14 es el ORIGEN de las entradas, no un destino; apareció además Binance 16). Para el coste: Codex usa la sesión de ChatGPT del propietario; el gasto del modelo del agente en las respuestas no se midió en esta ejecución.
- **Lo que enseñó el primer caso (y se arregló):** (1) una rectificación que solo añade una nota **no corrige nada** si la conclusión y la clasificación siguen igual: Codex lo vio en la ronda 2; ahora una rectificación puede **reclasificar** la evidencia (`clase_efectiva`, nunca a «hecho de cadena») y las reglas del almacén y el informe cuentan con la clase efectiva, y el agente puede crear una hipótesis nueva más estrecha para sustituir una demasiado amplia; (2) el informe no mostraba en la ficha de direcciones los bloqueos que constaban solo como **eventos** (`AddedBlackList`): ahora los muestra con fecha y evidencia, diciendo que no prueban el estado actual ni el saldo congelado; (3) el límite de 10 rondas es por expediente: un defecto del propio generador del informe gastó rondas que el agente no podía resolver; si el generador falla, arréglalo antes de lanzar la revisión.

## Prueba de aceptación (fase 7)

`scripts/aceptacion-0x5227.cjs` repite SIN modelo y por una fuente independiente (recibos, bloques, código y saldos por JSON-RPC público, no Etherscan) la verificación de las relaciones directas de un expediente, el tipo y saldo actual de las receptoras y el contraste con la investigación previa hecha a mano; guarda un JSON con las lecturas crudas y su huella en `state/aceptacion/`. Resultado y valoración completa: `docs/chainscope/ACEPTACION-BLOCKCHAIN-INVESTIGATOR-0x5227.md`.

**Reparto por saldos reales (paso 3, `src/reparto.cjs`, herramienta `reparto`):** alternativa exacta a FIFO. Lee el libro completo de una dirección (Etherscan: `txlist`, `txlistinternal`, `tokentx`) y lo concilia con su saldo en el MISMO bloque (entradas − salidas − gas = saldo, al entero); declara origen único o mezcla —mirando qué había entrado antes de la primera salida—, detecta los cambios de activo por balance neto y no afirma cierre si el libro es incompleto (tope de 10.000 filas por lista) o no cuadra. Las páginas originales van al paquete de revisión. Caso real: reconstruyó los 700 M USDT en 435 M cambiados por ETH, 60 M en Aave, 175 M y 30 M llegados a billeteras bloqueadas, igual que la investigación a mano.

La prueba añadió la herramienta **`saldo`** (`src/saldo.cjs`: saldo nativo y de tokens por contrato, con la hora del bloque; antes el agente no podía saber si unos fondos SIGUEN en una dirección), corrigió el registro de las cuentas con **delegación EIP-7702** (se registraban como «sin código»), la cronología del informe (no oculta lecturas distintas de una misma transacción) y el cierre de una investigación interrumpida por un error del modelo (ahora deja una nota en el expediente y el proceso sale con código 3).

## Pruebas

```
node --test                       # 35 pruebas, sin internet ni modelo
node scripts/demo-fase2.cjs       # demostración REAL (solo lectura) en un ChainScope temporal; escribe state/demo-fase2-expediente.json
```

`state/` (cachés propias de grafo, etiquetas y contratos) no se versiona.
