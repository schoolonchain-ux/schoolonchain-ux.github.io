# Las dos vías de pureza: método, evidencia y resultados

**Regla (decisión del propietario, 3-nov-2026): las dos vías se conservan SIEMPRE, con su evidencia, su método y sus resultados. Ninguna sustituye a la otra. Un método nuevo se AÑADE como una vía más; no reemplaza ni borra lo anterior.**

## 1. Qué es la «pureza»
En el rastreo del robo, cada billetera recibe dinero de varias fuentes. La *pureza* de una billetera (de 0 a 1) es la parte de su dinero que el modelo atribuye al robo. Cuando la billetera envía dinero, se asume que sale con esa misma pureza (mezcla proporcional). La billetera de reparto `TRBdWq…` tiene pureza 1 por definición. El importe «atribuido» de cada salto es `importe × pureza del que envía`.

La pureza de una billetera `w` se calcula como un punto fijo:
`p(w) = Σ (importe de cada entrada NO neutra × p(quien la envía)) / D(w)`, limitada a 1,
repitiendo hasta que no cambie (convergencia 1e-6; el tope de vueltas es 2000 y el programa avisa si no converge).

Una entrada es **neutra** si viene de un contrato de intercambio, préstamo, puente o USDD, o de cualquier contrato. Las entradas enlazadas por «via» (un cambio cuyo resultado llega a otra billetera) se cuentan como entradas NO neutras de la billetera que las recibe, con la pureza de la billetera que depositó.

## 2. Las tres vías (solo cambia el denominador `D(w)`)
Sea `T(w)` = suma de las entradas no neutras de `w` (incluye las enlazadas por «via»).

| Vía | `D(w)` | Qué supone |
|---|---|---|
| **actual** (`PUREZA=actual`, por defecto) | `T(w)` | Lo que entra de contratos neutros es dinero propio que vuelve (devolución de un cambio): no cambia la pureza. |
| **ciclo** (`PUREZA=ciclo`) | `T(w) + sinEnlace_ciclo(w)` | Lo que entra de un contrato EN EXCESO de lo que la propia billetera le mandó, y que no está enlazado, es dinero de otros y diluye la pureza. |
| **diluida** (`PUREZA=diluida`, cota baja) | `T(w) + sinEnlace_total(w)` | Todo lo que entra de contratos y no está enlazado es dinero de otros. |

- `sinEnlace_total(w) = max(0, Σ entradas brutas de contratos neutros − Σ entradas enlazadas por «via»)`.
- `sinEnlace_ciclo(w) = max(0, Σ_c max(0, entrado_de_c − enviado_a_c) − Σ entradas enlazadas por «via»)`, donde `c` recorre cada contrato neutro y `enviado_a_c` es lo que la propia billetera mandó a ese contrato.
- Los enlaces se descuentan **por importe, no por hash**: el hash del cambio casi nunca coincide con el de la entrada bruta (19 de 1.150 cambios del tramo 6).
- Importes en dólares al precio fijo del análisis (0,352 $/TRX); el informe valora las partidas a precio de hoy.

## 3. Por qué existen dos vías
La revisión independiente del 3-nov (Claude, Sonnet 5.5, `research/polytrop-2026-11-03/codex/CORR-v03-AB-claude-respuesta.md`) y una comprobación propia localizaron que el exceso del tramo 6 (reparte el 105,6 % de lo que entra) lo causa **una billetera**, `TB7pUXywPH…`: recibe 3,20 M$ de la bóveda de Chainflip en 27 pagos y los reenvía a UsdtOFT; solo ~5 % de lo que recibe está enlazado con salidas nuestras, pero la vía actual le asigna pureza 0,999. La vía *ciclo* corrige ese caso sin tocar las idas y vueltas legítimas. La vía *diluida* es la corrección tosca: corrige de más (deja los dos tramos en el 80 % de lo que entra) y se guarda como límite inferior de la incertidumbre.

**Cuál usar** no está decidido: las cifras del informe usan la vía actual; la comparación está en la sección 17. El rango entre las dos es la incertidumbre del modelo.

## 4. Cómo se calcula y se reproduce
```
# por tramo congelado (tramo5-v03, tramo6-v03); node está en C:/Users/Equipo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe
PUREZA=actual  TRAMO_DIR=<carpeta>/ node analisis-tramoN.cjs > analisis-log.actual.txt
PUREZA=ciclo   TRAMO_DIR=<carpeta>/ node analisis-tramoN.cjs > analisis-log.ciclo.txt
PUREZA=diluida TRAMO_DIR=<carpeta>/ node analisis-tramoN.cjs > analisis-log.diluida.txt
node blockchain-investigator/scripts/conservar-dos-vias.cjs "nota"   # guarda una versión NUEVA de la evidencia y la verifica
```
Cada vía escribe sus propios ficheros: `tramoN-resultado[.ciclo|.diluida].json` y `tramoN-aristas-terminales[.ciclo|.diluida].json`. Los cálculos son deterministas: repetidos, dan el mismo resultado (se comprobó el 3-nov con las seis ejecuciones).

## 5. Evidencia que se conserva
En `pureza-dos-vias/<fecha>-vN/` (nunca se sobrescribe; si algo cambia, se crea otra versión):
- `MANIFIESTO.json`: hash (SHA-256) de cada entrada, resultado, registro y guion usados, y la nota de la versión.
- `resultados/tramoN/`: copia de los resultados y aristas de las tres vías.
- `registros/tramoN/`: salida de cada ejecución (`analisis-log.*.txt`).
- `codigo/`: copia exacta de los guiones que produjeron los resultados.
- `comparacion.json`: tabla de las vías, tramo a tramo, con las billeteras que más cambian.
- `METODO.md`: este documento.

**Entradas** (con su hash en el manifiesto): `tramoN-cache.json` (todas las entradas y salidas por billetera), `t4.json` (corte de análisis: el tramo 5 corta en la hora de lectura, 2-nov 09:23 UTC; el tramo 6, en la foto, 30-oct 22:40 UTC), `traza-clases.json`, `tramoN-alcanzadas.json`, `tramoN-escontrato.json`, `tramoN-swaps.json`, `retiradas-informe.json` y `resultados/contratos-clasificados.json`.

**Hash canónico:** los resultados llevan la hora de generación (`generado`), que cambia en cada ejecución; se ignora al comparar.

**Control de calidad nº 9 del informe:** FALLO si falta una de las dos vías en algún tramo, si un resultado vivo cambió respecto a la versión guardada o si una copia guardada no coincide con su hash; AVISO si cambió una entrada o un guion (la evidencia conserva la copia exacta); OK si todo coincide.

## 6. Resultados de la versión 1 (3-nov-2026)
Importes en M$ al precio fijo; «relación» = (destinos + retenido + polvo + sin resolver) / entrada.

| Tramo | Vía | Destinos finales | Retenido | Polvo | Sin resolver | Relación |
|---|---|---|---|---|---|---|
| 6 · antes de la foto (entrada 50,77) | actual | 43,91 | 3,44 | 1,56 | 4,70 | 105,6 % |
| | ciclo | 39,46 | 3,42 | 1,49 | 4,49 | 96,2 % |
| | diluida | 32,21 | 3,18 | 1,43 | 3,76 | 79,9 % |
| 5 · después de la foto (entrada 190,20) | actual | 160,72 | 6,08 | 5,59 | 14,46 | 98,2 % |
| | ciclo | 157,43 | 5,54 | 5,11 | 14,25 | 95,9 % |
| | diluida | 127,75 | 5,36 | 5,03 | 14,06 | 80,0 % |

`TB7pUXywPH…`: pureza 0,999 (actual) → 0,052 (ciclo) → 0,029 (diluida).

## 7. Límites (declarados)
- Ninguna vía está contrastada con una fuente externa; que haya dos es precisamente la medida de la incertidumbre del modelo.
- La vía *ciclo* deja los dos tramos ~4 % por debajo de lo que entra: es dinero que el modelo ya no puede atribuir, no dinero que se haya demostrado fuera de la cadena.
- El «enlace» por importe es una aproximación; un cambio con comisión o deslizamiento puede quedar a medias.
- El tramo 6 no sigue lo que estaba en tránsito en la foto (retenido, polvo y contratos sin salida): falta una fase hacia adelante.
- El «polvo» incluye envíos a billeteras que el modelo también sigue (≈ 0,37 M$ en el tramo 6): se cuenta como salida y además se propaga.

## 8. Cómo añadir una vía nueva
1. Añadir el modo en `analisis-tramo5.cjs` y `analisis-tramo6.cjs` (nuevo valor de `PUREZA`, nuevo sufijo de fichero) **sin cambiar el comportamiento de las vías existentes** (comprobar que sus resultados salen con el mismo hash canónico).
2. Registrar el sufijo en `VIAS` de `blockchain-investigator/src/libro-mayor/dos-vias.cjs`.
3. Ejecutar `conservar-dos-vias.cjs` con una nota que diga qué se añadió y por qué.
