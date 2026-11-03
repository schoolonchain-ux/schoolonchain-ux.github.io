**1) OBJECIONES**

Las rutas abreviadas siguientes parten de `research/polytrop-2026-11-03/` y, para los tramos, de `research/auditoria-adversarial-2026-10-31/`. Solo he leído ficheros y calculado en memoria; no he usado internet.

1. **Tipo: dato.**
   **Cita:** «21 tienen saldo mayor de 1 (TRX o USDT) hoy; la mayoría está a cero».

   Los **21** coinciden, pero «la mayoría está a cero» no está acreditado. En `datos/polytrop-tron.json` obtengo:

   - **62** filas con `trx: null`, incluidas **41** con `existe: true`.
   - **38** con algún saldo positivo registrado en TRX o USDT.
   - **0** con TRX y USDT ambos explícitamente iguales a cero.

   Cálculo con PowerShell, tras cargar el JSON en `$j`:
   ```powershell
   @($j | Where-Object {$null -eq $_.trx}).Count
   @($j | Where-Object {$_.trx -gt 0 -or $_.usdt -gt 0}).Count
   @($j | Where-Object {
     $null -ne $_.trx -and $_.trx -eq 0 -and $_.usdt -eq 0
   }).Count
   ```

   Además, el guion solo guarda TRX y USDT: no permite descartar saldos en USDD, precisamente el activo discutido. Tampoco guarda una hora de consulta que permita comprobar «hoy».

   **Corrección:** «En el fichero guardado, 21 direcciones superan 1 TRX o 1 USDT. Hay 62 saldos TRX nulos; no se han medido los saldos de USDD ni del resto de tokens».

2. **Tipo: sin evidencia.**
   **Cita:** «21 sin registro de cuenta en TronGrid».

   Hay **21 registros con `existe: false`**, pero el guion no permite equipararlos inequívocamente con cuentas inexistentes. En `guiones/polytrop-tron.cjs`, `jget()` puede devolver `null` tras fallos; después se calcula `existe: !!d`. Una respuesta fallida o sin `data[0]` termina igual que una consulta válida sin cuenta. No se conservan las respuestas originales ni los estados HTTP.

   Comprobación: lectura del guion con `Get-Content -Encoding UTF8 -Raw` y recuento:
   ```powershell
   @($j | Where-Object {-not $_.existe}).Count
   ```

   **Corrección:** «21 consultas quedaron registradas sin datos de cuenta; el fichero no distingue ausencia de cuenta de fallo de consulta».

3. **Tipo: sin evidencia.**
   **Citas:**
   - «Muestra de 16 (8 “source” y 8 “flagged”, las primeras de cada rol)».
   - «7 de las 8 “source” muestreadas reciben una cifra grande de **USDD** (130.000–231.000), 6 de `TQ27LngyGNB8emD6mt5FqjpCvZxo91EHhn` y una de `TFVLUg2…`».
   - «5 mandan después entre 50.000 y 80.000 USDD al contrato de Symbiosis […] y otras cantidades menores (300–29.000) a `TGPwgFpJc…`».
   - «Una (`TEJD5aJVN…`) reenvía todo a `TUt1VoTzz…`. La octava recibe 979.044 jUSDT y lo reenvía».
   - «`TVyY6d4Z4…`: 25.000 USDD recibidos y 24.900 enviados a Symbiosis».
   - «otras sin movimientos de tokens».

   **No he encontrado los movimientos que permiten recalcular ninguna de esas cifras.** Los dos JSON citados contienen cuentas, saldos TRX/USDT y fechas, pero no transferencias TRC20, contratos de token, importes, remitentes, destinatarios ni hashes. `datos/polytrop-muestra.json` contiene **32 muestras EVM**, ninguna TRON.

   Comprobaciones: inspección de las propiedades de los JSON con `ConvertFrom-Json`; búsqueda local mediante `Select-String` de las direcciones citadas. El guion `polytrop-tron.cjs` tampoco consulta `/transactions/trc20`.

   Puedo reconstruir qué direcciones resultarían de seleccionar las primeras ocho de cada rol. Eso no acredita que se consultaran sus movimientos ni los resultados narrados.

   **Corrección:** retirar estas cifras de «Hechos medidos» y marcarlas como **no verificables con los ficheros entregados**. Para sostenerlas hacen falta las transferencias conservadas, el contrato de cada token, sus decimales y los hashes. «Reenvía todo» y «sin movimientos» requieren además delimitar activo y periodo.

4. **Tipo: lógica.**
   **Cita:** «De esas 7, 6 llaman en el mismo minuto a `TTu9T4ff4…` […] (Solo he leído las 4 primeras transferencias de TRC20 de cada una.)».

   Una transferencia TRC20 a un contrato **no demuestra por sí sola una llamada directa de la billetera a ese contrato**. Para afirmarlo hay que comprobar la transacción y su destinatario, o su ejecución. Tampoco hay marcas temporales conservadas que permitan contrastar «en el mismo minuto».

   Comprobación: los ficheros citados no guardan destinatarios de llamadas, datos de ejecución ni las cuatro transferencias anunciadas. Las cachés `traza-clases.json` sí asocian `TTu9T4ff4zvNPz1dfAd36gUeB3xJgYz4G9` con el nombre `BWSwapRouterV1`; eso solo confirma la etiqueta local.

   **Corrección:** describir transferencias únicamente si se aportan sus registros. Reservar «llaman» para transacciones comprobadas.

5. **Tipo: lógica.**
   **Citas:** «Hipótesis […] solo comprobada en 16 de 99» y «El rastro de estas 99 empieza **donde el nuestro se detiene**: tras convertir a USDD».

   No está comprobada en 16. No se conservan los movimientos de esas 16 y, según el propio relato, una de las ocho `source` mueve **jUSDT**, no USDD. Seleccionar las primeras ocho de cada rol tampoco justifica extender el patrón a las **99**.

   Sí hay evidencia de una limitación técnica: `traza-tramo6.cjs`, líneas **64 y 83**, descarta activos distintos de TRX y USDT. Pero esa limitación no demuestra que las 99 direcciones continúen fondos del robo.

   **Corrección:** «El rastreador excluye USDD. Se plantea que algunas direcciones ausentes puedan continuar ese flujo, pero no se ha demostrado cuáles ni cuántas».

6. **Tipo: lógica.**
   **Citas:** «18,9 M$ atribuidos a `AuthGemJoin5` […] tratados como destino final» y «parte de ese USDD vuelve a salir de TRON hacia otras redes por Symbiosis».

   La primera cifra coincide con el cálculo local, pero **no demuestra la segunda afirmación**. En `tramo6/tramo6-aristas-terminales.json`, filtrando `nombre = AuthGemJoin5`, obtengo:

   - **190** transacciones distintas, de **78** remitentes.
   - **18.878.847,873370592** de suma `tainted`.
   - **20.487.880,678054009** de suma bruta `v`.
   - Las **190 entradas están denominadas en USDT**.

   Cálculo: `Where-Object nombre -eq AuthGemJoin5`, seguido de `Measure-Object tainted -Sum`, `Measure-Object v -Sum`, `Group-Object sim` y recuentos únicos de `de` y `tx`.

   Son entradas USDT y una atribución del modelo. Falta demostrar la conversión, las salidas USDD, su conexión con las 99 direcciones y la llegada a otra red. Enviar tokens a un contrato tampoco acredita por sí solo que el puente complete la operación.

   **Corrección:** conservar el importe como resultado del modelo y separar expresamente la continuación USDD y el cruce de red como **no demostrados**.

7. **Tipo: redacción.**
   **Cita:** «Las 99 direcciones TRON del CSV que no tenemos».

   El alcance de «no tenemos» queda indefinido. Las **99** coinciden con el inventario de `polytrop-cruce.json`: filas TRON sin `rastreada` ni `mencionada`. Sin embargo, al buscar literalmente todas las direcciones TRON del CSV en el texto completo de las cuatro cachés, obtengo **133 ausentes: 51 `source` y 82 `flagged`**.

   Cálculo independiente: cargar el CSV con `Import-Csv` y eliminar sucesivamente las direcciones para las que cada caché cumple `$texto.Contains($_.address)`. Las 99 están incluidas entre esas 133. **No es un error del recuento 99**, pero ambos criterios son distintos.

   Además, `polytrop-cruce.cjs` limita directorios, extensiones, profundidad y tamaño de los ficheros examinados.

   **Corrección:** «99 direcciones TRON sin coincidencias en el inventario local examinado», definiendo ese inventario. No presentarlo como ausencia universal del sistema.

**2) COMPROBADO CORRECTO**

- **99 direcciones distintas: 44 `source` y 55 `flagged`.** Todas coinciden en dirección y rol con el CSV original. Comprobado cruzando `Import-Csv` con los JSON.
- **Ninguna de esas 99 aparece literalmente en las cachés actuales de los tramos 3, 4, 5 y 6.** Resultado: **0 coincidencias en cada fichero**, mediante búsqueda sensible a mayúsculas con `.Contains()`.
- **Distribución de fechas del JSON:** 52 el 31-oct; 7 el 30-oct; 4 el 1-nov; 3 el 2-nov; 11 anteriores; 22 sin fecha. Los 11 anteriores abarcan **2021-01-27 a 2026-10-28**. Recalculado con `Group-Object creada`, filtros y ordenación.
- **22 sin fecha:** 21 con `existe: false` y **1** con `existe: true`. Coincide el registro local; queda la objeción sobre interpretar `false`.
- **21 superan 1 TRX o 1 USDT**, según los valores guardados.
- En `tramo6-cache.json`, `rec.TQ27LngyGNB8emD6mt5FqjpCvZxo91EHhn` tiene **nivel 2, 80 salidas TRX y 71 pasos `via` USDT; 0 USDD**.
- `TC4Hw3QuapZQ4heGvaik43FRNeLfuLHpAr` y `TEJD5aJVNj3xzrCYhxqPUovH1DnBhyS6ND` tienen **0 apariciones en `sal` y `via`** de ese nodo. Eso confirma su ausencia, no su condición de «hijas USDD».
- Las referencias a las líneas **4 y 56** de `traza-tramo6.cjs` son correctas: comentario de parada y clasificación `usdd`.
- **AuthGemJoin5: 18,9 M$ redondeados, 190 envíos y 78 billeteras**, con los límites explicados arriba.
- Las etiquetas locales **BWSwapRouterV1** y **MetaRouterGateway** coinciden con las direcciones abreviadas citadas en `traza-clases.json`.

**3) NO VERIFICABLE**

- **Los movimientos TRC20 de la muestra**, incluidos todos sus importes, remitentes, destinatarios y horarios: no he encontrado registros reproducibles en los ficheros examinados.
- **La identidad real de los tokens USDD y jUSDT de esa muestra:** faltan sus contratos y registros de transferencia.
- **Que las 21 cuentas no existan en TronGrid:** el resultado guardado no distingue esa situación de fallos de consulta.
- **Los saldos “hoy” y las fechas originales de creación en cadena:** puedo comprobar los valores derivados del JSON, pero no contrastarlos con respuestas originales de TronGrid.
- **La vinculación de las 99 con las conversiones de AuthGemJoin5, el importe USDD posterior y su llegada por Symbiosis a otras redes:** falta enlazar transacciones de entrada, conversión, salida y destino.
- **La identidad externa de los servicios:** las etiquetas del repositorio son comprobables; su validación externa es **no verificable por mí** sin acceso a internet.