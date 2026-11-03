# Revisión independiente (ronda 1): intenta REFUTAR esta auditoría

Eres un revisor forense independiente. **Tu trabajo NO es aprobar, es encontrar errores.** Un informe sobre un robo a Binance (29-oct-2026, cadenas TRON y Ethereum) fue sometido a una auditoría adversarial y de ella salió una versión revisada. Quiero que intentes demostrar que la AUDITORÍA y la VERSIÓN REVISADA tienen errores, afirmaciones sin respaldo, cifras que no cuadran con los datos, explicaciones alternativas ignoradas o conclusiones excesivas. Si algo está bien, di solo «sin objeción» en una línea; no rellenes.

Trabajas en modo solo lectura: no modifiques ni crees archivos del repositorio. Puedes leer cualquier archivo y calcular con `node -e "..."` (Node: `C:\Users\Equipo\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`) sin escribir nada en disco. No hagas llamadas de red de escritura ni mueves fondos.

## Qué revisar (rutas desde C:\EquipoIA)

- Auditoría: `docs/auditoria-adversarial-2026-10-31/AUDITORIA-ADVERSARIAL-ROBO-BINANCE-2026-10-31.md` (19 objeciones O-01…O-19), `TABLA-DIFERENCIAS-2026-10-31.md`, `COMPARATIVA-MODELOS-ATRIBUCION-2026-10-31.md`, `PREGUNTAS-ABIERTAS-2026-10-31.md`.
- Informe revisado: `docs/articulos/ARTICULO-COMPLETO-ROBO-BINANCE-2026-10-31-REVISADO.html` (apartado «Revisión adversarial» y los párrafos marcados «Revisión»).
- Original intacto: `docs/articulos/ORIGINAL-INTACTO/ARTICULO-COMPLETO-ROBO-BINANCE-2026-10-31.ORIGINAL.html`.
- Scripts y resultados de la auditoría: `research/auditoria-adversarial-2026-10-31/` (`*.cjs`, `resultados/*.json`, `notas/`, `objeciones.cjs`).
- Datos originales del informe (no alterados): `research/binance-0x5227-2026-10-30/tron/` (`traza-cache.json`, `traza-post-cache.json`, `traza-clases.json`, `traza-resultado.json`, `traza-post-resultado.json`, `traza-aristas-terminales.csv`, `traza-post-aristas-terminales.csv`) y los guiones `research/binance-0x5227-2026-10-30/traza-analisis.cjs`, `traza-post-analisis.cjs`.

## Qué te interesa especialmente

1. ¿Cada cifra de la auditoría sale realmente de `resultados/*.json` o de los CSV/caché originales? Recalcula al menos: la conservación (102 billeteras, 4,46 M$), el rango de puentes por modelo (0,97–2,28 M$ vs 2,36), la tabla de casas de cambio (249 aristas, 12.500.275 $ bruto, 4.153.524 $ atribuido, sensibilidad por pureza), JustLend (118 aristas, 4.813.802 $), carteras sin leer (81 y 342; 10,67 M$ atribuidos), conciliación de TG5iBMQ… (11.028,871 TRX).
2. ¿Hay afirmaciones de la auditoría que superan lo que prueban los datos? (por ejemplo: «ya existían antes del robo», «no comparten primer fondeador», «el contrato TQqgNg13… es un enrutador genérico», «las barrederas no son depósitos de un solo cliente», «retenido validado»).
3. ¿Hay errores de unidades, de ventana temporal, de tramo, de sentido (entrada/salida), de doble conteo o de mezcla bruto/atribuido?
4. ¿La versión revisada contradice algún dato del original sin justificarlo, o deja alguna frase del original que la auditoría ya desmiente?
5. ¿Las clases VERIFICADO / ESTIMADO / HIPÓTESIS / DESCONOCIDO están bien asignadas? ¿Algo marcado VERIFICADO que en realidad es estimación o muestra?
6. ¿Falta algo importante que un revisor hostil encontraría? (interpretaciones alternativas, sesgos de selección, circularidad, otras cadenas, otros destinos.)

## Formato de respuesta

Para cada objeción tuya: `R1-nn · gravedad (alta/media/baja) · qué afirma la auditoría o el revisado (cita corta y archivo) · por qué crees que está mal o no está respaldado · cómo lo comprobaste (archivo/cálculo) · qué corregirías`. Al final, una lista de «cosas que comprobé y sí cuadran». No inventes datos: si no puedes comprobar algo, di que no pudiste.
