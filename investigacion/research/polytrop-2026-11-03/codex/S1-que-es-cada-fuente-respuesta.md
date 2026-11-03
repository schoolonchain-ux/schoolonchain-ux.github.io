1) OBJECIONES

1. **Tipo: dato. La fecha de la foto está mal.**

   **Cita:** «3, 4, 5 = después de la foto del 29-oct, 6 = antes de la foto».

   **Comprobación:** en `research/auditoria-adversarial-2026-10-31/tramo{3,4,5,6}/tramoN-cache.json`, inspeccioné las salidas de `rec.TRBdWqHnDVSZCVGfgHdKFLQPirQcA2PRki`. Cálculo en Node: mínimo y máximo de `sal.map(x => x.at)`, convertidos con `new Date(...).toISOString()`:

   | Tramo | Primera salida | Última salida |
   |---|---|---|
   | 3 | 30-oct 22:41:09 | 31-oct 10:11:42 |
   | 4 y 5 | 30-oct 22:41:09 | 1-nov 05:33:06 |
   | 6 | 30-oct 02:19:24 | 30-oct 22:36:27 |

   `docs/INFORME-TRAZABILIDAD-TRX-ROBO-BINANCE-2026-10-31.md`, apartado «Foto», fija expresamente **30-oct, 22:40 UTC**. El tramo 6 contiene envíos del día 30: no puede describirse como anterior a una foto del 29.

   **Corrección:** «Tramos 3, 4 y 5: reparto posterior a la foto del **30-oct a las 22:40 UTC**; tramo 6: reparto anterior». Conviene decir «reparto»: las fechas clasifican los envíos de arranque, no necesariamente todos los movimientos posteriores de sus ramas.

2. **Tipo: dato. El vigilante de Ethereum tiene ocho cuentas configuradas.**

   **Cita:** «En Ethereum: siete billeteras vigiladas».

   **Comprobación:** `eth-salidas-watch/config/cuentas.json`. Cálculo:

   ```js
   JSON.parse(fs.readFileSync(f, 'utf8')).cuentas.length
   ```

   Resultado: **8**. Son los dos receptores, las consolidaciones A–E y la dirección principal `0x5227…2f8c`. Además, la última línea de `eth-salidas-watch/state/ciclos.log.jsonl`, del 2-nov a las 23:39:28 UTC, registra `"cuentas":8`.

   **Corrección:** «Ocho cuentas configuradas para vigilancia en Ethereum: siete receptoras o consolidadoras de ETH y la dirección principal del robo». El README conserva la descripción inicial de siete; la configuración y el registro de ejecución la contradicen como recuento actual.

3. **Tipo: dato. Las 584 no son todas billeteras.**

   **Cita:** «584 billeteras».

   **Comprobación:** `research/auditoria-adversarial-2026-10-31/tramo5/eth-adelante-v2.json`. Conté `Object.keys(j.nodos).length` y agrupé `Object.values(j.ficha)` por `tipo`:

   - **584 nodos**.
   - **580** clasificados como `billetera`.
   - **4** clasificados como `contrato`, guardados como terminales.

   **Corrección:** «584 direcciones alcanzadas: 580 clasificadas como billeteras y cuatro contratos terminales».

4. **Tipo: redacción. Las 113 salen de una condición concreta del modelo, no de comprobar que siguen inmóviles hoy.**

   **Cita:** «113 con saldo quieto».

   **Comprobación:** reproduje en memoria `resumenEth()` de `blockchain-investigator/src/libro-mayor/desde-symbiosis.cjs`, con los datos de los tramos 5 y 6. Resultado: **`nQuietas = 113`**.

   La condición del código exige ausencia de salidas de ETH seguidas y de tokens dentro de la ventana considerada, y un saldo atribuible calculado superior a **0,01 ETH**. No es un simple recuento de saldos positivos. Las lecturas de las billeteras en `eth-adelante-v2.json` van del **2-nov, 18:50:23 al 19:13:26 UTC**.

   **Corrección:** «113 billeteras cumplen el criterio del modelo de saldo atribuible superior a 0,01 ETH sin salidas seguidas en la ventana analizada, según las lecturas del 2-nov». La cifra coincide; la formulación original oculta sus condiciones y fecha.

5. **Tipo: sin evidencia. El pago y el registro de la API no están acreditados.**

   **Cita:** «una clave de API de pago/registro (no probada)».

   **Comprobación:** ejecuté:

   ```powershell
   Get-Content -Encoding utf8 -Raw research/polytrop-2026-11-03/datos/polytrop-pagina-2026-11-03.md
   ```

   La copia solo recoge el enlace **«Obtain API keys»**. No recoge precio, obligación de registro ni condiciones de acceso. «No probada» no respalda «de pago/registro».

   **Corrección:** «Un enlace para obtener claves de API; condiciones de acceso y funcionamiento no comprobados».

6. **Tipo: redacción. Se presentan declaraciones de Polytrop como hechos establecidos.**

   **Citas:** «marcó 3.219 direcciones […] repartidas en 9 saltos» y «Total del incidente 6.300 M$; rastreado 246,1 M$».

   **Comprobación:** la captura local contiene esas declaraciones. El CSV permite comprobar **3.219 filas `flagged`**, pero sus únicas columnas son `address,role`: no contiene saltos, importes ni tiempos con los que verificar las demás magnitudes o que el marcado fuera previo al movimiento.

   La frase atribuye expresamente a Polytrop la anticipación media mediante «asegura», pero no hace lo mismo con el marcado, los saltos y los importes.

   **Corrección:** «Polytrop declara 3.219 direcciones marcadas en nueve saltos, un total del incidente de 6.300 M$ y 246,1 M$ rastreados. El CSV confirma el número de direcciones etiquetadas; no permite validar las otras magnitudes».

2) COMPROBADO CORRECTO

- **CSV de direcciones:** recalculé **7.067 filas de datos**, **7.067 direcciones distintas**, **3.848 `source`** y **3.219 `flagged`**. Tiene exactamente dos columnas, `address,role`, y **7.068 líneas con cabecera**. Cálculo sobre el original: separar líneas, excluir cabecera, agrupar por segunda columna y contar direcciones con `Set`.
- **CSV de servicios:** recalculé **8 filas y 8 direcciones distintas** en `datos/polytrop-binance-hack-services.csv`. Son **cuatro etiquetas**, no ocho servicios distintos: Thorchain **4**, Meson **1**, ACROSS **1** y `enforcement action` **2**.
- **Nombre y URL del caso:** la copia `datos/polytrop-pagina-2026-11-03.md` recoge «Binance Hack» y `polytrop.io/scanner/incident/binance-hack`. Compruebo la correspondencia con la copia, no la web.
- **Cifras transcritas de la página:** coinciden **9 saltos**, **7,2 horas**, **23 fuentes que enviaron fondos** y **6.300.000.000 $**. El detalle de **246.063.084 $**, dividido entre un millón y redondeado a un decimal, da **246,1 M$**. También coincide la expresión «first transfers out of 3848 sources». Esto verifica la transcripción y el redondeo, no el cálculo de Polytrop.
- **`TSpe5…` y las cinco semillas:** `research/binance-0x5227-2026-10-30/traza.cjs`, constante `SEMILLAS`, contiene **cinco direcciones**, incluida `TSpe5HC3PRD2svJcr1YoGszhHk2mtkyZ8A`. El CSV la etiqueta como **`source`**; la captura la identifica como primera fuente marcada.
- **Symbiosis y Chainflip:** `blockchain-investigator/scripts/rastrear-eth-adelante.cjs` construye las semillas desde `llegadas-eth.json` y los cambios de Chainflip filtrados por `l.nuestro`. Existe el seguimiento descrito. El recuento obtenido es **584 nodos**, con la corrección de composición indicada arriba.
- **113 según el modelo:** reproducidas mediante `resumenEth(tramo5, [tramo6])`: **113**. No es una cifra inventada.
- **Vigilantes e informe con libro mayor:** existen los dos programas, sus configuraciones y registros de ciclos. Existe `blockchain-investigator/state/informe-trazabilidad/INFORME-TRAZABILIDAD-TRON.html`, que se identifica como informe con libro mayor. Las clases **VERIFICADO, ESTIMADO, HIPÓTESIS y DESCONOCIDO** están definidas en `research/auditoria-adversarial-2026-10-31/armar-entregables.cjs`. Esto acredita su existencia, no valida automáticamente cada clasificación o conciliación.

3) NO VERIFICABLE

- **Que Polytrop haya calculado correctamente nueve saltos, 7,2 horas de anticipación, 23 fuentes emisoras y los importes publicados:** **no verificable por mi**. La evidencia local es una transcripción; los CSV carecen del detalle necesario para recalcularlo.
- **La fidelidad de la transcripción respecto a la web original y su estado actual:** **no verificable por mi**, sin acceder a internet.
- **El significado metodológico de `source` y `flagged`:** **no verificable por mi**. La sección reconoce correctamente que su interpretación es una deducción. La pertenencia de `TSpe5…` a nuestras semillas no demuestra una definición general de Polytrop.
- **Que no exista documentación pública del método, y las condiciones comerciales de la API:** **no verificable por mi** con los ficheros aportados.
- **Que las 113 billeteras sigan quietas y que los vigilantes tengan cobertura completa ahora:** **no verificable por mi**. Los datos tienen fecha de corte; los últimos ciclos guardados muestran errores por límites de peticiones en ambas redes. La existencia del vigilante no prueba vigilancia completa y continua.