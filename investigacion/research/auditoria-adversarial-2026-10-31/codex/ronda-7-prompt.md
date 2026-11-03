# Revisión independiente (ronda 7)

Revisor hostil: busca errores, no apruebes. Tu ronda 6 está en `research/auditoria-adversarial-2026-10-31/codex/ronda-6-respuesta.md`; acepté R6-01…R6-06 y las apliqué (decisiones en `docs/auditoria-adversarial-2026-10-31/REVISION-CODEX-2026-10-31.md`, sección «Ronda 6»). Todo regenerado. Solo lectura, cálculos en memoria, sin red. No escribas en el repositorio.

1. Comprueba que **R6-01…R6-06 están realmente cerradas**:
   - R6-01: el rastreador `traza-tramo3.cjs` (parche: relee una billetera si se descubre una llegada anterior a su ventana). Verifica con tu propio criterio, sobre `tramo3/tramo3-cache.json`, que ya no hay billeteras con llegadas conocidas (>= 3.520 $, salidas directas y `via`) anteriores a `desde - 120000`; y que la reanudación no deja billeteras sin leer ni cuenta dos veces. Mi comprobación (`auxiliares/_chequeo-ventanas.cjs`) daba 78 billeteras en la caché anterior (tú 72) y 0 en la nueva.
   - R6-02: polvo incluido (terminales+retenido 64,88 M$; con polvo 66,37 M$; entrada 58,65). Comprueba las cifras en A/H/X/figuras.
   - R6-03, R6-04 (columna «Clase» en H y hoja `AUD Tramo 3` de X), R6-05, R6-06.
2. Resultado nuevo del tramo 3 (`tramo3/tramo3-resultado.json`): 4.481 billeteras, nivel máximo 70, nodos 51,15 M$, USDD 7,51, préstamo 2,43, puente 0,19, casa 0,0035, retenido 3,60. Comprueba que `analisis-tramo3.cjs` sigue aplicando el corte T3 y no duplica aristas directas/virtuales con el crecimiento de la red; y que la subida de nodos (46,6 → 51,1) y del exceso (1,7 → 6,2 M$) se explica de forma honesta en H.
3. Busca **solo objeciones MATERIALES nuevas** (cifras mal trasladadas, contradicciones A↔H↔X↔figuras, errores de lógica en scripts, conclusiones sin respaldo). Si no hay, escribe literalmente «sin objeciones materiales» y enumera lo que no pudiste comprobar.

Formato: `R7-nn · gravedad · qué afirma (cita + archivo) · por qué está mal · cómo lo comprobaste · qué corregirías`; al final «comprobé y cuadra» y «no pude comprobar».
