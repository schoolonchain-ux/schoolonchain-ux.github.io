# Revisión independiente (ronda 3): intenta REFUTAR las correcciones de la ronda 2 y lo que quede

Sigues siendo un revisor hostil: **no apruebes, busca errores.** Tu ronda 2 está en `research/auditoria-adversarial-2026-10-31/codex/ronda-2-respuesta.md`. Acepté las 18 objeciones; el registro de decisiones está en `docs/auditoria-adversarial-2026-10-31/REVISION-CODEX-2026-10-31.md`. Regeneré todo (`armar-entregables.cjs`): auditoría `.md`, HTML revisado y Excel revisado.

Solo lectura (cálculos en memoria con `node -e`; Node en `C:\Users\Equipo\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`; sin red, sin escribir en disco).

## Qué quiero
1. **Comprueba que cada una de tus 18 objeciones de la ronda 2 está realmente corregida** en los textos actuales (A = `docs/auditoria-adversarial-2026-10-31/*.md`; H = HTML revisado sin SVG/tablas). Búsqueda exhaustiva de restos: «cota», «validó», «350 $», «1,3 M$», «demostrado», «servicio a terceros», «devuelve/vuelve», «mezclan dinero ajeno», «robusto», «casi igual», «423», «118», «4,81». Di exactamente dónde sigue algo.
2. **El Excel revisado** (`docs/articulos/CATALOGO-COMPLETO-ROBO-BINANCE-2026-10-31-REVISADO.xlsx`): no lo inspeccionaste. Ábrelo en memoria con `require('C:/EquipoIA/n8n/node_modules/@e965/xlsx')` y comprueba: que las hojas originales son idénticas en contenido a las del original congelado `docs/articulos/ORIGINAL-INTACTO/CATALOGO-COMPLETO-ROBO-BINANCE-2026-10-31.ORIGINAL.xlsx`; que las hojas «AUD …» son coherentes con la auditoría (cifras, hashes, direcciones); que no hay valores `undefined`/`NaN` o celdas desplazadas.
3. **Errores nuevos introducidos por las correcciones de la ronda 2** (cifras, contradicciones entre A y H, clases mal asignadas en O-01…O-20 de `research/auditoria-adversarial-2026-10-31/objeciones.cjs`).
4. **Algo que ni tú ni yo hayamos mirado** y que un revisor hostil encontraría: sesgos de selección, circularidad, interpretaciones alternativas de los hechos que SÍ marco como VERIFICADOS (custodia TG5iBMQ…, 183 envíos USDT0, congelaciones), y si el HTML revisado deja todavía alguna conclusión sin respaldo.
5. Si ya no encuentras objeciones materiales, dilo explícitamente («sin objeciones materiales») y enumera lo que NO pudiste comprobar; no inventes objeciones menores para rellenar.

## Formato
`R3-nn · gravedad · qué afirma (cita + archivo) · por qué está mal · cómo lo comprobaste · qué corregirías`; al final «comprobé y cuadra» y «no pude comprobar».
