## 1) OBJECIONES

1. **Tipo: dato.**  
   **Cita exacta:** «vio 5 envíos de 10.000 USDT cada uno desde `TQZV28z2…`».

   **Es falso que los cinco salgan de esa dirección.** En `tron-salidas-watch/state/eventos.jsonl` encuentro cinco transacciones distintas, todas de 10.000 USDT, pero con tres remitentes:

   | Remitente | Envíos | USDT |
   |---|---:|---:|
   | `TQZV28z2pZhrZTPkLCQ6LQuk5ytLqZT2ev` | 3 | 30.000 |
   | `TXAQd3BhC3RVVEyiNCd1nmf9dGDvL3M3Kq` | 1 | 10.000 |
   | `TUeeD8US99KtKbr9sUfQkXEXKTFX1Zk2Y4` | 1 | 10.000 |

   **Comprobación ejecutada en PowerShell:**
   ```powershell
   $e = @(Select-String -Path tron-salidas-watch/state/eventos.jsonl `
     -SimpleMatch TKWqpzNucNNBMpfaE47F8CLhA8vzfNndH4 |
     ForEach-Object { $_.Line | ConvertFrom-Json })
   $e | Group-Object desde
   $e.tx | Sort-Object -Unique
   ```
   Resultado: **5 hashes distintos; 50.000 USDT en total**.

   **Corrección propuesta:** «El vigilante registró cinco envíos de 10.000 USDT: tres desde `TQZV28z2…`, uno desde `TXAQd3Bh…` y otro desde `TUeeD8US…`».

2. **Tipo: sin evidencia / lógica.**  
   **Cita exacta:** «**Una quinta bóveda de Thorchain**: `TGSNahJvAdh86aR5pdcxiep1mBWSRK3HHL` (mismo grupo creado el 11-oct, 8.344 operaciones)».

   **La atribución a Thorchain no queda demostrada.** Las cachés de los tramos 3–6 contienen:
   ```json
   {"tipo":"nodo","txs":8344,"creada":1791761712000,"nombre":null}
   ```
   La fecha corresponde al **2026-10-11 23:35:12 UTC**. Eso acredita la clasificación interna y la proximidad de creación, pero no identifica al operador.

   Además, `traza-tramo6.cjs:46` clasifica como nodo una cuenta por superar `HUB=5000` operaciones. `nodos.cjs` la incluye en el «grupo 11-oct», y el informe completo la presenta dentro de ese grupo. Ninguna de esas pruebas convierte «nodo del mismo grupo temporal» en «bóveda de Thorchain». El CSV de Polytrop etiqueta las otras cuatro, pero **no contiene esta quinta dirección**.

   **Comprobación:** lectura de `term[dirección].clase` en las cuatro cachés; búsqueda con `Select-String` en los guiones y el informe; cruce exacto con ambos CSV mediante `Where-Object address -CEQ $a`.

   **Corrección propuesta:** «Una quinta dirección del grupo creado el 11-oct, clasificada por nuestro sistema como nodo, no aparece en los CSV de Polytrop. Su pertenencia a Thorchain no está demostrada».

3. **Tipo: lógica / sin evidencia.**  
   **Cita exacta:** «parece contar solo la primera llegada de cada fuente».

   **La captura no permite deducir eso para los servicios.** En `datos/polytrop-pagina-2026-11-03.md`, la expresión «first transfers out of 3848 sources» acompaña al **total trazado de 246.063.084 dólares**, no al indicador «servicios alcanzados».

   Son conceptos distintos: primera salida de una fuente y primera llegada a un servicio. Trasladar la definición de uno al otro carece de apoyo. La propia captura advierte que no se dispone de documentación del método.

   **Comprobación:** `Get-Content -Encoding UTF8` de la captura y contraste de los dos apartados. La tabla permite sumar **142.278 dólares conocidos**, pero no reconstruir la regla de selección de las seis transferencias.

   **Corrección propuesta:** «Desconocemos cómo selecciona y agrega Polytrop las transferencias a servicios. La referencia a primeras salidas corresponde al total trazado y no demuestra el criterio de este indicador».

## 2) COMPROBADO CORRECTO

- **Las ocho direcciones completas y sus etiquetas coinciden con el CSV original.** Con `Import-Csv` y `Group-Object service` obtengo **8 filas: ACROSS 1, Meson 1, Thorchain 4 y enforcement action 2**.

- **ACROSS / `TANdm…`:** aparece como terminal `Tron_Executor`, tipo `swap`, en **los tramos 5 y 6**. Hay **132 registros**, todos con estado `filled`, en `tramo5/across-llegadas.json`. El guion `blockchain-investigator/scripts/across-llegadas.cjs` vincula expresamente esa dirección con consultas a la API de Across. Esto respalda que existen resultados guardados de esas consultas.

- **Meson / `TKWqp…`:** no es clave de `term` ni de `rec` en las **cuatro cachés indicadas, tramos 3–6**. El recuento literal mediante `[regex]::Matches($raw,[regex]::Escape($a)).Count` da **3 apariciones en la caché del tramo 6**. Los cinco eventos del vigilante llevan exactamente «contrato inteligente sin nombre».

- **Los cuatro terminales etiquetados por Polytrop como Thorchain** existen como `nodo` en las cuatro cachés. Los campos `clase.txs` coinciden:
  
  | Dirección | Operaciones guardadas |
  |---|---:|
  | `TBAPn…` | 8.831 |
  | `TH1YK…` | 8.643 |
  | `THPaG…` | 9.295 |
  | `TLKfB…` | 8.556 |

  Para `TBAPn…`, convertir `clase.creada=1791761715000` con `[DateTimeOffset]::FromUnixTimeMilliseconds(...)` da **2026-10-11 23:35:15 UTC**.

- **Las dos congeladas constan en `resultados/congelados-tron.json`**, ambas con `bloqueadaHoy=true`. `THARr…` está clasificada como billetera en `rec` y `term` del **tramo 6**; `TNWy…`, en los **cuatro tramos 3–6**. Esta última también aparece en el informe completo, **línea 229**.

- **Las cuatro direcciones citadas como ausentes de la lista de servicios están ausentes.** El cruce exacto de `TGSNah…`, `TYVWGh8…`, `TM8uyBj…` y `TZG47zh…` da **0 coincidencias en servicios y 0 en direcciones**.

- **Los importes atribuidos del tramo 6 coinciden.** Recalculé `Σ(v × pureza)` sobre las aristas correspondientes de `tramo6-aristas-terminales.json`, filtrando por `tipo`, dirección o nombre:
  
  | Concepto | Resultado recalculado |
  |---|---:|
  | Chainflip | **11.860.082,83 $** |
  | Todos los nodos | **117.033.897,79 $** |
  | `TYVWGh8…` | **42.426.213,78 $** |
  | `TM8uyBj…` | **31.733.780,17 $** |
  | `TZG47zh…` | **3.120.176,79 $** |

  Coinciden con `tramo6-resultado.json` y con los redondeos de S3. **Son atribuciones del modelo**, no importes cuya procedencia económica haya quedado probada por esta suma.

- **La captura sí dice «142 mil $ más importes sin dato» y seis transferencias a servicios.** Los cinco importes conocidos suman `3.437 + 8.286 + 49.557 + 50.998 + 30.000 = 142.278 $`; Meson figura sin importe.

## 3) NO VERIFICABLE

- **La pertenencia real de las direcciones a ACROSS, Meson o Thorchain: no verificable por mi** con independencia de las etiquetas y resultados guardados. Puedo comprobar qué dicen los archivos; no autenticar esas atribuciones mediante consultas externas.

- **Que `TGSNah…` sea una bóveda de Thorchain: no verificable por mi.** La evidencia examinada acredita una clasificación como nodo y fechas próximas a las otras cuatro, no esa identidad.

- **El método de Polytrop y el criterio de sus importes: no verificable por mi.** No hay documentación metodológica aportada y los CSV no contienen los movimientos necesarios para reconstruirlo.

- **La autenticidad y vigencia de respuestas de API, conteos de operaciones y estados de congelación: no verificable por mi.** He contrastado las copias locales, sin consultar la cadena ni los servicios. La suma de atribuciones tampoco valida por sí sola las purezas utilizadas.

- La afirmación «No es terminal en ningún tramo» queda comprobada **para los tramos 3–6 indicados**; esa comprobación no justifica extenderla a cualquier otro rastreo histórico del repositorio.