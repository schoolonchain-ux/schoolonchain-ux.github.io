# Evidencia de la ampliación del 5-nov-2026 (caso Vaneck / Justin Sun)

Programas y resultados de la investigación de la energía de Binance, la proveedora `TWhDfwC8QE6pQyiYy248dNor3uphPEw5M2`, el TRX de la antigua TRON Foundation y las claves de las cuentas etiquetadas «Poloniex».
Lectura de TronGrid y TronScan, **solo lectura**. Corte: 5-nov-2026, 09:18:48 UTC. Texto: `investigacion/docs/articulos/NOTA-AMPLIACION-VANECK-SUN-2026-11-05.md` y capítulos 7 a 9 de `caso-vaneck.html`.

## Qué hay aquí
- `*.cjs`: los programas (`a…` energía y receptoras, `b…` proveedora y permisos, `c…` cuenta `TU3rMHyW…`, `d…` relaciones y matriz de confianza, `e…` cruce con el robo y registro de calidad, `f…` Foundation, `g…` claves de las casas de cambio, `h…` datos y comprobación de la web). `lib.cjs` es la biblioteca de lectura.
- Carpetas de resultados (JSON): `a0-binance/`, `a1-tef9zv/`, `a2-a4-a5/`, `a3-libro/`, `b-permisos/`, `b-proveedora/`, `d-historia/`, `d-matriz/`, `e-cruce/`, `f-fundacion/`, `g-vinculos/`, `h-publicacion/`, etc.
- `MANIFIESTO.json`: huella SHA-256 de cada programa y de cada resultado. `reproducir.ps1`: rehace todos los resultados sin internet.

## Qué NO hay aquí (y por qué)
- `raw/` (≈ 1,4 GB): la respuesta en bruto de cada llamada, con fecha y huella. Es lo que permite repetir los cálculos sin internet.
- `b-proveedora/datos/` (≈ 420 MB): las filas de la proveedora (1,8 M movimientos).
Ambas carpetas se guardan en el equipo de la investigación; no se publican por tamaño. Con ellas, `reproducir.ps1` da los mismos resultados (65 programas, 95 resultados, 0 diferencias).

## Cómo se separa lo comprobado de lo atribuido
VERIFICADO (se comprueba en la cadena) · ATRIBUCIÓN DE TERCEROS (etiquetas de TronScan, prensa) · HIPÓTESIS · DESCONOCIDO. Las relaciones entre cuentas se clasifican con una regla escrita de antemano (`d-historia/conclusion-por-pareja.json`, `d-matriz/matriz-confianza.md`); las huellas (horas, importes terminados en 999, votos) nunca suben una relación de nivel.
