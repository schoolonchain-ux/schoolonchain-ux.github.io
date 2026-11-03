**1) OBJECIONES**

1. **Tipo: dato.**  
   **Cita:** «source otras (11 Bitcoin; la de Solana aparece ya mencionada)».

   **Lo que encuentro:** está mal. En `datos/polytrop-cruce.json`, al filtrar las direcciones que no empiezan por `T` ni por `0x`, aparecen:
   
   - 11 direcciones `bc1…`: **10 sin mención y 1 mencionada**.
   - `9SkjwUs5pRRQQo5a6g4m5cciy1xLdDeFnaov24htTjdQ`: **sin mención**.

   La Bitcoin mencionada es `bc1qqjvps2qe8tva6zjev0un4qrwhv62pxghgnj9we`; figura en `tramo5/chainflip-destinos.json`, entre otros. Además, `polytrop-cruce.cjs` etiqueta como `btc` cualquier dirección que no empiece por `T` ni por `0x`. Así convierte la dirección atribuida a Solana en Bitcoin.

   **Corrección propuesta:** «source otras: 11 —10 con formato Bitcoin y 1 atribuida a Solana—». El total 11 coincide; su composición y la explicación son falsas.

2. **Tipo: dato.**  
   **Cita:** «tramo 6: 3.440 de 7.147».

   **Lo que encuentro:** no coincide con la caché disponible. En `research/auditoria-adversarial-2026-10-31/tramo6/tramo6-cache.json`, aplicando el criterio de `polytrop-inverso.cjs`:

   ```js
   const leidas = Object.entries(j.rec).filter(([a,r]) => r.ok);
   const ausentes = leidas.filter(([a]) => !csv.has(a));
   ```

   Obtengo **7.396 lecturas correctas y 3.689 direcciones ausentes del CSV**. Hay 7.397 claves en `rec`; una tiene `ok:false`. La caché declara `t = 2026-11-02T23:42:16.464Z`.

   **Corrección propuesta:** sustituir por «tramo 6: 3.689 de 7.396», identificando la versión de la caché. Si se quieren conservar las cifras antiguas, hace falta aportar la copia concreta que las produjo.

3. **Tipo: dato.**  
   **Cita:** «Billeteras creadas durante el robo que mueven millones y no están en el CSV: […] y, en el tramo 6, `TB7pUXyw…` (17,5 M$)».

   **Lo que encuentro:** `TB7pUXywPHA4UUhyVbX4U9hsBCFQm14z31` **no se creó durante el robo**. En `tramo6/traza-clases.json` tiene:

   ```js
   creada: 1781626851000
   new Date(1781626851000).toISOString()
   // 2026-06-16T16:20:51.000Z
   ```

   Las otras cuatro constan como creadas el **31 de octubre**: `TMHDa7s7…` a las 18:24:00 UTC; `TSdDWs4y…` a las 19:34:09; `TL2KtuXt…` a las 21:46:06; `TNx6cvwE…` a las 20:25:18. Eso acredita fechas posteriores al inicio del incidente, pero no que se crearan mientras se ejecutaba el robo.

   **Corrección propuesta:** «Billeteras con entradas brutas millonarias ausentes del CSV». Separar las cuatro creadas el 31 de octubre de `TB7pUXyw…`, creada en junio.

4. **Tipo: lógica.**  
   **Cita:** «Guion: `guiones/polytrop-cruce.cjs` (resultado por dirección en `datos/polytrop-cruce.json` […]).»

   **Lo que encuentro:** el guion **no reproduce actualmente el resultado guardado** porque busca menciones dentro de `research/`, incluyendo el CSV de Polytrop y los propios resultados de esta comparación. Es una comprobación circular.

   Lo ejecuté sobre una copia en memoria, sustituyendo la ruta del CSV de Descargas por la copia del repositorio y anulando `writeFileSync`. Resultado:

   | Rol | Rastreadas | Solo mencionadas | No tenemos |
   |---|---:|---:|---:|
   | source | 2.073 | **1.774** | **1** |
   | flagged | 2.789 | **430** | **0** |

   Después repetí el barrido **excluyendo `research/polytrop-2026-11-03/`**, y recuperé exactamente las cifras publicadas: 168/1.607 y 339/91. Por tanto, **la tabla sí tiene respaldo independiente**, pero el procedimiento entregado se contamina al incorporar sus propios materiales.

   **Corrección propuesta:** declarar la exclusión de los materiales de Polytrop y aplicarla en el guion. No presentar el guion actual como reproducción suficiente.

5. **Tipo: redacción.**  
   **Cita:** «**Solo mencionada**: […] su texto aparece en algún dato, informe o guion de […]» y «**No tenemos**: ninguna de las dos».

   **Lo que encuentro:** la descripción exagera el alcance de la búsqueda. `polytrop-cruce.cjs` solo examina ciertas extensiones; omite ficheros de más de 60 MB, nombres con `antes-de`, `.bak` o `.v1.`, determinados directorios y niveles profundos. Sus expresiones regulares tampoco reconocen la dirección completa atribuida a Solana. Mi repetición excluyendo los materiales de Polytrop leyó **6.919 ficheros** y omitió **14 por tamaño o nombre**, además de los otros filtros.

   También hay una diferencia entre definición y código: el guion añade `semillas.json` y busca `eth-adelante-v2.json` en los tramos **5 y 6**; S2 solo declara `rec`, `term` y Ethereum del tramo 5. Comprobé que estas ampliaciones no añaden coincidencias exclusivas con el CSV actual: **impacto numérico cero**.

   **Corrección propuesta:** «Sin coincidencia en las fuentes examinadas, bajo los filtros descritos». Enumerar los filtros y completar la definición de «rastreada». «No tenemos» no demuestra ausencia en todo EquipoIA.

6. **Tipo: redacción.**  
   **Cita:** «las receptoras de USDT congeladas por Tether (500 M, 200 M, 175 M, 30 M)».

   **Lo que encuentro:** las cuatro direcciones están ausentes del CSV y `resultados/congelados-multicadena.json` registra `bloqueadaHoy:true` para todas. Pero los paréntesis pueden hacer pasar **importes recibidos por importes congelados**. Sus saldos registrados son:

   | Dirección | Saldo USDT |
   |---|---:|
   | `0x9749292d…c762` —receptora de 500 M— | 0,0006 |
   | `0x0ddf0480…697e` —receptora de 200 M— | 0,0001 |
   | `0xaa246bf6…54a0` | 174.999.872,32762 |
   | `0xb171ca86…c8c3` | 30.000.000 |

   Los envíos originales de 500 y 200 millones también aparecen en `research/binance-0x5227-2026-10-30/raw/0x5227-transferencias-tokens-eth.json`, filtrando las receptoras y calculando `Number(value)/10**Number(tokenDecimal)`.

   **Corrección propuesta:** distinguir «direcciones bloqueadas que recibieron esos importes» de «saldo bloqueado». No sugerir que quedaron congelados 500 y 200 millones en las dos primeras.

7. **Tipo: redacción.**  
   **Cita:** «6 de las 7 billeteras vigiladas de Ethereum (solo “Consolidación E” está)».

   **Lo que encuentro:** `eth-salidas-watch/config/cuentas.json` contiene **8 cuentas vigiladas**, no 7. De esas ocho, únicamente `Consolidación E` aparece en el CSV: **7 ausentes**.

   La frase resulta correcta si se refiere exclusivamente a las **siete receptoras y consolidadoras de ETH**, excluyendo la dirección principal `0x5227…2f8c`, que también está vigilada y que S2 menciona por separado.

   **Corrección propuesta:** «6 de las 7 billeteras receptoras o consolidadoras de ETH; además, falta la dirección principal, también vigilada».

**2) COMPROBADO CORRECTO**

Recalculé los siguientes puntos contra los ficheros, sin contar las menciones introducidas por esta comparación:

- **CSV:** 7.067 filas y 7.067 direcciones distintas; **3.848 `source` y 3.219 `flagged`**.
- **Tabla principal completa:** `source` = **2.073 rastreadas, 168 mencionadas y 1.607 ausentes**; `flagged` = **2.789, 339 y 91**. Recalculé la presencia en cachés y repetí el barrido de menciones.
- **Desglose de ausentes:** `source` EVM **1.552**, TRON **44**, otras **11**; `flagged` EVM **36**, TRON **55**. La composición de «otras» necesita la corrección indicada.
- **Cruce inverso:** tramo 3, **1.746 de 4.482**; tramo 4, **4.485 de 7.572**; tramo 5, **4.723 de 7.917**. Cálculo: entradas de `rec` con `ok:true`, filtradas por ausencia del CSV. Son recuentos por tramo, con solapamientos; no deben sumarse como direcciones distintas.
- **Ausencias concretas:** `0x5227f603c1ee34ce3c06efe6477003bdfccb2f8c` no aparece. De las siete receptoras/consolidadoras de ETH, solo aparece `0x8d4b8ee62124b7ee140a51ddd07390a56f1c9e19`, denominada `Consolidación E` en la configuración.
- **Cinco arranques TRON:** contrastados con `atribucion.cjs`; faltan **TG5iB…, TPBkS… y TCzBT…**; aparecen **TSpe5… y TAk1x…**.
- **Cinco billeteras millonarias:** todas están ausentes. Sumando `rec[direccion].ent[].v` en las cachés obtengo:
  
  | Billetera | Entradas brutas calculadas |
  |---|---:|
  | `TMHDa7s7…` | 8.705.288,551768 |
  | `TSdDWs4y…` | 5.463.924,120163 |
  | `TL2KtuXt…` | 5.427.788,035341 |
  | `TNx6cvwE…` | 4.412.069,988325 |
  | `TB7pUXyw…` | 17.495.365,761347 |

  Coinciden los redondeos de **8,7 M**, **más de 4 M** y **17,5 M**. Son valores del modelo: los guiones convierten TRX usando **0,352 dólares/TRX** y USDT a valor nominal.
- **Advertencia sobre entradas brutas:** correcta. `polytrop-inverso.cjs` suma entradas por billetera; no deduplica el dinero que vuelve a circular.
- **7,55 K frente a 7,06 K:** coincide con la copia local de la página. El CSV contiene exactamente **7.067** direcciones.
- **Cambios entre tramos:** hay diferencias comprobables en los guiones; por ejemplo, el tramo 5 incorpora seguimiento de salidas virtuales de retiradas, recolectores, jTokens y relevos. La cautela de que presencia no equivale a calidad está justificada.

**3) NO VERIFICABLE**

- **La web real de Polytrop y su contenido en la fecha indicada:** **no verificable por mí** sin internet. Solo he contrastado la copia local.
- **Que el CSV sea un recorte y qué cubren las 7,55 K billeteras:** **no verificable por mí**. La diferencia de cifras permite plantearlo, pero no demuestra esa explicación.
- **Que Polytrop desconozca las direcciones ausentes:** **no verificable por mí**. La ausencia del CSV no acredita ausencia de su sistema.
- **La red efectiva de cada dirección `0x…` y la identificación como Solana de `9Skj…`:** **no verificable por mí con este CSV**, que no contiene red. He comprobado formatos y registros locales.
- **La atribución del robo y los hechos históricos de cadena como realidad externa:** **no verificable por mí de forma independiente**. Los informes, respuestas guardadas y cachés permiten comprobar coherencia documental y cálculos, no autenticar por sí solos la cadena ni la titularidad de las direcciones.